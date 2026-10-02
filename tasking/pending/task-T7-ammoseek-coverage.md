# Task T7 - AmmoSeek breadth gap analysis and sourcing plan

**Status:** READY
**Blocked by:** none (cartridge-dimensions runs in parallel and informs the sourcing side)
**Workflow:** copy-out to `tasking/completed/ammoseek-coverage/` - see [tasking/README.md](../README.md)
**Model:** [record on start - fresh instance of the default model]

> **RESEARCH AND GAP ANALYSIS ONLY. DO NOT ADD CARTRIDGES.**
> You produce a gap table and a sourcing plan. You do not populate the dataset.
> Adding rows is a separate, reviewed task, and that is where the `data/seeds/`
> write-set lock applies.

---

## 1. Isolation Boundaries

**Strict Read Paths** - read anything; you NEED:

- `data/seeds/cartridge_specs/*.csv` - our 229 rows
- `data/schemas/cartridge_specs.yaml` - the column manifest
- `data/generated/json/*.json` - built datasets
- `data/seeds/regulations.csv` - **the binding rule on competitor data, below**
- `data/generated/json/competitor_coverage.json` - existing competitor observations
- `docs/research-competitors/*.md` - prior work, especially `02-feature-gaps.md`
- `docs/DATA-MODEL.md`

**Strict Write Paths** - ONLY inside `tasking/completed/ammoseek-coverage/`:

- `tasking/completed/ammoseek-coverage/ammo_seek_coverage_gap.csv`  ← **the table you asked for**
- `tasking/completed/ammoseek-coverage/01-method-and-sources.md`
- `tasking/completed/ammoseek-coverage/02-sourcing-plan.md`
- `tasking/completed/ammoseek-coverage/03-priority-ranks.md`
- `tasking/completed/ammoseek-coverage/REPORT.md`

**Do not edit** `data/`, `scripts/`, `apps/`, `package.json`, or any existing task file.

---

## 2. THE BINDING RULE - read this first

`data/seeds/regulations.csv` contains a row you must obey exactly:

> **"AmmoSeek disclaimer"** - *"Competitor does not vet product data"* -
> *"Forbids treating a competitor's aggregated product or retailer listing as verified
> data"*, `quote_status: verbatim`, retrieved 2026-10-02

**AmmoSeek is a discovery aid, never a source.**

You may use their caliber index to work out **what we are missing**. You may **not**
copy a product name, dimension, price, or retailer rating from them, because their own
disclaimer says they do not vet it. Every value you propose must come from a primary
source you cite, with the citation in the table.

`competitor_coverage.json` exists to hold observations rather than copied records.
Follow that precedent.

---

## 3. Measured baseline - do not re-derive, extend it

**AmmoSeek, observed 2 Oct 2026 at `/calibers`:**

| | Count |
|---|---|
| Total calibers | **600** |
| Handgun | 123 |
| Rifle | 444 |
| Rimfire | 25 |
| Shotgun | 8 |
| Retailers indexed | 270 |
| Products listed | 1,241,372 |

**Our `cartridge_specs`:** 229 rows - `rifle 212, pistol 16, shotgun 1`.

**A gap analysis run on 2 Oct 2026 found this. Reproduce it before extending it:**

- Of AmmoSeek's **top 20 calibers by their own published search share, we hold 5.**
- **We have no 9mm Luger (their #1 at 19.75% of searches), no 5.56x45mm NATO (9.62%),
  no .22LR (7.35%), no 12 Gauge (5.79%), no .308 (4.96%), no .223 Remington (4.24%).**
- We hold **0 of the 8 shotgun gauges.** The single row filed as `shotgun` is
  `4 Bore Rifle`, a placeholder created to attach a pressure figure.
- A naive string match reports MORE gaps than exist, because our naming is
  abbreviated (`10 Auto` not `10mm Auto`, `.257 Rob.` not `.257 Roberts`,
  `6.5 Grendel` not `6.5mm Grendel`). **Alias-aware normalisation is required** or your
  gap table will be full of cartridges we already have.
- The six dimensional columns are **0/229 populated** - so "do we have it" and "do we
  have usable data for it" are different questions. Your table must distinguish them.
---

## 4. Execution Prompt

> Paste verbatim.

Produce the gap table the owner asked for: every caliber AmmoSeek indexes that we do
not properly hold, with a plan and a source for each.

**`ammo_seek_coverage_gap.csv`** - one row per caliber we lack, or lack data for.
**Required columns:**

| Column | Meaning |
|---|---|
| `ammo_seek_name` | Their published name, verbatim. A discovery key, not a source. |
| `ammo_seek_family` | handgun / rifle / rimfire / shotgun |
| `ammo_seek_url` | the index URL, for traceability |
| `search_share_pct` | their published share if known; **EMPTY if not published** |
| `our_canonical_name` | our equivalent designation, or EMPTY if we hold none |
| `our_alias_match` | whether alias-aware matching found us already holding it |
| `gap_type` | `absent` / `present_no_data` / `present_partial` / `alias_duplicate` |
| `data_we_have` | which of our columns are populated for this cartridge |
| `data_we_need` | the specific missing fields |
| `primary_source` | **a real citation for obtaining it** - SAAMI drawings, CIP, manufacturer datasheet |
| `source_licence` | free / purchasable / restricted |
| `sourcing_feasibility` | `easy` / `licence-gated` / `not_obtainable` |
| `notes` | conflicts, gaps in the source, anything blocking |

**`01-method-and-sources.md`** - how you enumerated their index, how you normalised
aliases, and every source consulted with its licence. State plainly how many apparent
gaps turned out to be alias duplicates.

**`02-sourcing-plan.md`** - for each *cluster* of missing calibers, the cheapest
legitimate route to the data. Group sensibly. The SAAMI free drawings cover cartridge
and chamber dimensions for most standard calibers and are already `adopt=yes` in
`opensource_resources.json` - confirm what they actually cover rather than assuming.

**`03-priority-ranks.md`** - a ranked shortlist. Weight: search demand, how much of the
missing data is dimensional vs. pressure, and sourcing feasibility. Say which 10
calibers would most change the site's usefulness, and why.

---

## 5. Definition of Done

**Validation:**

- [ ] `git status --porcelain` shows changes ONLY under `tasking/completed/ammoseek-coverage/`
- [ ] `npm run verify` still exits 0
- [ ] Every row's `primary_source` is a real citation, not a link to a forum
- [ ] **No product data, dimension, price or rating was copied from AmmoSeek**
- [ ] Alias normalisation applied and `alias_duplicate` rows separated out

**Mandatory negative test:**

- [ ] Paste your alias-normalisation test showing at least one caliber that naive
      matching called a gap and alias matching proved we already hold
- [ ] Paste the count of `alias_duplicate` rows, and the count of genuine gaps
- [ ] Paste your top-10 priority list
- [ ] State what you believe is wrong about the owner's premise

**Report:** `REPORT.md`, five-part summary from `.clinerules` §8. Item 4 must address
whether matching AmmoSeek's caliber breadth is achievable on our evidence standards,
and what it would cost.
