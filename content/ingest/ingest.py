#!/usr/bin/env python3
"""Find open access biology papers on Europe PMC and parse them into JSON.

Two subcommands:

    search   look for candidate papers on a topic, score them for how
             approachable they look, and write a ranked candidate list
    fetch    pull the JATS full text for one or more PMCIDs and parse it
             down to paragraph level

Standard library only. No API key. Europe PMC asks for a User-Agent that
identifies the caller, which is set below.

    python ingest.py search "CRISPR off-target" --limit 40 --min-year 2010
    python ingest.py fetch PMC1234567 PMC2345678
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

BASE = "https://www.ebi.ac.uk/europepmc/webservices/rest"
SEARCH_URL = f"{BASE}/search"
USER_AGENT = (
    "FirstPaper-ingest/1.0 "
    "(https://github.com/Poppyisfun/FirstPaper; teaching tool; contact via repo)"
)

# Europe PMC caps a page at 100 regardless of what you ask for.
MAX_PAGE_SIZE = 100
PAGE_PAUSE = 0.3

XLINK_HREF = "{http://www.w3.org/1999/xlink}href"

DEFAULT_OUT = Path(__file__).resolve().parent / "data"


# ─────────────────────────────────────────────────────────────────────────────
# HTTP
# ─────────────────────────────────────────────────────────────────────────────


def http_get(url: str, *, retries: int = 4, timeout: int = 30) -> bytes:
    """GET with exponential backoff.

    Europe PMC returns a 503 often enough under load that a single attempt is
    not worth writing. Retries on 5xx, 429 and transport errors; a 404 is a
    real answer and is raised immediately rather than retried.
    """
    delay = 1.0
    last: Exception | None = None

    for attempt in range(1, retries + 1):
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return response.read()
        except urllib.error.HTTPError as err:
            if err.code < 500 and err.code != 429:
                raise
            last = err
        except (urllib.error.URLError, TimeoutError) as err:
            last = err

        if attempt < retries:
            print(
                f"    retrying in {delay:.0f}s ({last})", file=sys.stderr
            )
            time.sleep(delay)
            delay *= 2

    raise RuntimeError(f"giving up on {url}: {last}")


# ─────────────────────────────────────────────────────────────────────────────
# Licence triage
# ─────────────────────────────────────────────────────────────────────────────

# Longest first, so cc-by-nc-nd is never matched as cc-by.
LICENCE_BUCKETS: list[tuple[str, str]] = [
    ("cc-by-nc-sa", "caution"),
    ("cc-by-nc-nd", "caution"),
    ("cc-by-nc", "caution"),
    ("cc-by-nd", "caution"),
    ("cc-by-sa", "clear"),
    ("cc-by", "clear"),
    ("cc0", "clear"),
    ("cc-zero", "clear"),
    ("public-domain", "clear"),
]

BUCKET_FLAG = {"clear": "+", "caution": "~", "check": "?"}


def normalise_licence(raw: str | None) -> str:
    """Folds the many spellings Europe PMC returns into one comparable form."""
    if not raw:
        return ""
    text = raw.strip().lower()
    text = re.sub(r"[\s_/]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


def licence_bucket(raw: str | None) -> str:
    """clear, caution, or check.

    clear    reproduce with attribution
    caution  fine while the site is free, revisit before charging for anything
    check    unknown or unstated, read the article's own licence before use
    """
    text = normalise_licence(raw)
    if not text:
        return "check"
    for prefix, bucket in LICENCE_BUCKETS:
        if text.startswith(prefix):
            return bucket
    return "check"


# ─────────────────────────────────────────────────────────────────────────────
# Beginner-friendliness score
# ─────────────────────────────────────────────────────────────────────────────

PLAIN_QUESTION = re.compile(
    r"\b(we asked|we tested|we wondered|here we show|we set out to|"
    r"we wanted to know|the question|we investigated whether)\b",
    re.I,
)
ACRONYM = re.compile(r"\b[A-Z][A-Z0-9]{2,}\b")
WORD = re.compile(r"[A-Za-z][A-Za-z-]+")


def score_abstract(abstract: str | None) -> tuple[int, dict]:
    """Rough triage for how approachable an abstract reads. Higher is friendlier.

    This is a sorting aid for a human picking papers, not a judgement about the
    science. It only sees the abstract, and a dense abstract can sit in front of
    a perfectly readable paper.
    """
    if not abstract or len(abstract.split()) < 20:
        return 0, {"reason": "no usable abstract"}

    sentences = [s for s in re.split(r"(?<=[.!?])\s+", abstract) if s.strip()]
    words = WORD.findall(abstract)
    if not sentences or not words:
        return 0, {"reason": "no usable abstract"}

    avg_sentence = len(words) / len(sentences)
    long_words = sum(1 for w in words if len(w) >= 13)
    long_ratio = long_words / len(words)
    acronyms = len(set(ACRONYM.findall(abstract)))
    acronym_ratio = acronyms / len(words)

    score = 100.0
    # Anything past roughly 20 words a sentence starts costing the reader.
    score -= max(0.0, avg_sentence - 20) * 2.2
    # Very long words are the clearest single signal of specialist prose.
    score -= long_ratio * 420
    # Undefined acronyms force the reader to hold a glossary in their head.
    score -= acronym_ratio * 900

    has_question = bool(PLAIN_QUESTION.search(abstract))
    if has_question:
        score += 6

    score = max(0, min(100, round(score)))

    return int(score), {
        "avg_sentence_words": round(avg_sentence, 1),
        "long_word_ratio": round(long_ratio, 4),
        "distinct_acronyms": acronyms,
        "states_a_question": has_question,
    }


# ─────────────────────────────────────────────────────────────────────────────
# search
# ─────────────────────────────────────────────────────────────────────────────


def build_query(
    topic: str, min_year: int, max_year: int, journal: str | None = None
) -> str:
    """Restricts to open access articles Europe PMC actually holds full text for.

    The date range is bounded at both ends on purpose. Europe PMC ranks heavily
    by recency, so an open-ended range buries the foundational papers under
    whatever was published last month.
    """
    parts = [
        f"({topic})",
        "OPEN_ACCESS:Y",
        "HAS_FT:Y",
        "IN_EPMC:Y",
        f"FIRST_PDATE:[{min_year}-01-01 TO {max_year}-12-31]",
    ]
    if journal:
        parts.append(f'JOURNAL:"{journal}"')
    return " AND ".join(parts)


def search(
    topic: str,
    limit: int,
    min_year: int,
    max_year: int,
    min_citations: int,
    journal: str | None = None,
) -> list[dict]:
    """Pages through results, most cited first.

    Europe PMC sorts server-side with `sort=CITED desc`, verified against the
    live endpoint. Because results arrive in descending citation order, the
    first result below min_citations means every result after it is too, so
    paging can stop there rather than walking the whole set.
    """
    query = build_query(topic, min_year, max_year, journal)
    cursor = "*"
    collected: list[dict] = []
    page = 0

    while len(collected) < limit:
        params = urllib.parse.urlencode(
            {
                "query": query,
                "format": "json",
                "resultType": "core",
                "sort": "CITED desc",
                "pageSize": MAX_PAGE_SIZE,
                "cursorMark": cursor,
            }
        )
        page += 1
        print(f"  page {page} (kept {len(collected)})", file=sys.stderr)

        payload = json.loads(http_get(f"{SEARCH_URL}?{params}"))
        results = payload.get("resultList", {}).get("result", [])
        if not results:
            break

        exhausted = False
        for result in results:
            if (result.get("citedByCount") or 0) < min_citations:
                exhausted = True
                break
            collected.append(result)
            if len(collected) >= limit:
                break

        if exhausted:
            print(
                f"  reached the {min_citations} citation floor", file=sys.stderr
            )
            break

        nxt = payload.get("nextCursorMark")
        if not nxt or nxt == cursor:
            break
        cursor = nxt
        time.sleep(PAGE_PAUSE)

    return collected[:limit]


def summarise(result: dict) -> dict:
    """Keeps the fields worth storing and adds the licence bucket and score."""
    abstract = result.get("abstractText")
    score, signals = score_abstract(abstract)
    licence = result.get("license")

    return {
        "pmcid": result.get("pmcid"),
        "doi": result.get("doi"),
        "title": clean_title(result.get("title")),
        "journal": (result.get("journalInfo", {}) or {})
        .get("journal", {})
        .get("title")
        or result.get("journalTitle"),
        "pubYear": result.get("pubYear"),
        "authorString": result.get("authorString"),
        "citedByCount": result.get("citedByCount"),
        "license": licence,
        "licence_bucket": licence_bucket(licence),
        "abstractText": abstract,
        "score": score,
        "score_signals": signals,
    }


def clean_title(raw: str | None) -> str:
    """Search-index titles carry HTML entities and inline markup like <i>."""
    if not raw:
        return ""
    text = html.unescape(raw)
    text = re.sub(r"<[^>]+>", "", text)
    return re.sub(r"\s+", " ", text).strip()


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or "search"


def print_table(rows: list[dict], count: int) -> None:
    """Top N as a table. The flag column is the licence bucket."""
    print()
    print(f"  Top {min(count, len(rows))} of {len(rows)} candidates")
    print(f"  flag: + clear  ~ caution  ? check")
    print()
    print(f"  {'':1} {'SCORE':>5}  {'YEAR':>4}  {'PMCID':<12} {'CITED':>5}  TITLE")
    print(f"  {'-' * 96}")

    for row in rows[:count]:
        flag = BUCKET_FLAG.get(row["licence_bucket"], "?")
        title = (row.get("title") or "").replace("\n", " ").strip()
        if len(title) > 58:
            title = title[:57] + "…"
        print(
            f"  {flag:1} {row['score']:>5}  {str(row.get('pubYear') or ''):>4}  "
            f"{str(row.get('pmcid') or ''):<12} {str(row.get('citedByCount') or 0):>5}  {title}"
        )
    print()


def cmd_search(args: argparse.Namespace) -> int:
    where = f' in {args.journal}' if args.journal else ""
    print(f"  searching Europe PMC for: {args.topic}{where}", file=sys.stderr)
    print(
        f"  {args.min_year} to {args.max_year}, "
        f"at least {args.min_citations} citations",
        file=sys.stderr,
    )
    raw = search(
        args.topic,
        args.limit,
        args.min_year,
        args.max_year,
        args.min_citations,
        args.journal,
    )
    if not raw:
        print(
            "  no results. Try widening --max-year or lowering --min-citations.",
            file=sys.stderr,
        )
        return 1

    # Most cited first; readability score only breaks ties.
    rows = sorted(
        (summarise(r) for r in raw),
        key=lambda r: (-(r.get("citedByCount") or 0), -r["score"]),
    )

    out_dir: Path = args.out_dir
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = slugify(f"{args.topic}-{args.journal}" if args.journal else args.topic)
    out_path = out_dir / f"candidates-{stem}.json"
    out_path.write_text(
        json.dumps(
            {
                "topic": args.topic,
                "journal": args.journal,
                "query": build_query(
                    args.topic, args.min_year, args.max_year, args.journal
                ),
                "min_year": args.min_year,
                "max_year": args.max_year,
                "min_citations": args.min_citations,
                "sort": "CITED desc",
                "count": len(rows),
                "buckets": {
                    b: sum(1 for r in rows if r["licence_bucket"] == b)
                    for b in ("clear", "caution", "check")
                },
                "results": rows,
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    print_table(rows, 15)
    counts = {
        b: sum(1 for r in rows if r["licence_bucket"] == b)
        for b in ("clear", "caution", "check")
    }
    print(
        f"  licences: {counts['clear']} clear · {counts['caution']} caution · "
        f"{counts['check']} check"
    )
    print(f"  wrote {out_path}")
    return 0


# ─────────────────────────────────────────────────────────────────────────────
# fetch
# ─────────────────────────────────────────────────────────────────────────────

# Figure labels are not prose. Bibliographic cross-references are handled
# separately below, because they are the only xref type worth deleting.
SKIP_TAGS = {
    "label",
    # Figures and tables sit inside the paragraph they illustrate.
    "fig",
    "table-wrap",
    "supplementary-material",
    "disp-formula",
}

# Citations only. A ref-type of "fig", "table" or "sec" is a pointer the reader
# needs ("as shown in Figure 2"), so those keep their text.
CITATION_REF_TYPES = {"bibr"}

# Removing a citation leaves the punctuation that wrapped it: "[]", "[,]",
# "(; )". These match a bracket or paren holding nothing but separators.
EMPTY_BRACKETS = re.compile(r"\[[\s,;–—-]*\]")
EMPTY_PARENS = re.compile(r"\([\s,;–—-]*\)")
LEADING_SEP_IN_PAREN = re.compile(r"\(\s*[;,]\s*")
TRAILING_SEP_IN_PAREN = re.compile(r"\s*[;,]\s*\)")
SPACE_BEFORE_PUNCT = re.compile(r"\s+([.,;:!?)\]])")
SPACE_AFTER_OPEN = re.compile(r"([(\[])\s+")


def is_citation(element: ET.Element) -> bool:
    """True for a bibliographic cross-reference, which is not prose."""
    return (
        element.tag == "xref"
        and element.get("ref-type", "bibr") in CITATION_REF_TYPES
    )


def tidy_after_citations(text: str) -> str:
    """Clears the wreckage a removed citation leaves behind.

    Deleting the xref inside "[12, 15]" leaves "[,]", and deleting the one
    inside "(Jinek et al., 2012; Cong et al., 2013)" leaves "(; )". Left in
    place, every downstream explanation is written against that clutter.

    Runs until stable because citations nest: "([1,2]; reviewed by [3])"
    collapses in more than one pass.
    """
    previous = None
    while previous != text:
        previous = text
        text = EMPTY_BRACKETS.sub("", text)
        text = EMPTY_PARENS.sub("", text)

    # A surviving paren can still open or close on a stranded separator.
    text = LEADING_SEP_IN_PAREN.sub("(", text)
    text = TRAILING_SEP_IN_PAREN.sub(")", text)
    text = EMPTY_PARENS.sub("", text)

    text = SPACE_BEFORE_PUNCT.sub(r"\1", text)
    text = SPACE_AFTER_OPEN.sub(r"\1", text)
    return re.sub(r"\s{2,}", " ", text).strip()


def flatten(element: ET.Element) -> str:
    """Element text as prose, with citations removed and whitespace collapsed."""
    parts: list[str] = []

    def walk(node: ET.Element) -> None:
        if node.text:
            parts.append(node.text)
        for child in node:
            if child.tag not in SKIP_TAGS and not is_citation(child):
                walk(child)
            # A skipped child's tail is real prose and must be kept.
            if child.tail:
                parts.append(child.tail)

    walk(element)
    joined = re.sub(r"\s+", " ", "".join(parts))
    return tidy_after_citations(joined)


IMRAD_PATTERNS: list[tuple[str, re.Pattern]] = [
    # Checked first: limitations is usually a subsection of the discussion, and
    # it is the part most worth finding, so it must not be swallowed by it.
    ("limitations", re.compile(r"\b(limitation|caveat|weakness|shortcoming)", re.I)),
    (
        "methods",
        re.compile(
            r"\b(method|materials|experimental|procedure|protocol|"
            r"data collection|statistical analys)",
            re.I,
        ),
    ),
    ("introduction", re.compile(r"\b(introduction|background|rationale)", re.I)),
    ("results", re.compile(r"\b(result|finding|observation)", re.I)),
    (
        # "perspective" and "outlook" are deliberately absent: they match
        # "Historical perspective", which is background, not discussion. An
        # unrecognised heading belongs in "other" rather than the wrong bucket.
        "discussion",
        re.compile(r"\b(discussion|conclusion|concluding|implication)", re.I),
    ),
]


def classify_section(heading: str | None) -> str:
    """Maps a heading to an IMRaD bucket.

    No trailing word boundary on any alternative: a trailing boundary makes
    "Result" match while "Results" does not, which is the wrong way round for
    real headings.
    """
    if not heading:
        return "other"
    for name, pattern in IMRAD_PATTERNS:
        if pattern.search(heading):
            return name
    return "other"


def parse_licence(root: ET.Element) -> dict:
    """The article's own licence statement.

    More reliable than the search index: this is what the publisher attached to
    the article itself.
    """
    license_el = root.find(".//permissions/license")
    if license_el is None:
        return {"licence_url": None, "licence_text": None}

    url = license_el.get(XLINK_HREF)
    if not url:
        link = license_el.find(f".//*[@{XLINK_HREF}]")
        if link is not None:
            url = link.get(XLINK_HREF)

    return {"licence_url": url, "licence_text": flatten(license_el) or None}


def parse_figures(root: ET.Element) -> list[dict]:
    figures = []
    for fig in root.findall(".//fig"):
        label_el = fig.find("label")
        caption_el = fig.find("caption")
        figures.append(
            {
                "id": fig.get("id"),
                "label": flatten(label_el) if label_el is not None else None,
                "caption": flatten(caption_el) if caption_el is not None else None,
            }
        )
    return figures


# Containers whose text is not body prose. A <fig> sits inside the <p> it
# illustrates, so without this the whole caption is absorbed into the paragraph,
# and its caption <p> is then also collected as a paragraph of its own.
NON_PROSE_CONTAINERS = {
    "fig",
    "table-wrap",
    "table-wrap-foot",
    "supplementary-material",
    "disp-formula",
    "graphic",
    "media",
}

# Paragraphs that are only a DOI or a bare link carry nothing to explain.
JUNK_PARAGRAPH = re.compile(
    r"^(doi:\s*)?(https?://\S+|10\.\d{4,}/\S+)$", re.I
)


def prose_paragraphs(sec: ET.Element) -> list[ET.Element]:
    """Every <p> in a section except those inside a figure or table.

    ElementTree has no parent pointers, so the blocked paragraphs are collected
    first by walking each non-prose container, then subtracted.
    """
    blocked: set[int] = set()
    for tag in NON_PROSE_CONTAINERS:
        for container in sec.iter(tag):
            for para in container.iter("p"):
                blocked.add(id(para))

    return [p for p in sec.iter("p") if id(p) not in blocked]


def parse_sections(root: ET.Element, pmcid: str, min_chars: int) -> list[dict]:
    """Top-level <sec> elements under <body>.

    Paragraphs come from the whole subtree so a subsection's prose stays with
    its parent section, minus anything living inside a figure or table. Text
    shorter than min_chars, and anything that is only a DOI, is dropped: those
    are never prose worth explaining.
    """
    body = root.find(".//body")
    if body is None:
        return []

    sections = []
    for section_index, sec in enumerate(body.findall("sec")):
        title_el = sec.find("title")
        heading = flatten(title_el) if title_el is not None else None

        paragraphs = []
        for para in prose_paragraphs(sec):
            text = flatten(para)
            if len(text) < min_chars or JUNK_PARAGRAPH.match(text):
                continue
            paragraphs.append(
                {
                    "id": f"{pmcid}-s{section_index}-p{len(paragraphs)}",
                    "text": text,
                }
            )

        if not paragraphs:
            continue

        sections.append(
            {
                "index": section_index,
                "heading": heading,
                "imrad": classify_section(heading),
                "paragraphs": paragraphs,
            }
        )

    return sections


def fetch_one(pmcid: str, min_chars: int) -> dict:
    pmcid = pmcid.strip().upper()
    if not pmcid.startswith("PMC"):
        pmcid = f"PMC{pmcid}"

    xml_bytes = http_get(f"{BASE}/{pmcid}/fullTextXML")
    root = ET.fromstring(xml_bytes)

    title_el = root.find(".//article-meta//article-title")
    sections = parse_sections(root, pmcid, min_chars)

    paper = {
        "pmcid": pmcid,
        "title": flatten(title_el) if title_el is not None else None,
        **parse_licence(root),
        "sections": sections,
        "figures": parse_figures(root),
    }
    paper["paragraph_count"] = sum(len(s["paragraphs"]) for s in sections)
    return paper


def cmd_fetch(args: argparse.Namespace) -> int:
    out_dir: Path = args.out_dir
    out_dir.mkdir(parents=True, exist_ok=True)
    failures = 0

    for pmcid in args.pmcids:
        try:
            print(f"  fetching {pmcid}", file=sys.stderr)
            paper = fetch_one(pmcid, args.min_chars)
        except Exception as err:  # noqa: BLE001 - one bad id must not stop the batch
            print(f"  FAILED {pmcid}: {err}", file=sys.stderr)
            failures += 1
            continue

        out_path = out_dir / f"{paper['pmcid']}.json"
        out_path.write_text(
            json.dumps(paper, indent=2, ensure_ascii=False), encoding="utf-8"
        )

        imrad = ", ".join(
            f"{s['imrad']}:{len(s['paragraphs'])}" for s in paper["sections"]
        )
        print(f"  {paper['pmcid']}  {paper['paragraph_count']} paragraphs  "
              f"{len(paper['figures'])} figures")
        print(f"    licence: {paper['licence_url'] or 'not stated'}")
        print(f"    sections: {imrad or 'none'}")
        print(f"    wrote {out_path}")
        time.sleep(PAGE_PAUSE)

    return 1 if failures else 0


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="ingest.py",
        description=(
            "Find open access biology papers on Europe PMC and parse them "
            "into paragraph-level JSON."
        ),
        epilog=(
            "examples:\n"
            '  python ingest.py search "CRISPR off-target" --limit 40 --min-year 2010\n'
            "  python ingest.py fetch PMC1234567 PMC2345678\n"
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=DEFAULT_OUT,
        help="where JSON is written (default: data/ beside this script)",
    )

    sub = parser.add_subparsers(dest="command", required=True)

    s = sub.add_parser(
        "search",
        help="search for candidate papers and rank them",
        description="Search Europe PMC and write a ranked candidate list.",
    )
    s.add_argument("topic", help='topic to search for, e.g. "CRISPR off-target"')
    s.add_argument(
        "--limit", type=int, default=40, help="how many results to keep (default: 40)"
    )
    s.add_argument(
        "--min-year",
        type=int,
        default=2005,
        help="earliest first-publication year (default: 2005)",
    )
    s.add_argument(
        "--max-year",
        type=int,
        default=2020,
        help=(
            "latest first-publication year (default: 2020). Bounding the top "
            "end is what surfaces established papers instead of last month's"
        ),
    )
    s.add_argument(
        "--min-citations",
        type=int,
        default=100,
        help="drop anything cited fewer times than this (default: 100)",
    )
    s.add_argument(
        "--journal",
        default=None,
        help='restrict to one journal, e.g. --journal "eLife"',
    )
    s.set_defaults(func=cmd_search)

    f = sub.add_parser(
        "fetch",
        help="fetch and parse full text for one or more PMCIDs",
        description="Fetch JATS full text and parse it to paragraph-level JSON.",
    )
    f.add_argument("pmcids", nargs="+", help="one or more PMCIDs, e.g. PMC1234567")
    f.add_argument(
        "--min-chars",
        type=int,
        default=40,
        help="drop paragraphs shorter than this (default: 40)",
    )
    f.set_defaults(func=cmd_fetch)

    return parser


def main() -> int:
    # Windows consoles default to a legacy codepage that cannot print the Greek
    # letters and dashes these titles are full of. Never let that crash a run.
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, OSError):
            pass

    args = build_parser().parse_args()
    try:
        return args.func(args)
    except KeyboardInterrupt:
        print("\n  interrupted", file=sys.stderr)
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
