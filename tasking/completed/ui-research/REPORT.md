# REPORT — ui-research (T8)

**Task:** `ui-research` (brief calls it T8). **Agent:** scout-design
**Model:** default model, fresh instance.
**Status:** complete, staged for review. **The live site was NOT modified.**

## Deliverables

| File | Contents |
|---|---|
| `01-layout-research.md` | 7 sections, measured values, WCAG criteria cited |
| `02-design-critique.md` | 5 removals with line numbers, plus what to keep |
| `03-modern-mockups/_tokens.css` | Token layer incl. the provenance vocabulary |
| `03-modern-mockups/mockup-a-calculator.html` | Calculator flow |
| `03-modern-mockups/mockup-b-cartridge.html` | Cartridge reference flow |
| `03-modern-mockups/mockup-c-directory.html` | Retailer directory flow |
| `04-layout-spec.md` | Implementable spec + acceptance criteria |
| `KNOWLEDGE.md` | Reusable findings and what could not be verified |
| `REPORT.md` | This file |

---

## 1. What changed

Only `tasking/in-progress/ui-research/`, and only new files. **`apps/`, `docs/`,
`data/`, `scripts/` and `package.json` were not modified.** No file in the main tree
was edited, and no existing mockup was overwritten — `docs/mockups/` was read only.

## 2. What I verified, and how

**Baseline:** `npm run verify` → exit 0, before and after.

### Mandatory negative test — the CSP grep, pasted

The brief's required command. I ran it against my **first draft**, which I believed was
clean:

```
CSP VIOLATIONS FOUND: 19
  mockup-a-calculator.html:86: <p class="eye" style="margin-top:var(--sp6)">Flow 1 of 3</p>
  mockup-a-calculator.html:107: ... <b style="color:var(--text)">derived</b>
  mockup-a-calculator.html:113: ... <span style="color:var(--text-mute)...">/ 100</span>
  ... (16 further inline style attributes)
```

**19 real violations in my own output.** I had written inline `style=` attributes
while styling quickly and did not notice. All were moved into named utility classes,
and three comment lines that merely *mentioned* the forbidden syntax were reworded so
the grep is clean rather than noisy:

```
CLEAN: no on*=, style=, <link or <script src in any mockup
```

**A gate that passes on someone else's file may fail on yours.** This is the same
failure `AGENTS.md` documents for the CSP browser check.

### Structural validation of all three mockups

```
mockup-a-calculator.html: PASS
mockup-b-cartridge.html:   PASS
mockup-c-directory.html:   PASS
ALL 3 MOCKUPS VALID
```

Per file: no external reference, no inline style, no event handler, balanced tags, all
four provenance states present, `tabular-nums` present.

### The mandatory negative test, part 2 — research that contradicted my instinct

**I intended to argue that the mobile drawer's duplicate navigation was harmless
because it is `hidden` by class.** Measuring it against the accessibility criteria
killed that: `hidden` via a Tailwind class is `display:none`, so it is removed from the
accessibility tree — but the **drawer's trigger button (line 91) remains focusable and
the drawer has no focus trap**, so a keyboard user tabbing out walks into the page
behind it. I followed the research and upgraded it to a **removal**, not a restyle.

### Existing mockups read, as required

`docs/mockups/`: `mockup-1-home.html`, `mockup-2-history.html`,
`mockup-3-membership.html`, `_tokens.css`, `README.md`.

| Existing artefact | Fate |
|---|---|
| `_tokens.css` | **KEPT and extended.** Ink ramp, brass accent, `--r`/`--r-lg`, mono/sans stacks and `tabular-nums` (line 17) all survive unchanged. |
| `mockup-1-home.html` | **SUPERSEDED** by mockup A (calculator) — the existing set has no calculator, which is the product's primary flow. |
| `mockup-2-history.html` | **KEPT, not superseded.** Price history is a *future* feature; `docs/DATA-TODO.md` has no price data. Building it now would design against absent data. |
| `mockup-3-membership.html` | **KEPT, not superseded.** Membership is not a decided feature. |

**So: one of three superseded, two deliberately not.** The honest answer is that the
existing set was not bad — `_tokens.css` is genuinely good, and its `tabular-nums`
line predates this task and still is not in the live site.

## 3. What I found but did NOT touch

- **`docs/mockups/`** — read only, per the brief.
- **`apps/website/src/index.html`** — 5 removals recommended, **none applied**. Not in
  the write-set.
- **The mobile drawer's missing focus trap** (line 97) — a real a11y defect, reported
  not fixed.
- **`theme.css` holds no tokens** — it contains only scrollbar and bar-width rules; the
  real tokens are Tailwind utilities. A file named `theme.css` that is not a theme is
  a trap for the next agent.

## 4. What I believe is wrong

**The single highest-value change is adding a provenance vocabulary, and it is also the
cheapest.**

Every other item in this critique is cosmetic. This one is the difference between a site
that tells the truth and one that looks like it does:

```
grep -c 'provenance|derived|estimated|unverified|conflict' index.html  -> 0
grep -c 'tabular-nums' index.html                                       -> 0
```

The site **already knows** which value is which — `data/schemas/*.yaml` records
`published` / `derived` / `estimated` per value, and `npm run coverage` reports 2
unresolved pressure disputes it refuses to publish. **That information is discarded at
the render step.** So the fix needs **no new data, no new source, no schema change and
no migration** — which makes it far cheaper than any of the visual work, and the only
one on this list that improves truthfulness rather than appearance.

**Second: the brand risk is a design problem too.** The masthead reads `PROJECT APEX DEV`
(line 61) while the `<title>` says "placeholder name" (line 6). Two registers, one
site. Combined with the LIVE IC 013 registration documented in
`tasking/completed/trademark-clearance/`, the identity layer is the least settled part
of the UI — and `brand-rename` is blocked on a human.

### Definition of Done

| Requirement | Status | Evidence |
|---|---|---|
| Changes only under `tasking/completed/ui-research/` | **PASS** | `apps/` untouched |
| `npm run verify` exits 0 | **PASS** | before and after |
| Mockups open with zero network requests | **PARTIAL** | Structurally verified; see below |
| No `on*=`, `style=`, `<link`, `<script src` | **PASS** | pasted above |
| Research cites sources, not just opinion | **PASS** | WCAG 2.2 SC cited per claim; `file:line` for every page claim |
| Critique names 5 removals with line numbers | **PASS** | 5 named, all with line refs |
| Research contradicting first instinct | **PASS** | §2 — the drawer |

### Known limits — stated, not glossed

- **The mockups were NOT rendered in a real browser.** The chrome instance was held by
  another agent and could not be opened. Validation was structural (tag balance, no
  external refs, states present) plus the CSP grep. **A reviewer should open all three
  before merging.**
- **No axe/Lighthouse run**, and no contrast tooling — ratios are computed by hand from
  the token values.
- **No touch-device testing.** The 44px target and `inputmode` decisions are reasoned
  from WCAG 2.2 SC 2.5.8, not measured.
- **Font loading differs from production.** The live site loads Inter from Google
  Fonts; the mockups use the system stack to hold zero network requests, so line breaks
  will differ slightly.