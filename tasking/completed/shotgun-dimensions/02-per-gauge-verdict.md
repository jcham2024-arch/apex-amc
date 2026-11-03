# 02 — Per-gauge verdict

Task `shotgun-dimensions`. What exists for each gauge, and what each source
permits.

**No dimensional value and no chamber safety limit is recorded anywhere in this
task.** The brief prohibits both, and `01-source-availability.csv` asserts
`value_recorded_here = none` on every row.

---

## The 8 gauges

Read from CIP's own **Tab VII — Shot cartridges** index on 2026-10-02, which lists
**56 entries** across the gauges below. Designations are recorded as CIP publishes
them (`12/70`, `410/65`) because that is the discovery key to the sheet — not as
a recommendation about which chamber length to record.

| Gauge | CIP Tab VII? | Designations listed | SAAMI free drawing? |
|---|---|---|---|
| **12 Gauge** | **yes** | 12/67, 12/70, 12/73, 12/76, 12/89 + others | **yes** — "12 Gauge 1¾"" |
| 16 Gauge | yes | 16/65, 16/67, 16/70, 16/76 | revision — "16 ga. 2¾"" |
| **18 Gauge** | **no** | — | no |
| 20 Gauge | yes | 20/58, 20/65, 20/67, 20/70, 20/76, 20/89 | no |
| 24 Gauge | yes | 24/63.5, 24/65, 24/70 | no |
| **28 Gauge** | **yes** | 28/58.5, 28/63.5, 28/65, 28/70, 28/76 | **yes** — "28 Gauge 3″" |
| **.410 Bore** | **yes** | 410/50.7, 410/63.5, 410/65, 410/70, 410/73, 410/76 | no |
| .32 Gauge | yes | 32/50.7, 32/60, 32/63.5, 32/65, 32/70, + RUS | no |

**7 of 8 gauges have a CIP dimensional sheet. That is not a small finding** — it
directly contradicts the impression left by `cartridge-dimensions`, which
reported CIP as addressing only ~11 cartridges overall with shotgun barely
represented. **Shotgun is CIP's strongest area**, because Tab VII is a
systematic European proof-testing catalogue for shotshells, whereas the rimfire
and classic US cartridges that dominate our index are simply absent.

## Permission status

### CIP — unresolved, and owned by another task

CIP's Tab VII **index page** carries only `© C.I.P - All rights reserved` and
publishes `PT max` pressure figures in a browsable table with **no reproduction
notice**. The per-cartridge **sheets** carry:

> "Reproduction forbidden as well as in the form of extracts without approval of
> C.I.P."

Whether a dimension may be transcribed from a Tab VII sheet is **the open question
owned by `cartridge-licence-reconciliation`**, and per this task's prohibitions I
do not resolve it here. Recorded in the CSV as
`restricted_pending_cip_question` with a cross-reference.

### SAAMI free drawings — free, but pre-standard

The free page names **12 Gauge 1¾"** and **28 Gauge 3″** explicitly, plus a
revision for `16 ga. 2¾"`. These are **free downloads**, and they are precisely
the three most commonly encountered gauges.

Two caveats, both from the publisher's own text:

1. **"Current Cartridge & Chamber Drawing documents are contained within the
   SAAMI Standards."** These are the *newly accepted* designs not yet in the
   published revision.
2. **A revision "not yet folded into the standard is exactly what silently
   invalidates a figure you already hold."** So any future transcription must
   record the **drawing revision date**, not just the SAAMI edition.

**Verdict: 12 Gauge and 28 Gauge are free, named, primary, and immediately
actionable.** They are the cheapest dimensional wins in the entire dataset.

## 18 Gauge — genuinely absent

18 Gauge does not appear in CIP Tab VII and is not on the SAAMI free page. Stated
precisely: **no source was found for it in the sources surveyed here.** That is
not a claim that no 18-gauge dimensional data exists anywhere — it is the honest
limit of this search, and per `.clinerules` rule 1 the cell stays EMPTY rather
than being filled with a plausible-looking figure from an unvetted compilation.

## The `4 Bore Rifle` row

The only row filed as `shotgun` in `data/seeds/cartridge_specs/shotgun.csv`.

**What it is:** slug `4-bore-rifle`, name `4 Bore Rifle`, `family=shotgun`,
**`saami_max_psi` EMPTY, `cip_max_bar` EMPTY**, source
`kwk.us Cartridge Pressure Standards`. Its dimensional columns are empty, as all
six are across the whole dataset.

**What is wrong with it, three ways:**

1. **It is not a shotshell.** 4 Bore is a British/European rimfire *rifle*
   cartridge. Filing it as `shotgun` makes our shotgun category non-empty when we
   in fact hold **zero** gauges.
2. **The name is a misnomer.** "4 Bore Rifle" is redundant and conflates the
   gauge name with the platform.
3. **It carries no shotgun data at all** — both pressure columns are empty, so it
   is not even serving the placeholder role it appears to have been created for.

**Recommendation: it should be reclassified to `rifle`, and the shotgun family
should be honestly empty until real gauge rows exist.** Recording zero is
correct; recording a misfiled rifle cartridge as a shotgun is not.

**I did not make this change.** `data/seeds/` is not in my write-set, and
reclassification is a reviewed edit under the seeds lock. It is a proposal, not a
patch.

## Safety limits — availability only, deliberately not assessed

The brief asks me to record whether a safety-limit figure is *available* and to
mark it as a separate open item if paywalled, while **not seeking the value and
not reasoning about it**. So:

- Every row reads `not_assessed_by_this_task`.
- **SAAMI proof pressures for shotgun gauges live in the Z299 series, which is
  paywalled** (`opensource_resources.csv`, `saami-standards`, licence
  `proprietary`, `adopt=false`). That is an availability fact.
- CIP Tab VII's index *does* publish `PT max` figures per designation, but those
  are **CIP's proof standard, not a chamber safety limit**, and treating them as
  one is exactly the SAAMI/CIP conflation
  `docs/BRASS-AND-PRESSURE-CLASS.md` exists to prevent.

**No safety-limit value is recorded, compared or reasoned about in this task.**