# Coding conventions — binding on every task in the parallel plan

**Read this before writing a line of code.** It is not a style guide; every rule
here exists because breaking one produced a recorded defect, and each cites it.

`AGENTS.md` is the master. This file is the working subset an agent needs in one
place, with the reasoning made explicit so it survives being followed by someone
who was not here when the defect happened.

---

## 1. The one rule

> **Never invent a value. Leave the cell EMPTY.**

A blank means "not known yet". It never means zero, and it is never a plausible
guess. For load-adjacent data a wrong number can injure someone, and a missing
one is **visible** while a wrong one is not.

Two third-party compilations agreeing is `derived`, **not** `published`.
Agreement between compilations is evidence, not a standard.

Full doctrine: `data/research/POWDER-ACCURACY-DOCTRINE.md`.

---

## 2. OOP is load-bearing, not decoration

`packages/ballistics-core/src/domain/BallisticProfile.ts` is the reference. It is
the pattern, not an exception.

### Value objects, not bare interfaces

A validating constructor means **an invalid object cannot exist**. Do not accept
a plain object literal and validate it later somewhere else.

```ts
/** Thrown when a value object is constructed out of range. */
export class InvalidBallisticProfile extends Error {
  override readonly name = 'InvalidBallisticProfile';
}

export class BallisticProfile {
  readonly muzzleVelocityFps: number;
  // ...
  constructor(muzzleVelocityFps: number, /* ... */) {
    // assign, then validate
    if (muzzleVelocityFps <= 0) {
      throw new InvalidBallisticProfile('Muzzle velocity must be positive.');
    }
  }
}
```

- **Named factories for the common shapes.** `BallisticProfile.of(...)` /
  `.from(...)`. The file header says to construct through these and *never* with
  `new`, so validation always runs.
- **One error class per value object**, with `override readonly name` set.
  Distinct types mean a caller can catch the specific failure.
- **Fields are `readonly`.** These are immutable by design.
- **Explicit fields, not TypeScript parameter properties.** This package runs
  under Node's type-stripping loader, which rejects `constructor(private x)`. The
  file says so in a comment at the constructor; keep that comment.
- **JSDoc on every public member**, one line for a simple field, a block for
  anything non-obvious.

### All physics lives in `packages/ballistics-core/`

Never in `apps/`, never in `scripts/`. If logic grows past what a script is for,
move it into the domain package and test it there.

---

## 3. Provenance on every physical constant

No bare numeric literals in computation code. Every constant lives in
`packages/ballistics-core/src/provenance/constants.ts`, wrapped:

```ts
export const GRAINS_PER_POUND = published(7000, SOURCES.cip, { units: 'gr/lb' });
```

`published()` / `derived()` / `estimated()` come from `./Source.ts`.
`estimated()` **without** reasoning throws `UnverifiedValueError` at runtime —
that is the enforcement, so do not route around it by casting.

---

## 4. Comments explain *why*, and the history

The house style is unusually heavy on comments, and that is deliberate. A reader
should never have to reconstruct *why* something is the way it is.

**Required:**

- A file header block explaining what the module is, why it exists, and what it
  deliberately does **not** do.
- A comment on any non-obvious decision, naming the alternative rejected and the
  failure it avoids.
- **Trap history.** When a bug is fixed, leave a comment saying what the old code
  did, why it was wrong, and how you know. See `AGENTS.md`'s Traps table — those
  entries are the house style, written by the agent that hit them.

**Not required:** comments restating what the code says. `// increment i` is noise.

Bad:

```js
// Returns the sum.
function add(a, b) { return a + b; }
```

Good:

```js
// `close()` alone only stops NEW connections; it waits for existing ones to
// drain. Chrome holds keep-alive sockets open after `--dump-dom` returns, so the
// process stayed alive until they timed out. `closeAllConnections()`
// (Node 18.2+) is what actually ends them.
server.closeAllConnections?.();
server.close();
```

---

## 5. Security is a design input, not a review step

### Never build DOM from strings

`innerHTML` with interpolation is a stored-XSS sink: any field that ever comes
from the database, and later from user input, becomes script execution.

`apps/website/src/dom.js` is the reference implementation. `el()`, `icon()`,
`safeUrl()`, `externalLink()`.

```js
// Rejects javascript:, data:, vbscript: and anything else.
export function safeUrl(raw) {
  if (typeof raw !== 'string') return null;
  try {
    const parsed = new URL(raw, window.location.origin);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch {
    return null;
  }
  return null;
}
```

Outbound links carry `rel="noopener noreferrer sponsored"`. `sponsored` is the
correct value for a paid link and is also an FTC requirement — see
`docs/AFFILIATE.md`.

### Validate every URL that reaches an `href`

Even one built from a template. `safeUrl()` returns `null` and the caller
renders plain text rather than an unclickable broken element.

### Never use `INSERT OR IGNORE` as a substitute for validation

It skipped a constraint-violating row without a word. Seven legitimate Berger
bullets vanished that way on 2026-10-01.

### Blank is `null`, not `""`

The provenance layer depends on the difference.

### Part numbers and SKUs are strings, never numbers

`065147` → `65147` destroys a leading zero and breaks the join.

### Network access stays out of pure logic

`scripts/shared/affiliate-links.mjs` fetches nothing, on purpose: network access
is where ToS and price-advertising exposure live. Keeping it pure makes it
trivially testable and impossible to get wrong contractually.

---

## 6. Tests: fixtures, and negative tests

### Use real rows as fixtures

Every fixture in `scripts/tests/test-affiliate-links.mjs` is a real row from
`data/seeds/`. The file says why:

> A test using an invented URL proves the resolver handles a made-up input; it
> does not prove it handles the data it will actually be given.

### Every gate needs a negative test

A gate never shown to fail is not known to work. Three in this repo passed
against deliberately broken input before that was discovered:

- The CSP browser check asserted on text present in the static markup, so it
  passed against a policy that blocked the entire site.
- A negative test whose injection was silently eaten — the gate was right, the
  test was wrong.
- `data/generated/**` staleness passed while 19 tables were empty.

**Verify the artefact, not the exit code.** Print what the function returned,
re-read the file, count the matches. Four separate gates reported success or a
plausible number while being wrong.

### Tests must not be written from our own output

Use `data/reference/`. Writing an expectation from the implementation defeats the
purpose — that is how three ballistics defects shipped under 161 passing tests.

---

## 7. Documentation is part of the change

Documentation updated **with** code, never after.

- Every backticked `scripts/…`, `apps/…`, `packages/…`, `data/…`, `docs/…` path
  must resolve. `npm run docs:check` fails on one that does not, so a moved file
  cannot leave a dead pointer in a handoff. `CHANGELOG.md` is exempt — it records
  where things *were*.
- When behaviour changes, the file documenting that behaviour changes in the same
  commit.
- State what a thing does **not** do, and why. The strongest docs here are the
  ones that explain the rejected alternative.
- New gate → add it to `README.md`'s script table, `SECURITY.md`'s gate table if
  it is a security gate, and the `verify` chain.
- Never invent a citation. An unverified rate is worse than a blank one: a blank
  gets looked up, a wrong one gets used.

---

## 8. Boundary rules

### Never write into `apps/` from a data-layer script

`apps/website/src/` is the source; `npm run website:build` produces
`apps/website/dist/index.html`, which is what Cloudflare serves.
`scripts/extract/extract-website.mjs` did exactly this and stripped `main.js`'s
XSS hardening — only `npm run lint` caught it.

### If you change the main app on purpose, run `npm run handoff:accept`

`npm run handoff:status` (inside `verify`) fails on any change that was not
accepted. That asymmetry is the point: the approved hash changes because
**someone typed a command**, not as a side effect of working nearby. It is
deliberately not in `verify` — a gate that re-arms its own baseline is a mirror,
not a tripwire. Include a `--note` saying what changed and why.

### Do not touch `data/schema/011_community_layer.sql`

The community/official separation is deliberate and load-bearing. No foreign keys
from official tables into the community set.

---

## 9. Encoding and file hygiene

- UTF-8, **no BOM**, LF line endings, RFC 4180 quoting. Enforced by
  `npm run test:encoding` for CSVs and `docs:check` for Markdown.
- **Never write a file with a shell redirect.** Use the editor. An inline
  `Set-Content -NoNewline` collapsed an 11 KB file into a single 10,711-character
  line.
- **Do not trust a multi-line edit.** `insert_line` once landed inside an open
  `CREATE TABLE` and silently truncated it; a PowerShell `-replace` with a
  here-string injected a literal `+` into 100 lines. Both produced plausible-looking
  files. Re-read what you wrote, and run the migration.
- `node --check` validates syntax, not that a named import exists. **Run the
  script.**
- Put scratch in `tmp/`. Not the repo root — `npm run lint` runs `eslint .` and a
  stray diagnostic file fails the build for everyone.
- Before finishing, `git status` the paths you touched.

---

## 10. Enforcement summary

`npm run verify` — **`npm run verify` must exit 0. 235 tests. Do not quote a
stage count here: it changes every time a gate is added, and `docs:check`
fails on a stale one.**

```bash
npm run verify      # before you start and after you finish
npm run data:health # live row counts before quoting any number
```

| Stage | What it catches for you |
|---|---|
| `lint` | unused vars, `no-undef`, `no-useless-assignment`, unsafe patterns |
| `typecheck:all` | type errors; also catches a bad import |
| `test:all` | domain logic regressions |
| `test:encoding` | UTF-16, BOMs, stray CRs, ragged rows |
| `schema:check` | migrations apply **and** CSV→table row parity |
| `seed:check` | types, enums, references, manifests |
| `data:validate` | stale generated files |
| `docs:check` | structure **and** that every backticked path resolves |
| `handoff:status` | an unapproved change to the shipped artefact |
| `security:check` | injection sinks, unpinned remote scripts |
| `modules:check` | imports resolve, no cycles, no stale doc pointers |
| `website:check` | single-file artefact, CSP, deploy path matches build output |
| `claims:check` | unsupported advertising claims, disclosure placement, a11y floor |

The docs disagree with each other on the stage count. **14 is correct.**

---

## 11. Finishing

1. `npm run verify` exits 0.
2. Your gate has a **negative test** you ran and observed failing.
3. Docs updated in the same change.
4. If you touched the main app: `npm run handoff:accept -- --note="..."`.
5. Summary states: what changed, what you verified and how, what you found but
   did **not** touch, and anything you believe is wrong outside your write-set.

**Do not edit files outside your write-set.** Report problems instead. That is
`AGENTS.md` rule 10, and [`PARALLEL-WORK-PLAN.md`](PARALLEL-WORK-PLAN.md) gives
it teeth by naming the exact paths.
