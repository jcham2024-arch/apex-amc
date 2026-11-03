#!/usr/bin/env node
// mail-lifecycle.mjs - provision mailboxes for new agents, archive retired ones.
//
// WHY THIS EXISTS
//
// Two problems on 3 Oct 2026, both caused by mailboxes having no lifecycle:
//
// 1. NEW AGENTS HAD NO MAILBOX. An agent's first STOP message went to a file it had
//    to create by hand, from a template that did not exist. On 2 Oct an agent
//    discovered mid-session that its inbox was missing. Worse, `swarm:sync` originally
//    derived the agent roster FROM the mailboxes - so a brand-new agent was invisible
//    to the tooling meant to keep it in sync. A roster that cannot see new members
//    eventually reports everyone healthy while nobody is being checked.
//
// 2. RETIRED AGENTS STAYED IN THE LIVE TREE. Five closed agents still had inbox and
//    bulletin files. check-mail parses and validates every one on every run, so dead
//    agents' historical defects keep the gate red and train everyone to ignore the
//    exit code. The two findings I deliberately left failing came from two agents that
//    no longer exist.
//
// THE DESIGN, AND WHY ARCHIVE RATHER THAN DELETE
//
// Closed agents produced real research. dc408's mailbox is the ONLY surviving record
// that it reported a broken task table - the defect I then fixed. Deleting mailboxes
// would delete the project's memory of its own mistakes, which is the opposite of what
// this swarm is for.
//
// So: inbox/<id>.md -> archive/<id>/inbox.md, plus bulletin and any outbox reply, with
// a retirement header recording when and why. Content is preserved verbatim. Only the
// GATE stops reading it, which is the point: dead mail should stay readable and
// reviewable, not load-bearing.
//
//   node scripts/tasking/mail-lifecycle.mjs init <id> [...]   create missing mailboxes
//   node scripts/tasking/mail-lifecycle.mjs retire <id> [...]  archive a closed agent
//   node scripts/tasking/mail-lifecycle.mjs status             report both
//
// Idempotent: `init` on an existing mailbox changes nothing and says so.

import {
  existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const MAIL = join(root, 'tasking', 'mail');
const INBOX = join(MAIL, 'inbox');
const BULLETIN = join(MAIL, 'bulletin');
const OUTBOX = join(MAIL, 'outbox', 'taskmaster');
const ARCHIVE = join(MAIL, 'archive');

const VALID = /^[a-z0-9][a-z0-9_-]{1,31}$/i;

const inboxTemplate = (id) => `# Inbox: ${id}

Append your START / STOP / BLOCKED / QUESTION messages here, each opening with:
<!-- 2026-10-02T16:20:00Z | AGENT ${id} | STOP -->

One writer per file - write your own inbox, and let the taskmaster route.
Taskmaster replies arrive in \`outbox/taskmaster/${id}.md\`. Do not answer in this file.

Timestamps must not go backwards: this is an append-only ledger, and the gate checks
that. If you are appending several messages at once, order them chronologically.

If you need to withdraw something you wrote earlier, send a **RETRACTION** naming it.
Do not edit or delete the earlier message.
`;

const bulletinTemplate = (id) => `# Bulletin: ${id}

Read-only to everyone except ${id}, who appends here. Reusable findings, traps,
open questions, disagreements. Not a task channel - for that, write a proposal.
`;

function init(id) {
  if (!VALID.test(id)) {
    console.log(`  ${id}: REJECTED - agent ids are 2-32 chars, letters/digits/-/_`);
    return false;
  }
  let made = false;

  const inbox = join(INBOX, `${id}.md`);
  if (!existsSync(inbox)) {
    writeFileSync(inbox, inboxTemplate(id), 'utf8');
    console.log(`  ${id}: created inbox/${id}.md`);
    made = true;
  }

  const bulletin = join(BULLETIN, `${id}.md`);
  if (!existsSync(bulletin)) {
    writeFileSync(bulletin, bulletinTemplate(id), 'utf8');
    console.log(`  ${id}: created bulletin/${id}.md`);
    made = true;
  }

  if (!made) console.log(`  ${id}: already provisioned`);
  return made;
}

function retire(id) {
  const sources = [
    [join(INBOX, `${id}.md`), 'inbox.md'],
    [join(BULLETIN, `${id}.md`), 'bulletin.md'],
    [join(OUTBOX, `${id}.md`), 'outbox-taskmaster.md'],
  ].filter(([p]) => existsSync(p));

  if (!sources.length) {
    console.log(`  ${id}: nothing to archive - no mailbox found`);
    return false;
  }

  const dest = join(ARCHIVE, id);
  mkdirSync(dest, { recursive: true });

  const stamp = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  for (const [src, name] of sources) {
    const body = readFileSync(src, 'utf8');
    const banner = `> **ARCHIVED ${stamp}.** Agent \`${id}\` is closed. This file is kept`
      + ` verbatim as the record of what it found and reported. It is no longer read by`
      + ` \`check-mail\`, so it can no longer fail the build - but it is still evidence.`;
    writeFileSync(join(dest, name), `${banner}\n\n${body}`, 'utf8');
    unlinkSync(src);
  }
  console.log(`  ${id}: archived to tasking/mail/archive/${id}/ (${sources.length} file(s))`);
  return true;
}

function status() {
  const live = existsSync(INBOX)
    ? readdirSync(INBOX).filter((f) => f.endsWith('.md') && f !== 'README.md')
      .map((f) => f.replace(/\.md$/, ''))
    : [];
  const archived = existsSync(ARCHIVE)
    ? readdirSync(ARCHIVE, { withFileTypes: true }).filter((d) => d.isDirectory())
      .map((d) => d.name)
    : [];

  console.log(`live mailboxes (${live.length}): ${live.join(', ') || 'none'}`);
  console.log(`archived (${archived.length}):       ${archived.join(', ') || 'none'}`);
}

const [cmd, ...ids] = process.argv.slice(2);

switch (cmd) {
  case 'init':
    if (!ids.length) {
      console.log('usage: mail-lifecycle.mjs init <id> [...]');
      break;
    }
    console.log('provisioning:');
    ids.forEach(init);
    break;
  case 'retire':
    if (!ids.length) {
      console.log('usage: mail-lifecycle.mjs retire <id> [...]');
      break;
    }
    console.log('archiving:');
    ids.forEach(retire);
    break;
  case 'status':
    status();
    break;
  default:
    console.log('usage: mail-lifecycle.mjs <init|retire|status> [ids...]');
}