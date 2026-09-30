/**
 * Weather conditions for a firing solution.
 *
 * The solver needs five inputs, and a shooter can obtain all of them either
 * from a hardware weather meter or from a public forecast API. This module
 * turns either source into the exact `FiringEnvironment` shape the solver
 * consumes, and records WHERE each number came from so the dope card can show
 * it.
 *
 * WHY A WEATHER STATION MATTERS SO MUCH
 * ------------------------------------
 * For a long-range shot, wind dominates every other correction. At 1000 yd a
 * 10 mph crosswind is worth about 8 MOA of hold, while a 20 degF temperature
 * swing and a 2,000 ft elevation change move the impact by well under 1 MOA.
 * So the wind number is the one worth being precise about, and it is also the
 * one a shooter is most likely to have a better source for than we do: a
 * Kestrel on the shooter''s belt beats a forecast model 20 miles away.
 *
 * The design rule here is therefore: **use a local measurement when the shooter
 * has one, fall back to a forecast only when they do not, and never silently
 * blend the two.** A dope card that quietly mixes a measured wind with a
 * forecast temperature is worse than one that says which is which.
 *
 * SOURCES
 * -------
 * Two APIs, both free for commercial use and both requiring no key:
 *
 *   Open-Meteo  https://open-meteo.com/en/docs
 *     - Keyless, no registration. CC-BY style attribution requested.
 *     - Provides wind speed and direction at 10 m, 80 m, 120 m and 180 m,
 *       plus gusts, temperature, relative humidity, surface pressure and cloud
 *       cover. The multi-height wind is unusually useful: a 10 m reading is
 *       surface drag-influenced, and at 1000 yd the bullet spends most of its
 *       flight in the 80-180 m layer.
 *
 *   NOAA / api.weather.gov  https://www.weather.gov/documentation/services-web-api
 *     - Keyless, but REQUIRES a User-Agent header identifying the application.
 *     - "Intended to be open data, free to use for any purpose", with
 *       published limits that are generous for typical use and unpublished
 *       specifics; exceeding them returns an error, typically clearing in
 *       about 5 seconds.
 *     - Better than Open-Meteo for OBSERVED station data (`/stations/...`),
 *       which is what a shooter actually wants: a real anemometer reading at a
 *       real location rather than a modelled grid value.
 *
 * Neither is suitable as a safety-critical source on its own. See `cautions`.
 */

/** Where a set of conditions came from. Drives what the UI must show. */
export type ConditionSource = 'measured' | 'forecast' | 'manual' | 'unknown';

/** A single weather reading, with its provenance. */
export interface WeatherReading<T> {
    readonly value: T;
    readonly source: ConditionSource;
    /** Where it came from, in words a shooter can check. */
    readonly detail: string;
    /** ISO timestamp of the reading, when known. */
    readonly observedAt?: string;
}

/**
 * Everything needed to solve a trajectory, with provenance on every field.
 *
 * A field the shooter did not supply is `null`, never a default. The solver
 * requires an explicit temperature, and inventing one is how a mountain shot
 * goes wrong.
 */
export interface WeatherConditions {
    /** Sustained wind speed, mph. */
    readonly windSpeedMph: WeatherReading<number> | null;
    /** Wind GUST speed, mph. A gust matters more than the mean at long range. */
    readonly windGustMph: WeatherReading<number> | null;
    /**
     * Wind direction the wind comes FROM, degrees clockwise from the
     * shooter's forward: 0 = from 12 o'clock, 90 = from 3 o'clock.
     */
    readonly windDirectionDeg: WeatherReading<number> | null;
    /** Ambient temperature, degF. */
    readonly tempF: WeatherReading<number> | null;
    /** Relative humidity, 0-100. */
    readonly humidityPct: WeatherReading<number> | null;
    /** Barometric pressure, inHg. Better than elevation for density. */
    readonly barometricPressureInHg: WeatherReading<number> | null;
    /** Station elevation, feet MSL. */
    readonly elevationFt: WeatherReading<number> | null;
    /** Visibility, miles. Low visibility changes how a shooter must hold. */
    readonly visibilityMi: WeatherReading<number> | null;
    /** Precipitation, inches over the period. */
    readonly precipitationIn: WeatherReading<number> | null;
    /** Where the data came from overall. */
    readonly source: ConditionSource;
    /** The API or device that produced it. */
    readonly provider: string;
}

/** An entirely empty set of conditions. Nothing is assumed. */
export const UNKNOWN_CONDITIONS: WeatherConditions = {
    windSpeedMph: null,
    windGustMph: null,
    windDirectionDeg: null,
    tempF: null,
    humidityPct: null,
    barometricPressureInHg: null,
    elevationFt: null,
    visibilityMi: null,
    precipitationIn: null,
    source: 'unknown',
    provider: 'none',
};

/** Clamp helper shared with the atmosphere module. */
function clamp(value: number, min: number, max: number): number {
    if (Number.isNaN(value)) return min;
    return value < min ? min : value > max ? max : value;
}

// ---------------------------------------------------------------------------
// Unit conversion
// ---------------------------------------------------------------------------

/** Metres per second to miles per hour. Some hardware reports m/s. */
export const MPS_TO_MPH = 2.236936;
const KMH_TO_MPH = 0.621371;
const HPA_TO_INHG = 0.02952998751;
const M_TO_FT = 3.280839895;
const VIS_KM_TO_MI = 0.621371192;

/**
 * Convert a meteorological wind direction to the shooter's frame.
 *
 * METEO CONVENTION, and it is the single most common source of a mirrored
 * dope card: a station reports the direction the wind is coming FROM, as a
 * compass bearing in degrees where 0 = North, 90 = East.
 *
 * The solver wants degrees clockwise from the SHOOTER's forward, where
 * 90 means a wind blowing from the shooter's right.
 *
 * The conversion depends on which way the shooter is facing, so it cannot be
 * done without that input. A shooter shooting due north and one shooting due
 * south have completely different interpretations of the same 270 degree
 * report.
 *
 * @param meteoDeg  direction FROM, compass degrees (0 N, 90 E, 180 S, 270 W)
 * @param facingDeg compass bearing the shooter is facing (0 N, 90 E, ...)
 */
export function meteoWindToShooterFrame(
    meteoDeg: number,
    facingDeg: number,
): number {
    // Normalise the difference into 0-360.
    const relative = (((meteoDeg - facingDeg) % 360) + 360) % 360;
    return relative;
}

/**
 * A compass bearing to a clock position, which is how shooters talk.
 *
 * 12 o'clock is the direction being faced. 3 o'clock is 90 degrees right.
 * The argument is already in the shooter's frame (see
 * {@link meteoWindToShooterFrame}).
 */
export function shooterFrameToClock(deg: number): number {
    return ((deg % 360) + 360) % 360 / 30;
}

/** Build a `Sourced` reading. */
function reading<T>(
    value: T,
    source: ConditionSource,
    detail: string,
    observedAt?: string,
): WeatherReading<T> {
    return observedAt !== undefined
        ? { value, source, detail, observedAt }
        : { value, source, detail };
}

/**
 * Conditions a shooter typed in themselves.
 *
 * This is the highest-trust source: it is what the person holding the rifle
 * says they observed. It should be preferred over any API.
 */
export function manualConditions(input: {
    windSpeedMph?: number;
    windGustMph?: number;
    windClock?: number;
    tempF?: number;
    humidityPct?: number;
    barometricPressureInHg?: number;
    elevationFt?: number;
    visibilityMi?: number;
    precipitationIn?: number;
}): WeatherConditions {
    const maybe = <T,>(
        value: T | undefined,
        detail: string,
    ): WeatherReading<T> | null =>
        value === undefined || value === null || Number.isNaN(value)
            ? null
            : reading(value, 'manual', detail);

    return {
        windSpeedMph: maybe(input.windSpeedMph, 'entered by shooter'),
        windGustMph: maybe(input.windGustMph, 'entered by shooter'),
        // A clock position is how shooters speak, so take it in that form and
        // store the degrees the solver wants.
        windDirectionDeg:
            input.windClock === undefined
                ? null
                : reading(
                      (clamp(input.windClock, 0, 12) / 12) * 360,
                      'manual',
                      'entered by shooter as a clock position',
                  ),
        tempF: maybe(input.tempF, 'entered by shooter'),
        humidityPct: maybe(input.humidityPct, 'entered by shooter'),
        barometricPressureInHg: maybe(
            input.barometricPressureInHg,
            'entered by shooter',
        ),
        elevationFt: maybe(input.elevationFt, 'entered by shooter'),
        visibilityMi: maybe(input.visibilityMi, 'entered by shooter'),
        precipitationIn: maybe(input.precipitationIn, 'entered by shooter'),
        source: 'manual',
        provider: 'shooter',
    };
}

// ---------------------------------------------------------------------------
// Open-Meteo parsing
// ---------------------------------------------------------------------------

/**
 * The shape returned by the Open-Meteo forecast endpoint.
 *
 * Declared as a loose record rather than an exhaustive type on purpose: the
 * API returns many variables we do not use, and a strict shape would make this
 * adapter break every time Open-Meteo adds a field.
 */
interface OpenMeteoResponse {
    readonly current?: Readonly<Record<string, number | string | null>>;
    readonly hourly?: Readonly<Record<string, ReadonlyArray<number | null>>>;
    readonly error?: boolean;
    readonly reason?: string;
}

/**
 * Convert an Open-Meteo reading into shooter-frame conditions.
 *
 * WIND HEIGHT MATTERS. Open-Meteo reports wind at 10 m, 80 m, 120 m and 180 m.
 * A 10 m reading is heavily influenced by surface friction, terrain and
 * obstacles, and is usually LIGHTER than the wind a bullet actually meets. At
 * 1000 yd the projectile spends most of its flight in the 80-180 m layer, where
 * the wind is closer to the free-stream value.
 *
 * We therefore prefer the 80 m reading and disclose that we did. This is a real
 * physical consideration, not a preference: a surface anemometer reading and a
 * forecast aloft will legitimately disagree, and the shooter should know which
 * one produced the hold.
 *
 * @param facingDeg compass bearing the shooter is facing
 */
export function fromOpenMeteo(
    payload: unknown,
    facingDeg: number,
): WeatherConditions {
    const data = payload as OpenMeteoResponse;
    if (data.error) {
        throw new Error(`Open-Meteo rejected the request: ${data.reason ?? 'unknown'}`);
    }

    const c = data.current;
    if (!c) {
        throw new Error('Open-Meteo response contained no current-conditions block.');
    }

    const num = (k: string): number | null => {
        const v = c[k];
        return typeof v === 'number' && Number.isFinite(v) ? v : null;
    };

    const detail = 'Open-Meteo forecast, 80 m level (bullet altitude at long range)';

    // Open-Meteo reports wind speed in km/h and direction in degrees FROM,
    // compass-referenced.
    const rawSpeed = num('wind_speed_80m') ?? num('wind_speed_10m');
    const rawGust = num('wind_gusts_10m');
    const rawDir = num('wind_direction_80m') ?? num('wind_direction_10m');
    const rawTempC = num('temperature_2m');
    const rawRh = num('relative_humidity_2m');
    const rawPressure = num('surface_pressure');
    const rawVisibility = num('visibility');
    const rawElevation = num('elevation');
    const time = typeof c.time === 'string' ? c.time : undefined;

    const speedMph = rawSpeed !== null ? rawSpeed * KMH_TO_MPH : null;
    const gustMph = rawGust !== null ? rawGust * KMH_TO_MPH : null;
    const tempF = rawTempC !== null ? (rawTempC * 9) / 5 + 32 : null;
    const pressureInHg = rawPressure !== null ? rawPressure * HPA_TO_INHG : null;

    return {
        windSpeedMph:
            speedMph !== null
                ? reading(speedMph, 'forecast', detail, time)
                : null,
        windGustMph:
            gustMph !== null
                ? reading(gustMph, 'forecast', 'Open-Meteo 10 m gust', time)
                : null,
        windDirectionDeg:
            rawDir !== null
                ? reading(
                      meteoWindToShooterFrame(rawDir, facingDeg),
                      'forecast',
                      'Open-Meteo 80 m, converted from compass degrees',
                      time,
                  )
                : null,
        tempF:
            tempF !== null ? reading(tempF, 'forecast', 'Open-Meteo 2 m', time) : null,
        humidityPct:
            rawRh !== null
                ? reading(clamp(rawRh, 0, 100), 'forecast', 'Open-Meteo 2 m', time)
                : null,
        barometricPressureInHg:
            pressureInHg !== null
                ? reading(pressureInHg, 'forecast', 'Open-Meteo surface pressure', time)
                : null,
        // Open-Meteo returns visibility in metres and elevation in metres too.
        elevationFt:
            rawElevation !== null
                ? reading(rawElevation * M_TO_FT, 'forecast', 'Open-Meteo elevation', time)
                : null,
        visibilityMi:
            rawVisibility !== null
                ? reading(
                      rawVisibility * VIS_KM_TO_MI / 1000,
                      'forecast',
                      'Open-Meteo visibility', 
                      time,
                  )
                : null,
        precipitationIn: null,
        source: 'forecast',
        provider: 'Open-Meteo',
    };
}

// ---------------------------------------------------------------------------
// Merging
// ---------------------------------------------------------------------------

/**
 * Overlay a set of conditions on top of another, preferring the overlay.
 *
 * Used to put a shooter's measured readings on top of a forecast, without
 * discarding the forecast fields the meter does not report (a Kestrel gives no
 * visibility, for example). Provenance travels with each field, so a merged
 * set is honest about which parts came from where.
 */
export function mergeConditions(
    base: WeatherConditions,
    overlay: WeatherConditions,
): WeatherConditions {
    const pick = <T,>(a: WeatherReading<T> | null, b: WeatherReading<T> | null): WeatherReading<T> | null =>
        b ?? a;

    return {
        windSpeedMph: pick(base.windSpeedMph, overlay.windSpeedMph),
        windGustMph: pick(base.windGustMph, overlay.windGustMph),
        windDirectionDeg: pick(base.windDirectionDeg, overlay.windDirectionDeg),
        tempF: pick(base.tempF, overlay.tempF),
        humidityPct: pick(base.humidityPct, overlay.humidityPct),
        barometricPressureInHg: pick(
            base.barometricPressureInHg,
            overlay.barometricPressureInHg,
        ),
        elevationFt: pick(base.elevationFt, overlay.elevationFt),
        visibilityMi: pick(base.visibilityMi, overlay.visibilityMi),
        precipitationIn: pick(base.precipitationIn, overlay.precipitationIn),
        // The overall source is the one that supplied the fields that matter
        // most for a firing solution: wind and temperature.
        source:
            overlay.windSpeedMph !== null || overlay.tempF !== null
                ? overlay.source
                : base.source,
        provider:
            overlay.source !== 'unknown' && overlay.windSpeedMph !== null
                ? `${base.provider} + ${overlay.provider}`
                : base.provider,
    };
}

// ---------------------------------------------------------------------------
// Honesty about what a forecast is worth
// ---------------------------------------------------------------------------

/**
 * Conditions a shooter should be told about before trusting a weather-driven
 * firing solution.
 *
 * The honest position is that a forecast is a model of the air several miles
 * away and several hours out, and a dope card computed from it is a starting
 * point rather than an answer. These warnings exist so the app can say that
 * plainly instead of presenting a number with false confidence.
 */
export function weatherCautions(
    conditions: WeatherConditions,
    options: { readonly rangeYd: number; readonly gustSpreadMph: number } = {
        rangeYd: 1000,
        gustSpreadMph: 0,
    },
): string[] {
    const cautions: string[] = [];

    if (conditions.source === 'forecast') {
        cautions.push(
            'Wind is from a forecast model, not a measurement. Forecast wind at ' +
            'your range can be wrong by several mph, and a 5 mph error at 1000 yd ' +
            'is roughly 4 MOA. Confirm with a local reading before committing.',
        );
    }

    if (conditions.windSpeedMph === null) {
        cautions.push(
            'No wind value was supplied, so no wind drift has been applied. ' +
            'At long range this is usually the largest uncorrected error.',
        );
    }

    const gust = conditions.windGustMph?.value;
    const sustained = conditions.windSpeedMph?.value;
    if (gust !== undefined && sustained !== undefined && sustained > 0) {
        const ratio = gust / sustained;
        // A gust factor above about 1.5 means the mean wind is a poor predictor
        // of any individual shot.
        if (ratio > 1.5) {
            cautions.push(
                `Gusts are ${ratio.toFixed(1)}x the sustained wind ` +
                `(${gust.toFixed(0)} vs ${sustained.toFixed(0)} mph). Hold for the ` +
                'gust, not the mean: the gust is the round you are most likely to shoot.',
            );
        }
    }

    if (conditions.precipitationIn !== null && conditions.precipitationIn.value > 0) {
        cautions.push(
            'Precipitation in the forecast. Rain and snow change both the drag ' +
            'and the visibility; a wet bullet is not the bullet your dope card was made for.',
        );
    }

    const visibility = conditions.visibilityMi?.value;
    if (visibility !== undefined && visibility < 2) {
        cautions.push(
            `Visibility is ${visibility.toFixed(1)} miles. You cannot see the ` +
            'target clearly enough to call a miss, so do not walk your hold onto the target.',
        );
    }

    if (options.rangeYd > 2000 && conditions.source !== 'measured') {
        cautions.push(
            'Beyond 2000 yd a modelled wind is a guess. Hold off and confirm with ' +
            'a local measurement or a spotter.',
        );
    }

    return cautions;
}
