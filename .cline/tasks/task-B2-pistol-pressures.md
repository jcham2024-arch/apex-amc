# Task B2 - .45 ACP and .357 SIG maximum pressures

**Status:** READY
**Blocked by:** none
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

- `data/seeds/cartridge_specs/pistol.csv`
- `data/schemas/cartridge_specs.yaml`
- `data/generated/ (own dataset only)`

> If a required change falls outside this list, **halt and report it**. Do not
> "just add it". See [`.clinerules`](../../.clinerules) section 1.

**Lock protocol:** claim any shared path in `.cline/tasks/ledger.json` before
writing it. If another task already holds the lock, stop and report.

**Note:** Safety-critical. Source is the archived SAAMI Z299.3 PDF.

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
You are working in C:\Cline\ApexProject, task **B2: .45 ACP and .357 SIG maximum
pressures**.

READ FIRST:
1. AGENTS.md
2. docs/CONVENTIONS.md — §1 (never invent a value)
3. data/published/saami-z299.3-2022-centerfire-pistol-revolver.pdf — ON DISK AND
   UNREAD. This is your primary source.
4. data/published/manifest.json — how published documents are tracked
5. data/schemas/cartridge_specs.yaml — the column manifest
6. data/seeds/cartridge_specs/pistol.csv — a real row
7. data/seed/013_sourcing.sql is NOT relevant; the relevant schema is
   data/schema/009_cartridge_specs.sql (cartridge_pressure_references)
8. docs/OPEN-SOURCE-LANDSCAPE.md §2.3

BACKGROUND — WHY THIS IS SAFETY-CRITICAL
.45 ACP and .357 SIG chambers are dimensionally near-identical to 9mm. Selecting
the wrong one is a chambering error. We have confirmed SAAMI/CIP figures for
9mm (35,000/34,000 psi), 9mm+P (39,000), .40 S&W (35,000/33,000), 10mm
(38,000/34,000), .38 Spl (17,000/22,000) and .357 Mag (35,000/44,000). These two
are missing.

YOUR WRITE-SET:
  data/seeds/cartridge_specs/pistol.csv
  data/schemas/cartridge_specs.yaml  (only if a column must be described)
  data/generated/** for YOUR dataset only

DO NOT TOUCH: rifle.csv, shotgun.csv, any other manifest, apps/**, packages/**

REQUIREMENTS
- Read the Z299.3 PDF. Use `npm run probe:pdf <file.pdf>` — it extracts text with
  no dependencies. Do not transcribe from memory or from a third-party site.
- SAAMI and CIP DISAGREE MATERIALLY on some cartridges. Record BOTH, each in its
  own column, with `standard_body` set. NEVER average them, and never let one
  overwrite the other.
- If the PDF is illegible or ambiguous for a figure, leave the field NULL and
  note it. A made-up maximum pressure can injure someone.
- Every row needs `source_url` and provenance per CONVENTIONS §1. A row without
  a source is not data.
- Cross-check against the ammolytics/cartridges MIT dataset ONLY as a
  corroborating reference, never as a primary source — its contents are
  transcribed from SAAMI/CIP, so agreement with it is not independent evidence.

THE MANDATORY NEGATIVE TEST
Show seed:check CATCHING a pressure row that violates the unit enum, or one
where saami and cip were collapsed into a single averaged value. Paste the
failing output, then the clean run.

DO NOT run `npm run data:build` without the integrator's go-ahead.

DONE WHEN
- npm run seed:check exits 0
- both cartridges present with correct SAAMI and CIP figures, each sourced
- you have printed the rows and shown which PDF page each figure came from
- negative test run and observed failing
- summary states the figures found, their page numbers, and anything ambiguous
  you left NULL
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
