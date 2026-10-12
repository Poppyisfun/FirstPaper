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
import { chanceBaseline, wilsonInterval } from "@/lib/stats";

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
 * report almost everyone as miscalibrated. It is applied only past
 * DIRECTION_GATE, in calibrationDirection; one session's five questions never
 * get a verdict, because one answer moves accuracy by twenty points.
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

  /* No verdict here. This is one session, and a session is five questions;
     which way a reader leans is calibrationDirection's call, past its gate. */
  return { kind: "measured", meanConfidence, accuracy, gap };
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

/* ────────────────────────────────────────────────────────────────────────
   Across papers: the gated layer.

   Everything above describes one session. Everything below describes a
   reader across every paper they have judged, and every function here has a
   hard gate. Below the gate it returns null, and the caller shows a tally —
   never a verdict. Five questions cannot say which way a reader leans: 2 of 5
   has a 95% interval of roughly 12% to 77%, which contains almost every
   story you could tell about them.

   No Brier score and no calibration curve, deliberately. Both are finer
   instruments than the sample can feed.
   ──────────────────────────────────────────────────────────────────────── */


/** Judgements needed before we say which direction a reader leans. Four papers. */
export const DIRECTION_GATE = 20;

/** Judgements in one tag needed before we say anything about that tag. */
export const TAG_VERDICT_GATE = 6;

/** Questions per judging round. 20 / 5 is where "four papers" comes from. */
export const JUDGEMENTS_PER_PAPER = 5;

/** One appraisal judgement with its committed confidence, from any paper. */
export type Judgement = {
  slug: string;
  questionId: string;
  tag: string;
  correct: boolean;
  /** 0-100, committed before the options were visible. */
  confidence: number;
};

/** Looks up a question's option count; undefined for a question we no longer ship. */
export type OptionCountLookup = (slug: string, questionId: string) => number | undefined;

/**
 * Every confidence-tagged judgement in the log, once per question.
 *
 * The FIRST answer per paper and question counts, not the last. A second pass
 * through a paper is made knowing the answers, and counting it would let a
 * reader reach the gate by reading one paper four times — a calibration
 * built from answers they already knew.
 *
 * Events without a numeric confidence are skipped: an appraisal answer with
 * no stated confidence cannot say anything about calibration.
 */
export function judgementsFrom(events: PaperEvent[]): Judgement[] {
  const ordered = events
    .map((event, i) => ({ event, i }))
    .filter(({ event }) => event.name === "judge_answered")
    .sort((a, b) => (a.event.at ?? 0) - (b.event.at ?? 0) || a.i - b.i);

  const seen = new Set<string>();
  const out: Judgement[] = [];
  for (const { event } of ordered) {
    const questionId = String(prop(event, "question_id") ?? "");
    const confidence = prop(event, "confidence");
    if (!questionId || typeof confidence !== "number") continue;
    const key = `${event.slug}:${questionId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      slug: event.slug,
      questionId,
      tag: String(prop(event, "tag") ?? "untagged"),
      correct: prop(event, "correct") === true,
      confidence,
    });
  }
  return out;
}

/** Confidence-tagged judgements across all of a reader's sessions. */
export function judgementCount(events: PaperEvent[]): number {
  return judgementsFrom(events).length;
}

/**
 * Mean stated confidence minus actual accuracy, in percentage points, over
 * appraisal judgements only. Positive is overconfident, negative is
 * underconfident. Null when there is nothing to measure.
 *
 * Ungated on purpose: this is the arithmetic, and the gate belongs to the
 * function that turns it into a claim about the reader.
 */
export function calibrationGap(events: PaperEvent[]): number | null {
  const judged = judgementsFrom(events);
  if (judged.length === 0) return null;
  const meanConfidence =
    judged.reduce((sum, j) => sum + j.confidence, 0) / judged.length;
  const accuracy = (100 * judged.filter((j) => j.correct).length) / judged.length;
  return meanConfidence - accuracy;
}

export type Direction = "overconfident" | "underconfident" | "well-calibrated";

export type CalibrationDirection = {
  direction: Direction;
  /** Absolute gap in percentage points, rounded. The size, not a precise figure. */
  gap: number;
  judgements: number;
  meanConfidence: number;
  /** 0-100. */
  accuracy: number;
  /** 95% Wilson interval on accuracy, 0-100. Shown beside the direction. */
  accuracyInterval: [number, number];
};

/**
 * Which way the reader leans, and by roughly how much.
 *
 * Null below DIRECTION_GATE. Above it, a gap within CALIBRATION_BAND points is
 * well-calibrated. The interval comes back with the answer because at 20
 * judgements it is still wide — 8 of 20 is somewhere between 22% and 61% —
 * and the screen says so rather than letting the gap read as exact.
 */
export function calibrationDirection(
  events: PaperEvent[],
): CalibrationDirection | null {
  const judged = judgementsFrom(events);
  if (judged.length < DIRECTION_GATE) return null;

  const correct = judged.filter((j) => j.correct).length;
  const meanConfidence =
    judged.reduce((sum, j) => sum + j.confidence, 0) / judged.length;
  const accuracy = (100 * correct) / judged.length;
  const gap = meanConfidence - accuracy;
  const [lo, hi] = wilsonInterval(correct, judged.length);

  return {
    direction:
      Math.abs(gap) <= CALIBRATION_BAND
        ? "well-calibrated"
        : gap > 0
          ? "overconfident"
          : "underconfident",
    gap: Math.round(Math.abs(gap)),
    judgements: judged.length,
    meanConfidence,
    accuracy,
    accuracyInterval: [100 * lo, 100 * hi],
  };
}

export type TagTally = {
  tag: string;
  correct: number;
  total: number;
  /** Mean confidence stated on this tag's questions, 0-100. */
  meanConfidence: number;
};

/** Raw tallies per appraisal tag across every paper, alphabetical. No verdicts. */
export function perTagTally(events: PaperEvent[]): TagTally[] {
  const byTag = new Map<string, { correct: number; total: number; conf: number }>();
  for (const j of judgementsFrom(events)) {
    const t = byTag.get(j.tag) ?? { correct: 0, total: 0, conf: 0 };
    t.total += 1;
    t.conf += j.confidence;
    if (j.correct) t.correct += 1;
    byTag.set(j.tag, t);
  }
  return [...byTag.entries()]
    .map(([tag, t]) => ({
      tag,
      correct: t.correct,
      total: t.total,
      meanConfidence: t.conf / t.total,
    }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

export type TagVerdictKind =
  /** The whole interval sits above guessing. */
  | "better-than-guessing"
  /** The interval straddles guessing: we cannot yet tell them apart. */
  | "not-yet-distinguishable"
  /** The whole interval sits below guessing: something is pulling them to a wrong answer. */
  | "worse-than-guessing";

export type TagVerdict = {
  tag: string;
  verdict: TagVerdictKind;
  correct: number;
  total: number;
  /** 0-100. */
  accuracyInterval: [number, number];
  /** 0-100, the mean of 1/options over this tag's questions. */
  guessing: number;
};

/**
 * What can be said about one tag, measured against guessing rather than
 * against perfection. Null below TAG_VERDICT_GATE judgements in that tag, or
 * when none of its questions are ones we can count the options of.
 *
 * Against guessing because that is the honest floor: on a four-option
 * question, 25% is what a reader scores without reading, and a tag verdict
 * that ignored it would call guessing "weak" and a little better than
 * guessing "fine".
 */
export function perTagVerdict(
  events: PaperEvent[],
  tag: string,
  optionCountOf: OptionCountLookup,
): TagVerdict | null {
  const judged = judgementsFrom(events).filter((j) => j.tag === tag);
  if (judged.length < TAG_VERDICT_GATE) return null;

  const baselines = judged
    .map((j) => optionCountOf(j.slug, j.questionId))
    .filter((n): n is number => typeof n === "number" && n >= 1)
    .map(chanceBaseline);
  if (baselines.length === 0) return null;
  const guessing = baselines.reduce((a, b) => a + b, 0) / baselines.length;

  const correct = judged.filter((j) => j.correct).length;
  const [lo, hi] = wilsonInterval(correct, judged.length);

  return {
    tag,
    verdict:
      lo > guessing
        ? "better-than-guessing"
        : hi < guessing
          ? "worse-than-guessing"
          : "not-yet-distinguishable",
    correct,
    total: judged.length,
    accuracyInterval: [100 * lo, 100 * hi],
    guessing: 100 * guessing,
  };
}
