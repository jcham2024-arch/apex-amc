# Accessibility

> Part of the `webpage-design` knowledge base. Research compiled October 2026.
> Target: **WCAG 2.2 Level AA.**

---

## 1. The target and what is enforceable

### WCAG 2.2

W3C Recommendation, **5 October 2023**. Backwards compatible with 2.1 - conforming to 2.2 means
conforming to 2.0 and 2.1. 87 success criteria under four principles (POUR: Perceivable, Operable,
Understandable, Robust).

Source: https://www.w3.org/TR/WCAG22/ · https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/

### The nine new criteria

| SC | Name | Level | What it requires |
|---|---|---|---|
| 2.4.11 | Focus Not Obscured (Minimum) | AA | Focus not *completely* hidden by other content |
| 2.4.12 | Focus Not Obscured (Enhanced) | AAA | Focus not hidden *at all* |
| 2.4.13 | Focus Appearance | AAA | Focus indicator sufficiently visible |
| 2.5.7 | Dragging Movements | AA | Single-pointer alternative to any drag |
| 2.5.8 | Target Size (Minimum) | AA | Targets at least **24x24 CSS px** (with exceptions) |
| 3.2.6 | Consistent Help | A | Help mechanisms in the same place across pages |
| 3.3.7 | Redundant Entry | A | Do not require re-entering already-provided info |
| 3.3.8 | Accessible Authentication (Min) | AA | No cognitive-function test to log in |
| 3.3.9 | Accessible Authentication (Enhanced) | AAA | Stricter, fewer exceptions |

**4.1.1 Parsing was removed** as obsolete - modern browsers handle malformed HTML gracefully. If a
policy mandates WCAG 2.0/2.1 you still report it.

### Practical impact of the new criteria

These three are the ones that break real designs:

- **2.5.8** - your icon buttons, close buttons, and toolbar items must be >= 24x24 CSS px. This is
  the most common new failure.
- **2.5.7** - if you built a drag-to-reorder or drag-to-resize, you need a non-drag alternative
  (move-to buttons, a menu, arrow keys).
- **2.4.11** - sticky headers and floating bars can no longer obscure focused elements. Fix with
  `scroll-margin` and padding.

### WCAG 3.0

**Not normative.** Working draft; structure, testing methods, and the conformance model may change.
Contrast algorithm is "yet to be determined." Treat as 2030+ at the earliest.

**Do not architect around WCAG 3.** Target 2.2 AA - see `09-caveats-and-volatile-status.md`.

---

## 2. Semantic HTML first

**The first rule of ARIA: do not use ARIA if a native element does the job.**

Native elements ship with keyboard behavior, focus management, role, and platform accessibility
already correct. Every ARIA attribute you add is code you now own and must test.

```html
<!-- Wrong: a div pretending to be a button -->
<div role="button" tabindex="0" onclick="...">Save</div>

<!-- Right -->
<button type="button">Save</button>
```

### Landmarks

```html
<header>    <!-- banner -->
<nav>       <!-- navigation, aria-label when multiple exist -->
<main>      <!-- exactly one per page -->
<aside>     <!-- complementary -->
<footer>    <!-- contentinfo -->
```

### Heading hierarchy

Do not skip levels (`h2` -> `h4`). Do not choose heading level by font size - choose by structure
and size it with CSS. Screen reader users navigate by heading.

### Native elements that beat ARIA

| Instead of | Use |
|---|---|
| `role="button"` on a div | `<button>` |
| `role="checkbox"` | `<input type="checkbox">` |
| `role="dialog"` | `<dialog>` |
| `role="tooltip"` | element + `popover` |
| `role="combobox"` | `<input list>` for simple cases |
| `aria-expanded` on a div | `<details>`/`<summary>` for disclosure |
| `role="progress"` | `<progress>` |
---

## 3. Keyboard and focus

This is where most real accessibility failures live, and where automated testing is weakest.

### Rules

- **Everything operable with a mouse is operable with a keyboard.**
- **Focus order follows visual order.** If CSS reorders things visually, fix the DOM instead.
- **Every interactive element is focusable**, and nothing else is.
- **Focus is visible** at all times - use `:focus-visible`, never `outline: none` without a
  replacement.
- **No keyboard traps.**
- **Focus returns to the trigger** when a dialog, popover, or menu closes.
- **New content receives focus** when it appears as a result of user action.

### Skip link

```html
<a class="skip-link" href="#main">Skip to main content</a>
```

```css
.skip-link {
  position: absolute;
  inset-block-start: var(--space-xs);
  inset-inline-start: var(--space-xs);
  padding: var(--space-2xs) var(--space-xs);
  background: var(--color-surface-0);
  color: var(--color-text);
  translate: 0 -200%;
}
.skip-link:focus-visible { translate: 0 0; }
```

### `:focus-visible` not `:focus`

`:focus` fires on mouse click too, producing rings on click that users find noisy and that designers
then suppress. `:focus-visible` shows the ring only for keyboard-like interaction.

### Composite widgets - roving tabindex

Menus, tab lists, listboxes, and toolbars are **single tab stops**. Arrow keys move within.

```html
<div role="tablist">
  <button role="tab" tabindex="0"  aria-selected="true"  aria-controls="panel-1">One</button>
  <button role="tab" tabindex="-1" aria-selected="false" aria-controls="panel-2">Two</button>
</div>
```

The selected item has `tabindex="0"`; all others `-1`.

### Tabs - choose activation deliberately

- **Automatic:** arrow key moves focus AND selects. Simple, but can overload context.
- **Manual:** arrow moves focus, Enter/Space selects. More deliberate, better for heavy panels.

Pick one, implement consistently, and test it.

---

## 4. ARIA patterns worth knowing

Full patterns: https://www.w3.org/WAI/ARIA/apg/

### Combobox (autocomplete)

**DOM focus stays on the input.** Assistive-technology focus moves via `aria-activedescendant`.

- Selection follows focus; only one suggestion selected at a time.
- `aria-controls` only needs to be set while the popup is visible.
- If the popup role is not `listbox`, set `aria-haspopup` to `grid`/`tree`/`dialog` and DOM focus
  moves into the popup instead.
- A redundant toggle button gets `tabindex="-1"` - out of the tab sequence but retained for touch
  and AT users.
- Escape closes; if already closed, optionally clears the value.

| Key | Behavior |
|---|---|
| Down Arrow | open listbox if closed, else first option (DOM focus stays on input) |
| Up Arrow | last option |
| Escape | close listbox, then optionally clear |
| Enter | accept selected option |
| Alt + Down | open without moving focus |

### Dialog

Focus trap, Escape closes, **focus restores to the trigger**. Use `<dialog>` and the browser handles
all of it - you only implement restoration.

### Live regions for async updates

```html
<div role="status" aria-live="polite"></div>       <!-- non-urgent -->
<div role="alert" aria-live="assertive"></div>      <!-- urgent errors -->
```

- `polite` waits for a pause; `assertive` interrupts.
- `aria-atomic="true"` re-announces the whole region when it changes.
- **The region must exist in the DOM before you write to it.** Creating it and populating in the same
  tick often produces no announcement.

### Forms

```html
<label for="email">Email address</label>
<input
  id="email"
  type="email"
  name="email"
  autocomplete="email"
  required
  aria-required="true"
  aria-invalid="true"
  aria-describedby="email-error"
/>
<p id="email-error">Enter a valid email address.</p>
```

- Real `<label>` elements, always.
- `aria-invalid` + `aria-describedby` for errors. **Never color alone.**
- `<fieldset>` + `<legend>` for radio groups and checkbox groups.
- `autocomplete` tokens: `name`, `email`, `tel`, `street-address`, `one-time-code`, and many more.
  These are what let password managers and autofill work.
- `inputmode` / `enterkeyhint` for numeric and mobile keyboards.
- **Error summary** that receives focus on failed submit, listing links to each bad field.
- Validate on blur and on submit - **not on every keystroke**, which is hostile.

### Target size - the most common new failure

Every interactive target needs >= 24x24 CSS px hit area (SC 2.5.8). Note the hit area, not the
visual size - you can pad an icon button without changing how it looks:

```css
.icon-button {
  min-inline-size: 2.5rem;    /* 40px - comfortably above the 24px minimum */
  min-block-size: 2.5rem;
  display: inline-grid;
  place-items: center;
}
```

Exceptions exist (inline links, targets in a sentence, user-agent-controlled), but "it looks small"
is not one of them.

### Dragging needs an alternative

SC 2.5.7 requires a single-pointer alternative to any drag. A drag-to-reorder list needs
move-to-buttons or a context menu; a drag-to-resize handle needs numeric input or arrow keys.

---

## 5. Color, contrast, and user preferences

### WCAG 2.2 contrast minimums

| Content | Ratio |
|---|---|
| Normal text | 4.5:1 |
| Large text (>= 18pt, or >= 14pt bold) | 3:1 |
| UI components, focus indicators, graphics | 3:1 (SC 1.4.11) |

**APCA / WCAG 3 Lc values are NOT enforceable** - see `09-caveats-and-volatile-status.md` section 1.

### Color is never the sole indicator

Errors need text, not just red. Charts need patterns or direct labels, not just hue. Status needs a
label or shape.

### User preference media queries

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

@media (prefers-contrast: more) { /* strengthen borders and focus rings */ }
@media (forced-colors: active)   { /* honor OS high contrast */ }
@media (prefers-reduced-transparency: reduce) { /* drop blur/backdrop-filter */ }
```

---

## 6. Testing

### What automated tools actually catch

From the **2025 Web Almanac** accessibility chapter (published Jan 2026)
https://almanac.httparchive.org/en/2025/accessibility:

- Median Lighthouse accessibility score: **~85%**, up only **1%** from 2024.
- Per Alphagov (GOV.UK) comparison of automated tools: *"they all detect less than 50% of
  accessibility errors."*
- Pass rates on checks that exist are poor:

| Audit | 2022 | 2024 |
|---|---|---|
| `color-contrast` | 23% | **29%** |
| `aria-input-field-name` | 14% | 21% |
| `aria-progressbar-name` | 3% | 14% |
| `frame-title` | 36% | 51% |

**Roughly 7 in 10 sites fail color contrast.** The chapter explicitly invokes **Goodhart's Law** - a
perfect score does not mean an accessible site.

Lighthouse "cannot tell you that your site is keyboard navigable. All it can do is tell you that it
*isn't* if the site fails some basic tests."

### Tooling

| Tool | Use |
|---|---|
| **axe-core / Deque** | Engine behind most automated tooling |
| **Lighthouse** | CI floor, not a definition of done |
| **Accessibility Insights for the Web** | Open source, axe-based, with **guided manual tests** and a **Tab Stops visualization** showing the real keyboard path |
| **Playwright** | Custom assertions in E2E tests |
| **NVDA / VoiceOver / TalkBack** | The only way to catch announcement problems |

### Manual checklist

- No focus traps
- All interactive controls keyboard focusable
- Logical tab order
- Focus directed to new/dynamically loaded content
- Focus restored when overlays close
- Screen reader announces async updates
- 200% zoom does not break layout
- Reduced-motion respected

**Budget for manual passes.** Automated coverage is under 50%.

---

## 7. Legal context

| Obligation | Reality |
|---|---|
| **WCAG 2.2** | A voluntary guideline, not law - binding only where copied into legislation |
| **European Accessibility Act** | Commonly summarized as applying 28 June 2025; EN 301 549 reaches full force 2030 |
| **EN 301 549** | The EU harmonised standard; maps to WCAG 2.x |
| **Section 508** | Adopted WCAG **2.0** only; has an "equivalent facilitation" rule permitting better guidelines |
| **ADA** | Varies; VPAT/ACR is the reporting norm |
| **Procurement** | Government and enterprise buyers frequently require WCAG 2.2 AA + VPAT |

**VPAT** (Voluntary Product Accessibility Template) / **ACR** is how you report conformance.
Maintaining one is a real ongoing cost - budget for it, not just the code.

**Practical conclusion:** WCAG 2.2 AA is the conservative target that satisfies the strictest live
obligation while foreclosing nothing. See `09-caveats-and-volatile-status.md` section 5.

---

## Sources

- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- What's New in WCAG 2.2: https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
- ARIA Authoring Practices Guide: https://www.w3.org/WAI/ARIA/apg/
- Combobox pattern: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
- WCAG 3.0 Editor's Draft: https://www.w3.org/TR/wcag-31/
- Web Almanac 2025 accessibility: https://almanac.httparchive.org/en/2025/accessibility
- Accessibility Insights for the Web: https://accessibilityinsights.io/
- Adrian Roselli on WCAG 3 contrast: https://adrianroselli.com/2026/04/wcag3-contrast-as-of-april-2026.html
- GitHub Primer color guidance: https://primer.style/product/accessibility/color-considerations/