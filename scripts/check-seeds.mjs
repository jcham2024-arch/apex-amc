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
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const schemaDir = resolve(root, 'data/schema');
const seedDir = resolve(root, 'data/seeds');
const incomingDir = resolve(root, 'data/incoming');

const problems = [];
const notes = [];
const fail = (msg) => problems.push(msg);

// ----------------------------------------------------------------- utilities

function readCsv(path) {
  const text = readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
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
    // Carry the real cell count: readCsv pads missing columns to '', so the
    // key count is always header.length and a short row would otherwise look
    // well-formed. Nine Alliant rows have a field missing and their columns
    // are shifted; this is what lets the loader see that.
    const row = { __cells: cells.length };
    header.forEach((h, i) => { row[h] = (cells[i] ?? '').trim(); });
    return row;
  });
  rows.headerLen = header.length;
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

// ------------------------------------------------------------------- powders
// Two sources: the curated seed (data/seeds/) and the raw research drop
// (data/incoming/, gitignored). Merge both so a research pass and a curated
// correction can coexist without either overwriting the other.
const powderFiles = [
  resolve(seedDir, 'powders.csv'),
  resolve(incomingDir, 'powders.csv'),
].filter(existsSync);

let powderRows = [];
if (powderFiles.length) {
  const rows = powderFiles.flatMap((f) => readCsv(f));
  const headerLen = 10;

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
    if (r.__cells !== headerLen) continue; // counted as malformed below
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

  const malformed = rows.filter((r) => r.__cells !== headerLen);
  if (malformed.length) {
    fail(
      `powders: ${malformed.length} of ${rows.length} rows have the wrong number of columns ` +
      `(expected ${headerLen}) - a field is missing and every column after it is shifted. ` +
      `Affected: ${malformed.slice(0, 3).map((r) => `${r.manufacturer}/${r.product_name}`).join(', ')}`,
    );
  }

  // Report the counts unconditionally: a loader that silently reads fewer
  // rows than the file contains is exactly the failure mode worth catching.
  notes.push(`powders: read ${rows.length} rows from ${powderFiles.length} file(s), loaded ${loaded}, malformed ${malformed.length}`);

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
if (existsSync(kwkFile)) {
  for (const r of readCsv(kwkFile)) {
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
  }
  if (kwkUnmapped) {
    notes.push(
      `${kwkUnmapped} kwk pressure rows were not loaded because the cartridge has no known ` +
      `family (family is NOT NULL). They remain in cartridge_pressures.csv; add them to ` +
      `cartridges.csv with a family to load them.`,
    );
  }
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
loadOptional('cartridge_specs.csv', (rows) => {
  const upd = db.prepare(
    `UPDATE cartridges SET case_length_max_in=?, max_col_in=?, saami_max_psi=?, cip_max_bar=?,
       bullet_dia_in=?, rim_dia_in=?, head_dia_in=?, capacity_gr_h2o=?, primer_type=?,
       typical_twist_in=?, is_reloadable=?, notes=?, source_id=?
     WHERE slug = ?`,
  );
  const del = db.prepare('DELETE FROM cartridge_pressure_references WHERE cartridge_id = ? AND source_kind = ?');
  for (const r of rows) {
    const c = db.prepare('SELECT id FROM cartridges WHERE slug = ?').get(r.slug);
    if (!c) { fail(`cartridge_specs.csv: unknown slug "${r.slug}"`); continue; }
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
});

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

loadOptional('bullets.csv', (rows) => {
  const ins = db.prepare(
    `INSERT OR IGNORE INTO bullets
     (manufacturer_id, name, weight_grains, diameter_inches, bc_g1, bc_g7, product_line,
      caliber, sectional_density, twist_min_in, construction, base_type, tip_type,
      use_case, source_url, source_kind)
     VALUES ((SELECT id FROM manufacturers WHERE slug = ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insKind = db.prepare('INSERT OR IGNORE INTO manufacturer_kinds (manufacturer_id, kind, is_primary) VALUES (?,?,0)');
  for (const r of rows) {
    if (!r.source_url) { fail(`bullets.csv: ${r.manufacturer}/${r.bullet_name} missing source_url`); continue; }
    if (!r.weight_gr || !r.diameter_in) { fail(`bullets.csv: ${r.bullet_name} missing weight_gr or diameter_in`); continue; }
    if (r.source_kind && !['manufacturer', 'distributor', 'compilation', 'community'].includes(r.source_kind)) {
      fail(`bullets.csv: ${r.bullet_name} bad source_kind "${r.source_kind}"`); continue;
    }

    upsertManufacturer(r.manufacturer_slug, r.manufacturer, r.manufacturer_website);
    const mid = db.prepare('SELECT id FROM manufacturers WHERE slug = ?').get(r.manufacturer_slug);
    if (!mid) { fail(`bullets.csv: cannot resolve manufacturer "${r.manufacturer_slug}"`); continue; }

    // This maker now makes bullets as well as anything else it already did.
    insKind.run(mid.id, 'bullet');

    try {
      ins.run(r.manufacturer_slug, r.bullet_name, Number(r.weight_gr), Number(r.diameter_in),
        num(r.bc_g1), num(r.bc_g7), r.product_line || null, r.caliber || null,
        num(r.sectional_density), num(r.required_twist_in), r.construction || null,
        r.base_type || null, r.tip_type || null, r.use_case || null,
        r.source_url, r.source_kind || 'manufacturer');
    } catch (err) {
      fail(`bullets.csv: ${r.manufacturer}/${r.bullet_name} -> ${err.message}`);
    }
  }
});

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
