/**
 * Audit gate: fail on new high/critical advisories, report known ones.
 *
 * WHY THIS EXISTS
 * ---------------
 * npm audit --omit=dev --audit-level=high has never passed on this repository,
 * and it cannot be made to pass: node-forge 1.4.0 is the newest published
 * version, and the advisory that flags it (GHSA-86w9-cpqp-85rv /
 * CVE-2026-85393) lists "Patched versions: None".
 *
 * Leaving that as a hard CI failure is worse than either fixing it or removing
 * it, because a permanently red step teaches everyone to ignore the exit code -
 * including the day a genuinely new advisory appears. This project has already
 * learned that lesson: scripts/handoff/check-handoff.mjs records known findings
 * and stops failing on them, with the reasoning quoted verbatim.
 *
 * So this gate does the same thing, one level up:
 *
 *   - A NEW high or critical advisory fails the build. This is the point.
 *   - A KNOWN advisory is reported in full, every run, and does not fail.
 *   - Every acknowledgement must carry a reason. An unexplained entry is a
 *     suppression wearing a disguise, and is rejected.
 *
 * WHY THE KNOWN ONE IS ACCEPTABLE, SPECIFICALLY
 * ---------------------------------------------
 * The chain is expo -> @expo/cli -> @expo/code-signing-certificates ->
 * node-forge. Three independent reasons this is not an exposure here:
 *
 *   1. It is build tooling. @expo/cli uses node-forge to verify iOS code-signing
 *      certificates during a local Expo build. It is not shipped.
 *   2. The deployed artefact cannot contain it. The site Cloudflare serves is
 *      apps/website/dist/index.html, a self-contained static file. It has no
 *      dependency on expo, and grepping the built output for expo or forge
 *      returns nothing.
 *   3. The vulnerability class is signature forgery against low-exponent RSA
 *      keys. We verify certificates we generated ourselves; we do not verify
 *      signatures from an untrusted party, so there is no attacker-controlled
 *      input to forge against.
 *
 * This is recorded rather than assumed. If @expo/cli starts verifying untrusted
 * signatures, or node-forge reaches the deployed site, this entry is wrong and
 * must be revisited. The advisory is real; the exposure is not.
 *
 * REVISIT WHEN
 * ------------
 * - node-forge publishes a patched version, at which point delete this gate and
 *   update the dependency.
 * - A new high/critical advisory appears anywhere in the tree. It fails loudly.
 */

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const ACK_PATH = resolve(ROOT, 'data/security/known-advisories.json');

const say = (s) => console.log(s);
const problems = [];

/**
 * Advisories accepted as non-exploitable here.
 *
 * Every entry needs an id, a package, and a substantive WHY. An entry with no
 * reason is rejected below rather than silently honoured - that is the whole
 * point of this file existing.
 */
let acknowledgements = [];
try {
  acknowledgements = JSON.parse(readFileSync(ACK_PATH, 'utf8')).advisories || [];
} catch {
  say('no known-advisories file; every high/critical advisory will fail the build');
}

for (const a of acknowledgements) {
  if (!a.why || String(a.why).trim().length < 20) {
    problems.push(
      'known-advisories.json records ' + a.id + ' with no substantive reason. '
        + 'An unexplained acknowledgement is a suppression, not a mitigation.',
    );
  }
}

// Run the real audit and use ITS verdict. This gate re-implements nothing; it
// only decides which of npm's findings are permitted to survive.
//
// spawnSync with shell:true, not execFileSync: on Windows `npm` is a .cmd shim,
// which execFileSync cannot launch (it throws ENOENT with no stdout at all, so
// the failure looks like "audit produced no output" rather than "cannot spawn").
let audit;
const run = spawnSync('npm', ['audit', '--omit=dev', '--json'], {
  encoding: 'utf8',
  shell: true,
  maxBuffer: 32 * 1024 * 1024,
});
try {
  audit = JSON.parse(run.stdout);
} catch {
  say('FAIL could not parse npm audit output');
  say('     npm exit status: ' + run.status);
  say('     If npm is unavailable this gate cannot do its job, and passing');
  say('     silently would make it worse than having no gate at all.');
  process.exit(1);
}

const vulns = audit.vulnerabilities || {};
const counts = (audit.metadata && audit.metadata.vulnerabilities) || {};

say('npm audit: ' + JSON.stringify(counts));

const highRisk = Object.entries(vulns).filter(
  ([, v]) => v.severity === 'high' || v.severity === 'critical',
);

const ghsaOf = (v) =>
  (v.via || [])
    .map((x) => (typeof x === 'string' ? x : x.url || ''))
    .filter((u) => String(u).includes('GHSA-'))
    .map((u) => String(u).split('/').pop());

for (const entry of highRisk) {
  const name = entry[0];
  const v = entry[1];
  const ghsa = ghsaOf(v);

  // A package can reach the advisory two ways:
  //   - directly, with the advisory listed in `via` and its GHSA id visible, or
  //   - transitively, where `via` holds the *name of the package that depends on
  //     it* rather than the advisory. npm does that for every dependent in the
  //     chain, so expo, @expo/cli and @expo/code-signing-certificates all report
  //     the same node-forge advisory and carry no GHSA id of their own.
  //
  // Matching only on GHSA ids would therefore flag one advisory as three
  // unrelated problems, which is how a real finding gets buried in noise.
  const matched = acknowledgements.filter(
    (a) =>
      ghsa.includes(a.id)
      || (a.affectedPackages || []).includes(name)
      || (a.vulnerablePackage === name),
  );

  if (matched.length) {
    say('');
    say('  known  ' + name + ' (' + v.severity + ')');
    say('         affected: ' + (v.range || 'unknown'));
    say('         via ' + (v.via || []).map((x) => (typeof x === 'string' ? x : x.title)).join('; '));
    for (const m of matched) {
      say('         ' + m.id + ' (' + m.cve + '), patched: ' + m.patchedVersions);
      say('         accepted: ' + m.why);
    }
    continue;
  }

  problems.push(
    name + ' (' + v.severity + ') is not a known advisory. Affected: '
      + (v.range || 'unknown range') + '. Fix it, or if it is genuinely not '
      + 'exploitable here, record it in data/security/known-advisories.json '
      + 'WITH A REASON.',
  );
}

say('');
if (problems.length) {
  for (const p of problems) say('FAIL ' + p);
  say('');
  say(problems.length + ' unactioned advisory finding(s)');
  say('');
  say('audit FAILED');
  process.exit(1);
}

say('no new high or critical advisory; ' + highRisk.length + ' high/critical acknowledged');
say('');
say('audit OK');
