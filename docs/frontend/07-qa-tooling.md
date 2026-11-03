# QA & Tooling

> Part of the `webpage-design` knowledge base. Research compiled October 2026.
> The goal: catch regressions automatically so humans spend their time on what only humans can check.

---

## 1. Visual regression testing

| Tool | Notes |
|---|---|
| **Playwright snapshots** | Free, in CI already for E2E, good defaults |
| **Chromatic** | Strong per-PR visual review workflow, Storybook-integrated |
| **Percy** | Cross-browser matrix, commercial |

### Making snapshots stable

Flaky visual tests get muted, and muted tests catch nothing. Freeze everything that varies:

```ts
await page.emulateMedia({ reducedMotion: 'reduce' });   // stop animations
await page.addStyleTag({ content: `*, *::before, *::after {
  animation-duration: 0s !important;
  transition-duration: 0s !important;
  caret-color: transparent !important;
}` });
await page.evaluate(() => document.fonts.ready);        // wait for fonts
```

Then control the rest:

- **Clock** - freeze timers and relative dates
- **Randomness** - seed any random data
- **Viewport** - fix it explicitly
- **Network** - stub API responses rather than hitting live services
- **Scrollbars** - `scrollbar-gutter: stable` or a hidden-scrollbar environment
- **Locale/timezone** - pin both

**Review threshold discipline.** Decide up front what counts as a failure. If everything does, the
test will be ignored within a week.

---

## 2. Linting and static analysis

### Accessibility linting

```js
// eslint.config.js
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  jsxA11y.flatConfigs.strict,
  {
    rules: {
      'jsx-a11y/no-autofocus': ['error', { ignoreNonDOM: true }],
      'jsx-a11y/no-static-element-interactions': 'error',
      'jsx-a11y/prefer-native-element': 'error',
    },
  },
];
```

Lint catches the mechanical errors. It cannot tell you whether focus *order* makes sense.

### Enforce Baseline CSS in CI

ESLint can lint CSS and fail on non-Baseline features. This turns "we should avoid experimental CSS"
from a review comment into a build failure:

```js
export default [
  {
    files: ['**/*.css'],
    language: 'css/css',
    rules: {
      'baseline/feature-is-baseline': 'error',
    },
  },
];
```

### Stylelint

Useful custom rules beyond the defaults:

- **No raw hex colors** in components - force `var(--token)`. This is how token adoption stays high.
- **No hardcoded durations** - force `var(--duration-token)`.
- **No px in `font-size`** - force `rem`.

Those three rules do more for design system consistency than any amount of documentation.

```js
// .stylelint.config.js
export default {
  rules: {
    'custom-property-pattern': '^[a-z][a-z0-9]*(-[a-z0-9]+)*$',
    'declaration-block-no-redundant-longhand-properties': true,
    'selector-not-notation': 'complex',
  },
};
```

### TypeScript strictness for UI code

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

`noUncheckedIndexedAccess` catches the classic array-index UI bug. `exactOptionalPropertyTypes` catches
the "I passed `undefined` where the type wanted `null`" class of errors.

---

## 3. Browser and device testing

### Cross-browser

Target the browsers you actually support, explicitly. "All modern browsers" is not a decision.

| Browser | Use |
|---|---|
| Chrome / Edge | Primary development target |
| Safari | **Always test.** Different engine, and historically the source of new-feature bugs |
| Firefox | Test if in your support matrix |
| Mobile Safari | Cannot be approximated by desktop emulation |

**CI matrix:** Chromium, WebKit (not "Safari" - Playwright's WebKit is a good proxy), and Firefox.
Run at minimum on every PR; full matrix on release branches.

### Real viewports, not device emulation

`page.setViewportSize` gives you a viewport. It does **not** give you:

- Real device pixel ratio
- Real touch behavior
- Real font rendering
- Real network conditions
- Real CPU/memory constraints

Test responsive breakpoints at true viewports (Playwright supports per-project viewport + DPR), and do
periodic passes on physical devices. Emulated DPR in particular produces misleadingly crisp or blurry
screenshots.

### Responsive testing that catches real problems

Test the boundaries, not just common widths:

- 320px - the narrowest phone still in use
- Exactly at each container query breakpoint +/- 1px
- 200% zoom (WCAG SC 1.4.4)
- Text-only zoom (browser minimum font size setting)
- Very long content - a 200-character unbroken username in a fixed-width avatar
- Empty states - no data at all
- Error states

---

## 4. Typed design token pipelines

### From Figma to code

```
Figma Variables (modes)
   ↓  Tokens Studio / Style Dictionary / Terrazzo
tokens.json  (DTCG format)
   ↓
CSS custom properties  +  TypeScript  +  Swift/Kotlin  +  Figma plugin
```

### Keep CSS as the single runtime source

```css
:root {
  --color-accent: oklch(60% 0.25 285);
}
```

```ts
// Generated or typed to match - never hand-maintained
export const tokens = {
  colorAccent: 'var(--color-accent)',
} as const;
```

**Never duplicate raw values in JS.** If TypeScript needs a value, reference the CSS variable. Two
sources of truth will drift.

### DTCG format

```json
{
  "$description": "Design tokens",
  "color": {
    "$type": "color",
    "accent": {
      "$value": "oklch(60% 0.25 285)",
      "$description": "Primary action color"
    },
    "surface": {
      "$root": { "$value": "oklch(100% 0 0)" },
      "raised": { "$value": "{color.surface.$root}" }
    }
  }
}
```

Per the DTCG spec: `$value` is reserved, group names should **not** imply purpose, `$type` inherits
into nested groups, and JSON Pointer `$ref` is required alongside curly-brace references.

---

## 5. CI gates worth building

| Gate | Tool | Blocks |
|---|---|---|
| Accessibility | `axe-core` in Playwright | Known a11y violations |
| Visual diff | Playwright / Chromatic | Unintended appearance changes |
| Performance budget | Lighthouse CI | LCP/INP/CLS regressions |
| Bundle size | size-limit / bundlesize | Dependency bloat |
| Baseline CSS | ESLint CSS plugin | Experimental features |
| Token lint | stylelint custom rules | Hardcoded values |
| Type safety | `tsc --noEmit` | Type regressions |
| Cross-browser | Playwright matrix | Engine-specific breakage |

Set budgets from **current production p75**, with a small allowed regression (5-10%). A budget set
aspirationally high will just be ignored.

---

## 6. What automation cannot do

Be explicit, so nobody mistakes a green pipeline for quality:

- Whether focus **order** makes logical sense
- Whether alt text is **meaningful** (as opposed to present)
- Whether error messages are **actionable**
- Whether the flow is **comprehensible** to a screen reader
- Whether the visual hierarchy makes sense at all
- Whether focus is **restored** correctly on close
- Whether a11y is **genuinely** usable (vs technically compliant)

Automated a11y tools detect **less than 50%** of accessibility errors. Budget manual time accordingly.

---

## Sources

- Playwright: https://playwright.dev/
- Playwright visual comparisons: https://playwright.dev/docs/test-snapshots
- Lighthouse CI: https://github.com/GoogleChrome/lighthouse-ci
- stylelint: https://stylelint.io/
- eslint-plugin-jsx-a11y: https://github.com/jsx-eslint/eslint-plugin-jsx-a11y
- axe-core: https://github.com/dequelabs/axe-core
- Accessibility Insights: https://accessibilityinsights.io/
- Style Dictionary: https://styledictionary.com/
- DTCG Format 2025.10: https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/