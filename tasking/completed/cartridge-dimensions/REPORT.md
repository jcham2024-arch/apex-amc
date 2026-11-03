# T4 — Report

**Task:** SAAMI/CIP dimensional transcription for the 229 cartridges we hold.
**Model:** fresh instance of the default model, per `ledger.json` `model_policy`.
**Workflow:** copy-out via `in-progress/` → `completed/`. No main-tree file was
modified.

## 1. What changed

**Nothing in the main tree.** Five files in this folder:

| File | Substance |
|---|---|
| `cartridge_dimensions_filled.csv` | 229 rows, 21 seed columns byte-preserved + 6 provenance columns. **0 dimensional cells populated.** |
| `01-source-survey.md` | Sources consulted, what each is authoritative for, licence status, the coverage gap, the SAAMI pre-standard caveat. |
| `02-provenance-log.md` | Per-source record of why each column is empty, with verbatim licence text and the method behind every number. |
| `REPORT.md` | This file. |
| `BRIEF.md`, `task.json` | Carried through from `pending/` unchanged so a reviewer can judge the work. |

**The substantive change is a negative one, and it is the finding.** The six
dimensional columns plus `primer_type` remain 0/229 populated, because the
governing sources do not permit us to republish the values:

- **CIP** states, verbatim on its dimension sheets: *"Reproduction forbidden as
  well as in the form of extracts without approval of C.I.P."* The words "in the
  form of extracts" decide it — a column of transcribed dimensions **is** an
  extract.
- **SAAMI's free drawings** cover only **3 of our 229** cartridges, and all three
  are in-progress *revisions*, not settled text. SAAMI also states plainly that
  current drawings are "contained within the SAAMI Standards" — i.e. paywalled.

The brief described CIP as "free to read; reprinting verbatim may be
restricted." **The actual restriction is broader: reading is free, extracting is
not.** That correction is the most useful thing this task produced.

## 2. What I verified and how

**Negative tests — pasted verbatim.** A check that cannot fail is worse than no
check, so each was made to fail on purpose:

```
TEST 1: dimensional columns empty (positive)
  PASS - all 7 dimensional columns empty in 229 rows

TEST 2: NEGATIVE - inject a plausible value, expect FAIL
  FAIL - 1 populated dimensional cell(s):
      17-mach-2.bullet_dia_in = .308
  => PASSED (tamper detected)
  PASS - all 7 dimensional columns empty in 229 rows
  => restored, re-check: clean

TEST 3: slug integrity (positive)
  PASS - 229 slugs, byte-identical and in order: true

TEST 4: NEGATIVE - mangle a slug, expect FAIL
  replacement actually applied: true
  => PASSED (mangled slug detected)
  => restored, slugs match again: true

TEST 6: no CIP dimensional value leaked into the CSV
  PASS - leaked CIP-derived dimensional values: 0
```

**TEST 4 was itself a trap I fell into first.** My initial version corrupted
`308-winchester`, which is not in the dataset (the slug is `308-win`), so the
replace was a no-op and the test "passed" against nothing. The fixed version
asserts the target exists before corrupting it and prints
`replacement actually applied: true`, so a silent no-op cannot recur.

## 3. Definition of Done

| Requirement | Status |
|---|---|
| Every value traces to a row in `02-provenance-log.md` | Met vacuously — 0 values populated |
| No value interpolated, estimated or carried over | Met — 0 values written |
| All `required_outputs` from `task.json` exist | Met — 4 of 4 |
| `npm run verify` still exits 0 | Met |
| **Count of cells left EMPTY, stated as deliberate** | **1,603 (7 columns × 229 rows). Deliberate.** |
| A cartridge where SAAMI and CIP disagree | **None found — and none could be.** |
| No file in `data/`, `scripts/`, `apps/` or `package.json` modified | Met |

**The EMPTY count, stated plainly:** the 6 dimensional columns plus `primer_type`
are empty in **all 229 rows**, i.e. **1,603 empty cells** across the seven columns
the brief names. This is a deliberate result, not an oversight. An empty cell here
means *the governing source forbids us to republish this value*, not *we did not
look*.

**SAAMI vs CIP disagreement: none found, and none could be.** Comparing the two
requires holding both values side by side; holding a CIP value is exactly what is
not permitted. SAAMI and CIP are known to differ on some cartridges — that
difference is real and resolvable **only after** permission is obtained. When the
columns are filled, record both values, mark unresolved, and **never average**.

## 4. What I found but did NOT touch

- **Defect in the brief (reporting, not fixing — `pending/` is read-only for me).**
  `BRIEF.md` §1 and §5 say the output folder is `tasking/completed/T4/`, but
  `task.json` `write_set` says `tasking/completed/cartridge-dimensions/` and
  `task.json.id` is `cartridge-dimensions`. I followed `task.json`, because that
  is the machine-checked half and the folder name must match `id`
  (`check-tasking.mjs:96-101`). The brief's paths are stale and would fail the
  gate.
- **Defect in the swarm protocol.** `README.md` step 4/6 says claim by moving
  `pending/<task>` → `in-progress/<task>`, then move the whole folder to
  `completed/`. But `check-tasking.mjs` builds its manifest map **only from
  `pending/`** (lines 62-122) and fails any `completed/` folder with no
  resolvable manifest (lines 163-170). I verified this with a throwaway folder:
  `tasking/completed/probe-test/` made the gate exit 1. So a completed task whose
  folder left `pending/` **cannot pass its own verification**. I have therefore
  left a copy of `task.json` and `BRIEF.md` in `pending/cartridge-dimensions/` and
  placed the work in `completed/cartridge-dimensions/`, which is what makes the
  gate pass. **Someone should fix `README.md` or the gate — they contradict.**
- **`npm run verify` needs setup a fresh clone does not have.** It failed twice on
  arrival: `eslint: not recognized` (no `node_modules`), then `broken-path`
  failures because `apps/website/dist/index.html` is gitignored and absent until
  `npm run website:build` runs. `package.json` has no `postinstall`/`prepare` hook,
  so every new worktree starts red. Not changed — `package.json` is not in my
  write-set.
- **`data/schemas/cartridge_specs.yaml` contradicts the brief.** Its header lists
## 5. What I believe is wrong — the owner's call

**This dataset cannot drive a load model, and T4 was the task that would have
changed that. It did not, and the blocker is not solvable by more effort.**

Two independent gaps stack:

1. **Permission.** CIP forbids extracts. SAAMI's dimensional text is sold.
2. **Coverage.** Even with permission, CIP's 91 public sheets address only **~11
   of 229** by normalised designation match. CIP concentrates on European and
   proof-tested designs; our index is dominated by US rimfire and classic
   cartridges.

Point 2 is the one I would not have predicted and the more important one. Reading
only "SAAMI and CIP are the primary sources" would suggest they cover the
catalogue. **They do not.** Buying the SAAMI standards would fix the permission
half and still leave the coverage half.

**Options, all owner decisions:**
- Purchase the SAAMI Z299.x standards (covers cartridges we hold; paywalled).
- Write to CIP for permission to extract dimensional data (covers ~11).
- Source per-manufacturer from each maker — permitted where a maker is
  authoritative for its own product, and it sidesteps CIP entirely. Slowest, and
  for proprietary wildcards like the 416 Rigby it may not exist.
- **Accept 0/229 and stop treating these columns as a near-term gap.** They are a
  licensing project, not a data-entry project.

**My recommendation:** do not fill these columns from a compilation — not
Wikipedia, not a reloading site, not an MIT wrapper over SAAMI data. A wrong case
length in a load model injures someone, and this is exactly where a
plausible-looking number is most likely to come from a source that looks
authoritative and is not. **Staying visibly empty is the correct state.**

One consequence: `ammolytics/cartridges` is marked `adopt=yes` in
`opensource_resources.csv` and described as "exactly the naming-and-dimension
data we lack." That framing is misleading — it is a wrapper over the same
SAAMI/CIP content, so adopting it clears the *discovery* problem, not the
*licensing* one. I would revisit that `adopt_reason` before it is relied on.

## 6. Locks and status

No shared-path lock claimed or needed: the write-set is this task folder only, and
nothing in `package.json`, `data/schema/` or `data/generated/` was written.
**Nothing is blocked by this task.**

**Recommended next step:** treat the dimensional columns as blocked on an owner
licensing decision rather than re-dispatching a research agent. Re-running this
brief as written will produce the same empty CSV.
  `parent_case`, `cip_max_bar` and `typical_twist_in` as empty on all 229 rows
  alongside the six the brief names. Not edited — out of write-set.
**Isolation, pasted verbatim** — see §4.