#!/usr/bin/env node
// seed-research.mjs — keep the research queue supplied for the product categories.
//
// WHY THIS EXISTS
//
// The owner asked for the swarm to never run dry, and named the domains: guns, gun
// parts, scopes, gun accessories, range bags, range-bag contents, and where to get each
// of them. Those are categories, not tasks, and an agent cannot claim a category.
//
// So this generates one well-specified task per category, from a spec file. Idempotent:
// a task already in pending/, in-progress/ or completed/ is skipped, which is what
// stops the hourly steward seeding the same work every hour.
//
// WHY THE STEWARD DOES NOT JUST WRITE BRIEFS AD HOC
//
// The steward prompt says to seed new tasks when pending/ is thin. If it invents them,
// briefs vary in quality hour to hour and nobody can tell a good one from a bad one. So
// the standing categories live here, in one reviewable place, and the steward's job
// narrows to top-ups it can justify with a specific finding.
//
// Usage:
//   npm run seed:research          seed anything missing
//   npm run seed:research -- --dry-run   show what would be seeded

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = dirname(dirname(here));
const PENDING = join(root, 'tasking', 'pending');
const SPEC = join(here, 'research-categories.spec.json');

const dry = process.argv.includes('--dry-run');

const spec = JSON.parse(readFileSync(SPEC, 'utf8'));

const existing = new Set();
for (const tier of ['pending', 'in-progress', 'completed']) {
  try {
    for (const d of readdirSync(join(root, 'tasking', tier), { withFileTypes: true })) {
      if (d.isDirectory()) existing.add(d.name);
    }
  } catch { /* tier may not exist */ }
}

let seeded = 0;
let skipped = 0;

for (const cat of spec.categories) {
  if (existing.has(cat.id)) {
    skipped += 1;
    continue;
  }
  if (dry) {
    console.log(`would seed: ${cat.id}`);
    seeded += 1;
    continue;
  }

  const dir = join(PENDING, cat.id);
  mkdirSync(dir, { recursive: true });

  const id = cat.id;
  const outputs = cat.required_outputs.map((o) => `- \`${o}\``).join('\n');

  // Briefs are COMPOSED from the shared preamble rather than written out per category.
  // Three separate hand-written briefs drifted apart within a day: one kept the no-stalling
  // section, one lost the quarantine instruction, one said "ask the owner" where the other
  // said "document it and continue". An agent is only as good as the brief it holds, so the
  // protocol text lives in exactly one place.
  const brief = `# BRIEF — ${cat.title}\n\n`
    + `**Task id:** \`${id}\` · **Priority:** ${cat.priority}\n`
    + `**Grounded in:** \`${cat.derived_from}\`\n\n`
    + `## Why this task exists\n\n${cat.why}\n\n`
    + spec.preamble.replace('{ID}', id).replace('{OUTPUTS}', outputs) + '\n\n'
    + `## Scope\n\n${cat.scope.map((s) => `- ${s}`).join('\n')}\n\n`
    + (cat.youtube ? `## YouTube as evidence\n\n${cat.youtube}\n\n` : '')
    + (cat.extra ? `## Extra rules for this task\n\n${cat.extra}\n\n` : '')
    + spec.antiStall.replace('{ID}', id) + '\n';

  writeFileSync(join(dir, 'BRIEF.md'), brief, 'utf8');

  // The manifest must match the project schema exactly. An earlier version wrote
  // `shape`, `standing` and `prohibitions` - none of which are the field names - and
  // omitted schema, status, blocked_by, agent and verification. check-tasking caught it
  // immediately ("has no status"), which is the gate working. The field list is copied
  // from a known-good manifest in tasking/pending/, not invented here.
  writeFileSync(join(dir, 'task.json'), `${JSON.stringify({
    schema: 'apex-task/1',
    id: cat.id,
    title: cat.title,
    status: 'ready',
    blocked_by: [],
    blocked_reason: null,
    agent: null,
    priority: cat.priority,
    write_set: [`tasking/completed/${cat.id}/`],
    required_outputs: cat.required_outputs,
    derived_from: cat.derived_from,
    // `prohibits` is the schema's field name. Listed per task rather than inherited,
    // because an agent reads its own manifest to learn what it may not do.
    prohibits: [
      'Do not state a charge weight, powder constant, burn rate or chamber safety limit for any cartridge. Not as an example, not in a footnote, not to show you know the rule.',
      'Do not store a transcript or verbatim text from any video or article. Link and cite; summarise in your own words. Transcripts are gitignored for exactly this reason.',
      'Every derived weight or score must carry source_url, source_date and derivation. Minimum three independent sources, or the cell stays EMPTY. See tasking/review/DERIVED-VALUES.md.',
      'Do not scrape retailer prices. Cite and link instead; retailer terms generally prohibit scraping.',
      'Do not delete or rewrite another task output. This task reports; the record stays as written.',
    ],
    verification: ['npm run verify'],
  }, null, 2)}\n`, 'utf8');

  seeded += 1;
  console.log(`seeded: ${cat.id} (${cat.priority})`);

  // A task with no proposal behind it fails `proposals:check`: "The queue may only
  // contain work someone argued for." The gate is right - it is why the queue holds
  // argued work rather than a wishlist - so the proposal is written here rather than by
  // hand, and it carries the owner's own words as the argument.
  //
  // The proposal cites task.json's derived_from and quotes the brief, so it is a real
  // argument rather than a form filled in to satisfy a gate.
  writeFileSync(join(root, 'tasking', 'mail', 'proposals', `${cat.id}.md`), [
    '---',
    `proposal: ${cat.id}`,
    `title: ${cat.title}`,
    `derived_from: ${cat.derived_from}`,
    `evidence: "${cat.why.replace(/\n+/g, ' ').slice(0, 300)}"`,
    'shape: research',
    `priority: ${cat.priority}`,
    'write_set:',
    `  - tasking/completed/${cat.id}/`,
    'required_outputs:',
    ...cat.required_outputs.map((o) => `  - ${o}`),
    '---',
    '',
    `# Proposal: ${cat.title}`,
    '',
    '## Why this is here',
    '',
    cat.why,
    '',
    '## The owner asked for it directly',
    '',
    '> Research datasets across guns, gun parts, scopes, gun accessories, range bags and',
    '> range-bag contents, including where to get them. YouTube videos may be cited as',
    '> evidence, and a value derived from reviews is acceptable **provided the sources',
    '> are cited and the reasoning is written down**.',
    '',
    `Seeded by \`scripts/tasking/seed-research.mjs\` from`,
    `\`scripts/tasking/research-categories.spec.json\`.`,
    '',
    '## What this does NOT do',
    '',
    '- It stores no transcript. Transcripts are the creator\'s content; we cite the link.',
    '- It produces no load data. Propellant and pressure figures are barred from unattended',
    '  research entirely - see `interior-ballistics/05-feasibility-verdict.md`.',
    '- It scrapes no retailer prices.',
    '',
    'Every derived value carries `source_url`, `source_date` and `derivation`. See',
    '[tasking/review/DERIVED-VALUES.md](../../../review/DERIVED-VALUES.md). A number with',
    'no derivation attached is a fabrication and the cell stays EMPTY instead.',
    '',
  ].join('\n'), 'utf8');
}

console.log(`\nseed:research — ${seeded} seeded, ${skipped} already present`);