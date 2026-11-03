# Measurement — KNOWLEDGE dimension

Every number in `01-finding.md` comes from this script, run once, on the tree as it stood
at 3 Oct 2026. The method is recorded so a later agent can re-run it and **expect the
same numbers if the claim is still true** — and different numbers if it is not.

## Method

```
node tmp/measure-knowledge.cjs
```

Walks `tasking/completed/**` recursively for `*.md`, reads each file, and applies one
regex per subject. Reports: file count, per-subject file count, per-subject task count,
and the total bytes of every file that matches (the read cost of being confident).

**Subjects were chosen by consequence, not by convenience.** Each one BLOCKS or SHAPES
work, per `roadmap-synthesis/02-owner-decisions.md`. A subject nobody acts on would be a
poor proxy for "does recall matter?"

## Results

```
files scanned: 108

subject                                files  tasks  est KB to read all
------------------------------------------------------------------------------
dimensional columns empty (0/229)         27      6        187 KB
CIP / SAAMI licence or permission         33      7        219 KB
unresolved pressure dispute               28      7        162 KB
provenance published/derived/estimated    22      6        156 KB
live trademark 5391055                    13      4         85 KB
charge weight prohibition                 11      4         84 KB
tabular-nums                             10      3         70 KB

The single fact "0/229 populated" is stated 70 times across 27 files
subject-index files present: NONE
```

Total corpus: **108 files, 793,542 bytes.**

---

## The negative test — a claim I expected to be true, and was not

**I expected the index to already exist.** `roadmap-synthesis`, the task I finished
immediately before this one, ranked `findings-ledger` as its **highest-value** candidate —
and its evidence for doing so was the absence of `KNOWLEDGE.md` in half the tasks.

So before measuring, I assumed a findings index had already been built by another agent in
the interval. **It has not.** The measurement returned `subject-index files present: NONE`
across all three names (`INDEX.md`, `FINDINGS.md`, `LEDGER`).

**This is the finding's real shape, and it is worse than a first reading suggests.**

`roadmap-synthesis` proposed `findings-ledger`; `unknown-state-design` independently
recorded the same `0/229` fact 11 times in one file. **Both are duplicates of work nobody
has done, and neither agent could see the other's proposal** — because proposals live in
a folder that nothing reads before starting.

> **The swarm has an index-shaped proposal in it and still cannot tell that two agents
> proposed the same thing.**

That is the measurement I did not expect, and it is the reason this is a KNOWLEDGE
finding rather than a tidiness one.

---

## Second negative test — a claim in a file I wrote, and found wrong

`roadmap-synthesis` ranked `cartridge-family-correction` second, on `ammoseek-coverage`'s
assertion that *"family drives presentation and filtering, so the most-searched cartridge
on the index is currently in the wrong bucket."*

Agent `4880a` had already contradicted the visible half of that, in its bulletin:

> "A predecessor asserted 'family drives presentation and filtering, so users see this in
> the wrong bucket.' I checked `apps/website/src/main.js` and it contains no occurrence of
> `cartridge`, `family`, or `pistol'… The defect was real but **latent**, not visible."

**I verified it this time, because the claim was mine:**

```
Select-String apps\website\src\main.js -Pattern 'cartridge|family|pistol'
  -> 0 matches
```

**Confirmed.** `roadmap-synthesis/01-ranked-roadmap.md` — which I wrote — states *"9mm
sits under the wrong heading for every visitor."* **That is false.** `main.js` does not
render cartridge families at all, so no visitor sees a wrong heading.

The data defect is real (the rows are still `family=rifle`); **the user-visible impact I
claimed is not.** I wrote an impact claim by inferring it from a column name, which is
exactly the error `4880a` warns about in its bulletin: *"An impact claim about the UI is a
measurement, not an inference from a column name."*

**Reported, not corrected** — one writer per file, and correcting a completed task is not
mine to do. It is recorded here, in `NOTES.md`, and in my bulletin for the review agent.

---

## What I did NOT measure, and why

| Not measured | Why |
|---|---|
| Agent idle turns | Requires session-level telemetry that does not exist. `HISTORY.md` records *"Hours passed before this was noticed"* — the one data point, unquantified. |
| Gate false positives/negatives | Would need each gate run against deliberately broken input. **`gate-negative-tests` is already a task in `pending/`** — proposing it would duplicate queued work, which `prohibits[]` forbids. |
| Proposals never materialised | Counted **17 proposals vs 19 completed tasks** — but which proposal produced which task cannot be determined. Several names match, which is suggestive, **not proof**, and I am not claiming it. |
| Context-window consumption | Not observable from outside a session. |

## Reproducibility

The script writes nothing and deletes nothing. Re-running it later should produce **equal
or larger** numbers (the corpus only grows). **A smaller number means a task was deleted,
not that recall improved** — and `docs/mockups/` already documents one file being
accidentally overwritten by an extractor, so deletions here are real and have happened.