---
proposal: roadmap-synthesis
title: Ranked roadmap across all completed findings
derived_from: tasking/completed/code-audit/KNOWLEDGE.md
evidence: "Every completed task ends with an Open-for-the-planner section listing findings it deliberately did not act on. Ten such sections exist and none has been reconciled."
shape: research
priority: highest
write_set:
  - tasking/completed/roadmap-synthesis/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
  - 01-ranked-roadmap.md
  - 02-owner-decisions.md
---

## Why

Ten tasks completed and the queue is empty. Nobody has read all ten KNOWLEDGE.md files together, so nobody can rank what to do next. This is the task that turns ten reports into a plan.

## Scope

- Read the KNOWLEDGE.md of ALL ten completed tasks in full. This is the one task where reading broadly is the job.
- Read any REPORT.md section that names a successor task or an open item.
- Produce one ranked list of candidate work. Rank by: (a) does it unblock other work, (b) is it a defect that produces WRONG OUTPUT rather than a visible failure, (c) how confident is the evidence behind it.
- For each candidate, name the completed task that justifies it and quote the sentence. A candidate with no quotation does not go in the list.
- Separate work that can be done unattended from work that needs an owner decision, and mark every owner decision explicitly.
- List what is BLOCKED and why, so the plan records what cannot be planned around.

## Do not

- Do not modify any source file. This task produces a plan, not changes.
- Do not re-summarise findings that are already written. Link to the file.
- Do not propose load-synthesis or charge-weight work as attainable; see tasking/completed/interior-ballistics/KNOWLEDGE.md finding 3.

Seeded by `scripts/tasking/seed-wave1.mjs` from `wave1.spec.json`, which holds the
same record as the task manifest. Neither was hand-typed, so they cannot drift apart.
