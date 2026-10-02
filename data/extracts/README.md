# data/extracts/

Verbatim extracts pulled out of the documents in `data/published/`.

These exist so a derived number can be re-checked against the manufacturer's own
words without re-downloading and re-parsing a multi-megabyte PDF. They are
**raw**: copied, not normalised, not corrected, not reformatted.

| File | Extracted from | What it is |
|---|---|---|
| `berger-reference-charts.html` | Berger's bullet reference chart page | The full HTML source of the chart, fetched with compression and kept whole. |
| `hornady-bc.txt` | Hornady's published BC table | The ballistic-coefficient table as plain text. |

## Why raw HTML rather than a cleaned table

`berger-reference-charts.html` is kept as HTML on purpose. Berger's reference
charts are six mutually incompatible page layouts depending on which family the
bullet belongs to, and each has its own column order and units. A cleaned table
would hide which layout a given row came from, which is exactly the information
needed to tell a genuine 6.5 mm row from a 7 mm one whose cells are shifted by
one.

`scripts/shared/bullet-sources.mjs` parses it by locating the `<th>`/`<td>` header
row and reading column meaning from the labels, rather than by fixed column
positions. `npm run test:bullets` covers all six layouts plus the invariants
that catch a shifted read.

## Rules

- **Never hand-edit an extract.** If one is wrong, the extraction is wrong; fix
  the extractor and regenerate.
- **Cite the extract.** A row in `data/seeds/` should be traceable to a line
  here, and this file to a document in `data/published/manifest.json`.
- **Do not fill gaps.** Two Berger rows (24407, 30417) carry no usable grain
  weight. They are documented parser skips, not rows with a guessed weight.