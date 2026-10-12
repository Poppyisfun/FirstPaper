/**
 * Small-sample statistics for the results screen.
 *
 * A reader answers five appraisal questions on a paper. Five is enough to
 * say something, and nowhere near enough to say much, so every proportion we
 * show needs an honest range around it. The Wilson score interval is the one
 * that behaves at these sizes: unlike the textbook normal interval it never
 * runs below 0 or above 1, and it does not collapse to a single point when a
 * reader gets everything right or everything wrong.
 *
 * The UI copy quotes these numbers, so the tests pin them. Change the maths
 * here and the copy is wrong.
 */

/**
 * The z-score that leaves `confidence` of a standard normal in the middle.
 *
 * Acklam's rational approximation to the inverse normal CDF, good to about
 * 1e-9 — far tighter than anything we round to on screen.
 */
function zFor(confidence: number): number {
  const p = 1 - (1 - confidence) / 2;

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
  if (p > 1 - low) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  const q = p - 0.5;
  const r = q * q;
  return (
    ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  );
}

/**
 * Wilson score interval for a proportion, as [low, high] on a 0-1 scale.
 *
 * With no trials there is no information, and the honest interval is the
 * whole range rather than a point at zero.
 */
export function wilsonInterval(
  successes: number,
  trials: number,
  confidence = 0.95,
): [number, number] {
  if (trials <= 0) return [0, 1];

  const z = zFor(confidence);
  const z2 = z * z;
  const p = successes / trials;

  const denominator = 1 + z2 / trials;
  const centre = (p + z2 / (2 * trials)) / denominator;
  const margin =
    (z * Math.sqrt((p * (1 - p)) / trials + z2 / (4 * trials * trials))) /
    denominator;

  // Clamp only against floating-point dust; the formula itself stays in range.
  return [Math.max(0, centre - margin), Math.min(1, centre + margin)];
}

/** The accuracy a reader would get by picking at random. */
export function chanceBaseline(optionCount: number): number {
  return 1 / optionCount;
}
