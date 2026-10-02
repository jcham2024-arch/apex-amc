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

// Agent ids come from the mailboxes, which is the swarm's own record of who exists.
const mailboxes = readdirSync(join(root, 'tasking/mail/inbox')).filter((f) => f.endsWith('.md'));
const agentIds = [...new Set(mailboxes.map((f) => f.replace(/\.md$/, '')))]
  .filter((id) => id !== 'main' && id !== 'taskmaster')
  .sort();

const WT_ROOT =
  process.env.CLINE_WORKTREE_ROOT || join(process.env.USERPROFILE || '', '.cline', 'worktrees');

const git = (cwd, args) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

const mainHead = git(root, ['rev-parse', 'HEAD']);
console.log(`main ${mainHead.slice(0, 7)}   agents: ${agentIds.length}\n`);

const rows = [];
for (const id of agentIds) {
  const wt = join(WT_ROOT, id, 'ApexProject');
  if (!existsSync(join(wt, '.git'))) {
    rows.push({ id, state: 'absent', detail: 'no clone on disk' });
    continue;
  }
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

for (const r of rows) console.log(`  ${r.id.padEnd(8)} ${r.state.padEnd(9)} ${r.detail}`);

const dirtyRows = rows.filter((r) => r.state === 'DIRTY');
const unresolved = rows.filter((r) => r.state === 'behind' || r.state === 'DIVERGED');

console.log('');
if (dirtyRows.length) {
  console.log(`${dirtyRows.length} agent(s) hold uncommitted work and were NOT touched.`);
  console.log('That agent decides whether to commit or discard - it is the only one that knows which.');
}
if (unresolved.length && !go) console.log('Re-run with -- --go to fast-forward the clean ones.');
if (unresolved.length && go) {
  const diverged = unresolved.filter((r) => r.state === 'DIVERGED').length;
  if (diverged) console.log(`${diverged} could not fast-forward and need a human.`);
}
if (!dirtyRows.length && !unresolved.length) console.log('All clean worktrees are current.');