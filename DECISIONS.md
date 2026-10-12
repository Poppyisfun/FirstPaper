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
