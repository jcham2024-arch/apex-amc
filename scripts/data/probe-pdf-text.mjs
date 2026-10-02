// Probe: can we recover text from the archived PDFs with nothing but Node?
//
// If yes, the burn-rate charts and the SAAMI pressure tables become
// machine-readable primary sources instead of documents a human has to
// re-type - which removes a whole class of transcription error from a
// safety-critical dataset.
//
//   node scripts/data/probe-pdf-text.mjs <file.pdf> [needle]
import { readFileSync } from 'node:fs';
import { inflateSync, inflateRawSync } from 'node:zlib';
import { resolve } from 'node:path';

const file = resolve(process.argv[2] ?? 'data/published/hodgdon-2024-relative-burn-rate-chart.pdf');
const needle = process.argv[3] ?? null;

const buf = readFileSync(file);
console.log(`${file}: ${buf.length} bytes`);

// Collect every stream object.
const chunks = [];
const re = /stream\r?\n/g;
let m;
while ((m = re.exec(buf.toString('latin1'))) !== null) {
  const start = m.index + m[0].length;
  const end = buf.indexOf(Buffer.from('endstream'), start);
  if (end < 0) continue;
  chunks.push(buf.subarray(start, end));
}
console.log(`streams found: ${chunks.length}`);

let inflateOk = 0;
const text = [];

for (const c of chunks) {
  for (const fn of [inflateSync, inflateRawSync]) {
    try {
      const out = fn(c).toString('latin1');
      inflateOk++;
      text.push(out);
      break;
    } catch {
      /* not this codec */
    }
  }
}
console.log(`streams inflated: ${inflateOk}`);

const all = text.join('\n');
console.log(`decompressed chars: ${all.length}`);

// PDF text lives in Tj / TJ operators, and often also in /ActualText.
const literals = [...all.matchAll(/\(((?:\\.|[^\\()])*)\)\s*Tj/g)].map((x) => x[1]);
const actual = [...all.matchAll(/\/ActualText\s*\(((?:\\.|[^\\()])*)\)/g)].map((x) => x[1]);
// Hex strings: <...> Tj
const hexes = [...all.matchAll(/<([0-9A-Fa-f\s]+)>\s*Tj/g)].map((x) =>
  x[1].replace(/\s+/g, '').replace(/(..)/g, (h) => String.fromCharCode(parseInt(h, 16))),
);

console.log(`\nTj literals:   ${literals.length}`);
console.log(`ActualText:    ${actual.length}`);
console.log(`hex Tj:        ${hexes.length}`);

const sample = [...actual, ...literals, ...hexes].filter((s) => s.trim().length > 1);
console.log(`\n--- all text runs in content-stream order (${sample.length}) ---`);
for (const [i, s] of sample.entries()) console.log(String(i).padStart(3) + ' ' + s);

if (needle) {
  const hits = sample.filter((s) => s.toLowerCase().includes(needle.toLowerCase()));
  console.log(`\n--- runs containing "${needle}" (${hits.length}) ---`);
  console.log(hits.join(' | '));
}
