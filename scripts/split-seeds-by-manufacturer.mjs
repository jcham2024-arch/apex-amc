// One-off: split the monolithic per-component seed CSVs into one file per
// manufacturer, under a directory named for the component type.
//
//   data/seeds/bullets.csv   ->  data/seeds/bullets/sierra.csv, hornady.csv, ...
//   data/seeds/powders.csv   ->  data/seeds/powders/vihtavuori.csv
//
// Run once, then delete. Kept in scripts/ rather than done by hand so the
// transform is auditable and repeatable, and so the row counts can be checked
// before and after.
//
//   node scripts/split-seeds-by-manufacturer.mjs [--dry-run]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const seedDir = resolve(root, 'data/seeds');
const incomingDir = resolve(root, 'data/incoming');
const dryRun = process.argv.includes('--dry-run');

// component type -> { source file, key column, which directory tree }
const TARGETS = [
  { type: 'bullets', file: 'bullets.csv', key: 'manufacturer_slug', base: seedDir },
  { type: 'powders', file: 'powders.csv', key: 'manufacturer_slug', base: seedDir },
  // data/incoming/ holds the raw research drop (gitignored). Splitting it the
  // same way keeps the two trees structurally identical, so a maker's powder
  // data is one file to edit whether it was curated or freshly researched.
  { type: 'powders', file: 'powders.csv', key: 'manufacturer_slug', base: incomingDir },
];

// Same RFC-4180 reader the loader uses. These files have quoted fields with
// embedded commas, so split(',') is not safe.
function readCsv(path) {
  const text = readFileSync(path, 'utf8');
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"') { inQuotes = true; continue; }
    if (c === ',') { row.push(field); field = ''; continue; }
    if (c === '\r') continue;
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const header = rows[0];
  const body = rows.slice(1).filter((r) => r.some((v) => v !== ''));
  return { header, body };
}

const esc = (v) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

for (const { type, file, key, base } of TARGETS) {
  const src = resolve(base, file);
  if (!existsSync(src)) {
    console.log(`skip ${file} (not present)`);
    continue;
  }

  const { header, body } = readCsv(src);
  const keyIdx = header.indexOf(key);
  if (keyIdx === -1) {
    console.error(`FAIL ${file}: no "${key}" column`);
    process.exitCode = 1;
    continue;
  }

  // Group by manufacturer slug, preserving first-seen order for stable output.
  const groups = new Map();
  for (const r of body) {
    const slug = (r[keyIdx] || '').trim();
    if (!slug) {
      console.error(`FAIL ${file}: a row has an empty ${key}`);
      process.exitCode = 1;
      continue;
    }
    if (!groups.has(slug)) groups.set(slug, []);
    groups.get(slug).push(r);
  }

  const outDir = resolve(base, type);
  console.log(`\n${relative(root, src)}: ${body.length} rows -> ${groups.size} files in ${relative(root, outDir)}/`);

  // Filenames are lowercased to match the slug convention. If a row's
  // manufacturer_slug disagrees in case, that is reported rather than silently
  // normalised - it is a real referential-integrity bug in SQLite, and hiding it
  // here would only defer the failure to a confusing place later.
  const caseIssues = [];

  let written = 0;
  for (const [slug, rows] of groups) {
    const fileSlug = slug.toLowerCase();
    if (fileSlug !== slug) caseIssues.push(`  ${slug} -> written as ${fileSlug}.csv, but the rows still say "${slug}"`);

    const out = resolve(outDir, `${fileSlug}.csv`);
    const content = [header.join(','), ...rows.map((r) => r.map(esc).join(','))].join('\r\n') + '\r\n';
    if (!dryRun) {
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, content, 'utf8');
    }
    written += rows.length;
    console.log(`  ${type}/${fileSlug}.csv`.padEnd(34) + `${rows.length} rows`);
  }

  if (written !== body.length) {
    console.error(`FAIL ${file}: wrote ${written} of ${body.length} rows`);
    process.exitCode = 1;
  } else {
    console.log(`  total ${written} rows (matches source)`);
  }

  if (caseIssues.length) {
    console.log('  CASE MISMATCH (fix the manufacturer_slug column in the source data):');
    for (const c of caseIssues) console.log(c);
  }

  if (!dryRun && !existsSync(resolve(outDir, '.gitkeep'))) {
    // Leave a marker so the directory survives in git even while empty, which
    // matters for the powders/ and primers/ dirs we have not filled yet.
    writeFileSync(resolve(outDir, '.gitkeep'), '', 'utf8');
  }
}

if (dryRun) {
  console.log('\n--dry-run: nothing written');
} else {
  console.log('\nDone. The original flat files are left in place on purpose -');
  console.log('check-seeds.mjs reads the new directories, and the flat files are');
  console.log('removed only after the row counts are confirmed to match.');
}
