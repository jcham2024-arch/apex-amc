// Records the current apps/website/index.html as the approved state.
//
// This is the ONLY way to change the hash that scripts/handoff/check-handoff.mjs
// compares against. That asymmetry is the entire point: a change to the
// shipped artefact has to be a command someone typed, not a side effect of
// working on the data layer.
//
//   npm run handoff:accept              record the current file
//   npm run handoff:accept -- --note "why"
//
// It is deliberately NOT run as part of `npm run verify`. A gate that updates
// its own baseline proves nothing - it would happily re-arm itself over a
// corrupted file, which is the exact failure being defended against. If this
// ran automatically there would be no tripwire, only a mirror.
//
// WHAT IT REFUSES TO DO
// ---------------------
// It does not touch index.html. It records what is there, including the
// outstanding blockers, so a bad state can be recorded deliberately without the
// tool pretending it is good. Run `npm run handoff:status` to see the blockers
// before accepting, and expect them to still be there afterwards.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { builtIndexFile as APP } from '../shared/data.mjs';

const ROOT = resolve(import.meta.dirname, '..', '..');
const MANIFEST = resolve(ROOT, 'data/handoff/app-manifest.json');

const noteArg = process.argv.find((a) => a.startsWith('--note='));

if (!existsSync(APP)) {
  console.error(`refusing: ${APP.replace(ROOT + '\\', '')} does not exist.`);
  console.error('There is nothing to approve, and this script will not create it.');
  process.exit(1);
}

const bytes = readFileSync(APP);
const previous = existsSync(MANIFEST)
  ? JSON.parse(readFileSync(MANIFEST, 'utf8'))
  : null;

const manifest = {
  // What this file is, so a reader does not have to infer it from the path.
  artefact: 'apps/website/dist/index.html',
  role: 'The single-file site deployed to apex-amc.com. BUILT from '
    + 'apps/website/src/ by `npm run website:build`. See HANDOFF.md.',
  sha256: createHash('sha256').update(bytes).digest('hex'),
  bytes: bytes.length,
  // ISO date, so a stale approval is visible rather than silent.
  approvedOn: new Date().toISOString().slice(0, 10),
  note: noteArg ? noteArg.slice('--note='.length) : '',
  // Recorded so an unexplained change is greppable, and so a reviewer can see
  // whether this is the first approval or the fiftieth.
  supersededSha256: previous?.sha256 ?? null,
};

mkdirSync(dirname(MANIFEST), { recursive: true });
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log('recorded the current apps/website/index.html as approved:');
console.log(`  sha256   ${manifest.sha256}`);
console.log(`  bytes    ${manifest.bytes}`);
console.log(`  date     ${manifest.approvedOn}`);
if (manifest.note) console.log(`  note     ${manifest.note}`);
if (previous && previous.sha256 !== manifest.sha256) {
  console.log(`\n  this replaces ${previous.sha256}`);
  console.log('  (was approved ' + previous.approvedOn + ')');
}
console.log('\nThe file itself was not modified. Outstanding blockers still stand:');
console.log('  npm run handoff:status');
