# Variable Register

**Where every value in ApexProject lives, who creates it, and who is allowed
to change it.**

This exists because "no hard variables" is not achievable as an absolute, and
the reason it is not achievable is the most important thing recorded here.
Read §1 before making any change to a numeric literal.

Inventory: 28 cited constants, all in
`packages/ballistics-core/src/provenance/constants.ts`.

---

## 1. The three tiers, and why the line is drawn there

Not all literals are equal. Conflating them is how a codebase ends up either
full of noise or quietly unsafe. Values fall into exactly three tiers:

| Tier | What it is | Where it belongs | Example |
|---|---|---|---|
| **A. Cited physical constant** | A number with a published source. Changing it changes a prediction a person might act on. | `constants.ts`, wrapped in `published()` | `STANDARD_GRAVITY_FPS2` |
| **B. Configuration** | A path, a limit, a threshold. Wrong values break the pipeline, not physics. | `lib/data.mjs`, or one named local | `seedDir`, `MAX_STEPS` |
| **C. Structural** | Mathematics and algorithm shape. Not data; it *is* the computation. | Stays inline, always | RK4 `2` and `6`, `0`, `1`, `Math.PI` |

### Why C stays inline

`solver.ts` contains roughly 40 numeric literals in code. The great majority
are **not** configuration and must not be extracted:

- **RK4 coefficients** — `dt/6 * (a1 + 2*a2 + 2*a3 + a4)`. The `2` and `6` are
  not "a value someone chose"; they are the Butcher tableau of the algorithm.
  Writing `const RK_A2 = 2` would make the integrator harder to verify against
  a reference, not easier, because a reader could no longer check the formula
  against a textbook in one glance.
- **Identity and sentinel values** — `?? 0`, `= 0`, `<= 0`, `|| 1`.
- **`1e-9`**, the zero-speed guard. Arbitrary, but structural: it is "small
  enough", not "a configured precision".

Extracting these into a config file would convert reviewable arithmetic into
an opaque indirection, and would put a physics number under the authority of
something a non-expert can change. That is strictly worse.

**The test applied to every extraction:** *would a domain expert reading this
file be more or less able to verify it?* For `32.17405`, less — because the
value now has a citation. For `2*a2`, more if you have to look it up.

### What "no hard variables" correctly means here

1. No **Tier A** value may appear as a bare literal outside `constants.ts`.
2. No **Tier B** value may be duplicated across files.
3. Tier C stays visible, inline, and unabstracted. This is a feature.

---

## 2. Tier A — cited physical constants (28)

**Location:** `packages/ballistics-core/src/provenance/constants.ts`
**Created by:** the `published()` / `derived()` / `estimated()` factories in
`../provenance/Source.ts`, each recording value, units, and source.
**Shape:** `Sourced<number>` — a number plus its provenance. Consumers read
`.value`; auditors read the source.
**Consumers must:** import, never restate.

### Unit conversions

| Constant | Value | Units | Source |
|---|---|---|---|
| `INCHES_PER_FOOT` | 12 | in/ft | CIP |
| `INCHES_PER_YARD` | 36 | in/yd | CIP |
| `INCHES_PER_SQUARE_FOOT` | 144 | in²/ft² | CIP |
| `FEET_PER_YARD` | 3 | ft/yd | CIP |
| `FEET_PER_MILE` | 5280 | ft/mi | CIP |
| `FEET_PER_METRE` | 3.280839895 | ft/m | CIP |
| `GRAINS_PER_POUND` | 7000 | gr/lb | CIP |
| `MILRAD` | 0.001 | rad | definition |

### Atmosphere and gravity

| Constant | Value | Units |
|---|---|---|
| `STANDARD_GRAVITY_FPS2` | 32.17405 | ft/s² |
| `STANDARD_SEA_LEVEL_DENSITY_SLUG_PER_FT3` | 0.0023769 | slug/ft³ |
| `STANDARD_SEA_LEVEL_PRESSURE_INHG` | 29.9213 | inHg |
| `STANDARD_SEA_LEVEL_TEMP_F` | 59 | °F |
| `STANDARD_SEA_LEVEL_TEMP_K` | 288.15 | K |
| `ISA_LAPSE_RATE_K_PER_FT` | 0.0019812 | K/ft |
| `ISA_DENSITY_EXPONENT` | 4.25588 | — |
| `ISA_BAROMETRIC_PRESSURE_EXPONENT` | 5.25588 | — |
| `ISA_BAROMETRIC_HEIGHT_FT` | 145442.16 | ft |
| `SPEED_OF_SOUND_REF_FPS` | 1116.4 | ft/s |
| `SPEED_OF_SOUND_COEF` | 49.022 | ft/s/√R |

### Drag model

| Constant | Value | Units |
|---|---|---|
| `G1_FORM_FACTOR` | 1 | — |
| `G7_FORM_FACTOR` | 1.2 | — |
| `G1_DRAG_MODEL` | 1 | BC |
| `TRANSONIC_MACH_THRESHOLD` | 1.2 | Mach |

### Statistics

| Constant | Value | Units |
|---|---|---|
| `CEP50_RAYLEIGH_K` | 1.1774 | — |
| `CEP90_RAYLEIGH_K` | 2.146 | — |
| `GRUBBS_DEFAULT_ALPHA` | 0.05 | — |
| `GRUBBS_CRITICAL_005` | t-distribution | — |
| `SCALING_EXPONENT_ESTIMATED` | per burn-rate class | — |

### Derived inside consumers, on purpose

`solver.ts` defines four plain-number aliases at module scope from the cited
constants above. They are unwrapped **once**, so arithmetic never re-derives a
unit conversion:

```ts
const IN             = INCHES_PER_FOOT.value;           // 12
const FT_PER_MILE    = FEET_PER_MILE.value;             // 5280
const YD_TO_FT       = constants.FEET_PER_YARD.value;   // 3
const YARDS_PER_FOOT = 1 / YD_TO_FT;                    // 1/3
```

`YD_TO_FT` and `YARDS_PER_FOOT` are deliberate inverses kept as separate
names. A first attempt used one name for both and silently inverted a unit
conversion, producing a 9× error that one focused test caught. **Do not merge
these two names.**
---

## 3. Tier B — configuration

**Location:** `scripts/shared/data.mjs`
**Created by:** `resolve(root, ...)` from the module's own `root`.
**Consumers must:** import the exported name. Never re-derive a path.

| Export | Resolves to | Used by |
|---|---|---|
| `builtIndexFile` | `apps/website/dist/index.html` (**generated**) | handoff-*, security-baseline, check-website-build |
| `prototypeIndexFile` | `archive/website-prototype/index.html` (retired) | nothing — declared so stray references are findable |
| `websiteSrcDir` | `apps/website/src` | modules:check |
| `schemaDir` | `data/schemas` (14 YAML manifests) | build-data, data-health, check-seeds |
| `sqliteDir` | `data/schema` (17 `.sql` migrations) | check-seeds, check-schema |
| `seedDir` | `data/seeds` | check-seeds, data-health, report-coverage |
| `referenceDir` | `data/reference` | — |
| `generatedJsonDir` | `data/generated/json` | build-data |
| `generatedMdDir` | `data/generated/md` | build-data |
| `publishedDir` | `data/published` | fetch-published-data, export-d1 |
| `incomingDir` | `data/incoming` | — |
| `extractsDir` | `data/extracts` | — |
| `researchDir` | `data/research` | — |
| `handoffDir` | `data/handoff` | handoff-* |

Also exported: `requirePath(path, label)`, which fails loudly and by name when
a declared directory is missing — so a rename surfaces immediately instead of
producing a silently empty data set.

### ⚠ `data/schema` vs `data/schemas` — read this before any rename

These are **two real directories holding different things**, one letter apart:

- `data/schemas/` — YAML column manifests, one per governed table
- `data/schema/` — `.sql` migration history

They are declared under distinct names precisely so nobody merges them. There
is no compatibility alias between them, on purpose. A rename that collapses
these is a data-layer migration requiring a new ADR, not a refactor.

---

## 4. Audit

Re-run this after touching any numeric literal in the domain:

```powershell
# Tier A leakage: expect only hits inside constants.ts
Get-ChildItem packages\ballistics-core\src -Recurse -Filter *.ts |
  Select-String -Pattern '(?<![A-Za-z_.\d])(32\.174|0\.0023769|7000)(?![A-Za-z_.\d])' |
  Where-Object { $_.Line -notmatch '^\s*(\*|//)' }

# Tier B duplication: expect no output
Get-ChildItem scripts -Recurse -Filter *.mjs |
  Select-String -Pattern "resolve\(\s*(root|ROOT)\s*,\s*'(data|apps)/"
```

Current state: Tier A returns `constants.ts` only. Tier B duplication is
eliminated in the scripts already migrated; the remaining
`resolve(root, 'data/...')` sites are in the one-shot extractors, listed in §5.

---

## 5. Known remaining debt

These are Tier B hardcodes still in one-shot extractors, each appearing **once**
rather than shared. Low risk, not yet migrated:
`crosscheck-pressures.mjs`, `extract-kwk-pressures.mjs`,
`extract-leverguns-pressures.mjs`, `extract-vihtavuori-burn-rate.mjs`,
`extract-website.mjs`, `promote-powders.mjs`, `security-check.mjs`,
`split-cartridge-specs.mjs`, `split-seeds-by-manufacturer.mjs`.

Unresolved and **out of scope for this register**:

- Uncited unit conversions in `weather.ts` (`KMH_TO_MPH`, `HPA_TO_INHG`,
  `VIS_KM_TO_MI`). These are Tier A candidates and need real citations before
  being promoted into `constants.ts`; a plausible-looking constant with a
  fabricated source is worse than an honest local one.
- `MAX_STEPS` and similar numerical guards are Tier C, not configuration. They
  stay.