#!/usr/bin/env node
// claim-scan.mjs — detect two agents claiming the same task, LIVE.
//
// WHY THIS EXISTS
//
// Measured on 3 Oct 2026, against eight running agents:
//
//   paths claimed by MORE THAN ONE agent: 7
//     3x  tasking/pending/code-review-sweep/BRIEF.md   <- 23e31, fc6cc, ff96c
//     3x  tasking/pending/blocker-ledger/BRIEF.md      <- e981f, fc6cc, ff96c
//
// Three agents claimed `code-review-sweep`. Two of them - fc6cc and ff96c - both
// completed `blocker-ledger`, and their outputs are BYTE-DIFFERENT. Not a near-duplicate:
// two different answers to the same question, from two agents that each believed they
// held it.
//
// This is the "duplicate/conflicting writes" failure in the research: no write-ownership
// primitive, last-writer-wins, and every party reports success. Nothing crashed. Both
// agents will push, and whichever lands second silently overwrites the first.
//
// WHY THE FOLDER-MOVE LOCK DID NOT PREVENT IT
//
// tasking/README.md says claiming is a folder move and that the move IS the lock, so two
// agents cannot see a claimed task. That is TRUE within one worktree and FALSE across
// eight: each agent has its own clone with its own `tasking/pending/`, so moving the folder
// here is invisible there. The lock was designed for agents sharing a filesystem and
// deployed to agents that do not.
//
// The fix is a central registry that every worktree can see, which is what
// `tasking/roles/held/` became for roles. This applies it to task claims.
//
// Usage:
//   node scripts/tasking/claim-scan.mjs           report
//   node scripts/tasking/claim-scan.mjs --json

import { execSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// The ApexProject checkout this script runs inside is deliberately NOT consulted. Every
// answer comes from the agent worktrees, which are found by absolute path, because a
// stale local copy of tasking/ is exactly the thing that makes this kind of check lie.
const WT_ROOT = process.env.CLINE_WORKTREE_ROOT
  || join(process.env.USERPROFILE || '', '.cline', 'worktrees');

/** Agents currently on disk, ignoring any that no longer have a clone. */
function liveAgents() {
  if (!existsSync(WT_ROOT)) return [];
  return readdirSync(WT_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((id) => existsSync(join(WT_ROOT, id, 'ApexProject', '.git')))
    .sort();
}

/**
 * What each agent has ACTIVELY CLAIMED — and only that.
 *
 * The first version counted anything in completed/ whose folder was gone from pending/,
 * which reported 24 overlaps, and almost all were false: work that was finished and
 * COMMITTED days ago and is identical in every clone. Reporting those would train the
 * operator to ignore the output, which is the same failure mode as a permanently red
 * gate.
 *
 * A live claim is therefore all three of:
 *   1. the folder is in this agent's in-progress/ or completed/, AND
 *   2. absent from this agent's own pending/ (moved, not copied), AND
 *   3. UNCOMMITTED here — `git status` touches it
 *
 * Condition 3 is what separates "someone is working on this right now" from "this is
 * history". It is also exactly the dangerous state: two agents with uncommitted work on
 * one task is the collision that loses data, because last writer wins silently.
 */
function claimsOf(id) {
  const cwd = join(WT_ROOT, id, 'ApexProject');
  const base = join(cwd, 'tasking');
  const out = [];

  let dirty;
  try {
    dirty = execSync('git status --porcelain', { cwd, encoding: 'utf8' })
      .split('\n').filter(Boolean)
      .map((l) => l.slice(3).trim().replace(/^"|"$/g, ''));
  } catch {
    return out;
  }

  for (const tier of ['in-progress', 'completed']) {
    let names;
    try {
      names = readdirSync(join(base, tier), { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
    } catch {
      continue;
    }
    for (const n of names) {
      if (n.startsWith('_')) continue; // _quarantine and friends are not tasks
      if (existsSync(join(base, 'pending', n))) continue; // still pending here = untouched
      if (!dirty.some((f) => f.startsWith(`tasking/${tier}/${n}/`) || f === `tasking/${tier}/${n}`)) {
        continue; // committed history, not an active claim
      }
      out.push(n);
    }
  }
  return out;
}

/** Uncommitted files, so a reported overlap can be weighted by whether it is real yet. */
function dirtyOf(id) {
  try {
    const cwd = join(WT_ROOT, id, 'ApexProject');
    return execSync('git status --porcelain', { cwd, encoding: 'utf8' })
      .split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

const asJson = process.argv.includes('--json');
const agents = liveAgents();
const claims = new Map();

for (const id of agents) {
  for (const t of claimsOf(id)) {
    if (!claims.has(t)) claims.set(t, []);
    claims.get(t).push(id);
  }
}

const overlaps = [...claims.entries()]
  .filter(([, ids]) => ids.length > 1)
  .map(([task, ids]) => ({
    task,
    agents: ids,
    // Both holding it AND neither has committed is the dangerous state: whichever
    // pushes second wins silently.
    uncommitted: ids.filter((a) => dirtyOf(a).some((l) => l.includes(task))),
  }))
  .sort((a, b) => b.agents.length - a.agents.length);

if (asJson) {
  console.log(JSON.stringify({ agents: agents.length, overlaps }, null, 2));
  process.exit(overlaps.length ? 1 : 0);
}

console.log(`${agents.length} agent(s) on disk\n`);

if (!overlaps.length) {
  console.log('No task is claimed by more than one agent.');
  process.exit(0);
}

console.log(`DUPLICATE CLAIMS: ${overlaps.length}\n`);
for (const o of overlaps) {
  const pending = o.uncommitted.length === o.agents.length ? 'ALL UNCOMMITTED' : 'PARTLY COMMITTED';
  console.log(`  ${o.task}`);
  console.log(`    claimed by: ${o.agents.join(', ')}   (${pending})`);
}

console.log(`
Each of these agents believes it owns the task. Only one can be right, and the
loser's work will be overwritten on push without any error being raised.

Resolve by: picking ONE owner per task, having the others move their folder to
  tasking/completed/_quarantine/<task-id>/
with a QUARANTINE.md explaining that the task was already claimed elsewhere, then
re-run this check.`);

process.exit(1);