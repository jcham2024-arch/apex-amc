// Security review gate. Scans the deployed main app and the website modules for
// exploitable patterns, and fails `npm run verify` on anything new.
//
// WHAT "EXPLOITABLE" IS TAKEN TO MEAN
// ----------------------------------
// Not "the string innerHTML appears". A sink is a vulnerability only when
// attacker-influenceable data reaches it, so every rule here is about the shape
// of an interpolation or a load, and the consequence is stated for each. A page
// that clears a container with `innerHTML = ''` is not a hole; flagging it
// alongside real injection would train people to scroll past the check.
//
// SCOPE, AND WHY IT IS THIS NARROW
// --------------------------------
// apps/website/index.html is the only file a visitor ever receives.
// apps/website/src/ is the hardened reference the deployed file is supposed to
// be brought in line with. archive/ is never built and never served;
// node_modules is not ours. Widening the scan to those would produce findings
// nobody can act on, which is how a security check gets muted.
//
// WHAT IS DELIBERATELY NOT CHECKED
// ---------------------------------
//   - Whether the page renders, or whether a finding is reachable in a browser.
//     That is a human judgement about the data, and this check will not pretend
//     otherwise. It reports the shape; you judge the reachability.
//   - Third-party response bodies. SRI is verified as present, not as matching.
//   - The npm dependency tree. `npm audit` owns that, and it currently reports
//     0 production vulnerabilities.
//
// The XSS findings in the deployed file are reported, not fixed: the fix
// changes the shipped artefact, which is a human decision recorded through
// `npm run handoff:accept`. See HANDOFF.md and SECURITY.md.
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { securityFindings, loadKnown, SCANNED, KNOWN } from './security-rules.mjs';
import { readJsonFile } from '../shared/encoding.mjs';

const ROOT = resolve(import.meta.dirname, '..', '..');
const BASELINE = resolve(ROOT, 'data/handoff/known-security-findings.json');

const say = (s) => console.log(s);

function main() {
  const findings = [];
  let scanned = 0;

  for (const target of SCANNED) {
    const abs = resolve(ROOT, target.path);
    if (!existsSync(abs)) {
      say(`FAIL missing scan target: ${target.path}`);
      return 1;
    }
    scanned++;
    findings.push(...securityFindings(readFileSync(abs, 'utf8'), target.path));
  }

  const known = loadKnown(
    existsSync(BASELINE) ? readJsonFile(BASELINE) : null,
  );
  for (const f of findings) f.acknowledgeIfKnown(known);

  const blockers = findings.filter((f) => f.blocks);
  const acknowledged = findings.filter((f) => f.severity === KNOWN);

  say('security review');
  say(`  scanned             ${scanned} file(s)`);
  say(`  findings            ${findings.length} (${blockers.length} blocking)`);
  say(`  known/accepted      ${acknowledged.length}`);
  say('');

  if (findings.length === 0) {
    say('  ok   no injection sinks or unpinned remote scripts in scope');
    say('');
    say('security verified');
    return 0;
  }

  for (const f of findings) {
    const tag = f.blocks ? 'BLOCK' : f.severity === KNOWN ? 'known' : 'warn';
    say(`  ${tag.padEnd(5)}  ${f.rule}: ${f.message}`);
    say(`        file: ${f.evidence?.file ?? '?'}`);
    say(`        why:  ${f.consequence}`);
    say('');
  }

  if (acknowledged.length > 0) {
    say(
      `${acknowledged.length} finding(s) recorded in`
      + ' data/handoff/known-security-findings.json.\n'
      + '        They are real and exploitable-shaped; they are listed so the build'
      + ' is not permanently red.\n        Any NEW finding still fails. See SECURITY.md.',
    );
    say('');
  }

  if (blockers.length === 0) {
    say('security verified (with known findings)');
    return 0;
  }

  say(
    `${blockers.length} blocking finding(s). These are new since the last`
    + '\nbaseline, or the baseline is missing. See SECURITY.md for each and for'
    + '\nwhy the data layer may not fix the shipped artefact itself.',
  );
  say('');
  say('security FAILED');
  return 1;
}

process.exit(main());
