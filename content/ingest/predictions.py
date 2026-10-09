#!/usr/bin/env python3
"""Generate and leak-test the prediction options shown before each explanation.

The reader commits to what they think a paragraph says before our explanation
appears. That commitment is only worth collecting if the options cannot be
sorted without reading the paragraph.

Two rules shape everything here.

The generator never sees our explanation. If it did, the "roughly right" option
would be a miniature of the explanation, and a reader could skip the paragraph,
recognise our voice, and be rewarded for it. Only the authors' own paragraph
goes in.

The distractors carry the difficulty, not the content. Option shape has been
the recurring failure on this project: a set where the specific-sounding option
is always right, or where one option is vague enough to discard unread, teaches
test-taking rather than reading. So the verifier below sends the options with
NO paragraph and no notes, and anything a model can still sort is rejected.

    python predictions.py generate --slug crispr-human-cells
    python predictions.py verify   --slug crispr-human-cells
"""

from __future__ import annotations

import argparse
import json
import os
import random
import re
import sys
from collections import Counter
from pathlib import Path

try:
    import anthropic
except ImportError:  # pragma: no cover - dependency guidance, not logic
    sys.exit("pip install anthropic")

ROOT = Path(__file__).resolve().parents[2]
PAPERS = ROOT / "content" / "papers"
MODEL = "claude-opus-5"
DEFAULT_RUNS = 3

GENERATE_SYSTEM = """You write multiple-choice options for a reading exercise
aimed at sixteen-year-olds meeting a scientific paper for the first time.

You are given ONE paragraph of a paper. Write exactly three options answering
"What do you think this paragraph says?".

One option is roughly right: it captures what the paragraph actually says.
Two options are wrong, but wrong in ways a reader who skimmed this paragraph
could genuinely believe. Build them from the paragraph's own subject matter:
swap which thing causes which, change what was measured, change what the
result was, claim something the paragraph sets up but does not deliver.

Hard requirements. These matter more than elegance:

1. Every option must be a confident, concrete statement. No hedging, no
   "something about", no option that is obviously padding.
2. No option may be eliminable without reading the paragraph. If a reader
   could discard one on grounds of vagueness, length, or tone alone, it has
   failed and you must rewrite it.
3. You will be told which REGISTER the correct option must be written in:

   hedged     - qualified. "seems to", "the authors report", "suggests".
   confident  - a flat assertion of fact, no qualifiers at all.
   neutral    - plain description, neither qualified nor emphatic.

   The correct option must be in that register, and at least one WRONG option
   must be in a DIFFERENT one. If the correct answer is always the cautious or
   paper-sounding one, a reader learns to pick by tone and stops reading.

4. You will be told which LENGTH RANK the correct option must have for this
   paragraph: longest, middle, or shortest. Obey it exactly. When the correct
   option must be the shortest, a WRONG option carries the precise-sounding
   detail and the correct one is plain. This is not a stylistic preference:
   if the correct answer is reliably the most detailed, a reader learns to
   pick the detailed one and never reads the paper again.
5. All three options must be of broadly similar length. No option may be more
   than about 1.5x the length of the shortest.
6. Write for a sixteen-year-old. Plain words. No jargon that the paragraph
   itself does not introduce.

Reply with JSON only, no prose and no code fence:

{"options": [{"text": "..."}, {"text": "..."}, {"text": "..."}],
 "correct_index": 0}

correct_index is the 0-based position of the roughly-right option. Vary it."""

VERIFY_SYSTEM = """You are shown three options from a multiple-choice question
about a paragraph of a scientific paper. You have NOT been given the paragraph.

Pick the option you believe is the correct answer.

This is a test of whether the options give themselves away. If they are well
made you will have no basis to choose and should say so.

You must also say WHICH KIND of reasoning you used, because the two are
treated very differently:

  shape     - a surface property anyone could use without knowing the
              subject OR having read scientific papers before: one option was
              longer, shorter, more detailed, vaguer, more hedged, more
              absolute, or the only one that was specific.

  corpus    - you recognised which option sounded like genuine published
              prose and which sounded authored: "reads like a methods
              section", "typical of a discussion", "reads like an invented
              distractor". This needs having read many real papers.

  knowledge - you judged from what you know about the subject: the other
              options were factually wrong, biologically implausible, or
              contradicted established findings.

The three are treated very differently, so the distinction matters more than
the answer. Only `shape` describes something a sixteen-year-old who has never
read a paper could exploit. If several played a part, name whichever alone
would have been enough. If you guessed, say shape and mark confidence low.

Reply in exactly this format and nothing else:

ANSWER: <the letter>
CONFIDENCE: <high|medium|low>
BASIS_KIND: <shape|corpus|knowledge>
BASIS: <one short sentence: what made you choose, or why you could not tell>"""

ANSWER_RE = re.compile(r"^\s*ANSWER:\s*([A-Z])", re.I | re.M)
BASIS_RE = re.compile(r"^\s*BASIS:\s*(.+)$", re.I | re.M)
KIND_RE = re.compile(r"^\s*BASIS_KIND:\s*(shape|corpus|knowledge)",
                     re.I | re.M)

# Cross-check on the self-report. The model is asked which kind of
# reasoning it used, but a label is cheap and the prose is the evidence,
# so disagreements are surfaced rather than silently trusted.
CORPUS_WORDS = re.compile(
    r"(reads? like|sounds? like|typical of|authentic|genuine|real (paper|results|prose)|invented|fabricated|synthetic|distractor-?like|methods.section|discussion section|paper prose)",
    re.IGNORECASE,
)
SHAPE_WORDS = re.compile(
    r"\b(detailed|longer|longest|shortest|hedged|hedging|vague|specific|phrasing|wording|tone|reads like|sounds like|plausible-sounding|internally consistent|well.written|fabricated|invented|distractor)\b",
    re.IGNORECASE,
)
KNOWLEDGE_WORDS = re.compile(
    r"\b(biolog\w+|implausible|factual\w*|known|established|incorrect|false|chemistry|mechanis\w+|standard|literature|contradict\w*|impossible)\b",
    re.IGNORECASE,
)


def infer_kind(basis: str) -> str | None:
    """What the prose suggests, independent of the declared label.

    Corpus first: a line that says an option 'reads like a methods
    section' is corpus recognition even when it also mentions detail,
    and filing it as shape would put an unfixable item in the gate.
    """
    if CORPUS_WORDS.search(basis):
        return "corpus"
    shape = bool(SHAPE_WORDS.search(basis))
    knowledge = bool(KNOWLEDGE_WORDS.search(basis))
    if shape and not knowledge:
        return "shape"
    if knowledge and not shape:
        return "knowledge"
    return None


def load_key() -> None:
    if os.environ.get("ANTHROPIC_API_KEY"):
        return
    env = ROOT / ".env.local"
    if env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            if line.startswith("ANTHROPIC_API_KEY="):
                os.environ["ANTHROPIC_API_KEY"] = line.split("=", 1)[1].strip()
    if not os.environ.get("ANTHROPIC_API_KEY"):
        sys.exit("ANTHROPIC_API_KEY is not set, and .env.local does not carry it.")


def paragraphs(slug: str) -> list[tuple[str, str]]:
    source = json.loads((PAPERS / slug / "source.json").read_text(encoding="utf-8"))
    return [
        (p["id"], re.sub(r"<[^>]+>", "", p["text"]))
        for s in source["sections"] for p in s["paragraphs"]
    ]


# Register detection. Crude by design: it only has to be consistent enough to
# reject a batch where the correct answer is reliably the cautious one. Prose
# instructions did not survive seventeen items, so this is checked in code.
HEDGE_MARKERS = re.compile(
    r"\b(seem|seems|suggest|suggests|appear|appears|may|might|could|probably|"
    r"likely|reported|report|reports|claim|claims|thought|apparently|tends? to|"
    r"indicat\w+|roughly|about|around|some evidence|not certain|unclear)\b",
    re.IGNORECASE,
)
ABSOLUTE_MARKERS = re.compile(
    r"\b(always|never|only|none|entirely|completely|proves?|proved|definitely|"
    r"certainly|cannot|impossible|every|all|no)\b",
    re.IGNORECASE,
)


def register_of(text: str) -> str:
    """hedged, confident, or neutral — by the markers the sentence carries."""
    if HEDGE_MARKERS.search(text):
        return "hedged"
    if ABSOLUTE_MARKERS.search(text):
        return "confident"
    return "neutral"


def registers_vary(entry: dict) -> bool:
    """At least one wrong option must sit in a different register.

    Without this, all three could be hedged and the constraint on the correct
    one would mean nothing: tone would still fail to separate them, but only
    because tone had been flattened everywhere.
    """
    correct = register_of(
        next(o["text"] for o in entry["options"]
             if o["id"] == entry["correct_option_id"])
    )
    others = [
        register_of(o["text"]) for o in entry["options"]
        if o["id"] != entry["correct_option_id"]
    ]
    return any(r != correct for r in others)


def rank_of(entry: dict) -> str:
    """Where the correct option sits by length among the three."""
    lengths = sorted(len(o["text"].split()) for o in entry["options"])
    correct = len(
        next(
            o["text"]
            for o in entry["options"]
            if o["id"] == entry["correct_option_id"]
        ).split()
    )
    if correct == lengths[-1] and correct != lengths[0]:
        return "longest"
    if correct == lengths[0] and correct != lengths[-1]:
        return "shortest"
    return "middle"


def generate(
    client: anthropic.Anthropic,
    text: str,
    target_rank: str,
    target_register: str,
    attempts: int = 4,
) -> dict:
    """One set of options, with the correct one at the requested length rank.

    Asking in prose was not enough: a first pass over this paper put the
    correct option at the longest of the three in sixteen of seventeen sets,
    which is a rule a reader could exploit without opening the paper. So the
    rank is checked here and a reply that misses it is sent back.

    Retrying also covers malformed replies — four options, an index out of
    range — which are a reply-shape problem rather than a reason to discard
    the other sixteen paragraphs.
    """
    messages: list[dict] = [
        {
            "role": "user",
            "content": (
                f"REGISTER FOR THE CORRECT OPTION: {target_register}\n"
                f"LENGTH RANK FOR THE CORRECT OPTION: {target_rank}\n\n"
                f"PARAGRAPH\n{text}"
            ),
        }
    ]
    last = ""

    for attempt in range(attempts):
        response = client.messages.create(
            model=MODEL,
            max_tokens=2000,
            system=GENERATE_SYSTEM,
            messages=messages,
        )
        raw = "".join(b.text for b in response.content if b.type == "text").strip()
        raw = re.sub(r"^```(?:json)?|```$", "", raw, flags=re.M).strip()

        try:
            data = json.loads(raw)
            options = [o["text"].strip() for o in data["options"]]
            if len(options) != 3:
                raise ValueError(f"expected exactly 3 options, got {len(options)}")
            index = int(data["correct_index"])
            if not 0 <= index < 3:
                raise ValueError(f"correct_index {index} is out of range")
        except (json.JSONDecodeError, KeyError, ValueError, TypeError) as err:
            last = str(err)
            if attempt == attempts - 1:
                raise ValueError(f"after {attempts} attempts: {last}") from err
            messages = messages[:1] + [
                {"role": "assistant", "content": raw},
                {"role": "user", "content":
                 f"That reply was rejected: {last}. Reply again with JSON only, "
                 f"exactly three options and a correct_index of 0, 1 or 2."},
            ]
            continue

        entry = {
            "options": [{"id": f"o{i + 1}", "text": t} for i, t in enumerate(options)],
            "correct_option_id": f"o{index + 1}",
        }

        got = rank_of(entry)
        got_reg = register_of(
            next(o["text"] for o in entry["options"]
                 if o["id"] == entry["correct_option_id"])
        )
        varied = registers_vary(entry)
        if got == target_rank and got_reg == target_register and varied:
            return entry

        # "middle" is the hardest target to hit exactly, and a miss on one
        # paragraph is not worth discarding the paragraph for. Keep the best
        # attempt, mark it, and let the summary report the real distribution:
        # what matters is that no single rank predicts the answer, not that
        # every paragraph hit its assigned one.
        best = entry
        problems = []
        if got != target_rank:
            problems.append(f"length {got}, wanted {target_rank}")
        if got_reg != target_register:
            problems.append(f"register {got_reg}, wanted {target_register}")
        if not varied:
            problems.append("all three options share one register")
        last = "; ".join(problems)
        if attempt == attempts - 1:
            best["rank_missed"] = last
            return best
        messages = messages[:1] + [
            {"role": "assistant", "content": raw},
            {"role": "user", "content":
             f"Rejected: {last}. Rewrite all three so the CORRECT option is "
             f"the {target_rank} of the three by word count AND written in "
             f"the {target_register} register, with at least one wrong "
             f"option in a different register. Keep every option concrete "
             f"and believable. JSON only."},
        ]

    raise ValueError(last)


def shape_report(entry: dict) -> dict:
    """Length statistics, to catch the giveaway the model is worst at avoiding."""
    lengths = {o["id"]: len(o["text"].split()) for o in entry["options"]}
    correct = lengths[entry["correct_option_id"]]
    longest = max(lengths.values())
    shortest = min(lengths.values())
    return {
        "correct_words": correct,
        "spread": round(longest / shortest, 2) if shortest else 0,
        "correct_is_longest": correct == longest,
        "correct_is_shortest": correct == shortest,
    }


def cmd_generate(args: argparse.Namespace) -> int:
    load_key()
    client = anthropic.Anthropic()
    out_path = PAPERS / args.slug / "predictions.json"
    items = paragraphs(args.slug)

    # Cycled rather than random, so the three shapes come out evenly across
    # the paper and no single rank is a reliable bet for the reader.
    RANKS = ["longest", "middle", "shortest"]
    REGISTERS = ["hedged", "confident", "neutral"]

    print(f"  {len(items)} paragraphs, generating from the paper text only")
    print("  correct-option length rank is cycled and enforced\n")
    predictions: dict[str, dict] = {}
    for i, (pid, text) in enumerate(items, 1):
        target = RANKS[(i - 1) % len(RANKS)]
        register = REGISTERS[(i - 1 + (i - 1) // 3) % len(REGISTERS)]
        entry = generate(client, text, target, register)
        predictions[pid] = entry
        shape = shape_report(entry)
        flag = "" if shape["spread"] <= 1.5 else f"SPREAD {shape['spread']}"
        correct_text = next(
            o["text"] for o in entry["options"]
            if o["id"] == entry["correct_option_id"]
        )
        print(f"  [{i}/{len(items)}] {pid.split('-', 1)[1]:<8} "
              f"{shape['correct_words']:>3}w  rank={rank_of(entry):<8} "
              f"reg={register_of(correct_text):<9} {flag}")

    out_path.write_text(
        json.dumps(
            {"slug": args.slug, "prompt": "What do you think this paragraph says?",
             "predictions": predictions},
            indent=2, ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    positions = Counter(e["correct_option_id"] for e in predictions.values())
    ranks = Counter(rank_of(e) for e in predictions.values())
    regs = Counter(
        register_of(
            next(o["text"] for o in e["options"]
                 if o["id"] == e["correct_option_id"])
        )
        for e in predictions.values()
    )
    print(f"\n  correct-answer positions: {dict(sorted(positions.items()))}")
    print(f"  correct-option length rank: {dict(sorted(ranks.items()))}")
    print(f"  correct-option register:    {dict(sorted(regs.items()))}")
    print("  (positions are reshuffled per session at render; rank and")
    print("   register are what a reader could otherwise learn to exploit)")
    print(f"  wrote {out_path}")
    return 0


def ask_blind(client: anthropic.Anthropic, entry: dict, seed: int) -> dict:
    options = list(entry["options"])
    random.Random(seed).shuffle(options)
    letters = [chr(ord("A") + i) for i in range(len(options))]
    correct = next(
        l for l, o in zip(letters, options) if o["id"] == entry["correct_option_id"]
    )
    rendered = "\n".join(f"{l}. {o['text']}" for l, o in zip(letters, options))

    response = client.messages.create(
        model=MODEL,
        max_tokens=1000,
        system=VERIFY_SYSTEM,
        messages=[{"role": "user", "content":
                   f"QUESTION\nWhat do you think this paragraph says?\n\n{rendered}"}],
    )
    text = "".join(b.text for b in response.content if b.type == "text")
    answer = ANSWER_RE.search(text)
    basis = BASIS_RE.search(text)
    kind = KIND_RE.search(text)
    given = answer.group(1).upper() if answer else "?"
    basis_text = basis.group(1).strip() if basis else text.strip()[:90]
    declared = kind.group(1).lower() if kind else None
    return {
        "correct": given == correct,
        "basis": basis_text,
        "kind": (
            "corpus" if CORPUS_WORDS.search(basis_text)
            else declared or infer_kind(basis_text) or "shape"
        ),
        "declared": declared,
        "inferred": infer_kind(basis_text),
    }


def cmd_verify(args: argparse.Namespace) -> int:
    load_key()
    client = anthropic.Anthropic()
    path = PAPERS / args.slug / "predictions.json"
    doc = json.loads(path.read_text(encoding="utf-8"))
    predictions = doc["predictions"]

    print(f"  {len(predictions)} sets, {args.runs} blind runs each "
          f"({len(predictions) * args.runs} calls)")
    print("  no paragraph, no notes — only the options\n")

    rows = []
    majority = args.runs // 2 + 1
    for i, (pid, entry) in enumerate(predictions.items(), 1):
        attempts = [ask_blind(client, entry, 300 + s) for s in range(args.runs)]
        hits = sum(1 for a in attempts if a["correct"])
        sortable = hits >= majority
        # Which kind of reasoning carried the correct runs. Only shape is
        # actionable; knowledge is a confound of testing with a model.
        kinds = [a["kind"] for a in attempts if a["correct"]]
        kind = Counter(kinds).most_common(1)[0][0] if kinds else "none"
        shape_leak = sortable and kind == "shape"
        rows.append({
            "id": pid, "hits": hits, "sortable": sortable, "kind": kind,
            "shape_leak": shape_leak,
            "basis": next((a["basis"] for a in attempts if a["correct"]),
                          attempts[0]["basis"]),
            "mislabelled": [
                a["basis"] for a in attempts
                if a["declared"] and a["inferred"]
                and a["declared"] != a["inferred"]
            ],
        })
        mark = (
            "SHAPE LEAK" if shape_leak
            else "knowledge" if sortable
            else "ok"
        )
        print(f"  [{i}/{len(predictions)}] {pid.split('-', 1)[1]:<8} "
              f"{hits}/{args.runs} {mark}")

    shape = [r for r in rows if r["shape_leak"]]
    corpus = [r for r in rows if r["sortable"] and r["kind"] == "corpus"]
    knowledge = [
        r for r in rows if r["sortable"] and r["kind"] == "knowledge"
    ]
    clean = [r for r in rows if not r["sortable"]]

    print(f"\n  THE GATE: {len(shape)} of {len(rows)} shape leaks")
    if shape:
        print("  These are ours. The options give themselves away by how")
        print("  they are written, and a reader will learn that too.\n")
        for r in shape:
            print(f"    {r['id'].split('-', 1)[1]}: {r['basis']}")
    else:
        print("  No set could be sorted by shape or register. Gate passed.")

    print(f"\n  NOT THE GATE: {len(corpus)} corpus recognition")
    print("  The tester has read thousands of papers and can hear which\n"
          "  option was authored. A reader meeting their first paper\n"
          "  cannot. Recorded, not actionable.")
    if corpus:
        print()
        for r in corpus:
            print(f"    {r['id'].split('-', 1)[1]}: {r['basis']}")

    print(f"\n  NOT THE GATE: {len(knowledge)} domain-knowledge detections")
    print("  A distractor has to be false to be a distractor, and a\n"
          "  sixteen-year-old cannot spot that. Recorded, not actionable.")
    if knowledge:
        print()
        for r in knowledge:
            print(f"    {r['id'].split('-', 1)[1]}: {r['basis']}")

    print(f"\n  UNSORTABLE: {len(clean)}")

    disagreed = [r for r in rows if r["mislabelled"]]
    if disagreed:
        print(f"\n  LABEL CROSS-CHECK: {len(disagreed)} sets where the model's")
        print("  declared BASIS_KIND disagreed with its own prose. Read these.")
        for r in disagreed:
            print(f"    {r['id'].split('-', 1)[1]}: {r['mislabelled'][0]}")

    path.with_name("predictions-verification.json").write_text(
        json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)

    g = sub.add_parser("generate", help="write predictions.json from the paper text")
    g.add_argument("--slug", default="crispr-human-cells")
    g.set_defaults(func=cmd_generate)

    v = sub.add_parser("verify", help="can the options be sorted without the paper?")
    v.add_argument("--slug", default="crispr-human-cells")
    v.add_argument("--runs", type=int, default=DEFAULT_RUNS)
    v.set_defaults(func=cmd_verify)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
