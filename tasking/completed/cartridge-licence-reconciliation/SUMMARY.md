# SUMMARY — cartridge-licence-reconciliation

**Task:** resolve the contradiction between two completed tasks on CIP licensing.
**Status:** COMPLETE · **Agent:** dc408 · **Date:** 10 Feb 2026
**Write-set:** `tasking/completed/cartridge-licence-reconciliation/` only.

---

## The answer in one paragraph

**`cartridge-dimensions` was right; `ammoseek-coverage` §7 is superseded.** Both
reasoned carefully about **different permissions**. `ammoseek-coverage` recorded CIP's
licence as *"free to download from publisher"* — true, and irrelevant, because we are
not downloading, we are **republishing a column of numbers**. CIP's notice, re-fetched
today from `bobp.cip-bobp.org`, reads *"Reproduction forbidden as well as in the form
of extracts without approval of C.I.P."* **The dimensional columns stay empty — now as
a recorded decision with a named obstacle, not an unfinished task.** The more useful
finding is that **for 226 of 229 cartridges the obstacle is not permission at all: we
have not bought the standard.**

---

## Deliverables

| File | Substance |
|---|---|
| `REPORT.md` | Verdict, reasoning, verification, self-corrections |
| `KNOWLEDGE.md` | 7 durable findings |
| `01-the-disagreement.md` | Both positions verbatim + how they separate |
| `02-licence-terms.md` | Published terms, re-fetched, with ambiguities marked |
| `03-per-cartridge-verdict.csv` | 229 rows — **permission, never a dimension** |
| `NOTES.md` | 7 unresolved items for the planner |

---

## Findings

| Verdict | Count | Obstacle | Remedy |
|---|---|---|---|
| `may-transcribe` | **3** | none | proceed, flagged pre-standard |
| `no-free-source` | **226** | **availability** | buy SAAMI Z299.x — **owner, budget** |
| `blocked-cip` | 0 asserted | **permission** | written CIP approval |

**All 3 `may-transcribe` slugs verified individually** — `6-5-grendel`, `44-40`,
`44-rem-mag`. **CIP coverage was not asserted**: reading 91 sheets to classify
coverage is pointless while the licence forbids the use.

---

## Three things that will change how another agent works

1. **Name the verb.** *"Free to download", "free to read", "free to cite" and "free to
   republish" are four different permissions.* Only the last governs a dataset. This
   single question resolved the whole disagreement.
2. **"Blocked" is not one state.** 226 rows are blocked on *availability*, 0 on
   *permission*. A task that says "blocked on licensing" when it is really blocked on
   not having bought the standard sends the owner to the wrong conversation.
3. **A permissive licence on a compilation does not launder a restrictive source.**
   `ammolytics-cartridges` is MIT but derived from CIP; MIT cannot convey more than
   CIP grants.

---

## Constraints honoured

- **No legal advice.** Two genuine ambiguities (CIP's extract boundary; whether
  SAAMI's "all rights reserved" footer defeats its own free drawings) are recorded and
  escalated, not argued.
- **No CIP-derived dimension transcribed** — verified mechanically: **0 of 229 rows**
  carry a populated dimensional cell.
- **No source file modified.** `data/`, `scripts/`, `apps/`, `package.json` untouched.
- **No repair of other agents' work** — `cartridge-dimensions`' output mismatch and the
  stray `T5/` are reported in `NOTES.md`, not fixed.

---

## Two self-corrections worth recording

Both first attempts produced **confident, wrong answers**:

1. **Used `split(',')` on a quoted CSV** → emitted `" pressure columns)\""`. The exact
   hazard at `scripts/shared/data.mjs:117` and the exact duplication reported in
   `code-audit/02-dupes.md`. Switched to the shared `readCsv`.
2. **Keyed coverage on `canonical_name`, a column that does not exist** — identity is
   `slug`. It silently returned 0 of 3 matches, which *read as* "SAAMI covers none of
   ours." Re-run: 3 of 3.

> **Caught by reading output, not exit codes.** Trusting either first run would have
> put a falsehood in this report.

---

## For the planner

**The headline is a budget decision, not a legal one.** 226 of 229 cartridges need
**SAAMI Z299.x purchased**. Only ~11 are blocked by CIP's licence, and those need an
**approval request**, not a lawyer.

**`NOTES.md` N4 is the only item currently keeping a gate red** —
`cartridge-dimensions` declares 4 outputs, has 7 files. N5 flags a stray
`tasking/completed/T5/` duplicate from the pre-swarm layout. N6/N7 flag that
`roadmap-synthesis`'s brief names a *blocked* task as its source and its "queue is
empty" premise is already stale.
