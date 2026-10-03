#!/usr/bin/env node
// apply-mail-lifecycle.mjs
//
// WHY
//
// Mailboxes had no lifecycle. New agents had to hand-create an inbox from a template
// that did not exist, and one agent only discovered mid-session that its mailbox was
// missing - meaning its findings went nowhere. Closed agents kept theirs forever, so
// their historical defects stayed load-bearing in check-mail.
//
// This back-fills the already-seeded briefs with the provisioning step, because a rule
// that lives only in seed-wave.mjs does not help an agent holding a brief written
// before it. Idempotent: briefs already carrying the step are skipped.

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const PENDING = join(root, 'tasking', 'pending');

let patched = 0;
let skipped = 0;

for (const dir of readdirSync(PENDING)) {
  const brief = join(PENDING, dir, 'BRIEF.md');
  if (!existsSync(brief)) continue;
  let text = readFileSync(brief, 'utf8');

  if (text.includes('mail:init')) {
    skipped += 1;
    continue;
  }

  let touched = false;

  // Point every briefing at the archived mail, whatever it is worded like. The first
  // pass only matched one exact sentence and so reached 12 of 21 briefs; the other 9
  // are hand-tuned, reword the same instruction in a different order and numbering.
  // Matching only the canonical phrasing would leave them pointing at a live tree that
  // no longer holds the closed agents' findings.
  if (!text.includes('tasking/mail/archive/')) {
    text = text.replace(
      /(\*\*Read `tasking\/mail\/bulletin\/\*\.md`[^\n]*)/,
      '$1, plus the archived mail in `tasking/mail/archive/` — closed agents found '
      + 'things there that you would otherwise rediscover.',
    );
    if (text.includes('tasking/mail/archive/')) touched = true;
  }

  // Insert the provisioning step after the last reading instruction, whatever number
  // it carries, so the step list stays sequential without renumbering by hand.
  //
  // Placement is BEFORE the claim step, and the loop stops at the claim - not merely
  // at the first blank line. A first attempt broke on briefs whose reading list is
  // followed by a blank line and then more prose, and dropped the step below the list
  // it belongs to, where it reads as an aside rather than a step.
  if (!text.includes('mail:init')) {
    const lines = text.split('\n');
    // The insert point is the line BEFORE the claim step, found in a SEPARATE pass.
    // Testing for the claim inside the loop that tracks the insert point never fires:
    // `insertAt` is still -1 on the claim's own line, so a guard of the form
    // `insertAt < 0` skips the break and keeps scanning past it. That bug placed the
    // step below the entire list in all 21 briefs, where it read as an aside rather
    // than as a step of the procedure it belongs to.
    let claimIdx = -1;
    for (let i = 0; i < lines.length; i += 1) {
      if (/^\s*\d+\.\s/.test(lines[i]) && /\bClaim it\b/i.test(lines[i])) {
        claimIdx = i;
        break;
      }
    }

    let insertAt = -1;
    for (let i = 0; i < lines.length; i += 1) {
      if (claimIdx >= 0 && i >= claimIdx) break;
      if (/^\s*\d+\.\s/.test(lines[i])) insertAt = i + 1;
      else if (insertAt >= 0 && lines[i].trim() === '') break;
    }
    if (insertAt >= 0) {
      lines.splice(
        insertAt,
        0,
        '',
        '**Provision your mailbox:** `npm run mail:init -- <your-id>`. It is idempotent, '
        + 'so run it even if the file looks present. An agent with no inbox is an agent '
        + 'whose findings nobody reads. Archived mail from closed agents is in '
        + '`tasking/mail/archive/` — worth reading before you rediscover their findings.',
      );
      text = lines.join('\n');
      touched = true;
    }
  }

  if (touched) {
    writeFileSync(brief, text, 'utf8');
    patched += 1;
  } else {
    skipped += 1;
  }
}

console.log(`mail-lifecycle: ${patched} brief(s) updated, ${skipped} skipped`);