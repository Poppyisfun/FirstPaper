import { describe, expect, it } from "vitest";
import { chanceBaseline, pct, wilsonInterval } from "@/lib/stats";

/* These are the numbers the results screen quotes. If one of these tests
   fails, the copy on screen is now saying something different. */

describe("wilsonInterval", () => {
  it("2 of 5 is roughly 12% to 77%", () => {
    const [lo, hi] = wilsonInterval(2, 5);
    expect(lo).toBeCloseTo(0.1176, 3);
    expect(hi).toBeCloseTo(0.7693, 3);
    expect([pct(lo), pct(hi)]).toEqual([12, 77]);
  });

  it("8 of 20 is roughly 22% to 61%", () => {
    const [lo, hi] = wilsonInterval(8, 20);
    expect(lo).toBeCloseTo(0.2188, 3);
    expect(hi).toBeCloseTo(0.6134, 3);
    expect([pct(lo), pct(hi)]).toEqual([22, 61]);
  });

  it("0 trials says nothing: the whole range", () => {
    expect(wilsonInterval(0, 0)).toEqual([0, 1]);
  });

  it("0 successes has a lower bound of exactly 0 and a real upper bound", () => {
    const [lo, hi] = wilsonInterval(0, 5);
    expect(lo).toBe(0);
    expect(hi).toBeCloseTo(0.4345, 3);
  });

  it("all successes has an upper bound of exactly 1 and a real lower bound", () => {
    const [lo, hi] = wilsonInterval(5, 5);
    expect(hi).toBe(1);
    expect(lo).toBeCloseTo(0.5655, 3);
  });

  it("is symmetric around one half", () => {
    const [lo, hi] = wilsonInterval(3, 10);
    const [lo2, hi2] = wilsonInterval(7, 10);
    expect(lo).toBeCloseTo(1 - hi2, 10);
    expect(hi).toBeCloseTo(1 - lo2, 10);
  });

  it("narrows with a lower confidence level", () => {
    const [lo95, hi95] = wilsonInterval(8, 20);
    const [lo80, hi80] = wilsonInterval(8, 20, 0.8);
    expect(hi80 - lo80).toBeLessThan(hi95 - lo95);
  });

  it("rejects impossible counts", () => {
    expect(() => wilsonInterval(6, 5)).toThrow(RangeError);
    expect(() => wilsonInterval(-1, 5)).toThrow(RangeError);
    expect(() => wilsonInterval(1, 5, 1)).toThrow(RangeError);
  });
});

describe("chanceBaseline", () => {
  it("is one over the option count", () => {
    expect(chanceBaseline(4)).toBe(0.25);
    expect(chanceBaseline(3)).toBeCloseTo(1 / 3, 12);
    expect(chanceBaseline(1)).toBe(1);
  });

  it("rejects counts that are not a positive integer", () => {
    expect(() => chanceBaseline(0)).toThrow(RangeError);
    expect(() => chanceBaseline(2.5)).toThrow(RangeError);
  });
});
