import { readFileSync } from 'node:fs';
import { HORNADY, BERGER, BERGER_HEADERS, ParseError } from '../shared/bullet-sources.mjs';

/** Build a fixture table with a correct header, so tests can vary one thing. */
const header = () => `<tr>${BERGER_HEADERS.map((h) => `<th>${h}</th>`).join('')}</tr>`;

const text = readFileSync('data/extracts/hornady-bc.txt', 'utf8');
const rows = HORNADY.parse(text);

console.log(`parsed ${rows.length} rows from the committed extract\n`);

// Every figure here was read off the page by eye and typed into the extract.
// These assertions are that same reading, so a regression in the parser is
// caught even though the extract itself is the input.
const expect = [
  { weight: 62, series: 'ELD-VT', g1: [0.395, 0.389, 0.385], g7: [0.199, 0.195, 0.194] },
  { weight: 80, series: 'ELD-VT', g1: [0.410, 0.406, 0.403], g7: [0.206, 0.204, 0.203] },
  { weight: 100, series: 'ELD-VT', g1: [0.448, 0.441, 0.434], g7: [0.226, 0.222, 0.218] },
  { weight: 174, series: 'ELD-VT', g1: [0.573, 0.564, 0.563], g7: [0.289, 0.283, 0.283] },
];
const MACH = ['mach_2_25', 'mach_2_0', 'mach_1_75'];

let bad = 0;
// One row per bullet. Three Mach figures must NOT become three rows.
if (rows.length !== expect.length) {
  console.log(`FAIL: expected ${expect.length} rows (one per bullet), got ${rows.length}`);
  bad++;
}
for (const e of expect) {
  const r = rows.find((x) => x.weight_gr === e.weight);
  if (!r) { console.log(`MISSING ${e.weight}gr`); bad++; continue; }
  if (r.product_line !== e.series) { console.log(`SERIES ${e.weight}gr: ${r.product_line}`); bad++; }
  // The standardized pair must be the Mach 2.25 figures.
  if (r.bc_reference !== 'mach_2_25') { console.log(`BASIS ${e.weight}gr: ${r.bc_reference}`); bad++; }
  if (r.bc_g1 !== e.g1[0] || r.bc_g7 !== e.g7[0]) {
    console.log(`STANDARD ${e.weight}gr: got g1=${r.bc_g1} g7=${r.bc_g7}, want g1=${e.g1[0]} g7=${e.g7[0]}`);
    bad++;
  }
  // All three Mach groups retained in their own columns.
  MACH.forEach((m, i) => {
    if (r[`bc_g1_${m}`] !== e.g1[i] || r[`bc_g7_${m}`] !== e.g7[i]) {
      console.log(`EXTRA ${e.weight}gr ${m}: got g1=${r[`bc_g1_${m}`]} g7=${r[`bc_g7_${m}`]}, want g1=${e.g1[i]} g7=${e.g7[i]}`);
      bad++;
    }
  });
}
console.log(bad ? `${bad} problem(s)` : 'all values match the source');

// A G1 must exceed its G7. If a parse ever swaps them this fires.
for (const r of rows) {
  if (!(r.bc_g1 > r.bc_g7)) { console.log(`IMPLAUSIBLE ${r.weight}gr ${r.bc_reference}: g1=${r.bc_g1} g7=${r.bc_g7}`); bad++; }
}

// A layout change must throw, not silently mis-parse.
console.log('\nguard: odd number of BC values must throw');
try {
  HORNADY.parse('6mm 80gr ELD-VT 0.410 G1 0.206 G7 0.406 G1');
  console.log('  FAIL: it did not throw');
  bad++;
} catch (e) {
  console.log(`  ok  threw ${e.constructor.name}: ${e.message.slice(0, 90)}`);
  // The guards must be a specific, catchable type, not a bare Error, so a
  // caller can tell "the page changed under me" apart from a real bug.
  if (!(e instanceof ParseError)) { console.log('  FAIL: not a ParseError'); bad++; }
}

// Swapped G7/G1 must also throw rather than be accepted.
console.log('\nguard: G7-before-G1 must throw');
try {
  HORNADY.parse('6mm 80gr ELD-VT 0.206 G7 0.410 G1');
  console.log('  FAIL: it did not throw');
  bad++;
} catch (e) {
  console.log(`  ok  threw ${e.constructor.name}: ${e.message.slice(0, 90)}`);
  if (!(e instanceof ParseError)) { console.log('  FAIL: not a ParseError'); bad++; }
}

// ---------------------------------------------------------------------------
// Berger
// ---------------------------------------------------------------------------
// Parsed from the committed HTML extract. Berger's chart is server-rendered with
// a real header row, so this exercises the opposite path from Hornady: instead of
// values that label themselves inline ("0.395 G1"), column identity comes from
// the publisher's own <th> text.
console.log('\n=== Berger ===');

const bergerRows = BERGER.parse(readFileSync('data/extracts/berger-reference-charts.html', 'utf8'));
const skippedRows = bergerRows.skipped ?? [];
console.log(`parsed ${bergerRows.length} rows, set aside ${skippedRows.length}`);

if (bergerRows.length !== 109) {
  console.log(`FAIL: expected 109 rows from the committed extract, got ${bergerRows.length}`);
  bad++;
}

// Spot-checks read off the source by eye: a flat base (no G7 at all), a boat
// tail (G7 present), and the largest-calibre row on the chart.
//
// 37407 is also the row that carries the U+2033 double-prime inch mark in its
// twist cell ("1:8″") while every other row uses ASCII ". It is the reason the
// twist parser accepts both, so it is asserted here on purpose.
const bergerExpect = [
  { part: '17308', dia: 0.172, wt: 25, sd: 0.121, g1: 0.152, g7: null, base: 'flat', twist: 10 },
  { part: '20304', dia: 0.204, wt: 40, sd: 0.137, g1: 0.227, g7: 0.116, base: 'boat_tail', twist: 12 },
  { part: '37407', dia: 0.375, wt: 407, sd: 0.413, g1: 1.022, g7: 0.523, base: 'boat_tail', twist: 8 },
];
for (const e of bergerExpect) {
  const r = bergerRows.find((x) => x.part_number === e.part);
  if (!r) { console.log(`MISSING Berger ${e.part}`); bad++; continue; }
  const got = {
    dia: r.bullet_dia_in, wt: r.weight_gr, sd: r.sectional_density,
    g1: r.bc_g1, g7: r.bc_g7, base: r.base_type, twist: r.required_twist_in,
  };
  for (const k of Object.keys(got)) {
    if (got[k] !== e[k]) {
      console.log(`Berger ${e.part} ${k}: got ${got[k]}, want ${e[k]}`);
      bad++;
    }
  }
}

// Berger publishes no BC basis, so every row must say so rather than implying
// the standardized one. Importing these as Mach 2.25 would be an assumption.
if (bergerRows.some((r) => r.bc_reference !== 'unspecified')) {
  console.log('FAIL: a Berger row claims a BC basis the source does not state');
  bad++;
}

// "Cal (Dia)" holds BOTH "17 Cal" and "(0.172)". Only the parenthesised value is
// a measurement; conflating them is the documented diameter_in trap.
if (bergerRows[0].caliber !== '17 Cal' || bergerRows[0].bullet_dia_in !== 0.172) {
  console.log(`FAIL: Cal (Dia) not split: caliber="${bergerRows[0].caliber}" `
    + `dia=${bergerRows[0].bullet_dia_in}`);
  bad++;
}

// Invariants that must hold on every row, whatever the source claims.
for (const r of bergerRows) {
  // A G1 must exceed its G7. A swap produces a table that looks entirely fine.
  if (r.bc_g7 !== null && !(r.bc_g1 > r.bc_g7)) {
    console.log(`IMPLAUSIBLE Berger ${r.part_number}: g1=${r.bc_g1} g7=${r.bc_g7}`);
    bad++;
  }
  // A flat base has no G7 by definition. If one appears, G7 is being read from
  // the wrong column.
  if (r.base_type === 'flat' && r.bc_g7 !== null) {
    console.log(`IMPLAUSIBLE Berger ${r.part_number}: flat base carries G7 ${r.bc_g7}`);
    bad++;
  }
  for (const k of ['part_number', 'product_line', 'caliber', 'weight_gr']) {
    if (r[k] === null || r[k] === undefined || r[k] === '') {
      console.log(` Berger ${r.part_number} is missing ${k}`);
      bad++;
    }
  }
}

// Sectional density is recomputable: SD = (grains / 7000) / diameter^2. An
// independent check on whether the columns sit where the header says, needing
// no assumption about the publisher.
let sdChecked = 0;
for (const r of bergerRows) {
  if (!r.sectional_density || !r.bullet_dia_in || !r.weight_gr) continue;
  const expectSd = (r.weight_gr / 7000) / (r.bullet_dia_in ** 2);
  if (Math.abs(expectSd - r.sectional_density) > 0.005) {
    console.log(`SD MISMATCH Berger ${r.part_number}: published ${r.sectional_density}, `
      + `computed ${expectSd.toFixed(3)} from ${r.weight_gr}gr at ${r.bullet_dia_in}in`);
    bad++;
  }
  sdChecked++;
}
console.log(`sectional density recomputed and matched on ${sdChecked} rows`);

// Rows set aside must be reported, never silently dropped.
const skippedParts = skippedRows.map((s) => s.part_number).sort();
if (JSON.stringify(skippedParts) !== JSON.stringify(['24407', '30417'])) {
  console.log(`FAIL: expected 24407 and 30417 to be set aside, got ${JSON.stringify(skippedParts)}`);
  bad++;
}
if (skippedRows.some((s) => !s.reason)) {
  console.log('FAIL: a set-aside row carries no reason');
  bad++;
}

// Guards: each must throw for its own stated reason.
const guard = (label, html) => {
  try {
    BERGER.parse(html);
    console.log(`  FAIL (${label}): did not throw`);
    bad++;
  } catch (e) {
    console.log(`  ok  (${label}) threw ${e.constructor.name}: ${e.message.slice(0, 72)}`);
    if (!(e instanceof ParseError)) { console.log('  FAIL: not a ParseError'); bad++; }
  }
};
console.log('\nguards:');
guard('renamed column', '<table><tr><th>Part #</th><th>Bullet G1</th></tr>'
  + '<tr><td>1</td><td>0.5</td></tr></table>');
guard('short row', `<table>${header()}<tr><td>17308</td><td>17 Cal 25 gr FB</td></tr></table>`);
guard('flat base with a G7', `<table>${header()}<tr><td>17308</td>`
  + '<td>17 Cal 25 gr FB Varmint</td><td>17 Cal (0.172)</td><td>0.565</td><td>FB</td>'
  + '<td></td><td></td><td></td><td>0.121</td><td>0.152</td><td>0.099</td>'
  + '<td>1.2</td><td>1:10"</td></tr></table>');
guard('Cal (Dia) with no measurement', `<table>${header()}<tr><td>17308</td>`
  + '<td>17 Cal 25 gr FB Varmint</td><td>17 Cal</td><td>0.565</td><td>FB</td>'
  + '<td></td><td></td><td></td><td>0.121</td><td>0.152</td><td>NA</td>'
  + '<td>NA</td><td>1:10"</td></tr></table>');
guard('page with no table at all', '<html><body><p>Nothing here</p></body></html>');

console.log(bad ? `\n${bad} FAILURE(S)` : '\nall passed');
process.exit(bad ? 1 : 0);
