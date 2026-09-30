// Validates every schema file against real SQLite (node:sqlite, Node 22+).
// Catches syntax errors and FK mistakes before they reach D1.
import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dir = resolve(process.cwd(), 'data/schema');
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
console.log('\nschema + seed verified');

