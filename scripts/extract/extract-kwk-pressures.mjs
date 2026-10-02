// Extracts the SAAMI/CIP cartridge pressure cross-reference from the archived
// copy of kwk.us/pressures.html into a CSV seed.
//
// The source page is a fixed-width <pre> block, not a <table>. That is good
// news: the columns are positional, so they can be parsed exactly rather than
// guessed from token order. Rows where a cartridge has no SAAMI number simply
// leave that column blank, which token-order parsing would silently
// mis-assign - a real hazard for a pressure figure.
//
// IMPORTANT PRECISION CAVEAT: the source rounds up to the nearest ksi (1000
// psi). Every row is therefore written with unit 'ksi_rounded', never as an
// exact MAP. The authority remains SAAMI Z299.x / CIP TDCC.
//
//   node scripts/extract-kwk-pressures.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..', '..');
const src = resolve(root, 'data/published/kwk-cartridge-pressure-standards.html');
const out = resolve(root, 'data/seeds/cartridge_pressures.csv');

if (!existsSync(src)) {
  console.log('missing ' + src + ' - run: npm run data:fetch');
  process.exit(1);
}

const html = readFileSync(src, 'utf8');

// Isolate the fixed-width block.
const pre = html.match(/<pre>([\s\S]*?)<\/pre>/);
if (!pre) {
  console.error('no <pre> block found - page layout changed, parser needs updating');
  process.exit(1);
}
const block = pre[1].replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');

// Column ranges measured from the header:
//   "                   SAAMI  CIP         SAAMI  CIP  other"
const COL = {
  name: [0, 16],
  saamiPsi: [17, 24],
  cipPsi: [25, 30],
  saamiCup: [31, 44],
  cipCup: [45, 49],
  other: [50, 200],
};

const slice = (line, [a, b]) => line.slice(a, b).trim();
const digits = (s) => {
  const m = s.match(/^(\d+(?:\.\d+)?)/);
  return m ? m[1] : '';
};

const rows = [];
for (const raw of block.split(/\r?\n/)) {
  const line = raw.replace(/\s+$/, '');
  const name = slice(line, COL.name);

  // Skip blank lines and the two header lines.
  if (!name) continue;
  if (/^(piezo|crusher|SAAMI|CIP)/i.test(name)) continue;
  if (!/[.\dx]/.test(name)) continue;

  const sS = slice(line, COL.saamiPsi);
  const sC = slice(line, COL.cipPsi);
  const cupS = slice(line, COL.saamiCup);
  const cupC = slice(line, COL.cipCup);
  const other = slice(line, COL.other);

  const row = {
    cartridgeName: name.replace(/\s*:\s*$/, '').trim(),
    saamiPiezoKsi: digits(sS),
    cipPiezoKsi: digits(sC),
    saamiCup: digits(cupS),
    cipCup: digits(cupC),
    other: other || '',
    // Markers the source uses to qualify a number.
    footnote: [sS, sC, cupS, cupC].join(' ').replace(/[\d.\s]/g, '') || '',
  };

  if (!row.saamiPiezoKsi && !row.cipPiezoKsi && !row.saamiCup && !row.cipCup) continue;
  rows.push(row);
}

const esc = (v) => {
  const s = String(v ?? '');
  return /[",]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

const header = [
  'cartridge_name',
  'saami_piezo_ksi',
  'cip_piezo_ksi',
  'saami_cup',
  'cip_cup',
  'other',
  'footnote',
  'unit_note',
];

const csv = [
  header.join(','),
  ...rows.map((r) =>
    [
      esc(r.cartridgeName),
      esc(r.saamiPiezoKsi),
      esc(r.cipPiezoKsi),
      esc(r.saamiCup),
      esc(r.cipCup),
      esc(r.other),
      esc(r.footnote),
      esc('ksi_rounded_up_to_1000psi'),
    ].join(','),
  ),
].join('\n');

writeFileSync(out, csv + '\n');

const withSaami = rows.filter((r) => r.saamiPiezoKsi).length;
const withCip = rows.filter((r) => r.cipPiezoKsi).length;
const footnoted = rows.filter((r) => r.footnote).length;
console.log(`parsed ${rows.length} rows -> ${out}`);
console.log(`  with SAAMI piezo: ${withSaami}`);
console.log(`  with CIP piezo:   ${withCip}`);
console.log(`  footnoted rows:   ${footnoted} (source markers: * estimate, ! uncertain, ? disputed)`);
