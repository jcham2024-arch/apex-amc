// Promote the harvested powder research drop into the curated seed tree.
//
// WHY THIS EXISTS
// data/incoming/ is gitignored as "research staging", yet six of the seven powder
// brands the loader reads lived only there. A fresh clone loaded 27 of 169 rows,
// so every powder row count, health figure and generated artifact changed with
// the checkout instead of with the data. Merging a gitignored directory into
// authoritative data means the authoritative data cannot be reviewed.
//
// The six files are already one-brand-per-file with the slug matching the
// filename, and their header is identical to the curated set - they were
// produced by split-seeds-by-manufacturer.mjs. So promotion is a copy, not a
// reshape, which keeps this mechanical and auditable.
//
// Checks run before anything is written:
//   - one header across all files (a mismatched column would be lost silently)
//   - no duplicate (manufacturer_slug, product_name) - the manifest's primary key
//   - filename equals manufacturer_slug on every row
//   - no slug already present in the curated set, so nothing is overwritten
//   - each brand's slug resolves in manufacturers.csv
// After copying, the curated set is re-read and the totals are compared against
// what the loader saw before, so a lost row is a hard failure rather than a
// quieter dataset.
//
//   node scripts/promote-powders.mjs [--dry-run]
import { readdirSync, readFileSync, copyFileSync, existsSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const curatedDir = resolve(root, 'data/seeds/powders');
const incomingDir = resolve(root, 'data/incoming/powders');
const dryRun = process.argv.includes('--dry-run');

function readCsv(path) {
  const text = readFileSync(path, 'utf8');
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
      continue;
    }
    if (c === '"') { inQuotes = true; continue; }
    if (c === ',') { row.push(field); field = ''; continue; }
    if (c === '\r') continue;
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return {
    header: rows[0].map((h) => h.trim()),
    body: rows.slice(1).filter((r) => r.some((v) => v.trim())),
  };
}

// relative() returns backslashes on Windows, which would make the curated-vs-
// incoming split below silently match nothing and report 0 curated rows.
const relPath = (p) => relative(root, p).replace(/\\/g, '/');

const csvs = (d) => (existsSync(d) ? readdirSync(d).filter((f) => f.endsWith('.csv')).sort() : []);
const curated = csvs(curatedDir);
const incoming = csvs(incomingDir);

if (!incoming.length) {
  console.log('nothing in data/incoming/powders - already promoted');
  process.exit(0);
}

const problems = [];
// One header everywhere. A per-file difference would make the merge produce rows
// whose columns do not line up, which readCsv would then zip to the wrong names.
const headers = new Map();
for (const [dir, files] of [[curatedDir, curated], [incomingDir, incoming]]) {
  for (const f of files) headers.set(relPath(join(dir, f)), readCsv(join(dir, f)).header.join(','));
}
const distinct = new Set(headers.values());
if (distinct.size !== 1) {
  for (const [f, h] of headers) console.log(`  ${f}\n    ${h}`);
  problems.push(`${distinct.size} different headers across the powder files`);
}

// Every row, from both trees, with its origin recorded.
const all = [];
for (const [dir, files] of [[curatedDir, curated], [incomingDir, incoming]]) {
  for (const f of files) {
    const path = join(dir, f);
    const { header, body } = readCsv(path);
    const slugI = header.indexOf('manufacturer_slug');
    const nameI = header.indexOf('product_name');
    if (slugI === -1 || nameI === -1) {
      problems.push(`${relPath(path)}: missing manufacturer_slug or product_name`);
      continue;
    }
    const fileSlug = f.replace(/\.csv$/, '');
    for (const r of body) {
      const slug = (r[slugI] || '').trim();
      if (slug !== fileSlug) problems.push(`${f}: row says manufacturer_slug="${slug}"`);
      if (!(r[nameI] || '').trim()) problems.push(`${f}: row has an empty product_name`);
      all.push({ slug, name: (r[nameI] || '').trim(), file: relPath(path) });
    }
  }
}

// Primary key (manufacturer_slug, product_name) must be unique - it is what
// UNIQUE(manufacturer_id, name) in data/schema/008 enforces in SQLite.
const seen = new Map();
for (const r of all) {
  const k = `${r.slug}|${r.name}`;
  if (seen.has(k)) problems.push(`duplicate primary key ${k}: ${seen.get(k)} and ${r.file}`);
  else seen.set(k, r.file);
}

// Nothing may be silently overwritten by a promotion.
const curatedSlugs = new Set(curated.map((f) => f.replace(/\.csv$/, '')));
for (const f of incoming) {
  const s = f.replace(/\.csv$/, '');
  if (curatedSlugs.has(s)) problems.push(`${f} already exists in data/seeds/powders - refusing to overwrite`);
}

// Every promoted brand must resolve against the manufacturer directory, or
// validation fails the moment the file becomes authoritative.
const mfr = readCsv(resolve(root, 'data/seeds/manufacturers.csv'));
const mfrSlugI = mfr.header.indexOf('slug');
const knownBrands = new Set(mfr.body.map((r) => (r[mfrSlugI] || '').trim()));
for (const f of incoming) {
  const s = f.replace(/\.csv$/, '');
  if (!knownBrands.has(s)) problems.push(`${f}: "${s}" is not in data/seeds/manufacturers.csv`);
}

if (problems.length) {
  console.error('\nREFUSING TO PROMOTE - fix these first:');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

const before = all.filter((r) => r.file.startsWith('data/seeds')).length;

console.log(`curated  ${curated.length} file(s), ${before} rows`);
console.log(`incoming ${incoming.length} file(s), ${all.length - before} rows`);
console.log(`total    ${all.length} rows across ${new Set(all.map((r) => r.slug)).size} brands`);
console.log('primary key unique, headers match, every brand resolves in manufacturers.csv');

if (dryRun) {
  console.log('\n--dry-run: nothing written');
  process.exit(0);
}

for (const f of incoming) copyFileSync(join(incomingDir, f), join(curatedDir, f));

// Re-read what is actually on disk now. The point is to prove the copy was
// lossless; trusting the row arithmetic alone would miss a truncated write.
const actual = csvs(curatedDir).reduce((n, f) => n + readCsv(join(curatedDir, f)).body.length, 0);
if (actual !== all.length) {
  console.error(`\nFAIL: expected ${all.length} rows on disk, found ${actual}`);
  process.exit(1);
}

console.log(`\nverified ${actual} rows in data/seeds/powders/ across ${curated.length + incoming.length} files`);
console.log('next: drop data/incoming/powders from csv_dirs in data/schemas/powders.yaml');