# Task B3 - Load-recipe decision and first rows

**Status:** BLOCKED
**Blocked by:** A2
**Shared-path lock needed:** `data/schema/ (one new numbered file, AFTER claiming the lock)`
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

- `docs/DATA-MODEL.md`
- `data/schemas/load_recipes.yaml`
- `data/seeds/load_recipes.csv`
- `data/schema/ (one new numbered file, AFTER claiming the lock)`

> If a required change falls outside this list, **halt and report it**. Do not
> "just add it". See [`.clinerules`](../../.clinerules) section 1.

**Lock protocol:** claim any shared path in `.cline/tasks/ledger.json` before
writing it. If another task already holds the lock, stop and report.

**Note:** Needs a migration AND docs/DATA-MODEL.md, both of which A2 holds. Strictly after A2. Start the research now, write later.

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
You are working in C:\Cline\ApexProject, task **B3: load-recipe decision**.

READ FIRST:
1. AGENTS.md
2. docs/CONVENTIONS.md — §1 above all
3. docs/ROADMAP.md §1 — the "cite, do not reproduce" argument
4. docs/TODO.md §0.1 — the original framing
5. docs/DATA-MODEL.md — where the decision will be recorded
6. data/published/manifest.json — which manuals are archived and SHA-256'd
7. npm run probe:pdf — the tool for reading them

BACKGROUND
`recipes` is EMPTY. Every feature that justifies the project depends on it. This
is a content and licensing problem, not an engineering one, and no amount of code
fixes it. Nothing in the repo can decide it for you.

PART 1 — THE DECISION (do this first; it is the deliverable)
Record in docs/DATA-MODEL.md: the shape of a load-recipe row, and the licensing
reasoning. The recommended shape already exists in ROADMAP.md §1 — cite the
manual (recipe id, source, page, cartridge, bullet, powder, charge, velocity)
plus a free-text reproduction block, rather than reproducing copyrighted tables.
State why, and name the alternative you rejected. Verified 30 Sep 2026; say so
rather than re-arguing it.

PART 2 — THE TABLE
- data/seeds/load_recipes.csv + a manifest in data/schemas/
- A migration — COORDINATE FIRST. Migrations are serial (see A2). Report that you
  need one and wait, rather than adding it while another agent is mid-flight.
- Every row carries source_id AND a page number. A row without a page number is
  not data.
- NEVER invent a charge weight. If a manual page is illegible or a charge is
  ambiguous, leave the field blank and note it. A made-up load can injure someone.

Best first sources, already archived and hashed: SAAMI Z299.x, Hodgdon 2024,
Vihtavuori.

YOUR WRITE-SET:
  docs/DATA-MODEL.md  (the decision)
  data/schemas/load_recipes.yaml  (new)
  data/seeds/load_recipes.csv  (new)
  the migration, ONLY once serial access is confirmed

DO NOT TOUCH: existing seed CSVs, packages/**, apps/**, data/schema/011_*

THE MANDATORY NEGATIVE TEST
Show seed:check CATCHING a recipe row with no source_id, or with a charge weight
and no page number. Paste the failing output.

DONE WHEN
- the decision is written, with its reasoning and the rejected alternative
- the table and manifest exist and load
- negative test run and observed failing
- summary states: the decision, the row shape, how many rows you transcribed and
  from which pages, and how many you left blank and why
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
