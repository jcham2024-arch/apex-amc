# 02 — Duplication

**Task:** code-audit. **Audit only — nothing was changed.**

The repo's rule, from `docs/DATA-TODO.md:103`:

> **One loader, not two.** `check-seeds.mjs` already contained the correct, FK-safe
> load. `scripts/shared/load-database.mjs` reuses it by importing the module rather
> than copying 1,300 lines of seed logic. Two copies would drift, and the drift
> would be silent.

That rule was applied once, correctly, for the database loader. It has **not** been
applied to path resolution, hashing, or CSV parsing. This documents where.

**Scale, measured not assumed:** 50 `.mjs` files in `scripts/`, across 10
directories — `data` 12, `gates` 11, `extract` 5, `shared` 5, `handoff` 4,
`security` 4, `text` 4, `tests` 3, `tools` 1, `website` 1.

---

## FINDING 1 — repository root is derived in 14 places instead of imported from one place

`scripts/shared/data.mjs` exports the canonical declaration:

```js
export const root = resolve(import.meta.dirname, '..', '..');
```

`check-seeds.mjs` even says the rule in a comment:

> "Governed paths come from the single declaration in shared/data.mjs."

But **14 other scripts re-derive it with the identical expression**:

```
scripts\data\export-d1.mjs
scripts\data\promote-powders.mjs
scripts\data\split-cartridge-specs.mjs
scripts\data\split-seeds-by-manufacturer.mjs
scripts\extract\crosscheck-pressures.mjs
scripts\extract\extract-kwk-pressures.mjs
scripts\extract\extract-leverguns-pressures.mjs
scripts\extract\extract-vihtavuori-burn-rate.mjs
scripts\gates\check-modules.mjs
scripts\handoff\check-handoff.mjs
scripts\handoff\handoff-accept.mjs
scripts\handoff\handoff-baseline.mjs
scripts\security\security-baseline.mjs
scripts\security\security-check.mjs
```

Only 7 project scripts actually import it:

```
scripts\gates\check-mail.mjs
scripts\gates\check-tasking.mjs
scripts\gates\check-tasks.mjs
scripts\gates\check-website-build.mjs
scripts\tests\check-csp-in-browser.mjs
scripts\tools\generate-task-files.mjs
scripts\website\write-csp-hashes.mjs
```

**Split: 14 re-derive, 7 import.** The convention exists and is documented; it is
simply not followed.

**Risk: low today, high later.** `resolve(import.meta.dirname, '..', '..')` is
correct for every current file because they all live exactly two levels below the
root. **A script moved one directory deeper would silently compute the wrong root
and read the wrong files** — and because all 14 are independent, fixing it means
finding 14 places. That is precisely the "drift would be silent" failure the rule
warns about.

---

## FINDING 2 — nine scripts root themselves at `process.cwd()` (the more serious half)

This is a different and worse problem than Finding 1, and it is invisible because
every script is always invoked from the repo root via `npm run`.

```
scripts\extract\extract-website.mjs      const root = process.cwd();
scripts\gates\check-ci-parity.mjs       const ROOT = resolve(process.cwd());
scripts\gates\check-docs.mjs            const ROOT = resolve(process.cwd());
scripts\gates\check-oracle.mjs          const ROOT = resolve(process.cwd());
scripts\gates\check-regulations.mjs     const ROOT = resolve(process.cwd());
scripts\security\audit-advisories.mjs   const ROOT = resolve(process.cwd());
scripts\text\normalise-line-endings.mjs const ROOT = resolve(process.cwd());
scripts\text\scan-encoding.mjs          const ROOT = process.cwd();
scripts\text\test-encoding.mjs          const root = process.cwd();
```

`AGENTS.md` already records this exact trap, in a different form:

> **`.NET` file APIs ignore PowerShell's `cd`** … `npm` honours the PowerShell
> location, so it looked correct while the .NET call silently read the wrong repo.

and, on path comparison:

> **`relative()` returning backslashes on Windows** — A path comparison silently
> matched nothing and reported "0 curated rows". Normalise before comparing.

**Why this matters more than the duplication:** `check-docs.mjs` is the gate that
resolves every repository path in backticks, and it roots at `process.cwd()`. Run
from anywhere but the repo root — a different drive, a CI working directory, an IDE
task runner — and it walks the wrong tree. It would then either find nothing to
check (false green) or report paths that do not resolve. **`docs:check` is one of
the gates that makes `verify` trustworthy.**

`test-encoding.mjs` compounds it by also passing `cwd: process.cwd()` to `git`, and
computing `relative(process.cwd(), ...)` for its coverage reporting.

**Recommendation:** import `root` from `scripts/shared/data.mjs` in all nine, as
`shared/data.mjs` already exists to allow. This is a mechanical change with no
behaviour change from the repo root — which is also why it is easy to defer and
hard to notice.

---

## FINDING 3 — sha256 is re-implemented in nine places, with no shared helper

```
export-d1.mjs              createHash('sha256').update(buf).digest('hex');
check-website-build.mjs    createHash('sha256').update(s, 'utf8').digest('base64');
check-handoff-rules.mjs    createHash('sha256').update(`${rule}:${message}`).digest('hex').slice(0, 12);
check-handoff.mjs          createHash('sha256').update(bytes).digest('hex');
handoff-accept.mjs         createHash('sha256').update(bytes).digest('hex');
handoff-baseline.mjs       createHash('sha256').update(bytes).digest('hex');
security-baseline.mjs      createHash('sha256').update(buf).digest('hex');
security-rules.mjs         createHash('sha256').update(`${rule}:${message}`).digest('hex').slice(0, 12);
write-csp-hashes.mjs       createHash('sha256').update(content, 'utf8').digest('base64');
```

By digest encoding: **7 hex, 2 base64.**

```
shared modules containing createHash: (none)
```

**The two truncation pairs are exact duplicates of each other:**

| Site | Expression |
|---|---|
| `scripts/security/security-rules.mjs:26` | ``createHash('sha256').update(`${rule}:${message}`).digest('hex').slice(0, 12)`` |
| `scripts/handoff/check-handoff-rules.mjs` | ``createHash('sha256').update(`${rule}:${message}`).digest('hex').slice(0, 12)`` |

Two independently-maintained copies of a **finding-fingerprint** function, in two
separate gate families, with the same input shape and the same 12-char truncation.
If one is ever changed — different truncation, different separator — the two gates
would produce different fingerprints for the same finding, and a baseline recorded
by one would not match the other.

**Why this one matters:** these hashes are **baseline and identity values**. The CSP
hashes in particular must match the deployed artefact byte-for-byte; a silent
divergence between writer and checker is a security-relevant bug that no test would
catch, because both sides would be internally consistent.

**Recommendation:** add `sha256Hex(buf)`, `sha256B64(text)` and
`fingerprint(rule, message)` to `scripts/shared/`, and import them. Low risk, clear
benefit.

---

## FINDING 4 — CSV parsing re-implemented (carried from `01-dead-code.md`)

`scripts/data/import-bullets.mjs` splits on `,` at lines 110, 111 and 128, while
`scripts/shared/data.mjs` exports the RFC 4180 `readCsv` and states that `split(',')`
"is not merely inelegant, it is wrong" for this dataset. It already imports
`loadManifest` from that module. Verified latent, not active — see `01-dead-code.md`
for the measurement.

This is the clearest violation of "one loader, not two" in the repo: the exact class
of duplication the rule was written to prevent, in the one place where the shared
loader is already imported and simply not used.

---

## What is NOT duplicated

Recorded so the review agent does not re-check it:

- **Database loading.** `scripts/shared/load-database.mjs` is imported by
  `build-database.mjs`, `check-schema.mjs` and `affiliate-status.mjs`. The rule is
  honoured here. `build-database.mjs` even comments on it:
  *"shared/load-database.mjs for why there is deliberately only one loader."*
- **Manifest loading and row validation.** All consumers import
  `scripts/shared/data.mjs`; `check-seeds.mjs` imports it as a namespace
  (`import * as manifestLib`) plus named paths. No second validator exists.
- **CSP hashing.** `write-csp-hashes.mjs` (writer) and `check-website-build.mjs`
  (checker) each compute base64 sha256 independently. They are **two
  implementations of one contract**, which is the weakest form of this duplication —
  but it is arguably deliberate: an independent checker is more valuable when it
  does *not* share the writer's code. **Flagged as a judgement call, not a defect.**

---

## Summary

| Finding | Sites | Risk |
|---|---|---|
| 1. `root` re-derived | 14 scripts | Low now, silent drift later |
| 2. `process.cwd()` roots | 9 scripts | **High** — wrong tree when run elsewhere |
| 3. sha256 re-implemented | 9 call sites, 2 exact dupes | **Medium** — baseline identity values |
| 4. CSV parsing re-implemented | 1 script | **High (latent)** |

**The pattern:** `scripts/shared/data.mjs` exists and is correct, 21 scripts import
it, and the remaining scripts each solved a problem it had already solved. The
duplication is not sophisticated — it is one missing import per site.