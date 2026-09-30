/**
 * Ballistic profile value objects.
 *
 * These are immutable classes with validating constructors rather than bare
 * interfaces, so an invalid profile cannot exist. A `BallisticProfile` is
 * built from sourced values (see `provenance/`), which is what stops magic
 * numbers leaking in from the UI.
 *
 * OOP here is load-bearing: it gives us construction-time validation, named
 * factories for the common ways a profile is built, and a single place to
 * enforce the invariants that keep the maths honest.
 */
import { isPublished } from '../provenance/Source.ts';
import type { Sourced } from '../provenance/Source.ts';
import { GRAINS_PER_POUND } from '../provenance/constants.ts';

/** Thrown when a value object is constructed out of range. */
export class InvalidBallisticProfile extends Error {
  override readonly name = 'InvalidBallisticProfile';
}

/**
 * The physical description of a bullet in flight.
 *
 * Construct through {@link BallisticProfile.of} or {@link BallisticProfile.from},
 * never with `new`, so validation is always applied.
 */
export class BallisticProfile {
  /** Muzzle velocity, fps. */
  readonly muzzleVelocityFps: number;
  /** Bullet weight, grains. */
  readonly bulletWeightGr: number;
  /** Diameter, inches. */
  readonly diameterIn: number;
  /** G1 drag coefficient. */
  readonly bcG1: number;
  /** G7 drag coefficient, if known directly. */
  readonly bcG7: number | null;
  /** Air density ratio (sigma). 1.0 = standard sea level, ISA. */
  readonly densityRatio: number;
  /** Provenance of the ballistic coefficients. */
  readonly bcSource: Sourced<{ g1: number; g7: number | null }>;

  // Explicit fields rather than TypeScript parameter properties: this package
  // runs under Node's type-stripping loader, which rejects that syntax.
  constructor(
    muzzleVelocityFps: number,
    bulletWeightGr: number,
    diameterIn: number,
    bcG1: number,
    bcG7: number | null,
    densityRatio: number,
    bcSource: Sourced<{ g1: number; g7: number | null }>,
  ) {
    this.muzzleVelocityFps = muzzleVelocityFps;
    this.bulletWeightGr = bulletWeightGr;
    this.diameterIn = diameterIn;
    this.bcG1 = bcG1;
    this.bcG7 = bcG7;
    this.densityRatio = densityRatio;
    this.bcSource = bcSource;

    if (muzzleVelocityFps <= 0) {
      throw new InvalidBallisticProfile('Muzzle velocity must be positive.');
    }
    if (bulletWeightGr <= 0) {
      throw new InvalidBallisticProfile('Bullet weight must be positive.');
    }
    if (diameterIn <= 0) {
      throw new InvalidBallisticProfile('Bullet diameter must be positive.');
    }
    if (bcG1 <= 0) {
      throw new InvalidBallisticProfile('Ballistic coefficient must be positive.');
    }
    if (densityRatio <= 0) {
      throw new InvalidBallisticProfile('Air density ratio must be positive.');
    }
  }

  /**
   * Build from explicit numbers plus a BC provenance record. This is the
   * general entry point; prefer it over `new`.
   */
  static of(args: {
    muzzleVelocityFps: number;
    bulletWeightGr: number;
    diameterIn: number;
    bc: Sourced<{ g1: number; g7?: number | null }>;
    densityRatio?: number;
  }): BallisticProfile {
    const g7 = args.bc.value.g7 ?? null;
    if (g7 !== null && g7 <= 0) {
      throw new InvalidBallisticProfile('G7 coefficient must be positive when supplied.');
    }
    return new BallisticProfile(
      args.muzzleVelocityFps,
      args.bulletWeightGr,
      args.diameterIn,
      args.bc.value.g1,
      g7,
      args.densityRatio ?? 1,
      {
        value: { g1: args.bc.value.g1, g7 },
        source: args.bc.source,
        confidence: args.bc.confidence,
        ...(args.bc.method !== undefined ? { method: args.bc.method } : {}),
        ...(args.bc.reasoning !== undefined ? { reasoning: args.bc.reasoning } : {}),
        ...(args.bc.units !== undefined ? { units: args.bc.units } : {}),
      } satisfies Sourced<{ g1: number; g7: number | null }>,
    );
  }

  /** True when the BC came from a published table rather than an estimate. */
  get hasPublishedBallisticCoefficient(): boolean {
    return isPublished(this.bcSource);
  }

  /** Cross-sectional area, in^2. Area = pi * (d/2)^2. */
  get frontalAreaIn2(): number {
    return Math.PI * Math.pow(this.diameterIn / 2, 2);
  }

  /**
   * Sectional density, lb/in^2. SD = (weight / grains-per-pound) / area.
   * Sectional density is a standard published bullet metric; see the
   * bullet-manufacturer data sheets for the values themselves.
   */
  get sectionalDensity(): number {
    return this.bulletWeightGr / GRAINS_PER_POUND.value / this.frontalAreaIn2;
  }
}
