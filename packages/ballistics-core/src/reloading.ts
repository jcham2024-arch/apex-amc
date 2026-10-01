/**
 * Reloading-domain calculations.
 *
 * Safety-critical. Everything that produces a charge weight or a velocity
 * estimate lives here so it can be unit-tested against published manual
 * values, and so the website and the field app cannot drift apart.
 */
import { SCALING_EXPONENT_ESTIMATED } from './provenance/constants.ts';

/** Burn-rate class, which selects the barrel-scaling exponent. */
export type BurnRateClass =
  | 'pistol'
  | 'rifle_medium'
  | 'rifle_slow'
  | 'shotgun';

/**
 * Homann/Fraser expansion exponent `n`, by powder burn class.
 *
 * These are midpoints of the ranges conventionally cited for each class:
 *   pistol        n ~ 0.12-0.18
 *   rifle_medium  n ~ 0.20-0.26
 *   rifle_slow    n ~ 0.28-0.35
 *   shotgun       n ~ 0.12-0.18
 *
 * Velocity scales with barrel length as a power law; slower powders gain
 * more from added length because they are still burning at the muzzle.
 */
/**
 * The scaling exponent by burn class, imported from the provenance module so
 * that the tier (`estimated`) and the reasoning travel with the value. This is
 * a CONVENTION, not a published constant, and a UI should say so when it
 * scales a velocity for a different barrel length.
 */
export const SCALING_EXPONENT: Readonly<Record<BurnRateClass, number>> =
  SCALING_EXPONENT_ESTIMATED.value;

/** A load transcribed from a published manual. */
export interface PublishedRecipe {
  readonly cartridge: string;
  readonly bullet: string;
  readonly powder: string;
  /** Barrel length the published velocity was measured in, inches. */
  readonly testBarrelLengthIn: number;
  /** Overall cartridge length the manual specified, inches. */
  readonly publishedCoalIn: number;
  readonly minChargeGrains: number;
  readonly minVelocityFps: number;
  readonly maxChargeGrains: number;
  readonly maxVelocityFps: number;
  readonly burnRateClass: BurnRateClass;
  /** Attribution. Load data must never exist without this. */
  readonly sourceName: string;
  readonly sourceEdition?: string;
}

export interface LadderInputs {
  /** The shooter's actual barrel length, inches. */
  readonly userBarrelLengthIn: number;
  /** The shooter's intended overall cartridge length, inches. */
  readonly userTargetCoalIn?: number;
  /** Number of work-up steps, 3-10. */
  readonly stepsCount?: number;
}

export interface LadderStep {
  readonly step: number;
  readonly chargeGrains: number;
  readonly estimatedFps: number;
  readonly isMax: boolean;
  /** True when the shooter should chronograph before proceeding. */
  readonly isStartBelowMinimum: boolean;
}

export interface LadderResult {
  readonly cartridge: string;
  readonly bullet: string;
  readonly powder: string;
  readonly publishedCoalIn: number;
  readonly targetCoalIn: number;
  readonly testBarrelLengthIn: number;
  readonly userBarrelLengthIn: number;
  readonly scalingFactor: number;
  /** Present when the shooter is seating deeper than published. */
  readonly coalWarning: string | null;
  readonly ladder: readonly LadderStep[];
}

/**
 * Scale a published muzzle velocity from the test barrel to the user's.
 *
 * V_target = V_test * (L_target / L_test) ^ n
 *
 * Returns 1 for a same-length barrel, so it is safe to call unconditionally.
 */
export function scaleVelocity(
  publishedFps: number,
  testBarrelLengthIn: number,
  userBarrelLengthIn: number,
  burnRateClass: BurnRateClass,
): number {
  if (!(testBarrelLengthIn > 0) || !(userBarrelLengthIn > 0)) {
    throw new RangeError('Barrel lengths must be positive.');
  }
  const n = SCALING_EXPONENT[burnRateClass];
  const factor = Math.pow(userBarrelLengthIn / testBarrelLengthIn, n);
  return publishedFps * factor;
}

/**
 * Generate a work-up ladder scaled to the shooter's barrel.
 *
 * SAFETY: the returned charges are linear interpolations between published
 * minimum and maximum. That is not a load recommendation â€” it is a path
 * for the shooter to chronograph their way up. The UI must say so.
 */
export function buildLadder(
  recipe: PublishedRecipe,
  inputs: LadderInputs,
): LadderResult {
  const steps = inputs.stepsCount ?? 5;
  if (steps < 3 || steps > 10) {
    throw new RangeError('stepsCount must be between 3 and 10.');
  }

  const targetCoal = inputs.userTargetCoalIn ?? recipe.publishedCoalIn;
  const factor =
    Math.pow(inputs.userBarrelLengthIn / recipe.testBarrelLengthIn,
      SCALING_EXPONENT[recipe.burnRateClass]);

  // Seating deeper than published shrinks case volume and raises peak
  // pressure sharply. This is a genuine safety condition, so it is surfaced
  // rather than silently applied.
  let coalWarning: string | null = null;
  if (targetCoal < recipe.publishedCoalIn) {
    const diff = (recipe.publishedCoalIn - targetCoal).toFixed(3);
    coalWarning =
      `Target COAL is ${diff}" shorter than the published ${recipe.publishedCoalIn.toFixed(3)}". ` +
      'Seating deeper decreases case volume and raises peak pressure sharply. ' +
      'Start below the published minimum charge.';
  }

  const chargeStep =
    (recipe.maxChargeGrains - recipe.minChargeGrains) / (steps - 1);
  const minFps = recipe.minVelocityFps * factor;
  const maxFps = recipe.maxVelocityFps * factor;
  const fpsStep = (maxFps - minFps) / (steps - 1);

  const ladder: LadderStep[] = [];
  for (let i = 0; i < steps; i++) {
    const isFirst = i === 0;
    ladder.push({
      step: i + 1,
      chargeGrains: Number((recipe.minChargeGrains + chargeStep * i).toFixed(2)),
      estimatedFps: Math.round(minFps + fpsStep * i),
      isMax: i === steps - 1,
      isStartBelowMinimum: isFirst && coalWarning !== null,
    });
  }

  return {
    cartridge: recipe.cartridge,
    bullet: recipe.bullet,
    powder: recipe.powder,
    publishedCoalIn: recipe.publishedCoalIn,
    targetCoalIn: targetCoal,
    testBarrelLengthIn: recipe.testBarrelLengthIn,
    userBarrelLengthIn: inputs.userBarrelLengthIn,
    scalingFactor: factor,
    coalWarning,
    ladder,
  };
}
