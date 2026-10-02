// Builds the derived JSON and Markdown from the primary CSVs.
//
//   node scripts/data/build-data.mjs            # validate + write
//   node scripts/data/build-data.mjs --check    # validate only, write nothing
//
// THE CSVs ARE THE DATABASE. Everything in data/generated/ is derived and is
// overwritten on every run. Never hand-edit a generated file: the change is
// lost silently on the next build, and the build does not warn, because
// from its point of view the file was always going to be replaced.
//
// The manifests in data/schemas/ are the other hand-written input: they define
// what each column means, and this script refuses to emit anything that fails
// them. That is the point of the exercise - the rules travel with the data
// instead of living in a SQL constraint three files away.
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  listManifests, validateManifest, validateReferences, typedRows,
  generatedJsonDir, generatedMdDir,
} from '../shared/data.mjs';

// --check-drift implies "write nothing". Without this the main loop would
// regenerate the files and then compare the fresh output against itself, which
// always passes - a freshness check that cannot fail is worse than none.
const checkOnly = process.argv.includes('--check') || process.argv.includes('--check-drift');
const jsonDir = generatedJsonDir;
const mdDir = generatedMdDir;

// The Markdown banner. Markdown has a comment syntax, so the "do not edit"
// warning can live in the file without breaking anything.
//
// JSON gets NO comment banner, because JSON.parse() must succeed: a .json file
// that will not parse is a .json file nobody can use, and that defeats the
// entire reason for generating it. The same warning is carried as a field in
// the payload instead, which is machine-readable and survives a round-trip.
const MD_BANNER = (m) => `<!--
  GENERATED FILE - DO NOT EDIT.

  Built from the CSVs by scripts/data/build-data.mjs. Any edit here is lost on the
  next run, silently. To change the data, edit the CSV under "source" below,
  then run:  npm run data:build

  Dataset:  ${m.dataset}
  Source:   ${m.csv_path || m.csv_dir}
  Manifest: data/schemas/${m.__name}.yaml

  Use this file for READING. For application code use the .json, which has real
  types. For the complete record use the CSV, which is the database.
-->
`;

let failed = 0;
let totalRows = 0;

for (const m of listManifests()) {
  const { problems, files } = validateManifest(m);

  if (problems.length) {
    failed++;
    console.log(`\n${m.dataset}: ${problems.length} PROBLEM(S) - nothing generated`);
    for (const p of problems) console.log(`  x ${p}`);
    continue;
  }

  const typed = typedRows(m);
  totalRows += typed.length;

  // README.md in this directory is hand-written and explains the layout; the
  // generator only ever writes files named after a dataset, so it cannot
  // collide, but the guard is cheap insurance against a dataset named "readme".
  if (/^readme$/i.test(m.dataset)) continue;

  if (!checkOnly) {
    // Same renderers the drift check compares against, so the file on disk and
    // the freshness check can never disagree about what should be there.
    mkdirSync(jsonDir, { recursive: true });
    writeFileSync(resolve(jsonDir, `${m.dataset}.json`), renderJson(m), 'utf8');

    mkdirSync(mdDir, { recursive: true });
    writeFileSync(resolve(mdDir, `${m.dataset}.md`), renderMdFile(m), 'utf8');
  }

  console.log(`${m.dataset.padEnd(22)} ${String(typed.length).padStart(5)} rows  ${files.length} file(s)  ok`);
}

// ------------------------------------------------------------- renderers
//
// One function per output format, used by BOTH the writer and the drift
// checker. Extracting them is the point: a second copy of the JSON payload
// shape is exactly the kind of thing that silently drifts, and then the drift
// checker compares a file against a renderer that no longer builds it.

// The JSON is emitted with NO comment banner, because JSON.parse() must
// succeed. The do-not-edit warning rides along as a field instead.
function renderJson(m) {
  const typed = typedRows(m);
  return JSON.stringify({
    _generated: true,
    _warning: 'GENERATED FILE - DO NOT EDIT. Built from the CSV by scripts/data/build-data.mjs; edits are lost on the next build. Edit the CSV, then run: npm run data:build',
    dataset: m.dataset,
    description: m.description || null,
    source: m.csv_path || (m.csv_dirs || (m.csv_dir ? [m.csv_dir] : [])).join(' + '),
    manifest: `data/schemas/${m.__name}.yaml`,
    row_count: typed.length,
    // The column contract travels with the data, so a consumer never has to
    // find the YAML to learn what a field means or what it may contain.
    columns: Object.fromEntries(Object.entries(m.columns).map(([k, v]) => [k, {
      type: v.type || 'string',
      ...(v.unit ? { unit: v.unit } : {}),
      ...(v.required ? { required: true } : {}),
      ...(v.enum ? { enum: v.enum } : {}),
      ...(v.nullable ? { nullable: true } : {}),
      ...(v.note ? { note: String(v.note).trim() } : {}),
    }])),
    rows: typed,
  }, null, 2) + '\n';
}

function renderMdFile(m) {
  const { rows } = validateManifest(m);
  return MD_BANNER(m) + renderMd(m, typedRows(m), rows);
}

// ------------------------------------------------------------- drift check
//
// A generated file that is out of date is WORSE than a missing one, because it
// looks authoritative and nobody knows to rebuild it. This is the only thing
// standing between a silent hand-edit and production.
if (process.argv.includes('--check-drift')) {
  const stale = [];
  for (const m of listManifests()) {
    if (/^readme$/i.test(m.dataset)) continue;
    for (const [dir, ext, render] of [
      [jsonDir, 'json', renderJson],
      [mdDir, 'md', renderMdFile],
    ]) {
      const p = resolve(dir, `${m.dataset}.${ext}`);
      if (!existsSync(p)) { stale.push(`${p.replace(/\\/g, '/')} (missing)`); continue; }
      if (readFileSync(p, 'utf8') !== render(m)) {
        stale.push(`${p.replace(/\\/g, '/')} (stale)`);
      }
    }
  }
  if (stale.length) {
    console.log('\nSTALE generated files - run: npm run data:build');
    for (const s of stale) console.log(`  x ${s}`);
    process.exit(1);
  }
  console.log('generated files are up to date');
}

if (failed) {
  console.log(`\n${failed} dataset(s) failed validation. Fix the CSV, or relax data/schemas/*.yaml if the rule is wrong.`);
  process.exit(1);
}

// Cross-dataset references, checked after every file validates clean. A row
// that is well-formed but points at a company that does not exist passes every
// per-file check, so this has to run across the whole repository.
{
  const refProblems = validateReferences(listManifests());
  if (refProblems.length) {
    console.log(`\n${refProblems.length} broken cross-dataset reference(s):`);
    for (const p of refProblems) console.log(`  x ${p}`);
    process.exit(1);
  }
  console.log('cross-dataset references: all resolve');
}


// ------------------------------------------------------------- Markdown
//
// Deliberately NOT a table of every row. A generated .md is for a human
// reading the data - a PR reviewer, someone checking a value against the
// source. Dumping 169 rows into a markdown table makes it unreadable and
// makes the file useless for the thing it is good at.
//
// What it does instead: a summary, the column contract in prose, and a
// readable sample. For the long tail, the JSON is the right artefact and the
// CSV is the right artefact.
function renderMd(m, typed, raw) {
  const out = [];
  // Leading blank line. The MD_BANNER comment ends with a newline, so without
  // this the `# heading` starts on the line immediately after `-->` and renders
  // as part of the comment - the heading disappears. One blank line separates
  // the comment from the document body, which is what CommonMark needs.
  out.push('');
  out.push(`# ${m.dataset}`);
  out.push('');
  if (m.description) { out.push(m.description); out.push(''); }
  out.push('> **Generated file - do not edit.** Built from');
  out.push(`> \`${m.csv_path || m.csv_dir}\` by \`npm run data:build\`.`);
  out.push('> The CSV is the database. Edit that, not this.');
  out.push('');

  // ---- summary ----
  out.push('## At a glance');
  out.push('');
  out.push(`- **Rows:** ${typed.length}`);
  out.push(`- **Source files:** ${m.csv_path || m.csv_dir}`);
  out.push(`- **Column contract:** \`data/schemas/${m.__name}.yaml\``);
  const fill = raw.length
    ? (raw.reduce((n, r) => n + Object.values(r.row).filter((v) => String(v).trim()).length, 0)
      / (raw.length * Object.keys(m.columns).length) * 100).toFixed(0)
    : '0';
  out.push(`- **Populated:** ~${fill}% of cells (a blank means "not known yet", not "zero")`);
  out.push('');

  // ---- which manufacturers ----
  const mfrCol = Object.keys(m.columns).find((c) => /manufacturer_slug|^slug$/.test(c));
  if (mfrCol) {
    const byMfr = new Map();
    for (const r of typed) {
      const k = r[mfrCol] ?? '(blank)';
      byMfr.set(k, (byMfr.get(k) || 0) + 1);
    }
    out.push('## Coverage by manufacturer');
    out.push('');
    out.push('| Manufacturer | Rows |');
    out.push('|---|---|');
    for (const [k, v] of [...byMfr].sort((a, b) => b[1] - a[1])) out.push(`| \`${k}\` | ${v} |`);
    out.push('');
  }

  // ---- the column contract, in prose ----
  out.push('## Columns');
  out.push('');
  out.push('| Column | Type | Req | Meaning |');
  out.push('|---|---|---|---|');
  for (const [name, spec] of Object.entries(m.columns)) {
    const bits = [spec.unit || '', spec.enum ? `${spec.enum.length} values` : '']
      .filter(Boolean).join(', ');
    const note = String(spec.note || '').replace(/\s+/g, ' ').trim();
    out.push(`| \`${name}\` | ${spec.type || 'string'}${bits ? ` (${bits})` : ''} `
      + `| ${spec.required ? 'yes' : 'no'} | ${note} |`);
  }
  out.push('');

  // ---- a readable sample ----
  const show = typed.slice(0, 25);
  if (show.length) {
    // Pick the columns worth showing: identity, numbers, and classification.
    const cols = Object.keys(m.columns).filter((c) => {
      const s = m.columns[c];
      return s.type === 'number' || s.enum || s.required;
    }).slice(0, 7);
    if (cols.length) {
      out.push(`## Sample rows${typed.length > show.length ? ` (first ${show.length} of ${typed.length})` : ''}`);
      out.push('');
      out.push(`| ${cols.map((c) => `\`${c}\``).join(' | ')} |`);
      out.push(`|${cols.map(() => '---').join('|')}|`);
      for (const r of show) {
        out.push(`| ${cols.map((c) => {
          const v = r[c];
          return v === null ? '_(blank)_' : String(v).replace(/\|/g, '\\|').slice(0, 60);
        }).join(' | ')} |`);
      }
      out.push('');
    }
  }

  if (typed.length > show.length) {
    out.push(`_Showing ${show.length} of ${typed.length} rows. `
      + 'For the complete set use the CSV or the JSON._');
    out.push('');
  }

  return out.join('\n');
}


console.log(`\n${checkOnly ? 'validated' : 'generated'} ${totalRows} rows across ${listManifests().length} dataset(s)`);
if (!checkOnly) {
  console.log(`  JSON:      data/generated/json/`);
  console.log(`  Markdown:  data/generated/md/`);
}
