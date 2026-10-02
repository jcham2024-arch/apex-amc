# SECURITY.md — findings, severity, and what fixes them

**Last reviewed 2 Oct 2026.** Every finding below was located by reading the
code, not inferred from a scanner's word.

Enforced by `scripts/security/security-check.mjs` (stage 11 of `npm run verify`).

---

## Summary

| # | Finding | Severity | Exploitable today? | Status |
|---|---|---|---|---|
| 1 | Path traversal in `fetch-published-data.mjs` | **High** | Not from external input, but reachable via the manifest | **Fixed** |
| 2 | Template-injection XSS in the website (2 sinks) | **High** | Was not with current data; would go live the moment data came from a source | **Fixed** |
| 3 | `href` built with no scheme check | **High** | Same; `javascript:` executes on click | **Fixed** |
| 4 | `cdn.tailwindcss.com` unpinned, no SRI | **High** | Was: requires compromising that origin | **Fixed** — CSS compiled at build time |
| 5 | `cdn.tailwindcss.com` is a runtime compiler | **High** | Was: third-party JS on every page load | **Fixed** — compiler removed |
| 6 | No Content-Security-Policy | **Medium** | Defence in depth; nothing to exploit on its own | **Fixed** — strict nonce policy |

**Clean, and checked rather than assumed:** no secrets committed, `.env`
gitignored, `npm audit` reports **0 production vulnerabilities**, no `eval`,
no `new Function`, no `dangerouslySetInnerHTML`, **no network input anywhere in
the page** (no `fetch`, no `localStorage`, no URL parameters, no postMessage),
and the Expo app has no HTML sinks at all. SQL in the scripts uses bound
parameters, not string interpolation.

---

## 1. Path traversal in `fetch-published-data.mjs` — FIXED

**What.** The script fetched each manifest entry and wrote it with
`writeFileSync(resolve(dir, doc.file), body)`. `resolve()` collapses `..`
silently, so a manifest entry could name any path on disk.

**Proven, not assumed.** A fixture with `../../../.ssh/authorized_keys` resolved
to `C:\Cline\.ssh\authorized_keys`, and the write would have succeeded. Three of
four traversal payloads escape:

```
ESCAPES   ../../../.ssh/authorized_keys  ->  C:\Cline\.ssh\authorized_keys
ESCAPES   ../../wrangler.toml            ->  C:\Cline\ApexProject\wrangler.toml
ESCAPES   subdir/../../escape.pdf        ->  C:\Cline\ApexProject\data\escape.pdf
contained ok.pdf
```

**Why it matters even though the manifest is committed.** `manifest.json` is the
one file a contributor edits by hand when adding a source, and exactly what a
supply-chain attacker would target. A reviewer skimming 25 innocuous entries
would not notice one hostile filename. The fix makes the impossible mistake a
loud refusal:

```js
const target = resolve(dir, doc.file);
if (!target.startsWith(dir + sep)) { /* refuse, report, continue */ }
```

**Same shape in `export-d1.mjs`?** No. That script only *reads* from the path,
so traversal there is a read of an unintended file, not a write. Recorded rather
than silently ignored.

---

## 4, 5 and 6. Tailwind runtime compiler and missing CSP — FIXED

**All three are closed. `npm run security:check` reports 0 findings.**

The page loaded `https://cdn.tailwindcss.com`, a **runtime CSS compiler**: it
executed third-party JavaScript in every visitor's browser on every page load,
from a host we do not control, unpinned and with no Subresource Integrity hash.
There was also no Content-Security-Policy at all.

### Why these were sequenced the way they were

**The obvious move — add a CSP first — would have been wrong.**

A runtime CSS compiler needs to evaluate code in the browser, so any policy
written while it was present had to permit `unsafe-eval`. That produces a
header which *looks* strict while disabling the protection it appears to
provide. Adding the CSP before removing the compiler would have looked like
progress and been security theatre.

So the dependency was fixed first, and only then could a real policy be written.

**What changed:**

1. `tailwindcss@4` + `@tailwindcss/vite` installed. The build now compiles the
   stylesheet to static CSS.
2. `src/styles/main.css` is the entry: `@import "tailwindcss"` plus a `@theme`
   block declaring the `tactical-*` scale that used to be assigned to a global
   from an inline `<script>`. Same class names, so the 313 utility classes in
   `index.html` needed no change.
3. The CDN `<script>` was deleted from `src/index.html`.
4. `public/_headers` declares a strict policy — nonce-based, `strict-dynamic`,
   no `unsafe-eval`, no `unsafe-inline`.

### Side effect: previously dead CSS now works

`src/styles/theme.css` (scrollbar styling, number-input chrome) was written but
**never imported by anything**. Those rules were dead. It is now imported by
`styles/main.css`.

### Enforced, not just fixed

Three guards prevent regression, and each was **negative-tested**:

| Guard | Fails if |
|---|---|
| `vite.config.js` build step | A live `<script src=...cdn.tailwindcss.com>` returns. Prose mentions in comments are allowed. |
| `check-website-build.mjs` | `dist/_headers` is missing, has no CSP directive, or regains `unsafe-eval`. |
| `check-website-build.mjs` | `wrangler.toml` `pages_build_output_dir` does not match the real build output. Would deploy an empty directory and 404 silently. |
| `check-csp-in-browser.mjs` | Asserts the inline script actually executed in headless Chrome (not merely that page text exists), and that no CSP violation reached the console. |
| `security-check.mjs` | Any new finding of any kind appears. |

**Known remaining limitation, stated plainly:** the 4 inline `style=""`
attributes require `unsafe-hashes`. A nonce cannot apply to attributes. If those
attributes are ever removed, remove that keyword too — the gate is documented to
say so.

---

## 2 and 3. XSS in the website — FIXED by the build migration

**These were real, and they are now closed.**

The retired prototype (`archive/website-prototype/index.html`) rendered the
retailer directory and the checklist by building markup with `innerHTML` and
interpolating data fields:

```js
card.innerHTML = `... ${r.badge} ... ${r.name} ... ${r.description} ...`;
div.innerHTML  = `... ${item.title} ... ${item.desc} ...`;
<a href="${r.link}" ...>
```

Seven interpolations across two sinks, one of them in a URL context.

**Why it was High.** Every value came from a hardcoded `const` in the same file,
so it was not exploitable that day. But it was one input away from being live.
The project intends to source retailer data from a database, and the moment
`r.name` or `r.link` came from `sourcing_retailers.csv` or a scraped feed, this
was stored XSS on a site that handles affiliate links and prices. `r.link` was
the worse one: a `javascript:` URL there executes on click, and HTML-escaping
the surrounding markup does not help.

**Why it is fixed.** The hardened renderer already existed in
`apps/website/src/main.js` and was never deployed, because the page never loaded
`src/` — the build was broken. The two implementations had drifted, with `src/`
being the safer copy.

Making the site build from `src/` closed the finding as a side effect. The
deployed artefact now:

- builds nodes and sets `textContent`, so a value can never be parsed as markup;
- passes every URL through `safeUrl()`, which rejects `javascript:`, `data:` and
  `vbscript:` and allows only `http:`/`https:`;
- sets `rel="noopener noreferrer sponsored"`, severing `window.opener` and
  satisfying the FTC's endorsement guidance for paid links.

Measured on the built output: **`innerHTML` assignments 5 → 0.**

**These were real, and they are now closed.**

The retired prototype (`archive/website-prototype/index.html`) rendered the
retailer directory and the checklist by building markup with `innerHTML` and
interpolating data fields:

```js
card.innerHTML = `... ${r.badge} ... ${r.name} ... ${r.description} ...`;
div.innerHTML  = `... ${item.title} ... ${item.desc} ...`;
<a href="${r.link}" ...>
```

Seven interpolations across two sinks, one of them in a URL context.

**Why it was High.** Every value came from a hardcoded `const` in the same file,
so it was not exploitable that day. But it was one input away from being live.
The project intends to source retailer data from a database, and the moment
`r.name` or `r.link` came from `sourcing_retailers.csv` or a scraped feed, this
was stored XSS on a site that handles affiliate links and prices. `r.link` was
the worse one: a `javascript:` URL there executes on click, and HTML-escaping
the surrounding markup does not help.

**Why it is fixed.** The hardened renderer already existed in
`apps/website/src/main.js` and was never deployed, because the page never loaded
`src/` — the build was broken. The two implementations had drifted, with `src/`
being the safer copy.

Making the site build from `src/` closed the finding as a side effect. The
deployed artefact now:

- builds nodes and sets `textContent`, so a value can never be parsed as markup;
- passes every URL through `safeUrl()`, which rejects `javascript:`, `data:` and
  `vbscript:` and allows only `http:`/`https:`;
- sets `rel="noopener noreferrer sponsored"`, severing `window.opener` and
  satisfying the FTC's endorsement guidance for paid links.

Measured on the built output: **`innerHTML` assignments 5 → 0.** The three
recorded XSS findings were removed from the ratchet
(`data/handoff/known-security-findings.json` now holds 2 entries, down from 5).

**Verified difference:** the deployed file has 2 real `innerHTML` sinks and 1
`href` interpolation; `src/main.js` has **zero** — its two `innerHTML`
occurrences are comments explaining the hardening.

**Why it is not fixed here.** Fixing it means editing the shipped artefact,
which per `HANDOFF.md` and `AGENTS.md` rule 12 is a human decision recorded
through `npm run handoff:accept`. A script that rewrote the deployed page would
be doing exactly what this repository's boundary exists to prevent. **The fix is
known and small: port the `dom.js` helpers into the deployed renderer.**

---

## 4 and 5. The Tailwind CDN — reported, not fixed

```html
<script src="https://cdn.tailwindcss.com"></script>
```

Two distinct problems, which is why the checker reports them separately:

**Unpinned (no `integrity`).** Without Subresource Integrity the browser accepts
whatever that origin serves. A compromise of `cdn.tailwindcss.com`, or of
anything between it and the visitor, becomes arbitrary script execution on
`apex-amc.com` with no browser-side warning. The fix is `integrity` +
`crossorigin`, or self-hosting.

**A runtime compiler.** This is not a stylesheet. It downloads Tailwind, reads
the page, and generates CSS **in the visitor's browser** — code execution on
every page load, from a host we do not control. OWASP's third-party JavaScript
guidance treats this class as high risk precisely because the vendor gains the
ability to run code on your pages.

**Both have the same fix as the broken Vite build** documented in
`HANDOFF.md`: make the build work, compile the CSS at deploy time, self-host it.
One solution, which is why neither was fixed piecemeal.

---

## 6. No Content-Security-Policy — reported, not fixed

The page declares no CSP, so an XSS bug — including the ones above — runs
unrestricted. The target state is the strict policy actually shipped:

```
script-src 'sha256-<hash of the inline bundle>' 'strict-dynamic'; object-src 'none'; base-uri 'none'
```

**Hashes, not a nonce.** A nonce must be fresh per request and present as an
element attribute; Cloudflare Pages sends `_headers` verbatim, so it cannot do
both. Confirmed in Chrome on 1 Oct 2026: a literal `nonce-{RANDOM}` is parsed as
an invalid source, the whole source list is discarded, and every inline script is
blocked — the page rendered unstyled with a third of its content missing, while
every static check passed.

`npm run website:csp` writes the hashes from the build and `website:check` fails
if they drift.

`'strict-dynamic'` lets a trusted script load further scripts without
allowlisting the CDN by host, which is what makes such a policy compatible with
a loader. `'unsafe-inline'` must not appear: it disables the very protection the
nonce exists to provide.

Achievable without restructuring — the page has 2 inline `<script>` blocks, **0**
inline `on*=` handlers, and 5 `innerHTML` uses. Nonce the two blocks, move the
`innerHTML` uses to `textContent`, and the policy applies.

---

## What the checker does and does not do

**Does:** finds template-literal interpolation into `innerHTML`; finds
interpolation into a URL context; finds remote scripts without SRI; flags the
runtime compiler. It distinguishes a *sink* from a *vulnerability* — clearing a
container with `innerHTML = ''` is not flagged, because reporting it alongside
real injection is how a security check gets muted.

**Does not:**
- judge reachability. It reports the shape; you judge whether data can reach it.
  Findings 2 and 3 are High **because** of what the roadmap plans, not because
  the current constants are attacker-controlled.
- scan `archive/` (never built or served) or `node_modules` (not ours).
- replace `npm audit`, which currently reports 0 production vulnerabilities.
- test third-party responses. SRI is verified as *present*, not as matching.

---

## The known-findings ratchet

Findings 2–6 are recorded in `data/handoff/known-security-findings.json` and
reported as `known` rather than blocking, so `npm run verify` is not
permanently red. It is a **ratchet, not a mute button**:

- A missing baseline means *nothing* is known, so everything blocks.
- Fingerprints cover the rule and the specific message, so a
  fixed-then-reintroduced problem comes back as unknown and blocks again.
- **Verified:** a newly injected `innerHTML` sink is reported and exits 1, and
  the file was restored byte-identical afterwards.

**Do not grow that file.** A new entry is a new accepted vulnerability, and the
baseline's own `note` says so. Shrink it as findings are fixed.

---

## Priority order for fixing

1. **Findings 2 + 3** — port `dom.js`'s `el()` / `safeUrl()` into the deployed
   renderer. Smallest change, removes the most severe class.
2. **Findings 4 + 5 together** — fix the Vite build (`HANDOFF.md`), compile
   Tailwind at deploy time, self-host, drop the CDN script.
3. **Finding 6** — add the nonce-based CSP, once 2 is done so the nonce list is
   small and correct.
4. Shrink `known-security-findings.json` as each is cleared, so it trends toward
   empty and the ratchet tightens on its own.

---

## Rules that keep it this way

1. **No new `innerHTML` with interpolation.** Use `el()` from
   `apps/website/src/dom.js`, or `textContent`. `security:check` enforces this.
2. **Every URL goes through `safeUrl()`.** A `javascript:` URL is script
   execution on click and no amount of HTML-escaping prevents it.
3. **No remote script without `integrity` + `crossorigin`.** Prefer self-hosting.
4. **Never commit a secret.** `.env` is gitignored; `CLOUDFLARE_API_TOKEN` lives
   there and nowhere else.
5. **The deployed artefact is not edited by a script.** See `HANDOFF.md`.
