// Scans the repo's text files for cp1252 mojibake and reports what is affected.
// Writes nothing - inspect the report, then repair deliberately.
//
//   npm run text:scan
//
// Run with --check in CI: exits non-zero if any file is damaged, which stops
// the damage from being re-committed after a Windows editor touches the tree.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { repairMojibake } from '../shared/encoding.mjs';

const ROOT = process.cwd();
const SKIP = new Set(['node_modules', '.git', 'dist', 'build', '.expo', 'temp', 'archive', 'tmp', 'coverage']);
const EXT = new Set(['.md', '.mjs', '.js', '.json', '.yaml', '.yml', '.csv', '.sql', '.ts', '.tsx', '.jsx', '.html', '.txt']);
const MAX_BYTES = 8_000_000;

/** Renders a string as code points, so the console cannot mis-render it. */
const cp = (s) => [...s].map((ch) => {
  const n = ch.codePointAt(0);
  return n > 127 ? `<U+${n.toString(16).toUpperCase().padStart(4, '0')}>` : ch;
}).join('');

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (SKIP.has(e.name) || e.name.endsWith('.pre-encoding-fix.bak')) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (EXT.has(extname(e.name))) {
      try { if (statSync(p).size < MAX_BYTES) out.push(p); } catch { /* skip unreadable */ }
    }
  }
  return out;
}

const files = walk(ROOT);
const affected = [];
for (const f of files) {
  let text;
  try { text = readFileSync(f, 'utf8'); } catch { continue; }
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const { repaired } = repairMojibake(text);
  if (repaired > 0) affected.push({ file: relative(ROOT, f), repaired, text });
}

affected.sort((a, b) => b.repaired - a.repaired);

const check = process.argv.includes('--check');
const out = [
  `scanned ${files.length} text files`,
  `files with mojibake: ${affected.length}`,
  '',
];
for (const a of affected) {
  out.push(`  ${String(a.repaired).padStart(4)}  ${a.file}`);
  // Show the first couple of offending lines so the report is actionable
  // without needing a second command.
  const { text: fixed } = repairMojibake(a.text);
  const before = a.text.split(/\r?\n/);
  const after = fixed.split(/\r?\n/);
  let shown = 0;
  for (let i = 0; i < before.length && shown < 2; i++) {
    if (before[i] === after[i]) continue;
    out.push(`        line ${i + 1} before: ${cp(before[i]).trim().slice(0, 100)}`);
    out.push(`        line ${i + 1} after : ${cp(after[i]).trim().slice(0, 100)}`);
    shown++;
  }
}

// Written to stdout, but each non-ASCII char is rendered as <U+XXXX> so a
// PowerShell console cannot garble the very characters being reported.
console.log(out.join('\n'));
console.log(affected.length
  ? `\nrun: node scripts/repair-encoding.mjs <file>   (inspect the dry run first)`
  : '\nno mojibake found');
process.exit(check && affected.length ? 1 : 0);
