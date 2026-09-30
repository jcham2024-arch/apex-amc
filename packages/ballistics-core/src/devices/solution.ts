/**
 * Firing solution: from device readings to a shooter-facing answer.
 * ===========================================================================
 *
 * This is the join point. A rangefinder measures a distance, a weather meter
 * reports the air, the solver computes the trajectory, and this module turns
 * that into something a shooter can act on: a hold, a dial instruction, and an
 * honest list of what is still unknown.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS SEPARATE FROM THE SOLVER
 * ---------------------------------------------------------------------------
 * `drag/solver.ts` is pure physics: numbers in, table out. It has no opinion
 * about Bluetooth, turrets, or whether the range came from a laser or a
 * spotter's voice. This module is the layer that knows the outside world.
 *
 * Keeping them apart means the ballistics stays testable against published
 * reference data, and the device code stays replaceable. It is the same split
 * as provenance: the physics is trusted, and everything feeding it is labelled.
 *
 * ---------------------------------------------------------------------------
 * THE TURRET GATE
 * ---------------------------------------------------------------------------
 * A firing solution may include a *proposed* turret adjustment. It may only
 * *apply* one when a human has acknowledged it, by passing
 * `acknowledged: true` to {@link applyAdjustment}.
 *
 * That single boolean is the whole safety mechanism, and it is worth being
 * explicit about why it is not more elaborate. It cannot be a setting, a
 * preference, or a "trusted mode" toggle, because every one of those can be
 * set once and then forgotten, and the failure mode is a rifle pointed at a
 * solution nobody chose. A per-move acknowledgement in the UI is annoying,
 * which is the correct amount of annoying.
 *
 * Additional rules enforced here rather than left to drivers:
 *
 * - A driver that cannot read its own turret position must report
 *   `unverified`, and the solution carries a "confirm by hand" flag.
 * - A move is never retried automatically.
 * - If the requested move is smaller than the driver's declared backlash, the
 *   solution says so instead of pretending a 1-click move is reliable.
 *
 * ---------------------------------------------------------------------------
 * THERE IS NO FIRE CONTROL, BY DESIGN
 * ---------------------------------------------------------------------------
 * Nothing in this module, or anywhere in this package, can discharge a round.
 * The trigger is the shooter's, always. If a future version of this file
 * contains anything resembling a trigger pull, that is a bug, not a feature.
 *
 * ---------------------------------------------------------------------------
 * SOURCES
 * ---------------------------------------------------------------------------
 * The hold values come from `drag/solver.ts`, which is validated against
 * published reference trajectory data. See docs/BALLISTICS-AUDIT.md for the
 * derivation and the known limits, which are restated in `cautionText` below
 * because a shooter reading a dial instruction needs them more than a
 * developer does.
 *
 * @packageDocumentation
 */

import { solveTrajectory, InvalidSolveRequest } from '../drag/solver.ts';
import type { DragModel, Solution } from '../drag/solver.ts';
import { meteoWindToShooterFrame } from '../weather.ts';
import type {
    DeviceDriver,
    DeviceReading,
    TurretControl,
    TurretMove,
    TurretMoveResult,
} from './types.ts';

/** The shooter's rifle, ammunition and optic. */
export interface FirearmSetup {
    readonly muzzleVelocityFps: number;
    readonly bulletWeightGr: number;
    readonly bulletDiameterIn: number;
    readonly bcG1: number;
    readonly bcG7?: number | null;
    readonly dragModel?: DragModel;
    /** Zero distance, yards. */
    readonly zeroYd: number;
    /** Clicks per MOA on this turret. Required to express a dial instruction. */
    readonly clicksPerMoa?: number;
}

/** Which way the shooter is facing, needed to frame a wind direction. */
export interface ShootingContext {
    /**
     * Compass bearing the shooter is facing, degrees (0 N, 90 E).
     *
     * Required whenever a wind direction arrives as a compass bearing. This is
     * the input that stops a crosswind hold being silently mirrored.
     */
    readonly facingDeg?: number;
    /** Ambient temperature override, degF, when no device supplies one. */
    readonly tempF?: number;
    /** Elevation, feet MSL, when no device supplies a pressure. */
    readonly elevationFt?: number;
}

/** Inputs to a firing solution, with provenance on each measurement. */
export interface SolutionRequest {
    readonly setup: FirearmSetup;
    readonly context: ShootingContext;
    /** Distance to target, yards. The one measurement the solver cannot invent. */
    readonly rangeYd: number;
    /**
     * The latest reading from whatever devices are connected, if any.
     * Omitted entirely when the shooter is relying on a forecast or typed
     * values, which is a legitimate way to use this app.
     */
    readonly reading?: DeviceReading;
    /** Device ids that contributed, for display. */
    readonly contributedBy?: readonly string[];
}

/** A proposed dial instruction, in clicks. */
export interface TurretAdjustment {
    /** Clicks to add to elevation from the current position. */
    readonly elevationClicks: number;
    /** Clicks to add to windage from the current position. */
    readonly windageClicks: number;
    /** The same instruction in MOA, which is what a shooter reasons in. */
    readonly elevationMoa: number;
    readonly windageMoa: number;
    readonly direction: TurretMove['direction'];
    /**
     * True when this is smaller than the driver's backlash and therefore may
     * not land where asked. The UI must show this rather than rounding it away.
     */
    readonly belowBacklashThreshold: boolean;
    /**
     * True when no device can confirm the resulting turret position, so the
     * shooter must verify by hand.
     */
    readonly requiresManualVerification: boolean;
}

/** The shooter-facing result. */
export interface FiringSolution {
    readonly rangeYd: number;
    /** Hold below the line of sight in MOA, negative. */
    readonly elevationMoa: number;
    /** Hold right in MOA, positive. */
    readonly windageMoa: number;
    /** The same in mils, which most precision turrets are graduated in. */
    readonly elevationMil: number;
    readonly windageMil: number;
    readonly velocityFps: number;
    readonly timeOfFlightS: number;
    /** A dial instruction, when the turret is known and controllable. */
    readonly proposedAdjustment: TurretAdjustment | null;
    /**
     * Everything the shooter should know before trusting this. Empty is not
     * possible in practice and would itself be a bug.
     */
    readonly cautionText: readonly string[];
    /** Devices that contributed to this solution. */
    readonly contributedBy: readonly string[];
    /** The solver output, for callers that need the full table. */
    readonly raw: Solution;
}

/** 1 mil is 1.015 MOA. Exact by definition of the SI mil. */
const MOA_PER_MIL = 1 / 1.015;

/**
 * Build a firing solution.
 *
 * @throws {InvalidSolveRequest} when the setup or range is physically
 *         impossible. A firing solution with a fabricated range is worse than
 *         no firing solution, so this fails loudly.
 */
export function buildFiringSolution(
    request: SolutionRequest,
    driver?: DeviceDriver,
    turretControl?: TurretControl,
): FiringSolution {
    const { setup, context, rangeYd, reading } = request;
    const cautions: string[] = [];
    const contributed: string[] = [...(request.contributedBy ?? [])];

    if (!Number.isFinite(rangeYd) || rangeYd <= 0) {
        throw new InvalidSolveRequest(
            'A positive distance to the target is required. The app will not guess a range.',
        );
    }

    // --- Assemble the environment, preferring device readings ----------
    let tempF: number | undefined = context.tempF;
    let windSpeedMph: number | undefined;
    let windDirectionDeg: number | undefined;
    let humidity: number | undefined;
    let pressure: number | undefined;
    let inclineDeg: number | undefined;
    let currentElevationClicks: number | undefined;
    let currentWindageClicks: number | undefined;
    let clicksPerMoa = setup.clicksPerMoa;
    let rangeConfidence: number | undefined;

    if (reading) {
        tempF = reading.tempF ?? tempF;
        windSpeedMph = reading.windSpeedMph;
        windDirectionDeg = reading.windDirectionDeg;
        humidity = reading.humidityPct;
        pressure = reading.barometricPressureInHg;
        inclineDeg = reading.inclineDeg;
        currentElevationClicks = reading.elevationClicks;
        currentWindageClicks = reading.windageClicks;
        clicksPerMoa = reading.clicksPerMoa ?? clicksPerMoa;

        // Confidence is read independently of the range value. A device can
        // report a distance with low confidence, and gating confidence on the
        // presence of a distance would drop the warning exactly when it matters.
        rangeConfidence = reading.rangeConfidence;

        // Frame the wind into the shooter's reference. A device that reports a
        // compass bearing cannot be interpreted without knowing which way the
        // shooter faces, and guessing that is how a hold gets mirrored.
        const compassDir = reading.windDirectionDeg;
        if (reading.windDirectionIsCompass === true && compassDir !== undefined) {
            if (context.facingDeg !== undefined) {
                windDirectionDeg = meteoWindToShooterFrame(compassDir, context.facingDeg);
            } else {
                cautions.push(
                    'The wind device reports a compass direction, but the direction you are ' +
                    'facing was not given, so no wind drift was applied. Enter your ' +
                    'facing direction to have wind hold computed.',
                );
                windDirectionDeg = undefined;
            }
        }
    }

    if (tempF === undefined) {
        // The solver refuses this too, but the message here can be specific to
        // the situation, which is more useful than a generic rejection.
        throw new InvalidSolveRequest(
            'No ambient temperature available. Connect a weather device, or enter a ' +
            'temperature, before a firing solution can be computed. Assuming one would ' +
            'produce a hold that is wrong in an unknown direction.',
        );
    }

    // --- Solve -----------------------------------------------------------
    const solution = solveTrajectory({
        muzzleVelocityFps: setup.muzzleVelocityFps,
        bulletWeightGr: setup.bulletWeightGr,
        bulletDiameterIn: setup.bulletDiameterIn,
        bcG1: setup.bcG1,
        bcG7: setup.bcG7 ?? null,
        dragModel: setup.dragModel,
        zeroYd: setup.zeroYd,
        zeroMoa: 0,
        maxRangeYd: rangeYd,
        // A fixed fine step, NOT `rangeYd`. Sampling only at the target leaves the
        // solver unable to resolve the zero point properly, which produced wildly
        // wrong elevation holds. The output step is a presentation choice; the
        // physics is unaffected by it, so a conservative 10 yd grid costs little and
        // keeps the result correct for any range including short ones.
        stepYd: 10,
        environment: {
            tempF,
            ...(humidity !== undefined ? { relativeHumidityPct: humidity } : {}),
            ...(pressure !== undefined
                ? { barometricPressureInHg: pressure }
                : context.elevationFt !== undefined
                  ? { altitudeFt: context.elevationFt }
                  : {}),
            ...(windSpeedMph !== undefined ? { windSpeedMph } : {}),
            ...(windDirectionDeg !== undefined ? { windDirectionDeg } : {}),
            ...(inclineDeg !== undefined ? { inclineDeg } : {}),
        },
    });

    // The point AT the target, not the first sample. Solved on a 10 yd grid,
    // the first sample is 10 yd, and using it would report a hold for the wrong
    // distance. Selecting by range rather than by index keeps this correct however
    // the step changes.
    const point = solution.points.find((p) => p.rangeYd >= rangeYd - 1e-6) ?? solution.points[solution.points.length - 1]!;

    // --- Cautions --------------------------------------------------------
    // The solver's own cautions, restated for a shooter rather than a developer.
    for (const c of solution.cautions) {
        cautions.push(c);
    }

    if (windSpeedMph === undefined) {
        cautions.push(
            'No wind measurement was used. At 1000 yd a 5 mph crosswind is worth about ' +
            '4 MOA, so this hold covers the elevation only. Connect a wind device or ' +
            'enter the wind before relying on it.',
        );
    } else if (windDirectionDeg === undefined) {
        cautions.push(
            'A wind speed was available but not a direction, so no wind drift was applied.',
        );
    }

    if (reading && reading.windSpeedMph !== undefined && reading.windGustMph !== undefined) {
        const ratio = reading.windGustMph / Math.max(reading.windSpeedMph, 0.1);
        if (ratio > 1.5) {
            cautions.push(
                `Gusts are ${ratio.toFixed(1)}x the sustained wind. Hold for the gust: ` +
                'the gust is the round you are most likely to shoot.',
            );
        }
    }

    if (rangeConfidence !== undefined && rangeConfidence < 0.6) {
        cautions.push(
            `The rangefinder reported low confidence (${Math.round(rangeConfidence * 100)}%). ` +
            'Confirm the range visually or by spotter before dialing this hold.',
        );
    }

    if (rangeYd > 2000) {
        cautions.push(
            'Beyond 2000 yd this point-mass model omits yaw, coriolis and earth ' +
            'curvature. Treat the far end of this solution as optimistic and confirm ' +
            'with a spotter.',
        );
    }

    cautions.push(
        'Verify against your own chrono data at the ranges you actually shoot, and ' +
        'confirm the first few hundred yards at a known zero before trusting a ' +
        'long-range hold.',
    );

    // --- Turret instruction ---------------------------------------------
    let proposedAdjustment: TurretAdjustment | null = null;
    if (turretControl && clicksPerMoa !== undefined && clicksPerMoa > 0) {
        const elevationMoa = point.elevationMoa;
        const windageMoa = point.windageMoa;

        // The dial instruction is the delta from wherever the turret is now to
        // where it needs to be. A turret already dialled to 4 MOA that needs 5
        // needs 1 MOA more, not 5.
        const targetElevationClicks = elevationMoa * clicksPerMoa;
        const targetWindageClicks = windageMoa * clicksPerMoa;
        const deltaElevation = targetElevationClicks - (currentElevationClicks ?? 0);
        const deltaWindage = targetWindageClicks - (currentWindageClicks ?? 0);

        const magnitude = Math.max(Math.abs(deltaElevation), Math.abs(deltaWindage));
        const belowThreshold =
            turretControl.backlashClicks > 0 && magnitude < turretControl.backlashClicks;

        const direction: TurretMove['direction'] =
            Math.abs(deltaElevation) >= Math.abs(deltaWindage)
                ? deltaElevation >= 0
                    ? 'up'
                    : 'down'
                : deltaWindage >= 0
                  ? 'right'
                  : 'left';

        proposedAdjustment = {
            elevationClicks: Math.round(deltaElevation),
            windageClicks: Math.round(deltaWindage),
            elevationMoa,
            windageMoa,
            direction,
            belowBacklashThreshold: belowThreshold,
            requiresManualVerification: !turretControl.readsPosition,
        };

        if (belowThreshold) {
            cautions.push(
                `The required move of ${magnitude.toFixed(1)} clicks is smaller than this ` +
                `turret's ${turretControl.backlashClicks} clicks of backlash, so it may not ` +
                'land where asked. Turn it by hand and confirm the number.',
            );
        }
        if (!turretControl.readsPosition) {
            cautions.push(
                'This device can move the turret but cannot read its position, so the ' +
                'result cannot be confirmed automatically. Verify by hand after any move.',
            );
        }
    }

    return {
        rangeYd,
        elevationMoa: point.elevationMoa,
        windageMoa: point.windageMoa,
        elevationMil: point.elevationMoa * MOA_PER_MIL,
        windageMil: point.windageMoa * MOA_PER_MIL,
        velocityFps: point.velocityFps,
        timeOfFlightS: point.timeS,
        proposedAdjustment,
        cautionText: cautions,
        contributedBy: contributed,
        raw: solution,
    };
}

// ---------------------------------------------------------------------------
// The turret gate
// ---------------------------------------------------------------------------

/** Why an adjustment was not applied. */
export type AdjustmentRefusal =
    /** The human did not acknowledge. The expected path, not a failure. */
    | 'not-acknowledged'
    /** The driver does not declare turret capability at all. */
    | 'driver-cannot-move-turret'
    /** The driver has no `moveTurret` implementation despite claiming it can. */
    | 'driver-missing-implementation'
    /** The solution has no dial instruction to apply. */
    | 'no-adjustment-proposed'
    /** The transport is not connected. */
    | 'not-connected';

/** The outcome of attempting to apply a turret adjustment. */
export interface AdjustmentOutcome {
    readonly applied: boolean;
    /** Present when `applied` is false. */
    readonly refusal?: AdjustmentRefusal;
    /** Present when a move was attempted and the driver returned a result. */
    readonly result?: TurretMoveResult;
    /**
     * Warnings the shooter must see regardless of outcome. A successful move
     * that could not be verified still produces a warning here.
     */
    readonly warnings: readonly string[];
}

/**
 * Apply a proposed turret adjustment.
 *
 * THE GATE. `acknowledged` must be true, and it means a human has seen the
 * proposed numbers and agreed to them. There is no way to set it without a UI
 * action, and no "trusted mode" that bypasses it.
 *
 * Deliberate design choices:
 *
 * - **No automatic retry.** A driver that fails once is reported as failed.
 *   Retrying a mechanical move is how a turret ends up somewhere nobody
 *   intended, and a shooter looking at a rifle needs to be told, not to have
 *   the app try again behind their back.
 * - **Refusals are values, not exceptions.** A caller is forced by the type
 *   system to consider the "you did not confirm" case, which is the most
 *   important one.
 * - **Unverifiable moves warn even on success.** `ok: true` with
 *   `unverified: true` is a legitimate state that must reach the shooter.
 */
export async function applyAdjustment(
    driver: DeviceDriver,
    solution: FiringSolution,
    options: { readonly acknowledged: boolean },
): Promise<AdjustmentOutcome> {
    const warnings: string[] = [];

    if (!options.acknowledged) {
        return {
            applied: false,
            refusal: 'not-acknowledged',
            warnings: ['No turret movement without an explicit human acknowledgement.'],
        };
    }

    if (!driver.descriptor.capabilities.writesTurret) {
        return {
            applied: false,
            refusal: 'driver-cannot-move-turret',
            warnings: [`${driver.descriptor.displayName} cannot move a turret.`],
        };
    }

    if (driver.moveTurret === undefined) {
        // A driver claiming the capability without implementing it is a bug in
        // the driver, and must not be papered over by falling back to a guess.
        return {
            applied: false,
            refusal: 'driver-missing-implementation',
            warnings: [
                `${driver.descriptor.displayName} claims turret control but provides no ` +
                'implementation. This is a driver bug.',
            ],
        };
    }

    const adjustment = solution.proposedAdjustment;
    if (adjustment === null) {
        return {
            applied: false,
            refusal: 'no-adjustment-proposed',
            warnings: ['This solution has no dial instruction to apply.'],
        };
    }

    const result = await driver.moveTurret({
        elevationClicks: adjustment.elevationClicks,
        windageClicks: adjustment.windageClicks,
        direction: adjustment.direction,
    });

    if (!result.ok) {
        warnings.push(
            `The turret move did not complete: ${result.reason ?? 'the device gave no reason'}. ` +
            'Check the rifle by hand. Nothing was retried automatically.',
        );
    }

    if (result.unverified === true) {
        warnings.push(
            'The move was sent but its result could not be confirmed. Verify the dial ' +
            'numbers by hand before firing.',
        );
    }

    if (adjustment.belowBacklashThreshold) {
        warnings.push(
            'This move was smaller than the mechanism backlash, so the turret may not ' +
            'have moved at all, or may have moved to a different number.',
        );
    }

    return {
        applied: result.ok,
        ...(result.ok ? {} : { refusal: 'driver-cannot-move-turret' as const }),
        result,
        warnings,
    };
}

// ---------------------------------------------------------------------------
// Driver registry
// ---------------------------------------------------------------------------

/**
 * A registry of available drivers.
 *
 * Deliberately a plain array rather than a global singleton: tests construct
 * their own, and the app passes it around. A module-level mutable registry is
 * exactly the pattern that made the old solver's `ambientTempF` global a real
 * bug.
 */
export class DriverRegistry {
    private readonly drivers = new Map<string, DeviceDriver>();

    /** Register a driver. Throws on a duplicate id, because that is a bug. */
    register(driver: DeviceDriver): this {
        const id = driver.descriptor.id;
        if (this.drivers.has(id)) {
            throw new Error(`A driver with id "${id}" is already registered.`);
        }
        this.descriptors.push(driver.descriptor);
        this.drivers.set(id, driver);
        return this;
    }

    /** All descriptors, for display. */
    readonly descriptors: DeviceDescriptor[] = [];

    get(id: string): DeviceDriver | undefined {
        return this.drivers.get(id);
    }

    /** Drivers that provide a given capability. */
    withCapability<K extends keyof Capabilities>(capability: K): DeviceDriver[] {
        return [...this.drivers.values()].filter(
            (d) => d.descriptor.capabilities[capability],
        );
    }

    /**
     * The first driver that can measure something no other connected driver can.
     *
     * Intended for the "fill in what is missing" path: a Kestrel supplies wind
     * and a rangefinder supplies distance, and neither needs to know about the
     * other.
     */
    firstWith(capability: keyof Capabilities): DeviceDriver | undefined {
        return [...this.drivers.values()].find(
            (d) => d.descriptor.capabilities[capability],
        );
    }

    get size(): number {
        return this.drivers.size;
    }
}

// Imported here rather than at the top to keep the type-only import honest.
import type { Capabilities, DeviceDescriptor } from './types.ts';
