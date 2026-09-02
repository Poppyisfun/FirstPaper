# FirstPaper — build the interactive paper experience

Hand this whole file to Claude Code. The static paper page already renders correctly
from `content/papers/`. This adds the interactive layer on top of it.

**Do not change anything in `content/papers/`.** Every string below already exists in
the data. If something you need seems missing, say so — don't invent it.

---

## What exists now

`app/paper/[slug]/page.tsx` renders the paper statically: 11 sections, 57 paragraphs
of verbatim text, 8 figures, metadata, honesty note. Keep all of that.

## What's missing

Everything interactive. The data already contains, unused:

| Field | What it is | Count |
|---|---|---|
| `para.n.e / .r / .c` | plain-language note at 3 reading levels | 57 × 3 |
| `fig.x` | "how to read this figure" explainer | 8 |
| `quiz[]` | comprehension questions | 5 |
| `judge[]` | critical-thinking questions with takeaways | 5 |
| `plain` | plain-English recap of the whole paper (HTML) | 1 |
| `badges[]` | skill badges, keyed to `judge[].bk` | 5 |

---

## Architecture

Convert the paper route into a **client component** driving a phase machine.
Keep data loading in the server component and pass the `Paper` object down as a prop.

```
app/paper/[slug]/
  page.tsx              server — getPaper(slug), generateStaticParams, passes paper down
  PaperExperience.tsx   client — phase state, owns all progress
  phases/
    IntroPhase.tsx
    ReadPhase.tsx
    GatePhase.tsx
    QuizPhase.tsx
    JudgePhase.tsx
    PlainPhase.tsx
    ResultsPhase.tsx
  components/
    TierDial.tsx
    Paragraph.tsx       verbatim text + green dot + think prompt + note
    FigureBlock.tsx     image + verbatim caption + explainer
    QuestionCard.tsx    shared by quiz and judge
    ProgressHUD.tsx     progress bar + XP + bonus chips
```

Phase order — **locked**:
`intro → read → gate → quiz → judge → plain → results`

### State (all in `PaperExperience`, React state only — no localStorage)

```ts
type Phase = 'intro'|'read'|'gate'|'quiz'|'judge'|'plain'|'results';
type Tier = 'e'|'r'|'c';

const [phase, setPhase]   = useState<Phase>('intro');
const [tier, setTier]     = useState<Tier>('r');
const [sec, setSec]       = useState(0);        // section index
const [xp, setXp]         = useState(0);
const [bonus, setBonus]   = useState(60);
const [solo, setSolo]     = useState<Set<string>>(new Set());  // "sectionIdx-paraIdx"
const [peek, setPeek]     = useState<Set<string>>(new Set());
const [qIdx, setQIdx]     = useState(0);
const [jIdx, setJIdx]     = useState(0);
const [quizScore, setQuizScore]   = useState(0);
const [judgeScore, setJudgeScore] = useState(0);
const [earned, setEarned] = useState<Set<string>>(new Set()); // badge keys
```

`totalParas` = sum of `paras.length` across sections (57).

---

## Scoring — implement exactly

| Event | Effect |
|---|---|
| Mark a paragraph "I've got it" | **+8 XP** |
| Reveal a note ("show me anyway") | **−5 bonus.** Floors at 0. Never touches XP. |
| Reach the gate | remaining `bonus` is added to XP |
| Correct quiz answer | **+20 XP** |
| Wrong quiz answer | **0.** No penalty ever. |
| Correct judge answer | **+20 × wager** (wager is 1 or 2) |
| Wrong judge answer at wager 2 | **−20 XP** |
| Wrong judge answer at wager 1 | **0** |

XP floors at 0 — never show a negative number.

Ranks by final XP: `< 140` Explorer · `140–259` Reader · `260–379` Critic · `≥ 380` Peer Reviewer.

---

## Phase 1 — Intro (before the paper)

A pre-flight screen. Full-width card above the paper. Contains:

**Heading:** "You're about to read a real research paper. All of it."
**Lede:** not a summary — the actual published text, figures included. It will feel hard
in places. That's the point.

**Three cards side by side:**
- *What makes this different* — every other AI tool makes papers easier to **believe**;
  this teaches you to **judge** whether a paper deserves believing.
- *What you'll actually do* — Read / Check / Judge / Recap, one line each.
- *What you'll walk away able to do* — read a verb as a hedge, say what a control is for,
  spot a small sample and what rescues it, read a figure before the conclusion, check who paid.

**The green-dot explainer** — a distinct green panel, this is the most important block:
- An animated demo dot (gentle 2.4s bob).
- "Every paragraph has a green dot beside it. The dot is help, and help is always
  available — but it asks you to try first."
- Tapping doesn't reveal the answer. It opens a prompt: *say this paragraph back in your
  own words.* Then two choices:
  - **I've got it** → +8 XP. "This is the one worth chasing."
  - **Show me anyway** → costs 5 from your insight bonus, never from XP, never below zero.
- Closing warning, styled distinctly: **"Asking for help is never wrong.** The explanations
  exist because papers are genuinely hard. But **skipping a paragraph entirely earns you
  nothing at all** — the dots are how you engage with the reading."

**Reading-level picker** (the `TierDial`, full size here) with a one-line description of
the selected level:
- Explorer — "Plain language, short sentences, no jargon. Built for a curious middle schooler."
- Reader — "AP-level depth. Explains the reasoning behind each move, not just the meaning."
- Critic — "Early-undergraduate reading. Technical terms kept, with the methodological subtext made explicit."

**Honesty promise**, dashed border: FirstPaper can be wrong; the paper text and figures are
the authors' work; everything in green, amber and violet is our commentary; every section
links to the original; checking us is part of the exercise.

**CTA:** "Start reading →" and under it "11 sections · 8 figures · about 25 minutes".

---

## Phase 2 — Read

One section at a time. Header shows "Section N of 11" + section name.

**Sticky reading bar** above the paper containing:
- A compact `TierDial` (kept in sync with the intro one — same state).
- A live tally on the right: `N solo · N helped · N skipped`.
  "Skipped" = paragraphs in sections you've already passed that you neither marked solo nor revealed.

**Each paragraph** (`Paragraph.tsx`):
- Verbatim `para.t` rendered with `dangerouslySetInnerHTML` — it contains `<i>`, `<sub>`,
  `<sup>` and `<mark class="t">`. Never alter this text.
- `para.h`, when present, renders as a subheading above it.
- A **green dot button** absolutely positioned in the left gutter (`left: -29px`), 21px,
  circular, green border, `?` inside. Scale 1.25 on hover.
- **First tap** → opens the *think prompt*, not the note:
  > ◆ Try it yourself first
  > Say this paragraph back in your own words, in your head. Did it make sense?
  > [ I've got it · +8 XP ]  [ Show me anyway · −5 bonus ]
- **"I've got it"** → dot turns violet with a `✓`, +8 XP, prompt closes, note never shown.
- **"Show me anyway"** → dot fills solid green, −5 bonus, and `para.n[tier]` appears:
  - **Desktop (>900px):** in the right margin column, vertically aligned with its paragraph.
  - **Mobile:** inline directly beneath the paragraph.
- Once resolved either way, the dot is inert.
- When a paragraph is resolved, animate its `mark.t` — amber highlight sweep with a
  0.55s transition on background and box-shadow.

**Changing tier** rewrites every visible note to `para.n[newTier]`.
It must **never** alter `para.t`. This is the single most important rule on this page.

**Figures** (`FigureBlock.tsx`) render after their section's paragraphs:
- `next/image` from `fig.src`
- `fig.cap` — the authors' caption, verbatim, in a serif face
- `fig.x` — our "how to read it" explainer, visually distinct (blue accent, left border)

Under each section: a source line linking to `paper.meta.url` — "Verbatim from the paper ·
read this section in the original ↗".

Back / Next at the bottom. Next on the last section → gate.

---

## Phase 3 — Gate

Computes `engaged = solo.size + peek.size`, `skipped = totalParas - engaged`,
`pct = engaged / totalParas`. Banks the remaining bonus into XP.

**Three different messages — this matters:**

- **`engaged === 0`** (warn styling, amber border):
  > You went through all 57 paragraphs without touching a single dot. That's allowed — but
  > it means nothing here is checking whether the reading landed, and the quiz is about to
  > be brutal.
  >
  > The dots aren't a penalty. They're the part where you find out whether you actually
  > understood a paragraph or just moved your eyes over it. Worth going back for.

- **`pct >= 0.8`** (good styling, green border):
  > You engaged with **N of 57** paragraphs — **N** on your own, **N** with help.
  > That's thorough reading. The paragraphs you cracked yourself are the ones that'll still
  > be there next week.

- **otherwise** (neutral):
  > You engaged with **N of 57** paragraphs — **N** solo, **N** with help, and **N** skipped past.
  > Asking for help was never the problem; skipping is where understanding leaks. Still,
  > you've got enough to work with.

Below: a 4-cell stat row — Solo / With help / Skipped / Bonus banked.
Two buttons: **Go back and read** (returns to read phase) and **Start the quiz →**.

---

## Phase 4 — Quiz

Five questions from `paper.quiz`, one at a time. Progress pips above.

`QuestionCard`: question, options as full-width buttons. On click — lock all options, mark
the chosen one correct (green) or wrong (red), dim the rest, show `option.f` as feedback in
a matching tinted panel. Correct → +20 XP. Wrong → nothing lost, and the feedback still
explains. "Next question" appears only after answering.

---

## Phase 5 — Judge

Five questions from `paper.judge`. Same card, amber-tinted, plus two additions.

**The confidence wager**, in a violet panel above the options:
> ◆ How sure are you?
> [ Just guessing · 1× ]  [ Pretty sure · 2× ]
> Guess honestly and a wrong answer costs nothing. Claim certainty and miss, and you lose
> 20 XP. Knowing how sure you are is a scientific skill too.

**Options stay disabled and at 40% opacity until a wager is picked.** This is deliberate —
it forces a metacognitive beat before answering. Don't remove it.

Also show `judge.th` (the "think about it this way" nudge) in italic amber under the question,
and `judge.mode` as a small tag in the card header.

After answering, feedback always ends with the takeaway:
> **Carry this to the next paper**
> {judge.tk}

Correct answer → +20 × wager, and unlock the badge whose `k` matches `judge.bk`.

---

## Phase 6 — Plain English

Render `paper.plain` (HTML) in a wide reading card. Serif body, and style the `.pull`
blockquotes inside it with a green left border. Single button: "See how you did →".

---

## Phase 7 — Results

- **Rank card** — dark, with a radial violet glow: rank name large in the display serif,
  "N XP earned on this paper" beneath.
- **Three score tiles:** Comprehension `quizScore/5` (green), Judgement `judgeScore/5`
  (amber), Read solo `solo.size/57` (violet).
- **A line of feedback** keyed to rank:
  - Peer Reviewer — "You read it, understood it, and judged it on its own terms. That's what scientists do to each other's work."
  - Critic — "You're reading like a critic — catching hedges, controls and limits. One more paper at this level and it's a habit."
  - Reader — "Solid reading. Push harder on the judging round next time — that's where the real skill lives."
  - Explorer — "Good start. The judging round is the part worth replaying."
- **Badge grid** from `paper.badges` — unlocked ones full opacity with violet tint and their
  `ds` description; locked ones at 38% opacity reading "Locked".
- Buttons: "Read it again" (reset state) and "Next paper →" (to `/library`).

---

## The HUD

In the nav bar, visible only on the paper route:
- Progress bar. Suggested mapping: intro 0 · read 4→40 · quiz 40→65 · judge 65→90 · plain 92 · results 100.
- A label: "Reading · 3 of 11", "Quiz · 2 of 5", etc.
- **Bonus chip** (amber): `◆ N bonus`
- **XP chip** (violet): `◆ N XP`
- On change, the chip pulses (scale 1.18, 0.5s) and a small `+8` / `−5` floats upward and fades.

---

## Design

Use the tokens already in `globals.css`. The semantic colour system is load-bearing:

- **green** = comprehension — notes, "read" affordances, correct answers
- **amber** = scrutiny — judging round, warnings, the highlighter
- **violet** = the game layer — XP, badges, wagers, solo marks
- **blue** = figures

Keeping these separate is what stops the points from visually contaminating the scientific
judgements. Don't merge or re-map them.

Type: Instrument Serif for display headings, Newsreader for paper text and notes,
Space Grotesk for UI, JetBrains Mono for labels and numbers.

Paper text: 17px, line-height 1.78, colour `--ink-2`, darkening to `--ink` when the
paragraph is resolved.

Motion: purposeful only. This is a long-form reading interface — no parallax, no
scroll-scrubbing, no background animation behind the paper text. The one moment worth
animating richly is the highlighter sweep when a paragraph resolves.

---

## Requirements

- **No localStorage / sessionStorage** — not supported. React state only.
- **Mobile-first.** Test at 375px. Margin notes collapse inline below 900px.
- **`prefers-reduced-motion`** disables all transitions and animations.
- Every interactive element is a real `<button>` with an accessible label. The green dot
  needs `aria-label="Explain this paragraph"` and `aria-expanded`.
- Phase changes move focus to the new heading so keyboard and screen-reader users aren't stranded.
- Figures keep meaningful `alt` text.
- `paper.meta.url` stays linked from every section and from the header.
- The honesty notice stays visible on every phase.

---

## When you're done

Verify and report:
1. All 11 sections and 8 figures still render, text unchanged.
2. Switching reading level changes only notes, never paper text.
3. Green dot: prompt first, then solo or reveal. Dot inert afterwards.
4. XP and bonus follow the table exactly; neither goes negative.
5. Gate shows the right one of three messages — test with 0 engagement and with all 57.
6. Judge options are locked until a wager is chosen.
7. Badges unlock only from correct judge answers, matched by `bk`.
8. Works at 375px.
9. `node scripts/verify-content.js` still reports content intact.

Build it in one pass, then show me. If any part of this spec conflicts with the data,
stop and tell me rather than improvising.
