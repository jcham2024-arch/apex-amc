# scripts/

Every Node script in the repository, grouped by responsibility. Each directory
is a module: the scripts in it do one job and share that job's vocabulary.

| Directory | Responsibility |
|---|---|
| `shared/` | Modules imported by the others. `data.mjs` (paths + CSV + validation), `encoding.mjs` (BOM/line endings), `bullet-sources.mjs` (publisher parsers), `load-database.mjs` (builds a populated SQLite from migrations + seeds). |
| `data/` | The data pipeline: build, validate, health, import, promote, snapshot, coverage. |
| `extract/` | One-shot scrapers and cross-checks over publisher data. |
| `gates/` | Everything `npm run verify` runs to decide the repo is sound. |
| `handoff/` | The data↔app boundary: integrity check, accept, baseline. |
| `security/` | Vulnerability rules, the scanner, and the finding baseline. |
| `text/` | Text hygiene: encoding normalisation, scanning, repair. |
| `tests/` | Self-tests for the scripts themselves. |
| `website/` | Website build support: CSP hash generation from the build output. |

## Conventions

**Paths are never hardcoded.** Import them from `shared/data.mjs`:

```js
import { seedDir, schemaDir, builtIndexFile } from '../shared/data.mjs';
```

That module is the single declaration of every governed path. It also exports
`requirePath()`, which throws by name when a declared directory is missing —
so a rename fails loudly instead of quietly yielding zero rows.

**Scripts are invoked by name, never by path guessing.** Every entry point has an
`npm run` script in the root `package.json`. If you add a script, add it there
too; `verify` calls the gates by those names.

**A gate must be able to fail.** Any new check gets a negative test that proves
it rejects the thing it exists to catch. A gate that cannot fail is worse than
no gate, because it teaches everyone to trust a green exit code.

**One implementation of a rule, not several.** If a check already exists,
import it rather than rewriting it. `shared/load-database.mjs` does not
reimplement the seed load; it imports `gates/check-seeds.mjs`, because a second
copy of 1,300 lines of FK-safe coercion would drift silently. When that reuse
required the gate to stop calling `process.exit` on import, the reporting was
moved behind an `isMain` check rather than forked.

## Adding a script

1. Put it in the directory matching its job.
2. Import paths from `../shared/data.mjs`; never re-derive them.
3. Add an `npm run` entry in the root `package.json`.
4. If it is a gate, add it to `verify` **and** a negative test.
5. Run `npm run verify` before you consider it done.