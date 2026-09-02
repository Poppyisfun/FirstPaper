# FirstPaper — paper content

Drop these into your Next.js project, preserving the folder structure:

```
firstpaper/
  lib/types.ts
  content/papers/dna-breakage-gamgfp.ts
  content/papers/dna-breakage-gamgfp.lock.json
  content/papers/index.ts
  scripts/verify-content.js
  public/figures/fig1.jpg … fig8.jpg
```

**Contents:** 11 sections · 57 paragraphs · 2,894 verbatim words · 8 figures ·
5 quiz questions · 5 judge questions.

## Two tiers, two different rules

Not everything in this file is the same kind of thing.

### Editable — this is your writing
- The three-tier notes (`n.e`, `n.r`, `n.c`)
- Quiz questions, options, feedback
- Judge questions, options, feedback, takeaways
- Figure explainers (`x`)
- The plain-English recap (`plain`)

Tune these freely. You'll want to once real students use it — a note that
confuses people, a distractor nobody picks, a takeaway that doesn't land.
The checker reports changes here but never blocks them.

### Locked — these are the authors' words
- Paragraph text (`t`)
- Subheadings (`h`)
- Figure captions (`cap`)
- Paper metadata (`meta`)

Reproduced verbatim under CC-BY. Editing them breaks the licence and quietly
falsifies FirstPaper's core promise — that students are reading the real
paper and can check it against the original. The checker fails on any change
here.

## Using it

```bash
node scripts/verify-content.js          # check
node scripts/verify-content.js --diff   # list which teaching strings changed
node scripts/verify-content.js --update # accept your edits as the new baseline
```

Typical output after you've been editing notes:

```
11 sections · 57 paragraphs · 8 figures · 5 quiz · 5 judge

Teaching copy: 3 edited, 0 added, 0 removed — that's fine, it's yours.
    (run with --diff to list them)
    Accept these: node scripts/verify-content.js --update

Paper text: intact. The authors' words are unmodified.
```

And if the paper text gets touched:

```
PAPER TEXT CHANGED — these are the authors' words, reproduced under CC-BY.
  Modified:
    s0.p0.t
Check it against the original: https://doi.org/10.7554/eLife.01222
```

Key format: `s2.p3.t` = section 3, paragraph 4, paper text.

## Make it automatic

In `package.json`:

```json
"scripts": {
  "verify": "node scripts/verify-content.js",
  "build": "node scripts/verify-content.js && next build"
}
```

Now the build fails if the authors' text drifts, but never for your own copy
edits. Practically: you can rewrite notes all day and deploy normally, and the
one thing you can't do by accident is misquote the paper.

## Replaces Step 5 in nextjs-prompts.md

> I'm adding the paper content as pre-built files rather than having you write it.
>
> 1. I've placed `lib/types.ts`, `content/papers/*`, `scripts/verify-content.js`
>    and `public/figures/fig1–8.jpg` in the project.
> 2. Read `lib/types.ts` and `content/papers/index.ts` so you know the shape.
> 3. Within `content/papers/`, you may edit the teaching copy — the `n` notes,
>    quiz, judge questions, feedback, takeaways, figure explainers `x`, and
>    `plain` — but only when I ask for a copy change.
>    Never edit the `t`, `h`, `cap` or `meta` fields: those are the authors'
>    text under CC-BY.
> 4. Add `"verify": "node scripts/verify-content.js"` to package.json scripts and
>    prepend it to `build`.
> 5. Run `npm run verify` and show me the output. Then stop.

Steps 0–4 and 6–7 are unchanged. Also update the CLAUDE.md block from Step 0:
the paper page is design-editable, its teaching copy is editable on request,
and the authors' text is never editable.

## Adding a paper later

New file in `content/papers/` in the same shape, add it to the array in
`index.ts`, then `node scripts/verify-content.js --update` to fingerprint it.
No component changes.
