# REPORT — ballistics-oracles (task T2)

**Agent:** scout-math. **Status:** COMPLETE.
**Write-set:** `tasking/completed/ballistics-oracles/` only.
**Model:** default model, fresh instance for this task.

> Research only. `packages/ballistics-core/` is safety-critical and was **read only**.
> No solver behaviour was changed, and none of these findings has been applied.

---

## 1. What changed

Five files, all inside my own output folder:

| File | Substance |
|---|---|
| `REPORT.md` | This report (a declared output; the earlier session produced no report) |
| `docs/research-oracles/01-methods-found.md` | 4 verification methods — equations, stated uncertainty, independence assessment |
| `docs/research-oracles/02-candidate-datasets.md` | 6 candidate datasets, each through the three-part oracle test |
| `docs/research-oracles/03-solver-gap-analysis.md` | AGREE / DISAGREE / SILENT, quoting the code |
| `docs/research-oracles/README.md` | Directory index |

**Nothing outside this folder was touched.** See §2.

### The headline finding

**The owner's "3 methods that reach the same conclusion" is NOT achievable today.
Two are.** The three papers the brief nominated — arXiv:1510.07336, arXiv:1503.05504
and arXiv:1309.5039 — are **not three methods**. They are three papers from **one
research group** (BTG Research), describing **one measurement technique** (free-
flight drag by the work-energy inverse) on **the same hardware class** (LED-skyscreen
optical chronographs) at **the same two ranges**.

They corroborate each other the way three reports from one lab corroborate each
other. If the work-energy inverse has a blind spot, all three share it.

What genuinely exists is two independent axes:

- **Published aerodynamic tabulation** (McCoy 2012, cross-verified three ways) —
  different institution, different derivation lineage, tabulated not measured.
- **Primary free-flight measurement** (BTG) — measured, never reads a drag table.

arXiv:1608.06500 (Doppler) adds *instrument* independence but **not** independence of
judgement: same group again.

---

## 2. What I verified, and how

### Write-set isolation

```
=== git status --porcelain ===
?? tasking/in-progress/ballistics-oracles/
=== END ===
```

Filtered for anything outside my folder: **empty**. No file under `packages/`,
`data/`, `scripts/`, `docs/` or `package.json` was created, edited or deleted.
`pending/` was not written to — I only *moved* my own folder out of it, which is
the documented claim mechanism.

### Gates

| Gate | Result |
|---|---|
| `npm run verify` | **exit 0**, unchanged, before and after |
| `npm run tasking:check` | **exit 0** — "tasking verified" |
| Encoding of my 5 files | UTF-8, no BOM, LF, 0 CRLF (measured per file) |

### Negative tests

**(a) Gate-failure test.** I appended a reference to a non-existent path
`packages/ballistics-core/src/nonexistent-file.ts` to my README:

```
FAIL tasking/.../README.md:63  broken-path
     `packages/ballistics-core/src/nonexistent-file.ts` does not exist.
docs FAILED          exit=1
```

Correctly caught, for the correct reason. Reverted.

**(b) The negative test that caught me — recorded because it matters.** My first
attempt to test the honesty claim (flipping "Two are" → "Three are") exited 1, which
looked like the gate agreeing with me. **It was not.** Inspecting the log showed the
failure was `mojibake — 6 damaged byte sequence(s)`, caused by my own PowerShell
rewrite, not by the overclaim. A gate reporting failure for the wrong reason is the
`AGENTS.md` trap *"a check that passes while producing wrong output"*, in its mirror
form. I restored from a byte-verified backup and redid the test properly.

**(c) The honesty negative test the brief actually asks for.** See §4.

### Claims re-verified against this repo, not carried over on trust

| Claim | Method | Result |
|---|---|---|
| No Reynolds model | `Select-String 'Reynolds'` across `packages/**/*.ts` | **0 matches** |
| No yaw model | `solver.ts:102` self-declared | confirmed |
| `measured_data.csv` = 7 rows | counted | **7** |
| 2 rows NOT an oracle | counted | **2** |
| 3 rows "SD not stated" | counted | **3** |
| `densityRatio()` has no humidity term | read lines 147–154 | confirmed |

So `measured_data.csv` holds **one** measurement-grade oracle row, not seven.

---

## 3. What I found but did NOT touch

- **`data/reference/measured_data.csv`** — three rows carry "±15 fps", a tolerance
  **we imposed**, not one the source published. Presenting it as sourced would
  misrepresent a placeholder as a measurement. Changing it is a data task, not mine.
- **`docs/ORACLE-SOURCES.md` §5** calls the CI cross-check the highest-value
  remaining item. Agreed — but it would anchor a CI oracle to **one research group's
  preprint figures**, not a standard. That dependency risk should be recorded before
  task `A1` builds on it.
- **`densityRatio()`** takes no humidity term. `densityRatioFromPressure()` and
  `humidityDensityCorrection()` exist, but humidity is caller-dependent: two shooters
  at the same altitude and temperature can get different answers.

**Reassuring, contrary to expectation:** the Reynolds-number gap the brief expected
is **bounded under 1%** by the paper's own arithmetic (skin friction 8–16% of total
drag; Re exponents −1/3 to −1/5; a 25% Re change implies 5–8% change in skin
friction). This is a *bound*, not a proof — but it demotes the gap from "open risk"
to "document the bound".

---

## 4. The honesty negative test the brief asked for

### 4a. Verdict on "3 truly independent methods"

**Not achievable today. Two are defensible. Saying three would be overclaiming.**

Naming the sharing precisely, as the brief required:

- **arXiv:1510.07336, arXiv:1503.05504, arXiv:1309.5039 are NOT independent of each
  other.** All BTG Research. The first two share all three authors; the third shares
  two of them. All use the same work-energy inverse, the same chronograph class, and
  the same two ranges. Three papers, one method, one laboratory.
- **arXiv:1608.06500** is the same group again — different sensor, same judgement.
- **The McCoy tables ARE independent**, and **are independent of the BTG
  measurements.** That pair is the real claim.

Honest formulation: *one published aerodynamic tabulation and one independent primary
measurement, which agree.* That is a stronger claim than three inflated ones.

**What would make three real:** a measurement from a group with no connection to BTG
Research, carrying stated conditions and a stated error bar.

### 4b. Where I was tempted, and what I did instead

**The temptation:** the per-Mach drag coefficients in arXiv:1510.07336. The brief
asked for "the full velocity/density/drag table". They exist — but only in **Figure
2**, not a table. The text gives two endpoints (≈0.54 at M1.2, ≈0.33 at M2.9) and
quadratic fits (R² = 0.9618 low density, 0.9521 high density), nothing between.

I could have read approximate values off the figure. They would have looked
plausible, matched our table's shape, and gone straight into the report.

**What I did instead: left every intermediate value EMPTY**, and said so in the
deliverable. A digitised figure reading carries no error bar, so it can never fail a
comparison — which is precisely what makes it *worse* than blank, not better.

Three smaller blanks, same rule:

- **Per-point uncertainties** on the BC-vs-stability tables: the authors describe the
  error bars as "relatively large" but do not tabulate them. Left EMPTY.
- **Chronograph-separation error**: never stated. The <2% is the uncertainty in the
  resulting `C_d`, not a decomposition. Left EMPTY.
- **Peer-review status**: all four papers are arXiv preprints
  (`physics.pop-ph` / `physics.gen-ph`). The brief's phrase "peer-reviewed work"
  should not be read as verified. I did not verify journal peer review for any of
  them, and recorded them as preprints.

---

## 5. What I believe is wrong

**The brief's framing is the problem, not the papers.** Counting one lab's three
papers as three confirmations would poison a safety-critical claim — the exact
failure this repository exists to prevent. Two defensible methods is the honest
answer, and it is stronger for being smaller.

**The highest-priority technical finding:** the solver has **no representation of
bullet stability at all**. No yaw model, and **twist rate is not a solver input** —
`SolveRequest` takes weight, diameter and BCs, nothing about stability. So a bullet
fired marginally stable and the same bullet fired well-stabilised produce
**identical output**, when measurement (arXiv:1309.5039) puts the BC difference at up
to ~36% (SBK: 0.271 down to 0.174 as Sg falls to 1.0), with onset near Sg ≈ 1.25.

The defect is not only the missing physics. **The solver emits no warning.** A
confident-looking number for a marginal load is worse than an error. Note that
`bullet_reference.csv` already records a `twist` column and
`apps/ballistics/screens/TransonicStabilityScreen.jsx` already computes Sg — the
information exists in the app and is never plumbed to the solver.

**I did not fix this.** A yaw model is a research project, and
`packages/ballistics-core/` is outside my write-set. Recorded for a later,
separately-gated task.

**Single highest-value dataset to add next:** arXiv:1510.07336 Table 1 — the two
measured air densities with their **propagated uncertainties**
(0.9293 ± 0.0016 and 1.1526 ± 0.0003 kg/m³), full environmental conditions, and the
density-proportionality result. It is the only source found that tests, by
measurement and with **no drag model**, the assumption our entire drag formulation
rests on.

Its honest cost: the per-Mach `C_d` values are figure-only, so the usable payload is
the *density-independence* result and the two densities — not a per-Mach curve to
diff against our tables.

---

## 6. For the reviewer

- **Five declared outputs, all present** (this report plus four docs).
- **Every cited source has a resolvable identifier** — arXiv IDs with DOIs for all
  four papers; ISBN for McCoy. Where I could not verify something, it is recorded as
  unverified rather than asserted.
- **Every number carries units and uncertainty**, or is explicitly marked EMPTY.
- **Nothing was applied.** These are findings, not patches. Merging them into
  `docs/research-oracles/` is a review-time decision, not mine.
- **One gate asymmetry worth your judgement**, not a blocker: `check-oracle.mjs`
  requires an `uncertainty` column only for `measured_data.csv`, not for
  `drag_tables.csv`. That is deliberate and I think correct — but it means the
  730-row table states no measurement error bar at all, since `cross-source-3-way`
  is agreement between tabulations rather than a measurement-derived uncertainty.
  Worth recording explicitly rather than leaving implicit.