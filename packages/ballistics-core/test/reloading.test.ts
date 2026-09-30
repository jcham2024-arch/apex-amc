import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildLadder, scaleVelocity, SCALING_EXPONENT } from '../src/reloading.ts';
import type { PublishedRecipe } from '../src/reloading.ts';
import { machNumber, speedOfSoundFps, densityRatio } from '../src/atmosphere.ts';

const close = (a: number, b: number, tol = 1e-6) =>
  assert.ok(Math.abs(a - b) < tol, `${a} !~= ${b}`);

// From the chat-log worked example.
const RECIPE: PublishedRecipe = {
  cartridge: '.308 Winchester',
  bullet: '168gr HPBT',
  powder: 'I4064',
  testBarrelLengthIn: 24,
  publishedCoalIn: 2.8,
  minChargeGrains: 41.5,
  minVelocityFps: 2450,
  maxChargeGrains: 45,
  maxVelocityFps: 2700,
  burnRateClass: 'rifle_medium',
  sourceName: 'Hodgdon 2024',
};

test('scaleVelocity reproduces the documented 16" example', () => {
  // 2700 * (24/16)^0.22 ~= 2469 fps
  const v = scaleVelocity(2700, 24, 16, 'rifle_medium');
  assert.ok(v > 2460 && v < 2480, `expected ~2469, got ${v.toFixed(1)}`);
});

test('scaleVelocity is identity at equal barrel lengths', () => {
  close(scaleVelocity(2700, 24, 24, 'rifle_medium'), 2700, 1e-9);
});

test('slower powders gain more velocity from a longer barrel', () => {
  const fast = scaleVelocity(2700, 24, 26, 'pistol');
  const slow = scaleVelocity(2700, 24, 26, 'rifle_slow');
  assert.ok(slow > fast, 'rifle_slow should outgain pistol from added length');
});

test('exponents are ordered pistol < medium < slow', () => {
  assert.ok(SCALING_EXPONENT.pistol < SCALING_EXPONENT.rifle_medium);
  assert.ok(SCALING_EXPONENT.rifle_medium < SCALING_EXPONENT.rifle_slow);
});

test('scaleVelocity rejects non-positive barrel lengths', () => {
  assert.throws(() => scaleVelocity(2700, 0, 24, 'rifle_medium'), RangeError);
  assert.throws(() => scaleVelocity(2700, 24, -1, 'rifle_medium'), RangeError);
});

test('buildLadder produces the requested number of ascending steps', () => {
  const r = buildLadder(RECIPE, { userBarrelLengthIn: 24, stepsCount: 5 });
  assert.equal(r.ladder.length, 5);
  assert.equal(r.ladder[0]!.chargeGrains, 41.5);
  assert.equal(r.ladder[4]!.chargeGrains, 45);
  assert.equal(r.ladder[4]!.isMax, true);
  for (let i = 1; i < r.ladder.length; i++) {
    assert.ok(r.ladder[i]!.chargeGrains > r.ladder[i - 1]!.chargeGrains);
    assert.ok(r.ladder[i]!.estimatedFps > r.ladder[i - 1]!.estimatedFps);
  }
});

test('buildLadder warns when seating deeper than published', () => {
  const r = buildLadder(RECIPE, {
    userBarrelLengthIn: 24,
    userTargetCoalIn: 2.7,
  });
  assert.ok(r.coalWarning, 'expected a COAL warning');
  assert.match(r.coalWarning, /0\.100" shorter/);
  assert.equal(r.ladder[0]!.isStartBelowMinimum, true);
});

test('buildLadder does not warn at or above published COAL', () => {
  assert.equal(
    buildLadder(RECIPE, { userBarrelLengthIn: 24, userTargetCoalIn: 2.8 })
      .coalWarning,
    null,
  );
  assert.equal(
    buildLadder(RECIPE, { userBarrelLengthIn: 24, userTargetCoalIn: 3.0 })
      .coalWarning,
    null,
  );
});

test('buildLadder defaults to published COAL and no warning', () => {
  const r = buildLadder(RECIPE, { userBarrelLengthIn: 24 });
  assert.equal(r.targetCoalIn, RECIPE.publishedCoalIn);
  assert.equal(r.coalWarning, null);
});

test('buildLadder scales velocity down for a shorter barrel', () => {
  const carbine = buildLadder(RECIPE, { userBarrelLengthIn: 16 });
  const testBarrel = buildLadder(RECIPE, { userBarrelLengthIn: 24 });
  assert.ok(carbine.ladder[4]!.estimatedFps < testBarrel.ladder[4]!.estimatedFps);
  assert.ok(carbine.scalingFactor < 1);
});

test('buildLadder enforces the 3-10 step range', () => {
  assert.throws(() => buildLadder(RECIPE, { userBarrelLengthIn: 24, stepsCount: 2 }), RangeError);
  assert.throws(() => buildLadder(RECIPE, { userBarrelLengthIn: 24, stepsCount: 11 }), RangeError);
});

test('speed of sound matches the accepted value at 59F', () => {
  close(speedOfSoundFps(59), 1116.4, 0.5);
});

test('machNumber of 2700 fps at 59F is ~2.42', () => {
  close(machNumber(2700, 59), 2.42, 0.01);
});

test('densityRatio is 1.0 at sea level in ISA', () => {
  close(densityRatio(0, 59), 1.0, 1e-6);
});

test('densityRatio drops with altitude', () => {
  assert.ok(densityRatio(5000, 59) < 1);
  assert.ok(densityRatio(5000, 59) > 0.8);
});
