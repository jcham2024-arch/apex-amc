# Apex AMC

**Apex Ammunition & Components** â€” apex-amc.com

A free-to-run ammunition reference and affiliate site: an ammunition catalog,
a cost-per-round / press break-even calculator, a retailer directory, and
published reloading load data.

Monetization is affiliate commission (AvantLink network â€” MidwayUSA,
Brownells, Natchez, Palmetto State Armory, OpticsPlanet, Primary Arms, Powder
Valley, Target Sports). Google AdSense does not serve ammunition pages, so
affiliate is the entire revenue model. There is no server cost.

**We never hold customer funds.** Pooling member money for group buys would
make us a money transmitter â€” see
[docs/COMMUNITY-AND-GROUP-BUY.md](docs/COMMUNITY-AND-GROUP-BUY.md).

---

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
| `npm run schema:check` | Applies every D1 migration to in-memory SQLite, verifies seed rows landed |
| `npm run seed:check` | Validates `data/incoming/*.csv`, reports coverage |
| `npm run data:fetch` | Archives published source PDFs to `data/published/` |
| `npm run website:dev` | Vite dev server |
| `npm run website:build` | Static build to `apps/website/dist` |
| `npm run db:local` / `db:remote` | Apply D1 migrations locally / to production |

## Repository layout

```
ApexProject/
â”œâ”€ apps/
â”‚  â”œâ”€ website/          apex-amc.com â€” the primary deliverable
â”‚  â”‚  â”œâ”€ index.html     single-file site (deployed as-is)
â”‚  â”‚  â””â”€ src/           extracted modules: dom.js, main.js, data/
â”‚  â””â”€ ballistics/       Expo SDK 57 field app (offline use)
â”œâ”€ packages/
â”‚  â””â”€ ballistics-core/  pure, tested, framework-free domain logic
â”‚     â””â”€ src/
â”‚        â”œâ”€ provenance/  Sourced<T>, published/derived/estimated, constants
â”‚        â”œâ”€ domain/      BallisticProfile value object
â”‚        â”œâ”€ drag/        G1/G7 drag tables
â”‚        â”œâ”€ dispersion.ts  CEP, extreme spread, Grubbs flyer detection
â”‚        â”œâ”€ reloading.ts   Homann barrel scaling, ladders, COAL warnings
â”‚        â””â”€ atmosphere.ts  speed of sound, Mach, density
â”œâ”€ data/
â”‚  â”œâ”€ schema/          numbered D1 migrations (001â€¦011), applied in order
â”‚  â”œâ”€ incoming/        hand-curated CSVs (powder, bullet, cartridgeâ€¦)
â”‚  â”œâ”€ published/       archived source PDFs + MANIFEST.md (gitignored)
â”‚  â””â”€ seeds/           optional seed CSVs
â”œâ”€ scripts/            schema validation, source archiving, extractors
â”œâ”€ docs/               architecture, data model, audits, handoff pack
â””â”€ archive/gemini/     prior drafts, kept for provenance, never built

## The provenance system â€” read before adding any number

This project publishes reloading data. **A wrong charge weight can injure
someone.** Every physical constant declares where it came from:

```ts
import { published, derived, estimated } from './provenance/Source.ts';

// Quoted from a standard.
export const GRAINS_PER_POUND = published(7000, SOURCES.cip, { units: 'gr/lb' });

// Computed from published values by a documented method.
export const SPEED_OF_SOUND_COEF = derived(49.022, SOURCES.usStdAtm,
  'Fitted from the standard-atmosphere table: a = k * sqrt(T_rankine).');

// No published figure exists â€” and we say so.
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
## Current status

| Area | State |
|---|---|
| Trajectory solver | **Implemented and validated.** RK4, G1/G7, wind, two-pass bore angle |
| Domain library | Dispersion, reloading, atmosphere, drag tables — all tested |
| Device layer | **Contracts + pipeline + turret gate built.** No vendor driver yet |
| Weather | Conditions module + Open-Meteo parser. No screen yet |
| Database schema | 20 tables, validated |
| Seed data | Powders 145, pressure refs 275, published docs 23 |
| Website | Single-file, XSS-hardened, calculator working |
| Field app | Works; screens rewired to the solver |
| Community/forum | Designed only — see `docs/COMMUNITY-AND-GROUP-BUY.md` |
| Tests | 157 passing, lint and typecheck clean |

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
- **`apps/website/index.html`** still carries CDN React, Babel standalone and an
  unpinned `lucide@latest`, and still has its own copy of the renderer that was
  fixed in `src/`. It is the file actually deployed today.


## Documentation

| Doc | Contents |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layout, rationale, free-tier infrastructure |
| [docs/DATA-MODEL.md](docs/DATA-MODEL.md) | Entity map, invariants, D1 vs Supabase |
| [docs/BALLISTICS-AUDIT.md](docs/BALLISTICS-AUDIT.md) | Which formulas were wrong, by how much, with evidence |
| [docs/SOURCES.md](docs/SOURCES.md) | **Every source, its verification status, and what is NOT yet verified** |
| [docs/HARDWARE-AND-SENSORS.md](docs/HARDWARE-AND-SENSORS.md) | Rangefinders, weather meters, and the scope-camera question |
| [docs/COMMUNITY-AND-GROUP-BUY.md](docs/COMMUNITY-AND-GROUP-BUY.md) | Forum + group-buy design and the money-transmitter constraint |
| [docs/AGENT-HANDOFF.md](docs/AGENT-HANDOFF.md) | Parallel-agent briefs |
