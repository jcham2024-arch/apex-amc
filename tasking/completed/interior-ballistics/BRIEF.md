# Task T5 - Interior ballistics: powder characterisation and load synthesis

**Status:** READY
**Blocked by:** none (T4 is a helpful parallel, not a prerequisite)
**Workflow:** copy-out to `tasking/completed/T5/` - see [tasking/README.md](../README.md)
**Model:** [record on start - fresh instance of the default model]

> **SAFETY-CRITICAL. RESEARCH ONLY. YOU MUST NOT PRODUCE A LOAD NUMBER.**
> This task is scoped to the *physics and the data*. It is explicitly forbidden from
> recommending a charge weight for any cartridge/projectile combination. See §6.

---

## 1. Isolation Boundaries

**Strict Read Paths** - read anything; you NEED:

- `data/seeds/powders/*.csv` and `data/generated/json/powders.json` - 169 rows
- `data/seeds/powder_burn_rate_positions.csv` - 22 positions, Vihtavuori chart
- `data/generated/json/cartridge_pressures.json` - 231 rows
- `data/seeds/cartridge_specs/*.csv` - the empty dimensional columns
- `data/seeds/regulations.csv` - binding internal rules
- `docs/DATA-MODEL.md`, `data/README.md`, `docs/BALLISTICS-AUDIT.md`

**Strict Write Paths** - ONLY inside `tasking/completed/T5/`:

- `tasking/completed/T5/01-burning-rate-sources.md`
- `tasking/completed/T5/02-powder-properties.csv`
- `tasking/completed/T5/03-load-synthesis-literature.md`
- `tasking/completed/T5/04-equivalence-rules.md`
- `tasking/completed/T5/05-feasibility-verdict.md`
- `tasking/completed/T5/REPORT.md`

**Do not edit** `data/`, `scripts/`, `packages/`, `package.json`, or `apps/`.

---

## 2. THE FINDING THAT SHAPES THIS TASK

Measured 2 Oct 2026 on `data/generated/json/powders.json` (169 rows):

| Column | Populated |
|---|---|
| `manufacturer`, `product_name`, `product_line`, `source_url` | 169 / 169 |
| `burn_rate_class` | 59 / 169 |
| `relative_burn_rate_position` | **0 / 169** |
| `geometry` | 4 / 169 |
| **`burn_rate` (physical, e.g. m/s at reference P)** | **ABSENT** |
| **`pressure_exponent` (n)** | **ABSENT** |
| **`force_curve` / force law** | **ABSENT** |
| **`heat_of_explosion` / gas constants** | **ABSENT** |
| **`density` / loading density** | **ABSENT** |

`powder_burn_rate_positions` is **relative rank 1..22 within one brand's chart**. It is
an ordering, not a rate. Two charts cannot be placed on one scale - a fact
`docs/CONVENTIONS.md` and task B5 both state explicitly.

**We currently hold zero quantitative powder data.** What the owner asked for -
inferring a powder's behaviour from many load observations, then deriving an
unpublished load - requires physical burn rates, pressure exponents and force curves
that we do not have and have never had.

---

## 3. Context Anchors

1. `.clinerules` - binding. §5 rule 1: **never invent a value; leave it EMPTY**
---

## 4. Execution Prompt (part 1: sources and properties)

> Paste verbatim.

We want to model interior ballistics well enough to reason about unpublished loads.
Find out whether that is possible with legitimately obtainable data, and what it would
take. **Do not assume the answer is yes.**

**`01-burning-rate-sources.md`** - find every legitimate source of **quantitative**
smokeless-powder properties:

- Vihtavuori publishes burn-rate curves and pressure data. Document exactly what is
  published, under what licence, and whether it is scrapeable, purchasable, or free.
- HTM (Hodgdon Target Munitions) and other manufacturers publish some data.
- VLM (Vihtavuori LE) and Hornady Load'n'Lube publish some figures.
- Peer-reviewed closed-vessel testing literature - see `docs/research-oracles/` from
  task T2, plus arXiv/PubMed searches on burn-rate measurement.

For each: **licence status, whether redistribution is permitted, and the exact figure it
publishes** (burn rate at a stated reference pressure, pressure exponent, etc).
**Redistribution permission matters as much as availability.** A number we may not
legally republish is still usable for internal calibration, and that distinction
belongs in this document.

**`02-powder-properties.csv`** - whatever you can legitimately source, per powder:
product, manufacturer, burn rate with its reference pressure and temperature, pressure
exponent, geometry, density, and licence + source URL per value. **Leave cells EMPTY
where unsourced.** A half-empty CSV that is honest is worth more than a full one that is
invented.

---

## 5. `03-load-synthesis-literature.md` - the core question

The owner wants to compute a hypothetical load for a projectile not on any published
chart. Investigate the actual physics and state what is and is not possible.

1. **The Viebig equation** (1879) and the modern **Hill force law.** Write the
   equations. State every input each requires: burn rate, pressure exponent, force
---

## 6. HARD PROHIBITION - read this

**You must not produce, and must not recommend, a specific charge weight for any
cartridge/projectile/powder combination. Not even an example. Not even "a typical value
would be roughly".**

If you find yourself writing a number a person could load and fire, stop.

You MAY write: the equations, the required inputs, published tables with their stated
uncertainties, the equivalency rules manufacturers publish, and an analysis of what the
physics can and cannot determine.

The reason is structural, not stylistic. A charge weight is the one output in this
domain where a plausible-looking wrong number injures people. `.clinerules` §5 rule 1
exists for exactly this. Any inference this product makes must carry its uncertainty
and a route to verification, and that is a later, separately-gated engineering task
built on your findings - not something a research agent types into a document.

**This is a hard gate on your task, not a preference.** If you cannot complete the task
without stating a charge weight, the task is not completable and that IS your finding.

---

## 7. Definition of Done

**Validation:**

- [ ] `git status --porcelain` shows changes ONLY under `tasking/completed/T5/`
- [ ] `npm run verify` still exits 0
- [ ] Every quantitative powder value carries a licence statement and a source URL
- [ ] No charge weight appears anywhere in your output

**Mandatory negative test:**

- [ ] Paste the search you ran for published burn-rate data, and what it returned
- [ ] Paste your feasibility verdict's first paragraph
- [ ] Paste a self-check proving no charge weight appears, e.g.
      `grep -rnE '[0-9]+(\.[0-9]+)? *gr' tasking/completed/T5/` returning nothing
- [ ] State plainly what you believe is wrong about the owner's premise

**Report:** `REPORT.md`, five-part summary from `.clinerules` §8. Item 4 must address
directly whether the load-synthesis goal is achievable, and on what terms.
   exponent, gas thermochemistry, projectile mass, case volume, breech pressure.
2. **Ballistic coefficients and the muzzle-velocity-pressure relationship.** How are
   published loads actually derived? What accuracy do published tables claim, and what
   do the manufacturers say about their accuracy?
3. **Published equivalency rules.** Berger's and Hornady's "when a bullet is not
   listed" guidance; how other platforms interpolate to an unlisted bullet; and what
   every one of them says about verification.
4. **How many load observations would be needed to characterise one powder well.**
   Be quantitative where you can.
5. **What every published load recipe actually is** - and note honestly that a published
   load is itself a starting point requiring range verification, not a guarantee. This
   is the framing the whole product rests on.

**`04-equivalence-rules.md`** - compile the actual published rules for handling an
unlisted projectile, verbatim where possible, with source and licence. Note conflicts.

**`05-feasibility-verdict.md`** - state plainly in the FIRST PARAGRAPH: **can this be
done, with what data, at what accuracy, and with what failure modes.** Then: the
minimum viable dataset and its licence burden; which quantities are per-powder and which
per-cartridge; what must be EMPTY in the output for the result to be honest; and the
safety case in your own words.
2. `docs/CONVENTIONS.md` - binding, especially the YMYL/trust material
3. `docs/BALLISTICS-AUDIT.md` - the validated trajectory model
4. `data/seeds/regulations.csv` - binding internal constraints on method