# 01 — Normalisation rules

Two directions, and **they are not symmetrical**. An under-match produces a visible
"not found"; an over-merge silently attributes one cartridge's data to another,
which this repository's doctrine says is unacceptable. **Every rule below is stated
with which of the two it can cause.**

Source data: `data/generated/apex.sqlite`, 318 rows. Every rule cites a real row.

---

## 0. The rule of precedence, which is where the existing implementation goes wrong

`scripts/gates/check-seeds.mjs` contains `CARTRIDGE_ALIASES`, a 12-entry map. Its
lookup is:

```js
function resolveCartridge(displayName, family) {
  const key = displayName.trim().toLowerCase();
  const alias = CARTRIDGE_ALIASES[key];
  if (alias) { /* use the alias target */ }
```

**The alias is consulted before the exact name.** Measured consequence: **4 of the 12
aliases bypass a row whose name matches the query exactly.**

| Query | Alias sends it to | A row named exactly that also exists |
|---|---|---|
| `9 luger` | `9mm-luger` ("9mm Luger", family=pistol) | `9-luger` ("9 Luger", family=rifle) |
| `.308 win` | `308-winchester` (".308 Winchester") | `308-win` (".308 Win") |
| `.223` | `223-remington` (".223 Remington") | `223` (".223") |
| `.30-06 springfield` | `30-06` (".30-06", psi=60000) | `30-06-springfield` (".30-06 Springfield", psi=**NULL**) |

**The `.30-06 Springfield` case is a live data defect.** The exact row exists and has
`saami_max_psi = NULL`; the alias redirects to a different row carrying 60,000 psi.
A pressure lookup for that cartridge silently returns a value from another row.
Nothing warns: both are `family=rifle`, so no filter would separate them.

**Precedence rule P0, which inverts the current order:**

> Try an **exact** match on `name`, then on `short_name`, then on `slug`.
> Only if all three miss, consult the alias map.

This alone fixes all four cases, with no new aliases.

## 1. Safe rules — cannot over-merge

Applied only for *display* and for *grouping keys*, never for identity.

| # | Rule | Why safe |
|---|---|---|
| S1 | collapse internal whitespace | no two cartridges differ only by spacing |
| S2 | strip a trailing `.` | `.222 Mag.` is the only affected row; the trailing period is abbreviation, not identity |
| S3 | case-fold | no two cartridges differ only by case |
| S4 | trim | free |

Measured: applying S1–S4 across all 318 `name` values produced **zero** collisions.

**But not across both fields.** Folding `short_name` as well produces exactly one
collision:

```
".308 win" -> 308-winchester, 308-win-mag
```

`.308 Winchester` has `short_name = ".308 Win Mag"`, which is **wrong** — that short
name belongs to a different cartridge (`308-win-mag`, name `.308 Win Mag`). This is a
data defect, not a normalisation failure, and it is the reason `02-test-corpus.csv`
`OM-02` exists. **Do not fold `short_name` until it is corrected.**

## 2. Rules that CAN over-merge — each needs an explicit test

| # | Rule | Over-merges? | The real rows it would break |
|---|---|---|---|
| R1 | strip the leading dot | **yes** | none in `name`, but it makes `.223` and `223` identical |
| R2 | remove all spaces | **yes** | `.308 Win` → `308Win`, colliding with the `short_name` `.308 Win Mag` |
| R3 | drop the trailing token | **yes** | `.308 Win` → `.308`, merging with `.308 Win Mag`; `.357 Mag` → `.357`, merging with `.357 Max` |
| R4 | truncate at the first `-` or `.` | **yes** | `.475 No.2 NE` → `.475`; `.30-378 Wea` → `.30`, merging with `.30-06` |
| R5 | ignore the leading numeral | **yes** | `.223` and `.222` collide |
| R6 | prefix match | **yes** | `9mm` matches `9mm Luger`, `9mm Parabellum`, `9x19mm` — see corpus `OM-05` |

**R6 is the dangerous one.** It is the obvious way to fix under-match `UM-04` (a user
typing `9mm`), and it is the rule most likely to be written. Measured: it is
unsound, because `9mm Parabellum` and `9x19mm` are the *same* cartridge as `9mm Luger`
and no `9mm`-prefixed distinct cartridge exists today — so a prefix rule would appear
to work and would silently break the moment a real `9mm`-prefixed different cartridge
is added.

## 3. Rules that under-match and are worth adding

Measured against the corpus — these are the abbreviations that make naive matching
report a cartridge we hold as absent:

| Query we would miss | Our stored name | Add alias |
|---|---|---|
| `9mm Parabellum` | `9mm Luger` | yes |
| `9x19mm` | `9mm Luger` | yes |
| `.22 Long Rifle` | `.22 LR` | yes |
| `.223 Rem` | `.223 Remington` | yes |
| `4 Bore` | `4 Bore Rifle` | **no — see below** |

`4 Bore` is deliberately **not** aliased. The stored name `4 Bore Rifle` is itself
wrong — `cartridge-family-audit` found `family=shotgun` correct but the *name* wrong.
Aliasing to a known-bad name propagates the error. **Fix the name first, then alias.**

**Correction to the source brief.** `ammoseek-coverage/KNOWLEDGE.md` §4 states:

> "We hold **0 of 8 gauges**. The only row filed as `shotgun` is `4 Bore Rifle`, a
> placeholder created to attach a pressure figure."

**That is no longer true.** Measured against the current database, `family=shotgun`
now holds **9** rows:

```
12-gauge, 10-gauge, 16-gauge, 20-gauge, 28-gauge
12-gauge-3-1-2-mag, 410-bore-2-1-2, 410-bore-3, 4-bore-rifle
```

So we now hold **5 gauges and 2 .410 bores**, which is real progress by another agent
— and it makes `4 Bore Rifle` stand out as the last placeholder among populated
neighbours. **Anyone planning work from that KNOWLEDGE.md should re-measure.** This is
the second time a source document's factual baseline was stale when I checked it.

## 4. Where normalisation is safe, and where it is not

**Safe:**
- grouping and de-duplicating for display;
- case and whitespace folding in a search index;
- a lookup that returns *candidates* to a human.

**Not safe:**
- **writing a normalised value back to `name`.** The brief and `task.json` both
  prohibit it, and `ammoseek-coverage/KNOWLEDGE.md` gives the reason: a normaliser
  that only tests the under-match direction "will quietly merge distinct cartridges,
  and that is the failure that hides real differences."
- assigning a `family`. Family is a fact about the cartridge, not a string property.
  `4 Bore Rifle` demonstrates it: normalising the name to `4 Bore` would make it
  *look* correct while the row still says `Rifle`.

## 5. The measurement that decides the duplication question

Every "bypass" row in §0 currently returns the same pressure as its exact twin
except one:

| Query | Exact row psi | Alias target psi | |
|---|---|---|---|
| `9 luger` | 35000 | 35000 | identical |
| `.308 win` | 62000 | 62000 | identical |
| `.223` | 55000 | 55000 | identical |
| `.30-06 springfield` | **NULL** | **60000** | **differs** |

Three are benign *today* and would stop being benign the moment either row's data is
corrected. **One is wrong now.** That is the argument for precedence rule P0 rather
than for patching aliases one at a time.