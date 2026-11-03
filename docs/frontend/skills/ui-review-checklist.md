# Skill: UI Review Checklist

Use when reviewing a UI change or before shipping one. Work through in order - the earlier sections
catch the defects that are expensive to fix later.

---

## 1. Semantics (blocking)

- [ ] Is there a `<button>` for buttons, not a clickable `<div>`?
- [ ] Do links navigate and buttons act? (`<a href>` vs `<button>`)
- [ ] Is there exactly one `<main>` per page?
- [ ] Are landmarks present (`header`/`nav`/`main`/`aside`/`footer`)?
- [ ] Does the heading hierarchy descend without skipping levels?
- [ ] Is every **icon-only** control given an accessible name (`aria-label`)?
- [ ] Are decorative SVGs `aria-hidden="true"`?
- [ ] Is any ARIA used where a native element would do? (first rule of ARIA)

Grounding: `docs/frontend/05-accessibility.md` sections 2-4.

---

## 2. Keyboard (blocking)

Test by actually tabbing through it. Do not reason about it.

- [ ] Every interactive element is reachable and operable by keyboard alone
- [ ] Focus order follows **visual** order
- [ ] Focus indicator is clearly visible - and no `outline: none` without a replacement
- [ ] `:focus-visible` used, not bare `:focus`
- [ ] Escape closes dialogs, popovers, and menus
- [ ] **Focus returns to the trigger** when an overlay closes
- [ ] No keyboard traps
- [ ] Composite widgets (tabs, menus, listboxes) use roving tabindex - one tab stop
- [ ] New content receiving focus after a user action is announced

Grounding: `docs/frontend/05-accessibility.md` section 3.

---

## 3. WCAG 2.2 specifics (blocking)

- [ ] Interactive targets are **>= 24x24 CSS px** hit area (SC 2.5.8)
- [ ] Any drag interaction has a single-pointer alternative (SC 2.5.7)
- [ ] Sticky headers/footers do not obscure focused elements (SC 2.4.11)
- [ ] Info previously entered is not re-requested (SC 3.3.7)
- [ ] Help mechanisms appear in consistent locations (SC 3.2.6)
- [ ] No cognitive-function test required to log in (SC 3.3.8)

Grounding: `docs/frontend/05-accessibility.md` section 1.

---

## 4. Color and contrast (blocking)

- [ ] Body text meets **4.5:1**
- [ ] Large text and UI component boundaries meet **3:1**
- [ ] Focus indicators meet 3:1 against adjacent colors
- [ ] No information conveyed by **color alone**
- [ ] Both light and dark mode were checked (not just one)
- [ ] Dark mode surfaces **step up** in lightness with elevation (tonal lift, not shadow)

Grounding: `docs/frontend/01-foundations.md` sections 2.3-2.6; `docs/frontend/05-accessibility.md` section 5.

**Note:** APCA / WCAG 3 Lc values are **not** enforceable. Target WCAG 2.2 ratios. See
`docs/frontend/09-caveats-and-volatile-status.md` section 1.

---

## 5. Tokens (blocking for design-system work)

- [ ] No hardcoded hex, px, or ms values in component code
- [ ] Components reference **semantic** tokens, not primitives
- [ ] Any new value added is justified as a semantic token, not a new arbitrary number
- [ ] Spacing uses `--space-*` semantic tokens, not raw scale steps

Grounding: `docs/frontend/01-foundations.md` section 1; `docs/frontend/07-qa-tooling.md` section 2.

---

## 6. Layout and responsiveness (blocking)

- [ ] Component uses **container queries**, not viewport breakpoints, for internal responsiveness
- [ ] Logical properties used (`padding-inline`, `margin-inline-start`) - not physical
- [ ] Tested at 320px
- [ ] Tested at each container query breakpoint **+/- 1px**
- [ ] Tested with very long unbroken content
- [ ] Tested with empty state (no data)
- [ ] Tested at **200% zoom** (SC 1.4.4)
- [ ] No overflow at narrow widths (check `minmax(min(X, 100%), 1fr)` pattern)
- [ ] Scrolling containers do not chain to the page (`overscroll-behavior`)

---

## 7. Typography

- [ ] Body line-height between 1.5 and 1.65
- [ ] Prose has a measure constraint (~60-70ch)
- [ ] `clamp()` bounds are in `rem`, and verified at 200% zoom
- [ ] Headings use `text-wrap: balance`
- [ ] Tabular data uses `font-variant-numeric: tabular-nums`
- [ ] Web fonts use `size-adjust`/`ascent-override`/`descent-override` to avoid CLS
- [ ] `font-display` is not `block`

Grounding: `docs/frontend/01-foundations.md` section 3.

---

## 8. Motion

- [ ] Animating `transform` and `opacity` only (or `filter`/`clip-path`)
- [ ] No animation of `width`, `height`, `top`, `left`, `margin`, or `padding`
- [ ] Durations and easings come from tokens
- [ ] `prefers-reduced-motion` is honored
- [ ] Feedback is reduced, **not removed** (a spinner still needs to signal)
- [ ] Exits are faster than enters

Grounding: `docs/frontend/08-patterns-and-craft.md` section 1.

---

## 9. Performance

- [ ] Images have `width`/`height`
- [ ] `loading="lazy"` on below-the-fold images **only**
- [ ] LCP image has `fetchpriority="high"` and is not lazy-loaded
- [ ] Images are AVIF/WebP with `srcset`/`sizes`
- [ ] Data fetches are parallel, not sequential awaits
- [ ] Interactive handlers give feedback then yield (`scheduler.yield`)
- [ ] Analytics/GTM calls are **not** on the interaction path
- [ ] No permanent `will-change`
- [ ] `content-visibility: auto` with `contain-intrinsic-size` on long lists
- [ ] New animations behind `@supports` have a **complete non-animated base state**

Grounding: `docs/frontend/06-performance.md`.

---

## 10. State architecture

- [ ] Every piece of state has exactly one owner
- [ ] Server data read in a Server Component, not copied into `useState`
- [ ] Filters/sort/pagination/tab are in the URL
- [ ] No server cache in Redux/Zustand
- [ ] No high-frequency values in Context
- [ ] Form state is component-local
- [ ] Store subscriptions use selectors
- [ ] `"use client"` boundaries are as narrow as possible

Grounding: `docs/frontend/04-state-and-data.md`.

---

## 11. Component API

- [ ] No prop explosion (> ~6 boolean props suggests composition is needed)
- [ ] Variants are data attributes or a colocated variant function
- [ ] State exposed for styling (`data-state`, etc.) rather than computed class strings
- [ ] Component follows the primitive -> component -> pattern layering
- [ ] Documented with a "don'ts" story

Grounding: `docs/frontend/03-components.md` sections 2-4.

---

## 12. Browser support

- [ ] Every new CSS/JS API checked against Baseline status
- [ ] Fallback behavior defined where support is "newly available"
- [ ] `@supports` guards use **current** property spellings, not draft-era ones
- [ ] Scroll-driven animations: `animation-timeline` declared **after** any `animation` shorthand
- [ ] Native feature polyfills: fallback styles live **outside** the `@supports` guard

Grounding: `docs/frontend/02-css-layout.md` sections 1 and 9; `docs/frontend/09-caveats-and-volatile-status.md`.

---

## 13. Manual verification (do not skip)

Automation detects **under 50%** of accessibility issues. These require a human:

- [ ] Tabbed through the whole flow, watching focus
- [ ] Focus returns correctly after every overlay close
- [ ] Tested with a screen reader (VoiceOver/NVDA/TalkBack) if the flow is critical
- [ ] Zoomed to 200% and read
- [ ] Reduced-motion enabled, flow still makes sense
- [ ] Read the error messages - are they actionable?

Grounding: `docs/frontend/05-accessibility.md` section 6; `docs/frontend/07-qa-tooling.md` section 6.

---

## Review output format

When reporting, order findings:

1. **Blocking** - sections 1-5. Correctness and legal-exposure issues.
2. **Important** - sections 6-11. Real quality issues, not emergencies.
3. **Advisory** - sections 12-13. Suggestions and verification notes.

For each finding give: the file and line, what the rule is, what to do, and the grounding doc
reference.