# KNOWLEDGE — Interior ballistics

**Task:** interior-ballistics. **Compiled:** 10 Feb 2026.
**Format note:** no brief defines `KNOWLEDGE.md`, and no other task in the swarm has
produced one yet — it is declared in `task.json` only. Written here as the
**durable, cross-task findings**: what a later agent should not have to rediscover.
Narrative work is in `01`–`05`; the five-part summary is `REPORT.md`.

---

## The three things worth knowing without reading anything else

### 1. No manufacturer publishes a physical burn rate for any reloading powder.

This is not a gap in our research; it is a property of the industry. Hodgdon's own
chart is titled "**RELATIVE** BURN RATES FROM FASTEST TO SLOWEST". Vihtavuori's
guide says its chart is "**not** to be used for developing loads". No pressure
exponent, force curve, heat of explosion or loading density is published anywhere.
Peer-reviewed literature has all of these — for **rocket and laboratory propellants**
only.

> **Operational consequence:** a task that needs `burn_rate`, `pressure_exponent`,
> `force_curve` or `loading_density` populated for retail powder has no source. It
> needs measurement, or it needs to leave the cells EMPTY. Do not go looking for a
> dataset that publishes absolute rates; it does not exist.

### 2. Relative ranks from different brands' charts are NOT comparable.

`powder_burn_rate_positions.csv` is rank 1..22 **within Vihtavuori's own chart**
(`column_total: 22`). Hodgdon publishes a separate ordinal chart that disagrees.
Reported across forums: "Relative burn rate locations for the same powder vary on
different burn rate charts."

> **Operational consequence:** never merge ranks across chart sources into one scale,
> and never present a rank as a rate. This is already recorded in `docs/CONVENTIONS.md`
> and task B5 — **this finding is the external evidence for that rule.**

### 3. The load-synthesis goal is ill-posed, not merely expensive.

Velocity and pressure are smooth functions of `a`, `n` and charge weight **together**.
Across the usable charge range, changing charge alone can reproduce almost any
velocity, so many `(a, n, ω)` triples fit the same observations. Fitting powder
constants from published load data yields a **degenerate family, not an estimate** —
and extrapolating it to an unlisted projectile is unbounded in the direction that
matters.

> **Operational consequence:** do not build a charge-weight inference engine. The
> defensible product is nearest-neighbour interpolation over published tables with
> **EMPTY on an unresolvable match**, which is exactly what Berger and Hornady do by
> hand.

---

## Hard prohibitions carried forward

| Prohibition | Source | Why |
|---|---|---|
| **No charge weight** for any cartridge/projectile/powder combination, not even as an example | `task.json` prohibits[] | The one output where a plausible wrong number injures people |
| **Never invent a value; leave it EMPTY** | `.clinerules` §5 rule 1 | A blank means "not known"; a wrong number is invisible |
| **Do not repair briefs** | `tasking/pending/README.md` | The planner owns `pending/`; report defects instead |
| **Do not merge ranks across charts** | `docs/CONVENTIONS.md`, task B5 | Confirmed externally — see finding 2 |
| **Do not substitute bulk density for loading density** | this task | They are different quantities; the one density we found is historical and for a discontinued product |

---

## What the manufacturers say, verbatim, and why it matters to us

Every one of them prints the same three-part statement:

1. **A published load is a starting point, not a guarantee.**
2. **Verification is the reloader's**, by working up from the minimum.
3. **The data cannot be made consistent between sources** — because the material
   varies lot to lot.

Berger, on lot variation:

> "It is a well-known fact that the same powder type will produce different velocity
> and pressure from one lot to another."

**No manufacturer publishes an accuracy figure for its load tables** — and the reason
is the load-adjacent version of our own doctrine: the dominant error is material and
lot variation, which is not reducible by better modelling.

---

## The failure mode worth designing against

Hornady currently carries an unprompted safety notice:

> "The 6.5 PRC entry in the 12th Edition Hornady Handbook of Cartridge Reloading
> contains a misprinted powder... **The powder listed as StaBall Match should
> correctly read StaBall HD.** Using the misprinted powder could result in
> dangerously high pressures..."

One wrong powder name in a printed table. The failure mode is **transcription**, not
exotic physics. A system that resolves a projectile to a load by matching names to a
table carries the identical risk — **with no erratum channel, because nobody would be
watching.**

> **Operational consequence:** a resolver that cannot say "I am not sure this is the
> same thing" is unsafe by construction. The refusal must be a designed output, not an
> empty string that looks like a bug.

---

## Compound gaps — two large gaps that meet here

| Gap | State | Consequence for interior ballistics |
|---|---|---|
| Powder physical constants | **Absent from the schema** (not merely empty) | `a`, `n`, force curve unknown |
| Cartridge dimensions | **0 / 229** (`capacity_gr_h2o`, `case_length_max_in`) | Case volume — the geometric input — unknown |

**These compound.** Even a complete powder database, which does not exist, would
still lack the cartridge-side geometry. Any task proposing interior ballistics should
be told that closing `cartridge-dimensions` is a prerequisite, not a parallel nicety.

The manifest note that `burn_rate` and friends are *absent* rather than *empty* also
means filling them is a **schema change**, not a data fill — strictly serial, owned by
the migration tasks.

---

## Licence position, for anyone reusing this

| Source | Usable as a citation | Redistributable |
|---|---|---|
| Vihtavuori guide / chart | Yes | **No** — © Nammo, no open licence |
| Hodgdon reference data | Yes | **No** — © Hodgdon, no notice |
| Hornady handbook / Load'n'Lube | Yes | **No** — sold at 99¢/cartridge or by subscription |
| Berger load data | Yes | **No** — © CPG |
| Peer-reviewed papers | Yes | Varies (PMC/MDPI often CC-BY) — **wrong material** |

**Redistribution permission matters as much as availability.** A number we may not
legally republish is still usable for internal calibration; that distinction belongs
in any dataset built on this.

---

## Open questions for the planner

1. **`recipes` is empty and is the real blocker.** Nothing above changes that. Every
   defensible load feature needs licensed, cited observations, and we hold none.
2. **A true calculator requires a closed-vessel laboratory programme** — measured
   `a`, `n`, `v_c` and force curves per powder. Legitimate product, real business,
   but it starts by buying a pressure-rated test vessel.
3. **Load-table licences are a commercial decision, not an engineering one.** Hornady
   sells its data. Whether we license, scrape-under-licence, or restrict the feature
   to citation is an owner decision with legal exposure.