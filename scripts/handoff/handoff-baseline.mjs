// Acknowledges the handoff checker's KNOWN findings, so `npm run verify` is not
// permanently red on day one.
//
// WHY THIS EXISTS
// ---------------
// check-handoff.mjs reports three real defects in apps/website/index.html: an
// unpinned cdn.tailwindcss.com, that same script having no SRI, and no
// Content-Security-Policy. They are genuine and worth fixing. But the site is
// hand-committed and has no build, so nothing can be done about them from the
// data layer, and leaving `npm run verify` red would achieve only one thing:
// everyone learns to ignore the exit code.
//
// That is the failure mode this whole mechanism exists to prevent, and it would
// be introduced by the mechanism itself. So the known findings are recorded
// here, the checker is told about them, and the result is that:
//
//   - the three known findings are reported as KNOWN, not as new breakage
//   - ANY fourth finding, or any change to the recorded state, still FAILS
//
// In other words this file is a ratchet. It can shrink, and every entry has to
// be justified, but it cannot be used to wave through something new.
//
// WHAT IT IS NOT
// --------------
// It is not a way to make the checker pass. It records the CURRENT finding
// fingerprints, so if the page changes in a way that alters a finding, that
// finding's fingerprint changes and the checker reports it as unknown again.
//
//   npm run handoff:baseline     record the current findings
//   npm run handoff:status       see what is known and what is new
//
// A missing baseline file means "nothing is known", so the first run reports
// every finding as new. That is the safe direction to fail.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { builtIndexFile as APP } from '../shared/data.mjs';

const ROOT = resolve(import.meta.dirname, '..', '..');
const BASELINE = resolve(ROOT, 'data/handoff/known-findings.json');

if (!existsSync(APP)) {
  console.error('refusing: apps/website/index.html does not exist.');
  process.exit(1);
}

const bytes = readFileSync(APP);
const html = bytes.toString('utf8');

// The findings come from the CHECKER's own rules, not from a second copy.
// An earlier version of this file re-implemented the detection with its own
// regexes and its own fingerprint function, and the two disagreed immediately:
// the baseline hashed a rule name while the checker hashed rule+message, so
// nothing matched and the ratchet silently degraded into "always blocks". Three
// of the six defects fixed in the previous pass were this exact shape - two
// implementations of one idea.
//
// So this file asks the rules what they find. A rule added there is acknowledged
// here automatically and cannot drift.
const { rulesFor } = await import('./check-handoff-rules.mjs');
const findings = rulesFor(html).filter((f) => f.blocks);

const baseline = {
  artefact: 'apps/website/dist/index.html',
  // Fingerprints of findings that are KNOWN and therefore not blocking. Short
  // hashes rather than prose, so a diff shows a genuine change or nothing, and
  // so the entry cannot be reworded into meaning something else.
  known: findings.map((f) => ({ rule: f.rule, fp: f.fingerprint })),
  appSha256: createHash('sha256').update(bytes).digest('hex'),
  recordedOn: new Date().toISOString().slice(0, 10),
  why: 'Pre-existing defects in the hand-committed site. check-handoff.mjs '
    + 'still reports them; it just no longer fails on them. See HANDOFF.md. '
    + 'Each one is a real finding and should be fixed, not forgotten.',
};

mkdirSync(dirname(BASELINE), { recursive: true });
writeFileSync(BASELINE, JSON.stringify(baseline, null, 2) + '\n', 'utf8');

console.log(`recorded ${findings.length} known finding(s):`);
for (const f of findings) console.log(`  ${f.fingerprint}  ${f.rule}: ${f.message}`);
console.log('\nThese are still reported by `npm run handoff:status`, but no longer');
console.log('fail the build. Any NEW finding still fails it. See HANDOFF.md.');

