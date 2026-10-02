# HANDOFF.md — the contract between the data layer and the main app

**Read this before changing anything that either side produces.**

Last updated 2026-10-02.

---

## Why this file exists

There are two independent things in this repository, and until now nothing
connected them:

| | What it is | Who writes it |
|---|---|---|
| **The data layer** | `data/**`, `scripts/**` | ~15 scripts, mostly one-shot |
| **The main app** | `apps/website/dist/index.html` — the file Cloudflare actually serves | a human, by hand |

`apps/website/dist/index.html` is a **single ~94 KB file containing its own markup, its
datasets and its logic**. It is not built from `apps/website/src/`. It is
committed directly and deployed as-is.

The danger is that work in one half silently breaks the other, and **no gate
catches it**. That has already happened twice:

- `extract-website.mjs` overwrote `apps/website/src/main.js`, reverting its XSS
  hardening, and nothing noticed until `npm run lint` failed by accident.
  See `CHANGELOG.md`, third pass.
- The Vite build that is supposed to produce the site **does not run at all**
  (open blocker below), so the deployed file and the source tree have been
  drifting with nothing to detect it. — *Resolved later the same day; see
  "Resolved: the deploy path is broken" below. The build now runs and is gated
  by `npm run website:check`.*

This file is the interface. `scripts/handoff/check-handoff.mjs` enforces it and runs as
part of `npm run verify`.

---

## The one rule

> **The data layer may not write into the main app, and the main app may not
> import from the data layer.**

Data reaches the site by a **human copying a published, checksummed artefact**
across the boundary — never by a script writing into `apps/`, and never by the
page fetching `data/` at runtime.

Both halves of that are deliberate:

1. **`index.html` is self-contained.** It contains zero `data/`, `*.json` or
   `*.csv` references, and it must stay that way. A page that fetches its data
   at runtime turns every upstream data change into a possible live-site
   regression, and makes the file impossible to verify offline.
2. **It keeps the blast radius at zero.** A data-layer script that cannot write
   into `apps/` cannot damage the shipped site, whatever bug it has. The
   `extract-website.mjs` incident is exactly the failure this prevents.

---

## How a change crosses the boundary

> **Status: the website is now built from `apps/website/src/`.** This section
> describes the mechanism as it stands; see `apps/website/README.md` for the
> migration and what changed.

**The main app is now built.** `apps/website/src/index.html` is the Vite entry
and `npm run website:build` produces `apps/website/dist/index.html`, a single
self-contained file. The six modules under `apps/website/src/` are now live:
they were previously dead code that the shipped page never loaded.

This closes the drift risk that motivated this document. `scripts/gates/check-website-build.mjs`
(`npm run website:check`, part of `verify`) fails the build if `dist/` contains
anything other than one file, if the output references a bundled asset, calls
`fetch(`, or reaches into `data/`.

Both rules below still hold, and are now mechanically enforced:

1. **`dist/index.html` is self-contained.** One file, no external `.js`/`.css`,
   no runtime fetch of `data/`. The inlining step lives in
   `apps/website/vite.config.js`.
2. **The blast radius stays at zero.** Nothing in `data/` or `scripts/` writes
   into `apps/`.

### What the migration changed about the shipped page

Verified by diffing the built output against the previous hand-maintained file:

- **583 markup tags in, 583 out** — the only difference is one `preconnect`
  host, which was a bug: the original pointed at `https://gstatic.com`
  (404) instead of `https://fonts.gstatic.com`.
- **`innerHTML` assignments: 5 → 0.** The retailer and checklist renderers now
  build DOM nodes via `src/dom.js` (`el`, `icon`, `safeUrl`, `externalLink`).
  This retires three recorded XSS findings rather than carrying them forward.
- **A divide-by-zero guard** for `savingsPerRound` exists in `src/main.js` and
  is now live. It was fixed in the source tree but had never shipped.
- **File size: 66,199 → 55,740 bytes.**

The two implementations had drifted: `src/main.js` was the hardened copy, and
the hand-maintained file was the stale one that kept shipping.

```
 data layer                        HANDOFF                 main app
 ──────────                        ───────                 ────────
 scripts write                      │                    apps/website/
   data/seeds/*.csv   ──┐           │                     index.html
                        ├──▶ build  │  (checksummed)      (hand-edited)
   data/generated/**  ──┘     handoff bundle                 │
                                     │                       │
 scripts/handoff/check-handoff.mjs ────┴─── verifies ──────────┘
```

1. Change the data. Run `npm run verify`. It must pass. **The app is not
   touched and cannot be.**
2. If the site should show the new data, a human updates `index.html` and runs
   `npm run handoff:accept` to record the new approved state.
3. `check-handoff` fails if `index.html` has changed without that step, or if
   the recorded state disagrees with the file on disk.

---

## What is protected, and how

`apps/website/dist/index.html` is the **protected artefact**. Its approved state
lives in `data/handoff/app-manifest.json` as a SHA-256.

`check-handoff.mjs` enforces:

| Check | Fails when |
|---|---|
| **Integrity** | `index.html` does not match its recorded SHA-256 |
| **Self-containment** | the page references `data/`, or any local `.json`/`.csv` |
| **Supply chain** | a remote script is loaded without `integrity` (SRI) |
| **Runtime compiler** | `cdn.tailwindcss.com` is present — it *executes* against the page |
| **No inline handlers** | an `on*=` attribute appears, which a nonce-based CSP forbids |
| **CSP present** | no `Content-Security-Policy` is declared |

### Approving a change on purpose

```bash
npm run handoff:status     # what the checker thinks
npm run handoff:accept     # record current index.html as the approved state
```

`handoff:accept` is the only way to change the recorded hash, and it is
deliberately a separate, obvious command. The point is that a change to the
shipped file cannot be a **side effect** of working on the data layer. It has to
be a decision someone types.

---

## Resolved: the deploy path is broken — **FIXED 2026-10-01**

Found 2026-10-02, fixed later the same day. The original finding is kept below
because it is why the boundary above matters.

```
$ npm run website:build
Could not resolve entry module "src/index.html".
```

**What was true then.** `apps/website/vite.config.js` set
`root: apps/website/src`, but there was no `index.html` in that directory — only
`dom.js`, `main.js`, `tailwind.config.js`, `data/*.js` and `styles/theme.css`.
So `vite build` could not produce a site, and `npm run deploy`
(`vite build && wrangler pages deploy dist`) could not run. The deployed artefact
was `apps/website/index.html`, committed by hand, and nothing rebuilt it — which
is why the two halves had drifted.

**How it was resolved.** Option 2, the better long-term one:

- `index.html` now lives at `apps/website/src/index.html` and is a real Vite
  entry point.
- `tailwind.config.js` was deleted. Tailwind v4 is compiled at build time through
  `@tailwindcss/vite`; the old CDN runtime compiler is gone.
- The build emits a single self-contained `apps/website/dist/index.html`
  (~94 KB), gated by `npm run website:check`, and served from
  `apps/website/dist` per `wrangler.toml`.
- The gate rejects bundled asset references, runtime `fetch()`, any `data/`
  reach-in, non-allowlisted external references, and a CSP containing `unsafe-*`
  keywords.

**Still open.** Remote D1 provisioning
(`wrangler.toml` placeholder `database_id`) remains undone — see
[`docs/DATA-TODO.md`](docs/DATA-TODO.md) §0.2c.

## Resolved: unsupported advertising claims — **FIXED 2026-10-02**

The retailer directory carried `rating: 4.9` (and 4.6–4.9 on the other seven),
rendered a gold star next to each, labelled every card "Verified Shipping
Partner", headed the section "Verified Suppliers", badged them "Top Choice" /
"Powder Authority" / "Component Stock Leader", and advertised "30% - 60% Avg
Handload Savings" in the hero.

None of it had a source. No review count, no citation, no comparison set, and no
code that verifies anything. This is the highest-risk thing the project shipped,
because the site earns money from those exact links: under 16 CFR 255.2(b) an
endorser may not make a representation they cannot substantiate, and a
disclosure does not cure it — it only tells the reader who paid you.

All removed. Cards now show name, what the retailer sells, and its own URL —
facts a reader can check themselves. `npm run claims:check` fails the build if
any of it returns.

Two more from the same pass: the affiliate disclosure existed only in the
footer, which FTC guidance says is the position most likely to be missed; it now
sits above the retailer grid in the same viewport as the links, and the gate
asserts that ordering rather than mere presence. And five form inputs had visual
`<span>` text that is not a label, failing WCAG 4.1.2.

---

## Resolved: `wrangler.toml` pointed at a directory that does not exist — **FIXED 2026-10-02**

`pages_build_output_dir` was `"dist"`. No `dist/` exists at the repository root,
and never did. The build emits `apps/website/dist/`.

This is the worst shape a deploy misconfiguration can take: `wrangler pages
deploy` on a missing output directory does not fail loudly — it publishes
nothing, and the site simply 404s with no error in the logs to point at the
cause.

Now `"apps/website/dist"`, which matches `npm run website:build`. The
`wrangler.toml` comment says why, so the next person does not "tidy" it back.

There is no `deploy` script in `package.json` — deployment is run by hand. The
command is `npm run website:build && npx wrangler pages deploy
apps/website/dist`. Note that the older note above quotes a historical
`vite build && wrangler pages deploy dist`; that form targeted the same missing
root `dist/` and would not have worked.

Until then, treat `index.html` as the source of truth for the site and `src/` as
scaffolding. **Not actioned here**: it is a deployment decision, not a
documentation or data fix.

---

## The supply-chain finding, and why it blocks the handoff

`index.html` currently loads:

```html
<script src="https://cdn.tailwindcss.com"></script>
```

**This is a runtime compiler.** It downloads Tailwind, compiles the page's
classes in the visitor's browser, and injects a `<style>` element. OWASP's
Third-Party JavaScript guidance is blunt about this class: the third party gains
the ability to run arbitrary code on your page, and a compromise of that origin
— or of the unpinned URL, which carries no `integrity` attribute — is a
compromise of `apex-amc.com`. The README already flags this file as carrying
"CDN React, Babel standalone and an unpinned `lucide@latest`".

The page also declares **no Content-Security-Policy at all**. OWASP treats a CSP
as the defence in depth that still holds when an XSS bug slips past review, and
the strict policy is:

```
script-src 'sha256-<hash of the inline bundle>' 'strict-dynamic'; object-src 'none'; base-uri 'none'
```

**Not a nonce, and that is a measured decision.** A nonce must be fresh per
request *and* present as an attribute on the element. Cloudflare Pages parses
`_headers` at deploy time and sends its values verbatim — there is no per-request
substitution, so a nonce cannot reach already-built inline markup.

This was not assumed. Serving the real `dist/` under a real
`script-src 'nonce-{RANDOM}'` in Chrome on 1 Oct 2026 produced:

```
The source list for 'script-src' contains an invalid source: ''nonce-{RANDOM}''
Executing inline script violates ... 'script-src'. The action has been blocked.
```

The page rendered in Times New Roman with 3,741 characters instead of Inter
with 5,679. The scanner passed throughout, because the header *did* contain a CSP
directive and no `unsafe-*` keyword.

Hashes are generated from the build by `npm run website:csp`, which
`website:build` runs automatically, and `website:check` recomputes them and fails
on a mismatch.

`'strict-dynamic'` lets a trusted script load further scripts, which is what
makes such a policy compatible with a loader **without** allowlisting
`cdn.tailwindcss.com` by host. `'unsafe-inline'` must not appear — it disables
the inline-script protection the nonce exists to provide. The page has 2 inline
`<script>` blocks, 0 inline `on*=` handlers, and 5 `innerHTML` uses, so a
nonce-based strict policy is achievable without restructuring.

**`check-handoff` reports these as findings and fails on them.** It does not fix
them: adding a CSP or self-hosting Tailwind changes the shipped artefact and
must be a human decision, recorded with `handoff:accept`. Until then the report
is the honest state of the site, and the reasons it is not silently "passing"
stay visible.

---

## What the checker does *not* do

Stated so nobody assumes more protection than exists.

- It does not verify the page renders, that links work, or that the calculator
  computes correctly. That is `packages/ballistics-core/test` and a browser.
- It does not scan the page for XSS. It checks that the defences which *would*
  catch XSS (a CSP, no inline handlers) are present. The 5 `innerHTML` uses are
  flagged for a human, not proven safe.
- It does not test third-party responses. SRI is verified as *present*; whether
  a given CDN hash currently matches is a network question this does not ask.
- It does not diff the data the page displays against the data layer. That is
  not automatable while the datasets are duplicated by hand inside the HTML —
  which is itself an argument for fixing the build.
