#!/usr/bin/env node
// discover-agents.mjs — find every agent, wherever its id came from.
//
// WHY THIS EXISTS
//
// Agent ids are a changing variable. Five were running when the roles were designed;
// six more replaced them a day later. Anything that needs to know "who are the agents"
// must therefore ASK rather than read a constant, and the constant is stale by the next
// session.
//
// The sources disagree, and that disagreement is the whole problem:
//
//   worktrees on disk   an agent exists the moment its clone appears
//   live mailboxes      an agent exists once it has written a message
//   the roster          an agent exists because someone recorded it
//
// swarm:sync already learned this the hard way. It originally derived the roster from
// mailboxes, and when six new agents started with no mailboxes yet, it reported the five
// DEAD agents as "absent", skipped all six LIVE ones, and printed "All clean worktrees
// are current" - because zero matches looked like a clean bill of health.
//
// So discovery is a UNION, never an intersection, and every id is labelled with the
// sources that saw it. An id found only in the roster is a real warning: either that
// agent was closed without being released, or it is new and unrecorded.
//
// ON OOP, since the owner raised it.
//
// The instinct is right that this recurs, and THREE PENDING TASKS already own the
// question: script-object-factory, shared-library-consolidation, script-library-refactor.
// The factory brief is explicit that the aim is to find WHICH parts of wrapping things
// in an object deliver fault isolation - not to wrap by default.
//
// So this is plain functions behind one exported surface, not a class. A factory here
// would add indirection to a script with no current bug, while adding a second place
// where the worktree root is resolved. The duplication that actually hurts - three
// scripts each re-deriving root and counting folders - is collected HERE, and
// consolidating that is what the pending tasks are for. If the factory work concludes
// these sources should be objects, this module is the one to convert, and it will be one
// file rather than six.
//
// Usage:
//   node scripts/tasking/discover-agents.mjs          human-readable
//   node scripts/tasking/discover-agents.mjs --json   machine-readable

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const MAIL = join(root, 'tasking', 'mail');
const ROSTER = join(root, 'tasking', 'roles', 'roster.json');

/** Where clones live. Overridable: this path differs per machine and per IDE, and a
 *  hardcoded one makes the script useless anywhere else. */
export const worktreeRoot = () => process.env.CLINE_WORKTREE_ROOT
  || join(process.env.USERPROFILE || '', '.cline', 'worktrees');

/** Ids with a live clone on disk. Probed by structure, not by directory name, since a
 *  worktree is not required to be named after the repo. */
export function fromWorktrees() {
  const wt = worktreeRoot();
  const found = [];
  let rootExists = false;
  try {
    for (const entry of readdirSync(wt, { withFileTypes: true })) {
      rootExists = true;
      if (!entry.isDirectory()) continue;
      if (existsSync(join(wt, entry.name, 'ApexProject', '.git'))) found.push(entry.name);
    }
  } catch {
    return { ids: [], rootExists: false };
  }
  return { ids: found, rootExists };
}

/** Ids with a live mailbox. An ARCHIVED mailbox is deliberately not live. */
export function fromMailboxes() {
  const ids = new Set();
  try {
    for (const f of readdirSync(join(MAIL, 'inbox'))) {
      if (f.endsWith('.md') && f !== 'README.md') ids.add(f.replace(/\.md$/, ''));
    }
  } catch { /* no mail tree yet */ }
  try {
    for (const e of readdirSync(join(MAIL, 'archive'), { withFileTypes: true })) {
      if (e.isDirectory()) ids.delete(e.name);
    }
  } catch { /* no archive yet */ }
  return [...ids];
}

/** Ids named in the roster, mapped to the role each holds. */
export function fromRoster() {
  const out = {};
  try {
    const { assignments } = JSON.parse(readFileSync(ROSTER, 'utf8'));
    for (const [role, ids] of Object.entries(assignments)) {
      for (const id of ids) out[id] = role;
    }
  } catch { /* no roster yet */ }
  return out;
}

const RESERVED = new Set(['main', 'taskmaster']);

/** Every agent id found, with the sources that saw it. */
export function discover() {
  const wt = fromWorktrees();
  const mail = fromMailboxes();
  const roster = fromRoster();

  const ids = new Set([...wt.ids, ...mail, ...Object.keys(roster)]);

  return {
    worktreeRoot: worktreeRoot(),
    worktreeRootExists: wt.rootExists,
    agents: [...ids]
      .filter((id) => !RESERVED.has(id))
      .sort()
      .map((id) => ({
        id,
        hasWorktree: wt.ids.includes(id),
        hasMailbox: mail.includes(id),
        role: roster[id] || null,
      })),
    reserved: [...ids].filter((id) => RESERVED.has(id)).sort(),
    counts: {
      worktrees: wt.ids.length,
      mailboxes: mail.length,
      rostered: Object.keys(roster).length,
    },
  };
}


// Run directly: report what was found, and warn about the two states that mean
// something is wrong. Guarded by import.meta.url so importing discover() from
// another script does not print a report as a side effect.
// `process.argv[1]` is the entry script. On Windows it is an absolute path with
// BACKSLASHES while import.meta.url is a file:// URL with forward slashes, so comparing
// them directly never matches and the CLI silently never runs - the script appeared to
// work and printed nothing. Both sides are normalised above.
//
// The undefined guard matters too: when this module is IMPORTED rather than executed,
// argv[1] can be absent, and an earlier version threw on it and took the importing
// script down. A reporting tool should never break its caller.
const entry = process.argv[1] || '';
const isEntry = entry !== ''
  && import.meta.url === new URL(`file:///${entry.replace(/\\/g, '/').replace(/^\/+/, '')}`).href;

if (isEntry) {
  const d = discover();

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(d, null, 2));
  } else {
    const where = d.worktreeRootExists ? '' : '  (MISSING)';
    console.log(`worktree root: ${d.worktreeRoot}${where}`);
    const counts = `found ${d.agents.length} agent(s) — worktrees ${d.counts.worktrees}, `
      + `mailboxes ${d.counts.mailboxes}, rostered ${d.counts.rostered}\n`;
    console.log(counts);

    const width = Math.max(0, ...d.agents.map((a) => a.id.length));
    for (const a of d.agents) {
      const src = [a.hasWorktree ? 'wt' : null, a.hasMailbox ? 'mail' : null]
        .filter(Boolean).join('+') || 'roster-only';
      console.log(`  ${a.id.padEnd(width)}  ${(a.role || '-').padEnd(16)} ${src}`);
    }
    if (d.reserved.length) console.log(`\nreserved: ${d.reserved.join(', ')}`);

    // Each warning names a concrete failure this module exists to prevent.
    const stale = d.agents.filter((a) => a.role && !a.hasWorktree && !a.hasMailbox);
    if (stale.length) {
      const names = stale.map((a) => a.id).join(', ');
      console.log(`\nWARN ${names} holds a role but has neither a clone nor a mailbox.`);
      console.log('  Either closed without `roster release`, or new and unrecorded.');
      console.log('  Release: npm run roster -- release <id>');
    }

    const pool = d.agents.filter((a) => !a.role);
    if (pool.length) {
      console.log(`\n${pool.length} agent(s) hold no role: ${pool.map((a) => a.id).join(', ')}`);
      console.log('  assign: npm run roster -- assign <id> ROLE   (see: roster -- plan)');
    }

    if (!d.worktreeRootExists) {
      console.log('\nWARN the worktree root does not exist. If the clones live elsewhere set');
      console.log('     CLINE_WORKTREE_ROOT. Without it only mail and roster are visible —');
      console.log('     and a brand-new agent has neither, so it would be invisible here.');
    }
  }
}
