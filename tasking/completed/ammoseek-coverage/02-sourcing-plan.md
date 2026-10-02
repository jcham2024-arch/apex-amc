# 02 — Sourcing plan

Task T7. For each **cluster** of missing calibers, the cheapest legitimate route
to the data. Clusters, not a row-by-row list, because the route is almost always
the same for a family.

**The headline of this document: every cluster below is `easy`.** That is the
opposite of what the brief anticipated. Nothing here is licence-gated except
shotgun *pressure* data, which needs the paid SAAMI Z299 series.

---

## The real problem is not coverage, it is depth

Before the clusters, the finding that reorders the priority:

> **All six dimensional columns are 0/229 populated.**

Measured across `data/seeds/cartridge_specs/{rifle,pistol,shotgun}.csv`:

| Column | Populated |
|---|---|
| `bullet_dia_in` | **0 / 229** |
| `case_length_max_in` | **0 / 229** |
| `max_col_in` | **0 / 229** |
| `rim_dia_in` | **0 / 229** |
| `head_dia_in` | **0 / 229** |
| `capacity_gr_h2o` | **0 / 229** |

So for **every one of our 229 cartridges**, we hold a name, a family and some
pressure columns, and **no dimensions at all.** Adding a 229th caliber name moves
the site very little; populating dimensions for calibers we already have moves it a
great deal.

**This means "do we have it" and "do we have usable data for it" are different
questions** — exactly as the brief warned — and the answer for dimensions is "not
for any of them".

---

## Cluster A — Shotgun gauges (6 rows in the gap table)

**Missing:** 12 Gauge, 20 Gauge, 28 Gauge, 8 Gauge, .410 Bore.

The single clearest gap: **we hold 0 of 8 gauges**, and the one row filed as
`shotgun` is `4 Bore Rifle`, a placeholder created to attach a pressure figure.

**Route — the best-sourced cluster in the whole table.** SAAMI's free New &
Revised page names **12 Gauge 1¾"** and **28 Gauge 3″** explicitly. CIP TDCC covers
shotgun dimensional tables.

| Need | Route | Licence | Feasibility |
|---|---|---|---|
| Dimensions | CIP TDCC + SAAMI free drawings | **free** | `easy` |
| Max pressure | **SAAMI Z299.5** (purchasable) | paywalled | `licence-gated` |

**Cost of the shotgun cluster is therefore near zero for dimensions, and the price
of the Z299.5 standard for pressures.** 12 Gauge alone is worth doing: it is 5.79%
of their published searches and it is the most-sourced gauge on the page.

---

## Cluster B — Military / NATO rifle (1 row)

**Missing:** 5.56x45mm NATO.

**Route:** CIP TDCC for cartridge dimensions and max pressure (MPa). **Caveat that
must not be lost:** the *chamber* dimension for the military variant is **STANAG
4090**, not CIP. CIP's 5.56 is the civilian chamber. Recording CIP's chamber figure
against a "5.56x45mm NATO" row would be a quiet substitution of a different
standard's number — precisely the class of error `docs/BRASS-AND-PRESSURE-CLASS.md`
exists to prevent.

At 9.62% search share this is our highest-demand genuine gap.

---

## Cluster C — New SAAMI-standardised designs (9 rows)

**Missing:** 5.7x28 FN, 8.6 Blackout, 21 Sharp, 25 Creedmoor, 30 Super Carry,
338 Advanced Rifle, 7mm Backcountry, 25 Weatherby Rebated, 5.56 Commercial.

**Route:** SAAMI free New & Revised Drawings. Every one of these is **named on the
page**, so this cluster is fully covered by a free download.

| Note | Detail |
|---|---|
| Licence | **free** |
| Feasibility | `easy` |
| Caveat 1 | Drawings "will be incorporated during the next revision" — record the **drawing date**, not just the SAAMI edition |
| Caveat 2 | Our seed rows must carry the drawing revision, or a future correction silently invalidates a figure we hold |

These are the cheapest wins available: free, named, and recent designs a competitor
index will list whether or not we do.

---

## Cluster D — Rimfire (1 genuine row)

**Missing:** .22LR is **already held** (`.22 LR`) — this cluster is empty once
alias matching runs. **No work needed.** This is the clearest example of why the
alias test was worth running: the brief listed .22LR as a top-3 gap we lacked.

---

## What this plan does NOT do

It does **not** propose adding cartridges. The brief is explicit: this is a gap
table and a plan; populating `data/seeds/` is a separate, reviewed task holding the
`data/seeds/` write-set lock.

It also does **not** estimate hours. Without knowing extraction throughput per
drawing, a number would be invention.

---

## Recommended sequence

1. **Cluster A dimensions** (free, high demand, currently zero coverage).
2. **Cluster C** (free, 9 calibres, no licence question).
3. **Cluster B** — but only with the CIP-vs-STANAG distinction recorded in the row.
4. **Then**: populate dimensions for the 229 we *already* hold. That is the larger
   win and the one the gap table makes visible.