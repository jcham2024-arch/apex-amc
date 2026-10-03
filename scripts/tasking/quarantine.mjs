#!/usr/bin/env node
// quarantine.mjs — the holding area for finished work that cannot be committed.
//
// WHY THIS EXISTS
//
// An agent with finished work and a blocked commit has historically had no move that was
// not "stop". The protocol was claim, write every output, commit, and STOP sends the only
// exit - so a merge conflict became a stalled agent holding completed work nobody could
// see. On 2 Oct that pattern cost real research: an agent's entire output existed only in
// its chat transcript, and it had to be recovered from a dangling git checkpoint.
//
// A stalled agent is not the failure. A stalled agent STRANDING finished work is. The
// protocol needs a move that explicitly means "not stopping".
//
// QUARANTINE IS EXCLUDED FROM TASK COUNTING, and that is the subtle part. It lives inside
// completed/ because that is where finished work belongs and where a reviewer looks,
// which means a naive readdir counts it. Adding an empty folder made check-tasking report
// "23 task(s) in completed/" against 22 real ones, and every downstream counter - role
// ranking, backlog depth - inherited the lie. check-tasking's taskFolders() now skips it.
//
// Usage:
//   npm run quarantine -- put <task-id> [source-dir]  move work in, requiring QUARANTINE.md
//   npm run quarantine -- list                       what is waiting, and who owns it
//   npm run quarantine -- check                      enforce: every folder has its note
//   npm run quarantine -- release <task-id>          move it back up to completed/

import {
  existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync, renameSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const COMPLETED = join(root, 'tasking', 'completed');
const Q = join(COMPLETED, '_quarantine');
const NOTE = 'QUARANTINE.md';

const folders = () => {
  try {
    return readdirSync(Q, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
  } catch {
    return [];
  }
};

const problems = [];

/** Enforce the one rule that makes quarantine useful rather than a graveyard. */
function check() {
  const found = folders();
  if (!found.length) {
    console.log('quarantine is empty');
    return;
  }
  for (const name of found) {
    const note = join(Q, name, NOTE);
    if (!existsSync(note)) {
      problems.push(
        `${name}/ has no ${NOTE}. A quarantined folder without its explanation is worse `
        + 'than none: the files are there and nobody knows what happened to them.',
      );
      continue;
    }
    const t = readFileSync(note, 'utf8');
    for (const f of ['What went wrong', 'Why I could not resolve it', 'My recommendation']) {
      if (!t.includes(f)) problems.push(`${name}/${NOTE} is missing the "${f}" section.`);
    }
  }
  if (problems.length) {
    console.log('quarantine:check FAILED\n');
    for (const p of problems) console.log(`  - ${p}`);
    process.exit(1);
  }
  console.log(`quarantine verified: ${found.length} folder(s), all with a ${NOTE}`);
}
switch (process.argv[2]) {
  case 'put': {
    const id = process.argv[3];
    const from = process.argv[4];
    if (!id) {
      console.log('usage: quarantine -- put <task-id> [source-dir]');
      break;
    }
    const src = from || join(COMPLETED, id);
    if (!existsSync(src)) {
      console.log(`no such folder: ${src}`);
      process.exit(1);
    }
    const dest = join(Q, id);
    if (existsSync(dest)) {
      console.log(`${id} is ALREADY quarantined. Merge into it rather than replacing it.`);
      process.exit(1);
    }
    mkdirSync(Q, { recursive: true });
    renameSync(src, dest);
    if (!existsSync(join(dest, NOTE))) {
      const note = `# QUARANTINE - ${id}\n\n`
        + '**Agent:** <your-id>   **Date:** <ISO-8601>\n'
        + '**Status:** complete | partial\n'
        + '**Task itself:** finished and correct - ONLY the commit is blocked\n\n'
        + '## What I produced\n\n'
        + '## What went wrong - the actual error\n\n'
        + '## Why I could not resolve it\n\n'
        + '## My recommendation\n\n'
        + '## What I did NOT do, and why\n\n'
        + '## Safe to land as-is?\nyes | no | partially\n';
      writeFileSync(join(dest, NOTE), note, 'utf8');
      console.log(`\n! wrote a ${NOTE} TEMPLATE into ${id}/ - fill it in before you move on.`);
    }
    console.log(`\n${id} quarantined. Now: npm run role -- next   and keep working.`);
    break;
  }
  case 'list': {
    const found = folders();
    if (!found.length) {
      console.log('quarantine is empty - nothing waiting');
      break;
    }
    console.log(`${found.length} quarantined:\n`);
    for (const name of found) {
      const note = join(Q, name, NOTE);
      let who = 'UNKNOWN';
      let problem = 'no explanation';
      if (existsSync(note)) {
        const t = readFileSync(note, 'utf8');
        const m = /\*\*Agent:\*\*\s*(\S+)/.exec(t);
        // Written as an explicit match rather than `|| [, 'unknown']`, which builds a
        // sparse array and trips no-sparse-arrays.
        who = m ? m[1] : 'unknown';
        const w = /## What went wrong[^\n]*\n+([^\n]+)/.exec(t);
        if (w) problem = w[1].trim().slice(0, 70);
      }
      const files = readdirSync(join(Q, name)).length;
      console.log(`  ${name}`);
      console.log(`    owner: ${who}   files: ${files}`);
      console.log(`    ${problem}\n`);
    }
    break;
  }
  case 'check':
    check();
    break;
  case 'release': {
    const id = process.argv[3];
    const src = join(Q, id);
    if (!id || !existsSync(src)) {
      console.log('usage: quarantine -- release <task-id>');
      process.exit(1);
    }
    const dest = join(COMPLETED, id);
    if (existsSync(dest)) {
      console.log(`completed/${id} already exists. Move it aside first.`);
      process.exit(1);
    }
    renameSync(src, dest);
    console.log(`${id} released to completed/. Run: npm run tasking:check`);
    break;
  }
  default:
    console.log('usage: quarantine -- <put|list|check|release> [args]');
}