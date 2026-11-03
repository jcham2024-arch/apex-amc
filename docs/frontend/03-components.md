# Components & Framework APIs

> Part of the `webpage-design` knowledge base. Research compiled October 2026.
> Version-sensitive: see `09-caveats-and-volatile-status.md` for React/Tailwind/shadcn status.

---

## 1. Headless primitives - separate behavior from styling

The Radix / Base UI / React Aria / Headless UI philosophy: **the primitive owns behavior** (keyboard
interaction, focus management, ARIA, positioning); **you own the pixels**.

This is why accessibility gets baked in rather than retrofitted.

```tsx
// Primitive owns: focus trap, Escape, aria-modal, focus restoration, portal
<Dialog.Root>
  <Dialog.Trigger asChild>
    <button type="button">Open</button>   {/* you own the styling */}
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay className="overlay" />
    <Dialog.Content className="dialog">
      <Dialog.Title>Delete file?</Dialog.Title>
      <Dialog.Description>This cannot be undone.</Dialog.Description>
      <Dialog.Close asChild>
        <button type="button">Cancel</button>
      </Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

### Current ecosystem status

**July 2026: shadcn/ui made Base UI the default for new projects.** Radix remains fully supported
and is not deprecated. Base UI was at 1.6.0 with 6M+ weekly downloads.

Key mechanical difference: **`asChild` -> `render`**.

If you run `shadcn init` non-interactively in CI expecting Radix, pass `-b radix`.

Source: https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default

shadcn's own advice on switching is worth internalizing: *"the worst thing you can do for your
production app is switch component libraries."*

---

## 2. Data-attribute styling - the biggest API shift

Instead of a library computing class strings, the primitive **exposes state as data attributes** and
you style with CSS.

```html
<button
  class="btn"
  data-variant="outline"
  data-size="lg"
  data-state="open"
  data-orientation="horizontal"
>Save</button>
```

```css
.btn[data-variant="outline"] { border: 1px solid var(--border); }
.btn[data-size="lg"]         { min-block-size: 3rem; }
.btn[data-state="open"]      { background: var(--accent-subtle); }
```

### Why this is better

1. **Styling stays in CSS.** No string concatenation in JS.
2. **Variants compose additively** - `[data-variant]` and `[data-state]` are independent axes.
3. **Consumers can extend without forking** the component's class logic.
4. **No runtime cost.** The attribute is already there for the accessibility machinery.

---

## 3. Colocated variants (the shadcn/CVA pattern)

Export the variant function so consumers can reuse the styling **without** the behavior:

```tsx
import { cva } from 'class-variance-authority';

const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-2';

export const buttonVariants = cva(base, {
  variants: {
    variant: {
      default:     'bg-accent text-accent-fg',
      outline:     'border border-border bg-transparent',
      destructive: 'bg-danger text-danger-fg',
      ghost:       'bg-transparent',
    },
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4',
      lg: 'h-12 px-6 text-lg',
    },
  },
  defaultVariants: { variant: 'default', size: 'md' },
});

// Component
function Button({ variant, size, ...props }) {
  return <button className={buttonVariants({ variant, size })} {...props} />;
}

// Reuse the styling on an <a> without any button behavior
<a className={buttonVariants({ variant: 'outline', size: 'lg' })} href="/docs">Docs</a>
```

---

## 4. Composition over configuration

**Prop explosion is the design smell that precedes over-abstracted mega-components.**

When a component accumulates more than ~6 boolean props, the fix is almost always **composition**,
not another prop.

```tsx
// Prop explosion - unreadable, and grows forever
<Card
  showHeader showFooter showAvatar showBadge
  headerAlign="left" footerAlign="center"
  avatarSize="md" badgePosition="absolute"
  collapsible defaultCollapsed
/>

// Compound components - each concern stays local and independently testable
<Card>
  <Card.Header>
    <Card.Avatar src="/me.jpg" />
    <Card.Title>Jane Doe</Card.Title>
    <Card.Badge>Admin</Card.Badge>
    <Card.Menu />
  </Card.Header>
  <Card.Body>...</Card.Body>
  <Card.Footer>
    <Button variant="ghost">Cancel</Button>
    <Button>Save</Button>
  </Card.Footer>
</Card>
```

### When NOT to abstract

- **Rule of three.** Two similar things are coincidence; three is a pattern.
- Do not merge two components just because they share a few lines of markup.
- A component used once is a candidate for inlining, not abstraction.
- Prefer a small primitive that composes into a pattern over a configurable mega-component.

### The three layers

```
PRIMITIVE   Button, Input, Popover    - behavior + a11y, no opinion about content
COMPONENT   Dialog, Tabs, DataTable    - composed primitives for a real use case
PATTERN     Settings page, Checkout   - application-specific composition of components
```

---

## 5. React 19 as a component authoring platform

Released **5 December 2024**. https://react.dev/blog/2024/12/05/react-19

### `ref` is a regular prop - `forwardRef` is deprecated

```tsx
// React 19 - no forwardRef needed
function Input({ ref, ...props }: { ref?: React.Ref<HTMLInputElement> } & React.ComponentProps<'input'>) {
  return <input ref={ref} {...props} />;
}
```

- `forwardRef` still works but emits a **deprecation warning** and will be removed.
- TypeScript: `ref` is now included in `React.ComponentProps<'div'>`, so it "just works" when
  spreading component props.

### Form and async APIs

| API | Purpose |
|---|---|
| `useActionState(action, initialState)` | Returns `[state, action, isPending]`. Replaces `useFormState` - import from `"react"`, not `"react-dom"` |
| `useFormStatus()` | Pending status of the nearest ancestor `<form>`, available to any descendant - designed exactly for the design-system case that previously needed prop drilling or Context |
| `useOptimistic(name, updateFn)` | Renders the optimistic value during flight, **reverts automatically on error** |
| `use(resource)` | Reads a promise or context. Unlike a hook, **can be called conditionally** |
| `<form action={fn}>` | Passing a function uses Actions and resets the form automatically |

Actions give you: pending state from the start of the request, optimistic updates, and error handling
that reverts optimistic values and can render Error Boundaries.

### Server-first

- **Server Components** are stable. Components run on the server and ship **zero JS** unless marked
  `"use client"`.
- **Server Actions** (`"use server"`) are async functions the framework turns into RPC endpoints.
- **Metadata hoisting** - `<title>`, `<meta>`, `<link>` render inline regardless of where they appear
  in the tree.

### Asset loading APIs

`preload`, `preinit`, `prefetchDNS`, `preconnect`.

### Gotchas

- **Ref callbacks may now return a cleanup function.** Returning anything else (including an implicit
  `undefined` from a `max()`-style body) is an error in React 19.
- **Server-first is now the default rendering model.** If you are starting fresh, do not opt into
  client components "just in case."
- Actions require a framework with RSC support (Next.js 15+, Remix, etc.).

---

## 6. Tailwind v4

**v4 is the default for new projects.** The `tailwind.config.js` is no longer auto-detected.

```css
/* CSS-first configuration - tokens become native CSS custom properties */
@import "tailwindcss";

@theme {
  --color-brand:      oklch(60% 0.25 285);
  --font-heading:     "Satoshi", system-ui, sans-serif;
  --font-body:        "Inter", system-ui, sans-serif;
  --spacing-128:      32rem;
  --radius-lg:        0.75rem;
  --breakpoint-3xl:   1920px;
}
```

### Key changes from v3

| v3 | v4 |
|---|---|
| `@tailwind base/components/utilities` | `@import "tailwindcss"` |
| `tailwind.config.js` (auto) | `@theme` in CSS; JS config needs explicit `@config` |
| `@layer utilities { }` | `@utility name { }` |
| JS `variants` config | `@custom-variant` |
| JS plugin imports | `@plugin` |
| `safelist` | `@source inline()` |
| `--font-size-*` | `--text-*` |
| `--font-family-*` | **`--font-*`** |
| `--letter-spacing-*` | `--tracking-*` |
| `--width-*` | `--container-*` |

**Container queries are built in:**

```html
<div class="@container">
  <div class="@lg:grid-cols-2">...</div>
</div>
```

**Custom utilities sort by property count**, so a `.btn` can be overridden by other Tailwind
utilities without extra configuration:

```css
@utility content-auto { content-visibility: auto; }
```

### Watch for these diffs

- **Browser floor: Safari 16.4+, Chrome 111+, Firefox 128+.** No tool works around this. This is the
  constraint most likely to block an upgrade.
- Default border color became `currentColor` (was `gray-200`).
- `ring` changed from 3px blue to 1px `currentColor`.
- **`--font-family-*` -> `--font-*` is silent.** Using the old name produces **no utility at all** -
  no error, just nothing.

### CSS-in-JS in 2026

The trend has moved back toward native CSS. If choosing today:

- **Tailwind v4** - fast builds, tokens as CSS vars, container queries built in.
- **CSS Modules + vanilla-extract** - zero runtime, type-safe CSS.
- **Native CSS with layers + container queries** - increasingly viable for smaller projects.
- **CSS-in-JS** - accept the runtime cost, and note React 19 supports a `style` prop natively.

---

## Sources

- React 19: https://react.dev/blog/2024/12/05/react-19
- React useOptimistic: https://react.dev/reference/react/useOptimistic
- React useActionState: https://react.dev/reference/react/useActionState
- React useFormStatus: https://react.dev/reference/react-dom/hooks/useFormStatus
- Tailwind v4 upgrade guide: https://tailwindcss.com/docs/upgrade-guide
- Tailwind v4 theme: https://tailwindcss.com/docs/theme
- shadcn/ui Base UI default: https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default
- CVA: https://cva.style/
- Radix UI: https://www.radix-ui.com/
- Base UI: https://base-ui.com/
- React Aria: https://react-spectrum.adobe.com/react-aria/