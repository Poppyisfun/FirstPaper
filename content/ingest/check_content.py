#!/usr/bin/env python3
"""Mechanical checks on authored papers. No model, no API key, no network.

These are the cheap gates. They run on every content pull request before the
expensive behavioural one, because a word-count ratio or a bad licence string
should never cost an API call to find.

    python check_content.py                 all papers
    python check_content.py --slug <slug>   one paper

Exit code 1 if any check fails.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PAPERS = ROOT / "content" / "papers"

# Must match lib/schema.ts exactly. Seven, and no eighth, ever.
TAGS = {
    "hedging", "scope", "generalisation", "comparison",
    "denominator", "confounding", "demonstration",
}
LICENCES = {"CC-BY", "CC-BY-4.0", "CC0"}

# The explanation rule is "60-75% of the paragraph, NEVER LONGER". The ceiling
# is the real constraint: an explanation longer than the paragraph has stopped
# being an explanation. The floor is a target, and a short paragraph that was
# explained in a sentence should not be padded to meet it — padding is how
# commentary turns into filler.
RATIO_MAX = 75
RATIO_MIN = 60


def words(text: str) -> int:
    return len(re.sub(r"<[^>]+>", " ", text).split())


def check_paper(path: Path) -> tuple[list[str], list[str]]:
    """Returns (failures, warnings)."""
    fails: list[str] = []
    warns: list[str] = []
    paper = json.loads(path.read_text(encoding="utf-8"))
    slug = paper.get("slug", path.parent.name)

    # ── licence ───────────────────────────────────────────────────────
    licence = paper.get("licence")
    if licence not in LICENCES:
        fails.append(
            f"licence {licence!r} is not one of {sorted(LICENCES)} — "
            f"we may not reproduce text under it"
        )
    if not paper.get("licence_url"):
        fails.append("licence_url is missing")

    # ── tags ──────────────────────────────────────────────────────────
    for q in paper.get("judge", []):
        tag = q.get("tag")
        if tag not in TAGS:
            fails.append(
                f"judge/{q.get('id')} has tag {tag!r}; the enum is exactly "
                f"{sorted(TAGS)} and must not grow"
            )
    summary = paper.get("ai_summary")
    if summary:
        for i, err in enumerate(summary.get("errors", [])):
            if err.get("tag") not in TAGS:
                fails.append(f"ai_summary.errors[{i}] has tag {err.get('tag')!r}")
            if err.get("span") and err["span"] not in summary.get("text", ""):
                fails.append(
                    f"ai_summary.errors[{i}].span is not a substring of the text"
                )

    # ── explanation length ────────────────────────────────────────────
    over, under = [], []
    for p in paper.get("paragraphs", []):
        src, exp = words(p["source_text"]), words(p["explanation"])
        if src == 0:
            continue
        ratio = round(100 * exp / src)
        short = p["id"].split("-", 1)[-1]
        if ratio > RATIO_MAX:
            over.append(f"{short} {ratio}%")
        elif ratio < RATIO_MIN:
            under.append(f"{short} {ratio}%")

    if over:
        fails.append(
            f"explanation longer than {RATIO_MAX}% of the paragraph: "
            + ", ".join(over)
        )
    if under:
        warns.append(
            f"explanation under {RATIO_MIN}% ({len(under)}): " + ", ".join(under)
            + " — fine if the paragraph was genuinely short; do not pad"
        )

    # ── answer keys point at real options ─────────────────────────────
    for round_name in ("check", "judge"):
        for q in paper.get(round_name, []):
            ids = {o["id"] for o in q.get("options", [])}
            if q.get("correct") not in ids:
                fails.append(
                    f"{round_name}/{q.get('id')}: correct={q.get('correct')!r} "
                    f"is not one of {sorted(ids)}"
                )
    for p in paper.get("paragraphs", []):
        pred = p.get("prediction", {})
        ids = {o["id"] for o in pred.get("options", [])}
        if pred.get("correct") not in ids:
            fails.append(f"{p['id']}: prediction.correct is not one of its options")

    # ── figures ───────────────────────────────────────────────────────
    for f in paper.get("figures", []):
        if f.get("src"):
            on_disk = ROOT / "public" / f["src"].lstrip("/")
            if not on_disk.exists():
                fails.append(f"figure {f['id']}: {f['src']} is not in public/")
            # Vercel runs Linux. A capital in a filename that works on
            # Windows is a 404 in production.
            if f["src"] != f["src"].lower():
                fails.append(
                    f"figure {f['id']}: {f['src']} is not all lowercase, which "
                    f"will 404 on a case-sensitive filesystem"
                )

    print(f"  {slug}: {len(paper.get('paragraphs', []))} paragraphs, "
          f"licence {licence}, "
          f"tags {sorted({q['tag'] for q in paper.get('judge', []) if 'tag' in q})}")
    return fails, warns


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--slug")
    args = ap.parse_args()

    paths = sorted(PAPERS.glob("*/paper.json"))
    if args.slug:
        paths = [p for p in paths if p.parent.name == args.slug]
    if not paths:
        print("  no paper.json found", file=sys.stderr)
        return 1

    print(f"  checking {len(paths)} paper(s)\n")
    all_fails, all_warns = [], []
    for path in paths:
        fails, warns = check_paper(path)
        all_fails += [f"{path.parent.name}: {f}" for f in fails]
        all_warns += [f"{path.parent.name}: {w}" for w in warns]

    if all_warns:
        print("\n  WARNINGS")
        for w in all_warns:
            print(f"    {w}")

    if all_fails:
        print(f"\n  FAILED: {len(all_fails)}")
        for f in all_fails:
            print(f"    {f}")
        return 1

    print("\n  all mechanical checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
