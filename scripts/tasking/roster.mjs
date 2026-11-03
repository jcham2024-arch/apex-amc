#!/usr/bin/env node
// roster.mjs — assign, list, and validate who holds which agent role.
//
// WHY THIS EXISTS
//
// The seven roles were defined on 3 Oct 2026 with hard boundaries and an enforced gate,
// but there was still no way to know WHO holds which role. `npm run roles:check`
// verified the role files were intact; it could not say that two agents had both been
// handed IMPLEMENTATION, or that the REVIEWER queue had twenty-two items and nobody on
// it.
//
// So the boundaries were documented but not enforced on real agents. That is the gap
// between "we have seven roles" and "we have seven roles running".
//
// Usage:
//   npm run roster -- assign <agent-id> <ROLE>
//   npm run roster -- release <agent-id>
//   npm run roster -- list
//   npm run roster -- plan     what the swarm most needs right now

import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CAPACITY } from './role-capacity.mjs';
import { discover } from './discover-agents.mjs';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const ROSTER = join(root, 'tasking', 'roles', 'roster.json');

export const load = () => (existsSync(ROSTER)
  ? JSON.parse(readFileSync(ROSTER, 'utf8'))
  : { assignments: {}, updated: null });

const save = (r) => writeFileSync(ROSTER, `${JSON.stringify(r, null, 2)}\n`, 'utf8');

const countDirs = (p) => {
  try {
    return readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory()).length;
  } catch {
    return 0;
  }
};

const countVerdicts = () => {
  try {
    return readdirSync(join(root, 'tasking', 'review'))
      .filter((f) => f.endsWith('.md')
        && !/^(README|FINDINGS|LESSONS|HISTORY|PRODUCT)\.md$/.test(f)).length;
  } catch {
    return 0;
  }
};

const free = (r, role) => {
  const cap = CAPACITY[role].max;
  const have = (r.assignments[role] || []).length;
  return cap === Infinity ? (have ? 0 : 1) : Math.max(0, cap - have);
};

/**
 * How many more REVIEWERs the backlog justifies.
 *
 * Not the same as free(). An unlimited role with one holder still has capacity, and
 * against a queue this shape one reviewer and twenty-one unreviewed tasks is not a
 * filled slot - it is a bottleneck. The first free() returned 0 for ANY unlimited role
 * someone held, so `plan` printed "no role gaps" while the backlog sat at twenty-one.
 * A tool that reports nothing to do while a queue grows is worse than no tool.
 *
 * One reviewer per three unreviewed tasks, so a single-reviewer swarm is still told to
 * add capacity rather than being told it is fine.
 */
const reviewersWanted = (unreviewed, have) => Math.max(0, Math.ceil(unreviewed / 3) - have);

/** What the swarm most needs right now, measured from the actual queue. */
export function plan() {
  const r = load();
  const held = new Set(Object.values(r.assignments).flat());

  const completed = countDirs(join(root, 'tasking', 'completed'));
  const pending = countDirs(join(root, 'tasking', 'pending'));
  const inProgress = countDirs(join(root, 'tasking', 'in-progress'));
  const reviews = countVerdicts();
  const unreviewed = Math.max(0, completed - reviews);

  console.log(`completed ${completed} · verdicts ${reviews} · UNREVIEWED ${unreviewed}`);
  console.log(`pending ${pending} · in-progress ${inProgress}\n`);

  const advice = [];
  const wantReviewers = reviewersWanted(unreviewed, (r.assignments.REVIEWER || []).length);
  if (wantReviewers >= 1) {
    advice.push([
      'REVIEWER',
      `${unreviewed} unreviewed task(s); ${wantReviewers} more reviewer(s) would cover it `
      + '(one per three). This is the backlog.',
    ]);
  }
  if (pending <= 2 && free(r, 'TASK-AUTHOR')) {
    advice.push(['TASK-AUTHOR', `only ${pending} pending - the queue is nearly dry.`]);
  }
  if (inProgress >= 3 && !held.has('WORKER-MONITOR') && free(r, 'WORKER-MONITOR')) {
    advice.push(['WORKER-MONITOR', `${inProgress} workers running, nobody watching for stalls.`]);
  }

  if (!advice.length) {
    console.log('No role gaps. Add WORKER instances for throughput.');
    return;
  }
  console.log('assign next:\n');
  for (const [role, why] of advice) console.log(`  ${role.padEnd(16)} ${why}`);

  // Name the agents an operator can actually assign, discovered LIVE rather than
  // read from the roster - so a newly started agent appears here with nobody
  // editing a file. Agent ids change constantly, and a plan naming stale ids is
  // worse than no plan at all.
  const d = discover();
  const pool = d.agents.filter((a) => !a.role);
  if (pool.length) {
    console.log(`\nunassigned agents available: ${pool.map((a) => a.id).join(", ")}`);
  }
  const stale = d.agents.filter((a) => a.role && !a.hasWorktree && !a.hasMailbox);
  if (stale.length) {
    console.log(`\nWARN holds a role but is gone: ${stale.map((a) => a.id).join(", ")}`);
    console.log("  release: npm run roster -- release <id>");
  }
  console.log(`

Then add WORKER instances freely - they never block another role.

NOTE: there is deliberately no "fill the admin roles first" ordering. A reviewer can
start on the ${unreviewed} items already in completed/ the moment it is given a role,
while a task author has nothing to do until workers surface a finding. Filling admin
first buys nothing and delays the backlog by the whole session.`);
}

const [, , cmd, ...args] = process.argv;

switch (cmd) {
  case 'assign': {
    const [id, role] = args;
    if (!id || !role) {
      console.log('usage: roster.mjs assign <agent-id> <ROLE>');
      break;
    }
    if (!CAPACITY[role]) {
      console.log(`unknown role "${role}". Known: ${Object.keys(CAPACITY).join(', ')}`);
      process.exit(1);
    }
    const r = load();
    const held = Object.entries(r.assignments)
      .filter(([, ids]) => ids.includes(id)).map(([k]) => k);
    if (held.length) {
      console.log(`${id} already holds ${held.join(', ')}. Release it first.`);
      break;
    }
    r.assignments[role] = [...(r.assignments[role] || []), id];
    r.updated = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    save(r);
    const n = r.assignments[role].length;
    const cap = CAPACITY[role].max;

    // Refuse at the point of assignment, not only in the gate.
    //
    // The first version of this wrote the file and printed "IMPLEMENTATION (2/1)" and
    // moved on. The gate did catch it, but that is the wrong order: an operator who
    // assigns two implementation agents gets a red build for a mistake the tool could
    // have declined to record. A tool that permits the thing it exists to prevent has
    // pushed the cost onto whoever reads the build log.
    // `cap` is the number; the reason lives on the entry. Reading `.note` off the
    // number printed "undefined" in the refusal - which is the one message an operator
    // is guaranteed to read, so it has to be right.
    if (cap !== Infinity && n > cap) {
      r.assignments[role] = r.assignments[role].slice(0, -1);
      save(r);
      console.error(
        `REFUSED. ${role} is held by ${cap} of ${cap}. ${CAPACITY[role].note}.\n`
        + `Currently: ${r.assignments[role].join(', ') || '(none)'}\n`
        + 'If you genuinely need a second, change CAPACITY in '
        + 'scripts/tasking/role-capacity.mjs and say why.',
      );
      process.exit(1);
    }
    console.log(`${id} -> ${role} (${n}${cap === Infinity ? '' : `/${cap}`})`);
    break;
  }
  case 'release': {
    const [id] = args;
    const r = load();
    let found = false;
    for (const [role, ids] of Object.entries(r.assignments)) {
      if (!ids.includes(id)) continue;
      const next = ids.filter((x) => x !== id);
      if (next.length) r.assignments[role] = next;
      else delete r.assignments[role];
      found = true;
    }
    if (!found) {
      console.log(`${id} holds no role.`);
      break;
    }
    save(r);
    console.log(`${id} released. Retire its mailbox: npm run mail:retire -- ${id}`);
    break;
  }
  case 'list': {
    const r = load();
    if (!Object.values(r.assignments).flat().length) {
      console.log('No roles assigned. Run: npm run roster -- plan');
      break;
    }
    for (const [role, ids] of Object.entries(r.assignments).sort()) {
      const cap = CAPACITY[role]?.max;
      const limit = cap === Infinity ? '*' : cap;
      console.log(`${role.padEnd(18)} ${String(ids.length).padStart(2)}/${String(limit).padEnd(3)} ${ids.join(', ')}`);
    }
    const unfilled = Object.keys(CAPACITY).filter((k) => !r.assignments[k]);
    if (unfilled.length) console.log(`\nunfilled: ${unfilled.join(', ')}`);
    break;
  }
  case 'plan':
    plan();
    break;
  default:
    console.log('usage: roster.mjs <assign|release|list|plan> [args]');
}