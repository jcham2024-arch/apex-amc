// Split the cartridge spec monolith into one file per family.
//
// WHY
// data/seeds/cartridge_specs.csv was the largest hand-maintained file in the
// repository - 229 rows in a single file, 212 of them rifle, from one source
// (kwk.us Cartridge Pressure Standards). Adding a row meant editing one file
// that everyone else also edits, and no diff would tell you which cartridge a
// change belonged to. It is now data/seeds/cartridge_specs/<family>.csv, the
// same per-key layout already used for bullets/ and powders/.
//
// WHY FAMILY, NOT CALIBRE
// family is the coarsest split that is still meaningful (rifle/pistol/shotshot),
// it is already a populated column, and it maps onto how the data is used: a
// pressure figure or a CIP/SAAMI dimension belongs to a cartridge, which belongs
// to a family. The finer keys were considered and rejected: parent_case,
// bullet_dia_in, cip_max_bar, rim_dia_in, head_dia_in, capacity_gr_h2o,
// primer_type and typical_twist_in are EMPTY ON ALL 229 ROWS, so neither could
// be used as a filename or as a directory level. Splitting by family also leaves
// room for the future parents/<family>/ split without a second migration.
//
// The manifest becomes csv_dir rather than csv_path, and the loader's existing
// directory walk handles it with no code change - it already merges every *.csv
// in the directory.
//
//   node scripts/split-cartridge-specs.mjs [--dry-run]
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, deleteSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const seedDir = resolve(root, 'data/seeds');
const src = resolve(seedDir, 'cartridge_specs.csv');
const outDir = resolve(seedDir, 'cartridge_specs');
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
  return { header: rows[0], body: rows.slice(1).filter((r) => r.some((v) => v.trim())) };
}

if (!existsSync(src)) {
  console.log('data/seeds/cartridge_specs.csv is already split - nothing to do');
  process.exit(0);
}

// Refuse to overwrite a split that already exists, for the same reason
// promote-powders.mjs does: a silent overwrite loses rows.
const existing = existsSync(outDir)
  ? readdirSync(outDir).filter((f) => f.endsWith('.csv'))
  : [];
if (existing.length) {
  console.error(`refusing to overwrite ${relative(root, outDir)}/ which already has ${existing.length} file(s)`);
  process.exit(1);
}

const { header, body } = readCsv(src);
const famI = header.indexOf('family');
const slugI = header.indexOf('slug');
if (famI === -1 || slugI === -1) {
  console.error('cartridge_specs.csv needs both a "family" and a "slug" column');
  process.exit(1);
}

const esc = (v) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

// Slug is the primary key. A duplicate inside the source would become a silent
// duplicate across two files, so it is a hard failure here rather than a UNIQUE
// violation discovered three layers down.
const slugs = new Map();
for (const r of body) {
  const s = (r[slugI] || '').trim();
  if (!s) { console.error('a row has an empty slug'); process.exit(1); }
  if (slugs.has(s)) { console.error(`duplicate slug "${s}"`); process.exit(1); }
  slugs.set(s, true);
}

const groups = new Map();
for (const r of body) {
  const fam = (r[famI] || '').trim();
  if (!fam) { console.error(`row "${r[slugI]}" has an empty family and cannot be filed`); process.exit(1); }
  if (!groups.has(fam)) groups.set(fam, []);
  groups.get(fam).push(r);
}

console.log(`${relative(root, src)}: ${body.length} rows -> ${groups.size} file(s)`);
for (const [fam, rows] of [...groups].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${fam}.csv`.padEnd(20) + `${rows.length} rows`);
}

if (dryRun) {
  console.log('\n--dry-run: nothing written');
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });
for (const [fam, rows] of groups) {
  const out = resolve(outDir, `${fam}.csv`);
  // LF, matching .gitattributes (`* text=auto eol=lf`).
  writeFileSync(out, [header.join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n') + '\n', 'utf8');
}

const written = readdirSync(outDir).filter((f) => f.endsWith('.csv'));
const actual = written.reduce((n, f) => n + readCsv(resolve(outDir, f)).body.length, 0);
if (actual !== body.length) {
  console.error(`\nFAIL: wrote ${actual} rows, expected ${body.length}`);
  process.exit(1);
}
console.log(`\nverified ${actual} rows across ${written.length} file(s) - every source row accounted for`);

deleteSync(src);
console.log(`removed ${relative(root, src)} - it is now derived from the family files, not the source`);
console.log('next: point cartridge_specs.yaml at csv_dir: data/seeds/cartridge_specs');