// Repairs cp1252 mojibake in a file, with a backup and an idempotency guard.
//
//   node scripts/repair-encoding.mjs --dry-run README.md   report only, writes nothing
//   node scripts/repair-encoding.mjs README.md             repair in place
//
// ALWAYS dry-run first and read the output. This rewrites real content files,
// so it should never be a thing you can fire off blind.
//
// Safety properties:
//   - refuses to run if a backup already exists (so it cannot run twice)
//   - refuses to write if the repair is not idempotent
//   - strips a leading BOM, which is a real byte order mark and not damage
//   - only ever changes sequences that are genuinely mojibake
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { repairMojibake } from '../shared/encoding.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const files = args.filter((a) => !a.startsWith('--'));
if (!files.length) {
  console.error('usage: node scripts/repair-encoding.mjs [--dry-run] <file...>');
  process.exit(1);
}

/** Renders a string as code points, so the console cannot mis-render it. */
const cp = (s) => [...s].map((ch) => {
  const n = ch.codePointAt(0);
  return n > 127 ? `<U+${n.toString(16).toUpperCase().padStart(4, '0')}>` : ch;
}).join('');

let failed = false;

for (const f of files) {
  const backup = `${f}.pre-encoding-fix.bak`;

  // The "already applied" guard comes FIRST, before the "nothing to repair"
  // shortcut. Otherwise a second run reports CLEAN and exits 0, and the caller
  // never learns the file was already handled.
  if (existsSync(backup)) {
    console.error(`REFUSING ${f} - ${backup} already exists, this file has already been repaired.`);
    failed = true;
    continue;
  }

  const original = readFileSync(f, 'utf8');
  const hadBom = original.charCodeAt(0) === 0xfeff;
  const body = hadBom ? original.slice(1) : original;
  const { text: fixed, repaired } = repairMojibake(body);

  if (repaired === 0) {
    console.log(`CLEAN ${f} - nothing to repair`);
    continue;
  }

  const before = body.split(/\r?\n/);
  const after = fixed.split(/\r?\n/);
  const changed = before.filter((l, i) => l !== after[i]).length;
  console.log(`\n${f}: ${repaired} sequence(s) across ${changed} line(s)${hadBom ? ' + BOM' : ''}`);
  let shown = 0;
  for (let i = 0; i < before.length && shown < 10; i++) {
    if (before[i] === after[i]) continue;
    console.log(`  ${i + 1} before: ${cp(before[i]).trim().slice(0, 110)}`);
    console.log(`  ${i + 1} after : ${cp(after[i]).trim().slice(0, 110)}`);
    shown++;
  }
  if (changed > shown) console.log(`  ... and ${changed - shown} more line(s)`);

  if (dryRun) {
    console.log('  (dry run - nothing written)');
    continue;
  }

  if (repairMojibake(fixed).repaired !== 0) {
    console.error('  REFUSING: repair is not idempotent');
    failed = true;
    continue;
  }

  copyFileSync(f, backup);
  writeFileSync(f, fixed, 'utf8');
  console.log(`  FIXED - backup at ${backup}`);
}

process.exit(failed ? 1 : 0);
