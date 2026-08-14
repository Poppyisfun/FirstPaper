@AGENTS.md

## FirstPaper — project context

FirstPaper is a web app that teaches teenagers to read AND critically judge
scientific research papers (genetics/biology), section by section.

### Architecture rules (important)
- Next.js App Router + TypeScript + Tailwind (already set up).
- NO backend, NO database, NO API routes for now. Fully static and content-driven.
- Papers are DATA, not code: typed objects in /content/papers. Adding a paper =
  adding a data file. No page code changes when papers are added.
- Mobile-first. Most users are on phones and Chromebooks.
- Every paper links to its real open-access original.
- A persistent "FirstPaper can be wrong — that's the point" honesty note appears
  on every learning screen. It is part of the product, not a footnote.

### Design system
Colors (semantic — use consistently):
- bg #F4F6F2 · surface #FFFFFF · ink #1B2430 · ink-soft #55606E · line #E3E6DF
- GREEN #0F7B5F = comprehension / "read" / passing a check (soft #E5F1EB, line #BFE0D2)
- AMBER #B26B12 = scrutiny / "judge" / a flaw to notice (soft #F8EDD9, line #E9CE9E)
- RED #B23A3A = a failed evaluation check, verdict only (soft #F7E4E1)
Green always means "here's what it says"; amber always means "here's what to question."

Fonts (via next/font/google):
- Space Grotesk — all UI, headings, buttons, labels
- Newsreader (serif) — reading content only: paper excerpts and "Read" explanations

Feel: generous whitespace, rounded cards (14–16px), one clear action per screen,
calm and legible like a reading app — not a dashboard.

### Pages
- /                       landing
- /library               browse papers
- /paper/[slug]          paper intro / pre-flight (tier selector, "Begin")
- /paper/[slug]/walkthrough   the Read→Check→Judge flow + verdict + results
- /about                 mission, method, honesty, origin story
