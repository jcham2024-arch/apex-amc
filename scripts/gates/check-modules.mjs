// Module architecture check: proves the pieces are modules, and that they
// reassemble into a working whole.
//
// WHY THIS EXISTS
// ---------------
// The request behind this file was "break it into modules, the smaller the
// better, then prove it still fits together". The second half is the part that
// needs enforcing, because splitting a program is the one refactor that can
// pass every existing test and still be broken: each module works alone, and
// the seams between them are exactly what nothing exercises.
//
// This check answers four questions that no other gate asks:
//
//   1. Does every module parse on its own?
//   2. Does every import in the project resolve to a file that exists?
//   3. Are there import cycles? A cycle is legal in ESM and always a sign that
//      a boundary is in the wrong place.
//   4. Does the whole thing still assemble? The public entry point of each
//      package is imported for real, so a broken export surface fails here
//      rather than in a browser.
//
// WHAT IT DELIBERATELY DOES NOT DO
// --------------------------------
//   - Enforce a maximum file size. A long file is not automatically a bad
//     module: packages/ballistics-core/src/drag/solver.ts is 761 lines of ONE
//     responsibility, and splitting it would scatter the four documented
//     failure modes away from the code they describe. Size is a smell, not a
//     rule.
//   - Restate what `npm test` already covers. It runs the domain package's 215
//     tests. This check covers the seams the tests cannot see.
//
// Non-ASCII is printed as <U+XXXX>, because a PowerShell console garbles it on
// the way out and a report that cannot be read is not a report.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve, dirname, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(import.meta.dirname, '..', '..');
const say = (s) => console.log(s);

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.expo', 'dist', 'build', '.wrangler',
  // Prior drafts. Never built, never imported, deliberately not a module.
  'archive', 'temp', 'tmp', 'output',
]);

/**
 * The roots that constitute "the project" for architecture purposes, and the
 * reason each is here. Stated rather than globbed, so adding a directory is a
 * decision someone makes visible.
 */
const ROOTS = [
  { path: 'packages/ballistics-core', role: 'the domain: pure, tested, framework-free' },
  { path: 'apps/website/src', role: 'the website modules (the deployed file is a separate artefact)' },
  { path: 'apps/ballistics', role: 'the Expo field app' },
  { path: 'scripts', role: 'the data pipeline and every gate' },
];

/** Extensions treated as modules. */
const MODULE_EXT = new Set(['.mjs', '.js', '.ts', '.jsx', '.tsx']);

/**
 * Extensions Node's own loader can be asked to parse.
 *
 * `.jsx` and `.tsx` are deliberately excluded. `node --check` refuses them with
 * ERR_UNKNOWN_FILE_EXTENSION, which is not a syntax error in our code - it is
 * Node declining a file type it has no loader for. Reporting that as "does not
 * parse" filled the report with 9 identical false positives and buried the real
 * signal, which is the exact failure mode this file exists to prevent.
 *
 * Those two are covered instead by `npm run typecheck` and `npm run lint`, which
 * both understand JSX. This check covers what they cannot: the seams.
 */
const NODE_PARSEABLE = new Set(['.mjs', '.js']);

/**
 * TypeScript needs the type-stripping loader, and `node --check` cannot be
 * given one.
 *
 * BUG FOUND 2 Oct 2026 BY NEGATIVE-TESTING THIS CHECK: `node --check` exits 0
 * on a `.ts` file containing a genuine syntax error. It validates plain
 * JavaScript and silently ignores TypeScript, so a broken module in the package
 * that every app depends on reported as clean here.
 *
 * `--experimental-strip-types` is a Node flag, not something `--check` accepts,
 * so the check is done by importing the module through a child process. That is
 * slower than a syntax scan but it is the only thing that actually loads a `.ts`
 * file the way `npm test` does, which is the point.
 */
const TS_PARSEABLE = new Set(['.ts']);


/** Extensions a bundler resolves without an explicit suffix. */
const RESOLVABLE_EXT = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];

const cp = (s) =>
  [...s].map((c) => {
    const n = c.codePointAt(0);
    return n > 127 ? `<U+${n.toString(16).toUpperCase().padStart(4, '0')}>` : c;
  }).join('');

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (MODULE_EXT.has(extname(entry))) out.push(full);
  }
  return out;
}

/** Every `import ... from '...'` / `export ... from '...'` specifier in a file. */
function importsOf(file) {
  const src = readFileSync(file, 'utf8');
  const specs = [];
  const re = /(?:^|\n)\s*(?:import|export)[\s\S]*?from\s*['"]([^'"]+)['"]/g;
  for (const [, spec] of src.matchAll(re)) specs.push(spec);
  const sideEffect = /(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g;
  for (const [, spec] of src.matchAll(sideEffect)) specs.push(spec);
  return [...new Set(specs)];
}

/** Resolve a specifier the way Node or a bundler would, for local files. */
function resolveSpec(from, spec) {
  if (!spec.startsWith('.')) return undefined; // bare package specifier
  const base = resolve(dirname(from), spec);
  if (existsSync(base) && statSync(base).isFile()) return base;
  // A bundler resolves an extensionless relative import by trying the
  // extensions it knows. React Native source omits them everywhere - the Expo
  // app's own App.jsx imports './screens/DopeCardScreen' with no suffix - so
  // requiring one here would report 6 more false positives.
  for (const ext of RESOLVABLE_EXT) {
    if (existsSync(base + ext)) return base + ext;
  }
  // And a directory with an index file, which Node's ESM also allows.
  for (const ext of RESOLVABLE_EXT) {
    const idx = join(base, 'index' + ext);
    if (existsSync(idx)) return idx;
  }
  return null;
}

/**
 * Depth-first cycle detection over the local import graph.
 *
 * A cycle is legal in ESM - it does not throw - which is precisely why it is
 * worth reporting. It usually means two modules each need something the other
 * owns, and the honest fix is to move the shared thing down a level rather than
 * let a bundler decide an initialisation order.
 */
function findCycles(files, edges) {
  const state = new Map(); // 0 = visiting, 1 = done
  const stack = [];
  const cycles = [];

  const visit = (f) => {
    if (state.get(f) === 1) return;
    if (state.get(f) === 0) {
      const from = stack.indexOf(f);
      cycles.push([...stack.slice(from), f]);
      return;
    }
    state.set(f, 0);
    stack.push(f);
    for (const next of edges.get(f) ?? []) visit(next);
    stack.pop();
    state.set(f, 1);
  };

  for (const f of files) visit(f);
  // Deduplicate: the same cycle is found once per entry point into it.
  const seen = new Set();
  return cycles.filter((c) => {
    const key = [...c].sort().join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ------------------------------------------------------------------ comments

/**
 * Two cheap, high-value checks on prose claims inside source files.
 *
 * Neither is a general comment linter, and neither claims to be. Both exist
 * because a specific wrong comment shipped on 2 Oct 2026 and no other gate saw
 * it, which is the general failure this repo keeps hitting: a claim nobody
 * holds true.
 *
 *   1. A header that states a count ("THE FOUR FAILURE MODES") against the
 *      numbered items in the file. Cheap, and it catches renumbering mistakes.
 *   2. A `docs/X.md 4.2`-style pointer to a section that is not there. Catches
 *      a reference that died when its document was superseded.
 *
 * Both report the file and the line, and both name the fix.
 */

/**
 * A header that states a count of numbered items in the same file.
 *
 * DELIBERATELY VERY NARROW, and it took being wrong twice to get that way.
 *
 * The first version matched any comment line containing a count word, so
 * ordinary prose ("one of the ways this happens", "three named exports")
 * produced 17 false positives and buried the signal. The second matched every
 * number in the file against any line. Both were the same mistake this repo
 * has now made repeatedly: a heuristic wider than the thing it is checking.
 *
 * So this matches exactly one shape, and nothing else:
 *
 *     THE <COUNT> <NOUN-PHRASE>            e.g. "THE FOUR FAILURE MODES"
 *
 * - all-caps, because these headers are all-caps by convention;
 * - the count word immediately after THE;
 * - and it only fires when the file actually has numbered items to disagree
 *   with, so a prose line with no numbered list in the file is ignored.
 *
 * That is narrow enough to be worth running. A check that is right 10% of the
 * time is worse than no check, because it is ignored.
 */
const COUNT_HEADER = /^\s*(?:\/\/|\*)\s*THE\s+(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)\b/;
const COUNT_WORD = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

/** Does a comment header state a count that the file's numbering disagrees with? */
function checkCountClaim(file, problems) {
  const rel = relative(ROOT, file).split(sep).join('/');
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);

  // The numbered items, in comment position. A repeated number is itself the
  // defect: two different items sharing "4." is what made solver.ts wrong.
  const numbers = new Set();
  for (const line of lines) {
    const item = /^\s*(?:\/\/|\*)\s*(\d+)\.\s+\S/.exec(line);
    if (item) numbers.add(Number(item[1]));
  }
  // No numbered list, or not a contiguous 1..n, so there is nothing to
  // cross-check against. Reporting here would be a guess.
  if (numbers.size < 2) return;
  const max = Math.max(...numbers);
  if (numbers.size !== max) return; // a gap: ambiguous, leave it to a human

  for (let i = 0; i < lines.length; i++) {
    const m = COUNT_HEADER.exec(lines[i]);
    if (!m) continue;
    const claimed = COUNT_WORD[m[1].toLowerCase()];
    if (claimed === max) continue; // agrees
    problems.push(
      `stale count claim in ${rel}:${i + 1}: the header says "${m[1]}" but the `
      + `file numbers 1-${max}. A wrong comment is worse than none, because it is `
      + 'trusted.',
    );
  }
}

/** Do all `docs/X.md N.N` references in this file resolve? */
function checkDocPointers(file, problems) {
  const rel = relative(ROOT, file).split(sep).join('/');
  const src = readFileSync(file, 'utf8');

  // Only comment-position references, and only to a markdown file we own.
  const re = /^\s*(?:\/\/|\*)\s*.*?`?((?:docs\/)?[\w-]+\.md)\s+(\d+(?:\.\d+)*)/gm;
  for (const [, doc, section] of src.matchAll(re)) {
    const path = resolve(ROOT, doc);
    if (!existsSync(path)) continue; // not ours, or already a known gap
    const text = readFileSync(path, 'utf8');
    // A heading like "## 4.2 something" or "### 4.2 something".
    const escaped = section.split('.').join('\\.');
    const heading = new RegExp(`^#{2,4}\\s+${escaped}\\b`, 'm');
    if (!heading.test(text)) {
      problems.push(
        `stale doc pointer in ${rel}: refers to ${doc} section ${section}, `
        + 'which no longer exists. The document may have been reorganised or '
        + 'superseded. Fix the reference or delete the comment.',
      );
    }
  }
}

// ------------------------------------------------------------------ assembly

/** Both comment checks against one file. */
function checkCommentClaims(file, problems) {
  checkCountClaim(file, problems);
  checkDocPointers(file, problems);
}


/**
 * The seams the 215 unit tests cannot see: does each package's public entry
 * point still import, and expose what it says it does?
 *
 * A refactor can leave every individual module correct and still break the
 * package: a barrel that no longer re-exports a module, an entry point whose
 * import throws. Both are invisible to a test that imports the module directly.
 *
 * The domain package is imported for real, with Node's type-stripping loader,
 * because that is how `npm test` runs it. If a `.ts` file gains a syntax error
 * the loader cannot strip, this fails here rather than at test time.
 */
const ENTRY_POINTS = [
  {
    path: 'packages/ballistics-core/src/index.ts',
    role: 'the domain package barrel',
    // The public surface both apps are entitled to. If a module is added to the
    // package and not listed here, it is unreachable to the apps, and this
    // should say so rather than letting it be discovered in a browser.
    //
    // One representative export per re-exported module, so removing ANY single
    // `export * from` line is detected. An earlier version of this list named
    // only `solveTrajectory`, `BallisticProfile` and the provenance helpers,
    // which all come from other modules - so deleting the reloading.ts line
    // changed nothing observable and the assembly check passed a broken barrel.
    // The negative test caught it; reading the list would not have.
    mustExport: [
      // drag/solver.ts
      'solveTrajectory', 'InvalidSolveRequest',
      // drag/dragTables.ts
      'G1_DRAG_TABLE', 'G7_DRAG_TABLE', 'dragCoefficient',
      // domain/BallisticProfile.ts
      'BallisticProfile', 'InvalidBallisticProfile',
      // provenance/Source.ts
      'published', 'derived', 'estimated', 'UnverifiedValueError',
      // provenance/constants.ts
      'GRAINS_PER_POUND', 'SCALING_EXPONENT',
      // reloading.ts - the module whose re-export line the negative test removed
      'buildLadder', 'scaleVelocity',
      // atmosphere.ts
      'densityRatio', 'airDensitySlugPerFt3',
      // dispersion.ts
      'dispersion', 'detectFlyer', 'centreOfImpact',
      // weather.ts
      'mergeConditions', 'fromOpenMeteo', 'UNKNOWN_CONDITIONS',
    ],
  },
];

async function checkAssembly(problems) {
  for (const entry of ENTRY_POINTS) {
    const abs = resolve(ROOT, entry.path);
    if (!existsSync(abs)) {
      problems.push(`entry point missing: ${entry.path}`);
      continue;
    }
    let mod;
    try {
      mod = await import(pathToFileURL(abs).href);
    } catch (err) {
      problems.push(`entry point does not load: ${entry.path} -> ${err.message}`);
      continue;
    }
    const missing = entry.mustExport.filter((name) => !(name in mod));
    if (missing.length > 0) {
      problems.push(
        `${entry.path} no longer exports: ${missing.join(', ')}. `
        + 'Either the module was removed, or the barrel stopped re-exporting it, '
        + 'and the apps can no longer reach it.',
      );
    }
  }
}

// ---------------------------------------------------------------------- run

async function main() {
  const problems = [];
  const files = [];
  const perRoot = [];

  for (const root of ROOTS) {
    const dir = resolve(ROOT, root.path);
    if (!existsSync(dir)) {
      problems.push(`root missing: ${root.path}`);
      continue;
    }
    const found = walk(dir);
    files.push(...found);
    perRoot.push({ ...root, count: found.length });
  }

  // 1. Every module loads. `.mjs`/`.js` via `node --check`, which validates
  //    syntax without executing. `.ts` by importing it in a child process with
  //    the type-stripping loader, because `--check` is blind to TypeScript -
  //    verified, it exits 0 on a file with a real syntax error. `.jsx`/`.tsx`
  //    are excluded: Node has no loader, and typecheck + lint already cover them.
  for (const f of files) {
    const ext = extname(f);
    if (!NODE_PARSEABLE.has(ext) && !TS_PARSEABLE.has(ext)) continue;
    const rel = relative(ROOT, f).split(sep).join('/');
    const isTs = TS_PARSEABLE.has(ext);
    try {
      if (isTs) {
        // Import, not --check. A module with a top-level side effect will run;
        // none of ours do, and `npm test` imports them all anyway.
        execFileSync(
          process.execPath,
          ['--experimental-strip-types', '--input-type=module', '-e',
            `import(${JSON.stringify(pathToFileURL(f).href)})`],
          { stdio: 'pipe' },
        );
      } else {
        execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
      }
    } catch (err) {
      const raw = err.stderr?.toString() ?? err.message;
      const msg = raw
        .split('\n')
        .find((l) => /Error|SyntaxError|Unexpected/.test(l)) ?? 'load error';
      problems.push(`does not parse: ${rel} -> ${cp(msg.trim())}`);
    }
  }

  // 2. Every local import resolves. A rename that missed one caller is a crash
  //    in production and a green build here without this.
  const edges = new Map();
  let edgeCount = 0;
  for (const f of files) {
    const rel = relative(ROOT, f).split(sep).join('/');
    const local = [];
    for (const spec of importsOf(f)) {
      const target = resolveSpec(f, spec);
      if (target === undefined) continue; // bare package specifier
      if (target === null) {
        problems.push(`unresolved import in ${rel}: '${spec}'`);
        continue;
      }
      local.push(target);
      edgeCount++;
    }
    edges.set(f, local);
  }

  // 3. No cycles.
  for (const cycle of findCycles(files, edges)) {
    problems.push(
      'import cycle: '
      + cycle.map((f) => relative(ROOT, f).split(sep).join('/')).join(' -> '),
    );
  }

  // 3. Comments that are stale rather than merely long.
  //
  //    Checked over the same module set: these are the files whose comments a
  //    reader relies on when changing behaviour, and therefore the ones where a
  //    wrong claim costs something. Test files are included - a comment in a
  //    test that misstates what is being asserted is how a test stops testing
  //    what it claims to.
  const docsWithCode = files;
  for (const doc of docsWithCode) {
    checkCommentClaims(doc, problems);
  }

  // 4. The whole thing still assembles.
  await checkAssembly(problems);

  // ---- report
  say('module architecture');
  for (const r of perRoot) {
    say(`  ${String(r.count).padStart(4)} module(s)  ${r.path.padEnd(30)} ${r.role}`);
  }
  say(`  ${String(files.length).padStart(4)} total, ${edgeCount} local import(s)`);
  say(`  ${String(docsWithCode.length).padStart(4)} file(s) comment-claim checked`);
  say('');

  if (problems.length === 0) {
    say('  ok   every module parses, every import resolves, no cycles,');
    say('       comments state no stale count or doc pointer, and each package');
    say('       still assembles from its entry point');
    say('');
    say('modules verified');
    return 0;
  }

  for (const p of problems) say(`FAIL ${cp(p)}`);
  say('');
  say(`${problems.length} problem(s)`);
  say('');
  say('modules FAILED');
  return 1;
}

process.exit(await main());

