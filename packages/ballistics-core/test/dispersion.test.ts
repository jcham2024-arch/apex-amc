import assert from 'node:assert/strict';
import { test, describe } from 'node:test';

import { dispersion, centreOfImpact, detectFlyer } from '../src/dispersion.ts';
import {
    CEP50_RAYLEIGH_K,
    CEP90_RAYLEIGH_K,
    GRUBBS_CRITICAL_005,
} from '../src/provenance/constants.ts';
import type { Shot } from '../src/dispersion.ts';

const close = (a: number, b: number, tol = 1e-6) =>
  assert.ok(Math.abs(a - b) < tol, `${a} !~= ${b}`);

// The sample from the original RayleighGroupCalculator, in inches.
const SAMPLE: Shot[] = [
  { x: -0.45, y: 0.62 },
  { x: 0.35, y: 0.28 },
  { x: -0.12, y: -0.55 },
];

test('centreOfImpact is the arithmetic mean', () => {
  const poi = centreOfImpact(SAMPLE);
  close(poi.x, (-0.45 + 0.35 - 0.12) / 3);
  close(poi.y, (0.62 + 0.28 - 0.55) / 3);
});

test('dispersion uses the Bessel-corrected denominator', () => {
  const d = dispersion(SAMPLE);
  assert.ok(d);

  // Identity: the sum of squared radii from the POI equals the sum of
  // squared per-axis deviations (the cross terms cancel in the sum).
  let ssX = 0;
  let ssY = 0;
  let ssR = 0;
  for (const s of SAMPLE) {
    ssX += (s.x - d.poi.x) ** 2;
    ssY += (s.y - d.poi.y) ** 2;
    ssR += Math.hypot(s.x - d.poi.x, s.y - d.poi.y) ** 2;
  }
  close(ssX + ssY, ssR, 1e-9);

  const dof = SAMPLE.length - 1;

  // For a bivariate normal the radial (Rayleigh) sigma is
  //   sqrt((sx^2 + sy^2) / 2) = sqrt((ssX + ssY) / (2 * (n - 1)))
  // The factor of 2 is required and is easy to drop when hand-checking.
  const radialSigma = Math.sqrt(ssR / (2 * dof));
  close(d.cep50, 1.1774 * radialSigma, 1e-9);

  // Cross-check against the per-axis sigmas the function also returns.
  close(d.cep50, 1.1774 * Math.sqrt((d.sigma.x ** 2 + d.sigma.y ** 2) / 2), 1e-9);

  // This group is the 3-shot sample from the original app. The old naive /n
  // estimator returned 0.492"; the corrected value is 0.603".
  close(d.cep50, 0.6025865257947056, 1e-9);
});

test('CEP50 is not under-reported for small groups', () => {
  const d = dispersion(SAMPLE);
  assert.ok(d);
  // The old code returned 0.492" via a naive /2n estimator.
  // The correct Bessel-corrected value is ~0.603".
  assert.ok(
    d.cep50 > 0.55,
    `CEP50 ${d.cep50} still looks under-reported (old buggy value was 0.492)`,
  );
});

test('dispersion on a circular group uses the radial sigma', () => {
  // Four points on a unit circle. These are *samples*, so the Bessel-corrected
  // SD is sqrt(4/3) = 1.1547 times smaller than the population sigma of 1.
  const circle: Shot[] = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];
  const d = dispersion(circle);
  assert.ok(d);
  close(d.sigma.x, d.sigma.y);

  // Four points on a unit circle: each axis has SS = 2, so the
  // Bessel-corrected SD is sqrt(2/3) = 0.8165, not 1.
  // (sqrt(4/3) is the *population* divisor and is not what we use.)
  close(d.sigma.x, Math.sqrt(2 / 3));
  close(d.cep50, 1.1774 * Math.sqrt(2 / 3), 1e-9);
  close(d.cep90, 2.146 * Math.sqrt(2 / 3), 1e-9);
});

test('CEP handles an elongated group correctly', () => {
  // sx != sy: the old 0.5887*(sx+sy) form was wrong unless sx === sy.
  const wide: Shot[] = [
    { x: -2, y: -0.5 },
    { x: 2, y: 0.5 },
    { x: -1.8, y: 0.4 },
    { x: 1.9, y: -0.4 },
  ];
  const d = dispersion(wide);
  assert.ok(d);

  const radial = Math.sqrt((d.sigma.x ** 2 + d.sigma.y ** 2) / 2);
  const naive = 0.5887 * (d.sigma.x + d.sigma.y);
  close(d.cep50, 1.1774 * radial, 1e-9);
  assert.notEqual(d.cep50, naive);
});

test('dispersion returns null for a single shot', () => {
  assert.equal(dispersion([{ x: 0, y: 0 }]), null);
});

test('extremeSpread is the max pairwise distance', () => {
  const d = dispersion([
    { x: 0, y: 0 },
    { x: 3, y: 4 },
    { x: -1, y: 0 },
  ]);
  assert.ok(d);
  // Pairwise distances:
  //   (0,0)-(3,4)  = sqrt(9+16)  = 5
  //   (0,0)-(-1,0) = 1
  //   (3,4)-(-1,0) = sqrt(16+16) = sqrt(32)  <-- the maximum
  close(d.extremeSpread, Math.sqrt(32));
});

test('detectFlyer flags a gross outlier', () => {
  const shots: Shot[] = [
    { x: 0.1, y: 0 },
    { x: -0.1, y: 0.05 },
    { x: 0, y: -0.1 },
    { x: 5, y: 5 },
  ];
  const r = detectFlyer(shots);
  assert.ok(r.flyer, 'expected the far shot to be flagged');
  close(r.flyer!.x, 5);
  assert.equal(r.cleanShots.length, 3);
});

test('detectFlyer leaves a tight group alone', () => {
  const shots: Shot[] = [
    { x: 0.1, y: 0.1 },
    { x: -0.1, y: 0.05 },
    { x: 0.02, y: -0.11 },
    { x: 0.05, y: 0.08 },
  ];
  assert.equal(detectFlyer(shots).flyer, null);
});

test('detectFlyer does not divide by zero on coincident shots', () => {
  const shots: Shot[] = [
    { x: 1, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 1 },
  ];
  assert.equal(detectFlyer(shots).flyer, null);
});

test('detectFlyer needs at least three shots', () => {
  assert.equal(detectFlyer([{ x: 0, y: 0 }, { x: 9, y: 9 }]).flyer, null);
});

describe('statistical constants are verified, not trusted', () => {
    // These tests recompute the constants from first principles so that a typo
    // or a transcription error in the table cannot pass unnoticed. A wrong
    // Grubbs table shipped once already: it used a t critical at alpha/2
    // instead of alpha/(2n), which understated every threshold for n >= 5.

    test('the Rayleigh CEP50 factor matches the analytic quantile', () => {
        // For a bivariate normal, P(R <= r) = 1 - exp(-r^2 / (2 sigma^2)),
        // so the p-quantile radius is sigma * sqrt(2 * ln(1/(1-p))).
        const k = (p: number) => Math.sqrt(2 * Math.log(1 / (1 - p)));
        assert.ok(Math.abs(k(0.5) - 1.1774) < 1e-4, `analytic CEP50 factor is ${k(0.5)}`);
        assert.equal(CEP50_RAYLEIGH_K.value, Number(k(0.5).toFixed(4)));
    });

    test('the Rayleigh CEP90 factor matches the analytic quantile', () => {
        const k = (p: number) => Math.sqrt(2 * Math.log(1 / (1 - p)));
        assert.ok(Math.abs(k(0.9) - 2.146) < 1e-3, `analytic CEP90 factor is ${k(0.9)}`);
        assert.equal(CEP90_RAYLEIGH_K.value, Number(k(0.9).toFixed(4)));
    });

    test('the Grubbs table is strictly increasing in sample size', () => {
        // A necessary property. The old table satisfied it too, which is why
        // monotonicity alone was not enough to catch the error.
        const entries = Object.entries(GRUBBS_CRITICAL_005.value).map(([n, g]) => [Number(n), g] as const);
        for (let i = 1; i < entries.length; i++) {
            assert.ok(
                entries[i]![1] > entries[i - 1]![1],
                `G must increase with n: n=${entries[i - 1]![0]} gives ${entries[i - 1]![1]}, ` +
                `n=${entries[i]![0]} gives ${entries[i]![1]}`,
            );
        }
    });

    test('every Grubbs value is below its own algebraic prefactor', () => {
        // G = ((n-1)/sqrt(n)) * sqrt(t^2 / (n-2 + t^2)). The second factor is
        // strictly less than 1, so G must be strictly less than (n-1)/sqrt(n) for
        // every n. A value above that ceiling cannot come from this formula at all.
        const table = GRUBBS_CRITICAL_005.value as Readonly<Record<number, number>>;
        for (const [n, g] of Object.entries(table)) {
            const prefactor = (Number(n) - 1) / Math.sqrt(Number(n));
            assert.ok(
                g < prefactor,
                `n=${n}: G=${g} must be below the prefactor ${prefactor.toFixed(4)}`,
            );
            // And it must exceed 1, since G approaches 1 from above as n grows.
            assert.ok(g > 1, `n=${n}: G=${g} must exceed 1`);
        }
    });
    test('the Grubbs table matches the published two-sided values', () => {
        // Grubbs (1950), Annals of Mathematical Statistics 21(1) 27-58, and the
        // NIST/SEMATECH Engineering Statistics Handbook 1.3.5.17. The two-sided
        const published: Readonly<Record<number, number>> = {
            3: 1.154, 4: 1.481, 5: 1.715, 6: 1.887, 7: 2.020,
            8: 2.126, 9: 2.215, 10: 2.290, 12: 2.412, 15: 2.549,
        };
        const table = GRUBBS_CRITICAL_005.value;
        for (const [n, expected] of Object.entries(published)) {
            const actual = (table as Readonly<Record<number, number>>)[Number(n)];
            assert.equal(actual, expected, `Grubbs G for n=${n}`);
        }
    });

    test('groups are not over-eager about flagging flyers', () => {
        // A regression guard on the old fallback of 2.2, which was below every
        // tabulated value and therefore made large groups MORE likely to have a
        // shot removed than small ones. Build groups with a known spread and
        // confirm nothing is removed at realistic sample sizes.
        const ring = (n: number, radius: number) =>
            Array.from({ length: n }, (_, i) => {
                const a = (2 * Math.PI * i) / n;
                return { x: Math.cos(a) * radius, y: Math.sin(a) * radius };
            });

        for (const n of [5, 8, 10, 12]) {
            // A perfectly even ring has every radius identical, so Grubbs cannot
            // run at all. Add a small deterministic wobble.
            const shots = ring(n, 1).map((s, i) => ({
                x: s.x * (1 + 0.02 * (i % 3)),
                y: s.y * (1 + 0.02 * ((i + 1) % 3)),
            }));
            const result = detectFlyer(shots);
            assert.equal(
                result.flyer,
                null,
                `a clean ${n}-shot group must not have a shot removed`,
            );
        }
    });
});
