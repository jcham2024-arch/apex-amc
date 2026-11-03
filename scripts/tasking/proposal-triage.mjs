/**
 * Owner triage of `shape: change` proposals, 3 Oct 2026.
 *
 * Ten proposals were sitting undispatched because `check-proposals` bars `shape: change`
 * from running unattended — correctly, since each one touches something the owner owns.
 * The owner said: let the agents work on what is in there.
 *
 * So this file records the triage rather than leaving ten proposals to rot unread. It is
 * DATA, read by whoever materialises, because a decision recorded only in chat is the
 * thing this whole framework exists to stop.
 *
 * APPROVED-AS-RESEARCH: the deliverable is output inside the agent's own completed/
 *   folder. Marked `change` because the SUBJECT is protocol or policy, but nothing
 *   existing is modified, so it is safe to run unattended. Running it produces the
 *   analysis; it does not enact the protocol change.
 *
 * HELD-FOR-OWNER: writes application source or a gate. Real code change, real review.
 *
 * DUPLICATE: already covered by a completed task. Do not dispatch.
 */

export const TRIAGE = {
  'findings-ledger': {
    verdict: 'approved-as-research',
    note:
      'Highest value in the queue. swarm-improvement measured 134 files / 915 KB with NO '
      + 'subject index, and the single fact "0/229 populated" restated 70 times across 27 '
      + 'files. Writes only tasking/completed/FINDINGS.md, a new file. Owner-approved here.',
  },
  'blocker-ledger': {
    verdict: 'approved-as-research',
    note:
      'Output only in its own completed/ folder. Produces the SPEC for a blocker ledger so a '
      + 'task that cannot succeed is not re-attempted by every future agent. The protocol '
      + 'change itself still needs the owner; this task only specifies it.',
  },
  'claims-gate-prose-scope': {
    verdict: 'approved-as-research',
    note: 'Output only. Analysis of what check-claims actually enforces versus its prose.',
  },
  'cartridge-row-identity': {
    verdict: 'approved-as-research',
    note:
      'Output only. Resolves duplicate cartridge rows under our own naming — the '
      + 'over-merge risk ammoseek-coverage warned about. Feeds the blocked '
      + 'cartridge-licence-reconciliation, which cannot be answered without it.',
  },
  'load-interpolation-schema': {
    verdict: 'approved-as-research',
    note:
      'Already `shape: research` and written before the interior-ballistics verdict landed. '
      + 'Re-check it against 05-feasibility-verdict.md before dispatching; the mandatory '
      + 'EMPTY semantics must survive into the spec.',
  },
  'pdf-licence-probe': {
    verdict: 'approved-as-research',
    note: 'Already `shape: research`. Small, cheap, and unblocks part of the CIP question.',
  },

  'no-zero-defaults': { verdict: 'held-for-owner', note: 'Writes apps/website/src/main.js.' },
  'poise-required-n': { verdict: 'held-for-owner', note: 'Writes packages/ballistics-core/src/dispersion.ts.' },
  'centre-standard-error': {
    verdict: 'duplicate',
    note:
      'Likely already done. `group-standard-error` COMPLETED and its 01-derivation.md '
      + 'already derives the standard error of centreOfImpact, including the Bessel n-1 '
      + 'correction. Dispatching this would repeat finished work — exactly the failure '
      + 'swarm-improvement measured. Verify against 01-derivation.md before re-scoping.',
  },
  'standing-slot-rotation-naming': {
    verdict: 'held-for-owner',
    note:
      'Writes check-tasking.mjs and ensure-standing-task.mjs. The rotation-naming conflict '
      + 'is REAL — the agent recorded it in NOTES.md §3 — but I have already corrected the '
      + 'brief to say "check for the existing folder, do not datestamp". Needs re-scoping '
      + 'against the current code before it is worth approving.',
  },
  'retailer-affiliate-coverage-audit': {
    verdict: 'held-for-owner',
    note: 'Commercial/legal. Routes through retailer-price-data-options first.',
  },
  'ffl-file-retrieval': {
    verdict: 'held-for-owner',
    note:
      'Feeds local-shop-directory, which is ALREADY a running task. Hold until that task '
      + 'reports what it could not retrieve, or this duplicates live work.',
  },
};