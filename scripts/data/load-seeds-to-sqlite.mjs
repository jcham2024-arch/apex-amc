#!/usr/bin/env node
// load-seeds-to-sqlite.mjs — build a queryable SQLite database from data/seeds.
//
// WHY
//
// The seeds are CSV. Every question about them is currently a grep or a bespoke script,
// and the answers are neither reproducible nor checkable. A database makes "how many
// cartridges have EMPTY saami_max_psi" one query instead of a script, and it makes empty
// cells VISIBLE - which is this project's core design rule. A blank cell must read as
// unknown rather than as zero, and that is much harder to see in a CSV than in SQL.
//
// WHY node:sqlite AND NOTHING ELSE
//
// Node 24 ships SQLite in core. No dependency, no native build, no lockfile churn.
// docs/DATA-TOOLING.md records that the toolchain here is already sufficient; adding
// better-sqlite3 to save one `require` would be a poor trade.
//
// Usage:
//   node scripts/data/load-seeds-to-sqlite.mjs                 build data/generated/seeds.db
//   node scripts/data/load-seeds-to-sqlite.mjs --out x.db      somewhere else
//   node scripts/data/load-seeds-to-sqlite.mjs --query "..."    build, then ask
//
// The output lands in data/generated/, which is gitignored: a database is a build
// artefact, not source.

import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const SEEDS = join(root, 'data', 'seeds');
const SCHEMA = join(root, 'data', 'schema');
const GENERATED = join(root, 'data', 'generated');

const args = process.argv.slice(2);
const outArg = args.indexOf('--out');
const OUT = outArg >= 0 ? args[outArg + 1] : join(GENERATED, 'seeds.db');
const qArg = args.indexOf('--query');
const QUERY = qArg >= 0 ? args[qArg + 1] : null;

/**
 * Minimal RFC4180 CSV reader: quoted fields, escaped quotes, CRLF.
 *
 * Hand-written rather than pulled in because the seeds are simple, and because a
 * dependency that silently mis-parses a quoted comma in a review quote would corrupt
 * data quietly - the worst kind of bug in a pipeline whose whole value is trustworthiness.
 */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const src = text.replace(/\r\n/g, '\n');

  for (let i = 0; i < src.length; i += 1) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.length && r.some((v) => v.trim() !== ''));
}

/** Table name from a CSV filename: snake_case, never a raw filename. */
const tableName = (file) => basename(file, '.csv')
  .replace(/[^A-Za-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')
  .toLowerCase();

/**
 * SQLite type from the values actually present in the column.
 *
 * Deliberately conservative. Guessing INTEGER for a value like "012345" would silently
 * truncate a part number, and a silently truncated identifier in a reference dataset is
 * the failure this project cares most about avoiding.
 */
function columnType(values) {
  const present = values.filter((v) => v !== '');
  if (!present.length) return 'TEXT';
  if (present.every((v) => /^-?\d+$/.test(v))) return 'INTEGER';
  if (present.every((v) => /^-?\d*\.\d+(e-?\d+)?$/i.test(v))) return 'REAL';
  return 'TEXT';
}

mkdirSync(GENERATED, { recursive: true });
if (existsSync(OUT)) rmSync(OUT);

const db = new DatabaseSync(OUT);

// Schema first, so declared tables and loaded tables can be compared afterwards. A CSV
// whose name matches no migration is still loaded - the CSV is the data of record, and
// the schema is a proposal about it.
const migrationFiles = readdirSync(SCHEMA).filter((f) => f.endsWith('.sql')).sort();
for (const f of migrationFiles) db.exec(readFileSync(join(SCHEMA, f), 'utf8'));

const declared = new Set(db.prepare(
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
).all().map((r) => r.name));

const files = readdirSync(SEEDS).filter((f) => extname(f) === '.csv').sort();
const loaded = [];

for (const file of files) {
  const rows = parseCsv(readFileSync(join(SEEDS, file), 'utf8'));
  if (rows.length < 2) continue;
  const header = rows[0].map((h) => h.trim());
  const body = rows.slice(1);
  const table = tableName(file);

  const cols = header.map((h, i) => ({
    original: h,
    name: h.replace(/[^A-Za-z0-9_]/g, '_').toLowerCase() || `col_${i}`,
    type: columnType(body.map((r) => (r[i] ?? '').trim())),
  }));

  // Table and column names are quoted identifiers even though they are sanitised above:
  // a filename is user-supplied input like any other, and quoting costs nothing.
  db.exec(`DROP TABLE IF EXISTS "${table}"`);
  db.exec(`CREATE TABLE "${table}" (${cols.map((c) => `"${c.name}" ${c.type}`).join(', ')})`);

  const insert = db.prepare(
    `INSERT INTO "${table}" VALUES (${cols.map(() => '?').join(', ')})`,
  );
  db.exec('BEGIN');
  for (const r of body) {
    insert.run(...cols.map((c, i) => {
      const v = (r[i] ?? '').trim();
      // EMPTY stays NULL. Never coerced to 0 or ''. A blank cell means "not recorded",
      // and 0 means "recorded as zero" - collapsing them is the project's named defect.
      if (v === '') return null;
      return c.type === 'INTEGER' || c.type === 'REAL' ? Number(v) : v;
    }));
  }
  db.exec('COMMIT');
  loaded.push({ table, rows: body.length, cols: cols.length, declared: declared.has(table) });
}

// Index the first TEXT column of each loaded table: most questions here are "show me the
// rows for X", and it costs nothing at this scale.
for (const { table } of loaded) {
  const first = db.prepare(`PRAGMA table_info("${table}")`).all().find((c) => c.type === 'TEXT');
  if (first) db.exec(`CREATE INDEX IF NOT EXISTS "idx_${table}_${first.name}" ON "${table}"("${first.name}")`);
}

console.log(`schema: ${migrationFiles.length} migration(s), ${declared.size} table(s) declared`);
console.log(`loaded: ${loaded.length} CSV file(s)`);
for (const l of loaded) {
  const mark = l.declared ? ' ' : '*';
  console.log(` ${mark}${l.table.padEnd(34)} ${String(l.rows).padStart(5)} rows`);
}
const orphans = loaded.filter((l) => !l.declared);
if (orphans.length) {
  console.log(`\n* ${orphans.length} table(s) have no migration. Loaded anyway - the CSV is the`);
  console.log('  data of record - but a migration is missing for each:');
  for (const o of orphans) console.log(`    ${o.table}`);
}

if (QUERY) {
  console.log(`\n--- ${QUERY}\n`);
  try {
    const res = db.prepare(QUERY).all();
    if (!res.length) console.log('(no rows)');
    else {
      const cols = Object.keys(res[0]);
      console.log(cols.join(' | '));
      console.log(cols.map(() => '---').join('-+-'));
      for (const row of res.slice(0, 40)) console.log(cols.map((c) => String(row[c] ?? '')).join(' | '));
      if (res.length > 40) console.log(`... ${res.length - 40} more`);
    }
  } catch (e) {
    console.log(`query failed: ${e.message}`);
    process.exitCode = 1;
  }
}

console.log(`\ndatabase: ${OUT}`);
db.close();