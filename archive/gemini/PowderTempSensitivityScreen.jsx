/**
 * Calculates Scope Tracking Error Percentage from Tall Target Test
 */
export const calculateScopeTrackingError = ({
  bottomPoiYPx,
  topPoiYPx,
  ppi,
  dialedUnits, // e.g. 30 MOA or 10 MIL
  unit = 'MOA',
  distanceYards = 100
}) => {
  const measuredHeightInches = Math.abs(topPoiYPx - bottomPoiYPx) / ppi;
  const angularFactor = unit === 'MOA' ? 0.010472 : 0.036;
  const expectedHeightInches = distanceYards * angularFactor * dialedUnits;

  const trackingCorrectionMultiplier = measuredHeightInches / expectedHeightInches;
  const errorPercentage = (trackingCorrectionMultiplier - 1) * 100;

  return {
    measuredHeightInches: measuredHeightInches.toFixed(2),
    expectedHeightInches: expectedHeightInches.toFixed(2),
    multiplier: trackingCorrectionMultiplier.toFixed(4), // e.g., 0.9750
    errorPercentage: `${errorPercentage > 0 ? '+' : ''}${errorPercentage.toFixed(1)}%`,
    recommendation: Math.abs(errorPercentage) > 1.5
      ? `Scope is under/over-tracking. Apply a scale factor of ${trackingCorrectionMultiplier.toFixed(3)} to ballistic solver output.`
      : 'Scope tracking is within acceptable 1.5% tolerance.'
  };
};