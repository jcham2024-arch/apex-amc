/**
 * Standing task: the swarm's own improvement slot.
 *
 * WHY THIS EXISTS
 * ---------------
 * An agent that finishes and finds `pending/` empty has nothing to do. That is how a
 * swarm silently stops: work completes, nothing is generated, and the next thing
 * requires the owner to ask. The owner asked for that to stop.
 *
 * WHY IT IS A SCRIPT AND NOT JUST A TASK FOLDER
 * ---------------------------------------------
 * A task in `pending/` stops existing the moment an agent claims it, because
 * claiming MOVES the folder - that is the locking mechanism. A plain task folder
 * cannot be "always available"; it can only be always-available-right-now. Seeding
 * three copies would create three tasks that drift apart and three places to look.
 *
 * So the slot is regenerated rather than stocked. This creates
 * `tasking/pending/swarm-improvement/` when absent and does nothing when present.
 * Idempotent, so the taskmaster can call it every turn without thinking about it.
 *
 * Run: node scripts/tasking/ensure-standing-task.mjs   (also: npm run tasking:restock)
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from '../shared/data.mjs';

// Standing SLOTS, plural. One script, many permanent slots, declared as data.
//
// The owner asked for continuous improvement of the code itself - functionality,
// design, efficiency, commentary, and staying current - not one refactor pass. A
// single-slot script would mean rewriting it per slot; a list means adding a slot is
// a spec file and nothing else.
//
//   swarm-improvement - the FRAMEWORK: how the swarm works
//   code-health        - the CODE: how the project is built
//
// They are separate on purpose. One agent improving the protocol and another
// improving the codebase is exactly the parallelism the swarm is for, and they
// cannot collide because their write-sets are different folders.
const SLOTS = ['swarm-improvement', 'code-health'].map((id) => ({
  id,
  spec: JSON.parse(readFileSync(join(import.meta.dirname, `${id}.spec.json`), 'utf8')),
}));

const bullets = (xs) => xs.map((s) => `- ${s}`).join('\n');

/** Task folder names in a swarm tier, ignoring .gitkeep and README.md. */
function taskFolders(tier) {
  const dir = join(root, 'tasking', tier);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

/**
 * Busy means an agent is on it RIGHT NOW: present in `pending/` (queued, claimable)
 * or `in-progress/` (claimed). A COMPLETED rotation deliberately does not count.
 *
 * That distinction is the whole mechanism. An agent finishes, the folder lands in
 * completed/, and the slot must come back - otherwise the next agent to finish finds
 * an empty queue, which is the exact failure this exists to prevent. Caught by probe:
 * treating completed as busy meant the slot regenerated once and never again.
 */
function isActive(id) {
  return ['pending', 'in-progress'].some((tier) => taskFolders(tier)
    .some((n) => n === id || n.startsWith(`${id}-`)));
}

for (const { id: ID, spec } of SLOTS) {
  if (isActive(ID)) {
    console.log(`restock: ${ID} is queued or in progress; nothing to do.`);
    continue;
  }
  createSlot(ID, spec);
}

function createSlot(ID, spec) {
const PENDING = join(root, 'tasking', 'pending', ID);
mkdirSync(PENDING, { recursive: true });

writeFileSync(join(PENDING, 'task.json'), `${JSON.stringify({
  schema: 'apex-task/1',
  id: ID,
  title: spec.title,
  status: 'ready',
  blocked_by: [],
  blocked_reason: null,
  agent: null,
  priority: 'standing',
  standing: true,
  write_set: [`tasking/completed/${ID}/`],
  required_outputs: spec.outputs,
  derived_from: spec.derived_from,
  prohibits: spec.do_not,
  verification: ['npm run verify'],
}, null, 2)}\n`, 'utf8');

// `%%ID%%` rather than `${ID}` inside the shell example: the brief must show a
// literal `$(date +%Y%m%d)` for the agent, and a template literal would try to
// evaluate it. Substituted after the string is built.
const brief = `# BRIEF — ${spec.title}

**Task id:** \`${ID}\` · **Priority:** standing — this slot is always available.
**It regenerates itself.** If you finish and nothing replaces it, you created the
exact failure it exists to prevent. Run \`npm run tasking:restock\`.

## Why this task exists

${spec.why}

## Before you start

1. Read \`.clinerules\` — §10 swarm, §11 mail, §12 proposals, §13 this slot.
2. Read your \`task.json\`. Every file in \`required_outputs\` must exist or it is not done.
3. Read \`tasking/mail/bulletin/*.md\` — do not research what another agent already found.
4. Read \`tasking/review/HISTORY.md\` — do not re-propose something already rejected there.
5. Claim it: \`mv tasking/pending/${ID} tasking/in-progress/\`
6. Append START to your inbox.

## Scope

${bullets(spec.scope)}

## Do not

${bullets(spec.do_not)}

## Definition of done

${bullets(spec.outputs.map((o) => `\`${o}\``))}

\`\`\`
npm run tasking:check     # every declared output must exist
npm run verify            # must exit 0
\`\`\`

Plus in \`REPORT.md\`: what you did, what you found, the reasoning, what you did NOT
do and why, and unresolved issues in \`NOTES.md\`.

## When you finish — the important part

1. Move your work to \`tasking/completed/${ID}\`. **Check first whether that folder
   already exists** — if it does, this is rotation 2 or later, and you must not
   overwrite the previous rotation.

   The rule: **the folder name must equal the \`id\` in your \`task.json\`.**
   \`npm run tasking:check\` enforces it, because the folder name is the lock and
   everything else in the framework matches a folder by name. **Do NOT datestamp the
   folder.** An earlier version of this brief said to, and it was wrong on both counts:
   it fails the gate on rotation 1, and it violates the id rule on every rotation. A
   rotation-1 agent followed it, hit both errors, and recorded the analysis in
   NOTES.md §3 — which is where the correct rule below comes from.

   So: if \`completed/${ID}\` is free, use it. If it is taken, do not rename and do not
   merge — **append your findings to the existing outputs with a dated section and say
   in STOP that you were rotation N.** One folder per task id, permanently; history
   accumulates inside it rather than multiplying into id/folder mismatches.
2. Append STOP to your inbox with the real file count.
3. **Write proposals.** Every improvement you found but could not apply becomes a
   proposal file, citing the file and quoting it. A finding with no proposal never
   becomes work.
4. Append reusable findings to \`tasking/mail/bulletin/<your-id>.md\`.
5. **Run \`npm run tasking:restock\`.** If this slot is not back in \`pending/\`, the
   next agent to finish will find an empty queue.
6. Claim whatever else is in \`pending/\`.
`;

// `$$` stands in for a literal `$` in the shell example the brief shows: a template
// literal would try to evaluate `$(date ...)`, and escaping it trips no-useless-escape.
writeFileSync(
  join(PENDING, 'BRIEF.md'),
  brief.replaceAll('%%ID%%', ID).replaceAll('$$(', '$('),
  'utf8',
);

writeFileSync(join(root, 'tasking', 'mail', 'proposals', `${ID}.md`), [
  '---',
  `proposal: ${ID}`,
  `title: ${spec.title}`,
  `derived_from: ${spec.derived_from}`,
  `evidence: "${spec.evidence}"`,
  'shape: research',
  'priority: standing',
  'write_set:',
  `  - tasking/completed/${ID}/`,
  'required_outputs:',
  ...spec.outputs.map((o) => `  - ${o}`),
  '---',
  '',
  '## Why',
  '',
  spec.why,
  '',
  '## Scope',
  '',
  bullets(spec.scope),
  '',
  '## Do not',
  '',
  bullets(spec.do_not),
  '',
  'Standing slot, regenerated by `scripts/tasking/ensure-standing-task.mjs`. Not stocked',
  'as copies: claiming a task MOVES its folder, so copies would drift and would give',
  'two agents the same job at once.',
  '',
].join('\n'), 'utf8');

console.log(`restock: created tasking/pending/${ID} and its proposal.`);
}