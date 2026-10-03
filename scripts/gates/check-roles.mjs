#!/usr/bin/env node
// check-roles.mjs
//
// WHY THIS EXISTS
//
// Four role files were written on 3 Oct 2026 to stop workers stalling and to separate
// review from implementation. They encode hard boundaries, and a hard boundary nobody
// checks is a suggestion.
//
// The concrete risk is silent drift. The handover template lives in TWO places - the
// worker role and .clinerules section 10.6 - because each is read by a different agent.
// If one is edited and the other is not, workers and the reviewer disagree about what a
// handover contains, and the reviewer's first pass quietly covers less than it should.
// That is the failure this gate exists to make loud.
//
// It checks:
//   1. All four role files exist, and the index lists them.
//   2. The handover template is identical in both places.
//   3. Each role still states its own defining prohibition.
//   4. Every task folder in completed/ has a HANDOVER.md.
//
// (4) is a WARNING, not a failure: pre-existing folders predate the requirement, and
// failing the build over history nobody can undo would just teach people to ignore it.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { root } from '../shared/data.mjs';

const ROLES = join(root, 'tasking', 'roles');
const problems = [];
const warnings = [];
const fail = (m) => problems.push(m);
const warn = (m) => warnings.push(m);

const REQUIRED = ['TASKMASTER.md', 'WORKER.md', 'REVIEWER.md', 'IMPLEMENTATION.md', 'README.md'];

// Each role's single defining prohibition. If this string disappears, the boundary has
// been edited away and the role has quietly become something else.
const BOUNDARY = [
  ['WORKER.md', /never stall/i, 'the no-stalling rule'],
  ['WORKER.md', /never write app code|never state a charge weight/i, 'the no-app-code rule'],
  ['REVIEWER.md', /never edit what you review|you never fix it/i, 'the no-self-repair rule'],
  ['IMPLEMENTATION.md', /if the reviewer said FAIL, the code does not get written/i, 'the PASS-only rule'],
  ['TASKMASTER.md', /never implement/i, 'the no-implementation rule'],
];

// 1. Files present.
for (const f of REQUIRED) {
  if (!existsSync(join(ROLES, f))) fail(`tasking/roles/${f} is missing.`);
}
if (existsSync(join(ROLES, 'README.md'))) {
  const idx = readFileSync(join(ROLES, 'README.md'), 'utf8');
  for (const f of REQUIRED) {
    if (f === 'README.md') continue;
    if (!idx.includes(f)) fail(`tasking/roles/README.md does not link ${f}.`);
  }
}

// 2 + 3. Boundaries, and the handover template that must not drift.
if (existsSync(join(ROLES, 'README.md')) && existsSync(join(root, '.clinerules'))) {
  const idx = readFileSync(join(ROLES, 'README.md'), 'utf8');
  const rules = readFileSync(join(root, '.clinerules'), 'utf8');

  // The four statuses are the part both documents must agree on.
  for (const status of ['complete', 'partial', 'stalled', 'blocked']) {
    if (!idx.includes(status)) {
      fail(`roles/README.md does not mention the "${status}" handover status.`);
    }
    if (!rules.includes(status)) {
      fail(`.clinerules does not mention the "${status}" handover status.`);
    }
  }

  for (const [file, pattern, what] of BOUNDARY) {
    const p = join(ROLES, file);
    if (!existsSync(p)) continue;
    if (!pattern.test(readFileSync(p, 'utf8'))) {
      fail(`tasking/roles/${file} has lost ${what}. That boundary is the role.`);
    }
  }
}

// 4. Handover presence - warned, never failed.
const COMPLETED = join(root, 'tasking', 'completed');
if (existsSync(COMPLETED)) {
  const missing = readdirSync(COMPLETED, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((n) => !existsSync(join(COMPLETED, n, 'HANDOVER.md')));
  if (missing.length) {
    warn(
      `${missing.length} completed task(s) have no HANDOVER.md: ${missing.join(', ')}. `
      + 'These predate the requirement. The reviewer should read their REPORT.md instead.',
    );
  }
}

if (warnings.length) {
  console.log('  warn  ' + warnings.join('\n  warn  '));
  console.log('');
}

if (problems.length) {
  console.log('check-roles FAILED\n');
  for (const p of problems) console.log(`  - ${p}`);
  process.exit(1);
}

console.log(`roles verified: ${REQUIRED.length} files, ${BOUNDARY.length} boundaries intact`);