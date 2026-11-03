# Task T4 - Cartridge dimensional dataset (SAAMI / CIP transcription)

**Status:** READY
**Blocked by:** none
**Workflow:** copy-out to `tasking/completed/T4/` - see [tasking/README.md](../README.md)
**Model:** [record on start - fresh instance of the default model]

> **RESEARCH AND TRANSCRIPTION ONLY. DO NOT MODIFY `data/`.**
> Stage your work. Nothing you produce is merged by you.

---

## 1. Isolation Boundaries

**Strict Read Paths** - read anything; you NEED:

- `data/seeds/cartridge_specs/*.csv` - the 229 rows and their empty columns
- `data/schemas/cartridge_specs.yaml` - column manifest, types, enums
- `data/generated/json/cartridge_specs.json` - built output
- `data/reference/README.md` - provenance discipline
- `docs/ORACLE-SOURCES.md`, `docs/DATA-MODEL.md`

**Strict Write Paths** - ONLY inside `tasking/completed/T4/`:

- `tasking/completed/T4/cartridge_dimensions_filled.csv`
- `tasking/completed/T4/01-source-survey.md`
- `tasking/completed/T4/02-provenance-log.md`
- `tasking/completed/T4/REPORT.md`

**Do not edit** anything in `data/`, `scripts/`, `package.json`, or `apps/`. If a
change seems necessary there, **halt and report it**.

---

## 2. The finding this task exists to fix

Measured 2 Oct 2026 on `data/generated/json/cartridge_specs.json`, 229 rows:

| Column | Populated |
|---|---|
| `bullet_dia_in` | **0 / 229 (0.0%)** |
| `case_length_max_in` | **0 / 229 (0.0%)** |
| `max_col_in` | **0 / 229 (0.0%)** |
| `rim_dia_in` | **0 / 229 (0.0%)** |
| `head_dia_in` | **0 / 229 (0.0%)** |
| `capacity_gr_h2o` | **0 / 229 (0.0%)** |
| `primer_type` | **0 / 229 (0.0%)** |
| `saami_max_psi` | 98 / 229 (42.8%) |

**We hold 229 cartridge NAMES and 98 pressure figures. Every dimensional column is
empty.** This is honest - the seed note says "dimensions remain EMPTY until
transcribed from SAAMI/CIP" - but it means the dataset is a name index, not cartridge
data. This is the single largest gap between us and ApexLoad/XXL, and it is larger
than breadth.

Second finding: `family` counts are `rifle 212, pistol 16, shotgun 1`. **There is no
9mm, no 5.56, no .22LR**, and the one "shotgun" row is `4 Bore Rifle`, a placeholder.
Do NOT add cartridges in this task. Record the gap in `01-source-survey.md`.

---

## 3. Context Anchors

1. `.clinerules` - binding. §5 rule 1: **never invent a value; leave it EMPTY**
2. `data/reference/README.md` - "If a source disagrees with another, record both and
   mark it unresolved. **Do not average.**"
3. `docs/CONVENTIONS.md` - binding
4. `data/schemas/cartridge_specs.yaml` - the manifest your CSV must satisfy

### Established sources - do not re-litigate

| Source | Status | Use | Note |
|---|---|---|---|
| **SAAMI free drawings** (new/revised cartridge & chamber) | free download, published by SAAMI | PRIMARY for dimensions | Already `adopt=yes` in `opensource_resources.json`. **Pre-standard**: an accepted design may not be final, and a pending revision is a dimensional correction not yet folded in. |
| **CIP / C.I.P. tables** | published by CIP | Dimensions + CIP pressures | Free to read; **reprinting verbatim may be restricted.** Cite, do not republish wholesale. |
| SAAMI Z299.x standards (text) | proprietary, sold | NOT for dimensions | Standards are not free; the drawings are. |
| kwk.us pressures | already used for the 98 rows | pressures only | Already done. |

The **SAAMI free-drawings status trap is recorded in `data/seeds/regulations.csv`** and
is exactly why "published drawing" does not equal "final dimension." Honour it.
---

## 4. Execution Prompt

> Paste this section verbatim into the sub-agent.

Fill the empty dimensional columns for the cartridges we already hold, from primary
sources, and stage the result.

**Rules, in priority order:**

1. **An empty cell is correct when the source does not state a value.** `.clinerules`
   §5 rule 1: a wrong number can injure someone; a blank means "not known". Never
   interpolate, never estimate, never carry a value across cartridges.
2. **Every populated cell carries its source**: a source id, a URL, and a retrieval
   date. A value with no source is not an oracle and must be left EMPTY.
3. **SAAMI and CIP genuinely disagree on some cartridges.** Record both, or record
   both and mark unresolved in `02-provenance-log.md`. **Do not average. Do not pick
   a winner.**
4. Prefer the free SAAMI drawings over any secondary source. Prefer CIP over blogs,
   forums, or marketing pages. A manufacturer datasheet is acceptable where it is the
   authority for their own product, and must say so.

**Deliverable: `cartridge_dimensions_filled.csv`**

Same columns as `data/seeds/cartridge_specs/*.csv`, plus your provenance columns. Keep
existing `slug` values EXACTLY as they are - downstream joins depend on them, and
`.clinerules` §5 rule 6 warns that mangling an identifier destroys a join.

**Deliverable: `01-source-survey.md`**

Which sources you consulted, what each is authoritative for, licence/permission status,
and the coverage gap you could not fill. Be specific about the SAAMI pre-standard
caveat and where it applies.

**Deliverable: `02-provenance-log.md`**

One row per populated cell: value, source, URL, retrieval date, verbatim quote where
available, and any conflict. **This is the part that survives the merge; the CSV is
regenerable, the provenance is not.**

---

## 5. Definition of Done

**Validation:**

- [ ] Every value in your CSV traces to a row in `02-provenance-log.md`
- [ ] No value was interpolated, estimated, or carried over from a similar cartridge
- [ ] `git status --porcelain` shows changes ONLY under `tasking/completed/T4/`
- [ ] `npm run verify` still exits 0 (you changed nothing it reads)

**Mandatory negative test** - the honesty test for a data task:

- [ ] Paste the count of cells you left EMPTY, and state that this is a deliberate
      result, not an oversight
- [ ] Paste at least one cartridge where SAAMI and CIP disagree, or state plainly that
      you found none
- [ ] Paste command output proving zero changes outside `tasking/completed/T4/`

**Isolation check:**

- [ ] No file in `data/`, `scripts/`, `apps/`, or `package.json` was modified

**Report:** `REPORT.md` with the five-part summary from `.clinerules` §8. Item 4 must
state honestly what you could NOT source, because that number decides whether this
dataset can drive a load model.