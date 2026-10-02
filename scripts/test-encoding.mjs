// Tests for scripts/lib/encoding.mjs.
//
// The fixture is built by ENCODING known-correct text into mojibake, so the
// expected output is known by construction rather than eyeballed. That matters:
// eyeballing mojibake is exactly how this bug survives.
//
// Everything non-ASCII is printed as <U+XXXX>. A PowerShell console garbles
// non-ASCII on the way out, which would make a correct repair look broken and
// a broken one look fine - the file being reported is the subject of the test.
// Code points are pure ASCII, so stdout is safe without a log file.
import { repairMojibake, toCp1252, fromCp1252 } from './lib/encoding.mjs';

const say = (s) => console.log(s);

/** The corrupting transform, the way a Windows editor does it: UTF-8 bytes
 *  are decoded as cp1252, then the result is saved as UTF-8. */
const corrupt = (correct) => fromCp1252(Buffer.from(correct, 'utf8'));

const CLEAN = [
  '# Apex AMC',
  '',
  'Em dash: \u2014  en dash: \u2013  curly quotes: \u201C\u201D\u2018\u2019',
  'Box drawing: \u2500\u2502\u251C\u2514\u2500\u251C\u2502',
  'Ellipsis \u2026  trademark \u2122  bullet \u2022  euro \u20AC  permille \u2030',
  'Accents: caf\u00e9 na\u00efve \u00fcber r\u00e9sum\u00e9',
  'Greek: \u03b1\u03b2\u03b3  Cyrillic: \u041f\u0440\u0438\u0432\u0435\u0442',
  'CJK: \u5b89\u5168  currency: \u00a3\u00a5\u20ac',
  'ASCII: plain ~!@#$%^&*()_+-={}[]|\'";:<>,.?/',
].join('\n');

/** Print a string as code points, so no console can mis-render it. */
const cp = (s) => [...s].map((c) => {
  const n = c.codePointAt(0);
  return n > 127 ? `<U+${n.toString(16).toUpperCase().padStart(4, '0')}>` : c;
}).join('');

let failures = 0;
const check = (name, actual, expected) => {
  if (actual === expected) {
    say(`  ok   ${name}`);
    return;
  }
  failures++;
  say(`FAIL ${name}`);
  say(`  expected: ${JSON.stringify(expected)}`);
  say(`  actual:   ${JSON.stringify(actual)}`);
  // Testing a cp1252 round trip means deliberately matching control and
  // non-ASCII code points; that is the assertion, not an accident.
  // eslint-disable-next-line no-control-regex
  if (/[^\u0000-\u007F]/.test(expected)) {
    say(`  expected cp: ${cp(expected).slice(0, 200)}`);
    say(`  actual   cp: ${cp(actual).slice(0, 200)}`);
  }
};

say('1. cp1252 round trip is lossless for representable text');
const CP_OK = 'caf\u00e9 \u2014 \u2013 \u201C\u201D \u20AC \u2022 \u2026 \u2122 \u00a3';
const asCp = toCp1252(CP_OK);
check('toCp1252(CP_OK) is not null', String(asCp !== null), 'true');
check('round trip is lossless', fromCp1252(asCp), CP_OK);

say('1b. characters outside cp1252 are refused, not mangled');
check('box drawing returns null', String(toCp1252('\u2500')), 'null');
check('CJK returns null', String(toCp1252('\u5b89')), 'null');

say('2. the corrupting transform actually produces mojibake');
const damaged = corrupt(CLEAN);
check('corrupt(CLEAN) differs from CLEAN', String(damaged !== CLEAN), 'true');
check('corrupt(CLEAN) has the em-dash artefact', String(damaged.includes('\u00e2\u20ac\u201d')), 'true');

say('3. repair recovers the original exactly');
check('repairMojibake(corrupt(CLEAN))', repairMojibake(damaged).text, CLEAN);

say('4. repair is idempotent');
const once = repairMojibake(damaged).text;
const twice = repairMojibake(once);
check('second pass is a no-op', twice.text, CLEAN);
check('second pass reports 0 repairs', String(twice.repaired), '0');

say('5. CLEAN text is left completely untouched (no false positives)');
const cleanRun = repairMojibake(CLEAN);
check('repairMojibake(CLEAN).text', cleanRun.text, CLEAN);
check('repairMojibake(CLEAN).repaired', String(cleanRun.repaired), '0');

say('6. MIXED input: damaged and correct characters together');
// The real case: this repo's README had 80 damaged triples alongside genuine
// em-dashes. A blanket re-decode would have wrecked the genuine ones.
const mixed = `${damaged.split('\n')[2]}\n${CLEAN.split('\n')[3]}`;
const mixedFixed = repairMojibake(mixed).text;
check('damaged line repaired', mixedFixed.split('\n')[0], CLEAN.split('\n')[2]);
check('clean line untouched', mixedFixed.split('\n')[1], CLEAN.split('\n')[3]);

say('7. degenerate inputs do not throw or corrupt');
check('empty string', repairMojibake('').text, '');
check('pure ASCII', repairMojibake('hello world').text, 'hello world');
check('lone replacement char survives', repairMojibake('a\uFFFDb').text, 'a\uFFFDb');
check('truncated sequence not invented', repairMojibake('\u00e2\u20ac').text, '\u00e2\u20ac');

say('8. a single unrepresentable character does not block its neighbours');
// U+009D is undefined in cp1252 proper. A greedy run-maximising repair breaks
// here and abandons the rest of the line; fixed-width triples do not.
const tricky = corrupt('a\u201Cb\u201Dc\u2014d');
const trickyFixed = repairMojibake(tricky);
check('right double quote still repaired across the gap', trickyFixed.text, 'a\u201Cb\u201Dc\u2014d');

// ---------------------------------------------------------------------------
// Structural checks on the real seed CSVs.
//
// The tests above prove the repair transform is correct. They say nothing about
// whether the committed data is actually well formed, which is a different
// question and had a real failure behind it: data/seeds/manufacturers.csv
// carried a stray blank line at physical line 37. The CSV reader skipped it and
// loaded the right number of rows, so every existing check passed - but a blank
// line silently shifts every line number after it, which breaks any citation of
// the form "row N of manufacturers.csv". That is exactly the citation style
// these files are for.
// ---------------------------------------------------------------------------

say('9. committed seed CSVs are structurally well formed');
{
  const { readdirSync, readFileSync, statSync } = await import('node:fs');
  const { join, relative } = await import('node:path');

  const csvFiles = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith('.csv')) csvFiles.push(full);
    }
  };
  walk('data/seeds');

  // Absolute root so the reported path is unambiguous regardless of cwd.
  const root = process.cwd();

  for (const file of csvFiles.sort()) {
    const rel = relative(root, file).replaceAll('\\', '/');
    const raw = readFileSync(file);

    const problems = [];
    if (raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf) {
      problems.push('has a UTF-8 BOM');
    }

    // UTF-16LE detection. This is the check that would have caught
    // cartridge_specs.csv, the largest hand-maintained file in the repo, which
    // was stored as UTF-16LE for some time without any test noticing: every
    // ASCII byte carried a trailing NUL and every CRLF was 0d 00 0a 00. Both
    // PowerShell's Import-Csv and the loader's reader auto-detect encoding, so
    // the file parsed correctly everywhere that mattered and looked fine.
    //
    // NUL is not legal in any of these CSVs, so a cheap count is enough and
    // avoids decoding every file twice.
    let nul = 0;
    for (const b of raw) if (b === 0) nul++;
    if (nul > 50) {
      problems.push(`is UTF-16 (${nul} NUL bytes); must be UTF-8`);
      continue; // the checks below would all be meaningless
    }

    const text = raw.toString('utf8');

    // .gitattributes sets `* text=auto eol=lf`, so LF is the policy. A stray CR
    // means a file was written by Windows tooling and never normalised, which
    // makes every subsequent diff of that file show as a whole-file rewrite.
    const loneCr = (text.match(/\r/g) || []).length;
    if (loneCr > 0) problems.push(`${loneCr} CR (policy is LF, per .gitattributes)`);

    // Split on the line terminator so the checks below see real lines.
    const lines = text.split('\n');
    // A trailing newline yields one empty final element; that is correct and
    // is not a blank line.
    if (lines.at(-1) === '') lines.pop();

    const blank = lines.findIndex((l, i) => i > 0 && l.trim() === '');
    if (blank !== -1) problems.push(`blank line at physical line ${blank + 1}`);

    const trailingWs = lines.findIndex((l, i) => i > 0 && /[ \t]+$/.test(l));
    if (trailingWs !== -1) problems.push(`trailing whitespace at physical line ${trailingWs + 1}`);

    if (lines.length < 2) problems.push('has no data rows');

    // Every row must have the same field count as the header. This is a cheap
    // structural proxy for correct RFC 4180 quoting: an unbalanced quote shows
    // up here as a row whose comma count is wrong.
    const countFields = (line) => {
      let fields = 1;
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQuotes && line[i + 1] === '"') { i++; continue; }
          inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) {
          fields++;
        }
      }
      if (inQuotes) return -1; // unterminated quote
      return fields;
    };

    const want = countFields(lines[0]);
    if (want === -1) {
      problems.push('header row has an unterminated quote');
    } else {
      const bad = lines.findIndex((l, i) => i > 0 && countFields(l) !== want);
      if (bad !== -1) {
        const got = countFields(lines[bad]);
        problems.push(
          got === -1
            ? `physical line ${bad + 1} has an unterminated quote`
            : `physical line ${bad + 1} has ${got} fields, header has ${want}`,
        );
      }
    }

    check(rel, problems.length ? problems.join('; ') : 'well formed', 'well formed');
  }
}

// A committed seed file the loader does not read is invisible rot, and a
// gitignored file the loader DOES read is worse: the row count silently depends
// on the checkout. Both happened here. The powder manifest merged
// data/incoming/powders/ - gitignored - for 142 of its 169 rows, so a fresh
// clone loaded 27 and every generated artifact differed from the working tree.
//
// This check reads git itself rather than trusting .gitignore, because the
// failure is precisely a mismatch between what git tracks and what the loader
// opens.

say('9. authoritative data is tracked, and loaded data is not ignored');
{
  const { execFileSync } = await import('node:child_process');
  const { relative, join } = await import('node:path');
  const { readdirSync, statSync, existsSync } = await import('node:fs');

  const git = (...args) => execFileSync('git', args, { encoding: 'utf8', cwd: process.cwd() });

  // Files git would actually commit: tracked, plus untracked-but-not-ignored.
  const tracked = new Set();
  let inRepo = true;
  try {
    for (const line of git('ls-files', '-z').split('\0')) {
      if (line) tracked.add(line.replace(/\\/g, '/'));
    }
    for (const line of git('ls-files', '-z', '--others', '--exclude-standard').split('\0')) {
      if (line) tracked.add(line.replace(/\\/g, '/'));
    }
  } catch {
    inRepo = false;
  }

  if (!inRepo) {
    say('  (not a git repository - tracking checks skipped)');
  } else {
    const { listManifests, manifestFiles } = await import('./lib/data.mjs');

    // 1. Every file a manifest points at must be committable. A manifest
    //    reading a gitignored path is the bug that made powder counts depend on
    //    the checkout.
    const untrackedLoaded = [];
    for (const m of listManifests()) {
      for (const f of manifestFiles(m)) {
        const rel = relative(process.cwd(), f).replace(/\\/g, '/');
        if (!tracked.has(rel)) untrackedLoaded.push(`${rel} (loaded by ${m.__name})`);
      }
    }
    check(
      'every manifest-referenced file is committable',
      untrackedLoaded.length ? untrackedLoaded.join('; ') : 'all tracked',
      'all tracked',
    );

    // 2. Every seed CSV must be reachable from a manifest. Otherwise it loads
    //    or nearly loads, but nothing checks its columns.
    const covered = new Set();
    for (const m of listManifests()) {
      for (const f of manifestFiles(m)) covered.add(relative(process.cwd(), f).replace(/\\/g, '/'));
    }
    const orphans = [];
    const walk = (dir) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (name.endsWith('.csv')) {
          const rel = relative(process.cwd(), full).replace(/\\/g, '/');
          if (!covered.has(rel)) orphans.push(rel);
        }
      }
    };
    if (existsSync('data/seeds')) walk('data/seeds');
    check(
      'every seed CSV is reachable from a manifest',
      orphans.length ? orphans.join('; ') : 'all covered',
      'all covered',
    );
  }
}

say(failures ? `\n${failures} FAILURE(S)` : '\nall passed');
process.exit(failures ? 1 : 0);
