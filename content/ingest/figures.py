#!/usr/bin/env python3
"""Download a paper's figure images and wire them into its source.json.

Europe PMC does not serve figure images from the article endpoints. The only
route that works is the supplementaryFiles zip, which carries the same images
the article renders, named by the xlink:href on each <graphic> in the JATS XML.
That href is what ties a file in the zip to a <fig> id, so the mapping is read
from the XML rather than guessed from filenames.

Each figure gains two fields:

    href           where the image sits under public/, ready for an <img src>
    referenced_by  the paragraph ids whose text points at that figure

referenced_by is built by scanning the authors' own prose for "Figure N", so a
paragraph that merely sits near a figure does not claim it. Panel letters are
ignored: "Figure 1A" and "Figure 1B" both point at Figure 1, because the image
is one file.

    python figures.py --slug crispr-human-cells --pmcid PMC3557905
    python figures.py --slug crispr-human-cells --pmcid PMC3557905 --dry-run
"""

from __future__ import annotations

import argparse
import io
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PAPERS = ROOT / "content" / "papers"
PUBLIC = ROOT / "public" / "papers"
BASE = "https://www.ebi.ac.uk/europepmc/webservices/rest"
XLINK = "{http://www.w3.org/1999/xlink}href"

# Raster formats the browser can show, best first. Publishers ship the same
# figure several ways; the jpg is the one the article itself renders.
PREFERRED = [".jpg", ".jpeg", ".png", ".gif", ".tif", ".tiff"]

# A whole citation group: "Figure 1", "Figure 1E", "Figures 1E and 2A,B",
# "Figure 1—figure supplement 1". The group is matched as a run so that a
# plural citation naming several figures is not read as naming only the first.
FIG_GROUP = re.compile(
    r"Figures?\s+"
    r"(\d+[A-Z]?(?:,\s*[A-Z])*"
    r"(?:\s*(?:,|and)\s*\d+[A-Z]?(?:,\s*[A-Z])*)*)"
    r"(\s*[—–-]\s*figure\s+supplement\s+(\d+))?",
    re.IGNORECASE,
)
# Each figure number inside such a group.
FIG_NUM = re.compile(r"\b(\d+)")

# A figure's own label, for turning "Figure 1." into the number prose cites.
FIG_REF = re.compile(
    r"Figure[s]?\s+(\d+)(\s*[—–-]\s*figure\s+supplement\s+(\d+))?",
    re.IGNORECASE,
)


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "FirstPaper/1.0"})
    with urllib.request.urlopen(request, timeout=120) as response:
        return response.read()


def graphic_hrefs(root: ET.Element) -> dict[str, list[str]]:
    """Every <fig> id mapped to the image hrefs it declares."""
    out: dict[str, list[str]] = {}
    for fig in root.findall(".//fig"):
        fid = fig.get("id")
        if not fid:
            continue
        out[fid] = [g.get(XLINK) for g in fig.iter("graphic") if g.get(XLINK)]
    return out


def pick(names: list[str], stem: str) -> str | None:
    """The best file in the zip for one href stem, by format preference."""
    matches = [n for n in names if Path(n).stem.lower() == stem.lower()]
    if not matches:
        return None
    matches.sort(
        key=lambda n: PREFERRED.index(Path(n).suffix.lower())
        if Path(n).suffix.lower() in PREFERRED
        else len(PREFERRED)
    )
    return matches[0]


def label_key(label: str | None) -> tuple[int, int] | None:
    """Turns a figure's own label into the number a paragraph would cite."""
    if not label:
        return None
    match = FIG_REF.search(label)
    if not match:
        return None
    return (int(match.group(1)), int(match.group(3)) if match.group(3) else 0)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--slug", required=True)
    parser.add_argument("--pmcid", required=True)
    parser.add_argument(
        "--dry-run", action="store_true", help="report the mapping, write nothing"
    )
    args = parser.parse_args()

    source_path = PAPERS / args.slug / "source.json"
    source = json.loads(source_path.read_text(encoding="utf-8"))
    pmcid = args.pmcid.upper()

    print(f"  fetching XML for {pmcid}")
    root = ET.fromstring(fetch(f"{BASE}/{pmcid}/fullTextXML"))
    hrefs = graphic_hrefs(root)

    print("  fetching supplementaryFiles zip")
    blob = fetch(f"{BASE}/{pmcid}/supplementaryFiles")
    archive = zipfile.ZipFile(io.BytesIO(blob))
    names = archive.namelist()
    print(f"  zip holds {len(names)} entries\n")

    out_dir = PUBLIC / args.slug / "figures"
    rel_base = f"/papers/{args.slug}/figures"

    # Which figure each "Figure N" citation in the prose refers to.
    by_number: dict[tuple[int, int], str] = {}
    for fig in source["figures"]:
        key = label_key(fig.get("label"))
        if key is not None:
            by_number[key] = fig["id"]

    references: dict[str, list[str]] = {}
    for section in source["sections"]:
        for para in section["paragraphs"]:
            text = re.sub(r"<[^>]+>", " ", para["text"])
            for match in FIG_GROUP.finditer(text):
                supplement = int(match.group(3)) if match.group(3) else 0
                for number in FIG_NUM.findall(match.group(1)):
                    key = (int(number), supplement)
                    fid = by_number.get(key)
                    if fid and para["id"] not in references.setdefault(fid, []):
                        references[fid].append(para["id"])

    print(f"  {'FIGURE':<8} {'FILE IN ZIP':<26} {'SAVED AS':<14} CITED BY")
    print("  " + "-" * 92)

    written = 0
    missing = []
    for fig in source["figures"]:
        fid = fig["id"]
        cites = references.get(fid, [])
        chosen = None
        for href in hrefs.get(fid, []):
            chosen = pick(names, Path(href).stem)
            if chosen:
                break

        if not chosen:
            missing.append(fid)
            print(f"  {fid:<8} {'NOT IN ZIP':<26} {'-':<14} "
                  f"{', '.join(c.split('-')[-2] + '-' + c.split('-')[-1] for c in cites) or '-'}")
            continue

        suffix = Path(chosen).suffix.lower()
        target = f"{fid}{suffix}"
        if not args.dry_run:
            out_dir.mkdir(parents=True, exist_ok=True)
            (out_dir / target).write_bytes(archive.read(chosen))
        fig["href"] = f"{rel_base}/{target}"
        fig["referenced_by"] = cites
        written += 1
        short = ", ".join(c.replace(f"{pmcid}-", "") for c in cites) or "(not cited)"
        print(f"  {fid:<8} {chosen:<26} {target:<14} {short}")

    if missing:
        print(f"\n  WARNING: no image found for {missing}")

    if args.dry_run:
        print("\n  dry run, nothing written")
        return 0

    source_path.write_text(
        json.dumps(source, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    total_bytes = sum(f.stat().st_size for f in out_dir.glob("*")) if out_dir.exists() else 0
    print(f"\n  wrote {written} images to {out_dir} ({total_bytes:,} bytes)")
    print(f"  updated {source_path}")
    uncited = [f["id"] for f in source["figures"] if not f.get("referenced_by")]
    if uncited:
        print(f"  note: {uncited} are never cited by name in the prose")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
