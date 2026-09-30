# Agent Handoff Pack

Self-contained briefs for parallel agents. Each assumes no knowledge of this
repo beyond what the brief states. Hand them out one per agent.

## Ground rules for every agent

1. **Never invent a value.** Safety-critical reference data only comes from a
   published manufacturer manual, CIP/SAAMI standard, or NIST. Leave a cell
   EMPTY rather than guessing. See `data/incoming/powders.md` for the
   accuracy doctrine already in force.
2. **Never commit an original source document.** Archived PDFs are gitignored.
   Republish derived single facts with attribution only.
3. **Run `npm run verify` before you finish.** It is lint + typecheck + tests
   + schema + seed. All five must pass.
4. **Do not edit files you were not assigned.** If you find a bug elsewhere,
   report it in your summary rather than fixing it.
5. **Document provenance in code.** Every physical constant belongs in
   `packages/ballistics-core/src/provenance/constants.ts` wrapped in
   `published()`, `derived()`, or `estimated()`. No bare numeric literals in
   computation code.

## Repo shape

npm workspaces monorepo. `apps/website` (Cloudflare Pages), `apps/ballistics`
(Expo 57), `packages/ballistics-core` (pure domain logic), `data/schema`
(numbered D1 migrations), `data/published` (archived source PDFs),
`data/incoming` (hand-curated CSVs).

## Lane dependency map

```
Lane 1 (solver)  ──────────────┐
                               ├──> Lane 2 (screens) ──> ship
Lane 3 (intake) ───────────────┘
Lane 3 + Lane 4 ─────────────────> Lane 5 (website catalog)
Lane 6 (docs) ── independent, start now
```

**Lane 1 blocks Lane 2.** Lane 6 is independent. Lanes 3 and 4 are
independent. Run Lane 6 immediately, Lane 1 next.


---

# Lane 1 — Finish the trajectory solver (HIGHEST PRIORITY)

**Why first:** `packages/ballistics-core/src/drag/solver.ts` **does not exist.**
A previous attempt produced physically impossible output (velocity *increasing*
from 2650 to 3929 fps), so it was deleted rather than shipped.
`drag/dragTables.ts` survives and is complete, correct data — that is what the
solver will consume.

**What went wrong, so you don't repeat it.** The dead attempt mixed up the drag
formulation. Do not use these:

- Treating the *form factor* `CF / (d² · BC)` as a mass density. It is a
  projection factor; used directly it overstates drag by ~10⁵.
- Drag opposing *ground* velocity instead of velocity *relative to the air
  mass*, which is what a crosswind actually changes.
- Applying `G7_FORM_FACTOR` to a G1 coefficient.
- **Inverting the drag sign**, which silently turns drag into thrust — the
  original failure. Always assert that velocity decreases.

**Reference data to calibrate against** (ShootersCalculator; .308 Win 168gr
Federal Gold Medal Match, G1 BC 0.462, 2650 fps, 100 yd zero):

| Range yd | Drop in | Time s | Velocity fps |
|---|---|---|---|
| 100 | 0.01 | 0.12 | 2501 |
| 200 | -3.06 | 0.24 | 2357 |
| 300 | -12.39 | 0.37 | 2218 |
| 400 | -28.80 | 0.51 | 2084 |
| 500 | -53.23 | 0.66 | 1954 |
| 600 | -86.78 | 0.82 | 1830 |
| 700 | -130.73 | 0.99 | 1711 |
| 800 | -186.58 | 1.17 | 1598 |
| 900 | -256.06 | 1.36 | 1493 |
| 1000 | -341.17 | 1.57 | 1394 |

A G7 comparison set is also worth pulling (.308 168gr A-Max, G7 ≈ 0.320).

**Your task:**

1. Implement `TrajectorySolver` in
   `packages/ballistics-core/src/drag/solver.ts` using the standard
   retardation equation with the G1/G7 tables and RK4 integration.
2. Use the **two-pass zero-offset** approach:
   - **Pass 1** — integrate with no zero applied, recording raw `y`.
   - **Pass 2** — interpolate raw `y` at `env.zeroYd`, then subtract that
     offset from every sample. This makes "0.0 MOA at 100 yd" true by
     definition. Do not interpolate the bore line analytically.
3. Add a `DragModel` parameter and use the matching table **and** matching form
   factor (`G1 = 1`, `G7 = 1.2`).
4. Implement wind drift — `driftIn` is currently unimplemented. The Bryan Litz
   "wind hack" (`drop_moa / (G7_first_digit + 2)`) is a **sanity check, not an
   implementation**; cross-check at 1000 yd, expect ±0.2 MOA.
5. Export `TrajectorySolver` and the drag tables from
   `packages/ballistics-core/src/index.ts`.
6. Add `packages/ballistics-core/test/solver.test.ts` asserting the reference
   table above.

**Validation is the whole point.** Velocity must decrease monotonically. Drop
at 500 yd must land within ~5% of −53 in. Anything else means the drag
formulation is wrong, not the tables.

**Then:** `DopeCardScreen.jsx` still computes
`0.00008 * Math.pow(yd, 2.3)`. Replace it with `TrajectorySolver` +
`BallisticProfile.of`, taking MV/DA/zero from state rather than hardcoded
strings. **Until that is done the DOPE card is actively dangerous** — it shows
53 ft of drop at 1000 yd where a real .308 drops 7.7 ft.

**Also update** `docs/BALLISTICS-AUDIT.md` section 1, which still documents the
old formula as the current state.

---

# Lane 2 — Rewire the app screens to the domain package

**Why:** every screen in `apps/ballistics/screens/` still computes its own
inline math. They must import from `@apex/ballistics-core` so there is exactly
one implementation of each formula.

**Broken code to replace:**

| File | Problem |
|---|---|
| `DopeCardScreen.jsx` | `0.00008 * Math.pow(yd, 2.3)` returns **53 ft** of drop at 1000 yd (real: ~7.7 ft). MV/DA/zero are static strings that never enter the math. |
| `RayleighGroupCalculator.jsx` | `sqrt(sumSqRadii / (2*n))` needs `(n-1)`. Under-reports CEP by 18%. `cep90` computed but never displayed. |
| `TransonicStabilityScreen.jsx` | Accepts velocity and Sg inputs, **uses neither**. Confirmed by lint: `vel` and `gyroscopicSg` assigned, never read. |

**Your task:**

1. Add `@apex/ballistics-core` as a workspace dependency of
   `apps/ballistics/package.json`.
2. Rewrite `DopeCardScreen` on `TrajectorySolver` + `BallisticProfile.of`.
   Pull MV, DA, and zero from state, never hardcoded strings.
3. Rewrite `RayleighGroupCalculator` on the tested `dispersion()` export.
   Display CEP50, CEP90, extreme spread, and mean radius.
4. Rewrite `TransonicStabilityScreen` using `machNumber()` and
   `TRANSONIC_MACH_THRESHOLD`. **Either** implement stability factor `Sg`
   properly **or** delete the input. Never leave an input that does nothing.
5. Memoize the Rayleigh metrics — `calculateMetrics()` recomputes every
   render.
6. Convert touched files to `.tsx`; drop the unused `withSpring` import from
   `TargetLoupe.tsx`.

**OOP note:** screens should hold `BallisticProfile` instances, not loose
numbers. That is what stops magic numbers re-entering the UI.

---

# Lane 3 — Data intake pipeline

**Why:** the schema is rich but **empty**. 20 tables, effectively zero rows of
real component data. `data/incoming/powders.md` is an excellent exemplar of the
accuracy doctrine — follow it.

**Current state:** `data/incoming/` has powders. `data/published/` archives
real primary sources (SAAMI Z299.3/299.4, Hodgdon burn-rate chart, Vihtavuori
and Alliant reloading guides, CIP TDCC index).

**Build the loader — do not hand-write inserts:**

1. `scripts/import-csv.ts` — streaming CSV loader that upserts into D1,
   header-driven, with per-column transforms and a `--dry-run` mode reporting
   what would be written and what was rejected.
2. `scripts/validate-row.ts` — plausibility checks that refuse absurd data:
   - bullet weight 5–1000 gr; charge weight 0.1–200 gr
   - BC 0.005–1.0; velocity 300–5000 fps
   - **bullet weight and charge weight within 0.2–1.2× of each other** for a
     given load — this catches the most common transcription error
3. Wire `npm run data:import -- <file>`.
4. Every row must land with a `source_id` pointing at `sources`. Reject
   anything without provenance.
5. `scripts/report-coverage.ts` — per-table row count plus columns still

---

# Lane 4 — Retailer scrapers

**Why:** prices and availability change constantly and need scheduled
refresh. This is the only part of the system that touches live third-party
sites.

**Your task — one scraper per retailer behind a shared interface:**

1. Define a common `RetailerScraper` interface:
   `{ id, name, affiliateUrl, search(product): Promise<Listing[]> }` where
   `Listing` is `{ priceCents, inStock, url, observedAt }`.
2. Implement for retailers already seeded in `data/schema/003`: MidwayUSA,
   Brownells, Natchez, Powder Valley, Target Sports, OpticsPlanet,
   Primary Arms, Palmetto State Armory.
3. **Rate-limit hard.** One request per second, honour `robots.txt`, identify
   the bot honestly in the User-Agent, cache aggressively. Do **not**
   circumvent anti-bot measures — if a retailer blocks automated access, mark
   it `unsupported` and move on. That is a supported outcome, not a failure.
4. Write prices with `INSERT` only. `price_observations` is append-only by
   design; never update a price row.
5. Add `scripts/schedule-prices.ts` with a cron-friendly entry point.

**Compliance:** every outbound link is affiliate-tagged through the AvantLink
network. Verify each retailer's program is still live before coding against
it — several have migrated to Impact or Partnerize since the original
research.

---

# Lane 5 — Website rebuild and security hardening

**Why:** the website has a **live bug** and several **injection
vulnerabilities**.

**Already fixed by the primary writer — verify, do not redo:**
- `main.js` missing dataset imports — **fixed**, imports added.
- `innerHTML` XSS in the retailer and checklist renderers — **fixed**. New
  `apps/website/src/dom.js` provides `el()`, `icon()`, `externalLink()`, and
  `safeUrl()`. The `safeUrl()` helper rejects `javascript:`/`data:` URLs, and
  external links carry `rel="noopener noreferrer sponsored"`.
- `tailwind.config.js` global assignment — **fixed**, now an exported `theme`
  object with a guarded global write.
- CSV injection in `backupService.js` — **fixed**. `csvCell()` prefixes
  `= + - @ TAB CR` with an apostrophe and RFC-4180 quotes every field;
  filenames go through `safeFilename()`.
- Prototype pollution + type confusion in `importDatabaseFromJson` —
  **fixed**. `parseBackupJson()` strips `__proto__`/`constructor`/`prototype`,
  coerces and type-checks every field, and caps record count at 50,000.
- `localStorage` shape confusion in `database.js` — **fixed**, now
  `Array.isArray()`-checked.
- Unused `withSpring` import and the dead transonic inputs — **fixed**.

**Still outstanding:**

1. **Native backup export/import is broken.** `expo-file-system`'s
   `writeAsStringAsync`, `documentDirectory`, and `readAsStringAsync` were
   removed in SDK 54 (they moved to `expo-file-system/legacy`). Migrate to the
   `File`/`Paths` classes.
2. **Babel standalone in production.** `apps/website/index.html` still loads
   Tailwind, React 18, and `@babel/standalone` from CDNs, plus an unpinned
   `lucide@latest`. Babel-in-browser ships a compiler to users. Rebuild as
   Vite modules; compile Tailwind locally; React 19 to match the app.
3. **No CSP.** Add a strict `default-src 'self'` policy with no
   `unsafe-inline`, and move inline `<script>` blocks into modules so the
   policy can be enforced.
4. **`index.html` still carries its own copy of the vulnerable renderer.** It
   is the file actually deployed today. Either delete it in favour of the
   built output, or apply the same `dom.js` treatment.
5. **Add `npm audit --audit-level=high` to CI.**
6. **Input validation at the boundary.** The calculator reads raw
   `parseFloat(input.value)` with `|| 0` fallbacks; a negative or absurd value
   silently produces nonsense. Clamp and validate, and surface bad input.

---

# Lane 6 — Documentation

**Your task:**

1. Rewrite `README.md` for a human landing cold: the product, the affiliate
   model, how to run it, how to deploy.
2. `docs/GETTING-STARTED.md` — first 30 minutes, local D1, test data.
3. `docs/CONTRIBUTING.md` — accuracy doctrine, adding a migration, adding a
   sourced constant.
4. `docs/SECURITY.md` — threat model, the injection classes above, how to
   report a vulnerability.
5. `CONTEXT.md` at repo root: a dense briefing for an LLM picking this up
   cold. Cover the domain, the provenance rules, the module map, the
   known-broken items, and what must never be done (inventing numbers).
6. `docs/DECISIONS.md` — an ADR log. Start with: D1 over Supabase, static
   Pages over SSR, modules over React-in-browser, `ballistics-core` as a
   shared package, the provenance tier system.

   >50% NULL. This report is how the team decides what to scrape next.

**Then populate, in priority order:**

1. `cartridges` — the ~30 most-used American rifle/pistol cartridges from
   CIP/SAAMI TDCC, with case dimensions, parent case, max pressure.
2. `products` — factory ammunition SKUs with box counts and BCs.
3. `bullets` — **prioritise the boutique makers the user asked for**, not
   just Hornady/Sierra: Black Hills Reloading, Rocky Mountain Reloaders,
   Leupold, Redding, Cutting Edge, Applied Ballistics, Schulte's, Berger,
   Nosler, Match King, Deer Creek, Swift. Grains, BC G1+G7, sectional
   density, jacket type, base, diameter.
4. `powders` — burn-rate class, temperature sensitivity, hygroscopicity,
   energy per grain, bulk density, canister sizes. The
   `powder_burn_rate_positions` / `powder_burn_rate_charts` tables are already
   waiting for the archived Hodgdon and Vihtavuori charts.

| Same, drop at 1000 yd | **~100 MOA low** (≈ 300 inches) |
| Velocity retained at 1000 yd | ~1600–1750 fps |
| Time of flight to 500 yd | ~0.62–0.70 s |

Cross-check 500 yd against a published Sierra exterior-ballistics table. A
discrepancy over ~5% means the bug is in the drag formulation, not the table
— verify `rho` is scaled to the in²/lb convention and that you are not
applying `G7_FORM_FACTOR` to a `G1` coefficient.

**Also fix:** `docs/BALLISTICS-AUDIT.md` section 1 documents the old
`0.00008 * yd^2.3` formula. Once verified, update it to reference the real
solver and record the measured-vs-expected table.
