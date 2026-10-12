import { describe, expect, it } from "vitest";
import { chanceBaseline, wilsonInterval } from "@/lib/stats";

/* These are the numbers the results copy quotes. If one of these fails, the
   maths changed and the copy is now wrong: fix the maths, not the test. */

describe("wilsonInterval", () => {
  it("2 of 5 is roughly 12% to 77%", () => {
    const [low, high] = wilsonInterval(2, 5);
    expect(low).toBeCloseTo(0.1176, 3);
    expect(high).toBeCloseTo(0.7693, 3);
    expect(low.toFixed(2)).toBe("0.12");
    expect(high.toFixed(2)).toBe("0.77");
  });

  it("8 of 20 is roughly 22% to 61%", () => {
    const [low, high] = wilsonInterval(8, 20);
    expect(low).toBeCloseTo(0.2188, 3);
    expect(high).toBeCloseTo(0.6134, 3);
    expect(low.toFixed(2)).toBe("0.22");
    expect(high.toFixed(2)).toBe("0.61");
  });

  it("0 trials gives the whole range, not a point", () => {
    expect(wilsonInterval(0, 0)).toEqual([0, 1]);
  });

  it("0 successes starts at 0 and does not collapse", () => {
    const [low, high] = wilsonInterval(0, 5);
    expect(low).toBe(0);
    expect(high).toBeCloseTo(0.4345, 3);
  });

  it("all successes ends at 1 and does not collapse", () => {
    const [low, high] = wilsonInterval(5, 5);
    expect(low).toBeCloseTo(0.5655, 3);
    expect(high).toBe(1);
  });

  it("stays inside 0-1 and is symmetric about p = 0.5", () => {
    const [low, high] = wilsonInterval(10, 20);
    expect(low).toBeCloseTo(1 - high, 10);
  });

  it("widens as the confidence level rises", () => {
    const [l90, h90] = wilsonInterval(8, 20, 0.9);
    const [l99, h99] = wilsonInterval(8, 20, 0.99);
    expect(l99).toBeLessThan(l90);
    expect(h99).toBeGreaterThan(h90);
  });
});

describe("chanceBaseline", () => {
  it("is one over the option count", () => {
    expect(chanceBaseline(4)).toBe(0.25);
    expect(chanceBaseline(3)).toBeCloseTo(1 / 3, 12);
    expect(chanceBaseline(2)).toBe(0.5);
  });
});
