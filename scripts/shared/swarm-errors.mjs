/**
 * Structured errors for the swarm — codes an agent can branch on.
 *
 * WHERE THIS COMES FROM, and why it is worth doing here.
 *
 * The Convex skill at ~/.agents/skills/convex-design/SKILL.md lists this as an
 * anti-pattern:
 *
 *   "Bare error strings — `throw new Error("nope")` gives clients no way to react.
 *    Throw `ConvexError({ code, message, retryAfter? })` with machine-readable details."
 *
 * Our gates do exactly the bare-string version. Every failure is prose, and prose is the
 * worst possible transport between a program and an automated reader:
 *
 *   check-mail FAILED
 *     - mail/inbox/ee247.md: timestamps go backwards at message 4 ...
 *
 * An agent reading that has to substring-match to decide what to do, and substring
 * matching on prose breaks the moment someone rewords the sentence. That is not a
 * hypothetical: this project already had an agent instructed to stop when a gate is red,
 * and another that could not tell a false alarm from a real defect because both printed
 * sentences. A stable code is what lets `if (code === 'ROLE_HELD')` be written at all.
 *
 * THE CODES. Each one carries the ACTION it implies, because a code that does not tell
 * the reader what to do is just a shorter sentence.
 */

/** Every failure this swarm can produce, and what the reader should do about it. */
export const CODES = {
  // --- blocking, but the work is safe ---
  ROLE_HELD: {
    action: 'pick another role',
    means: 'The role is at capacity. Someone already holds it.',
  },
  CLAIM_TAKEN: {
    action: 'pick another role',
    means: 'Another agent claimed it between your check and your write.',
  },
  ALREADY_HELD: {
    action: 'release first, or do nothing',
    means: 'You already hold a role. One agent, one role.',
  },

  // --- the work is fine; the COMMIT is blocked ---
  QUARANTINED: {
    action: 'keep working - claim the next thing',
    means: 'Finished work is held in quarantine because the commit is blocked.',
  },
  MISSING_NOTE: {
    action: 'write the note, then keep working',
    means: 'A quarantined folder has no explanation. This is the failure mode.',
  },

  // --- real problems, someone must act ---
  GATE_FAILED: {
    action: 'report the gate verbatim; do NOT fix it if it is outside your write-set',
    means: 'A gate is red. The message says which.',
  },
  UNRESOLVED_WRITE: {
    action: 'work around it, document it, keep going',
    means: 'You needed a file outside your write-set.',
  },
  DUPLICATE_TASK: {
    action: 'do not seed this; find the existing one',
    means: 'The task already exists in another tier or in HISTORY.md as rejected.',
  },
  STALE_CLAIM: {
    action: 'roster -- release <id>, then re-check',
    means: 'A claim is held by an agent with no clone and no mailbox.',
  },

  // --- operator decisions, not agent decisions ---
  NEEDS_OWNER: {
    action: 'ask, with the specific decision named - and keep working meanwhile',
    means: 'A human has to choose. An agent cannot resolve this alone.',
  },
  QUEUE_EMPTY: {
    action: 'correct result - report it and stop',
    means: 'pending/ is empty. This is not a fault.',
  },
};

/**
 * Format a failure for a human AND a machine.
 *
 * The code is printed on its own `CODE:` line so a regex can find it, and the prose
 * follows for the person reading. Both get the same information; neither is generated
 * from the other, so neither can drift.
 */
export function fail(code, message, detail) {
  const known = CODES[code];
  const out = [`  CODE: ${code}`];
  if (known) out.push(`  means: ${known.means}`);
  out.push(`  do:    ${known ? known.action : 'see the message'}`);
  out.push(`  ${message}`);
  if (detail) {
    for (const line of String(detail).split('\n')) out.push(`    ${line}`);
  }
  return out.join('\n');
}

/** True if the code is one the swarm knows about. Catches typos in a new gate. */
export const isKnownCode = (code) => Object.hasOwn(CODES, code);

/**
 * NON-INTERACTIVE IS A HARD RULE, not a preference.
 *
 * Also lifted from the Convex skill, which sets `CONVEX_AGENT_MODE=anonymous` "so it
 * skips every interactive prompt" for headless agents.
 *
 * The reason it matters more here than there: an agent that waits for a prompt is an
 * agent that has stalled, and this swarm has stalled repeatedly. On 2 Oct four of eight
 * status messages were BLOCKED or QUESTION - agents that were following an instruction
 * to escalate instead of continuing. A prompt is a stall with better manners.
 *
 * So: never call a function that can block on stdin, never `execSync` without a timeout,
 * and never ask a question in a place where the caller cannot answer it.
 */
export const HEADLESS_NOTE = [
  'These scripts run unattended, hourly, with nobody watching.',
  'A prompt here is a stall with better manners.',
].join(' ');