// Regenerates .cline/tasks/task-*.md from the ledger and the prompts.
//
//   npm run tasks:gen
//
// WHY THIS EXISTS
// ---------------
// The 16 task files each embed an execution prompt. Those prompts also live in
// `docs/AGENT-PROMPTS.md`, which is the human-maintained source. Maintaining the
// text twice would guarantee drift: an agent edited the prompt in one place, the
// other copy kept the old version, and two agents got different instructions for
// the same task.
//
// So the task files are DERIVED. This script is the only thing that writes them.
// Editing a task file by hand is a mistake the next run will silently undo, which
// is why the generated files say so at the top.
//
// WHAT IT DOES
// ------------
// 1. Parses each `## N. Heading` + ```markdown fence block out of AGENT-PROMPTS.md.
// 2. Wraps it in the task schema with the machine-readable write-set from
//    ledger.json — the part `check-tasks.mjs` validates.
// 3. Refuses to write a task whose prompt is missing, rather than emitting a
//    file with an empty instruction section.
//
// The write-set lives in the ledger rather than here, so the overlap checker and
// the file generator read the same single source.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { root } from '../shared/data.mjs';

const LEDGER = resolve(root, '.cline/tasks/ledger.json');
const PROMPTS = resolve(root, 'docs/AGENT-PROMPTS.md');

if (!existsSync(LEDGER) || !existsSync(PROMPTS)) {
  console.error('Cannot generate: ledger.json or docs/AGENT-PROMPTS.md is missing.');
  process.exit(1);
}

const ledger = JSON.parse(readFileSync(LEDGER, 'utf8'));
const prompts = readFileSync(PROMPTS, 'utf8');

/**
 * Pull each `## N. Heading` followed by a ```markdown fence out of the prompts doc.
 *
 * Two details, both learned the hard way:
 *
 *  - The separator between the ID and the title is an em dash, not a hyphen.
 *    Matching either specific character broke when the other was used, so the
 *    pattern deliberately does not name it: `[^\n]*` covers any separator.
 *  - The preamble between the heading and the fence varies — several prompts
 *    carry a bold "**Strictly serial.**" line there — so arbitrary lines are
 *    allowed before the fence.
 */
const blocks = {};
const fence = /^# ([ABCD]\d)[^\n]*\n(?:[^\n]*\n)*?```markdown\n([\s\S]*?)\n```/gm;
for (let m = fence.exec(prompts); m !== null; m = fence.exec(prompts)) {
  blocks[m[1]] = m[2];
}

const STATUS = {
  ready: 'READY',
  blocked: 'BLOCKED',
  blocked_external: 'BLOCKED (external - needs a human)',
};

const written = [];
const missing = [];

for (const t of ledger.tasks) {
  const body = blocks[t.id];
  if (!body) {
    // Deliberately not written. An empty execution prompt is worse than a
    // missing file: an agent handed it would have no instructions and no signal
    // that anything was wrong.
    missing.push(t.id);
    continue;
  }

  const writeSet = t.write_set ?? [];
  const shared = writeSet.filter((p) => /package\.json|data\/schema\/|data\/generated\//.test(p));
  const blockedBy = (t.blocked_by ?? []).join(', ') || 'none';

  const doc = `# Task ${t.id} - ${t.title}

**Status:** ${STATUS[t.status] ?? t.status}
**Blocked by:** ${blockedBy}
**Shared-path lock needed:** ${shared.map((p) => `\`${p}\``).join(', ') || 'none'}
**Model:** fresh instance of the default model

> GENERATED FILE - DO NOT EDIT.
>
> The execution prompt below is extracted from
> [\`docs/AGENT-PROMPTS.md\`](../docs/AGENT-PROMPTS.md), which is the single
> source of truth. Edit the prompt there and run \`npm run tasks:gen\`.
> This file adds the machine-readable write-set that \`npm run tasks:check\` validates.

---

## 1. Isolation Boundaries

**Strict Write Paths** - the ONLY files you may create, modify, or delete:

${writeSet.map((p) => `- \`${p}\``).join('\n')}

> If a required change falls outside this list, **halt and report it**. Do not
> "just add it". See [\`.clinerules\`](../../.clinerules) section 1.

**Lock protocol:** claim any shared path in \`.cline/tasks/ledger.json\` before
writing it. If another task already holds the lock, stop and report.

${t.notes ? `**Note:** ${t.notes}\n` : ''}
---

## 2. Context Anchors - read in this order

1. [\`.clinerules\`](../../.clinerules) - binding
2. [\`docs/CONVENTIONS.md\`](../../docs/CONVENTIONS.md) - binding
3. [\`docs/PARALLEL-WORK-PLAN.md\`](../../docs/PARALLEL-WORK-PLAN.md)
4. \`AGENTS.md\`

---

## 3. Execution Prompt

> Paste verbatim into the sub-agent.

\`\`\`markdown
${body}
\`\`\`

---

## 4. Definition of Done

- [ ] \`npm run verify\` exits 0
- [ ] Mandatory negative test run and observed FAILING; output pasted verbatim
- [ ] \`git status --porcelain\` shows nothing outside section 1
- [ ] Documentation updated in the same change
- [ ] If the main app changed: \`npm run website:build\`, then
      \`npm run handoff:accept -- --note="what changed and why"\`
- [ ] Model used recorded here: fresh instance of the default model
- [ ] Five-part summary per [\`.clinerules\`](../../.clinerules) section 8,
      including what you found but did NOT touch
`;

  const out = resolve(root, t.file);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, doc, 'utf8');
  written.push(t.id);
}

console.log(`task files   ok   ${written.length}/${ledger.tasks.length} generated`);

if (missing.length) {
  console.error(
    `\n  ${missing.length} task(s) have no prompt in docs/AGENT-PROMPTS.md: `
      + `${missing.join(', ')}\n  No file was written for them. Add the prompt, then re-run.\n`,
  );
  process.exit(1);
}
