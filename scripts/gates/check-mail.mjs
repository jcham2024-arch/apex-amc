/**
 * Gate: the agent mail protocol.
 *
 * WHY THIS EXISTS
 * ---------------
 * Agents working in separate git worktrees had no way to talk. Four of five produced
 * real work into `tasking/completed/`, all of it uncommitted and invisible from the
 * main tree, and nobody noticed for hours. Coordination needed the human in the loop,
 * which defeats the point of a swarm.
 *
 * So mail: one file per agent, one writer per file. Not a shared append-only log —
 * that is read-modify-write, and the second of two concurrent appends discards the
 * first agent's message with no trace. See tasking/mail/README.md.
 *
 * WHAT IT CHECKS
 * --------------
 *  1.  Every message carries a parseable `<!-- ts | AGENT id | TYPE -->` header.
 *      A message missing one is a half-written message, and must not be silently
 *      read as an old one.
 *  2.  Message types are from the known set.
 *  3.  The agent id in the header matches the filename — you write your own inbox,
 *      not someone else's.
 *  4.  A STOP claiming `complete` has its task in `completed/` with the declared
 *      file count present. This is the load-bearing check: "finished" and "said I
 *      finished" must not be different things, or this design is decorative.
 *  5.  Timestamps are non-decreasing within a file, so a clock or copy problem
 *      surfaces instead of producing an impossible history.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { root } from '../shared/data.mjs';

const MAIL = join(root, 'tasking', 'mail');
const INBOX = join(MAIL, 'inbox');
const OUTBOX = join(MAIL, 'outbox', 'taskmaster');

// RETRACTION was added after 2 Oct 2026, when an agent needed to withdraw its own
// earlier BLOCKED message once the taskmaster fixed the underlying bug.
//
// The failure it exposed is worth stating: the agent had reported a deadlocked standing
// slot, then the taskmaster shipped a fix in dff44f2 ("and a gate I had wrong"). The
// agent wanted to say so, and had no way to say it. Without this type it had three bad
// options - leave a false BLOCKED standing (the taskmaster keeps working a dead end),
// edit its own earlier message (destroys the append-only ledger the gate protects), or
// send a NOTE that reads as if nothing was ever wrong. All three lose the correction.
//
// A retraction must name what it withdraws and why, so it is auditable rather than a
// quiet overwrite.
const TYPES = new Set([
  'START', 'STOP', 'BLOCKED', 'QUESTION', // worker -> taskmaster
  'ACK', 'NOTE', 'REDIRECT', 'COLLISION', // taskmaster -> worker
  'RETRACTION', // either direction - withdraws a message this agent itself sent
]);

// TASKMASTER messages carry no agent id - the directory already says who they are
// for. Both forms are legal: `| AGENT <id> | TYPE` and `| TASKMASTER | TYPE`.
const HEADER =
  /<!--\s*([0-9T:\-.+Z]+)\s*\|\s*AGENT\s+([A-Za-z0-9_-]+)\s*\|\s*([A-Z]+)\s*-->|<!--\s*([0-9T:\-.+Z]+)\s*\|\s*TASKMASTER\s*\|\s*([A-Z]+)\s*-->/;

const problems = [];
const fail = (msg) => problems.push(msg);

if (!existsSync(MAIL)) {
  console.log('check-mail: tasking/mail/ not created yet - skipped.');
  process.exit(0);
}

/** Parse one mailbox file into messages, flagging malformed headers. */
function parse(file) {
  const label = file.replace(/\\/g, '/').split('/tasking/')[1];
  // Fenced blocks are stripped first: a mailbox needs to be able to SHOW the header
  // format, and an example inside a fence is documentation, not a message. Without
  // this the gate would fail on every mailbox's own instructions.
  const raw = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '');
  const out = [];

  // A mailbox may carry a preamble BEFORE its first header: that is the mailbox's
// own standing instructions, and an agent must not have to delete them to send.
//
// There is deliberately no "stray text" check on the body side. An earlier version
// split the file on headers and failed if any chunk was non-empty - which is
// exactly the message body, so it rejected every real message while claiming the
// headers were malformed. Agent 4880a diagnosed this correctly; the message regex
// below already consumes header+body pairs, so nothing after the first header can
// be stray. Bodies are not "unparsed"; they are the point.
const first = raw.indexOf('<!--');
const before = first === -1 ? raw : raw.slice(0, first);
if (before.trim() && !/^#/.test(before.trim())) {
  fail(`${label}: text before the first header must be a Markdown preamble.`);
}

  for (const m of raw.matchAll(/<!--([\s\S]*?)-->\n?([\s\S]*?)(?=<!--|$)/g)) {
    const h = HEADER.exec(`<!--${m[1]}-->`);
    if (!h) {
      fail(
        `${label}: malformed header near ${JSON.stringify(m[1].slice(0, 60))}. `
        + 'Expected: <!-- ISO8601 | AGENT <id> | TYPE -->',
      );
      continue;
    }
    const [, ts, id, type, tmTs, tmType] = h;
    const role = id ? 'AGENT' : 'TASKMASTER';
    const msgId = id || 'taskmaster';
    const msgType = type || tmType;
    if (!TYPES.has(msgType)) {
      fail(`${label}: unknown message type "${msgType}". Known: ${[...TYPES].join(', ')}`);
    }
    out.push({ ts: ts || tmTs, role, id: msgId, type: msgType, body: m[2] });
  }

  // Monotonic timestamps. An agent rewriting history is what this catches.
  for (let i = 1; i < out.length; i += 1) {
    if (out[i].ts < out[i - 1].ts) {
      fail(
        `${label}: timestamps go backwards at message ${i + 1} `
        + `(${out[i - 1].ts} then ${out[i].ts}). Mailboxes are append-only ledgers; a `
        + 'message was rewritten, reordered, or the clock moved.',
      );
    }
  }
  return { label, out };
}

function boxes(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => n.endsWith('.md') && n !== 'README.md')
    .map((n) => join(dir, n));
}

const mailboxes = [...boxes(INBOX), ...boxes(OUTBOX)];

for (const file of mailboxes) {
  const { label, out } = parse(file);
  const expectedId = file.split(/[\\/]/).pop().replace(/\.md$/, '');

  for (const msg of out) {
    if (msg.role === 'AGENT' && msg.id !== expectedId) {
      fail(
        `${label}: message signed "${msg.id}" is in ${expectedId}'s mailbox. `
        + 'One writer per file - write your own inbox, and let the taskmaster route.',
      );
    }
    if (msg.role === 'TASKMASTER' && file.includes('inbox')) {
      fail(
        `${label}: taskmaster-signed message found in an inbox. Replies belong in `
        + `outbox/taskmaster/${expectedId}.md`,
      );
    }

    // The load-bearing check: a STOP is a claim about the filesystem, so verify it.
    if (msg.type === 'STOP' && /\*\*Status:\*\*\s*complete/i.test(msg.body)) {
      const task = /\*\*Task:\*\*\s*`?([A-Za-z0-9_-]+)/.exec(msg.body)?.[1];
      if (!task) {
        fail(`${label}: STOP says complete but names no **Task:**, so it cannot be verified.`);
      } else {
        const dir = join(root, 'tasking', 'completed', task);
        if (!existsSync(dir)) {
          fail(
            `${label}: STOP claims "${task}" is complete, but tasking/completed/${task}/ `
            + 'does not exist. Either the folder was never moved or the message is premature.',
          );
        } else {
          const declared = /\*\*Written:\*\*\s*(\d+)\s*\/\s*(\d+)/.exec(msg.body);
          // What counts as "written" is the task's DECLARED OUTPUTS, not every file in
          // the folder. Counting raw files produced two false alarms, and both were
          // correct reports being failed:
          //
          //  - ee247 reported 4/4 against a folder holding 6. Its 4 were exactly
          //    right; task.json and BRIEF.md merely travel with the folder, because
          //    claiming is a move. Hence the CARRY exclusions.
          //  - 879ca reported 5/5 against a folder holding 9. Also correct. Four files
          //    and a SUMMARY.md were later recovered from a dangling checkpoint, and
          //    SUMMARY.md is a house convention present in 10 completed tasks - the
          //    agent was following the norm and was being failed for it.
          //
          // So the manifest is now authoritative. A STOP claims "the task's declared
          // outputs exist", so that is what gets verified: every declared output
          // present, and the declared number matching task.json. Extra files are never
          // inflation. A folder with no readable manifest falls back to a raw count, so
          // nothing goes unchecked.
          const CARRY = new Set(['task.json', 'BRIEF.md', 'NOTES.md', 'SUMMARY.md', '.gitkeep']);
          const present = readdirSync(dir, { withFileTypes: true })
            .filter((d) => d.isFile() && !CARRY.has(d.name))
            .map((d) => d.name);

          let expected = null;
          const manifest = join(dir, 'task.json');
          if (existsSync(manifest)) {
            try {
              const req = JSON.parse(readFileSync(manifest, 'utf8')).required_outputs;
              if (Array.isArray(req) && req.length) expected = req;
            } catch {
              // A malformed manifest is tasking:check's problem, not this gate's.
            }
          }

          if (expected) {
            const missing = expected.filter((f) => !present.includes(f));
            if (missing.length) {
              fail(
                `${label}: STOP for "${task}" claims complete, but ${missing.length} declared `
                + `output(s) absent from completed/${task}/: ${missing.join(', ')}.`,
              );
            }
            // The NUMBER is deliberately not compared to required_outputs.length.
            // Counting styles differ and both are honest: some agents count only their
            // declared outputs, others count everything in the folder. A first attempt
            // to require an exact match failed two accurate reports - 4880a said 7/7
            // and 6/6 for tasks declaring 5 and 4, having counted the manifest and
            // brief it was handed. Requiring equality punished a more thorough agent
            // for being thorough.
            //
            // What matters is that every declared output exists, and that the claim is
            // not a LIE in the inflating direction. An agent claiming more files than
            // exist is the fraud case, so that direction is still checked against the
            // full folder contents.
            if (declared && Number(declared[1]) > readdirSync(dir).length) {
              fail(
                `${label}: STOP for "${task}" claims **Written:** ${declared[1]}, but `
                + `completed/${task}/ holds only ${readdirSync(dir).length} files in total.`,
              );
            }
          } else if (declared && Number(declared[2]) !== present.length) {
            fail(
              `${label}: STOP for "${task}" declares ${declared[1]}/${declared[2]} files `
              + `written, but ${present.length} are present in completed/${task}/. Report what is `
              + 'actually on disk.',
            );
          }
        }
      }
    }
  }

  // An empty mailbox is correct, not broken. It just means this agent has not sent
  // anything yet. The failure this catches is CONTENT that parses to no messages,
  // which means headers were mangled beyond recognition.
  if (out.length === 0) {
    const prose = readFileSync(file, 'utf8')
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim();
    if (prose && !/^#/.test(prose)) {
      fail(
        `${label}: has prose but no readable messages. Headers are mangled beyond `
        + 'recognition, so no message can be attributed or verified.',
      );
    }
  }
}

if (problems.length) {
  console.error('check-mail FAILED\n');
  for (const p of problems) console.error(`  - ${p}`);
  console.error('');
  process.exit(1);
}

const n = mailboxes.reduce((acc, f) => acc + parse(f).out.length, 0);
console.log(
  `check-mail: ${mailboxes.length} mailbox(es), ${n} message(s), all headers valid.`,
);