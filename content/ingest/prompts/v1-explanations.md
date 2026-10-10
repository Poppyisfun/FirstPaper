# Writing explanations — v1

**Version 1. Frozen 2026-10-09. Supersedes nothing.**

Change this file by adding `v2-explanations.md`, not by editing v1. Papers
record which prompt version authored them, and a silently edited prompt makes
two papers written months apart incomparable without anyone noticing.

This is an instruction file for a Claude Code session, not a script that calls
an API. Read it, then write the explanations by hand into `paper.json`.

---

## The two rules

### 1. 60–75% of the paragraph's word count, never longer

Count the words in `source_text`. The explanation lands between 60% and 75% of
that.

The ceiling is hard: CI fails the build on anything over 75%. An explanation
longer than the paragraph has stopped explaining and started replacing, and a
reader who can get everything from the right-hand column will stop reading the
left one.

The floor is a target, not a rule. Where a paragraph is three sentences of
buffer solution and a centrifuge speed, say what it was for in one sentence
and stop. **Do not pad to reach 60%.** Padding is how commentary turns into
filler, and filler is the thing readers learn to skip.

### 2. Thin out what the reader has to earn

The questions must not be answerable from the commentary alone. That is the
whole design: if our explanations are sufficient, the paper is decorative and
this is a summariser with a quiz bolted on.

So the explanation withholds:

- **Exact figures.** "They report an efficiency figure", not "6–8%".
- **Named entities.** "A human gene", not "CLTA". "A human cell line", not
  "HEK293T". "An older cutting tool", not "zinc-finger nucleases".
- **Quantities and denominators.** "They checked what fraction of cells took
  the DNA up", not "30–50%".
- **The authors' hedge words.** Do not quote "suggest", "indicates", or
  "appears". The reader should find those themselves.
- **Conclusions the paragraph builds to.** Describe the four conditions and
  what each produced; do not state what the comparison proves.

It does **not** withhold the reasoning. Explain the logic of an experiment
fully. A reader who understands why the control exists but has to go to the
paper for what it showed is exactly the reader we want.

---

## The trap that catches this every time

**Removing a specific is not the same as removing the hedge around it.**

Thinning a paragraph and leaving a flat assertion makes our commentary *more*
confident than the science it describes. This happened three times on the
first paper and was only caught by auditing for it:

| The authors wrote | We wrote | The problem |
|---|---|---|
| "These results **suggest**… although more quantitative comparisons will be necessary" | "The longer guides cut more. That is the result on offer" | We asserted what they declined to settle |
| "a positive signal… **indicates** that cleavage has occurred" | "A signal **means** the site was cut" | An inference chain collapsed into a fact |
| "is **indicative of** Cas9-mediated cleavage" | "**means** Cas9 cut where it was supposed to" | Same |

After thinning, read your explanation beside the paragraph and ask: **am I
more certain than they are?** If yes, put the uncertainty back without putting
the hedge word back. "Take that as a lead rather than a settled result" does
the job; "the authors say 'suggest'" gives away the question.

---

## Templates by section

The job changes with the section. Use the matching one.

### Abstract

The abstract is an orientation step, not paragraph one. Say what it is — the
whole paper compressed, written for other scientists — and that it is dense on
purpose and the reader is not expected to follow it yet. Name the claims it
makes so the reader can carry them forward, without evaluating them.

### Introduction — *what problem, and why this approach*

What was already known, what was missing, and why anyone tried this. Keep the
prior work at the level of "a tool existed but had a drawback"; the specific
drawback is often a question.

### Methods — *what they did and why they did it that way*

The **why** is the part worth writing. "They broke the cells open and gave the
soup a piece of target DNA" is a description; "which lets them test the
machinery outside a living cell where the amounts can be controlled" is an
explanation. A reader who understands why a control exists can evaluate the
result; one who knows only the protocol cannot.

Withhold reagent names, concentrations, temperatures, and kit brands unless
the choice carries meaning.

### Results — *what this number means, not what it is*

Say what was measured and what a reading of it would indicate. Do not state
the reading. "Figure 1E shows that signal" rather than "Figure 1E shows 6–8%
editing".

Where the authors ran several conditions, name the conditions and let the
comparison be the reader's work: "Four conditions, four outcomes. The
differences between them are the finding."

### Discussion — *is this claim bigger than the evidence*

The one section where our commentary should point at the gap rather than only
explain. Name what the authors are claiming and what kind of claim it is — a
result, a proposal, or a convenience argument. Flag where a proposal is
dressed as a finding, without saying which of the two a given sentence is when
that is the question.

---

## Cautions

A `caution` is a separate field, not a sentence in the explanation. It flags
where a claim outruns its evidence.

**Three or four per paper. Not more.** A caution on every paragraph is a
caution on none. If more than a quarter of paragraphs have one, the bar is
too low.

Write it as a prompt to the reader, not a verdict: "Notice how many genes and
how many cell types are in play" rather than "this result does not
generalise".

---

## Few-shot examples

These are the approved explanations from the CRISPR paper. **They are the
quality bar.** Match this register: plain words, short sentences, second
person where it helps, no jargon the paragraph has not introduced.

### Methods, 54% — short because the paragraph was short

> Paragraph (49 words): "HEK293T, transfected with the Cas9-HA-NLS-GFP
> expression plasmid, were harvested and lysed 48 hr post transfection as
> above. 5 μl of lysate were electrophoresed on a 10% SDS polyacrylamide gel,
> blotter onto a PVDF membrane and probed with HRP-conjugated anti-HA
> antibody…"

> **Explanation (27 words):** "Checking the protein is actually there. Cells
> were burst open, their contents run down a gel, and a tag-binding antibody
> used to show the Cas9 protein had been made."

Note what is gone: the cell line, the plasmid name, the gel percentage, the
antibody supplier. Note what is kept: why you would do this at all.

### Results, 72% — the reasoning kept, the finding withheld

> **Explanation:** "Now the real question: does anything actually get cut? You
> cannot watch a cut happen, so they looked for its scar. A cell repairing a
> double-strand break by glueing the ends together often loses or gains a few
> letters. They copied the target region out of many cells, mixed the copies
> so strands from different cells could pair, and added an enzyme that cuts
> only where two strands disagree. A signal means some copies differ from
> others, which the authors read as a cut clumsily repaired. Follow that chain
> rather than the conclusion. Figure 1E shows the signal. A tool already known
> to cut this region ran alongside it."

The assay is explained completely. The gene is not named, the comparison tool
is not named, no number appears, and "which the authors read as" keeps our
certainty level with theirs.

### Discussion, 59% — the rhetorical move named, the verdict withheld

> **Explanation:** "…They report an efficiency figure for editing at their
> target, and set it against the older tool. They state where they think the
> limit on performance lies, and list ideas for lifting it: better guide
> design, more of it, protective additions to the guide's ends. Those are
> proposals, not results. The claim worth watching is the last one. They argue
> their system is the better one because changing target means rewriting a
> short RNA instead of engineering a new protein. That is a fair point about
> convenience, and they place it directly beside the efficiency comparison.
> Easier to aim is not the same as better at cutting."

The figure, the comparison's verdict and the bottleneck are all withheld. What
is given is the shape of the argument, which is what a reader needs to judge
it.
