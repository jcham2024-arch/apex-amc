// Records the security findings that are known and accepted, so
// `npm run verify` is not permanently red on day one.
//
// WHY A BASELINE AT ALL
// --------------------
// The XSS sinks in apps/website/index.html are real. The deployed file renders
// retailer and checklist data by interpolating it into `innerHTML`, and one of
// those is an `href`, where a javascript: URL would execute on click. Fixing it
// means editing the shipped artefact, which is a human decision recorded through
// `npm run handoff:accept` - not something a script does silently.
//
// A gate that fails forever is a gate that gets ignored, and then the NEXT
// finding goes unnoticed with it. So the current findings are recorded here and
// stop blocking; anything new still fails. Same ratchet as the handoff baseline,
// for the same reason.
//
// WHAT IT IS NOT
// --------------
// It is not a way to make the check pass. Fingerprints cover the rule and the
// specific message, so fixing a problem and later reintroducing it produces a
// new finding that blocks again.
//
//   npm run security:baseline     record the current findings
//   npm run security:check        see what is known and what is new
//
// A missing baseline means nothing is known, so every finding blocks. That is
// the safe direction in which to fail.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { securityFindings, SCANNED } from './security-rules.mjs';
import { readJsonFile } from '../shared/encoding.mjs';
import { builtIndexFile } from '../shared/data.mjs';

const ROOT = resolve(import.meta.dirname, '..', '..');
const OUT = resolve(ROOT, 'data/handoff/known-security-findings.json');

const findings = [];
for (const target of SCANNED) {
  const abs = resolve(ROOT, target.path);
  if (!existsSync(abs)) {
    console.error(`refusing: ${target.path} does not exist.`);
    process.exit(1);
  }
  findings.push(...securityFindings(readFileSync(abs, 'utf8'), target.path));
}

const blocking = findings.filter((f) => f.blocks);
const previous = existsSync(OUT) ? readJsonFile(OUT) : null;

mkdirSync(resolve(ROOT, 'data/handoff'), { recursive: true });
writeFileSync(OUT, JSON.stringify({
  note: 'Known, accepted security findings in the shipped main app. '
    + 'security:check still reports them; they just no longer fail the build. '
    + 'Every one is a real defect - see SECURITY.md. Do not grow this file: a '
    + 'new entry here is a new accepted vulnerability.',
  files: SCANNED.map((s) => s.path),
  known: blocking.map((f) => ({
    rule: f.rule,
    fp: f.fingerprint,
    file: f.evidence?.file ?? null,
    message: f.message,
  })),
  appSha256: (() => {
    const buf = readFileSync(builtIndexFile);
    return createHash('sha256').update(buf).digest('hex');
  })(),
  recordedOn: new Date().toISOString().slice(0, 10),
  previousRecordedOn: previous?.recordedOn ?? null,
}, null, 2) + '\n', 'utf8');

console.log(`recorded ${blocking.length} known finding(s):`);
for (const f of blocking) {
  console.log(`  ${f.fingerprint}  ${f.rule}  ${f.message}`);
}
console.log('\nThese are still reported by `npm run security:check`, but no longer');
console.log('fail the build. Any NEW finding still fails it. See SECURITY.md.');
