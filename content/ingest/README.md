# The paper factory

Everything needed to turn a PMCID into a paper the app can serve. This exists
because the thing most likely to kill FirstPaper is not a competitor — it is
still having three papers in six months because each one took a weekend.

It is also what makes it safe for someone other than the author to add
content: with a frozen schema and a CI gate, a pull request adding a paper can
be merged on a green run without reading all seventeen paragraphs by hand.

## Setup

```sh
pip install -r requirements.txt
```

The model-calling scripts read `ANTHROPIC_API_KEY` from the environment or
from `.env.local` at the repo root. The deterministic ones need nothing.

## What runs where

| Script | Needs a model? | What it does |
|---|---|---|
| `ingest.py` | no | Pulls the JATS XML from Europe PMC: paragraphs, sections, figures, licence |
| `figures.py` | no | Downloads figure images and maps them to the paragraphs that cite them |
| `migrate_to_schema.py` | no | Folds a pre-schema paper's six JSON files into one `paper.json` |
| `check_content.py` | no | Word-count ratio, licence, the seven-tag enum, answer keys, figure paths |
| `predictions.py` | **yes** | Generates and blind-tests the three options shown before each explanation |
| `verify_questions.py` | **yes** | The leak gate: can the explanations alone answer the questions? |

## Adding a paper

```sh
# 1. Pull the authors' text, sections and licence.
python ingest.py --out-dir data fetch PMC3557905

# 2. Pull the figures and map them to the paragraphs that cite them.
python figures.py --slug my-paper --pmcid PMC3557905

# 3. Write the explanations, questions and recap by hand, following
#    prompts/. This is the slow part and no script replaces it.

# 4. Check it mechanically. Free, instant, no API key.
python check_content.py --slug my-paper

# 5. Check it behaviourally. Costs money.
python verify_questions.py --slug my-paper --max-leaks 1
python predictions.py verify --slug my-paper
```

## Adding a Claim Check

```sh
python ingest.py claim PMC3557905 "the sentence a headline got wrong"
```

Pulls the abstract, checks the licence, and writes a draft claim file with the
quoted sentence in place.

## What the pipeline cannot do

Be honest about this, because the gap is where all the real time goes.

**Finding a misreported headline is hand work.** No script notices that a
newspaper overstated a result. You read the coverage, you read the paper, and
you spot the gap yourself.

**Writing four options is hand work.** The distractors are the hard part and
they are where this project has failed most often. A wrong option has to be
something a reader who half-skimmed could believe, and it must not be
eliminable on shape — length, hedging, vagueness, or sounding like real paper
prose. `predictions.py verify` catches shape leaks after the fact; it does not
write good options for you.

**Judging which paper is worth a reader's twenty minutes is hand work.** The
search command ranks by citation count and abstract readability, which is a
filter, not a judgement.

**Deciding what a paragraph is really claiming is hand work.** The explanation
rules in `prompts/` describe what good looks like; they do not produce it.

## The two rules that matter

Both are enforced, not just described. See `prompts/` for the full text.

1. **An explanation is 60–75% of its paragraph's word count, and never
   longer.** The ceiling is hard and CI fails on it. The floor is a target: a
   short paragraph explained in a sentence should not be padded to reach it.

2. **The explanation is thinned of the specifics a reader must earn** — exact
   figures, gene names, cell lines, and the authors' own hedge words — so the
   questions cannot be answered from the commentary alone.

## CI

`.github/workflows/content.yml` runs on every pull request touching
`content/`. Mechanical checks always run. The leak gate runs when
`ANTHROPIC_API_KEY` is set as a repository secret and fails the build when
more than **1 of 10** questions is answerable from the explanations alone.
