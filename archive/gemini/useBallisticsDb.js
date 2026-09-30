/**
 * Calculates POI, Mean Radius, and Turret Click Corrections
 */
export const calculateAdvancedStats = ({
  shots,            // Array of [{x, y}]
  poa,              // Point of Aim {x, y}
  ppi,              // Pixels Per Inch
  distanceYards,    // Distance in yards
  unit = 'MOA',     // 'MOA' | 'MIL'
  clickValue = 0.25 // 0.25 for 1/4 MOA, 0.1 for 0.1 MIL
}) => {
  if (!shots || shots.length === 0 || !ppi || ppi <= 0) {
    return null;
  }

  const n = shots.length;

  // 1. Calculate Center of Impact (POI)
  const poi = shots.reduce(
    (acc, shot) => ({ x: acc.x + shot.x / n, y: acc.y + shot.y / n }),
    { x: 0, y: 0 }
  );

  // 2. Calculate Mean Radius (MR)
  const sumRadiusPx = shots.reduce((sum, shot) => {
    const dx = shot.x - poi.x;
    const dy = shot.y - poi.y;
    return sum + Math.sqrt(dx * dx + dy * dy);
  }, 0);

  const meanRadiusPx = sumRadiusPx / n;
  const meanRadiusInches = meanRadiusPx / ppi;

  // Angular factor per 100 yards
  const angularFactor = unit === 'MOA' ? 0.010472 : 0.036;
  const inchesPerAngularUnit = (distanceYards / 100) * (angularFactor * 100);
  const meanRadiusAngular = meanRadiusInches / (distanceYards * angularFactor);

  // 3. Zero Offset (POI relative to POA)
  let zeroOffset = null;
  if (poa) {
    const dxPx = poi.x - poa.x;      // Positive = Right
    const dyPx = poa.y - poi.y;      // Positive = High (Screen y inverted)

    const dxInches = dxPx / ppi;
    const dyInches = dyPx / ppi;

    const dxAngular = dxInches / (distanceYards * angularFactor);
    const dyAngular = dyInches / (distanceYards * angularFactor);

    // Clicks calculation
    const hClicks = Math.round(Math.abs(dxAngular) / clickValue);
    const vClicks = Math.round(Math.abs(dyAngular) / clickValue);

    zeroOffset = {
      dxInches: dxInches.toFixed(2),
      dyInches: dyInches.toFixed(2),
      dxAngular: Math.abs(dxAngular).toFixed(2),
      dyAngular: Math.abs(dyAngular).toFixed(2),
      // Turret Instructions: Correct opposite to impact
      hDirection: dxInches > 0 ? 'LEFT' : dxInches < 0 ? 'RIGHT' : 'ZEROED',
      vDirection: dyInches > 0 ? 'DOWN' : dyInches < 0 ? 'UP' : 'ZEROED',
      hClicks,
      vClicks,
    };
  }

  return {
    poi,
    meanRadiusInches: meanRadiusInches.toFixed(2),
    meanRadiusAngular: meanRadiusAngular.toFixed(2),
    zeroOffset,
  };
};