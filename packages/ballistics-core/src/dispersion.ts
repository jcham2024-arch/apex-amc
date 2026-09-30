/**
 * Shot-group dispersion statistics.
 *
 * Conventions
 * -----------
 * A `Shot` is a point in *inches* on the target, measured from the aim point.
 * The caller converts pixels to inches; nothing here takes a
 * pixels-per-inch factor, because mixing the two silently was the original
 * defect in this code.
 *
 * Everything here is pure. No React, no storage, no DOM.
 */

export interface Shot {
  readonly x: number;
  readonly y: number;
}

export interface Dispersion {
  /** Centre of impact, inches. */
  readonly poi: Shot;
  /** Number of shots used. */
  readonly n: number;
  /** Standard deviation along each axis, inches. */
  readonly sigma: { readonly x: number; readonly y: number };
  /** CEP50 — radius containing 50% of shots, inches. */
  readonly cep50: number;
  /** CEP90 — radius containing 90% of shots, inches. */
  readonly cep90: number;
  /** Extreme spread — max distance between any two shots, inches. */
  readonly extremeSpread: number;
  /** Mean radius from POI, inches. */
  readonly meanRadius: number;
}

/**
 * Rayleigh quantiles for a bivariate normal.
 *
 * CEP50 = 1.1774 * sigma, CEP90 = 2.1460 * sigma, where
 * sigma = sqrt((sx^2 + sy^2) / 2).
 *
 * Using `0.5887 * (sx + sy)` instead is only correct when sx === sy; on an
 * elongated group (common in the field, from a wind or cant bias) it
 * understates CEP. See docs/BALLISTICS-AUDIT.md.
 */
const CEP50_K = 1.1774;
const CEP90_K = 2.146;

export function centreOfImpact(shots: readonly Shot[]): Shot {
  if (shots.length === 0) return { x: 0, y: 0 };
  let sx = 0;
  let sy = 0;
  for (const s of shots) {
    sx += s.x;
    sy += s.y;
  }
  return { x: sx / shots.length, y: sy / shots.length };
}

/**
 * Full dispersion summary for a group of shots.
 *
 * Uses the Bessel-corrected (`n - 1`) standard deviation. The centre of
 * impact is estimated from these same shots, so a degree of freedom is
 * consumed by that estimate and the naive `n` denominator biases sigma low.
 */
export function dispersion(shots: readonly Shot[]): Dispersion | null {
  const n = shots.length;
  // One shot has no dispersion; two give an SD but no meaningful centre.
  if (n < 2) return null;

  const poi = centreOfImpact(shots);

  let ssX = 0;
  let ssY = 0;
  for (const s of shots) {
    ssX += (s.x - poi.x) ** 2;
    ssY += (s.y - poi.y) ** 2;
  }
  const dof = n - 1;
  const sigma = { x: Math.sqrt(ssX / dof), y: Math.sqrt(ssY / dof) };

  const radialSigma = Math.sqrt((sigma.x ** 2 + sigma.y ** 2) / 2);

  let sumR = 0;
  for (const s of shots) {
    sumR += Math.hypot(s.x - poi.x, s.y - poi.y);
  }

  let extremeSpread = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = shots[i]!;
      const b = shots[j]!;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d > extremeSpread) extremeSpread = d;
    }
  }

  return {
    poi,
    n,
    sigma,
    cep50: CEP50_K * radialSigma,
    cep90: CEP90_K * radialSigma,
    extremeSpread,
    meanRadius: sumR / n,
  };
}

/**
 * Grubbs' test for a single outlier, applied to shot radii from the POI.
 *
 * IMPORTANT — this is a heuristic here, not a strict application of the
 * test. Grubbs' test is defined for a univariate sample; applying it to
 * radii from a fitted centre biases the statistic, and with very small
 * groups it will happily discard a legitimate shot. Callers must surface
 * the removed shot and let the shooter decide. It must never silently
 * reduce a group.
 */
export interface FlyerResult {
  readonly cleanShots: readonly Shot[];
  readonly flyer: Shot | null;
  readonly removedIndex: number | null;
  readonly gScore: number | null;
}

/** Two-sided Grubbs critical values at alpha = 0.05, by sample size. */
const GRUBBS_CRITICAL: Readonly<Record<number, number>> = {
  3: 1.153,
  4: 1.463,
  5: 1.672,
  6: 1.822,
  7: 1.938,
  8: 2.032,
  9: 2.11,
  10: 2.176,
  12: 2.285,
  15: 2.409,
};

export function detectFlyer(shots: readonly Shot[]): FlyerResult {
  const n = shots.length;
  const none: FlyerResult = {
    cleanShots: shots,
    flyer: null,
    removedIndex: null,
    gScore: null,
  };
  if (n < 3) return none;

  const poi = centreOfImpact(shots);
  const radii = shots.map((s) => Math.hypot(s.x - poi.x, s.y - poi.y));

  const meanR = radii.reduce((a, b) => a + b, 0) / n;
  const variance = radii.reduce((acc, r) => acc + (r - meanR) ** 2, 0) / (n - 1);
  const stdR = Math.sqrt(variance);

  // Every shot is coincident — nothing to flag, and G would divide by zero.
  if (stdR === 0) return none;

  let maxG = 0;
  let candidate = 0;
  for (let i = 0; i < n; i++) {
    const g = Math.abs(radii[i]! - meanR) / stdR;
    if (g > maxG) {
      maxG = g;
      candidate = i;
    }
  }

  const gCrit = GRUBBS_CRITICAL[Math.min(n, 15)] ?? 2.2;

  if (maxG > gCrit) {
    return {
      cleanShots: shots.filter((_, i) => i !== candidate),
      flyer: shots[candidate]!,
      removedIndex: candidate,
      gScore: maxG,
    };
  }

  return none;
}

