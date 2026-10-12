# Decisions

<!-- STATUS LIST GOES HERE AT THE END OF THE SESSION -->

---

# Phase A: the stats layer

## lib/stats.ts: interval method
**Chose:** Wilson score interval, with the z value derived from the `confidence` argument (inverse normal), and `[0, 1]` for zero trials.
**Over:** The textbook normal approximation `p ± 1.96·√(p(1−p)/n)`, with a hardcoded 1.96.
**Because:** The normal approximation collapses to a single point at 0 of 5 and 5 of 5, which is exactly when a reader most needs to hear that five questions is not much.

## lib/stats.ts: zero trials
**Chose:** `wilsonInterval(0, 0)` returns `[0, 1]`.
**Over:** Throwing, or returning `[NaN, NaN]`.
**Because:** With no evidence every rate is possible, and "anything from 0% to 100%" is a true sentence a caller can print.

## lib/stats.ts: chanceBaseline input
**Chose:** Throws a RangeError for anything that is not a positive integer.
**Over:** Returning 0 or Infinity for 0 options.
**Because:** A question with no options is a content bug, and a silent 0% guessing line on screen would hide it.

## Test runner
**Chose:** vitest 3.2.4, `npm test`, tests beside the code as `lib/*.test.ts`, `@/` alias mapped in `vitest.config.ts`.
**Over:** Node's built-in `node --test` with type stripping.
**Because:** The lib files import each other through the `@/` alias, which Node cannot resolve without a loader hook; vitest resolves it with three lines of config.

## lib/scoring.ts: which answer counts when a question is answered twice
**Chose:** The first answer per paper and question, across sessions.
**Over:** The last answer (which `deriveResults` uses within a session).
**Because:** A second pass through a paper is made knowing the answers; counting it would let a reader reach the 20-judgement gate by reading one paper four times. A test pins this.

## lib/scoring.ts: what counts as a judgement
**Chose:** A `judge_answered` event with a numeric `confidence`.
**Over:** Any `judge_answered` event, or `confidence_stated` events.
**Because:** An appraisal answer with no committed confidence says nothing about calibration, and `confidence_stated` without an answer has no accuracy to set it against.

## lib/scoring.ts: well-calibrated band for calibrationDirection
**Chose:** A gap within 10 points either way is `well-calibrated` (the existing CALIBRATION_BAND), otherwise the sign decides.
**Over:** Calling it well-calibrated whenever mean confidence falls inside the 95% interval on accuracy.
**Because:** You asked for "which direction you lean" at 20; the interval test would call almost everyone well-calibrated at 20 (the interval is ~40 points wide), so the interval is returned alongside the direction and the screen states it instead.

## lib/scoring.ts: what a per-tag verdict is measured against
**Chose:** Guessing. `better-than-guessing` when the whole 95% interval sits above the tag's chance line, `worse-than-guessing` when it sits wholly below, `not-yet-distinguishable` otherwise.
**Over:** A fixed accuracy threshold such as "below 50% is a weakness".
**Because:** The finding on this product is the distance from guessing; a fixed threshold would call 30% on four-option questions "weak" when it is indistinguishable from not reading.

## lib/scoring.ts: where option counts come from
**Chose:** The caller passes a lookup built from the paper content (`(slug, questionId) => options.length`).
**Over:** Adding `option_count` to every judge event, or assuming four.
**Because:** The content is the source of truth for how many options a question has, old events lack the field, and a silent "assume four" would be wrong the day a three-option question ships.

## lib/scoring.ts: gate constants
**Chose:** `DIRECTION_GATE = 20`, `TAG_VERDICT_GATE = 6`, `JUDGEMENTS_PER_PAPER = 5`, exported so every screen quotes the same numbers.
**Over:** Literals in each component.
**Because:** "N of 20" appears in several places and must not drift.

## app/api/events GET: the cross-paper read path
**Chose:** A GET on the existing events route that returns this reader's own `judge_answered` events, found through the httpOnly anon cookie, using the secret key server-side. Failure returns an empty list.
**Over:** Counting only the browser's session log, or moving the log to localStorage.
**Because:** The session log is per tab, so "across all of a reader's sessions" needs the durable record; CLAUDE.md says every read goes through a route, and the route returns only what the gated layer reads.
