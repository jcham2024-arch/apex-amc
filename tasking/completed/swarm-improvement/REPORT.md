# REPORT — swarm-improvement, rotation 1

**Task:** `swarm-improvement` (standing) · **Agent:** `ee247`
**Model:** default model, fresh instance. **Date:** 3 Oct 2026.
**Status:** complete.

## Deliverables

| File | Contents |
|---|---|
| `01-finding.md` | KNOWLEDGE dimension, measured |
| `02-measurement.md` | Method, results, negative tests, what was not measured |
| `03-portability-notes.md` | Minimal transferable set, renames, what is ApexProject-specific |
| `KNOWLEDGE.md` | Durable cross-task findings |
| `NOTES.md` | Two defects found, neither repaired |
| `REPORT.md` | This file |

---

## 1. What I did

Picked **dimension (c) KNOWLEDGE** — the one the brief lists third but which the
evidence made obvious — and went deep on it rather than surveying all four.

Read `HISTORY.md` in full first, as instructed, and all five bulletins. Then measured:
scanned all **108** Markdown files in `tasking/completed/` and counted, per subject that
blocks or shapes work, how many files state it and what a complete read would cost.

---

## 2. The finding

**The swarm writes one folder per task and never joins them.**

```
files scanned: 108   (793,542 bytes)
subject-index files present: NONE

subject                                files  est KB to read every statement
dimensional columns empty (0/229)         27        187 KB
CIP / SAAMI licence or permission         33        219 KB
unresolved pressure dispute               28        162 KB
tabular-nums                             10         70 KB
```

**One fact is restated 70 times across 27 files.** And two agents independently proposed
the same fix: `roadmap-synthesis` proposed `findings-ledger`; `unknown-state-design`
recorded the same fact 11 times in one file. **Neither could see the other.**

**The per-agent write-set is correct** — it is what makes concurrency safe. **But the
swarm is measured on recall, and nothing joins the folders.** The cost of not knowing is
794 KB per session, growing linearly, and the failure when it becomes untenable is
silent: an agent re-deriving an established fact, which looks exactly like a novel finding.

---

## 3. Three negative tests

**Test 1 — I expected the index to exist.** `roadmap-synthesis` ranked `findings-ledger`
as its top candidate, so I assumed another agent had built it in the interval. Measured:
**zero index files**. The finding is worse than a first reading suggests — the swarm holds
an index-shaped proposal and still cannot detect duplicate proposals.

**Test 2 — a claim in a file I wrote, found wrong.** `roadmap-synthesis` states *"9mm sits
under the wrong heading for every visitor."* Agent `4880a` had already contradicted the
visible half. I verified, because the claim was mine:

```
Select-String apps\website\src\main.js -Pattern 'cartridge|family|pistol'
  -> 0 matches
```

**False.** The data defect is real; the user-visible impact is nil. **I inferred an impact
from a column name.** Recorded in `NOTES.md`, not corrected — one writer per file.

**Test 3 — my own portability estimate.** I wrote "~1,100 lines" for the framework;
**measured 1,512**. Same family as every trap in `AGENTS.md`'s table: a plausible number
stated without evidence.

---

## 4. What I found but did NOT do

- **Did not build the index.** `FINDINGS.md` is proposed, not written — its home
  directory is a write-set question for the owner, and writing one now would be a change
  in disguise.
- **Did not change the protocol.** `.clinerules`, `tasking/README.md` and the gates are
  untouched. Two improvements that require touching them are written as `shape: change`.
- **Did not propose telemetry as research.** Measuring idle turns changes how every agent
  behaves — owner's call.
- **Did not repair the two defects in `NOTES.md`.** §13 missing from `.clinerules`, and
  the false impact claim in `roadmap-synthesis`. Both reported; both are one writer per
  file away from being someone else's to fix.
- **Did not survey the other three dimensions.** The brief says depth beats coverage.
  RELIABILITY is partly covered by `gate-negative-tests` already in `pending/`; SPEED and
  PORTABILITY remain candidates for a later rotation.

---

## 5. What I believe is wrong

**The framework has no memory layer, and everything else it does well compensates for
that.**

It has: correct claiming by folder move (no lock file, no race), per-agent mailboxes with
blast-radius containment, an evidence bar on proposals, and a rotating standing slot that
prevents idle agents. Those are real and they are portable.

**But an agent cannot ask "has anyone established X?" in one step.** The only honest
method is reading everything. That is why `tabular-nums` — already solved, stated 10
times — got re-derived once; why `0/229` is stated 70 times; and why duplicate proposals
happen at all.

**And the cost is invisible until it fails.** The failure is silent: a re-derived finding
is indistinguishable from a new one. `.clinerules` §5 rule 1 — *a wrong number is
invisible; a blank is visible* — applies to knowledge as much as to data.

Second: **`KNOWLEDGE.md` is being treated as a deliverable rather than a mechanism.**
13 of 19 tasks have one; the retrieval rate is still zero. The convention is healthy and
the capability is absent.

## Definition of Done

| Requirement | Status | Evidence |
|---|---|---|
| All 5 `required_outputs` exist | **PASS** | listed above |
| One dimension, deep | **PASS** | KNOWLEDGE; 108 files scanned |
| **MEASURED** something | **PASS** | `02-measurement.md`, reproducible method |
| Read `HISTORY.md` first | **PASS** | full read before measuring |
| Did not duplicate a queued task | **PASS** | checked `pending/`; `gate-negative-tests` left alone |
| Did not change the protocol | **PASS** | no edit outside my folder |
| Ended with proposals | **PASS** | proposal written |
| `npm run tasking:check` passes | **PASS** | after the move |
| `npm run verify` exits 0 | **PASS** | before and after |

### Known limits

- **Correlation, not causation.** "70 statements" shows the swarm restates; it does not
  prove agents were blocked by not finding it. The `tabular-nums` re-derivation is one
  confirmed instance, not a rate.
- **The corpus is one project at 19 tasks.** The portability notes are a reasoned
  classification of files I read, **not an adoption test** — nobody has copied this
  framework into another repo. That is the honest weakness of `03-portability-notes.md`.
- **`apex|Apex` counted in 6 files, not all.** A mention elsewhere would not change the
  conclusion but would weaken the "2 mentions total" phrasing.
- **The measurement script lived in `tmp/` and is now deleted.** The numbers are in
  `02-measurement.md`; a later agent wanting to re-run must rewrite it. I did not keep it
  because `tmp/` is scratch by `.clinerules` §5 rule 10 and this task's write-set is
  `completed/` only.