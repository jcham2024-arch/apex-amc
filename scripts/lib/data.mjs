// Shared manifest loading, CSV reading, validation and type coercion.
//
// One module, used by build-data.mjs (validation + generation) and by
// check-seeds.mjs (validation only, so the build gate applies exactly the same
// rules as the generators - there is no second implementation to drift).
//
// The column manifests in data/schemas/*.yaml are the authoritative definition
// of what each column means. They exist because 7 of 11 bullet rows were being
// silently dropped on 2026-10-01: the rules lived in a SQL CHECK constraint
// three files from the data, and INSERT OR IGNORE swallowed the violations.
// Moving the rules next to the data is what makes them effective.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { parse } from 'yaml';

export const root = resolve(import.meta.dirname, '..', '..');
export const schemaDir = resolve(root, 'data/schemas');

// --------------------------------------------------------------- CSV reader

// RFC-4180. The seed data genuinely needs it: cartridge names contain commas
// and escaped quotes (".500 NE 3""", '12 gauge 3 1/2" mag'), so split(',')
// is not merely inelegant, it is wrong.
export function readCsv(path) {
  if (!existsSync(path)) return { header: [], body: [] };
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
  if (!rows.length) return { header: [], body: [] };
  const header = rows[0].map((h) => h.trim());
  return { header, body: rows.slice(1).filter((r) => r.some((v) => v.trim())) };
}

// ------------------------------------------------------------- manifests

export function loadManifest(name) {
  const p = resolve(schemaDir, `${name}.yaml`);
  if (!existsSync(p)) return null;
  const m = parse(readFileSync(p, 'utf8'));
  m.__path = p;
  m.__name = name;
  return m;
}

export function listManifests() {
  if (!existsSync(schemaDir)) return [];
  return readdirSync(schemaDir)
    .filter((f) => f.endsWith('.yaml'))
    .sort()
    .map((f) => loadManifest(f.replace(/\.yaml$/, '')))
    .filter(Boolean);
}

// A manifest may point at a single file (csv_path), one directory of
// per-manufacturer files (csv_dir), or several directories that are merged
// (csv_dirs) - which is how powders is drawn from both the curated set and the
// research drop.
export function manifestFiles(m) {
  const out = [];
  if (m.csv_path) {
    const p = resolve(root, m.csv_path);
    if (existsSync(p)) out.push(p);
  }
  const dirs = [
    ...(m.csv_dir ? [m.csv_dir] : []),
    ...(Array.isArray(m.csv_dirs) ? m.csv_dirs : []),
  ];
  for (const d of dirs) {
    const abs = resolve(root, d);
    if (!existsSync(abs)) continue;
    for (const f of readdirSync(abs).filter((x) => x.endsWith('.csv')).sort()) {
      out.push(join(abs, f));
    }
  }
  return out;
}

// ------------------------------------------------------------- coercion

// Blank is null, not "". This distinction runs through the whole pipeline: an
// empty cell means "we do not know", which is different from a cell holding the
// empty string, and the 012 provenance layer depends on telling them apart.
export function coerce(value, spec) {
  if (value === undefined || value === null) return null;
  const v = String(value).trim();
  if (v === '') return null;

  switch (spec?.type) {
    case 'integer': {
      const n = Number(v);
      if (!Number.isInteger(n)) return { __invalid: `expected an integer, got "${v}"` };
      return n;
    }
    case 'number': {
      const n = Number(v);
      if (!Number.isFinite(n)) return { __invalid: `expected a number, got "${v}"` };
      return n;
    }
    case 'boolean': {
      const l = v.toLowerCase();
      if (['true', 'yes', '1'].includes(l)) return true;
      if (['false', 'no', '0'].includes(l)) return false;
      return { __invalid: `expected a boolean, got "${v}"` };
    }
    case 'date': {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return { __invalid: `expected YYYY-MM-DD, got "${v}"` };
      return v;
    }
    default:
      // Strings stay strings. Part numbers and SKUs are numeric-looking but are
      // identifiers: coercing "065147" to 65147 destroys a leading zero and
      // breaks the join to the component finder.
      return v;
  }
}

// ------------------------------------------------------------ validation

// Validates one row against a manifest. Returns human-readable problems;
// empty means the row is fine.
export function validateRow(row, manifest, where) {
  const problems = [];
  const cols = manifest.columns || {};

  for (const [col, spec] of Object.entries(cols)) {
    const val = coerce(row[col], spec);
    const isBlank = val === null;

    if (spec.required && isBlank) {
      problems.push(`${where}: "${col}" is required but empty`);
      continue;
    }
    if (isBlank) continue;
    if (isCoercionError(val)) {
      problems.push(`${where}: "${col}" ${val.__invalid}`);
      continue;
    }
    if (spec.enum && !spec.enum.includes(String(val))) {
      const hint = spec.note ? `  -- ${spec.note.split('.')[0].trim()}.` : '';
      problems.push(`${where}: "${col}" = "${val}" is not permitted. Allowed: ${spec.enum.join(', ')}${hint}`);
    }
    if (spec.pattern && !new RegExp(spec.pattern).test(String(val))) {
      problems.push(`${where}: "${col}" = "${val}" does not match ${spec.pattern}`);
    }
    if (spec.minimum !== undefined && Number(val) < spec.minimum) {
      problems.push(`${where}: "${col}" = ${val} is below the plausible minimum ${spec.minimum}`);
    }
    if (spec.maximum !== undefined && Number(val) > spec.maximum) {
      problems.push(`${where}: "${col}" = ${val} is above the plausible maximum ${spec.maximum}`);
    }
  }

  // A column present in the CSV but absent from the manifest is almost always a
  // header typo - and a typo is how the column-shift bug started.
  for (const col of Object.keys(row)) {
    if (!(col in cols)) {
      problems.push(`${where}: column "${col}" is not defined in the manifest - check the header for a typo`);
    }
  }

  return problems;
}

// Validates every file a manifest points at.
export function validateManifest(m) {
  const problems = [];
  const files = manifestFiles(m);
  if (!files.length) {
    return { problems: [`${m.__name}: manifest points at no existing files`], files, rows: [] };
  }

  const allRows = [];
  for (const f of files) {
    const { header, body } = readCsv(f);
    const rel = f.replace(/\\/g, '/').replace(root.replace(/\\/g, '/') + '/', '');
    if (!body.length) continue;

    // Per-manufacturer layout: the filename IS the manufacturer slug, and a
    // row whose manufacturer_slug disagrees is a misattribution. The most
    // likely mistake when working this way is pasting a row into a
    // competitor's file.
    //
    // The row is still a positional ARRAY here, so the column has to be found
    // by NAME first. Indexing r[key] directly would read undefined whenever the
    // key isn't the 0th column, and the guard would silently never fire.
    const key = m.filename_is || null;
    if (key) {
      const ki = header.indexOf(key);
      const expected = f.split(/[\\/]/).pop().replace(/\.csv$/, '');
      if (ki === -1) {
        problems.push(`${rel}: manifest says filename_is=${key} but the CSV has no such column`);
      } else {
        for (const r of body) {
          const got = String(r[ki] || '').trim();
          if (got && got.toLowerCase() !== expected) {
            problems.push(`${rel}: contains a row for "${got}" but this file is for "${expected}" only`);
          }
        }
      }
    }

    for (const [i, r] of body.entries()) {
      // Zip the HEADER names to the row's values by position. Iterating the
      // header's own index here would silently mislabel every column.
      const obj = {};
      for (let c = 0; c < header.length; c++) obj[header[c]] = r[c] ?? '';
      // Ragged rows are the column-shift failure mode; report them explicitly.
      if (r.length !== header.length) {
        problems.push(`${rel} line ${i + 2}: ${r.length} fields but the header has ${header.length} - a value is missing or unquoted`);
      }
      const where = `${rel} line ${i + 2}`;
      problems.push(...validateRow(obj, m, where));
      allRows.push({ row: obj, file: rel, line: i + 2 });
    }
  }

  return { problems, files, rows: allRows };
}

// Coerced, manifest-typed rows - the shape the JSON output uses. Numbers are
// numbers, blanks are null, and the provenance of each row is carried along.
export function typedRows(m) {
  const { rows } = validateManifest(m);
  return rows.map(({ row, file, line }) => {
    const out = { _source: file, _line: line };
    for (const [col, spec] of Object.entries(m.columns || {})) {
      const v = coerce(row[col], spec);
      out[col] = isCoercionError(v) ? null : v;
    }
    return out;
  });
}

// ------------------------------------------------------- cross-dataset refs
//
// Row-level validation cannot catch a value that is perfectly well-formed but
// points at something that does not exist. A slug matching /^[a-z0-9-]+$/ and
// absent from manufacturers.csv is still an orphan, and it is invisible to
// every check in validateManifest().
//
// This is not hypothetical: six powder brands were referenced by powder data and
// missing from the manufacturer directory, orphaning 98 of 169 rows, while
// every per-file check passed clean.
//
// A manifest declares its own outbound references:
//
//   references:
//     - column: manufacturer_slug   # the column in THIS dataset
//       dataset: manufacturers      # the dataset it must resolve in
//       target_column: slug         # ...and the column over there
//
// `required: true` (the default) means every value must resolve. A deliberately
// optional reference - a slug that may legitimately not exist yet - says so.
export function validateReferences(manifests) {
  const problems = [];
  const byName = new Map(manifests.map((m) => [m.__name, m]));

  // A cache so a dataset referenced by several others is only parsed once.
  const keyCache = new Map();
  function keysOf(target, col) {
    const k = `${target.__name}.${col}`;
    if (!keyCache.has(k)) {
      keyCache.set(k, new Set(
        validateManifest(target).rows
          .map((r) => String(r.row[col] ?? '').trim())
          .filter(Boolean),
      ));
    }
    return keyCache.get(k);
  }

  for (const m of manifests) {
    for (const ref of m.references || []) {
      const target = byName.get(ref.dataset);
      const tcol = ref.target_column;
      if (!target) {
        problems.push(`${m.dataset}.${ref.column}: references unknown dataset "${ref.dataset}"`);
        continue;
      }
      if (!ref.column || !(ref.column in (m.columns || {}))) {
        problems.push(`${m.dataset}: reference column "${ref.column}" is not a column in this manifest`);
        continue;
      }
      if (!tcol || !(tcol in (target.columns || {}))) {
        problems.push(`${m.dataset}: target ${ref.dataset} has no column "${tcol}"`);
        continue;
      }

      const known = keysOf(target, tcol);
      // Count distinct missing values, and how many rows each one costs, so
      // the report says "98 rows" rather than "6 problems".
      const missing = new Map();
      for (const { row, file, line } of validateManifest(m).rows) {
        const v = String(row[ref.column] ?? '').trim();
        if (!v || known.has(v)) continue;
        if (!missing.has(v)) missing.set(v, { n: 0, where: `${file} line ${line}` });
        missing.get(v).n++;
      }

      const optional = ref.required === false;
      for (const [v, { n, where }] of [...missing].sort((a, b) => b[1].n - a[1].n)) {
        const msg = `${m.dataset}: ${n} row(s) reference ${v}, which does not exist in `
          + `${ref.dataset}.${tcol} (first at ${where})`;
        if (optional) {
          problems.push(`(optional) ${msg}`);
        } else {
          problems.push(msg + ' - add it to that dataset, or mark the reference required: false');
        }
      }
    }
  }

  return problems;
}


export const isCoercionError = (x) => !!x && typeof x === 'object' && '__invalid' in x;

