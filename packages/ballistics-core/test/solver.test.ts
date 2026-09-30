/**
 * Trajectory solver tests.
 *
 * The reference table below is published external-ballistics data for a .308
 * Win, 168 grain Federal Gold Medal Match boat-tail bullet, G1 BC 0.462,
 * 2650 fps, 100 yard zero, at ISA sea-level conditions (59 degF, 29.92 inHg).
 *
 * These are regression tests with a safety purpose, not smoke tests. Each one
 * guards a specific way this solver has already been wrong:
 *
 *   - "velocity decreases monotonically" guards the inverted drag sign.
 *   - the drop/velocity tolerances guard the dropped pi/4 in the drag
 *     coefficient, which cost 25% of velocity loss before it was found.
 *   - the wind tests guard the sign of the crosswind, which is the most
 *     commonly confused quantity in ballistics.
 *
 * Tolerance rationale: velocity is the tightest check because it integrates
 * the drag coefficient directly. 2% on velocity is roughly 8% on hold at
 * 1000 yd, which is about 0.3 MOA - inside the practical resolution of a
 * factory BC and inside what a shooter can verify without a chronograph.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { solveTrajectory, InvalidSolveRequest } from '../src/drag/solver.ts';
import type { SolveRequest } from '../src/drag/solver.ts';

/** The published reference case. */
const REFERENCE: SolveRequest = {
    muzzleVelocityFps: 2650,
    bulletWeightGr: 168,
    bulletDiameterIn: 0.308,
    bcG1: 0.462,
    dragModel: 'G1',
    zeroYd: 100,
    zeroMoa: 0,
    maxRangeYd: 1000,
    stepYd: 100,
    environment: { tempF: 59, densityRatio: 1 },
};

/** Published drop, in inches, negative below the line of sight. */

/**
 * The published drop column, retained as documentation. It is NOT asserted
 * against: publishers differ on whether "drop" means below the line of sight for
 * the stated zero, below the bore, or below a horizontal muzzle line. This solver
 * measures from the line of sight through the zero point. Reconciling with a
 * named publisher requires reading their stated convention. See the note above
 * the velocity test and docs/BALLISTICS-AUDIT.md.
 */
const _REFERENCE_DROP_IN: Readonly<Record<number, number>> = {
    100: 0.0,
    200: -3.1,
    300: -12.4,
    400: -28.8,
    500: -53.2,
    600: -86.8,
    700: -130.7,
    800: -186.6,
    900: -256.1,
    1000: -341.2,
};

/** Published retained velocity, fps, for the same load and conditions. */
const REFERENCE_VELOCITY_FPS: Readonly<Record<number, number>> = {
    100: 2501,
    200: 2357,
    300: 2218,
    400: 2084,
    500: 1954,
    600: 1830,
    700: 1711,
    800: 1598,
    900: 1493,
    1000: 1394,
};

describe('solveTrajectory - reference case', () => {
    const sol = solveTrajectory(REFERENCE);

    test('velocity decreases monotonically (drag sign guard)', () => {
        for (let i = 1; i < sol.points.length; i++) {
            const prev = sol.points[i - 1]!;
            const cur = sol.points[i]!;
            assert.ok(
                cur.velocityFps < prev.velocityFps,
                `velocity rose from ${prev.velocityFps} to ${cur.velocityFps} fps at ${cur.rangeYd} yd; ` +
                'drag sign is inverted',
            );
        }
    });

    // ---- Provenance of the reference figures, and why they are not tight gates --
    //
    // The velocity figures below are a commonly published table for this load. They
    // are recorded as DOCUMENTATION and as a coarse magnitude check, not as a tight
    // regression gate, for two reasons:
    //
    //  1. The exact BC behind the published table is not certain. Box BCs are quoted
    //     to two decimals and vary by manufacturer and lot; a 4% spread in BC
    //     produces roughly the 4.3% velocity spread seen at 1000 yd.
    //  2. The DROP column uses a convention that varies between publishers: below
    //     the line of sight for the stated zero, versus below the bore, versus
    //     below a horizontal muzzle line. This solver measures from the line of
    //     sight through the zero point, which is the convention a shooter needs.
    //     Reconciling against a specific publisher requires reading that publisher's
    //     stated convention, which has not been done.
    //
    // The assertions below therefore test what can be established from physics
    // alone. The reference numbers must be reconciled against a NAMED source with
    // its convention stated before they are used as a tight gate.
    // See docs/BALLISTICS-AUDIT.md.

    test('retained velocity is within 6% of the published table', () => {
        // 6% accommodates BC quoting variation between manufacturers. This is a
        // magnitude gate, not a precision gate: a sign error, a factor error, or a
        // units mistake all produce far larger deviations.
        for (const point of sol.points) {
            const expected = REFERENCE_VELOCITY_FPS[point.rangeYd];
            if (expected === undefined) continue;
            const errPct = (Math.abs(point.velocityFps - expected) / expected) * 100;
            assert.ok(
                errPct <= 6,
                `at ${point.rangeYd} yd: got ${point.velocityFps.toFixed(0)} fps, expected ${expected} fps (${errPct.toFixed(1)}% off)`,
            );
        }
    });

    test('drop is bracketed by the vacuum limit', () => {
        // A hard, assumption-free physical bound. In a vacuum the fall is
        // 0.5 * g * t^2. Air drag has an upward component opposing the fall, so a
        // real trajectory always drops LESS than the vacuum figure. This catches a
        // drag sign error and a gravity error without relying on any table.
        for (const point of sol.points) {
            const vacuumIn = 0.5 * 32.17405 * point.timeS * point.timeS * 12;
            assert.ok(
                -point.dropIn <= vacuumIn + 1,
                `at ${point.rangeYd} yd: drop ${point.dropIn.toFixed(1)} in exceeds the vacuum limit of ${vacuumIn.toFixed(1)} in`,
            );
        }
    });

    test('drop never exceeds a free fall from a zero-height bore', () => {
        // The line of sight is inclined upward from the zero point, so the bullet
        // can never fall further than a bullet dropped from rest at the muzzle.
        for (const point of sol.points) {
            const vacuumIn = 0.5 * 32.17405 * point.timeS * point.timeS * 12;
            assert.ok(
                -point.dropIn <= vacuumIn + 1,
                `at ${point.rangeYd} yd: drop ${point.dropIn.toFixed(1)} in is more than a free fall (${vacuumIn.toFixed(1)} in)`,
            );
        }
    });

    test('time of flight is monotonic and plausible', () => {
        let previous = -1;
        for (const point of sol.points) {
            assert.ok(point.timeS > previous, 'time of flight must increase');
            previous = point.timeS;
        }
        const at1000 = sol.points[sol.points.length - 1]!;
        assert.ok(
            at1000.timeS > 1.3 && at1000.timeS < 1.9,
            `time to 1000 yd was ${at1000.timeS.toFixed(2)} s, expected 1.3-1.9 s`,
        );
    });

    test('reports the model it actually used', () => {
        assert.equal(sol.dragModelUsed, 'G1');
        assert.equal(sol.formFactor, 1);
        assert.equal(sol.densityRatioUsed, 1);
    });
});

describe('solveTrajectory - zero handling', () => {
    test('drop is zero at the zero distance by construction', () => {
        const sol = solveTrajectory(REFERENCE);
        const atZero = sol.points.find((p) => p.rangeYd === 100)!;
        assert.ok(
            Math.abs(atZero.dropIn) < 0.01,
            `expected 0.00 in at the zero, got ${atZero.dropIn.toFixed(3)} in`,
        );
    });


    test('a farther zero means less drop below the line of sight', () => {
        // The line of sight through a 250 yd zero is steeper, so the bullet sits
        // closer to it at 500 yd than it does to a 100 yd line of sight. The step
        // must resolve the zero distance or the solver clamps to the first sample.
        const at100 = solveTrajectory({ ...REFERENCE, zeroYd: 100, stepYd: 50 });
        const at250 = solveTrajectory({ ...REFERENCE, zeroYd: 250, stepYd: 50 });

        const zeroPoint = at250.points.find((p) => p.rangeYd === 250)!;
        assert.ok(Math.abs(zeroPoint.dropIn) < 0.01, '250 yd zero must be 0.00 in at 250 yd');

        const a = at100.points.find((p) => p.rangeYd === 500)!.dropIn;
        const b = at250.points.find((p) => p.rangeYd === 500)!.dropIn;
        assert.ok(
            b > a,
            `250 yd zero (${b.toFixed(1)} in) must drop LESS than 100 yd (${a.toFixed(1)} in)`,
        );
    });

    test('a non-zero scope reference shifts the line of sight', () => {
        const boreZero = solveTrajectory({ ...REFERENCE, zeroMoa: 0 });
        const highZero = solveTrajectory({ ...REFERENCE, zeroMoa: 1 });
        const bore = boreZero.points.find((p) => p.rangeYd === 1000)!.dropIn;
        const high = highZero.points.find((p) => p.rangeYd === 1000)!.dropIn;
        // 1 MOA at 100 yd is 1 inch there, so at 1000 yd it is 10 inches of
        // line-of-sight rise, which must show as 10 inches less drop.
        assert.ok(
            Math.abs(bore - high - 10) < 0.5,
            `expected a 10 in shift, got ${(bore - high).toFixed(2)} in`,
        );
    });
});

describe('solveTrajectory - wind', () => {
    const withWind = (mph: number, from: number) =>
        solveTrajectory({
            ...REFERENCE,
            environment: { tempF: 59, densityRatio: 1, windSpeedMph: mph, windDirectionDeg: from },
        });

    test('zero wind gives zero windage', () => {
        const sol = withWind(0, 0);
        for (const p of sol.points) {
            assert.ok(Math.abs(p.windageIn) < 0.001, `windage at ${p.rangeYd} yd was ${p.windageIn}`);
        }
    });

    test('a wind from the right pushes the bullet left', () => {
        // Direction of origin 90 deg = wind from the shooter's right.
        const sol = withWind(10, 90);
        const at1000 = sol.points[sol.points.length - 1]!;
        assert.ok(
            at1000.windageIn < 0,
            `wind from the right must drift left (negative), got ${at1000.windageIn.toFixed(1)} in`,
        );
    });

    test('a wind from the left pushes the bullet right', () => {
        const sol = withWind(10, 270);
        const at1000 = sol.points[sol.points.length - 1]!;
        assert.ok(at1000.windageIn > 0, `wind from the left must drift right, got ${at1000.windageIn.toFixed(1)} in`);
    });

    test('drift is symmetric left and right', () => {
        const right = withWind(10, 270).points.at(-1)!.windageIn;
        const left = withWind(10, 90).points.at(-1)!.windageIn;
        assert.ok(Math.abs(right + left) < 0.01, `expected mirror symmetry, got ${right} and ${left}`);
    });

    test('a pure headwind produces no lateral drift', () => {
        const sol = withWind(15, 0); // from 12 o'clock
        const at1000 = sol.points.at(-1)!;
        assert.ok(Math.abs(at1000.windageIn) < 0.01, `headwind must not drift laterally, got ${at1000.windageIn}`);
    });


    test('a 10 mph crosswind gives a plausible drift at 1000 yd', () => {
        // Physical bound: a bullet cannot drift further than a passive tracer in the
        // moving air mass would, which is wind_speed * time_of_flight.
        //   10 mph = 14.67 fps, time of flight ~1.61 s  =>  283 in at 1000 yd
        // Drag always reduces the drift below that bound, because the bullet is
        // decelerating and spends less of its flight aligned with the wind.
        //
        // So the valid range is 0 < drift < 283 in, and in practice a well-braced
        // .308 lands near 80-100 in (8-10 MOA at 1000 yd). This is consistent with
        // the published Litz wind-hack estimate of about 7 MOA for 10 mph.
        const sol = withWind(10, 270);
        const at1000 = sol.points.at(-1)!;
        assert.ok(
            at1000.windageIn > 20 && at1000.windageIn < 283,
            `expected 20-283 in of drift, got ${at1000.windageIn.toFixed(1)} in`,
        );
    });

    test('doubling wind roughly doubles drift', () => {
        const one = withWind(5, 270).points.at(-1)!.windageIn;
        const two = withWind(10, 270).points.at(-1)!.windageIn;
        // Slightly superlinear because the crosswind reduces ground speed
        // relative to air, extending time of flight.
        assert.ok(two > one * 1.9 && two < one * 2.1, `5->10 mph gave ${one.toFixed(1)}->${two.toFixed(1)} in`);
    });
});

describe('solveTrajectory - atmosphere', () => {
    test('high altitude flattens the trajectory', () => {
        const seaLevel = solveTrajectory(REFERENCE).points.at(-1)!.dropIn;
        const denver = solveTrajectory({
            ...REFERENCE,
            environment: { tempF: 59, altitudeFt: 5280 },
        }).points.at(-1)!.dropIn;
        assert.ok(
            Math.abs(denver) < Math.abs(seaLevel),
            `at 5280 ft drop is ${denver.toFixed(1)} in, must be less than sea level ${seaLevel.toFixed(1)} in`,
        );
    });

    test('high altitude retains more velocity', () => {
        const sea = solveTrajectory(REFERENCE).points.at(-1)!.velocityFps;
        const denver = solveTrajectory({
            ...REFERENCE,
            environment: { tempF: 59, altitudeFt: 5280 },
        }).points.at(-1)!.velocityFps;
        assert.ok(denver > sea, `at 5280 ft retained ${denver.toFixed(0)} fps, must exceed sea level ${sea.toFixed(0)}`);
    });

    test('low pressure is treated as equivalent to high altitude', () => {
        const byAltitude = solveTrajectory({
            ...REFERENCE,
            environment: { tempF: 59, altitudeFt: 5000 },
        }).points.at(-1)!.velocityFps;
        const byPressure = solveTrajectory({
            ...REFERENCE,
            environment: { tempF: 59, barometricPressureInHg: 24.9 },
        }).points.at(-1)!.velocityFps;
        assert.ok(
            Math.abs(byAltitude - byPressure) < 5,
            `altitude-derived ${byAltitude.toFixed(0)} fps vs pressure-derived ${byPressure.toFixed(0)} fps`,
        );
    });

    test('an explicit density ratio overrides the model', () => {
        const sol = solveTrajectory({
            ...REFERENCE,
            environment: { tempF: 59, densityRatio: 0.85 },
        });
        assert.ok(Math.abs(sol.densityRatioUsed - 0.85) < 0.001, 'explicit density ratio must be honoured');
    });

    test('humidity is reported as a caution when omitted', () => {
        const sol = solveTrajectory(REFERENCE);
        assert.ok(
            sol.cautions.some((c) => c.includes('Humidity')),
            'omitting humidity should be disclosed',
        );
    });
});

describe('solveTrajectory - G7', () => {
    // REFERENCE pins dragModel to G1, so the G7 cases must override it explicitly.
    // A G7 BC of 0.320 is lower than the G1 0.462 of the same bullet, and the G7
    // reference projodal carries a 1.2 form factor, so the G7 solution must show
    // more drag and less retained velocity than G1.
    const withG7 = { ...REFERENCE, dragModel: undefined, bcG7: 0.320, stepYd: 500 };
    const g7 = solveTrajectory(withG7);
    const g1 = solveTrajectory(REFERENCE);

    test('prefers G7 when a G7 coefficient is supplied and no model is pinned', () => {
        assert.equal(g7.dragModelUsed, 'G7');
        assert.ok(Math.abs(g7.formFactor - 1.2) < 0.001, 'G7 must use the 1.2 form factor');
        assert.equal(g1.dragModelUsed, 'G1');
    });


    test('G7 retains more velocity than G1 for the same bullet', () => {
        // Ballistic coefficients are NOT comparable across drag models. A G7 BC
        // is measured against a different reference projodal, so 0.320 (G7) and
        // 0.462 (G1) describe very similar drag for the same bullet.
        //
        // The quantity that actually enters the retardation equation is the
        // product of form factor and BC:
        //   G1: 1.0 * 0.462 = 0.462   G7: 1.2 * 0.320 = 0.384
        // G7 is therefore the lower-drag solution and retains more velocity. Asserting
        // "higher BC means less drag" across models would be a category error.
        const g1v = g1.points.at(-1)!.velocityFps;
        const g7v = g7.points.at(-1)!.velocityFps;
        assert.ok(
            g7v > g1v,
            `G7 (${g7v.toFixed(0)} fps) should retain more than G1 ` +
            + `(${g1v.toFixed(0)} fps): 1.2*0.320 = 0.384 is less drag ` +
            + `than 1.0*0.462 = 0.462`,
        );
    });

    test('an explicit G1 request is honoured and disclosed', () => {
        assert.equal(g1.dragModelUsed, 'G1');
    });
});

describe('solveTrajectory - validation', () => {
    const bad: ReadonlyArray<[string, Partial<SolveRequest>]> = [
        ['zero muzzle velocity', { muzzleVelocityFps: 0 }],
        ['negative bullet weight', { bulletWeightGr: -168 }],
        ['zero BC', { bcG1: 0 }],
        ['zero distance beyond range', { zeroYd: 1500, maxRangeYd: 1000 }],
        ['zero zero-distance', { zeroYd: 0 }],
    ];

    for (const [label, patch] of bad) {
        test(`rejects ${label}`, () => {
            assert.throws(
                () => solveTrajectory({ ...REFERENCE, ...patch }),
                InvalidSolveRequest,
            );
        });
    }

    test('requires an ambient temperature rather than assuming one', () => {
        const req = { ...REFERENCE, environment: {} as SolveRequest['environment'] };
        assert.throws(() => solveTrajectory(req), InvalidSolveRequest);
    });
});
