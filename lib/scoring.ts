/**
 * Scoring, derived from events at read time. Nothing here is ever stored.
 *
 * Every number on the results screen is a pure function of the events a
 * session produced. A stored total can drift away from the events that made
 * it; a derived one cannot, and a bug in this file is visible the moment the
 * events are replayed rather than baked into a row written months ago.
 *
 * The honest cases matter as much as the happy one. Someone who answered
 * nothing has no accuracy, not an accuracy of zero, and the difference shows
 * on screen. Someone whose confidence sat *below* their accuracy is
 * underconfident, which is a real and interesting result rather than a
 * failure, and is phrased as such.
 */

import type { PaperEvent } from "@/lib/events";

export const XP_PARAGRAPH_PREDICTED = 8;
export const XP_CHECK_CORRECT = 20;
export const XP_JUDGE_CORRECT = 20;

export type Rank = "Explorer" | "Reader" | "Critic" | "Peer Reviewer";

/** XP never goes negative anywhere it is displayed. */
export const floor0 = (n: number) => (n < 0 ? 0 : n);

/**
 * Rank thresholds.
 *
 * PROVISIONAL, and per paper. Perfect play on a seventeen-paragraph paper
 * with five questions in each round is 336 XP, so the old 380 for Peer
 * Reviewer was arithmetically unreachable: a reader could answer everything
 * correctly and still be shown a tier above them they could never earn.
 * These are set against that ceiling — top rank on a perfect run, not on a
 * typical one.
 *
 * They must be revisited when accounts land and rank becomes cumulative
 * across papers, because a per-paper ceiling is the wrong basis then.
 */
export function rankFor(xp: number): Rank {
  if (xp >= 310) return "Peer Reviewer";
  if (xp >= 220) return "Critic";
  if (xp >= 110) return "Reader";
  return "Explorer";
}

/** One appraisal answer, paired with what the reader claimed beforehand. */
export type JudgeAnswer = {
  questionId: string;
  tag: string;
  correct: boolean;
  /** 0-100, committed before the options were visible. */
  confidence: number;
};

export type Calibration =
  | { kind: "none" }
  | {
      kind: "measured";
      /** Mean stated confidence, 0-100. */
      meanConfidence: number;
      /** Share of appraisal questions answered correctly, 0-100. */
      accuracy: number;
      /** meanConfidence - accuracy. Negative means underconfident. */
      gap: number;
      verdict: "overconfident" | "underconfident" | "well calibrated";
    };

/** One answered question, for the per-question breakdown. */
export type AnsweredQuestion = {
  questionId: string;
  chosenOptionId: string;
  correct: boolean;
  /** Appraisal only: what they staked before seeing the options. */
  confidence: number | null;
  tag: string | null;
};

/** A paragraph whose prediction was wrong, with where it sits in the paper. */
export type MissedParagraph = {
  paragraphId: string;
  section: string;
};

export type Results = {
  /** Paragraphs where the reader predicted before the explanation appeared. */
  paragraphsPredicted: number;
  /** Of those, the ones they got right first time. */
  paragraphsPredictedCorrectly: number;
  paragraphsTotal: number;

  checkAnswered: number;
  checkCorrect: number;
  /** Null when nothing was answered: no accuracy, rather than zero. */
  checkAccuracy: number | null;

  judgeAnswered: number;
  judgeCorrect: number;
  appraisalAccuracy: number | null;

  calibration: Calibration;
  /** Appraisal tags the reader got wrong, worst first. */
  missedTags: { tag: string; missed: number; total: number }[];

  /** Every check answer, in the order they were given. */
  checkAnswers: AnsweredQuestion[];
  /** Every judge answer, with the confidence staked on it. */
  judgeAnswers: AnsweredQuestion[];
  /** Appraisal performance per criterion, including the ones they got right. */
  tagBreakdown: { tag: string; correct: number; total: number }[];
  /** Paragraphs the reader predicted wrong, grouped by section. */
  missedPredictions: MissedParagraph[];

  xp: number;
  rank: Rank;
};

function prop(event: PaperEvent, key: string): unknown {
  return event.props?.[key];
}

/**
 * Confidence within 10 points of accuracy is calibrated. The threshold is a
 * judgement call, but some band is necessary: demanding an exact match would
 * report almost everyone as miscalibrated on five questions, where one answer
 * moves accuracy by twenty points.
 */
const CALIBRATION_BAND = 10;

/**
 * Every appraisal criterion the reader met, right or wrong.
 *
 * Distinct from deriveMissedTags, which lists only failures for the pattern
 * sentence. The breakdown shows the whole picture, because "denominator:
 * 0 of 1" only means something next to "scope: 1 of 1".
 */
export function deriveTagBreakdown(
  judged: JudgeAnswer[],
): { tag: string; correct: number; total: number }[] {
  const counts = new Map<string, { correct: number; total: number }>();
  for (const j of judged) {
    const entry = counts.get(j.tag) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (j.correct) entry.correct += 1;
    counts.set(j.tag, entry);
  }
  return [...counts.entries()]
    .map(([tag, v]) => ({ tag, ...v }))
    // Worst first: this is a "where did I struggle" view, not a scoreboard.
    .sort(
      (a, b) =>
        a.correct / a.total - b.correct / b.total || a.tag.localeCompare(b.tag),
    );
}

export function deriveResults(
  events: PaperEvent[],
  paragraphsTotal: number,
  /** Paragraph id to section heading, for grouping missed predictions. */
  sectionOf: Record<string, string> = {},
): Results {
  const predictions = events.filter((e) => e.name === "prediction_made");
  /* A reader can revisit a paragraph; only the first prediction counts, since
     the second is made knowing the answer. */
  const firstByParagraph = new Map<string, PaperEvent>();
  for (const event of predictions) {
    const id = String(prop(event, "paragraph_id") ?? "");
    if (id && !firstByParagraph.has(id)) firstByParagraph.set(id, event);
  }
  const paragraphsPredicted = firstByParagraph.size;
  const paragraphsPredictedCorrectly = [...firstByParagraph.values()].filter(
    (e) => prop(e, "correct") === true,
  ).length;

  const checks = dedupeByQuestion(events.filter((e) => e.name === "check_answered"));
  const checkAnswered = checks.length;
  const checkCorrect = checks.filter((e) => prop(e, "correct") === true).length;

  const judgeEvents = dedupeByQuestion(
    events.filter((e) => e.name === "judge_answered"),
  );
  const judged: JudgeAnswer[] = judgeEvents.map((e) => ({
    questionId: String(prop(e, "question_id") ?? ""),
    tag: String(prop(e, "tag") ?? "untagged"),
    correct: prop(e, "correct") === true,
    confidence: Number(prop(e, "confidence") ?? 0),
  }));

  const judgeAnswered = judged.length;
  const judgeCorrect = judged.filter((j) => j.correct).length;

  const checkAccuracy =
    checkAnswered > 0 ? (100 * checkCorrect) / checkAnswered : null;
  const appraisalAccuracy =
    judgeAnswered > 0 ? (100 * judgeCorrect) / judgeAnswered : null;

  const calibration = deriveCalibration(judged);
  const missedTags = deriveMissedTags(judged);

  const xp = floor0(
    paragraphsPredictedCorrectly * XP_PARAGRAPH_PREDICTED +
      checkCorrect * XP_CHECK_CORRECT +
      judgeCorrect * XP_JUDGE_CORRECT,
  );

  const asAnswered = (e: PaperEvent): AnsweredQuestion => ({
    questionId: String(prop(e, "question_id") ?? ""),
    chosenOptionId: String(prop(e, "chosen_option_id") ?? ""),
    correct: prop(e, "correct") === true,
    confidence:
      typeof prop(e, "confidence") === "number"
        ? (prop(e, "confidence") as number)
        : null,
    tag: typeof prop(e, "tag") === "string" ? (prop(e, "tag") as string) : null,
  });

  const missedPredictions: MissedParagraph[] = [...firstByParagraph.entries()]
    .filter(([, e]) => prop(e, "correct") !== true)
    .map(([id]) => ({ paragraphId: id, section: sectionOf[id] ?? "" }));

  return {
    checkAnswers: checks.map(asAnswered),
    judgeAnswers: judgeEvents.map(asAnswered),
    tagBreakdown: deriveTagBreakdown(judged),
    missedPredictions,
    paragraphsPredicted,
    paragraphsPredictedCorrectly,
    paragraphsTotal,
    checkAnswered,
    checkCorrect,
    checkAccuracy,
    judgeAnswered,
    judgeCorrect,
    appraisalAccuracy,
    calibration,
    missedTags,
    xp,
    rank: rankFor(xp),
  };
}

/** Last answer per question wins; a reader may change their mind before moving on. */
function dedupeByQuestion(events: PaperEvent[]): PaperEvent[] {
  const byId = new Map<string, PaperEvent>();
  for (const event of events) {
    const id = String(prop(event, "question_id") ?? "");
    if (id) byId.set(id, event);
  }
  return [...byId.values()];
}

export function deriveCalibration(judged: JudgeAnswer[]): Calibration {
  if (judged.length === 0) return { kind: "none" };

  const meanConfidence =
    judged.reduce((sum, j) => sum + j.confidence, 0) / judged.length;
  const accuracy = (100 * judged.filter((j) => j.correct).length) / judged.length;
  const gap = meanConfidence - accuracy;

  return {
    kind: "measured",
    meanConfidence,
    accuracy,
    gap,
    verdict:
      Math.abs(gap) <= CALIBRATION_BAND
        ? "well calibrated"
        : gap > 0
          ? "overconfident"
          : "underconfident",
  };
}

/** Which criteria they missed, worst first, then alphabetically for stability. */
export function deriveMissedTags(
  judged: JudgeAnswer[],
): { tag: string; missed: number; total: number }[] {
  const counts = new Map<string, { missed: number; total: number }>();
  for (const j of judged) {
    const entry = counts.get(j.tag) ?? { missed: 0, total: 0 };
    entry.total += 1;
    if (!j.correct) entry.missed += 1;
    counts.set(j.tag, entry);
  }
  return [...counts.entries()]
    .map(([tag, v]) => ({ tag, ...v }))
    .filter((t) => t.missed > 0)
    .sort((a, b) => b.missed - a.missed || a.tag.localeCompare(b.tag));
}

/** Plain English for each appraisal tag, for the pattern line. */
export const TAG_PHRASE: Record<string, string> = {
  hedging: "noticing when authors decline to settle something",
  scope: "what the study actually established",
  generalisation: "how far a result reaches",
  comparison: "reading a result against a baseline",
  denominator: "what a number is a fraction of",
};

/**
 * One sentence naming the pattern, or null when there is nothing to name.
 *
 * Only claims a pattern when the reader missed every question carrying that
 * tag, or missed more than one. Calling a single miss a pattern would be
 * reading noise as character.
 */
export function patternLine(
  missed: { tag: string; missed: number; total: number }[],
): string | null {
  if (missed.length === 0) return null;
  const worst = missed[0];
  const phrase = TAG_PHRASE[worst.tag];
  if (!phrase) return null;

  if (worst.missed >= 2) {
    return `You missed ${worst.missed} of the ${worst.total} questions about ${phrase}.`;
  }
  if (missed.length === 1) {
    return `The one you missed was about ${phrase}.`;
  }
  return `You missed one question each on ${missed
    .slice(0, 3)
    .map((m) => TAG_PHRASE[m.tag] ?? m.tag)
    .join(", ")}.`;
}

/**
 * The centrepiece sentence. Phrased for whatever the numbers actually are,
 * and never congratulatory about a bad gap or scolding about one.
 */
export function calibrationSentence(c: Calibration): string {
  if (c.kind === "none") return "You didn't answer the judging round.";

  const said = Math.round(c.meanConfidence);
  const were = Math.round(c.accuracy);

  if (c.verdict === "well calibrated") {
    return `You said you were ${said}% sure. You were right ${were}% of the time.`;
  }
  return `You said you were ${said}% sure. You were right ${were}% of the time.`;
}

/** The quieter line underneath, which is where the reading goes. */
export function calibrationNote(c: Calibration): string | null {
  if (c.kind === "none") return null;
  const gap = Math.round(Math.abs(c.gap));

  if (c.verdict === "well calibrated") {
    return "Your confidence matched your accuracy. That is the hard part, and you did it.";
  }
  if (c.verdict === "overconfident") {
    return `Your confidence ran ${gap} points ahead of your accuracy. Worth knowing before you trust your own certainty about a paper.`;
  }
  return `Your accuracy ran ${gap} points ahead of your confidence. You knew more than you credited yourself for — underconfidence is its own thing to correct.`;
}
