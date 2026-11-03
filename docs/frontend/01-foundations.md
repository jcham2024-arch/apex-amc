# Foundations: Tokens, Color, Type, Space

> Part of the `webpage-design` knowledge base. Research compiled October 2026.
> See `09-caveats-and-volatile-status.md` for anything date-sensitive.

---

## 1. Design tokens

### 1.1 The three-tier model

```
PRIMITIVE   raw values, no meaning      --color-blue-600, --space-4, --font-size-3
SEMANTIC    intent, the important tier  --color-text-muted, --space-section, --text-body
COMPONENT   scoped to one component     --button-padding-inline
```

**Components reference semantic tokens only. Never primitives.** That single indirection is what
makes theming, dark mode, and multi-brand work without editing component files.

### 1.2 There is now a spec: DTCG Format 2025.10

**Design Tokens Format Module 2025.10** - Final Community Group Report, **28 October 2025**
https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/

> **Important:** this is NOT a W3C Standard and NOT on the Standards Track. It is published under
> the Community Final Specification Agreement. Treat it as a widely-agreed interchange format, not
> as normative law.

Core of the format:

- A **token** is an object with `$value`. `$value` is a **reserved key** - you cannot name a token
  `$value`.
- **Groups** are JSON objects *without* `$value`. **Tools SHOULD NOT infer type or purpose from
  group names** - a deliberate anti-convention in the spec.
- `$type` sets a default type for the group, **inherited by nested groups** unless overridden.
- `$extends` inherits tokens from another group (syntactic sugar for JSON Schema `$ref`).
- `$description`, `$deprecated` (accepts `true`/`false`/a string explanation), `$extensions`
  (vendor data, MUST use a vendor-specific key).
- `$root` is reserved and included in token paths for unambiguous references.

**References - two forms, both required:**

- Curly-brace `{group.token}` - retained for developer ergonomics. Resolves to `$value` of target.
- JSON Pointer via `$ref` - **tools MUST support it** (RFC 6901). Enables referencing
  *properties inside* composite tokens, not just whole values.

Tools MUST detect and throw on **circular references**. Tools SHOULD preserve references and
resolve them lazily, so changing a token updates all its dependents.

### 1.3 Token pipelines

| Stage | Tools |
|---|---|
| Design source | Figma Variables, Tokens Studio for Figma |
| Transform | Style Dictionary, Terrazzo, theiota |
| Consumption | CSS custom properties, Tailwind v4 `@theme`, JS/TS objects, Swift/Kotlin |

Figma Variables support **modes** (formerly themes). Map modes to token sets, not to raw values -
keep the semantic layer as the contract.

### 1.4 Naming conventions actually used

```css
--color-{role}-{variant}     /* --color-text-muted  */
--space-{semantic}           /* --space-section     */
--text-{role}                /* --text-body         */
--radius-{size}              /* --radius-md         */
--duration-{intent}          /* --duration-quick    */
--ease-{name}                /* --ease-out         */
```

Two things consistently get wrong:

1. **Group names implying purpose** (the DTCG spec explicitly discourages relying on them).
---

## 2. Color

### 2.1 Why OKLCH and not HSL

HSL lightness is **not perceptual**. `hsl(60 100% 50%)` (yellow) and `hsl(240 100% 50%)` (blue)
share an identical `L` value, but yellow looks dramatically brighter. Scaling lightness in HSL
produces uneven ramps and unpredictable contrast failures.

**OKLCH is perceptually uniform.** Adjusting hue preserves perceived lightness and chroma.

```css
oklch(L C H)
/* L = perceptual lightness 0-100%
   C = chroma (0 is gray, higher is more saturated)
   H = hue in degrees
   optional alpha */
```

Source: https://web.dev/articles/baseline-in-action-color-theme - "*OkLCh is a good format for this
type of color manipulation, as it's designed to provide perceptual uniformity.*"

### 2.2 Relative color syntax - the killer feature

Derive colors from a base and adjust individual channels. The derived token **stays correct when
the base changes**.

```css
html {
  --base-color: oklch(43.7% 0.075 224);
}

html {
  /* darken base by 15% */
  --action-color:       oklch(from var(--base-color) calc(l * 0.85) c h);
  /* lighten that by 15% */
  --action-color-light: oklch(from var(--action-color)  calc(l * 1.15) c h);
  --action-color-dark:  oklch(from var(--action-color)  calc(l * 0.9)  c h);

  /* perceptual mixing */
  --border-color:   color-mix(in oklab, var(--base-color), grey);
  --accent-subtle:  color-mix(in oklch, var(--accent) 12%, transparent);
}
```

**Why this matters:** swap `--base-color` for a customer brand and the entire hover/shade/subtle
ladder regenerates correctly, with no hue drift. Not achievable with hand-picked hex values.

Use `in oklab` or `in oklch` for interpolation. Using `in srgb` gives perceptually uneven results.

### 2.3 Dark mode - the elevation inversion

**Light mode:** hierarchy comes from shadow. Surfaces get lighter or more shadowed as they rise.

**Dark mode:** shadow is nearly invisible on dark backgrounds. Hierarchy must come from **tonal
lightness lift**. Surfaces get *lighter* as they rise.

```
LIGHT                          DARK
surface-0  page        100%    surface-0  page        12%
surface-1  card         98%    surface-1  card        18%
surface-2  modal        95%    surface-2  modal       24%
surface-3  popover      92%    surface-3  popover     30%
                            ^ steps DOWN           ^ steps UP
```

Additional principles:

- **Avoid pure black** (`#000`) for page background - use something like `oklch(12% ...)`.
- **Reduce chroma in dark mode** - saturated colors vibrate against dark backgrounds.
- Dark mode is a **second design**, not an inversion.

### 2.4 The two critical `light-dark()` gotchas

```css
:root {
  color-scheme: light dark;   /* REQUIRED - see below */
}
```

1. **`light-dark()` reads `color-scheme`, not `prefers-color-scheme`.** Without
   `color-scheme: light dark` on an ancestor, it **always returns the light value**, even in dark
   mode.
2. Setting `color-scheme: light dark` on `:root` **also** auto-themes scrollbars, form controls,
   and checkboxes - UI your custom properties cannot reach.

Full token layer using `light-dark()`: see `../assets/tokens.css`.

### 2.5 Explicit user override (must beat the OS setting)

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* dark token values */ }
}
```

The `:not([data-theme="light"])` guard lets a user toggle back to light while the OS is in dark
mode. Omitting this makes manual theme switching impossible for those users.

### 2.6 Contrast - what is actually enforceable

**WCAG 2.2:**

- 4.5:1 normal text
- 3:1 large text (>= 18pt, or >= 14pt bold)
- 3:1 non-text (UI components, focus indicators, graphical objects) - SC 1.4.11

**APCA / WCAG 3 Lc values: NOT enforceable.** See `09-caveats-and-volatile-status.md` section 1 -
APCA was removed from the WCAG 3 draft in July 2023. Treat APCA as a design heuristic only.

Real-world adoption is genuinely split:

- **Radix Colors** - APCA-based; steps 11/12 guaranteed Lc 60 / Lc 90 against a step 2 background.
- **GitHub Primer** - explicitly WCAG 2.2; docs state APCA "is a proposal and is not normative."
- **Material 3** - its own HCT tonal palette model.

### 2.7 Emerging: `contrast-color()`

**Baseline 2026 Newly available (April 2026).** Returns a color meeting WCAG AA minimum contrast
against the input. Useful for dynamically generated palettes where contrast cannot be guaranteed
---

## 3. Typography

### 3.1 The starting numbers

- Font size: start near `1rem`
- Body line-height: **1.5 - 1.65**, unitless
- Measure: **60 - 70ch** for prose

**`ch` caveat:** `ch` is the advance width of the "0" glyph, **not** a character count. Different
typefaces and scripts produce different lines at the same `ch`. Use it as a starting point and
verify with real content.

### 3.2 Fluid type - use it selectively

```css
:root {
  --text-label:   0.875rem;
  --text-body:    1rem;
  --text-lead:    1.25rem;
  --text-section: clamp(1.75rem, 1.35rem + 1.4vw, 2.75rem);
  --text-display: clamp(2.5rem,  1.5rem  + 4vw,   5.5rem);

  --leading-tight: 1.08;
  --leading-body:  1.6;
  --measure: 68ch;
}
```

Display and section headings benefit from fluidity. **Body and control text should stay stable** -
it reads calmer and is more predictable.

**Critical gotcha:** an incorrectly capped `clamp()` max breaks zoom. Set **both bounds in `rem`**,
and verify at **200% text size** (WCAG SC 1.4.4 Resize Text).

Container query units (`cqi`) are better than viewport units for component-scoped type, since the
component should respond to its own space, not the window.

### 3.3 Variable fonts

Highest-value axis is **`opsz` (optical size)** - it tunes stroke weight, spacing, and x-height to
match rendered size, so small text looks clean and large text looks polished, and both stay in sync
as you scale.

- One variable file replaces many static weights. Five static weights can be ~150 KB; one variable
  file can be under 45 KB.
- **Strip unused axes.** If you do not use `slant`, remove it.
- Variable weight lets you hold heading-to-body contrast as fluid size ratios compress on small
  screens - static files cannot do this.

### 3.4 Font loading without CLS

```css
@font-face {
  font-family: "Body Sans";
  src: url("/fonts/body-sans.woff2") format("woff2-variations");
  font-display: swap;
  /* Metrics measured against the real web font - DO NOT copy blindly */
  size-adjust: 114%;
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}
```

**`font-display` options:**

- `swap` - text renders immediately in fallback, swaps when font arrives (needs the overrides above)
- `optional` - may not swap at all; very low CLS risk, but the font may never show
- `block` - invisible text during load; **avoid**, it hurts LCP and accessibility

**Copied metric values can make the match worse.** Measure against the actual web font first.

Next.js `next/font` self-hosts and removes the Google Fonts round-trip - usually the better default.

Also: **preload** the primary font file when genuinely render-critical, and **subset** with
`unicode-range` so you do not ship glyphs nobody needs.

### 3.5 Typographic details that matter

```css
/* Numbers, currency, tables - align digits */
.tabular { font-variant-numeric: tabular-nums; }

/* Headings - balance the lines */
h1, h2, h3 { text-wrap: balance; }

/* Body - avoid orphans/raggedness */
.prose { text-wrap: pretty; }

/* Long-form prose measure */
.prose { max-inline-size: var(--measure); }
```

---

## 4. Spacing and layout rhythm

### 4.1 Spacing scale

Build a scale (often 4pt or 8pt based), then **expose it as semantic tokens**:

```css
--space-3xs: 0.25rem;  --space-2xs: 0.5rem;
--space-xs:  0.75rem;  --space-sm:  1rem;
--space-md:  1.5rem;   --space-lg:  2rem;
--space-xl:  3rem;     --space-2xl: 4rem;

/* Semantic layer - this is what components consume */
--space-inline-gap:     var(--space-xs);
--space-component-pad:  var(--space-sm);
--space-section:        var(--space-2xl);
```

Components using `--space-section` survive a re-scale. Components using `--space-2xl` do not.

### 4.2 Density modes

Implement as a token override on a container:

```css
.density-compact     { --space-inline-gap: var(--space-2xs); --control-height: 2rem; }
.density-comfortable { --space-inline-gap: var(--space-xs);  --control-height: 2.75rem; }
```

Everything downstream inherits. No component changes.

### 4.3 Logical properties

Use these throughout. They make RTL and i18n work with no second stylesheet.

| Physical | Logical |
|---|---|
| `margin-left` | `margin-inline-start` |
| `padding-right` | `padding-inline-end` |
| `top` / `bottom` | `block-start` / `block-end` |
| `width` | `inline-size` |
| `height` | `block-size` |
| `text-align: left` | `text-align: start` |

### 4.4 Breakpoints

**Prefer content-driven and container-driven over device-driven.** Device breakpoints encode
assumptions about what hardware people own. Container queries let a component respond to the space
it actually gets (see `02-css-layout.md`).

---

## 5. Icons

- One grid, one stroke weight, one corner radius, one size ladder (typically 16/20/24).
- Implement as SVG components using `currentColor` so they inherit text color.
- **Accessibility:** decorative icons get `aria-hidden="true"`. Meaningful icons need either a
  visible text label or `role="img"` with `aria-label`. An icon-only button needs an accessible name.

```html
<!-- decorative -->
<svg aria-hidden="true" focusable="false">...</svg>

<!-- icon-only button - name is required -->
<button aria-label="Close dialog">
  <svg aria-hidden="true" focusable="false">...</svg>
</button>
```

---

## 6. Motion as design tokens

Duration and easing belong in the token layer, not scattered as magic numbers per component.

```css
--duration-instant: 50ms;
--duration-quick:   150ms;
--duration-normal:  250ms;
--duration-slow:    400ms;

--ease-out:    cubic-bezier(0.16, 1, 0.3, 1);     /* decelerate - enters */
--ease-in:     cubic-bezier(0.7, 0, 0.84, 0);     /* accelerate - exits */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);    /* both */
```

Rule of thumb: exits should be faster than enters. Users have already decided to dismiss.

For physics-based interaction (drag, gesture-following), use springs rather than fixed durations -
see `08-patterns-and-craft.md`.

---

## Sources

- DTCG Format 2025.10: https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/
- web.dev color theming: https://web.dev/articles/baseline-in-action-color-theme
- Radix Colors scale: https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale
- GitHub Primer color: https://primer.style/product/accessibility/color-considerations/
- MDN oklch: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch
- MDN light-dark(): https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark
- MDN contrast-color(): https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/contrast-color
- Baseline: https://web.dev/baseline