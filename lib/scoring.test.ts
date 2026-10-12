import { describe, expect, it } from "vitest";
import type { PaperEvent } from "@/lib/events";
import {
  DIRECTION_GATE,
  TAG_GATE,
  calibrationDirection,
  calibrationGap,
  judgementCount,
  perTagTally,
  perTagVerdict,
} from "@/lib/scoring";

function judge(
  slug: string,
  questionId: string,
  tag: string,
  correct: boolean,
  confidence: number,
): PaperEvent {
  return {
    name: "judge_answered",
    slug,
    props: { question_id: questionId, tag, correct, confidence },
  };
}

/** n judgements spread over papers of five, with a fixed confidence. */
function many(
  n: number,
  correctCount: number,
  confidence: number,
  tag = "scope",
): PaperEvent[] {
  return Array.from({ length: n }, (_, i) =>
    judge(`paper-${Math.floor(i / 5)}`, `q${i % 5}`, tag, i < correctCount, confidence),
  );
}

describe("judgementCount", () => {
  it("counts confidence-tagged judgements across papers", () => {
    expect(judgementCount(many(12, 6, 50))).toBe(12);
  });

  it("counts the same question id on two papers twice", () => {
    const events = [
      judge("a", "q1", "scope", true, 50),
      judge("b", "q1", "scope", true, 50),
    ];
    expect(judgementCount(events)).toBe(2);
  });

  it("counts a re-answered question on one paper once", () => {
    const events = [
      judge("a", "q1", "scope", false, 50),
      judge("a", "q1", "scope", true, 70),
    ];
    expect(judgementCount(events)).toBe(1);
  });

  it("ignores other events and judgements with no confidence", () => {
    const events: PaperEvent[] = [
      { name: "check_answered", slug: "a", props: { question_id: "c1", correct: true } },
      { name: "confidence_stated", slug: "a", props: { question_id: "q1", confidence: 80 } },
      { name: "judge_answered", slug: "a", props: { question_id: "q2", correct: true } },
      judge("a", "q3", "scope", true, 60),
    ];
    expect(judgementCount(events)).toBe(1);
  });
});

describe("calibrationGap", () => {
  it("is null with nothing to measure", () => {
    expect(calibrationGap([])).toBeNull();
  });

  it("is mean confidence minus accuracy", () => {
    // 80 stated, 2 of 4 right = 50% -> +30
    expect(calibrationGap(many(4, 2, 80))).toBeCloseTo(30, 10);
  });

  it("goes negative when underconfident", () => {
    // 40 stated, 4 of 5 right = 80% -> -40
    expect(calibrationGap(many(5, 4, 40))).toBeCloseTo(-40, 10);
  });

  it("uses the last answer when a question is re-answered", () => {
    const events = [
      judge("a", "q1", "scope", false, 90),
      judge("a", "q1", "scope", true, 60),
    ];
    expect(calibrationGap(events)).toBeCloseTo(-40, 10);
  });
});

describe("calibrationDirection", () => {
  it("is null one below the gate", () => {
    expect(calibrationDirection(many(DIRECTION_GATE - 1, 0, 100))).toBeNull();
  });

  it("names a direction at the gate", () => {
    const d = calibrationDirection(many(DIRECTION_GATE, 10, 90));
    expect(d).toEqual({
      direction: "overconfident",
      gap: 40,
      size: 40,
      judgements: 20,
    });
  });

  it("names underconfidence", () => {
    const d = calibrationDirection(many(20, 18, 50));
    expect(d?.direction).toBe("underconfident");
    expect(d?.gap).toBeCloseTo(-40, 10);
    expect(d?.size).toBeCloseTo(40, 10);
  });

  it("calls a gap within 10 points well-calibrated", () => {
    expect(calibrationDirection(many(20, 12, 70))?.direction).toBe(
      "well-calibrated",
    );
    expect(calibrationDirection(many(20, 12, 50))?.direction).toBe(
      "well-calibrated",
    );
    expect(calibrationDirection(many(20, 12, 71))?.direction).toBe(
      "overconfident",
    );
  });
});

describe("perTagTally", () => {
  it("tallies every tag, sorted, with no gate", () => {
    const events = [
      judge("a", "q1", "scope", true, 80),
      judge("a", "q2", "hedging", false, 60),
      judge("b", "q1", "scope", false, 40),
    ];
    expect(perTagTally(events)).toEqual([
      { tag: "hedging", correct: 0, total: 1, meanConfidence: 60 },
      { tag: "scope", correct: 1, total: 2, meanConfidence: 60 },
    ]);
  });

  it("is empty with no judgements", () => {
    expect(perTagTally([])).toEqual([]);
  });
});

describe("perTagVerdict", () => {
  it("is null one below the gate", () => {
    expect(perTagVerdict(many(TAG_GATE - 1, 5, 90), "scope")).toBeNull();
  });

  it("is null for a tag never seen", () => {
    expect(perTagVerdict(many(20, 10, 50), "hedging")).toBeNull();
  });

  it("does not let other tags count towards the gate", () => {
    const events = [...many(5, 5, 90, "scope"), ...many(10, 5, 50, "hedging")];
    expect(perTagVerdict(events, "scope")).toBeNull();
  });

  it("is above chance when the whole interval clears 1 in 4", () => {
    const v = perTagVerdict(many(6, 6, 90), "scope");
    expect(v?.verdict).toBe("above-chance");
    expect(v?.chance).toBe(0.25);
    expect(v?.accuracy).toBe(1);
    expect(v?.gap).toBeCloseTo(-10, 10);
  });

  it("is at chance when the interval straddles it", () => {
    // 2 of 6: Wilson ~[0.10, 0.70] straddles 0.25
    expect(perTagVerdict(many(6, 2, 50), "scope")?.verdict).toBe("at-chance");
  });

  it("is below chance only when the whole interval sits under it", () => {
    // 0 of 6: Wilson high ~0.39, still straddles 0.25
    expect(perTagVerdict(many(6, 0, 50), "scope")?.verdict).toBe("at-chance");
    // 0 of 20: Wilson high ~0.16, below 0.25
    expect(perTagVerdict(many(20, 0, 50), "scope")?.verdict).toBe(
      "below-chance",
    );
  });

  it("uses the option count it is given", () => {
    // 4 of 6 against 1 in 2 straddles; against 1 in 4 it does not.
    expect(perTagVerdict(many(6, 4, 50), "scope", 2)?.verdict).toBe("at-chance");
    expect(perTagVerdict(many(6, 4, 50), "scope", 4)?.verdict).toBe(
      "above-chance",
    );
  });
});
