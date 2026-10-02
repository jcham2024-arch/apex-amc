# data/research

Curated analysis that is **not** seed data.

## Why this directory exists

Until 2026-10-01 this content lived in `data/incoming/`, which `.gitignore`
excludes as research staging. That was fine for CSVs on their way to becoming
seeds, and wrong for two committed documents:

- `powders.md` was the accuracy doctrine - the rules the harvesting agents
  follow - and it was referenced from six tracked places, none of which a fresh
  clone could read.
- The burn-rate cross-brand review is the evidence behind the decision that
  powder burn-rate positions are not comparable across manufacturers.

A document that changes what gets loaded must not be inside a directory nothing
tracks. These are now committed.

## Contents

| File | What it is |
|---|---|
| `POWDER-ACCURACY-DOCTRINE.md` | The rules for transcribing manufacturer data. **Read this before adding a powder or a pressure figure.** |
| `powder_burn_rate/crossbrand_review.csv` | Side-by-side burn-rate chart comparison across brands, and the analysis that shows why positions cannot be merged into one scale. |

## The one rule from the doctrine

> No invented values - leave the cell EMPTY.

A blank means "not known yet". It never means zero, and it is never filled with
a plausible guess. This is what makes the manifests in `../schemas/` honest: an
absent column value is a visible gap rather than a silent fabrication.

For pressure data specifically, a guess is not merely wrong but dangerous, so
`value_provenance.csv` records a `tier` for every non-blank value -
`published`, `derived`, `estimated` or `assumed`. Two compilations agreeing is
`derived`, not `published`: agreement between compilations is strong evidence,
but it is not the standard.

## Not loaded by anything

Nothing in this directory is read by the loader. It is documentation and
evidence, and `npm run test:encoding` asserts that no manifest points at
anything under it.