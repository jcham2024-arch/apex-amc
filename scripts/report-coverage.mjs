// Per-manufacturer data coverage, derived from the CSVs themselves.
//
// The point of this file: nobody should have to grep nine CSVs to answer
// "where are we?". It reads the seed/incoming data, cross-references it
// against manufacturers.csv and the component classes each maker is
// declared to make, and prints a status table.
//
// This is a REPORT, not a gate. It never edits data and never fails the
// build - "Sierra has 0 powder rows" is a true and useful fact, not an error.
//
//   node scripts/report-coverage.mjs          # human table
//   node scripts/report-coverage.mjs --md     # markdown, for the guide
//   node scripts/report-coverage.mjs --csv    # machine-readable
//
// Design note: coverage is COMPUTED, never hand-maintained. A status column
// typed by hand into a spreadsheet goes stale the moment someone adds a row
// to bullets.csv. Deriving it means the answer is always current.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const seedDir = resolve(root, 'data/seeds');

const format = process.argv.includes('--md') ? 'md'
  : process.argv.includes('--csv') ? 'csv'
  : 'table';

// ----------------------------------------------------------------- CSV read

// Minimal RFC-4180 reader. The seed files use CRLF, quoted fields, and
// embedded escaped quotes (`".500 NE 3"""`), so split(',') is not safe.
function readCsv(path) {
  if (!existsSync(path)) return [];
  let text = readFileSync(path, 'utf8');
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
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
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1)
    .filter((r) => r.some((v) => v !== ''))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));
}

const seeds = (f) => readCsv(resolve(seedDir, f));

// Component data lives one file per manufacturer under data/<tree>/<type>/.
// Counting files is how coverage is measured: a maker's coverage IS whether
// their file exists and what is in it, which is why the split was done this
// way rather than as one table per component type.
function componentFiles(type, base) {
  const dir = resolve(base, type);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.csv')).sort()
    .map((f) => resolve(dir, f));
}

// Only data/seeds is walked. data/incoming/ is gitignored staging, so including
// it would report coverage a fresh clone does not have - which is how the
// powder split hid 142 untracked rows behind a 169-row total.
const componentRows = (type) => componentFiles(type, seedDir).flatMap((f) => readCsv(f));

// ------------------------------------------------------------------- data

const manufacturers = seeds('manufacturers.csv');
const bullets = componentRows('bullets');
const powders = componentRows('powders');
const burnPositions = seeds('powder_burn_rate_positions.csv');
const conflicts = seeds('cartridge_pressure_conflicts.csv');

// Component classes a *manufacturer* can supply product rows for, matching the
// `manufacturer_kinds` enum in data/schema/006. Cartridge dimensions and
// pressure figures are keyed on the cartridge rather than on who made the
// case, so they are reported separately below, not per-manufacturer.
const KINDS = ['bullet', 'powder', 'brass', 'primer', 'ammo', 'shotshell'];

// Rows keyed by manufacturer, case-folded. Seed files are inconsistent about
// case (bullets.csv says "Hornady"), so normalise on the way in - the point
// is to report the truth, not to hide the casing bug. That bug still shows up
// as an orphan-manufacturer warning at the bottom.
const norm = (s) => String(s || '').trim().toLowerCase();

function countBy(rows, field, into = new Map()) {
  for (const r of rows) {
    const k = norm(r[field]);
    if (k) into.set(k, (into.get(k) || 0) + 1);
  }
  return into;
}

const bulletCounts = countBy(bullets, 'manufacturer_slug');
const powderCounts = countBy(powders, 'manufacturer_slug');

const burnBrands = new Set(burnPositions.map((r) => norm(r.brand)));

// ------------------------------------------------------------- build table

const rows = [];
for (const m of manufacturers) {
  const slug = norm(m.slug);
  const kinds = String(m.kinds || '').split(';').map((s) => s.trim()).filter(Boolean);
  const cells = {
    bullet: bulletCounts.get(slug) || 0,
    powder: powderCounts.get(slug) || 0,
    // No seed file exists yet for these. Report 0 so "declared but empty"
    // is visible rather than silently absent from the table.
    brass: 0, primer: 0, ammo: 0, shotshell: 0,
  };

  const relevant = KINDS.filter((k) => kinds.includes(k));
  const missing = relevant.filter((k) => cells[k] === 0);

  // status is derived from the data, never stored
  const status = !relevant.length ? 'n/a'
    : missing.length === 0 ? 'done'
    : relevant.some((k) => cells[k] > 0) ? 'partial'
    : 'not started';

  rows.push({
    slug: m.slug,
    name: m.name,
    region: m.region,
    kinds: relevant.join(';') || '(none declared)',
    cells,
    status,
    missing: missing.join(';'),
    burn: burnBrands.has(slug) ? 'yes' : '',
  });
}

const order = { 'not started': 0, partial: 1, done: 2, 'n/a': 3 };
rows.sort((a, b) => (order[a.status] - order[b.status]) || a.slug.localeCompare(b.slug));

// ------------------------------------------------- referential integrity

const knownSlugs = new Set(manufacturers.map((m) => norm(m.slug)));
const orphans = new Map();
for (const [label, rowsIn] of [
  ['bullets/', bullets],
  ['powders/', powders],
]) {
  for (const r of rowsIn) {
    const k = norm(r.manufacturer_slug);
    if (k && !knownSlugs.has(k)) {
      if (!orphans.has(k)) orphans.set(k, new Set());
      orphans.get(k).add(`${label}: ${r.manufacturer_slug}`);
    }
  }
}

const unresolved = conflicts.filter((c) => norm(c.resolution) === 'unresolved');

// Field-level provenance annotations, if the optional seed is present.
const provRows = seeds('value_provenance.csv');
const provByTier = new Map();
for (const r of provRows) {
  const t = norm(r.tier) || '(blank)';
  provByTier.set(t, (provByTier.get(t) || 0) + 1);
}

// ------------------------------------------------------------------ output

const totals = rows.reduce((acc, r) => {
  acc[r.status] = (acc[r.status] || 0) + 1;
  for (const k of KINDS) acc[k] = (acc[k] || 0) + r.cells[k];
  return acc;
}, {});

const statusLine = ['done', 'partial', 'not started', 'n/a']
  .map((s) => `${s}=${totals[s] || 0}`).join('  ');
const componentLine = KINDS.map((k) => `${k}=${totals[k] || 0}`).join('  ');

if (format === 'csv') {
  const out = [['slug', 'name', 'region', 'declared_kinds', ...KINDS, 'status', 'missing', 'burn_rate_chart'].join(',')];
  for (const r of rows) {
    out.push([
      r.slug, `"${r.name}"`, r.region, `"${r.kinds}"`,
      ...KINDS.map((k) => r.cells[k]),
      r.status, `"${r.missing}"`, r.burn,
    ].join(','));
  }
  console.log(out.join('\n'));
  process.exit(0);
}

if (format === 'md') {
  console.log('| Manufacturer | Region | Declares | '
    + KINDS.map((k) => k).join(' | ') + ' | Status | Missing |');
  console.log('|---|---|---|' + KINDS.map(() => '---').join('|') + '|---|---|');
  for (const r of rows) {
    console.log(`| ${r.name} | ${r.region} | ${r.kinds} | `
      + KINDS.map((k) => r.cells[k]).join(' | ')
      + ` | **${r.status}** | ${r.missing || '-'} |`);
  }
  console.log();
  console.log(`**Status totals:** ${statusLine}`);
  console.log();
  console.log(`**Component rows:** ${componentLine}`);
  process.exit(0);
}

// default: aligned table
const w = Math.max(...rows.map((r) => r.slug.length), 6);
const head = ['slug'.padEnd(w), ...KINDS.map((k) => k.slice(0, 6).padStart(6)), 'burn', 'status', 'missing'];
console.log(head.join('  '));
console.log('-'.repeat(head.join('  ').length));
for (const r of rows) {
  console.log([
    r.slug.padEnd(w),
    ...KINDS.map((k) => String(r.cells[k]).padStart(6)),
    (r.burn || '-').padStart(4),
    r.status.padEnd(12),
    r.missing,
  ].join('  '));
}

console.log();
console.log('status totals:   ' + statusLine);
console.log('component rows:  ' + componentLine);

if (orphans.size) {
  console.log();
  console.log('ORPHAN manufacturer_slug (referenced by a seed but not in manufacturers.csv):');
  for (const [slug, where] of [...orphans].sort()) {
    console.log(`  ${slug.padEnd(w)}  <- ${[...where].join(', ')}`);
  }
  console.log('  A pure case difference is still a real FK bug in SQLite - see guide 3.7.');
}

if (unresolved.length) {
  console.log();
  console.log(`UNRESOLVED pressure disputes: ${unresolved.length} (do not publish)`);
  for (const c of unresolved) {
    console.log(`  ${c.kwk_name}: kwk=${c.kwk_value} vs ${c.secondary_name}=${c.secondary_value} ${c.unit} (delta ${c.delta})`);
  }
}

// How many non-blank values rest on something other than a published figure.
// This number should only ever go DOWN as real sources are found - that is the
// measure of whether the annotation layer is being used to route work to the
// sources table, or is being used to launder guesses into official columns.
if (provByTier.size) {
  console.log();
  console.log('VALUE PROVENANCE (how non-blank values were arrived at)');
  const tierOrder = ['published', 'derived', 'estimated', 'community'];
  for (const t of tierOrder) {
    if (provByTier.has(t)) {
      console.log(`  ${t.padEnd(12)} ${String(provByTier.get(t)).padStart(4)}`);
    }
  }
  const offBook = provByTier.get('estimated') || 0;
  const comm = provByTier.get('community') || 0;
  if (offBook || comm) {
    console.log(`  ${''.padEnd(12)} ${String(offBook + comm).padStart(4)} not from an official source - each needs a real source found to clear it`);
  }
  for (const r of provRows.filter((x) => norm(x.tier) === 'community')) {
    console.log(`  ! community value in an official column: ${r.entity_slug}.${r.field_name} (${r.safety_risk || 'unrated'}) - see 012_value_provenance.sql`);
  }
}
