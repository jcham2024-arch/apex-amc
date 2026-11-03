# KNOWLEDGE — designing the unknown state

**Task:** `unknown-state-design`. **Start here.** Spec in `01-`, surfaces in `02-`.

---

## The one thing

> **A numbers product's most important design decision is how it renders "we do not know."**
> A blank cell reads as `0`, and that is a silent data error invisible to every test that
> checks for rendering failures.

**The bug is not hypothetical — it is already live.** `main.js` contains **7** occurrences of:

```js
const facPrice = parseFloat(factoryBoxPrice.value) || 0;
```

An empty price field becomes `0`, renders as **`$0.000`**, and the break-even field renders
**"0 rounds"** — which means *equipment costs nothing* rather than *we do not know*.
**Every cost input uses `|| 0`.**

## The finding that changed the task

The brief says six dimensional columns are 0/229. **True — but incomplete, and the incomplete
part matters more:**

```
saami_max_psi    98/229   42.8%
saami_max_cup    82/229   35.8%
bullet_dia_in     0/229
```

**The dominant state is mixed, not empty.** A design handling only the fully-empty case renders
`0` for 131 rows in a column where 16 rows have a real number — and a plausible number beside a
blank is *more* misleading than a uniformly blank column, because the eye infers the blank means
zero. `shotgun.csv` (1 row) is fully empty; `rifle.csv` (212) is mixed. **Both cases ship.**

## The four absences — and the one that justifies them

All four occur in this repo today:

| State | Here |
|---|---|
| Not recorded | `bullet_dia_in` 0/229 |
| Not applicable | rimless cartridges have no rim diameter |
| Not in our data | a published dimension we have not obtained |
| **Restricted** | **`cip_max_bar` 0/229 — CIP forbids reproduction without written approval** |

**The fourth is the strongest argument.** Rendering `cip_max_bar` as "Not recorded" is
**actively false**: it claims we searched a source and found nothing, when we have the source
and are not permitted to copy it. **One marker cannot honestly describe that.**

## The vocabulary

**An em-dash is ruled out** — it is a glyph in a numeric column, reads as zero or a separator,
and cannot be read aloud.

| State | Table token |
|---|---|
| Not recorded | `Not recorded` |
| Not applicable | `Not applicable` / *N/A* in prose |
| Not in our data | `Not in our data` |
| Restricted | `Restricted` |

**"Not recorded", not "Unknown"** — "unknown" collapses states 1 and 3, which is the exact
failure being designed against.

## The rule that prevents a wrong *number*

> **Any statistic over a column must state how many values it used.** "Maximum SAAMI pressure
> across **98 of 229** cartridges with a recorded value." Never "across all cartridges."

**A maximum over a column containing unknowns is not a maximum.** A mean over 98 of 229 is a
mean of a **biased subset** — which cartridges have SAAMI data is not random.

## The blocking dependency

**The UI cannot implement this alone.** A CSV cell carries only that it is empty — **three
bits, not four states.** The data layer must stop writing `""` for dimensional columns and
return a state token instead. **That is a loader/CSV-contract change, outside the UI write-set,
so this spec cannot be fully implemented by whoever implements the UI.** Flagged, not silently
assumed.

## Ordering

`ui-research` §2: `docs/mockups/_tokens.css` **already defines** `--text-mute` and a `.empty`
block (lines 136–138), and it was never ported. **Check the tokens file before designing new
ones.** The same applies to `tabular-nums`.

## One accent doing two jobs

`emerald-500` marks both interactive elements and positive results. **Split it: one accent for
action, one for status, never the same token.** Unknown states must use the *status* accent —
an unknown in the action colour invites a reader to click a value that does not exist.