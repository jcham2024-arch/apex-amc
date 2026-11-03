#!/usr/bin/env node
// apply-stuck-policy.mjs
//
// WHY THIS EXISTS
//
// Measured on 2 Oct 2026: 4 of 8 status messages in one swarm session were BLOCKED or
// QUESTION. Reading them showed the agents were not being timid - they were following
// instructions that told them to halt on a red gate or a missing write-path. dc408
// finished both of its tasks, then wrote "four decisions that are not mine, plus two
// red gates I will not fix" and sat idle for the rest of the session.
//
// The rule has been corrected in .clinerules and in the brief generator (seed-wave.mjs).
// This script back-fills the already-seeded briefs, because a rule that only exists in
// the generator does not help an agent holding a brief that was written before it.
//
// Idempotent: briefs that already carry the section are skipped.

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const PENDING = join(root, 'tasking', 'pending');

const MARKER = '## If you get stuck';

const SECTION = `
## If you get stuck - read this before you stop

**You are working in a sandbox. Everything you write is reviewed before it reaches the
main project.** A concern is not a reason to stop.

Do **not** halt because:

- a file you want is outside your write-set - write it up in \`NOTES.md\`, work around it
- \`npm run verify\` is red - that is a shared gate; your completion is judged by
  \`npm run tasking:check\`, which is scoped to **your** declared outputs. Note the
  failure and keep working.
- a brief is wrong or contradicts another document - say so in your report. Fixing
  briefs is the planner's job, and reporting it is the whole contribution.
- a value is unknown - **leave it EMPTY.** An honest gap beats an invented number.

Do **not** halt when you finish with gaps. "I completed most of this and documented
exactly what is missing and why" is a **successful** task. An empty folder with an
explanation is not.

The only two things that stop you: the task folder is gone (someone else claimed it), or
\`pending/\` is empty - report **"queue empty"** and stop. Both are correct results.

Never weaken a gate and never run \`handoff:accept\`. Not for permission - those are
judgements about production, which is what the review step is for.
`;

let patched = 0;
let skipped = 0;

for (const dir of readdirSync(PENDING)) {
  const brief = join(PENDING, dir, 'BRIEF.md');
  if (!existsSync(brief)) continue;
  const text = readFileSync(brief, 'utf8');
  if (text.includes(MARKER)) {
    skipped += 1;
    continue;
  }
  writeFileSync(brief, `${text.trimEnd()}\n${SECTION}`, 'utf8');
  patched += 1;
}

console.log(`stuck-policy: ${patched} brief(s) updated, ${skipped} already had it`);