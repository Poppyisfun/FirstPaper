/**
 * Every sentence on the results screen that carries a number.
 *
 * Kept out of the component so the numbers in the copy are tested where they
 * are made: a sentence that says "between 12% and 77%" must be computed, not
 * typed, and a test fails the day it drifts.
 *
 * The register is a mirror, not a grade. Each sentence states something true
 * about the reader that they did not know, and stops. Nothing congratulates a
 * gap and nothing scolds one. Below a gate, there is no verdict at all — not
 * a cautious one, not a kind one — only the count and how far to the gate.
 *
 * Wording choices and the alternatives considered are logged in DECISIONS.md.
 */

import {
  DIRECTION_GATE,
  JUDGEMENTS_PER_PAPER,
  TAG_VERDICT_GATE,
  type CalibrationDirection,
  type TagVerdict,
} from "@/lib/scoring";
import { chanceBaseline, pct, wilsonInterval } from "@/lib/stats";

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

/** Small whole numbers in words, as prose writes them. */
export function inWords(n: number): string {
  return WORDS[n] ?? String(n);
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/** The centrepiece. Kept exactly as it was: it is a tally, not a verdict. */
export function headline(
  answered: number,
  meanConfidence: number,
  accuracy: number,
): string {
  if (answered === 0) return "You didn't answer the judging round.";
  return `You said you were ${Math.round(meanConfidence)}% sure. You were right ${Math.round(accuracy)}% of the time.`;
}

/**
 * The small print under the headline: how much a session's worth of
 * questions can support, and where guessing sits.
 *
 * The last sentence is dropped once the reader is past the gate, because the
 * direction is then on screen and the promise has been kept.
 */
export function smallPrint(
  answered: number,
  correct: number,
  /** 0-100. */
  guessing: number,
  judgementsSoFar: number,
): string | null {
  if (answered === 0) return null;
  const [lo, hi] = wilsonInterval(correct, answered);
  const count = `${answered} ${plural(answered, "question", "questions")}`;
  const lines = [
    `That's ${count} — your real appraisal accuracy is somewhere between ${pct(lo)}% and ${pct(hi)}%.`,
    `Guessing scores ${Math.round(guessing)}%.`,
  ];
  if (judgementsSoFar < DIRECTION_GATE) {
    lines.push(
      `Make ${DIRECTION_GATE} judgements and we can tell you which direction you lean.`,
    );
  }
  return lines.join(" ");
}

/** "5 of 20". The one counter, shown the same way everywhere. */
export function counter(judgementsSoFar: number): string {
  return `${Math.min(judgementsSoFar, DIRECTION_GATE)} of ${DIRECTION_GATE}`;
}

/** What 20 means in papers, and how far away it is. Null once reached. */
export function counterNote(judgementsSoFar: number): string | null {
  if (judgementsSoFar >= DIRECTION_GATE) return null;
  const papers = DIRECTION_GATE / JUDGEMENTS_PER_PAPER;
  const toGo = Math.ceil((DIRECTION_GATE - judgementsSoFar) / JUDGEMENTS_PER_PAPER);
  return (
    `Each paper has ${inWords(JUDGEMENTS_PER_PAPER)} judgements, so ${DIRECTION_GATE} is ${inWords(papers)} papers. ` +
    `${capitalise(inWords(toGo))} more ${plural(toGo, "paper", "papers")} and we can tell you which way you lean.`
  );
}

/**
 * The direction, once there are 20 judgements to stand on. Two sentences:
 * the lean, then how loosely to hold it.
 */
export function directionLines(d: CalibrationDirection): [string, string] {
  const n = d.judgements;
  const lean =
    d.direction === "overconfident"
      ? `You lean overconfident. Across ${n} judgements, your confidence has run about ${d.gap} points ahead of your accuracy.`
      : d.direction === "underconfident"
        ? `You lean underconfident. Across ${n} judgements, your accuracy has run about ${d.gap} points ahead of your confidence.`
        : `You don't lean either way. Across ${n} judgements, your confidence and your accuracy are within ${d.gap} ${plural(d.gap, "point", "points")} of each other.`;

  const [lo, hi] = d.accuracyInterval;
  const caveat = `That's a direction, not a precise figure. At ${n} judgements, your accuracy of ${Math.round(d.accuracy)}% could really be anywhere from ${Math.round(lo)}% to ${Math.round(hi)}%.`;
  return [lean, caveat];
}

/** Below the per-tag gate: the tally and the distance to the gate. */
export function tagCounter(total: number): string {
  return `${Math.min(total, TAG_VERDICT_GATE)} of ${TAG_VERDICT_GATE}`;
}

/** At or above the per-tag gate: what can be said, measured against guessing. */
export function tagVerdictLine(v: TagVerdict): string {
  const [lo, hi] = v.accuracyInterval.map(Math.round);
  const g = Math.round(v.guessing);
  const tally = `${v.correct} of ${v.total}`;
  switch (v.verdict) {
    case "better-than-guessing":
      return `Better than guessing. ${tally}, and even the low end of the range, ${lo}%, is above the ${g}% you'd get by guessing.`;
    case "worse-than-guessing":
      return `Below guessing. ${tally}, and even the high end of the range, ${hi}%, is under ${g}%. One wrong answer keeps looking right to you here, and it's worth finding out why.`;
    default:
      return `Can't yet tell this apart from guessing. ${tally} could be anywhere from ${lo}% to ${hi}%, and that range includes the ${g}% you'd get by guessing.`;
  }
}

/** Mean of 1/options, as a percentage, for a set of option counts. */
export function guessingFor(optionCounts: number[]): number {
  if (optionCounts.length === 0) return 0;
  return (
    (100 * optionCounts.reduce((sum, k) => sum + chanceBaseline(k), 0)) /
    optionCounts.length
  );
}

/**
 * Under the counter: what 20 buys, with the interval computed for a typical
 * 40% so the "still wide" claim is a number rather than an adjective.
 */
export function gateNote(): string {
  const n = DIRECTION_GATE;
  const k = Math.round(0.4 * n);
  const [lo, hi] = wilsonInterval(k, n);
  return `At ${n} you get a direction and roughly how big the gap is, not a precise figure. Even then, ${pct(k / n)}% right could really be anywhere from ${pct(lo)}% to ${pct(hi)}%.`;
}

/** A tag below its gate: what it tests, and how far it is from the gate. */
export function tagTallyLine(phrase: string | undefined, total: number): string {
  const lead = phrase ? `${capitalise(phrase)}. ` : "";
  return `${lead}${tagCounter(total)} judgements.`;
}

/** Said once, above the tag list, so each row can stay a count. */
export function tagRule(): string {
  return `Each kind of judgement needs ${inWords(TAG_VERDICT_GATE)} before we say anything about it. Below that, we only count.`;
}
