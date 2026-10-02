#!/usr/bin/env node
// Builds data/generated/apex.sqlite from the migrations plus the seed CSVs.
//
//   npm run db:local
//
// Closes docs/DATA-TODO.md 0.2a: "npm run db:local produces a .sqlite where
// bullets has 120 rows and powders has 169".
//
// The load itself lives in gates/check-seeds.mjs - this script applies the
// migrations, runs that loader, and writes the result to disk. See
// shared/load-database.mjs for why there is deliberately only one loader.
//
// A non-zero exit means the seed gate found problems. Building a database that
// the gate rejects would produce a file that passes review and is quietly wrong,
// which is the failure mode this script exists to prevent.

import {
  buildDatabase,
  writeDatabase,
  tableCounts,
  DB_PATH,
} from '../shared/load-database.mjs';

const { db, problems, migrations } = await buildDatabase();

console.log(`migrations applied: ${migrations.length}`);
for (const m of migrations) console.log(`  ${m}`);

const counts = tableCounts(db);
const rows = Object.entries(counts);
const total = rows.reduce((n, [, c]) => n + c, 0);
const empty = rows.filter(([, c]) => c === 0);

console.log('\nrows per table:');
for (const [t, c] of rows.sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(c).padStart(5)}  ${t}`);
}
console.log(`\n${rows.length} tables, ${total} rows total`);

if (empty.length) {
  // Not a failure. Some tables are legitimately empty: they describe data this
  // project has not gathered yet. Listing them makes that visible rather than
  // implied, so an empty table is a decision on record, not an oversight.
  console.log(`\n${empty.length} empty table(s) - expected where no seed exists yet:`);
  console.log(`  ${empty.map(([t]) => t).join(', ')}`);
}

// Refuse to write a database the gate rejected.
//
// This ordering is deliberate. An earlier version wrote the file first and
// exited non-zero afterwards, which left a stale, partly-broken apex.sqlite on
// disk after a failed run - and the next run read it back as if it were current.
// During development that made a corrupt build look like a 119-row success.
// Check first, write second: on failure the previous good file survives.
if (problems.length) {
  // stdout, not stderr: Windows PowerShell 5.1 turns a native process's stderr
  // into an ErrorRecord that never reaches this file.
  console.log('\nFAILURES:');
  for (const p of problems) console.log('  x ' + p);
  console.log(`\n${problems.length} problem(s)`);
  console.log(`\nnot writing ${DB_PATH} - the existing file is unchanged`);
  process.exit(1);
}

const path = writeDatabase(db);
console.log(`\nwrote ${path}`);