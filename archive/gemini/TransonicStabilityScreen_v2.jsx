/**
 * Warns if the bullet crosses the transonic boundary before reaching target distance
 */
export const evaluateTransonicStability = (velocityFps, tempF, distanceYards, Sg) => {
  const speedOfSoundFps = 49.022 * Math.sqrt(tempF + 459.67);
  const transonicCutoffFps = 1.2 * speedOfSoundFps;

  // Simple velocity decay estimate over distance
  const estimatedImpactVelocity = velocityFps - (distanceYards * 0.85);

  const isTransonic = estimatedImpactVelocity <= transonicCutoffFps;
  const isUnstableInTransonic = isTransonic && Sg < 1.5;

  return {
    speedOfSoundFps: speedOfSoundFps.toFixed(0),
    transonicCutoffFps: transonicCutoffFps.toFixed(0),
    estimatedImpactVelocity: Math.max(0, estimatedImpactVelocity).toFixed(0),
    isTransonic,
    statusMessage: isUnstableInTransonic
      ? `WARNING: Bullet enters transonic region at ~${distanceYards}yd with Sg=${Sg}. Expect severe stability loss and vertical stringing.`
      : isTransonic
      ? `INFO: Bullet is transonic at target (${estimatedImpactVelocity} fps). High Sg (${Sg}) should maintain stability.`
      : 'STABLE: Bullet remains supersonic through target distance.'
  };
};