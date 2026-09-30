import assert from 'node:assert/strict';
import { test } from 'node:test';

import { dispersion, centreOfImpact, detectFlyer } from '../src/dispersion.ts';
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
