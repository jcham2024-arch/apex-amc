// Extracts the SAAMI maximum-average-pressure table from the archived copy of
// leverguns.com/articles/saami_pressures.htm as an independent second opinion.
//
// Why a second source exists at all: the kwk.us cross-reference (see
// extract-kwk-pressures.mjs) is a compilation, and compilations carry typos.
// It lists 6.5 Creedmoor SAAMI as 52 ksi where SAAMI Z299.4 says 62,000 psi.
// One source is an assertion; two sources that disagree are a finding. This
// file is deliberately parsed separately so the disagreement is detected
// rather than inherited.
//
// The page is a real <table> laid out as repeating (cartridge, pressure)
// pairs, two pairs per row.
//
//   node scripts/extract-leverguns-pressures.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..', '..');
const src = resolve(root, 'data/published/leverguns-saami-pressures.html');
const out = resolve(root, 'data/seeds/cartridge_pressures_secondary.csv');

if (!existsSync(src)) {
  console.log('missing ' + src + ' - run: npm run data:fetch');
  process.exit(1);
}

const html = readFileSync(src, 'utf8');

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&frac12;/g, '1/2')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));

const cellText = (s) => decode(s.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

const tableMatches = [...html.matchAll(/<table[\s\S]*?<\/table>/gi)];

const rows = [];
let section = 'unknown';
let cursor = 0;

for (const tm of tableMatches) {
  const table = tm[0];
  const end = tm.index + table.length;

  // The page's sponsor and footer furniture is not data.
  if (/Sponsors of Leverguns/i.test(table)) {
    cursor = end;
    continue;
  }

  // The section heading is *inside* the same <table> element as its rows
  // (the page wraps heading and data together). So the window has to run from
  // the end of the previous table to the end of this one. Searching only
  // before the table finds nothing for the first one, and then every later
  // table inherits the previous section - which labelled all 35 pistol
  // cartridges 'rifle'.
  const window = html.slice(cursor, end);
  const headings = [...window.matchAll(/(Rifle|Pistol|Shotgun)\s+Pressure\s+Specifications/gi)];
  if (headings.length) section = headings[headings.length - 1][1].toLowerCase();
  cursor = end;

  const trs = [...table.matchAll(/<tr[\s\S]*?<\/tr>/gi)];
  // Layout furniture, not a pressure table.
  if (trs.length < 5) continue;

  for (const tr of trs) {
    const cells = [...tr[0].matchAll(/<t[dh][\s\S]*?<\/t[dh]>/gi)].map((c) => cellText(c[0]));
    if (cells.length < 2) continue;

    // Pairs of (name, pressure) left to right.
    for (let i = 0; i + 1 < cells.length; i += 2) {
      const name = cells[i];
      const rawPressure = cells[i + 1];
      if (!name || !rawPressure) continue;

      const m = rawPressure.match(/^([\d,]+(?:\.\d+)?)\s*(cup)?/i);
      if (!m) continue;
      if (!/[A-Za-z0-9]/.test(name)) continue;
      // Header row: "Cartridge | Pressure (Max Avg)".
      if (/^cartridge$/i.test(name) || /pressure/i.test(name)) continue;

      rows.push({
        cartridge: name.replace(/\s+/g, ' ').trim(),
        value: m[1].replace(/,/g, ''),
        unit: m[2] ? 'cup' : 'psi',
        family: section,
      });
    }
  }
}

// De-duplicate on the natural key; the page repeats nothing, but be safe.
const seen = new Set();
const unique = rows.filter((r) => {
  const k = `${r.cartridge}|${r.unit}`.toLowerCase();
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

const esc = (v) => {
  const s = String(v ?? '');
  return /[",]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

writeFileSync(
  out,
  [
    'cartridge_name,pressure_value,pressure_unit,family,source_url,source_kind,source_note',
    ...unique.map((r) =>
      [
        esc(r.cartridge),
        esc(r.value),
        esc(r.unit),
        esc(r.family),
        esc('https://www.leverguns.com/articles/saami_pressures.htm'),
        esc('compilation'),
        esc('SAAMI specs as of 2004; values given in psi unless marked cup'),
      ].join(','),
    ),
  ].join('\n') + '\n',
);

const byFamily = unique.reduce((a, r) => ((a[r.family] = (a[r.family] ?? 0) + 1), a), {});
console.log(`parsed ${unique.length} rows -> ${out}`);
console.log('  by family: ' + JSON.stringify(byFamily));
