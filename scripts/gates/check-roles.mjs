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
import { CAPACITY } from '../tasking/role-capacity.mjs';

const ROLES = join(root, 'tasking', 'roles');
const problems = [];
const warnings = [];
const fail = (m) => problems.push(m);
const warn = (m) => warnings.push(m);

// Named ROLES_DIR, not ROLES: the list below is the role FILES, and `ROLES` is already
// the directory they live in. Shadowing it made the module fail to parse, and a gate
// that does not run is indistinguishable from a gate that passes.
const ROLE_FILES = [
  'README.md',
  'TASK-AUTHOR.md',
  'WORKER-MONITOR.md',
  'WORKER.md',
  'DATA-STEWARD.md',
  'REVIEWER.md',
  'QA-GATE-TESTER.md',
  'IMPLEMENTATION.md',
];

// Each role's single defining prohibition. If this string disappears, the boundary has
// been edited away and the role has quietly become something else.
const BOUNDARY = [
  ['WORKER.md', /never stall/i, 'the no-stalling rule'],
  ['WORKER.md', /never state a charge weight/i, 'the no-charge-weight rule'],
  ['WORKER-MONITOR.md', /never let one blocked worker stop/i, 'the keep-the-swarm-moving rule'],
  ['WORKER-MONITOR.md', /never tell a worker to stop and wait/i, 'the never-idle-workers rule'],
  ['REVIEWER.md', /never edit what you review|you never fix it/i, 'the no-self-repair rule'],
  ['IMPLEMENTATION.md', /if the reviewer said FAIL, the code does not get written/i, 'the PASS-only rule'],
  ['IMPLEMENTATION.md', /never weaken a gate/i, 'the no-gate-weakening rule'],
  ['TASK-AUTHOR.md', /never implement/i, 'the no-implementation rule'],
  ['TASK-AUTHOR.md', /never seed a task that duplicates/i, 'the no-duplicate-task rule'],
  ['QA-GATE-TESTER.md', /never make a gate pass or fail deliberately/i, 'the no-deliberate-breakage rule'],
  ['QA-GATE-TESTER.md', /never edit a gate you are testing/i, 'the never-edit-the-gate rule'],
  ['DATA-STEWARD.md', /never fill a cell to make a column look populated/i, 'the honest-emptiness rule'],
  ['DATA-STEWARD.md', /never state a charge weight/i, 'the no-charge-weight rule'],
];

// The invariants that matter regardless of which role is reading. These are the lines
// that caused real harm when absent, so losing one is a build failure.
const INVARIANTS = [
  ['WORKER.md', /HANDOVER\.md/, 'the handover requirement'],
  ['DATA-STEWARD.md', /seeds lock/, 'the seeds lock'],
  ['REVIEWER.md', /PASS \| FAIL \| SUSPEND/, 'the three verdicts'],
];

// 1. Files present, and the index links every one of them.
for (const f of ROLE_FILES) {
  if (!existsSync(join(ROLES, f))) fail(`tasking/roles/${f} is missing.`);
}
if (existsSync(join(ROLES, 'README.md'))) {
  const idx = readFileSync(join(ROLES, 'README.md'), 'utf8');
  for (const f of ROLE_FILES) {
    if (f === 'README.md') continue;
    if (!idx.includes(f)) fail(`tasking/roles/README.md does not link ${f}.`);
  }
}

// 2 + 3. Boundaries, invariants, and the handover statuses that must not drift.
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

  for (const [file, pattern, what] of [...BOUNDARY, ...INVARIANTS]) {
    const p = join(ROLES, file);
    if (!existsSync(p)) continue;
    if (!pattern.test(readFileSync(p, 'utf8'))) {
      fail(`tasking/roles/${file} has lost ${what}. That boundary is the role.`);
    }
  }
}

// 5. Roster: who holds which role, and are the capacities respected?
//
// The role files say IMPLEMENTATION may be held by one agent. That was an unenforced
// claim until this check: nothing recorded who held what, so two agents could be handed
// the one role whose entire purpose is to have a single writer. Capacity lives in
// role-capacity.mjs, next to the write-sets it derives from.
const ROSTER = join(ROLES, 'roster.json');
if (existsSync(ROSTER)) {
  try {
    const { assignments } = JSON.parse(readFileSync(ROSTER, 'utf8'));
    const holders = new Map();

    for (const [role, ids] of Object.entries(assignments)) {
      if (!ROLE_FILES.includes(`${role}.md`)) {
        fail(`roster.json assigns "${role}", which has no role file in tasking/roles/.`);
        continue;
      }
      const cap = CAPACITY[role];
      if (!cap) {
        fail(`roster.json assigns "${role}", which has no entry in role-capacity.mjs.`);
        continue;
      }
      if (cap.max !== Infinity && ids.length > cap.max) {
        fail(
          `roster.json holds ${role} by ${ids.length} agents, but its capacity is ${cap.max}. `
          + `${cap.note}.`,
        );
      }
      for (const id of ids) {
        if (holders.has(id)) {
          fail(
            `roster.json gives "${id}" both ${holders.get(id)} and ${role}. One agent, one `
            + 'role: the boundaries only work if each is unambiguous.',
          );
        }
        holders.set(id, role);
      }
    }
  } catch (err) {
    fail(`roster.json is not readable JSON: ${err.message}`);
  }
}

// 6. Held roles: the live claim record. A claim is a file at
//    tasking/roles/held/<ROLE>/<agent-id>.md — the same folder-move-as-lock idea that
//    tasking/pending/ uses, so two agents cannot both believe they hold a single-writer
//    role.
//
//    The legacy roster.json is still read when present, so the two mechanisms coexist
//    rather than forcing a migration during a live session.
const HELD = join(ROLES, 'held');
if (existsSync(HELD)) {
  try {
    const seen = new Map();
    for (const role of readdirSync(HELD, { withFileTypes: true })) {
      if (!role.isDirectory()) continue;
      if (!CAPACITY[role.name]) {
        fail(`tasking/roles/held/${role.name}/ is held, but no such role file exists.`);
        continue;
      }
      const ids = readdirSync(join(HELD, role.name))
        .filter((f) => f.endsWith('.md'))
        .map((f) => f.replace(/\.md$/, ''));
      const cap = CAPACITY[role.name].max;
      if (cap !== Infinity && ids.length > cap) {
        fail(
          `${ids.length} agents hold ${role.name}, but its capacity is ${cap}. `
          + `${CAPACITY[role.name].note}.`,
        );
      }
      for (const id of ids) {
        if (seen.has(id)) {
          fail(`agent "${id}" holds both ${seen.get(id)} and ${role.name}. One agent, one role.`);
        }
        seen.set(id, role.name);
      }
    }
  } catch (err) {
    fail(`could not read tasking/roles/held/: ${err.message}`);
  }
}

// 8. The owner's decision documents must be IN THE REPO, not merely on disk.
//
// `tasking/review/*` is gitignored except for an explicit allowlist, so a new document
// written there is invisible to `git status` and vanishes with the working tree. That is
// not hypothetical: DERIVED-VALUES.md was written, and committed in a different commit
// without it, because nothing checked that a decision document had actually been
// committed. The file existed on disk the whole time and existed nowhere else.
//
// This is the general shape of the bug this project keeps hitting - something is present,
// so it looks fine, and it is actually gone. The check is cheap and it is here to make the
// next one loud.
const DECISIONS = [
  'tasking/review/DERIVED-VALUES.md',
  'tasking/review/PRODUCT.md',
  'tasking/review/LESSONS.md',
  'tasking/review/FIX-BACKLOG.md',
  'tasking/review/HISTORY.md',
  'tasking/review/SKILLS-ASSESSMENT.md',
  'tasking/review/SWARM-RESEARCH-ASSESSMENT.md',
  'tasking/review/SDK-HOST-AUDIT.md',
  'tasking/completed/_quarantine/README.md',
  'tasking/roles/README.md',
];

for (const f of DECISIONS) {
  if (!existsSync(join(root, f))) {
    fail(`${f} is missing. It is required reading and must not be absent.`);
  }
}

// 9. Handover presence - warned, never failed.
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

console.log(
  `roles verified: ${ROLE_FILES.length} files, ${BOUNDARY.length + INVARIANTS.length} boundaries intact`,
);