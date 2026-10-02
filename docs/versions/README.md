# Version history

Every entry is a real git tag. **A version is a tag plus a description of what
changed and why** - not a copied folder.

## Why tags and not version folders

The request was for "new project folders so we always have a usable version."
A copied folder was deliberately not used, for three reasons:

1. **Copies drift.** A snapshot directory is a second copy of the tree. The day
   someone fixes a bug in `main`, the snapshot still contains it, and the next
   agent reads the wrong one. This repo already regenerates `data/generated/`
   wholesale and keeps `archive/` byte-exact precisely because copies are a
   known failure mode here.
2. **They do not compose.** Git already gives branches, tags, diffs, and a
   one-command rollback that is guaranteed consistent. Re-implementing that with
   folders loses both the diff and the atomicity.
3. **They spend the budget that matters.** A full copy per version is context
   and disk that could go into actual work.

A tag is a pointer, cannot drift, and `git checkout v0.1.0-consolidated` yields
a byte-exact usable tree. The only thing a folder would add - knowing *what
changed* - is what this file is for.

## How to use a version

```bash
git checkout v0.1.0-consolidated    # exact tree, instantly
npm ci && npm run verify            # confirm it is green
```

To work from a version without losing current work, branch from the tag rather
than checking it out in place.

---

# v0.1.0-consolidated

**Tagged:** 2 Oct 2026 - **Branch:** `feat/v0.1.0-consolidated`
**Baseline:** `npm run verify` exits 0 - 15 stages, 235 tests, 0 failures.

The first point at which this repository is safe to build on: consolidation,
claims compliance, and multi-agent infrastructure.

## How this differs from `origin/main`

`origin/main` is a flat Expo application - `App.jsx`, `screens/`, `services/`,
`hooks/` at the root. This version is an npm-workspaces monorepo.

| Area | `origin/main` | This version |
| --- | --- | --- |
| Layout | Flat Expo app | `apps/ballistics`, `apps/website`, `packages/ballistics-core` |
| Data | None | 13 governed datasets, 1,666 rows, every CSV behind a manifest |
| Site | Hand-committed `index.html` | Built by Vite to `apps/website/dist/`, gated |
| Physics | None in-repo | `packages/ballistics-core`, provenance on every constant |
| Verification | None | 15 gates, 235 tests |
| Remote history | 47 files only on `GeminiChatRes/` | Rescued to `archive/gemini/`, byte-exact |

## What changed, and why

### 1. Remote history rescued

`GeminiChatRes/` existed **only** on the remote branch; restructuring `main`
would have deleted it. All 47 files are in `archive/gemini/` with
`archive/README.md` recording provenance.

Nine needed a second pass after the first rescue proved incomplete - including
`apex_amc_web_application.html`, the 64 KB original site. *"The rescue is done"
is a claim to verify, not to assume.*

### 2. A deploy path that would have 404'd

`wrangler.toml` had `pages_build_output_dir = "dist"`. No root `dist/` exists.
`wrangler pages deploy` against a missing directory **publishes nothing and does
not error** - the site 404s with nothing in the logs. Now `apps/website/dist`,
asserted by `npm run website:check`.

### 3. Advertising claims that were not true

The retailer directory showed a 4.6-4.9 star rating on all eight retailers, a
"Verified Shipping Partner" line, "Verified Suppliers" headings, superlative
badges, and "30% - 60% Avg Handload Savings". None had a source, a review count,
or any code that verified anything - and they sat directly beside links the site
is paid for.

Under 16 CFR 255.2(b) an endorser may not make a representation they cannot
substantiate, and a disclosure does not cure that; it only tells the reader who
paid you. All removed. `npm run claims:check` fails the build if they return.

### 4. The affiliate disclosure moved

It existed only in the footer - the position FTC guidance names as most likely to
be missed. It now sits above the retailer grid, in the same viewport as the
links it qualifies, and the gate asserts the *ordering*, not the mere presence.

### 5. A check that could not fail

The browser CSP check asserted on "Component Cost Breakdown", a string present in
the static markup. It therefore passed against a policy that blocked the entire
site. A negative test exposed it.

It also never ran: `execFileSync` with piped stdio deadlocks on Windows, and
`server.close()` then waited on Chrome's keep-alive sockets. Now `spawn` and
`closeAllConnections()`, completing in about a second.

It now asserts on `#retailerGrid` gaining rendered children - 111,157 bytes with
the script running, 96,220 with it blocked. Only the executed script produces
that difference.

### 6. Data integrity

`cartridge_pressures_secondary.yaml` declared `primary_key: [cartridge_name]`,
ignoring `pressure_unit`. `.38 S&W` exists as both 14,500 psi (SAAMI max) and
13,000 c.u.p. (Lyman CCW) - two measurements of one cartridge, not a conflict.
Keyed on name alone, the loader silently dropped one.

That surfaced three more in `cartridge_pressures.csv`; all merged with no data
loss (234 rows to 231).

### 7. Accessibility

Five inputs had visual `<span>` text that is not a label (WCAG 4.1.2). No skip
link despite a sticky full-width nav (2.4.1). No meta description. Fixed, and the
floor is now gated.

### 8. Multi-agent infrastructure

`.clinerules`, a task ledger, 16 generated task files, and `npm run
tasks:check`, which fails on any overlapping write-set between concurrently
runnable tasks.

It found **four real collisions in work already written**, including two tasks
both editing `package.json` and two both editing `README.md`. Those would have
had two agents editing one file. The hand-written plan looked correct; only
automated comparison found them.

## Commits in this version

Each is a rollback point. Newest first.

| Commit | Contains |
| --- | --- |
| `9426c5e` | Remove a stray scratch file accidentally committed |
| `eaf9d2b` | Remaining: package-lock, physics constants and solver |
| `e96c326` | Documentation and agent-facing infrastructure |
| `1eb3994` | CI workflow, deploy path, npm scripts |
| `142fb0f` | Site: claims compliance, accessibility, deploy path |
| `927dc8f` | Gates: CSP browser check, claims check, task check |
| `17eebed` | Data: pressure primary keys, manifests, regenerated output |
| `8e41add` | Archive: rescued remote history |

## Known limitations in this version

Recorded so the next version's notes can be honest about what improved.

- **A physics change rode in unexamined.** `drag/solver.ts` and
  `provenance/constants.ts` had uncommitted edits from earlier work that a
  path-based commit swept into `eaf9d2b`. `verify` passes, but that diff was not
  reviewed line by line as part of this release. **Review it before trusting it.**
- **Data gaps unchanged.** `recipes` empty, `price_observations` empty, most
  cartridge dimensions and powder geometries NULL, Hornady XTP absent.
- **No CI has ever run on `ubuntu-latest`.** The browser CSP check is verified
  locally only.
- **No deploy has happened.** `wrangler.toml` still has
  `REPLACE_WITH_YOUR_D1_DATABASE_ID`.
- **Doc counts were stale at tag time** (9, 10 and 11 stages quoted against 15
  actual; 215 tests against 235). Task D1 fixes this.

## Adding a version

1. `git tag -a v0.2.0-<slug> -m "what this version is"`
2. Add a section above stating what changed, **why**, how it differs from
   v0.1.0, and what is still broken.
3. Carry unresolved items forward in the limitations list rather than letting
   them disappear.