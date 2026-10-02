# Task B5 - Powder geometry and burn-rate class

**Status:** READY
**Blocked by:** none
**Shared-path lock needed:** `data/generated/ (own datasets only)`
**Model:** fresh instance of the default model

> GENERATED FILE - DO NOT EDIT.
>
> The execution prompt below is extracted from
> [`docs/AGENT-PROMPTS.md`](../docs/AGENT-PROMPTS.md), which is the single
> source of truth. Edit the prompt there and run `npm run tasks:gen`.
> This file adds the machine-readable write-set that `npm run tasks:check` validates.

---

## 1. Isolation Boundaries

**Strict Write Paths** - the ONLY files you may create, modify, or delete:

- `data/seeds/powders/*.csv`
- `data/schemas/powders.yaml`
- `data/generated/ (own datasets only)`

> If a required change falls outside this list, **halt and report it**. Do not
> "just add it". See [`.clinerules`](../../.clinerules) section 1.

**Lock protocol:** claim any shared path in `.cline/tasks/ledger.json` before
writing it. If another task already holds the lock, stop and report.

**Note:** Burn-rate positions are NOT comparable across brands. Do not merge scales.

---

## 2. Context Anchors - read in this order

1. [`.clinerules`](../../.clinerules) - binding
2. [`docs/CONVENTIONS.md`](../../docs/CONVENTIONS.md) - binding
3. [`docs/PARALLEL-WORK-PLAN.md`](../../docs/PARALLEL-WORK-PLAN.md)
4. `AGENTS.md`

---

## 3. Execution Prompt

> Paste verbatim into the sub-agent.

```markdown
You are working in C:\Cline\ApexProject, task **B5: powder geometry and
burn-rate class**.

READ FIRST:
1. AGENTS.md
2. docs/CONVENTIONS.md — §1 (never invent a value), §3 (provenance)
3. data/schemas/powders.yaml — the column manifest; read the notes on `geometry`
   and `burn_rate_class`
4. data/seeds/powders/accurate.csv and alliant.csv — real rows
5. data/research/powder_burn_rate/crossbrand_review.csv — read before touching
   burn rate
6. data/seeds/powder_burn_rate_positions.csv — positions are a SEPARATE dataset
7. packages/ballistics-core/src/provenance/constants.ts — SCALING_EXPONENT is
   `estimated` and depends on burn_rate_class

BACKGROUND
`geometry` (single/double/triple base) is empty on ALL 169 rows. It drives
load-density work and the is_double_base inference. `burn_rate_class` is 35%
populated and drives the barrel-scaling exponent, which is currently
`estimated` — so this data is load-bearing for ballistics accuracy.

YOUR WRITE-SET:
  data/seeds/powders/*.csv
  data/schemas/powders.yaml
  data/generated/** for YOUR datasets only

DO NOT TOUCH: bullets/**, cartridge_specs/**, packages/**, apps/**
(If you believe a physics constant must change because of this data, REPORT it —
do not edit packages/ballistics-core/src/provenance/constants.ts. A1 owns the
oracle and someone else must confirm the change.)

REQUIREMENTS
- Source geometry from manufacturer datasheets. A powder labelled "Varget" or
  similar on a can is NOT enough — that is a trade name, and inferring base type
  from it is a guess. Leave NULL when the datasheet does not state it.
- BURN-RATE POSITIONS ARE NOT COMPARABLE ACROSS BRANDS. Do not merge Vihtavuori
  and Hodgdon onto one scale. That constraint is already encoded in the manifest
  and the health output — read it and do not weaken it.
- `relative_burn_rate_position` is entirely empty on the powders table while a
  separate powder_burn_rate_positions dataset holds 22 rows. Say in a comment how
  these relate and whether the join is intended.
- Every physical constant per CONVENTIONS §3. Geometry is categorical, not a
  constant, so it does not need published() — but any numeric value you add does.

THE MANDATORY NEGATIVE TEST
Show seed:check CATCHING a geometry value outside its enum, and separately show
it CATCHING an attempt to place two brands on one burn-rate scale. Paste the
failing output, then the clean run.

DO NOT run `npm run data:build` without the integrator's go-ahead.

DONE WHEN
- npm run seed:check exits 0
- negative test run and observed failing
- you have printed how many rows gained geometry and how many remain NULL
- summary states: rows updated, how many left NULL and why, and anything that
  looks wrong in packages/ballistics-core that you did NOT touch
```

---

## 4. Definition of Done

- [ ] `npm run verify` exits 0
- [ ] Mandatory negative test run and observed FAILING; output pasted verbatim
- [ ] `git status --porcelain` shows nothing outside section 1
- [ ] Documentation updated in the same change
- [ ] If the main app changed: `npm run website:build`, then
      `npm run handoff:accept -- --note="what changed and why"`
- [ ] Model used recorded here: fresh instance of the default model
- [ ] Five-part summary per [`.clinerules`](../../.clinerules) section 8,
      including what you found but did NOT touch
