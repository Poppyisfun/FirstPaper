@AGENTS.md

## FirstPaper — project context

FirstPaper is a web app that teaches teenagers to read AND critically judge
scientific research papers (genetics/biology), section by section.

## Architecture

- Next.js App Router + TypeScript + Tailwind.
- Supabase Postgres, **two tables only: `sessions` and `events`.** Do not add a
  third. If something seems to need one, say so and ask.
- Mobile-first. Most users are on phones and Chromebooks.
- Every paper links to its real open-access original.
- A persistent "FirstPaper can be wrong — that's the point" honesty note appears
  on every learning screen. It is part of the product, not a footnote.

### Supabase keys

This project uses the current Supabase key format:

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_…`)
- `SUPABASE_SECRET_KEY` (`sb_secret_…`) — no `NEXT_PUBLIC_` prefix, ever.

The older pair of key names does not exist on this project. Never reference
them, in code or in comments.

### Data access

**The browser never queries Supabase directly.** Every read and write goes
through a server-side route using the secret key.

RLS is on with **no policies, by design**. That is not an oversight: with no
policy, the publishable key can reach nothing, which is exactly the intent.
Access rules live in API routes, where they can be read and reasoned about in
one place, rather than being spread across policy definitions.

The browser client in `lib/supabase.ts` exists for auth flows only. If you find
yourself reaching for it to fetch data, the answer is a route handler.

### Paper content

Paper content lives in `content/papers/<slug>/` as JSON, committed to the repo.
**Not in the database, and not fetched at runtime.** Adding a paper means
adding a folder, not a migration and not a page change.

Each paper folder holds:

- `meta.json` — slug, title, authors, year, journal, licence, links, level,
  minutes, xp, and the one-line practice goal
- `source.json` — the authors' published text, parsed to paragraph level
- `explanations.json` — FirstPaper's commentary, keyed by paragraph id

`content/ingest/` holds the Python that generates these. It is not part of the
Next.js build and is excluded from TypeScript scanning.

### Scoring is derived, never stored

XP, scores, ranks and calibration are **computed from `events` at read time.**
Nothing writes a score to the database. A stored total is a number that can
drift away from the events that produced it; a derived one cannot.

### Accounts

**A reader can finish an entire paper with no account.** Signup is offered on
`/results`, after the work is done, never before it and never as a gate.

## Design

### Who is speaking

The single most important rule on the reading surface: **the reader must always
know whether they are reading the scientists or reading us.**

- **Serif** for the paper's own text.
- **Sans** for FirstPaper's commentary.

Three commentary colours, used nowhere else in the product:

- **green = explanation** — here is what this says
- **amber = caution** — here is what to question
- **violet = challenge** — here is something to try

Do not reuse those three for decoration, chrome, or state. Their meaning is the
whole point.

### Typography and restraint

- Paper text: **under 68 characters per line.** Long measures are why people
  bounce off papers.
- No card-chopping. A paper is continuous prose, not a feed of tiles.
- No drop shadows everywhere. Depth is for things that genuinely sit above the
  page, not for every container.
- Generous whitespace. One clear action per screen. Calm and legible like a
  reading app, not a dashboard.

### Design system

Source of truth is the `:root` block in `app/globals.css`. Tailwind tokens are
mapped onto those same CSS variables via `@theme inline`, so never redefine a
colour in one place only.

- bg #FAF9F6 · surface #FFFFFF · ink #0A0E14 · ink-2 #28323D · soft #68737F
- line #E6E4DC · line-2 #F0EEE7
- GREEN #0B7A5C = explanation (soft #E3F1EA, line #B4DCCB)
- AMBER #A9640D = caution (soft #FAEDD7, line #E8CB97)
- VIOLET #5B4BD6 = challenge (soft #EDEAFC, line #CCC4F5)
- BLUE #22557E = figures and figure explanations (soft #E5EEF6, line #BFD4E5)
- RED #AE3636 = a failed evaluation check, verdict only (soft #F8E4E1)

Fonts (via next/font/google, all variable):

- **Fraunces** — display: hero, section titles, stat numbers. Set the axes with
  --fv-xl / --fv-lg / --fv-sm; WONK 1 is what gives it its character.
- **Bricolage Grotesque** — all UI and all FirstPaper commentary.
- **Literata** — the paper's own text. This is the serif that says "the
  scientists are speaking".
- **Geist Mono** — eyebrows, tags, chips, numeric readouts.

### Motion

Motion (framer-motion v13) drives everything. Use the shared primitives in
`components/motion-primitives.tsx` (Rise, Stagger, RiseItem, springSoft,
springSnappy) rather than hand-rolling variants, so timing stays consistent and
`prefers-reduced-motion` is handled in one place.

Landing page: full cinematic treatment — hero motion, scroll reveals, depth.
Reading pages: restrained, purposeful motion only. It is a long-form reading
interface where students sit with dense scientific text. No parallax behind
paper text, no scroll-scrubbing during reading. Motion serves one beat: the
highlighter swipe when a paragraph resolves. Always respect
`prefers-reduced-motion`.

## Pages

- `/` landing
- `/library` browse papers
- `/about` mission, method, honesty, origin story
- `/account` account placeholder
- `/paper/[slug]/read` the paper, with commentary
- `/paper/[slug]/check` comprehension questions
- `/paper/[slug]/judge` evaluation questions
- `/paper/[slug]/recap` the whole paper in plain English
- `/paper/[slug]/results` score, rank, and the signup offer
- `/api/events` event intake

## What may and may not change

### Freely editable, content and design

- `app/(marketing)/**`, `app/library/**`, `app/account/**`
- All shared components, styling, layout, animation.

### Design-only — content is LOCKED

- `app/paper/[slug]/**` and everything under `content/papers/**`

On the paper experience you MAY change: visual design, typography, spacing,
colour, animation, transitions, responsive behaviour, component structure,
accessibility, and interaction polish.

You MAY NOT change, without being explicitly asked:

1. **Any paper text.** It is reproduced VERBATIM under its open licence. Never
   reword, summarise, shorten, modernise, fix spelling, or "clean up" the
   authors' text.
2. **The commentary** — explanations, quiz questions, judge questions, feedback,
   takeaways, the plain-English recap. These are pedagogically tuned. Do not
   rewrite for tone or brevity.
3. **The flow order:** Read → Check → Judge → Recap → Results.
4. **The scoring rules:** solo +8 XP, peek −5 from a bonus pool that floors at 0
   and never touches XP, quiz +20, judge +20 × confidence multiplier,
   wrong-while-confident −20, XP floors at 0.
5. **The three reading levels** (explorer / reader / critic), or the fact that
   the level changes ONLY the commentary, never the paper text.
6. **The honesty notice**, the licence attribution, or the link to the original.

If a content change seems necessary, say so and ask. Do not make it silently.

## Paper content rules

`content/papers/**` holds paper data in two tiers:

- **LOCKED, never edit:** everything in `source.json`, and the bibliographic
  fields of `meta.json`. This is the authors' published work, reproduced under
  its open licence.
- **EDITABLE ON REQUEST ONLY:** `explanations.json`, and the teaching fields of
  `meta.json` such as the practice goal. This is FirstPaper's own writing.

Explanations are keyed by the paragraph ids in `source.json`. If those ids stop
lining up, the commentary is silently attached to the wrong paragraph, so check
them after any regeneration.
