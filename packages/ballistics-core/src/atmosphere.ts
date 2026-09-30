/**
 * Atmospheric properties. Pure, no dependencies.
 *
 * Every function documents the source of its coefficient and the verification
 * check run against it. If you change a constant you must re-run that check;
 * `test/atmosphere.test.ts` is the enforcement mechanism.
 *
 * Unit conventions throughout this package:
 *   - Imperial: feet, pounds, seconds, Fahrenheit, grains, inches
 *   - `grain`: 1/7000 lb exactly
 *   - Density ratios are relative to ISA sea level (sigma = 1.0)
 */

import {
    SPEED_OF_SOUND_COEF,
    STANDARD_GRAVITY_FPS2,
    STANDARD_SEA_LEVEL_DENSITY_SLUG_PER_FT3,
    ISA_BAROMETRIC_PRESSURE_EXPONENT,
    ISA_LAPSE_RATE_K_PER_FT,
    STANDARD_SEA_LEVEL_PRESSURE_INHG,
    STANDARD_SEA_LEVEL_TEMP_K,
} from './provenance/constants.ts';

/** Clamp a value into a closed interval. NaN collapses to `min`. */
export function clamp(value: number, min: number, max: number): number {
    if (Number.isNaN(value)) return min;
    return value < min ? min : value > max ? max : value;
}

/** Convert Fahrenheit to Rankine. Rankine = Fahrenheit + 459.67, exact. */
export const fahrenheitToRankine = (f: number): number => f + 459.67;

/** Convert Fahrenheit to Kelvin. */
export const fahrenheitToKelvin = (f: number): number => ((f + 459.67) * 5) / 9;

/** Convert Celsius to Fahrenheit. */
export const celsiusToFahrenheit = (c: number): number => (c * 9) / 5 + 32;

/**
 * Speed of sound, fps, at a given temperature in Fahrenheit.
 *
 *   a = k * sqrt(T_Rankine)
 *
 * SOURCES
 * ------
 * The sqrt(T) form is the linearised solution of the Laplace equation for a
 * gas, c = sqrt(gamma * R * T). It is the form used in every standard
 * atmosphere table (ICAO Doc 7488/3; U.S. Standard Atmosphere 1976).
 *
 * k = 49.022 fps/sqrt(R) is fitted so the ISA table is reproduced at low
 * altitude, where the linearised and full solutions agree to better than
 * 0.1%. It is an implementation constant *for the standard atmosphere*, not a
 * measured speed of sound in real air â€” real air is humid, and humidity
 * raises it. See {@link speedOfSoundHumidFps}.
 *
 * VERIFIED: 1116.4 fps at 59 degF, matching ISA sea level at 15 degC.
 */
export function speedOfSoundFps(tempF: number): number {
    return SPEED_OF_SOUND_COEF.value * Math.sqrt(fahrenheitToRankine(tempF));
}

/**
 * Speed of sound corrected for humidity, fps.
 *
 * Humid air is *less* dense than dry air at the same temperature, so sound
 * travels faster. Standard correction:
 *
 *   c = c_dry * sqrt(1 + 0.003 * e_hPa / (273.15 + T_C))
 *
 * SOURCES
 * ------
 * The 0.003-per-hPa coefficient is the widely used moist-air acoustics
 * relation, originating with Crandall (1928), *Studies in the acoustics of
 * non-ductile materials*, and standard in military atmospheric-acoustics
 * references.
 *
 * Why it matters here: the drag tables are indexed by Mach number, so an
 * error in the speed of sound becomes an error in the drag coefficient.
 * The effect is small (a few tenths of a percent at high humidity) â€” wind
 * and elevation dominate â€” but it is free to compute.
 *
 * @param relativeHumidityPct 0-100
 */
export function speedOfSoundHumidFps(tempF: number, relativeHumidityPct: number): number {
    const tempC = fahrenheitToKelvin(tempF) - 273.15;
    // Saturation vapour pressure, hPa, Magnus/Tetens approximation:
    //   e_s = 6.112 * exp(17.67 * T / (T + 243.5))
    const eSat = 6.112 * Math.exp((17.67 * tempC) / (tempC + 243.5));
    const e = eSat * (clamp(relativeHumidityPct, 0, 100) / 100);
    return speedOfSoundFps(tempF) * Math.sqrt(1 + (0.003 * e) / (273.15 + tempC));
}

/**
 * Mach number. `M = v / a`.
 *
 * This is the index into the G1/G7 drag tables, so it is the pivot of the
 * whole solver: an error here becomes an error in the drag coefficient.
 *
 * VERIFIED: 1116.4 fps at 59 degF gives Mach 1.0.
 */
export function machNumber(velocityFps: number, tempF: number): number {
    return velocityFps / speedOfSoundFps(tempF);
}



// ---------------------------------------------------------------------------
// Density
// ---------------------------------------------------------------------------

/**
/**
 * Barometric density ratio (sigma) for a station at a known elevation.
 *
 * Derived from the ideal-gas relation rather than fitted:
 *
 *   rho = p / (R * T)   =>   sigma = (p / p_0) * (T_0 / T)
 *
 * In the standard troposphere the pressure at elevation h follows the
 * barometric formula with a constant lapse rate L, and the ISA temperature
 * there is T = T_0 - L h. Combining the two collapses to one power law:
 *
 *   sigma = (1 - L h / T_0)^4.2559
 *
 * SOURCES
 * ------
 * U.S. Standard Atmosphere, 1976 (NOAA/NASA/USAF). Constants used:
 *   T_0            = 288.15 K    standard sea-level temperature
 *   L              = 0.0019812 K/ft   ISA tropospheric lapse rate
 *   exponent       = 4.2559     (5.25588 pressure exponent, minus 1)
 *
 * UNIT WARNING, because it has already caused a bug here: the lapse rate is
 * published as 0.0065 K PER METRE. Treating that number as K/ft is a 3.28x
 * error which makes density nearly constant with altitude - it returns sigma
 * 0.998 at 10,000 ft instead of 0.7385, handing a Denver shooter a sea-level
 * firing solution. The constant is stored in K/ft so the mistake cannot be
 * made at the call site.
 *
 * MEANING OF `tempF`: the temperature observed AT `altitudeFt`, not a
 * sea-level reference. 59 degF at 10,000 ft describes a very warm day up
 * there and correctly yields near-sea-level density. The ISA temperature at
 * 10,000 ft is about -10 degF, which yields the standard 0.7385.
 *
 * VERIFIED: sigma = 1.0000 at 0 ft; 0.9011 at 5000 ft; 0.7385 at 10000 ft,
 * matching the ISA table. See test/atmosphere.test.ts.
 */
export function densityRatio(altitudeFt: number, tempF = 59): number {
    const tempK = fahrenheitToKelvin(tempF);
    const pressureRatio = Math.pow(
        1 - (ISA_LAPSE_RATE_K_PER_FT.value * altitudeFt) / STANDARD_SEA_LEVEL_TEMP_K.value,
        ISA_BAROMETRIC_PRESSURE_EXPONENT.value,
    );
    return pressureRatio * (STANDARD_SEA_LEVEL_TEMP_K.value / tempK);
}
/**
 * Density ratio from an observed barometric pressure and temperature.
 *
 * Prefer this over {@link densityRatio} when the shooter has a real weather
 * station. Pressure alone fixes the pressure altitude, and combined with the
 * observed temperature it gives the true density ratio including the
 * non-standard part. This is what a Kestrel or a local station reports.
 *
 *   sigma = (p / 29.9213) * (518.67 / T_rankine)
 *
 * SOURCES
 * ------
 * 29.9213 inHg is standard sea-level pressure (U.S. Standard Atmosphere 1976;
 * 1013.25 hPa exactly). 518.67 degR is 59 degF. The relation is the ideal-gas
 * density ratio above with the exponents already cancelled.
 */
export function densityRatioFromPressure(pressureInHg: number, tempF: number): number {
    if (!(pressureInHg > 0)) {
        throw new RangeError('Barometric pressure must be positive.');
    }
    const tempK = fahrenheitToKelvin(tempF);
    return (pressureInHg / STANDARD_SEA_LEVEL_PRESSURE_INHG.value) * (STANDARD_SEA_LEVEL_TEMP_K.value / tempK);
}

/**
 * Pressure altitude, feet. Inverts the ISA pressure profile.
 *
 *   h = (T_0 / L) * (1 - (p / p_0)^(1 / 5.25588))
 *
 * T_0 / L is the 145,442 ft constant that appears in the standard form of the
 * barometric formula.
 */
export function pressureAltitudeFt(pressureInHg: number): number {
    if (!(pressureInHg > 0)) {
        throw new RangeError('Barometric pressure must be positive.');
    }
    const ratio = pressureInHg / STANDARD_SEA_LEVEL_PRESSURE_INHG.value;
    return (STANDARD_SEA_LEVEL_TEMP_K.value / ISA_LAPSE_RATE_K_PER_FT.value) * (1 - Math.pow(ratio, 1 / ISA_BAROMETRIC_PRESSURE_EXPONENT.value));
}

/**
 * Density altitude, feet.
 *
 * The elevation at which an ISA column has the same density as the observed
 * air. This is the standard aviation figure, and long-range shooters use it
 * for one reason: **velocity depends on density, so a high density altitude means a
 * flatter, faster trajectory.** It is the best single summary of "how much is
 * this shot going to surprise me today."
 *
 * It is the number to show a shooter, not a substitute for the trajectory
 * calculation - the solver wants the density ratio itself.
 */
export function densityAltitudeFt(altitudeFt: number, tempF: number): number {
    const sigma = densityRatio(altitudeFt, tempF);
    return (STANDARD_SEA_LEVEL_TEMP_K.value / ISA_LAPSE_RATE_K_PER_FT.value) * (1 - Math.pow(sigma, 1 / ISA_BAROMETRIC_PRESSURE_EXPONENT.value));
}




// ---------------------------------------------------------------------------
// Humidity
// ---------------------------------------------------------------------------

/**
 * Humidity correction to the density ratio.
 *
 * Water vapour is lighter than dry air (MW 18.015 vs 28.97 g/mol), so humid
 * air is less dense. A shooter in high humidity gets a slightly flatter,
 * slightly faster trajectory than temperature alone predicts.
 *
 *   factor = 1 - 0.378 * e / p
 *
 * SOURCES
 * ------
 * The standard moist-air density relation from Dalton's law of partial
 * pressures. The coefficient 0.378 follows from the molecular weights:
 *   1 - (M_water / M_dry) = 1 - (18.015 / 28.97) = 0.378.
 *
 * MAGNITUDE: at 100% RH and 77 degF, e/p is about 0.024, so the correction is
 * roughly 0.9%. Real but second-order. It is computed because a good weather
 * station reports humidity anyway, and the shooter should not wonder why we
 * ignore a number they were handed.
 *
 * @param pressureInHg barometric pressure, needed to scale e/p
 */
export function humidityDensityCorrection(
    tempF: number,
    relativeHumidityPct: number,
    pressureInHg = 29.9213,
): number {
    const tempC = fahrenheitToKelvin(tempF) - 273.15;
    const eSat = 6.112 * Math.exp((17.67 * tempC) / (tempC + 243.5));
    const e = eSat * (clamp(relativeHumidityPct, 0, 100) / 100);
    const pHpa = pressureInHg * 33.8639;
    return 1 - 0.378 * (e / pHpa);
}

// ---------------------------------------------------------------------------
// Wind
// ---------------------------------------------------------------------------

/**
 * Resolve a wind report into the components the solver needs.
 *
 * A shooter reports wind as "10 mph from 10 o'clock" â€” a *direction of
 * origin*. The solver needs the vector the air moves *toward*, because that
 * is what carries the bullet sideways. Getting this backwards makes a
 * left-to-right crosswind push the bullet right-to-left, a classic and very
 * embarrassing bug.
 *
 * @param speedMph     sustained wind speed, mph
 * @param directionDeg direction the wind comes FROM, degrees clockwise from
 *                      the shooter's forward: 0 = from 12 o'clock (a headwind),
 *                      90 = from 3 o'clock (a left-to-right crosswind)
 * @returns `crossFps` positive to the shooter's RIGHT, `headFps` positive
 *          INTO the shooter
 */
export function resolveWind(speedMph: number, directionDeg: number): {
    readonly crossFps: number;
    readonly headFps: number;
} {
    const rad = (directionDeg * Math.PI) / 180;
    // Direction of origin -> direction of motion is a 180 degree flip. A wind
    // from 90 degrees (the shooter's right) blows toward the left, so the
    // cross component must be negative.
    const toFps = 5280 / 3600; // mph -> ft/s
    return {
        crossFps: -speedMph * Math.sin(rad) * toFps,
        headFps: speedMph * Math.cos(rad) * toFps,
    };
}

// ---------------------------------------------------------------------------
// Density-dependent velocity
// ---------------------------------------------------------------------------

/**
 * Muzzle-velocity correction for a density ratio.
 *
 * For a fixed energy input, v ~ sigma^(1/3): drag force scales with density,
 * so the work done over a fixed distance scales with density, and v ~ W^(1/2)
 * implies v ~ sigma^(1/3).
 *
 * SOURCES
 * ------
 * This follows from the drag model rather than an empirical fit. In practice
 * shooters observe ~0.1-0.2% velocity change per 1000 ft of elevation for a
 * medium-burn rifle cartridge; the cube-root law predicts 0.1%/1000 ft.
 *
 * FIRST-ORDER ONLY. The dominant effect at altitude is that the bullet loses
 * less velocity, so the trajectory is flatter â€” a correction the solver
 * applies to the trajectory, not one the shooter applies to the muzzle
 * velocity. See docs/BALLISTICS-AUDIT.md.
 */
export function correctVelocityForDensity(
    velocityFps: number,
    densityRatioValue: number,
): number {
    return velocityFps * Math.cbrt(densityRatioValue);
}

/** Effective air density, slugs per cubic foot, from a density ratio. */
export function airDensitySlugPerFt3(densityRatioValue: number): number {
    return STANDARD_SEA_LEVEL_DENSITY_SLUG_PER_FT3.value * densityRatioValue;
}

/** Standard gravity, fps^2, for the solver. */
export const gravityFps2 = (): number => STANDARD_GRAVITY_FPS2.value;

