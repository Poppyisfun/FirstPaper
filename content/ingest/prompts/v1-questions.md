# Writing questions and options — v1

**Version 1. Frozen 2026-10-09.**

Add `v2-questions.md` rather than editing this. An instruction file for a
Claude Code session, not a script.

---

## The gate

**The explanations must not STATE the answer, in substance, in any phrasing.**

That is the bar. It is *not* "a strong model cannot reconstruct it". A model
that knows CRISPR will always spot a false CRISPR claim, and a sixteen-year-old
will not. Reconstructing an answer from a good explanation is not evidence a
reader will.

CI fails when more than 1 of 10 is answerable from the explanations alone.

---

## Option shape is the recurring failure, not content

Three rounds were lost to this on the first paper. The problem was never that
an option said too much. It was that the **set gave itself away by shape**.

Measured on the first paper before it was fixed:

- the correct option was the **longest of three in 16 of 17** prediction sets
- "pick the hedged one" paid on **16 of 17**

Pick-the-longest would have scored 94% without reading anything. A reader
learns that inside two papers and stops reading the paper.

**Prose instructions to a generator do not survive at volume.** A pass told in
plain words to vary the shape still produced 16 of 17. Anything that must hold
across every item gets enforced in code with rejection and retry. See
`predictions.py`, which cycles an assigned length rank and register per
paragraph and rejects replies that miss.

### Rules for a set of options

1. Every option is a confident, concrete statement. No option is vague,
   hedged into meaninglessness, or obvious filler.
2. No option is eliminable without reading the paragraph. If one can be
   discarded on length, vagueness or tone alone, the set measures nothing.
3. All options within about 1.5× the shortest by word count.
4. The correct option is **not** reliably the longest, the most detailed, or
   the most cautious. Vary it deliberately across a paper.
5. Distractors are **believable misreadings**, built from the paragraph's own
   subject matter: swap which thing causes which, change what was measured,
   change the result, or claim something the paragraph sets up but does not
   deliver. The strongest distractor describes a real procedure from
   elsewhere in the same paper.

---

## What the blind test tells you, and what it does not

`predictions.py verify` sends the options with no paragraph and no notes. It
flags three different things and they need opposite responses.

| Flag | Example of the model's reason | Actionable? |
|---|---|---|
| **shape** | "the only option with concrete detail; the others are vague paraphrases" | **Yes. Fix it.** A reader can use this. |
| **corpus** | "reads like a methods section"; "typical of invented distractors" | No. Needs having read thousands of papers. |
| **knowledge** | "C misstates Cel-1 chemistry"; "biologically implausible" | No. A distractor has to be false to be a distractor. |

**Gate on shape only.** Record the other two and move on. Chasing them means
flattening options until an expert cannot sort them, which means they are no
longer about the paragraph.

---

## Writing the two rounds

### Check — did the reading land

Five questions, four options, no penalty. Turn on what a paragraph said, not
on whether the reader agrees with it. Feedback explains the answer and names
why a plausible wrong one is wrong.

### Judge — does it hold up

Five questions, four options, each carrying exactly one of the seven tags.
Confidence is committed before the options are visible.

**Vary the register of the correct answer across the five.** If the correct
answer is the cautious one every time, a reader learns to pick the hedgy
option and the appraisal score measures nothing. Some correct answers should
be confident assertions, and some distractors should be **more** cautious than
the truth — plausible over-hedging is a real error mode and tests the same
judgement.

#### The seven tags

Exactly these. **Do not add an eighth** — per-tag calibration is the product,
and a tag added after papers are authored makes every earlier record partly
incomparable.

| Tag | The question it tests |
|---|---|
| `hedging` | Noticing when authors decline to settle something |
| `scope` | What the study actually established |
| `generalisation` | How far a result reaches beyond what was tested |
| `comparison` | Reading a result against a baseline |
| `denominator` | What a percentage is a fraction of |
| `confounding` | Whether something else could explain the result |
| `demonstration` | Whether a thing *can* happen, against how well it does |

---

## The tension with no clean resolution

**Any experiment we explain well enough to teach, we explain well enough to
test from.**

The recipe that beats a strict bar — ask about a named entity or exact
quantity we never mention — produces trivia. On the first paper the only
question that cleanly required the paper was "which promoters drove the
lengthened guides", answerable because U6 and H1 appear nowhere in our
commentary. It is also the least interesting question in the set.

**Prefer the question that teaches.** A slightly leaky question about whether
a claim outruns its evidence is worth more than an airtight one about a
reagent name.

---

## Pick papers that are not famous

A landmark paper makes the no-notes control nearly useless: the tester has
read it and answers from memory, so almost everything gets flagged and the
real leaks hide among the false ones.

It also cannot separate "our explanations gave it away" from "our explanations
let the model identify the paper, and then it answered from memory". A
question scoring 3/3 with notes and 0/3 with nothing can be either.

Weight towards solid, well-structured work that is not canonical.

