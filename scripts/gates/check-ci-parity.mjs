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
 *
 * Note the difference between a gate and a wrapper: `audit:check` runs in CI,
 * but as `node scripts/security/audit-advisories.mjs` rather than as
 * `npm run audit:check`, because CI needs it as a separately attributed step.
 * The script path is accepted as satisfying the npm script name, since the two
 * name the same file.
 */
const CI_ONLY = new Map([
  ['lint', 'run as its own named step so a lint failure is attributed'],
  ['typecheck:all', 'run as its own named step'],
  ['test:all', 'run as its own named step'],
  ['website:build', 'CI-only: the self-containment gate passes trivially when dist/ is absent, so the site must be built first'],
  ['website:csp:browser', 'CI-only: proves the CSP in a real browser, which no local gate does'],
]);

/** Map an npm script name to the file it invokes, for aliasing. */
function scriptTarget(name) {
  const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
  const cmd = (pkg.scripts || {})[name];
  if (typeof cmd !== 'string') return null;
  const m = cmd.match(/node\s+(\S+\.mjs)/);
  return m ? m[1] : null;
}

const stages = pkg.scripts.verify
  .split('&&')
  .map((s) => s.trim().replace(/^npm run -?s? /, ''))
  // The failure message and the stage name must both be bare script names.
  // A stage that survived as "npm run audit:check" would never match anything.
  .map((s) => s.replace(/^npm run /, ''))
  .filter(Boolean);

const missing = stages.filter((s) => {
  if (workflow.includes('npm run ' + s)) return false;
  // Accept an invocation of the underlying script file, but ONLY the exact
  // command. Matching on the filename alone is too permissive: swapping
  // `node scripts/security/audit-advisories.mjs` back to a raw
  // `npm audit --omit=dev --audit-level=high` still mentions the file in the
  // surrounding comment, so a bare `workflow.includes(target)` passed a
  // workflow that no longer runs the gate at all. That is the exact defect this
  // check exists to prevent, introduced by the check itself.
  const target = scriptTarget(s);
  if (target && new RegExp('^\\s*run:\\s*(?:-\\s+)?node\\s+' + target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'm').test(workflow)) {
    return false;
  }
  return true;
});

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
