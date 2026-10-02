# Data plan

**How this repository grows.** Companion to [`DATA-REPOSITORY.md`](DATA-REPOSITORY.md),
which describes what exists; this describes what to do about it.

> **The task list now lives in [`DATA-TODO.md`](DATA-TODO.md).** That is the
> single consolidated list, produced by the full data audit of 2 Oct 2026 and
> measured since. This document keeps the *reasoning* behind the ordering -
> which is still worth reading - but the individual task
> items below are a snapshot and should be read against `DATA-TODO.md`, which is
> authoritative.
>
> (`TODO.md` was the previous home of this list and is itself now superseded; it
> is retained for provenance only.)

Ordered by **value per unit of effort**, and the ordering changes as the data
grows. Re-run `npm run data:health` to see the current bottleneck.

---

## The one-line strategy

The machinery is in good shape. The content is not. Almost everything below is
transcription, not engineering — and transcription is bounded by attention, not
by code, so the plan optimises for "how much correct data can one person add per
hour without introducing a wrong number".

That last clause is the whole constraint. A repository that is 60% populated
and correct beats one that is 95% populated with invented numbers, by a very
wide margin and for an obvious reason.

---

## Phase 0 — Make the data governed ✅ DONE

**Was:** 11 of 22 CSV files had no manifest, including `cartridge_specs.csv` — the
largest hand-maintained file in the repository, which had also been stored as
UTF-16LE without anything failing.

**Now:** 23 of 23 CSV files are governed. `npm run data:health` reports
`NO MANIFEST YET: none`, and `npm run test:encoding` covers what manifests
cannot — UTF-16, BOMs, stray CRs, blank lines, ragged rows, and a manifest
pointing at a gitignored file.

This phase is closed. Remaining data-integrity defects moved to `TODO.md` §1.

The nine manifests written during this phase, for the record:

| Dataset | Effort | Note |
|---|---|---|
| `value_provenance` | S | Enum-heavy; the guards already exist in the loader |
| `sourcing_retailers` | S | Has placeholder syntax to document |
| `sourcing_searches` | S | |
| `sourcing_listings` | S | The evidence rule is already enforced in code |
| `powder_burn_rate_positions` | S | |
| `cartridge_pressure_overrides` | M | Long prose fields; enums mirror `data/schema/009` |
| `cartridge_pressure_conflicts` | S | |
| `cartridge_pressures` | M | Footnote markers still need a legend |
| `cartridge_pressures_secondary` | M | |
| `cartridge_specs` | L | 21 columns, 10 entirely empty — worth doing properly |

Writing them surfaced four defects that no other check had found: the eight
retailers existed only in migration 003 and not in `manufacturers.csv`; the
loader read `m.id` from a map that has no `id`, so every retailer insert failed
to bind; `.300 WSM` collides on the declared primary key; and `.38 S&W` carries
a piezo and a copper-crusher figure in one column. All four are in `TODO.md` §1.

---

## Phase 1 — Close the safety items

Small, and two are already marked *do not publish* in the data itself. Tracked
in `TODO.md` §1.2 and §2.2.

1. **The two unresolved pressure disputes.** 6.5 Rem Mag and .350 Rem Mag sit
   at `resolution=unresolved` with a note saying not to publish. Open
   `data/published/saami-z299.4-2025-centerfire-rifle.pdf`, read both, update
   `cartridge_pressure_overrides.csv`, regenerate. *Minutes, and it unblocks
   publication.*
2. **The 6.5 Creedmoor 52-vs-62 ksi transposition.** The override note argues
   kwk.us transposed the digits. One page of Z299.4 settles it, and if 62,000 is
   right, a widely-copied compilation is wrong — which propagates.
3. **Add pressure standards to `sources`.** It currently holds only load-data
   manuals, so nothing can be recorded at `published` tier for a pressure
   figure. Unblocks the provenance ladder for every pressure in the database.
4. **Rename bullet `diameter_in`.** It holds a caliber designation. Rename to
   `caliber_designation` and add a real `bullet_dia_in` before anything computes
   drag from it. *The solver is keyed on true diameter; this is a latent
   wrong-answer bug, not a cosmetic issue.*

---

## Phase 2 — Fill the cartridge dimensions

**The single largest content gap.** 10 of 21 columns in `cartridge_specs/`
are entirely empty — 318 rows × 12 columns of nothing, all of it real published
SAAMI/CIP data.

The source material is **already on disk**:

| Source | Covers |
|---|---|
| `saami-z299.4-2025-centerfire-rifle.pdf` | rifle |
| `saami-z299.3-2022-centerfire-pistol-revolver.pdf` | pistol |

---

## Phase 3 — Grow the component catalogue

Run `npm run coverage` for the current picture. The single-kind bullet makers
are the best value: **one file each, and they reach `done` immediately.**

```
data/seeds/bullets/rmr.csv             data/seeds/bullets/precision-delta.csv
data/seeds/bullets/hammer.csv          data/seeds/bullets/montana-gold.csv
data/seeds/bullets/acme.csv            data/seeds/bullets/blue-bullets.csv
data/seeds/bullets/maker.csv           data/seeds/bullets/berries.csv
data/seeds/bullets/peregrine.csv       data/seeds/bullets/xtreme.csv
data/seeds/bullets/warner.csv          data/seeds/bullets/rainier.csv
data/seeds/bullets/lehigh-defense.csv  data/seeds/bullets/missouri-bullet.csv
data/seeds/bullets/bayou.csv           data/seeds/bullets/cutting-edge.csv
```

Each maker's published reference chart is the source. `../AGENTS.md`
Lane 5 already ranks them by user interest.

**Multi-kind makers** (`federal`, `nosler`, `lapua`, `norma`, `remington`) come
last — they need several files each before they can ever read `done`.

**Not yet any data at all:** primers, brass, loaded ammunition, accessories.
Those directories do not exist yet, and creating them empty would falsely read
as "started". A maker's coverage is whether their file exists.

---

## Phase 4 — Make the component finder honest

The sourcing layer is built; the *content* is a placeholder.

1. **Move listings `likely` → `verified`.** Each needs a product page
   retrieved, a `source_kind`, and a `verified_by`. Start with Natchez, which
   publishes transparent inventory. Until this happens the finder can only say
   "we think they stock this", and it should say exactly that.
2. **Confirm affiliate networks per retailer**, then set `affiliate_network`
   and `network_store_id`. `sourcing_affiliate_readiness` reports what is
   missing. Deliberately deferred until now.
3. **Replace site-search templates with per-SKU deep links** where supported.
4. **Backfill `bullets.slug` / `powders.slug`**, then point
   `sourcing_searches` at real component rows.

---

## Phase 5 — Load data, and errata

Both are blocked on decisions rather than on code.

**Load data** is the feature the roadmap cares about most, and the obstacle is
legal, not technical. `ROADMAP.md` §1.1 lays out the options; the recommendation
is **citation, not reproduction** — store cartridge, bullet, powder, page and
charge range, and link the shooter to the page in the manufacturer's guide. The
manuals are copyrighted and commercially licensed; ingesting and republishing
their tables is not viable.

**Errata is a safety requirement, not a feature.** `ROADMAP.md` §1.1b: Hornady's
12th Edition carries a published safety notice that a 6.5 PRC load table
misprints the powder, and Hornady's own wording is that using it *"could result
in dangerously high pressures."* A printed manual cannot be corrected. An app
can. That is the strongest argument this project has, and it needs a
`corrections` table keyed to source edition and page, plus a rule that a load
from an edition with an open errata never displays without the correction.

**Neither exists yet.** There is no `errata` table anywhere in `data/schema/`.

---

## Ongoing — keeping it good

Things that must not rot, and what stops them:

| Risk | What stops it |
|---|---|
| A generated file is hand-edited | `npm run data:validate`, in `verify` |
| A value is invented | manifests: `required`, `enum`, ranges |
| A source disappears | `source_url` is required on every row |
| A number silently changes | manifest range guards, provenance drift check |
| A manufacturer goes out of business | `status` column, revisit annually |
| Coverage claims go stale | `coverage` and `data:health` are derived from disk |

**Cadence.** Re-run `npm run data:health` at the start of any data session. It
takes a second and answers "what is the worst thing about the data right now".

---

## What I would push back on

**Do not prioritise schema work over content work.** There are 15 migrations and
222 rows. The next useful thing is a hundred correct rows, not a sixteenth
table. The schema is no longer the bottleneck.

**Do not fill `cartridge_specs` by inference.** The temptation is to derive case
length from parent case, or diameter from caliber name. Both are usually right
and occasionally catastrophic. Transcribe, or record an `estimated` provenance
row with the reasoning.

**Do not let "likely" drift into "verified" in the finder.** It would be a small
change and a large liability: a shooter drives to a shop on the strength of it.

| `saami-z299.2-2019-shotshell.pdf` | shotgun |
| CIP TDCC index (`cip-tdcc-index.html`) | international |

**Method:** transcribe in batches of ~25 cartridges, run `npm run data:build`
after each batch, and record any estimated rather than read value in
`value_provenance.csv` with its reasoning. The manifest enforces ranges — a
chamber diameter of 4.1" or a case length of 3" is caught automatically.

**Done when:** no dimension column is entirely empty in `npm run data:health`.
