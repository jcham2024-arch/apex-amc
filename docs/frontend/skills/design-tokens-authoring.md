# Skill: Design Token Authoring

Use when creating, extending, or auditing a token system.

---

## 1. The three tiers - non-negotiable

```
PRIMITIVE   raw values, no meaning      --color-blue-600, --space-4
SEMANTIC    intent                       --color-text-muted, --space-section
COMPONENT   scoped to one component     --button-padding-inline
```

**Components consume semantic tokens. Never primitives.** If a component references
`--color-blue-600`, changing the brand means editing every component. That is the entire failure
mode this structure exists to prevent.

Ask when adding a value: **what is this for?** The answer must be a purpose ("section spacing",
"muted text"), not a description of the value ("gray 500").

---

## 2. Color tokens in OKLCH

### Define a base, derive everything

```css
:root {
  /* ONE brand hue. Everything else derives from it. */
  --brand-h: 285;
  --brand-chroma: 0.02;

  --accent:        oklch(60% 0.25 var(--brand-h));
  --accent-hover:  oklch(from var(--accent) calc(l * 0.92) c h);
  --accent-subtle: color-mix(in oklch, var(--accent) 12%, transparent);
}
```

**Why:** change `--brand-h` and the entire hover/subtle ladder regenerates correctly, with no hue
drift. Hand-picked hex values cannot do this.

### Never scale lightness in HSL

`hsl(60 100% 50%)` and `hsl(240 100% 50%)` share an `L` and look nothing alike. Use OKLCH, which is
perceptually uniform.

### Dark mode is a second design

```css
:root {
  color-scheme: light dark;

  --surface-0: light-dark(oklch(100% 0     0),   oklch(12% 0.02  240));
  --surface-1: light-dark(oklch( 98% 0.005 240), oklch(18% 0.025 240));
  --surface-2: light-dark(oklch( 95% 0.01  240), oklch(24% 0.03  240));
  --surface-3: light-dark(oklch( 92% 0.015 240), oklch(30% 0.035 240));
}
```

Light mode surfaces step **down** in lightness with elevation; dark mode surfaces step **up**. Shadow
does not work on dark backgrounds.

**`light-dark()` reads `color-scheme`, not `prefers-color-scheme`.** Without `color-scheme: light dark`
on `:root` it always returns the light value - the single most common bug.

Also required: `color-scheme: light dark` auto-themes scrollbars and native form controls, which your
custom properties cannot reach.

### Support explicit user override

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* dark values */ }
}
```

Without the `:not()` guard, a user on a dark OS can never manually select light.

---

## 3. Contrast is a build-time requirement

**WCAG 2.2 is the enforceable standard.** APCA / WCAG 3 Lc values are not - see
`docs/frontend/09-caveats-and-volatile-status.md` section 1.

- [ ] Body text **4.5:1**
- [ ] Large text (>=18pt, or >=14pt bold) **3:1**
- [ ] UI component boundaries, focus rings, icons **3:1** (SC 1.4.11)
- [ ] Checked in **both** light and dark mode
- [ ] Never rely on color alone to convey state

**Automate it.** Hardcoded hex colors are how contrast regressions ship. A stylelint rule banning raw
colors in components forces everything through tokens, where a single change is verifiable once.

---

## 4. Spacing

Two layers, always:

```css
/* Primitive scale - 4pt based */
--space-3xs: 0.25rem;  --space-2xs: 0.5rem;
--space-xs:  0.75rem;  --space-sm:  1rem;
--space-md:  1.5rem;   --space-lg:  2rem;
--space-xl:  3rem;     --space-2xl: 4rem;

/* Semantic layer - components use ONLY these */
--space-inline-gap:    var(--space-xs);
--space-component-pad: var(--space-sm);
--space-section:       var(--space-2xl);
```

**T-shirt sizes for spacing are an anti-pattern.** They force every component to know the scale and
break when it is re-scaled.

### Density as a token override

```css
.density-compact     { --space-inline-gap: var(--space-2xs); --control-height: 2rem; }
.density-comfortable { --space-inline-gap: var(--space-xs);  --control-height: 2.75rem; }
```

No component changes when density changes.

---

## 5. Typography tokens

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

- Both `clamp()` bounds in **`rem`**, so 200% zoom works (WCAG SC 1.4.4).
- Fluid sizing for display/section headings; **stable sizing for body and control text**.
- Body line-height 1.5-1.65 unitless.
- Measure 60-70ch. Remember `ch` is the "0" glyph width, not a character count.

---

## 6. Motion tokens

```css
--duration-instant: 50ms;
--duration-quick:   150ms;
--duration-normal:  250ms;
--duration-slow:    400ms;

--ease-out:    cubic-bezier(0.16, 1, 0.3, 1);   /* enters */
--ease-in:     cubic-bezier(0.7, 0, 0.84, 0);   /* exits */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
```

Motion is part of the design system, not per-component magic numbers. Exits should be faster than
entries.

---

## 7. Export format - DTCG

```json
{
  "$description": "Design tokens",
  "color": {
    "$type": "color",
    "accent": {
      "$value": "oklch(60% 0.25 285)",
      "$description": "Primary action color"
    }
  }
}
```

Rules from the spec (DTCG Format 2025.10, Final Community Group Report 2025-10-28):

- `$value` is **reserved** - you cannot name a token `$value`
- Group names should **NOT** imply purpose
- `$type` is inherited into nested groups
- `$description` should be written for tooltips, not humans reading JSON
- `$deprecated` accepts `true`/`false`/an explanation string
- `$root` gives a group a base value
- JSON Pointer `$ref` (RFC 6901) is **required** alongside curly-brace `{group.token}` references
- Circular references must be detected and throw

**It is not a W3C Standard** - it is a Community Group Report under the CFSA.

---

## 8. Pipeline

```
Figma Variables (modes)
   ↓  Tokens Studio / Style Dictionary / Terrazzo
tokens.json  (DTCG)
   ↓
CSS custom properties (runtime source of truth)  +  TS types  +  native platforms
```

**CSS custom properties are the single runtime source.** If TypeScript needs a value, reference
`var(--token)` - never a duplicated raw value. Two sources of truth will drift.

---

## 9. Shadow DOM note

Custom properties **inherit** into shadow roots; targeted overrides **do not**. So shadow components
must declare tokens as overridable:

```css
:host {
  --card-bg: var(--card-bg-fallback, var(--system-bg));   /* token, not final value */
  background: var(--card-bg);
}
```

Values that must not be overridable go on an internal element. `@layer` does **not** solve this.

Grounding: `docs/frontend/08-patterns-and-craft.md` section 3.

---

## 10. Audit checklist

- [ ] No component references a primitive token
- [ ] No raw hex / px / ms values in component code
- [ ] Every color is OKLCH, not HSL
- [ ] Brand hue derived tokens exist (hover, subtle, active)
- [ ] `color-scheme: light dark` set on `:root`
- [ ] Dark surfaces step **up** in lightness with elevation
- [ ] Explicit theme override works (`:not([data-theme="..."])` guard)
- [ ] Contrast verified in both modes: 4.5:1 text, 3:1 non-text
- [ ] `clamp()` bounds in `rem`, checked at 200% zoom
- [ ] Spacing has a semantic layer
- [ ] Density modes implemented as token overrides
- [ ] Motion tokens exist and are used
- [ ] Tokens exported in DTCG format with `$description`
- [ ] CSS is the only runtime source of values