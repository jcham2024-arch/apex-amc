// Cross-checks the two independently parsed cartridge pressure compilations.
//
// kwk.us (extract-kwk-pressures.mjs) and leverguns.com
// (extract-leverguns-pressures.mjs) both list SAAMI maximum average pressure,
// from different eras and by different authors. Where they agree we have
// reasonable confidence. Where they disagree, the number must not reach the
// UI unexamined.
//
// This is not paranoia: kwk.us lists 6.5 Creedmoor SAAMI as 52 ksi while
// SAAMI Z299.4 says 62,000 psi, and a 10,000 psi error in a maximum charge
// limit is how people lose fingers.
//
//   node scripts/crosscheck-pressures.mjs            # report
//   node scripts/crosscheck-pressures.mjs --strict   # exit 1 if unresolved
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..', '..');
const kwkPath = resolve(root, 'data/seeds/cartridge_pressures.csv');
const secPath = resolve(root, 'data/seeds/cartridge_pressures_secondary.csv');
const outPath = resolve(root, 'data/seeds/cartridge_pressure_conflicts.csv');

for (const p of [kwkPath, secPath]) {
  if (!existsSync(p)) {
    console.log('missing ' + p + ' - run the extract-*.mjs scripts first');
    process.exit(1);
  }
}

// ---- CSV reader -------------------------------------------------------------
function readCsv(path) {
  const lines = readFileSync(path, 'utf8').split(/\r?\n/).filter((l) => l.trim());
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
  return lines.slice(1).map((l) => {
    const cells = split(l);
    return Object.fromEntries(header.map((h, i) => [h, cells[i] ?? '']));
  });
}

// ---- name normalisation -----------------------------------------------------
// The two pages spell the same cartridge differently. Normalise aggressively,
// then consult an explicit alias table for what is left, so a mapping miss is
// visible in the report rather than silently counted as "no data".
const norm = (s) =>
  s
    .toLowerCase()
    .replace(/\s*\(saboted\)/g, '')
    .replace(/\b(springfield|remington|winchester|government|magnum)\b/g, ' ')
    .replace(/\b(win|mag|rem|gov|spl|spec)\b/g, ' ')
    .replace(/[.\s\-_]/g, '')
    .replace(/\+p/g, 'p')
    .trim();

// Explicit aliases: normalised leverguns spelling -> normalised kwk spelling.
const ALIASES = new Map(
  Object.entries({
    '65creedmoor': '65creedm',
    '308winchester': '308win',
    '9mmluger': '9luger',
    '35735': '357',
    '451': '45acp',
  }),
);

const canonical = (s) => {
  const n = norm(s);
  return ALIASES.get(n) ?? n;
};

// ---- build both sides -------------------------------------------------------
const kwk = new Map();
for (const r of readCsv(kwkPath)) {
  kwk.set(canonical(r.cartridge_name), {
    name: r.cartridge_name,
    // BOTH kwk columns are in ksi - the page states "the pressures in the
    // table below are rounded up to the nearest ksi", and that applies to the
    // copper-crusher columns too, not just piezo. Scaling only psi made every
    // CUP row look like a 1000x conflict.
    psi: r.saami_piezo_ksi ? Number(r.saami_piezo_ksi) * 1000 : null,
    cup: r.saami_cup ? Number(r.saami_cup) * 1000 : null,
  });
}

const sec = new Map();
for (const r of readCsv(secPath)) {
  const key = canonical(r.cartridge_name);
  if (!sec.has(key)) sec.set(key, []);
  sec.get(key).push({
    name: r.cartridge_name,
    value: Number(r.pressure_value),
    unit: r.pressure_unit,
  });
}

// ---- compare ----------------------------------------------------------------
const agree = [];
const conflict = [];
const unmatched = [];

for (const [key, a] of kwk) {
  const bList = sec.get(key);
  if (!bList || !bList.length) {
    if (a.psi != null || a.cup != null) unmatched.push({ name: a.name, side: 'absent from secondary' });
    continue;
  }

  // Compare like with like. kwk carries both a piezo psi and a crusher CUP
  // figure and the secondary source labels each row with its own unit, so a
  // psi row must never be compared against a CUP number.
  const bPsi = bList.find((x) => x.unit === 'psi');
  const bCup = bList.find((x) => x.unit === 'cup');
  const check = a.psi != null && bPsi ? ['psi', a.psi, bPsi] : a.cup != null && bCup ? ['cup', a.cup, bCup] : null;

  if (!check) {
    unmatched.push({ name: a.name, side: 'no comparable unit' });
    continue;
  }

  const [unit, av, b] = check;
  // The secondary source is rounded to the nearest 100-ish and a few values
  // are legitimately stated to the nearest 100 (e.g. 33,500), so allow a 5%
  // band before calling it a conflict.
  const tol = Math.max(av, b.value) * 0.05;
  if (Math.abs(av - b.value) <= tol) agree.push({ name: a.name, unit, a: av, b: b.value });
  else conflict.push({ name: a.name, bName: b.name, unit, kwk: av, secondary: b.value, delta: av - b.value });
}

const esc = (v) => {
  const s = String(v ?? '');
  return /[",]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

writeFileSync(
  outPath,
  [
    'kwk_name,secondary_name,unit,kwk_value,secondary_value,delta,resolution,resolution_note',
    ...conflict.map((c) =>
      [
        esc(c.name), esc(c.bName), esc(c.unit), esc(c.kwk), esc(c.secondary), esc(c.delta),
        esc('unresolved'),
        esc('Compilations disagree beyond tolerance. Resolve against SAAMI Z299.x or CIP TDCC before publishing.'),
      ].join(','),
    ),
  ].join('\n') + '\n',
);

console.log(`kwk rows: ${kwk.size}   secondary rows: ${sec.size}`);
console.log(`  agree:     ${agree.length}`);
console.log(`  CONFLICT:  ${conflict.length}`);
console.log(`  unmatched: ${unmatched.length}\n`);

if (conflict.length) {
  console.log('CONFLICTS (resolve against the standard; never average):');
  for (const c of conflict) {
    console.log(`  ${c.name.padEnd(20)} ${c.unit.padEnd(4)} kwk=${String(c.kwk).padEnd(7)} secondary=${String(c.secondary).padEnd(7)} delta=${c.delta}`);
  }
  console.log('');
}

if (unmatched.length) {
  console.log(`unmatched (${unmatched.length}) - name-mapping gaps; extend ALIASES:`);
  for (const u of unmatched.slice(0, 15)) console.log(`  ${u.name.padEnd(20)} ${u.side}`);
  console.log('');
}

console.log('conflicts written to ' + outPath);
if (conflict.length && process.argv.includes('--strict')) process.exitCode = 1;
