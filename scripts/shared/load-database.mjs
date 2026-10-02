/**
 * Builds a real SQLite database from the migrations plus the seed CSVs.
 *
 * ## Why this exists
 *
 * The schema, the 989 curated seed rows and the deployed app were three
 * disconnected things. Replaying every migration against a fresh database
 * produced 24 tables holding 69 rows - none of them from the seeds. Nothing
 * wrote `data/seeds/*.csv` into the schema, so there was no path from the
 * curated data to SQLite or to D1. `docs/DATA-TODO.md` §0.2.
 *
 * ## Why it delegates instead of reimplementing
 *
 * `gates/check-seeds.mjs` already loads every seed CSV into SQLite correctly -
 * in a foreign-key-safe order, with the per-file coercion that the column
 * manifests require. That is 1,300+ lines of validated logic, including the
 * fixes for a UTF-16LE file, multi-line quoted fields, and short rows that would
 * otherwise shift columns silently.
 *
 * Copying it would guarantee the two paths drift, which is the exact failure
 * mode the shared modules exist to prevent. So this runs `check-seeds.mjs`
 * in-process and exports the resulting database handle.
 *
 * The consequence is documented on `buildDatabase()` below, because it is the
 * thing a reader needs before trusting this module.
 */
import { readdirSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

import { sqliteDir, root } from './data.mjs';

/** Where a built database is written. Gitignored - regenerate, do not commit. */
export const DB_PATH = resolve(root, 'data/generated/apex.sqlite');

/**
 * The migration filenames, in the order they must be applied.
 *
 * Sorted by filename because the numeric prefix (001_, 012_, 100_) IS the
 * migration order. Relying on readdir order would be a latent bug.
 */
export function migrationFiles() {
  return readdirSync(sqliteDir).filter((f) => f.endsWith('.sql')).sort();
}

/**
 * Build a populated database, in memory, reusing the seed loader that
 * `npm run seed:check` already proves correct.
 *
 * Why reuse rather than reimplement: check-seeds.mjs contains the
 * foreign-key-safe load order and the per-file coercion the column manifests
 * require, including fixes for a UTF-16LE file, multi-line quoted fields, and
 * short rows that would otherwise shift columns silently. A second copy would
 * drift, and the drift would be silent.
 *
 * The consequence, stated plainly: **this loader is only as correct as the
 * gate.** If `seed:check` passes, the database is populated correctly. That is
 * the point - one implementation, no drift - and it is why `seed:check` runs
 * before anything that consumes the database.
 *
 * @returns {Promise<{db: import('node:sqlite').DatabaseSync,
 *                    problems: string[], notes: string[],
 *                    migrations: string[]}>}
 */
export async function buildDatabase() {
  // Importing runs the load. `isMain` inside that file suppresses its console
  // output and its process.exit, so this is safe from another process.
  const gate = await import('../gates/check-seeds.mjs');
  return {
    db: gate.db,
    problems: gate.problems,
    notes: gate.notes,
    migrations: migrationFiles(),
  };
}

/** Row count per table, for the parity report. */
export function tableCounts(db) {
  const tables = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )
    .all()
    .map((r) => r.name);

  const out = {};
  for (const t of tables) {
    out[t] = db.prepare(`SELECT COUNT(*) AS n FROM "${t}"`).get().n;
  }
  return out;
}

/**
 * Write the built database to disk.
 *
 * `VACUUM INTO` rather than copying the file: the source is an in-memory
 * database, so there is no file to copy. It also compacts the output.
 */
export function writeDatabase(db, path = DB_PATH) {
  mkdirSync(resolve(path, '..'), { recursive: true });
  rmSync(path, { force: true });
  db.exec(`VACUUM INTO '${path.replace(/'/g, "''")}'`);
  return path;
}