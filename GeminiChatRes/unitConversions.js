/**
 * Advanced Statistical Ballistics Utilities
 */

// 1. Calculate Circular Error Probable (CEP)
export const calculateCEP = (shots, poi, ppi) => {
  if (shots.length < 2 || !ppi) return { cep50: 0, cep95: 0 };

  const sigmaX = Math.sqrt(
    shots.reduce((acc, s) => acc + Math.pow((s.x - poi.x) / ppi, 2), 0) / (shots.length - 1)
  );
  const sigmaY = Math.sqrt(
    shots.reduce((acc, s) => acc + Math.pow((s.y - poi.y) / ppi, 2), 0) / (shots.length - 1)
  );

  // Rayleigh distribution approximations
  const cep50 = 0.5887 * (sigmaX + sigmaY);
  const cep95 = 1.241 * (sigmaX + sigmaY);

  return { cep50: cep50.toFixed(2), cep95: cep95.toFixed(2) };
};

// 2. Grubbs' Test for Outlier/Flyer Detection
export const filterFlyersGrubbs = (shots, ppi) => {
  if (shots.length < 3) return { cleanShots: shots, flyer: null };

  const n = shots.length;
  const poi = shots.reduce(
    (acc, s) => ({ x: acc.x + s.x / n, y: acc.y + s.y / n }),
    { x: 0, y: 0 }
  );

  const radii = shots.map((s, idx) => ({
    idx,
    shot: s,
    r: Math.sqrt(Math.pow(s.x - poi.x, 2) + Math.pow(s.y - poi.y, 2)) / ppi,
  }));

  const meanR = radii.reduce((a, b) => a + b.r, 0) / n;
  const stdR = Math.sqrt(
    radii.reduce((a, b) => a + Math.pow(b.r - meanR, 2), 0) / (n - 1)
  );

  let maxG = 0;
  let candidate = null;

  radii.forEach((item) => {
    const G = Math.abs(item.r - meanR) / stdR;
    if (G > maxG) {
      maxG = G;
      candidate = item;
    }
  });

  // Critical values for alpha = 0.05
  const gCritMap = { 3: 1.15, 4: 1.46, 5: 1.67, 6: 1.82, 7: 1.94, 8: 2.03, 9: 2.11, 10: 2.18 };
  const gCrit = gCritMap[Math.min(n, 10)] || 2.2;

  if (maxG > gCrit) {
    return {
      cleanShots: shots.filter((_, i) => i !== candidate.idx),
      flyer: candidate.shot,
      gScore: maxG.toFixed(2),
    };
  }

  return { cleanShots: shots, flyer: null };
};

// 3. Multi-Group Load Comparison
export const compareLoads = (groups) => {
  // groups = [{ loadName: 'Load A', shots: [...], ppi: 100 }, ...]
  return groups.map((g) => {
    const { cleanShots, flyer } = filterFlyersGrubbs(g.shots, g.ppi);
    const poi = cleanShots.reduce(
      (acc, s) => ({ x: acc.x + s.x / cleanShots.length, y: acc.y + s.y / cleanShots.length }),
      { x: 0, y: 0 }
    );
    const cep = calculateCEP(cleanShots, poi, g.ppi);

    return {
      loadName: g.loadName,
      totalShots: g.shots.length,
      hasFlyer: !!flyer,
      cep50: cep.cep50,
      cep95: cep.cep95,
    };
  });
};