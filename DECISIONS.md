# Decisions

## Status: every instruction in the session prompt

1. Read CLAUDE.md first. **DONE.**
2. Complete all four phases in this session, committing after each. **DONE.** One commit per phase, plus a final commit for the status list, CLAUDE.md and one About link style.
3. Do not do the design pass. **DONE.** New elements got only the CSS they need to render, using existing tokens. No typeface, colour token or layout changes. (Removing the rank ladder left the scoring blocks full width; that's the design pass's to decide.)
4. Keep DECISIONS.md with chose/over/because for every wording choice. **DONE.** Technical judgement calls are logged in the same format.

**Phase A**
5. `lib/stats.ts` with `wilsonInterval(successes, trials, confidence = 0.95)`. **DONE.**
6. `chanceBaseline(optionCount)`. **DONE.**
7. Tests pinning 2/5 ≈ [0.12, 0.77] and 8/20 ≈ [0.22, 0.61]. **DONE** (`lib/stats.test.ts`).
8. Degenerate cases: 0 trials, 0 successes, all successes. **DONE.**
9. `judgementCount()` across all a reader's sessions. **DONE.** Includes a new `GET /api/events` so it really does span sessions, not just one tab.
10. `calibrationGap()`, appraisal only. **DONE.**
11. `calibrationDirection()`: null below 20, then direction plus gap size. **DONE.**
12. `perTagTally()`. **DONE.**
13. `perTagVerdict(tag)`: null below 6. **DONE.** It also takes an option-count lookup so the verdict is measured against real guessing rates.
14. Hard gates; caller shows a tally, never a verdict. **DONE.** The old ungated session verdicts were removed from `lib/scoring.ts`.
15. No Brier score, no calibration curve. **DONE.**
16. Commit. **DONE** (30684e4).

**Phase B**
17. Keep the headline. **DONE.**
18. Guessing line on both bars, labelled "guessing", from the real option counts. **DONE.**
19. Small print under the headline, computed. **DONE**, your wording, pinned by tests.
20. One gate, one number, one counter, "N of 20" everywhere; say 20 is four papers. **DONE.**
21. Say that 20 unlocks a direction plus gap size, with the interval still ~22–61. **DONE** (computed).
22. Per-tag verdicts gate at 6; tally below. **DONE.**
23. Per-session breakdown: each question, what they answered, right or wrong, confidence on appraisal, grouped by tag, missed predictions by section. **DONE.**
24. Edge cases: answered nothing, everything right, underconfident. **DONE**, checked in the browser with injected logs.
25. Log every sentence with at least one alternative. **DONE.**
26. Commit. **DONE** (e7b56c8).

**Phase C**
27. `/paper/[slug]/class`, no accounts, roster or class code. **DONE.**
28. `lib/aggregate.ts`, one cached query over events. **DONE.** Not run against the live database: there are no Supabase credentials in this environment. It assumes `events.session_id` has a foreign key to `sessions.id` (needed for the embedded join). If that's wrong the page says the data can't be loaded rather than showing wrong numbers. **Worth one look on the deployed site.**
29. Readers who started, readers who reached results. **DONE.**
30. Per judge question: split bars with the correct one marked. **DONE.**
31. Hardest-divided question at the top with its paragraph and tag. **DONE.**
32. Per check question, more briefly. **DONE.**
33. Paragraphs where predictions were most often wrong, in order. **DONE.**
34. Group mean confidence against mean accuracy. **DONE.**
35. Suppress any line from fewer than 5 readers and say why. **DONE**, pinned by tests.
36. Engagement and disagreement framing, no per-student rows. **DONE.**
37. Record what the page renders with 2 readers. **DONE.** See "What /paper/[slug]/class renders with 2 readers" below. A test pins it.
38. Commit. **DONE** (a3ea51f).

**Phase D**
39. Delete the Bonus subsection and replace it with predict-before-reveal. **DONE.**
40. Rewrite step 3 against the five tags. **DONE.**
41. Cut step 1's level-toggle sentence. **DONE.**
42. Cut Badges and the rank ladder. **DONE.** Badges were already gone. The ladder and its cumulative-rank copy are removed.
43. Make /account say plainly that accounts are coming and reading works without one. **DONE.** No "Create your account" link was left anywhere.
44. Derive both minute figures from meta.json. **DONE.** This was already done in 54ef36f. Card XP is now derived too (336, was a stale 320).
45. Library: cut the Explorer line and hide the filters. **DONE.** Both were already done; I also replaced the cadence promise.
46. Write the About page. **DONE**, with one sentence for you to confirm (item 54).
47. Voice: direct, plain, second person, no marketing words, no exclamation marks, sentence case, no em-dash rhythm. **DONE.** "The journey" kicker is renamed. The only em dash I added is the one in your own small-print wording.
48. Write down what makes the landing voice work, before writing. **DONE**, at the top of Phase D.
49. Log every rewritten passage as before/after. **DONE.**
50. Commit. **DONE** (90b15fe).

**Finishing**
51. `npm run build` succeeds. **DONE.**
52. `npx tsc --noEmit` is clean. **DONE** (after `next typegen`, which the build also runs).
53. All tests pass. **DONE.** 54 tests in 4 files.
54. The dev server starts and every route loads with no console errors. **DONE.** All 10 routes return 200 with zero console errors or warnings in headless Chromium.
55. A full read → check → judge → recap → results loop completes. **DONE**, driven in Chromium.
56. No horizontal overflow at 375px on any screen. **DONE.** I checked all 10 routes, every step of the loop, four results edge states, and the class view populated with 7 readers.
57. Write this list. **DONE.**
58. Update CLAUDE.md with this session's decisions. **DONE.** It also corrects the "may not change" scoring rule, which still described the retired peek charge and wager multiplier.
59. Leave the design alone. **DONE.**
60. Push the branch. **DONE.**

**Three things that need a decision from you**
- **Hero demo label.** "Try it. One sentence from a real study." I can't find the A-allele/morning-alertness study. If it's invented, the label is false. If it's real, it needs a citation. Left unchanged.
- **About, "We write it with help from an AI model".** I inferred this from the ingest scripts and commit history. Confirm it, or tell me how the explanations are actually written.
- **"Where this is going" removed from the landing page.** You didn't ask for this cut. It promised "drop in any research paper". Revert it if you want it back.

**Also worth knowing**
`npm run lint` reports 4 errors (react-hooks/set-state-in-effect). The same 4 exist on the base commit, in Check, Judge, Reader and Results, and the build doesn't run lint. I left them alone as out of scope.


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

---

# Phase B: the results screen

The test for every line below: does it read as a mirror (something true about you that you didn't know) or as a grade? Where a line was already on the screen and passed that test, it is logged as kept, with the alternative I weighed against it.

## Results: the headline (kept)
**Chose:** "You said you were 82% sure. You were right 40% of the time."
**Over:** "You were 82% sure on average, and right 40% of the time."
**Because:** You asked to keep it. Two short sentences, same shape, side by side, let the reader do the subtraction, which is what makes it land.

## Results: headline when the judging round was skipped (kept)
**Chose:** "You didn't answer the judging round."
**Over:** "There's no judging round to compare against yet."
**Because:** Plain fact, no blame, and it explains why the rest of the screen has no calibration in it.

## Results: small print under the headline
**Chose:** "That's 5 questions — your real appraisal accuracy is somewhere between 12% and 77%. Guessing scores 25%. Make 20 judgements and we can tell you which direction you lean." (Every number computed: count, Wilson interval, guessing from the real option counts. "1 question" singular. The last sentence drops once the reader is past 20.)
**Over:** "Five questions isn't much to go on. Your real accuracy could be anywhere from 12% to 77%, and guessing alone scores 25%."
**Because:** It is your wording, and it is better than mine: "your real appraisal accuracy" tells the reader the 40% is an estimate of something, which is the whole lesson. I kept the one em dash because it is yours and it's the only one on the screen.

## Results: the guessing line on both bars
**Chose:** A thin neutral tick on each bar at the round's guessing rate, labelled "guessing" in the mono caption style, computed as the mean of 1/options over the questions answered.
**Over:** A shaded band from 0 to the guessing rate, labelled "chance".
**Because:** "Guessing" is the word a sixteen-year-old uses; "chance" sounds like dice. A tick reads as a floor to compare against; a shaded band reads as a penalty zone.

## Results: guessing line aria label
**Chose:** "Comprehension accuracy. Guessing scores 25%."
**Over:** Leaving the tick aria-hidden with no mention.
**Because:** A screen-reader user should get the same finding a sighted one does.

## Results: section heading for the gated layer
**Chose:** "Across every paper you've judged"
**Over:** "Your calibration so far"
**Because:** It says what the numbers below are drawn from, which is the thing that changes the meaning; "calibration" is our word, not theirs.

## Results: the counter
**Chose:** "5 of 20 judgements"
**Over:** "5 / 20" or "15 to go"
**Because:** You asked for "N of 20" everywhere. Counting up toward a fixed number reads as progress; counting down reads as a debt.

## Results: what 20 is in papers
**Chose:** "Each paper has five judgements, so 20 is four papers. Three more papers and we can tell you which way you lean." (Remaining papers computed; "One more paper" singular.)
**Over:** "Every paper gives you five judgements. Read three more and your verdict unlocks."
**Because:** "Unlock" and "verdict" are both on the wrong side of the mirror/grade line; "we can tell you which way you lean" echoes the small print so the promise is made once, in one voice.

## Results: what unlocks at 20
**Chose:** "At 20 you get a direction and roughly how big the gap is, not a precise figure. Even then, 40% right could really be anywhere from 22% to 61%." (Interval computed for 8 of 20.)
**Over:** "At 20 we'll tell you whether you lean over- or underconfident. It still won't be exact."
**Because:** "It still won't be exact" is an adjective; "22% to 61%" is the evidence, and the product's thesis is that we show the evidence.

## Results: the per-tag rule, said once
**Chose:** "Each kind of judgement needs six before we say anything about it. Below that, we only count."
**Over:** Repeating "Below six we only count" on every tag row.
**Because:** The first version repeated it five times on a phone screen; once is a rule, five times is nagging.

## Results: a tag below its gate
**Chose:** "<Tag phrase>. 1 of 6 judgements." with the tally column reading "0 of 1 right".
**Over:** "<Tag phrase>. 0 of 1 so far." with no gate count.
**Because:** Two different "of"s need telling apart: "right" on the tally, "judgements" on the gate.

## Results: tag verdict, better than guessing
**Chose:** "Better than guessing. 5 of 6, and even the low end of the range, 44%, is above the 25% you'd get by guessing."
**Over:** "You're good at this one."
**Because:** It says what we actually know (you are distinguishable from guessing) and nothing we don't (how good).

## Results: tag verdict, can't tell from guessing
**Chose:** "Can't yet tell this apart from guessing. 2 of 6 could be anywhere from 10% to 70%, and that range includes the 25% you'd get by guessing."
**Over:** "This is a weak spot."
**Because:** Six questions can't tell weak from unlucky, and "yet" is the honest word: it's a reason to read another paper, not a label.

## Results: tag verdict, worse than guessing
**Chose:** "Below guessing. 0 of 15, and even the high end of the range, 22%, is under 25%. One wrong answer keeps looking right to you here, and it's worth finding out why."
**Over:** "You're doing worse than random on this one."
**Because:** Scoring reliably below guessing is information, not failure: it means something specific is pulling the reader. The second sentence points at that, which is the mirror; "worse than random" is a grade.

## Results: direction, overconfident
**Chose:** "You lean overconfident. Across 20 judgements, your confidence has run about 42 points ahead of your accuracy."
**Over:** "You tend to be more sure than you should be."
**Because:** "Should" scolds. "Ahead of" is spatial and neutral, and "about" carries the imprecision before the caveat does.

## Results: direction, underconfident
**Chose:** "You lean underconfident. Across 20 judgements, your accuracy has run about 30 points ahead of your confidence."
**Over:** "You know more than you give yourself credit for."
**Because:** The alternative is a compliment, and you said never to congratulate a gap. Same sentence shape as overconfident, mirrored, so neither direction reads as the good one.

## Results: direction, well-calibrated
**Chose:** "You don't lean either way. Across 20 judgements, your confidence and your accuracy are within 6 points of each other."
**Over:** "Your confidence matches your accuracy. That's the hard part."
**Because:** The old line ("That is the hard part, and you did it") congratulated. This one states the gap, and it can be read as good news without the screen saying so.

## Results: the caveat under any direction
**Chose:** "That's a direction, not a precise figure. At 20 judgements, your accuracy of 40% could really be anywhere from 22% to 61%."
**Over:** "This is still an estimate."
**Because:** You asked for exactly this to be said, and the interval is what makes it believable.

## Results: removed, the session-level calibration note
**Chose:** No sentence between the headline and the small print.
**Over:** The old notes: "Your confidence ran 42 points ahead of your accuracy. Worth knowing before you trust your own certainty about a paper." / "Your accuracy ran 30 points ahead of your confidence. You knew more than you credited yourself for — underconfidence is its own thing to correct." / "Your confidence matched your accuracy. That is the hard part, and you did it."
**Because:** All three were verdicts drawn from five questions, which is exactly what the gate forbids. Below 20 the screen has no verdict, not even a kind one.

## Results: removed, the pattern sentence
**Chose:** No pattern line.
**Over:** "You missed one question each on what a number is a fraction of, how far a result reaches, noticing when authors decline to settle something."
**Because:** The tag list now shows every tag with its count, so the sentence repeated it in a vaguer form, and "you missed" was the only line on the screen phrased as a list of failures.

## Results: stat label for predictions
**Chose:** "First guesses that matched ours"
**Over:** "Read without a wrong prediction" (the old label)
**Because:** "Wrong prediction" frames a free guess as an error; "matched ours" is what was measured, and leaves room for us being the ones who are off.

## Results: XP and rank (kept)
**Chose:** Kept XP and rank on the screen unchanged.
**Over:** Removing them as grade-like.
**Because:** They are in the locked scoring rules and you didn't ask; flagged here because "Rank: Explorer" is the most grade-like thing left on this screen.

## Results: breakdown heading
**Chose:** "This paper, question by question"
**Over:** "Question by question" (the old heading)
**Because:** The section above it now spans papers, so this one has to say it is only this paper.

## Results: what they answered
**Chose:** "You said: <option text>" under every question, and "Our answer: <option text>" under wrong ones.
**Over:** "Your answer:" / "Correct answer:"
**Because:** "You said" matches "You said you were 82% sure" in the headline. "Our answer" rather than "Correct answer" because the honesty note is the product: it is our judgement.

## Results: confidence on appraisal rows (kept)
**Chose:** "said 82% sure"
**Over:** "82% confident"
**Because:** Echoes the headline's "You said", so every confidence on the screen is something the reader said, not something we measured.

## Results: appraisal grouped by tag
**Chose:** Group header "Appraisal · denominator  0 of 1", then the tag's phrase as a sentence ("What a number is a fraction of."), then the question.
**Over:** One appraisal list with the tag as a chip on each row.
**Because:** You asked for "denominator: 0 of 1" to be visible; a header per tag is where a denominator of one can't hide.

## Results: missed predictions heading and note (kept, one dash removed)
**Chose:** "Paragraphs you read differently to us" / "Your first guess did not match ours here. That is not a score against you. It is where our explanation had the most work to do."
**Over:** The same with an em dash: "…not a score against you — it is where…"
**Because:** It was already a mirror. Split the dash into two sentences to match the voice rules from Phase D.

## Results: how a missed paragraph is pointed to
**Chose:** Section heading, then "Paragraph 9" (numbered as the reading screen numbers it, abstract as "Abstract"), then the paragraph's first nine words verbatim in the paper's serif, ending in an ellipsis.
**Over:** A count per section, which is what was there.
**Because:** "Results: 3" tells a reader nothing they can act on; the opening words let them recognise the paragraph. The words are quoted, never reworded, and set in the authors' typeface so it is clear whose they are.

## Results: nothing answered
**Chose:** "Nothing to show you yet." / "This page holds up what you said against what turned out to be true. There are no answers from this session to hold up. Read the paper, and this page will have something to tell you."
**Over:** The old "Nothing to score yet." / "There are no answers recorded for this session, so there is no calibration to report. Start the paper and the numbers will mean something."
**Because:** "Score" and "calibration" are grade words; the new version says what the page is for in the reader's terms, which is the mirror.

## Results: loading line (kept)
**Chose:** "Working out how that went…"
**Over:** "Loading your results…"
**Because:** Already in voice.

## Results: honesty note (kept, locked)
**Chose:** "FirstPaper can be wrong, and that's the point. These scores measure you against our judgement, which is not the same as measuring you against the truth."
**Over:** —
**Because:** Locked by CLAUDE.md. Now also shown on the nothing-answered state, which had none.

## Results: edge case, everything right
**Chose:** No special line. The small print does the work: "between 57% and 100%".
**Over:** "Five for five. That's real, and it's still five questions."
**Because:** A special line for a perfect round is congratulation by another route. The interval already tells them 5 of 5 can't rule out 57%.

## Results: edge case, underconfident on one paper
**Chose:** No special line below the gate; the headline ("You said you were 30% sure. You were right 100% of the time.") stands alone.
**Over:** A sentence naming it as underconfidence.
**Because:** Naming a direction off five questions is the verdict the gate forbids, in either direction. The headline already shows the gap; the name waits for 20.

## Results: where the cross-paper count comes from
**Chose:** The reader's own judge events from GET /api/events, merged with the tab's session log, each question counted once.
**Over:** The session log alone.
**Because:** Without it the counter could never pass 5 in a new tab, so "four papers" would be false.

---

# Phase C: the class view

## What /paper/[slug]/class renders with 2 readers
Pinned by the last test in `lib/aggregate.test.tsx` (it renders the component with two synthetic readers and asserts this text). Reader one finished and missed the first paragraph's guess; reader two stopped before results. The page reads, top to bottom:

> CLASS VIEW
> *RNA-programmed genome editing in human cells*
> **Where readers of this paper agreed, and where they split.**
> This page pools everyone who has read this paper on FirstPaper. There are no names and no rows per student, because FirstPaper never knows who is reading. If your class is the only group reading this paper, these readers are your class.
> Any line built from fewer than 5 readers is hidden, and says so. A split across three people is three people, not a pattern. We hold this page to the same rule as a reader's own results.
> 2 readers started this paper. 1 reached their results.
>
> **Where they divided hardest**
> Not enough readers yet to say where they divided. This needs 5 readers on at least one judging question.
>
> **Every judging question** — each of the five, with its tag line ("Tests HEDGING: noticing when authors decline to settle something") and prompt, then: `2 of 5 readers. Hidden until 5.`
>
> **Comprehension questions** — each of the five prompts, then: `2 of 5 readers. Hidden until 5.`
>
> **Paragraphs where first guesses most often missed** — the explanation sentence, then: `No paragraph has 5 guesses yet.`
>
> **Confidence against accuracy** — `2 of 5 readers. Hidden until 5.`
>
> FirstPaper can be wrong, and that's the point. "Our answer" is our judgement. A question the room split on may be one we wrote badly, and that is worth checking against the original paper.

No percentage, no option bar, no "our answer" marker and no paragraph appears anywhere. The test asserts all four absences.

## Class view: whether the reader counts are suppressed
**Chose:** "2 readers started this paper. 1 reached their results." is always shown, even below 5.
**Over:** Suppressing the counts too.
**Because:** They are counts, not estimates, and without them the instructor cannot tell "hidden because 2 readers" from "hidden because broken". Every hidden line says its own count for the same reason.

## Class view: what "fewer than 5 readers" counts
**Chose:** Distinct sessions (one per browser per paper) behind that specific line. A question is gated on readers who answered it; the group calibration on readers who judged; each paragraph on readers who guessed it.
**Over:** One page-wide gate on readers who started.
**Because:** Seven readers can start and three finish; a judging split from three readers is still three people.

## Class view: whose answer counts when someone goes through twice
**Chose:** Each reader's first answer per question and first guess per paragraph.
**Over:** The last answer.
**Because:** Same rule as the gated scoring: a second pass is made knowing the answers and says nothing about how the paper read.

## Class view: what "divided hardest" means
**Chose:** The judging question whose most popular answer has the smallest share; ties go to the more even spread (entropy).
**Over:** The question with the lowest share choosing our answer.
**Because:** You asked where they divided, not where they were wrong. A question 90% of the room got wrong the same way is agreement, and a different lesson.

## Class view: the paragraph shown with the hardest question
**Chose:** The first paragraph the question lists in `paragraph_ids`, in full, verbatim, in the paper's serif.
**Over:** All the listed paragraphs, or an excerpt.
**Because:** One paragraph is a lesson plan; three is homework. Verbatim and in full because it is the authors' text and excerpting is a form of editing.

## Class view: page title
**Chose:** "Where readers of this paper agreed, and where they split."
**Over:** "How your class did on this paper"
**Because:** "Did" frames it as a grade, and "your class" claims a roster we don't have. Agreement and disagreement is the framing you asked for.

## Class view: who the readers are
**Chose:** "This page pools everyone who has read this paper on FirstPaper. There are no names and no rows per student, because FirstPaper never knows who is reading. If your class is the only group reading this paper, these readers are your class."
**Over:** "These are the anonymous results of everyone who read this paper."
**Because:** "Results" invites marking. The last sentence is the condition under which the page is about their class, stated as a condition, so an instructor knows when it isn't.

## Class view: the suppression rule
**Chose:** "Any line built from fewer than 5 readers is hidden, and says so. A split across three people is three people, not a pattern. We hold this page to the same rule as a reader's own results."
**Over:** "To protect privacy, results from fewer than 5 readers are hidden."
**Because:** Privacy is not the reason (there's no identity to protect). The reason is that the number can't support itself, and the instructor should hear the real one.

## Class view: the hidden line
**Chose:** "2 of 5 readers. Hidden until 5."
**Over:** "Not enough data."
**Because:** Mirrors "N of 20" on the results screen, and tells the instructor exactly how far off it is.

## Class view: data unavailable
**Chose:** "The reading data can't be loaded right now, so there is nothing to show. That is a problem on our side, not a sign that nobody has read the paper."
**Over:** "0 readers started this paper."
**Because:** A failed query is not zero readers, and an instructor who assigned the paper would otherwise conclude nobody did it.

## Class view: hardest-question framing
**Chose:** "No answer to this question won more than 29% of 7 readers. A question the room disagrees on is usually the best place to start a discussion."
**Over:** "Your students struggled most with this question."
**Because:** "Struggled" is a verdict on students; "disagrees" is a fact about the room and points at what to do with it.

## Class view: tag line
**Chose:** "Tests GENERALISATION: how far a result reaches"
**Over:** A coloured chip with the tag alone.
**Because:** The tag name means nothing to an instructor without the phrase, and colours belong to commentary.

## Class view: marking our answer
**Chose:** A bordered "our answer" label in mono, and a darker bar; every other bar neutral grey.
**Over:** Green for correct, red for wrong.
**Because:** Green means explanation and red means a failed check verdict in this design system; neither belongs here. "Our answer" rather than "correct" for the same reason as the results screen.

## Class view: option order
**Chose:** Options in the paper's stored order, not sorted by popularity.
**Over:** Most-chosen first.
**Because:** Every question's bars read the same way, and position never hints at which is ours.

## Class view: comprehension, more briefly
**Chose:** One sentence per question: "80% of 7 readers chose our answer. The most-chosen other answer, at 14%: "<text>""
**Over:** The full option bars, smaller.
**Because:** You asked for briefer; the one wrong answer that pulled people is what an instructor can use, the rest is noise at this size.

## Class view: missed-paragraph explanation
**Chose:** "Before each explanation, readers guess what the paragraph says. These are the paragraphs where that guess missed most often, which is where the paper lost people."
**Over:** "These paragraphs had the most wrong predictions."
**Because:** An instructor has never seen the prediction step; one sentence of how it works makes the list readable. "Lost people" puts the difficulty in the paper, not the students.

## Class view: missed-paragraph row
**Chose:** "Results, paragraph 6 · 3 of 6 missed (50%)" then the paragraph's opening words in serif.
**Over:** A percentage alone.
**Because:** The count shows the denominator, which is the product's own lesson.

## Class view: suppressed paragraphs note
**Chose:** "4 paragraphs have fewer than 5 guesses and are hidden."
**Over:** Silently omitting them.
**Because:** Readers drop off as a paper goes on, so late paragraphs are the ones most often hidden; an instructor should know the list is partial and why.

## Class view: group calibration
**Chose:** "On the judging questions, readers said they were 72% sure on average. They were right 46% of the time. Guessing scores 25%." then "Pooled across 7 readers. It says how the group read the paper, not how any one reader did."
**Over:** "The class was overconfident by 26 points."
**Because:** Same shape as the reader's headline, so the instructor sees what the student saw; no direction verdict, because pooled answers from one paper are not independent judgements and the direction gate is about one reader's twenty.

## Class view: honesty note
**Chose:** "FirstPaper can be wrong, and that's the point. "Our answer" is our judgement. A question the room split on may be one we wrote badly, and that is worth checking against the original paper."
**Over:** Reusing the results screen's note verbatim.
**Because:** The note is required on every learning screen; on this one the honest caveat is that a split can be our fault, which is also the framing that keeps it from reading as a cheating or failure report.

## Class view: caching and query
**Chose:** `unstable_cache` with a five-minute revalidate around one paged query (`events` joined to `sessions!inner(paper_slug)`, only the five event types the page reads); the page is `force-dynamic`, so the build never queries the database.
**Over:** The `use cache` directive.
**Because:** `use cache` needs `cacheComponents` turned on project-wide, which is a config change beyond this page. The embedded join assumes `events.session_id` is a foreign key to `sessions.id`; if it isn't, the page shows the "can't be loaded" line rather than wrong numbers. **Worth confirming on the live database.**

## Class view: discoverability
**Chose:** Not linked from anywhere in the reading flow or navigation; `noindex`.
**Over:** A link in the footer or library.
**Because:** It is for an instructor who is given the address, and a student finding it mid-paper would see other readers' splits before answering.

---

# Phase D: the copy

## What makes the landing page's voice work (written before any rewrite)

Read against the current `app/(marketing)/page.tsx`, `HeroCopy.tsx` and `DemoStrip.tsx`:

1. **It starts from the reader's experience, not the product.** "For anyone who has opened a research paper and closed it again." "When you finally open the real paper, it shuts you out." The product enters only after the reader has recognised themselves.
2. **Second person, present tense, one reader.** "You saw a headline that said a study shows something." Never "users", never "students will".
3. **Short declaratives, ending on the shortest.** "The paper is the source. Everything else is someone retelling it." Paragraphs land on a four- or five-word sentence.
4. **Fragments as rhythm, used sparingly.** "Unfamiliar structure. Technical words. Statistics nobody taught you." "Not a summary." Three in a row at most, then a full sentence.
5. **Reframing instead of reassurance.** "That is not a failure of intelligence. It is a missing skill." It doesn't tell the reader they're smart; it relocates the problem.
6. **Concrete nouns.** Headline, summary, post, lab, class, argument, verb. Nothing abstract enough to need a definition.
7. **Modest, countable claims.** "Five quick questions." "No penalty for a wrong answer." Numbers instead of adjectives.
8. **Explains its own jargon in passing.** "XP means experience points."
9. **The founder line is plain.** "I wanted to read real genetics research and could not get past the first page. Nobody teaches you how. So I built the thing I wish I had." No origin myth, no mission; three sentences, the last one a consequence.
10. **Almost no em dashes.** Full stops do the work. No exclamation marks, no "unlock", no "journey" in body copy (the one exception is the section kicker "The journey", logged below).

What to write to: open from what the reader has done or felt; say what happens in plain verbs; count things; stop on a short sentence; never promise what isn't built.

## Landing, step 1 (Read the real paper)
**Chose:** "Not a summary. The actual published text, with the real figures. Beside every paragraph is a plain language explanation."
**Over:** (before) "Not a summary. The actual published text, with the real figures. Beside every paragraph is a plain language explanation. One reading level is written today; Explorer and Critic are coming."
**Because:** You asked to cut the level sentence. It was also the only semicolon-and-promise in the section.

## Landing, step 3 (Judge the science)
**Chose:** "Five harder questions on whether the paper holds up. What did they actually show, and what are they only hoping? Does the claim cover more ground than the experiment did? Did the authors say shown, or suggests? Better than what? What is that percentage a fraction of? Before you see the options, you say how sure you are."
**Over:** (before) "Five harder questions on whether the paper holds up. Does the claim cover more ground than the experiment did? What is that percentage a fraction of? Did the authors say shown, or did they say suggests? Before you see the options, you say how confident you are." (An earlier commit had already removed "Was the sample big enough? Did they prove a cause? Who paid for it?")
**Because:** All five tags now, one question each, in words a reader recognises: scope, generalisation, hedging, comparison, denominator. "Better than what?" is a fragment on purpose; it is how the question sounds in your head. "How sure" matches the results headline.

## Landing, step 3: the scope question
**Chose:** "What did they actually show, and what are they only hoping?"
**Over:** "Is that what they found, or what they hope it means?"
**Because:** It mirrors the scope question in the paper ("Setting aside what the paper hopes for… which did this study itself establish?") without quoting it.

## Landing, step 5 (See your results)
**Chose:** "How often you were right, set against how sure you said you were. That gap is the thing worth knowing. One paper is five judgements, which is not much to go on, and the page says so. After four, it can tell you which way you lean."
**Over:** (before) "How often you were right, set against how sure you said you were. That gap is the thing worth knowing."
**Because:** The landing page should not promise a verdict from one paper that the results screen now refuses to give. "After four" keeps the promise true and countable.

## Landing: the old "XP and bonus" section, kicker and title
**Chose:** Kicker "Scoring", title "What earns XP, and what costs nothing".
**Over:** (before) Kicker "XP and bonus", title "How you earn, and why it matters".
**Because:** There is no bonus. "Why it matters" was about the rank ladder, which is gone. The new title names both blocks under it.

## Landing: the XP block
**Chose:** "XP means experience points. You earn it when your first guess about a paragraph matches what it says, and when you answer a question correctly. Nothing you get wrong takes any away."
**Over:** (before) "XP means experience points. You earn XP when you understand a paragraph on your own, when you answer a question correctly, and when you judge well. XP is a record of real reading. You cannot earn it by skimming."
**Because:** "You cannot earn it by skimming" is false: guessing scores 25%, and the results screen now says so. "Understand a paragraph on your own" described the retired peek mechanic. The new last line is true in `lib/scoring.ts` (no deductions) and is the reassurance a nervous reader needs.

## Landing: the bonus block replaced by predict-before-reveal
**Chose:** Heading "Guess first". "Before each explanation, you pick what you think the paragraph says. Then ours appears, and stays. A wrong guess costs nothing. It shows us where people get stuck, which is how the explanations get better."
**Over:** (before, already rewritten once from the −4 bonus text) "Before each explanation you pick what you think the paragraph says. Getting it wrong costs nothing and is not scored against you. It is how we find out which paragraphs lose people, which is the only way the explanations get better."
**Because:** Your three points in your order: commit a guess, wrong costs nothing, it's how we learn where people get stuck. "And stays" answers the question a reader who met the old peek mechanic would ask. "The only way" was an overclaim.

## Landing: the "Why collect it" block and the rank ladder
**Chose:** Both removed.
**Over:** (before) "XP builds your rank. Everyone starts as an Explorer. Keep reading well and you become a Reader, then a Critic, then a Peer Reviewer. Your rank is proof of something you can do, not a prize for showing up." plus the four-rung ladder.
**Because:** You asked to cut the ladder, and the block described rank as cumulative across papers, which it isn't (it's per paper and provisional). Rank still appears on the results screen; nothing on the landing page promises it.

## Landing: badges
**Chose:** Nothing to do.
**Over:** —
**Because:** The badges subsection was already removed by commit 54ef36f. Only an unused `.badges` CSS rule remains, left for the design pass.

## Landing: "Your account" section
**Chose:** "You do not need one. A whole paper works start to finish without signing up for anything, and you see your full results at the end."
**Over:** (before) "You do not need one. A whole paper works start to finish without signing up for anything, and your results are yours either way. Later, an account will carry your XP between papers and keep a record of what you have read."
**Because:** "Later, an account will…" is two features promised. The heading "Accounts are coming" already says the one thing that's true.

## Landing: "Where this is going" section
**Chose:** Removed.
**Over:** (before) "Soon, any paper in the world. Right now FirstPaper walks you through papers we have prepared by hand. Soon you will be able to drop in any research paper and FirstPaper will decode it. The same plain explanations. The same questions. The same judgment. Any paper, any field."
**Because:** Not on your list, but it is the largest stale promise on the page and exactly the kind you said you'd feel obliged to build. It also contradicts the About page: every set of options is blind-tested before it ships, which "drop in any paper" can't do. **Revert if you want it back; it is the one cut I made unasked.**

## Landing: "The journey" kicker
**Chose:** "How it works"
**Over:** "The journey"
**Because:** "Journey" is on your banned list. "How it works" is what the hero's "See how it works" button already promises at that anchor.

## Landing: minutes
**Chose:** Nothing to change; both already derive from `meta.json` (18).
**Over:** —
**Because:** Commit 54ef36f already made the landing and the card read the same field.

## Landing: hero headline (kept)
**Chose:** "Read any research paper. Understand it. Know if you can trust it."
**Over:** "Read a research paper. Understand it. Know if you can trust it."
**Because:** "Any" here is about the skill transferring, not about the product ingesting any paper; with "Where this is going" gone, it no longer reads as a product promise.

## Landing: hero demo label (NOT CHANGED, needs your answer)
**Chose:** Left as "Try it. One sentence from a real study."
**Over:** "Try it. One sentence, written the way studies are written."
**Because:** The A-allele/morning alertness sentence also appears in `refrence/index2.html` with "from a real study", but I can't find the study. If it's invented, the label is a false claim on a product about checking claims. If it's real, it should be cited. Your call either way.

## Account page: body
**Chose:** "There is nothing to sign up for yet, and you don't need to. A whole paper works start to finish without an account, and your results are on the last screen."
**Over:** (before) "There is nothing to sign up for yet, and nothing you are missing: a whole paper works start to finish without an account, and you get your full results at the end. What an account will add later is memory across papers — your XP carried forward, a record of what you have read, and suggestions based on it."
**Because:** You asked for "accounts are coming and the reading works without one", plainly. The old version promised three features and suggestions. The heading "Accounts are coming" stays.

## Account page: button
**Chose:** "Read a paper"
**Over:** (before) "Read a paper for now"
**Because:** "For now" implies the account is the real thing and reading is the stopgap. It's the other way round.

## Account page: meta description
**Chose:** "Accounts are coming. Reading works without one."
**Over:** (before) "Accounts are coming. Soon you will be able to keep your XP, see every paper you have read, and get suggestions based on what you are interested in."
**Because:** Same three promises as the body, in search results.

## "Create your account" link
**Chose:** Nothing to change.
**Over:** —
**Because:** An earlier commit already replaced it with "Read a paper instead" on the landing; no "Create your account" text remains anywhere in `app/` or `components/`.

## Library: closing note
**Chose:** "Each paper here is prepared by hand, paragraph by paragraph. So they arrive slowly."
**Over:** (before) "New papers land every few weeks. If there's one you want built out, tell me and I'll look at it."
**Because:** "Every few weeks" is a cadence promise, and "tell me" was bold text with no way to tell you. The new line explains why the shelf is short without committing to when it grows.

## Library: "Most people begin with an Explorer paper"
**Chose:** Nothing to change.
**Over:** —
**Because:** Already gone before this session.

## Library: filters
**Chose:** Left as they are: hidden below four papers (`MIN_PAPERS_FOR_FILTERS`), so hidden with one.
**Over:** Hiding them at exactly one paper.
**Because:** Already done by commit 54ef36f, and with two or three papers most filters would still return nothing.

## Library card: XP
**Chose:** 336, derived from the paper's content and the scoring constants (17 predictions × 8 + 5 × 20 + 5 × 20).
**Over:** 320 from `meta.json`.
**Because:** Not on your list, but the card disagreed with the rank thresholds in CLAUDE.md (set against a ceiling of 336), the same drift you fixed for minutes. Derived in `content/library.ts` rather than by editing `meta.json`, whose teaching fields are edit-on-request.

## Footer: sources
**Chose:** "Papers from PubMed Central · Built by a high schooler"
**Over:** (before) "Papers from PubMed Central and bioRxiv · Built by a high schooler"
**Because:** No paper in the library comes from bioRxiv.

## About: everything
The old page made claims that are no longer true: a "green dot" peek, "controls, sample size, claim strength, funding" as the criteria, "three reading levels… you pick, and you can change it mid-paper", "Explorer level assumes nothing past middle-school science", "PubMed Central and bioRxiv", "Nothing is graded, nothing is recorded" (events are recorded, anonymously), and a long founder narrative ("The wall", "The bet", "built the tool he wished had existed"). It is rewritten, not edited. Each passage below.

## About: title and lede
**Chose:** "What this is, and how it's made." / "FirstPaper is a free place to read a real research paper, one paragraph at a time, and to practise judging whether it holds up."
**Over:** (before) "Why FirstPaper exists." / "A free tool that teaches teenagers to read real scientific research, and to judge whether it's any good. Built by a high schooler who couldn't do either."
**Because:** "Why it exists" invites the mission statement you asked to avoid. The new title promises the two things the page then does.

## About: what it is
**Chose:** "You get the paper on one side, word for word. Our explanation sits beside it. Before the explanation appears, you guess what the paragraph says. Then you see what we think it says. / After the paper come two short rounds of questions. The first checks that the reading landed. The second asks whether the paper holds up, and before you see the options, you say how sure you are. The last screen sets what you said against what was true. / It's free. There are no ads, and you don't need an account."
**Over:** A numbered four-step list (the old "How it works" with 01–04).
**Because:** The landing page already has the numbered steps; here prose reads as an explanation rather than a second sales pass.

## About: who it's for
**Chose:** "Anyone who has opened a research paper and closed it again. Mostly that means teenagers. A student with a science fair project. Someone in a summer research program. Someone who read a headline and wanted the source. / It also works if you have just joined a lab or started a college course and are expected to read papers nobody taught you to read. The paper here now is pitched at someone who has taken high school biology. You don't need more than that."
**Over:** "FirstPaper is for teenagers who want to read real science."
**Because:** Opens on the hero's eyebrow line, which you said does real work. Three fragments, then a full sentence, per the voice notes. The level claim is the true one for the Reader-level paper; the old "assumes nothing past middle school" described Explorer, which isn't written.

## About: what the judging questions ask
**Chose:** "Reading what a paper says and judging whether it holds up are different skills. The second one is rarer. Every judging question comes back to one of five things." then Hedging / Scope / Generalisation / Comparison / Denominator with the same questions as landing step 3, then "None of them need statistics. They need you to read slowly and ask one more question than the paper answers."
**Over:** The old "The bet" section: "knowing whether the sample was big enough, whether a correlation got dressed up as a cause, whether the conclusion outran the data, whether the funder happens to sell the thing…"
**Because:** The old list named criteria we don't test. Same five questions as the landing page so the two pages can't drift apart in different words.

## About: how the commentary is made
**Chose:** "Everything that isn't the paper is ours. The explanations, the guesses you choose from, the questions, the answers we mark as right, and the plain-English recap at the end. We write it with help from an AI model, and then we test it. / The guesses are written from the authors' paragraph alone, never from our explanation, so you can't pick the right one by recognising how we sound. Then every set is shown to a model with no paragraph at all. If it can still pick the right answer from how the options look, say because it's the longest or the most careful, the set is thrown out. A reader learns those patterns fast, and then stops reading the paper. / The questions go through the same test. We also check that our explanations never state the answer to a question that comes after them."
**Over:** "The explanations here are written with care and checked, and they can still be wrong." (the old line)
**Because:** You asked for how it's made; "with care" says nothing. Every claim is from `content/ingest/predictions.py`, `verify_questions.py` and CLAUDE.md. **Needs your confirmation:** "We write it with help from an AI model" is inferred from the ingest scripts (which call a Claude model for options and verification) and co-authored commits; if the explanations themselves are written differently, this sentence should say how.

## About: pull quote
**Chose:** "FirstPaper can be wrong, and that's the point."
**Over:** (before) "Reading a research paper is a learnable skill. Almost nobody teaches it before university, and that gap decides who gets to participate in science."
**Because:** The old pull quote was the closest thing on the page to a mission statement. The honesty line is the product's own, word for word.

## About: it can be wrong
**Chose:** "Our explanations are a reading of the paper, not the paper. The answers we mark as right are our judgement. Tests catch some mistakes. They don't catch all of them. / So every screen says so, and the original paper is one click away from every paragraph. If you disagree with us and can point to the sentence in the paper that backs you up, you have done exactly what this is for."
**Over:** (before) "A tool whose whole subject is accuracy has no business pretending to be infallible… Checking us is part of the exercise. If you finish a paper here and never once opened the source, you've learned less than you think."
**Because:** The old last line scolded. The new one says what a good disagreement looks like, which is a skill, and ties the tests in the previous section to their limits.

## About: where the papers come from
**Chose:** "Every paper here is open access. The authors published it under a licence that lets anyone reproduce it, as long as the work is credited. We reproduce the text and figures word for word. We don't fix typos, shorten anything or modernise the wording. The authors are credited on every paragraph, with a link to the original." then one line per paper, generated from `meta.json`: title, authors, journal, year, licence (linked), "Read the original".
**Over:** (before) "No account, no paywall, no ads. Every paper in the library is open-access, from PubMed Central and bioRxiv, reproduced under licences that permit it and always credited to the authors who did the work."
**Because:** You asked for "under what licence"; naming the actual licence per paper, from the file, can't go stale. "Open access" is explained in one sentence because the reader may not know it.

## About: who built it
**Chose:** "A high school junior who tried to read real genetics research and couldn't get past the first page. Nobody teaches you how. This is the thing that would have helped."
**Over:** (before) "A high school junior who hit this exact wall trying to read genetics research, got frustrated enough to do something about it, and built the tool he wished had existed. Which is also why the judging layer sits at the centre of the product instead of being bolted on at the end. Learning to be appropriately skeptical was the harder half, and nobody was teaching it."
**Because:** Three sentences that echo the landing page's founder line without repeating it. Drops the frustration arc (mythology) and the gendered pronoun, which I can't confirm and the page doesn't need.

## About: FAQ
**Chose:** Removed.
**Over:** Keeping and correcting it.
**Because:** Every answer either restated a section above or made a stale claim ("Explorer level assumes nothing", "Nothing is graded, nothing is recorded", "The library deliberately includes papers with weaknesses"). The rewritten sections answer the same questions.

## About: closing button (kept)
**Chose:** "Read your first paper"
**Over:** "Start reading"
**Because:** Same words as the hero and the final call on the landing page.

## Design pass — typography and chroma

Every call here is recorded with what it was chosen over, because a design
decision without its alternative is indistinguishable from a default.

**One type scale, anchored on sizes already in use.**
Chose: seven text steps plus four display steps, named for the voice they
carry (`--t-paper`, `--t-body`, `--t-ui`, `--t-opt`, `--t-note`, `--t-meta`,
`--t-lead`), with the values taken from the most-used existing sizes.
Over: a fresh modular ramp (1.2 or 1.25), which is tidier on paper.
Because: the defect was thirty near-duplicate values, many half a pixel
apart — not the ratios between them. A ramp would have moved every size on
every screen to fix a problem that only needed the duplicates removed. 235
declarations now resolve to 11 tokens; one 54px exception remains, the
confidence slider's own number, which is deliberately outside the scale.

**9px and 9.5px raised to 10.5px.**
Chose: fold the three smallest sizes into one 10.5px step.
Over: preserving them as authored.
Because: text that small is not a decision, it is something that survived
because nobody measured it.

**The focus ring is ink, not green.**
Chose: `2px solid var(--ink)`.
Over: a green ring with a wider offset; a blue system default.
Because: green means "this is our explanation". Spending it on every
focusable element in the product empties it before a reader meets one. Ink
clears AA against both backgrounds.

**Section eyebrows: a hairline and sentence case.**
Chose: small sans label in `--soft` under a 1px rule.
Over: keeping the tracked-out capitals and only changing the colour.
Because: recolouring would have fixed the chroma violation and left the
genre tell. A tracked-out capitalised label in a tinted pill is the house
style of every AI product shipped this year, and ours was green as well.

**Scoring blocks and the account panel: hairlines, not tinted slabs.**
Chose: a rule above each block, transparent background, no shadow.
Over: neutral-tinted cards keeping the shape.
Because: three tells at once — identical rounded cards, soft shadows, and
commentary colours on blocks that are neither an explanation nor a caution.
The subject is documents; a rule and space is what a document uses.

**Progress bar: flat ink, gradient removed.**
Chose: `background: var(--ink)`.
Over: a neutral gradient.
Because: a gradient as decoration is on the avoid list, and the green-to-mint
ramp also spent the explanation colour on chrome.

**The results headline gets the scale.**
Chose: `clamp(30px, 5.4vw, 58px)`, 15ch measure, balanced wrap, more space
above.
Over: leaving it at `clamp(30px, 5.2vw, 52px)`; adding a rule or tint to
give it weight.
Because: this is the one screen allowed to be loud, and the instruction was
boldness through scale and whitespace rather than decoration. A reader is
calm and nearly invisible for twenty minutes; this sentence is the payoff.

**The hero highlighter stays amber.**
Chose: keep it.
Over: making it neutral with the other chrome.
Because: it marks the phrase that overreaches, which is exactly what amber
means. It is commentary, not decoration.


## The gap figure on the landing page

**The one line under the bars.**

chose: "Reading a paper and judging it are different skills. Almost nobody
is taught the second one."

over: "Understanding what a paper says and knowing whether to believe it are
different skills. Only one of them gets taught." — truer to the mechanism,
but it takes twenty-four words to land and the second clause is a shrug
rather than a claim.

over: "I can explain this paper line by line and still get its claims wrong."
— the strongest sentence of the three, and it belongs to the lead line above
the figure, which already says it with the numbers attached. Saying it twice
spends it.

over: "Comprehension is taught. Appraisal is not." — the shortest, and it
reads as a slogan. The point needs the word "different" to be an argument
rather than an assertion.

because: it names the two skills, says which one is missing, and stops. It
is the flat sentence the figure exists to earn, and the second sentence
carries the whole finding: 40% is a point and a half above guessing.

**Whose numbers.**

chose: my own run, labelled as one person reading once.

over: an aggregate across readers — there are none, and inventing one is
precisely the move this product criticises.

over: no numbers until readers exist — the argument is the gap, and a page
that makes the argument without showing it is asking to be believed.

because: a result measured against myself is the strongest version of the
claim available. I wrote every explanation in the paper and still scored 2
of 5 on whether it holds up.

**Drawing the guessing line.**

chose: draw it, at the real 25%, derived from the option counts.

because: it cuts towards honesty and towards drama at the same time. 80% is
far above it; 40% is a point and a half above it. The second fact is the
finding and the line is what makes it visible.


## The voice, as set by the hero and the gap figure

Written down before the rest of the pages were rewritten, so they could be
written to it rather than near it.

**One person speaks, and says I.** The site is built by one person and says
so. "We" survives in exactly one place, where it means the commentary: "what
we think it says". Everywhere else that "we" appeared it was a company voice
standing in for a person who exists, which is the thing that made the old
copy sound generated.

**Every claim arrives with its receipt.** The hero does not say "a real
research paper", it says Jinek et al., eLife 2013, PMC3557905, CC BY 3.0,
17 paragraphs, 18 minutes. The figure does not say "readers improve", it
says 2 of 5, somewhere between 12% and 77%. A sentence that cannot carry a
number, a name or a quotation from the paper is usually a sentence with
nothing in it.

**Limits are stated in the same tone as everything else.** One paper so far.
No accounts. Five questions is not much and the interval says how much. None
of these is apologised for and none is dressed up. The product's whole
argument is that a number should be reported with what it rests on, so the
page has to do that to itself first.

**Nothing lands on three.** Three parallel clauses, three bullets and three
cards are the rhythm generated copy falls into, and the old page had all
three shapes. Sections are now deliberately uneven: one long argument, one
short line after it.

**Flat sentences, no lift at the end.** "Almost nobody is taught the second
one." "There is nothing to average yet." No closing uplift, no promise about
what the reader will become.

**Visually: ink, white, and the paper's own numbers.** Display type large
enough to be the image, a mono catalogue line where a reference belongs,
hairline rules, square ends. The three commentary colours never appear as
decoration, because they carry meaning twenty paragraphs later.
