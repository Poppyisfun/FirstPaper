#!/usr/bin/env python3
"""Fold a paper's six JSON files into the one frozen schema file.

Run once per paper that predates the schema. New papers are authored as
paper.json directly and never need this.

    python migrate_to_schema.py --slug crispr-human-cells
    python migrate_to_schema.py --slug crispr-human-cells --dry-run

The authors' text is copied byte for byte. The script asserts that before
writing: a migration that silently reflowed the source text would be the
worst possible bug here, because nothing downstream would notice.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PAPERS = ROOT / "content" / "papers"

# Must match lib/schema.ts. Seven, and no more.
TAGS = {
    "hedging", "scope", "generalisation", "comparison",
    "denominator", "confounding", "demonstration",
}

LICENCE_MAP = {
    "CC BY 3.0": "CC-BY",
    "CC BY 4.0": "CC-BY-4.0",
    "CC BY": "CC-BY",
    "CC0": "CC0",
}


def words(text: str) -> int:
    return len(re.sub(r"<[^>]+>", " ", text).split())


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--slug", required=True)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    d = PAPERS / args.slug
    load = lambda name: json.loads((d / name).read_text(encoding="utf-8"))

    meta = load("meta.json")
    source = load("source.json")
    explanations = load("explanations.json")
    predictions = load("predictions.json")["predictions"]
    questions = load("questions.json")

    licence = LICENCE_MAP.get(meta["licence"])
    if not licence:
        sys.exit(f"licence {meta['licence']!r} is not in the permitted set")

    # ── paragraphs ────────────────────────────────────────────────────
    paragraphs = []
    for section in source["sections"]:
        for p in section["paragraphs"]:
            pid = p["id"]
            exp = explanations.get(pid, {})
            pred = predictions.get(pid)
            if not pred:
                sys.exit(f"{pid} has no prediction set")

            paragraphs.append({
                "id": pid,
                "section": section.get("heading"),
                "imrad": section["imrad"],
                "source_text": p["text"],
                "explanation": exp.get("reader", ""),
                "caution": exp.get("caution") or None,
                "prediction": {
                    "prompt": pred.get("prompt")
                              or "What do you think this paragraph says?",
                    "options": pred["options"],
                    "correct": pred["correct_option_id"],
                },
            })

    # ── questions ─────────────────────────────────────────────────────
    def question(q: dict, with_tag: bool) -> dict:
        out = {
            "id": q["id"],
            "prompt": q["prompt"],
            "options": q["options"],
            "correct": q["correct_option_id"],
            "feedback": q["why"],
        }
        if with_tag:
            tag = q.get("tag")
            if tag not in TAGS:
                sys.exit(f"{q['id']} has tag {tag!r}, which is not one of the seven")
            out["tag"] = tag
        return out

    check = [question(q, False) for q in questions["comprehension"]]
    judge = [question(q, True) for q in questions["appraisal"]]

    # ── figures ───────────────────────────────────────────────────────
    attribution = (
        f"{meta['authors']} ({meta['year']}) {meta['journal']}. "
        f"Reproduced under {meta['licence']}."
    )
    figures = [{
        "id": f["id"],
        "label": f.get("label"),
        "src": f.get("href"),
        "caption": f.get("caption"),
        "attribution": attribution,
        "referenced_by": f.get("referenced_by", []),
    } for f in source["figures"]]

    paper = {
        "slug": meta["slug"],
        "doi": None,
        "pmcid": source["pmcid"],
        "licence": licence,
        "licence_url": meta["licence_url"],
        "citation_count": None,
        "title": meta["title"],
        "authors": meta["authors"],
        "year": meta["year"],
        "journal": meta["journal"],
        "original_url": meta["original_url"],
        "difficulty": meta["level"].lower(),
        "headline_tag": meta.get("practiceGoal"),
        "estimated_minutes": meta["minutes"],
        "practice_goal": meta["practiceGoal"],
        "paragraphs": paragraphs,
        "check": check,
        "judge": judge,
        "recap": meta["plainSummary"],
        "ai_summary": None,
        "figures": figures,
    }

    # ── the one assertion that matters ────────────────────────────────
    original = {p["id"]: p["text"]
                for s in source["sections"] for p in s["paragraphs"]}
    drift = [p["id"] for p in paragraphs
             if p["source_text"] != original[p["id"]]]
    assert not drift, f"source text changed during migration: {drift}"

    print(f"  paragraphs {len(paragraphs)}  check {len(check)}  "
          f"judge {len(judge)}  figures {len(figures)}")
    print(f"  licence {meta['licence']!r} -> {licence!r}")
    print(f"  tags used: {sorted({q['tag'] for q in judge})}")
    print(f"  cautions: {sum(1 for p in paragraphs if p['caution'])}")
    print("  source text: byte-identical for all "
          f"{len(paragraphs)} paragraphs")

    ratios = [(p["id"], round(100 * words(p["explanation"]) / words(p["source_text"])))
              for p in paragraphs]
    out_of_band = [(i, r) for i, r in ratios if not 60 <= r <= 75]
    print(f"  explanation ratio in 60-75%: "
          f"{len(ratios) - len(out_of_band)}/{len(ratios)}")
    for i, r in out_of_band:
        print(f"    {i.split('-', 1)[1]}: {r}%")

    if args.dry_run:
        print("\n  dry run, nothing written")
        return 0

    out = d / "paper.json"
    out.write_text(json.dumps(paper, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n  wrote {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
