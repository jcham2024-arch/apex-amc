# Task T8 - UI/UX research: what top-tier data-heavy sites actually do

**Status:** READY
**Blocked by:** none
**Workflow:** copy-out to `tasking/completed/ui-research/` - see [tasking/README.md](../README.md)
**Model:** [record on start - fresh instance of the default model]

> **RESEARCH AND DESIGN ONLY. DO NOT CHANGE THE LIVE SITE.**
> `apps/website/` is not in your write-set. You produce a specification and mockups;
> implementation is a later task that follows the copy-out workflow.

---

## 1. Isolation Boundaries

**Strict Read Paths** - read anything; you NEED:

- `apps/website/src/index.html` - the current page
- `apps/website/src/styles/theme.css`, `main.css` - current design tokens
- `apps/website/src/main.js` - how the page is built
- `docs/mockups/*.html`, `docs/mockups/_tokens.css` - **EXISTING mockups, read first**
- `docs/research-competitors/02-feature-gaps.md`
- `ARCHITECTURE.md` - the self-containment rule you must respect

**Strict Write Paths** - ONLY inside `tasking/completed/ui-research/`:

- `tasking/completed/ui-research/01-layout-research.md`
- `tasking/completed/ui-research/02-design-critique.md`
- `tasking/completed/ui-research/03-modern-mockups/mockup-*.html`
- `tasking/completed/ui-research/03-modern-mockups/_tokens.css`
- `tasking/completed/ui-research/04-layout-spec.md`
- `tasking/completed/ui-research/REPORT.md`

**Do not edit** `apps/`, `docs/`, `data/`, `scripts/`, or `package.json`.

### Existing mockups - do not duplicate

`docs/mockups/` already holds `mockup-1-home.html`, `mockup-2-history.html`,
`mockup-3-membership.html` and `_tokens.css` (2 Oct 2026, from `02-feature-gaps.md`).
**Read them first.** Your job is *better*, research-backed versions. In `REPORT.md`,
state what you kept, what you replaced, and why - if they are still right, say so.
---

## 2. Constraints any redesign MUST respect

Architectural, not preferences. A mockup that violates these cannot ship.

- **The site is ONE self-contained `dist/index.html`.** No `assets/` references, no
  `fetch()`, no external JSON or CSV. `check-website-build.mjs` fails the build on any
  of these.
- **The Content-Security-Policy is strict.** No `unsafe-inline`, no `unsafe-eval`, no
  `unsafe-hashes`, no `on*=` handlers, no `style=` attributes. `style-src` allows only
  two hosts plus a build-time SHA-256 hash of the inline `<style>`.
  **Any mockup introducing an inline script or style attribute violates the shipped
  policy.** Use CSS custom properties and the CSSOM, as the codebase already does.
- No `innerHTML` with data. Use `el()`, `icon()`, `safeUrl()` from `dom.js`.
- Must remain usable on a phone. Many users will be at a range or a bench.
- `cdn.tailwindcss.com` is a known open finding, not a solution. **Do not design around
  it.** Tailwind is compiled at build time in the real pipeline.

---

## 3. Execution Prompt

> Paste verbatim.

Our page is functional and plain. Research what genuinely distinguishes top-tier
data-heavy web applications, then specify and mock up a version that matches or exceeds
them **within the constraints in §2**.

**`01-layout-research.md`** - cover, with sources and measured values where possible:

- **Information density.** What do the best data tools (ballistics apps, military
  reference tools, precision engineering tools) do that ours does not? How do they
  prioritise the primary action?
- **Typography scale and hierarchy.** Read `theme.css` and state specifically how ours
  compares. Cover type scale, line-height, measure, and **tabular figures** - numeric
  data needs `font-variant-numeric: tabular-nums` or columns jitter as digits change.
- **Numeric data display.** This is a numbers product. How should a cost-per-round or
  charge weight be shown? Alignment, significant figures, units, uncertainty? A number
  without its uncertainty is not honest - see §4.
- **Colour and status.** CSP forbids remote stylesheets except two hosts. What can we
  do locally? Map states (safe / unverified / unknown / conflict) to something
  colourblind-safe. **Colour alone must never be the only signal** - WCAG.
- **Mobile.** What actually works for a shooter at the bench or the range?
- **Interaction patterns.** Inline editing, sticky inputs surviving scroll, a running
  results panel, keyboard accessibility.
- **Accessibility.** Keyboard navigation, focus visibility, contrast ratios, screen
  reader semantics, touch targets. Cite WCAG 2.2 where relevant.

**`02-design-critique.md`** - be blunt about our current page. What is weak, what is
noise, what is missing, what is hostile to use. Include line numbers. **Name at least
five things you would remove.**

**`03-modern-mockups/mockup-*.html`** - three self-contained mockups covering the three
flows that matter most: **calculator**, **cartridge reference**, **retailer directory**.
Each a single HTML file with inlined CSS, no external requests, obeying every constraint
in §2. They must open in a browser and read as real markup.

**`04-layout-spec.md`** - the implementable specification: token table with actual
values, spacing scale, type scale, component list with states, responsive breakpoints,
and what changes in the data layer to feed it. Precise enough that an implementer makes
no design decisions.

---

## 4. Honesty requirements for a numbers product

Every figure here has a source and a stated uncertainty. **The design must not lose
that.**

- An unverified or conflicting value must be visually distinguishable from a verified
  one, and **the distinction must not rely on colour alone**.
- Never present a derived or modelled number with the same visual weight as a measured
  one.
- Where a value is unknown, the layout must accommodate saying so. **The current design
  has no vocabulary for "we do not know"** - which is our most common state: all 6
  dimensional columns are 0/229 populated.
- Do not design a treatment implying authority we do not have.

---

## 5. Definition of Done

**Validation:**

- [ ] `git status --porcelain` shows changes ONLY under `tasking/completed/ui-research/`
- [ ] `npm run verify` still exits 0
- [ ] All three mockups open in a browser with **zero** network requests
- [ ] **No mockup contains `on*=` handlers, `style=` attributes, or an external
      stylesheet/script reference.** Verify it yourself:
      `grep -nE 'on(click|input|change|load)=|style=|<link|<script src' tasking/completed/ui-research/03-modern-mockups/*.html`
      must return nothing
- [ ] `01-layout-research.md` cites sources, not just opinion
- [ ] `02-design-critique.md` names five removals with line numbers

**Mandatory negative test:**

- [ ] Paste the grep output proving your mockups contain no CSP violation
- [ ] Paste the list of existing `docs/mockups/` files you read, and state which of your
      three supersede them
- [ ] Name one place where the research contradicted your first instinct, and which you
      followed

**Report:** `REPORT.md`, five-part summary from `.clinerules` §8. Item 4: which single
change would most improve the site, and why.
