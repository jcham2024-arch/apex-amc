/**
 * Atmosphere tests.
 *
 * These exist because the atmosphere module carried a units bug that made air
 * density nearly independent of altitude: the ISA lapse rate is published as
 * 0.0065 K PER METRE but was being used as K/ft, a 3.28x error. At 10,000 ft
 * the function returned sigma 0.998 instead of 0.7385, which would have handed
 * a Denver shooter a sea-level firing solution with no visible symptom.
 *
 * The assertions below are the ISA table values, which are the authority.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
    speedOfSoundFps,
    speedOfSoundHumidFps,
    machNumber,
    densityRatio,
    densityRatioFromPressure,
    densityAltitudeFt,
    pressureAltitudeFt,
    humidityDensityCorrection,
    resolveWind,
    fahrenheitToKelvin,
    fahrenheitToRankine,
    correctVelocityForDensity,
    clamp,
} from '../src/atmosphere.ts';

describe('temperature conversions', () => {
    test('Rankine and Kelvin are exact', () => {
        assert.ok(Math.abs(fahrenheitToRankine(59) - 518.67) < 1e-9);
        assert.ok(Math.abs(fahrenheitToKelvin(59) - 288.15) < 1e-9);
        assert.equal(fahrenheitToKelvin(32), 273.15);
    });
});

describe('speed of sound', () => {
    test('matches the ISA sea-level value', () => {
        // ISA sea level is 15 degC and defines the speed of sound as 1116.4 fps.
        assert.ok(Math.abs(speedOfSoundFps(59) - 1116.4) < 0.1);
    });

    test('scales with the square root of absolute temperature', () => {
        const ratio = speedOfSoundFps(119) / speedOfSoundFps(59);
        assert.ok(Math.abs(ratio - Math.sqrt(578.67 / 518.67)) < 1e-6);
    });

    test('is lower in cold air', () => {
        assert.ok(speedOfSoundFps(-20) < speedOfSoundFps(59));
    });

    test('humidity raises the speed of sound', () => {
        // Humid air is less dense, so sound travels faster.
        const dry = speedOfSoundHumidFps(77, 0);
        const humid = speedOfSoundHumidFps(77, 90);
        assert.ok(humid > dry, 'saturated air must sound faster than dry air');
        // The effect is real but small: under 1% for near-saturated air.
        assert.ok((humid / dry - 1) < 0.01, 'humidity effect must stay under 1%');
    });
});

describe('mach number', () => {
    test('is 1.0 at the speed of sound', () => {
        assert.ok(Math.abs(machNumber(speedOfSoundFps(59), 59) - 1) < 1e-9);
    });
});

describe('density ratio', () => {
    // ISA table: sigma at altitude for the ISA temperature at that altitude.
    test('is exactly 1.0 at sea level in standard conditions', () => {
        assert.ok(Math.abs(densityRatio(0, 59) - 1) < 1e-6);
    });

    test('decreases with altitude, which is the property the units bug broke', () => {
        const sigma = [0, 1000, 2000, 5000, 10000].map((ft) => densityRatio(ft, 59));
        for (let i = 1; i < sigma.length; i++) {
            assert.ok(
                sigma[i]! < sigma[i - 1]!,
                `sigma must fall with altitude; got ${sigma[i - 1]} then ${sigma[i]}`,
            );
        }
    });

    test('at 10000 ft with a standard-atmosphere temperature, sigma is 0.7385', () => {
        // The ISA temperature at 10,000 ft is about -10 degF, not 59 degF.
        const isaTempF = 59 - 0.003566 * 10000;
        assert.ok(
            Math.abs(densityRatio(10000, isaTempF) - 0.7385) < 0.002,
            `expected 0.7385, got ${densityRatio(10000, isaTempF)}`,
        );
    });


    test('a hot day at altitude is LESS dense than a cold one', () => {
        // Fixed elevation, higher temperature means a longer, warmer air column, so
        // the air is thinner. This is the whole point of density altitude:
        // a Denver summer day at 6000 ft behaves like a much lower station.
        const warm = densityRatio(6000, 80);
        const cold = densityRatio(6000, 20);
        assert.ok(warm < cold, `80 degF (${warm.toFixed(3)}) must be less dense than 20 degF (${cold.toFixed(3)})`);
    });
});

describe('density from observed pressure', () => {
    test('standard pressure at standard temperature is sigma 1', () => {
        assert.ok(Math.abs(densityRatioFromPressure(29.9213, 59) - 1) < 1e-6);
    });

    test('agrees with the elevation model at a matched station', () => {
        // 24.9 inHg is the standard pressure at about 5,000 ft.
        const byPressure = densityRatioFromPressure(24.9, 59);
        const byAltitude = densityRatio(5000, 59);
        assert.ok(
            Math.abs(byPressure - byAltitude) < 0.01,
            `pressure-derived ${byPressure.toFixed(4)} vs altitude-derived ${byAltitude.toFixed(4)}`,
        );
    });

    test('rejects a non-positive pressure', () => {
        assert.throws(() => densityRatioFromPressure(0, 59), RangeError);
        assert.throws(() => densityRatioFromPressure(-5, 59), RangeError);
    });
});

describe('pressure and density altitude', () => {
    test('pressure altitude inverts the barometric formula', () => {
        // 24.9 inHg should read close to 5,000 ft.
        const pa = pressureAltitudeFt(24.9);
        assert.ok(pa > 4800 && pa < 5200, `expected ~5000 ft, got ${pa.toFixed(0)}`);
    });

    test('density altitude equals pressure altitude in standard conditions', () => {
        // By definition: in ISA, density altitude and pressure altitude coincide.
        const da = densityAltitudeFt(5000, 59);
        const pa = pressureAltitudeFt(29.9213 * Math.pow(1 - 0.0019812 * 5000 / 288.15, 5.25588));
        assert.ok(Math.abs(da - pa) < 50, `DA ${da.toFixed(0)} vs PA ${pa.toFixed(0)}`);
    });

    test('a hot day has a density altitude above the station', () => {
        // Denver at 80 degF is a thinner atmosphere than Denver at 59 degF.
        assert.ok(densityAltitudeFt(5280, 80) > densityAltitudeFt(5280, 59));
    });
});

describe('humidity', () => {
    test('reduces density slightly', () => {
        const dry = humidityDensityCorrection(77, 0);
        const humid = humidityDensityCorrection(77, 100);
        assert.ok(humid < dry, 'humid air must be less dense');
        // Around 0.9% at 77 degF and 100% RH.
        assert.ok(Math.abs(1 - humid) < 0.015, `correction ${humid} is out of range`);
    });

    test('is a no-op at zero humidity', () => {
        assert.ok(Math.abs(humidityDensityCorrection(59, 0) - 1) < 1e-9);
    });
});

describe('wind resolution', () => {
    test('a wind from the right blows to the left', () => {
        // 90 degrees means the wind comes FROM the shooter's right.
        const w = resolveWind(10, 90);
        assert.ok(w.crossFps < 0, 'crosswind from the right must be negative');
        assert.ok(Math.abs(w.headFps) < 0.001, 'a pure crosswind has no head component');
    });

    test('a wind from straight ahead is a pure headwind', () => {
        const w = resolveWind(10, 0);
        assert.ok(w.headFps > 0, 'a wind from 12 o clock pushes back');
        assert.ok(Math.abs(w.crossFps) < 0.001);
    });

    test('components are perpendicular and sum to the wind speed', () => {
        for (const deg of [0, 30, 90, 145, 270]) {
            const w = resolveWind(10, deg);
            const magnitude = Math.hypot(w.crossFps, w.headFps);
            assert.ok(
                Math.abs(magnitude - 10 * (5280 / 3600)) < 0.01,
                `at ${deg} deg components should sum to the wind speed`,
            );
        }
    });

    test('10 mph converts to 14.67 fps', () => {
        assert.ok(Math.abs(resolveWind(10, 0).headFps - 14.6667) < 0.01);
    });
});

describe('misc helpers', () => {
    test('clamp bounds values and rejects NaN', () => {
        assert.equal(clamp(5, 0, 10), 5);
        assert.equal(clamp(-5, 0, 10), 0);
        assert.equal(clamp(50, 0, 10), 10);
        assert.equal(clamp(NaN, 3, 10), 3);
    });

    test('density velocity correction follows the cube root law', () => {
        // v ~ sigma^(1/3): a 20% density loss costs about 6% velocity.
        const corrected = correctVelocityForDensity(2650, 0.8);
        assert.ok(Math.abs(corrected / 2650 - Math.cbrt(0.8)) < 1e-9);
    });
});
