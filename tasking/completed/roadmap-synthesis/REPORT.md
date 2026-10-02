# REPORT — roadmap-synthesis

**Task:** Ranked roadmap across all completed findings. **Agent:** dc408 ·
**Date:** 10 Feb 2026 · **Write-set:** `tasking/completed/roadmap-synthesis/` only.

---

## 1. What I did

Read the findings of **11 real completed tasks** (not the "ten" the brief states —
see §3), and produced a ranking where **every candidate carries the completed task
that justifies it and a verbatim quotation.** A candidate with no quotation is not in
the list.

Separated into two files by who can act:

- **`01-ranked-roadmap.md`** — R0–R8, ranked by the brief's rule (unblocks other work
  → wrong output → confidence).
- **`02-owner-decisions.md`** — D1–D7, everything no amount of research can settle.

---

## 2. What I found

### The roadmap is short, because the blockers are few and mostly not engineering

| # | Candidate | Unblocks | Wrong output? | Owner? |
|---|---|---|---|---|
| **R0** | Remove stray `T5/`; make `KNOWLEDGE.md` mandatory | **every gate** | visible | planner |
| **R1** | `9 Luger` + `.22 LR` filed `family=rifle` | filtering | **YES** | no |
| **R2** | Record the dimensional-empty state | interior ballistics | no | partly |
| **R3** | Design the unknown state | UI | **YES** | partly |
| **R4** | Delete hand-maintained counts | docs trust | **YES** | no |
| **R5** | Fix `process.cwd()` roots; CSV on a write path | gates | **YES** (latent) | no |
| **R6** | Designed refusal in the resolver | load feature | no | no |
| **R7** | **Do not build** shot-group diagnosis | — | — | no |
| **R8** | Licence + budget decisions | R2, R6 | — | **owner** |

**Two wrong-output defects that no gate catches:** the misfiled families, and
hand-maintained counts in the files agents are told to trust.

**The two decisions that dominate everything else are budget lines**, not
engineering: 226 of 229 cartridges need SAAMI Z299.x **purchased**, and every load
table needs a licence.

### Three things the brief got wrong

**1. "Read the KNOWLEDGE.md of ALL ten" is impossible.** Only **6 of 11** tasks
produced one. `ballistics-oracles`, `cartridge-dimensions`, `docs-audit`,
`exterior-ballistics` and `trademark-clearance` have none. I read their `REPORT.md`
directly and say so.

**2. `tasking/completed/T5/` is a duplicate, not a task.** Verified a **strict
subset** of `interior-ballistics` — all 6 filenames present there, 56,154 bytes. It
is currently causing **three of the four** `tasking:check` failures.

**3. "The queue is empty" was false when I claimed it** — 8 tasks were pending.
Reported per §10.1, not repaired.

---

## 3. Reasoning

**The ranking rule is about wrong output, so I looked for defects that pass every
gate.** That is what surfaced R1 and R4 as the top substantive items: `9 Luger` filed
`rifle` breaks filtering for the most-searched handgun cartridge on the index, and no
test fails. `ui-research` names the identical failure mode in a different layer:

> "A design that has no vocabulary for absence renders a blank cell, and a blank cell
> is read as `0`. **That is a silent data error**"

A misfiled family is that error with a different mechanism.

**I ranked R0 first despite it being the least interesting**, because it is currently
making a gate red for every agent, and because a swarm whose cross-task memory is
optional will keep producing work nobody can find. **6 of 11 `KNOWLEDGE.md` files
missing is the same "green and empty" defect as the brace bug in `code-audit`** — an
optional convention is one that will be skipped.

**R7 is a negative entry.** `shot-group-taxonomy` concluded the feature should not be
built; listing it prevents it being proposed twice.

**I did not rank by severity in the abstract.** R5's `process.cwd()` finding is
Medium on paper, but **I re-made that exact CSV mistake one task later** despite the
warning being on file. That is evidence the write-up needs to be an instruction, not
a description.

---

## 4. Verification

Every number measured, not quoted:

```
completed directories              12  (11 real + T5 duplicate)
T5 vs interior-ballistics          6/6 filenames identical -> strict subset, 56,154 bytes
tasks with KNOWLEDGE.md             6 of 11
family distribution            { pistol: 16, rifle: 212, shotgun: 1 }
MISFILED: slug=22-lr    name=".22 LR"  family=rifle  file=rifle.csv
MISFILED: slug=9-luger  name="9 Luger" family=rifle  file=rifle.csv
dimensional cells populated         0 / 229
```

**Cross-checks performed:**

- **R4 corroborated independently.** `code-audit` and `docs-audit` found the stale
  ledger count by different methods and recommended the same fix (*"delete, do not
  bump"*). Two agents converging is why I ranked it high.
- **R1 independently re-measured** by me, not carried from `ammoseek-coverage` §3.
- **R2's "226 vs ~11"** is my own measurement from
  `cartridge-licence-reconciliation/03-per-cartridge-verdict.csv`.

**Prohibition honoured:** load-synthesis and charge-weight work is **not** proposed as
attainable anywhere in the ranking. R6 and R8 are stated as *blocked* on licensing,
and R7 is a do-not-build entry. Per
`tasking/completed/interior-ballistics/KNOWLEDGE.md` finding 3:

> "do not build a charge-weight inference engine"

---

## 5. What I did NOT do

1. **No source file modified.** `data/`, `scripts/`, `apps/`, `package.json` untouched.
2. **No re-summarising.** Findings already written are linked, not restated; the only
   numbers I recomputed are ones needed to rank.
3. **No repair of other agents' work.** The `T5/` folder and
   `cartridge-dimensions`' output mismatch are reported in `02-owner-decisions.md`
   D5, not fixed — `.clinerules` §1 puts them outside my write-set.
4. **No protocol change proposed as work.** R0's `KNOWLEDGE.md` half and D6 are
   recorded as **owner decisions**, per `.clinerules` §12: *"Do not propose to fix the
   protocol. If your conclusion is 'the swarm protocol is broken', that is a BLOCKED
   message, not a proposal."*
5. **No price quoted** for SAAMI Z299.x. I have not looked one up and will not guess.

---

## 6. Gates

`npm run tasking:check` and `npm run verify` run after the folder move; results are in
my inbox STOP message.

**Expected:** `tasking:check` will still be **red**, for R0 — `T5/` and
`ui-research`'s missing `03-modern-mockups/_tokens.css`. Neither is mine. My task's
declared outputs will verify.

---

## 7. What I believe is wrong

**This repo confuses "blocked on engineering" with "blocked on money", and the
distinction is invisible on disk.** Every task reports BLOCKED. No two blockers have
the same remedy: 226 cartridges need a **purchase**, ~11 need an **email to CIP**, and
the load feature needs a **licensing decision**. An agent reading the task queue
cannot tell these apart, and would rationally assume more research is the answer.

**The corollary is uncomfortable:** the swarm has produced eleven reports and its
clearest conclusions are *"buy a standard"* and *"ask a lawyer."* That is not a
failure of the agents — it is the accurate answer to questions that were always
partly commercial. **But it means more agents will not help, and the next useful act
is the owner's.**

The second thing I believe is wrong is narrower and fixable: **five of eleven tasks
produced no `KNOWLEDGE.md`, and nothing prevented that.** The swarm's whole
cross-agent memory depends on a convention that `task.json` only sometimes declares.
That is not a discipline problem — it is a manifest problem, and it will recur until
the manifest changes.