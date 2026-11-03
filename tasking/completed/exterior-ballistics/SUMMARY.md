# SUMMARY — exterior-ballistics (brief T6)

**Status:** complete. **Outputs:** 4 of 4 declared. **Agent:** scout-data sub-agent.
**Full detail:** [`REPORT.md`](REPORT.md). **Findings for other agents:** [`NOTES.md`](NOTES.md).

---

## What this task was

Find external, citable data that could verify the exterior ballistics solver, and gather
projectile BC reference data. Research only — `packages/ballistics-core/` was read, never
written.

## The headline finding

> **21 of 22 candidate datasets FAIL the three-part oracle test. Exactly one passes: D01.**

The test, from `data/reference/README.md` — stated test conditions, stated uncertainty,
independent derivation. All three, or the row is not an oracle.

**Why so few pass is the real result.** The obstacle is almost never bad measurement. It is
that nobody publishes their conditions. A paper can give first-rate Doppler data with a
stated 1% accuracy and still be unusable as an oracle because it never prints the temperature,
pressure and humidity it measured at.

| Output | What it holds |
|---|---|
| `01-trajectory-datasets.md` | 22 candidates D01–D22, each with URL, licence, machine-readability and all three test cells |
| `02-bc-reference.csv` | 91 rows × 23 cols; every BC names its model (G1/G7); separate uncertainty columns |
| `03-atmospheric-validation.md` | Evidence on density-independence of `C_d`, read against what `solver.ts` actually does |

## The gap that survives this survey

**No measured exterior trajectory — drop and windage as a function of range — with both
stated conditions and stated uncertainty exists in the public domain.** We hold raw muzzle
velocities and zero point-of-impact data.

What exists is retained velocity and drag at range with error bars (D01, D02, D03); modelled
## Two things a reviewer must act on

1. **D01 is the only ORACLE, and its conditions table is cited, not verified.** The arXiv
   abstract independently confirms its identity, density span, Mach span and 1–2% claim. The
   full atmospheric conditions came from the PDF body and **could not be re-extracted**. Before
   that row enters `data/reference/`, a human must open the PDF and read Table 1 directly.

2. **D02 and D03 hinge on a T2 ruling.** Both carry `stated_uncertainty = yes` and fail
   **part 1 only** — they state their measurement method but not the values. If T2 rules that a
   stated method suffices, **both flip to ORACLE**, and they carry most of the usable measured
   data in the survey. That single ruling matters more than any other judgement here.

## Findings that go beyond the brief

- **Our `C_d` model is a simplification the theory does not grant.** `solver.ts` treats `Cd`
  as a function of Mach alone. The literature is explicit that it depends on Reynolds number,
  which depends on density. The solver discloses missing yaw and curvature but not this.
- **The transonic region is the real hole, and it is where we care most.** D01 starts at M1.2.
  Nothing in the survey measures density dependence below that — and transonic is where `Re`
  sensitivity is strongest and our drag curve is steepest (`G7` peaks at **0.4043 at M1.05**).
  We are best modelled where we are least sensitive.
- **The field's BC convention is indefensible and we have no defence against it.** One row has
  a measured G7 (0.314) *exceeding* its measured G1 (0.309) — transcribed uncorrected, because
  correcting a published figure is how a reference stops being a reference. The same 208 gr ELD
  loses **21.09% of G1** but only **3.16% of G7** across a velocity sweep. A BC is a number *at
  a Mach, in a model, at a density*. Worth auditing whether any consumer enforces the G1/G7
  pairing at the boundary.
- **Manufacturer BC tables are not reproducible by anyone.** Berger averages over 3000–1500 fps
  with no per-point data; Hornady bands by Mach with no raw data.

## Verification

Counts are derived at run time from the tables, never asserted in prose.

- Oracle checker: 22 surveyed, 1 ORACLE, 21 NOT-AN-ORACLE, 91 rows, 53 with uncertainty,
  38 without — **all 38 NOT-AN-ORACLE** → `CHECK_EXIT=0`
- Negative test: **6 cases, control passes, every broken variant rejected** → `NEG_EXIT=0`
- Isolation: no file written outside this folder and `tmp/`

**The negative test earned its place twice.** It caught a rule I had added — "bc_g1 must be
≥ bc_g7" — which **failed on correct data**: the SST 125 gr row is a genuine published figure,
transcribed as printed. My rule was false and would have rejected valid data. It was removed,
not weakened, with the reasoning left in the script. It also caught two cases in my own
harness that silently mutated nothing and exited 0.

## Honest limitation

The oracle checker and negative test live in gitignored `tmp/`, so they do not survive a
session. They were **rebuilt from scratch in the final session** after the originals were lost.
A reviewer wanting these checks to persist should move both into `scripts/gates/` with negative
fixtures — a real improvement, outside this task's write-set.

## The one dataset to add first

**D01, arXiv:1510.07336.** It would prove that across a 24% density change (σ 0.759 → 0.941),
measured `C_d` over M1.2–M2.9 does not drift more than 1–2% — confirming, inside the
resolution of the experiment, that our solver is right to ignore Reynolds where we operate
most. It simultaneously **bounds where we are wrong**: the tested span is σ 0.76–0.94, and
10,000 ft is roughly σ 0.74, *below* the tested floor. Denver (σ ≈ 0.83) is inside it.

The honest answer is that the real gap is not a dataset at all — it is a measurement we run
ourselves, designed to the three-part test before the first shot: fixed rifle, bullet and load;
calibrated logging of temperature, pressure, humidity and altitude; ≥24 rounds so the standard
error of mean drop is defensible; **raw per-shot impacts**, not group centres; publish
everything.
trajectories with an error budget (Tireur, already held); and unvalidated vendor curves
(Hornady, Barnes, Lapua, Berger, Litz).

Nobody publishes the thing we most need, because publishing it requires a long range, a
calibrated survey instrument and a funded programme — and the people who have all three sell
the result.