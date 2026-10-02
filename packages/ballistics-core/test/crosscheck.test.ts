/**
 * Cross-path consistency tests.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Most tests here check a function against a published constant or an ISA table
 * value. That catches a function being wrong. It does NOT catch two correct
 * functions drifting apart, or a constant changed in one place and not another.
 *
 * That is not hypothetical. Two defects found in this repo were exactly this
 * shape:
 *
 *   1. The Grubbs critical-value table was wrong for n >= 5, and lived in two
 *      copies. Both copies were "tested"; both were wrong identically.
 *   2. The mobile Rayleigh screen computed sigma with a population denominator
 *      (n) while the domain used the Bessel-corrected sample denominator (n-1).
 *      The screen under-reported CEP by about 22%. Each side passed its own
 *      tests, because each tested itself.
 *
 * A property reachable two independent ways should be computed both ways and
 * compared. If the routes disagree, one is wrong even if neither looks wrong.
 *
 * WHAT COUNTS AS INDEPENDENT HERE
 * -------------------------------
 * These pairs share the ISA constants, so they cannot catch a wrong constant.
 * They catch a wrong *composition*: a bad exponent, a wrong inversion, a sign
 * error, a unit slip between two functions. That is a real and common class of
 * bug, and the class both defects above belonged to.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  densityRatio,
  densityRatioFromPressure,
  pressureAltitudeFt,
  densityAltitudeFt,
  speedOfSoundFps,
  speedOfSoundHumidFps,
  machNumber,
  humidityDensityCorrection,
  resolveWind,
  clamp,
} from '../src/atmosphere.ts';

import {
  dispersion,
  centreOfImpact,
  detectFlyer,
} from '../src/dispersion.ts';

/** Close enough for float round-trips through pow/exp. */
const close = (a: number, b: number, tol = 1e-9, msg?: string): void => {
  assert.ok(
    Math.abs(a - b) <= tol,
    msg ?? `expected ${a} and ${b} to agree within ${tol}; got ${Math.abs(a - b)}`,
  );
};

/**
 * ISA pressure at a geometric altitude, from the same barometric equation the
 * domain uses but computed independently here. This is the bridge between the
 * altitude route and the measured-pressure route.
 */
const isaPressureInHg = (altitudeFt: number): number =>
  29.9213 * Math.pow(1 - (0.0019812 * altitudeFt) / 288.15, 5.25588);

describe('density ratio: two independent routes must agree', () => {
  // Route A: geometric altitude -> barometric formula -> sigma
  // Route B: measured pressure -> ideal gas       -> sigma
  for (const altitudeFt of [0, 500, 1000, 2500, 5000, 7500, 10000, 15000, 20000]) {
    test(`at ${altitudeFt} ft the altitude and measured-pressure routes agree`, () => {
      const fromAltitude = densityRatio(altitudeFt, 59);
      const fromPressure = densityRatioFromPressure(isaPressureInHg(altitudeFt), 59);
      close(fromAltitude, fromPressure, 1e-9);
    });
  }

  test('sea level in ISA is exactly 1.0 by both routes', () => {
    close(densityRatio(0, 59), 1, 1e-12);
    close(densityRatioFromPressure(29.9213, 59), 1, 1e-12);
  });
});

describe('altitude inversions round-trip', () => {
  for (const altitudeFt of [0, 1000, 2500, 5000, 7500, 10000, 15000]) {
    test(`density altitude inverts back to ${altitudeFt} ft`, () => {
      // In standard conditions this must return the altitude it started from.
      // A wrong exponent or a mismatched lapse rate breaks it immediately.
      close(densityAltitudeFt(altitudeFt, 59), altitudeFt, 1e-6);
    });

    test(`pressure altitude inverts back to ${altitudeFt} ft`, () => {
      close(pressureAltitudeFt(isaPressureInHg(altitudeFt)), altitudeFt, 1e-6);
    });
  }

  test('density altitude equals pressure altitude in standard conditions', () => {
    // At ISA temperature the density ratio IS the pressure ratio, so both
    // inversions must produce the same altitude. Two functions, one answer.
    for (const altitudeFt of [0, 2000, 5000, 9000]) {
      close(
        densityAltitudeFt(altitudeFt, 59),
        pressureAltitudeFt(isaPressureInHg(altitudeFt)),
        1e-6,
      );
    }
  });

  test('a hot day reads a higher density altitude than a cold one', () => {
    // Same station pressure, hotter air means lower density, which the ISA
    // inversion reads as a higher altitude. Guards the sign, which an exponent
    // typo can silently flip.
    const cold = densityAltitudeFt(5000, 32);
    const hot = densityAltitudeFt(5000, 100);
    assert.ok(hot > cold, 'hot air must read a higher density altitude');
    // 32F is below the 59F ISA reference, so density altitude must read BELOW
    // the station; 100F must read above it. Both directions, not just one.
    assert.ok(cold < 5000, 'sub-standard temperature must read below station');
    assert.ok(hot > 5000, 'super-standard temperature must read above station');
  });
});

describe('mach number is self-consistent with speed of sound', () => {
  for (const tempF of [-40, 0, 32, 59, 77, 100, 120]) {
    test(`Mach round-trips through speed of sound at ${tempF}F`, () => {
      const c = speedOfSoundFps(tempF);
      // machNumber(v, t) = v / c(t). Feeding c back must give exactly 1.0.
      // Catches a coefficient change applied to one function but not the other.
      close(machNumber(c, tempF), 1, 1e-12);
    });
  }

  test('humid air is faster than dry air', () => {
    // Humid air is less dense so sound travels faster. A mach number computed
    // with the dry-air constant will disagree near the transonic boundary,
    // which is exactly where a mis-flag matters.
    assert.ok(
      speedOfSoundHumidFps(77, 90) > speedOfSoundFps(77),
      'humidity must raise the speed of sound',
    );
  });
});

describe('humidity and density composition', () => {
  test('humidity correction is a no-op at zero humidity', () => {
    close(humidityDensityCorrection(1, 0), 1, 1e-15);
  });

  test('humid air is less dense than dry air at the same conditions', () => {
    // The physically meaningful direction, and the one most likely to be
    // sign-flipped in a correction coefficient.
    assert.ok(humidityDensityCorrection(1, 80) < 1, 'humid air must be less dense');
  });
});

describe('wind resolution is a rotation, not a mirror', () => {
  test('a crosswind produces no downrange component', () => {
    // Shooting north with wind from the east: pure crosswind.
    close(resolveWind(10, 90).headFps, 0, 1e-9);
  });

  test('a wind from behind is purely along-range', () => {
    // directionDeg is the direction the wind comes FROM, so 180 is a tailwind.
    const r = resolveWind(10, 180);
    close(r.crossFps, 0, 1e-9);
    assert.ok(r.headFps < 0, 'a tailwind must be negative along-range (headFps is head/tail signed)');
  });

  test('the two components reconstruct the wind speed in fps', () => {
    // Orthogonal decomposition must be lossless: hypot(x, y) = |v| * 5280/3600.
    // Catches a missing cosine or a dropped degree conversion.
    for (const dir of [0, 45, 90, 135, 180, 225, 270, 315]) {
      const r = resolveWind(14, dir);
      close(Math.hypot(r.crossFps, r.headFps), 14 * (5280 / 3600), 1e-9);
    }
  });

  test('cross-range magnitude is symmetric about the shooting line', () => {
    // Shooting north: wind from the east and from the west must deflect the
    // same distance in opposite directions.
    const east = resolveWind(12, 90);
    const west = resolveWind(12, 270);
    close(Math.abs(east.crossFps), Math.abs(west.crossFps), 1e-9);
    assert.ok(east.crossFps * west.crossFps < 0, 'opposite winds drift oppositely');
  });

  test('zero wind produces zero components', () => {
    close(resolveWind(0, 123).crossFps, 0, 1e-12);
    close(resolveWind(0, 123).headFps, 0, 1e-12);
  });
});

describe('dispersion: sigma and CEP agree by two routes', () => {
  // The exact group the mobile screen shipped with, and the one that exposed
  // the population-vs-sample denominator defect.
  const GROUP = [
    { x: -0.45, y: 0.62 },
    { x: 0.35, y: 0.28 },
    { x: -0.12, y: -0.55 },
  ];

  test('CEP50 matches sigma * k, where sigma comes from the per-axis route', () => {
    const d = dispersion(GROUP);
    assert.ok(d);
    // k is recomputed here from the closed form rather than imported, so a
    // change to the published constant cannot make this test pass by
    // definition. The tolerance is the published constant's own rounding:
    // constants.ts carries k = 1.1774 where the exact value is 1.1774100225,
    // a relative difference of 8.6e-6. Asserting tighter than that would be
    // asserting the table is more precise than it is.
    const kExact = Math.sqrt(2 * Math.log(1 / (1 - 0.5)));
    const sigmaPerAxis = Math.sqrt((d.sigma.x ** 2 + d.sigma.y ** 2) / 2);
    close(d.cep50, kExact * sigmaPerAxis, 1e-4);
  });

  test('CEP90 uses the 90% quantile coefficient, not the 50% one', () => {
    const d = dispersion(GROUP);
    assert.ok(d);
    const k90Exact = Math.sqrt(2 * Math.log(1 / (1 - 0.9)));
    const sigmaPerAxis = Math.sqrt((d.sigma.x ** 2 + d.sigma.y ** 2) / 2);
    close(d.cep90, k90Exact * sigmaPerAxis, 1e-4);
    // And they must actually differ, or the quantile is being mislabelled.
    assert.ok(d.cep90 > d.cep50 * 1.5);
  });

  test('sigma from radii equals sigma from axes, and population SD must not', () => {
    // The domain computes sigma per-axis; the mobile screen computed it from
    // radii. These are equal ONLY when both use the Bessel correction.
    // Comparing them is what caught the n vs n-1 bug and will catch any
    // reintroduction.
    const d = dispersion(GROUP);
    assert.ok(d);
    const n = GROUP.length;
    let ssR = 0;
    for (const s of GROUP) {
      ssR += Math.hypot(s.x - d.poi.x, s.y - d.poi.y) ** 2;
    }
    const sigmaFromRadii = Math.sqrt(ssR / (2 * (n - 1)));
    const sigmaFromAxes = Math.sqrt((d.sigma.x ** 2 + d.sigma.y ** 2) / 2);
    close(sigmaFromAxes, sigmaFromRadii, 1e-12);

    // And explicitly: the population denominator must NOT match. If this ever
    // starts passing, the sample correction has been cancelled out somewhere.
    const populationSigma = Math.sqrt(ssR / (2 * n));
    assert.ok(
      Math.abs(populationSigma - sigmaFromAxes) > 1e-6,
      'population and sample sigma should differ; if they do not, the Bessel ' +
        'correction is being lost somewhere',
    );
  });

  test('mean radius equals the mean of the individual distances', () => {
    const d = dispersion(GROUP);
    assert.ok(d);
    const manual =
      GROUP.reduce((sum, s) => sum + Math.hypot(s.x - d.poi.x, s.y - d.poi.y), 0) /
      GROUP.length;
    close(d.meanRadius, manual, 1e-12);
  });

  test('centre of impact is unchanged by the CEP computation', () => {
    const d = dispersion(GROUP);
    assert.ok(d);
    const poi = centreOfImpact(GROUP);
    close(d.poi.x, poi.x, 1e-15);
    close(d.poi.y, poi.y, 1e-15);
  });
});

describe('dispersion invariants', () => {
  const circle = Array.from({ length: 10 }, (_, i) => {
    const a = (2 * Math.PI * i) / 10;
    return { x: Math.cos(a), y: Math.sin(a) };
  });

  test('a perfect circle has sigma near 0.707', () => {
    // Points uniformly on a unit circle have per-axis SD of 1/sqrt(2).
    const d = dispersion(circle);
    assert.ok(d);
    close(d.sigma.x, Math.SQRT1_2, 0.05);
    close(d.sigma.y, Math.SQRT1_2, 0.05);
  });

  test('CEP scales linearly with group size', () => {
    // Dispersive statistics are homogeneous: doubling every coordinate must
    // double CEP. A hard-coded constant or an unsquared term breaks this.
    const small = dispersion([
      { x: -0.1, y: 0.1 },
      { x: 0.1, y: -0.1 },
      { x: 0.05, y: 0.05 },
    ]);
    const large = dispersion([
      { x: -0.2, y: 0.2 },
      { x: 0.2, y: -0.2 },
      { x: 0.1, y: 0.1 },
    ]);
    assert.ok(small && large);
    close(large.cep50 / small.cep50, 2, 1e-12);
  });

  test('a rigid translation does not change dispersion', () => {
    // Moving the whole group must not change spread. Catches a dropped POI
    // subtraction, which would make CEP depend on where the group sits.
    const base = [
      { x: -0.3, y: 0.2 },
      { x: 0.1, y: -0.4 },
      { x: 0.25, y: 0.3 },
    ];
    const moved = base.map((s) => ({ x: s.x + 4.0, y: s.y + 3.0 }));
    const a = dispersion(base);
    const b = dispersion(moved);
    assert.ok(a && b);
    close(a.cep50, b.cep50, 1e-12);
    close(a.meanRadius, b.meanRadius, 1e-12);
  });

  test('flyer detection agrees with an unambiguous single outlier', () => {
    const group = [
      { x: -0.2, y: 0.1 },
      { x: 0.15, y: -0.2 },
      { x: 0.05, y: 0.15 },
      { x: -0.1, y: -0.05 },
      { x: 0.0, y: 0.0 },
      { x: 3.5, y: 2.5 },
    ];
    const r = detectFlyer(group);
    assert.ok(r.flyer, 'a shot 30x the group spread must be flagged');
    assert.equal(r.removedIndex, 5, 'must identify the correct shot');
    assert.equal(r.cleanShots.length, group.length - 1, 'the flyer is excluded from the clean set');
  });

  test('flyer detection does not fire on a merely wide but uniform group', () => {
    // A wide group is not a flyer. Grubbs rejects on outlier relative to the
    // rest; this group has none, so a threshold on absolute spread would
    // wrongly flag it.
    const wide = Array.from({ length: 8 }, (_, i) => ({
      x: Math.cos((2 * Math.PI * i) / 8) * 1.5,
      y: Math.sin((2 * Math.PI * i) / 8) * 1.5,
    }));
    const r = detectFlyer(wide);
    assert.equal(r.flyer, null);
    assert.equal(r.removedIndex, null);
  });

  test('a single shot has no dispersion', () => {
    assert.equal(dispersion([{ x: 0, y: 0 }]), null);
  });
});

describe('clamp', () => {
  test('bounds a value on both sides', () => {
    assert.equal(clamp(5, 0, 10), 5);
    assert.equal(clamp(-1, 0, 10), 0);
    assert.equal(clamp(11, 0, 10), 10);
  });
});