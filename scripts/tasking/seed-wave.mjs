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
  .filter((n) => /^wave\d+\.spec\.json$/.test(n) && (!wave || n.startsWith(`wave${wave}.`)))
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
2. Read your \`task.json\`. Every file in \`required_outputs\` must exist or this task is not done.
3. Read your source: \`${t.derived_from}\`. Your task is derived from it, not from your assumptions.
4. Read \`tasking/mail/bulletin/*.md\` and \`tasking/mail/outbox/taskmaster/<your-id>.md\`.
5. Claim it: \`mv tasking/pending/${t.id} tasking/in-progress/\`
6. Send a START message to your inbox. \`npm run tasking:check\` must pass before you send STOP.

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

## When you finish

1. \`mv tasking/in-progress/${t.id} tasking/completed/\`
2. Append a STOP message to \`tasking/mail/inbox/<your-id>.md\` — declare the real file count, the gate is checked against disk.
3. **Write a proposal** at \`tasking/mail/proposals/<your-slug>.md\` for the most valuable follow-up you found. Cite a file and quote it. See \`.clinerules\` §12.
4. Append anything reusable to \`tasking/mail/bulletin/<your-id>.md\`.
5. Run \`npm run tasking:restock\`, then claim the next task. Do not wait for a reply.
`, 'utf8');
}

console.log(`seeded ${tasks.length} tasks into tasking/pending/`);
for (const t of tasks) console.log(`  ${t.priority.padEnd(8)} ${t.id}`);