@AGENTS.md

## FirstPaper — project context

FirstPaper is a web app that teaches teenagers to read AND critically judge
scientific research papers (genetics/biology), section by section.
## Design
For any UI work, use the high-end-visual-design skill for aesthetic direction,
and motion-framer / gsap-scrolltrigger / locomotive-scroll for animation.
Landing page: full cinematic treatment — hero motion, scroll reveals, depth.
Walkthrough pages: restrained, purposeful motion only. It's a long-form
reading interface where students sit with dense scientific text — no parallax
behind paper text, no scroll-scrubbing during reading. Motion should serve
one beat: the highlighter swipe when Judge unlocks. Always respect
prefers-reduced-motion.
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
Source of truth is the `:root` block in app/globals.css. Tailwind tokens are
mapped onto those same CSS variables via `@theme inline`, so never redefine a
colour in one place only.

Colors (semantic — use consistently):
- bg #FAF9F6 · surface #FFFFFF · ink #0A0E14 · ink-2 #28323D · soft #68737F
- line #E6E4DC · line-2 #F0EEE7
- GREEN #0B7A5C = comprehension / "read" / passing a check (soft #E3F1EA, line #B4DCCB)
- AMBER #A9640D = scrutiny / "judge" / a flaw to notice (soft #FAEDD7, line #E8CB97)
- VIOLET #5B4BD6 = the game layer: XP, wagers, badges (soft #EDEAFC, line #CCC4F5)
- BLUE #22557E = figures and figure explanations (soft #E5EEF6, line #BFD4E5)
- RED #AE3636 = a failed evaluation check, verdict only (soft #F8E4E1)
Green always means "here's what it says"; amber always means "here's what to question."

Fonts (via next/font/google, all variable):
- Fraunces — display: hero, section titles, stat numbers. Set the axes with
  --fv-xl / --fv-lg / --fv-sm; WONK 1 is what gives it its character.
- Bricolage Grotesque — all UI: nav, buttons, labels, body chrome
- Literata — reading content only: paper excerpts and "Read" explanations
- Geist Mono — eyebrows, tags, HUD chips, numeric readouts

Motion: Motion (framer-motion v13) drives everything. Use the shared primitives
in components/motion-primitives.tsx (Rise, Stagger, RiseItem, springSoft,
springSnappy) rather than hand-rolling variants, so timing stays consistent and
prefers-reduced-motion is handled in one place.

Feel: generous whitespace, nested "double-bezel" cards (26px outer / 20px inner),
one clear action per screen, calm and legible like a reading app — not a dashboard.

### Pages
- /                       landing
- /library               browse papers
- /paper/[slug]          paper intro / pre-flight (tier selector, "Begin")
- /paper/[slug]/walkthrough   the Read→Check→Judge flow + verdict + results
- /about                 mission, method, honesty, origin story
## FirstPaper — what may and may not change

### Freely editable (content AND design)
- app/page.tsx (landing)
- app/library/page.tsx
- app/about/page.tsx
- All shared components, styling, layout, animation.
Copy, sections, ordering and visuals on these three pages are open to iteration.

### DESIGN-ONLY — content is LOCKED
- app/paper/[slug]/** and everything under content/papers/**

On the paper experience you MAY change: visual design, typography, spacing,
colour, animation, transitions, responsive behaviour, component structure,
accessibility, and interaction polish.

You MAY NOT change, without me explicitly asking:
1. Any paper text. It is reproduced VERBATIM under CC-BY. Never reword,
   summarise, shorten, modernise, fix spelling, or "clean up" the authors' text.
2. The plain-language notes, quiz questions, judge questions, feedback,
   takeaways, rubric or the plain-English summary — these are pedagogically
   tuned. Do not rewrite for tone or brevity.
3. The flow order: Intro → Read → Check → Judge → Plain English → Results.
4. The scoring rules: solo +8 XP, peek −5 from a bonus pool that floors at 0
   and never touches XP, quiz +20, judge +20 × confidence multiplier,
   wrong-while-confident −20, XP floors at 0.
5. The three reading tiers (explorer / reader / critic) or the fact that the
   tier changes ONLY the note, never the paper text.
6. The honesty notice, the CC-BY attribution, or the link to the original paper.

If a content change seems necessary, say so and ask. Do not make it silently.
## Paper content rules
content/papers/** holds paper data. Two tiers:
- LOCKED, never edit: the `t`, `h`, `cap` and `meta` fields. These are the
  authors' published text reproduced verbatim under CC-BY.
- EDITABLE ON REQUEST ONLY: `n` notes, quiz, judge, feedback, takeaways,
  `x` figure explainers, `plain`. This is FirstPaper's teaching copy.
Run `node scripts/verify-content.js` after touching this folder.
The paper page itself (app/paper/**) is freely editable for design, layout,
animation and UX — but not for content or flow order.
