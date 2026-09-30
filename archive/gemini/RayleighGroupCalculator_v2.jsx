/**
 * Calculates Powder Temperature Sensitivity Coefficient from two chronograph logs
 */
export const calculatePowderTempSensitivity = (logCold, logHot) => {
  // logCold: { tempF: 35, velocityFps: 2680 }
  // logHot:  { tempF: 85, velocityFps: 2730 }
  
  const deltaTemp = logHot.tempF - logCold.tempF;
  const deltaVel = logHot.velocityFps - logCold.velocityFps;

  if (deltaTemp <= 0) return null;

  const coefficient = deltaVel / deltaTemp; // fps per degree F

  let rating = 'Extremely Temperature Stable';
  if (coefficient > 1.2) rating = 'Temperature Sensitive (Significant winter/summer drop shift)';
  else if (coefficient > 0.6) rating = 'Moderate Sensitivity';

  return {
    fpsPerDegreeF: coefficient.toFixed(2),
    rating,
    predictedVelAtZeroF: (logCold.velocityFps - (logCold.tempF * coefficient)).toFixed(0),
    predictedVelAt100F: (logCold.velocityFps + ((100 - logCold.tempF) * coefficient)).toFixed(0),
  };
};