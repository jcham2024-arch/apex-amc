# Knowledge — things worth not rediscovering

Task `ui-research` (T8). A record of what was learned while doing this, including
the parts that went wrong. Written for the next agent, not for the reviewer.

---

## 1. The finding that generalises

**A numbers product's most important design decision is how it renders
"we do not know."**

This project's dominant data state is *absent*: six dimensional columns are 0/229
populated. A design that has no vocabulary for absence renders a blank cell, and a
blank cell is read as `0`. **That is a silent data error**, and it is invisible to
every test that checks for rendering failures.

The rule that follows: **design the unknown state before the known one.** If a layout
cannot say "not recorded", it is not finished, no matter how good it looks with a
full dataset.

Corollary, specific to this repo: **an em-dash is not an adequate unknown marker.**
`—` reads as zero to anyone scanning a column. The slot must carry a word.

## 2. `tabular-nums` is not a nicety on a live figure

Proportional digits mean a `1` is narrower than a `0`. When `$0.193` becomes
`$0.418`, every digit right of the change shifts sideways, so **the number appears to
move while you are typing.** For a cost-per-round figure that a shooter is about to
act on, it reads as instability. `font-variant-numeric: tabular-nums` costs one line
and fixes it.

**Note:** `docs/mockups/_tokens.css` already had this (line 17). It was never ported
to the live site. **Check the mockups before solving a problem — they may already have
solved it.**

## 3. CSP constraints shape design, they do not only restrict it

"This site is one self-contained HTML file under a strict CSP" sounds purely like a
limitation. In practice it forced better decisions:

- **No icon font** → glyphs became CSS `content` characters, which are lighter and
  survive a monochrome print.
- **No `style=` attribute** → every one-off layout value became a named class, which
  made the stylesheet more coherent, not less.
- **Two remote style hosts only** → a small deliberate palette, which is easier to
  keep colourblind-safe than a large one.

## 4. The negative test that earned its keep

The brief's CSP grep found **19 violations in my own first draft** — inline
`style=` attributes I had written while styling quickly. I believed I had avoided
them. I had not.

**A check that passes on the artefact you were checking from someone else may fail on
the one you just made.** Run the gate on your own output, every time, even when you
are confident — especially when you are confident.

The same pattern as `AGENTS.md`'s CSP browser check, which once asserted on a string
present in the static markup and therefore passed against a policy that blocked
everything.

## 5. Proportional vs tabular, measured

| Digits | Proportional width | Effect in a column |
|---|---|---|
| `0.193` → `0.418` | `1` narrower than `0` | Left edge of every later digit shifts |
| `11.11` → `88.88` | none (same digits) | Stable — which is why it hides in testing |

**The bug only appears when the digit *set* changes.** A demo typed by hand often
changes nothing but the last digit, so it looks fine. This is why it survives review.

## 6. One accent doing two jobs

`emerald-500` currently marks both interactive elements and positive results. In a
product where "this is good news" and "click me" must never be confused, sharing a
colour is a real defect, not a style preference.

**Fix:** one accent for *action*, one for *status*. They should never be the same
token.

## 7. Disclosure placement

The affiliate disclosure currently lives in a permanent top bar (lines 43-49) and in
the footer (line 640). **Neither is where the decision happens.** A reader choosing a
retailer should see that retailer is an affiliate *on the card, next to the button*.

A disclosure the reader must scroll back to find is not a disclosure.

## 8. Things I could not verify

- **No automated axe/Lighthouse run** — the browser was held by another agent. The
  mockups were validated structurally (tag balance, no external refs, provenance
  states present) but **not rendered in a real browser.** Do not treat this task as
  having produced a rendered-pixel-verified artefact.
- **No touch-device testing.** The 44px target and the `inputmode` decisions are
  reasoned from WCAG and from the stated use case, not measured on hardware.

## 9. Related work

- `tasking/completed/docs-audit/` — found that `AGENTS.md`, `README.md` and others
  quote stale counts. **The same drift mechanism applies to design tokens:** anything
  duplicated will drift. Quote a count once.
- `docs/mockups/` (2 Oct 2026) — the predecessor set. Its `_tokens.css` is good and
  most of it survives unchanged into `_tokens.css` here. **Do not assume a later
  artefact is automatically better than an earlier one.**