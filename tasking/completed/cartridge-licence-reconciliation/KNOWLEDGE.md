# KNOWLEDGE — durable findings

Task `cartridge-licence-reconciliation`. Written so no third agent repeats this.

---

## 1. "Free to download" does NOT mean "free to reproduce"

The single most expensive misunderstanding in this repo's recent history, and I
made it. It cost two tasks and a contradiction.

CIP TDCC per-cartridge sheets are **free to download** and carry:

> "Reproduction forbidden as well as in the form of extracts without approval of
> C.I.P."

Both are true simultaneously. A price at the download says nothing about rights
in the content. **Never infer permission from the absence of a purchase button.**

**Where the notice is:** inside the per-cartridge PDFs, **not** on the index page.
You have to open a sheet to see it.

## 2. Two agents independently got this wrong, in the same direction

T4 (`cartridge-dimensions`) and I (`ammoseek-coverage`) both concluded CIP was
freely usable, by different routes. Both of us then **undercounted the
restriction** while trying to measure it:

- **Kerning breaks literal search.** The notice extracts as
  `Reproduc tion forbidden as w e ll as in the form of ex trac ts`.
  `includes('Reproduction')` returns **false on a sheet that carries it**.
- **Joining extracted fragments with a space re-breaks the word** (T4's second
  pass). Concatenate with **no** separator.
- **Letter-ratio readability tests fail on kerned text.** Kerned page copy can have
  a *lower* letter ratio than a binary font blob, so "no text layer" gets reported
  for sheets that have one. My second bug. Use a **dictionary-word** test.

Every error in this family points the same way: **toward underestimating the
restriction.** Assume your tooling is wrong in the permissive direction until the
text is in front of you.

## 3. Unreadable is not unrestricted

My 11-sheet survey: **6 notice present, 5 undetermined, 0 readable-without-notice.**

The 5 undetermined sheets have no recoverable text layer. They are **not cleared**,
and must never be recorded as "no restriction found". Report them as
`undetermined` and take the conservative verdict.

## 4. The URL pattern is `tab-i`, not `tab-1`

Real sheet URLs: `https://bobp.cip-bobp.org/uploads/tdcc/tab-i/<designation>-en.pdf`
— **Roman numerals.** `tab-1` 404s. Get filenames from the index link list; do
not guess them. T4's provenance log records the wrong pattern.

## 5. Two stacked gaps — only one is a permissions problem

| Gap | Size | Fixed by a CIP ruling? |
|---|---|---|
| **Permission** | ~11 of 229 have a CIP sheet | Yes |
| **Coverage** | ~218 of 229 have no free source | **No** |

A favourable CIP answer still leaves most of the dataset unsourced. **Do not let
the licence question be read as the whole blocker.**

## 6. Ask this question first — it is one email

> Does transcribing a *single dimension value*, cited to its source sheet, without
> reproducing the sheet layout or its tolerance tables, constitute reproduction
> "in the form of extracts"?

A "yes it is fine" makes a citation layer legal at zero cost and unblocks the
dataset. A "no" converts it to a purchase decision. **This single answer decides
the shape of the next task**, so it is worth sending before any engineering.

## 7. Two corrections to completed tasks

- **T4 `01-source-survey.md` §5** claims we hold no 9mm and no .22LR. **We hold
  both** (`9 Luger`, `.22 LR`, both under `rifle.csv`). 5.56 is genuinely absent.
- **T4's `cartridge_dimensions_filled.csv`** stamps the CIP blocker on all **229**
  rows, including the ~218 with no CIP sheet. Real, but over-applied — the column
  currently implies a restriction where the only fact is absence of a source.

## 8. Standing rule for this repo

> **Never state a licence conclusion from an absence of evidence, and never
> resolve an ambiguity by picking the convenient reading.** Where the published
> terms do not settle a question, the correct output is the *question*, drafted
> precisely enough that whoever asks it gets a usable answer — not a verdict.

The `regulations.csv` AmmoSeek row is the model for this: a competitor's
disclaimer recorded as an *internal method rule*, not as a legal conclusion.