# 02 — Surface inventory

**Task:** `unknown-state-design`. Which components render data, and what each shows when the
value is absent. **Specification only — no file in `apps/website/` was edited.**

---

## 1. The finding that reorders this inventory

The brief anticipates a dimensional-data table. I checked what the live site actually renders.

**`apps/website/src/` is three files: `dom.js`, `index.html`, `main.js`.** A search for the
dimensional columns (`bullet_dia_in`, `saami_max_psi`, `cip_max_bar`, `rim_dia_in`, …) across
all three returns **no matches**. The dimensional table does not exist yet.

**What the live site does render is a cost calculator**, driven entirely by **user-entered
values**, and this is the more urgent unknown-state surface — because **it already has the
bug this task exists to prevent.**

## 2. The live defect: every cost input defaults to zero

`apps/website/src/main.js`, `calculateCosts()`, lines 69–104:

```js
const facPrice = parseFloat(factoryBoxPrice.value) || 0;
const bulPrice = parseFloat(bulletPrice.value)     || 0;
const primPrice = parseFloat(primerPrice.value)    || 0;
const powPrice = parseFloat(powderPriceLb.value)   || 0;
const bPrice100 = parseFloat(brassPrice100.value)  || 0;
const equipCost = parseFloat(equipmentCost.value)  || 0;
```

**Seven** occurrences of `|| 0`, not six — corrected after counting rather than trusting my
own enumeration. An empty or malformed field becomes `0`, and:

```js
document.getElementById('resHandloadCpr').textContent = '$' + handloadCPR.toFixed(3);
```

**`$0.000 / round` renders identically to a real price.** Then, line 104:

```js
const roundsToBreakEven = savingsPerRound > 0 ? Math.ceil(equipCost / savingsPerRound) : 0;
```

…which renders a confident **"0 rounds to break even"** — meaning *equipment costs nothing* —
when it actually means *we do not know*.

**This is the exact failure the brief describes, already shipped.** Not a missing design; a
live component that converts an unknown into a false number a shooter is invited to act on.
And it is **invisible to every rendering test**, because `$0.000` renders perfectly.

## 4. Cross-cutting rules

1. **No `|| 0` on any user-facing numeric input.** The fallback must be an explicit state, not
   a number. `parseFloat` returning `NaN` and the empty string are different failures and
   should not share a fallback.
2. **A derived figure is not computed until every input to it is known.** Not "computed as 0" —
   *not computed*. This applies to sums, means, ratios, percentages, and divisions.
3. **Never let a bar chart render a zero-width bar as a real value.** A missing input is a gap
   in the bar, visually distinct from a genuine `$0.00`.
4. **Every aggregate states its coverage** — "across 98 of 229 cartridges", per `01-` §5.
5. **Empty *table* is a different state from empty *cell*.** The first needs an explanation and
   a cause; the second needs a token.
6. **Apply the four-state vocabulary from `01-` §3 wherever the data layer can supply a state.**
   For S1–S4 the states are only "known" and "not supplied" — a user-entered price has no
   licence state, and inventing one would be noise.

## 5. Priority, in order

| Rank | Surface | Why |
|---|---|---|
| **1** | **S4 break-even** | Renders a confident "0" that means the opposite of the truth, and a shooter may act on it |
| **2** | **S3 percent savings** | Same failure; "0% saved" is a plausible-looking wrong answer |
| **3** | **S1 cost-per-round** | The headline figure; `$0.000` is a false price |
| **4** | **S2 cost bars** | Same, lower visibility |
| **5** | **S5 dimensional table** | Highest data impact, but **not built yet** — design when built |
| **6** | **S8 empty table** | Not a wrong number, but a visible content gap |

**The order inverts the brief's framing, and deliberately.** The brief's six empty columns are
the *largest* data surface; the live `|| 0` defect is the *only* one currently producing a
wrong number. **Fix the one that ships first.**
**I have not fixed it.** `apps/` is outside this write-set and the brief forbids editing it.
It is the top item in `REPORT.md`.

## 3. Surface inventory

| # | Surface | Source of value | Absence today | Required behaviour |
|---|---|---|---|---|
| **S1** | **Cost-per-round calculator** (`resHandloadCpr`, `resFactoryCpr`, `resTotalHandloadPerRound`) | User input | **`\|\| 0` → `$0.000`** | Distinguish "no price entered" from "$0.00 is the price" |
| **S2** | **Cost breakdown bars** (`lblBulletCpr` … `lblBrassCpr`, `--bar-width`) | Derived from S1 | Division by `total` with `total` possibly 0 | Show the component as *unpriced*, not as `$0.000`; never render a zero-width bar as "free" |
| **S3** | **Savings outputs** (batch, kilo, percent) | `factoryCPR > 0 ? … : 0` | `percentSavings = 0` renders **"0% saved"** | Percent must read *not calculated* until both sides are priced |
| **S4** | **Break-even rounds** | `savingsPerRound > 0 ? … : 0` | **Renders "0"** | Must read *not calculated* — the most misleading surface, because 0 implies no equipment cost |
| **S5** | **Dimensional table** (cartridge dims) | `data/seeds/cartridge_specs/*.csv` | Not built yet | **Specified in `01-`; not designed here** |
| **S6** | **Ballistic output** (trajectory, POI, dispersion) | `ballistics-core` | Derived, so always present when inputs are | Same rule: an un-supplied input must not become `0` |
| **S7** | **Retailer / affiliate cards** | Affiliate data | Unknown per-retailer fields | A missing commission rate is **type 3** ("Not in our data") |
| **S8** | **Load-data tables** | `recipes` — **currently EMPTY** | Whole-surface empty | The empty-*table* state, distinct from the empty-*cell* state |
| **S9** | **Coverage / manufacturer status** | `manufacturers.csv` | "not started" / "n/a" | **Type 2** — "not applicable" is a real category here |

**S8 deserves its own note.** `recipes` is empty — the headline content gap in this project.
An empty table must not render as a table of zeroes or an empty bordered box that reads as a
loading failure. It needs an explicit empty-state with a cause.