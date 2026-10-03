// ROLE-VALUE.mjs — how valuable is each role to the swarm RIGHT NOW?
//
// WHY A SEPARATE MODULE
//
// The owner asked for agents to pick "the most useful role at the time" rather than
// being assigned one. That only works if usefulness is computed from live state. The
// first version of this put the ranking inside roster.mjs, which meant the answer was
// only reachable by running one specific command - useless to an agent that just
// started and does not know the command exists.
//
// So usefulness is its own exported function with no I/O. Anything can ask: the CLI, a
// gate, a future dispatcher.
//
// THE RANKING IS DERIVED, NOT PREDECLARED. Each rule cites the queue number that makes
// it fire. A role nobody needs scores 0 and is never suggested - which is the important
// property, because an agent told to "be useful" with a list of seven roles will pick a
// role that is not needed and then sit idle in it. That is precisely the failure this
// project has been fighting.
//
// Note what is NOT here: WORKER is deliberately NOT ranked by a queue-depth rule.
// Workers always have work - there are 21 pending tasks and the queue is the engine.
// WORKER is the fallback for an agent that finds every specialist role occupied.

/**
 * @param {{pending:number, inProgress:number, completed:number, verdicts:number,
 *          fails:number, passes:number, suspended:number, agents:number,
 *          openSeedsDefect:boolean, gateGap:boolean, liveAgentCount:number}} s
 * @returns {Array<{role:string, score:number, why:string}>} best first
 */
export function rankRoles(s) {
  const out = [];
  const unreviewed = Math.max(0, s.completed - s.verdicts);

  // 1. The review backlog. This is the swarm's critical path: nothing can be
  //    implemented until something is reviewed, and 21 unreviewed against 1 verdict is
  //    the standing shape of this queue.
  if (unreviewed >= 1) {
    out.push({
      role: 'REVIEWER',
      score: 100 + unreviewed,
      why: `${unreviewed} completed task(s) have no verdict. Nothing downstream can start until these are reviewed.`,
    });
  }

  // 2. Unblocking a stalled worker. One worker idling is a whole agent doing nothing,
  //    and it is invisible unless someone looks. Outranks most specialists.
  if (s.stalled > 0) {
    out.push({
      role: 'WORKER-MONITOR',
      score: 90 + (s.stalled * 5),
      why: `${s.stalled} worker(s) marked stalled or blocked. Only the monitor answers a stall, and an unanswered stall is a lost task.`,
    });
  }

  // 3. The queue running dry. Below about four the author becomes the constraint.
  if (s.pending <= 4) {
    out.push({
      role: 'TASK-AUTHOR',
      score: 80 + (5 - s.pending),
      why: `only ${s.pending} task(s) pending. When it empties, every worker stops at once.`,
    });
  }

  // 4. A reviewed PASS with nothing implementing it. Someone approved work that is
  //    not being built - the single most wasteful state in the pipeline, because the
  //    review effort is already spent and nothing comes of it.
  if (s.passes > s.liveImplementation) {
    out.push({
      role: 'IMPLEMENTATION',
      score: 75 + (s.passes - s.liveImplementation) * 3,
      why: `${s.passes} reviewed PASS(es) and ${s.liveImplementation} being implemented. Approved work that is not being built is wasted review effort.`,
    });
  }

  // 5. A FAIL nobody is fixing. Same reasoning, slightly lower: it needs a worker, and
  //    workers are plentiful.
  if (s.fails > 0) {
    out.push({
      role: 'WORKER',
      score: 70 + s.fails,
      why: `${s.fails} reviewer FAIL finding(s) need redoing. A FAIL means the output is wrong, so this outranks new research.`,
    });
  }

  // 6. A SUSPEND needs a human. An agent cannot clear it, but it can assemble the
  //    decision so the human spends a minute rather than an hour - worth doing when
  //    nothing above applies.
  if (s.suspended > 0 && out.length < 3) {
    out.push({
      role: 'TASK-AUTHOR',
      score: 40 + s.suspended,
      why: `${s.suspended} SUSPEND(s) waiting on a human. Assemble the decision so it can be made quickly.`,
    });
  }

  // 7. Known data defect nobody owns. The 4 Bore Rifle row: filed as a shotgun with
  //    EMPTY pressure columns, so shotgun looks populated when zero gauges are held.
  if (s.openSeedsDefect) {
    out.push({
      role: 'DATA-STEWARD',
      score: 65,
      why: 'a known seed-classification defect is open. Nobody else owns data/seeds, so it will not be fixed until someone takes this role.',
    });
  }

  // 8. An untested gate. A gate that passes when it should fail is invisible until it
  //    costs something, and the CSP browser check already did this once.
  if (s.gateGap && out.length < 3) {
    out.push({
      role: 'QA-GATE-TESTER',
      score: 50,
      why: 'a gate has no negative test. It may be passing when it should fail, and nothing would tell you.',
    });
  }

  out.sort((a, b) => b.score - a.score);
  return out;
}

/**
 * The fallback, and the honest answer when nothing else scores.
 *
 * WORKER always applies, because the queue is the engine and there is always a pending
 * task for an agent to claim. This is what stops an agent that finds every specialist
 * role occupied from having nothing to do.
 */
export const FALLBACK = {
  role: 'WORKER',
  why: 'No specialist role is needed right now. There are pending tasks, and a worker is never idle when the queue is non-empty.',
};

/** Roles that must never be self-selected while already held. Capacity is enforced
 *  separately in role-capacity.mjs; this is the priority order, not a permission. */
export const CLAIM_ORDER = [
  'REVIEWER', 'WORKER-MONITOR', 'TASK-AUTHOR', 'IMPLEMENTATION',
  'WORKER', 'DATA-STEWARD', 'QA-GATE-TESTER',
];