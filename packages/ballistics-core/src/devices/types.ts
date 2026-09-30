/**
 * Device integration: driver contracts and the capability model.
 * ===========================================================================
 *
 * This module defines how the app talks to *any* piece of shooting hardware.
 * It deliberately contains no vendor specifics. The goal is that adding a new
 * device is a small isolated file, not an edit to the ballistics code.
 *
 * ---------------------------------------------------------------------------
 * WHY A CAPABILITY MODEL AND NOT A VENDOR ENUM
 * ---------------------------------------------------------------------------
 * The first version of this would have been a `DeviceType` union with members
 * like `'garmin-r10' | 'kestrel-5500' | 'sig-bdx'`. That is a trap: every new
 * device becomes a change to the core, and the UI ends up carrying a switch
 * statement that grows forever.
 *
 * Instead, a driver declares what it *can do*, and the UI asks about
 * capabilities rather than about brands. A UI that wants a wind readout asks
 * "is there a live wind source?" and does not care whether the answer came
 * from a Kestrel, a weather API, or a value the shooter typed.
 *
 * This is the same reasoning as the provenance model: the consumer asks about
 * the property it needs, not about the mechanism supplying it.
 *
 * ---------------------------------------------------------------------------
 * WHAT IS AND IS NOT POSSIBLE TODAY
 * ---------------------------------------------------------------------------
 * Honest status, because building an interface to hardware that cannot talk to
 * us would misrepresent what the app does.
 *
 *   RANGEFINDERS   Several expose Bluetooth. Protocol availability ranges from
 *                  documented to reverse-engineered to closed. Garmin's R10 BLE
 *                  protocol, for instance, is only known through third-party
 *                  reverse engineering with no vendor stability guarantee.
 *
 *   WEATHER METERS Kestrel and SIG's BDX-Kestrel stream real readings to
 *                  phones. Highest-value device for a long-range shooter: a
 *                  5 mph crosswind is worth 4.19 MOA at 1000 yd, while full
 *                  humidity is worth 0.15 MOA. See docs/HARDWARE-AND-SENSORS.md.
 *
 *   SCOPES         **No major manufacturer exposes a public API for third-party
 *                  read or control of turrets.** The electronic ballistic
 *                  computers (SIG BDX, Nightforce NFOR, Leupold LR/TX, Vortex
 *                  Venom, Swarovski) speak proprietary protocols to their own
 *                  apps. There is no open standard, and no way to read a turret
 *                  position or command a turret without a vendor partnership or
 *                  a protocol reverse-engineered from firmware.
 *
 *                  This is why `TurretControl` below exists as a capability with
 *                  no shipped driver rather than as a feature. The contract is
 *                  defined, documented and tested. The day a device supports it,
 *                  a driver appears and the firing-solution pipeline lights up
 *                  with no change to the ballistics code.
 *
 * ---------------------------------------------------------------------------
 * SAFETY POSITION ON AUTOMATED TURRET MOVEMENT
 * ---------------------------------------------------------------------------
 * A driver that can move a turret must satisfy all of the following. They are
 * non-negotiable and the test suite enforces them.
 *
 *  1. **Never auto-fire.** There is no `fire()` in any interface here, by
 *     design. The human pulls the trigger. This app is not a trigger puller and
 *     must never become one.
 *
 *  2. **A turret move is a proposal until a human confirms it.** See
 *     `FiringSolution.proposedAdjustment` and the acknowledgement requirement on
 *     `applyAdjustment`. A phone in a pocket must not move a rifle.
 *
 *  3. **Mechanical backlash is the real hazard.** A motorised turret has
 *     hysteresis: commanding "+3 clicks" from a turret resting 2 clicks on the
 *     wrong side of the thread can land anywhere. `TurretMove.direction` forces
 *     the caller to state which way the turret is moving so a driver can always
 *     approach the target from a known side, and `TurretControl.backlashClicks`
 *     lets a driver declare its own slack.
 *
 *  4. **Verify after moving, or say you cannot.** `TurretControl.readsPosition`
 *     is separate from `capabilities.writesTurret`. A write-only driver must
 *     declare `verification: 'none'`, which the solution layer surfaces as a
 *     mandatory "verify by hand" warning, because "we moved it and cannot
 *     confirm" is exactly the state where a shooter must re-check.
 *
 *  5. **A refused or failed move is a normal outcome, not an error to retry
 *     silently.** `applyAdjustment` returns a result the caller must handle.
 *     Auto-retrying a turret move is how a rifle ends up somewhere nobody
 *     intended.
 *
 * ---------------------------------------------------------------------------
 * DESIGN RULES FOR DRIVERS
 * ---------------------------------------------------------------------------
 * - Drivers are pure TypeScript. No React, no React Native, no Expo imports.
 *   A driver is testable in Node, which is what makes the simulated driver a
 *   genuine test of the pipeline rather than a mock of it.
 * - Bluetooth transport is INJECTED, never imported. See `BluetoothTransport`.
 *   A driver declares what GATT operations it needs; the platform layer
 *   supplies the implementation. This is what keeps `ballistics-core`
 *   framework-free.
 * - Drivers must throw rather than return sentinel values for a bad reading. A
 *   rangefinder that lost lock has no `range: 0`; it has an error.
 * - Drivers must never invent a value. A driver that cannot measure wind
 *   returns nothing for wind and the solution layer says so out loud.
 *
 * @packageDocumentation
 */

/** How far a driver is from being usable. Honest, so the UI can say so. */
export type DriverStatus =
    /** Implemented, tested, and believed to work against real hardware. */
    | 'production'
    /** Implemented against a real protocol but unconfirmed on hardware. */
    | 'experimental'
    /** Contract complete, no protocol available. Waiting on a device. */
    | 'contract-only'
    /** Deliberately unsupported, with a reason. */
    | 'rejected';

/** What a driver can do. Consumers ask about these, never about brands. */
export interface Capabilities {
    /** Produces a distance to a target, in yards. */
    readonly range: boolean;
    /** Produces wind speed and direction. */
    readonly wind: boolean;
    /** Produces temperature, pressure, humidity. */
    readonly atmosphere: boolean;
    /** Produces inclination or slope. */
    readonly inclination: boolean;
    /** Can read the current turret position. */
    readonly readsTurret: boolean;
    /**
     * Can command a turret to move. Requires an explicit human acknowledgement
     * before it will do anything. See the safety section above.
     */
    readonly writesTurret: boolean;
    /** Has a camera the app can consume a frame from. */
    readonly camera: boolean;
}

/** A driver that provides no capabilities. Useful as a base class. */
export const NO_CAPABILITIES: Capabilities = {
    range: false,
    wind: false,
    atmosphere: false,
    inclination: false,
    readsTurret: false,
    writesTurret: false,
    camera: false,
};

/**
 * Injected Bluetooth transport.
 *
 * A driver requests GATT operations through this interface and never imports a
 * BLE library itself. That keeps this package free of React Native
 * dependencies, and it is what makes drivers testable in Node.
 *
 * UUIDs are plain strings because the concrete transport is platform-specific;
 * this module has no opinion about the 16-bit versus 128-bit UUID convention.
 */
export interface BluetoothTransport {
    /** Scan for a device. Resolves once connected, or rejects on timeout. */
    connect(options: { readonly deviceId?: string; readonly timeoutMs: number }): Promise<void>;
    disconnect(): Promise<void>;
    readonly isConnected: boolean;

    /**
     * Read a characteristic. Rejects if the characteristic is missing or the
     * read fails, which is how a driver learns it is talking to the wrong
     * device.
     */
    read(service: string, characteristic: string): Promise<Uint8Array>;
    /** Write a characteristic. Rejects on failure; never swallows. */
    write(service: string, characteristic: string, value: Uint8Array): Promise<void>;
    /** Subscribe to notifications. The returned function unsubscribes. */
    subscribe(
        service: string,
        characteristic: string,
        onValue: (value: Uint8Array) => void,
    ): Promise<() => void>;
    /** Liveness probe. A driver may call this before a safety-relevant command. */
    ping?(): Promise<boolean>;
}

/** A hardware or software device the app can talk to. */
export interface DeviceDescriptor {
    /** Stable identifier, e.g. `'simulated-rangefinder'`. Not a brand. */
    readonly id: string;
    /** Name to show a human. */
    readonly displayName: string;
    /** What kind of thing this is, for UI grouping only. */
    readonly kind: 'rangefinder' | 'weather-meter' | 'scope' | 'combo' | 'simulated';
    readonly capabilities: Capabilities;
    readonly status: DriverStatus;
    /**
     * For anything not production: why, in words a user could act on.
     * Required for `contract-only` and `rejected`, and for any `experimental`
     * driver whose protocol is reverse-engineered.
     */
    readonly note?: string;
}

/** A single reading from a device. All fields optional by capability. */
export interface DeviceReading {
    /** ISO timestamp of the reading. */
    readonly at: string;
    /** Distance to target, yards. Only when `capabilities.range`. */
    readonly rangeYd?: number;
    /**
     * Range quality indicator, 0-1, as reported by the device. A laser
     * returning a low-confidence reading on foliage is a different situation
     * from a clean hit on a steel plate, and the UI should be able to say so.
     */
    readonly rangeConfidence?: number;
    /** Wind speed, mph. */
    readonly windSpeedMph?: number;
    /** Wind gust, mph. */
    readonly windGustMph?: number;
    /**
     * Wind direction the wind comes FROM, degrees clockwise from the
     * shooter's forward. 0 = from 12 o'clock, 90 = from 3 o'clock.
     *
     * A device reporting a raw compass bearing must be converted through
     * `meteoWindToShooterFrame` with the shooter's facing. Drivers must NOT do
     * that conversion themselves, because it requires knowing which way the
     * shooter is facing, which is not a device fact.
     */
    readonly windDirectionDeg?: number;
    /** True when `windDirectionDeg` is a compass bearing, not a shooter frame. */
    readonly windDirectionIsCompass?: boolean;
    /** Ambient temperature, degF. */
    readonly tempF?: number;
    /** Relative humidity, 0-100. */
    readonly humidityPct?: number;
    /** Barometric pressure, inHg. */
    readonly barometricPressureInHg?: number;
    /** Inclination of the shooting position, degrees above horizontal. */
    readonly inclineDeg?: number;
    /** Current turret elevation, in clicks from the zeroed position. */
    readonly elevationClicks?: number;
    /** Current turret windage, in clicks from the zeroed position. */
    readonly windageClicks?: number;
    /** Clicks per MOA for the turret above. Required to read or write turrets. */
    readonly clicksPerMoa?: number;
    /** A camera frame, if the driver has one. */
    readonly frame?: ImageFrameLike;
}

/**
 * The minimum shape of a camera frame.
 *
 * Structurally typed rather than referencing a platform image type, so this
 * package stays framework-free while still letting a driver hand over a frame.
 * A scope-mounted camera is a genuinely plausible future input: it is how a
 * shooter would confirm what the reticle is actually sitting on.
 */
export interface ImageFrameLike {
    readonly width: number;
    readonly height: number;
    /**
     * Raw bytes. Format is driver-specific and must be documented by the
     * driver. No assumption is made here about pixel format.
     */
    readonly data: Uint8Array;
    /** ISO timestamp. */
    readonly capturedAt: string;
    /** Free-form labels the driver attached, e.g. detected target boxes. */
    readonly annotations?: Readonly<Record<string, string | number>>;
}

/**
 * A turret adjustment request.
 *
 * Always expressed in clicks, because that is what a turret physically has.
 * Converting to MOA is the driver's job, since click spacing is a property of
 * the turret rather than of the problem.
 */
export interface TurretMove {
    readonly elevationClicks: number;
    readonly windageClicks: number;
    /**
     * The direction the turret is being driven.
     *
     * Required, and not optional, because backlash depends on it. A driver that
     * knows the turret is being moved up must always approach the target from
     * below, taking up thread slack on the way, so the same command produces
     * the same position regardless of where the turret was resting.
     */
    readonly direction: 'up' | 'down' | 'left' | 'right' | 'combined';
}

/** The result of attempting a turret move. Callers must handle every case. */
export interface TurretMoveResult {
    readonly ok: boolean;
    /** Position the driver believes the turret reached, if it can report one. */
    readonly reachedElevationClicks?: number;
    readonly reachedWindageClicks?: number;
    /**
     * True when the driver could not confirm the resulting position. The
     * solution layer turns this into a mandatory "verify by hand" warning.
     */
    readonly unverified?: boolean;
    /** Why it failed, if it did. */
    readonly reason?: string;
}

/**
 * A device driver.
 *
 * A driver owns protocol knowledge and nothing else. It does not solve
 * ballistics, does not format a dope card, and does not decide what a shooter
 * should do. That separation is what lets a driver be replaced without touching
 * anything that affects accuracy.
 */
export interface DeviceDriver {
    readonly descriptor: DeviceDescriptor;

    /**
     * Prepare the driver. Called once, after transport injection. Should
     * validate that the device speaks the expected protocol and reject clearly
     * if not, rather than failing later on a confusing read.
     */
    init(transport: BluetoothTransport): Promise<void>;
    dispose(): Promise<void>;

    /**
     * Take a reading. Must throw rather than return a partial or invented
     * value. A rangefinder with no lock throws; it does not return 0.
     */
    read(): Promise<DeviceReading>;

    /**
     * Start continuous reading. The returned function stops it.
     * Optional: a driver may be read-on-demand only.
     */
    subscribe?(onReading: (reading: DeviceReading) => void): Promise<() => void>;

    /**
     * Move a turret. Only meaningful when `capabilities.writesTurret`.
     *
     * The caller must have obtained an explicit human acknowledgement before
     * calling this. That requirement lives in the solution layer, not here,
     * because this module has no UI and cannot enforce a dialog.
     */
    moveTurret?(move: TurretMove): Promise<TurretMoveResult>;

    /**
     * Capture a frame from an on-device camera. Only meaningful when
     * `capabilities.camera`.
     */
    captureFrame?(): Promise<ImageFrameLike>;
}

/** Turret-specific facts a driver must declare when it touches turrets. */
export interface TurretControl {
    /**
     * Whether the driver can read the current position. A write-only driver
     * sets this false, and the UI is then required to warn after any move.
     */
    readonly readsPosition: boolean;
    /**
     * How the driver verifies a move, or the explicit absence of that ability.
     * `'none'` forces a "verify by hand" warning; a driver claiming
     * `'read-back'` had better actually read back.
     */
    readonly verification: 'read-back' | 'sensor' | 'none';
    /**
     * Slack in the mechanism, in clicks. A driver adds this to a move to take
     * up thread hysteresis. Zero for a scope with no motorised turret.
     */
    readonly backlashClicks: number;
}

/**
 * Thrown when a driver cannot produce a reading.
 *
 * A distinct class so the UI can tell "the device said no" apart from "the app
 * has a bug". A rangefinder with no lock is a normal condition the shooter
 * needs to see, not a crash.
 */
export class DeviceReadError extends Error {
    override readonly name = 'DeviceReadError';
    /** The device that failed, for the UI. */
    readonly deviceId: string;
    /** Whether retrying might plausibly help. */
    readonly retryable: boolean;

    constructor(deviceId: string, message: string, retryable = true) {
        super(message);
        this.deviceId = deviceId;
        this.retryable = retryable;
    }
}
