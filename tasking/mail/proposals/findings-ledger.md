---
proposal: findings-ledger
title: "One subject index over tasking/completed/, so an agent can find an existing finding in one step"
derived_from: tasking/completed/swarm-improvement/01-finding.md
evidence: "files scanned: 108 (793,542 bytes) ... subject-index files present: NONE ... The single fact \"0/229 populated\" is stated 70 times across 27 files"
shape: change
priority: high
write_set:
  - tasking/completed/FINDINGS.md
required_outputs:
  - REPORT.md
---

## The finding

Measured over every `.md` file in `tasking/completed/`:

```
files scanned: 108   (793,542 bytes)
subject-index files present: NONE

subject                                files  est KB to read every statement
dimensional columns empty (0/229)         27        187 KB
CIP / SAAMI licence or permission         33        219 KB
unresolved pressure dispute               28        162 KB
tabular-nums                             10         70 KB
```

**One fact is restated 70 times across 27 files.** And two agents proposed the same fix
without either being able to see the other — `roadmap-synthesis` proposed
`findings-ledger`; `unknown-state-design` recorded the same fact 11 times in one file.

**The per-agent write-set is correct** — it is what makes concurrency safe. **But the
swarm is measured on recall, and nothing joins the folders.** The only honest answer to
"has anyone established X?" today is to read everything: 794 KB per session, growing
linearly, and the failure when it becomes untenable is silent — a re-derived finding is
indistinguishable from a novel one.

## Why this is `shape: change` and not research

**The file belongs at `tasking/completed/FINDINGS.md`, and that path is nobody's
write-set.** Every task's write-set is its own `completed/<id>/` folder. Writing a shared
root file is a coordination-structure change, so it needs a human — and this proposal is
where that gets decided.

A `shape: research` proposal with this write-set would be refused by `check-proposals`,
which is correct: an unattended swarm writing a shared index at the root of the tier it
lives in is exactly the containment that rule exists to prevent.

## What it would contain

One file, append-only, grouped by subject:

```markdown
## Dimensional columns: 0 of 229 populated
- `cartridge_specs` has six dimensional columns, all empty.
  Source: tasking/completed/ammoseek-coverage/KNOWLEDGE.md
  "All six dimensional columns in `cartridge_specs` are **0 / 229 populated**"
  Also: cartridge-dimensions/REPORT.md, interior-ballistics/REPORT.md, …
```

One statement per fact, several links. **Every entry quotes its source**, so an agent can
verify in one hop what today takes 27 files.

## What would break

**Nothing technical.** It is a new file in a directory that already accepts 108.

**The real cost is maintenance, and it will rot** — the same way `KNOWLEDGE.md` did.
13 of 19 completed tasks have one; the *retrieval rate* is still zero. **So:**

- **Do not add a gate requiring it to be updated.** A required index punishes a task
  whose finding is genuinely not durable, and `prohibits[]` here forbids proposing
  protocol changes as research.
- **Have whoever proposes a task add the index line as part of writing the proposal** —
  the proposal already cites the finding and quotes it, so the content exists. That makes
  the index a by-product of work already being done rather than a chore.

## What I did NOT do

Did not create `FINDINGS.md`. The path is not in my write-set, and creating it would be a
change in disguise. Did not propose deleting any of the 70 restatements — the duplication
is defensible, since a reader opening `interior-ballistics/REPORT.md` should not need a
second hop to learn the dimensional gap exists. **The fix is additive.**