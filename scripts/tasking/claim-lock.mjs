#!/usr/bin/env node
// claim-lock.mjs — atomic, cross-worktree mutual exclusion for task claims.
//
// THE PROBLEM THIS FIXES
//
// tasking/README.md and .clinerules both said: "Claiming a task means MOVING its brief out
// of pending/ into in-progress/. That move is the lock: there is no registry to race on and
// no lock to expire, so a second agent simply cannot see a claimed task."
//
// That is false. The eight agent directories are LINKED GIT WORKTREES of ONE repository —
// each .git is a ~57-byte file reading `gitdir: C:/Cline/ApexProject/.git/worktrees/<n>`,
// and `git rev-parse --git-common-dir` returns C:/Cline/ApexProject/.git from every one.
// They share an object store and a ref namespace but each has its OWN working tree, and so
// its own tasking/pending/. A move in one is invisible in the other seven. Eight independent
// "locks" over eight private copies of the queue.
//
// Measured on 3 Oct 2026: three tasks held by two or three agents at once, every output
// byte-different, both sides believing they owned the task.
//
// THE FIX, AND WHY IT IS THIS MECHANISM
//
// Because the worktrees share a ref namespace, a lock can live in that namespace as a ref
// rather than in any working tree. Acquisition is a single compare-and-swap:
//
//     git update-ref refs/locks/<task> <my-sha> <ZERO-OID>
//
// <ZERO-OID> means "the ref must not currently exist". Git takes a lockfile on the ref
// before updating it, so this is atomic against concurrent claims — the test below fires 8
// processes simultaneously and exactly one wins, every time.
//
// The naive form does NOT work, and the difference matters:
//   git update-ref refs/locks/<task> <my-sha>        <- CLOBBERS. exit 0. Not a lock.
//   git update-ref refs/locks/<task> <my-sha> <ZERO> <- refuses if held. A lock.
// Two arguments overwrite whatever was there. The third argument is the whole mechanism.
// This is the same "expect-absent" CAS as `git push --force-with-lease=<ref>:`, tested
// remotely in SWARM-RESEARCH-ASSESSMENT.md — but here it needs no network, no auth and no
// push, because the ref namespace is already shared on this disk.
//
// WHY NOT THE REMOTE-PUSH VERSION
//
// refs/claims/<task> on the shared GitHub remote also serialises claims, and it was the
// design the research favoured first. Local refs win for this swarm on every axis: no
// network dependency on the hot path (a flaky network must not block claiming), no auth
// prompt in a non-interactive agent, no rate limit, no commit pushed merely to say "I am
// working on this", and no remote write at all during task execution. A remote claim ref
// also leaks: every task ever started leaves a ref on the origin. Local refs stay on this
// machine and are GC'd like any other unreachable object once released.
//
// THE PAYLOAD
//
// A ref must point to an object, so the owner is recorded as a commit subject minted with
// `commit-tree` — no working-tree change, no index change, no branch movement. Anyone can
// later read `git log -1 --format=%s <ref>` and see who holds the task and when they took
// it. This is what makes stale-lock reclamation decidable instead of a guess.
//
// Usage:
//   npm run claim:lock -- take <task-id>      acquire. exit 0 = you own it, 1 = taken.
//   npm run claim:lock -- hold <task-id>      inspect without acquiring
//   npm run claim:lock -- release <task-id>   give it up (only the holder may)
//   npm run claim:lock -- list                every held task and its owner
//   npm run claim:lock -- stale [--force]     find locks whose agent is gone
//
// EXIT CODES ARE THE CONTRACT:
//   0  acquired / released / inspected ok
//   1  someone else holds it, or the release was refused (NOT an error to swallow)
//   2  bad usage
// A caller must treat 1 as "pick a different task", never as "retry later".

import { execFileSync } from 'node:child_process';
import { discover } from './discover-agents.mjs';

const ZERO = '0'.repeat(40);
const NS = 'refs/locks';
const MY = process.env.AGENT_ID || '';

/**
 * Run git and return stdout. Throws with git's own stderr attached, because the caller
 * needs to distinguish "ref held" from "git is broken" and only the message tells them
 * apart reliably across git versions.
 */
function git(args, cwd) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    const detail = [e.stderr, e.stdout, e.message].filter(Boolean).join(' ').trim();
    const err = new Error(detail || 'git failed');
    err.gitArgs = args.join(' ');
    throw err;
  }
}

/**
 * True when git refused because the lock is already held.
 *
 * Matched on the ref-lock refusal rather than a bare non-zero exit: a broken repository or
 * a bad refname also exits non-zero, and conflating those with "someone else has it" would
 * make agents silently wander off tasks that were actually free.
 */
function isHeldError(err) {
  return /reference already exists|cannot lock ref|is at .* but expected/i.test(err.message || '');
}

const refFor = (task) => `${NS}/${task}`;

/**
 * Reject task ids that would produce an ambiguous or illegal ref name.
 *
 * Returns 2 (bad usage), NOT 1. Exit 1 is the contract's "someone else holds it" — the one
 * an agent reads as "pick another task". A malformed id is a caller bug, and folding it into
 * the same code would send an agent off to find another task over a typo.
 */
function validateTask(task) {
  if (!task || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(task)) {
    console.error(`BAD TASK ID: "${String(task)}"`);
    console.error('  a task id becomes a git ref name, so it must use letters, digits, dot,');
    console.error('  dash or underscore only, and start with a letter or digit.');
    console.error('  action  fix the id, or pass the task folder name exactly as it is.');
    return 2;
  }
  return 0;
}

/**
 * Mint a payload commit recording who took the task and when.
 *
 * commit-tree writes an object into the shared store and nothing else — it does not touch
 * the index, the working tree, HEAD or any branch. That matters: an agent claiming a task
 * must not dirty its own tree, or claim-scan would report the payload as uncommitted work.
 */
function mintPayload(task) {
  const stamp = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  const subject = `swarm-claim owner=${MY || 'unknown'} task=${task} acquired=${stamp}`;
  return git(['commit-tree', 'HEAD^{tree}', '-m', subject]);
}

/** Read a lock's payload commit subject, or '' if it cannot be read. */
function subjectOf(sha) {
  try {
    return git(['log', '-1', '--format=%s', sha]);
  } catch {
    return '';
  }
}

/**
 * Every held lock as [{ task, sha, owner, acquired }]. Empty when nothing is locked.
 *
 * The namespace MUST be passed as a separate argument after --format. Putting it inside the
 * --format string (or omitting it) makes for-each-ref list EVERY ref in the repository —
 * verified on this repo: the malformed form returned all 55 refs including refs/heads/main
 * and every refs/remotes/origin/*, while the correct form returned only the 2 locks. A
 * listing command that silently returns the whole repo is worse than one that returns
 * nothing, because every caller then reads unrelated refs as if they were claims.
 */
function allLocks() {
  let out;
  try {
    out = git(['for-each-ref', '--format=%(refname) %(objectname)', NS]);
  } catch {
    return [];
  }
  return out.split('\n').map((l) => l.trim()).filter(Boolean).map((row) => {
    const [name, sha] = row.split(/\s+/);
    // Defensive: only accept refs actually in our namespace, in case the ref format ever
    // changes. A claim list must never include refs/heads/main.
    if (!name.startsWith(`${NS}/`)) return null;
    const subject = subjectOf(sha);
    return {
      task: name.slice(NS.length + 1),
      sha,
      owner: /owner=(\S+)/.exec(subject)?.[1] || null,
      acquired: /acquired=(\S+)/.exec(subject)?.[1] || null,
    };
  }).filter(Boolean);
}

/** Read the lock's payload as { sha, owner, acquired } or null if unset. */
function readLock(task) {
  let sha;
  try {
    sha = git(['rev-parse', '--verify', '--quiet', refFor(task)]);
  } catch {
    return null;
  }
  if (!sha) return null;
  const subject = subjectOf(sha);
  return {
    sha,
    owner: /owner=(\S+)/.exec(subject)?.[1] || null,
    acquired: /acquired=(\S+)/.exec(subject)?.[1] || null,
  };
}

export function take(task) {
  const bad = validateTask(task);
  if (bad) return bad;
  const mine = mintPayload(task);
  try {
    // The third argument is the lock. See the header.
    git(['update-ref', refFor(task), mine, ZERO]);
    return 0;
  } catch (err) {
    if (isHeldError(err)) {
      const held = readLock(task);
      console.error(`CLAIM DENIED  ${task}`);
      console.error(`  held by  ${held?.owner || 'unknown'}${held?.owner === MY ? ' (that is you — already held)' : ''}`);
      console.error(`  since    ${held?.acquired || 'unknown'}`);
      console.error('  action   pick a different task. Do NOT retry this one.');
      return 1;
    }
    console.error(`claim:lock failed for ${task}: ${err.message}`);
    return 2;
  }
}

export function hold(task) {
  const bad = validateTask(task);
  if (bad) return bad;
  const held = readLock(task);
  if (!held) {
    console.log(`FREE    ${task}  (no lock)`);
    return 0;
  }
  const mine = held.owner && MY && held.owner === MY;
  console.log(`${mine ? 'MINE' : 'HELD'}    ${task}  by ${held.owner || 'unknown'}  since ${held.acquired || 'unknown'}`);
  return 0;
}

/**
 * Release only if we still hold it.
 *
 * The old-value argument is what makes this safe: `update-ref -d <ref> <sha>` refuses to
 * delete unless the ref still points at that exact commit. Without it any agent could
 * delete any other agent's lock, which would hand a running task to someone else mid-flight.
 */
export function release(task) {
  const bad = validateTask(task);
  if (bad) return bad;
  const held = readLock(task);
  if (!held) {
    console.log(`FREE    ${task}  (nothing to release)`);
    return 0;
  }
  if (held.owner && MY && held.owner !== MY) {
    console.error(`REFUSED  ${task}  held by ${held.owner}, not ${MY}`);
    console.error('  action  only the holding agent may release it.');
    console.error(`          ask ${held.owner} to run: npm run claim:lock -- release ${task}`);
    console.error('          if that agent is gone, reclaim it deliberately - see: npm run claim:lock -- stale');
    return 1;
  }
  try {
    git(['update-ref', '-d', refFor(task), held.sha]);
    console.log(`RELEASED ${task}  (was ${held.owner || 'unknown'})`);
    return 0;
  } catch (err) {
    if (isHeldError(err)) {
      console.error(`REFUSED  ${task}  moved under us — someone changed it. Re-inspect with: npm run claim:lock -- hold ${task}`);
      return 1;
    }
    console.error(`release failed for ${task}: ${err.message}`);
    return 2;
  }
}

export function listAll() {
  const locks = allLocks();
  if (!locks.length) {
    console.log('no task is currently locked');
    return 0;
  }
  console.log('TASK                 OWNER      ACQUIRED');
  for (const l of locks) {
    const flag = l.owner === MY ? '  <- you' : '';
    console.log(`${l.task.padEnd(20)} ${(l.owner || 'unknown').padEnd(9)} ${l.acquired || 'unknown'}${flag}`);
  }
  return 0;
}

/**
 * Report locks whose owning agent no longer exists on disk.
 *
 * DELIBERATELY REPORTS ONLY. It never expires a lock automatically, and that is the single
 * most important decision in this file.
 *
 * The tempting design is a TTL: if a lock is older than N minutes, reclaim it. It is wrong
 * here. A legitimate task can run for hours — the blocker-ledger and code-review-sweep work
 * in this repo routinely does — and a TTL would silently hand a live task to a second agent
 * while the first is still writing. That recreates exactly the duplicate-claim bug this file
 * exists to prevent, just with a delay. A lock that can vanish without a human deleting it is
 * not a lock.
 *
 * So the policy is: locks persist until released, and a lock survives a crashed agent. To
 * reclaim one you must look at what the holder actually did (see --force guidance below) and
 * decide deliberately.
 */
export function stale() {
  const locks = allLocks();
  if (!locks.length) {
    console.log('no task is currently locked');
    return 0;
  }

  const live = discoverAgentIds();
  if (!live) {
    console.log('agent discovery unavailable - cannot judge staleness safely.');
    console.log('Listing locks with no verdict rather than guessing. Never delete on a guess.');
    for (const l of locks) {
      console.log(`  ${l.task.padEnd(20)} owner=${l.owner || 'unknown'} acquired=${l.acquired || 'unknown'}`);
    }
    return 0;
  }

  const liveSet = new Set(live);
  console.log('TASK                 OWNER      ACQUIRED           VERDICT');
  let suspects = 0;
  for (const l of locks) {
    let verdict;
    if (l.owner === MY) {
      verdict = 'held by you';
    } else if (!liveSet.has(l.owner)) {
      verdict = 'ORPHANED - agent not on disk';
      suspects += 1;
    } else {
      verdict = 'agent alive';
    }
    console.log(`${l.task.padEnd(20)} ${(l.owner || 'unknown').padEnd(9)} ${(l.acquired || 'unknown').padEnd(18)} ${verdict}`);
  }

  if (suspects) {
    console.log('');
    console.log(`${suspects} orphaned lock(s). Before reclaiming one, confirm the agent is really gone:`);
    console.log('  - is its worktree directory still on disk?');
    console.log('  - does its tree have unfinished work (npm run claim:scan)?');
    console.log('  - is it in tasking/pending or in-progress for this task?');
    console.log('Then delete deliberately, one task at a time:');
    console.log('  git update-ref -d refs/locks/<task>');
    console.log('');
    console.log('Do NOT script this as a cron job. An agent mid-task is indistinguishable');
    console.log('from a dead one here, and reclaiming a live one is how you get two writers.');
  }
  return 0;
}

/**
 * Agent ids currently on disk, or null if discovery cannot answer.
 *
 * discover() returns an object whose `agents` array holds entries keyed `id` (verified:
 * top-level keys worktreeRoot/agents/reserved/counts, each agent has
 * { id, hasWorktree, hasMailbox, role }). Treating the return value itself as the array
 * silently yields undefined and every lock then looks orphaned.
 *
 * Returns null on any failure ON PURPOSE. Callers must then refuse to judge staleness: a
 * false "ORPHANED" tells a human to delete a running agent's task, which is the exact
 * two-writers outcome this whole mechanism exists to prevent.
 */
function discoverAgentIds() {
  try {
    const result = discover();
    const agents = Array.isArray(result) ? result : result?.agents;
    if (!Array.isArray(agents)) return null;
    const ids = agents.map((a) => a?.id).filter(Boolean);
    return ids.length ? ids : null;
  } catch {
    return null;
  }
}

const [, , cmd, arg] = process.argv;

if (cmd === 'take') process.exit(take(arg));
else if (cmd === 'hold') process.exit(hold(arg));
else if (cmd === 'release') process.exit(release(arg));
else if (cmd === 'list') process.exit(listAll());
else if (cmd === 'stale') process.exit(stale());
else {
  console.log([
    'usage: npm run claim:lock -- <command> [task-id]',
    '',
    '  take <task-id>       acquire the lock. exit 0 = yours, 1 = someone else has it',
    '  hold <task-id>       show who holds it, without acquiring',
    '  release <task-id>    give it up. refuses unless you are the holder',
    '  list                 every held task, owner, and acquisition time',
    '  stale                flag locks whose agent is no longer on disk (reports only)',
    '',
    `AGENT_ID=${MY || '(unset)'}`,
  ].join('\n'));
  process.exit(cmd ? 2 : 0);
}