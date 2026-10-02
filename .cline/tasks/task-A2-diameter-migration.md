# Task A2 - Migration for the bullet-diameter split

**Status:** READY
**Blocked by:** none
**Shared-path lock needed:** `data/schema/ (one new numbered file)`
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

- `data/schema/ (one new numbered file)`
- `docs/DATA-MODEL.md`

> If a required change falls outside this list, **halt and report it**. Do not
> "just add it". See [`.clinerules`](../../.clinerules) section 1.

**Lock protocol:** claim any shared path in `.cline/tasks/ledger.json` before
writing it. If another task already holds the lock, stop and report.

**Note:** STRICTLY SERIAL. All migrations are global and every gate replays the chain.

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
You are working in C:\Cline\ApexProject, task **A2: migration for the
bullet-diameter split**.

READ FIRST:
1. AGENTS.md
2. docs/CONVENTIONS.md
3. docs/DATA-MODEL.md — the schema's reasoning
4. The three most recent files in data/schema/ — match their comment style
   exactly. Read 016_affiliate_outreach.sql end to end: it is the model for a
   good migration comment in this repo.
5. scripts/gates/check-schema.mjs — what your migration must satisfy
6. scripts/shared/load-database.mjs — how migrations are applied

BACKGROUND
B1 (a separate agent) splits bullets.diameter_in into caliber_designation plus a
real bullet_dia_in measurement. You write ONLY the migration and the schema
decision. B1 owns the CSVs and the manifest.

WHY YOU ARE FIRST AND SEPARATE
Migrations are numbered, append-only, and every gate replays the whole chain. Two
agents adding migrations concurrently collide on numbering and produce a chain
neither tested. One at a time.

YOUR WRITE-SET:
  one new numbered file in data/schema/
  docs/DATA-MODEL.md  (the decision and its reasoning)

CONSULT BUT DO NOT EDIT: data/schemas/bullets.yaml — B1 owns it. If the
migration and the manifest disagree, report it, do not fix it.

REQUIREMENTS
- Pick the next number by looking at what exists. Do not assume.
- Migrations are ADDITIVE. Never edit an existing one — a deployed D1 has already
  run them. A new column means a new file, not an ALTER inside 009.
- The header comment must state, in the style of 016: what this is for, why it
  exists, what is deliberately NOT here.
- Nullable throughout. An unknown diameter must be NULL and visible, never zero
  and never a guess. See CONVENTIONS §1.
- Preserve the old column. Renaming in SQLite drops data; the old name must
  survive, and the comment must explain the choice.
- If a column becomes a foreign key, confirm load-database.mjs's load order still
  works, and say in a comment that you checked.
- Part numbers and SKUs are STRINGS. If the migration touches one it stays TEXT.
  A leading zero is not cosmetic.

THE MANDATORY NEGATIVE TEST
- npm run schema:check passes with your migration.
- Then show the gate CATCHES a row violating your new constraint. Paste the
  failing output in your summary.

Verify the artefact, not the exit code: query the schema directly and print what
you actually created.

DONE WHEN
- npm run schema:check exits 0
- you have printed the resulting schema and confirmed it matches your intent
- docs/DATA-MODEL.md explains the decision and the rejected alternative
- B1 has what it needs: exact column names, types, nullability
- summary states the migration number, the decision, and what you did NOT do
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
