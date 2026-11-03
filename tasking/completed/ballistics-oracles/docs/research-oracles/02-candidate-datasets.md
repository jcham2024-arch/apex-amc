# Candidate datasets, and the three-part oracle test applied

Task T2, deliverable 2.

Each dataset below is put through the test defined in
[`../../data/reference/README.md`](../../data/reference/README.md):

1. **Stated test conditions** — barrel length, temperature, pressure, altitude.
2. **Stated uncertainty** — an SD, an ES, or an explicit tolerance.
3. **Independent derivation** — not produced by our own code or assumptions.

A dataset failing any part is marked **NOT AN ORACLE**, with the reason. This is
the discipline that matters: **a dataset with no stated error bar cannot fail a
comparison, so when it agrees it proves nothing.**

Verdict key: **ORACLE** / **PARTIAL (n of 3)** / **NOT AN ORACLE**

---

## D1. Two-density drag experiment, arXiv:1510.07336 — **ORACLE (3 of 3)**

| Property | Value |
|---|---|
| Source table | Table 1, environmental conditions |
| Conditions | Temp, humidity, pressure at both sites |
| Altitudes | 0 m and 1981 m |
| Densities | 0.9293 ± 0.0016 and 1.1526 ± 0.0003 kg/m³ |
| Uncertainty | Propagated from T, P, humidity; <2% on each mean `C_d` |
| Independent? | **Yes.** Measured by chronograph; never reads a drag table |
| Licence | arXiv non-exclusive distribution |

**Passes all three.** This is the strongest candidate found. The two-density design
is what makes it an oracle *for us specifically*: it tests the
drag-is-proportional-to-density assumption that our entire drag model rests on,
using data we did not produce.

**Condition to satisfy before it can fail us:** our solver must be driven with the
*same* measured density and speed of sound, not an ISA sea-level default. Both
speeds of sound are stated (347.1 and 348.7 m/s), so the Mach index is reproducible.
This is exactly the "manufacture agreement" hazard that
[`../../scripts/gates/check-oracle.mjs`](../../scripts/gates/check-oracle.mjs)
refuses to walk into by not running the full solver yet.

**What still blocks it:** the per-Mach `C_d` values are in a figure, not a table. To
use this as a per-Mach oracle we would need the authors' numeric data, or a
digitisation we would then have to label as derived. Until then it constrains the
*density-scaling assumption* but not the shape of the `C_d(M)` curve.

---

## D2. Airgun-pellet BC table, arXiv:1503.05504 Appendix Table 1 — **PARTIAL (2 of 3)**

Eight projectiles, G1 BC with stated uncertainty and `v_i`. Passes parts 1
(conditions recorded via Kestrel 4500) and 2 (per-row uncertainty, e.g. Avanti BB
0.01122 ± 0.00008).

**Fails part 3 — independent derivation.** The BCs were computed by entering
near/far velocities and environmental conditions into the **JBM Ballistics
Calculator**. That is an external implementation, so it is not *our* code, but it is
a calculator rather than a raw measurement, and the reported quantity is a derived
BC rather than an observed one.

Also out of scope: these are airgun pellets and BBs (G1 BC ~0.003–0.022), three
orders of magnitude from our rifle regime. Useful as a methodology template, not as
a rifle validation.

---

## D3. BC vs gyroscopic stability, arXiv:1309.5039 — **NOT AN ORACLE (2 of 3)**

Three bullets, 28 BC points with Sg, given in full in
[`01-methods-found.md`](01-methods-found.md).

**Fails part 2 — stated uncertainty.** The values are figure points with "relatively
large error bars" that the authors decline to tabulate. No number here can fail.

**Also fails part 3, more subtly:** BCs were computed via the JBM calculator, and
the study varies velocity and stability together, so the trend is confounded (Litz
data cited in the paper show 3–17% BC reduction from velocity alone across
2500→1500 fps).

**Still valuable, for a different purpose:** it bounds the yaw error our point-mass
solver ignores. That is a *limit document*, not an oracle row.

---

## D4. Published drag tables, McCoy via Tireur Table 5.2 — **ORACLE (3 of 3), already held**

730 rows, 9 models, Mach 0–5, in
[`../../data/reference/drag_tables.csv`](../../data/reference/drag_tables.csv).

| Property | Value |
|---|---|
| Uncertainty | **Stated as agreement, not as an error bar** |
| Independent? | Yes — McCoy lineage, plus js-ballistics and py_ballistics |
| Licence | Citation of record; we hold the transcription |

**This is the caveat, and it is the most important one in this file.** The rows pass
"three independent implementations agree exactly at 15 comparable Mach points", but
`cross-source-3-way` is **agreement between tabulations, not a measurement-derived
error bar.** Under a strict reading of part 2, this file states no uncertainty at
all.

Our own gate does not require one — it only requires `source` and `source_ref` for
this file, and requires `uncertainty` solely for `measured_data.csv`. That asymmetry
is deliberate and I think correct, but it should be stated rather than left
implicit: **we currently have one measurement-grade oracle axis (D1) and one
tabulation-grade axis (D4).**

---

## D5. Measured muzzle velocities, `measured_data.csv` — **PARTIAL, and thin**

7 rows. Two are explicitly labelled NOT oracle rows (load-data envelopes, "range,
not a measurement"). Three carry "SD not stated; treat as ±15 fps". **One** is a
full oracle row: 6mm BR Berger 105gr Hybrid, 2920.9 fps, ES 14 fps, SD 3.9 fps over
a 20-round string, Ottawa 82 °F, 29.75 inHg, with the raw string recorded.

**So the file's name overstates its contents: it holds exactly one measurement-grade
oracle row.** Confirmed by reading it, not assumed.

The ±15 fps on the three barrel-length rows is a convention we imposed, not a figure
Tireur published. Recording it as though sourced would misrepresent a placeholder as
a measurement. It should be marked estimated, and it is a candidate for extraction
from the archived SAAMI Z299 PDFs instead.

---

## D6. Archived SAAMI Z299 proof-load velocities — **NOT YET ASSESSED**

Held on disk per [`../../docs/ORACLE-SOURCES.md`](../../docs/ORACLE-SOURCES.md) §5,
still unextracted. Proof-load velocities with stated test barrels are the highest
primary quality data we hold.

**I did not open them.** Doing so is task B2's write-set and outside mine. Recorded
here as the top candidate for the next addition, and specifically as a source that
could supply real uncertainty rather than an imposed ±15 fps.

---

## Ranking for the next addition

| Rank | Dataset | Why |
|---|---|---|
| 1 | **D1** two-density experiment | Only measurement-grade, model-free test of a load-bearing assumption |
| 2 | **D6** SAAMI Z299 | Primary, on disk, stated barrels |
| 3 | **D5** replace imposed ±15 fps | Turns 3 placeholder rows into real ones |
| 4 | **D2** pellet BCs | Methodology template only |

**Not recommended:** D3 as oracle rows. Its real contribution is the yaw error bound.

---

## The single highest-value addition

**D1, and specifically its Table 1 environmental data plus the density-proportionality
result.**

It is the only source found that tests, with measurement and no drag model, the one
physical assumption underneath our entire drag formulation: that drag force is
proportional to air density. Everything else found is either a tabulation we already
hold (D4), a calculator-derived number (D2, D3), or a placeholder we imposed
ourselves (D5).

The honest cost: the per-Mach `C_d` values are figure-only, so the immediate usable
payload is the *density-independence* result and the two measured densities with
their propagated error bars — not a per-Mach curve to diff against our tables.