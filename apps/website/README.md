# apps/website

The public site, apex-amc.com. Static, deployed to Cloudflare Pages.

## The build

```bash
npm run website:build      # src/ -> dist/index.html (one self-contained file)
npm run website:check      # gate: one file, no fetch(), no data/ reach-in
npm run website:dev        # wrangler pages dev
```

`npm run website:build` is run from the repo root. From here, `npm run build`.

## Layout

| Path | What it is |
|---|---|
| `src/index.html` | The Vite entry. All page markup. |
| `src/main.js` | Entry module: imports the datasets, wires the UI. |
| `src/dom.js` | Safe DOM helpers: `el`, `icon`, `safeUrl`, `externalLink`. |
| `src/data/` | The page's datasets (`calibers`, `retailers`, `checklist`). |
| `src/styles/` | Theme CSS. |
| `src/tailwind.config.js` | The `tactical-*` colour scale, as a named export. |
| `vite.config.js` | Build config, including the asset-inlining step. |
| `dist/index.html` | **The deployed artefact.** Generated; never hand-edited. |

## Two rules

1. **`dist/index.html` is generated.** Edit `src/`, never `dist/`. The handoff
   gate records its SHA-256, so a hand-edit fails `npm run verify` until it is
   explicitly accepted with `npm run handoff:accept`.

2. **The output must stay self-contained.** One file, no separate `.js`/`.css`,
   and no runtime `fetch()` of anything under `data/`. `vite.config.js` inlines
   the bundle for exactly this reason. `npm run website:check` enforces it and
   fails if `dist/` grows a second file or the page starts fetching data.

Both are described in `HANDOFF.md`.

## History

This directory previously held a 66 KB hand-maintained `index.html` that
nothing built. `apps/website/src/` existed but was never loaded by it, so the
modules there were dead code. That prototype is kept for reference at
`archive/website-prototype/index.html` and is no longer authoritative.