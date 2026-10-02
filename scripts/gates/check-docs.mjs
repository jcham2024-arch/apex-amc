// Structural check for the Markdown documentation.
//
// WHY THIS EXISTS
// ---------------
// AGENTS.md - the file every agent is told to read first - contained a stray
// three-backtick fence. It ran from line 77 to line 230, swallowing the whole
// of "## Rules" and "## Traps that cost real time" into a code block. The
// content was on disk and valid UTF-8, so every existing gate passed:
//   - `npm run verify` does not lint Markdown.
//   - `scan-encoding.mjs` reports mojibake, not structure. The bytes were fine.
// The same failure was then found in README.md, where a *balanced* fence hid
// the provenance section. A 20-line check would have caught both.
//
// WHAT IT CATCHES
// ---------------
//   1. Unbalanced code fences, and a backtick fence whose info string contains
//      a backtick (CommonMark forbids it; the block will not close).
//   2. A heading inside a code fence - a fence swallowing prose. This is the
//      README.md failure, and it is invisible to a balance check because the
//      fence does balance.
//   3. Consecutively duplicated non-blank lines. A duplicated heading is
//      always a bad merge or a bad repair.
//   4. A heading with no blank line before it, so it renders as body text.
//   5. Non-UTF-8, a UTF-8 BOM, or CRLF line endings, in Markdown only.
//      `.gitattributes` says `* text=auto eol=lf`; `test-encoding` covers the
//      seed CSVs and nothing else.
//   6. Mojibake, reusing the repo's own detector rather than a second one.
//   7. A repository-relative path in backticks that does not resolve to a real
//      file. Structural checks cannot see this: a doc can be perfectly valid
//      Markdown and still point at `scripts/promote-powders.mjs`, which moved
//      to `scripts/data/` during the 1 Oct reorg. Nine such references survived
//      in AGENTS.md, HANDOFF.md, SECURITY.md and ARCHITECTURE.md, because every
//      other check here passed on them - including the ones written after those
//      files were edited.
//
//      Scoped deliberately. Only `scripts/`, `apps/`, `packages/`, `data/` and
//      `docs/` prefixed paths in backticks are checked, fenced code is skipped,
//      and CHANGELOG.md is exempt from this check alone: it records what was
//      true when each entry was written, so a path that has since moved is
//      history rather than drift. Everything not in PATH_ALLOWLIST below is a
//      bug to fix rather than an entry to add.
//
// FENCE PARSING
// -------------
// Deliberately CommonMark-shaped, because a naive "count the backticks" test
// gets this wrong in both directions. It must ignore backticks inside inline
// code spans - three backticks on a table row are not a fence - and it must
// not be fooled by a table cell. It tracks open/close state per fence instead
// of counting. A fence opens with 3+ backticks or tildes at up to 3 spaces of
// indent, and closes with a run of the same character, at least as long, with
// no info string. Tildes are tracked separately from backticks so a ``` block
// cannot be closed by ~~~.
//
// Non-ASCII is printed as <U+XXXX>. A PowerShell console garbles non-ASCII on
// the way out, which would make a correct file look broken and a broken one
// look fine - and the file being reported is the subject of the test. Same
// reasoning as scripts/test-encoding.mjs.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { repairMojibake } from '../shared/encoding.mjs';

const ROOT = resolve(process.cwd());
const say = (s) => console.log(s);

/** Directories that are not project documentation. */
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.expo', 'dist', 'build', '.wrangler',
  // Prior drafts kept for provenance. Never built, never linked from.
  'archive', 'temp', 'tmp',
]);

/** Print a string as code points, so no console can mis-render it. */
const cp = (s) =>
  [...s].map((c) => {
    const n = c.codePointAt(0);
    return n > 127 ? `<U+${n.toString(16).toUpperCase().padStart(4, '0')}>` : c;
  }).join('');

/** Every .md file in the repo, minus the directories that are not docs. */
function findMarkdown(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) findMarkdown(full, out);
    else if (entry.endsWith('.md')) out.push(full);
  }
  return out;
}

/**
 * Walk a document's fences, tracking open/close state rather than counting.
 *
 * Returns { problems, spans }, where spans are the [start, end] line ranges
 * inside a fence. The caller needs those, because a `#` comment inside a bash
 * or PowerShell block is not a Markdown heading and a `##` heading inside a
 * fence is not a section. Treating either as a heading is how a checker ends
 * up reporting every code comment as a broken document - which is worse than
 * no checker, because the real defects get ignored with it.
 */
function checkFences(lines, rel) {
  const problems = [];
  const spans = [];
  /** @type {{char: string, len: number, line: number} | null} */
  let open = null;
  let start = -1;

  for (let i = 0; i < lines.length; i++) {
    const m = /^( {0,3})(`{3,}|~{3,})(.*)$/.exec(lines[i]);

    if (open) {
      if (!m) continue; // ordinary content inside the block
      const [, indent, run, info] = m;
      const isClose =
        run[0] === open.char &&
        run.length >= open.len &&
        info.trim() === '' &&
        indent.length <= 3;
      if (isClose) {
        spans.push([start, i]);
        open = null;
      }
      continue;
    }

    if (!m) continue;
    const [, indent, run, info] = m;
    if (indent.length > 3) continue; // indented code block, not a fence
    if (run[0] === '`' && info.includes('`')) {
      problems.push({
        rel,
        line: i + 1,
        kind: 'fence-info-has-backtick',
        detail:
          'info string on a backtick fence contains a backtick: ' +
          info.trim() +
          '. CommonMark forbids this, and the block will not close.',
      });
      continue;
    }
    open = { char: run[0], len: run.length, line: i + 1 };
    start = i;
  }

  if (open) {
    problems.push({
      rel,
      line: open.line,
      kind: 'fence-never-closed',
      detail:
        `fence opened with ${open.len} backtick(s) on line ${open.line} is never closed. ` +
        'Every following section is swallowed into a code block, so the content is on ' +
        'disk but invisible to anything that renders Markdown.',
    });
    spans.push([start, lines.length - 1]);
  }
  return { problems, spans };
}

/** Is this line inside a code fence? */
function inSpans(spans, i) {
  return spans.some(([a, b]) => i >= a && i <= b);
}

/**
 * Consecutively duplicated non-blank lines, and headings with no blank line
 * before them. Both are skipped inside fences, where `#` is a comment in every
 * language this repo documents.
 */
function checkLines(lines, rel, spans) {
  const problems = [];
  for (let i = 1; i < lines.length; i++) {
    const cur = lines[i];
    const prev = lines[i - 1];
    if (cur.trim() === '' || prev.trim() === '') continue;
    if (inSpans(spans, i) || inSpans(spans, i - 1)) continue;

    if (cur === prev) {
      problems.push({
        rel,
        line: i + 1,
        kind: 'duplicate-adjacent-line',
        detail:
          (cur.startsWith('#') ? 'heading' : 'line') +
          ' repeated verbatim: ' +
          JSON.stringify(cp(cur.slice(0, 70))),
      });
      continue;
    }

    if (/^#{1,6} /.test(cur) && !/^(?:[-*+] |\d+\. |> |\|)/.test(prev)) {
      problems.push({
        rel,
        line: i + 1,
        kind: 'heading-without-blank-line',
        detail:
          'heading sits directly above a non-blank line, so it renders as body ' +
          'text. Needs a blank line before it.',
      });
    }
  }
  return problems;
}

/**
 * A `##` heading sitting inside a code fence.
 *
 * This is the defect that made README.md's bug invisible to a fence-balance
 * check. The fence at line 59 was closed by the one at line 107, so the fence
 * balanced perfectly - but lines 89 to 106, the whole provenance section, were
 * rendered as code. Balanced is not the same as correct: a heading inside a
 * fence means the fence is swallowing a section, which is the entire failure.
 */
function checkFencedHeadings(lines, rel, spans) {
  const problems = [];
  for (const [start, end] of spans) {
    // A fence tagged with a language holds code, and `#` is a comment in every
    // language this repo documents - PowerShell, bash, yaml, ruby, python. A
    // `# comment` inside ```powershell is a comment, not a swallowed heading, and
    // reporting it would be a false positive that trains people to ignore this
    // check. Only an UNTAGGED fence can be swallowing prose by accident.
    const openLine = /^( {0,3})(`{3,}|~{3,})(.*)$/.exec(lines[start]);
    const info = (openLine?.[3] ?? '').trim();
    if (info !== '') continue;

    for (let i = start; i <= end && i < lines.length; i++) {
      if (/^#{1,6} /.test(lines[i])) {
        problems.push({
          rel,
          line: i + 1,
          kind: 'heading-inside-fence',
          detail:
            `heading ${JSON.stringify(cp(lines[i].slice(0, 60)))} is inside a code ` +
            `fence spanning lines ${start + 1}-${end + 1}, so it will not render as a ` +
            'section. A fence is swallowing prose - check whether the block is meant ' +
            'to close earlier than it does.',
        });
        break; // one report per fence is enough to find it
      }
    }
  }
  return problems;
}

/** Encoding: valid UTF-8, no BOM, LF only, no mojibake. */
function checkEncoding(buf, rel) {
  const problems = [];
  const push = (kind, line, detail) => problems.push({ rel, line, kind, detail });

  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    push('utf8-bom', 1, 'starts with a UTF-8 BOM. Rule 6 and .gitattributes require no BOM. A BOM is invisible in most editors and breaks some tooling.');
  }

  const text = buf.toString('utf8');
  if (text.includes('\uFFFD')) {
    push('invalid-utf8', 1, 'contains U+FFFD, so the file is not valid UTF-8');
  }

  let crlf = 0;
  let bareCr = 0;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] !== 0x0d) continue;
    if (buf[i + 1] === 0x0a) { crlf++; i++; } else bareCr++;
  }
  if (crlf > 0) {
    push('crlf-line-endings', 1, crlf + ' CRLF line ending(s). .gitattributes says `* text=auto eol=lf`, so this will churn in diffs.');
  }
  if (bareCr > 0) {
    push('bare-cr', 1, bareCr + ' bare CR (old-Mac) line ending(s)');
  }

  // repairMojibake returns {text, repaired}. Comparing that object against the
  // string would be true for every file, because an object never equals a
  // string - which reports every document as damaged. Use the count.
  const { repaired } = repairMojibake(text);
  if (repaired > 0) {
    const at = text.search(/[\u00C2\u00C3\u00E2]/);
    push(
      'mojibake',
      at < 0 ? 1 : text.slice(0, at).split('\n').length,
      `${repaired} damaged byte sequence(s) present, as produced by reading UTF-8 as cp1252. ` +
        'Fix it by hand, or run `node scripts/repair-encoding.mjs` on this file.',
    );
  }

  return problems;
}

/**
 * Repository-relative paths in backticks that do not resolve.
 *
 * Scoped to `scripts/`, `apps/`, `packages/`, `data/` and `docs/` prefixes.
 * Everything else - bare filenames, URLs, glob patterns, directory names - is
 * out of scope, because a check that cries wolf gets ignored.
 *
 * Declared above the run loop deliberately. Function declarations hoist, but a
 * `const` does not, so placing this below the loop gave
 * "Cannot access 'PATH_SCOPE' before initialization" on the very first file.
 */
const PATH_SCOPE = /`(scripts|apps|packages|data|docs)\/[A-Za-z0-9_./-]+\.[a-z]{2,4}`/g;

/**
 * Paths that legitimately do not exist.
 *
 * Each entry names a reason. An uncommented entry here is how a dead path gets
 * to live in a handoff document, so every line must say *why* it is still valid.
 */
const PATH_ALLOWLIST = new Map([
  // Archived third-party documents. .gitignore excludes data/published/* because
  // these are other people's copyright and must never be redistributed by the
  // site; only the manifest is committed. They exist locally so a data row's
  // source can be re-checked.
  //
  // That makes every reference to one of them a path that exists on a
  // contributor's machine and NOT in a clean checkout, so docs:check passes
  // locally and fails in CI. This was found on the first CI run this repo ever
  // had on ubuntu-latest, on 2 Oct 2026.
  //
  // Listed individually rather than by prefix, deliberately: a prefix rule
  // would silently excuse a typo'd path, which is the defect the check exists to
  // catch. If a genuinely new archived document is cited, add it here with the
  // same reason.
  ['data/published/saami-z299.4-2025-centerfire-rifle.pdf', 'gitignored: copyrighted SAAMI standard, cited in DATA-PLAN, DATA-TODO, PARALLEL-WORK-PLAN and SEED-DATA-GUIDE'],
  ['data/published/saami-z299.3-2022-centerfire-pistol-revolver.pdf', 'gitignored: copyrighted SAAMI standard'],
  ['data/published/saami-z299.2-2019-shotshell.pdf', 'gitignored: copyrighted SAAMI standard'],
  ['data/published/saami-2018-velocity-pressure-data.pdf', 'gitignored: copyrighted SAAMI data'],

  // Never implemented. AGENTS.md names the original brief to explain that the
  // delivered scripts use .mjs and different names.
  ['scripts/import-csv.ts', 'the original brief; documented as never built'],
  // Used as a worked example of the per-file rule system. RMR is not a
  // researched line yet, so the file does not exist.
  ['data/seeds/bullets/rmr.csv', 'illustrative example of the rule system'],
  // Task 0.1b in docs/DATA-TODO.md. Proposed, not yet written.
  ['data/seeds/load_recipes.csv', 'proposed in DATA-TODO.md 0.1b'],
  // Its manifest companion, named by task B3 in the multi-agent ledger. B3 creates
  // both; neither exists until that task runs. Listed here rather than weakening
  // the gate, because the alternative — excluding `.cline/tasks/` from the scan —
  // would stop path validation on 16 generated files that agents read directly.
  ['data/schemas/load_recipes.yaml', 'created by multi-agent task B3; not yet written'],
  // Phase 2.5 of docs/research-competitors/02-feature-gaps.md. A gate that
  // fails if a person cannot read a safety notice without paying. Planned, and
  // deliberately listed here BEFORE the file exists so the rule is enforced the
  // moment accounts ship, rather than being remembered afterwards.
  ['scripts/gates/check-safety-access.mjs', 'planned: Phase 2.5 safety-access gate; not yet written'],
  // ARCHITECTURE.md lists modules relative to scripts/, not the repo root, so
  // these read as `data/build-data.mjs` but resolve to `scripts/data/...`.
  // Reported verbatim rather than rewritten, because that table is a layer map,
  // not a file list, and prefixing every row would make it harder to read.
  ['data/build-data.mjs', 'ARCHITECTURE.md layer table; relative to scripts/'],
  ['data/import-bullets.mjs', 'ARCHITECTURE.md layer table; relative to scripts/'],
  // Historical. HANDOFF.md's "What was true then" block names the pre-reorg
  // artifact, and ARCHITECTURE.md's struck-through row records the task that
  // moved it. Rewriting either would erase the reason the change was made.
  ['apps/website/index.html', 'pre-reorg path, kept in historical/resolved sections'],
  // Stated in ARCHITECTURE.md as the pre-Tailwind-v4 location, since removed.
  ['apps/website/src/tailwind.config.js', 'removed file, referenced as deleted'],

  // Named by multi-agent task T1 (trademark clearance) as its deliverables. T1 is
  // research-only and writes nothing else, so these do not exist until it runs.
  // Listed individually rather than by prefix: a prefix rule would silently excuse
  // a typo, which is the defect this check exists to catch.
  ['docs/research-trademark/01-name-clearance.md', 'created by multi-agent task T1; not yet written'],
  ['docs/research-trademark/02-domain-options.md', 'created by multi-agent task T1; not yet written'],
  ['docs/research-trademark/README.md', 'created by multi-agent task T1; not yet written'],

  // Named by multi-agent task T2 (ballistics oracle research) as its deliverables.
  // Same reasoning: T2 is research-only and must not touch packages/ballistics-core.
  ['docs/research-oracles/01-methods-found.md', 'created by multi-agent task T2; not yet written'],
  ['docs/research-oracles/02-candidate-datasets.md', 'created by multi-agent task T2; not yet written'],
  ['docs/research-oracles/03-solver-gap-analysis.md', 'created by multi-agent task T2; not yet written'],
  ['docs/research-oracles/README.md', 'created by multi-agent task T2; not yet written'],
]);

/** Lines inside a fence are skipped: a path there is an argument, not a claim. */
function checkPaths(lines, rel, spans) {
  const problems = [];

  const inFence = (n) => spans.some(([a, b]) => n >= a && n <= b);

  for (let i = 0; i < lines.length; i++) {
    if (inFence(i)) continue;

    const hits = lines[i].match(PATH_SCOPE);
    if (!hits) continue;

    for (const hit of hits) {
      const p = hit.slice(1, -1); // strip the backticks
      if (PATH_ALLOWLIST.has(p)) continue;

      let exists = true;
      try {
        statSync(join(ROOT, p));
      } catch {
        exists = false;
      }
      if (exists) continue;

      problems.push({
        rel,
        line: i + 1,
        kind: 'broken-path',
        detail:
          `\`${p}\` does not exist. If it moved, update the reference; if it is ` +
          `a brief that was never built or an illustrative example, say so in ` +
          `PATH_ALLOWLIST in scripts/gates/check-docs.mjs with the reason.`,
      });
    }
  }
  return problems;
}

// ---------------------------------------------------------------------- run

const files = findMarkdown(ROOT).sort();
let problems = [];
/**
 * Verify-stage-count
 * ------------------
 * Ten documents quoted an "N stages" figure. No two agreed - 8, 9, 10, 11 and
 * 14 - while the real number was 15. Nothing failed, because nothing checked.
 * See docs/audit/2026-10-02-project-audit.md.
 *
 * This is the vacuous-gate pattern appearing in our own documentation: a number
 * a machine can compute, written out by hand, trusted, never verified. The
 * lesson is not "keep the numbers right" but DO NOT QUOTE THE COUNT. Name the
 * command that produces it instead.
 *
 * A line describing a past state is not a live claim, so the audit document can
 * quote the old wrong numbers in order to explain them.
 */
const stageCountProblems = (mds) => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const real = pkg.scripts.verify.split('&&').map((s) => s.trim()).filter(Boolean).length;
  const found = [];

  for (const abs of mds) {
    const rel = relative(ROOT, abs).split('\\').join('/');
    // CHANGELOG.md is a record of what was true when each entry was written.
    // A stage count in a historical entry is history, not drift, and editing
    // it would destroy the record of where the repo actually stood. Same
    // reasoning as the path check below.
    if (rel === 'CHANGELOG.md') continue;
    // Audit documents are historical records by the same argument: quoting the
    // old wrong numbers is the entire point of the document. Without this the
    // gate fails on its own audit report.
    if (rel.startsWith('docs/audit/')) continue;
    // So is the version history. It records what each TAG contained, and a tag's
    // stage count is a fact about that tag, not a claim about the repo now. The
    // baseline changed from 15 to 16 when oracle:check was added; "15" remains
    // the correct description of v0.1.0.
    if (rel.startsWith('docs/versions/')) continue;
    const lines = readFileSync(abs, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (/stale|used to|no longer|\bwas\b|\bwere\b|disagree|before|instead of/i.test(line)) {
        return;
      }
      for (const m of line.matchAll(/(\d+)\s+(?:stages?|gates?)\b/gi)) {
        if (Number(m[1]) === real) continue;
        found.push({
          rel,
          line: i + 1,
          kind: 'verify-stage-count',
          detail:
            'quotes "' + m[0] + '", but npm run verify has ' + real + ' stages. '
            + 'Do not hand-write a machine-computable count; name the command.',
        });
      }
    });
  }
  return found;
};

problems = problems.concat(stageCountProblems(files));

for (const f of files) {
  const rel = relative(ROOT, f).split('\\').join('/');

  // CHANGELOG.md is exempt from the path check only. It is a record of what was
  // true when each entry was written, so a path that has since moved is history,
  // not drift - and "correcting" it would destroy the record of where the code
  // used to live. Every other check still applies to it, including fences: the
  // corrupted-fence incident this gate exists for was in AGENTS.md, and the next
  // one could be in here.
  const checkPathsHere = rel !== 'CHANGELOG.md';

  const buf = readFileSync(f);
  const lines = buf.toString('utf8').split(/\r\n|\r|\n/);
  const { problems: fenceProblems, spans } = checkFences(lines, rel);
  problems = problems
    .concat(fenceProblems)
    .concat(checkFencedHeadings(lines, rel, spans))
    .concat(checkLines(lines, rel, spans))
    .concat(checkEncoding(buf, rel))
    .concat(checkPathsHere ? checkPaths(lines, rel, spans) : []);
}

say(`checked ${files.length} markdown files`);

if (problems.length === 0) {
  say('');
  say('  ok   every fence balanced, no swallowed headings, no duplicated lines,');
  say('       all repository paths resolve, all UTF-8 with no BOM and LF line endings');
  say('');
  say('docs verified');
  process.exit(0);
}

// Worst first. A fence that swallows a section hides a whole document, so it
// outranks a duplicated line, which outranks a cosmetic encoding nit.
const RANK = {
  'fence-never-closed': 0,
  'heading-inside-fence': 1,
  'fence-info-has-backtick': 2,
  'invalid-utf8': 3,
  mojibake: 4,
  'duplicate-adjacent-line': 5,
  'heading-without-blank-line': 6,
  'crlf-line-endings': 7,
  'bare-cr': 8,
  'utf8-bom': 9,
};
problems.sort(
  (a, b) =>
    (RANK[a.kind] ?? 99) - (RANK[b.kind] ?? 99) ||
    a.rel.localeCompare(b.rel) ||
    a.line - b.line,
);

for (const p of problems) {
  say('');
  say(`FAIL ${p.rel}:${p.line}  ${p.kind}`);
  // Wrap on sentence boundaries; details are prose, not code.
  for (const chunk of p.detail.split(/(?<=\.)\s(?=[A-Z`*.])/)) say(`     ${chunk}`);
}

say('');
say(
  `${problems.length} problem(s) across ${new Set(problems.map((p) => p.rel)).size} file(s)`,
);
say('');
say('docs FAILED');
process.exit(1);
