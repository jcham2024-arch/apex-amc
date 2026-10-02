// One-glance health report for the data repository.
//
//   npm run data:health          human table
//   npm run data:health -- --md  markdown, for pasting into an issue
//
// The question this answers is "how good is the data right now, and what is
// the worst thing about it" - which is a different question from "does it load".
// Everything is a count, because a count is a thing that can go down and be
// shown to have gone down.
//
// A REPORT, never a gate. It exits 0 even when the data is poor, because an
// empty catalog is not a build failure, it is a work queue.
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  listManifests, validateManifest, validateReferences, typedRows, seedDir, root,
} from '../shared/data.mjs';

const md = process.argv.includes('--md');
const manifests = listManifests();
const problems = [];
const rows = [];

for (const m of manifests) {
  const v = validateManifest(m);
  problems.push(...v.problems.map((p) => `${m.dataset}: ${p}`));
  const typed = typedRows(m);
  const cols = Object.keys(m.columns);

  // Fill rate across all cells, and per-column, so a single dense column is
  // not allowed to hide an entirely empty one.
  const perCol = new Map();
  for (const c of cols) {
    const filled = typed.filter((r) => r[c] !== null && r[c] !== undefined).length;
    perCol.set(c, typed.length ? filled / typed.length : 0);
  }
  const allCells = typed.length * cols.length;
  const filledCells = [...perCol.values()].reduce((a, f) => a + f * typed.length, 0);

  // Duplicate primary keys are a silent data-quality problem: they load fine
  // and then two consumers disagree about which row is right.
  const pk = m.primary_key || [];
  const seen = new Map();
  let dupes = 0;
  if (pk.length) {
    for (const r of typed) {
      const k = pk.map((c) => r[c]).join('|');
      if (seen.has(k)) dupes++;
      else seen.set(k, r);
    }
  }

  rows.push({
    dataset: m.dataset,
    files: v.files.length,
    n: typed.length,
    fill: allCells ? filledCells / allCells : 0,
    emptyCols: [...perCol.entries()].filter(([, f]) => f === 0).map(([c]) => c),
    sparseCols: [...perCol.entries()].filter(([, f]) => f > 0 && f < 0.5)
      .map(([c, f]) => `${c}(${Math.round(f * 100)}%)`),
    dupes,
    hasManifest: true,
  });
}

const refProblems = validateReferences(manifests);

// Seed files that have no manifest yet. This is the honest backlog: the
// coverage report says "which manufacturers", this says "which datasets are
// still ungoverned".
function walk(dir, depth = 0) {
  if (!existsSync(dir) || depth > 2) return [];
  const out = [];
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = resolve(dir, f.name);
    if (f.isDirectory()) out.push(...walk(p, depth + 1));
    else if (f.name.endsWith('.csv') && f.name !== '.gitkeep') out.push(p);
  }
  return out;
}
// Only data/seeds is authoritative. data/incoming/ is gitignored staging and is
// deliberately not walked: a file there is not part of the repository, so
// counting it would report health that a fresh clone does not have.
const allCsv = walk(seedDir);
const coveredFiles = new Set(manifests.flatMap((m) => validateManifest(m).files));
const ungoverned = allCsv.filter((f) => !coveredFiles.has(f));

// ------------------------------------------------------------------ output

const pct = (x) => `${Math.round(x * 100)}%`;
const status = (f) => (f >= 0.8 ? 'good' : f >= 0.5 ? 'thin' : f > 0 ? 'sparse' : 'empty');

if (md) {
  console.log('| Dataset | Files | Rows | Populated | Empty cols | Dup keys | State |');
  console.log('|---|---|---|---|---|---|---|');
  for (const r of rows) {
    console.log(`| ${r.dataset} | ${r.files} | ${r.n} | ${pct(r.fill)} | `
      + `${r.emptyCols.length ? r.emptyCols.join(', ') : '-'} | ${r.dupes} | ${status(r.fill)} |`);
  }
} else {
  const w = Math.max(...rows.map((r) => r.dataset.length), 8);
  console.log('dataset'.padEnd(w) + 'files'.padStart(6) + 'rows'.padStart(7)
    + 'populated'.padStart(11) + 'empty'.padStart(7) + 'dupes'.padStart(7) + '  state');
  console.log('-'.repeat(w + 42));
  for (const r of rows) {
    console.log(r.dataset.padEnd(w) + String(r.files).padStart(6) + String(r.n).padStart(7)
      + pct(r.fill).padStart(11) + String(r.emptyCols.length).padStart(7)
      + String(r.dupes).padStart(7) + '  ' + status(r.fill));
  }
  const totalRows = rows.reduce((a, r) => a + r.n, 0);
  const totalFiles = rows.reduce((a, r) => a + r.files, 0);
  console.log('-'.repeat(w + 42));
  console.log('TOTAL'.padEnd(w) + String(totalFiles).padStart(6) + String(totalRows).padStart(7));
}

console.log('');
console.log('per-dataset detail');
for (const r of rows) {
  if (r.emptyCols.length) console.log(`  ${r.dataset}: ${r.emptyCols.length} entirely empty column(s): ${r.emptyCols.join(', ')}`);
  if (r.sparseCols.length) console.log(`  ${r.dataset}: under 50% populated: ${r.sparseCols.join(', ')}`);
  if (r.dupes) console.log(`  ${r.dataset}: ${r.dupes} duplicate primary key(s)`);
}

console.log('');
if (refProblems.length) {
  console.log(`CROSS-DATASET REFERENCES: ${refProblems.length} broken`);
  for (const p of refProblems) console.log(`  x ${p}`);
} else {
  console.log('CROSS-DATASET REFERENCES: all resolve');
}

console.log('');
if (problems.length) {
  console.log(`VALIDATION: ${problems.length} problem(s)`);
  for (const p of problems) console.log(`  x ${p}`);
} else {
  console.log('VALIDATION: clean');
}

console.log('');
if (ungoverned.length) {
  console.log(`NO MANIFEST YET: ${ungoverned.length} of ${allCsv.length} CSV files`);
  for (const f of ungoverned) {
    console.log(`  - ${f.replace(/\\/g, '/').replace(root.replace(/\\/g, '/') + '/', '')}`);
  }
  console.log('  These load, but nothing checks their columns. That is the backlog.');
} else {
  console.log(`NO MANIFEST YET: none - all ${allCsv.length} CSV files are governed`);
}
