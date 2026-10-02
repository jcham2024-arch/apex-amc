# SUMMARY — ui-research (T8)

One-page digest of [`REPORT.md`](REPORT.md). Design research only — **the live site
was not modified.**

---

## The finding that reframed the task

```
grep -c 'provenance|derived|estimated|unverified|conflict' index.html  -> 0
grep -c 'tabular-nums' index.html                                       -> 0
```

**The current page has no way to say how a number was arrived at.** Meanwhile
`data/schemas/*.yaml` marks every value `published` / `derived` / `estimated`, and the
project holds **2 unresolved pressure disputes** it refuses to publish.

> This is a numbers product whose most common honest state is **"we do not know"** —
> all six dimensional columns are 0/229 populated — and its design renders an unknown
> identically to a measured one, in confident accent colour.

**That is a correctness bug that presents as a design bug.** A prettier calculator that
still hid it would be a worse product.

## The one change I would make first

**Add the provenance vocabulary, then `tabular-nums`.** Everything else in the critique
is cosmetic; this is truthfulness.

And it is also the **cheapest**: the site already knows which value is which. The
information exists in the schema and is discarded at the render step, so it needs **no
new data, no new source, no schema change, no migration.**

## Five things I would remove from `index.html`

| # | What | Lines |
|---|---|---|
| 1 | Top alert bar — a disclosure in the wrong place | 43-49 |
| 2 | FontAwesome — third-party request on a range-side page; eats a CSP host | 19, ~25 uses |
| 3 | `PROJECT APEX DEV` badge — warns about the code, not the data | 61 |
| 4 | Duplicate mobile nav, with no focus trap | 91-111 |
| 5 | Decorative hero — ~60 lines before the product starts | 115-175 |

## Deliverables

| File | Contents |
|---|---|
| `01-layout-research.md` | 7 sections, measured values, WCAG 2.2 cited per claim |
| `02-design-critique.md` | 5 removals with line numbers, plus what to keep |
| `03-modern-mockups/_tokens.css` | Token layer incl. the provenance vocabulary |
| `03-modern-mockups/mockup-a-calculator.html` | Calculator |
| `03-modern-mockups/mockup-b-cartridge.html` | Cartridge reference |
| `03-modern-mockups/mockup-c-directory.html` | Retailer directory |
| `04-layout-spec.md` | Implementable spec + 8 acceptance criteria |
| `KNOWLEDGE.md` | Reusable findings |
| `REPORT.md` | Five-part §8 report |

## Existing mockups: 1 of 3 superseded

`docs/mockups/_tokens.css` is **good and mostly survives unchanged** — including its
`tabular-nums` line, which predates this task and is still absent from the live site.
Only `mockup-1-home.html` is superseded (it shows no calculator, which is the product's
primary flow). History and membership mockups are **deliberately not** superseded —
both design features we do not yet have data or a decision for.

**Do not assume a later artefact beats an earlier one.**

## Verification

```
ALL 3 MOCKUPS VALID      (no external refs, no inline style, balanced tags,
                          all 4 provenance states, tabular-nums present)
CLEAN: no on*=, style=, <link or <script src in any mockup
npm run verify -> exit 0
```

**The CSP grep caught 19 violations in my own first draft** — inline `style=`
attributes I had written while styling quickly. All moved to named classes.

## Known limits

- **The mockups were NOT rendered in a real browser** — the chrome instance was held by
  another agent. Structural validation only. **A reviewer should open all three.**
- No axe/Lighthouse pass; contrast ratios computed by hand from the token values.
- No touch-device testing; the 44px target is reasoned from WCAG 2.2 SC 2.5.8.

---

*Model: default model, fresh instance. `apps/`, `docs/`, `data/`, `scripts/` and `package.json` were not modified.*