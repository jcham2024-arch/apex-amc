/**
 * Exterior ballistics: trajectory solver.
 * ===========================================================================
 *
 * THIS IS THE SAFETY-CRITICAL CORE OF THE PROJECT. Every number it produces
 * becomes a holdover on a DOPE card. Read this header before changing anything.
 *
 * ---------------------------------------------------------------------------
 * WHAT IT SOLVES
 * ---------------------------------------------------------------------------
 * Given a bullet (mass, diameter, G1/G7 ballistic coefficient), a muzzle
 * velocity, an atmosphere, and a wind, compute where the bullet goes. Output
 * is a table of range, drop, windage, velocity, and time.
 *
 * ---------------------------------------------------------------------------
 * THE GOVERNING EQUATION
 * ---------------------------------------------------------------------------
 * Newton's second law for a projectile moving through a resisting medium:
 *
 *     F = (1/2) * rho * v^2 * Cd * A
 *     a = F / m
 *
 * Written in the standard drag-function form, where Cd is read from the G1/G7
 * tables at the local Mach number and the form factor i absorbs the difference
 * between the real projectile and the reference projodal:
 *
 *     a_drag = rho * v_rel^2 * Cd(M) / (2 * i * BC)
 *
 * The bullet is also in free fall, so the coupled 2-D state evolves as
 *
 *     du/dt = -a_drag * (u_rel / |v_rel|)        horizontal
 *     dv/dt = -a_drag * (v_rel / |v_rel|) - g    vertical
 *     dx/dt = u,  dy/dt = v
 *
 * CRITICAL - drag must oppose velocity RELATIVE TO THE AIR, not relative to
 * the ground. With wind, the bullet's air-relative velocity is
 *
 *     v_rel = v_bullet - v_wind
 *
 * That is the entire mechanism by which a crosswind pushes a bullet sideways,
 * and it is the most commonly botched part of a simple solver. Getting it
 * wrong means wind either does nothing or pushes the wrong way.
 *
 * ---------------------------------------------------------------------------
 * THE FIVE FAILURE MODES THAT MATTER
 * ---------------------------------------------------------------------------
 *
 * Numbered 1-4 below. The fifth is documented where it bit: at
 * DRAG_COEFFICIENT_PI_OVER_8, further down this file, because it is specific to
 * that constant. It was labelled "4." there too, so the header said FOUR and the
 * file documented FIVE - two different failure modes sharing a number, which is
 * the kind of stale comment AGENTS.md warns about: worse than none, because it
 * is trusted. Found 2 Oct 2026 by counting, not by reading.
 * 1. INVERTING THE DRAG SIGN. If a_drag is added rather than subtracted, the
 *    bullet ACCELERATES. A previous implementation of this file did exactly
 *    that and produced velocity rising from 2650 to 3929 fps. The regression
 *    test "velocity decreases monotonically" in test/solver.test.ts exists
 *    specifically to catch this. Do not remove it.
 *
 * 2. DROPPING THE pi/4. The drag force is (1/2) rho v^2 Cd A where A is the
 *    frontal area pi d^2 / 4. Cancel the 1/2 against a 2 and it is easy to forget
 *    the pi/4, which inflates drag by 4/pi = 1.2732. This solver did exactly
 *    that during development and lost 1256 fps over 1000 yd where the reference
 *    loses 1568 - a 25% velocity error, roughly 4% of hold at 1000 yd. The
 *    constant DRAG_COEFFICIENT_PI_OVER_8 below exists so it cannot recur.
 *
 * 3. WRONG DENSITY UNITS. rho must be slug/ft^3. The engineering figure
 *    0.0000745 lb/in^3 is the SAME physical density; dropping it into the
 *    slug/ft^3 slot overstates drag by about 10^5. Both appear in
 *    provenance/constants.ts as named constants so the mistake cannot recur.
 *
 *
 * 4. ZERO APPLIED AS A POST-HOC OFFSET. A zeroed rifle does not fire
 *    horizontally. The shooter raised the bore until the bullet crossed the
 *    line of sight at the zero distance, so the zero is really a LAUNCH ANGLE.
 *    An earlier version integrated one horizontal trajectory and then subtracted
 *    a straight line to fake the zero, which got three things wrong at once: the
 *    zero was read from the first output sample (so a coarse step read it from
 *    the wrong range, and a 1000 yd zero produced a 400 in hold at 1000 yd); the
 *    slope had the wrong sign, inverting every hold; and the reported velocity
 *    and time of flight were those of a horizontal shot rather than the actual
 *    bore angle the rifle is firing at.
 *
 *    The solver now integrates twice. Pass 1 fires horizontally to the zero
 *    distance and measures the fall. Pass 2 launches along the slope that
 *    cancels that fall, so the trajectory is zero at the zero distance by
 *    construction and the reported hold is the trajectory height itself. The
 *    second integration is not an optimisation to avoid: it is what makes the
 *    velocity and time of flight physical.
 *
 * --------------------------------------------------------------------------
 * VALIDATION
 * ---------------------------------------------------------------------------
 * Validated against published reference trajectory data for a .308 Win 168 gr
 * Federal Gold Medal Match bullet, G1 BC 0.462, 2650 fps, 100 yd zero, at
 * standard sea-level conditions. See test/solver.test.ts for the full table
 * and tolerances.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS MODEL DOES NOT DO
 * ---------------------------------------------------------------------------
 * - Point mass. No yaw, so it cannot predict the yaw-induced drag that makes
 *   short-throat high-BC bullets "flip" below about Mach 1.2, or the
 *   boat-tailed versus wadcutter difference in flight.
 * - No earth curvature, coriolis, or target movement. Small below 1000 yd,
 *   not negligible beyond 2000 yd.
 * - Assumes a steady atmosphere. A bullet crossing a front or a shear layer
 *   does not follow this.
 * - Applies zero as a rigid offset after integration, which is right for a
 *   bore-sighted scope but ignores optic elevation-angle shift.
 *
 * Every limit is disclosed rather than hidden, because a shooter needs to know
 * where the model's validity ends.
 *
 * ---------------------------------------------------------------------------
 * SOURCES
 * ---------------------------------------------------------------------------
 * - Sierra Bullets, "Exterior Ballistics: The Bullet's Flight Explained", and
 *   the accompanying drag tables. Origin of the G1/G7 formulation and the
 *   form-factor relationship.
 * - McCoy, R. L., "Modern Exterior Ballistics: The Launch and Flight Dynamics
 *   of Symmetric Projectiles", Schiffer Publishing, 1999. The rigorous
 *   reference for this retardation formulation.
 * - The drag tables are in dragTables.ts, with their own citation.
 *
 * @packageDocumentation
 */

// G1_FORM_FACTOR and G7_FORM_FACTOR are deliberately NOT imported here. They
// describe the reference projectiles (1 and 1.2), not a real bullet, and
// applying them would be wrong - see the form-factor derivation below and
// docs/BALLISTICS-AUDIT.md. Importing them here once invited exactly that.
import { GRAINS_PER_POUND } from '../provenance/constants.ts';
import { G1_DRAG_TABLE, G7_DRAG_TABLE, dragCoefficient } from './dragTables.ts';
import {
    airDensitySlugPerFt3,
    densityRatio as densityRatioFromAltitude,
    densityRatioFromPressure,
    gravityFps2,
    humidityDensityCorrection,
    speedOfSoundHumidFps,
} from '../atmosphere.ts';

/** Which drag function to solve against. */
export type DragModel = 'G1' | 'G7';

/**
 * Atmosphere and wind for one firing solution.
 *
 * There is no default that silently assumes sea level and 59 degF, because a
 * shooter in Denver using a sea-level dope card is exactly the failure this
 * app exists to prevent.
 */
export interface FiringEnvironment {
    /** Ambient temperature, degF. Drives speed of sound and the Mach index. */
    readonly tempF: number;
    /** Relative humidity, 0-100. Omit when unknown. */
    readonly relativeHumidityPct?: number;
    /**
     * Air density ratio, sigma (1.0 = ISA sea level). Pass this to override
     * the solver's own computation from elevation or pressure.
     */
    readonly densityRatio?: number;
    /** Shooter elevation, feet MSL. Used when `densityRatio` is absent. */
    readonly altitudeFt?: number;
    /** Observed barometric pressure, inHg. Preferred when available. */
    readonly barometricPressureInHg?: number;
    /** Wind speed, mph. */
    readonly windSpeedMph?: number;
    /**
     * Direction the wind comes FROM, degrees clockwise from the shooter's
     * forward. 0 = from 12 o'clock (headwind), 90 = from 3 o'clock
     * (left-to-right crosswind). Matches how every shooter and every weather
     * report phrases it.
     */
    readonly windDirectionDeg?: number;
    /** Angle the round is fired at, degrees above horizontal. Default 0. */
    readonly inclineDeg?: number;
}

/** Input to a solve. */
export interface SolveRequest {
    /** Muzzle velocity, fps, from the shooter's own chronograph. */
    readonly muzzleVelocityFps: number;
    /** Bullet weight, grains. */
    readonly bulletWeightGr: number;
    /** Bullet diameter, inches. */
    readonly bulletDiameterIn: number;
    /** G1 ballistic coefficient, lb/in^2. */
    readonly bcG1: number;
    /** G7 ballistic coefficient, lb/in^2, when known. */
    readonly bcG7?: number | null;
    /** Which drag function to use. Defaults to G7 when a G7 BC is supplied. */
    readonly dragModel?: DragModel;
    /** Zero distance, yards. The bore line is defined to pass through here. */
    readonly zeroYd: number;
    /** MOA of the zero reference, as measured by the shooter. */
    readonly zeroMoa: number;
    /** Furthest range to solve to, yards. */
    readonly maxRangeYd: number;
    /** Output resolution, yards. Default 25. */
    readonly stepYd?: number;
    readonly environment: FiringEnvironment;
}

/** One row of the solution table. */
export interface SolutionPoint {
    /** Downrange distance, yards. */
    readonly rangeYd: number;
    /** Height of impact below the bore line, inches. Negative is below. */
    readonly dropIn: number;
    /** Lateral displacement, inches. Positive is to the shooter's right. */
    readonly windageIn: number;
    /** Point of impact in MOA, elevation. Negative is below the line of sight. */
    readonly elevationMoa: number;
    /** Point of impact in MOA, windage. Positive is to the right. */
    readonly windageMoa: number;
    /** Retained velocity at this range, fps. */
    readonly velocityFps: number;
    /** Time of flight to this range, seconds. */
    readonly timeS: number;
}

/** The full solution. */
export interface Solution {
    readonly points: readonly SolutionPoint[];
    /** Density ratio actually used, after resolving the environment. */
    readonly densityRatioUsed: number;
    /** Drag model actually used. */
    readonly dragModelUsed: DragModel;
    /** Effective form factor for the model and BC chosen. */
    readonly formFactor: number;
    /**
     * Hold in MOA required to bring the impact back to the zero point at
     * `maxRangeYd`. Positive is hold high.
     */
    readonly holdToZeroMoa: number;
    /**
     * Conditions a shooter should double-check before trusting this solution.
     * Populated when an input was inferred rather than measured, or when
     * something sits at the edge of the model's validity.
     */
    readonly cautions: readonly string[];
}

/** Thrown when a solve request is physically impossible or out of range. */
export class InvalidSolveRequest extends Error {
    override readonly name = 'InvalidSolveRequest';
}

// ---------------------------------------------------------------------------
// Internal state and constants
// ---------------------------------------------------------------------------

/**
 * Unit conversions, sourced from provenance/constants.ts.
 *
 * Sourced rather than restated. The previous version wrote
 * `const INCHES_PER_FOOT = 12` and `32.17405` inline here while constants.ts
 * already exported `INCHES_PER_FOOT` and `STANDARD_GRAVITY_FPS2`, each carrying
 * a published citation. That is the defect this fixes: a safety-critical file
 * holding its own uncited copy of a physical constant. Two copies of gravity is
 * two chances to change one of them.
 *
 * The provenance system is only real if the physics imports it, and until now
 * the domain imported 2 of the 26 available constants.
 */
import * as constants from '../provenance/constants.ts';

const { INCHES_PER_FOOT, FEET_PER_MILE, INCHES_PER_SQUARE_FOOT, STANDARD_GRAVITY_FPS2 } =
  constants;

/**
 * Plain-number aliases for the cited constants.
 *
 * These are unwrapped ONCE, at module scope, because the arithmetic further
 * down needs numbers rather than the Sourced<T> wrapper. Unwrapping at the
 * import (rather than at each of the eight use sites) means there is a single
 * place where the provenance wrapper becomes arithmetic - and a single place
 * where a reader can see exactly which published value the physics uses.
 *
 * Scope note: these MUST be module-level, not function-local. A first attempt
 * put them inside the function that reads the wind, which left the zero/hold
 * arithmetic in a sibling function referencing an out-of-scope name. Module
 * scope is the only placement that is correct for a shared unit constant.
 */
const IN = INCHES_PER_FOOT.value;
const FT_PER_MILE = FEET_PER_MILE.value;
const YD_TO_FT = constants.FEET_PER_YARD.value;
/** Feet per yard to yards per foot - the inverse. Used for ranges in yards. */
const YARDS_PER_FOOT = 1 / YD_TO_FT;

/**
 * 1 MOA subtends 1 inch at 100 yards - the definition of the unit, and the
 * reason a MOA figure scales linearly with range: at 1000 yd, 1 MOA = 10 in.
 */
const MOA_INCHES_AT_100YD_YARDS = 100;

/** Distance at which the scope sits above the bore when zeroed at `zeroYd`. */

/**
 * Integration time step, seconds.
 *
 * 1 ms. RK4 is effectively exact at this step: the fastest relevant timescale
 * is the ~1.3 s flight to 1000 yd, so residual error is dominated by the
 * tabulation of Cd rather than by the integrator. A coarser step saves time
 * but degrades the sampled windage, which is the noisiest output.
 */
const DT_SECONDS = 0.001;

/**
 * The combined drag-form constant, pi/8 = 0.3927.
 *
 * From F = (1/2) rho v^2 Cd A and A = pi d^2 / 4, combined with the
 * drag-function definition BC = CF * m / d^2, the retardation is
 *   a = (1/2) * rho v^2 Cd * (pi d^2 / 4) / m
 *     = (pi/8) * rho v^2 Cd / BC     (form factor already folded into BC)
 *
 * The classic mistake is to cancel the 1/2 against a 2 and forget the pi/4,
 * which inflates drag by 4/pi = 1.2732. This constant exists so that mistake
 * cannot be made silently.
 *
 * 5. MISSING UNIT CONVERSION (found 30 Sep 2026). The drag acceleration is
 *
 *   a = 0.5 * rho * v^2 * Cd * (pi/4) * d_ft^2 / m_slug
 *
 * Published drag-function BC is in lb/in^2, while rho is slug/ft^3 and the
 * diameter appears in FEET. Bridging those needs the factor
 *
 *   g / 144 = 32.17405 / 144 = 0.223430
 *
 * so the constant is (pi/8) * (g/144), NOT pi/8. The bare pi/8 overstates drag
 * by 1/0.22343 = 4.4758x, which is catastrophic: it made a 168gr bullet appear
 * to decelerate at 260 g at the muzzle. Nothing caught it until the drag tables
 * were corrected, because the two errors partly cancelled - the too-low Cd of
 * the old table was masking the too-large constant. Two wrong numbers pointing
 * the same way is the most dangerous kind of bug, because any single-parameter
 * check appears to pass.
 *
 * Both factors are named, sourced and cited here, so neither can be dropped
 * again and a change to either is a change in one place with a recorded reason.
 */
const DRAG_COEFFICIENT_PI_OVER_8 = (Math.PI / 8)
  * (STANDARD_GRAVITY_FPS2.value / INCHES_PER_SQUARE_FOOT.value);


/** Guard against a pathological request spinning forever. */
const MAX_STEPS = 20_000_000;

/**
 * The integrator state, in the shooter's frame.
 *
 * `x` downrange, `z` to the shooter's right, `y` up; all in feet. Velocities
 * in ft/s. Three dimensions because wind drift is a horizontal effect
 * perpendicular to the line of sight, and it cannot be recovered by differencing
 * the downrange component.
 */
interface State {
    x: number;
    y: number;
    z: number;
    u: number;
    v: number;
    w: number;
    t: number;
}

/** Immutable parameters resolved from a request before integrating. */
interface ResolvedEnvironment {
    /** Air density, slug/ft^3. */
    readonly rho: number;
    /** Speed of sound, fps. */
    readonly speedOfSound: number;
    /** Standard gravity, fps^2. */
    readonly gravity: number;
    /** Downrange component of the wind, ft/s. Negative for a headwind. */
    readonly windX: number;
    /** Lateral component of the wind, ft/s. Positive blows left to right. */
    readonly windZ: number;
    /** Sine of the firing incline. */
    readonly sinIncline: number;
    /** Cosine of the firing incline. */
    readonly cosIncline: number;
    /** Density ratio after humidity correction. */
    readonly densityRatio: number;
}

/**
 * Resolve the environment into the numbers the integrator needs.
 *
 * Density resolution is ordered by preference:
 *   1. an explicit `densityRatio` (the caller knows best)
 *   2. observed barometric pressure (a real station reading)
 *   3. elevation plus temperature (the ISA model)
 *
 * Humidity is applied as a final multiplier because it lowers air density, and
 * because a shooter who bothered to read humidity deserves to have it used.
 */
function resolveEnvironment(env: FiringEnvironment): ResolvedEnvironment {
    const gravity = gravityFps2();
    const tempF = env.tempF;

    const drySigma =
        env.densityRatio !== undefined
            ? env.densityRatio
            : env.barometricPressureInHg !== undefined
              ? densityRatioFromPressure(env.barometricPressureInHg, tempF)
              : densityRatioFromAltitude(env.altitudeFt ?? 0, tempF);

    const humidityFactor =
        env.relativeHumidityPct !== undefined
            ? humidityDensityCorrection(
                  tempF,
                  env.relativeHumidityPct,
                  env.barometricPressureInHg,
              )
            : 1;

    const sigma = drySigma * humidityFactor;
    const speedOfSound =
        env.relativeHumidityPct !== undefined
            ? speedOfSoundHumidFps(tempF, env.relativeHumidityPct)
            : speedOfSoundHumidFps(tempF, 0);

    // Wind direction is where the air comes FROM, so the vector it travels
    // toward is the reverse. A wind from the shooter's right (90 deg) therefore
    // blows toward the shooter's left, i.e. negative z.
    const windSpeedFps = (env.windSpeedMph ?? 0) * (FT_PER_MILE / 3600);
    const windRad = ((env.windDirectionDeg ?? 0) * Math.PI) / 180;
    const windX = -windSpeedFps * Math.cos(windRad);
    const windZ = -windSpeedFps * Math.sin(windRad);

    const inclineRad = ((env.inclineDeg ?? 0) * Math.PI) / 180;

    return {
        rho: airDensitySlugPerFt3(sigma),
        speedOfSound,
        gravity,
        windX,
        windZ,
        sinIncline: Math.sin(inclineRad),
        cosIncline: Math.cos(inclineRad),
        densityRatio: sigma,
    };
}

/**
 * Right-hand side of the equations of motion, in three dimensions.
 *
 * The drag magnitude is
 *
 *     a = rho * |v_rel|^2 * Cd(M) / (2 * i * BC)
 *
 * and it acts OPPOSITE the air-relative velocity, hence the leading minus
 * sign. Getting that sign wrong turns drag into thrust, which is precisely the
 * bug this file previously shipped and which the monotonic-velocity test guards.
 *
 * The leading 1/2 cancels with the standard drag-function definition of BC, in
 * which BC = m / (i * d^2) and the reference projodal's own frontal area is
 * already absorbed into the tabulated Cd. The form factor is 1.0 for a G1 BC
 * and 1.2 for a G7 BC, because the G7 reference projodal is a flatter, more
 * draggy shape than G1.
 *
 * The air-relative velocity is the whole mechanism of wind drift: the bullet
 * is not pushed sideways by the wind, it is carried by the moving air mass it
 * is flying through.
 */
function accelerations(
    s: State,
    r: ResolvedEnvironment,
    table: readonly (readonly [number, number])[],
    formFactor: number,
    bcLbPerIn2: number,
): { du: number; dv: number; dw: number } {
    const relU = s.u - r.windX;
    const relV = s.v;
    const relW = s.w - r.windZ;
    const speed = Math.sqrt(relU * relU + relV * relV + relW * relW);

    if (speed < 1e-9) {
        return { du: 0, dv: -r.gravity * r.cosIncline, dw: 0 };
    }

    const mach = speed / r.speedOfSound;
    const cd = dragCoefficient(table, mach);

    // The retardation coefficient. Derivation:
    //   F = (1/2) rho v^2 Cd A     with A = pi d^2 / 4, the frontal area
    //   a = F / m
    // A drag-function BC is defined against a REFERENCE projectile shape, so
    //   BC = sectionalDensity / i        i.e.   i = SD / BC
    // and the reference Cd is scaled by the bullet's own form factor:
    //   Cd_actual = i * Cd_reference
    // Substituting, the form factor CANCELS:
    //   a = (1/2) rho v^2 (i Cd_ref) (pi d^2 / 4) / m
    //     = (pi/8) rho v^2 Cd_ref * (i / SD)
    //     = (pi/8) rho v^2 Cd_ref / BC
    //
    // SO THE ANSWER IS (pi/8) * rho * v^2 * Cd / BC, with NO form factor in the
    // denominator. Dividing by a form factor as well double-counts it: the
    // published BC already has the bullet's shape folded into it. That mistake
    // made this solver under-drag by roughly 1.8x on the standard reference
    // bullet.
    //
    // The 1/2 and the pi/4 COMBINE into pi/8. Writing it as
    // rho v^2 Cd / (2 * BC) omits the pi/4 entirely and overstates drag by
    // exactly 4/pi = 1.2732 - which is what this solver did in its first
    // version, until the reference table caught it. Do not "simplify" the
    // constant away.
    const dragAccel = (DRAG_COEFFICIENT_PI_OVER_8 * r.rho * speed * speed * cd) / bcLbPerIn2;
    const k = -dragAccel / speed;

    return {
        du: k * relU,
        dv: k * relV - r.gravity * r.cosIncline,
        dw: k * relW,
    };
}

/** One classical RK4 step. Mutates `s` in place. */
function rk4Step(
    s: State,
    r: ResolvedEnvironment,
    table: readonly (readonly [number, number])[],
    formFactor: number,
    bcLbPerIn2: number,
    dt: number,
): void {
    const u0 = s.u;
    const v0 = s.v;
    const w0 = s.w;
    const half = dt / 2;

    const a1 = accelerations(s, r, table, formFactor, bcLbPerIn2);
    const m1: State = { x: 0, y: 0, z: 0, u: u0 + a1.du * half, v: v0 + a1.dv * half, w: w0 + a1.dw * half, t: 0 };
    const a2 = accelerations(m1, r, table, formFactor, bcLbPerIn2);

    const m2: State = { x: 0, y: 0, z: 0, u: u0 + a2.du * half, v: v0 + a2.dv * half, w: w0 + a2.dw * half, t: 0 };
    const a3 = accelerations(m2, r, table, formFactor, bcLbPerIn2);

    const e: State = { x: 0, y: 0, z: 0, u: u0 + a3.du * dt, v: v0 + a3.dv * dt, w: w0 + a3.dw * dt, t: 0 };
    const a4 = accelerations(e, r, table, formFactor, bcLbPerIn2);

    // Position advances with the same RK4 weights applied to the velocity
    // stages, NOT with the raw endpoint velocity. Using the endpoint alone
    // drops position to second order and was the second source of error in the
    // old solver.
    const k1u = u0, k1v = v0, k1w = w0;
    const k2u = u0 + a1.du * half, k2v = v0 + a1.dv * half, k2w = w0 + a1.dw * half;
    const k3u = u0 + a2.du * half, k3v = v0 + a2.dv * half, k3w = w0 + a2.dw * half;
    const k4u = u0 + a3.du * dt, k4v = v0 + a3.dv * dt, k4w = w0 + a3.dw * dt;

    s.u = u0 + (dt / 6) * (a1.du + 2 * a2.du + 2 * a3.du + a4.du);
    s.v = v0 + (dt / 6) * (a1.dv + 2 * a2.dv + 2 * a3.dv + a4.dv);
    s.w = w0 + (dt / 6) * (a1.dw + 2 * a2.dw + 2 * a3.dw + a4.dw);

    s.x += (dt / 6) * (k1u + 2 * k2u + 2 * k3u + k4u);
    s.y += (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    s.z += (dt / 6) * (k1w + 2 * k2w + 2 * k3w + k4w);
    s.t += dt;
}

/**
 * Validate a request before integrating.
 *
 * Messages are written for a shooter rather than a developer, because these
 * surface in a UI.
 */
function validate(req: SolveRequest): void {
    const positive = (v: number, name: string): void => {
        if (!Number.isFinite(v) || v <= 0) {
            throw new InvalidSolveRequest(`${name} must be a positive number.`);
        }
    };
    positive(req.muzzleVelocityFps, 'Muzzle velocity (fps)');
    positive(req.bulletWeightGr, 'Bullet weight (grains)');
    positive(req.bulletDiameterIn, 'Bullet diameter (inches)');
    positive(req.bcG1, 'G1 ballistic coefficient');
    if (req.bcG7 !== null && req.bcG7 !== undefined) {
        positive(req.bcG7, 'G7 ballistic coefficient');
    }
    positive(req.zeroYd, 'Zero distance (yards)');
    positive(req.maxRangeYd, 'Maximum range (yards)');

    if (req.zeroYd > req.maxRangeYd) {
        throw new InvalidSolveRequest('Zero distance cannot be beyond the range being solved.');
    }
    if (!Number.isFinite(req.environment?.tempF)) {
        throw new InvalidSolveRequest(
            'Ambient temperature is required. The solver will not assume sea-level conditions for you.',
        );
    }
}

/** One raw integrator sample, before the zero offset is applied. */
interface RawSample {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly u: number;
    readonly t: number;
}

/**
 * Solve a trajectory and return a firing table.
 *
 * The zero is applied as a rigid offset so that the reported drop is measured
 * from the line of sight the shooter is actually using, not from the bore.
 *
 * @example
 * .308 Win, 168 gr Federal Gold Medal Match, 2650 fps, 100 yd zero, ISA sea level
 * ```ts
 * const sol = solveTrajectory({
 *   muzzleVelocityFps: 2650,
 *   bulletWeightGr: 168,
 *   bulletDiameterIn: 0.308,
 *   bcG1: 0.462,
 *   dragModel: 'G1',
 *   zeroYd: 100,
 *   zeroMoa: 0,
 *   maxRangeYd: 1000,
 *   stepYd: 100,
 *   environment: { tempF: 59, densityRatio: 1 },
 * });
 * const at1000 = sol.points[sol.points.length - 1]!;
 * // at1000.dropIn   ~ -341 inches
 * // at1000.velocityFps ~ 1394 fps
 * ```
 */
export function solveTrajectory(req: SolveRequest): Solution {
    validate(req);

    const stepYd = req.stepYd ?? 25;
    if (!Number.isFinite(stepYd) || stepYd <= 0) {
        throw new InvalidSolveRequest('Output step must be a positive number of yards.');
    }

    // Which drag function, and therefore which BC. G7 is preferred whenever a G7
    // BC is supplied, because the G7 projodal better represents a modern,
    // high-BC rifle bullet than G1 does.
    const useG7 = req.dragModel === 'G7' || (req.dragModel === undefined && req.bcG7 !== null && req.bcG7 !== undefined);
    const table = useG7 ? G7_DRAG_TABLE : G1_DRAG_TABLE;
    const bc = useG7 ? (req.bcG7 as number) : req.bcG1;
    const dragModelUsed: DragModel = useG7 ? 'G7' : 'G1';

    // Form factor, DERIVED PER BULLET rather than fixed per drag model.
    //
    // A drag-function BC is defined as BC = CF * m / d^2, so the form factor of
    // a specific bullet against a specific reference shape is
    //
    //     i = (m / d^2) / BC = sectionalDensity / BC
    //
    // It is a property of THE BULLET, not of the drag model. Using the model's
    // nominal value instead was a second, independent error, and it only
    // surfaced once the drag tables were corrected.
    //
    // Why it matters numerically, for the standard 168gr .308 at 0.308 in:
    //
    //     sectional density = (168/7000) / 0.308^2 = 0.2532 lb/in^2
    //     G1: i = 0.2532 / 0.462  = 0.548   <- bullet is AERODYNAMICALLY SLIPPER
    //                                           than the blunt G1 reference, so it
    //                                           loses LESS drag than G1 nominal
    //     G7: i = 0.2532 / 0.2757 = 0.918   <- close to 1.0, as expected for a
    //                                           bullet that closely matches G7
    //
    // Forcing i = 1.0 under G1 overstated drag by roughly 1.8x, which is why the
    // reference case lost 800 fps in the first 100 yards. Note the sign is not
    // subtle: a bullet whose quoted G1 BC exceeds its sectional density has
    // i < 1 BY CONSTRUCTION, and that is normal for high-BC match bullets.
    //
    // The nominal per-model values (G1_FORM_FACTOR = 1, G7_FORM_FACTOR = 1.2)
    // describe the reference projectiles themselves and are correct as such.
    // They are the WRONG numbers to apply to a real bullet. See
    // docs/BALLISTICS-AUDIT.md.
    const sectionalDensity = req.bulletWeightGr / GRAINS_PER_POUND.value / (req.bulletDiameterIn * req.bulletDiameterIn);
    const formFactor = sectionalDensity / bc;

    const r = resolveEnvironment(req.environment);
    const cautions: string[] = [];

    if (useG7 && req.dragModel === undefined) {
        cautions.push('Solved against the G7 drag table because a G7 coefficient was supplied.');
    }
    if (req.dragModel === 'G1' && req.bcG7 !== null && req.bcG7 !== undefined) {
        cautions.push(
            'Solved against G1 even though a G7 coefficient was available. G7 usually fits a ' +
            'modern high-BC bullet better - re-solve with the G7 model to compare.',
        );
    }
    if (req.environment.densityRatio === undefined) {
        cautions.push(
            req.environment.barometricPressureInHg !== undefined
                ? 'Density derived from observed barometric pressure.'
                : `Density derived from the standard atmosphere at ${req.environment.altitudeFt ?? 0} ft. ` +
                  'Enter a measured barometric pressure if conditions are unusual.',
        );
    }
    if (req.environment.relativeHumidityPct === undefined) {
        cautions.push('Humidity was not supplied, so the dry-air speed of sound was used.');
    }
    if ((req.environment.windSpeedMph ?? 0) > 0 && req.environment.windDirectionDeg === undefined) {
        cautions.push('Wind speed was given without a direction, so no wind drift was applied.');
    }
    if (req.maxRangeYd > 2000) {
        cautions.push(
            'Beyond 2000 yd, earth curvature, coriolis and yaw matter and this point-mass model ' +
            'does not include them. Treat the far end of this table as optimistic.',
        );
    }

    // Mass and diameter are carried by BC and the tabulated Cd respectively, so
    // they do not appear in the integration. They are still validated above.
    void req.bulletWeightGr;
    void req.bulletDiameterIn;
    void GRAINS_PER_POUND.value;

    const muzzleVelocityFps = req.muzzleVelocityFps;
    // Unit conversions come from module scope (see the unwrapped aliases above).
    const sampleStepFt = stepYd * YD_TO_FT;

    // -----------------------------------------------------------------------
    // PASS 1: find the bore angle
    // -----------------------------------------------------------------------
    //
    // A zeroed rifle does not fire horizontally. The shooter raised the bore until
    // the bullet crossed the line of sight at the zero distance, so the bullet is
    // LAUNCHED along an inclined line and the hold is the fall BELOW that line.
    //
    // The bore angle is therefore not an input. It is whatever angle makes the
    // bullet return to the muzzle's height at `zeroYd`. Integrating once from a
    // horizontal launch gives the fall, and the required angle follows from it:
    //
    //     tan(bore) = -fall_at_zero / zero_distance
    //
    // (negative because the solver integrates y downward, so a rise is a positive
    // slope against a negative fall).
    //
    // Integrating twice is not an optimisation to avoid. A first pass fired
    // horizontally and a second pass fired along the bore give the same ANSWER for
    // the hold, because gravity and drag both act on the air-relative velocity and
    // a constant launch angle simply subtracts a straight line. Doing it this way
    // keeps the reported trajectory physical, so a shooter reading velocity and
    // time of flight sees what their round actually does.

    const integrateTo = (targetFt: number, launchSlope: number, collect: boolean): RawSample[] => {
        const s: State = {
            x: 0,
            y: 0,
            z: 0,
            u: muzzleVelocityFps * Math.sqrt(1 - launchSlope * launchSlope),
            v: muzzleVelocityFps * launchSlope,
            w: 0,
            t: 0,
        };
        const out: RawSample[] = [];
        let prevX = 0;
        let prevY = 0;
        let prevZ = 0;
        let nextSampleX = collect ? sampleStepFt : targetFt;
        let n = 0;
        while (s.x < targetFt) {
            rk4Step(s, r, table, formFactor, bc, DT_SECONDS);
            if (++n > MAX_STEPS) {
                throw new InvalidSolveRequest('Integration failed to reach the requested range.');
            }
            if (s.x >= nextSampleX) {
                const frac = (nextSampleX - prevX) / (s.x - prevX || 1);
                out.push({
                    x: nextSampleX,
                    y: prevY + frac * (s.y - prevY),
                    z: prevZ + frac * (s.z - prevZ),
                    u: s.u,
                    t: s.t,
                });
                nextSampleX += sampleStepFt;
                prevX = s.x;
                prevY = s.y;
                prevZ = s.z;
            }
        }
        return out;
    };

    // Pass 1: integrate a horizontal launch to the zero distance to find the
    // bore angle.
    const zeroXft = req.zeroYd * YD_TO_FT;
    const probe = integrateTo(zeroXft, 0, false);
    const fallAtZero = probe[probe.length - 1]!.y;
    const boreSlope = -fallAtZero / zeroXft;

    // Pass 2: integrate along the bore, sampling the output grid.
    const maxRangeFt = req.maxRangeYd * YD_TO_FT;
    const raw = integrateTo(maxRangeFt, boreSlope, true);

    if (raw.length === 0) {
        throw new InvalidSolveRequest('Requested range is too short to produce a sample.');
    }

    // -----------------------------------------------------------------------
    // THE LINE OF SIGHT AND THE REPORTED DROP
    // -----------------------------------------------------------------------
    //
    // The bullet was launched along the bore, so the line of sight is that same
    // line. The drop is therefore the fall below it, which is already correct at
    // the zero distance by construction.
    //
    // The scope may sit zeroMoa above the bore, which is an ANGLE and so adds to
    // the slope rather than as a constant height.
    const scopeSlope =
        req.zeroMoa / (IN * MOA_INCHES_AT_100YD_YARDS * YD_TO_FT);

    // NOTE: the line of sight IS the bore line, so it is not subtracted again
    // below. Only the scope offset, which sits above the bore, is.

    const points: SolutionPoint[] = raw.map((sm) => {
        const rangeYd = sm.x * YARDS_PER_FOOT;
        // Drop below the line of sight. Because the bullet was launched along
        // the bore, subtracting the bore line recovers the fall below the aim
        // point, which is exactly the hold the shooter must apply.
        // The zero is already encoded in the launch angle: pass 1 measured the
        // fall at the zero distance and pass 2 launched along the slope that
        // cancels it there. The trajectory height is therefore already measured
        // from the line of sight, and is zero at the zero distance by
        // construction. Subtracting a line again would remove the aim point a
        // second time, which is what made a 1000 yd zero report a 400 in hold.
        //
        // The scope offset is the one exception: it raises the line of sight
        // above the bore, so it must be subtracted here.
        const dropFt = sm.y - scopeSlope * sm.x;
        // (rangeYd / 100) inches.
        const moaAtRange = rangeYd / MOA_INCHES_AT_100YD_YARDS;
        const elevationMoa = (dropFt * IN) / moaAtRange;
        const windageMoa = (sm.z * IN) / moaAtRange;
        return {
            rangeYd,
            dropIn: dropFt * IN,
            windageIn: sm.z * IN,
            elevationMoa,
            windageMoa,
            // The reported velocity is the DOWNRANGE component, which is the
            // quantity a chronograph measures and the one the reference tables
            // publish.
            velocityFps: sm.u,
            timeS: sm.t,
        };
    });

    const furthest = points[points.length - 1]!;

    return {
        points,
        densityRatioUsed: r.densityRatio,
        dragModelUsed,
        formFactor,
        // Hold the elevation needed to make the furthest point land on the
        // zero. Positive means hold high.
        holdToZeroMoa: furthest.elevationMoa,
        cautions,
    };
}
