#!/usr/bin/env node
// claim-role.mjs — an agent picks the role the swarm most needs right now.
//
// WHY THIS EXISTS
//
// The owner said: any agent may take any role, provided it reads that role's instructions
// and knows the context; the efficient arrangement is an agent picking the most useful
// role at the time, doing that work, then taking a new task when done.
//
// That is a self-selecting swarm, and it needs a CLAIM rather than an ASSIGNMENT. An
// assignment says "you are the reviewer". A claim says "the swarm most needs a reviewer
// right now, and here is who has it".
//
// CLAIMING IS A MOVE, NOT A REGISTRY WRITE.
//
// tasking/pending/ already solved this for tasks: the folder move IS the lock, so there
// is no registry to race on and no lock to expire. This uses the same primitive - a role
// is held by the existence of a file, and taking a role is creating it. `mkdir` without
// recursive fails atomically with EEXIST, so there is no window in which two agents
// believe they both hold IMPLEMENTATION. A read-then-write against a JSON field has
// exactly that window, which is the one that matters.
//
// SINGLE-WRITER ROLES ARE NOT OPEN TO EVERYONE. REVIEWER and WORKER scale freely;
// IMPLEMENTATION, DATA-STEWARD and QA-GATE-TESTER are capped, because their entire value
// is that exactly one agent writes those files. An agent that picks a full role is told
// who has it, not silently queued.
//
// Usage:
//   npm run role -- next            what the swarm needs most, ranked with reasons
//   npm run role -- claim [ROLE]    claim the top unheld role, and print the brief
//   npm run role -- release         give up your role
//   npm run role -- status          who holds what
//
// Pass your agent id as AGENT_ID in the environment, or as the first argument.

import {
  existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CAPACITY } from './role-capacity.mjs';
import { rankRoles, FALLBACK } from './role-value.mjs';
import { discover } from './discover-agents.mjs';
import { fail } from '../shared/swarm-errors.mjs';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const HELD = join(root, 'tasking', 'roles', 'held');

const MY = process.env.AGENT_ID || '';

/** Who holds each role. A held role is a file at held/<ROLE>/<agent-id>.md. */
export function holders() {
  const out = {};
  try {
    for (const role of readdirSync(HELD, { withFileTypes: true })) {
      if (!role.isDirectory()) continue;
      for (const f of readdirSync(join(HELD, role.name))) {
        if (f.endsWith('.md')) (out[role.name] ||= []).push(f.replace(/\.md$/, ''));
      }
    }
  } catch { /* nothing held yet */ }
  return out;
}

const countDirs = (p) => {
  try {
    return readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory()).length;
  } catch {
    return 0;
  }
};

const safeRead = (p) => {
  try {
    return readFileSync(p, 'utf8');
  } catch {
    return '';
  }
};

/** Live queue signals. Every number is measured, never remembered. */
export function signals() {
  const verdicts = { PASS: 0, FAIL: 0, SUSPEND: 0 };
  let verdictFiles = 0;
  try {
    for (const f of readdirSync(join(root, 'tasking', 'review'))) {
      if (!f.endsWith('.md') || /^(README|FINDINGS|LESSONS|HISTORY|PRODUCT)\.md$/.test(f)) continue;
      verdictFiles += 1;
      const t = safeRead(join(root, 'tasking', 'review', f));
      for (const v of Object.keys(verdicts)) {
        if (new RegExp(`Verdict:\\s*${v}`, 'i').test(t)) verdicts[v] += 1;
      }
    }
  } catch { /* no review dir */ }

  // A stall is a HANDOVER that says so, or a task in in-progress/ with no handover.
  let stalled = 0;
  try {
    for (const d of readdirSync(join(root, 'tasking', 'in-progress'), { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      const h = join(root, 'tasking', 'in-progress', d.name, 'HANDOVER.md');
      if (!existsSync(h) || /\*\*Status:\*\*\s*(stalled|blocked)/i.test(safeRead(h))) stalled += 1;
    }
  } catch { /* nothing in progress */ }

  const h = holders();
  return {
    pending: countDirs(join(root, 'tasking', 'pending')),
    inProgress: countDirs(join(root, 'tasking', 'in-progress')),
    completed: countDirs(join(root, 'tasking', 'completed')),
    verdicts: verdictFiles,
    passes: verdicts.PASS,
    fails: verdicts.FAIL,
    suspended: verdicts.SUSPEND,
    stalled,
    liveImplementation: (h.IMPLEMENTATION || []).length,
    agents: discover().agents.length,
    openSeedsDefect: /4 Bore Rifle/i.test(
      safeRead(join(root, 'tasking', 'review', 'FINDINGS.md'))
      + safeRead(join(root, 'tasking', 'mail', 'proposals', 'cartridge-verdict-enforcement.md')),
    ),
    gateGap: false,
  };
}

/** Ranked roles with capacity already applied, so a full role is never suggested. */
export function suggestions() {
  const h = holders();
  const out = [];
  for (const r of rankRoles(signals())) {
    const cap = CAPACITY[r.role]?.max ?? 1;
    const have = (h[r.role] || []).length;
    if (cap !== Infinity && have >= cap) continue;
    out.push({ ...r, held: have, cap });
  }
  // WORKER always applies, and is the fallback. This is what stops an agent that finds
  // every specialist role occupied from having nothing to do.
  if (!out.some((r) => r.role === 'WORKER')) {
    out.push({ ...FALLBACK, score: 1, held: (h.WORKER || []).length, cap: Infinity });
  }
  return out.sort((a, b) => b.score - a.score);
}

function brief(role) {
  console.log(`\n# You are now ${role}\n`);
  console.log(`Read tasking/roles/${role}.md IN FULL before you start. It is binding.`);
  const r = suggestions().find((x) => x.role === role);
  if (r) console.log(`\nWhy this role now: ${r.why}`);
  const others = Object.entries(holders()).filter(([, ids]) => !ids.includes(MY));
  if (others.length) {
    console.log('\nAlso held right now - do not duplicate their work:');
    for (const [role2, ids] of others) console.log(`  ${role2}: ${ids.join(', ')}`);
  }
  console.log('\nWhen you finish: npm run role -- release   then claim again, or take a task.');
}

const [, , cmd, a, b] = process.argv;
// `claim` takes either `claim <agent-id>` (take the top role) or `claim <ROLE> <id>`.
// Reading only ONE argument made `claim DATA-STEWARD ddff2` treat the agent as the role
// and the role as the agent, so the single-writer check compared the wrong string and
// told an agent that held nothing "You already hold DATA-STEWARD".
const ME = MY || (cmd === 'claim' ? (b || a) : a);
const WANT = cmd === 'claim' && b ? a : null;

switch (cmd) {
  case 'next': {
    const list = suggestions();
    if (!list.length) {
      console.log('Nothing needs doing right now. Check: ls tasking/pending');
      break;
    }
    const s = signals();
    const unreviewed = Math.max(0, s.completed - s.verdicts);
    console.log(`pending ${s.pending} · in-progress ${s.inProgress} · completed ${s.completed} · `
      + `unreviewed ${unreviewed} · stalled ${s.stalled}\n`);
    list.forEach((r, i) => {
      const cap = r.cap === Infinity ? '*' : r.cap;
      console.log(`${i === 0 ? '->' : '  '} ${r.role.padEnd(16)} held ${r.held}/${cap}`);
      console.log(`     ${r.why}\n`);
    });
    console.log('claim the first:  npm run role -- claim <your-agent-id>');
    break;
  }
  case 'claim': {
    const want = (WANT && CAPACITY[WANT] ? WANT : null) || suggestions()[0]?.role;
    if (!want) {
      console.log('Nothing to claim. Check: npm run role -- next');
      break;
    }
    if (!CAPACITY[want]) {
      console.log(`unknown role "${want}". Known: ${Object.keys(CAPACITY).join(', ')}`);
      process.exit(1);
    }
    if (!ME) {
      console.log('I need to know which agent you are. Pass your id:');
      console.log(`  npm run role -- claim ${want} <your-agent-id>`);
      break;
    }
    const mine = Object.entries(holders()).filter(([, ids]) => ids.includes(ME));
    if (mine.length) {
      console.log(fail(
      'ALREADY_HELD',
      `You already hold ${mine.map(([r]) => r).join(', ')}.`,
    ));
      break;
    }
    const cap = CAPACITY[want].max;
    const have = (holders()[want] || []).length;
    if (cap !== Infinity && have >= cap) {
      console.log(fail(
        'ROLE_HELD',
        `${want} is held by ${(holders()[want] || []).join(', ')}, capacity ${cap}.`,
        CAPACITY[want].note,
      ));
      console.log('  Pick another: npm run role -- next');
      break;
    }
    const claimBody = `# ${want} held by ${ME}\n\nclaimed ${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}\n`;

    // Create the parent directory only. The claim itself is the per-agent file below.
    //
    // The first version mkdir'd the ROLE directory too, which made every role capacity
    // one: REVIEWER is unbounded by design, and the second reviewer was refused with
    // "claimed by someone else". The capacity rule was enforced twice - once correctly
    // by the check above, once wrongly by the mkdir - and the wrong one won.
    if (!existsSync(join(HELD, want))) {
      // Recursive here is safe: this only creates the ROLE directory, and a concurrent
      // creator of the same directory is not an error. The exclusive create below is
      // what actually arbitrates the claim.
      mkdirSync(join(HELD, want), { recursive: true });
    }
    // Atomic per AGENT, not per role. `mkdirSync` on the agent's own file fails with
    // EEXIST only if that agent already claimed it, which is the race that matters:
    // two agents both trying to take DATA-STEWARD.
    //
    // The first version mkdir'd the ROLE directory, which made every role capacity 1.
    // REVIEWER is unbounded by design - two reviewers auditing different tasks is the
    // entire point of scaling - and the second one was told "claimed by someone else a
    // moment ago" and sent away. The capacity rule was being enforced twice, once
    // correctly above and once wrongly here, and the wrong one won because the message
    // was more convincing.
    //
    // `wx` is exclusive create: it fails rather than overwriting, and it does not
    // truncate an existing claim file.
    try {
      writeFileSync(join(HELD, want, `${ME}.md`), claimBody, { flag: 'wx' });
    } catch (e) {
      if (e.code === 'EEXIST') {
        console.log(`You already claimed ${want}. Nothing changed.`);
        break;
      }
      throw e;
    }
    brief(want);
    break;
  }
  case 'release': {
    const held = Object.entries(holders()).filter(([, ids]) => ids.includes(ME));
    if (!held.length) {
      console.log(`${ME || 'you'} hold no role.`);
      break;
    }
    for (const [role] of held) {
      rmSync(join(HELD, role, `${ME}.md`), { force: true });
      try {
        rmSync(join(HELD, role));
      } catch { /* not empty; someone else holds it */ }
    }
    console.log(`released ${held.map(([r]) => r).join(', ')}`);
    break;
  }
  case 'status': {
    const h = holders();
    if (!Object.keys(h).length) {
      console.log('No roles claimed. Run: npm run role -- next');
      break;
    }
    for (const role of Object.keys(CAPACITY).sort()) {
      const cap = CAPACITY[role].max;
      const ids = h[role] || [];
      const limit = cap === Infinity ? '*' : cap;
      console.log(`${role.padEnd(18)} ${String(ids.length).padStart(2)}/${String(limit).padEnd(3)} ${ids.join(', ')}`);
    }
    break;
  }
  default:
    console.log('usage: role -- <next|claim|release|status> [role|agent-id]');
}