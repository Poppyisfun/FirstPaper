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
- `predictions.json` — the three options shown before each explanation,
  generated from the authors' paragraph alone and never from our commentary
- `questions.json` — the check and judge rounds, with appraisal `tag` fields

`content/ingest/` holds the Python that generates these. It is not part of the
Next.js build and is excluded from TypeScript scanning.

### Confidence is a 0-100 slider

On the judge round the reader sets confidence on a 0-100 slider and commits it
**before the options become visible.** They cannot see what they are choosing
between while deciding how sure they are. That ordering is the whole point: a
confidence stated after seeing the options is a reaction to the options.

**Calibration gap = mean stated confidence minus actual accuracy on appraisal
questions.** A negative gap means underconfident, which is a real and
interesting result, not a failure.

The older two-way wager model (`Wager = 1 | 2`, "judge +20 x confidence
multiplier") is retired. Do not reintroduce it.

### The reading screen asks for a prediction, not a payment

Before our explanation appears, the reader picks one of three options for what
the paragraph says, and the explanation then appears and stays. There is no
bonus counter and no charge for help. Charging for an explanation taught
readers to avoid explanations; a prediction measures whether the reading landed
and costs nothing to get wrong.

`prediction_made` is the difficulty signal, replacing `explanation_requested`.

### Rank thresholds are provisional and per paper

Explorer 0 / Reader 110 / Critic 220 / Peer Reviewer 310, set against a
perfect-play ceiling of 336 on the first paper. The previous 380 for Peer
Reviewer could not be reached by anyone.

**Ranks should be cumulative across papers once accounts exist**, and these
numbers must be revisited then: a threshold calibrated to one paper's ceiling
is the wrong basis for a total across several.

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

## Writing questions and options

Three rules learned the hard way on this project. Breaking any of them has
produced a round that looked fine and measured nothing.

### Option shape has been the recurring leak, not content

The failure has never been that an option said too much. It is that the set
gave itself away by **shape**: the correct answer was the most cautious, or the
most specific, or the longest, every time. A reader learns that inside two
papers and stops reading the paper.

**Any set of options must be checked for answerability from shape alone** —
send the options with no paragraph and no notes and see whether a model can
still sort them. If it can, the set is rejected regardless of how good the
content is. `content/ingest/predictions.py verify` does this for the reading
round; `verify_questions.py` does it for check and judge.

Prose instructions to the generator are not sufficient. A pass that asked for
varied shape in words still put the correct option at the longest of three in
sixteen of seventeen sets. The constraint has to be enforced programmatically
and the result measured.

### The blind test flags two different things, and only one is ours

Sending options with no paragraph and no notes catches two kinds of hit, and
they need opposite responses.

**Shape and register tells are ours to fix.** When the model says it chose
because one option was "the most detailed", "hedged", or "reads like a paper",
that is a defect in how the set was written and a reader will learn it too.

**Domain-knowledge detection is a confound of testing with a model, and is not
actionable.** When the model says the other options "contain factual errors" or
"state the opposite of known biology", it is using what it knows about the
field. A distractor has to be factually wrong to be a distractor. A
sixteen-year-old cannot spot that, and flattening the options until an expert
cannot either would mean they were no longer about the paragraph.

Gate on the first. Record the second and move on.

### Prose constraints on generated content do not survive at volume

Anything that must hold across every item gets enforced in code, with rejection
and retry — not described in the prompt and hoped for.

The evidence: a generation pass that was told in plain words to vary which
option was correct still produced the correct answer as the longest of three in
**sixteen of seventeen sets**. Pick-the-longest would have scored 94% without
reading anything. Cycling an assigned length rank per paragraph and rejecting
replies that missed it fixed it in one pass. The same now applies to register.

### Register enforcement stops at keyword level, deliberately

The exploitable heuristic is dead and that was the goal. "Pick the hedged
option" paid on 16 of 17 sets before the constraint and pays on 6 of 17 after
it, which is no better than guessing.

What still trips the blind test is a model recognising synthetic text — it has
read enough real papers to tell an authored distractor from a real finding.
**No student has that corpus.** That is domain detection wearing shape's
clothes, not an exploitable tell.

Do not build a model-based register classifier, and do not reopen this without
evidence from a real reader exploiting a real tell.

### Watch the hedging of distractors on paper two

Across the seventeen prediction sets on the first paper, the correct option
was the strictly **least** hedged **zero** times. Longest and most-hedged both
came out near chance (7/17 and 6/17 against a 1-in-3 baseline), so there is no
tell a reader could exploit, and this one is not exploitable either: the hedge
counts are 0-3 and usually tied, so "it is not the bluntest" is not a strategy.

It does mean our distractors carry blunt overclaims more often than the truth
does. Harmless at one paper. Check it again on the second, because a reader
who meets it twice may start to feel it even if they could not name it.

### The notes must not STATE the answer

The gate for a comprehension question is that our explanations do not state the
answer, in substance, in any phrasing. It is **not** that a strong model cannot
reconstruct it. A model reconstructing an answer from a good explanation is not
evidence that a sixteen-year-old will.

The behavioural run stays as a reported diagnostic, not a gate.

### Any experiment we explain well enough to teach, we explain well enough to test from

This is the real tension and it does not have a clean resolution. The recipe
that beats a strict bar — ask about a named entity or an exact quantity we
never mention — produces trivia, and trivia is worse than a slightly leaky
question. Prefer the question that teaches.

### Prefer well-constructed but less famous papers

A landmark paper makes the no-notes control arm nearly useless. The tester model
has read it, so it answers from memory and almost everything gets flagged, which
hides the real leaks among the false ones.

There is a second limitation worth knowing: on a famous paper the control cannot
separate "our explanations gave it away" from "our explanations let the model
identify the paper, and then it answered from memory". A question scoring 3/3
with notes and 0/3 with nothing can be either.

When selecting future papers, weight towards solid, well-structured work that is
not canonical.

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
