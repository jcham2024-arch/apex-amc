# ARCHITECTURE.md — the module map

**Last measured 2 Oct 2026.** Every count came from `npm run modules:check`, not
from memory.

---

## The shape of it

```
ApexProject/
├─ packages/ballistics-core/   THE DOMAIN. pure, tested, framework-free. 20 modules
├─ apps/
│  ├─ website/                apex-amc.com. 5 modules + the built artefact
│  └─ ballistics/             the Expo field app. 13 modules
├─ scripts/                   the data pipeline and every gate. 35 modules
│                              grouped by responsibility - see scripts/README.md
└─ data/                      the curated facts. Not code.
```

**73 modules, 80 local imports, 0 cycles.** One direction of dependency:

```
apps/website ──┐
               ├──> packages/ballistics-core   (owns all physics)
apps/ballistics ┘
        │
        └──> scripts ──> data/                  (the pipeline, never the reverse)
```

Nothing in `packages/` imports from `apps/` or `scripts/`. Nothing in `data/` is
code. `scripts/` never imports from `apps/` — that boundary is what
`HANDOFF.md` exists to protect, and `check-handoff.mjs` enforces it.

### Where scripts live

`scripts/` is one directory per **module of responsibility**, not one flat
directory. `shared/data.mjs` declares every governed path once; nothing else
hardcodes one.

| Directory | Responsibility |
|---|---|
| `shared/` | Imported by the others. Paths, CSV + validation, encoding, publisher parsers |
| `data/` | The pipeline: build, validate, health, import, promote, snapshot |
| `extract/` | One-shot scrapers and cross-checks |
| `gates/` | Everything `verify` runs to decide the repo is sound |
| `handoff/` | The data↔app boundary |
| `security/` | Vulnerability rules, scanner, finding baseline |
| `text/` | Encoding normalisation, scanning, repair |
| `tests/` | Self-tests for the scripts themselves |

---

## Where the modules are, and why

### `packages/ballistics-core/` — 13 source modules, 7 test modules

The domain. One responsibility per file, which is the unit that matters:

| Module | Responsibility |
|---|---|
| `drag/solver.ts` | The trajectory solver. **761 lines, and it should stay that way.** |
| `drag/dragTables.ts` | G1/G7 reference curves as data, with their verification record |
| `domain/BallisticProfile.ts` | The value object. Validating constructor, factories |
| `provenance/Source.ts` | `Sourced<T>`, and the `published`/`derived`/`estimated` factories |
| `provenance/constants.ts` | Every physical constant, each carrying its citation |
| `atmosphere.ts` | Density ratio, speed of sound, Mach |
| `dispersion.ts` | CEP, extreme spread, Grubbs flyer detection |
| `reloading.ts` | Barrel scaling, ladders, COAL warnings |
| `weather.ts` | Conditions with per-field provenance |
| `devices/types.ts`, `solution.ts`, `drivers/simulated.ts` | Device contracts, the firing-solution pipeline, a simulated driver |
| `index.ts` | The barrel. The only thing the apps import |

### `apps/ballistics/` — 13 modules
`App.jsx` (navigation), `screens/` (9 screens), `services/` (`database.js`,
`backupService.js`), `hooks/`. Already one-concern-per-file.

### `apps/website/` — 5 modules, plus the built artefact
`src/dom.js` (safe DOM builders), `src/main.js` (the renderer), `src/data/*.js`
(the datasets), `src/styles/*.css`.

**`tailwind.config.js` was removed 1 Oct 2026.** The `tactical-*` scale now lives
in a `@theme` block in `src/styles/main.css`, which is what Tailwind v4 reads. The
old file only assigned a global for the deleted CDN runtime compiler, so keeping
it would have been dead code that looked load-bearing.

**The site is built.** `src/index.html` is the Vite entry;
`npm run website:build` produces `dist/index.html`, a single self-contained
file. That is the artefact Cloudflare serves, and it is pinned by SHA-256 — a
hand-edit fails `handoff:status` until it is explicitly accepted with
`handoff:accept`.

`vite.config.js` inlines the emitted JS and CSS, because a default Vite build
splits them into hashed files and would break the self-containment rule in
`HANDOFF.md`. `npm run website:check` fails if `dist/` contains a second file,
if the page grows a `fetch()`, or if it reaches into `data/`.

The previous 1,075-line hand-maintained `index.html` is retired. It never loaded
`src/`, so those modules were dead code and the two implementations had drifted
— `src/` was the hardened copy. It is kept for reference at
`archive/website-prototype/index.html` and is no longer authoritative.

### `scripts/` — 35 modules, in 8 directories
Grouped by responsibility; see the table above and `scripts/README.md`. The rule
is one directory per job, with `shared/` holding anything imported twice:

| Layer | Modules | Rule |
|---|---|---|
| **Gates** | `gates/check-*.mjs`, `text/test-*.mjs`, `tests/` | Read and report. Change nothing. |
| **Pipeline** | `data/build-data.mjs`, `extract/extract-*.mjs`, `data/import-bullets.mjs` | Write `data/`. Never write `apps/`. |
| **Shared** | `shared/data.mjs`, `shared/encoding.mjs`, `shared/bullet-sources.mjs` | Imported by two or more of the above |

`shared/` exists because of a specific failure: the BOM bug that killed
`export-d1.mjs` and `fetch-published-data.mjs` was fixed once, in
`shared/encoding.mjs`, rather than at two call sites that would drift. The same
reasoning later split the handoff and security rules into their own modules.

---

## What is deliberately NOT split, and why

**"Smaller is better" is wrong for a cohesive module, and this repo has
evidence of what that costs.**

- **`drag/solver.ts`, 761 lines.** One responsibility: integrate the trajectory.
  Its 100-line header documents *five failure modes* — inverted drag sign, a
  dropped π/4, wrong density units, zero-as-post-hoc-offset, and a missing unit
  conversion (the last two share a number in the source until 2 Oct 2026) — each
  of which actually happened here. Fragmenting the file would scatter those
  warnings away
  from the code they govern. `AGENTS.md` records the consequence: three real
  ballistics defects shipped while 161 tests passed, and
  `docs/BALLISTICS-AUDIT.md` §0 exists because **the defects hid each other**.
  Size is a smell; a module with one job is a good module even at 761 lines.
- **`scripts/gates/check-seeds.mjs`, 1,619 lines.** The largest file in the repo, and
  the clearest candidate. It is **not split yet** for two reasons. It is a
  *safety gate*: a botched split silently weakens a check rather than crashing,
  which is the worst possible failure. And it has no exports and heavy shared
  mutable state (`problems`, `notes`, `db`, `manufacturers`), so splitting it is
  a real refactor rather than a mechanical one. Its 20 section banners are the
  natural module boundaries, and `modules:check` now guards the result.
  **Recommended next**, in its own pass.
- **`provenance/constants.ts`, 385 lines.** 26 constants, each with a citation
  and a derivation note. One responsibility: *be the place a constant lives*. A
  file that exists only because a table got long is worse than a long file with a
  clear job.

**The rule this map follows:** split when a file has **two responsibilities**,
not when it is **long**. `gates/check-seeds.mjs` has both. `solver.ts` has one.

---

## The guarantee: `npm run modules:check`

A refactor can leave every module individually correct and still be broken —
each one works, and the seams are exactly what nothing exercises. This gate
answers the four questions no other gate asks:

1. **Does every module load?** `.mjs`/`.js` via `node --check`; `.ts` by
   importing it with the type-stripping loader. `.jsx`/`.tsx` are excluded
   because Node has no loader for them — `npm run typecheck` and `npm run lint`
   cover those, and reporting Node declining a file type as a syntax error
   produced 9 false positives that buried the real signal.
2. **Does every local import resolve?** A rename that missed one caller is a
   production crash and a green build without this. Extensionless specifiers
   are resolved the way a bundler does, because the Expo app's own `App.jsx`
   imports `./screens/DopeCardScreen` with no suffix.
3. **Are there import cycles?** Legal in ESM, which is exactly why they need
   reporting: each usually means two modules each need something the other owns.
4. **Does it still assemble?** The domain barrel is imported for real and
   checked against a list of exports, one representative per re-exported module.
   A test that imports a module directly cannot see a barrel that stopped
   re-exporting it — that is the seam this closes.

### Negative-tested, because a gate that cannot fail is worthless

Four defects injected into real files, each removed and re-hashed afterwards:

```
PASS  syntax error                 exit=1  "does not parse" found
PASS  unresolved import            exit=1  "unresolved import" found
PASS  import cycle                 exit=1  "import cycle" found
PASS  barrel stops re-exporting    exit=1  "no longer exports" found

restored reloading.ts: true
restored index.ts:    true
clean run exits 0: true
```

**Two real gaps in the checker were found this way and fixed**, neither
discoverable by reading the code:

- **`node --check` exits 0 on a `.ts` file with a genuine syntax error.** It
  validates plain JavaScript and silently ignores TypeScript, so a broken module
  in the package every app depends on reported as clean. Now `.ts` is loaded
  through the type-stripping loader.
- **The `mustExport` list asserted the wrong names.** It listed
  `solveTrajectory`, `BallisticProfile` and the provenance helpers — all from
  *other* modules — so deleting the `reloading.ts` re-export changed nothing
  observable and the assembly check passed a broken barrel. Two names I first
  added (`speedOfSound`, `mergeWeather`) did not exist either. Fixed by
  enumerating what each module actually exports and taking one representative
  per module, so **any** single `export * from` line being removed is caught.

---

## Not done, and why

| Item | Why not |
|---|---|
| ~~Split `apps/website/index.html`~~ | **Done.** The build now produces the artefact from `src/`, and `src/` is the authoritative implementation. See `apps/website/README.md`. |
| Split `scripts/gates/check-seeds.mjs` (1,619 lines) | The real remaining candidate, but it is a safety gate with shared mutable state. Recommended as its own pass, with `modules:check` already in place to guard it. |
| Enforce a maximum file size | Deliberately not done. See "What is deliberately NOT split". A long file with one responsibility is correct; a short file with three is not. |

---

## Rules that keep the map true

1. **A module has one responsibility.** Split on that, never on line count.
2. **`packages/ballistics-core` imports nothing.** No framework, no I/O, no
   `apps/`, no `scripts/`. It is the one layer everything else may use.
3. **`data/` is not code.** Nothing in it is imported by a module; the pipeline
   reads it and the apps receive published artefacts.
4. **`scripts/` never imports from `apps/`.** Enforced by `check-handoff.mjs`.
5. **Adding a module means adding it to a barrel, or it is unreachable** — and
   `modules:check` will say so.
6. **Run `npm run verify`** (12 stages). `modules:check` is the one that proves
   the pieces still fit.

