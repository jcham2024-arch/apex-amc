// Loads data/seeds/*.csv into an in-memory SQLite built from the real schema
// and validates the result.
//
// This is the counterpart to scripts/check-schema.mjs: that file proves the
// DDL is valid, this one proves the *data* is loadable and that the editorial
// rules the schema promises are actually enforced.
//
// Design rules it checks, matching docs/DATA-MODEL.md:
//   1. Provenance is mandatory - no reference row without a source.
//   2. Community data never appears in an official table. The separation the
//      brief asked for is asserted, not merely intended.
//   3. Enum columns hold only their declared values (the DB would throw, but
//      we report the row rather than letting a load half-apply).
//   4. Foreign keys resolve - a cartridge/bullet/powder that does not exist
//      would silently orphan a pressure figure.
//
//   npm run seed:check
import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import * as manifestLib from './lib/data.mjs';

const root = resolve(import.meta.dirname, '..');
const schemaDir = resolve(root, 'data/schema');
const seedDir = resolve(root, 'data/seeds');

const problems = [];
const notes = [];
const fail = (msg) => problems.push(msg);

// ----------------------------------------------------------------- utilities

// Reads a seed CSV into objects, carrying the true per-row cell count under a
// Symbol so the loader can tell a short row from a padded one.
//
// Three things this has to get right, each of which previously broke a load:
//
// 1. Encoding. Files have arrived as UTF-8, UTF-8 with a BOM, and UTF-16LE.
//    cartridge_specs.csv was stored as UTF-16LE for some time and parsed fine
//    in every tool that auto-detects, which is exactly why it went unnoticed.
//    A BOM is stripped rather than left to become part of the first header name.
//    test-encoding.mjs now fails the build on any of these, so this is a
//    belt-and-braces read rather than the primary defence.
//
// 2. A newline inside a quoted field is data, not a row boundary. Physical
//    lines are rejoined while the quote count is odd; without that a multi-line
//    note becomes one short row plus a phantom row.
//
// 3. A row shorter than the header must stay short. Padding it to the header
//    width makes the row count look right while the columns are silently
//    shifted - nine Alliant rows were missing a field, and the shifted columns
//    were the only evidence.
const RAW_CELLS = Symbol('rawCells');
const DECODER = new TextDecoder('utf-8', { fatal: false });

function readCsv(path) {
  const buf = readFileSync(path);

  let text;
  if (buf[0] === 0xff && buf[1] === 0xfe) {
    text = buf.toString('utf16le');
  } else {
    text = DECODER.decode(buf);
  }
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  // Rejoin physical lines while quotes are unbalanced.
  const rawLines = text.split(/\r?\n/);
  const lines = [];
  let lineBuf = '';
  let open = false;
  for (const raw of rawLines) {
    lineBuf += (open ? '\n' : '') + raw;
    // An odd quote count means we are still inside a quoted field.
    // (Escaped "" pairs are even by construction, so they cannot fool this.)
    open = (lineBuf.match(/"/g) || []).length % 2 === 1;
    if (!open) {
      if (lineBuf.length > 0) lines.push(lineBuf);
      lineBuf = '';
    }
  }
  if (lineBuf.length > 0) lines.push(lineBuf);
  if (!lines.length) return [];

  const split = (line) => {
    const out = [];
    let cur = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') q = false;
        else cur += c;
      } else if (c === '"') q = true;
      else if (c === ',') { out.push(cur); cur = ''; }
      else cur += c;
    }
    out.push(cur);
    return out;
  };

  const header = split(lines[0]);
  const rows = lines.slice(1).map((l) => {
    const cells = split(l);
    // Carry the real cell count on a non-enumerable Symbol so `for...in` and
    // Object.keys() over a row still see only real columns, while the loader
    // can tell a short row from a padded one.
    const row = {};
    Object.defineProperty(row, RAW_CELLS, { value: cells.length, enumerable: false });
    header.forEach((h, i) => { row[h] = (cells[i] ?? '').trim(); });
    return row;
  });
  Object.defineProperty(rows, 'headerLen', { value: header.length, enumerable: false });
  return rows;
}




























































































































const num = (v) => (v === '' || v === undefined || v === null ? null : Number(v));
const int = (v) => (v === '' || v === undefined || v === null ? null : Math.trunc(Number(v)));

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/^\./, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ------------------------------------------------------------------- build DB

const db = new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys = ON;');

for (const f of readdirSync(schemaDir).filter((x) => x.endsWith('.sql')).sort()) {
  try {
    db.exec(readFileSync(resolve(schemaDir, f), 'utf8'));
  } catch (err) {
    fail(`schema ${f} failed to apply: ${err.message}`);
  }
}

const count = (t) => db.prepare(`SELECT COUNT(*) n FROM ${t}`).get().n;

// -------------------------------------------------------------------- sources
// Reference rows for the documents the extractors read, so provenance is
// never a dangling string. Loaded first: everything else FKs to them.
const SRC = [
  ['kwk.us Cartridge Pressure Standards', '2023', 2023, 'http://kwk.us/pressures.html'],
  ['leverguns.com SAAMI Pressures', '2004', 2004, 'https://www.leverguns.com/articles/saami_pressures.htm'],
  ['Vihtavuori Burning Rate Chart', '2025', 2025, 'https://vihtavuori.com/wp-content/uploads/2025/11/Vihtavuori_BurningRateChart_Tabloid.pdf'],
  ['ANSI/SAAMI Z299.4 Centerfire Rifle', '2025', 2025, 'https://saami.org/technical-information/ansi-saami-standards/'],
  ['ANSI/SAAMI Z299.3 Centerfire Pistol', '2022', 2022, 'https://saami.org/technical-information/ansi-saami-standards/'],
];
for (const [name, edition, year, url] of SRC) {
  db.prepare('INSERT OR IGNORE INTO sources (name, edition, publication_year, url) VALUES (?,?,?,?)')
    .run(name, edition, year, url);
}
const srcId = (name) => db.prepare('SELECT id FROM sources WHERE name = ?').get(name)?.id ?? null;

// --------------------------------------------------------------- manufacturers
// A manufacturer is one row even when it makes several kinds of thing, so
// `manufacturer_kinds` is the authoritative many-to-many (see 006).
const manufacturers = new Map();

function upsertManufacturer(slug, name, website, kind = 'powder') {
  if (!slug) return null;
  if (manufacturers.has(slug)) return slug;
  // Parameter order matters: the CHECK on `manufacturers.kind` rejects
  // anything outside its enum, and INSERT OR IGNORE would swallow that
  // silently - which is how imr/alliant/accurate/ramshot rows went missing.
  const res = db.prepare(
    'INSERT OR IGNORE INTO manufacturers (slug, name, kind, website, status) VALUES (?, ?, ?, ?, ?)',
  ).run(slug, name, kind, website || null, 'active');
  if (res.changes === 0 && !db.prepare('SELECT 1 FROM manufacturers WHERE slug = ?').get(slug)) {
    fail(`manufacturers: rejected "${slug}" (name=${name}, kind=${kind}) - constraint violation`);
  }
  manufacturers.set(slug, { name, website });
  return slug;
}

// Built by separate research passes. Optional so the powder/pressure pipeline
// still validates while the others are in progress.
function loadOptional(file, handler) {
  const p = resolve(seedDir, file);
  if (existsSync(p)) handler(readCsv(p));
  else notes.push(`optional seed not present yet: data/seeds/${file}`);
}

// ------------------------------------------------------------ manufacturers
// The component directory. Loaded before powders/bullets so a maker that has
// no product rows yet still appears in the site's manufacturer index - the
// brief asks for a *list* of manufacturers with links, not only those we have
// managed to transcribe SKUs for.
loadOptional('manufacturers.csv', (rows) => {
  const ins = db.prepare(
    `INSERT OR IGNORE INTO manufacturers
       (slug, name, kind, website, country, region, status, notes, source_url)
     VALUES (?,?,?,?,?,?,?,?,?)`,
  );
  const insKind = db.prepare(
    'INSERT OR IGNORE INTO manufacturer_kinds (manufacturer_id, kind, is_primary, source_url) VALUES (?,?,?,?)',
  );
  const KINDS = ['ammo', 'bullet', 'powder', 'primer', 'brass', 'retailer', 'shotshell', 'reloading_equipment', 'wads'];
  let added = 0;

  for (const r of rows) {
    if (!r.slug || !r.name) { fail(`manufacturers.csv: row missing slug or name`); continue; }
    if (!r.website) { fail(`manufacturers.csv: ${r.slug} has no website`); continue; }
    const kinds = (r.kinds || '').split(/[;|]/).map((k) => k.trim()).filter(Boolean);
    if (!kinds.length) { fail(`manufacturers.csv: ${r.slug} has no kinds`); continue; }
    for (const k of kinds) {
      if (!KINDS.includes(k)) { fail(`manufacturers.csv: ${r.slug} has invalid kind "${k}"`); break; }
    }
    if (kinds.some((k) => !KINDS.includes(k))) continue;

    const primary = kinds[0];
    const res = ins.run(r.slug, r.name, primary, r.website, r.country || null,
      r.region || null, r.status || 'active', r.notes || null, r.source_url || r.website);
    if (res.changes > 0) added++;

    const mid = db.prepare('SELECT id FROM manufacturers WHERE slug = ?').get(r.slug);
    if (mid) {
      kinds.forEach((k, i) => insKind.run(mid.id, k, i === 0 ? 1 : 0, r.source_url || r.website));
      manufacturers.set(r.slug, { name: r.name, website: r.website });
    }
  }
  notes.push(`manufacturers.csv: ${rows.length} rows, ${added} inserted, ${db.prepare('SELECT COUNT(*) n FROM manufacturers').get().n} total`);
});

// Research data is free-form; the schema is an enum. The loader mediates, and
// anything it cannot map unambiguously becomes NULL rather than a guess -
// the same rule that governs the rest of this dataset.
const GEOMETRY_RULES = [
  [/flattened[_ ]?(ball|sphere|grain)/i, 'flattened_ball'],
  [/spher|ball\b/i, 'ball'],
  [/flake/i, 'flake'],
  [/disc/i, 'disc'],
  [/extruded[_ ]?(short|small|fine)/i, 'extruded_short'],
  [/extruded[_ ]?(long|large|stick|tube)/i, 'extruded_long'],
  [/cylind/i, 'cylindrical'],
  [/^unknown$/i, 'unknown'],
];

function normalizeGeometry(raw, notes, powderName) {
  if (!raw) return null;
  const v = raw.trim();
  if (['ball', 'flattened_ball', 'extruded_short', 'extruded_long', 'flake', 'disc', 'cylindrical', 'unknown'].includes(v)) {
    return v;
  }
  for (const [re, mapped] of GEOMETRY_RULES) {
    if (re.test(v)) return mapped;
  }
  // Unmapped: leave it empty and say so once, rather than assert something
  // the manufacturer did not.
  notes.push(`geometry "${v}" for ${powderName} is not one of the schema values; stored as NULL`);
  return null;
}

// ------------------------------------------------- per-manufacturer seed files
//
// Component data is split one file per manufacturer under a directory named for
// the component type:
//
//   data/seeds/bullets/sierra.csv
//   data/seeds/powders/vihtavuori.csv
//
// The point is that adding a manufacturer's line is creating one small file, not
// editing a shared table where two people collide and every change re-reads
// everyone's rows. It also makes the coverage report in report-coverage.mjs
// literal: a maker's coverage IS whether their file exists.
//
// The filename is the manufacturer's slug. The loader does NOT trust that: each
// file is checked to contain rows for exactly that one manufacturer, so a file
// misnamed or a row pasted into the wrong maker's file is a build failure rather
// than a silently misattributed row.
function componentFiles(type, base) {
  const dir = resolve(base, type);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.csv'))
    .sort()
    .map((f) => resolve(dir, f));
}

// Calls `onRow(row, fileSlug)` for every row in the per-manufacturer files under
// <base>/<type>/, rejecting any row whose manufacturer_slug disagrees with the
// filename. That disagreement is the single most likely mistake when working
// this way - a row pasted into the wrong maker's file - and it would attribute
// a component to a competitor, which is worse than a failed build.
function eachComponentRow(type, base, onRow) {
  for (const file of componentFiles(type, base)) {
    const expected = basename(file, '.csv');
    for (const r of readCsv(file)) {
      const slug = (r.manufacturer_slug || '').trim();
      if (!slug) { fail(`${type}/${basename(file)}: row has an empty manufacturer_slug`); continue; }
      if (slug.toLowerCase() !== expected) {
        fail(`${type}/${basename(file)}: contains a row for "${slug}" - this file is for "${expected}" only`);
        continue;
      }
      onRow(r, expected);
    }
  }
}

// ------------------------------------------------------------------- powders
// One tree: data/seeds/powders/, one file per brand. This used to merge
// data/seeds/powders/ with data/incoming/powders/, but data/incoming/ is
// gitignored while holding 142 of the 169 powder rows - so a fresh clone loaded
// 27, and every row count below depended on the checkout rather than the
// repository. All seven brands now live in data/seeds/powders/.
//
// A flat pre-split powders.csv is still read if present, so an un-migrated
// checkout keeps working, and it is reported so it can be deleted.
let powderRows = [];
{
  const rows = [];
  // The powder CSV header this project uses. A row whose cell count differs is
  // malformed (a stray comma in an unquoted field) and is reported rather than
  // half-inserted.
  const headerLen = 10;

  // Per-brand files, with the filename/row agreement enforced by
  // eachComponentRow - a row pasted into the wrong maker's file is a build
  // failure, not a silent misattribution.
  eachComponentRow('powders', seedDir, (r) => rows.push(r));

  const flat = resolve(seedDir, 'powders.csv');
  if (existsSync(flat)) {
    notes.push('powders: data/seeds/powders.csv is a pre-split flat file - run scripts/split-seeds-by-manufacturer.mjs and delete it');
    rows.push(...readCsv(flat));
  }

  for (const r of rows) {
    upsertManufacturer(r.manufacturer_slug, r.manufacturer, r.manufacturer_website, 'powder');
  }

  // Every distinct manufacturer in the source must exist as a real row.
  const missing = [...new Set(rows.map((r) => r.manufacturer_slug))].filter(
    (s) => s && !db.prepare('SELECT 1 FROM manufacturers WHERE slug = ?').get(s),
  );
  if (missing.length) fail(`powders: manufacturers failed to insert: ${missing.join(', ')}`);

  const insPowder = db.prepare(
    `INSERT INTO powders (manufacturer_id, name, burn_rate_class, geometry, product_line,
                          is_double_base, notes, source_url, source_kind)
     VALUES ((SELECT id FROM manufacturers WHERE slug = ?), ?, ?, ?, ?, ?, ?, ?, 'manufacturer')`,
  );
  let loaded = 0;
  for (const r of rows) {
    if (r[RAW_CELLS] !== headerLen) continue; // counted as malformed below
    if (!r.product_name) { fail(`powders: row for ${r.manufacturer} has an empty product_name`); continue; }
    if (r.burn_rate_class && !['pistol', 'rifle_medium', 'rifle_slow', 'shotgun'].includes(r.burn_rate_class)) {
      fail(`powders: ${r.product_name} has invalid burn_rate_class "${r.burn_rate_class}"`);
      continue;
    }
    if (!r.source_url) { fail(`powders: ${r.product_name} has no source_url (provenance is mandatory)`); continue; }

    const geo = normalizeGeometry(r.geometry, notes, r.product_name);
    const doubleBase = /double[\s-]?base|nitroglycerin|nitroglycerine/i.test(r.geometry || '')
      ? 1
      : /single[\s-]?base/i.test(r.geometry || '')
        ? 0
        : null;

    try {
      insPowder.run(
        r.manufacturer_slug, r.product_name, r.burn_rate_class || null,
        geo, r.product_line || null, doubleBase, r.notes || null,
        r.source_url || null,
      );
      loaded++;
      powderRows.push(r);
    } catch (err) {
      fail(`powders: ${r.manufacturer}/${r.product_name} -> ${err.message}`);
    }
  }

  const malformed = rows.filter((r) => r[RAW_CELLS] !== headerLen);
  if (malformed.length) {
    fail(
      `powders: ${malformed.length} of ${rows.length} rows have the wrong number of columns ` +
      `(expected ${headerLen}) - a field is missing and every column after it is shifted. ` +
      `Affected: ${malformed.slice(0, 3).map((r) => `${r.manufacturer}/${r.product_name}`).join(', ')}`,
    );
  }

  // Report the counts unconditionally: a loader that silently reads fewer
  // rows than the file contains is exactly the failure mode worth catching.
  notes.push(`powders: read ${rows.length} rows from ${componentFiles('powders', seedDir).length} per-brand file(s), loaded ${loaded}, malformed ${malformed.length}`);

  // Kinds: a powder company is a powder maker; record it on the M:N table.
  const kinds = db.prepare('INSERT OR IGNORE INTO manufacturer_kinds (manufacturer_id, kind, is_primary) VALUES (?, ?, 1)');
  for (const slug of manufacturers.keys()) {
    const m = db.prepare('SELECT id FROM manufacturers WHERE slug = ?').get(slug);
    if (m) kinds.run(m.id, 'powder');
  }
}

// ---------------------------------------------------------------- cartridges
// Spelling differs between sources: kwk.us abbreviates (".308 Win") while 003
// seeded full names (".308 Winchester"). Without this map the same cartridge
// becomes two rows, and a pressure limit then silently attaches to the wrong
// one. Explicit is deliberate.
const CARTRIDGE_ALIASES = {
  '9 luger': '9mm-luger',
  '9mm luger': '9mm-luger',
  '.45 acp': '45-acp',
  '45 acp': '45-acp',
  '.308 win': '308-winchester',
  '.308 winchester': '308-winchester',
  '.223': '223-remington',
  '.223 remington': '223-remington',
  '6.5 creedm': '65-creedmoor',
  '6.5 creedmoor': '65-creedmoor',
  '.30-06 springfield': '30-06',
  '.30-06': '30-06',
};

// Cartridge spelling differs between sources: kwk.us abbreviates (".308 Win",
// ".30-30") while leverguns.com spells out (".308 Winchester",
// ".30-30 Winchester"). Without normalisation the same cartridge becomes two
// rows and a pressure limit silently attaches to the wrong one. Both spellings
// reduce to the same key here.
function canon(name) {
  let s = String(name).toLowerCase().trim();
  // Drop a trailing qualifier repeatedly: "Winchester" -> "Win" -> nothing.
  const QUALIFIERS = ['winchester', 'win', 'remington', 'rem', 'springfield',
    'magnum', 'mag', 'government', 'gov', 'special', 'spl', 'spec'];
  let changed = true;
  while (changed) {
    changed = false;
    for (const q of QUALIFIERS) {
      if (s.endsWith(' ' + q)) { s = s.slice(0, -(q.length + 1)); changed = true; }
      else if (s.endsWith(q) && s.length > q.length && !/[0-9]/.test(s[s.length - q.length - 1])) {
        s = s.slice(0, -q.length); changed = true;
      }
    }
    s = s.replace(/[.\s\-_]+$/, '');
    if (s.endsWith(' ' + s.trim().split(/\s+/).pop())) changed = false;
  }
  return s.replace(/[.\s\-_]/g, '');
}

// canon() can collapse two genuinely different cartridges - ".222" and
// ".222 Rem Mag" both reduce to "222". Silently binding whichever was indexed
// first would attach one cartridge's pressure limit to the other, so an
// ambiguous key is treated as unresolvable rather than resolved wrongly.
const canonIndex = new Map(); // canon(name) -> { id, names: [] }
const canonAmbiguous = new Set();

function indexCartridge(id, name) {
  const k = canon(name);
  if (!k) return;
  const hit = canonIndex.get(k);
  if (!hit) { canonIndex.set(k, { id, names: [String(name)] }); return; }
  if (hit.id !== id) {
    canonAmbiguous.add(k);
    canonIndex.delete(k); // remove so no one matches it
  } else if (!hit.names.includes(name)) {
    hit.names.push(String(name));
  }
}

function lookupCanon(name) {
  const k = canon(name);
  if (canonAmbiguous.has(k)) return null;
  return canonIndex.get(k)?.id ?? null;
}

function resolveCartridge(displayName, family) {
  const key = displayName.trim().toLowerCase();
  const alias = CARTRIDGE_ALIASES[key];
  if (alias) {
    const hit = db.prepare('SELECT id FROM cartridges WHERE slug = ?').get(alias);
    if (hit) { indexCartridge(hit.id, displayName); return { id: hit.id, created: false }; }
  }

  // Normalised match first, so ".308 Win" finds ".308 Winchester".
  const byCanon = lookupCanon(displayName);
  if (byCanon != null) return { id: byCanon, created: false };

  const slug = slugify(displayName);
  const existing = db.prepare('SELECT id FROM cartridges WHERE slug = ?').get(slug);
  if (existing) { indexCartridge(existing.id, displayName); return { id: existing.id, created: false }; }

  // `family` is NOT NULL with a CHECK constraint, and this is where a wrong
  // guess would send a pistol cartridge down a rifle page. If the source does
  // not say, we do not create the row - it gets reported as needing a family.
  if (!family || !['rifle', 'pistol', 'shotgun'].includes(family)) {
    return { id: null, created: false };
  }
  const r = db.prepare('INSERT INTO cartridges (slug, name, short_name, family) VALUES (?,?,?,?)')
    .run(slug, displayName.trim(), displayName.trim().replace(/^\./, ''), family);
  const id = Number(r.lastInsertRowid);
  indexCartridge(id, displayName);
  return { id, created: true };
}

// --------------------------------------------------- pressure cross-reference
const KW = srcId('kwk.us Cartridge Pressure Standards');
const LG = srcId('leverguns.com SAAMI Pressures');
const insPressure = db.prepare(
  `INSERT OR IGNORE INTO cartridge_pressure_references
   (cartridge_id, standard_body, method, value, unit, source_id, source_url, source_kind, confidence, note)
   VALUES (?,?,?,?,?,?,?,?,?,?)`,
);

// secondary first: it carries the `family` we need to create rows correctly.
// Index the cartridges 003 already seeded so ".308 Win" can find
// "308-winchester" without needing an alias for every abbreviation.
for (const c of db.prepare('SELECT id, name, short_name, slug FROM cartridges').all()) {
  indexCartridge(c.id, c.name);
  if (c.short_name) indexCartridge(c.id, c.short_name);
}

const secondaryFile = resolve(seedDir, 'cartridge_pressures_secondary.csv');
const familyByCanon = new Map();
const familyAmbiguous = new Set();
if (existsSync(secondaryFile)) {
  for (const r of readCsv(secondaryFile)) {
    // Two different cartridges can reduce to the same key; if they also
    // disagree on family, the key stops being a usable family signal.
    const k = canon(r.cartridge_name);
    if (familyByCanon.has(k) && familyByCanon.get(k) !== r.family) {
      familyAmbiguous.add(k);
      familyByCanon.delete(k);
    } else if (!familyAmbiguous.has(k)) {
      familyByCanon.set(k, r.family);
    }

    const { id } = resolveCartridge(r.cartridge_name, r.family);
    if (id == null) { fail(`cartridge_pressures_secondary.csv: no family for ${r.cartridge_name}`); continue; }
    insPressure.run(
      id, 'SAAMI',
      r.pressure_unit === 'cup' ? 'copper_crusher' : 'piezo',
      Number(r.pressure_value), r.pressure_unit,
      LG, r.source_url, 'compilation', 'compiled_single',
      r.source_note || null,
    );
  }
}

const kwkFile = resolve(seedDir, 'cartridge_pressures.csv');
let kwkUnmapped = 0;
let kwkLoaded = 0;
function loadKwk(rows) {
  for (const r of rows) {
    const k = canon(r.cartridge_name);
    const family = familyAmbiguous.has(k) ? null : familyByCanon.get(k) ?? null;
    const { id } = resolveCartridge(r.cartridge_name, family);
    if (id == null) { kwkUnmapped++; continue; }
    if (r.saami_piezo_ksi) {
      insPressure.run(id, 'SAAMI', 'piezo_ksi_rounded', Number(r.saami_piezo_ksi) * 1000, 'psi',
        KW, 'http://kwk.us/pressures.html', 'compilation', 'compiled_single',
        'Rounded up to the nearest ksi by the source.');
    }
    if (r.cip_piezo_ksi) {
      insPressure.run(id, 'CIP', 'piezo_ksi_rounded', Number(r.cip_piezo_ksi) * 1000, 'psi',
        KW, 'http://kwk.us/pressures.html', 'compilation', 'compiled_single',
        'Rounded up to the nearest ksi by the source.');
    }
    if (r.saami_cup) {
      insPressure.run(id, 'SAAMI', 'copper_crusher', Number(r.saami_cup) * 1000, 'cup',
        KW, 'http://kwk.us/pressures.html', 'compilation', 'compiled_single', null);
    }
    if (r.cip_cup) {
      insPressure.run(id, 'CIP', 'copper_crusher', Number(r.cip_cup) * 1000, 'cup',
        KW, 'http://kwk.us/pressures.html', 'compilation', 'compiled_single', null);
    }
    kwkLoaded++;
  }
}
if (existsSync(kwkFile)) {
  loadKwk(readCsv(kwkFile));
}

// ------------------------------------------------------------ burn-rate chart
const brFile = resolve(seedDir, 'powder_burn_rate_positions.csv');
if (existsSync(brFile)) {
  const rows = readCsv(brFile);
  const slug = rows[0]?.chart_slug ?? 'vihtavuori-burning-rate-chart';
  db.prepare(
    `INSERT OR IGNORE INTO powder_burn_rate_charts
     (slug, name, publisher, url, published_year, scope, source_kind, note)
     VALUES (?,?,?,?,?,?,?,?)`,
  ).run(
    slug,
    'Vihtavuori Burning Rate Chart',
    'Vihtavuori',
    'https://vihtavuori.com/wp-content/uploads/2025/11/Vihtavuori_BurningRateChart_Tabloid.pdf',
    2025,
    'cross_brand',
    'manufacturer',
    'Vihtavuori is authoritative for its own powders; its view of other brands ' +
      'is a manufacturer comparison, not those brands publishing about themselves.',
  );
  const chartId = db.prepare('SELECT id FROM powder_burn_rate_charts WHERE slug = ?').get(slug).id;

  const insPos = db.prepare(
    `INSERT OR IGNORE INTO powder_burn_rate_positions (powder_id, chart_id, position, chart_total)
     VALUES ((SELECT id FROM powders WHERE name = ?), ?, ?, ?)`,
  );
  for (const r of rows) {
    const pid = db.prepare('SELECT id FROM powders WHERE name = ?').get(r.powder_name_as_published);
    if (!pid) {
      notes.push(`burn-rate position "${r.powder_name_as_published}" has no matching row in powders.csv; skipped.`);
      continue;
    }
    insPos.run(r.powder_name_as_published, chartId, Number(r.position), Number(r.column_total));
  }
}

// ------------------------------------------------------------ cartridge_specs
// One file per family under data/seeds/cartridge_specs/ (rifle, pistol,
// shotgun). This was a single 229-row cartridge_specs.csv until 2026-10-01; the
// split is by family because that is the coarsest key that is both populated
// and meaningful, and every finer key (parent_case, bullet_dia_in, rim_dia_in,
// capacity_gr_h2o, ...) is empty on all 229 rows.
//
// The rows are merged, so behaviour is identical to reading one flat file - the
// difference is only in how a human edits it.
const cartridgeSpecRows = componentFiles('cartridge_specs', seedDir).flatMap((f) => readCsv(f));
{
  const rows = cartridgeSpecRows;
  const upd = db.prepare(
    `UPDATE cartridges SET case_length_max_in=COALESCE(?,case_length_max_in),
       max_col_in=COALESCE(?,max_col_in), saami_max_psi=COALESCE(?,saami_max_psi),
       cip_max_bar=COALESCE(?,cip_max_bar), bullet_dia_in=COALESCE(?,bullet_dia_in),
       rim_dia_in=COALESCE(?,rim_dia_in), head_dia_in=COALESCE(?,head_dia_in),
       capacity_gr_h2o=COALESCE(?,capacity_gr_h2o), primer_type=COALESCE(?,primer_type),
       typical_twist_in=COALESCE(?,typical_twist_in), is_reloadable=COALESCE(?,is_reloadable),
       notes=COALESCE(?,notes), source_id=COALESCE(?,source_id)
     WHERE slug = ?`,
  );
  const del = db.prepare('DELETE FROM cartridge_pressure_references WHERE cartridge_id = ? AND source_kind = ?');
  for (const r of rows) {
    if (!r.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r.slug)) {
      // Reported once. This used to be emitted twice, with the first copy
      // double-escaped, which double-counted the problem in the failure list.
      fail(`cartridge_specs.csv: bad slug "${r.slug}" (must be lowercase-hyphen ASCII)`);
      continue;
    }
    let c = db.prepare('SELECT id FROM cartridges WHERE slug = ?').get(r.slug);
    if (!c) {
      // A curated spec row is creation authority when it supplies an identity
      // AND a family. Without family we refuse: family is NOT NULL and a
      // wrong guess files a pistol cartridge on a rifle page.
      if (!r.name) { fail(`cartridge_specs.csv: new slug "${r.slug}" has no name`); continue; }
      if (!['rifle', 'pistol', 'shotgun'].includes(r.family)) {
        fail(`cartridge_specs.csv: new slug "${r.slug}" has no valid family`); continue;
      }
      try {
        const ins = db.prepare('INSERT INTO cartridges (slug, name, short_name, family) VALUES (?,?,?,?)')
          .run(r.slug, r.name.trim(), (r.short_name || r.name).trim().replace(/^\./, ''), r.family);
        c = { id: Number(ins.lastInsertRowid) };
        indexCartridge(c.id, r.name);
        if (r.short_name) indexCartridge(c.id, r.short_name);
      } catch (err) {
        fail(`cartridge_specs.csv: cannot insert slug "${r.slug}" -> ${err.message}`); continue;
      }
    }
    const sid = r.source_name ? srcId(r.source_name) : null;
    upd.run(num(r.case_length_max_in), num(r.max_col_in), num(r.saami_max_psi), num(r.cip_max_bar),
      num(r.bullet_dia_in), num(r.rim_dia_in), num(r.head_dia_in), num(r.capacity_gr_h2o),
      r.primer_type || null, num(r.typical_twist_in),
      int(r.is_reloadable) ?? 1, r.notes || null, sid, r.slug);
    // A curated figure outranks a compilation: drop the compiled claim rather
    // than leave two conflicting numbers live against the same cartridge.
    if (r.saami_max_psi) {
      del.run(c.id, 'compilation');
      insPressure.run(c.id, 'SAAMI', 'piezo', Number(r.saami_max_psi), 'psi',
        sid, r.source_url || null, 'standard', 'verified_primary',
        r.source_note || 'Curated from the cartridge specification source.');
    }
  }
}

notes.push(`cartridge specs: read ${cartridgeSpecRows.length} rows from ${componentFiles('cartridge_specs', seedDir).length} per-family file(s)`);

// ------------------------------------------------------------ kwk pass two
// Curated specs land AFTER pass one deliberately: pass one maps every name
// the secondary source already resolves; specs then add new family-carrying
// cartridges; pass two therefore loads every kwk row whose family the curated
// file has now supplied, without ever creating a row off a compiled source.
if (existsSync(kwkFile)) {
  const before = kwkUnmapped;
  kwkUnmapped = 0;
  const dupe = new Set(
    db.prepare('SELECT cartridge_id, standard_body, method, value, unit, source_id FROM cartridge_pressure_references')
      .all().map((r) => [r.cartridge_id, r.standard_body, r.method, r.value, r.unit, r.source_id].join('|')),
  );
  const rows = readCsv(kwkFile);
  for (const r of rows) {
    const k = canon(r.cartridge_name);
    const family = familyAmbiguous.has(k) ? null : familyByCanon.get(k) ?? null;
    const { id } = resolveCartridge(r.cartridge_name, family);
    if (id == null) { kwkUnmapped++; continue; }
    const keys = [
      r.saami_piezo_ksi ? [id, 'SAAMI', 'piezo_ksi_rounded', Number(r.saami_piezo_ksi) * 1000, 'psi', KW].join('|') : null,
      r.cip_piezo_ksi ? [id, 'CIP', 'piezo_ksi_rounded', Number(r.cip_piezo_ksi) * 1000, 'psi', KW].join('|') : null,
      r.saami_cup ? [id, 'SAAMI', 'copper_crusher', Number(r.saami_cup) * 1000, 'cup', KW].join('|') : null,
      r.cip_cup ? [id, 'CIP', 'copper_crusher', Number(r.cip_cup) * 1000, 'cup', KW].join('|') : null,
    ].filter(Boolean);
    if (!keys.length) continue;
    // Everything on the list was already attempted in pass one, so skip the
    // inserts entirely - except for a row whose cartridge did not exist until
    // the curated specs just created it. INSERT OR IGNORE would silently eat
    // a genuinely new claim of a different shape, so gate on the id set.
    if (!keys.some((kk) => !dupe.has(kk))) continue;
    loadKwk([r]);
    for (const kk of keys) dupe.add(kk);
  }
  notes.push(`kwk pass one mapped ${kwkLoaded} rows against cartridges known at that point; pass two after curated specs: unmapped ${before} -> ${kwkUnmapped}.`);
  if (kwkUnmapped) {
    notes.push(
      `${kwkUnmapped} kwk pressure rows remain unmapped (no family from secondary or curated specs). ` +
      `They stay in data/seeds/cartridge_pressures.csv with unit note ksi_rounded_up_to_1000psi.`,
    );
  }
}

loadOptional('case_reuse.csv', (rows) => {
  const ins = db.prepare(
    `INSERT OR IGNORE INTO case_reuse_profiles
     (cartridge_id, brass_brand, case_material, is_reloadable, primer_type, primer_pocket,
      pressure_class, reloads_min, reloads_max, reloads_typical, anneal_interval,
      needs_shoulder_bump, head_separation_risk, notes, source_url, source_kind)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  );
  for (const r of rows) {
    const c = db.prepare('SELECT id FROM cartridges WHERE slug = ?').get(r.cartridge_slug);
    if (!c) { fail(`case_reuse.csv: unknown cartridge_slug "${r.cartridge_slug}"`); continue; }
    if (!r.source_url) { fail(`case_reuse.csv: ${r.cartridge_slug} missing source_url (provenance is mandatory)`); continue; }
    ins.run(c.id, r.brass_brand || null, r.case_material || 'brass',
      int(r.is_reloadable) ?? 1, r.primer_type || null, r.primer_pocket || null,
      r.pressure_class || null, int(r.reloads_min), int(r.reloads_max), int(r.reloads_typical),
      int(r.anneal_interval), int(r.needs_shoulder_bump), r.head_separation_risk || null,
      r.notes || null, r.source_url, 'authority');
  }
});

// Enum values the `bullets` table CHECKs. These are duplicated here on purpose:
// a bad value is caught here with the row and column named, instead of being
// swallowed by INSERT OR IGNORE. That is not hypothetical - a column shift in
// the Hornady rows and a design name ("very low drift") in the Berger
// `tip_type` both silently dropped 7 of 11 bullets before this check existed.
const BULLET_ENUMS = {
  construction: ['cup_and_core', 'bonded', 'partition', 'monolithic', 'cast_lead',
    'plated', 'frangible', 'jacketed', 'turned_solid', 'unknown'],
  base_type: ['flat', 'boat_tail', 'rebated_boat_tail', 'bevel', 'gas_check',
    'hollow_base', 'unknown'],
  tip_type: ['round_nose', 'spitzer', 'soft_point', 'hollow_point', 'hpbt',
    'polymer_tip', 'fmj', 'open_tip', 'wadcutter', 'semi_wadcutter', 'unknown'],
  source_kind: ['manufacturer', 'distributor', 'compilation', 'community'],
};

// Bullets, one file per manufacturer under data/seeds/bullets/. The flat
// bullets.csv is still honoured if present so an un-migrated checkout keeps
// working, but the per-manufacturer files are what new data should go into.
//
// Declared out here because the loader/manifest agreement check further down
// needs to compare it against data/schemas/bullets.yaml. Assigned inside the
// block below, once the INSERT exists.
let LOADED_BULLET_COLUMNS = new Set();
{
  const bulletRows = [];
  eachComponentRow('bullets', seedDir, (r) => bulletRows.push(r));
  if (existsSync(resolve(seedDir, 'bullets.csv'))) {
    notes.push('bullets: data/seeds/bullets.csv is a pre-split flat file - run scripts/split-seeds-by-manufacturer.mjs and delete it');
    bulletRows.push(...readCsv(resolve(seedDir, 'bullets.csv')));
  }

  // Every BC-basis column is listed here, not just the standardized pair.
  //
  // This was silently dropping data. The insert originally carried bc_g1/bc_g7
  // and stopped, so the six Mach columns and bc_reference in the CSV were never
  // written to SQLite even though the schema and the manifest both define them
  // and hornady.csv fills them in. The CSV was right, the loader was wrong, and
  // nothing complained: the columns are nullable, so the insert succeeded and the
  // published 2.0 and 1.75 Mach figures simply were not there.
  //
  // Any future column added to data/schemas/bullets.yaml has to be added here too,
  // or it will be dropped the same quiet way.
  // The column list lives in one place and is read twice: once to build the
  // statement, once to check it against data/schemas/bullets.yaml below. Typing
  // it into the template and again into the manifest comparison is how the two
  // lists drifted apart in the first place.
  const BULLET_INSERT_SQL = `INSERT OR IGNORE INTO bullets
     (manufacturer_id, name, weight_grains, diameter_inches, bc_g1, bc_g7, product_line,
      caliber, sectional_density, twist_min_in, construction, base_type, tip_type,
      use_case, source_url, source_kind,
      part_number,
      bc_reference, bc_g1_mach_2_25, bc_g7_mach_2_25,
      bc_g1_mach_2_0, bc_g7_mach_2_0,
      bc_g1_mach_1_75, bc_g7_mach_1_75)
     VALUES ((SELECT id FROM manufacturers WHERE slug = ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
             ?, ?, ?, ?, ?, ?, ?, ?)`;

  const ins = db.prepare(BULLET_INSERT_SQL);

  // Derived from the SQL text rather than from the prepared statement, because
  // node:sqlite statements do not expose their source. If the INSERT gains a
  // column this picks it up with no edit; if it loses one, the manifest check
  // further down fails the build.
  LOADED_BULLET_COLUMNS = new Set(
    BULLET_INSERT_SQL.slice(
      BULLET_INSERT_SQL.indexOf('(') + 1,
      BULLET_INSERT_SQL.indexOf(')'),
    ).split(',').map((c) => c.trim()).filter(Boolean),
  );

  const insKind = db.prepare('INSERT OR IGNORE INTO manufacturer_kinds (manufacturer_id, kind, is_primary) VALUES (?,?,0)');
  let skippedBullets = 0;
  for (const r of bulletRows) {
    const who = `${r.manufacturer}/${r.bullet_name}`;

    // Enum check FIRST. An out-of-enum value makes INSERT OR IGNORE skip the
    // row without a word, so it has to be caught before the insert or the data
    // silently disappears.
    let badEnum = false;
    for (const [col, allowed] of Object.entries(BULLET_ENUMS)) {
      const v = (r[col] || '').trim();
      if (v && !allowed.includes(v)) {
        fail(`bullets: ${who} has ${col}="${v}", which is not a permitted value. Permitted: ${allowed.join(', ')}`);
        badEnum = true;
      }
    }
    if (badEnum) continue;

    if (!r.source_url) { fail(`bullets: ${who} missing source_url`); continue; }
    if (!r.weight_gr || !r.diameter_in) { fail(`bullets: ${who} missing weight_gr or diameter_in`); continue; }

    upsertManufacturer(r.manufacturer_slug, r.manufacturer, r.manufacturer_website);
    const mid = db.prepare('SELECT id FROM manufacturers WHERE slug = ?').get(r.manufacturer_slug);
    if (!mid) { fail(`bullets: cannot resolve manufacturer "${r.manufacturer_slug}"`); continue; }

    // This maker now makes bullets as well as anything else it already did.
    insKind.run(mid.id, 'bullet');

    try {
      const res = ins.run(r.manufacturer_slug, r.bullet_name, Number(r.weight_gr), Number(r.diameter_in),
        num(r.bc_g1), num(r.bc_g7), r.product_line || null, r.caliber || null,
        num(r.sectional_density), num(r.required_twist_in), r.construction || null,
        r.base_type || null, r.tip_type || null, r.use_case || null,
        r.source_url, r.source_kind || 'manufacturer',
        r.part_number || null,
        r.bc_reference || null,
        num(r.bc_g1_mach_2_25), num(r.bc_g7_mach_2_25),
        num(r.bc_g1_mach_2_0), num(r.bc_g7_mach_2_0),
        num(r.bc_g1_mach_1_75), num(r.bc_g7_mach_1_75));
      if (res.changes === 0) {
        // The message names the key that actually collides. It used to say
        // (manufacturer, name, weight), which was the old primary key and is no
        // longer one - a message naming the wrong key sends the next person
        // looking for a duplicate that does not exist.
        fail(`bullets: ${who} ${r.weight_gr}gr part ${r.part_number} was ignored - `
          + 'a bullet with the same (manufacturer, part_number) already exists');
        skippedBullets++;
      }
    } catch (err) {
      fail(`bullets: ${who} -> ${err.message}`);
    }
  }
  const insertedBullets = count('bullets');
  notes.push(`bullets: ${componentFiles('bullets', seedDir).length} per-manufacturer file(s), ${bulletRows.length} rows read, ${insertedBullets} in the table, ${skippedBullets} duplicate`);
}

loadOptional('community.csv', (rows) => {
  const ins = db.prepare(
    `INSERT INTO community_observations
     (topic, subtopic, cartridge, bullet, powder, claim_summary, numeric_value, unit,
      source_forum, source_url, source_date, agreement_level, confidence, safety_risk)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  );
  const TOPICS = ['case_life', 'brass_quality', 'annealing', 'primer_pockets', 'powder_temperature',
    'lot_variation', 'seating_depth', 'pressure_signs', 'primer_substitution', 'scavenging',
    'powder_availability', 'bullet_performance', 'load_development', 'equipment', 'other'];
  const AGREEMENT = ['widely_reported', 'commonly_reported', 'disputed', 'isolated'];
  const RISK = ['low', 'medium', 'high'];

  for (const r of rows) {
    if (!r.source_url) { fail(`community.csv: "${String(r.claim_summary).slice(0, 40)}..." has no source_url`); continue; }
    if (!TOPICS.includes(r.topic)) { fail(`community.csv: bad topic "${r.topic}"`); continue; }
    if (!AGREEMENT.includes(r.agreement_level)) { fail(`community.csv: bad agreement_level "${r.agreement_level}"`); continue; }
    if (!RISK.includes(r.safety_risk)) { fail(`community.csv: bad safety_risk "${r.safety_risk}"`); continue; }
    const conf = int(r.confidence);
    if (conf === null || conf < 1 || conf > 5) { fail(`community.csv: confidence "${r.confidence}" must be 1-5`); continue; }

    try {
      ins.run(r.topic, r.subtopic || null, r.cartridge || null, r.bullet || null, r.powder || null,
        r.claim_summary, num(r.numeric_value), r.unit || null,
        r.source_forum, r.source_url, r.source_date || null,
        r.agreement_level, conf, r.safety_risk);
    } catch (err) {
      fail(`community.csv: ${err.message}`);
    }
  }
});

// ------------------------------------------------- field-level provenance
//
// Optional: annotates how a non-published value was arrived at, so a cell that
// cannot be transcribed can still carry an honest, labelled number instead of
// being either blank-with-no-explanation or silently invented.
//
// The tier vocabulary is deliberately identical to
// packages/ballistics-core/src/provenance/Source.ts, so there is one idea in the
// project rather than two. The requirements below are the CSV mirror of the
// UnverifiedValueError that `derived()`/`estimated()` throw in that module.
const TIERS = ['published', 'derived', 'estimated', 'community'];
const ENTITY_TYPES = ['cartridge', 'bullet', 'powder', 'manufacturer', 'burn_rate_chart'];

loadOptional('value_provenance.csv', (rows) => {
  const ins = db.prepare(
    `INSERT INTO value_provenance
       (entity_type, entity_slug, field_name, tier, value, text_value, unit,
        source_id, method, reasoning, source_url, safety_risk, corroboration,
        reviewed_by, reviewed_on, notes)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  );

  for (const r of rows) {
    const where = `${r.entity_type}/${r.entity_slug}.${r.field_name}`;

    if (!ENTITY_TYPES.includes(r.entity_type)) {
      fail(`value_provenance.csv: ${where} has unknown entity_type "${r.entity_type}"`); continue;
    }
    if (!r.entity_slug) { fail(`value_provenance.csv: ${where} has no entity_slug`); continue; }
    if (!r.field_name) { fail(`value_provenance.csv: ${r.entity_slug} has no field_name`); continue; }
    if (!TIERS.includes(r.tier)) {
      fail(`value_provenance.csv: ${where} has invalid tier "${r.tier}" (must be one of ${TIERS.join(', ')})`); continue;
    }

    // The per-tier requirements. This is the whole point of the table: a tier
    // without its justification is rejected exactly as Source.ts throws.
    if (r.tier === 'derived' && !r.method) {
      fail(`value_provenance.csv: ${where} is tier=derived but has no method - a derived value must say how it was computed`); continue;
    }
    if ((r.tier === 'estimated' || r.tier === 'community') && !r.reasoning) {
      fail(`value_provenance.csv: ${where} is tier=${r.tier} but has no reasoning - an unsourced value must say why and from what`); continue;
    }
    if (r.tier === 'community' && !r.source_url) {
      fail(`value_provenance.csv: ${where} is tier=community but has no source_url - a claim with no link is not a claim`); continue;
    }
    if (r.tier === 'published' && !r.source_id) {
      fail(`value_provenance.csv: ${where} is tier=published but has no source_id - published means a citable source`); continue;
    }

    // A numeric annotation must be numeric. Catching a stray unit in the value
    // column here is far cheaper than discovering it in a drag calculation.
    const numeric = r.value === '' ? null : Number(r.value);
    if (r.value !== '' && !Number.isFinite(numeric)) {
      fail(`value_provenance.csv: ${where} has non-numeric value "${r.value}"`); continue;
    }
    if (r.text_value !== '' && numeric !== null) {
      fail(`value_provenance.csv: ${where} has both value and text_value - use one`); continue;
    }
    if (numeric === null && r.text_value === '') {
      fail(`value_provenance.csv: ${where} records no value at all - annotate a number or delete the row`); continue;
    }

    // corroboration, when given, must be in range
    let corr = null;
    if (r.corroboration !== '') {
      corr = Number(r.corroboration);
      if (!Number.isInteger(corr) || corr < 1 || corr > 5) {
        fail(`value_provenance.csv: ${where} has corroboration "${r.corroboration}" (must be an integer 1-5)`); continue;
      }
    }

    // The annotated entity must actually exist, or the annotation is attached
    // to nothing and will silently rot.
    const exists = {
      cartridge: 'SELECT 1 FROM cartridges WHERE slug = ?',
      bullet: 'SELECT 1 FROM bullets WHERE slug = ?',
      powder: 'SELECT 1 FROM powders WHERE slug = ?',
      manufacturer: 'SELECT 1 FROM manufacturers WHERE slug = ?',
      burn_rate_chart: 'SELECT 1 FROM powder_burn_rate_charts WHERE slug = ?',
    }[r.entity_type];
    if (exists && !db.prepare(exists).get(r.entity_slug)) {
      notes.push(`value_provenance.csv: ${where} annotates a ${r.entity_type} that is not in the database - check the slug`);
    }

    try {
      ins.run(
        r.entity_type, r.entity_slug, r.field_name, r.tier,
        numeric, r.text_value || null, r.unit || null,
        r.source_id ? Number(r.source_id) : null,
        r.method || null, r.reasoning || null, r.source_url || null,
        r.safety_risk || null, corr,
        r.reviewed_by || null, r.reviewed_on || null, r.notes || null,
      );
    } catch (err) {
      fail(`value_provenance.csv: ${where} -> ${err.message}`);
    }
  }
});

// ----------------------------------------------------------------- sourcing
//
// The component-finder backend (data/schema/013_sourcing.sql). Three optional
// seeds, loaded in dependency order: retailers, then search targets, then the
// listings that join them.
//
// The validation here is deliberately strict about the distinction that matters
// most for this feature: a listing may only claim `verified` if it says HOW it
// was verified. A finder that shows a green tick for a guess is worse than one
// that shows nothing, because the user will drive to a shop on the strength of
// it.

const SOURCE_TYPES = ['online', 'local_shop', 'manufacturer_direct',
  'marketplace', 'dealer_locator', 'out_of_stock_house'];
const MATCH_QUALITY = ['exact_sku', 'model', 'family', 'category'];
const SEARCH_CATEGORIES = ['bullet', 'powder', 'primer', 'brass', 'ammo',
  'cartridge', 'accessory', 'other'];
const LISTING_CONFIDENCE = ['verified', 'listed', 'likely', 'unknown'];
const SEARCH_ENTITY_TYPES = ['cartridge', 'bullet', 'powder', 'primer', 'brass',
  'ammo', 'product', 'shotshell'];

const retailerIdBySlug = new Map();

loadOptional('sourcing_retailers.csv', (rows) => {
  const ins = db.prepare(
    `INSERT INTO sourcing_retailers
       (manufacturer_id, source_type, ships_domestically, ships_to_regions,
        hazmat_shipping, directions, city, region_code, affiliate_network,
        network_store_id, link_template, feed_format, affiliate_status,
        scraping_status, notes)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  );

  for (const r of rows) {
    const slug = (r.manufacturer_slug || '').trim();
    if (!slug) { fail(`sourcing_retailers.csv: a row has no manufacturer_slug`); continue; }

    // The `manufacturers` Map only holds rows that came from manufacturers.csv.
    // The eight retailers are seeded by migration 003, so fall back to the
    // database before declaring one missing - otherwise every pre-seeded
    // retailer looks absent and the whole file fails.
    //
    // The lookup returns a full row with `id`. The in-memory `manufacturers` map
    // deliberately holds only {name, website} - it is populated from component
    // rows that never needed a rowid - so `m` must not come from it. Selecting
    // from the database unconditionally is both simpler and correct: a retailer
    // in manufacturers.csv is inserted by migration 003 or by this file's own
    // pass, and either way the row exists with a real id.
    const m = db.prepare('SELECT id, name, website FROM manufacturers WHERE slug = ?').get(slug);
    if (!m) {
      fail(`sourcing_retailers.csv: ${slug} is not in manufacturers.csv or the seeded directory - add the company first`);
      continue;
    }
    if (!SOURCE_TYPES.includes(r.source_type)) {
      fail(`sourcing_retailers.csv: ${slug} has invalid source_type "${r.source_type}"`); continue;
    }

    // A deep-link template with an unresolved placeholder would produce a
    // broken URL the moment tagging is switched on, so the shape is checked now
    // while it is still free to fix.
    if (r.link_template && !/^https:\/\//.test(r.link_template)) {
      fail(`sourcing_retailers.csv: ${slug} link_template must be an https URL`); continue;
    }
    if (r.link_template && /\{/.test(r.link_template)) {
      const bad = (r.link_template.match(/\{[^}]*\}/g) || [])
        .filter((p) => !['{sku}', '{search}'].includes(p));
      if (bad.length) {
        fail(`sourcing_retailers.csv: ${slug} link_template has unknown placeholder(s) ${bad.join(', ')} - only {sku} and {search} are supported`);
        continue;
      }
    }

    // A network we have not confirmed must stay NULL. The brief says not to
    // work on affiliate programs yet, and several of these retailers have
    // migrated programs, so a guessed network is worse than an empty one.
    if (r.network_store_id && !r.affiliate_network) {
      fail(`sourcing_retailers.csv: ${slug} has a network_store_id but no affiliate_network - the store ID is meaningless without the network`);
      continue;
    }

    try {
      const info = ins.run(
        m.id, r.source_type,
        r.ships_domestically === '' ? null : Number(r.ships_domestically),
        r.ships_to_regions || null,
        r.hazmat_shipping === '' ? null : Number(r.hazmat_shipping),
        r.directions || null, r.city || null, r.region_code || null,
        r.affiliate_network || null, r.network_store_id || null,
        r.link_template || null, r.feed_format || null,
        r.affiliate_status || 'unknown', r.scraping_status || 'unknown',
        r.notes || null,
      );
      retailerIdBySlug.set(slug, Number(info.lastInsertRowid));
    } catch (err) {
      fail(`sourcing_retailers.csv: ${slug} -> ${err.message}`);
    }
  }
  notes.push(`sourcing_retailers.csv: ${rows.length} rows, ${retailerIdBySlug.size} linked to manufacturers`);
});


const searchIdBySlug = new Map();

loadOptional('sourcing_searches.csv', (rows) => {
  const ins = db.prepare(
    `INSERT INTO sourcing_searches
       (slug, entity_type, entity_slug, display_name, search_terms,
        match_quality, manufacturer_part_number, category, notes, source_url)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
  );

  for (const r of rows) {
    if (!r.slug) { fail(`sourcing_searches.csv: a row has no slug`); continue; }
    if (!r.display_name) { fail(`sourcing_searches.csv: ${r.slug} has no display_name`); continue; }
    if (!r.search_terms) {
      // This is the string handed to a retailer's search box. Without it the
      // finder can only link a homepage, which defeats the point.
      fail(`sourcing_searches.csv: ${r.slug} has no search_terms - the finder needs a literal query to hand a retailer`);
      continue;
    }
    if (!MATCH_QUALITY.includes(r.match_quality)) {
      fail(`sourcing_searches.csv: ${r.slug} has invalid match_quality "${r.match_quality}"`); continue;
    }
    if (!SEARCH_CATEGORIES.includes(r.category)) {
      fail(`sourcing_searches.csv: ${r.slug} has invalid category "${r.category}"`); continue;
    }
    if (r.entity_type && !SEARCH_ENTITY_TYPES.includes(r.entity_type)) {
      fail(`sourcing_searches.csv: ${r.slug} has invalid entity_type "${r.entity_type}"`); continue;
    }
    // entity_type without entity_slug (or the reverse) is a half-built pointer.
    if (Boolean(r.entity_type) !== Boolean(r.entity_slug)) {
      fail(`sourcing_searches.csv: ${r.slug} must set both entity_type and entity_slug, or neither`);
      continue;
    }
    // A search target that claims to BE a component must point at one that
    // exists, or the finder resolves to a dangling reference.
    if (r.entity_type && r.entity_slug) {
      const table = { cartridge: 'cartridges', bullet: 'bullets', powder: 'powders' }[r.entity_type];
      if (table) {
        const hit = db.prepare(`SELECT 1 FROM ${table} WHERE slug = ?`).get(r.entity_slug);
        if (!hit) {
          notes.push(`sourcing_searches.csv: ${r.slug} points at ${r.entity_type}/${r.entity_slug}, which has no row in ${table} (slug column added in migration 013; existing rows stay NULL until backfilled)`);
        }
      }
    }
    // 'exact_sku' without a part number is a promise the data cannot keep.
    if (r.match_quality === 'exact_sku' && !r.manufacturer_part_number) {
      fail(`sourcing_searches.csv: ${r.slug} claims match_quality=exact_sku but has no manufacturer_part_number`);
      continue;
    }

    try {
      const info = ins.run(
        r.slug, r.entity_type || null, r.entity_slug || null,
        r.display_name, r.search_terms, r.match_quality,
        r.manufacturer_part_number || null, r.category,
        r.notes || null, r.source_url || null,
      );
      searchIdBySlug.set(r.slug, Number(info.lastInsertRowid));
    } catch (err) {
      fail(`sourcing_searches.csv: ${r.slug} -> ${err.message}`);
    }
  }
  notes.push(`sourcing_searches.csv: ${rows.length} rows, ${searchIdBySlug.size} inserted`);
});

loadOptional('sourcing_listings.csv', (rows) => {
  const ins = db.prepare(
    `INSERT INTO sourcing_listings
       (search_id, retailer_id, confidence, in_stock, stock_checked_on,
        retailer_sku, retailer_url, price_cents, price_observed_on, note,
        source_kind, source_url, verified_by, verified_on)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  );

  for (const r of rows) {
    const where = `${r.search_slug} -> ${r.retailer_slug}`;
    const sid = searchIdBySlug.get(r.search_slug);
    const rid = retailerIdBySlug.get(r.retailer_slug);

    if (!sid) { fail(`sourcing_listings.csv: ${where} - no such search_slug in sourcing_searches.csv`); continue; }
    if (!rid) { fail(`sourcing_listings.csv: ${where} - no such retailer_slug in sourcing_retailers.csv`); continue; }
    if (!LISTING_CONFIDENCE.includes(r.confidence)) {
      fail(`sourcing_listings.csv: ${where} has invalid confidence "${r.confidence}"`); continue;
    }

    // THE load-bearing rule. A `verified` or `listed` claim is a statement to a
    // user that they can go and buy this. It therefore requires saying how we
    // know. Without this, "verified" degenerates into "someone typed it".
    if ((r.confidence === 'verified' || r.confidence === 'listed')
        && !r.source_kind && !r.source_url) {
      fail(`sourcing_listings.csv: ${where} claims confidence=${r.confidence} with no source_kind or source_url - a verified claim must say how it was verified`);
      continue;
    }
    if (r.confidence === 'verified' && !r.verified_by) {
      fail(`sourcing_listings.csv: ${where} claims confidence=verified with no verified_by - manual verification is an editorial act and must be attributable`);
      continue;
    }

    // Stock claims are only meaningful with a date. An undated "in stock" is
    // the thing that erodes trust in a finder fastest.
    const hasStock = r.in_stock !== '';
    if (hasStock && !r.stock_checked_on) {
      fail(`sourcing_listings.csv: ${where} states in_stock but has no stock_checked_on - an undated stock claim is worthless`);
      continue;
    }
    // A price with no observation date is a price we cannot explain later.
    if (r.price_cents !== '' && !r.price_observed_on) {
      fail(`sourcing_listings.csv: ${where} has a price but no price_observed_on`);
      continue;
    }
    if (r.retailer_url && !/^https:\/\//.test(r.retailer_url)) {
      fail(`sourcing_listings.csv: ${where} retailer_url must be https`);
      continue;
    }

    try {
      ins.run(
        sid, rid, r.confidence,
        hasStock ? Number(r.in_stock) : null,
        r.stock_checked_on || null,
        r.retailer_sku || null, r.retailer_url || null,
        r.price_cents === '' ? null : Number(r.price_cents),
        r.price_observed_on || null, r.note || null,
        r.source_kind || null, r.source_url || null,
        r.verified_by || null, r.verified_on || null,
      );
    } catch (err) {
      fail(`sourcing_listings.csv: ${where} -> ${err.message}`);
    }
  }
  notes.push(`sourcing_listings.csv: ${rows.length} rows`);
});

// -------------------------------------------------- column manifest check
//
// The manifests in data/schemas/ are the authoritative column definitions, and
// this re-runs the same validation the generators use, so the build gate and
// `npm run data:build` can never disagree. Importing the shared module rather
// than reimplementing it is the point: one implementation, no drift.
//
// This is what catches the failure mode that cost 7 of 11 bullet rows on
// 2026-10-01 - a value outside the permitted set for its column, which
// INSERT OR IGNORE used to drop in silence.
// -------------------------------------------------- loader/manifest agreement
//
// The manifest says which columns exist; the INSERT above says which ones are
// actually written. Nothing previously connected those two lists, which is how
// the six Mach-basis columns and bc_reference came to be fully populated in
// hornady.csv and fully absent from the database. Every per-file check passed
// and the row count was correct, because the columns are nullable: the insert
// simply did not mention them.
//
// So compare the two lists directly. A column the manifest declares but the
// loader does not write is a silent data loss, and it should stop the build
// rather than be discovered later by someone wondering where a number went.
{
  let manifest = null;
  try { manifest = manifestLib.loadManifest('bullets'); } catch { /* reported elsewhere */ }
  const declared = manifest ? Object.keys(manifest.columns) : null;
  if (declared) {
    // Manifest names to bullets-table column names. Only these differ; the rest
    // are identical and pass through unchanged.
    const ALIAS = {
      weight_gr: 'weight_grains',
      diameter_in: 'diameter_inches',
      bullet_name: 'name',
      required_twist_in: 'twist_min_in',
      // Identity/provenance columns are resolved against manufacturers at load
      // time rather than stored on the bullet row.
      manufacturer: null,
      manufacturer_slug: null,
      manufacturer_website: null,
    };
    const target = new Set(
      declared.map((c) => (c in ALIAS ? ALIAS[c] : c)).filter((c) => c !== null),
    );
    const missing = [...target].filter((c) => !LOADED_BULLET_COLUMNS.has(c));
    if (missing.length) {
      fail(`bullets loader: manifest declares [${missing.join(', ')}] but the INSERT `
        + 'does not write them. Those CSV values reach the database as NULL.');
    }
  }
}

{
  const { listManifests, validateManifest, validateReferences } = manifestLib;
  const manifests = listManifests();
  for (const m of manifests) {
    const { problems, rows } = validateManifest(m);
    for (const p of problems) fail(`schema ${m.dataset}: ${p}`);
    notes.push(`schema ${m.dataset}: ${rows.length} rows validated against data/schemas/${m.__name}.yaml`);
  }
  // Cross-dataset references: a well-formed slug that points at a row which
  // does not exist passes every per-file check. Six powder brands were in
  // exactly that state - 156 rows joining to no manufacturer - with the whole
  // file-level validation reporting clean.
  for (const p of validateReferences(manifests)) fail(`schema refs: ${p}`);
}

// ----------------------------------------------------------------- assertions

const communityNoUrl = db.prepare(
  'SELECT COUNT(*) n FROM community_observations WHERE source_url IS NULL OR source_url = \'\'',
).get().n;
if (communityNoUrl) fail(`community: ${communityNoUrl} rows with no source_url`);

const noSource = db.prepare(
  'SELECT COUNT(*) n FROM cartridge_pressure_references WHERE source_id IS NULL AND source_url IS NULL',
).get().n;
if (noSource) fail(`pressure references with no provenance: ${noSource}`);

// The separation the brief requires. Community observations must never carry a
// `source_kind` of 'community' inside an official table - if that shows up,
// somebody has let a forum number masquerade as published data.
for (const t of ['bullets', 'powders', 'case_reuse_profiles', 'factory_brass_scavenging']) {
  const cols = db.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name);
  if (!cols.includes('source_kind')) continue;
  const bad = db.prepare(`SELECT COUNT(*) n FROM ${t} WHERE source_kind = 'community'`).get().n;
  if (bad) fail(`${t}: ${bad} rows marked source_kind='community' - community data must not live in official tables`);
}

// Official rows should be attributable, matching the project's stated
// "provenance is mandatory" invariant.
const powdersNoUrl = db.prepare(
  'SELECT COUNT(*) n FROM powders WHERE source_url IS NULL OR source_url = \'\'',
).get().n;
if (powdersNoUrl) fail(`powders with no source_url: ${powdersNoUrl}`);

const bulletsNoUrl = db.prepare(
  'SELECT COUNT(*) n FROM bullets WHERE source_url IS NULL OR source_url = \'\'',
).get().n;
if (bulletsNoUrl) fail(`bullets with no source_url: ${bulletsNoUrl}`);

// ------------------------------------------------- provenance consistency

// A value that no longer matches what the parent table holds means the parent
// was regenerated (a re-extract, a hand edit) without updating the annotation.
// The number in the CSV and the number the site would show have diverged, which
// is precisely the silent-drift failure the annotation layer exists to prevent.
const drift = db.prepare('SELECT * FROM provenance_value_drift').all();
for (const d of drift) {
  fail(`value_provenance drift: ${d.entity_slug}.${d.field_name} is annotated as `
    + `${d.annotated_value} but the cartridges table now holds ${d.current_value}`);
}

// A `published` pressure that nothing in `sources` backs is a dangling citation.
const orphanSources = db.prepare(
  `SELECT COUNT(*) n FROM value_provenance
    WHERE source_id IS NOT NULL
      AND source_id NOT IN (SELECT id FROM sources)`,
).get().n;
if (orphanSources) fail(`value_provenance: ${orphanSources} rows cite a source_id that does not exist`);

// Belt and braces on the tier requirements, re-asserted against the table rather
// than only at insert time, so a hand-edited INSERT in a future migration is
// caught as well.
const unreasonedEstimates = db.prepare(
  `SELECT COUNT(*) n FROM value_provenance
    WHERE tier IN ('estimated','community')
      AND (reasoning IS NULL OR reasoning = '')`,
).get().n;
if (unreasonedEstimates) {
  fail(`value_provenance: ${unreasonedEstimates} estimated/community rows with no reasoning`);
}
const methodlessDerived = db.prepare(
  `SELECT COUNT(*) n FROM value_provenance
    WHERE tier = 'derived' AND (method IS NULL OR method = '')`,
).get().n;
if (methodlessDerived) fail(`value_provenance: ${methodlessDerived} derived rows with no method`);

// Annotations pointing at cartridges that do not exist are rot, not findings.
const orphanAnnotations = db.prepare(
  `SELECT COUNT(*) n FROM value_provenance vp
    WHERE vp.entity_type = 'cartridge'
      AND NOT EXISTS (SELECT 1 FROM cartridges c WHERE c.slug = vp.entity_slug)`,
).get().n;
if (orphanAnnotations) {
  fail(`value_provenance: ${orphanAnnotations} rows annotate a cartridge slug that does not exist`);
}

// ------------------------------------------------------- sourcing consistency

// A listing pointing at a retailer or target that no longer exists is rot.
const orphanListings = db.prepare(
  `SELECT COUNT(*) n FROM sourcing_listings l
    WHERE NOT EXISTS (SELECT 1 FROM sourcing_searches s WHERE s.id = l.search_id)
       OR NOT EXISTS (SELECT 1 FROM sourcing_retailers r WHERE r.id = l.retailer_id)`,
).get().n;
if (orphanListings) fail(`sourcing: ${orphanListings} listings point at a missing search target or retailer`);

// Re-assert the verification-evidence rule against the table, not just at
// insert time, so a hand-written INSERT in a future migration is caught too.
const unevidencedClaims = db.prepare(
  `SELECT COUNT(*) n FROM sourcing_listings
    WHERE confidence IN ('verified', 'listed')
      AND source_kind IS NULL AND source_url IS NULL`,
).get().n;
if (unevidencedClaims) {
  fail(`sourcing: ${unevidencedClaims} verified/listed claims carry no evidence of how they were verified`);
}

const undatedStock = db.prepare(
  `SELECT COUNT(*) n FROM sourcing_listings WHERE in_stock IS NOT NULL AND stock_checked_on IS NULL`,
).get().n;
if (undatedStock) fail(`sourcing: ${undatedStock} listings assert stock with no date checked`);

// A search target that no retailer is known to carry is a dead end for the
// user. Not a build failure - it is the normal state of a new target - but it
// is the backlog, so it is reported.
const orphanTargets = db.prepare(
  `SELECT COUNT(*) n FROM sourcing_searches s
    WHERE s.is_active = 1
      AND NOT EXISTS (SELECT 1 FROM sourcing_listings l WHERE l.search_id = s.id AND l.is_active = 1)`,
).get().n;

// Every retailer needs a sourcing profile before the finder can return it.
const retailerBacklog = db.prepare('SELECT COUNT(*) n FROM sourcing_retailer_backlog').get().n;

const confMix = db.prepare(
  'SELECT confidence, COUNT(*) n FROM sourcing_listings GROUP BY confidence ORDER BY n DESC',
).all();

const finderRows = count('sourcing_listings');

// Component-finder readiness. Reported rather than enforced, because a target
// with no listings yet is a normal state of the backlog, not a defect.
if (count('sourcing_retailers') || count('sourcing_searches')) {
  console.log('');
  console.log('  component finder (where to buy):');
  console.log(`    retailers profiled:  ${count('sourcing_retailers')}${retailerBacklog ? `   (${retailerBacklog} seeded retailers still have no sourcing profile)` : ''}`);
  console.log(`    search targets:      ${count('sourcing_searches')}`);
  console.log(`    listings:            ${finderRows}`);
  for (const c of confMix) {
    console.log(`      ${String(c.confidence).padEnd(10)} ${String(c.n).padStart(4)}`);
  }
  if (orphanTargets) {
    console.log(`    targets with no source yet: ${orphanTargets}  <- nothing to show the user for these`);
  }
  // 'verified' is the number that matters. It should climb; 'likely' should
  // fall as real checks replace expectations.
  const verified = confMix.find((c) => c.confidence === 'verified');
  console.log(`    verified listings:   ${verified ? verified.n : 0}${verified ? '' : '   <- none verified against a live check yet'}`);
}

// --------------------------------------------------------------------- report
const tables = db.prepare(
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
).all().map((r) => r.name);

console.log('seed:check');
console.log('----------');
for (const t of tables) {
  const n = count(t);
  if (n > 0) console.log(`  ${t.padEnd(30)} ${String(n).padStart(6)} rows`);
}

const disputes = db.prepare('SELECT * FROM cartridge_pressure_disputes').all();
console.log('');
console.log(`  pressure references:        ${count('cartridge_pressure_references')}`);
console.log(`  pressure disputes:          ${disputes.length}`);
for (const d of disputes) {
  console.log(`    - ${d.cartridge_name} ${d.standard_body}/${d.method}: saw ${d.values_seen} values (${d.sources})`);
}

// How much of the catalog rests on something other than a published figure.
// This number should only ever go DOWN as real sources are found.
const provSummary = db.prepare(
  'SELECT tier, COUNT(*) n, SUM(CASE WHEN safety_risk=\'high\' THEN 1 ELSE 0 END) hi FROM value_provenance GROUP BY tier',
).all();
if (provSummary.length) {
  console.log('');
  console.log('  value provenance (how non-blank values were arrived at):');
  for (const s of provSummary) {
    console.log(`    ${s.tier.padEnd(12)} ${String(s.n).padStart(4)}${s.hi ? `   (${s.hi} high safety risk)` : ''}`);
  }
  const promoted = db.prepare('SELECT COUNT(*) n FROM provenance_community_promoted').get().n;
  if (promoted) {
    console.log(`    ${''.padEnd(12)} ${String(promoted).padStart(4)} community-sourced values in official columns - review these`);
  }
}

if (notes.length) {
  console.log('\nnotes:');
  for (const n of notes) console.log('  - ' + n);
}

if (problems.length) {
  // stdout, not stderr: Windows PowerShell 5.1 converts a native process's
  // stderr into an ErrorRecord that never reaches this file, which hid real
  // failures here. The exit code still fails the build.
  console.log('\nFAILURES:');
  for (const p of problems) console.log('  x ' + p);
  console.log(`\n${problems.length} problem(s)`);
  process.exit(1);
}

console.log('\nseed data verified');
