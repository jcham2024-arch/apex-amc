# Task B1 - Bullet diameter split

**Status:** BLOCKED
**Blocked by:** A2
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

- `data/seeds/bullets/*.csv`
- `data/schemas/bullets.yaml`
- `data/generated/ (own datasets only)`

> If a required change falls outside this list, **halt and report it**. Do not
> "just add it". See [`.clinerules`](../../.clinerules) section 1.

**Lock protocol:** claim any shared path in `.cline/tasks/ledger.json` before
writing it. If another task already holds the lock, stop and report.

**Note:** Live correctness defect. Live in the same files as B4.

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
You are working in C:\Cline\ApexProject, task **B1: bullet diameter split**.

READ FIRST:
1. AGENTS.md
2. docs/CONVENTIONS.md — especially §1 (never invent a value)
3. data/schemas/bullets.yaml — read the existing note on diameter_in
4. data/seeds/bullets/berger.csv — the shape of a real row
5. docs/OPEN-SOURCE-LANDSCAPE.md §2.3 — cross-reference sources
6. data/seeds/value_provenance.csv — it carries an `estimated` 0.308 diameter
   with a warning note you must re-label
7. scripts/tests/test-bullet-sources.mjs — parser invariants

BACKGROUND — THIS IS A LIVE CORRECTNESS DEFECT
bullets.diameter_in holds calibre DESIGNATIONS, not measurements. It reads
0.264 for a 6.5 mm bullet. A real 6.5 mm bullet is 0.256 in. Any drag, sectional
density or form-factor calculation reading that column is silently wrong.

BLOCKED ON: task A2's migration. Do not start until it lands.

YOUR WRITE-SET:
  data/seeds/bullets/*.csv
  data/schemas/bullets.yaml
  data/generated/** for YOUR datasets only
  (the migration itself is A2's — do not add one)

DO NOT TOUCH:
  packages/ballistics-core/src/** — this task must NOT change physics
  data/schemas/cartridge_specs.yaml, powders.yaml
  anything under apps/

REQUIREMENTS
- Split into caliber_designation (what it actually is) and bullet_dia_in (a real
  measurement, nullable). The sibling `caliber` column already exists — say in a
  comment how you handled the overlap and why.
- Part numbers are STRINGS. A leading zero is not cosmetic.
- Populate bullet_dia_in ONLY where a manufacturer datasheet or CIP/CIPM source
  states it. Everything else NULL. See CONVENTIONS §1: a blank is a visible gap,
  a wrong value is a silent lie that propagates into drag.
- Re-label the `estimated` provenance row in value_provenance.csv once real
  measurements exist. This is part of your task, not optional.
- Blank is null, never "".

THE MANDATORY NEGATIVE TEST
Show seed:check CATCHING a bullet row whose bullet_dia_in is a bare
designation like "6.5mm" instead of a number, or one that is out of physical
range. Paste the failing output. Then show the clean run passing.

Verify the artefact: print the parsed rows, not just the exit code.

DO NOT RUN `npm run data:build` unless the integrator has said the window is
open. It rewrites every dataset. Use `npm run seed:check` to validate your work.

DONE WHEN
- npm run seed:check and schema:check exit 0
- negative test run and observed failing
- you have printed the resulting rows and confirmed the split is correct
- summary states: rows added per manufacturer, how many diameters are NULL and
  why, and what you did NOT do
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
