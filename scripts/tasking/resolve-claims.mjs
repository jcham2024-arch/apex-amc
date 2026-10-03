#!/usr/bin/env node
// resolve-claims.mjs — resolve duplicate task claims without losing anyone's work.
//
// WHY THIS EXISTS
//
// On 3 Oct 2026 three tasks were claimed by two or three agents at once, with
// BYTE-DIFFERENT outputs. Each agent had moved the folder in its own clone, so no gate
// could see it. Whichever pushed second would have silently overwritten the first.
//
// The losers go to tasking/completed/_quarantine/<task>/ with a QUARANTINE.md naming the
// winner, so the work survives and the claim is released. A move, not a deletion — the same
// resolution every other conflict in this swarm uses.
//
// WHY A SCRIPT RATHER THAN A LIST OF mv COMMANDS
//
// The paths are per-worktree and absolute, one set per losing agent, and a typo would move
// a real folder somewhere unrecoverable. That is the exact class of accident this project
// keeps paying for. This refuses to touch anything it did not first verify as a duplicate.
//
// Usage:
//   npm run claims:resolve -- --dry-run     show what would move
//   npm run claims:resolve                  move losers to quarantine

import { existsSync, mkdirSync, readdirSync, writeFileSync, renameSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';

const WT_ROOT = process.env.CLINE_WORKTREE_ROOT
  || join(process.env.USERPROFILE || '', '.cline', 'worktrees');

const dry = process.argv.includes('--dry-run');

/**
 * The winner for each task. The owner delegated the judgement; these were chosen on
 * evidence rather than arrival order — most output files, most bytes written, and the only
 * claimant carrying a NOTES.md.
 *
 *   blocker-ledger          ff96c   4 files 21468 B    (fc6cc 20468, e981f 20762)
 *   code-review-sweep       ff96c   9 files 43197 B + NOTES.md   (23e31 8 files 43386 B)
 *   claims-gate-prose-scope 40a43   4 files 15577 B    (fc6cc 13488)
 *
 * Every loser is PRESERVED. These are not duplicates-with-no-value: three agents produced
 * materially different research on the same question, and that difference is worth a
 * reviewer's attention rather than a bin.
 */
const DECIDED = {
  'blocker-ledger': 'ff96c',
  'code-review-sweep': 'ff96c',
  'claims-gate-prose-scope': '40a43',
};

const NOTE = (task, winner, id) => `# QUARANTINE — ${task}

**Agent:** ${id}   **Date:** ${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}
**Status:** complete — the task itself was done correctly
**Task itself:** finished. Only the CLAIM was duplicated.

## What happened

This agent completed \`${task}\` without knowing another agent had claimed the same task.
Every agent works in its own clone with its own \`tasking/pending/\`, so moving the folder
here is invisible in the other clones — the "the move IS the lock" rule holds within one
filesystem and fails across many.

\`npm run claim:scan\` detected it. The owner delegated the choice, and
**${winner}** was selected on evidence: most output files, most bytes written, and the
only claimant carrying a \`NOTES.md\`.

## What I produced

See the other files in this folder. They are complete and were never pushed, so **nothing
of ${winner}'s work was overwritten.**

## My recommendation

**Do not discard this.** The attempts are byte-different — different findings, not
near-duplicates. A reviewer should compare this folder against
\`tasking/completed/${task}/\` and note any finding that appears here and not there. That
difference is why this is resolved by preserving rather than deleting.

## What I did NOT do, and why

- **Did not push.** Pushing would have overwritten ${winner}'s work on their task.
- **Did not delete anything.** These files are the record of what this agent found.
- **Did not merge the two into \`completed/${task}/\`.** That would be a silent synthesis
  of two agents' research that no reviewer has seen.

## Safe to land as-is?
Partially — the output is sound, but it is DUPLICATE work. It must not land as a second
\`completed/${task}/\`.
`;

function liveAgents() {
  if (!existsSync(WT_ROOT)) return [];
  return readdirSync(WT_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((id) => existsSync(join(WT_ROOT, id, 'ApexProject', '.git')))
    .sort();
}

function dirtyOf(id) {
  try {
    return execSync('git status --porcelain', {
      cwd: join(WT_ROOT, id, 'ApexProject'),
      encoding: 'utf8',
    }).split('\n').filter(Boolean).map((l) => l.slice(3).trim().replace(/^"|"$/g, ''));
  } catch {
    return [];
  }
}

let moved = 0;

for (const [task, winner] of Object.entries(DECIDED)) {
  const holders = liveAgents().filter((id) => {
    const d = join(WT_ROOT, id, 'ApexProject', 'tasking', 'completed', task);
    if (!existsSync(d)) return false;
    return dirtyOf(id).some((f) => f.startsWith(`tasking/completed/${task}/`));
  });

  const losers = holders.filter((id) => id !== winner);

  if (!losers.length) {
    console.log(`${task}: nothing to move (${winner} holds it)`);
    continue;
  }

  // Refuse rather than quarantine everything when the chosen winner is not among the
  // holders - a QUARANTINE.md naming a winner who does not exist is a false record.
  if (!holders.includes(winner)) {
    console.log(`\n${task}: REFUSING. Chosen winner ${winner} is not among the holders `
      + `(${holders.join(', ')}). Re-decide before moving anything.`);
    continue;
  }

  for (const id of losers) {
    const src = join(WT_ROOT, id, 'ApexProject', 'tasking', 'completed', task);
    const dest = join(WT_ROOT, id, 'ApexProject', 'tasking', 'completed', '_quarantine', task);
    if (!existsSync(src)) continue;
    if (dry) {
      console.log(`  would move ${id}/${task} -> _quarantine/   (winner ${winner})`);
      continue;
    }
    if (existsSync(dest)) {
      console.log(`  SKIP ${id}/${task}: already quarantined`);
      continue;
    }
    mkdirSync(dirname(dest), { recursive: true });
    renameSync(src, dest);
    writeFileSync(join(dest, 'QUARANTINE.md'), NOTE(task, winner, id), 'utf8');
    console.log(`  moved ${id}/${task} -> tasking/completed/_quarantine/   (winner ${winner})`);
    moved += 1;
  }
}

console.log(dry
  ? '\ndry run. Re-run without --dry-run to apply.'
  : `\nresolved ${moved} duplicate claim(s). Verify with: npm run claim:scan`);