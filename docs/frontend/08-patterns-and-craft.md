# Patterns & Craft

> Part of the `webpage-design` knowledge base. Research compiled October 2026.
> Motion, hydration strategies, shadow DOM theming, TypeScript patterns, file organization.

---

## 1. Motion

### The only rule that matters

**Animate `transform` and `opacity`.** Also acceptable: `filter`, `clip-path`.

These are compositor-only. Animating `width`, `height`, `top`, `left`, `margin`, or `padding` forces
layout on every frame - on the main thread, for the whole page.

```css
/* Bad - layout every frame */
.drawer { margin-inline-start: -100%; transition: margin-inline-start 250ms; }
.drawer.open { margin-inline-start: 0; }

/* Good - compositor only */
.drawer { translate: -100% 0; transition: translate 250ms; }
.drawer.open { translate: 0 0; }
```

### Library landscape

| Library | Size | License | Notes |
|---|---|---|---|
| **Motion** (motion.dev) | ~18 KB core, ~2.6 KB mini, +15 KB React | MIT | Renamed from Framer Motion 12 Nov 2024 |
| **GSAP** | ~23.5 KB | **Not MIT** | In production since 2008, deepest timeline expressiveness |
| **Web Animations API** | 0 | native | The baseline; Motion delegates to it |

Motion advantages: hardware-accelerated animations that keep running even when the main thread is
busy; deferred keyframe resolution (batching measurement into one operation).

**Trade-off:** GSAP has the more expressive timeline model and mature plugin ecosystem, but its
licensing is not MIT and imports pull in the whole library. Motion has the better React story and
layout animations that go beyond FLIP.

**Consider whether you need a library at all** for simple transitions and enter/exit animations -
native CSS with `@starting-style` and `transition-behavior: allow-discrete` covers a lot.

### Springs vs duration

- **Springs** for direct manipulation: drag, swipe, gesture-following, anything the user is holding.
- **Duration + easing** for discrete state changes: enter, exit, expand, color.

A spring has no fixed duration - it settles. That is why it feels physical for gesture work and wrong
for a simple fade.

### Reduced motion is required, not optional

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 2. Hydration strategies

### The honest tradeoff

| | **Astro** (islands, `client:*`) | **Qwik** (resumability) |
|---|---|---|
| JS at load | Zero for static; full bundle per island | ~1 KB loader; no component code until interaction |
| Scales with | Number/size of hydrated islands | Size of serialized state (HTML grows) |
| Boundary | Explicit directive, visible in template | Implicit - defers by default |
| Failure mode | Nothing stops `client:load` overuse | No obvious way to accidentally ship a big bundle |
| Cost | Per-island JSON props | Whole reactive graph inlined into HTML |
| Framework freedom | React, Svelte, Solid, Vue, Preact per island | Single Qwik model (`component$` / `$`) |

**Astro's tax is discipline.** The boundary is visible, teams reuse existing components and mental
models, but the framework will not warn you when an island's runtime dwarfs its interactivity.

**Qwik's tax is the `$` mental model.** You think in serializable boundaries and understand what a
closure captures. Its React interop can host third-party components, but doing so **reintroduces
React's runtime and forfeits resumability for that subtree** - a deliberate escape hatch, not a
default.

Astro directives: `client:load`, `client:idle`, `client:visible`, `client:media`, `client:only`.

```astro
<MobileMenu client:load />        <!-- needs immediate interactivity -->
<Comments client:visible />       <!-- below-fold, can wait -->
<AnalyticsChart client:idle />    <!-- heavy, wait until idle -->
<ChatWidget client:only="react" /> <!-- third-party, never SSR it -->
```

**Do NOT do this:**

```astro
<Button client:load>Click</Button>   <!-- a button is not an island -->
```

### When islands do not fit

Highly interactive web applications, real-time collaborative tools, complex state-dependent UIs.

> **Caveat:** the numeric performance comparisons circulating for Astro vs Qwik are from secondary
> explainer content, not controlled benchmarks. The *direction* is reliable; the magnitudes are
> illustrative. See `09-caveats-and-volatile-status.md` section 9.

---

## 3. Shadow DOM token theming

The genuinely counterintuitive problem: **custom properties inherit across shadow boundaries, but
targeted overrides do not.**

### The mechanics

```css
/* this token set on :root reaches inside the shadow tree by inheritance */
:root { --card-bg: #f00; }
```

```css
/* this does NOT reach the internal element that uses it */
my-card { --card-bg: #00f; }
```

Document selectors do not cross the boundary. Only **inherited** properties do.

### The `:host` trap

`:host` has the **same specificity as `:root`** (0,1,0) - but because it *declares* the variable
directly on the host, it **wins over the inherited value.** A class or element selector in the Light
DOM overrides `:host`.

### The cascade-order surprise

A consumer's `my-card { padding: 0 }` weighs **less** than the component's `:host { padding: 1rem }` -
and still **wins**, because normal declarations from the document tree sort *after* those from a
shadow tree.

**Specificity decides within a tree; tree order decides across the boundary.**

### The correct pattern - never fight the cascade

```css
/* component: declare the TOKEN with a fallback, not the final value */
:host {
  --card-bg: var(--card-bg-fallback, var(--system-bg));
  background: var(--card-bg);
}
```

The consumer's token wins **by inheritance**, not by specificity competition.

**Values that genuinely must not be overridable belong on an internal element**, where the consumer
cannot address them at all.

### `@layer` does not help

### `*` and `:defined`

Rupert's refined solution uses `*` (specificity 0,0,0,0) in the theme sheet to beat `:host`. His
caveat: Tailwind's Preflight already uses `*` for `padding: 0; margin: 0`, and that side effect is
precisely what is needed here. An earlier `:defined` recommendation was corrected after Web Components
CG feedback as confusing inheritance with specificity.

### Future: the `inherit()` function

Already specified, not yet implemented:

```css
:host {
  --card-bg: inherit(--card-bg, var(--system-bg));
}
```

This would let a component control inheritance *inside* the shadow root, solving the problem cleanly.

### Structural styling with `::part`

```css
my-card::part(header) { font-weight: 700; }
my-card::part(body)   { padding: var(--space-sm); }
```

**Restrict `part` names to high-level structural elements.** Overexposing parts creates a brittle,
hard-to-version public API. Use custom properties for granular theming, `::part` for structure, and
document both.

### One more structural note

Each shadow tree needs its **own reset** - document styles do not apply inside. This is a strong
argument for a **shared constructable stylesheet adopted by every component** rather than a reset
duplicated per template.

Source: https://daverupert.com/2026/08/how-to-pierce-your-shadow-belly-button/ (Aug 2026)

---

## 4. TypeScript patterns for UI

### Discriminated unions for variants

```ts
type ButtonVariant = 'default' | 'outline' | 'destructive';

interface ButtonProps extends React.ComponentProps<'button'> {
  variant?: ButtonVariant;
}
```

For genuinely different prop shapes, use a real discriminated union so impossible combinations fail
to compile:

```ts
type DialogProps =
  | { open: true; onOpenChange: (open: boolean) => void; children: React.ReactNode }
  | { open?: false; onOpenChange?: never; children?: never };
```

### `as const` arrays as the single source of truth

```ts
const SIZES = ['sm', 'md', 'lg'] as const;
type Size = (typeof SIZES)[number];

// Adding 'xl' to the array makes every exhaustive switch fail to compile
function exhaustive(x: never): never {
  throw new Error(`Unhandled: ${x}`);
}

function handleSize(size: Size) {
  switch (size) {
    case 'sm': return 'small';
    case 'md': return 'medium';
    case 'lg': return 'large';
    default: return exhaustive(size);   // compile error if a case is missing
  }
}
```

### Type-safe polymorphic components

```tsx
type PolymorphicProps<T extends React.ElementType, P> =
  P & Omit<React.ComponentPropsWithoutRef<T>, keyof P> & { as?: T };

function Text<T extends React.ElementType = 'span'>({
  as, ...rest
}: PolymorphicProps<T, { variant?: 'body' | 'label' }>) {
  const Component = as ?? 'span';
  return <Component {...rest} />;
}
```

### `satisfies` for token maps

```ts
const spacing = {
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
} satisfies Record<string, string>;

// Still gets autocomplete on the keys, still errors on typos
type SpacingKey = keyof typeof spacing;
```

---

## 5. File organization

### Colocate

```
components/
  Dialog/
    Dialog.tsx          # the primitive
    Dialog.styles.css
    Dialog.test.tsx
    index.ts
  index.ts              # the public barrel
```

**Barrel files are not free.** They hurt tree-shaking and build times, and they create import cycles
that are painful to untangle. Use them only at your **public API boundary**, not internally.

### Import boundaries

- `components/` must not import from `pages/` or `features/`.
- Each layer may only import from the layer above it (see the three layers in `03-components.md`).
- Enforce with an ESLint `no-restricted-imports` rule.

### Naming

| Thing | Convention |
|---|---|
| Component file | `PascalCase.tsx` (matches the export) |
| Hook | `useThing.ts` |
| Token file | `tokens.css` / `tokens.json` |
| Test | `Thing.test.tsx` colocated, or `__tests__/` for integration |
| Type-only file | `types.ts` |

---

## 6. Documentation

Storybook or equivalent, with these as the required stories per component:

- **All variants and sizes** - a visual matrix
- **All states** - default, hover, focus-visible, active, disabled, loading, error
- **Keyboard and screen reader notes** - what a user of an AT should expect
- **Do's and don'ts** - the usage rules that cannot be enforced by types

The "don'ts" story is the highest-value one. Most component libraries fail because consumers do not
know the rules.

---

## Sources

- Motion vs GSAP: https://motion.dev/docs/gsap-vs-motion
- Motion docs: https://motion.dev/docs
- Web Animations API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API
- Astro client directives: https://docs.astro.build/en/reference/directives-reference/
- Astro islands: https://docs.astro.build/en/concepts/islands/
- Qwik resumability: https://qwik.dev/docs/concepts/resumable/
- Shadow DOM tokens: https://daverupert.com/2026/08/how-to-pierce-your-shadow-belly-button/
- ::part: https://developer.mozilla.org/en-US/docs/Web/CSS/::part
- inherit(): https://developer.mozilla.org/en-US/docs/Web/CSS/inherit()