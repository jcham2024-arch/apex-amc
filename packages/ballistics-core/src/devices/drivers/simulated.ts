/**
 * Simulated device drivers.
 * ===========================================================================
 *
 * These exist so the whole device-to-firing-solution pipeline can be tested in
 * Node today, with no Bluetooth, no hardware, and no vendor protocol. They are
 * not mocks: they go through the same `DeviceDriver` interface, the same
 * registry, and the same turret gate that a real driver will.
 *
 * That distinction matters. A mock that bypasses the gate would let the gate
 * ship untested, and the gate is the part that matters.
 *
 * The simulated driver also has an unrealistic virtue: it can be configured with
 * a *low* backlash and a *write-only* turret, which lets the tests cover the
 * awkward states (a move too small to be reliable, a move that cannot be
 * verified) that are hard to provoke on real hardware.
 *
 * @packageDocumentation
 */

import type {
    BluetoothTransport,
    DeviceDescriptor,

    DeviceDriver,
    DeviceReading,
    ImageFrameLike,
    TurretControl,
    TurretMove,
    TurretMoveResult,
} from '../types.ts';

/** A rangefinder with no hardware behind it. */
export class SimulatedRangefinder implements DeviceDriver {
    readonly descriptor: DeviceDescriptor;

    private transport: BluetoothTransport | null = null;
    private rangeYd = 500;
    private confidence = 1;
    private locked = true;
    private subscribers: ((r: DeviceReading) => void)[] = [];

    /**
     * @param rangeYd        the distance it will report
     * @param confidence     range quality, 0-1
     */
    constructor(rangeYd = 500, confidence = 1) {
        this.rangeYd = rangeYd;
        this.confidence = confidence;
        this.descriptor = {
            id: 'simulated-rangefinder',
            displayName: 'Simulated Rangefinder',
            kind: 'rangefinder',
            capabilities: {
                range: true,
                wind: false,
                atmosphere: false,
                inclination: false,
                readsTurret: false,
                writesTurret: false,
                camera: false,
            },
            status: 'production',
            note: 'Test fixture. Reports a fixed distance with no hardware.',
        };
    }

    /** Move the simulated target. */
    setRange(yards: number): void {
        this.rangeYd = yards;
        this.emit();
    }

    /** Set the reported confidence, to exercise the low-confidence warning. */
    setConfidence(confidence: number): void {
        this.confidence = confidence;
        this.emit();
    }

    /**
     * Simulate losing lock on the target.
     *
     * A real laser that loses lock has no reading at all. Returning zero, or
     * the last good value, would be a fabrication, so this throws instead.
     */
    setLocked(locked: boolean): void {
        this.locked = locked;
        this.emit();
    }

    async init(transport: BluetoothTransport): Promise<void> {
        this.transport = transport;
        if (!transport.isConnected) {
            throw new Error('Simulated rangefinder requires a connected transport.');
        }
    }

    async dispose(): Promise<void> {
        this.transport = null;
        this.subscribers = [];
    }

    async read(): Promise<DeviceReading> {
        if (!this.locked) {
            // Import is deferred to keep this file's top-level dependencies
            // identical to a real driver's.
            const { DeviceReadError } = await import('../types.ts');
            throw new DeviceReadError(
                this.descriptor.id,
                'The rangefinder has no lock on a target. Point it at something.',
            );
        }
        return {
            at: new Date().toISOString(),
            rangeYd: this.rangeYd,
            rangeConfidence: this.confidence,
        };
    }

    async subscribe(onReading: (r: DeviceReading) => void): Promise<() => void> {
        this.subscribers.push(onReading);
        return () => {
            this.subscribers = this.subscribers.filter((s) => s !== onReading);
        };
    }

    private emit(): void {
        if (!this.locked) return;
        const reading: DeviceReading = {
            at: new Date().toISOString(),
            rangeYd: this.rangeYd,
            rangeConfidence: this.confidence,
        };
        for (const s of this.subscribers) s(reading);
    }
}

/** A weather meter with no hardware behind it. */
export class SimulatedWeatherMeter implements DeviceDriver {
    readonly descriptor: DeviceDescriptor;

    private speedMph = 0;
    private gustMph: number | undefined;
    /** Compass bearing, as a real meter reports it. */
    private compassDeg: number | undefined;
    private tempF: number | undefined;
    private pressureInHg: number | undefined;
    private humidityPct: number | undefined;

    constructor() {
        this.descriptor = {
            id: 'simulated-weather-meter',
            displayName: 'Simulated Weather Meter',
            kind: 'weather-meter',
            capabilities: {
                range: false,
                wind: true,
                atmosphere: true,
                inclination: false,
                readsTurret: false,
                writesTurret: false,
                camera: false,
            },
            status: 'production',
            note: 'Test fixture. Reports configurable values with no hardware.',
        };
    }

    /** Set the wind. Direction is a compass bearing, as real hardware reports. */
    setWind(speedMph: number, compassDeg?: number, gustMph?: number): void {
        this.speedMph = speedMph;
        this.compassDeg = compassDeg;
        this.gustMph = gustMph;
    }

    setAtmosphere(tempF: number, pressureInHg?: number, humidityPct?: number): void {
        this.tempF = tempF;
        this.pressureInHg = pressureInHg;
        this.humidityPct = humidityPct;
    }

    async init(): Promise<void> {
        /* no transport needed */
    }

    async dispose(): Promise<void> {
        /* nothing to release */
    }

    async read(): Promise<DeviceReading> {
        const at = new Date().toISOString();
        // Built as a single immutable object. `DeviceReading` is readonly by
        // design: a reading is a snapshot, not something to be assembled by
        // mutation, because a partially-filled reading is indistinguishable from
        // a device that simply did not measure something.
        return {
            at,
            ...(this.speedMph !== 0 ? { windSpeedMph: this.speedMph } : {}),
            ...(this.gustMph !== undefined ? { windGustMph: this.gustMph } : {}),
            ...(this.compassDeg !== undefined
                ? {
                      windDirectionDeg: this.compassDeg,
                      // Flagged so the solution layer converts it. A driver must never
                      // do that conversion itself: it requires knowing which way the
                      // shooter faces, which is not a device fact.
                      windDirectionIsCompass: true,
                  }
                : {}),
            ...(this.tempF !== undefined ? { tempF: this.tempF } : {}),
            ...(this.pressureInHg !== undefined
                ? { barometricPressureInHg: this.pressureInHg }
                : {}),
            ...(this.humidityPct !== undefined ? { humidityPct: this.humidityPct } : {}),
        };
    }
}

/**
 * A simulated motorised turret.
 *
 * Models the two things that make real turret automation hard, so the safety
 * behaviour can be tested rather than assumed:
 *
 *  - **Backlash.** The turret is modelled as resting against a thread with
 *    `backlashClicks` of slack. A move smaller than that slack may do nothing,
 *    and the driver reports honestly that the position is unknown.
 *  - **Write-only mode.** `canRead` false models a device that can command a
 *    turret but cannot sense where it ended up, which is the state that must
 *    force a "verify by hand" warning.
 *
 * It is a test fixture. It drives no hardware and cannot be made to.
 */
export class SimulatedTurret implements DeviceDriver, TurretControl {
    readonly descriptor: DeviceDescriptor;

    /** Turret state, in clicks from the zeroed position. */
    private elevationClicks = 0;
    private windageClicks = 0;
    /** Clicks of thread slack. A move smaller than this may not register. */
    readonly backlashClicks: number;
    /** Whether this turret can report its own position. */
    readonly canRead: boolean;
    readonly readsPosition: boolean;
    readonly verification: 'read-back' | 'sensor' | 'none';
    readonly clicksPerMoa: number;

    /** Every move this turret was asked to make, for assertions in tests. */
    readonly moveLog: TurretMove[] = [];

    constructor(options: {
        readonly clicksPerMoa?: number;
        readonly backlashClicks?: number;
        readonly canRead?: boolean;
    } = {}) {
        this.clicksPerMoa = options.clicksPerMoa ?? 0.25;
        this.backlashClicks = options.backlashClicks ?? 0;
        this.canRead = options.canRead ?? true;
        this.readsPosition = this.canRead;
        this.verification = this.canRead ? 'read-back' : 'none';

        this.descriptor = {
            id: 'simulated-turret',
            displayName: 'Simulated Motorised Turret',
            kind: 'simulated',
            capabilities: {
                range: false,
                wind: false,
                atmosphere: false,
                inclination: false,
                readsTurret: this.canRead,
                writesTurret: true,
                camera: false,
            },
            status: 'production',
            note: 'Test fixture. Models backlash and write-only turrets.',
        };
    }

    /** Put the turret at a known position, bypassing backlash. */
    setPosition(elevationClicks: number, windageClicks: number): void {
        this.elevationClicks = elevationClicks;
        this.windageClicks = windageClicks;
    }

    /** Where the turret actually is, for test assertions. */
    get position(): { elevationClicks: number; windageClicks: number } {
        return { elevationClicks: this.elevationClicks, windageClicks: this.windageClicks };
    }

    async init(): Promise<void> {
        /* no transport needed */
    }

    async dispose(): Promise<void> {
        /* nothing to release */
    }

    async read(): Promise<DeviceReading> {
        // A write-only turret genuinely cannot report its position, so it does not
        // fake one. The solution layer is required to notice the absence and warn.
        return {
            at: new Date().toISOString(),
            clicksPerMoa: this.clicksPerMoa,
            ...(this.canRead
                ? {
                      elevationClicks: this.elevationClicks,
                      windageClicks: this.windageClicks,
                  }
                : {}),
        };
    }

    async moveTurret(move: TurretMove): Promise<TurretMoveResult> {
        this.moveLog.push(move);

        const elevationDelta = move.elevationClicks;
        const windageDelta = move.windageClicks;

        // Model backlash: a move smaller than the slack is consumed by the
        // thread and the turret may not move at all. The direction is used to
        // decide which way to take up the slack.
        const elevationWithinSlack =
            this.backlashClicks > 0 && Math.abs(elevationDelta) < this.backlashClicks;
        const windageWithinSlack =
            this.backlashClicks > 0 && Math.abs(windageDelta) < this.backlashClicks;

        if (elevationWithinSlack || windageWithinSlack) {
            return {
                ok: true,
                unverified: true,
                reason: 'move was smaller than the mechanism backlash',
            };
        }

        this.elevationClicks += elevationDelta;
        this.windageClicks += windageDelta;

        return {
            ok: true,
            unverified: !this.canRead,
            ...(this.canRead
                ? {
                      reachedElevationClicks: this.elevationClicks,
                      reachedWindageClicks: this.windageClicks,
                  }
                : {}),
        };
    }
}

/** A simulated scope camera, which is the most plausible future frame source. */
export class SimulatedScopeCamera implements DeviceDriver {
    readonly descriptor: DeviceDescriptor;

    constructor() {
        this.descriptor = {
            id: 'simulated-scope-camera',
            displayName: 'Simulated Scope Camera',
            kind: 'simulated',
            capabilities: {
                range: false,
                wind: false,
                atmosphere: false,
                inclination: false,
                readsTurret: false,
                writesTurret: false,
                camera: true,
            },
            status: 'production',
            note: 'Test fixture. Produces a synthetic frame.',
        };
    }

    async init(): Promise<void> {
        /* no transport needed */
    }

    async dispose(): Promise<void> {
        /* nothing to release */
    }

    async read(): Promise<DeviceReading> {
        return { at: new Date().toISOString() };
    }

    async captureFrame(): Promise<ImageFrameLike> {
        // A 4x4 solid grey frame. Small on purpose: this exists to prove the
        // pipeline carries frames, not to test computer vision.
        const width = 4;
        const height = 4;
        return {
            width,
            height,
            data: new Uint8Array(width * height * 3).fill(128),
            capturedAt: new Date().toISOString(),
            annotations: { note: 'synthetic frame from the simulated scope camera' },
        };
    }
}
