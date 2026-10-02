# SUMMARY — ballistics-oracles

One-page summary. The full five-part report is in [`REPORT.md`](REPORT.md); the
research deliverables are in [`docs/research-oracles/`](docs/research-oracles/).

| | |
|---|---|
| **Task** | ballistics-oracles (T2) |
| **Agent** | scout-math |
| **Status** | Complete — all 5 declared outputs on disk |
| **Write-set** | `tasking/completed/ballistics-oracles/` only |
| **Touched solver?** | **No.** `packages/ballistics-core/` read only |

---

## The answer to the owner's question

> *"3 methods that reach the same conclusion, backed by hard science."*

**Two are defensible. Three are not — and saying three would overclaim.**

The three papers nominated in the brief are **not three methods**. All three are
**BTG Research**, describing **one** technique (free-flight drag by the work-energy
inverse) using **the same** chronograph class at **the same two ranges**:

| Paper | What it actually is |
|---|---|
| arXiv:1510.07336 | Drag ∝ air density, measured at two densities |
| arXiv:1503.05504 | Error propagation for that same method |
| arXiv:1309.5039 | Gyroscopic stability as a drag observable |

Same authors, same apparatus, same method. If the method has a blind spot, all three
share it. Three papers ≠ three independent confirmations.

**What genuinely exists is two independent axes:**

- **Published tabulation** (McCoy 2012, cross-verified three ways) — different
  institution, different derivation lineage.
- **Primary measurement** (BTG free-flight) — measured; never reads a drag table.

These two are independent **of each other**, and they agree. That is a real, strong
two-way confirmation — and stronger for being smaller than three inflated ones.

---

## Key findings

1. **Density proportionality is confirmed.** arXiv:1510.07336 tested drag ∝ air
   density across 0.9293 vs 1.1526 kg/m³ and found no significant difference in
   `C_d` within 1–2%. This validates the assumption our whole drag model rests on —
   and those densities are our real altitude regime.

2. **The solver has no representation of bullet stability at all.** No yaw model,
   and **twist rate is not a solver input**. A marginal load and a stable load
   produce *identical* output, when measurement puts the BC difference at up to
   **~36%** (SBK: 0.271 → 0.174 as Sg falls to 1.0, onset near Sg ≈ 1.25). Worse,
   **it emits no warning**. Not fixed here — research, and outside my write-set.

3. **The expected Reynolds-number gap is bounded, not open.** The paper's own
   arithmetic puts the effect **under 1%** on `C_d`. Demote from "risk" to
   "document the bound".

4. **`measured_data.csv` holds ONE measurement-grade oracle row, not seven.** Three
   carry a ±15 fps tolerance **we imposed**, not one the source published.

5. **Doppler claim verified with a correction.** <$600 is right; accuracy is
   "1% or better" **but only conditionally** (sufficient signal-to-noise *and* low
   trial-to-trial variation). The brief's "1-2%" dropped the conditions, which is
   exactly where an unstable bullet falls.

---

## Honesty record

**Where I was tempted:** the per-Mach `C_d` values in arXiv:1510.07336. They exist —
but only in **Figure 2**, not a table. I could have digitised them; they would have
looked plausible and matched our table.

**What I did:** left every intermediate value **EMPTY** and said so. A figure reading
has no error bar, so it can never fail a comparison — which makes it *worse* than
blank. Same for the untabulated per-point uncertainties and the unstated
chronograph error.

**Also recorded as unverified rather than asserted:** all four papers are arXiv
**preprints**. The brief's "peer-reviewed" should not be read as verified.

---

## Highest-value next dataset

**arXiv:1510.07336 Table 1** — two measured air densities with propagated
uncertainties (0.9293 ± 0.0016, 1.1526 ± 0.0003 kg/m³), full conditions. The only
source found that tests a load-bearing assumption by measurement with **no drag
model**. Honest cost: per-Mach values are figure-only, so the payload is the
*density-independence* result, not a per-Mach curve.