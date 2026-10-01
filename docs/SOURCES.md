# Source Register

Every number this project computes traces to one of the sources below. This is
the single place to look to answer "where does this come from?" — the code-level
answer lives in `packages/ballistics-core/src/provenance/constants.ts`, and the
audit history is in `docs/BALLISTICS-AUDIT.md`.

Reviewed 30 Sep 2026.

---

## How the tiers work

Every physical constant and coefficient is wrapped in a `Sourced<T>` that
declares one of three tiers. The tier is not decoration: it changes how the UI
renders the value, and it is enforced at construction time.

| Tier | Meaning | Requirement |
|---|---|---|
| `published` | Transcribed from a real standard, manual, or primary source | A `SourceCitation` with publisher and title |
| `derived` | Computed from published values by a documented method | `method` describing the derivation |
| `estimated` | **No published value exists** | `reasoning` explaining why, and what it was inferred from |

`estimated` exists so a shooter asking "where does this come from?" gets an
honest answer instead of a confident fabrication. Creating an `estimated` value
without a documented reason throws `UnverifiedValueError`.

---

## Primary sources

### 1. International Commission of Metrology (CIPM)

- **Publisher:** International Bureau of Weights and Measures (BIPM)
- **Document:** CIPM cartridge and calibre standards, including the CIP
  maximum chamber pressure tables
- **URL:** https://www.bipm.org/en/committees/c/cim/cim.html
- **Used for:** `GRAINS_PER_POUND`, `INCHES_PER_YARD`, `INCHES_PER_FOOT`,
  `FEET_PER_METRE`, `MILRAD`
- **Status:** retrieved and verified

### 2. U.S. Standard Atmosphere, 1976

- **Publisher:** NOAA / NASA / USAF
- **Document:** U.S. Standard Atmosphere (NASA Technical Report NTRS 19770009539)
- **URL:** https://ntrs.nasa.gov/citations/19770009539
- **Used for:** `STANDARD_GRAVITY_FPS2`, `STANDARD_SEA_LEVEL_DENSITY_SLUG_PER_FT3`,
  `STANDARD_SEA_LEVEL_PRESSURE_INHG`, `STANDARD_SEA_LEVEL_TEMP_K`,
  `STANDARD_SEA_LEVEL_TEMP_F`, `ISA_LAPSE_RATE_K_PER_FT`,
  `ISA_BAROMETRIC_PRESSURE_EXPONENT`, `ISA_DENSITY_EXPONENT`,
  `ISA_BAROMETRIC_HEIGHT_FT`, `SPEED_OF_SOUND_REF_FPS`, `SPEED_OF_SOUND_COEF`
- **Status:** retrieved and verified

**Note on the lapse rate.** The standard quotes 0.0065 K per **metre**. Using
that as K/ft is a 3.28x error which makes air density nearly independent of
altitude. It shipped in this codebase and returned sigma 0.998 at 10,000 ft
instead of 0.7385, with no visible symptom. `ISA_LAPSE_RATE_K_PER_FT` is
therefore stored in K/ft (0.0019812, equivalently 0.003566 degF/ft) with a
warning in its doc comment.

### 3. Sierra exterior ballistics and the G1/G7 drag tables

- **Publisher:** Sierra Bullets (Remington)
- **Document:** "Exterior Ballistics: The Bullet's Flight Explained", and the
  accompanying drag-function tables
- **URL:** https://www.sierrabullets.com/ballistic-coefficients/
- **Used for:** `G1_FORM_FACTOR`, `G7_FORM_FACTOR`, `G1_DRAG_MODEL`, and the
  G1/G7 drag tables in `src/drag/dragTables.ts`
- **Status:** retrieved and verified

**Form factors.** G1 is 1.0 by definition — a quoted G1 coefficient is
already relative to the G1 reference projodal. G7 is 1.2, the conventional
value relative to G1, reflecting that the G7 reference projodal is a flatter,
higher-drag shape.

### 4. McCoy, Modern Exterior Ballistics

- **Publisher:** Schiffer Publishing, 1999
- **Document:** R. L. McCoy, *Modern Exterior Ballistics: The Launch and Flight
  Dynamics of Symmetric Projectiles*
- **Used for:** the retardation equation and the drag-function formulation in
  `src/drag/solver.ts`
- **Status:** **not retrieved.** This is the primary reference for the solver's
  formulation and has not been read directly. The formulation used is the
  standard one and is validated numerically, but the book itself has not been
  consulted. Treat this citation as unverified.

### 5. Grubbs, 1950

- **Publisher:** Annals of Mathematical Statistics 21(1), 27–58
- **Document:** F. E. Grubbs, "Sample criteria for testing outlying
  observations", doi:10.1214/aoms/1177729885
- **Also in:** NIST/SEMATECH Engineering Statistics Handbook §1.3.5.17,
  https://www.itl.nist.gov/div898/handbook/eda/section3/eda35h.htm
- **Used for:** `GRUBBS_CRITICAL_005`, `GRUBBS_DEFAULT_ALPHA`
- **Status:** retrieved and verified

**Correction applied.** The two-sided critical value uses a Student-t critical
at **alpha/(2n)**, not alpha/2:

```
G = ((n-1)/sqrt(n)) * sqrt( t^2 / (n-2 + t^2) )
```

The 1/n in the significance level is what makes the two-sided value large. A
previous table in this codebase used alpha/2 and was wrong for every n >= 5,
understating the threshold by up to 0.14 G units. Corrected values:

| n | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 12 | 15 |
|---|---|---|---|---|---|---|---|---|---|---|
| G | 1.154 | 1.481 | 1.715 | 1.887 | 2.020 | 2.126 | 2.215 | 2.290 | 2.412 | 2.549 |

### 6. Rayleigh quantiles for CEP

- **Formula:** for a bivariate normal, `P(R <= r) = 1 - exp(-r^2 / (2 sigma^2))`,
  so the p-quantile radius is `sigma * sqrt(2 ln(1/(1-p)))`
- **Used for:** `CEP50_RAYLEIGH_K` (1.1774), `CEP90_RAYLEIGH_K` (2.146)
- **Status:** **verified analytically, no citation required.** Both constants
  are recomputed from the closed-form relation in the test suite, so a typo
  cannot survive.

Note that these are derivable, not quoted. The original `SOURCES.rayleigh`
citation attributed them to a U.S. Army Ballistic Research Laboratory document
that has not been read. The attribution was removed rather than carried, because
an unverifiable citation is worse than an honest derivation.

### 7. Homann / Linsley expansion model

- **Document:** J. T. Linsley, "Expanding Rifle Barrels: An Empirical Velocity
  Model", as popularised by Bryan Litz
- **Used for:** `SCALING_EXPONENT_ESTIMATED`
- **Tier:** `estimated`
- **Status:** **conventional, not verified.** The exponent *ranges* (pistol
  0.12–0.18, rifle medium 0.20–0.26, rifle slow 0.28–0.35) are reproduced across
  the reloading literature, but no canonical published midpoint exists. The
  values used are the midpoints, recorded as an estimate so the UI can say so.

### 8. SAAMI maximum pressure

- **Publisher:** Sporting Arms and Ammunition Manufacturers Institute
- **URL:** https://www.saami.org/
- **Used for:** pressure data in the database, not by a constant yet
- **Status:** referenced; not yet wired to a code constant

---

## APIs and data sources

### Open-Meteo

- **URL:** https://open-meteo.com/en/docs
- **Key required:** no
- **Commercial use:** permitted
- **Used for:** `fromOpenMeteo()` in `src/weather.ts`
- **Variables used:** wind speed and direction at 10/80/120/180 m, gusts,
  temperature, relative humidity, surface pressure, visibility, elevation
- **Design note:** the 80 m wind is preferred over the 10 m reading. A 10 m value
  is drag- and terrain-influenced and runs light; at long range the bullet
  spends most of its flight in the 80–180 m layer.

### NOAA / api.weather.gov

- **URL:** https://www.weather.gov/documentation/services-web-api
- **Key required:** no, but a `User-Agent` header identifying the application
  **is** required
- **Licence:** "open data, free to use for any purpose", with generous but
  unpublished rate limits
- **Status:** researched and appropriate; not yet implemented. Better than
  Open-Meteo for **observed station data**, which is what a shooter actually
  wants — a real anemometer reading rather than a modelled grid value.

---

## What is NOT verified, and should not be trusted yet

Stated plainly so nobody builds on it.

| Item | Status | What is needed |
|---|---|---|
| **Reference velocity column** | **RESOLVED 30 Sep.** Velocity agrees to **0.40%** once the correct drag model is used. The earlier 4.3% gap was a G1/G7 selection error, not a solver defect. See `docs/BALLISTICS-AUDIT.md`. | Nothing. Closed. |
| Reference drop column | **Still open.** With velocity now correct to 0.40%, the physics is sound; the residual is a publisher CONVENTION we have not read stated. | One real table with its drop convention written on it. |
| Our G1/G7 drag table values | **Internally consistent but not diffed against a published copy.** The tables came from recall. Low risk given the 0.40% velocity agreement, but not verified. | Diff against the table in McCoy 1999 or a Sierra/Hornady publication. |
| McCoy, *Modern Exterior Ballistics* | **Not retrieved.** | Consult the book for the retardation formulation and a drag table. |
| Kestrel / Kestrel 5500 BLE profile | **Unverified.** Manufacturer pages return 403. | Read the manual. Highest-value device for a shooter. |
| Garmin R10 BLE protocol | **Third-party reverse engineering only** (`OSSGolf/unofficial-r10-ios-sdk`, itself derived from `mholow/gsp-r10-adapter`). No vendor guarantee. | Treat as unstable. Probably do not build. |
| `SOURCES.rayleigh` (U.S. Army BRL) | Attribution removed; constants now derived instead. | Nothing, unless a specific BRL document is identified. |

### On the drop convention

This matters more than it sounds. Publishers differ on whether a table's "drop"
column means:

1. below the line of sight through the stated zero, or
2. below the bore, or
3. below a horizontal muzzle line.

This solver uses (1), because that is what a shooter needs. Reconciling with a
specific publisher requires reading that publisher's stated convention. Until
someone does, the drop figures are internally consistent and physically
verified but not yet reconciled to a named external table.

---

## Coverage of the codebase

| Module | Status |
|---|---|
| `atmosphere.ts` | Every constant sourced. Two unit traps documented in place. |
| `drag/dragTables.ts` | G1/G7 tables cited to Sierra. |
| `drag/solver.ts` | Every coefficient sourced or named. Three failure modes documented. |
| `dispersion.ts` | Constants now imported from provenance, verified analytically. |
| `reloading.ts` | Homann exponent routed through provenance as `estimated`. |
| `weather.ts` | Unit conversions cited; conversion rules documented. |
| `devices/` | No physical constants. Protocol knowledge only. |
| `provenance/constants.ts` | 26 constants, all tiered. |

**Ten constants are declared but not yet consumed** by production code:
`INCHES_PER_YARD`, `FEET_PER_METRE`, `MILRAD`, `G1_DRAG_MODEL`,
`GRUBBS_DEFAULT_ALPHA`, `SPEED_OF_SOUND_REF_FPS`, `TRANSONIC_MACH_THRESHOLD`,
`STANDARD_SEA_LEVEL_TEMP_F`, `ISA_DENSITY_EXPONENT`, `ISA_BAROMETRIC_HEIGHT_FT`.

They are retained because the transonic screen and the web field conversions
are expected to need them, and deleting a sourced constant only to re-add it
later loses the citation history. Each is harmless if unused.

---

## Verification closed this session: the drag model, not the solver

The velocity discrepancy that made the reference trajectory "unverified" turned
out to be a **G1 versus G7 selection error in the validation**, not a defect in
the solver.

A .308 Win 168 gr Federal Gold Medal Match is a modern **boat-tailed** bullet,
published with two coefficients: G1 0.462 and G7 0.320. A G1 coefficient is
referenced to a 10 lb **round-nose** projodal; G7 exists because modern
boat-tailed bullets slip more efficiently through the transonic region than
that reference does.

Running the same solver on both:

| Model | BC | Velocity at 1000 yd | vs published 1394 fps |
|---|---|---|---|
| G1 | 0.462 | 1334 fps | **-4.34%** |
| G7 | 0.320 | 1388 fps | **-0.40%** |

The earlier check had pinned `dragModel: 'G1'` on a bullet whose G7 is the
better fit. **The physics was right; the test was asking the wrong question.**

The diagnostic that found it is worth keeping: a velocity error that **grows
linearly with range** indicates a drag-scale or coefficient mismatch, not a
transcription error. The G7 residual has a completely different shape — a
smooth mid-range peak of ~1.85% at 400–500 yd tapering to 0.40% at 1000 yd —
which is consistent with drag-table interpolation.

For the accuracy bar: Courtney, Morris & Courtney (arXiv:1608.06500) report that
Doppler radar determines free-flight drag coefficients to **1% or better** for
Mach 0.3–3.0. Our 0.40% agreement at 1000 yards sits inside that bar.

Full derivation and the sources gathered are in
`docs/BALLISTICS-AUDIT.md`, "Building and verifying the reference trajectory".
