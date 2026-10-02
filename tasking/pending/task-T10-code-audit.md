# Task T10 - Source code quality and dead-code audit

**Status:** READY
**Blocked by:** none
**Workflow:** copy-out to `tasking/completed/T10/` - see [tasking/README.md](../README.md)
**Model:** [record on start - fresh instance of the default model]

> **RESEARCH AND AUDIT ONLY. DO NOT REFACTOR ANYTHING.**
> `packages/ballistics-core/` is SAFETY-CRITICAL and is entirely out of scope.
> You report findings; a reviewer decides what changes.

---

## 1. Isolation Boundaries

**Strict Read Paths** - read anything; you NEED:

- `packages/ballistics-core/src/**` - **READ ONLY. Never propose changing the physics.**
- `apps/website/src/**`, `apps/ballistics/**`
- `scripts/**/*.mjs` - ~40 files
- `eslint.config.js`, `tsconfig.json`, `apps/ballistics/tsconfig.json`
- `package.json` - the script graph

**Strict Write Paths** - ONLY inside `tasking/completed/T10/`:

- `tasking/completed/T10/01-dead-code.md`
- `tasking/completed/T10/02-dupes.md`
- `tasking/completed/T10/03-comments.md`
- `tasking/completed/T10/04-config-review.md`
- `tasking/completed/T10/REPORT.md`

**Do not edit** any source file. If a fix is obvious, describe it; do not apply it.

---

## 2. Established context - do not re-derive

- **The build is green**: lint, 19 gates, 235 tests, all passing.
- `eslint.config.js` ignores `scripts/_*.mjs`, `tmp/**`, `temp/**` and now
  `tasking/completed/**`. Those exclusions have documented reasons - do not propose
  removing them without understanding why.
- `apps/website/index.html` and `apps/website/src/tailwind.config.js` are
  **deliberately referenced** by `check-docs.mjs` as removed/historical paths.
- The `archive/` directory is preserved for provenance and never built.

---

## 3. Execution Prompt

> Paste verbatim.

Audit the codebase for anything that is dead, duplicated, misleading, or inconsistent.
The build is green, so you are looking for what a green build cannot see.

**`01-dead-code.md`** - unused exports, unreachable functions, dead branches, unused
config, orphaned data files. For each: location, evidence it is unused (grep results,
import graph), and the risk of removing it.

Be careful. `data/` holds generated output; `archive/` is intentional; and a file
referenced only by a *gate* is not dead. **Prove it with a search, and include the
search output.**

**`02-dupes.md`** - logic duplicated across scripts. `scripts/gates/` has grown to many
gates; count them rather than assuming, then check whether any re-implement CSV
loading, hashing, path resolution, or
data reading that already exists in `scripts/shared/`. Note the repo's own rule:
*"One loader, not two."*

**`03-comments.md`** - the repo's rule is that comments explain **why** and carry trap
history (`.clinerules` §5 rule 7). Audit for:
- comments that state something now **false** (these are the dangerous ones)
- comments that merely restate the code
- missing "why" on the non-obvious
Quote the exact comment and give the correct statement.

**`04-config-review.md`** - review `eslint.config.js`, both `tsconfig.json`, and the
script graph in `package.json`. Report: rules that conflict with each other, paths
ignored that should not be, and scripts in `package.json` that no longer work.

---

## 4. Definition of Done

**Validation:**

- [ ] `git status --porcelain` shows changes ONLY under `tasking/completed/T10/`
- [ ] `npm run verify` still exits 0
- [ ] Every dead-code claim includes the search that proved it
- [ ] **No finding requires changing `packages/ballistics-core/`** - if you believe the
      physics needs work, say so in the REPORT as an observation, not a code edit
- [ ] Every false comment is quoted verbatim and corrected

**Mandatory negative test:**

- [ ] Paste one example of something that LOOKED dead but is not, and the search that
      proved it alive
- [ ] Paste one comment you found that states something now false
- [ ] State what you believe is wrong about the codebase's structure, plainly

**Report:** `REPORT.md`, five-part summary from `.clinerules` §8.