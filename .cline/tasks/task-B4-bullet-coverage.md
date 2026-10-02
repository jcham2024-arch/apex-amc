# Task B4 - Bullet coverage: Hornady and Sierra

**Status:** BLOCKED
**Blocked by:** B1
**Shared-path lock needed:** `data/generated/ (own dataset only)`
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

- `data/seeds/bullets/hornady.csv`
- `data/seeds/bullets/sierra.csv`
- `data/generated/ (own dataset only)`

> If a required change falls outside this list, **halt and report it**. Do not
> "just add it". See [`.clinerules`](../../.clinerules) section 1.

**Lock protocol:** claim any shared path in `.cline/tasks/ledger.json` before
writing it. If another task already holds the lock, stop and report.

**Note:** B1 owns bullets.yaml and rewrites these same CSVs. Do not run concurrently.

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
You are working in C:\Cline\ApexProject, task **B4: bullet coverage, Hornady and
Sierra**.

READ FIRST:
1. AGENTS.md
2. docs/CONVENTIONS.md — §1 (never invent a value) and §6 (real-row fixtures)
3. docs/SOURCE-SURVEY.md — READ THIS FIRST. It records which manufacturers
   publish HTML tables, PDFs, identity-only data, or nothing usable. Several
   publish nothing.
4. data/schemas/bullets.yaml — the column manifest
5. data/seeds/bullets/berger.csv — the shape of a real, complete row
6. scripts/data/import-bullets.mjs — the import pipeline
7. scripts/tests/test-bullet-sources.mjs — parser invariants
8. `npm run coverage` — current per-manufacturer status

BACKGROUND
120 bullet rows total: Berger 109, Hornady 7, Sierra 4. Hornady XTP is absent
entirely, which is conspicuous on a handloading site.

CONFLICT — READ THIS
Task B1 owns data/schemas/bullets.yaml and rewrites every file in
data/seeds/bullets/. Do NOT run concurrently. Either wait for B1, or do the
research and prepare your rows WITHOUT writing, then apply them after. Say in
your summary which you chose and why.

YOUR WRITE-SET:
  data/seeds/bullets/hornady.csv
  data/seeds/bullets/sierra.csv
  data/generated/** for YOUR dataset only

DO NOT TOUCH:
  data/schemas/bullets.yaml — B1 owns it. If it needs a new column, REPORT it.
  data/seeds/bullets/berger.csv
  packages/**, apps/**

REQUIREMENTS
- Use `npm run bullets:import -- <slug>` per manufacturer. The pipeline is
  proven; do not hand-write rows that the importer can produce.
- Bullet identity is (manufacturer_slug, part_number). NOT (name, weight) — the
  old key dropped 7 legitimate Berger bullets, because a 6.5 mm and a 7 mm
  140 gr VLD Target share a name and weight but are different projectiles.
- Part numbers are STRINGS. `065147` must not become `65147`.
- A manufacturer with no usable source is a legitimate "not started". **Do not
  invent rows to fill a coverage cell.** A blank means not known; a wrong bullet
  is a dangerous record.
- Every row needs a source_url. A row without one is not data.

THE MANDATORY NEGATIVE TEST
Show test:bullets CATCHING two rows with the same (slug, part_number), and
separately a row whose part_number lost a leading zero. Paste the failing
output, then the clean run.

Verify the artefact: print the row count before and after, and the distinct
manufacturers.

DO NOT run `npm run data:build` without the integrator's go-ahead.

DONE WHEN
- npm run test:bullets and seed:check exit 0
- `npm run coverage` shows the improvement you claimed
- negative test run and observed failing
- summary states rows added per manufacturer, which ones you left out and why,
  and confirmation you did not conflict with B1
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
