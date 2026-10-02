# Reference / verification data

This directory holds **external data we check ourselves against.** It is not
application content and is not served to users. It exists so that a wrong number
in our code can be caught by something we did not write.

Read `docs/ORACLE-SOURCES.md` for the survey and reasoning behind each source.

## What makes a row an oracle

Three properties. A row missing any of them cannot serve as an oracle, however
correct it is:

1. **Stated test conditions** — barrel length, temperature, pressure, altitude.
   Data without conditions cannot be checked, only admired.
2. **Stated uncertainty** — an SD, an ES, or an explicit tolerance. A number with
   no error bar can never fail a comparison.
3. **Independent derivation** — not produced by our own code or assumptions.

Most reloading content fails all three. That is why this directory is small and
selective rather than a mirror of everything we could scrape.

## Files

| File | Rows | What it verifies |
|---|---|---|
| `drag_tables.csv` | 730 | Drag coefficients for 9 models (G1, G2, G5, G6, G7, G8, GI, GS, RA4), Mach 0–5 |
| `measured_data.csv` | 7 | Measured muzzle velocities and a 20-round chronograph string |
| `bullet_reference.csv` | 8 | Ballistic coefficients for competition bullets |

## Provenance of `drag_tables.csv`

Values traced to **McCoy, *Modern Exterior Ballistics* (2012)** and verified
against **three independent implementations**:

| Source | Role |
|---|---|
| McCoy 2012, via Tireur Table 5.2 | The citation of record |
| `js-ballistics` (ISC, npm) | Independent implementation |
| `py_ballistics` `drag_tables.py` | Second independent implementation |

All three agree **exactly** at all 15 comparable Mach points. Recorded as
`verification = cross-source-3-way`.

This is the data that exposed our original G7 table, which had no transonic
region at all — see `docs/BALLISTICS-AUDIT.md` section 0.

## Rules for adding rows here

- Never derive a value from our own solver and store it here. That would make
  the oracle circular and it would agree with us by construction.
- If a row is an *envelope* rather than a measurement (a load-data range, for
  example), say so in `notes`. Envelopes are not oracle rows.
- Record the source table and edition. An uncited row is not an oracle row.
- If a source disagrees with another, record both and mark it unresolved. Do
  not average.

## Relationship to the provenance tiers

These rows are external evidence, so they are `published` in the ordinary sense
— but `cross-source-3-way` is a *stronger* claim than reading a book, because it
means independent implementations converged. Where the two apply, prefer the
converged value and record why.