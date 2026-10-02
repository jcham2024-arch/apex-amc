/**
 * CI parity: every gate in `npm run verify` must actually run in CI.
 *
 * WHY THIS EXISTS
 * ---------------
 * The verify workflow listed its gates by hand. Three went missing: claims:check,
 * tasks:check and oracle:check. That is the same class of defect as the ones this
 * project keeps fixing - something asserted in two places, with nothing
 * comparing them. The consequence was concrete and bad: the physics oracle could
 * have been broken by a pull request and CI would still have been green, because
 * CI never ran it. A gate that runs locally but not in CI is not a gate.
 *
 * Nothing noticed, because "CI is green" was read as "the checks pass" rather than
 * "the checks that exist ran". This makes the two lists comparable.
 *
 * WHAT IT CHECKS
 * --------------
 * Every script name in package.json's `verify` chain must appear in
 * .github/workflows/verify.yml. Stages that are legitimately CI-only (audit,
 * the browser CSP check) are listed in `CI_ONLY` with a reason, so the exemption
 * is deliberate and reviewable rather than an omission.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
const workflow = readFileSync(resolve(ROOT, '.github/workflows/verify.yml'), 'utf8');

/**
 * Steps CI runs that are not part of `verify`.
 *
 * Each needs a reason. An exemption with no explanation is the same defect this
 * gate exists to catch, one level up.
 */
const CI_ONLY = new Map([
  ['lint', 'run as its own named step so a lint failure is attributed'],
  ['typecheck:all', 'run as its own named step'],
  ['test:all', 'run as its own named step'],
  ['website:build', 'CI-only: the self-containment gate passes trivially when dist/ is absent, so the site must be built first'],
  ['website:csp:browser', 'CI-only: proves the CSP in a real browser, which no local gate does'],
]);

const stages = pkg.scripts.verify
  .split('&&')
  .map((s) => s.trim().replace(/^npm run -?s? /, ''))
  .filter(Boolean);

const missing = stages.filter((s) => !workflow.includes(s));

console.log('verify declares ' + stages.length + ' stages');
console.log('comparing each against .github/workflows/verify.yml');

if (missing.length) {
  console.log('');
  for (const s of missing) {
    const reason = CI_ONLY.get(s);
    console.log(
      'FAIL ' + s + ' is in npm run verify but not named in verify.yml'
        + (reason ? ' (exempt: ' + reason + ')' : ''),
    );
  }
  console.log('');
  console.log(
    missing.length + ' gate(s) would be skipped by CI. A gate that runs locally '
      + 'but not in CI is not a gate: add it to the workflow, or record a reason '
      + 'in CI_ONLY above.',
  );
  console.log('');
  console.log('ci FAILED');
  process.exit(1);
}

const exempt = stages.filter((s) => CI_ONLY.has(s));
console.log('');
console.log('  all ' + stages.length + ' stages accounted for');
if (exempt.length) {
  console.log('  CI-only or separately-stepped: ' + exempt.join(', '));
}
console.log('');
console.log('ci:check OK');
