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
├─ apps/
│  ├─ website/          apex-amc.com — the primary deliverable
│  │  ├─ index.html     single-file site (deployed as-is)
│  │  └─ src/           extracted modules: dom.js, main.js, data/
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
│  ├─ schema/          numbered D1 migrations (001…011), applied in order
│  ├─ incoming/        hand-curated CSVs (powder, bullet, cartridge…)
│  ├─ published/       archived source PDFs + MANIFEST.md (gitignored)
│  └─ seeds/           optional seed CSVs
├─ scripts/            schema validation, source archiving, extractors
├─ docs/               architecture, data model, audits, handoff pack
└─ archive/gemini/     prior drafts, kept for provenance, never built

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
| Domain library | Dispersion, reloading, atmosphere, drag tables — tested |
| Trajectory solver | **Not implemented.** Spec in `docs/AGENT-HANDOFF.md` Lane 1 |
| Database schema | 20 tables, validated |
| Seed data | Powders 145, pressure refs 275, published docs 23 |
| Website | Single-file, XSS-hardened, calculator working |
| Field app | Works; some screens still hold inline math |
| Community/forum | Designed only — see `docs/COMMUNITY-AND-GROUP-BUY.md` |

### Known broken / incomplete

- **Trajectory solver missing.** `drag/dragTables.ts` is complete data; the
  integrator is not written.
- **DOPE card uses a fabricated drop formula**
  (`DopeCardScreen.jsx` returns ~53 ft at 1000 yd where a real .308 drops
  ~7.7 ft). Do not ship it. See `docs/BALLISTICS-AUDIT.md`.
- **Native backup export/import is broken** — uses `expo-file-system` legacy
  APIs removed in SDK 54. Migrate to the `File`/`Paths` classes.
- **`useBallisticsDb` is per-screen**, so a rifle created in one screen is
  invisible to the others. Needs a shared context.

## Documentation

| Doc | Contents |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layout, rationale, free-tier infrastructure |
| [docs/DATA-MODEL.md](docs/DATA-MODEL.md) | Entity map, invariants, D1 vs Supabase |
| [docs/BALLISTICS-AUDIT.md](docs/BALLISTICS-AUDIT.md) | Which formulas were wrong, by how much, with evidence |
| [docs/COMMUNITY-AND-GROUP-BUY.md](docs/COMMUNITY-AND-GROUP-BUY.md) | Forum + group-buy design and the money-transmitter constraint |
| [docs/AGENT-HANDOFF.md](docs/AGENT-HANDOFF.md) | Parallel-agent briefs |

```


