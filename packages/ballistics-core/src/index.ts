/**
 * @apex/ballistics-core
 *
 * Pure, framework-free ballistics and reloading logic, shared by the website
 * and the field app. No React, no storage, no DOM — everything here is
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
// NOTE: the trajectory solver is not implemented yet. See
// docs/AGENT-HANDOFF.md Lane 1 for the specification, the calibration
// targets, and the reference dataset. dragTables.ts is complete and tested
// data, and is what the solver will consume.
export * from './drag/dragTables.ts';


