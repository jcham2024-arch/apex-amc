# AGENTS.md — baseline for any agent working in this repo

Written 1 Oct 2026. **This is the first file to read.** It exists because every
fact below was learned the expensive way, and the repo had no agent-facing
instructions at all before now.

Everything here is verified against the repo as of the date above. Where a number
could go stale, the command that produces the live value is named.

---

## The one rule

> **Never invent a value. Leave the cell EMPTY.**

A blank means "not known yet". It never means zero, and it is never filled with a
plausible guess. Full doctrine: `data/research/POWDER-ACCURACY-DOCTRINE.md`.

This is not caution for its own sake. For load-adjacent data a wrong number can
injure someone, and a missing one is visible while a wrong one is not. Two
third-party compilations agreeing is `derived`, **not** `published` — agreement
between compilations is evidence, not a standard.

---

## Before you do anything

```bash
npm run verify     # must exit 0. Every stage, 235 tests.
npm run data:health  # live row counts, manifest coverage, reference integrity
npm run coverage     # per-manufacturer status
```

`verify` = lint → typecheck:all → test:all → test:encoding → test:bullets →
schema:check → seed:check → data:validate → docs:check → handoff:status →
security:check → modules:check → website:check. Run it **before and after**. A
task is not done until it passes.

Two ordering rules that are load-bearing:

- **`seed:check` runs before anything that consumes the database**, because
  `shared/load-database.mjs` reuses the `check-seeds.mjs` loader rather than
  reimplementing it. If the seed gate passes, the loaded database is correct.
- **`schema:check` asserts CSV→table row parity** against the *populated*
  database, not just that migrations apply. That is the check that would catch a
  silently dropped row.

## Current state (verify with the commands above)

| | |
|---|---|
| Governed data | **989 rows across 13 datasets; all 23 CSVs have manifests** |
| Manufacturers | **50** in `manufacturers.csv`; 51 rows in the DB (42 makers + 8 retailers, plus one inserted during load) |
| Bullets | **120** — Berger 109, Hornady 7, Sierra 4 |
| Powders | **169** across 7 brands |
| Cartridges | 318 (229 curated specs) + 782 pressure references |
| **Load recipes** | **ZERO. `recipes` is empty.** |
| Built database | `npm run db:local` → `data/generated/apex.sqlite`, **1,666 rows / 24 tables**, `integrity_check` ok, 0 FK violations |
| Tests | 215 passing |

Coverage: **done=7, partial=3, not started=32, n/a=8** of 50 manufacturers.

**`recipes` being empty is the headline.** Everything else is engineering; that
is a content problem, and it gates the feature the project is for.

---

## Repo shape

npm workspaces monorepo.

| Path | What |
|---|---|
| `packages/ballistics-core/` | Pure domain logic (solver, drag, dispersion, reloading, atmosphere). **All physics belongs here.** |
| `apps/website/` | Cloudflare Pages, single-file React + Babel |
| `apps/ballistics/` | Expo 57 field app |
| `data/seeds/` | Curated loadable CSVs — **the source of truth for row content** |
| `data/schemas/` | YAML column manifests: types, required, enums, references. **The rules the loader enforces.** |
| `data/schema/` | Numbered D1 migrations, applied in filename order |
| `data/generated/` | JSON + Markdown built from the seeds. **Never hand-edit.** |
| `data/published/` | Archived source PDFs. Gitignored except `manifest.json` |
| `data/research/` | Curated analysis, not data. Not loaded by anything |
| `data/incoming/` | Research staging. Gitignored. **Never read by the loader** |
| `data/extracts/` | Verbatim text pulled from source docs, kept for re-verification |

### Data layout: one file per key, not one table per type

data/seeds/
  manufacturers.csv              one row per company (stays single)
  bullets/       sierra, hornady, berger       - one file per manufacturer
  powders/       accurate, alliant, hodgdon, imr,
                 ramshot, vihtavuori, winchester
  cartridge_specs/  rifle, pistol, shotgun      - one file per family

The filename **is** the key, and the loader verifies every row agrees with it. A
row pasted into a competitor's file is a build failure, not a silent
misattribution. Adding a manufacturer's line is creating one small file.

If you need a single combined file, generate it — do not create one by hand and
do not let two copies be authoritative.

---

## Rules

### Data

1. **A row without a `source_url` is not data.** If you cannot cite where a
   number came from, do not add the row.
2. **Nothing the loader reads may live under `data/incoming/`.** It is staging.
   A manifest pointing at a gitignored path means row counts depend on the
   checkout, not the repo — this happened for 142 of 169 powder rows.
3. **Never `INSERT OR IGNORE` as a substitute for validation.** It skipped a
   constraint-violating row without a word. Seven legitimate Berger bullets were
   dropped that way on 2026-10-01.
4. **Blank is null, not `""`.** The 012 provenance layer depends on the
   difference.
5. **Part numbers and SKUs are strings, never numbers.** `065147` → `65147`
   destroys a leading zero and breaks the join.
6. **UTF-8, no BOM, LF line endings, RFC 4180 quoting.** Enforced by
   `npm run test:encoding` for the seed CSVs and `npm run docs:check` for
   Markdown. LF because `.gitattributes` says `* text=auto eol=lf`.
7. **Every path you write in backticks must resolve.** `docs:check` fails on a
   `scripts/…`, `apps/…`, `packages/…`, `data/…` or `docs/…` reference that does
   not exist, so a file that moves cannot leave a dead pointer in a handoff
   document. CHANGELOG.md is exempt — it records where things *were*.

### Code

7. **No bare numeric literals in computation code.** Every physical constant goes
   in `packages/ballistics-core/src/provenance/constants.ts`, wrapped in
   `published()`, `derived()` or `estimated()` — imported from `./Source.ts`:
   ```ts
   export const GRAINS_PER_POUND = published(7000, SOURCES.cip, { units: 'gr/lb' });
   ```
8. **Never write a file with a shell redirect.** Use the editor. An inline
   `Set-Content -NoNewline` collapsed an 11 KB source file to a single
   10,711-character line and destroyed it. See the Traps table.
9. **Never commit an original source document.** Archived PDFs are gitignored.
   Republish derived single facts with attribution only.
10. **Do not edit files you were not assigned.** Report the bug in your summary
    instead.
11. **If a script grows past what `scripts/` is for,** move the logic into
    `packages/ballistics-core/` and test it there.

### Boundaries

12. **Never write into `apps/` from a data-layer script.** The main app is
    built: `apps/website/src/` is the source, and `npm run website:build` produces
    `apps/website/dist/index.html`, which is what Cloudflare serves. A script
    that writes into `apps/` can break the shipped site with nothing to catch
    it — which is exactly what `scripts/extract/extract-website.mjs` did to
    `src/main.js`. Data crosses the
    boundary by a human copying a checksummed artefact, never by a script. Full
    contract: [`HANDOFF.md`](HANDOFF.md).
13. **If you change the main app on purpose,** run `npm run handoff:accept`
    afterwards. `npm run handoff:status` (in `verify`) fails on any change that
    was not accepted, so a data-layer task cannot alter the shipped site as a
    side effect.

### Git

14. **Do not commit or push unless asked.** Changes stay staged.
15. **Never force-push `main`.** The branch is `main`; work on a branch.
16. **Never delete a file you did not create** without saying so explicitly in
    your summary.

---

## Traps that cost real time

Each of these silently produced wrong behaviour. They are all now guarded, but
know them.

| Trap | What actually happened |
|---|---|
| **Unique key `(name, weight)` on bullets** | Berger sells a 6.5 mm and a 7 mm 140 gr VLD Target — same name, same weight, different projectile. 8 rows collided and the second of each was dropped. Identity is now `(manufacturer_slug, part_number)`. |
| **`DROP INDEX` on a constraint-backed index** | SQLite refuses. `015_bullet_identity.sql` was failing to apply, so the old constraint survived. Migrations now define the correct schema from the start. |
| **Files auto-detecting their encoding** | `cartridge_specs.csv` — the largest hand-maintained file — was **UTF-16LE** and parsed fine in every tool used to inspect it. A plain UTF-8 read returned NUL-interleaved garbage. |
| **A gitignored directory in a manifest** | 142 of 169 powder rows. A fresh clone loaded 27 while the working tree loaded 169. |
| **`relative()` returning backslashes on Windows** | A path comparison silently matched nothing and reported "0 curated rows". Normalise before comparing. |
| **A manifest `enum` guessed rather than read** | Values came from the data, not the schema. The SQL `CHECK` constraints — e.g. on `standard_body` and `method` in `data/schema/009_cartridge_specs.sql` — are authoritative for those columns. |
| **Trusting row-count arithmetic after a copy** | Re-read from disk. The count you expect is the count you assert, until proven otherwise. |
| **PowerShell mangling inline `node -e`** | Nested quoting silently corrupts the script. Write a file instead. |
| **`.NET` file APIs ignore PowerShell's `cd`** | After `cd C:\Cline\ApexProject`, `[System.IO.File]::ReadAllLines('README.md')` read `C:\Cline\README.md` — a *different project*. `npm` honours the PowerShell location, so it looked correct while the .NET call silently read the wrong repo. Use absolute paths in .NET calls. |
| **Ragged CSV rows** | The reader pads short rows, so a row with a missing field loads with the right *number* of keys and the wrong *values*. A key count is never evidence a row is well formed. |
| **`SELECT *` or a `.Count` on a padded object** | Same root cause as ragged rows: the shape looks correct while the values are shifted. |
| **An unbalanced code fence in a `.md` file** | A stray three-backtick fence swallows every following section into a code block, so the content still exists on disk but is invisible to any reader that honours Markdown. Hiding in `AGENTS.md` (the Rules and Traps sections) and in `README.md` (the provenance section). **A balanced fence can hide a section too** — `README.md`'s balanced, so a marker count would have passed it. Caught now by `npm run docs:check`. |
| **Writing a file with a shell redirect** | An inline `Set-Content -NoNewline` collapsed an 11 KB source file to one 10,711-character line and destroyed it. And `Set-Content -Encoding utf8` added a BOM *and* re-encoded existing em dashes as mojibake. Same family as the `node -e` row above. Use the editor; then re-read the file to confirm it is what you intended. |
| **A check that passes while producing wrong output** | Four separate instances, all mine: `/\r(?!n)/g` mis-counting CRLF, `repairMojibake`'s return value compared as a string, `loadKnown()` given an object where it expected JSON text, and `normalise-line-endings` fixing line endings but not BOMs. Each reported success, or a plausible number, while being wrong. **Verify the artefact, not the exit code** — print what the function returned, re-read the file, count the matches. |
| **Running a script to "see if it works"** | `extract-website.mjs` (`scripts/extract/`) is a one-shot extractor, not idempotent, and overwrites six hand-edited files in `apps/website/src/` from `index.html`. Running it stripped `main.js`'s ES imports **and its XSS hardening** (`replaceChildren` back to `innerHTML`). Only `npm run lint` caught it. **Read a writing script before running it, and `git status` the paths after.** It now requires `--force`. |
| **`node --check` does not find a bad import** | It validates syntax, not that a named export exists. `split-cartridge-specs.mjs` imported `deleteSync` from `node:fs` — not a real export — and passed a syntax check while being unable to run at all. **Run the script**, or an import of a non-existent name reaches production. |
| **A regex lookahead written `/\r(?!n)/`** | `n` there is the two characters backslash-n, not a line feed, so "not followed by a newline" is true for every CR — including inside a CRLF pair. Reported a pure-CRLF file as 2 CRLF *and* 2 lone CR. Count by removing the pairs first: `text.replace(/\r\n/g,'').match(/\r/g)`. **Fixtures, not reading, is what catches this.** |
| **A doc path that no gate could see** | `docs:check` validated structure but not existence, so nine references to files that had moved in the 1 Oct reorg sat in AGENTS.md, HANDOFF.md and SECURITY.md. A structural check cannot catch a wrong path. It now resolves every `scripts/`…/`docs/` path in backticks. |
| **A `const` declared below the loop that calls its function** | `checkPaths` was defined *after* the run loop. The function hoisted so the call site was fine, but `PATH_SCOPE` did not — "Cannot access before initialization" on the first file. Put module constants above the code that uses them. |
| **`insert_line` inserting into the middle of a block** | Adding a `CREATE VIEW` to migration 016 at "line 84" landed inside the open `CREATE TABLE`, silently truncating it. Then a PowerShell `-replace` with a here-string injected literal `+` into 100 lines. **Both produced a plausible-looking file.** Run the migration; do not trust the edit. |
| **`execFileSync` with piped stdio on Windows** | It blocked until its own timeout and threw, while `spawn` with identical arguments returned the same output in ~1s. That made the CSP browser check look like a Chrome hang. Use `spawn` for anything whose stdout you pipe on Windows. |
| **`server.close()` waiting on keep-alive sockets** | It stops *new* connections only; Chrome's open sockets kept the Node process alive long after Chrome had exited and written its output. `server.closeAllConnections()` is what actually ends the process. |
| **Proving "the script ran" with text from the static source** | The CSP browser check asserted on the string "Component Cost Breakdown", which is in the *markup* — so it passed against a policy that blocked everything. The negative test caught it. Assert on something only the script can produce: `#retailerGrid` gains children (DOM 111,157b vs 96,220b). |
| **A negative test whose injection was silently eaten** | Appending a backticked path through a PowerShell here-string dropped the backticks, so the text was plain and the gate correctly did not flag it. The gate was fine; the test was not. Build the character with `[char]96` when the literal is the thing under test. |

---

## Common tasks

| Task | Command |
|---|---|
| Add a manufacturer | Row in `manufacturers.csv` + a file under `seeds/<type>/` |
| Import a manufacturer's bullets | `npm run bullets:import -- <slug>`, then `npm run test:bullets` |
| Add a cartridge | Row in `seeds/cartridge_specs/<family>.csv` |
| Add a powder | `data/incoming/powders/<slug>.csv`, then `node scripts/data/promote-powders.mjs --dry-run` |
| Check the data | `npm run data:health` |
| Check the documentation | `npm run docs:check` |
| Check the main app is untouched | `npm run handoff:status` |
| Change the main app on purpose | edit it, then `npm run handoff:accept` |
| Check generated files are current | `npm run data:validate` |
| Rebuild the D1 snapshot | `npm run data:snapshot` |

Before harvesting any product line, read `docs/SOURCE-SURVEY.md`. It records what
each manufacturer publishes — and **several publish nothing usable**, which is a
legitimate "not started", not a failure.

---

## Where things are written down

| Doc | What |
|---|---|
| **[CHANGELOG.md](CHANGELOG.md)** | **Every step taken, why, and how it was verified. Append an entry as you go** — so the next agent never has to reconstruct it. |
| **[HANDOFF.md](HANDOFF.md)** | **The contract between the data layer and the main app.** Why `apps/` is off-limits to scripts, and how a change crosses. |
| **[SECURITY.md](SECURITY.md)** | **Every security finding, its severity, and what fixes it.** Plus the rules that keep new ones out. |
| `docs/TODO.md` | **The task list.** Measured, prioritised, with what "done" means. **Superseded by `DATA-TODO.md` 2 Oct 2026**; kept for provenance. |
| `docs/TASK-LIST.md` | Code, safety and verification work |
| `../AGENTS.md` | Lane briefs for parallel agents |
| `docs/SEED-DATA-GUIDE.md` | How to populate the data layer correctly |
| `docs/SOURCE-SURVEY.md` | What each manufacturer does and does not publish |
| `docs/BRASS-AND-PRESSURE-CLASS.md` | SAAMI vs CIP. **Read before touching pressure data** |
| `docs/BALLISTICS-AUDIT.md` | Solver correctness. **Read before trusting any trajectory number** |
| `data/README.md` | Data pipeline layout and conventions |
| `data/schemas/*.yaml` | Column contracts. Start here when adding a column |
| [`docs/AFFILIATE.md`](docs/AFFILIATE.md) | **Affiliate programs: how to apply, what earns, and why there is no price scraper.** |

## What not to build

These already exist. Do not re-create them.

| Asked for | Already at |
|---|---|
| CSV loader / validator | `scripts/gates/check-seeds.mjs` |
| Data generator / drift check | `scripts/data/build-data.mjs`, `npm run data:validate` |
| Column contracts | `data/schemas/*.yaml` (13 datasets) |
| Coverage report | `scripts/data/report-coverage.mjs`, `npm run coverage` |
| Build a local database | `npm run db:local` → `scripts/data/build-database.mjs` + `scripts/shared/load-database.mjs` |
| Encoding guard | `scripts/text/test-encoding.mjs` |
| Powder promotion | `scripts/data/promote-powders.mjs` |
| Bulk data importer | **Does not exist and probably should not** — data is curated, not bulk-imported |

The original brief asked for `scripts/import-csv.ts`, `validate-row.ts` and
`report-coverage.ts`. All three exist as `.mjs` files with different names.

---

## What is still open

Ordered by what blocks. Full detail in [`docs/REVIEW.md`](docs/REVIEW.md) and
[`docs/DATA-TODO.md`](docs/DATA-TODO.md).

**Highest — verified, do not regress**

1. ~~**The CSP has never run in a real browser.**~~ **RESOLVED 1 Oct 2026.**
   It was worse than unproven: `_headers` carried a literal `nonce-{RANDOM}`,
   which Cloudflare Pages sends verbatim. Chrome discarded it as an invalid
   source and blocked every inline script — the page rendered in Times New Roman
   with 3,741 characters instead of Inter with 5,679. The scanner passed the whole
   time.

   Now: SHA-256 hashes of the two inline blocks, generated from the build by
   `npm run website:csp` (which `website:build` runs), verified against the build
   by `website:check`, and enforced in a real browser by
   `npm run website:csp:browser` in CI.

   **Four things will break it silently**, all now gated: a stale hash, a
   `style=""` attribute, an `on*=` handler, and any `unsafe-*` keyword.

   *Second-order fix, 2 Oct 2026.* That browser check was reporting success
   without testing anything. It asserted on the string "Component Cost
   Breakdown", which is present in the static markup, so it passed against a
   policy that blocked the entire site. It now asserts on `#retailerGrid`
   acquiring rendered children — 111,157 bytes vs 96,220 — which only the
   executed script can produce. A negative test (restore `nonce-{RANDOM}`,
   expect exit 1) is what caught it, and is the reason to run one after
   changing anything in this file.

   **It was also not running.** `execFileSync` with piped stdio blocked until
   its timeout on Windows while `spawn` returned the same DOM in ~1s, and
   `server.close()` then waited on Chrome's keep-alive sockets. The check had
   been silently reporting a skip. It now uses `spawn` and
   `closeAllConnections()`, and completes in about a second locally.

**Blocked on someone else**

1. **D1 provisioning** (`docs/DATA-TODO.md` §0.2c) needs owner credentials;
   `wrangler.toml` still has a placeholder `database_id`.
2. **`LICENSE` and `CONTRIBUTING.md`** are owner decisions. Unpublished and
   `private: true`, so nothing requires a license — but the default without one is
   *all rights reserved*, meaning nobody may reuse the domain physics or drag tables.

**Blocked on a dependency**

3. **TypeScript 7** is held back by `typescript-eslint`, whose latest stable and
   canary releases cap at `<6.1.0`. Prototype it in a **separate worktree** — do
   not touch the working tree for an upgrade that may not land.

**Ready to do**

4. **Tests for the retailer and checklist renderers.** `safeUrl()` has 7 tests;
   the rest of the DOM rendering has none.
5. **Automated accessibility checks** — contrast, keyboard traversal, drawer
   focus management, axe/Lighthouse in CI. The manual pass is done; it is unproven.
6. **Split `check-seeds.mjs`** by responsibility, pure helpers first. 1,644 lines
   with module-level mutable state (`docs/REVIEW.md` P2-3).
7. **`recipes` is empty** — the largest genuine content gap in the data layer.

---

## Scope boundary

**Do not expand the scope of a task you were given.** If you find a bug outside
your assignment, report it; do not fix it silently. If a task's premise turns out
to be wrong — a file that no longer exists, a number that is already correct —
say so instead of working around it.

The repo contains several planning documents that predate the current state and
contradict each other. **Verify any claim against the code or a command before
building on it.** Where two documents disagree, the one that names a command to
check is usually right; when in doubt, run the command.

## Keeping this file honest

**If you change something this file states, update this file in the same commit.**
It is a baseline, and a wrong baseline is worse than none — it is trusted.

Three things will make it wrong:

1. **Row counts.** Do not retype them. Run the command named above the table and
   paste the number.
2. **A rule that turns out to be wrong.** Say so plainly in your summary rather
   than quietly working around it.
3. **A path that moved.** `docs:check` now fails on any `scripts/`…/`docs/…`
   reference in backticks that does not resolve, so this cannot drift silently.
   That check found nine of them on 1 Oct 2026 — four in this file alone.

When you add a trap that cost you an hour, add it to the table above. That table
is the reason this file exists.
