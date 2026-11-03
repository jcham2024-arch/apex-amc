# SUMMARY — interior-ballistics

**Task:** Interior ballistics: powder characterisation and load synthesis.
**Status:** COMPLETE — all 7 declared outputs present in this folder.
**Agent:** scout-math. **Date:** 10 Feb 2026.
**Write-set:** `tasking/completed/interior-ballistics/` only. No main-tree edits.

---

## The answer in one paragraph

**The owner's load-synthesis goal is not achievable from published data, and the
blocker is not cost.** No manufacturer publishes a physical burn rate, pressure
exponent, force curve, heat of explosion, or loading density for any reloading
powder we hold — every consumer-facing figure is a *relative ordering*, and
Vihtavuori's guide states its chart is "not to be used for developing loads." The
peer-reviewed literature has all of these quantities, but only for laboratory and
rocket propellants. **What is achievable is an interpolation engine over published
load tables, with mandatory EMPTY on an unresolvable match** — which is exactly what
Berger and Hornady do by hand. A genuine interior-ballistics calculator is
achievable, but only by *measuring* powder constants in a pressure-rated closed
vessel, not by inferring them.

---

## What was produced

| File | Substance |
|---|---|
| `REPORT.md` | Five-part summary per `.clinerules` §8 |
| `KNOWLEDGE.md` | Durable cross-task findings — the three things worth knowing cold |
| `01-burning-rate-sources.md` | Every source, with licence and redistribution permission |
| `02-powder-properties.csv` | 16 cols, 4 rows — honest emptiness (see below) |
| `03-load-synthesis-literature.md` | Equations, required inputs, why inference fails |
| `04-equivalence-rules.md` | Manufacturer rules, verbatim, with licences |
| `05-feasibility-verdict.md` | Verdict in the first paragraph, per the brief |
| `NOTES.md` | Two blockers found, for the planner |

---

## Key numbers (measured, not quoted)

```
powders.json      169 rows; burn_rate_class 59/169; relative_burn_rate_position 0/169
                  burn_rate / pressure_exponent / force_curve / density: ABSENT from schema
burn rate ranks   22 rows, column_total=22  -> within-brand rank, not a rate
cartridge_pressures  231 rows
cartridge_specs      229 rows; all six dimensional columns 0/229
```

**The quantitative powder columns are absent from the schema, not empty.** Filling
them is a schema change, not a data fill — strictly serial.

The staged CSV is **0/4** for absolute burn rate, pressure exponent, force curve and
geometry; **1/4** for density — and that one is a *historical* Hodgdon bulk-density
figure for a discontinued product. **165 of 169 powders are absent, deliberately:**
no source publishes a physical property for them.

---

## Three things that will change how another agent works

1. **Relative ranks from different brands' charts are not comparable.** We hold 22
   Vihtavuori ranks; Hodgdon publishes a separate ordinal chart that disagrees. Never
   merge them into one scale. This is the external evidence behind an existing rule
   in `docs/CONVENTIONS.md`.

2. **Fitting powder constants from load data is ill-posed, not merely noisy.**
   Velocity and pressure are smooth functions of `a`, `n` and charge weight
   *together*, so many triples fit the same observations. Extrapolating to an
   unlisted projectile is unbounded in the direction that matters. Do not build a
   charge-weight inference engine.

3. **The refusal must be a designed output.** Hornady currently carries an erratum:
   one wrong powder name in a printed 12th-edition table could produce dangerous
   pressures. Our resolver must be able to say "I am not sure this is the same
   thing" and return EMPTY. An empty string that looks like a bug is a safety defect.

---

## Constraints honoured

- **No charge weight appears anywhere**, verified by three grep patterns, all
  returning nothing. The prohibition was not the binding constraint — the missing
  data was. Without the prohibition the deliverable would still have been empty.
- **No invented values.** One self-caught failure: unsourced `geometry` values were
  written from background knowledge and removed.
- **No main-tree edits.** The `pending/` deletions in `git status` are the claim
  move, which is the protocol's lock.

---

## Gate status — read this

`npm run verify` **exits 1**, on the `tasking:check` stage alone. **18 of 19 stages
pass.** The failure is **not** caused by this task and affects three other agents'
completed tasks identically.

`scripts/gates/check-tasking.mjs` has a **missing closing brace** on its manifest
loop, swallowed by a later loop, so the gate runs once and has **never checked more
than one task**. A stray `}` at EOF balances it (`open=58 close=58`), so every syntax
gate passes. Introduced in commit `a939ecd`.

This gate exists because 12 agents once reported finished and wrote nothing, and
nothing on disk could tell the difference. **As shipped it would not have caught
that failure either.** Full diagnosis and tested patch in `NOTES.md`; not applied,
because `scripts/` is outside this write-set.

**Second defect, same brief family:** `BRIEF.md` for this task is corrupted —
sections assembled out of order, §3 holding 1 of 4 anchors, §5 cut mid-sentence,
with items 2–5 appended after §7. Reported, not repaired (`pending/` is read-only to
agents). **Second occurrence on this brief** — it should be regenerated, not
hand-edited again.

---

## Recommended next actions

1. Fix `check-tasking.mjs` — two changes, both required. Until then the swarm has no
   working "is it actually done" gate.
2. Regenerate the T-series briefs from a source; no generator exists for them.
3. Close the 0/229 cartridge dimensions regardless of powder data — it blocks *any*
   interior ballistics.
4. Treat the empty `recipes` table as the real blocker for a load feature.
5. Decide the licence posture on load tables. Hornady **sells** its data; this is a
   commercial decision with legal exposure, not an engineering one.