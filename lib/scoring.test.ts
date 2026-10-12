import { describe, expect, it } from "vitest";
import type { PaperEvent } from "@/lib/events";
import {
  DIRECTION_GATE,
  TAG_VERDICT_GATE,
  calibrationDirection,
  calibrationGap,
  judgementCount,
  perTagTally,
  perTagVerdict,
} from "@/lib/scoring";

let clock = 1_000;

/** One judge_answered event. */
function judged(
  slug: string,
  questionId: string,
  correct: boolean,
  confidence: number | null,
  tag = "scope",
): PaperEvent {
  return {
    name: "judge_answered",
    slug,
    at: clock++,
    props: {
      question_id: questionId,
      chosen_option_id: correct ? "a" : "b",
      correct,
      confidence,
      tag,
    },
  };
}

/** n judgements across as many papers as needed, five per paper. */
function many(
  n: number,
  correctCount: number,
  confidence: number,
  tag = "scope",
): PaperEvent[] {
  return Array.from({ length: n }, (_, i) =>
    judged(`paper-${Math.floor(i / 5)}`, `a${(i % 5) + 1}`, i < correctCount, confidence, tag),
  );
}

const fourOptions = () => 4;

describe("judgementCount", () => {
  it("counts only confidence-tagged judge answers", () => {
    const events: PaperEvent[] = [
      judged("p", "a1", true, 80),
      judged("p", "a2", false, null),
      { name: "check_answered", slug: "p", props: { question_id: "c1", correct: true } },
      { name: "confidence_stated", slug: "p", props: { question_id: "a3", confidence: 60 } },
    ];
    expect(judgementCount(events)).toBe(1);
  });

  it("counts a question once per paper, keeping the first answer", () => {
    const events = [judged("p", "a1", false, 90), judged("p", "a1", true, 90)];
    expect(judgementCount(events)).toBe(1);
    // The first answer was wrong at 90%: gap 90, not 90 - 100.
    expect(calibrationGap(events)).toBe(90);
  });

  it("counts the same question id on different papers separately", () => {
    expect(judgementCount([judged("p", "a1", true, 50), judged("q", "a1", true, 50)])).toBe(2);
  });
});

describe("calibrationGap", () => {
  it("is null with nothing judged", () => {
    expect(calibrationGap([])).toBeNull();
  });

  it("is mean confidence minus accuracy, in points", () => {
    // 82% sure, 2 of 5 right: 82 - 40 = 42.
    expect(calibrationGap(many(5, 2, 82))).toBeCloseTo(42, 10);
  });

  it("is negative when underconfident", () => {
    expect(calibrationGap(many(5, 5, 30))).toBeCloseTo(-70, 10);
  });
});

describe("calibrationDirection", () => {
  it("is null one judgement below the gate", () => {
    expect(calibrationDirection(many(DIRECTION_GATE - 1, 0, 99))).toBeNull();
  });

  it("returns a direction and gap size at the gate", () => {
    const d = calibrationDirection(many(20, 8, 82));
    expect(d).not.toBeNull();
    expect(d!.direction).toBe("overconfident");
    expect(d!.gap).toBe(42);
    expect(d!.judgements).toBe(20);
    expect(Math.round(d!.accuracyInterval[0])).toBe(22);
    expect(Math.round(d!.accuracyInterval[1])).toBe(61);
  });

  it("calls a confidence below accuracy underconfident", () => {
    expect(calibrationDirection(many(20, 18, 50))!.direction).toBe("underconfident");
  });

  it("calls a gap within ten points well-calibrated", () => {
    expect(calibrationDirection(many(20, 12, 65))!.direction).toBe("well-calibrated");
  });

  it("does not reach the gate by re-reading one paper", () => {
    const fourPasses = [0, 1, 2, 3].flatMap(() => many(5, 5, 90));
    expect(fourPasses).toHaveLength(20);
    expect(calibrationDirection(fourPasses)).toBeNull();
  });
});

describe("perTagTally", () => {
  it("tallies every tag, including ones with one judgement", () => {
    const events = [
      judged("p", "a1", true, 70, "scope"),
      judged("p", "a2", false, 90, "denominator"),
    ];
    expect(perTagTally(events)).toEqual([
      { tag: "denominator", correct: 0, total: 1, meanConfidence: 90 },
      { tag: "scope", correct: 1, total: 1, meanConfidence: 70 },
    ]);
  });
});

describe("perTagVerdict", () => {
  it("is null below six judgements in that tag", () => {
    const events = many(TAG_VERDICT_GATE - 1, 5, 80, "hedging");
    expect(perTagVerdict(events, "hedging", fourOptions)).toBeNull();
  });

  it("ignores judgements in other tags when gating", () => {
    const events = [...many(20, 10, 60, "scope"), ...many(1, 1, 60, "hedging")];
    expect(perTagVerdict(events, "hedging", fourOptions)).toBeNull();
  });

  it("is better than guessing when the interval clears 25%", () => {
    const v = perTagVerdict(many(6, 6, 80, "hedging"), "hedging", fourOptions);
    expect(v!.verdict).toBe("better-than-guessing");
    expect(v!.guessing).toBe(25);
  });

  it("is not yet distinguishable when the interval straddles guessing", () => {
    const v = perTagVerdict(many(6, 2, 80, "hedging"), "hedging", fourOptions);
    expect(v!.verdict).toBe("not-yet-distinguishable");
  });

  it("is worse than guessing only when the whole interval sits below it", () => {
    const v = perTagVerdict(many(15, 0, 80, "hedging"), "hedging", fourOptions);
    expect(v!.verdict).toBe("worse-than-guessing");
  });

  it("is null when no question's option count is known", () => {
    expect(perTagVerdict(many(6, 6, 80, "hedging"), "hedging", () => undefined)).toBeNull();
  });
});
