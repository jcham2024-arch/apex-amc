---
proposal: cartridge-row-identity
title: One row per cartridge, or one per cartridge-platform — decide before re-filing anything
derived_from: tasking/completed/cartridge-family-audit/KNOWLEDGE.md
evidence: "The built DB has 318 cartridges; the seeds have 229. The extras come from
  data/schema/003_seed_reference_data.sql. Two of its rows are the same cartridge as
  seed rows: id=1 slug=9mm-luger family=pistol psi=35000, and id=260 slug=9-luger
  family=rifle psi=35000 — identical pressure, opposite family."
shape: change
priority: high
write_set:
  - tasking/completed/cartridge-row-identity/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
  - 01-duplicate-clusters.csv
  - 02-platform-policy.md
---

# Cartridge row identity

The most valuable follow-up from `cartridge-family-audit`. It is a **decision task
first**, not a data task, and the decision has to come before any further re-filing.

## The finding

`tasking/completed/cartridge-family-audit/KNOWLEDGE.md` §4 records the measurement:

> The built DB has **318** cartridges; the seeds have **229**. The extras come from
> `data/schema/003_seed_reference_data.sql`. Two of its rows are the same cartridge
> as seed rows:
>
> ```
> id=1   slug=9mm-luger  name="9mm Luger"  family=pistol  psi=35000
> id=260 slug=9-luger    name="9 Luger"    family=rifle   psi=35000
> ```
>
> Identical pressure, opposite family.

At least two duplicate clusters exist:

| Cluster | Duplicate rows |
|---|---|
| 9mm Luger | `9mm-luger` (003, pistol) / `9-luger` (seed, rifle) / `9-mm-luger-p` (+P variant) |
| .22 rimfire | `.22RF Short`, `.22RF Long & LR`, `.22WRF`, `.22WRM` (003) vs `.22 Short`, `.22 Long`, `.22 LR`, `.22 WR`, `.22 WMRF` (seeds) |

The `.22` cluster also explains why `.22 LR` cannot simply be re-filed. It is a
genuinely dual-platform cartridge, and whether it belongs under rifle, pistol, or
**both** is exactly the question this proposal has to settle first.

## Why this blocks other work

Three live tasks touch the same rows and cannot safely proceed until the policy
exists:

- `cartridge-family-audit` — the diff deliberately excludes de-duplication.
- `name-normaliser-spec` — renaming `4 Bore Rifle` needs a rule about whether a
  cartridge may have two rows.
- Any future family-filter UI — it would count 9mm Luger twice.

**Until the policy is decided, every agent touching these rows is guessing**, and the
guesses will disagree with each other.

## The decision required

**One row per cartridge** (`.22 LR` gets one row; platform is a many-to-many
relation), or **one row per cartridge-platform** (`.22 LR` gets two rows, one per
platform, each with its own family)?

The second is what the current data accidentally approximates, which is why it is
tempting. But it means the same cartridge has two pressure figures to keep in sync,
and `saami_max_psi` would have to be denormalised onto a per-platform row.

**I am not choosing this.** It changes the meaning of a primary key, and it has
consumer impact on `cartridge_pressure_references` joins and the `CARTRIDGE_ALIASES`
map in `scripts/gates/check-seeds.mjs`. It is an owner decision.

## Scope of the task

1. Enumerate **every** duplicate cluster, not only these two — the 229-vs-318 gap
   implies more than I had budget to audit.
2. Write `02-platform-policy.md` stating the chosen model and its consequences.
3. Produce, but do not apply, the de-duplication plan with per-row blast radius.
4. Identify every consumer that would break, by name and file.

## The gate that would have caught this

Nothing currently can. `slug` is a primary key, so two different slugs for one
cartridge are perfectly legal, and `family` is CHECK-constrained for *validity*
(`IN ('rifle','pistol','shotgun')`) but never for *correctness*. A duplicate and a
misfile both load cleanly and silently.

A check that normalises cartridge names and flags near-identical rows would catch
both classes. `gate-negative-tests` is already queued and is the natural home for it,
which is why I am not proposing a second gate — one more gate is one more thing every
agent must keep green, and this belongs beside the existing negative-test work.