# 01 — Unknown-state specification

**Task:** `unknown-state-design`. **A specification, not an implementation.** Per the brief, no
file in `apps/website/` was edited; a human implements this.

---

## 1. The problem, measured rather than asserted

The brief and `ui-research` both say "six dimensional columns are 0/229 populated." I measured
it (`tmp/unknown/tally.mjs`) rather than restating it:

```
total cartridge rows: 229

column                populated   share
bullet_dia_in               0/229     0.0%
case_length_max_in          0/229     0.0%
max_col_in                  0/229     0.0%
saami_max_psi              98/229    42.8%
saami_max_cup              82/229    35.8%
cip_max_bar                 0/229     0.0%
rim_dia_in                  0/229     0.0%
head_dia_in                 0/229     0.0%
```

**229 confirmed. Six columns at exactly 0/229 confirmed.**

**But the measurement changes the finding, and this matters more than the headline.** Two
columns are *partially* populated:

- `saami_max_psi`: 98/229 — **16 rows have it, 131 do not**
- `saami_max_cup`: 82/229

**So the product's dominant state is not "always empty." It is mixed, and it varies by row
within the same table and the same column.** A design that handles only the fully-empty case
will render `0` for 131 real rows in a column where 16 rows have a real number. That is a
worse failure than a uniformly empty column, because the eye sees a plausible number beside a
blank one and infers the blank means zero.

`shotgun.csv` (1 row) has **every** dimensional column empty — so even within one product, a
single-row table is uniformly unknown while the 212-row table is mixed.

## 2. Four absences, and one marker collapses them wrongly

The brief names four. All four occur **in this repo, today**:

| # | Absence | Occurs where | Why it is not the others |
|---|---|---|---|
| **1** | **Not recorded** | `bullet_dia_in` 0/229; `saami_max_psi` missing on 131 rows | We looked and it is absent from the source we hold |
| **2** | **Not applicable** | `rim_dia_in` for a rimless bottleneck rifle cartridge | The concept does not exist for this row — not missing data |
| **3** | **Unknown to us** | A dimension published by an industry body we have not obtained | It exists; we simply do not have it |
| **4** | **Restricted by licence** | **`cip_max_bar`, 0/229** | It exists and is published — we are forbidden to use it |

**Type 4 is real, and it is documented.** From
`tasking/completed/cartridge-dimensions/01-source-survey.md`:

> CIP publishes a public, free, per-cartridge dimension table (TDCC)… **Forbidden without
> written approval.**
## 3. The vocabulary

### The em-dash is ruled out, and the reason is worth stating precisely

`—` fails because it is **typographically a character in a numeric column**, and readers scan
numeric columns by shape. A short horizontal mark among digits reads as a dash in a number, a
separator, or a zero that failed to print. It carries no word, so it cannot be read aloud, and
it cannot be made to differ from the other three absences.

**Requirement: every unknown slot carries a word.** Not a glyph, not a tooltip — a word.

### Proposed vocabulary

| State | In-table token | Plain-language | Full text on hover/tap |
|---|---|---|---|
| **1. Not recorded** | `Not recorded` | *Not recorded* | We have not recorded a value for this cartridge. |
| **2. Not applicable** | `Not applicable` | *N/A* | This dimension does not apply to this cartridge type. |
| **3. Unknown to us** | `Not in our data` | *Not in our data* | This value is published, but we have not obtained it. |
| **4. Restricted** | `Restricted` | *Restricted* | The publisher's licence does not permit us to reproduce this value. [link] |

**Why these and not others:**

- **"Not recorded" not "Unknown".** "Unknown" conflates types 1 and 3 — precisely the collapse
  the brief warns about. "Not recorded" is precisely what type 1 is: a statement about our
  records, which we can be held to.
- **"Not applicable" is the only one that can be abbreviated**, because the concept is
  unambiguous and short. In a dense dimensional table, `N/A` saves real width. **In prose it
  must be written out** — an unexplained abbreviation is exactly the em-dash failure again.
- **"Not in our data" is deliberately awkward.** It names the *holder* of the gap, not the
  world. A user reading "Unknown" wonders what is wrong with the cartridge; a user reading
  "Not in our data" learns something about the product's coverage, which is actionable —
  they know the value exists and the product lacks it.
- **"Restricted" is honest about a choice we made.** It is uncomfortable to render, because it
  admits a limit we imposed. **That discomfort is the correct signal**, and it is the only
  token that stops `cip_max_bar` reading as a gap in the public record.

### Rules

1. **Never render an unknown as a number, an em-dash, a blank cell, `0`, `N/A`, `?`, `--`, or
   `null`.** All of these read as zero or as a formatting failure.
2. **Never use colour alone.** If unknown states are ever colour-coded, they must also differ
   in text. Colour-only fails WCAG 1.4.1 and fails print and greyscale.
3. **Never abbreviate in prose.** `N/A` is table-only.
4. **Every unknown is reachable as full text**, not hover-only — no hover on touch devices.
5. **The table cell shows the short token; the detail surface shows the full sentence.** The
   full sentence is the accessible name.

## 4. What the data layer must supply

**The UI cannot infer any of this.** The four states are properties of *why* a cell is empty,
and a CSV cell carries only that it is empty. **A blank cell carries three bits, not four
states.**

Required: each dimensional column must be able to return, per row, **a value or a state token**
— never an empty string. The loader must stop writing `""` for these columns.

**Consequence to flag:** this is a change to the seed CSV contract and the loader, not a UI
change. **It cannot be done in `apps/website/`**, and the brief forbids editing the app — so
this specification cannot be fully implemented by the person who implements the UI. **That is
the blocking dependency, and it is called out in `REPORT.md`.**

## 5. Contextual behaviour — where the state changes what is shown

### Inline (table cell)

Short token, muted colour, `tabular-nums` so column width stays stable as tokens differ in
length. **The token is text, not a dash, and not a blank.**

### On selection / detail surface

Full sentence, plus the reason where the reason is ours:

| State | Full text |
|---|---|
| Not recorded | "We have not recorded a value for this cartridge." |
| Not applicable | "This dimension does not apply to this cartridge type." |
| Not in our data | "This value is published, but we have not obtained it." |
| Restricted | "The publisher's licence does not permit us to reproduce this value." + source link |

### Aggregates — **the rule that prevents a wrong number**

**Any statistic computed over a column must state how many values it used.** If
## 6. The related defect, specified

From `ui-research/KNOWLEDGE.md` §6: `emerald-500` marks both interactive elements and positive
results, so "this is good news" and "click me" cannot be told apart.

**Specified, adjacent to this work because both are vocabulary problems:**

| Token | Job | Rule |
|---|---|---|
| Accent A | **Action** — buttons, links, focusable controls | Never used for status |
| Accent B | **Status** — good/warning/error/unknown states | Never used for action |

**Unknown states must use Accent B, never Accent A.** An unknown rendered in the action colour
would invite the reader to click a value that does not exist. **And unknown states must differ
from each other by text**, because four states in one colour is not a vocabulary.

The mockups' `_tokens.css` already defines `--text-mute` and a `.empty` block (lines 136-138) —
**it has partially solved this and was never ported.** Check the tokens file before designing
new ones; `ui-research` §2 makes the same point about `tabular-nums`.

## 7. What must NOT be built

- **No single "—" or "Unknown" for all four states.** Collapses a licence restriction into a
  data gap, which is a false statement about a third party's work.
- **No tooltip-only explanation.** No hover on touch; the full sentence must be reachable.
- **No colour-only distinction.** Fails WCAG 1.4.1 and fails greyscale print.
- **No aggregate that hides its coverage.** "Across all cartridges" is false whenever any
  value is missing, restricted, or unknown-to-us.
- **No empty-string sentinel in the data layer.** `""` is the thing that made this invisible.
- **Do not design the populated-data presentation yet.** The brief forbids it and the ordering
  is the finding.
`saami_max_psi` is 98/229, then a chart or a max over that column reads:

> "Maximum SAAMI pressure across **98 of 229** cartridges with a recorded value."

**Never** "Maximum SAAMI pressure across all cartridges." The second is a false claim about
coverage, and it is invisible to every test that checks for rendering failures — the exact
failure mode this task exists to prevent.

**A maximum over a column with an unknown state is not a maximum.** If type 3 or type 4 applies
to any row, the true maximum may be higher than the computed one, and the UI must say so.
Minimum and mean are worse still — a mean over 98 of 229 is a mean of a **biased subset**,
because which cartridges have SAAMI data is not random.

Every sampled CIP sheet carries the notice, and the site footer reads "© C.I.P - All rights
reserved."

**So `cip_max_bar` being 0/229 is a decision, recorded, by us.** It is not a gap in the data,
not a value we failed to find, and not a concept that does not apply. Rendering it as "Not
recorded" would be **actively false** — it asserts we looked in a source and found nothing,
when in fact we have a source and are not permitted to copy it.

**This is the single strongest argument for four states instead of one.** Three of them are
distinguishable only by information the data layer has and the UI does not.