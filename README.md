# Apex AMC

**Apex Ammunition & Components** — apex-amc.com

A free-to-run ammunition reference and affiliate site: an ammunition catalog,
a cost-per-round / press break-even calculator, a retailer directory, and
published reloading load data.

Monetization is affiliate commission (AvantLink network — MidwayUSA,
Brownells, Natchez, Palmetto State Armory, OpticsPlanet, Primary Arms, Powder
Valley, Target Sports). Google AdSense does not serve ammunition pages, so
affiliate is the entire revenue model. There is no server cost.

**We never hold customer funds.** Pooling member money for group buys would
make us a money transmitter — see
[docs/COMMUNITY-AND-GROUP-BUY.md](docs/COMMUNITY-AND-GROUP-BUY.md).

---

## Working in this repo?

**Read [`AGENTS.md`](AGENTS.md) first.** It is the baseline for any agent or new
contributor: the governing rules, the verified current state, and a table of the
traps that have silently produced wrong behaviour in this codebase.

For what to work on next, see [`docs/DATA-TODO.md`](docs/DATA-TODO.md) for the
data layer and [`docs/TASK-LIST.md`](docs/TASK-LIST.md) for code and safety.

## Quick start

```bash
npm install
npm run verify      # lint + typecheck + tests + schema + seed. Must pass.
npm run website:dev
```

Requires **Node 22.6+** (the tooling uses `node:sqlite` and type stripping).

## Commands

| Command | What it does |
|---|---|
| `npm run verify` | Everything below in order. The gate before committing. |
| `npm run lint` | ESLint 10, type-aware across `packages/` |
| `npm run typecheck` | Strict `tsc`, no emit |
| `npm test` | Unit tests over the domain package |
| `npm run schema:check` | Applies every D1 migration to in-memory SQLite, then asserts CSV→table row parity |
| `npm run seed:check` | Loads every seed CSV into SQLite and checks it, including the column manifests |
| `npm run data:health` | One-glance data quality report — run this first |
| `npm run coverage` | Per-manufacturer coverage table |
| `npm run docs:check` | Markdown structure **and** that every repository path in backticks resolves: fences, swallowed headings, duplicates, encoding. **In `verify`.** |
| `npm run docs:audit` | Report line-ending / BOM drift across text files. Changes nothing. |
| `npm run docs:fix` | Apply that normalisation. Markdown only unless `--all`. |
| `npm run handoff:status` | Main app is unchanged, self-contained, supply-chain clean. **In `verify`.** |
| `npm run security:check` | Security review of the deployed app: XSS sinks, unpinned remote scripts. **In `verify`.** See [`SECURITY.md`](SECURITY.md). |
| `npm run modules:check` | Module architecture: everything loads, imports resolve, no cycles, packages assemble. **In `verify`.** See [`ARCHITECTURE.md`](ARCHITECTURE.md). |
| `npm run data:build` | Validates CSVs against `data/schemas/*.yaml`, regenerates JSON + Markdown |
| `npm run data:validate` | Fails if a generated file is stale (part of `verify`) |
| `npm run data:fetch` | Archives published source PDFs to `data/published/` |
| `npm run website:dev` | Vite dev server |
| `npm run website:build` | Static build to `apps/website/dist` |
| `npm run website:check` | Verifies the built artefact (in `verify`) |
| `npm run website:csp:browser` | Serves `dist/` under its real `_headers`, asserts in headless Chrome that the script actually runs (in `verify`) |
| `npm run claims:check` | Bans unsupported advertising claims, checks affiliate-disclosure placement and an accessibility floor (in `verify`) |
| `npm run tasks:check` | Multi-agent task ledger: fails on any overlapping write-set between runnable tasks (in `verify`) |
| `npm run tasks:gen` | Regenerates the 16 task files from `docs/AGENT-PROMPTS.md` |
| `npm run probe:pdf` | One-shot: try to extract text from an archived source PDF with no dependencies |
| `npm run db:local` | Builds `data/generated/apex.sqlite` from migrations + seed CSVs (1,666 rows) |

## Repository layout

```
ApexProject/
├─ apps/
│  ├─ website/          apex-amc.com — the primary deliverable
│  │  ├─ src/           the site: index.html (Vite entry), main.js, dom.js, data/
│  │  ├─ dist/          GENERATED single-file site (built by npm run website:build)
│  │  ├─ vite.config.js asset inlining, so dist/ stays self-contained
│  │  └─ README.md
│  └─ ballistics/       Expo SDK 57 field app (offline use)
├─ packages/
│  └─ ballistics-core/  pure, tested, framework-free domain logic
│     └─ src/
│        ├─ provenance/  Sourced<T>, published/derived/estimated, constants
│        ├─ domain/      BallisticProfile value object
│        ├─ drag/        G1/G7 drag tables
│        ├─ dispersion.ts  CEP, extreme spread, Grubbs flyer detection
│        ├─ reloading.ts   Homann barrel scaling, ladders, COAL warnings
│        └─ atmosphere.ts  speed of sound, Mach, density
├─ data/
│  ├─ schema/          numbered D1 migrations (001-013), applied in order
│  ├─ seeds/           the curated reference data - CSV, one file per maker
│  ├─   bullets/        sierra.csv, hornady.csv, berger.csv, ...
│  ├─   powders/        accurate, alliant, hodgdon, imr, ramshot, vihtavuori, winchester
│  ├─   cartridge_specs/ rifle.csv, pistol.csv, shotgun.csv
│  ├─ schemas/         column contracts (YAML) - the rules the loader enforces
│  ├─ generated/       json/ and md/, built from the CSVs. Never edit.
│  ├─ incoming/        raw research drop, gitignored. Never read by the loader.
│  ├─ published/       archived source PDFs + MANIFEST.md (gitignored)
├─ scripts/            schema validation, source archiving, extractors
├─ docs/               architecture, data model, audits, handoff pack
└─ archive/gemini/     prior drafts, kept for provenance, never built
```

## The provenance system — read before adding any number

This project publishes reloading data. **A wrong charge weight can injure
someone.** Every physical constant declares where it came from:

```ts
import { published, derived, estimated } from './provenance/Source.ts';

// Quoted from a standard.
export const GRAINS_PER_POUND = published(7000, SOURCES.cip, { units: 'gr/lb' });

// Computed from published values by a documented method.
export const SPEED_OF_SOUND_COEF = derived(49.022, SOURCES.usStdAtm,
  'Fitted from the standard-atmosphere table: a = k * sqrt(T_rankine).');

// No published figure exists — and we say so.
export const TRANSONIC_MACH_THRESHOLD = estimated(1.2, SOURCES.sierraBallistics,
  'Instability onset is load-dependent; 1.2 Mach is a field convention, not a standard.');
```

| Tier | Meaning | Requires |
|---|---|---|
| `published` | Transcribed from a manual, CIP, SAAMI, or NIST | A real `SourceCitation` |
| `derived` | Computed from published values | `method` |
| `estimated` | **No published value exists** | `reasoning` explaining why |

`estimated` is not a loophole for inventing numbers. It exists so a user asking
"where does this come from?" gets an honest answer instead of a confident
fabrication. `UnverifiedValueError` is thrown if you try to create an
`estimated` value without a reason.

**No bare numeric literals in computation code.** If you need a coefficient,
import it.

## Data invariants

1. **Provenance is mandatory.** `recipes.source_id` is `NOT NULL` and
   `ON DELETE RESTRICT`. Load data cannot exist without a manual to point at.
2. **Prices are append-only.** `price_observations` rows carry an
   `observed_on` date and are never updated. A new price is a new row.
3. **Archived PDFs are never redistributed.** They are gitignored. Only
   derived single facts are republished, always with attribution.

## Current status

| Area | State |
|---|---|
| Trajectory solver | **Implemented and validated.** RK4, G1/G7, wind, two-pass bore angle |
| Domain library | Dispersion, reloading, atmosphere, drag tables — all tested |
| Device layer | **Contracts + pipeline + turret gate built.** No vendor driver yet |
| Weather | Conditions module + Open-Meteo parser. No screen yet |
| Database schema | 20 tables, validated |
| Seed data | Powders 169 (7 brands), bullets 120, cartridges 229, pressure refs 782, published docs 23 |
| Website | Single-file, XSS-hardened, calculator working |
| Field app | Works; screens rewired to the solver |
| Community/forum | Designed only — see `docs/COMMUNITY-AND-GROUP-BUY.md` |
| Tests | 235 passing, lint and typecheck clean |

### Verified state of the ballistics

Reference case: .308 Win, 168 gr Federal Gold Medal Match (boat-tailed),
G1 BC 0.462 / G7 BC 0.320, 2650 fps, 100 yd zero, ISA sea level. Solved on the
G7 model, which is the correct one for a modern boat-tailed bullet.

| Range | Drop | MOA | Velocity | Time |
|---|---|---|---|---|
| 300 yd | -17.7 in | -5.9 | 2183 fps | 0.38 s |
| 500 yd | -64.7 in | -12.9 | 1918 fps | 0.67 s |
| 1000 yd | -373.8 in | -37.4 | 1388 fps | 1.59 s |

**Velocity agrees with published reference data to 0.40% at 1000 yards,**
sitting inside the 1% accuracy the Doppler radar literature reports for
empirical drag measurement. The earlier 4.3% gap was a G1/G7 selection error
in the validation, not a defect in the solver. See `docs/SOURCES.md`.

The **drop** column has not been reconciled against a named external table:
publishers differ on whether "drop" means below the line of sight, below the
bore, or below a horizontal muzzle line. With velocity correct to 0.40%, the
physics is sound and the residual is presentational. `docs/SOURCES.md` lists
this as the one open item.

### Known incomplete

- **Reference velocity column: resolved.** Agrees to 0.40% using the correct drag model (G7 for this boat-tailed bullet). The earlier 4.3% gap was a G1/G7 selection error in the validation, not a solver defect.
  publishers differ on the drop convention. With velocity correct to 0.40%,
  the physics is sound and the residual is presentational. `docs/SOURCES.md` lists this.
- **No device drivers.** The architecture, capability model and turret gate
  exist and are tested against simulated hardware. Rangefinder and weather-meter
  drivers are the next thing to write. **No scope driver will exist until a
  manufacturer permits one** — SIG BDX, Nightforce, Leupold, Vortex and
  Swarovski all speak proprietary protocols to their own apps.
- **Native backup export/import is broken** — uses `expo-file-system` legacy
  APIs removed in SDK 54. Migrate to the `File`/`Paths` classes.
- **`useBallisticsDb` is per-screen**, so a rifle created in one screen is
  invisible to the others. Needs a shared context.
- **No weather screen.** The module and parser exist and are tested; the UI
  that consumes them does not.
- **The website still loads `cdn.tailwindcss.com`** — a runtime CSS compiler,
  unpinned and with no Content Security Policy. Both are tracked in
  `SECURITY.md` and recorded in the finding baseline. The target is a
  build-time stylesheet and a nonce-based strict CSP.
- **The database is empty.** Migrations create 25 tables; the loader that
  populates them from the seed CSVs does not exist yet, so the site renders
  from its hand-held datasets. See `docs/DATA-TODO.md` §0.2.


## Documentation

| Doc | Contents |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Layout, rationale, free-tier infrastructure |
| [docs/DATA-MODEL.md](docs/DATA-MODEL.md) | Entity map, invariants, D1 vs Supabase |
| [docs/BALLISTICS-AUDIT.md](docs/BALLISTICS-AUDIT.md) | Which formulas were wrong, by how much, with evidence |
| [docs/SOURCES.md](docs/SOURCES.md) | **Every source, its verification status, and what is NOT yet verified** |
| [docs/HARDWARE-AND-SENSORS.md](docs/HARDWARE-AND-SENSORS.md) | Rangefinders, weather meters, and the scope-camera question |
| [docs/COMMUNITY-AND-GROUP-BUY.md](docs/COMMUNITY-AND-GROUP-BUY.md) | Forum + group-buy design and the money-transmitter constraint |
| [AGENTS.md](AGENTS.md) | Parallel-agent briefs |
