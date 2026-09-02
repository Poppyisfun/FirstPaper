/**
 * Scoring rules for the paper experience. Pure functions, kept out of the
 * components so the numbers can be reasoned about (and tested) in one place.
 * The table these implement is fixed — see CLAUDE.md.
 */

export const SOLO_XP = 8;
export const PEEK_COST = 5;
export const QUIZ_XP = 20;
export const JUDGE_XP = 20;
export const START_BONUS = 60;

/** How confident the reader claimed to be on a judge question. */
export type Wager = 1 | 2;

export type Rank = "Explorer" | "Reader" | "Critic" | "Peer Reviewer";

/** XP never goes negative anywhere it is displayed or stored. */
export const floor0 = (n: number) => (n < 0 ? 0 : n);

export function rankFor(xp: number): Rank {
  if (xp >= 380) return "Peer Reviewer";
  if (xp >= 260) return "Critic";
  if (xp >= 140) return "Reader";
  return "Explorer";
}

export const RANK_NOTE: Record<Rank, string> = {
  "Peer Reviewer":
    "You read it, understood it, and judged it on its own terms. That's what scientists do to each other's work.",
  Critic:
    "You're reading like a critic — catching hedges, controls and limits. One more paper at this level and it's a habit.",
  Reader:
    "Solid reading. Push harder on the judging round next time — that's where the real skill lives.",
  Explorer: "Good start. The judging round is the part worth replaying.",
};

/**
 * Judge scoring. Claiming certainty and missing is the only way to lose XP;
 * an honest guess that misses costs nothing.
 */
export function judgeDelta(correct: boolean, wager: Wager): number {
  if (correct) return JUDGE_XP * wager;
  return wager === 2 ? -JUDGE_XP : 0;
}

export type GateTone = "warn" | "good" | "neutral";

/** Which of the three gate messages the reader has earned. */
export function gateTone(engaged: number, total: number): GateTone {
  if (engaged === 0) return "warn";
  if (total > 0 && engaged / total >= 0.8) return "good";
  return "neutral";
}

export type Phase =
  | "intro"
  | "read"
  | "gate"
  | "quiz"
  | "judge"
  | "plain"
  | "results";

/** Locked order. Nothing may reorder or skip a step. */
export const PHASE_ORDER: Phase[] = [
  "intro",
  "read",
  "gate",
  "quiz",
  "judge",
  "plain",
  "results",
];

/** Progress-bar percentage for the nav HUD. */
export function progressFor(args: {
  phase: Phase;
  sec: number;
  sections: number;
  qIdx: number;
  quizLen: number;
  jIdx: number;
  judgeLen: number;
}): number {
  const { phase, sec, sections, qIdx, quizLen, jIdx, judgeLen } = args;
  switch (phase) {
    case "intro":
      return 0;
    case "read":
      return sections ? 4 + (36 * (sec + 1)) / sections : 4;
    case "gate":
      return 40;
    case "quiz":
      return quizLen ? 40 + (25 * qIdx) / quizLen : 40;
    case "judge":
      return judgeLen ? 65 + (25 * jIdx) / judgeLen : 65;
    case "plain":
      return 92;
    case "results":
      return 100;
  }
}
