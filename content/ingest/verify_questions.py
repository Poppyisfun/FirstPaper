#!/usr/bin/env python3
"""Check whether the comprehension questions can be answered without the paper.

A reader who skipped the original text and read only our explanations must not
be able to pass the check round. If they can, the paper is decorative and this
is a summariser with a quiz attached.

The test is behavioural, not textual. An earlier version compared strings and
was fooled by paraphrase: the explanation said "6 to 8 percent" where the paper
said "6-8%", and a substring check called that withheld. So instead of asking
whether particular words appear, this asks the model to actually answer the
question from the explanations alone, and sees whether it can.

Two arms per question. The first sends the explanations only; the second sends
nothing at all. The control matters because a model that already knows this
paper will answer correctly from the notes whether or not the notes contain the
answer, and its self-reported BASIS line will not reliably admit it. So a
question counts as too easy only when the notes answer it AND nothing does not.
Anything answerable from nothing has to be rewritten to turn on a detail
specific to this paper rather than on general CRISPR knowledge.

The paper text is never included in either arm, and there is an assertion below
that stops the run if it ever leaks in.

    python verify_questions.py
    python verify_questions.py --questions draft.json --runs 3
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

# A question is too easy if the model gets it right on a majority of runs.
# One sample is noise; three gives a majority without costing much.
DEFAULT_RUNS = 3

SYSTEM = """You are taking a reading comprehension test.

You have been given study notes about a scientific paper. You have NOT been
given the paper itself.

Answer the multiple-choice question using only the notes. If the notes do not
contain what you need, say so rather than guessing from background knowledge:
answering from what you already know about the topic defeats the purpose of
this test.

Reply in exactly this format and nothing else:

ANSWER: <the letter>
CONFIDENCE: <high|medium|low>
BASIS: <one short sentence: which part of the notes you used, or what was missing>

Use CONFIDENCE: low and say what was missing if the notes do not settle it."""

# The control arm. No notes at all, so a correct answer can only come from what
# the model already knows about this paper. Those runs tell us nothing about
# whether our explanations give the answer away, and the question itself needs
# rewriting to turn on something specific to this paper.
SYSTEM_CONTROL = """You are taking a multiple-choice test about a scientific
paper. You have not been given the paper or any notes about it.

Answer from whatever you know. If you cannot tell, pick the option you think
most likely and mark your confidence low.

Reply in exactly this format and nothing else:

ANSWER: <the letter>
CONFIDENCE: <high|medium|low>
BASIS: <one short sentence: what you based it on>"""

ANSWER_RE = re.compile(r"^\s*ANSWER:\s*([A-Z])", re.I | re.M)
CONF_RE = re.compile(r"^\s*CONFIDENCE:\s*(high|medium|low)", re.I | re.M)
BASIS_RE = re.compile(r"^\s*BASIS:\s*(.+)$", re.I | re.M)


def load_notes(slug: str) -> str:
    """The thinned reader-level explanations, in reading order. Nothing else."""
    source = json.loads((PAPERS / slug / "source.json").read_text(encoding="utf-8"))
    explanations = json.loads(
        (PAPERS / slug / "explanations.json").read_text(encoding="utf-8")
    )

    lines = []
    for section in source["sections"]:
        for paragraph in section["paragraphs"]:
            entry = explanations.get(paragraph["id"])
            if entry and entry.get("reader"):
                lines.append(f"- {entry['reader']}")

    return "\n".join(lines)


def assert_no_paper_text(notes: str, slug: str) -> None:
    """Stops the run if any of the authors' sentences reached the prompt.

    The whole test depends on the model not seeing the paper. A regression that
    silently included it would make every question look unanswerable, which is
    the failure mode that flatters us most.
    """
    source = json.loads((PAPERS / slug / "source.json").read_text(encoding="utf-8"))
    haystack = " ".join(notes.split()).lower()

    for section in source["sections"]:
        for paragraph in section["paragraphs"]:
            words = paragraph["text"].split()
            # A distinctive twelve-word run from the middle of the paragraph.
            if len(words) < 12:
                continue
            middle = words[len(words) // 2 : len(words) // 2 + 12]
            probe = " ".join(middle).lower()
            probe = re.sub(r"<[^>]+>", "", probe)
            probe = " ".join(probe.split())
            if probe and probe in haystack:
                sys.exit(
                    f"ABORT: paper text leaked into the prompt via {paragraph['id']}\n"
                    f"  {probe[:80]}..."
                )


def ask(
    client: anthropic.Anthropic,
    notes: str | None,
    question: dict,
    shuffle_seed: int,
) -> dict:
    """One attempt. Options are shuffled so position cannot be learned.

    notes=None is the control arm: the question and options with nothing else.
    A model that answers correctly from nothing is answering from its own
    knowledge of this paper, so its run with the notes proves nothing either
    way. The self-reported BASIS line cannot be trusted for this, because a
    model drawing on training does not reliably say so.
    """
    options = list(question["options"])
    random.Random(shuffle_seed).shuffle(options)
    letters = [chr(ord("A") + i) for i in range(len(options))]
    correct_letter = next(
        letter
        for letter, option in zip(letters, options)
        if option["id"] == question["correct_option_id"]
    )

    rendered = "\n".join(
        f"{letter}. {option['text']}" for letter, option in zip(letters, options)
    )
    if notes is None:
        prompt = f"QUESTION\n{question['prompt']}\n\n{rendered}"
    else:
        prompt = (
            f"STUDY NOTES\n{notes}\n\n"
            f"QUESTION\n{question['prompt']}\n\n{rendered}"
        )

    response = client.messages.create(
        model=MODEL,
        max_tokens=2000,
        system=SYSTEM_CONTROL if notes is None else SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    )

    text = "".join(
        block.text for block in response.content if block.type == "text"
    )
    answer = ANSWER_RE.search(text)
    confidence = CONF_RE.search(text)
    basis = BASIS_RE.search(text)

    given = answer.group(1).upper() if answer else "?"
    return {
        "correct": given == correct_letter,
        "given": given,
        "expected": correct_letter,
        "confidence": confidence.group(1).lower() if confidence else "unparsed",
        "basis": basis.group(1).strip() if basis else text.strip()[:90],
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Two arms per question. One sends only the explanations; the other "
            "sends nothing at all. A question earns its place when the notes "
            "do not answer it and neither does the model's own knowledge."
        )
    )
    parser.add_argument("--slug", default="crispr-human-cells")
    parser.add_argument(
        "--questions",
        type=Path,
        default=None,
        help="questions JSON (default: the paper's questions.json)",
    )
    parser.add_argument(
        "--runs", type=int, default=DEFAULT_RUNS, help=f"default {DEFAULT_RUNS}"
    )
    args = parser.parse_args()

    if not os.environ.get("ANTHROPIC_API_KEY"):
        env = ROOT / ".env.local"
        if env.exists():
            for line in env.read_text(encoding="utf-8").splitlines():
                if line.startswith("ANTHROPIC_API_KEY="):
                    os.environ["ANTHROPIC_API_KEY"] = line.split("=", 1)[1].strip()
    if not os.environ.get("ANTHROPIC_API_KEY"):
        sys.exit("ANTHROPIC_API_KEY is not set, and .env.local does not carry it.")

    path = args.questions or (PAPERS / args.slug / "questions.json")
    doc = json.loads(path.read_text(encoding="utf-8"))
    # Both rounds. The check round is what the design constraint is about,
    # but an appraisal question the notes answer is just as dead, and the
    # control arm is the only way to tell that apart from one the model
    # simply knows already.
    questions = []
    for section in ("comprehension", "appraisal"):
        for question in doc.get(section, []):
            questions.append({**question, "section": section})

    notes = load_notes(args.slug)
    assert_no_paper_text(notes, args.slug)
    print(f"  notes: {len(notes.split())} words of explanation, no paper text")
    print(f"  model: {MODEL}, {args.runs} runs per arm, two arms per question")
    print(f"  calls: {len(questions) * args.runs * 2}\n")

    client = anthropic.Anthropic()
    rows = []

    for i, question in enumerate(questions, 1):
        from_notes = [
            ask(client, notes, question, seed) for seed in range(args.runs)
        ]
        # Different seeds for the control, so the two arms do not see the same
        # option order and agree for that reason rather than on the merits.
        from_nothing = [
            ask(client, None, question, 100 + seed) for seed in range(args.runs)
        ]

        notes_hits = sum(1 for a in from_notes if a["correct"])
        blind_hits = sum(1 for a in from_nothing if a["correct"])

        majority = args.runs // 2 + 1
        answerable_from_notes = notes_hits >= majority
        answerable_from_nothing = blind_hits >= majority

        # The notes arm decides. If our explanations answer the question, the
        # question is dead whatever the model knows independently, so the
        # control never suppresses this reading — it only annotates it.
        #
        # On a well-known paper the control fires on nearly everything,
        # because the tester has read the paper and a sixteen-year-old has
        # not. Letting it gate would hide most real leaks.
        if answerable_from_notes:
            verdict = "notes answer it"
            if answerable_from_nothing:
                verdict = "notes answer it *"
        elif answerable_from_nothing:
            verdict = "requires the paper *"
        else:
            verdict = "requires the paper"

        rows.append(
            {
                "id": question["id"],
                "section": question["section"],
                "prompt": question["prompt"],
                "runs": args.runs,
                "from_notes": notes_hits,
                "from_nothing": blind_hits,
                "verdict": verdict,
                "answerable_from_notes": answerable_from_notes,
                "answerable_from_nothing": answerable_from_nothing,
                "requires_source": not answerable_from_notes,
                "confidence": Counter(
                    a["confidence"] for a in from_notes
                ).most_common(1)[0][0],
                "basis_notes": from_notes[0]["basis"],
                "basis_nothing": from_nothing[0]["basis"],
            }
        )
        print(
            f"  [{i}/{len(questions)}] {question['id']}: "
            f"notes {notes_hits}/{args.runs}, nothing {blind_hits}/{args.runs}"
            f" — {verdict}"
        )

    print("\n  RESULTS\n")
    for section in ("comprehension", "appraisal"):
        group = [r for r in rows if r["section"] == section]
        if not group:
            continue
        print(f"  {section.upper()}")
        print(
            f"  {'ID':<6} {'FROM NOTES':>10} {'FROM NOTHING':>13}  "
            f"{'VERDICT':<19} QUESTION"
        )
        print("  " + "-" * 106)
        for row in group:
            short = row["prompt"][:46] + ("…" if len(row["prompt"]) > 46 else "")
            print(
                f"  {row['id']:<6} "
                f"{str(row['from_notes']) + '/' + str(row['runs']):>10} "
                f"{str(row['from_nothing']) + '/' + str(row['runs']):>13}  "
                f"{row['verdict']:<19} {short}"
            )
        print()

    comp = [r for r in rows if r["section"] == "comprehension"]
    needs_source = sum(1 for r in comp if r["requires_source"])
    too_easy = [r for r in rows if r["answerable_from_notes"]]
    prior = [r for r in rows if r["answerable_from_nothing"]]

    print(f"  check round: {needs_source} of {len(comp)} require the paper "
          f"(target: at least 3)")
    print(
        f"  overall: {sum(1 for r in rows if r['requires_source'])} of "
        f"{len(rows)} require the paper"
    )
    if needs_source < 3:
        print("  TARGET MISSED — thin the explanations further or rewrite questions.")

    if too_easy:
        print("\n  THE NOTES GAVE IT AWAY\n")
        for row in too_easy:
            print(f"  {row['id']}: {row['basis_notes']}")

    if prior:
        print("\n  * DIAGNOSTIC — also answerable with no notes at all")
        print("  Not a failure on its own. Recorded because this tester has")
        print("  read the paper and the reader has not.\n")
        for row in prior:
            print(f"  {row['id']}: {row['basis_nothing']}")

    out = path.with_name("verification.json")
    out.write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n  wrote {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
