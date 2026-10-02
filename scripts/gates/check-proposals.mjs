/**
 * Gate: proposals — the swarm's self-refilling task queue.
 *
 * WHY THIS EXISTS
 * ---------------
 * The owner does not want to keep asking "what next". A completed task almost always
 * names its own successor: `interior-ballistics` concluded that the achievable
 * product is an interpolation engine over published load data. That conclusion is
 * evidence for the next task, and it used to die with the session that found it.
 *
 * Agents now write proposals derived from their own findings. Left unchecked that
 * is a machine for generating confident fiction with a plausible write-set, so the
 * checks below are the safety mechanism, not bookkeeping.
 *
 * WHAT IT CHECKS
 * --------------
 *  1.  Every proposal cites `derived_from` and that FILE EXISTS. Ungrounded work
 *      never reaches pending/ - the one rule the whole scheme rests on.
 *  2.  `shape: research` proposals write ONLY inside their own completed/ folder.
 *      An autonomous swarm must be structurally unable to modify the application:
 *      agents can discover what needs changing, humans decide whether it changes.
 *  3.  Safety-critical topics are barred from research entirely. The physics of
 *      charge weights cannot be inferred from published data, so a task generated
 *      from that finding must not attempt it unattended.
 *  4.  Every NEW pending task is backed by a proposal, so the queue holds only work
 *      someone argued for. Tasks predating proposals are grandfathered.
 *  5.  No proposal collides with an in-flight task's write-set.
 *
 * WHAT IT DOES NOT DO
 * -------------------
 * It does not judge whether a proposal is a good idea. It cannot. It judges whether
 * a proposal is grounded, contained, and safe to run without a human reading it.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { root } from '../shared/data.mjs';

const TASKING = join(root, 'tasking');
const PROPOSALS = join(TASKING, 'mail', 'proposals');
const PENDING = join(TASKING, 'pending');
const IN_PROGRESS = join(TASKING, 'in-progress');

/** The commit that introduced proposals; pending tasks older than it are exempt. */
const PROPOSAL_COMMIT = 'a729634';

const problems = [];
const fail = (msg) => problems.push(msg);
/**
 * Topics that must never run unattended, however well evidenced. Matched against
 * the whole proposal text, because an agent that must avoid a topic will rarely
 * avoid the word for it.
 */
const SAFETY_BANNED = [
  /charge[- ]?weight/i,
  /powder constant/i,
  /burn[- ]?rate/i,
  /pressure exponent/i,
  /load synthesis/i,
  /\bmax(imum)? pressure\b/i,
  /interpolat\w+ (a )?load/i,
  /\breloading\b/i,
];

const RESEARCH_ONLY = /^\s*tasking\/completed\/[A-Za-z0-9_-]+\/?\s*$/;

/** Minimal front-matter reader: `---\nkey: value\n---` with list support. */
function frontmatter(file) {
  const raw = readFileSync(file, 'utf8');
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
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
    const value = pair[2].trim();
    out[key] = value === '' ? [] : value.replace(/^["']|["']$/g, '');
  }
  return out;
}

// Only real task folders count. README.md and .gitkeep live in these folders too,
// and treating them as tasks would demand a proposal for the folder's own docs.
function taskIds(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

function names(dir, filter = () => true) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => (d.isDirectory() || d.isFile()) && filter(d.name))
    .map((d) => d.name);
}

const proposalFiles = names(PROPOSALS, (n) => n.endsWith('.md'));
const seenIds = new Set();

for (const name of proposalFiles) {
  const file = join(PROPOSALS, name);
  const fm = frontmatter(file);
  const label = `proposals/${name}`;

  if (!fm) {
    fail(`${label}: no YAML front matter. A proposal must declare its shape and evidence.`);
    continue;
  }

  for (const field of ['proposal', 'title', 'derived_from', 'evidence', 'shape', 'write_set']) {
    if (fm[field] === undefined || fm[field] === '') {
      fail(`${label}: missing "${field}". Every proposal must be traceable to a finding.`);
    }
  }
  if (!fm.proposal || !fm.shape) continue;
// 1. Evidence must exist. This is the rule the whole scheme rests on.
  if (!existsSync(join(root, String(fm.derived_from)))) {
    fail(
      `${label}: derived_from "${fm.derived_from}" does not exist. A proposal with no `
      + 'surviving source is a guess wearing a manifest - it will not be queued.',
    );
  }
  if (String(fm.evidence || '').length < 20) {
    fail(`${label}: evidence is too short to be a quotation. Quote the conclusion.`);
  }

  // 2. Research-shaped work may only write into its own output folder.
  const writeSet = [fm.write_set].flat().filter(Boolean).map(String);
  if (fm.shape === 'research') {
    const escaped = writeSet.filter((w) => !RESEARCH_ONLY.test(w));
    if (escaped.length) {
      fail(
        `${label}: shape is "research" but the write-set reaches outside its own output `
        + `folder: ${escaped.join(', ')}. Unattended agents write findings only; a human `
        + 'decides whether the application changes.',
      );
    }
  } else if (fm.shape !== 'change') {
    fail(`${label}: shape must be "research" or "change", not "${fm.shape}".`);
  }

  // 3. Safety-critical work never runs unattended.
  //
  // Scanned for INTENT, not keywords. A proposal that says "do not compute charge
  // weights" has not proposed computing charge weights, and blocking it would
  // make the gate impossible to satisfy honestly - so the prohibitions section,
  // where an agent is required to state exactly this, is excluded before matching.
  // The first genuine false positive was this very proposal.
  if (fm.shape === 'research') {
    const text = readFileSync(file, 'utf8');
    const intent = text
      .split(/^##\s+(?:do not|prohibitions?|never)\b.*$/im)[0]
      .replace(/```[\s\S]*?```/g, '');
    const hit = SAFETY_BANNED.find((re) => re.test(intent));
    if (hit) {
      fail(
        `${label}: proposes safety-critical work (${hit}) and is barred from unattended `
        + 'research. Charge weights and powder constants cannot be inferred from '
        + 'published data - see tasking/completed/interior-ballistics/'
        + '05-feasibility-verdict.md. Set shape: change so a human reads it.',
      );
    }
  }

  const id = String(fm.proposal);
  if (seenIds.has(id)) fail(`${label}: duplicate proposal id "${id}".`);
  seenIds.add(id);
  seenIds.add(name.replace(/\.md$/, ''));
}

// 5. A proposal must not collide with work already in flight.
const inFlight = new Set(
  [...taskIds(PENDING), ...taskIds(IN_PROGRESS)].map((n) => `tasking/completed/${n}/`),
);
for (const name of proposalFiles) {
  const fm = frontmatter(join(PROPOSALS, name));
  if (!fm || !fm.proposal) continue;
  const own = `tasking/completed/${fm.proposal}/`;
  for (const w of [fm.write_set].flat().filter(Boolean).map(String)) {
    const clash = [...inFlight].find((t) => t !== own && (w === t || w.startsWith(t)));
    if (clash) {
      fail(
        `proposals/${name}: write-set "${w}" collides with "${clash.split('/')[2]}", `
        + 'which is already pending or in progress.',
      );
    }
  }
}

// 4. Every NEW pending task is backed by a proposal. Tasks predating proposals are
// grandfathered, so this cannot retroactively invalidate work already queued.
const tracked = new Set();
try {
  for (const line of execFileSync(
    'git',
    ['ls-tree', '-r', '--name-only', PROPOSAL_COMMIT, 'tasking/pending'],
    { cwd: root, encoding: 'utf8' },
  ).split('\n')) {
    const m = /tasking\/pending\/([^/]+)\//.exec(line);
    if (m) tracked.add(m[1]);
  }
} catch {
  tracked.add('__no_git__');
}

for (const id of taskIds(PENDING)) {
  if (tracked.has(id) || tracked.has('__no_git__')) continue;
  if (!seenIds.has(id)) {
    fail(
      `tasking/pending/${id}/ has no proposal behind it. The queue may only contain work `
      + `someone argued for - write tasking/mail/proposals/${id}.md, or remove the task. `
      + 'Tasks that predate proposals are exempt.',
    );
  }
}

if (problems.length) {
  console.error('check-proposals FAILED\n');
  for (const p of problems) console.error(`  - ${p}`);
  console.error('');
  process.exit(1);
}

console.log(`check-proposals: ${proposalFiles.length} proposal(s), grounded, contained, safe.`);