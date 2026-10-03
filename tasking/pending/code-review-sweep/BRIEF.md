# BRIEF — Adversarial review of gates, physics core, and website

**Task id:** `code-review-sweep` · **Priority:** high
**Grounded in:** `tasking/completed/code-audit/KNOWLEDGE.md`

## Why this task exists

code-audit found that a gate shipped with a missing brace, silently reduced it to checking one task per run, and reported success while four completed tasks sat unchecked - ESLint and node --check both passed. It was found by an agent doing its own task, not by a gate. That class of defect nothing currently catches, and a second pair of eyes is the cheapest mitigation available.

## Before you start

1. Read `.clinerules` — especially §10 (the swarm), §11 (mail), §12 (proposals), §13 (the standing slot).
2. Read your `task.json`. Every file in `required_outputs` must exist or this task is not done.
3. Read your source: `tasking/completed/code-audit/KNOWLEDGE.md`. Your task is derived from it, not from your assumptions.
4. Read `tasking/mail/bulletin/*.md` and `tasking/mail/outbox/taskmaster/<your-id>.md`.
5. Claim it: `mv tasking/pending/code-review-sweep tasking/in-progress/`
6. Send a START message to your inbox. `npm run tasking:check` must pass before you send STOP.

## Scope

- Review scripts/gates/ adversarially, because those are the checks everything else trusts. For each, construct an input that MUST make it fail and confirm it does. A gate you cannot break is an untested gate, and saying so is the finding.
- Hunt the loop-variable and scope defects code-audit documented, because they have now appeared three times in this repo: a missing closing brace silently truncating a loop, a const declared below the loop that calls it, and a gate that reads files when it should check deployed output.
- Review packages/ballistics-core/src for correctness against its own doc comments, not against style. A comment describing a guarantee is a hypothesis: the CSP defect was every gate reading a file while production served no policy at all. Verify the arithmetic in densityRatio, pressureAltitudeFt and the dispersion statistics against an independent method.
- Review apps/website/src for the findings ui-research recorded and did not fix: the em-dash unknown marker that reads as zero, tabular-nums absent from live fields, one accent doing two jobs, and disclosure away from the button.
- Report defects with a reproduction, not a description. A finding the author cannot reproduce is an opinion.

## Do not

- Do not fix anything. Produce reproductions and proposed diffs.
- Do not run a destructive input against the real tree. Use a throwaway copy under tmp/ - and note that a probe under tmp/ with a broken relative import measures a different module graph than the real gate, which is how a false finding gets filed.
- Do not report style preferences as defects. Rank by consequence: a wrong number a user acts on, then a check that passes while verifying nothing, then everything else.

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`
- `01-gate-adversarial-review.md`
- `02-core-correctness.md`
- `03-website-findings.md`
- `04-defect-list.csv`

```
npm run tasking:check     # every declared output must exist
npm run verify            # must exit 0
```

Plus, in `REPORT.md`: what you did, what you found, the reasoning, what you did NOT
do and why, and any unresolved issue in `NOTES.md`.

## When you finish

1. `mv tasking/in-progress/code-review-sweep tasking/completed/`
2. Append a STOP message to `tasking/mail/inbox/<your-id>.md` — declare the real file count, the gate is checked against disk.
3. **Write a proposal** at `tasking/mail/proposals/<your-slug>.md` for the most valuable follow-up you found. Cite a file and quote it. See `.clinerules` §12.
4. Append anything reusable to `tasking/mail/bulletin/<your-id>.md`.
5. Run `npm run tasking:restock`, then claim the next task. Do not wait for a reply.

## If you get stuck - read this before you stop

**You are working in a sandbox. Everything you write is reviewed before it reaches the
main project.** A concern is not a reason to stop.

Do **not** halt because:

- a file you want is outside your write-set - write it up in `NOTES.md`, work around it
- `npm run verify` is red - that is a shared gate; your completion is judged by
  `npm run tasking:check`, which is scoped to **your** declared outputs. Note the
  failure and keep working.
- a brief is wrong or contradicts another document - say so in your report. Fixing
  briefs is the planner's job, and reporting it is the whole contribution.
- a value is unknown - **leave it EMPTY.** An honest gap beats an invented number.

Do **not** halt when you finish with gaps. "I completed most of this and documented
exactly what is missing and why" is a **successful** task. An empty folder with an
explanation is not.

The only two things that stop you: the task folder is gone (someone else claimed it), or
`pending/` is empty - report **"queue empty"** and stop. Both are correct results.

Never weaken a gate and never run `handoff:accept`. Not for permission - those are
judgements about production, which is what the review step is for.
