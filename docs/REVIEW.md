# Project Review — security, practices, and polish

**Researched 1 Oct 2026 against current practice.** Every claim below was
verified against this repository's own code, not assumed.

Ordered by value-per-effort, not by severity alone.

---

## First, the OOP question

**Keep OOP. It is not outdated, and your usage is the good kind.**

MDN still documents JavaScript as *"a cross-platform, **object-oriented**
scripting language"*. Classes, private fields, interfaces and abstract contracts
are first-class and actively documented. There is no migration away from them.

What *has* changed is the argument, not the practice:

| Old framing | Current framing |
|---|---|
| "Classes are the way" | "Classes model a **domain with invariants**" |
| Avoid OOP, use functions | Functions for **transforms**; classes for **entities with rules** |
| Inheritance is the point | **Composition** carries most designs; inheritance for genuine substitutability |

Your `packages/ballistics-core` already does this correctly:

- `BallisticProfile` is a validating constructor with a `static of()` factory —
  you cannot construct an invalid projectile.
- `Sourced<T>` wraps every number with its provenance. That is *encapsulation
  solving a real problem*: it makes "where did this number come from?"
  answerable at runtime.
- Interfaces (`DeviceDriver`, `TurretControl`) describe capabilities the app
  depends on without binding to an implementation.
- Typed errors: `InvalidBallisticProfile`, `InvalidSolveRequest`,
  `DeviceReadError`.

**No change recommended.** The one place a functional style genuinely fits is
pure numeric transforms — `dispersion.ts` has no state. That is a style
preference, not an improvement. Leave it.

### Where OOP *is* worth revisiting

---

## What you already do better than most projects

Worth stating plainly, because these are not common:

- **`strict: true` + `noUncheckedIndexedAccess` + `noImplicitOverride`** on a
  domain where a wrong number changes a firing solution. Many projects skip
  `noUncheckedIndexedAccess` alone.
- **`recommendedTypeChecked` ESLint rules** with `projectService: true`.
- **Every physical constant carries a citation**, and the solver imports them
  rather than restating them (fixed in the previous session).
- **Negative-tested gates.** `website:check` was proven to reject an injected
  asset reference, an injected `fetch()`, and an unapproved CDN. A gate that
  cannot fail is worse than none.
- **Zero production dependencies** in the root package.
- **No `eval`, no `new Function`, no shell interpolation.** The single
  `execFileSync` uses an argv array, not a shell string.

---

## P0 — correctness and supply chain

### P0-1. Expo app typecheck — FIXED 1 Oct 2026

```
error TS18003: No inputs were found in config file 'apps/ballistics/tsconfig.json'.
Specified 'include' paths were '["packages/**/*.ts","packages/**/*.js"]'
and 'exclude' paths were '[...,"apps/ballistics",...]'
```

It is a copy of the root config. Its `include` points at `packages/**` — which
resolved relative to `apps/ballistics/` does not exist — and its `exclude`
excludes itself. **The Expo app's 13 modules and 9 screens have never been
typechecked.** ESLint covers them; `tsc` does not.

**Fix:**
```jsonc
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["node", "react"]
  },
  "include": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
  "exclude": ["node_modules"]
}
```

**Then add `typecheck:ballistics` to `verify`.** Expect real errors on first run
— that is the point. It means the app has never been checked.

### P0-2. TypeScript 7 — DEFERRED, with evidence

**Attempted 1 Oct 2026 and deliberately reverted.** Two blockers, both measured
rather than assumed.

**Blocker 1 — the linter refuses to run.** `typescript-eslint@8.71.0` (the latest
release) declares `typescript: ">=4.8.4 <6.1.0"` and throws:

```
Error: typescript-eslint does not support TS 7.0.
```

The typecheck passed on TS 7, but `npm run verify` went red at the lint stage.
Even the `canary` tag caps at `<6.1.0`.

**Blocker 2 — TS 7 is measurably SLOWER on this project.** Three runs each, with
the order alternated to rule out warm-up bias. Both compilers checked the same
190 files.

| Compiler | Median |
|---|---|
| TypeScript 6.0.3 | **559 ms** |
| TypeScript 7.0.2 | 926 ms |

That contradicts the "8–12× faster" headline. Our project is small enough that
the native binary's startup and index-loading overhead dominates the compile
itself. The speedup appears on a large codebase; it does not apply here.

**The side-by-side path was rejected.** Microsoft documents running
`typescript-eslint` against the TS 6 API via `@typescript/typescript6`. It does
work, but it needs `--legacy-peer-deps`, a non-standard alias, and the two
compilers kept in lockstep by hand. That fragility costs more than the upgrade is
worth while the linter is the only thing catching type-aware bugs in `scripts/`
and `apps/`.

**Action taken:** reverted to 6.0.3 — `npm view` confirms it is the final 6.x.
`verify` was green before and after. **Revisit when `typescript-eslint` ships TS 7
support**; Dependabot is configured to surface it the day that lands. See
`docs/DEPENDABOT.md`.

### P0-3. No CI at all

No `.github/`, no `.husky/`, no automation. All 13 verify stages run **only when
a human remembers to run them.**
---

## P1 — security

Cross-referenced against **OWASP Top 10 2025** — the current release. Most
articles still cite the 2021 list.

### P1-1. Content Security Policy — FIXED 1 Oct 2026

The largest remaining gap. Without a CSP, any XSS bug runs unrestricted.

**Read this before writing one:** the page loads `https://cdn.tailwindcss.com`,
a **runtime compiler**, which requires `unsafe-eval`. A CSP that permits
`unsafe-eval` to accommodate it provides far less protection than it appears to.

**Fix the dependency, not just the header:**
1. Build Tailwind at deploy time (`@tailwindcss/vite`) instead of the CDN
   runtime. Removes both `unsafe-eval` and a third-party script.
2. Self-host Font Awesome, or drop it for inline SVG.
3. *Then* add a strict policy — no `unsafe-inline`, hash-based:

```
script-src 'sha256-<hash of the inline bundle>' 'strict-dynamic';
style-src 'sha256-<hash of the inline style>';
```

**Not a nonce.** A nonce must be fresh per request *and* present as an element
attribute. Cloudflare Pages parses `_headers` at deploy time and sends the values
verbatim, so it cannot do both for already-built inline markup.

That was measured, not assumed. Serving the real `dist/` under a real
`script-src 'nonce-{RANDOM}'` in Chrome on 1 Oct 2026 produced
`contains an invalid source: ''nonce-{RANDOM}''` followed by
`Executing inline script violates ... 'script-src'`. The page rendered in Times
New Roman with 3,741 characters instead of Inter with 5,679 — while every static
check passed, because the header did contain a CSP directive and no `unsafe-*`
keyword.

`npm run website:csp` writes the hashes from the build; `website:check` fails if
they drift.

`strict-dynamic` lets the hashed bundle load what it needs without enumerating
every host — that is what makes a strict CSP practical.

**Ordering matters.** A CSP written *before* removing the runtime compiler
produces a policy full of holes that looks secure.

### P1-2. Tailwind runtime compiler — FIXED 1 Oct 2026

Third-party JS with full page privileges, from a host we do not control,
unpinned. Same fix as P1-1 step 1. Once self-hosted, this finding and P1-1's
root cause both disappear.

### P1-3. XSS — *Fixed in the previous session*

Was 5 `innerHTML` sinks in the retired prototype. Now **0** in the built
artefact, verified by measurement rather than assumed. Listed so the fix is not
mistaken for "never found".

### P1-4. The D1 database is not provisioned

`wrangler.toml` still has `REPLACE_WITH_YOUR_D1_DATABASE_ID`. Before the site
reads from D1:

---

## P2 — testing and quality

### P2-1. Website tests — PARTIALLY DONE

`safeUrl()` now has 7 tests (`apps/website/test/dom.test.js`, run by
`npm run test:website`, wired into `verify` and CI). It is the security boundary
— the only thing between a retailer URL from a CSV and `javascript:` execution in
a visitor's browser — and it had none.

Coverage: ordinary URLs, `javascript:` (including mixed case and leading
whitespace), `data:`, `vbscript:`, `file:`, `blob:`, relative-URL resolution,
non-string inputs, and unparseable URLs.

**Negative-tested:** removing the scheme check from `dom.js` fails exactly 3
tests. A gate that cannot fail is worse than none.

Deliberately dependency-free — `safeUrl` needs only a `URL` parser and a
`window.location.origin`, so it is tested directly rather than through jsdom,
which would add a large dev dependency for four pure functions.

**Still to do:** the two renderers (`retailerCard`, the checklist renderer) are
untested. They need a DOM, so that work wants jsdom or a headless browser — a
larger decision than this pass.

### P2-2. No tests for `apps/ballistics`

9 screens, a SQLite layer and a backup service, untested. `services/` holds the
real logic and is where to start.

### P2-3. `check-seeds.mjs` is 1,644 lines

The largest file in the repo. **Split by responsibility, not length** — it is a
safety gate with shared mutable state. Extract pure helpers first (row parsing,
reference resolution, report formatting) and leave the orchestration untouched
until the suite is green.

*Note:* the file grew from 1,619 to 1,644 when its reporting and
`process.exit(1)` were moved behind an `isMain` check so
`shared/load-database.mjs` can import it as the single seed loader. See
[`docs/DATA-TODO.md`](DATA-TODO.md) §0.2.

### P2-4. Accessibility — FIRST PASS DONE

The original assessment — "1 aria attribute across 583 tags" — **overstated the
problem.** Re-measuring found no clickable divs, no unlabeled images, and every
input already carrying an id. The real defects were narrower and are now fixed:

- **7 orphaned `<label>` elements.** Each closed *before* its input, which sat in
  a sibling `<div>`. Implicit association did not apply, so assistive technology
  announced seven unlabelled money fields. Each now has `for="…"`, and all 7 were
  verified to resolve to a real id.
- **The mobile drawer** had no `aria-expanded` or `aria-controls`. Added, and
  `main.js` now syncs it through one `setDrawerOpen(open)` function. An aria
  attribute that disagrees with the visual state is worse than a missing one, so
  it is updated in one place rather than at each call site. Icon-swap behaviour
  was verified equivalent before and after.
- **The caliber preset group** was a `<label>` pointing at a button group, so a
  `for=` could not bind to it. Converted to a labelled `role="group"` with
  `aria-labelledby`.

Verified mechanically: no dangling `for=`, no dangling `aria-labelledby`, no
duplicate ids.

**Still to do:**
- **Colour contrast** was never measured. `text-slate-400` on `tactical-950` is
  the likely failure and needs checking against the 4.5:1 requirement.
- **Keyboard navigation** has not been walked end to end; focus management for
  the drawer is in scope and unverified.
- **Automated auditing** — Lighthouse or axe-core in CI. Without it, this class of
  defect can return silently.

---

## P3 — polish

### P3-1. Missing standard files

| File | Status |
|---|---|
| `LICENSE` | **Decision needed, not a defect.** The project is `private: true` and unpublished, so nothing requires one today. But the default without a file is *all rights reserved* — nobody may legally reuse the domain physics or the drag tables. If Apex AMC should ever be open source, add the file **and** set `"license"` in `package.json`. `package.json` now records this decision rather than leaving it silent. |
| `CONTRIBUTING.md` | Still missing. `AGENTS.md` is excellent and unusual; a human-facing equivalent is the gap. Low value until there are contributors. |
| `CODE_OF_CONDUCT.md` | Only needed once taking outside contributions. |

### P3-2. Outdated dependencies

None urgent, none with known vulnerabilities.

| Package | Installed | Latest | Note |
|---|---|---|---|
| `vite` | 7.3.6 | **8.3.2** | Major. The one worth doing. |
| `typescript` | 6.0.3 | **7.0.2** | See P0-2. |
| `react-native` | 0.86.3 | 0.87.1 | Expo 57 pins this. Do not bump independently. |
| `@babel/core` | 7.29.7 | 8.0.6 | Major, Expo-managed. Leave it. |
| `@types/node` | 24.19.0 | 26.6.3 | Minor; safe. |
| `globals` | 16.5.0 | 17.13.0 | ESLint's globals. Minor. |

**Rule:** upgrade Expo-managed packages only via `expo install`, which respects
the SDK pin. Bumping `react-native` by hand is how Expo projects break.

### P3-3. `archive/` needs a README

It holds a Gemini chat log (`.txt`, gitignored) plus tracked `.jsx`/`.tsx`
snapshots. Fine to keep, but without a note the next reader cannot tell
archaeology from active code.

### P3-4. Commit the 132 staged files

Everything is staged and `verify` is green. Rule 11 says commit only when asked,
so it remains undone — but it should not drift further.
- a real database ID, migrations applied (`db:remote`);
- **the `DB` binding must never be reachable from the client.** D1 access is
  server-side only — confirm no client-side query path exists;
- if any authenticated feature is added, settle the auth model *before* writing
  queries. Retrofitting auth is far harder than building with it.

This is the highest-value gap on the list. Everything else becomes more reliable
---

## Resources worth using

### Learn the current baseline

| Resource | Why |
|---|---|
| **MDN** (`developer.mozilla.org`) | The reference. Your tsconfig already matches its guidance. |
| **typescript.dev** | Official handbook; the 7.0 migration notes live there. |
| **OWASP Top 10 2025** | Current security baseline. Supersedes the 2021 list most articles cite. |
| **MDN CSP guide** | Best practical walkthrough of nonce + `strict-dynamic`. |
| **web.dev** (Google) | Performance and Core Web Vitals. |

### Tools that would earn their keep here

| Tool | What it does for you |
|---|---|
| **Dependabot / Renovate** | Dependency updates as PRs, gated by CI. Solves P0-2 and P3-2 continuously. |
| **Lighthouse CI** | A11y + performance budget in CI. Free. Catches P2-4 automatically. |
| **axe-core** | Programmatic a11y assertions in tests. |
| **CodeQL** | Free for public repos. Finds injection bugs by pattern, not by audit. |
| **npm audit** | Already clean at 0 — wire into CI so it stays that way. |
| **GitHub secret scanning** | Free. Prevents the worst class of leak. |

### Learning resources, given you've been away a while

- **"Eloquent JavaScript"** — free, and it explains *why* the language behaves as
  it does rather than what to type.
- **MDN "Web development courses"** — structured path if you want a curriculum.

---

## Suggested order

**Week 1 — the ones that change what you can trust**
1. Fix `apps/ballistics/tsconfig.json` (P0-1). Ten minutes, and it will surface
   real errors you want to see.
2. Add CI (P0-3). Everything below becomes reliable.
3. `LICENSE` (P3-1). Five minutes, no risk.

**Week 2 — security**
4. Replace the Tailwind CDN with a build-time stylesheet (P1-1, P1-2). Removes
   two findings and unblocks the CSP.
5. Add the strict CSP once step 4 is done.

**Week 3 — quality**
6. Tests for `safeUrl()` and the two renderers (P2-1).
7. Vite 8 (P3-2).
8. Accessibility first pass (P2-4), Lighthouse in CI.

**When ready, not urgent**
9. ~~Seed-to-database loader (`docs/DATA-TODO.md` §0.2)~~ — **DONE 2026-10-01.**
   `npm run db:local` writes a populated `data/generated/apex.sqlite`
   (1,666 rows, 24 tables), and `schema:check` asserts CSV→table parity.
   Only D1 provisioning (§0.2c) remains, and that needs owner credentials.
10. Split `check-seeds.mjs` (P2-3).
11. TypeScript 7 (P0-2).
12. Commit the staged files (P3-4).

---

## Do not bother

Recorded so these do not get re-litigated:

- **Rewriting OOP as functional.** Your domain modelling is good. A rewrite
  would cost weeks and make the physics *less* readable.
- **Extracting RK4 coefficients into config.** Structural maths, not data.
- **Enforcing a maximum file length.** `solver.ts` is long because it documents
  five failure modes. That is correct.
- **Adding a state manager.** There is one page and one state object.
once CI exists, because CI is what makes a gate real.

**Add:** `.github/workflows/verify.yml` running `npm ci && npm run verify` on
push and PR, plus `npm audit --omit=dev`. Then `husky` + `lint-staged` for a
pre-commit hook on the fast stages (`lint`, `typecheck`, `test`).
Not "is OOP old" but "is this abstraction earning its keep":

1. **`DriverRegistry` with capability filtering** — with only one driver
   (`simulated.ts`) this is speculative generality. It earns its keep when a
   Bluetooth driver lands; until then it is untested abstraction.
2. **`check-seeds.mjs` shared mutable state** — the one place object orientation
   is actively hurting (see P2-3).