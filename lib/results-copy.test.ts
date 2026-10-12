import { describe, expect, it } from "vitest";
import {
  counter,
  counterNote,
  directionLines,
  guessingFor,
  headline,
  smallPrint,
  tagCounter,
  tagVerdictLine,
} from "@/lib/results-copy";

describe("headline", () => {
  it("is the sentence it always was", () => {
    expect(headline(5, 82, 40)).toBe(
      "You said you were 82% sure. You were right 40% of the time.",
    );
  });
  it("says so when the judging round was skipped", () => {
    expect(headline(0, 0, 0)).toBe("You didn't answer the judging round.");
  });
});

describe("smallPrint", () => {
  it("computes the interval and the guessing line for 2 of 5", () => {
    expect(smallPrint(5, 2, 25, 5)).toBe(
      "That's 5 questions — your real appraisal accuracy is somewhere between 12% and 77%. Guessing scores 25%. Make 20 judgements and we can tell you which direction you lean.",
    );
  });
  it("is honest about a perfect round", () => {
    expect(smallPrint(5, 5, 25, 5)).toContain("between 57% and 100%");
  });
  it("is honest about a round with nothing right", () => {
    expect(smallPrint(5, 0, 25, 5)).toContain("between 0% and 43%");
  });
  it("singularises one question", () => {
    expect(smallPrint(1, 1, 25, 1)).toMatch(/^That's 1 question —/);
  });
  it("drops the promise once the gate is reached", () => {
    expect(smallPrint(5, 2, 25, 20)).not.toContain("Make 20");
  });
  it("says nothing when nothing was judged", () => {
    expect(smallPrint(0, 0, 25, 0)).toBeNull();
  });
});

describe("counter", () => {
  it("reads N of 20 and caps at 20", () => {
    expect(counter(5)).toBe("5 of 20");
    expect(counter(27)).toBe("20 of 20");
  });
  it("says what 20 is in papers and how many are left", () => {
    expect(counterNote(5)).toBe(
      "Each paper has five judgements, so 20 is four papers. Three more papers and we can tell you which way you lean.",
    );
    expect(counterNote(17)).toContain("One more paper and");
    expect(counterNote(20)).toBeNull();
  });
});

describe("directionLines", () => {
  it("states the lean and how loosely to hold it", () => {
    const [lean, caveat] = directionLines({
      direction: "overconfident",
      gap: 42,
      judgements: 20,
      meanConfidence: 82,
      accuracy: 40,
      accuracyInterval: [21.88, 61.34],
    });
    expect(lean).toBe(
      "You lean overconfident. Across 20 judgements, your confidence has run about 42 points ahead of your accuracy.",
    );
    expect(caveat).toBe(
      "That's a direction, not a precise figure. At 20 judgements, your accuracy of 40% could really be anywhere from 22% to 61%.",
    );
  });
  it("states underconfidence as plainly as overconfidence", () => {
    const [lean] = directionLines({
      direction: "underconfident",
      gap: 30,
      judgements: 20,
      meanConfidence: 50,
      accuracy: 80,
      accuracyInterval: [58, 92],
    });
    expect(lean).toBe(
      "You lean underconfident. Across 20 judgements, your accuracy has run about 30 points ahead of your confidence.",
    );
  });
});

describe("tags", () => {
  it("counts toward six", () => {
    expect(tagCounter(1)).toBe("1 of 6");
  });
  it("words a straddling interval as undecided, not weak", () => {
    expect(
      tagVerdictLine({
        tag: "scope",
        verdict: "not-yet-distinguishable",
        correct: 2,
        total: 6,
        accuracyInterval: [9.7, 70],
        guessing: 25,
      }),
    ).toBe(
      "Can't yet tell this apart from guessing. 2 of 6 could be anywhere from 10% to 70%, and that range includes the 25% you'd get by guessing.",
    );
  });
});

describe("guessingFor", () => {
  it("averages one over the option count", () => {
    expect(guessingFor([4, 4, 4])).toBe(25);
    expect(guessingFor([4, 2])).toBeCloseTo(37.5, 10);
  });
});

describe("gate notes", () => {
  it("computes the 20-judgement interval it quotes", async () => {
    const { gateNote } = await import("@/lib/results-copy");
    expect(gateNote()).toBe(
      "At 20 you get a direction and roughly how big the gap is, not a precise figure. Even then, 40% right could really be anywhere from 22% to 61%.",
    );
  });
  it("words a tag below its gate as a count and a rule", async () => {
    const { tagTallyLine } = await import("@/lib/results-copy");
    expect(tagTallyLine("what a number is a fraction of", 1)).toBe(
      "What a number is a fraction of. 1 of 6 judgements.",
    );
  });
});
