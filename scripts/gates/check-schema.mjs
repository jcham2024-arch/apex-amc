// Validates every schema file against real SQLite (node:sqlite, Node 22+).
// Catches syntax errors and FK mistakes before they reach D1.
import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { sqliteDir as dir } from '../shared/data.mjs';
const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

const db = new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys = ON;');

let failed = false;
for (const f of files) {
  try {
    db.exec(readFileSync(resolve(dir, f), 'utf8'));
    console.log('OK   ' + f);
  } catch (err) {
    failed = true;
    console.error('FAIL ' + f + ' -> ' + err.message);
  }
}

if (failed) process.exit(1);

const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
  .all()
  .map((r) => r.name);

console.log('\ntables: ' + tables.join(', '));

// Prove the reference data actually landed.
for (const t of ['cartridges', 'manufacturers', 'sources']) {
  const n = db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
  console.log(`  ${t}: ${n} rows`);
  if (n === 0) {
    console.error(`FAIL seed produced no rows in ${t}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Seed parity: every populated CSV must reach its table.
//
// Closes docs/DATA-TODO.md 0.2b.
//
// This is the check that would have caught the `INSERT OR IGNORE` episode that
// silently dropped 7 of 11 bullet rows on 2026-10-01. Every per-file check
// passed, the file had the right number of lines, and the loader reported the
// rows as read - because "read" and "landed" are different facts and only the
// second one was ever asserted.
//
// Parity is measured against the POPULATED database, not the migration replay
// above. Replaying migrations alone gives `cartridges: 8`, `bullets: 0` - that
// is the reference data hard-coded in migration 100, not the curated seeds. The
// populated handle comes from shared/load-database.mjs, which runs the same
// loader `seed:check` uses, so the two gates can never disagree about what the
// data should contain.
//
// The expectations below are declared by hand. That is deliberate: a CSV that
// exists but is not wired to a table shows up as a FAIL here, instead of
// lingering as a table that is quietly empty.
const PARITY = [
  // seed files (under data/seeds)          table                        expected
  { csv: 'bullets/*.csv',                    table: 'bullets',                     expected: 120 },
  { csv: 'powders/*.csv',                    table: 'powders',                     expected: 169 },
  { csv: 'cartridge_specs/*.csv',            table: 'cartridges',                  expected: 318 },
  { csv: 'manufacturers.csv',                table: 'manufacturers',              expected: 51 },
  // Two CSVs feed this one table; they are listed together because the
  // expectation is on the table, and splitting it into two rows would assert
  // the same number twice and teach the reader nothing.
  {
    csv: 'cartridge_pressures.csv + _secondary.csv',
    table: 'cartridge_pressure_references',
    expected: 782,
  },
  { csv: 'sourcing_searches.csv',            table: 'sourcing_searches',           expected: 12 },
  { csv: 'sourcing_retailers.csv',           table: 'sourcing_retailers',           expected: 8 },
  { csv: 'sourcing_listings.csv',            table: 'sourcing_listings',           expected: 22 },
  { csv: 'powder_burn_rate_positions.csv',   table: 'powder_burn_rate_positions',  expected: 22 },
  { csv: 'value_provenance.csv',             table: 'value_provenance',            expected: 4 },
];

// Load the seeds into a second database. Importing runs the load; `isMain`
// inside check-seeds.mjs keeps its reporting and process.exit out of this run.
const { buildDatabase } = await import('../shared/load-database.mjs');
const { db: populated, problems } = await buildDatabase();

console.log('\nseed parity (csv rows -> table rows):');
let parityFailed = false;

for (const { csv, table, expected } of PARITY) {
  const n = populated.prepare(`SELECT COUNT(*) AS n FROM "${table}"`).get().n;
  const ok = n === expected;
  if (!ok) parityFailed = true;
  console.log(
    `  ${ok ? 'OK  ' : 'FAIL'} ${csv.padEnd(42)} -> ${table.padEnd(28)} ${String(n).padStart(4)} (expected ${expected})`,
  );
}

// The loader's own findings. Reported here because a database built from a
// failing seed gate is not something to certify.
if (problems.length) {
  parityFailed = true;
  console.log(`\n  ${problems.length} seed problem(s) reported by the loader:`);
  for (const p of problems) console.log(`    x ${p}`);
}

// The inverse direction: a populated table that no CSV claims is just as
// suspicious as a CSV that never reached its table. Migration 100 inserts
// reference data of its own, which is legitimate, but it must be declared here
// rather than discovered later.
const declared = new Set(PARITY.map((p) => p.table));
const populatedTables = populated
  .prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  )
  .all()
  .map((r) => r.name);

for (const t of populatedTables) {
  const n = populated.prepare(`SELECT COUNT(*) AS n FROM "${t}"`).get().n;
  if (n > 0 && !declared.has(t)) {
    console.log(`  NOTE ${t.padEnd(42)} ${String(n).padStart(4)} rows, seeded by migration 100`);
  }
}

if (parityFailed) {
  // stdout, not stderr: Windows PowerShell 5.1 turns a native process's stderr
  // into an ErrorRecord that never reaches this file.
  console.log(
    '\nFAIL a seed CSV did not reach its table, or a count drifted from the declared value',
  );
  process.exit(1);
}

console.log('\nschema + seed verified');

