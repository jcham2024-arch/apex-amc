#!/usr/bin/env node
// swarm:sync - bring agent worktrees back onto main without losing in-flight work.
//
// WHY THIS EXISTS. Agents work in separate clones under
// C:/Users/<user>/.cline/worktrees/<agent-id>/ApexProject. They were last synced at
// b0d55f5 while main moved well past that, so an agent starting now reads FIX-BACKLOG,
// PRODUCT.md and the task briefs WITHOUT the owner's later decisions (availability
// outranking price, match grade, cite-and-link, the name). It would then do correct work
// against wrong instructions.
//
// The danger is the obvious one: pulling over uncommitted work destroys it. So this
// script NEVER pulls a dirty worktree. It reports and refuses.
//
// USAGE
//   npm run swarm:sync          report only, change nothing
//   npm run swarm:sync -- --go  fast-forward the CLEAN worktrees only
//
// A dirty worktree is never touched in either mode. Only that agent knows whether its
// uncommitted work is worth keeping.

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const go = process.argv.includes('--go');

const WT_ROOT =
  process.env.CLINE_WORKTREE_ROOT || join(process.env.USERPROFILE || '', '.cline', 'worktrees');

// WHO EXISTS IS A DISK QUESTION, NOT A REPO QUESTION.
//
// This originally took the roster from tasking/mail/inbox/*.md. That was wrong, and it
// failed in exactly the situation it mattered most: after the old swarm was closed and
// six new agents were started, those agents had no mailbox yet (mailboxes are written
// on their first STOP message), while the OLD ids still had one. So the script reported
// all five dead agents as "absent" and skipped all six live ones - then printed "All
// clean worktrees are current", because zero matches looked like a clean bill of health.
//
// A roster that silently under-reports is worse than no roster: it turns "I have not
// looked" into "everything is fine". So the clones on disk are the roster now, and the
// mailbox is only used to annotate. A new agent is discovered the moment its worktree
// appears, before it has written a single file.
//
// Real clones are found by probing for a nested ApexProject checkout under each
// worktree id, rather than assuming the directory name, since a worktree is not
// required to be named after the repo.
const known = new Set(
  readdirSync(join(root, 'tasking/mail/inbox'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''))
);
// A mailbox that has been ARCHIVED belongs to a closed agent. Reading it here would
// resurrect every retired agent as "missing", which is how this script reported five
// dead ids as a problem when six live ones were on disk. Archived mail is deliberately
// preserved - it just is not a live mailbox any more.
const ARCHIVE = join(root, 'tasking/mail/archive');
if (existsSync(ARCHIVE)) {
  for (const e of readdirSync(ARCHIVE, { withFileTypes: true })) {
    if (e.isDirectory()) known.delete(e.name);
  }
}
const ids = [];
if (existsSync(WT_ROOT)) {
  for (const entry of readdirSync(WT_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (existsSync(join(WT_ROOT, entry.name, 'ApexProject', '.git'))) ids.push(entry.name);
  }
}
ids.sort();

const orphans = [...known].filter(
  (id) => !ids.includes(id) && id !== 'main' && id !== 'taskmaster'
);

const git = (cwd, args) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

const mainHead = git(root, ['rev-parse', 'HEAD']);
console.log(`main ${mainHead.slice(0, 7)}   agents on disk: ${ids.length}\n`);

const rows = [];
for (const id of ids) {
  const wt = join(WT_ROOT, id, 'ApexProject');
  const head = git(wt, ['rev-parse', 'HEAD']);
  const dirty = git(wt, ['status', '--porcelain']).split('\n').filter(Boolean);
  const behindCount = git(wt, ['rev-list', '--count', `${head}..${mainHead}`]);

  if (dirty.length) {
    rows.push({ id, state: 'DIRTY', detail: `${dirty.length} changed, ${behindCount} behind - not touched` });
    continue;
  }
  if (behindCount === '0') {
    rows.push({ id, state: 'current', detail: 'up to date' });
    continue;
  }
  if (go) {
    try {
      git(wt, ['merge', '--ff-only', mainHead]);
      rows.push({ id, state: 'updated', detail: `fast-forwarded ${behindCount} commits` });
    } catch (err) {
      const msg = String(err.stderr || err).trim().split('\n')[0];
      rows.push({ id, state: 'DIVERGED', detail: `ff-only refused: ${msg}` });
    }
  } else {
    rows.push({ id, state: 'behind', detail: `${behindCount} commits behind` });
  }
}

for (const r of rows) {
  console.log(`  ${r.id.padEnd(8)} ${r.state.padEnd(9)} ${r.detail}${known.has(r.id) ? '' : '   (no mailbox yet)'}`);
}

const dirtyRows = rows.filter((r) => r.state === 'DIRTY');
const unresolved = rows.filter((r) => r.state === 'behind' || r.state === 'DIVERGED');

console.log('');
if (!rows.length) {
  console.log('NO agent clones were found under the worktree root.');
  console.log(`  looked in: ${WT_ROOT}`);
  console.log('Nothing was checked, so nothing can be called healthy. Is the swarm running?');
  console.log('Set CLINE_WORKTREE_ROOT if the clones live elsewhere.');
  process.exit(1);
}
if (orphans.length) {
  console.log(`${orphans.length} mailbox(es) have no clone on disk (closed agents): ${orphans.join(', ')}`);
  console.log('Their mail is history. Leave it in place - it is the record of what they found.');
}
if (dirtyRows.length) {
  console.log(`${dirtyRows.length} agent(s) hold uncommitted work and were NOT touched.`);
  console.log('That agent decides whether to commit or discard - it is the only one that knows which.');
}
if (unresolved.length && !go) console.log('Re-run with -- --go to fast-forward the clean ones.');
if (unresolved.length && go) {
  const diverged = unresolved.filter((r) => r.state === 'DIVERGED').length;
  if (diverged) console.log(`${diverged} could not fast-forward and need a human.`);
}
if (!dirtyRows.length && !unresolved.length && rows.length) console.log('All clean worktrees are current.');