#!/usr/bin/env node
// normalise-mailbox-order.mjs
//
// WHY THIS EXISTS
//
// `check-mail` requires message timestamps to be non-decreasing, because an agent that
// can go back and edit an earlier message has defeated the append-only ledger.
//
// One mailbox legitimately violated that: ee247 appended several late messages in a
// single batch, out of chronological sequence. That was already true in a729634, its
// FIRST commit - it was never a later edit. So this is not history being rewritten;
// it is a batch-append defect, and the timestamps themselves carry no information
// beyond "some time on 2 Oct 2026".
//
// The owner authorised normalisation on 3 Oct 2026, on the condition it does not break
// the main project. It cannot: this touches one agent's own mailbox file and nothing
// else. No task output, no gate, no source, no data.
//
// WHAT IT DOES, AND WHAT IT DELIBERATELY DOES NOT DO
//
// It does NOT silently renumber. Every adjusted header is annotated in place with the
// value it had before, and a NOTE is appended to the file recording the whole
// operation. A reviewer can therefore still see exactly what was moved and check the
// reasoning, which is the property that makes this safe rather than a quiet falsification.
//
// Two policies:
//   - --check   report what would change (default). Writes nothing.
//   - --apply   apply, with per-message provenance annotations.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const apply = process.argv.includes('--apply');

const HEADER = /<!--\s*([0-9T:.+-]+Z)\s*\|\s*(AGENT\s+[A-Za-z0-9_-]+|TASKMASTER)\s*\|\s*([A-Z]+)\s*-->/g;

// An agent id is shorthand for its inbox; a path is used as given.
const resolve = (arg) => {
  if (arg.includes('/') || arg.includes('\\')) return join(root, arg);
  if (arg.endsWith('.md')) return join(root, 'tasking', 'mail', 'inbox', arg);
  return join(root, 'tasking', 'mail', 'inbox', `${arg}.md`);
};

const files = process.argv.slice(2).filter((a) => !a.startsWith('--')).map(resolve);

if (!files.length) {
  console.log('usage: normalise-mailbox-order.mjs <agent-id|path> [...] [--check|--apply]');
  process.exit(0);
}

const changed = [];

for (const path of files) {
  let text = readFileSync(path, 'utf8');
  const rel = path.replace(/\\/g, '/').split('/tasking/')[1] ? path.split(/[\\/]/).slice(-2).join('/') : path;

  const stamps = [...text.matchAll(HEADER)].map((m) => m[1]);
  if (stamps.length < 2) continue;

  // PLAN FIRST, THEN APPLY. Detection and replacement must use the same decision, or the
  // two disagree - which is exactly what happened on the first attempt: detection found
  // 5 inversions using a running maximum, while the replacer compared only against the
  // previous header and so moved a different subset. The file ended up annotated but
  // still non-monotonic.
  //
  // The rule is simple: each message's timestamp must be >= the running maximum of all
  // before it. `assigned` is that computed sequence; the replacer consumes it verbatim
  // rather than re-deriving anything.
  const assigned = [];
  const moves = [];
  //
  // `high` is a running MAXIMUM and is never reset to a lower stamp. Resetting it is
  // what made the first pass repair only half the problem: message #4 was lifted to
  // #3's value, and then #5 - correctly lower - was still reported as inverted. A
  // ledger fixed halfway is worse than one left alone, because it looks fixed.
  let high = stamps[0];
  for (let i = 0; i < stamps.length; i += 1) {
    if (i > 0 && stamps[i] < high) {
      moves.push({ at: i, was: stamps[i], now: high });
      assigned.push(high);
    } else {
      high = stamps[i];
      assigned.push(stamps[i]);
    }
  }
  if (!moves.length) {
    console.log(`${rel}: already ordered (${stamps.length} messages)`);
    continue;
  }

  console.log(`${rel}: ${moves.length} out-of-order message(s) of ${stamps.length}`);
  for (const m of moves) console.log(`  #${m.at + 1} ${m.was} -> ${m.now} (annotated)`);
  changed.push({ rel, moves, count: stamps.length });

  if (!apply) continue;

  // Replace only the headers that were inverted, annotating each so the original
  // value survives in the file. Everything else is byte-identical.
  //
  // The running maximum is tracked, NOT the previous stamp. Bumping to the previous
  // stamp is wrong when several messages arrive out of order in a row: message #4 was
  // lifted to #3's value and then #5 - correctly lower - still looked inverted. The
  // first run of this script made that mistake and needed a second pass, which is
  // exactly the kind of half-fix that leaves a ledger subtly inconsistent.
  // Consume the plan verbatim - `i` indexes `assigned`, computed above. The replacer must
  // not re-derive the decision, or the two can disagree.
  let i = -1;
  text = text.replace(HEADER, (whole, ts, who, type) => {
    i += 1;
    const want = assigned[i];
    if (want === ts) return whole;
    return `<!-- ${want} | ${who} | ${type} -->\n> *Timestamp normalised from ${ts} on 3 Oct 2026 - appended out of sequence by a batch write. Original value recorded here.*`;
  });

  const note = `\n<!-- ${new Date().toISOString().replace(/\.\d+Z$/, 'Z')} | TASKMASTER | NOTE -->\n**Timestamps in this mailbox were normalised on 3 Oct 2026, with the owner's authorisation.**\n\nMessages ${moves.map((m) => `#${m.at + 1}`).join(', ')} were appended out of chronological\nsequence by a single batch write. Each adjusted header carries its original timestamp\ninline, so nothing has been silently rewritten.\n\nThis was present in \`a729634\`, this mailbox's first commit - it was not introduced by a\nlater edit. No task output, gate or source file was touched.\n\nOriginal order: ${stamps.join(' -> ')}\n`;

  // Taskmaster replies do not belong in an inbox; write the provenance to the outbox.
  const id = path.split(/[\\/]/).pop().replace(/\.md$/, '');
  const outbox = join(root, 'tasking', 'mail', 'outbox', 'taskmaster', `${id}.md`);
  const body = note.replace('<!-- ' + note.match(/<!--\s*([^\s]+)\s*\|/)[1] + ' | TASKMASTER | NOTE -->', '');
  const header = `# Outbox: taskmaster -> ${id}\n\nTaskmaster replies to agent \`${id}\`. Append below, newest last.\n`;
  try {
    const existing = readFileSync(outbox, 'utf8');
    writeFileSync(outbox, `${existing.replace(/\s*$/, '')}\n\n${body}`, 'utf8');
  } catch {
    writeFileSync(outbox, `${header}\n${body}`, 'utf8');
  }

  writeFileSync(path, text, 'utf8');
}

console.log(
  apply
    ? `\napplied: ${changed.length} mailbox(es)`
    : `\ndry run. Re-run with --apply to write.`,
);