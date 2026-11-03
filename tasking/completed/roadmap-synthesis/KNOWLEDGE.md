# KNOWLEDGE — roadmap synthesis

**Task:** roadmap-synthesis · **Agent:** dc408 · **Date:** 10 Feb 2026

---

## 1. The swarm's designated cross-task memory is optional, so most of it is missing

The protocol names `KNOWLEDGE.md` as how findings reach other agents
(`.clinerules` §10.3: *"Write a note only when it changes what another agent would
do"*). Measured:

```
ammoseek-coverage  KNOWLEDGE=True    ballistics-oracles            KNOWLEDGE=False
code-audit         KNOWLEDGE=True    cartridge-dimensions          KNOWLEDGE=False
interior-ballistics KNOWLEDGE=True   docs-audit                    KNOWLEDGE=False
shot-group-taxonomy KNOWLEDGE=True   exterior-ballistics           KNOWLEDGE=False
ui-research        KNOWLEDGE=True    trademark-clearance           KNOWLEDGE=False
```

**6 of 11. Five tasks completed with every declared output present and contributed
nothing another agent could find.**

This is the same failure class as `code-audit`'s brace finding — **green, and empty.**
`KNOWLEDGE.md` is declared in `task.json` by some tasks and not others, so the
mechanism is optional by construction.

> **Reusable rule: if a swarm depends on written handoffs, make the handoff a declared
> output.** An optional convention is a convention that will be skipped.

---

## 2. Two tasks found the same defect independently, which is how I knew to trust it

`code-audit` and `docs-audit` both found that `.cline/tasks/ledger.json` stores a
stage count that is stale — and both independently recommended the same fix:

`code-audit/KNOWLEDGE.md`:

> "`.clinerules` resolved this exact problem by **deleting** its count rather than
> replacing it."

`docs-audit/01-findings.md`:

> "**Recommendation: delete the field, do not bump it.** Bumping re-stales at 20."

**Two agents, different methods, same conclusion, same remedy.** That convergence is
worth more than either finding alone — and `.clinerules` already sets the precedent by
having deleted its own count.

---

## 3. A finding that survives one task and is then re-made is evidence, not noise

`code-audit` warned that `import-bullets.mjs` re-implements CSV parsing against
`shared/data.mjs`. **In my next task I made exactly that mistake**, on a different
file, and caught it because the output was visibly garbled.

What I added: the warning now says *"use `readCsv`"*, and names the failure mode
(quoted field with an embedded comma → garbage output).

> **Reusable rule: when a trap is hit again, the write-up was wrong, not the agent.**
> A trap document that does not prevent recurrence was written as a description
> rather than an instruction.

---

## 4. Three measurement traps, each producing a confident wrong answer

All three happened to me in one task, and all three *looked* like findings:

| Trap | What it produced | How it was caught |
|---|---|---|
| `header.indexOf('canonical_name')` → `-1` on a schema whose key is `slug` | "SAAMI covers 0 of 3" | Compared against a hand-checked value |
| `split(',')` on a quoted CSV | `" pressure columns)\""` | Output was visibly garbled |
| `readCsv().body` is arrays, not objects | 18 rows of `undefined` | Printed a field and saw `undefined` |

> **The general rule: a silent zero and a garbage string both look like data.**
> Assert the key resolved — `if (i === -1) throw` — and print one field before
> trusting a table.

---

## 5. Two agents can be right and still contradict each other, if they use different verbs

`ammoseek-coverage` recorded CIP as **"free to download from publisher."**
`cartridge-dimensions` quoted: **"Reproduction forbidden as well as in the form of
extracts without approval of C.I.P."**

Both quoted real text. Both were confident. **Both were reasoning about different
permissions.** Download is free; republishing a column is not.

> **Reusable rule: when two competent agents disagree, find the exact verb each
> deliverable uses before deciding who is right.** *Free to download / read / cite /
> republish* are four different rights.

Generalises past licensing: **"blocked" is not one state.** 226 cartridges are blocked
on *availability* and ~11 on *permission* — same symptom, opposite remedies.

---

## 6. What the ranking exposed about this project's real blockers

Two of them are **budget lines**, and neither is an engineering problem:

- **226 of 229 cartridges** need SAAMI Z299.x **purchased**.
- **Every** load table needs a licence — Hornady sells its data.

And two are **wrong-output defects that no gate catches**:

- `9 Luger` and `.22 LR` are filed `family=rifle` (`{pistol:16, rifle:212, shotgun:1}`)
- Hand-maintained counts in the files agents are told to trust

> **The gap between "engineering blocked" and "budget blocked" is invisible in this
> repo.** Every task reports BLOCKED and no two blockers have the same remedy.

---

## 7. The stale-queue pattern in brief generation

`roadmap-synthesis`'s own brief asserted *"Ten tasks completed and the queue is
empty."* Measured when I claimed it: **12 completed directories, 8 tasks pending.**

The task was materialised from a queue state that no longer held, because **claiming
is a folder move that competes with the taskmaster's own materialisation.** The brief
also named `tasking/pending/brand-rename/BRIEF.md` as its source — **a blocked task
in `pending/`,** not a completed one.

> **Reusable rule: a brief that asserts live state goes stale before it is claimed.**
> Record the *source file*, never the queue state. The manifest already does this
> correctly (`derived_from`); the brief's prose does not.

---

## What I would tell the next agent in one line

**Fix the two wrong-output defects (`family=rifle`, hand-maintained counts), delete
`T5/` because it is currently breaking a gate for everyone, and take the licensing
questions to the owner — because 226 cartridges and every load table are waiting on a
purchase, not on more research.**