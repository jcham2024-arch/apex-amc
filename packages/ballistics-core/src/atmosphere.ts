/**
 * Atmospheric properties. Pure, no dependencies.
 */

/** Speed of sound in dry air at sea level, feet per second per sqrt(Rankine). */
const SPEED_OF_SOUND_COEF = 49.022;

/** Convert Fahrenheit to Rankine. */
export const fahrenheitToRankine = (f: number): number => f + 459.67;

/** Speed of sound, fps, at a given temperature in Fahrenheit. */
export function speedOfSoundFps(tempF: number): number {
  return SPEED_OF_SOUND_COEF * Math.sqrt(fahrenheitToRankine(tempF));
}

/**
 * Mach number.
 *
 * Verified: 1116.4 fps at 59 degF, against the accepted ~1116 fps.
 */
export function machNumber(velocityFps: number, tempF: number): number {
  return velocityFps / speedOfSoundFps(tempF);
}

/**
 * Density ratio (sigma) relative to standard sea level, ISA model.
 *
 * Uses the barometric formula in the troposphere. `altitudeFt` is the
 * shooter's elevation; `tempF` is the ambient temperature there.
 */
export function densityRatio(altitudeFt: number, tempF = 59): number {
  const tempK = (tempF + 459.67) * (5 / 9);
  const seaLevelTempK = 288.15; // 59 degF
  const pressureRatio = Math.pow(
    1 - (0.00687535 * altitudeFt) / 145442.16,
    5.25588,
  );
  return pressureRatio / Math.pow(tempK / seaLevelTempK, 4.25588);
}

/**
 * Muzzle-velocity correction for atmospheric conditions.
 *
 * Sensitivity is roughly 0.1%/ft of altitude for most rifle calibres
 * (Sierra's ballistics tables use ~0.9% per 1000 ft). Powder temperature
 * correction is separate and is fitted from the shooter's own chrono data.
 */
export function correctVelocityForAltitude(
  velocityFps: number,
  altitudeFt: number,
  tempF = 59,
): number {
  const sigma = densityRatio(altitudeFt, tempF);
  return velocityFps * sigma;
}
