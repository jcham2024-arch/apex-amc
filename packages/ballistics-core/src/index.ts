/**
 * @apex/ballistics-core
 *
 * Pure, framework-free ballistics and reloading logic, shared by the website
 * and the field app. No React, no storage, no DOM â€” everything here is
 * directly unit-testable.
 *
 * Safety note: `reloading.ts` produces charge weights. Its output is a
 * work-up path for the shooter to chronograph, never a load recommendation.
 * See docs/BALLISTICS-AUDIT.md for the provenance of every formula here.
 */

export * from './atmosphere.ts';
export * from './dispersion.ts';
export * from './reloading.ts';

// Provenance: how every constant in this package declares its authority.
export * from './provenance/Source.ts';
export * from './provenance/constants.ts';

// Domain value objects.
export * from './domain/BallisticProfile.ts';

// Exterior ballistics.
// documents the governing equation, the three failure modes it guards against,
// and the conventions it uses. See docs/BALLISTICS-AUDIT.md for the full record
// of what was wrong and how it was found.
export * from './drag/dragTables.ts';
export * from './drag/solver.ts';
