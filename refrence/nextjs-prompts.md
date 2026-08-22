# FirstPaper — HTML → Next.js conversion prompts

Run these **in order**, one at a time, in Claude Code. After each: `npm run dev`, check it, then `git add . && git commit && git push`.

**Before you start:** put the four HTML files in a `/reference` folder at your project root:
```
firstpaper/
  reference/
    index.html
    library.html
    about.html
    paper.html
```

---

## Step 0 — The rule that protects the paper page

Open `CLAUDE.md` and paste this at the bottom. **Do this first.** It's the guardrail that stops the paper content from getting "improved" later.

```markdown
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
```

Then tell Claude Code:

> Read CLAUDE.md, especially the section on what may and may not change. Confirm you understand the paper content is locked and only its design may be modified.

---

## Step 1 — Design system from the reference files

> Look at `/reference/index.html` and extract the shared design system into the project, following CLAUDE.md.
>
> 1. Load the four fonts via `next/font/google`: Instrument Serif (display), Space Grotesk (UI), Newsreader (reading), JetBrains Mono (labels/data). Expose each as a CSS variable.
> 2. Move the `:root` custom properties from the reference `<style>` block into `globals.css` exactly as they are — the semantic colours matter: green = comprehension, amber = scrutiny, violet = the game layer, blue = figures. Don't rename or "simplify" them.
> 3. Port the shared component styles (buttons, cards, nav, footer, grain texture, glow, reveal-on-scroll) into whatever styling approach fits this project — detect what's already set up rather than assuming.
> 4. Build `components/Nav.tsx` and `components/Footer.tsx` from the reference markup. Nav takes a `dark` prop (dark on landing and paper, light elsewhere) and an optional HUD slot.
> 5. Build `components/Reveal.tsx` — a client component wrapping children with the IntersectionObserver fade-up, with a `typeof IntersectionObserver === 'undefined'` guard and `prefers-reduced-motion` respected.
>
> Don't build any pages yet. Show me what you've set up, then stop.

---

## Step 2 — Landing page

> Convert `/reference/index.html` into `app/page.tsx`.
>
> Match the reference visually: dark hero with grain and layered radial glows, the cursor-following spotlight, the Instrument Serif headline with the italic accent word, the interactive demo strip (clicking the button highlights the phrase and reveals the explanation), the three-card Read/Check/Judge section, the dark stats strip with count-up numbers, and the origin quote.
>
> Split anything interactive into small client components; keep the page itself a server component where you can. All internal links use `next/link`.

---

## Step 3 — Library page

> Convert `/reference/library.html` into `app/library/page.tsx`.
>
> Move the `LIBRARY` array into `content/library.ts` as typed data. Build `components/PaperCard.tsx` with the mouse-tracking glow on hover. Cards link to `/paper/[slug]`; "coming soon" cards are visually disabled and not clickable.
>
> IMPORTANT, from CLAUDE.md: a card must never reveal whether a paper is flawed or what its verdict is. Cards sell the skill practised, never the outcome — discovering the flaw is the whole point of the product.

---

## Step 4 — About page

> Convert `/reference/about.html` into `app/about/page.tsx`. Straight port — keep all sections, the comparison cards, the numbered how-it-works steps, and the FAQ. Keep the copy as written; this page is content-editable later but I want it ported faithfully first.

---

## Step 5 — Paper data model (content locked)

> Set up the paper content as typed data, following the locked-content rule in CLAUDE.md.
>
> In `lib/types.ts` define:
> ```ts
> export type Tier = 'e' | 'r' | 'c';
> export interface Note { e: string; r: string; c: string }
> export interface Para { t: string; h?: string; n: Note }   // t = VERBATIM paper text
> export interface Figure { n: number; src: string; cap: string; x: string }
> export interface Section { n: string; paras: Para[]; figs: Figure[] }
> export interface Choice { t: string; c: 0 | 1; f: string }
> export interface QuizQ { q: string; o: Choice[] }
> export interface JudgeQ { mode: string; bk: string; q: string; th: string; o: Choice[]; tk: string }
> export interface Badge { k: string; ic: string; nm: string; ds: string }
> export interface Paper {
>   slug: string; meta: { title: string; authors: string; cite: string; url: string; licence: string };
>   sections: Section[]; quiz: QuizQ[]; judge: JudgeQ[]; plain: string; badges: Badge[];
> }
> ```
> Then copy `SECTIONS`, `QUIZ`, `JUDGE`, `PLAIN`, `BADGES` and `PAPER_META` from the `<script>` block in `/reference/paper.html` into `content/papers/dna-breakage-gamgfp.ts`, conforming to those types.
>
> **Copy the strings character for character.** Do not reword, re-punctuate, fix perceived typos, or reformat the prose. The `t` fields are the authors' published text under CC-BY; the `n`, `f` and `tk` fields are tuned teaching copy. If something looks like an error, flag it to me instead of changing it.
>
> The figures are currently base64 data URIs. Extract each to `public/figures/fig1.jpg` … `fig8.jpg` and change `src` to the public path.

---

## Step 6 — Paper experience

> Convert `/reference/paper.html` into `app/paper/[slug]/page.tsx`, reading from `content/papers/`.
>
> Build it as a client component driving these phases in order — **this order is locked**:
> `Intro → Read → Gate → Quiz → Judge → Plain English → Results`
>
> Port these behaviours exactly as they work in the reference:
> - **Intro screen**: the what-to-expect cards, the green-dot explainer, the reading-level picker, the honesty notice.
> - **Tier dial** in both the intro and the reading bar, kept in sync. Switching tier rewrites only the `n` note text. It must never alter the paper text.
> - **Green dot per paragraph**: first tap opens a "try it yourself first" prompt, not the answer. "I've got it" → +8 XP, dot turns violet with a check. "Show me anyway" → −5 from the bonus pool (floors at 0, never touches XP) and reveals the note in the right margin on desktop, inline below on mobile.
> - **Live tally**: solo / helped / skipped.
> - **Gate**: three different messages depending on engagement — zero engagement gets an honest warning, ≥80% gets praise, in between is neutral. Banks the remaining bonus. Offers "go back and read".
> - **Quiz**: 5 questions, +20 each, instant feedback, no penalty.
> - **Judge**: 5 questions. Options stay locked until a confidence wager is chosen. Correct = +20 × multiplier; wrong at 2× = −20; wrong at 1× = 0. Every answer shows the takeaway. Correct answers unlock the matching badge.
> - **Results**: rank from XP, three scores (comprehension / judgement / read-solo), badge grid.
> - Highlighter animation on `mark.t` when a paragraph is engaged.
> - Progress bar and XP/bonus chips in the nav HUD, with the pop animation.
>
> Use React state throughout — **no localStorage**, it isn't supported here. Mobile-first. Respect `prefers-reduced-motion`.

---

## Step 7 — Check it

> Run through the whole app and verify:
> 1. All 11 sections render with paragraph text intact and all 8 figures.
> 2. Switching reading level changes only the notes, never the paper text.
> 3. The green dot flow works: prompt first, then solo or show.
> 4. XP and bonus behave per the rules in CLAUDE.md, and neither goes negative.
> 5. The gate shows the right message for zero / partial / high engagement.
> 6. Judge options are locked until a wager is picked.
> 7. Everything works at 375px wide.
> 8. Every paper section links to the original DOI, and the honesty notice is on every page.
>
> Then diff `content/papers/dna-breakage-gamgfp.ts` against the `<script>` block in `/reference/paper.html` and confirm no string was altered. Report anything that differs.

---

## After it's running

`git push` and Vercel deploys it. From there:
- **Landing, library, about** — iterate freely on copy and design.
- **Paper** — design changes only. When you add papers, you're writing new data files in the same shape, not touching the components.
