# Generated data

**Everything in this directory is generated. Do not edit it.**

Regenerate with:

```bash
npm run data:build        # validate the CSVs, then rewrite this directory
npm run data:validate     # validate only, write nothing (used by CI)
```

An edit made here is lost on the next build, silently. There is no merge, no
conflict prompt, no warning — from the generator's point of view the file was
always going to be replaced.

To change data, edit the **CSV** it names under `source`, then rebuild.

---

## The four representations, and when each is the right one

| Artefact | Hand-edited? | Use it for | Do NOT use it for |
|---|---|---|---|
| **CSV** in `data/seeds/` | **YES — this is the database** | The authoritative record. Bulk paste from a manufacturer site. Small, targeted diffs. | Anything that needs types; a blank and a zero look the same. |
| **YAML** in `data/schemas/` | **YES — column contract** | Defining what a column means and what it may contain. | Storing data. |
| **JSON** in `data/generated/json/` | no | Application code, API responses, anything that needs real types. | Hand-editing. Reading by eye. |
| **Markdown** in `data/generated/md/` | no | Reading and reviewing. PR descriptions, docs, quick reference. | Machine parsing. |

### CSV — the primary database

`data/seeds/bullets/sierra.csv` and friends. This is the source of truth and the
only thing you edit to change data.

**Use CSV when:**
- you are adding or correcting data (this is the only writable form)
- you are pasting a table off a manufacturer's site
- you want a diff that shows exactly which field changed on which row
- you are reviewing someone else's change

**CSV is deliberately not used for:**
- reading the whole dataset — see below
- anything that needs to distinguish a blank from a zero, a string from a number

A JSONL edit rewrites the whole line, so a reviewer's diff stops showing *which
field* moved. For a project whose entire premise is traceability of every value,
that loss is not worth the type benefit everywhere.

### JSON — for machines

`data/generated/json/*.json`. Same data, with real types, and the column
contract inlined so a consumer never has to find the YAML:

```json
{
  "part_number": "6516",     // string - leading zeros survive
  "weight_gr": 140,          // number, not "140"
  "bc_g7": null,             // not "" - blank means "not known yet"
  "_source": "data/seeds/bullets/berger.csv",
  "_line": 2
}
```

**Use JSON when:**
- writing application code, especially TypeScript
- serving an API — no coercion, no guessing
- you need a blank to be distinguishable from a zero or an empty string
- a tool wants a single file rather than a directory of CSVs

**Do not use JSON when:**
- you are editing data (edit the CSV; JSON is overwritten)
- you are reviewing a change in a diff (whole-line rewrites hide field-level edits)
- you are reading it by eye (it is verbose and repetitive)

Identifiers stay strings on purpose. `part_number` `6516` is a string, not a
number, so a leading zero survives — and the component finder joins on it
against retailer SKUs.

### Markdown — for people

`data/generated/md/*.md`. A summary, the column contract in prose, coverage by
manufacturer, and a readable sample of rows.

**Use Markdown when:**
- reading the data, or writing about it
- a PR description needs to show what the data looks like
- someone outside the codebase needs to understand a field
- you want the "what does this column actually mean" answer inline

**Do not use Markdown when:**
- you need every row (only a sample is rendered — 169 rows in a table is unreadable)
- you are parsing it
- you need types

It is not a data format. It is a reading of the data.

### YAML — the column contract

`data/schemas/*.yaml`. Hand-written, and the second of the two writable inputs.

This exists because of a real failure. On 2026-10-01, **7 of 11 bullet rows were
being silently dropped** — a `manufacturer_slug` with the wrong case, a
one-column shift, and a design name (`very_low_drift`) sitting in `tip_type`.
The `bullets` table had CHECK constraints for all of it, but the loader used
`INSERT OR IGNORE`, which skips a violating row *without a word*. A shooter
searching for a Hornady ELD-X got an empty result set, not an error.

The rules lived in a SQL file three directories from the data. Now they live
next to it:

```yaml
tip_type:
  enum: [round_nose, spitzer, soft_point, hollow_point, hpbt, ...]
  note: >
    NOT a design name: "very low drift" belongs in product_line.
    Leave it BLANK rather than guess - a blank is a visible gap,
    a wrong value is a silent lie.
```

Adding `data/seeds/bullets/rmr.csv` now requires **no other edit** and gets
every rule applied automatically.

---

## Adding a dataset

1. Create the CSV(s) under `data/seeds/<type>/`, one file per manufacturer.
2. Create `data/schemas/<type>.yaml` describing every column.
3. Run `npm run data:build`.

The generator picks it up automatically. There is no registry to update.

## Changing a column

The manifest is the only place a column's rules live. Edit
`data/schemas/<type>.yaml`, then `npm run data:build`. The CSV header must match
the manifest's column names — a typo in either is reported by name rather than
silently shifting every value after it.
