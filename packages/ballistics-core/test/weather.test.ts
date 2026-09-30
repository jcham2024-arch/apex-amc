/**
 * Weather-condition tests.
 *
 * The framing tests matter more than the parsing ones. Every way a firing
 * solution can be silently wrong because of a weather input is a sign or unit
 * error, and a shooter cannot see either one on a dope card.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
    UNKNOWN_CONDITIONS,
    manualConditions,
    fromOpenMeteo,
    mergeConditions,
    weatherCautions,
    meteoWindToShooterFrame,
    shooterFrameToClock,
} from '../src/weather.ts';

describe('wind direction framing', () => {
    test('a wind from the shooters right is 90 degrees in their frame', () => {
        // Facing north. A wind FROM the east (90 compass) comes from the right.
        assert.equal(meteoWindToShooterFrame(90, 0), 90);
    });

    test('a wind from dead ahead is 0 degrees', () => {
        // Facing north, a wind from the north.
        assert.equal(meteoWindToShooterFrame(0, 0), 0);
    });

    test('a wind from behind is 180 degrees', () => {
        assert.equal(meteoWindToShooterFrame(180, 0), 180);
    });

    test('facing south mirrors the frame', () => {
        // Facing south. A wind from the east is now on the shooters LEFT, so it
        // must read 270 in their frame, not 90. Getting this wrong silently
        // mirrors every wind hold.
        assert.equal(meteoWindToShooterFrame(90, 180), 270);
    });

    test('the result is always in 0-359', () => {
        for (let m = 0; m < 360; m += 17) {
            for (let f = 0; f < 360; f += 23) {
                const r = meteoWindToShooterFrame(m, f);
                assert.ok(r >= 0 && r < 360, `got ${r} for meteo ${m} facing ${f}`);
            }
        }
    });

    test('clock positions convert correctly', () => {
        assert.ok(Math.abs(shooterFrameToClock(0) - 0) < 1e-9);
        assert.ok(Math.abs(shooterFrameToClock(90) - 3) < 1e-9);
        assert.ok(Math.abs(shooterFrameToClock(180) - 6) < 1e-9);
        assert.ok(Math.abs(shooterFrameToClock(270) - 9) < 1e-9);
    });
});

describe('manual conditions', () => {
    test('a clock position becomes the degrees the solver wants', () => {
        const c = manualConditions({ windSpeedMph: 10, windClock: 3 });
        assert.ok(Math.abs(c.windDirectionDeg!.value - 90) < 1e-9);
        assert.equal(c.source, 'manual');
    });

    test('omitted fields stay null rather than defaulting', () => {
        const c = manualConditions({ windSpeedMph: 5 });
        // This is the point: a missing temperature must not become 59 degF.
        assert.equal(c.tempF, null);
        assert.equal(c.humidityPct, null);
        assert.equal(c.barometricPressureInHg, null);
    });

    test('everything is marked as manual', () => {
        const c = manualConditions({ tempF: 70, windSpeedMph: 4, windClock: 12 });
        assert.equal(c.tempF!.source, 'manual');
        assert.equal(c.windSpeedMph!.source, 'manual');
    });
});

describe('Open-Meteo parsing', () => {
    const payload = {
        current: {
            time: '2026-09-30T14:00',
            temperature_2m: 20,          // degC
            relative_humidity_2m: 50,   // %
            surface_pressure: 1013.25,  // hPa
            wind_speed_80m: 36,          // km/h
            wind_gusts_10m: 54,          // km/h
            wind_direction_80m: 270,     // compass degrees FROM
            visibility: 20000,           // metres
            elevation: 1600,             // metres
        },
    };

    test('converts wind from km/h to mph', () => {
        const c = fromOpenMeteo(payload, 0);
        // 36 km/h = 22.37 mph
        assert.ok(Math.abs(c.windSpeedMph!.value - 22.37) < 0.05);
    });

    test('converts temperature from Celsius to Fahrenheit', () => {
        const c = fromOpenMeteo(payload, 0);
        assert.ok(Math.abs(c.tempF!.value - 68) < 0.01);
    });

    test('converts pressure from hPa to inHg', () => {
        const c = fromOpenMeteo(payload, 0);
        assert.ok(Math.abs(c.barometricPressureInHg!.value - 29.9213) < 0.001);
    });

    test('converts visibility from metres to miles', () => {
        const c = fromOpenMeteo(payload, 0);
        assert.ok(Math.abs(c.visibilityMi!.value - 12.43) < 0.05);
    });

    test('converts elevation from metres to feet', () => {
        const c = fromOpenMeteo(payload, 0);
        assert.ok(Math.abs(c.elevationFt!.value - 5249) < 2);
    });

    test('prefers the 80 m wind over the 10 m surface reading', () => {
        // A surface reading is drag-influenced and usually lighter than the
        // wind a bullet actually meets at long range.
        const both = fromOpenMeteo(
            {
                current: {
                    ...payload.current,
                    wind_speed_10m: 20,
                    wind_direction_10m: 0,
                },
            },
            0,
        );
        assert.ok(
            both.windSpeedMph!.value > 15,
            'must use the 80 m value, not the 10 m value',
        );
        assert.ok(both.windSpeedMph!.detail.includes('80 m'));
    });

    test('falls back to 10 m wind when no aloft value is present', () => {
        const surfaceOnly = fromOpenMeteo(
            {
                current: {
                    time: '2026-09-30T14:00',
                    temperature_2m: 15,
                    wind_speed_10m: 18,
                    wind_direction_10m: 90,
                },
            },
            0,
        );
        assert.ok(surfaceOnly.windSpeedMph !== null);
        assert.ok(Math.abs(surfaceOnly.windSpeedMph!.value - 11.18) < 0.05);
    });

    test('marks forecast data as forecast, not measured', () => {
        const c = fromOpenMeteo(payload, 0);
        assert.equal(c.source, 'forecast');
        assert.equal(c.windSpeedMph!.source, 'forecast');
    });

    test('handles a missing field without inventing a value', () => {
        const partial = fromOpenMeteo({ current: { temperature_2m: 20 } }, 0);
        assert.equal(partial.windSpeedMph, null);
        assert.equal(partial.tempF!.source, 'forecast');
    });

    test('rejects an API error payload', () => {
        assert.throws(
            () => fromOpenMeteo({ error: true, reason: 'bad request' }, 0),
            /bad request/,
        );
    });

    test('rejects a response with no current conditions', () => {
        assert.throws(() => fromOpenMeteo({}, 0), /no current-conditions/);
    });
});

describe('merging', () => {
    const forecast = fromOpenMeteo(
        {
            current: {
                temperature_2m: 20,
                wind_speed_80m: 36,
                wind_direction_80m: 270,
                relative_humidity_2m: 50,
            },
        },
        0,
    );

    test('an overlay wins field by field', () => {
        const measured = manualConditions({ windSpeedMph: 6, windClock: 3 });
        const merged = mergeConditions(forecast, measured);
        assert.equal(merged.windSpeedMph!.value, 6);
        assert.equal(merged.windSpeedMph!.source, 'manual');
    });

    test('fields the overlay lacks fall through to the base', () => {
        const measured = manualConditions({ windSpeedMph: 6 });
        const merged = mergeConditions(forecast, measured);
        assert.equal(merged.humidityPct!.value, 50);
        assert.equal(merged.humidityPct!.source, 'forecast');
    });

    test('provenance survives the merge per field', () => {
        const measured = manualConditions({ tempF: 45 });
        const merged = mergeConditions(forecast, measured);
        assert.equal(merged.tempF!.source, 'manual');
        assert.equal(merged.tempF!.value, 45);
        assert.equal(merged.windSpeedMph!.source, 'forecast');
    });

    test('the overall source reflects the dominant contributor', () => {
        const measured = manualConditions({ windSpeedMph: 6, tempF: 45 });
        const merged = mergeConditions(forecast, measured);
        assert.equal(merged.source, 'manual');
    });
});

describe('cautions', () => {
    test('forecast wind is always flagged', () => {
        const c = fromOpenMeteo({ current: { wind_speed_80m: 36 } }, 0);
        const cautions = weatherCautions(c);
        assert.ok(cautions.some((x) => x.includes('forecast model')));
    });

    test('a measured wind is not flagged as a forecast', () => {
        const c = manualConditions({ windSpeedMph: 5, windClock: 3, tempF: 60 });
        const cautions = weatherCautions(c);
        assert.ok(!cautions.some((x) => x.includes('forecast model')));
    });

    test('missing wind is called out explicitly', () => {
        const c = manualConditions({ tempF: 60 });
        const cautions = weatherCautions(c);
        assert.ok(cautions.some((x) => x.includes('No wind value')));
    });

    test('a high gust factor is flagged', () => {
        const c = manualConditions({ windSpeedMph: 5, windGustMph: 15, windClock: 3 });
        const cautions = weatherCautions(c);
        assert.ok(cautions.some((x) => x.includes('Gusts are')), 'gust factor must be surfaced');
    });

    test('a modest gust factor is not flagged', () => {
        const c = manualConditions({ windSpeedMph: 10, windGustMph: 13, windClock: 3 });
        const cautions = weatherCautions(c);
        assert.ok(!cautions.some((x) => x.includes('Gusts are')));
    });

    test('low visibility is flagged because a miss cannot be called', () => {
        const c = manualConditions({ visibilityMi: 0.8 });
        const cautions = weatherCautions(c);
        assert.ok(cautions.some((x) => x.includes('Visibility')));
    });

    test('precipitation is flagged', () => {
        const c = manualConditions({ precipitationIn: 0.2 });
        const cautions = weatherCautions(c);
        assert.ok(cautions.some((x) => x.includes('Precipitation')));
    });

    test('long range on a forecast is flagged', () => {
        const c = fromOpenMeteo({ current: { wind_speed_80m: 36 } }, 0);
        const cautions = weatherCautions(c, { rangeYd: 2500, gustSpreadMph: 0 });
        assert.ok(cautions.some((x) => x.includes('2000 yd')));
    });

    test('unknown conditions produce no invented values', () => {
        assert.equal(UNKNOWN_CONDITIONS.windSpeedMph, null);
        assert.equal(UNKNOWN_CONDITIONS.tempF, null);
        assert.equal(UNKNOWN_CONDITIONS.source, 'unknown');
    });
});
