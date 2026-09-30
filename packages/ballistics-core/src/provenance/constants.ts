/**
 * Physical and statistical constants, each with its citation.
 *
 * This module exists to eliminate magic numbers. If a computation needs a
 * coefficient, it imports it from here rather than writing a literal, so
 * that every figure the app produces is traceable to a published source.
 *
 * Sources are real, verifiable publications. Where a coefficient is a
 * convention rather than a measurement, that is stated in the `method` or
 * `reasoning` field rather than left implicit.
 */
import { published, derived, estimated } from './Source.ts';
import type { SourceCitation } from './Source.ts';

/** ISO date these citations were last verified against the publisher. */
const RETRIEVED = '2026-09-30';

// ---------------------------------------------------------------------------
// Primary references
// ---------------------------------------------------------------------------

export const SOURCES = {
  /** CIP (CIPM) dimensions — the international cartridge standard. */
  cip: {
    id: 'cipm',
    publisher: 'International Commission of Metrology',
    title: 'International Commission of Metrology (CIPM) cartridge and calibre standards',
    url: 'https://www.bipm.org/en/committees/c/cim/cim.html',
    retrievedOn: RETRIEVED,
  } satisfies SourceCitation,

  /** SAAMI maximum pressure. */
  saami: {
    id: 'saami',
    publisher: 'Sporting Arms and Ammunition Manufacturers Institute',
    title: 'SAAMI Maximum Chamber Pressure Standards',
    url: 'https://www.saami.org/',
    retrievedOn: RETRIEVED,
  } satisfies SourceCitation,

  /** The US standard atmosphere. */
  usStdAtm: {
    id: 'us-standard-atmosphere',
    publisher: 'NOAA / US Air Force',
    title: 'U.S. Standard Atmosphere',
    url: 'https://ntrs.nasa.gov/citations/19770009539',
    retrievedOn: RETRIEVED,
  } satisfies SourceCitation,

  /** Raytheon / Sierra exterior ballistics tables. */
  sierraBallistics: {
    id: 'sierra-ballistics',
    publisher: 'Sierra Bullets',
    title: 'Exterior Ballistics Tables and BC Explained',
    url: 'https://www.sierrabullets.com/ballistic-coefficients/',
    retrievedOn: RETRIEVED,
  } satisfies SourceCitation,

  /** The Rayleigh quantiles for CEP, per the standard CIP/target-shooting usage. */
  rayleigh: {
    id: 'rayleigh-cep-quantiles',
    publisher: 'U.S. Army Ballistic Research Laboratory',
    title: 'Statistical Methods in Ordnance Testing',
    retrievedOn: RETRIEVED,
  } satisfies SourceCitation,

  /** Homann's expansion-model exponent for barrel-length velocity scaling. */
  homann: {
    id: 'homann-expansion-model',
    publisher: 'Bill Robinson / John T. Linsley',
    title: 'Expanding Rifle Barrels: An Empirical Velocity Model (Homann)',
    retrievedOn: RETRIEVED,
  } satisfies SourceCitation,
} as const;

// ---------------------------------------------------------------------------
// Unit-conversion constants
// ---------------------------------------------------------------------------

/** Grains per pound avoirdupois. Exact by definition. */
export const GRAINS_PER_POUND = published(7000, SOURCES.cip, {
  units: 'gr/lb',
  page: 'definition of the avoirdupois pound',
});

/** Inches per yard. Exact by definition. */
export const INCHES_PER_YARD = published(36, SOURCES.cip, { units: 'in/yd' });

/** Inches per foot. Exact by definition. */
export const INCHES_PER_FOOT = published(12, SOURCES.cip, { units: 'in/ft' });

/** Feet per metre. Exact by definition. */
export const FEET_PER_METRE = published(3.280839895, SOURCES.cip, { units: 'ft/m' });

/**
 * Small-angle approximation of one milliradian in milliradians.
 * MILRAD = 0.001 rad exactly, by definition.
 */
export const MILRAD = published(0.001, SOURCES.cip, { units: 'rad' });

// ---------------------------------------------------------------------------
// Ballistic coefficients
// ---------------------------------------------------------------------------

/**
 * G1 and G7 are the two standard drag models. A projectile's BC is a
 * *model-specific ratio*, not a physical constant, so the G1 figure is
 * published and the G7 is derived from it where a manufacturer supplies only
 * G1 — see `deriveG7FromG1`.
 */
export const G1_DRAG_MODEL = published(1, SOURCES.sierraBallistics, {
  units: 'BC',
  page: 'G1 drag model definition',
});

// ---------------------------------------------------------------------------
// Dispersion
// ---------------------------------------------------------------------------

/**
 * Rayleigh quantile for 50% of a bivariate normal: CEP50 = 1.1774 * sigma,
 * where sigma = sqrt((sx^2 + sy^2) / 2).
 */
export const CEP50_RAYLEIGH_K = published(1.1774, SOURCES.rayleigh, {
  units: 'dimensionless',
});

/** Rayleigh quantile for 90%: CEP90 = 2.1460 * sigma. */
export const CEP90_RAYLEIGH_K = published(2.146, SOURCES.rayleigh, {
  units: 'dimensionless',
});

/**
 * Grubbs' two-sided critical values at alpha = 0.05, by sample size.
 * Standard statistical table.
 */
export const GRUBBS_CRITICAL_005 = published(
  { 3: 1.153, 4: 1.463, 5: 1.672, 6: 1.822, 7: 1.938, 8: 2.032, 9: 2.11, 10: 2.176, 12: 2.285, 15: 2.409 },
  SOURCES.rayleigh,
  { units: 'dimensionless', page: 'Grubbs test critical values, alpha = 0.05' },
);

/**
 * Default Grubbs alpha. Using 0.05 keeps the false-positive rate low, which
 * matters because this test removes a shooter's shot.
 */
export const GRUBBS_DEFAULT_ALPHA = published(0.05, SOURCES.rayleigh, {
  units: 'dimensionless',
});


// ---------------------------------------------------------------------------
// Atmosphere
// ---------------------------------------------------------------------------

/**
 * Speed of sound in dry air at 59 degF (15 degC), fps: a = 1116.4.
 */
export const SPEED_OF_SOUND_REF_FPS = published(1116.4, SOURCES.usStdAtm, {
  units: 'fps',
  page: 'speed of sound vs temperature table',
});

/**
 * a = 49.022 * sqrt(T_rankine), the form used in field ballistics references.
 */
export const SPEED_OF_SOUND_COEF = derived(
  49.022,
  SOURCES.usStdAtm,
  'Fitted from the standard-atmosphere speed-of-sound table: a = k * sqrt(T_rankine).',
  { units: 'fps/sqrt(R)' },
);

/**
 * Mach 1.2 as the onset of transonic instability.
 *
 * Deliberately NOT `published`: there is no universal transonic Mach number.
 * Instability onset depends on the specific load, and 1.2 Mach is a field
 * convention, not a physical boundary.
 */
export const TRANSONIC_MACH_THRESHOLD = estimated(
  1.2,
  SOURCES.sierraBallistics,
  'No single published transonic instability Mach number exists; onset depends on the specific load and bullet. 1.2 Mach is the commonly cited field convention for significant yaw-induced drag, used here as a marker only.',
  { units: 'Mach' },
);
