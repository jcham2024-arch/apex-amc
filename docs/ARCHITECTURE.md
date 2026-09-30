# Architecture

## Two products, one domain

**Website** (`apps/website`) — the primary deliverable and the revenue
driver. Static-first, deployed free to Cloudflare Pages. Affiliate
commission only; Google AdSense will not serve ammunition pages.

**Field app** (`apps/ballistics`) — Expo SDK 57, offline. This is what
brings people to the website, and it has to work on a phone at a range
with no signal, which is why it is a native app and not a web page.

They are separate deliverables but must not have separate physics. Both
import `packages/ballistics-core`.

```
apps/website  ──┐
                ├──> packages/ballistics-core  (pure, tested)
apps/ballistics ┘
```

## Why the domain package exists

Every calculation the previous version performed lived inside a React
component's render body. That makes it untestable, unmockable, and
duplicated the moment a second surface needs it — which is exactly what
happened, since the website and the app computed drop and CEP separately
and differently.

`ballistics-core` is plain ES modules with no framework imports, so the
same code runs in a browser, in React Native, and under `node --test`.

## Module split

**Reloading** — published load data, barrel-length velocity scaling
(Homann/Fraser), COAL seating-depth warnings, ladder generation.
This is the differentiated feature and the reason the site exists.

**Shooting** — DOPE cards, wind/drift, dispersion statistics (CEP, MOA),
transonic stability. Useful, and widely available elsewhere; it is what
draws people in, not what differentiates.

The separation matters because the two have different correctness bars.
Reloading data is safety-critical: a wrong charge weight injures people,
so it is transcribed from published manuals and always attributed.
Shooting math is advisory: an approximate DOPE card is a convenience, so it
is computed live and clearly labelled as an estimate.

## Free-tier infrastructure

| Concern | Choice | Why |
|---|---|---|
| Static hosting | Cloudflare Pages | free, CDN, no cold start |
| Database | Cloudflare D1 | 5 GB free, **never pauses** |
| Build | Vite | small, fast, no framework tax |
| API | Pages Functions | same vendor as D1 and Pages |

D1 over Supabase specifically because Supabase's free tier **pauses after
one week of inactivity** — unacceptable for a price-history database, and
500 MB is tight for a full ammunition + load-data catalog.

## Current state

The website is a single 985-line HTML file (`apps/website/index.html`)
containing markup, CSS, datasets, and logic together. It is functional
and deployed nowhere yet. `apps/website/src/` holds the content already
extracted into modules (`styles/theme.css`, `data/calibers.js`,
`data/retailers.js`, `data/checklist.js`, `main.js`) so it can be split
and built properly rather than retyped.

Note: an earlier draft rewrote this site in React with Babel compiled
*in the browser*. That was a regression — smaller, slower, needed an
in-browser compiler in production, and dropped the guides section. It is
in `archive/gemini/index.react-cdn-rejected.html` for reference only.
Do not build on it.
