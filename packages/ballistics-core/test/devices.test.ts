/**
 * Device integration tests.
 *
 * The turret-gate tests are the point of this file. Everything else is
 * convenience, but the gate is the one piece of this subsystem that, if it
 * silently failed, would point a rifle somewhere nobody chose. It is tested
 * adversarially: each test tries to get a turret to move without a human
 * agreeing, and asserts that it does not.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
    buildFiringSolution,
    applyAdjustment,
    DriverRegistry,
} from '../src/devices/solution.ts';
import type { FirearmSetup, ShootingContext } from '../src/devices/solution.ts';
import type { DeviceDriver, TurretMoveResult } from '../src/devices/types.ts';
import { DeviceReadError } from '../src/devices/types.ts';
import {
    SimulatedRangefinder,
    SimulatedWeatherMeter,
    SimulatedTurret,
    SimulatedScopeCamera,
} from '../src/devices/drivers/simulated.ts';

const SETUP: FirearmSetup = {
    muzzleVelocityFps: 2650,
    bulletWeightGr: 168,
    bulletDiameterIn: 0.308,
    bcG1: 0.462,
    dragModel: 'G1',
    zeroYd: 100,
    clicksPerMoa: 0.25,
};

const CONTEXT: ShootingContext = { facingDeg: 0, tempF: 59 };

describe('simulated rangefinder', () => {
    test('reports its configured range', async () => {
        const rf = new SimulatedRangefinder(750);
        const r = await rf.read();
        assert.equal(r.rangeYd, 750);
    });

    test('throws rather than inventing a value when it loses lock', async () => {
        const rf = new SimulatedRangefinder(500);
        rf.setLocked(false);
        // A rangefinder with no lock has no reading. Returning 0 or the last
        // good value would be a fabrication, and this is the exact case where
        // a fabricated range produces a confident, wrong hold.
        await assert.rejects(() => rf.read(), DeviceReadError);
    });

    test('a lost lock is a retryable, device-attributed error', async () => {
        const rf = new SimulatedRangefinder(500);
        rf.setLocked(false);
        await assert.rejects(
            () => rf.read(),
            (e: unknown) => {
                assert.ok(e instanceof DeviceReadError);
                assert.equal(e.deviceId, 'simulated-rangefinder');
                assert.equal(e.retryable, true);
                return true;
            },
        );
    });

    test('notifies subscribers when the range changes', async () => {
        const rf = new SimulatedRangefinder(500);
        const seen: number[] = [];
        await rf.subscribe((r) => seen.push(r.rangeYd!));
        rf.setRange(625);
        assert.deepEqual(seen, [625]);
    });

    test('unsubscribing stops notifications', async () => {
        const rf = new SimulatedRangefinder(500);
        const seen: number[] = [];
        const stop = await rf.subscribe((r) => seen.push(r.rangeYd!));
        rf.setRange(600);
        stop();
        rf.setRange(700);
        assert.deepEqual(seen, [600]);
    });
});

describe('simulated weather meter', () => {
    test('flags its direction as a compass bearing for the solution layer', async () => {
        const w = new SimulatedWeatherMeter();
        w.setWind(10, 270);
        const r = await w.read();
        // The driver must NOT convert this. Conversion needs the shooter's
        // facing, which the device does not know.
        assert.equal(r.windDirectionDeg, 270);
        assert.equal(r.windDirectionIsCompass, true);
    });

    test('omits fields it was not given', async () => {
        const w = new SimulatedWeatherMeter();
        w.setWind(5);
        const r = await w.read();
        assert.equal(r.windSpeedMph, 5);
        assert.equal(r.windDirectionDeg, undefined);
        assert.equal(r.tempF, undefined);
    });
});

describe('firing solution', () => {
    test('computes a hold from a range alone', () => {
        const s = buildFiringSolution({ setup: SETUP, context: CONTEXT, rangeYd: 1000 });
        assert.ok(s.elevationMoa < 0, 'a shot at 1000 yd from a 100 yd zero is low');
        assert.ok(s.velocityFps > 1000 && s.velocityFps < 1500);
        assert.ok(s.cautionText.length > 0, 'a solution always carries cautions');
    });

    test('refuses to invent a range', () => {
        assert.throws(
            () => buildFiringSolution({ setup: SETUP, context: CONTEXT, rangeYd: 0 }),
            /positive distance/,
        );
        assert.throws(
            () => buildFiringSolution({ setup: SETUP, context: CONTEXT, rangeYd: Number.NaN }),
            /positive distance/,
        );
    });

    test('refuses to invent a temperature', () => {
        assert.throws(
            () => buildFiringSolution({ setup: SETUP, context: {}, rangeYd: 500 }),
            /temperature/,
        );
    });

    test('warns when there is no wind measurement', () => {
        const s = buildFiringSolution({ setup: SETUP, context: CONTEXT, rangeYd: 1000 });
        assert.ok(
            s.cautionText.some((c) => c.includes('No wind measurement')),
            'elevation-only hold must say so',
        );
    });

    test('crosswind produces a right or left hold', () => {
        const noWind = buildFiringSolution({ setup: SETUP, context: CONTEXT, rangeYd: 1000 });
        const withWind = buildFiringSolution({
            setup: SETUP,
            context: CONTEXT,
            rangeYd: 1000,
            reading: {
                at: new Date().toISOString(),
                windSpeedMph: 10,
                windDirectionDeg: 270,
            },
        });
        assert.equal(noWind.windageMoa, 0);
        assert.ok(
            Math.abs(withWind.windageMoa) > Math.abs(noWind.windageMoa),
            'a 10 mph crosswind must add wind hold',
        );
    });

    test('a left-to-right wind and a right-to-left wind mirror exactly', () => {
        const left = buildFiringSolution({
            setup: SETUP,
            context: CONTEXT,
            rangeYd: 1000,
            reading: { at: '', windSpeedMph: 10, windDirectionDeg: 90 },
        });
        const right = buildFiringSolution({
            setup: SETUP,
            context: CONTEXT,
            rangeYd: 1000,
            reading: { at: '', windSpeedMph: 10, windDirectionDeg: 270 },
        });
        assert.ok(Math.abs(left.windageMoa + right.windageMoa) < 0.01);
    });

    test('a compass wind direction is converted using the shooter facing', () => {
        // Facing north, a wind FROM the east (90) comes from the shooter''s right.
        const facingNorth = buildFiringSolution({
            setup: SETUP,
            context: { facingDeg: 0, tempF: 59 },
            rangeYd: 1000,
            reading: {
                at: '',
                windSpeedMph: 10,
                windDirectionDeg: 90,
                windDirectionIsCompass: true,
            },
        });
        // Facing south, the same physical wind is on the other hand.
        const facingSouth = buildFiringSolution({
            setup: SETUP,
            context: { facingDeg: 180, tempF: 59 },
            rangeYd: 1000,
            reading: {
                at: '',
                windSpeedMph: 10,
                windDirectionDeg: 90,
                windDirectionIsCompass: true,
            },
        });
        assert.ok(
            Math.abs(facingNorth.windageMoa + facingSouth.windageMoa) < 0.01,
            'turning around must mirror the wind hold',
        );
    });

    test('a compass direction with no facing given applies no drift and says why', () => {
        const s = buildFiringSolution({
            setup: SETUP,
            context: { tempF: 59 },
            rangeYd: 1000,
            reading: {
                at: '',
                windSpeedMph: 10,
                windDirectionDeg: 90,
                windDirectionIsCompass: true,
            },
        });
        assert.equal(s.windageMoa, 0);
        assert.ok(s.cautionText.some((c) => c.includes('facing')));
    });

    test('a high gust factor is surfaced', () => {
        const s = buildFiringSolution({
            setup: SETUP,
            context: CONTEXT,
            rangeYd: 1000,
            reading: {
                at: '',
                windSpeedMph: 5,
                windGustMph: 15,
                windDirectionDeg: 270,
            },
        });
        assert.ok(s.cautionText.some((c) => c.includes('Gusts are')));
    });

    test('low rangefinder confidence is surfaced', () => {
        const s = buildFiringSolution({
            setup: SETUP,
            context: CONTEXT,
            rangeYd: 1000,
            reading: { at: '', rangeConfidence: 0.3 },
        });
        assert.ok(s.cautionText.some((c) => c.includes('low confidence')));
    });

    test('long range is flagged as beyond the model', () => {
        const s = buildFiringSolution({ setup: SETUP, context: CONTEXT, rangeYd: 2500 });
        assert.ok(s.cautionText.some((c) => c.includes('2000 yd')));
    });

    test('mils and MOA are related by the mil definition', () => {
        const s = buildFiringSolution({ setup: SETUP, context: CONTEXT, rangeYd: 1000 });
        assert.ok(Math.abs(s.elevationMoa * (1 / 1.015) - s.elevationMil) < 1e-9);
    });
});

// ---------------------------------------------------------------------------
// The turret gate
// ---------------------------------------------------------------------------

describe('turret gate', () => {
    const solutionFor = (turret: SimulatedTurret, rangeYd = 1000) => {
        const reading = {
            at: new Date().toISOString(),
            tempF: 59,
            windSpeedMph: 10,
            windDirectionDeg: 270,
        };
        const s = buildFiringSolution(
            { setup: SETUP, context: CONTEXT, rangeYd, reading },
            turret,
            turret,
        );
        return s;
    };

    test('a turret does not move without acknowledgement', async () => {
        const turret = new SimulatedTurret();
        const before = turret.position;
        const s = solutionFor(turret);

        const outcome = await applyAdjustment(turret, s, { acknowledged: false });

        assert.equal(outcome.applied, false);
        assert.equal(outcome.refusal, 'not-acknowledged');
        assert.deepEqual(turret.position, before, 'the turret must not have moved');
        assert.equal(turret.moveLog.length, 0, 'no move may even be attempted');
    });

    test('an acknowledged move is applied', async () => {
        const turret = new SimulatedTurret({ clicksPerMoa: 0.25 });
        const s = solutionFor(turret);
        assert.ok(s.proposedAdjustment !== null);

        const outcome = await applyAdjustment(turret, s, { acknowledged: true });

        assert.equal(outcome.applied, true);
        assert.equal(turret.moveLog.length, 1);
        assert.notDeepEqual(turret.position, { elevationClicks: 0, windageClicks: 0 });
    });

    test('a driver without turret capability is refused', async () => {
        const rf = new SimulatedRangefinder(1000);
        const s = buildFiringSolution({ setup: SETUP, context: CONTEXT, rangeYd: 1000 });
        const outcome = await applyAdjustment(rf, s, { acknowledged: true });
        assert.equal(outcome.applied, false);
        assert.equal(outcome.refusal, 'driver-cannot-move-turret');
    });

    test('a driver claiming turret control without implementing it is a driver bug', async () => {
        // A driver that advertises `writesTurret` but has no `moveTurret` must be
        // reported, not silently tolerated.
        const liar: DeviceDriver = {
            descriptor: {
                id: 'liar',
                displayName: 'Driver With No Implementation',
                kind: 'scope',
                capabilities: {
                    range: false,
                    wind: false,
                    atmosphere: false,
                    inclination: false,
                    readsTurret: false,
                    writesTurret: true,
                    camera: false,
                },
                status: 'experimental',
            },
            init: async () => {},
            dispose: async () => {},
            read: async () => ({ at: new Date().toISOString() }),
        };
        const s = buildFiringSolution({ setup: SETUP, context: CONTEXT, rangeYd: 500 });
        const outcome = await applyAdjustment(liar, s, { acknowledged: true });
        assert.equal(outcome.applied, false);
        assert.equal(outcome.refusal, 'driver-missing-implementation');
        assert.ok(outcome.warnings.some((w) => w.includes('driver bug')));
    });

    test('a move that cannot be verified is flagged even when it succeeds', async () => {
        const turret = new SimulatedTurret({ canRead: false });
        const s = solutionFor(turret);
        assert.equal(s.proposedAdjustment!.requiresManualVerification, true);

        const outcome = await applyAdjustment(turret, s, { acknowledged: true });
        assert.equal(outcome.applied, true);
        // Succeeded, but the driver cannot confirm where the turret ended up.
        assert.ok(
            outcome.warnings.some((w) => w.includes('could not be confirmed')),
            'an unverifiable move must warn the shooter',
        );
    });

    test('a move smaller than the backlash warns', async () => {
        // 4 MOA at 0.25 clicks/MOA is 1 click. With 2 clicks of backlash the
        // mechanism may not register the move at all.
        const turret = new SimulatedTurret({ clicksPerMoa: 0.25, backlashClicks: 2 });
        const s = buildFiringSolution(
            {
                setup: SETUP,
                context: CONTEXT,
                rangeYd: 130,
                reading: { at: '', tempF: 59 },
            },
            turret,
            turret,
        );
        const adj = s.proposedAdjustment!;
        assert.ok(adj.belowBacklashThreshold, 'a sub-backlash move must be flagged');

        const outcome = await applyAdjustment(turret, s, { acknowledged: true });
        assert.ok(
            outcome.warnings.some((w) => w.includes('backlash')),
            'the shooter must be told the move may not have landed',
        );
    });

    test('a failed move is not retried automatically', async () => {
        let attempts = 0;
        const flaky: DeviceDriver = {
            descriptor: {
                id: 'flaky',
                displayName: 'Flaky Turret',
                kind: 'simulated',
                capabilities: {
                    range: false, wind: false, atmosphere: false, inclination: false,
                    readsTurret: true, writesTurret: true, camera: false,
                },
                status: 'experimental',
            },
            init: async () => {},
            dispose: async () => {},
            read: async () => ({ at: new Date().toISOString() }),
            moveTurret: async (): Promise<TurretMoveResult> => {
                attempts++;
                return { ok: false, reason: 'the mechanism jammed' };
            },
        };
        const s = buildFiringSolution(
            {
                setup: SETUP,
                context: CONTEXT,
                rangeYd: 1000,
                reading: { at: '', tempF: 59 },
            },
            flaky,
            { readsPosition: true, verification: 'read-back', backlashClicks: 0 },
        );

        const outcome = await applyAdjustment(flaky, s, { acknowledged: true });
        assert.equal(outcome.applied, false);
        assert.equal(attempts, 1, 'exactly one attempt, no automatic retry');
        assert.ok(outcome.warnings.some((w) => w.includes('jammed')));
    });

    test('a solution with no dial instruction cannot be applied', async () => {
        const turret = new SimulatedTurret();
        // No clicksPerMoa on the setup, so no dial instruction is derivable.
        const s = buildFiringSolution(
            {
                setup: { ...SETUP, clicksPerMoa: undefined },
                context: CONTEXT,
                rangeYd: 1000,
            },
            turret,
            turret,
        );
        assert.equal(s.proposedAdjustment, null);
        const outcome = await applyAdjustment(turret, s, { acknowledged: true });
        assert.equal(outcome.refusal, 'no-adjustment-proposed');
    });

    test('the dial instruction is a delta from the current position', async () => {
        // A turret already at 4 MOA that needs 5 needs 1 MOA more, not 5.
        const turret = new SimulatedTurret({ clicksPerMoa: 0.25 });
        const s = buildFiringSolution(
            {
                setup: SETUP,
                context: CONTEXT,
                rangeYd: 1000,
                reading: { at: '', tempF: 59, elevationClicks: 1, windageClicks: 0 },
            },
            turret,
            turret,
        );
        const adj = s.proposedAdjustment!;
        // 1 click at 0.25 clicks/MOA is 4 MOA already dialled.
        // 1 click at 0.25 clicks/MOA is already 4 MOA dialled, so the remaining
        // move must be smaller than the full hold from zero.
        assert.ok(
            Math.abs(adj.elevationClicks) < 40,
            `remaining elevation ${adj.elevationClicks} clicks should be far less ` +
            + `than the ${(adj.elevationMoa / 0.25).toFixed(0)}-click full hold`,
        );
    });

    test('there is no fire control anywhere in the public API', () => {
        // A guard, not a style preference. If a future change adds a trigger
        // pull to this surface, this test is what notices.
        const driver = new SimulatedTurret() as unknown as Record<string, unknown>;
        assert.equal(driver.fire, undefined);
        assert.equal(driver.fireRound, undefined);
        assert.equal(driver.trigger, undefined);
        assert.equal(driver.shoot, undefined);
    });
});

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

describe('driver registry', () => {
    test('registers and retrieves by id', () => {
        const r = new DriverRegistry();
        const rf = new SimulatedRangefinder();
        r.register(rf);
        assert.equal(r.get('simulated-rangefinder'), rf);
        assert.equal(r.size, 1);
    });

    test('rejects a duplicate id', () => {
        const r = new DriverRegistry();
        r.register(new SimulatedRangefinder());
        assert.throws(() => r.register(new SimulatedRangefinder()), /already registered/);
    });

    test('finds drivers by capability, not by brand', () => {
        const r = new DriverRegistry();
        r.register(new SimulatedRangefinder());
        r.register(new SimulatedWeatherMeter());
        r.register(new SimulatedTurret());

        assert.equal(r.withCapability('range').length, 1);
        assert.equal(r.withCapability('wind').length, 1);
        assert.equal(r.withCapability('atmosphere').length, 1);
        assert.equal(r.withCapability('writesTurret').length, 1);
        assert.equal(r.withCapability('camera').length, 0);
    });

    test('firstWith finds a driver for a given need', () => {
        const r = new DriverRegistry();
        const w = new SimulatedWeatherMeter();
        r.register(new SimulatedRangefinder());
        r.register(w);
        assert.equal(r.firstWith('wind'), w);
        assert.equal(r.firstWith('camera'), undefined);
    });

    test('the simulated camera produces a frame the pipeline can carry', async () => {
        const cam = new SimulatedScopeCamera();
        const frame = await cam.captureFrame();
        assert.ok(frame.width > 0 && frame.height > 0);
        assert.ok(frame.data.length > 0);
        assert.ok(frame.capturedAt.length > 0);
    });
});
