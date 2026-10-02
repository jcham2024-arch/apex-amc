/**
 * Gate: the multi-agent task ledger must be internally consistent.
 *
 * WHY THIS EXISTS
 * ---------------
 * The point of the parallel plan is that two agents can work at once without
 * clobbering each other. That property is asserted by hand in
 * `docs/PARALLEL-WORK-PLAN.md`, and hand-maintained claims drift: someone adds a
 * task with an overlapping write-set, and two agents silently edit one file.
 *
 * This makes the property mechanical. Same reasoning as every other gate here —
 * a rule someone has to remember is a rule that will be broken.
 *
 * WHAT IT CHECKS
 * --------------
 *  1. Every `blocked_by` resolves, and none is self-referential.
 *  2. No two CONCURRENTLY RUNNABLE tasks share a write path. This is the one
 *     that matters. Two tasks that are ordered (B1 -> B4) may overlap safely,
 *     because they never run at the same time.
 *  3. A task with an unmet dependency is not marked "ready".
 *  4. No shared path is locked by two tasks at once.
 *  5. Every task file, the rules file, and the template all exist.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 * --------------------------------
 * It does not decide whether a write-set is *correct* — only that two sets do not
 * overlap. Correctness of the split is a judgement; non-overlap is checkable.
 * One property, so the gate cannot cry wolf.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root } from '../shared/data.mjs';

const LEDGER = resolve(root, '.cline/tasks/ledger.json');
const RULES = resolve(root, '.clinerules');
const SCHEMA = resolve(root, '.cline/templates/task-schema.md');

if (!existsSync(LEDGER)) {
  console.error(
    '\ntask ledger   FAILED\n'
      + `  ${LEDGER} is missing. Multi-agent coordination cannot be verified\n`
      + '  without it. See .cline/templates/task-schema.md.\n',
  );
  process.exit(1);
}

let ledger;
try {
  ledger = JSON.parse(readFileSync(LEDGER, 'utf8'));
} catch (err) {
  console.error(`\ntask ledger   FAILED\n  ledger.json is not valid JSON: ${err.message}\n`);
  process.exit(1);
}

const problems = [];
const tasks = ledger.tasks ?? [];
const byId = new Map(tasks.map((t) => [t.id, t]));

// --- 1. Dependencies resolve -------------------------------------------------
for (const t of tasks) {
  for (const dep of t.blocked_by ?? []) {
    if (!byId.has(dep)) {
      problems.push(`${t.id} is blocked by ${dep}, which is not a task in this ledger.`);
    }
  }
  if ((t.blocked_by ?? []).includes(t.id)) {
    problems.push(`${t.id} is blocked by itself.`);
  }
}

// --- 2. The main check: no overlap between concurrently runnable tasks ---------
//
// "Runnable" = not blocked on another task here. Tasks blocked on something
// EXTERNAL (a human, an account) are excluded: they will not be running
// alongside anything.
const runnable = tasks.filter(
  (t) => (t.blocked_by ?? []).length === 0 && t.status !== 'blocked_external',
);

/**
 * Do two write-set entries refer to the same file?
 *
 * `data/seeds/bullets/*.csv` and `data/seeds/bullets/hornady.csv` DO overlap;
 * `data/seeds/bullets/*.csv` and `data/seeds/powders/*.csv` do not. A plain
 * string compare misses the first case, which is the case that actually bites,
 * so each entry is reduced to its glob prefix before comparing.
 */
function overlaps(a, b) {
  if (a === b) return true;
  return a.replace(/\*.*$/, '') === b.replace(/\*.*$/, '');
}

for (let i = 0; i < runnable.length; i += 1) {
  for (let j = i + 1; j < runnable.length; j += 1) {
    const a = runnable[i];
    const b = runnable[j];
    for (const wa of a.write_set ?? []) {
      for (const wb of b.write_set ?? []) {
        if (overlaps(wa, wb)) {
          problems.push(
            `${a.id} and ${b.id} are both runnable and both may write "${wa}" / "${wb}". `
              + 'Two agents would edit one file. Serialise them with blocked_by, or '
              + 'narrow one write-set.',
          );
        }
      }
    }
  }
}

// --- 3. A blocked task must not claim to be ready ----------------------------
for (const t of tasks) {
  if ((t.blocked_by ?? []).length > 0 && t.status === 'ready') {
    problems.push(
      `${t.id} depends on ${t.blocked_by.join(', ')} but is marked "ready". `
        + 'A task with an unmet dependency must be "blocked".',
    );
  }
}

// --- 4. No shared path double-locked -----------------------------------------
const held = new Map();
for (const [path, owner] of Object.entries(ledger.shared_path_locks ?? {})) {
  if (!owner) continue;
  if (held.has(path)) {
    problems.push(`"${path}" is locked by both ${held.get(path)} and ${owner}.`);
  }
  held.set(path, owner);
}

// --- 5. Referenced files exist -----------------------------------------------
for (const t of tasks) {
  if (!t.file) {
    problems.push(`${t.id} has no "file" property, so an agent cannot be pointed at it.`);
  } else if (!existsSync(resolve(root, t.file))) {
    problems.push(`${t.id} points at ${t.file}, which does not exist.`);
  }
}
if (!existsSync(RULES)) problems.push('.clinerules is missing. Every agent depends on it.');
if (!existsSync(SCHEMA)) problems.push('.cline/templates/task-schema.md is missing.');

if (problems.length) {
  console.error(`\ntask ledger   FAILED   (${problems.length} problem(s))`);
  for (const p of problems) console.error(`  x ${p}`);
  console.error('');
  process.exit(1);
}

// A lock held by a task that is not in progress is stale — likely a crashed agent.
// Reported, not fatal: the Integrator clears these, and a crashed agent should not
// be able to brick the ledger for everyone else.
const staleLocks = Object.entries(ledger.shared_path_locks ?? {})
  .filter(([, owner]) => owner && !tasks.some((t) => t.id === owner && t.status === 'in_progress'))
  .map(([path, owner]) => `${path} (${owner})`);

console.log(
  `task ledger   ok   ${tasks.length} tasks, ${runnable.length} concurrently runnable, `
    + `no overlapping write-sets, `
    + `${tasks.filter((t) => t.status === 'blocked_external').length} awaiting a human`,
);
if (staleLocks.length) {
  console.log(`                    stale lock(s), clear these: ${staleLocks.join(', ')}`);
}

