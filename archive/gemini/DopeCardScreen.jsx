/**
 * Decomposes group dispersion into Vertical (Velocity/Harmonics) vs Horizontal (Wind/Trigger)
 */
export const analyzeDispersionVectors = (shots, ppi, velocitySD = null) => {
  if (shots.length < 3) return null;

  const n = shots.length;
  const meanX = shots.reduce((sum, s) => sum + s.x, 0) / n;
  const meanY = shots.reduce((sum, s) => sum + s.y, 0) / n;

  // Calculate Variance in Inches
  const varX = shots.reduce((sum, s) => sum + Math.pow((s.x - meanX) / ppi, 2), 0) / (n - 1);
  const varY = shots.reduce((sum, s) => sum + Math.pow((s.y - meanY) / ppi, 2), 0) / (n - 1);

  const stdDevX = Math.sqrt(varX); // Horizontal spread
  const stdDevY = Math.sqrt(varY); // Vertical spread

  const aspectRatio = stdDevY / (stdDevX || 0.001); // Vertical / Horizontal ratio

  let primaryDiagnosis = 'Balanced Dispersion (Good Mechanical & Load Balance)';
  if (aspectRatio > 1.6) {
    primaryDiagnosis = velocitySD && velocitySD > 15 
      ? `High Vertical Dispersion driven by Muzzle Velocity SD (${velocitySD} fps). Work on neck tension or powder charge consistency.`
      : 'High Vertical Dispersion. Check rifle barrel heating, stock forend pressure, or breathing control.';
  } else if (aspectRatio < 0.6) {
    primaryDiagnosis = 'High Horizontal Dispersion. Check wind read consistency, scope level (cant), or lateral trigger torque.';
  }

  return {
    horizontalStdDevInches: stdDevX.toFixed(2),
    verticalStdDevInches: stdDevY.toFixed(2),
    aspectRatio: aspectRatio.toFixed(2),
    primaryDiagnosis,
  };
};