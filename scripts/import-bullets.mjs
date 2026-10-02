// Merge parsed BC data into a per-manufacturer bullet CSV.
//
// This is the fast path: given a committed extract plus a SKU map, it rewrites
// the manufacturer CSV with the new BC columns populated. It is deliberately
// boring - the extraction is validated by test-bullet-sources.mjs, and this
// only does the mechanical merge.
//
//   node scripts/import-bullets.mjs hornady
//   node scripts/import-bullets.mjs hornady --dry-run
//
// A row is only written when we have a manufacturer SKU. Without one the bullet
// cannot be bought, cannot be deep-linked by the component finder, and cannot
// be cross-checked against the product page - so a BC figure alone is not worth
// a row. Missing SKUs are reported, never guessed.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { PARSERS } from './lib/bullet-sources.mjs';
import { loadManifest } from './lib/data.mjs';

// SKU / identity map, read off the manufacturer's own product pages.
// https://www.hornady.com/bullets/rifle/22-cal-.224-62-gr-eld-vt   -> Item #22762
// https://www.hornady.com/bullets/rifle/6mm-.243-80-gr-eld-vt     -> Item #24372
// https://www.hornady.com/bullets/rifle/6.5mm-.264-100-gr-eld-vt  -> Item #26103
// https://www.hornady.com/bullets/rifle/30-cal-.308-174-gr-eld-vt -> Item #30620
//
// Hornady needs this because its /bc page publishes no part numbers; Berger
// carries them in the chart, so its map is empty and nothing is invented.
const SKU = {
  hornady: {
    62:  { part_number: '22762', caliber: '.22', bullet_dia_in: 0.224 },
    80:  { part_number: '24372', caliber: '6mm', bullet_dia_in: 0.243 },
    100: { part_number: '26103', caliber: '6.5mm', bullet_dia_in: 0.264 },
    174: { part_number: '30620', caliber: '.30', bullet_dia_in: 0.308 },
  },
  berger: {},
};

/** Display name, used for the manufacturer column. */
const nameOf = { hornady: 'Hornady', berger: 'Berger', sierra: 'Sierra' };

/**
 * How each parser's output maps onto CSV columns.
 *
 * This is the whole reason the importer is not a fixed template. Hornady's rows
 * are matched to a SKU by weight and its BCs are Mach-stamped; Berger's rows
 * carry their own part number and a true diameter, and its BCs have no stated
 * basis. Writing either one with the other's assumptions would produce a file
 * that validates cleanly and is quietly wrong.
 */
const MAPPING = {
  hornady: (p, sku) => ({
    part_number: sku.part_number,
    caliber: sku.caliber,
    // True OD from the product page, not the caliber designation.
    diameter_in: sku.bullet_dia_in,
    product_line: p.product_line,
    bullet_name: p.product_line,
    weight_gr: p.weight_gr,
    bc_g1: p.bc_g1,
    bc_g7: p.bc_g7,
    bc_reference: p.bc_reference,
    ...Object.fromEntries(
      ['bc_g1_mach_2_25', 'bc_g7_mach_2_25', 'bc_g1_mach_2_0', 'bc_g7_mach_2_0',
        'bc_g1_mach_1_75', 'bc_g7_mach_1_75']
        .filter((c) => p[c] !== null && p[c] !== undefined).map((c) => [c, p[c]]),
    ),
    construction: 'jacketed',
    tip_type: 'polymer_tip',
    use_case: 'varmint',
  }),
  berger: (p) => ({
    part_number: p.part_number,
    caliber: p.caliber,
    // Berger's chart gives a real measurement, which is what this column wants.
    diameter_in: p.bullet_dia_in,
    product_line: p.product_line,
    bullet_name: p.product_line,
    weight_gr: p.weight_gr,
    sectional_density: p.sectional_density,
    required_twist_in: p.required_twist_in,
    construction: 'jacketed',
    base_type: p.base_type,
    bc_g1: p.bc_g1,
    bc_g7: p.bc_g7,
    bc_reference: p.bc_reference,
  }),
};

const slug = process.argv[2];
const dryRun = process.argv.includes('--dry-run');
const parser = slug && PARSERS[slug];
const map = slug && MAPPING[slug];
if (!parser || !map) {
  console.error(`usage: node scripts/import-bullets.mjs <${Object.keys(PARSERS).join('|')}> [--dry-run]`);
  process.exit(1);
}

// Each source has its own committed extract, named by the parser so the two
// cannot drift: hornady-bc.txt, berger-reference-charts.html.
const extractPath = parser.extract;
if (!existsSync(extractPath)) {
  console.error(`missing extract ${extractPath}. Fetch and commit it before importing.`);
  process.exit(1);
}

const csvPath = `data/seeds/bullets/${slug}.csv`;
const isNew = !existsSync(csvPath);
const lines = isNew ? [] : readFileSync(csvPath, 'utf8').trim().split(/\r?\n/);
const header = isNew
  ? readFileSync('data/seeds/bullets/hornady.csv', 'utf8').split(/\r?\n/)[0].split(',')
  : lines[0].split(',');

// The header comes from the CSV, so a file written before a column existed
// would drop that column's values. hornady.csv predates bc_reference, and the
// symptom was exact: Berger rows imported without a basis, which the manifest
// default then read as Mach 2.25 - a claim the source never made. Extend the
// header to the manifest's full column list so a lagging file cannot silently
// narrow what is recorded.
{
  const manifest = loadManifest('bullets');
  for (const col of Object.keys(manifest.columns)) {
    if (!header.includes(col)) header.push(col);
  }
}

const name = nameOf[slug] || slug;
const out = [header.join(',')];
const existing = lines.slice(1).map((l) => l.split(','));
// Preserve every existing row, widened with blank new columns.
for (const r of existing) {
  const row = r.concat(new Array(Math.max(0, header.length - r.length)).fill(''));
  out.push(row.map((v) => (/[",]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(','));
}

const parsed = parser.parse(readFileSync(extractPath, 'utf8'));
let added = 0, skipped = 0;

// Rows the parser deliberately set aside, each with its reason. Reported here so
// "109 rows" is never reported without "and 2 more we could not use".
for (const s of parsed.skipped ?? []) {
  console.warn(`  SET ASIDE ${s.part_number} "${s.description}": ${s.reason}`);
}

for (const p of parsed) {
  // Hornady matches on weight against a hand-entered SKU map; Berger carries
  // its own part number, so an absent map entry is not a failure there.
  const sku = (SKU[slug] || {})[p.weight_gr];
  const fields = map(p, sku ?? {});
  if (!fields.part_number) {
    console.warn(`  SKIP ${p.weight_gr}gr ${p.product_line}: no manufacturer SKU`);
    skipped++;
    continue;
  }
  const dup = existing.some((r) => r[header.indexOf('part_number')] === fields.part_number);
  if (dup) { console.log(`  have ${fields.part_number} ${p.weight_gr}gr ${p.product_line}`); continue; }

  const row = new Array(header.length).fill('');
  for (const [k, v] of Object.entries(fields)) {
    const i = header.indexOf(k);
    // A field the header does not have is a manifest/loader mismatch, and is
    // worth shouting about rather than dropping: it is exactly how the BC-basis
    // columns went missing from the database once already.
    if (i === -1) {
      console.error(`  COLUMN MISSING: "${k}" is not in the bullets header; value ${v} dropped`);
      continue;
    }
    row[i] = v ?? '';
  }
  row[header.indexOf('manufacturer')] = name;
  row[header.indexOf('manufacturer_slug')] = slug;
  row[header.indexOf('manufacturer_website')] = parser.website;
  row[header.indexOf('source_url')] = parser.url;
  row[header.indexOf('source_kind')] = 'manufacturer';

  out.push(row.map((v) => (/[",]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(','));
  console.log(`  + ${fields.part_number} ${fields.caliber ?? ''} ${p.weight_gr}gr `
    + `${p.product_line}  G1 ${p.bc_g1} G7 ${p.bc_g7} (${p.bc_reference})`);
  added++;
}

console.log(`\n${dryRun ? 'DRY RUN - ' : ''}${added} added, ${skipped} skipped, `
  + `${existing.length} existing${isNew ? ' (new file)' : ''}`);
// Match the line endings the rest of the seeds use. A file with mixed CRLF and
// bare LF reads fine but produces noisy diffs on every row the tool touches.
if (!dryRun) writeFileSync(csvPath, out.join('\r\n') + '\r\n');
