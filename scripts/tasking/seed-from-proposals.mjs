/**
 * Materialise proposals that triage has APPROVED.
 *
 * WHY THIS EXISTS SEPARATELY FROM seed-wave.mjs
 * ----------------------------------------------
 * `swarm-improvement` measured the seam this closes. Two agents — `roadmap-synthesis`
 * and `unknown-state-design` — independently proposed `findings-ledger`, and neither
 * could see the other's proposal, because proposals live in a folder nothing reads
 * before starting a task. An index-shaped proposal sat in the swarm and the swarm still
 * could not tell that two agents wanted the same thing.
 *
 * The fix is a TRIAGE RECORD next to the materialiser: every proposal gets a verdict
 * here, so the next one is compared against what has already been decided by a
 * mechanism rather than by luck.
 *
 * APPROVED-AS-RESEARCH only. A `held-for-owner` or `duplicate` proposal is listed and
 * skipped — never dispatched.
 *
 * Run: node scripts/tasking/seed-from-proposals.mjs
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from '../shared/data.mjs';
import { TRIAGE } from './proposal-triage.mjs';

const PROPOSALS = join(root, 'tasking', 'mail', 'proposals');
const bullets = (xs) => xs.map((s) => `- ${s}`).join('\n');

/** Minimal front-matter reader, matching check-proposals.mjs. */
function frontmatter(file) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(file, 'utf8'));
  if (!m) return null;
  const out = {};
  let key = null;
  for (const line of m[1].split(/\r?\n/)) {
    const item = /^\s*-\s+(.*)$/.exec(line);
    if (item && key) {
      out[key] = [...(Array.isArray(out[key]) ? out[key] : [out[key]]), item[1].trim()];
      continue;
    }
    const pair = /^([A-Za-z_]+):\s*(.*)$/.exec(line);
    if (!pair) continue;
    key = pair[1];
    const v = pair[2].trim();
    out[key] = v === '' ? [] : v.replace(/^["']|["']$/g, '');
  }
  return out;
}

const inSwarm = new Set(
  ['pending', 'in-progress', 'completed']
    .flatMap((t) => (existsSync(join(root, 'tasking', t))
      ? readdirSync(join(root, 'tasking', t), { withFileTypes: true })
        .filter((d) => d.isDirectory()).map((d) => d.name)
      : [])),
);

let approved = 0;
let skipped = 0;

for (const file of readdirSync(PROPOSALS).filter((n) => n.endsWith('.md'))) {
  const id = file.replace(/\.md$/, '');
  const verdict = TRIAGE[id]?.verdict;

  if (verdict !== 'approved-as-research') {
    if (verdict) console.log(`  skip      ${id} (${verdict})`);
    continue;
  }
  if (inSwarm.has(id)) {
    console.log(`  skip      ${id} (already dispatched)`);
    continue;
  }

  const fm = frontmatter(join(PROPOSALS, file));
  if (!fm) continue;

  const title = String(fm.title || id);
  const outputs = [fm.required_outputs].flat().filter(Boolean).map(String);
  const dir = join(root, 'tasking', 'pending', id);
  mkdirSync(dir, { recursive: true });

  writeFileSync(join(dir, 'task.json'), `${JSON.stringify({
    schema: 'apex-task/1',
    id,
    title,
    status: 'ready',
    blocked_by: [],
    blocked_reason: null,
    agent: null,
    priority: 'high',
    write_set: [fm.write_set].flat().filter(Boolean).map(String),
    required_outputs: outputs,
    derived_from: fm.derived_from,
    // The reason it was `shape: change` is the SUBJECT, not the destination. Producing
    // the analysis is research. Enacting it is the owner's, and this forbids the latter.
    prohibits: [
      'Do not enact the protocol or policy change this task specifies. You produce the '
      + 'analysis and the recommendation; the owner decides. `.clinerules` 12.',
      'Do not edit another task\'s files. One writer per file.',
      'Do not re-derive a finding already stated in tasking/completed/FINDINGS.md. Quote it '
      + 'and add only what is new.',
    ],
    verification: ['npm run verify'],
  }, null, 2)}\n`, 'utf8');

  writeFileSync(join(dir, 'BRIEF.md'), `# BRIEF — ${title}

**Task id:** \`${id}\` · **Priority:** high
**Grounded in:** \`${fm.derived_from}\`
**Dispatched from:** \`tasking/mail/proposals/${id}\`, approved in
\`scripts/tasking/proposal-triage.mjs\`.

## Why this task exists

${TRIAGE[id].note}

## Before you start

1. Read \`.clinerules\` — §10 swarm, §11 mail, §12 proposals, §13 the standing slot.
2. Read your source: \`${fm.derived_from}\`.
3. **Read \`tasking/mail/bulletin/*.md\` and \`tasking/completed/FINDINGS.md\` first.** Check
   whether this ground is already covered. Two agents once proposed the same index and
   neither could see the other; a third version is worse than the first.
4. Claim it: \`mv tasking/pending/${id} tasking/in-progress/\`
5. Send START to your inbox.

## Do not

${bullets([
    'Do not enact the protocol or policy change this task specifies. You produce the '
      + 'analysis; the owner decides.',
    'Do not edit another task\'s files. One writer per file.',
    'Do not re-derive a finding already in tasking/completed/FINDINGS.md.',
  ])}

## Definition of done

${bullets(outputs.map((o) => `\`${o}\``))}

\`\`\`
npm run tasking:check
npm run verify
\`\`\`

Then move to \`completed/\`, send STOP with the REAL file count, run
\`npm run tasking:restock\`, and claim the next task.
`, 'utf8');

  console.log(`  APPROVED  ${id}`);
  approved += 1;
}

console.log(`\nseeded ${approved} approved proposal(s); ${skipped} held or duplicate.`);