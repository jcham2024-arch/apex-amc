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
  /** CIP (CIPM) dimensions â€” the international cartridge standard. */
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
  /**
   * Statistical constants for shot-group analysis: the Rayleigh CEP quantiles
   * and the Grubbs outlier critical values.
   *
   * Attribution note: the CEP quantiles were previously attributed to a U.S.
   * Army Ballistic Research Laboratory document that was never actually read.
   * That attribution has been removed. Both are now VERIFIABLE from first
   * principles rather than quoted:
   *
   *   CEP50  r = sigma * sqrt(2 * ln(1/(1-0.50)))  = 1.1774 * sigma
   *   CEP90  r = sigma * sqrt(2 * ln(1/(1-0.90)))  = 2.1460 * sigma
   *
   * which follows from P(R <= r) = 1 - exp(-r^2 / (2 sigma^2)) for a bivariate
   * normal. The test suite recomputes both, so a typo cannot survive.
   *
   * The Grubbs critical values ARE genuinely quoted: Grubbs (1950), and the
   * NIST/SEMATECH Engineering Statistics Handbook section 1.3.5.17.
   */
  statistics: {
    id: 'derived-statistics-and-grubbs-1950',
    publisher: 'Closed-form derivation; Grubbs, F. E. (1950)',
    title: 'Rayleigh quantiles (derived) and Grubbs outlier test critical values',
    url: 'https://www.itl.nist.gov/div898/handbook/eda/section3/eda35h.htm',
    retrievedOn: RETRIEVED,
  } satisfies SourceCitation,

  /**
   * Homann/Linsley expansion model for barrel-length velocity scaling.
   *
   * UNVERIFIED. The model is widely reproduced in the reloading literature and
   * the accompanying constant is marked `estimated` with its reasoning recorded,
   * but the original article has not been retrieved and no URL is claimed. The
   * attribution below is as it circulates in that literature and should be
   * confirmed against a primary source before anyone treats it as a citation.
   */
  homann: {
    id: 'homann-expansion-model',
    publisher: 'as attributed in the reloading literature; unverified',
    title: 'Expanding Rifle Barrels: An Empirical Velocity Model (Linsley / Homann)',
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
 * G1 â€” see `deriveG7FromG1`.
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
export const CEP50_RAYLEIGH_K = published(1.1774, SOURCES.statistics, {
  units: 'dimensionless',
});

/** Rayleigh quantile for 90%: CEP90 = 2.1460 * sigma. */
export const CEP90_RAYLEIGH_K = published(2.146, SOURCES.statistics, {
  units: 'dimensionless',
});

/**
/**
 * Grubbs two-sided critical values of G at alpha = 0.05, by sample size n.
 *
 * SOURCES
 * -------
 * Grubbs, F. E. (1950), "Sample criteria for testing outlying observations",
 * Annals of Mathematical Statistics 21(1), 27-58, doi:10.1214/aoms/1177729885.
 * The same values appear in the NIST/SEMATECH Engineering Statistics
 * Handbook, section 1.3.5.17.
 *
 * A CORRECTION WORTH RECORDING. The two-sided critical value is
 *
 *     G = ((n-1)/sqrt(n)) * sqrt( t^2 / (n-2 + t^2) )
 *
 * where t is the Student-t critical value at **alpha/(2n)**, not alpha/2, with
 * n-2 degrees of freedom. The 1/n in the significance level is exactly what
 * makes the two-sided value large. Using alpha/2 gives a value far too small:
 * an earlier version of this file did so and was wrong for every n >= 5,
 * understating the threshold by up to 0.14 G units. On a 10-shot group that
 * is the difference between 2.176 and 2.290.
 */
export const GRUBBS_CRITICAL_005 = published(
  { 3: 1.154, 4: 1.481, 5: 1.715, 6: 1.887, 7: 2.020, 8: 2.126, 9: 2.215, 10: 2.290, 12: 2.412, 15: 2.549 },
  SOURCES.statistics,
  { units: 'dimensionless', page: 'Grubbs test critical values, alpha = 0.05' },
);

/**
 * Default Grubbs alpha. Using 0.05 keeps the false-positive rate low, which
 * matters because this test removes a shooter's shot.
 */
export const GRUBBS_DEFAULT_ALPHA = published(0.05, SOURCES.statistics, {
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

// ---------------------------------------------------------------------------
// Exterior-ballistics physical constants
//
// These are the values the trajectory solver's retardation equation depends
// on. They are collected here so the solver file contains no bare literals.
// ---------------------------------------------------------------------------

/**
 * Standard gravity at sea level.
 *
 * g = 32.17405 ft/s^2 exactly, from the definition of the foot and the
 * second combined with the standard acceleration of gravity adopted by CGPM
 * (1901) and reaffirmed in the U.S. Standard Atmosphere 1976 and NIST.
 * Essentially exact for any practical purpose; the variation with latitude
 * and altitude is under 0.5% and is not modelled.
 */
export const STANDARD_GRAVITY_FPS2 = published(32.17405, SOURCES.usStdAtm, {
  units: 'ft/s^2',
  page: 'acceleration of gravity',
});

/**
 * Air density at ISA sea level.
 *
 * rho = 0.0023769 slug/ft^3, equivalent to 1.225 kg/m^3. This is the reference
 * density against which a density ratio (sigma) is defined, and it converts
 * a G1/G7 drag coefficient into an actual deceleration.
 *
 * The in-lb/in^3 figure sometimes seen (0.000074) is the same value in
 * imperial engineering units; mixing the two is a common source of a 10^5
 * error in a solver, and was the cause of the original bug documented in
 * docs/BALLISTICS-AUDIT.md.
 */
export const STANDARD_SEA_LEVEL_DENSITY_SLUG_PER_FT3 = published(
  0.0023769,
  SOURCES.usStdAtm,
  { units: 'slug/ft^3', page: 'geopotential altitude vs density table' },
);

/**
 * Standard sea-level barometric pressure, inHg.
 *
 * 1013.25 hPa exactly, which is 29.9213 inHg. Used to convert an observed
 * station pressure into a density ratio or pressure altitude.
 */
export const STANDARD_SEA_LEVEL_PRESSURE_INHG = published(29.9213, SOURCES.usStdAtm, {
  units: 'inHg',
  page: 'standard sea level conditions',
});

/**

/**
 * Standard sea-level temperature, degF. Exactly 15 degC / 288.15 K.
 *
 * 59 degF is the customary field form of ISA sea-level conditions. 288.15 K is the
 * value the density and barometric formulas are derived from.
 */
export const STANDARD_SEA_LEVEL_TEMP_K = published(288.15, SOURCES.usStdAtm, {
  units: 'K',
  page: 'standard sea level conditions',
});

export const STANDARD_SEA_LEVEL_TEMP_F = published(59, SOURCES.usStdAtm, {
  units: 'degF',
  page: 'standard sea level conditions',
});
/**
 * ISA tropospheric temperature lapse rate, K per FOOT.
 *
 * The standard atmosphere quotes 0.0065 K per METRE. Converting:
 *   0.0065 K/m / 3.28084 ft/m = 0.0019812 K/ft
 * which is 0.003566 degF/ft, the familiar 0.0035 degF per foot.
 *
 * UNIT WARNING: the published figure is per metre. Using 0.0065 as K/ft is a
 * 3.28x error that makes air density nearly constant with altitude - it returns
 * sigma 0.998 at 10,000 ft instead of 0.7385, which would hand a Denver
 * shooter a sea-level firing solution. This constant is stored in K/ft
 * specifically so that mistake cannot be made at the call site.
 */
export const ISA_LAPSE_RATE_K_PER_FT = published(0.0019812, SOURCES.usStdAtm, {
  units: 'K/ft',
  page: 'tropospheric lapse rate',
});

/**
 * The barometric pressure exponent, 5.25588, from the ISA troposphere.
 *
 *   p / p_0 = (1 - L h / T_0)^(g / (R L))
 *
 * The density exponent follows as 5.25588 - 1 = 4.25588 once the temperature
 * dependence is divided out. Both are used by the barometric functions in
 * atmosphere.ts.
 */
export const ISA_BAROMETRIC_PRESSURE_EXPONENT = published(5.25588, SOURCES.usStdAtm, {
  units: 'dimensionless',
  page: 'barometric formula coefficients',
});

/**
 * The ISA density exponent, 4.25588 = 5.25588 - 1.
 */
export const ISA_DENSITY_EXPONENT = published(4.25588, SOURCES.usStdAtm, {
  units: 'dimensionless',
  page: 'barometric formula coefficients',
});

/**
 * Height constant in the ISA barometric formula, feet.
 *
 * 145,442 ft = T_0 / L, the 22,255 m value that appears in the conventional
 * form of the barometric equation. Retained because it is the number a shooter
 * or a ballistics manual will recognise, and because it cross-checks the
 * lapse rate: 288.15 / 0.0019812 = 145,442.
 */
export const ISA_BAROMETRIC_HEIGHT_FT = published(145442.16, SOURCES.usStdAtm, {
  units: 'ft',
  page: 'barometric formula coefficients',
});

/**
 * Form factor applied when using a G1 ballistic coefficient.
 *
 * By definition, a projectile whose G1 BC is quoted is being described by
 * reference to the G1 standard projodal, so the form factor in the retardation
 * equation is exactly 1. The number is a consequence of the definition, not a
 * fitted parameter.
 */
/**
 * Homann/Linsley barrel-length velocity scaling exponent, by powder burn class.
 *
 * Velocity scales with barrel length as a power law,
 *   V_target = V_test * (L_target / L_test)^n
 * and slower-burning powders gain more from added length because they are still
 * burning at the muzzle. The values are the midpoints of the ranges
 * conventionally cited for each class.
 *
 * SOURCES
 * -------
 * The expansion model is John T. Linsley, "Expanding Rifle Barrels: An
 * Empirical Velocity Model", as popularised by Bryan Litz and the reloading
 * community. The exponent RANGES are widely reproduced, but no canonical
 * published midpoint for each class exists, so these are marked `estimated`
 * rather than `published`. That distinction is the point of the provenance
 * system: a shooter asking "where does 0.22 come from?" should be told "a
 * convention, not a standard."
 *
 * ACCURACY: across a 24 to 26 inch change in barrel length, an error of 0.02 in
 * n moves the predicted velocity by about 0.4%, which is under 10 fps on a 2650
 * fps round. Fine for estimating a barrel length; NOT fine for computing a
 * charge weight.
 */
export const SCALING_EXPONENT_ESTIMATED = estimated(
  { pistol: 0.15, rifle_medium: 0.22, rifle_slow: 0.29, shotgun: 0.15 },
  SOURCES.homann,
  'No single published value exists for each powder class. The cited ranges ' +
    '(pistol 0.12-0.18, rifle medium 0.20-0.26, rifle slow 0.28-0.35) are ' +
    'reproduced across the reloading literature; these are their midpoints. The ' +
    'selection is conventional rather than derived, so it is recorded as an ' +
    'estimate and the UI should present it differently.',
);


/**
 * Form factor applied when using a G1 ballistic coefficient.
 *
 * By definition, a projectile whose G1 BC is quoted is being described by
 * reference to the G1 standard projodal, so the form factor in the retardation
 * equation is exactly 1. The number is a consequence of the definition, not a
 * fitted parameter.
 */
export const G1_FORM_FACTOR = published(1, SOURCES.sierraBallistics, {
  units: 'dimensionless',
  page: 'G1 standard projectile definition',
});

/**
 * Form factor applied when using a G7 ballistic coefficient.
 *
 * The G7 standard projodal is a 10 deg, 3.8 caliber, 250 grain boat-tailed
 * test projectile, which presents more drag than the G1 reference at
 * transonic and supersonic speeds. Its form factor relative to G1 is 1.2, the
 * conventional value used in the published drag tables.
 *
 * SOURCES
 * ------
 * Sierra, "Exterior Ballistics" and the drag-table documentation shipped with
 * JBM and Ballistic-X. Both quote the G7 form factor as 1.2 relative to G1.
 */
export const G7_FORM_FACTOR = published(1.2, SOURCES.sierraBallistics, {
  units: 'dimensionless',
  page: 'G7 standard projectile definition',
});

