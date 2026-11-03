/**
 * One-shot seeder: materialises the wave-1 task queue from a single spec.
 *
 * Written because two completed tasks independently reported that hand-maintained
 * briefs drift from their manifests � and interior-ballistics reported there is NO
 * generator for the task briefs, so nothing would ever catch or repair it. Writing
 * task.json and BRIEF.md from one record removes the drift mechanism rather than
 * documenting it.
 *
 * Not part of the swarm's ongoing machinery. `check-tasking` and `check-proposals`
 * are the permanent gates; this only bootstraps a queue.
 *
 * Run: node scripts/tasking/seed-wave.mjs            # every waveN.spec.json
 *      node scripts/tasking/seed-wave.mjs 2          # one wave
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from '../shared/data.mjs';

const here = import.meta.dirname;
const wave = process.argv[2];

// Each wave spec lives beside this script, so the queue can be regenerated, diffed
// and reviewed as data rather than as hand-edited folder pairs. One record produces
// the manifest, the brief AND the proposal, so they cannot drift - the defect
// interior-ballistics reported when it found hand-maintained briefs with no generator.
const specs = readdirSync(here)
  .filter((n) => /^wave\d+[a-z]?\.spec\.json$/.test(n) && (!wave || n.startsWith(`wave${wave}.`)))
  .sort();

const tasks = specs.flatMap((n) => JSON.parse(readFileSync(join(here, n), 'utf8')).tasks);

for (const t of tasks) {
  // Skip anything the swarm has already handled. Tasks move pending -> in-progress
  // -> completed, and completed/ keeps the folder, so "does this id exist anywhere"
  // is the only correct existence check. Re-seeding a wave after agents have worked
  // it must not resurrect finished work as a duplicate task id.
  const existing = ['pending', 'in-progress', 'completed'].some((tier) => {
    const d = join(root, 'tasking', tier, t.id);
    return existsSync(d);
  });
  if (existing) {
    console.log(`  skip      ${t.id} (already in the swarm)`);
    continue;
  }

  const dir = join(root, 'tasking', 'pending', t.id);
  mkdirSync(dir, { recursive: true });

  writeFileSync(join(dir, 'task.json'), `${JSON.stringify({
    schema: 'apex-task/1',
    id: t.id,
    title: t.title,
    status: 'ready',
    blocked_by: [],
    blocked_reason: null,
    agent: null,
    priority: t.priority,
    write_set: [`tasking/completed/${t.id}/`],
    required_outputs: t.outputs,
    derived_from: t.derived_from,
    prohibits: t.do_not,
    verification: ['npm run verify'],
  }, null, 2)}\n`, 'utf8');

  const bullets = (xs) => xs.map((s) => `- ${s}`).join('\n');

  // A task is not in the queue without a proposal behind it, and `check-proposals`
  // enforces that. So the seeder emits one from the same record. The evidence is not
  // retyped here: it is the `evidence` field above, which is a quotation from
  // `derived_from`, and check-proposals verifies that file exists. A task therefore
  // cannot be seeded from a source that is not there.
  writeFileSync(join(root, 'tasking', 'mail', 'proposals', `${t.id}.md`), [
    '---',
    `proposal: ${t.id}`,
    `title: ${t.title}`,
    `derived_from: ${t.derived_from}`,
    `evidence: "${t.evidence}"`,
    'shape: research',
    `priority: ${t.priority}`,
    'write_set:',
    `  - tasking/completed/${t.id}/`,
    'required_outputs:',
    ...t.outputs.map((o) => `  - ${o}`),
    '---',
    '',
    '## Why',
    '',
    t.why,
    '',
    '## Scope',
    '',
    bullets(t.scope),
    '',
    '## Do not',
    '',
    bullets(t.do_not),
    '',
    'Seeded by `scripts/tasking/seed-wave.mjs` from the matching `waveN.spec.json`,',
    'which holds the same record as the task manifest. Neither was hand-typed, so they',
    'cannot drift apart.',
    '',
  ].join('\n'), 'utf8');

  writeFileSync(join(dir, 'BRIEF.md'), `# BRIEF — ${t.title}

**Task id:** \`${t.id}\` · **Priority:** ${t.priority}
**Grounded in:** \`${t.derived_from}\`

## Why this task exists

${t.why}

## Before you start

1. Read \`.clinerules\` — especially §10 (the swarm), §11 (mail), §12 (proposals), §13 (the standing slot).
2. Provision your mailbox: \`npm run mail:init -- \${AGENT_ID}\`. It creates \`inbox/\${AGENT_ID}.md\` and \`bulletin/\${AGENT_ID}.md\` from template. It is idempotent, so run it even if you think the file exists — an agent whose inbox is missing is an agent whose findings nobody will read.
3. Read your \`task.json\`. Every file in \`required_outputs\` must exist or this task is not done.
4. Read your source: \`${t.derived_from}\`. Your task is derived from it, not from your assumptions.
5. Read \`tasking/mail/bulletin/*.md\`, \`tasking/mail/outbox/taskmaster/<your-id>.md\`, and the archived mail in \`tasking/mail/archive/\` — closed agents found things there that you would otherwise rediscover.
6. Claim it: \`mv tasking/pending/${t.id} tasking/in-progress/\`
7. Send a START message to your inbox. \`npm run tasking:check\` must pass before you send STOP.

## Scope

${bullets(t.scope)}

## Do not

${bullets(t.do_not)}

## Definition of done

${bullets(t.outputs.map((o) => `\`${o}\``))}

\`\`\`
npm run tasking:check     # every declared output must exist
npm run verify            # must exit 0
\`\`\`

Plus, in \`REPORT.md\`: what you did, what you found, the reasoning, what you did NOT
do and why, and any unresolved issue in \`NOTES.md\`.

**Plus \`HANDOVER.md\` — always, whatever happened.** The reviewer reads this first, and
it is what stops a stall from becoming a lost task. Status is one of \`complete\`,
\`partial\`, \`stalled\` or \`blocked\`. \`partial\` with specific documented gaps is a
**successful** task; an empty folder with an explanation is not.

## When you finish

1. \`mv tasking/in-progress/${t.id} tasking/completed/\`
2. Append a STOP message to \`tasking/mail/inbox/<your-id>.md\` — declare the real file count, the gate is checked against disk.
3. **Write a proposal** at \`tasking/mail/proposals/<your-slug>.md\` for the most valuable follow-up you found. Cite a file and quote it. See \`.clinerules\` §12.
4. Append anything reusable to \`tasking/mail/bulletin/<your-id>.md\`.
5. Run \`npm run tasking:restock\`, then claim the next task. Do not wait for a reply.

### If you finished but cannot commit

That is not stalling, and it has its own move:

\`\`\`bash
npm run quarantine -- put <task-id>
npm run role -- next          # then claim another role, or take a task
\`\`\`

\`tasking/completed/_quarantine/<task-id>/\` holds finished work whose COMMIT is blocked -
a conflict, a gate outside your write-set, a decision you cannot make. A required
\`QUARANTINE.md\` records what broke, why you could not fix it, what you recommend, and
**which shortcuts you rejected**. Then keep working.

This exists because the old protocol had no move that was not "stop". A merge conflict
became a stalled agent holding completed work nobody could see, and on 2 Oct that cost an
agent's entire research output - it had to be recovered from a dangling git checkpoint.

**Not for unfinished work.** Mid-task stops use \`HANDOVER.md\` with \`Status: partial\` or
\`stalled\`, and the folder moves to \`completed/\` normally. Quarantine is for work that
*finished and cannot be landed*; using it for work that did not finish would hide the
stall, which is the exact thing it exists to prevent.

Quarantine is excluded from task counting, so it never inflates \`completed/\`, and
\`npm run quarantine:check\` fails if any quarantined folder lacks its explanation.

## If you get stuck — read this before you stop

**You are working in a sandbox. Everything you write is reviewed before it reaches the
main project.** A concern is not a reason to stop.

Do **not** halt because:

- a file you want is outside your write-set → write it up in \`NOTES.md\`, work around it
- \`npm run verify\` is red → that is a shared gate; your completion is judged by
  \`npm run tasking:check\`, which is scoped to **your** declared outputs. Note the
  failure and keep working.
- a brief is wrong or contradicts another document → say so in your report. Fixing
  briefs is the planner's job, and reporting it is the whole contribution.
- a value is unknown → **leave it EMPTY.** An honest gap beats an invented number.

Do **not** halt when you finish with gaps. "I completed most of this and documented
exactly what is missing and why" is a **successful** task. An empty folder with an
explanation is not.

The only two things that stop you: the task folder is gone (someone else claimed it), or
\`pending/\` is empty — report **"queue empty"** and stop. Both are correct results.

Never weaken a gate and never run \`handoff:accept\`. Not for permission — those are
judgements about production, which is what the review step is for.
`, 'utf8');
}

console.log(`seeded ${tasks.length} tasks into tasking/pending/`);
for (const t of tasks) console.log(`  ${t.priority.padEnd(8)} ${t.id}`);