/**
 * Detects statistical flyers using Grubbs' Test for Outliers
 * @param {Array<{x: number, y: number}>} shots - Array of shot coordinates
 * @param {number} ppi - Pixels per inch
 * @param {number} alpha - Significance level (default 0.05)
 */
export const detectFlyers = (shots, ppi, alpha = 0.05) => {
  if (!shots || shots.length < 3) return { cleanShots: shots, flyers: [] };

  const n = shots.length;

  // 1. Calculate POI
  const poi = shots.reduce(
    (acc, s) => ({ x: acc.x + s.x / n, y: acc.y + s.y / n }),
    { x: 0, y: 0 }
  );

  // 2. Calculate distance of each shot from POI
  const radii = shots.map((s, index) => {
    const dx = s.x - poi.x;
    const dy = s.y - poi.y;
    return {
      index,
      shot: s,
      distPx: Math.sqrt(dx * dx + dy * dy)
    };
  });

  // 3. Compute Mean and Standard Deviation of Radii
  const meanR = radii.reduce((sum, r) => sum + r.distPx, 0) / n;
  const variance = radii.reduce((sum, r) => sum + Math.pow(r.distPx - meanR, 2), 0) / (n - 1);
  const stdDevR = Math.sqrt(variance);

  if (stdDevR === 0) return { cleanShots: shots, flyers: [] };

  // 4. Find max distance shot
  let maxDiff = -1;
  let candidate = null;

  radii.forEach((r) => {
    const diff = Math.abs(r.distPx - meanR);
    if (diff > maxDiff) {
      maxDiff = diff;
      candidate = r;
    }
  });

  // 5. Compute G statistic
  const G = maxDiff / stdDevR;

  // Critical values table for Grubbs' Test (alpha = 0.05)
  const gCriticalTable = {
    3: 1.153, 4: 1.463, 5: 1.672, 6: 1.822, 7: 1.938,
    8: 2.032, 9: 2.110, 10: 2.176, 12: 2.285, 15: 2.409
  };

  const gCrit = gCriticalTable[Math.min(n, 15)] || 2.2;

  // 6. Evaluate outlier
  if (G > gCrit) {
    const flyers = [candidate.shot];
    const cleanShots = shots.filter((_, idx) => idx !== candidate.index);
    return { cleanShots, flyers, outlierIndex: candidate.index, gScore: G.toFixed(2) };
  }

  return { cleanShots: shots, flyers: [] };
};
