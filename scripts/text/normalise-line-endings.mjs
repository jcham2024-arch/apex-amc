// Normalise line endings and byte-order marks across the repository's text files.
//
// WHY THIS IS A SCRIPT AND NOT A ONE-LINER
// ----------------------------------------
// An inline PowerShell attempt at this was tried and failed. The comparison
// `($text -replace "\r\n", "\n") -ne $text` is correct, but the rewrite was
// driven from a pipeline whose enumeration had already been captured, so 17 of
// 32 files were reported fixed and were not. The check then kept failing on
// files the operator believed were done - which is worse than not starting,
// because the report says the work is finished.
//
// Same family as the trap in AGENTS.md: a transform whose success is asserted
// rather than re-read. Every file here is written, then re-read from disk, and
// the verification is against the bytes on disk rather than the intent.
//
// SCOPE
// -----
// Markdown only, by default, because that is the documented surface and the
// request this was written for. A repo-wide sweep was measured at 96 files -
// most of the source tree plus package-lock.json, every SQL migration and all
// thirteen column manifests. Those are real .gitattributes violations and they
// ARE worth fixing, but they are a separate change with a separate review, and
// touching migrations and the lockfile inside a documentation pass is exactly
// the scope expansion AGENTS.md rule 9 warns about. `--all` opts in; the number
// is recorded in CHANGELOG.md so the decision is not lost.
//
// Also deliberately NOT:
//   - data/seeds/**  - the seed CSVs. `npm run test:encoding` owns those, it
//     already passes, and a second writer on the same files is a second
//     opinion nobody asked for.
//   - data/generated/** - owned by `npm run data:build`.
//   - archive/**, node_modules/** - not ours.
//   - *.bak - snapshots, deliberately left exactly as they are.
//
// The default is to REPORT and not change. Writing only happens with --write,
// so running this to see the state of the repo cannot modify it.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
// stripBom: the repo's own BOM remover. A second implementation here is how the
// handoff and security baselines drifted apart in fingerprinting; one helper,
// imported.
import { stripBom } from '../shared/encoding.mjs';

const ROOT = resolve(process.cwd());
const WRITE = process.argv.includes('--write');
const ALL = process.argv.includes('--all');
const say = (s) => console.log(s);

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.expo', 'dist', 'build', '.wrangler',
  'archive', 'temp', 'tmp',
]);

/** Areas we do not touch, and why. Printed so the exclusions are auditable. */
const SKIP_PATHS = [
  ['data/seeds/', 'owned by npm run test:encoding, which already passes'],
  ['data/generated/', 'owned by npm run data:build'],
];
const SKIP_SUFFIX = ['.bak'];

/** Markdown only unless --all. See SCOPE above before widening this. */
const SCOPED_EXT = new Set(['.md']);
const WIDE_EXT = new Set([
  '.md', '.mjs', '.js', '.jsx', '.ts', '.tsx', '.json',
  '.yaml', '.yml', '.toml', '.css', '.sql', '.html',
]);
const TEXT_EXT = ALL ? WIDE_EXT : SCOPED_EXT;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/** What, if anything, is wrong with these bytes. Returns null when clean. */
function inspect(buf) {
  const bom = buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
  const text = buf.toString('utf8');
  const bare = text.includes('\r');
  return { bom, bare, text };
}

const all = walk(ROOT).filter((f) => TEXT_EXT.has(f.slice(f.lastIndexOf('.'))));
const changed = [];
const skipped = [];

for (const f of all) {
  const rel = relative(ROOT, f).split('\\').join('/');
  if (SKIP_SUFFIX.some((s) => rel.endsWith(s))) { skipped.push(rel); continue; }
  if (SKIP_PATHS.some(([p]) => rel.startsWith(p))) { skipped.push(rel); continue; }

  const buf = readFileSync(f);
  const { bom, bare, text } = inspect(buf);
  if (!bom && !bare) continue;

  // BUG FIXED 2 Oct 2026: this normalised line endings only. A file carrying
  // nothing but a UTF-8 BOM passed the `if (!bom && !bare) continue` guard in
  // the sense that it was reached, but `fixed` never removed the BOM - reading
  // it as 'utf8' leaves U+FEFF as a character, exactly as the cp1252 mojibake
  // in encoding.mjs cannot strip it. So a BOM-only file was reported "rewritten"
  // and then re-read to reveal it still had a BOM, and the tool failed on its
  // own output. Found by using the tool on a file the tool had just been
  // handed: a PowerShell `Set-Content -Encoding utf8` had added one.
  //
  // `stripBom` is the repo's own helper for this, not a second implementation.
  const fixed = stripBom(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (WRITE) writeFileSync(f, fixed, 'utf8');

  // Re-read from disk. The count we expect is the count we assert, until
  // proven otherwise - the AGENTS.md rule, and the reason the inline attempt
  // above went unnoticed.
  const after = inspect(readFileSync(f));
  const ok = !after.bom && !after.text.includes('\r');
  changed.push({ rel, bom, bare, crlf: (buf.toString('latin1').match(/\r\n/g) || []).length, ok, verified: WRITE });
}

say(`scanned ${all.length} text file(s)`);
for (const [p, why] of SKIP_PATHS) say(`  skipping ${p}* - ${why}`);
say(`  skipping *${SKIP_SUFFIX.join(',*')} - snapshots, left as-is`);
say('');

if (changed.length === 0) {
  say('  ok   every in-scope text file is UTF-8 with no BOM and LF line endings');
  say('');
  say('line endings verified');
  process.exit(0);
}

for (const c of changed) {
  const what = [c.crlf ? `${c.crlf} CRLF` : null, c.bom ? 'BOM' : null].filter(Boolean).join(', ');
  say(`  ${c.verified ? (c.ok ? 'ok  ' : 'FAIL') : 'would fix'}  ${c.rel}  (${what})`);
}

const failed = changed.filter((c) => c.verified && !c.ok);
say('');
if (WRITE) {
  say(
    failed.length
      ? `${changed.length} rewritten, ${failed.length} STILL FAILING verification`
      : `${changed.length} file(s) rewritten and re-read from disk to confirm`,
  );
  say('');
  say(failed.length ? 'line endings FAILED' : 'line endings normalised');
  process.exit(failed.length ? 1 : 0);
} else {
  say(`${changed.length} file(s) need normalising. Re-run with --write to apply.`);
  say('');
  say('line endings: report only (no files changed)');
  process.exit(1);
}
