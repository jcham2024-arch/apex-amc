/**
 * Gate: the tasking swarm's manifest layer.
 *
 * WHY THIS EXISTS
 * ---------------
 * On 2 Oct 2026 several agents were dispatched from `tasking/pending/`. All of
 * them finished. **None wrote anything to `tasking/completed/`**, and the queue
 * looked identical before and after - because "finished" and "started and
 * abandoned" are the same thing on disk.
 *
 * The root cause was not discipline. The protocol was Prose: it described what to
 * do, but nothing stated, per task, what files must exist at the end. An agent
 * that produced its answer and stopped had satisfied every written instruction.
 *
 * So the instruction is now data. Each task is a folder holding:
 *
 *   task.json   the manifest - write-set, required outputs, prohibitions
 *   BRIEF.md    the context - what to do and why, in prose
 *
 * Splitting them is the point. The manifest is machine-readable and this gate
 * enforces it. The brief is human-readable and no gate can enforce prose. An
 * agent cannot satisfy this gate by summarising in chat.
 *
 * WHAT IT CHECKS
 * --------------
 * 1.  Every task folder has both files, and the JSON parses.
 * 2.  Required manifest fields are present.
 * 3.  `blocked_by` resolves to a real task, and is genuinely blocked.
 * 4.  Every task in `completed/` has EVERY declared output. This is the one that
 *     matters: it makes "done" a checkable claim rather than a self-report.
 * 5.  No two concurrently runnable tasks declare an overlapping write-set.
 * 6.  Required outputs stay INSIDE the task's own output folder.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 * --------------------------------
 * It does not judge whether the CONTENT of an output is correct. A file can
 * exist and be wrong; only the review agent can tell. This gate answers "did the
 * work get written down", not "is the work right".
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { root } from '../shared/data.mjs';

const TASKING = resolve(root, 'tasking');
const PENDING = join(TASKING, 'pending');
const IN_PROGRESS = join(TASKING, 'in-progress');
const COMPLETED = join(TASKING, 'completed');

const problems = [];
const fail = (msg) => problems.push(msg);

/** Directories that are task folders rather than loose files. */
function taskFolders(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .map((n) => join(dir, n))
    .filter((p) => statSync(p).isDirectory());
}

/**
 * A task's manifest travels WITH its folder, because claiming is a folder move.
 * So a task in `completed/` carries its own task.json, and looking only in
 * `pending/` made every finished task look like it had no manifest - which is the
 * "finished and abandoned are indistinguishable" failure this gate exists to
 * prevent, reproduced by the lookup itself. Search every tier, and complain if
 * the same id is in two tiers at once, because that means it was claimed twice.
 */
const TIERS = [
  ['pending', PENDING],
  ['in-progress', IN_PROGRESS],
  ['completed', COMPLETED],
];

const allFolders = TIERS.flatMap(([, dir]) => taskFolders(dir));

// A task id must live in exactly one tier. Two copies means one task was copied
// rather than moved, so two agents may be working on it at once.
const seenIds = new Map();
for (const [tier, dir] of TIERS) {
  for (const d of taskFolders(dir)) {
    const id = d.split(/[\\/]/).pop();
    if (seenIds.has(id)) {
      fail(
        `task "${id}" exists in BOTH ${seenIds.get(id)}/ and ${tier}/. A task may `
        + 'only be claimed once - claiming is a folder move, so this is one task '
        + 'that was copied rather than moved, and two agents may be working on it.',
      );
    } else {
      seenIds.set(id, tier);
    }
  }
}

const tasks = new Map();

for (const dir of allFolders) {
  const rel = relative(root, dir).replace(/\\/g, '/');
  const folderId = dir.split(/[\\/]/).pop();
  const jsonPath = join(dir, 'task.json');
  const briefPath = join(dir, 'BRIEF.md');

  if (!existsSync(briefPath)) {
    fail(
      `${rel}/BRIEF.md is missing. The manifest carries the machine-checkable half; `
      + 'the brief carries the reasoning, and an agent cannot be given context that '
      + 'does not exist.',
    );
  }

  if (!existsSync(jsonPath)) {
    fail(
      `${rel}/task.json is missing. Without it nothing can be checked against this `
      + 'task, so nothing can say whether the task was finished.',
    );
    continue;
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(jsonPath, 'utf8'));
  } catch (e) {
    fail(`${rel}/task.json is not valid JSON: ${e.message}`);
    continue;
  }

  for (const field of ['id', 'title', 'status', 'write_set', 'required_outputs']) {
    if (manifest[field] === undefined) fail(`${rel}/task.json has no "${field}".`);
  }

  if (manifest.id && manifest.id !== folderId) {
    fail(
      `${rel}/task.json declares id "${manifest.id}" but lives in a folder named `
      + `"${folderId}". The folder name is the lock, so the two must agree.`,
    );
  }

  if (tasks.has(manifest.id)) {
    fail(`Duplicate task id "${manifest.id}".`);
    continue;
  }

  // Required outputs must live inside the task's own output folder. This stops a
  // manifest quietly declaring an edit to the main tree, which the copy-out
  // workflow forbids and which no prose rule has actually stopped.
  for (const out of manifest.required_outputs || []) {
    const n = String(out).replace(/\\/g, '/');
    if (n.includes('..')) {
      fail(
        `${rel}: required output "${out}" escapes the output folder via "..". `
        + 'Outputs live under tasking/completed/<id>/; editing the main tree is a '
        + 'review-time merge, not a task deliverable.',
      );
    }
  }

  tasks.set(manifest.id, manifest);
}

// --- Dependencies -------------------------------------------------------------
// Resolved only after every id is known, so a brief may block on one that
// appears later in the listing.
function isBlocked(m) {
  const deps = Array.isArray(m.blocked_by) ? m.blocked_by : [];
  return deps.length > 0 || m.status === 'blocked';
}

for (const m of tasks.values()) {
  const deps = Array.isArray(m.blocked_by) ? m.blocked_by : [];
  for (const dep of deps) {
    const by = tasks.get(dep);
    if (!by) {
      fail(`Task "${m.id}" is blocked_by "${dep}", which does not exist.`);
    } else if (!isBlocked(by)) {
      fail(
        `Task "${m.id}" is blocked_by "${dep}", but "${dep}" is itself unblocked. `
        + 'Remove the dependency, or make the thing it waits on genuinely blocked. '
        + 'A dependency on something that is not blocked is a lie that lets an agent '
        + 'skip a task it needed.',
      );
    }
  }
  m._ready = m.status === 'ready' && deps.length === 0;
}

// --- THE CHECK THAT WOULD HAVE CAUGHT 2 OCT ----------------------------------
// For every task sitting in completed/, every declared output must exist.
//
// This is the whole reason the manifest exists. Previously "the agent finished"
// was a claim in a chat window that nothing on disk could corroborate, so an
// agent that produced an answer and stopped was indistinguishable from one that
// did the work. Now the state is checkable, and the failure names the file.
let verified = 0;
const doneFolders = taskFolders(COMPLETED);

for (const dir of doneFolders) {
  const id = dir.split(/[\\/]/).pop();
  const manifest = tasks.get(id);

  if (!manifest) {
    fail(
      `tasking/completed/${id}/ has no manifest in pending/, so its declared outputs `
      + 'cannot be verified. A finished task whose brief is missing is '
      + 'indistinguishable from an abandoned folder.',
    );
    continue;
  }

  for (const out of manifest.required_outputs || []) {
    const target = join(dir, String(out));
    if (!existsSync(target)) {
      fail(
        `tasking/completed/${id} is missing a DECLARED OUTPUT: ${out}\n`
        + '      This task is not finished. On 2 Oct 2026 an agent reported a task '
        + 'complete with nothing written here, and nothing on disk could tell the '
        + 'difference between finished and abandoned.',
      );
    }
    verified++;
  }
}

// --- Concurrent write-set overlap -------------------------------------------
// Two runnable tasks must not declare the same path. Ordered tasks may overlap,
// because they never run at the same time.
const runnable = [...tasks.values()].filter((t) => t._ready);
for (let i = 0; i < runnable.length; i++) {
  for (let j = i + 1; j < runnable.length; j++) {
    const a = runnable[i].id;
    const b = runnable[j].id;
    for (const pa of runnable[i].write_set || []) {
      for (const pb of runnable[j].write_set || []) {
        if (pa === pb) {
          fail(
            `Tasks "${a}" and "${b}" are both runnable and both declare "${pa}". `
            + 'Two agents on one path is the collision that actually costs work. '
            + 'Order them, or narrow the write-set.',
          );
        }
      }
    }
  }
}

// --- Report ------------------------------------------------------------------
console.log('tasking manifests');
console.log(`  ${tasks.size} task(s) in pending/, ${runnable.length} ready`);
console.log(`  ${doneFolders.length} task(s) in completed/, ${verified} declared output(s) verified`);

if (problems.length) {
  console.error(`\n  ${problems.length} problem(s):\n`);
  for (const p of problems) console.error(`    x ${p}`);
  console.error('\ntasking  FAILED\n');
  process.exit(1);
}

console.log('  every declared output exists; no concurrent write-set overlap');
console.log('\ntasking verified');
