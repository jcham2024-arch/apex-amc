/**
 * Calculates Rayleigh Statistical Metrics for a shot string
 */
export const calculateRayleighGroupMetrics = (shotsInInches) => {
  const n = shotsInInches.length;
  if (n < 3) return null;

  const meanX = shotsInInches.reduce((sum, s) => sum + s.x, 0) / n;
  const meanY = shotsInInches.reduce((sum, s) => sum + s.y, 0) / n;

  // Calculate radius of each shot from center
  const radii = shotsInInches.map(s => Math.sqrt(Math.pow(s.x - meanX, 2) + Math.pow(s.y - meanY, 2)));
  const meanRadius = radii.reduce((sum, r) => sum + r, 0) / n;

  return {
    meanRadiusInches: meanRadius.toFixed(2),
    cep50Inches: (1.1774 * meanRadius).toFixed(2), // 50% of shots fall within this radius
    cep90Inches: (2.146 * meanRadius).toFixed(2),  // 90% of shots fall within this radius
    description: `50% of all future shots will land within ${(1.1774 * meanRadius).toFixed(2)}" of target center.`
  };
};