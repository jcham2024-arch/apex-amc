# NOTES — unresolved issues

**Task:** cartridge-licence-reconciliation · **Agent:** dc408 · **Date:** 10 Feb 2026

Per `.clinerules` §10.3, this file is for findings that must reach the planner. Each
item names what would settle it and who must decide.

---

## N1 — The SAAMI free-drawings permission question (OPEN, legal)

**The issue.** SAAMI's free drawings page carries
`© 2026 Sporting Arms and Ammunition Manufacturers' Institute, Inc. All rights reserved`.
`cartridge-dimensions` treated the three matching designs as usable because SAAMI
publishes them itself as primary evidence. **I did not resolve this**, because
settling it requires legal interpretation and the brief prohibits legal advice.

**Why it matters.** It governs **3 of 229 cartridges** — and, more importantly, the
*principle*. If "publisher-published but marked all-rights-reserved" is not clearance,
then no free source exists for anything and the whole dimensional programme closes.

**What would settle it:** a lawyer's reading of whether a standards body publishing
its own pre-standard designs for industry adoption grants republication, or whether
the footer reserves it.

**Not done by me deliberately.** This is the one place where the permissive reading
survives, and I am flagging it rather than settling it with an assertion.

---

## N2 — CIP's extract boundary (OPEN, legal)

**The issue.** The notice forbids reproduction *"as well as in the form of extracts"*.
Two readings:

- **Narrow** — an extract is a copy of CIP's *tables*; restating individual
  dimensional values in our own schema may fall outside it.
- **Broad** — an extract is any subset of CIP's data, however reformatted.

**I did not choose between these.** The notice exists, it names extracts, and absent
clarification the only defensible default is to treat the data as not ours to
reproduce.

**What would settle it:** either a lawyer's reading, or **written approval from CIP** —
which the notice itself names as the mechanism. CIP also publishes contact routes; an
enquiry costs a message and is not a commitment.

---

## N3 — CIP coverage was never independently confirmed (OPEN, factual)

`cartridge-dimensions` estimated CIP TDCC covers **~11** of our 229, from a **10-of-91
sheet sample**. I did not expand it to a census.

**Why:** reading 91 sheets to classify coverage is wasted work while the licence
forbids the use — so `03-per-cartridge-verdict.csv` records **0 `blocked-cip`** rows
rather than asserting an unverified subset.

**What would settle it:** a full pass over the 91-sheet table, mapping each sheet to
our slugs. **Do this only after N2 resolves permissively**, or the work is throwaway.

**Note for whoever reads the CSV:** `blocked-cip: 0` means *"not asserted"*, **not
"none exist"*. Roughly 11 are expected to move into that bucket.

---

## N4 — `cartridge-dimensions` declares 4 outputs but has 7 files (OPEN, protocol)

`tasking/completed/cartridge-dimensions/` contains 7 files against a manifest
declaring 4:

```
01-source-survey.md   02-provenance-log.md   03-protocol-findings.md
BRIEF.md             REPORT.md               task.json
cartridge_dimensions_filled.csv
```

`check-mail` fails on this mismatch — it compares disk against declaration, which is
the intended behaviour. `BRIEF.md` and `task.json` are carried through by convention,
so the real surplus is `03-protocol-findings.md` plus one of the two carry-throughs.

**Not mine to fix** — `tasking/completed/` is another agent's write-set.
**Likely a manifest/convention gap rather than a real error**, but it will keep failing
the gate until reconciled.

---

## N5 — Stray `tasking/completed/T5/` (OPEN, hygiene)

Untracked, in my worktree only. Six files from the **pre-swarm folder layout**
(`01-burning-rate-sources.md`, `02-powder-properties.csv`, …). The same task is
completed upstream as `tasking/completed/interior-ballistics/`.

**This is a duplicate of completed work under a retired naming scheme.** It has no
`task.json`, so it should be invisible to `tasking:check` — but it is untracked and
would be swept into any `git add -A`.

**Not deleted by me:** it is not in my write-set, and `.clinerules` §1 says a file
outside my write-set gets reported, not removed. Flagged for the planner.

---

## N6 — `roadmap-synthesis` brief and manifest disagree on their source (OPEN, minor)

`tasking/pending/roadmap-synthesis/BRIEF.md` line 4 says:

> **Grounded in:** `tasking/pending/brand-rename/BRIEF.md`

while its `task.json` says:

> `"derived_from": "tasking/completed/code-audit/KNOWLEDGE.md"`

**`brand-rename` is a blocked task in `pending/`, not a completed source.** A manifest
that names a task which can never produce findings is a defect in the brief-generation
step, and per §10.1 I report it rather than repair it.

**Consequence for whoever claims it:** `derived_from` is the authoritative pointer
(the gate checks it); the brief's line 4 is stale.

---

## N7 — `roadmap-synthesis`'s premise is already stale (OPEN, factual)

Its brief states:

> "Ten tasks completed and the queue is empty."

**Measured:** 10 completed, **9 tasks in `pending/`**, 0 in `in-progress/`. The premise
that generated the task has changed since it was written — which is itself a finding
about swarm timing: a synthesis task materialised on an empty queue goes stale before
an agent can claim it.

**Recommendation:** regenerate it after the current wave drains, or amend the brief.

---

## Summary for the planner

| # | Issue | Owner | Blocks |
|---|---|---|---|
| N1 | SAAMI free-drawings permission | **legal** | 3 cartridges + the precedent |
| N2 | CIP extract boundary | **legal or CIP** | ~11 cartridges |
| N3 | CIP coverage uncounted | research, **after N2** | accuracy of the verdict CSV |
| N4 | `cartridge-dimensions` output mismatch | planner | `check-mail` stays red |
| N5 | Stray `T5/` duplicate | planner | repo hygiene |
| N6 | `roadmap-synthesis` source mismatch | planner | brief accuracy |
| N7 | `roadmap-synthesis` stale premise | planner | task value |

**N4 is the only one currently making a gate red.** N1 and N2 are owner decisions and
will not be resolved by any amount of research.
