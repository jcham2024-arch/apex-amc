---
proposal: no-zero-defaults
title: Remove the || 0 default that makes an unknown price render as $0.000
derived_from: tasking/completed/unknown-state-design/02-surface-inventory.md
evidence: "**This is the exact failure the brief describes, already shipped.** Not a missing
  design; a live component that converts an unknown into a false number a shooter is invited to
  act on. And it is **invisible to every rendering test**, because `$0.000` renders perfectly.
  ... `roundsToBreakEven = savingsPerRound > 0 ? Math.ceil(equipCost / savingsPerRound) : 0;`
  …which renders a confident **\"0 rounds to break even\"** — meaning *equipment costs nothing*
  — when it actually means *we do not know*."
shape: change
priority: high
write_set:
  - apps/website/src/main.js
required_outputs:
  - REPORT.md
---

# Proposal: remove the `|| 0` default in the cost calculator

## Why `shape: change`

It edits `apps/website/src/main.js` — the shipped application. `.clinerules` §12 reserves that
for a human. **The finding is worse than the fix being routine, so it is escalated rather than
filed as research.**

## The defect, in one line

`parseFloat(input.value) || 0` turns "the user did not tell me" into "the price is zero", and
the result is then formatted as money.

## The worst surface is not the price — it is the break-even

```js
const roundsToBreakEven = savingsPerRound > 0 ? Math.ceil(equipCost / savingsPerRound) : 0;
```

**"0 rounds to break even"** is the single most misleading string the site can emit. A shooter
reading it concludes equipment is free. **It means the opposite: the inputs are incomplete.**
`ui-research/KNOWLEDGE.md` §7 records that a disclosure the reader must scroll back to find is
not a disclosure; this is the same failure in the output direction.

## Required fix

1. **Distinguish three cases**, not two. `parseFloat` returns `NaN` for an empty field, and a
   malformed field also yields `NaN` — but "blank" and "typed nonsense" are different errors
   and should not share a fallback.
2. **Represent an unsupplied price as a state, not a number.** Reuse the vocabulary in
   `unknown-state-design/01-unknown-state-spec.md`; for user-entered prices only two states
   exist (known / not supplied).
3. **Do not compute a derived figure until all its inputs are known.** Percent savings, batch
   savings, kilo savings, and break-even must render *not calculated*, not `0`.
4. **Never render a zero-width cost bar as a real value.** A missing component is a gap in the
   bar, distinct from a genuine `$0.00`.
5. **Keep `tabular-nums`** — already in `docs/mockups/_tokens.css` line 17, never ported.

## Scope discipline

**This proposal does not implement the four-state data vocabulary.** That needs a loader change
(`unknown-state-design/01-unknown-state-spec.md` §4) and is a larger piece of work. **This fix is
only about not lying about numbers the user has not supplied**, and it can land independently.

## Verification to require before merge

**A negative test, not a rendering test.** The observable:

- Input nothing → break-even shows *not calculated*, **not** "0"
- Input prices but **not** equipment cost → percent savings shows *not calculated*
- Input a genuine `$0.00` price → still renders `$0.000` (zero is a real price and must survive)

The third case is the one that stops a naive fix: an over-correction that treats every zero as
missing would break a legitimately free component. **A fix that only tests the first two cases
has not been tested.**

## Note for the reviewer

This was found while writing a specification that was explicitly told **not** to edit `apps/`.
The brief anticipated a dimensional table that does not yet exist, and the defect that actually
ships is in the cost calculator. **I reported it rather than fixing it**, which is the correct
boundary — but it is the most urgent item in that task's REPORT.md and should not sit in a
completed folder for long.