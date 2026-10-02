/**
 * Oracle check: our physics must agree with data we did not write.
 *
 * WHY THIS EXISTS
 * ---------------
 * Three ballistics defects shipped while 161 tests passed, because the tests
 * and the implementation were wrong in the same way. Every one of those tests
 * was written by whoever wrote the code it was testing. A suite that shares its
 * author's assumptions cannot catch that author's mistake.
 *
 * data/reference/ exists to break that loop. Its README states the purpose:
 * "external data we check ourselves against ... so that a wrong number in our
 * code can be caught by something we did not write." Until this file existed,
 * 744 rows sat in that directory and NOTHING read them. The oracle was
 * documented but not wired in. See docs/audit/2026-10-02-project-audit.md,
 * PROVEN-1.
 *
 * WHAT IT CHECKS
 * --------------
 * 1. DRAG TABLES (730 rows). The G1/G7 tables in dragTables.ts are
 *    hand-transcribed from McCoy 2012, which was itself verified against three
 *    independent implementations (js-ballistics, py_ballistics). This compares
 *    our transcription against that CSV, value by value, at every Mach point
 *    both cover.
 *
 *    A transcription error is exactly the failure a self-written test cannot
 *    see: the test would be written from the same transcription.
 *
 * 2. ORACLE ROW HYGIENE. Every row must carry a source, a source_ref, and the
 *    stated uncertainty that makes it capable of failing a comparison at all.
 *
 * WHAT IT DELIBERATELY DOES NOT CHECK
 * -----------------------------------
 * It does not run the full solver against measured_data.csv. Those rows need
 * barrel-length scaling, atmosphere state and a muzzle-velocity model before
 * they become comparable, and a comparison that skips those is worse than none
 * - it would manufacture agreement. That is task A1 proper; this gate is the
 * part that can be correct today.
 *
 * It does not check G2/G5/G6/G8/GI/GS/RA4. Those have no corresponding table in
 * our code yet, so there is nothing to compare. When a model is added, its
 * comparison is added here with it.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const REFERENCE_DIR = resolve(ROOT, 'data/reference');
const DRAG_TS = resolve(ROOT, 'packages/ballistics-core/src/drag/dragTables.ts');

const problems = [];
const say = (s) => console.log(s);

/** Minimal RFC4180 CSV row parser. Handles quoted fields with embedded commas. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') field += c;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f !== ''));
}

/**
 * Extract the [mach, cd] pairs from an exported table in dragTables.ts.
 *
 * The declaration is:
 *   export const G1_DRAG_TABLE: readonly (readonly [number, number])[] =
 *     [ [0, 0.2629], ... ] as const;
 *
 * Two traps, both hit while writing this:
 *   - The type annotation contains "[number, number]", so a naive search for
 *     the array literal must not start before the '=' that ends the annotation.
 *   - The pairs are followed by "as const", so the closing bracket we want is
 *     the one that balances the opening bracket, not the first ']'.
 */
function extractTsTable(source, name) {
  const prefix = 'export const ' + name;
  const decl = source.indexOf(prefix);
  if (decl < 0) return null;

  const assign = source.indexOf('=', decl + prefix.length);
  if (assign < 0) return null;
  const open = source.indexOf('[', assign);
  if (open < 0) return null;

  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    const c = source[i];
    if (c === '[') {
      depth += 1;
    } else if (c === ']') {
      depth -= 1;
      if (depth === 0) {
        const pairs = [];
        const body = source.slice(open + 1, i);
        for (const m of body.matchAll(/\[\s*([-\d.eE+]+)\s*,\s*([-\d.eE+]+)\s*\]/g)) {
          pairs.push([Number(m[1]), Number(m[2])]);
        }
        return pairs;
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// 1. Drag tables: our transcription vs the published CSV
// ---------------------------------------------------------------------------

say('checking drag tables against data/reference/drag_tables.csv');

const csvRows = parseCsv(readFileSync(resolve(REFERENCE_DIR, 'drag_tables.csv'), 'utf8'));
const col = Object.fromEntries(csvRows[0].map((h, i) => [h, i]));

const published = new Map();
for (const r of csvRows.slice(1)) {
  const model = r[col.model];
  const mach = Number(r[col.mach]);
  const cd = Number(r[col.cd]);
  if (!model || Number.isNaN(mach) || Number.isNaN(cd)) continue;
  published.set(model + '@' + mach, cd);
}

const tsSource = readFileSync(DRAG_TS, 'utf8');
let compared = 0;
let missing = 0;

for (const pair of [['G1_DRAG_TABLE', 'G1'], ['G7_DRAG_TABLE', 'G7']]) {
  const tsName = pair[0];
  const model = pair[1];
  const table = extractTsTable(tsSource, tsName);
  if (!table) {
    problems.push(
      'could not extract ' + tsName + ' from dragTables.ts. If the declaration '
        + 'was renamed or reformatted, this gate must be updated to match.',
    );
    continue;
  }

  for (const entry of table) {
    const mach = entry[0];
    const cd = entry[1];
    // The tables stop at Mach 4; the CSV runs to 5. Compare the overlap only,
    // and report a missing key rather than inventing one.
    const key = model + '@' + mach;
    if (!published.has(key)) {
      missing += 1;
      continue;
    }
    const want = published.get(key);
    compared += 1;
    // Tables are quoted to 4 decimal places. Compare exactly rather than with a
    // tolerance wide enough to hide a real transcription slip.
    if (Math.abs(cd - want) > 1e-9) {
      problems.push(
        model + ' at Mach ' + mach + ': dragTables.ts has Cd ' + cd + ', but '
          + 'drag_tables.csv has ' + want + '. One of these is wrong. The CSV is '
          + 'cross-verified by three independent implementations, so the '
          + 'TypeScript transcription is the likely defect.',
      );
    }
  }
}

if (missing) {
  problems.push(
    missing + ' table point(s) have no published counterpart in the CSV. The '
      + 'tables stop at Mach 4 and the CSV runs to 5, so tail points are '
      + 'expected; anything beyond that is a real mismatch.',
  );
}

say('  compared ' + compared + ' drag points across G1 and G7');

// ---------------------------------------------------------------------------
// 2. Oracle row hygiene
// ---------------------------------------------------------------------------

say('checking oracle row hygiene');

const REQUIRED = {
  'drag_tables.csv': ['source', 'source_ref'],
  'bullet_reference.csv': ['source', 'source_ref'],
  'measured_data.csv': ['source', 'source_ref', 'uncertainty'],
};

for (const file of Object.keys(REQUIRED)) {
  const required = REQUIRED[file];
  const rows = parseCsv(readFileSync(resolve(REFERENCE_DIR, file), 'utf8'));
  const idx = Object.fromEntries(rows[0].map((h, i) => [h, i]));

  let hasColumn = true;
  for (const key of required) {
    if (idx[key] === undefined) {
      problems.push(file + ' has no "' + key + '" column, so rows cannot be sourced.');
      hasColumn = false;
    }
  }
  if (!hasColumn) continue;

  rows.slice(1).forEach((r, i) => {
    for (const key of required) {
      if ((r[idx[key]] || '').trim() === '') {
        problems.push(
          file + ' row ' + (i + 2) + ': "' + key + '" is empty. An uncited row is '
            + 'not an oracle row - it can never fail a comparison, so it verifies '
            + 'nothing.',
        );
      }
    }
    if (idx.uncertainty !== undefined) {
      const u = (r[idx.uncertainty] || '').trim();
      const notes = (r[idx.notes] || '').trim();
      if (u === '' && !/envelope|NOT an oracle/i.test(notes)) {
        problems.push(
          file + ' row ' + (i + 2) + ': no stated uncertainty. A number with no '
            + 'error bar can never fail a comparison. If this row is an envelope, '
            + 'say so in notes.',
        );
      }
    }
  });
  say('  ' + file + ': ' + (rows.length - 1) + ' rows checked');
}

// ---------------------------------------------------------------------------

if (problems.length) {
  say('');
  for (const p of problems) say('FAIL ' + p);
  say('');
  say(problems.length + ' oracle problem(s)');
  say('');
  say('oracle FAILED');
  process.exit(1);
}

say('');
say('our physics agrees with data/reference at every compared point');
say('');
say('oracle OK');
