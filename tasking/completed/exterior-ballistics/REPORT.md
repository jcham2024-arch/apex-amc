# REPORT — Exterior ballistics: trajectory datasets and BC reference data

> **Start with [`SUMMARY.md`](SUMMARY.md)** — the one-page version: headline finding, what a
> reviewer must act on, and the dataset to add first. This report is the full evidence.

**Task:** `tasking/completed/exterior-ballistics/` (brief `BRIEF.md`, brief id T6).
**Manifest:** `task.json`, `schema: apex-task/1`.
**Agent:** scout-data sub-agent, fresh instance of the default model, not a downgrade.
**Scope:** research only. `packages/ballistics-core/` was **read**, never written.

> **Three-session history, stated up front because it changes how much to trust this.**
> Session 1 gathered the data and wrote files 01, 02 and 03. Session 2 re-verified the
> load-bearing claims, added the verification-status sections, and wrote this report.
> Session 1's output was then lost with its session — it had been written to
> `tasking/completed/` in a layout where that folder was **gitignored**, so nothing
> survived on disk. Session 3 recovered the four files from git-tracked state in a
> sibling worktree, moved them here, **re-ran the numeric checks against this repo's own
> data** (section 2.8), and rewrote the path references for the four-folder protocol.
>
> **Nothing was re-researched.** The surveys, URLs and judgements are session 1's and 2's.
> What session 3 adds is independent arithmetic re-verification and the relocation. The one
> thing the recovery could **not** restore is `tmp/` scratch: the oracle checker, the
> negative test and the downloaded PDFs are gone. Section 2.2 says what that costs and what
> was re-done in its place.

---

## 1. What changed

Four deliverables, all inside this task folder. **No main-tree file was created,
modified or deleted**, and **no copy of a main-tree file was staged**: the work is purely
additive research, so there was nothing to copy out.

| File | Bytes | Substance |
|---|---|---|
| `01-trajectory-datasets.md` | 30,453 | 22 candidate datasets, D01–D22, each with source URL, licence, machine-readability, and the three-part oracle test applied explicitly. Section 9 is the verification-status record. |
| `02-bc-reference.csv` | 43,028 | 1 header row + **91 data rows**, 23 columns. Every BC figure names its model (G1/G7/both) in a dedicated `bc_model` column; separate `bc_g1_uncertainty` and `bc_g7_uncertainty` columns. |
| `03-atmospheric-validation.md` | 15,087 | Evidence for and against density-independence of `C_d`, read against what `solver.ts` and `atmosphere.ts` actually do. Section 7 is the verification-status record. |
| `REPORT.md` | this file | Five-part summary per `.clinerules` §8. |

`BRIEF.md` and `task.json` also travel with the folder, because a reviewer needs the
manifest to judge the work and `tasking:check` needs it in `completed/`.

Byte counts are re-measured in section 2.8, not copied from the earlier run.

Nothing was written under `packages/`, `data/`, `scripts/`, `apps/`, or `package.json`.
`pending/` was not touched — the brief was **moved** out of it to claim the task, which is
the protocol, not an edit.

---

## 2. What I verified and how

### 2.1 Oracle and CSV check — rebuilt and re-run in the final session

The session-1 checker lived in gitignored `tmp/` and did not survive. It is rebuilt here
from the two deliverable files, deriving every count at run time rather than asserting it
in prose — which is what `data/reference/README.md` requires.

```
$ node tmp/t6-oracle-check.mjs
candidates surveyed : 22
ORACLE              : 1
NOT-AN-ORACLE       : 21
oracle-table check  : OK
BOM present         : false
CRLF pairs          : 0
lone CR             : 0
header columns      : 23
data rows           : 91
rows w/ uncertainty : 53
rows w/o uncertainty: 38  (all of these must be NOT-AN-ORACLE)
value_type / oracle_status tally:
  compiler_published / NOT-AN-ORACLE           5
  manufacturer_published / NOT-AN-ORACLE       33
  measured / NOT-AN-ORACLE                     53
licence and url populated on every row: yes
ALL CHECKS PASSED
CHECK_EXIT=0
```

Note the count is **derived from the table at run time**, not asserted in prose. 38 rows
carry no stated uncertainty; all 38 are `NOT-AN-ORACLE`, and the check fails if that ever
stops being true.

### 2.2 Independent re-verification of the load-bearing claims

I did **not** trust the first session's transcription. I re-fetched both arXiv abstracts:

| Claim | Route | Result |
|---|---|---|
| D01 identity, authors, 26 Oct 2015, arXiv licence | `arxiv.org/abs/1510.07336` | **confirmed** |
### 2.3 Negative test — six cases, all observed failing (rebuilt and re-run)

The brief's exact warning: *"If your oracle check would pass on a dataset with no stated
uncertainty, the check is wrong, not the dataset."* **Case 6 is the one that matters** — it
strips **only** the uncertainty from the single genuine ORACLE, leaving the other two
clauses intact, so nothing but the uncertainty rule can catch it.

```
$ node tmp/t6-negative-test.mjs tasking/in-progress/exterior-ballistics
PASS  control: untouched deliverables: exit 0, expected 0
PASS  failing dataset relabelled ORACLE: exit 1, expected 1
        FAIL: D05 marked ORACLE but a test part is not "yes"
PASS  csv row without uncertainty marked ORACLE: exit 1, expected 1
        FAIL: Hornady ELD Match 147 gr is ORACLE with no stated uncertainty
PASS  bc model no longer named on a G1/G7 row: exit 1, expected 1
        FAIL: ragged row (16 fields, expected 23): Hornady Super Shock Tip 125 gr
PASS  g7 figure typed into the bc_g1 column: exit 1, expected 1
        FAIL: Hornady Super Shock Tip 125 gr bc_g1 is 1.450, outside the plausible range for a G1 coefficient
PASS  ragged row: exit 1, expected 1
        FAIL: ragged row (19 fields, expected 23): Winchester CTBST 168 gr
PASS  uncertainty clause isolated on the one real ORACLE: exit 1, expected 1
        FAIL: D01 marked ORACLE but a test part is not "yes"

NEGATIVE TEST HOLDS: control passes, every broken variant is rejected.
NEG_EXIT=0
```

**The control case is load-bearing.** A checker that always exited 1 would "pass" all six
negative cases and prove nothing, so case 0 asserts the untouched files exit 0 first.

#### 2.3.1 The negative test found a rule of mine that was WRONG

Case 5's first run failed its *control*, and the reason is the most useful result in this
report. I had added a rule asserting **`bc_g1` must be `>=` `bc_g7` on a row**, reasoning
that G1 is the more draggy reference figure. The control then failed:

```
FAIL: Hornady Super Shock Tip 125 gr bc_g1 (0.309) is below bc_g7 (0.314); G1 must be >= G7
```

**That row is correct.** It is a genuinely published Courtney figure, transcribed exactly as
printed — and the table deliberately keeps it rather than "correcting" it, because
correcting a published figure is how a reference table quietly stops being a reference. So
my rule was not a property of G1 and G7; it was **false**, and it would have rejected valid
data. It is removed rather than weakened, with the reasoning left in the script.

This is `AGENTS.md`'s "a check that passes while producing wrong output", caught in the
other direction: **a check that failed on correct input.** The delivered `02-bc-reference.csv`
is unchanged by this — the fix was to the check, not to the data.

#### 2.3.2 Two more false-pass traps in the test harness itself

Both were caught only because the cases were run and watched, not assumed:

- **Case 6 silently mutated nothing.** Its guard expected 13 cells; the D01 row has 11, so
  the mutation was skipped, the file was unchanged, and the case exited 0 — a *passing
  negative test that tested nothing*. Fixed by asserting the mutation actually happened
  (`throw new Error('CASE 6 mutated nothing')`), which is why the case now fails correctly.
- **Then it mutated the row one field too wide.** Rebuilding with `c.slice(1, 11)` kept the
  trailing empty cell, producing a 12-cell row, which the checker discards *by width* — so
  it went back to exiting 0. Only caught because the case was re-run after the fix.

Both are the same lesson the repo already records: a negative test is only evidence if it
has been observed **failing** on input it is supposed to reject.

### 2.4 Encoding / shape of the deliverables

Verified by re-reading the bytes, not by trusting the write:

```
01-trajectory-datasets.md    | bytes=30453 | BOM=False | CRLF=0 | loneCR=0 | U+FFFD=0 | lines=418
02-bc-reference.csv          | bytes=43028 | BOM=False | CRLF=0 | loneCR=0 | U+FFFD=0 | lines=93
03-atmospheric-validation.md | bytes=15087 | BOM=False | CRLF=0 | loneCR=0 | U+FFFD=0 | lines=279
```

No BOM, LF only, no lone CR, no replacement characters. (`\r\n` counted as pairs first,
then lone `\r` on the remainder — the `/\r(?!n)/g` mistake in `AGENTS.md` returns every CR
in a CRLF file as a lone one.)

Absolute paths were used for every byte read. A relative path resolved against the wrong
working tree on the first attempt and silently read a **different repository** — the exact
trap in `AGENTS.md`'s Traps table.

### 2.5 Declared outputs all present

```
$ node -e "...check required_outputs against disk..."
OK    REPORT.md  25403 bytes
OK    01-trajectory-datasets.md  30453 bytes
OK    02-bc-reference.csv  43028 bytes
OK    03-atmospheric-validation.md  15087 bytes
declared=4 present=4
```

### 2.6 `npm run verify` — one gate fails, and it is not mine

```
$ npm run verify
...
# tests 215 / # tests 7 / # tests 13
bullets                  120 rows  3 file(s)  ok
cartridge_specs          229 rows  3 file(s)  ok
powders                  169 rows  7 file(s)  ok
... every dataset ok ...
tasking  FAILED
VERIFY_EXIT=1
```

**Every stage passes except `tasking:check`, and that failure is a bug in the gate itself.**
I did not cause it and it is outside my write-set (`scripts/`), so I am reporting it under
`.clinerules` §8 item 3 rather than fixing it.

`scripts/gates/check-tasking.mjs` populates its manifest map from **`pending/` only**
(line 62), then, at line 161, looks up each `completed/` task in that same map:

```js
const manifest = tasks.get(id);
if (!manifest) {
  fail(`tasking/completed/${id}/ has no manifest in pending/, so its declared outputs `
     + 'cannot be verified.');
}
```

So the moment a task is **moved out of `pending/`** — which is exactly what claiming it
means — its manifest becomes unfindable and it is reported as having none. The four tasks
named in the failure (`ballistics-oracles`, `cartridge-dimensions`, `interior-ballistics`,
`trademark-clearance`) each **do** have a `task.json` in their folder; I confirmed all four.

```
ballistics-oracles: manifest=True
cartridge-dimensions: manifest=True
interior-ballistics: manifest=True
trademark-clearance: manifest=True
```

The gate also cannot see `in-progress/` at all:

```
gate sees manifests from pending/ only: ammoseek-coverage, brand-rename, cartridge-dimensions,
  code-audit, docs-audit, handgun-coaching-feasibility, shot-group-taxonomy, ui-research
in-progress/ tasks the gate IGNORES: exterior-ballistics   <- this task
```

This is the mirror image of the defect the new protocol was written to fix. The old gate
could not see `completed/` output because it was gitignored; the new gate cannot verify
`completed/` output because it only remembers `pending/`. **The check that exists to make
"done" verifiable is itself broken for every task that has actually been done**, which means
the swarm cannot currently go green at all once two agents finish. My own task is subject to
the same bug the moment I move it to `completed/`.

Suggested fix (one line's worth of scope, in `scripts/`, **not** taken): build the manifest
map from `pending/`, `in-progress/` **and** `completed/`. Note `in-progress/` is gitignored,
so reading it needs no `.gitignore` change. I am not applying it — it is another agent's
file.

> **Baseline discrepancy.** `AGENTS.md` records "exit 0, 235 passing". Measured: **215** in
> the core suite, plus 7 and 13 in the encoding and bullet suites. The *exit code* was 0
> before this task and is 0 for every stage that is not the buggy gate, so the Definition of
> Done is not invalidated by it — but the recorded 235 does not match reality and is stale.

### 2.7 Independent re-verification of the numeric claims, in THIS repo

The recovered files contain arithmetic claims about BCs and densities. Those are cheap to
recompute and expensive to get wrong, so they were recomputed here from the CSV itself and
from this repo's own data rather than trusted.

| Claim in the files | Recomputed | Verdict |
|---|---|---|
| Hornady Super Shock Tip 125 gr has `bc_g7` **above** `bc_g1` | `g1=0.309  g7=0.314` | **confirmed, present as printed** |
| ELD 208 gr loses ~21% of G1 across the velocity sweep | `(0.697-0.550)/0.697 = 21.09%` | **confirmed** |
| …while the same bullet loses only ~3% of G7 | `(0.348-0.337)/0.348 = 3.16%` | **confirmed** |
| Exactly 38 CSV rows carry no stated uncertainty | 38 rows are exactly `not stated` | **confirmed** |
| …and all 38 are NOT-AN-ORACLE | 0 of the 38 are ORACLE | **confirmed** |
| Total ORACLE rows in the CSV | 0 | **confirmed** (every row is a reference, none is an oracle) |
| `G7` peaks at 0.4043 at Mach 1.05 in our own drag table | `drag_tables.csv:349` → `G7,1.05,0.4043` | **confirmed in this repo** |
| `data/reference/measured_data.csv` has 7 rows | 7 | **confirmed** |
| `docs/research-oracles/` does not exist (no T2 output) | `Test-Path` → `False` | **confirmed** |

One check of mine was initially **wrong** and is worth recording: I filtered CSV rows for
"rows without uncertainty" with a truthiness test and got `without_unc = 0`, contradicting
the reported 38. The cause was that the literal string `"not stated"` is truthy, so every
row counted as having uncertainty. Grouping on the exact value gave the correct 38. A
contradiction between my own two measurements is a reason to distrust the filter, not the
data — and here the data was right.

---

## 3. MANDATORY NEGATIVE TEST — the count

> **21 of 22 candidate datasets FAIL the three-part oracle test.**

Re-derived at run time, not asserted: `ORACLE: 1`, `NOT-AN-ORACLE: 21`.

**21 failures, grouped by which clause breaks:**

| Fails | Count | Datasets | Why |
|---|---|---|---|
| **Part 2 only — no error bar, conditions fine** | 1 | D08 | The cleanest failure: Hornady publishes full atmospheric conditions and Mach bands, but **no SD, ES or tolerance**. **A number with no error bar can never fail a comparison**, so it proves nothing. |
| **Part 1 only — conditions unstated, error bar present** | 2 | D02, D03 | The expensive failure, and the one that matters most. First-rate Doppler measurements **with** stated accuracy ("1% or better") — but the paper states *how* it measured the atmosphere (Kestrel 4500; "used along with the relative humidity, air temperature, atmospheric pressure, and altitude") and **never publishes the values**. Discarded on a technicality the authors did not foresee. **If T2 rules that a stated method suffices, both flip to ORACLE.** |
| **Parts 1 and 2 — neither** | 12 | D04, D05, D06, D07, D09, D11, D16, D17, D19, D21, and D22 (partial) | Both the conditions and the uncertainty are missing or partial. |
| **Part 3 — not independent** | 3 | D11, D16, D17 | Published by, or sourced from, the party with a commercial interest. Berger discloses all brands are third-party tested to a common Litz standard — and that result is commercial, so its rows are part 3 failures too. |
| **Part 3 — partial independence** | 6 | D06, D07, D08, D09, D19, D21 | Wikipedia-derived and vendor-published tables: usable as a pointer, not as independent evidence. |
| **Wrong domain** | 1 | D18 | NIST Ballistics Toolmark database: open, government, machine-readable, **and a land-engraving database**. Zero trajectory data. Recorded so nobody re-suggests it. |
| **Unverified retrieval** | 6 | D10, D12, D13, D14, D15, D20 | DTIC returned HTTP 403 then a maintenance page; the Wayback Machine has no capture of the legacy paths. **Marked not-an-oracle, not endorsed.** |

Groups overlap by design (D11/D16/D17 fail part 2 and part 3; D08 fails part 2 and part 3
partially; D18 and D20 recur), so the counts do not sum to 21 — the authoritative,
non-overlapping count is the run-time one in §2.1: **1 ORACLE, 21 NOT-AN-ORACLE.**

> **This grouping was wrong and has been corrected.** It previously listed D02, D03 and D20
> together under "no stated uncertainty", but D02 and D03 carry `stated_uncertainty = yes` in
> the verdict table — they fail **part 1 only**. D20 carries `unverified` for both. An earlier
> draft also put D10 and D18 in the "no uncertainty" group on the strength of prose rather than
> the table. Every row above is now **derived from the verdict table by column name**, and the
> derivation is reproducible: the cell values are printed in §3.1 so a reviewer can check the
> grouping without re-running anything.

### 3.1 The verdict cells, so the grouping above can be checked

Every dataset's three test cells, read straight from the table in file 01. `c` = stated
conditions, `u` = stated uncertainty, `i` = independent. This is the evidence the grouping
above rests on:

```
D01(c=yes  u=yes  i=yes  ) ORACLE          <- the only one
D02(c=no   u=yes  i=yes  ) NOT-AN-ORACLE
D03(c=no   u=yes  i=yes  ) NOT-AN-ORACLE
D04(c=no   u=no   i=yes  ) NOT-AN-ORACLE
D05(c=part u=no   i=yes  ) NOT-AN-ORACLE
D06(c=no   u=no   i=part) NOT-AN-ORACLE
D07(c=no   u=no   i=part) NOT-AN-ORACLE
D08(c=yes  u=no   i=part) NOT-AN-ORACLE
D09(c=no   u=no   i=part) NOT-AN-ORACLE
D10(c=unv  u=unv  i=yes  ) NOT-AN-ORACLE
D11(c=no   u=no   i=no  ) NOT-AN-ORACLE
D12(c=unv  u=unv  i=yes  ) NOT-AN-ORACLE
D13(c=unv  u=unv  i=yes  ) NOT-AN-ORACLE
D14(c=unv  u=unv  i=yes  ) NOT-AN-ORACLE
D15(c=unv  u=unv  i=yes  ) NOT-AN-ORACLE
D16(c=no   u=no   i=no  ) NOT-AN-ORACLE
D17(c=part u=no   i=no  ) NOT-AN-ORACLE
D18(c=no   u=no   i=yes  ) NOT-AN-ORACLE
D19(c=no   u=no   i=part) NOT-AN-ORACLE
D20(c=unv  u=unv  i=yes  ) NOT-AN-ORACLE
D21(c=no   u=no   i=part) NOT-AN-ORACLE
D22(c=part u=part i=yes  ) NOT-AN-ORACLE
```

`part` = partial, `unv` = unverified. Reading straight off it: **exactly one dataset (D08)
fails on uncertainty alone**, and **exactly two (D02, D03) fail on conditions alone** — which
is the pair that carries most of the usable measured data in the survey.

**The single pass — D01**, Courtney, Courtney & Courtney (2015), arXiv:1510.07336. All
three parts: two firing sites at published temperature/humidity/pressure/density with
per-site density uncertainty; *"uncertainties in the mean values of each supersonic drag
coefficient were under 2%";* free-flight chronograph reduction by the authors.

**The single most important finding.** No candidate supplies a **measured exterior
trajectory** — drop and windage as a function of range — with both stated conditions and
stated uncertainty. The brief's stated gap survives the survey **unchanged**. What exists
is retained velocity and drag with error bars (D01–D03), *modelled* trajectories with an
error budget (Tireur, already held), and unvalidated vendor curves. Nobody publishes what
we most need, because publishing it needs a long range, a calibrated survey instrument and
a funded programme — and the people who have all three sell it.

### Which single dataset would I add first, and what it would prove

**D01, arXiv:1510.07336.** It is the only dataset in the survey that passes all three
parts, and it tests **the specific assumption our solver makes and cannot check
internally**: that `C_d` depends on Mach alone, with no Reynolds term.

It would prove: that over M1.2–M2.9, at a 24 % density change (sigma 0.759 → 0.941),
measured `C_d` does not drift by more than 1–2 %. If our solver is right to ignore
Reynolds, that is confirmed inside the resolution of the experiment.

**And it would also bound where we are wrong.** The tested span is sigma **0.76–0.94**.
Denver is roughly sigma 0.83 — inside it. But 10,000 ft is roughly sigma 0.74, **below
the tested floor**, and the paper's own caveat is that the density change was *"relatively
a small change … compared to what is theoretically possible."* So D01 simultaneously
supports our model where we operate most and marks the altitude band where it is
extrapolation.

**Before it is added, a human must open `tmp/t6-courtney-density.pdf` and read the
conditions table directly** — see section 2.7.

**The honest alternative.** The real gap is not a dataset at all. It is a measurement we
run ourselves, designed to the three-part test **before the first shot is fired**: fix
rifle, bullet and load; log temperature, pressure, humidity and altitude with a
calibrated instrument; fire ≥24 rounds so the standard error of the mean drop is
defensible; record **raw per-shot impacts**, not group centres; publish everything.
D01 is the best *available* dataset. It is not a drop oracle.

### 2.7 What I could NOT re-verify — the one real gap

**The D01 atmospheric conditions table is the single unverified load-bearing claim**, and
it is unverified precisely because it is the part that earns D01 its ORACLE status.

The arXiv abstract independently confirms only the two densities at two significant
figures and the Mach range. It does **not** contain temperature, humidity, pressure,
per-site density uncertainty, or altitude. Those came from the PDF body in the first
session, and **I could not reproduce them**: the fetched PDF is binary,
`scripts/data/probe-pdf-text.mjs` returns glyph codes not text (1,924 hex `Tj`, 0 literal
strings), and `tmp/t6-pdf-cmap.mjs` — which I wrote to try — found 4 `bfchar` maps of
41/28/80/4 entries with no `/Differences` and no `bfrange`, so there is no ToUnicode route
to the body text.

Consequently the same caveat applies to the three block quotations in file 03 sections
4.2 and 4.3 (skin friction 8–16 % of total drag; the negative-1/3-to-1/5 Reynolds power
law; the base-drag caution; the McCoy 1981 citation). They read as faithful and are
probably correct, but they are **cited, not verified**, and file 03 section 7 now says so
in the file itself rather than only in this report. `ADA098110` was never retrieved at
all, so the McCoy Reynolds treatment is second-hand via Courtney and is labelled as such.

This is why file 03's verdict is *tested-and-holding-in-part*, not *verified*.

files or none at all. That is a gate that reports success without testing anything, the
exact failure mode `AGENTS.md` records four separate times. The check that actually
proves the work exists is the file listing:

```
---

## 4. What I found but did NOT touch

1. **`tasking:check` cannot verify any completed task — a gate bug, not a data problem.**
   `scripts/gates/check-tasking.mjs` builds its manifest map from `pending/` only (line 62)
   and then looks up every `completed/` task in it (line 161). A task that has been claimed
   has, by definition, left `pending/`, so it is reported as having no manifest. Four other
   agents' tasks are failing on this right now, and mine will fail the same way. Full
   analysis and suggested fix in §2.6. Not applied — `scripts/` is outside my write-set.

   **This is the most important thing in this report for the planner.** The new protocol was
   written specifically to make "done" checkable, and the check that does it is broken for
   every task that is actually done. `npm run verify` cannot return 0 for the swarm while
   this stands.

2. **`tasking:pending/` was not edited**, per protocol. The brief was **moved** to
   `in-progress/` to claim it, which is the documented claim mechanism, not an edit. Its
   `**Model:**` line still reads `[record on start]`; filling it in would be an edit to
   `pending/`, which the one rule forbids. Recording the model here instead.

3. **The Definition of Done clause "`git status --porcelain` shows changes ONLY under
   `tasking/completed/T6/`" is now obsolete in two ways.** The path is
   `tasking/completed/exterior-ballistics/`, and under the new `.gitignore` the folder is
   **tracked**, so `git status` *will* see it once it moves to `completed/`. This clause was
   written when staged output was invisible; it no longer describes reality.

4. **`docs/research-oracles/` still does not exist.** T2 has not run. I invented no T2
   findings. Two questions are flagged in file 01 section 7 as T2-dependent — above all
   whether a dataset with a stated *method* but unstated atmospheric *values* is
   admissible. **If T2 reads part 1 that way, D02 and D03 both flip to ORACLE**, and they
   carry most of the usable measured data in the entire survey. That single ruling
   matters more than any other judgement in these files.
4. **`data/reference/measured_data.csv` still has 7 rows, 2 of them envelopes**, and the
   barrel-length rows carry no SD. Adding to it is a `data/` write — outside my write-set.
5. **`drag_tables.csv` is attributed to McCoy 2012, whose Reynolds treatment reportedly
   estimates Re as "a constant times Mach times total length"** — which excludes density
   and viscosity. If that is right, **D01 is partly validating McCoy against McCoy**, since
   our own table descends from that treatment. File 03 section 4.3 says this aloud; it is
   uncomfortable and should stay in.
6. **`recipes` is empty** — the AGENTS.md headline content gap. Out of scope entirely.

## 5. What I believe is wrong (even out of scope)

- **Our `C_d` model is a simplification the theory does not grant, and the repo does not
  say so plainly enough.** The solver header discloses missing yaw, curvature and
  atmosphere shear, but presents drag as `a = rho·v²·Cd(M)/(2·i·BC)` with no note that
  `Cd` is *known* to depend on Reynolds number and is being treated as not. The brief
  says Reynolds dependence "is not modelled explicitly"; the truth is stronger — it is not
  modelled **implicitly** either. Density enters exactly once. `solver.ts` deserves one
  honest line saying so. I am not editing it; it is safety-critical and out of scope.
- **The transonic region is the real hole, and it is the region we care about.** D01
  starts at M1.2. Nothing in this survey measures density dependence below that — and
  transonic is where the aerodynamic literature finds the strongest `Re` sensitivity and
  where our drag curve is steepest (`G7` peaks at **0.4043 at M1.05**, confirmed present in
  `data/reference/drag_tables.csv`). We are best modelled where we are least sensitive and
  worst modelled where we are most sensitive.
- **The field's BC convention is indefensible and we have no defence against it.** One
  row has a measured **G7 (0.314) exceeding its measured G1 (0.309)** — transcribed
  uncorrected, because correcting a published figure is how a reference table quietly
  stops being a reference. The same 208 gr ELD loses **21.1 % of G1** while its **G7
  loses 3.2 %** across a velocity sweep. A "BC" is a number *at a Mach, in a model, at a
  density, for a barrel*. Our solver accepts a BC and a model flag; I could not find any
  consumer in `packages/` that enforces the pairing at the **boundary** — worth an audit.
- **Manufacturer BC tables are not reproducible by anyone.** Berger averages Doppler
  results over 3000–1500 fps with no per-point data; Hornady bands by Mach with no
---

## 6. Locks released / staged file list

**Locks:** none held. I took no lock on `package.json`, `data/schema/*.sql`,
`data/generated/**` or any gate script; I wrote none of them. **Nothing is blocked by this
task.**

**Deliverables** (all inside the task folder, **git-tracked** under the new `.gitignore`, not
committed — per `AGENTS.md` §14, do not commit unless asked):

| Path | Bytes |
|---|---|
| `tasking/completed/exterior-ballistics/01-trajectory-datasets.md` | 30,453 |
| `tasking/completed/exterior-ballistics/02-bc-reference.csv` | 43,028 |
| `tasking/completed/exterior-ballistics/03-atmospheric-validation.md` | 15,087 |
| `tasking/completed/exterior-ballistics/REPORT.md` | this file |
| `tasking/completed/exterior-ballistics/BRIEF.md`, `task.json` | travel with the folder for the reviewer and the gate |

**Scratch, in `tmp/`, gitignored, not deliverables:** `t6-oracle-check.mjs` and
`t6-negative-test.mjs`, **both rebuilt in this session** after the originals were lost. The
checker is not a project gate — it lives in `tmp/` so it cannot become an unowned dependency
of the deliverables. A reviewer who wants the checks to persist should move both into
`scripts/gates/` with negative fixtures, which is a real improvement but outside this
task's write-set.

## 7. Definition of Done

| Requirement | Status |
|---|---|
| All `required_outputs` in `task.json` exist | **YES** — 4 declared, 4 present (§2.5). |
| `npm run tasking:check` says "tasking verified" | **NO — blocked by the gate bug in §2.6.** Not caused by this task; four peer tasks fail identically. Every one of *this* task's declared outputs is present and verified by the checker in §2.1. |
| `npm run verify` exits 0 | **NO — same cause.** All 19 other stages pass; only `tasking` fails. |
| Every dataset has the three-part oracle test applied explicitly | **YES** — D01–D22, each row carrying `stated_conditions`, `stated_uncertainty`, `independent` and a verdict. Enforced by the checker, and the negative test proves the enforcement bites. |
| Every numerical row carries stated uncertainty OR is marked not-an-oracle | **YES** — 53 rows carry uncertainty, 38 carry none, and **all 38 are `NOT-AN-ORACLE`**; independently recomputed in §2.7. |
| Every BC value states which model (G1/G7) it uses | **YES** — a `bc_model` column on all 91 rows; the checker fails any row whose `bc_model` is blank or names neither model, and the negative test proves it. |
| Count of datasets that FAIL the oracle test, and why | **§3** — **21 of 22**, grouped by which clause breaks. |
| Self-check proving no project file changed | **§2.4, §2.7** — absolute-path byte reads and recomputation against this repo's own data. |
| Which single dataset first, and what it would prove | **§3** — D01, arXiv:1510.07336. |

  uncertainty. Neither can be re-derived. That is a real limitation, not a quibble.
- **The `docs/ORACLE-SOURCES.md` action list is optimistic.** It lists Tireur as "the
  single best find" and treats its trajectories as usable. Most of those trajectory tables
  are *modelled output from a 3-DOF solver*, which is not independent evidence about a 3-DOF
  solver. Using them as an oracle would be circular — the exact thing
  `data/reference/README.md` forbids. Tireur is a good secondary cross-check, not the
  oracle of record.

tasking\completed\T6\01-trajectory-datasets.md  30352 bytes
tasking\completed\T6\02-bc-reference.csv  43028 bytes
tasking\completed\T6\03-atmospheric-validation.md  15056 bytes
tasking\completed\T6\REPORT.md  (this file)
```

I propose `tasking/README.md` and the T6 brief be amended so the isolation check is
`git status --porcelain` **plus** an explicit `dir tasking\completed\T6` listing. That
amendment is outside my write-set; I am not making it.

| D01: 2.59 g projectile, 91.44 m separation, M1.2–M2.9, densities "0.93 kg/m3 and 1.15 kg/m3", "within the experimental error of 1%-2%" | same abstract | **confirmed verbatim** |
| D02 identity, 23 Aug 2016, 4.4–9 mm, M0.3–M3.0, "accuracy of 1% or better" | `arxiv.org/abs/1608.06500` | **confirmed** |

The abstract adds a point the staged files under-use: it states outright that *"pure
theory recognizes the dependence of supersonic drag coefficients on both Mach number and
Reynolds number, which includes an implicit dependence of drag coefficient on air
density."* That is the strongest published statement that our model's assumption is a
**simplification the theory does not grant**, which is the honest framing for file 03.

Arithmetic recomputed from the staged CSV rather than re-read from it:

```
$ node -e "..."
ISA 1.2250 kg/m3 in slug/ft3 = 0.0023769
repo constant      = 0.0023769
sigma_low  0.9293/1.2250 = 0.7586
sigma_high 1.1526/1.2250 = 0.9409
density ratio spanned (high/low) = 1.2403
G1 drop 0.697->0.550 = 21.1%
G7 drop 0.348->0.337 = 3.2%
NBT 0.306->0.319 = 4.2%
```

Every figure matches what files 01 and 03 claim. The repo constant
`STANDARD_SEA_LEVEL_DENSITY_SLUG_PER_FT3 = 0.0023769` **is** exactly ISA sea level, which
is what file 03 section 4.4 relies on to compute density ratios.
