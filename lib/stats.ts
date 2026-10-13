/**
 * The small amount of statistics the product quotes to readers.
 *
 * Two functions, both pure, both pinned by tests in stats.test.ts. The numbers
 * they produce appear in sentences on the results screen and the class view
 * ("somewhere between 12% and 77%", "guessing scores 25%"), so a change here
 * is a change to what the product tells people about themselves.
 *
 * Wilson rather than the textbook p ± z·√(p(1-p)/n) interval, because the
 * textbook one collapses to a single point at 0 of 5 and 5 of 5 — exactly the
 * cases where a reader most needs to hear that five questions is not much.
 */

/**
 * Inverse of the standard normal CDF, by Acklam's rational approximation.
 * Accurate to about 1e-9, which is far beyond what a percentage on screen
 * needs. Only here so the confidence level is a parameter rather than a
 * hardcoded 1.96.
 */
function probit(p: number): number {
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ];
  const low = 0.02425;

  if (p < low) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  if (p > 1 - low) return -probit(1 - p);

  const q = p - 0.5;
  const r = q * q;
  return (
    ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) *
      q) /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  );
}

/**
 * Wilson score interval for a proportion, as fractions in [0, 1].
 *
 * Zero trials returns [0, 1]: with no evidence, every rate is possible, and
 * saying so is more honest than throwing or returning a point.
 */
export function wilsonInterval(
  successes: number,
  trials: number,
  confidence = 0.95,
): [number, number] {
  if (!Number.isFinite(trials) || trials <= 0) return [0, 1];
  if (successes < 0 || successes > trials) {
    throw new RangeError(
      `wilsonInterval: successes (${successes}) must be between 0 and trials (${trials}).`,
    );
  }
  if (!(confidence > 0 && confidence < 1)) {
    throw new RangeError(
      `wilsonInterval: confidence must be strictly between 0 and 1, got ${confidence}.`,
    );
  }

  const z = probit(1 - (1 - confidence) / 2);
  const z2 = z * z;
  const n = trials;
  const p = successes / n;

  const denom = 1 + z2 / n;
  const centre = (p + z2 / (2 * n)) / denom;
  const half = (z / denom) * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));

  /* At 0 and n successes one bound is exactly 0 or 1 in exact arithmetic;
     pin it, rather than let floating point show "-0%" or "100.0000001%". */
  const lowBound = successes === 0 ? 0 : Math.max(0, centre - half);
  const highBound = successes === trials ? 1 : Math.min(1, centre + half);
  return [lowBound, highBound];
}

/**
 * What a reader scores by guessing uniformly among the options, as a fraction.
 * Four options is 0.25.
 */
export function chanceBaseline(optionCount: number): number {
  if (!Number.isInteger(optionCount) || optionCount < 1) {
    throw new RangeError(
      `chanceBaseline: optionCount must be a positive integer, got ${optionCount}.`,
    );
  }
  return 1 / optionCount;
}

/** A fraction in [0, 1] as a whole-number percentage, for copy. */
export function pct(fraction: number): number {
  return Math.round(fraction * 100);
}
