// Extracts burn-rate positions from the archived Vihtavuori Burning Rate Chart.
//
// This chart is a manufacturer's own published cross-brand ordering, so it is a
// primary source - unlike every third-party "burn rate chart", which is
// somebody's compilation. That is the whole reason it is archived.
//
// HOW IT IS LAID OUT, and why that governs what we publish: the chart has one
// column per brand, each running fastest -> slowest. Extracting text runs in
// content-stream order returns those columns back to back, which is genuinely
// useful, but two columns contain merged cells (the single run
// "Super Handicap 231" is two powders, and "E\037" is an encoding artefact).
// Row and column structure therefore cannot be recovered from run order alone.
//
// So this script publishes only what is unambiguous:
//   * Vihtavuori's own column  -> data/seeds/powder_burn_rate_positions.csv
//     (22 contiguous, clean names; primary source, safe to load)
//   * every other brand column -> data/incoming/..._crossbrand_review.csv
//     (review pending; NOT loaded into the database)
//
// The anchor assertions below fail loudly if the layout ever shifts, rather
// than silently emitting a shifted table. A wrong burn-rate equivalence tells a
// reloader to substitute a powder that is not equivalent.
//
//   node scripts/extract-vihtavuori-burn-rate.mjs
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { inflateSync, inflateRawSync } from 'node:zlib';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const src = resolve(root, 'data/published/vihtavuori-burning-rate-chart-tabloid.pdf');

if (!existsSync(src)) {
  console.log('missing ' + src + ' - run: npm run data:fetch');
  process.exit(1);
}

const buf = readFileSync(src);
const streams = [];
const re = /stream\r?\n/g;
let m;
while ((m = re.exec(buf.toString('latin1'))) !== null) {
  const start = m.index + m[0].length;
  const end = buf.indexOf(Buffer.from('endstream'), start);
  if (end < 0) continue;
  for (const fn of [inflateSync, inflateRawSync]) {
    try {
      streams.push(fn(buf.subarray(start, end)).toString('latin1'));
      break;
    } catch {
      /* wrong codec */
    }
  }
}

const runs = [];
for (const s of streams) {
  for (const t of s.matchAll(/\(((?:\\.|[^\\()])*)\)\s*Tj/g)) {
    const text = t[1].replace(/\\([()\\])/g, '$1').replace(/\\[nrtbf]/g, '').trim();
    if (text.length > 1) runs.push(text);
  }
}

// ---- anchors ----------------------------------------------------------------
// [run index, expected text] - a tripwire on the PDF layout.
const ANCHORS = [
  [4, 'N310'],
  [25, '20N29'],
  [26, '200'],
  [32, '217'],
  [41, 'Ba9'],
  [49, 'RS20'],
  [57, 'IMR3031'],
  [59, 'HP38'],
  [67, 'US869'],
];

for (const [i, expect] of ANCHORS) {
  if (runs[i] !== expect) {
    console.log(`ANCHOR MISMATCH at run ${i}: expected "${expect}", got "${runs[i] ?? '(none)'}"`);
    console.log('The chart layout changed. Review the extraction before trusting any output.');
    process.exit(1);
  }
}

// ---- columns ----------------------------------------------------------------
// Contiguous slices, with an explicit confidence for each. Only the Vihtavuori
// column is clean enough to load without a human reading it first.
const SPANS = [
  { brand: 'Vihtavuori', from: 4, to: 25, confidence: 'primary', load: true },
  { brand: 'Norma', from: 26, to: 32, confidence: 'primary', load: false },
  { brand: 'unknown_p_series', from: 33, to: 36, confidence: 'review', load: false },
  { brand: 'Rottweil_likely', from: 37, to: 40, confidence: 'review', load: false },
  { brand: 'Vectan', from: 41, to: 48, confidence: 'primary', load: false },
  { brand: 'Reload Swiss', from: 49, to: 56, confidence: 'primary', load: false },
  { brand: 'IMR', from: 57, to: 58, confidence: 'primary', load: false },
  { brand: 'Hodgdon', from: 59, to: 67, confidence: 'primary', load: false },
  // Run 68 is the graphic label "CHART"; 69 is a lone "4350"; 70-80 mix
  // Winchester and Ramshot and contain merged cells.
  { brand: 'Winchester_Ramshot_mixed', from: 69, to: 80, confidence: 'review', load: false },
];

const outDir = resolve(root, 'data/incoming');
mkdirSync(outDir, { recursive: true });

const positions = [];
const review = [];

for (const span of SPANS) {
  const names = runs.slice(span.from, span.to + 1);
  names.forEach((name, i) => {
    const row = [span.brand, i + 1, names.length, name];
    if (span.load) positions.push(row);
    else review.push([...row, span.confidence]);
  });
}

const esc = (v) => {
  const s = String(v ?? '');
  return /[",]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

writeFileSync(
  resolve(root, 'data/seeds/powder_burn_rate_positions.csv'),
  [
    'chart_slug,brand,position,column_total,powder_name_as_published',
    ...positions.map((r) => [esc('vihtavuori-burning-rate-chart'), ...r.map(esc)].join(',')),
  ].join('\n') + '\n',
);

writeFileSync(
  resolve(outDir, 'powder_burn_rate_crossbrand_review.csv'),
  [
    'brand,inferred_position,column_total,powder_name_as_published,confidence,note',
    ...review.map((r) =>
      [
        ...r.slice(0, 5).map(esc),
        esc(
          r[4] === 'review'
            ? 'Column boundaries inferred from run order; cells may be merged (e.g. "Super Handicap 231") or contain encoding artefacts. Verify against the archived PDF before loading.'
            : 'Clean contiguous run; brand boundary inferred from the chart header.',
        ),
      ].join(','),
    ),
  ].join('\n') + '\n',
);

console.log(`Vihtavuori (primary, loadable): ${positions.length} positions`);
console.log(`cross-brand (review pending):   ${review.length} cells`);
console.log('\nVihtavuori order as published (fastest first):');
console.log('  ' + positions.map((p) => p[3]).join(', '));
