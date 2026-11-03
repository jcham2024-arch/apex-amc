# CSS & Layout: The Modern Web Platform

> Part of the `webpage-design` knowledge base. Research compiled October 2026.
> **Check Baseline status before using anything here.**

---

## 1. Baseline literacy

Two stages (https://web.dev/baseline):

- **Newly available** - supported by all core browsers (interoperable).
- **Widely available** - 30 months after Newly available. Safe everywhere.

Named sets: **Baseline 2025**, **Baseline 2026**. Status appears on MDN property pages, Can I Use,
and Chrome DevTools' Elements panel. **ESLint can enforce Baseline CSS features**, so "no
experimental CSS" can be a CI gate.

### Quick reference table

| Feature | Status (as of Oct 2026) | Notes |
|---|---|---|
| Container queries (`@container`) | **Widely available** (Feb 2023) | Safe |
| Cascade layers (`@layer`) | Widely available | Safe |
| `:has()` | Widely available | Safe |
| `:where()` / `:is()` | Widely available | Safe |
| `oklch()` / `color-mix()` | Widely available | Safe |
| `light-dark()` | Widely available | Safe |
| Popover API | Widely available | Safe |
| `@property` registered custom props | Widely available | Safe |
| `text-wrap: balance` / `pretty` | Widely available | Safe |
| `@scope` | Newly available | Safari 26.2 added `@scope(:host)` |
| CSS anchor positioning | **Newly available (Jan 2026)** | Safari 26.0+, Firefox 147+ |
| `position-area` | **Newly available (Jan 2026)** | Was `inset-area` in Chromium |
| `@position-try` | **Newly available (Jan 2026)** | |
| `contrast-color()` | **Newly available (April 2026)** | |
| Scroll-driven animations | **Limited availability** | Firefox is the blocker - see below |
| Declarative Shadow DOM | Newly available | |
| `field-sizing` | Varies | Verify |
| `interpolate-size` | Newer still | Verify |
| CSS masonry | Experimental | Do not ship |

---

## 2. Container queries - the biggest single upgrade

**Widely available since February 2023.** https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_size_and_style_queries

Media queries respond to the **viewport**. Container queries respond to **the space a component
actually got**. This is the difference between a reusable component and a page-specific one.

```css
.card-wrapper { container-type: inline-size; }

@container (min-width: 30rem) {
  .card { grid-template-columns: 12rem 1fr; }
}
```

### Container query units

| Unit | Relative to |
|---|---|
| `cqw` | 1% of query container's width |
| `cqh` | 1% of query container's height |
| `cqi` | 1% of **inline** size (usually what you want - respects writing-mode) |
| `cqb` | 1% of block size |
| `cqmin` | smaller of cqi / cqb |
| `cqmax` | larger of cqi / cqb |

```css
.card-title { font-size: clamp(1rem, 4cqi, 1.5rem); }
```

### Style queries - theme by custom property

```css
@container style(--density: compact) {
  .row { padding-block: 0.25rem; }
}
```

Currently only **custom properties** are supported as style features (with or without a value).

### Gotchas

- Queryable size features: `width`, `height`, `inline-size`, `block-size`, `aspect-ratio`,
  `orientation`. Nothing else.
- `container-type: size` **applies containment** - a performance necessity, and it prevents infinite
  layout loops. You get containment for free; you do not opt in.
- `layout`/`style` containment needs Safari 15.4+. **Firefox still lacks style containment**, which
  matters if you depend on style queries.
---

## 3. Cascade layers and specificity

```css
@layer reset, tokens, base, components, utilities;

@layer reset {
  *, *::before, *::after { box-sizing: border-box; }
}
```

Declare the order **once, up front**. Later layers always beat earlier ones, regardless of
specificity. This eliminates almost all specificity wars.

### `:where()` for zero-specificity

```css
:where(h1, h2, h3) { margin: 0; }   /* specificity 0,0,0 - utilities always win */
h1, h2, h3        { margin: 0; }    /* specificity 0,0,1 - may lose to a utility */
```

Use `:where()` for anything that should yield to utilities. Use `:is()` when you *want* the highest
specificity of the list.

### `@scope` - style scoping without shadow DOM

```css
@scope (.card) {
  img { border-radius: 8px; }
}
```

Limits rules to a subtree without the cost of shadow DOM encapsulation. Safari 26.2 added
`@scope(:host)` support and fixed `&` inside `@scope` to correctly act like `:where(:scope)`.

---

## 4. State selectors that remove JavaScript

```css
/* parent-aware - the killer use of :has() */
.card:has(:focus-visible) { outline: 2px solid var(--focus); }
.card:has(> img)          { aspect-ratio: 16 / 9; }

/* focus management */
:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
:focus-within  { /* any descendant focused */ }

/* state from native widgets */
details[open] summary { rotate: 180deg; }
input:checked ~ .toggle-slider { translate: 100% 0; }
dialog:popover-open { opacity: 1; }

/* interactive states */
:hover, :active, :target, :disabled
```

`:focus-visible` over `:focus` - it only shows rings for keyboard-like interaction, which is
exactly what WCAG 2.4.7 asks for and what users prefer.

---

## 5. Native overlays - no JS library needed

`<dialog>`, the Popover API, `inert`, and CSS anchor positioning handle what previously required
libraries.

### `<dialog>` gives you for free

Top-layer rendering, focus trapping, Escape-to-close, and `::backdrop`. This replaces most
dialog/modal libraries.

```html
<dialog id="confirm">
  <form method="dialog">
    <h2>Delete file?</h2>
    <button value="cancel">Cancel</button>
    <button value="confirm">Delete</button>
  </form>
</dialog>
```

```js
document.getElementById('confirm').showModal();
```

**Still on you:** focus restoration to the trigger element, and ensuring sticky headers do not
obscure focused content (WCAG 2.4.11).

### Popover API

```html
<button popovertarget="tip">Trigger</button>
<div id="tip" popover>Content</div>
```

Top-layer without modal semantics, no focus trap, non-blocking. Correct choice for tooltips,
popovers, and menus.

---

## 6. CSS anchor positioning - shipped, but young

**Baseline 2026 Newly available (January 2026).** Safari 26.0+ (shipped 2025-09-15), Firefox 147+.

### The best trick: let popover do the work

Using the Popover API **automatically** sets `position` and creates the anchoring relationship via
an implicit anchor element. With correct markup you need **neither** `anchor-name` **nor**
`position-anchor`:

```css
.tooltip {
  position-area: block-start;     /* above the trigger, auto-centered */
  position-try: flip-block;       /* flip below if it would overflow */
  max-inline-size: 20em;
}
```

```html
<button popovertarget="tip">Trigger</button>
<div id="tip" popover>Content</div>
```

### Prefer `position-area` over manual `anchor()` arithmetic

WebKit's own guidance: the `position-area` syntax came from a WebKit proposal *specifically because*
developers found manually lining up edges with `anchor()` overwhelming. Use `anchor()` only for
cases `position-area` cannot express - multi-anchor, animated anchors, or exact pixel math.

```css
.menu {
  position-anchor: --trigger;
  position-area: bottom span-x-end;
  position-try-fallbacks: flip-x, flip-y, flip-x flip-y, bottom, top;
  min-inline-size: anchor-size(width);   /* match the trigger's width */
}
```

### Known maturity issues

Safari fixed a long list of bugs across 26.2-26.4, which tells you what to watch for:

- Style resolution loops when a `position-try` box sits inside a `display: none` ancestor.
- `fixed`-positioned boxes with `position-area` incorrectly included in scrollable containing block
  math.
- `@starting-style` entry animations only firing on the **first** transition when interacting with
  anchor positioning (fixed in 26.4).
- `position-area` in scrollable containers using only initial scrollport bounds (fixed in 26.4).

**Note:** Safari 26.2 changed fallback ordering - it now tries the **last successful** option first,
then the original style, then remaining options. Earlier implementations differed.

---

## 7. Entry/exit animation for native overlays

`@starting-style` + `transition-behavior: allow-discrete` lets `display: none` elements animate in
and out. This is what makes native `<dialog>` and popovers feel designed rather than abrupt.

```css
dialog {
  opacity: 0;
  translate: 0 1rem;
  transition: opacity var(--duration-quick) var(--ease-out),
              translate var(--duration-quick) var(--ease-out),
              display var(--duration-quick) allow-discrete,
              overlay var(--duration-quick) allow-discrete;
}

dialog[open] { opacity: 1; translate: 0 0; }

/* the "from" state */
@starting-style {
  dialog[open] { opacity: 0; translate: 0 1rem; }
}

dialog::backdrop { background: rgb(0 0 0 / 0); transition: background var(--duration-quick); }
dialog[open]::backdrop { background: rgb(0 0 0 / 0.5); }
@starting-style { dialog[open]::backdrop { background: rgb(0 0 0 / 0); } }
```

`allow-discrete` is what makes `display` and `overlay` animatable. Without it, the element vanishes
before the exit transition can run.

---

## 8. View Transitions

For animated route and state changes:

```css
::view-transition-old(root), ::view-transition-new(root) { animation-duration: var(--duration-quick); }

.card { view-transition-name: card-1; }   /* unique per element */
```

- Same-document and cross-document are both supported.
- `@view-transition-name` must be **unique per element** or transitions silently fail.
- `view-transition-class` groups related elements; typed transitions are also available.
- **Treat as progressive enhancement.** It does not replace presence handling for app-like UIs,
  where you need exit animations for elements being removed from state.

---

## 9. Scroll-driven animations

**MDN status: Limited availability.** `animation-timeline` is not Baseline because it does not work
in all widely-used browsers. **Firefox is the blocker** - behind
`layout.css.scroll-driven-animations.enabled`, off by default.

Safari **did** ship scroll-driven animations in Safari 26.0 (2025-09-15), listed as a headline
WebKit feature. So the realistic picture is Chrome/Edge 115+, Safari 26+, Firefox behind a flag.

### Syntax

```css
/* scroll progress */
.progress { animation-timeline: scroll(root block); }

/* view progress - animate as element moves through the scrollport */
.reveal {
  animation: fade-in linear both;
  animation-timeline: view();
  animation-range: entry 0% cover 40%;
}

/* named timeline */
.scroller { scroll-timeline: --main block; }
.child { animation-timeline: --main; }
```

Units: `scroll()` (root / nearest / self + direction) and `view()` (baseline axis, auto insets).

### Three gotchas that will bite you

**1. The `animation` shorthand RESETS `animation-timeline`.** It is a reset-only value in the
shorthand, so you *cannot* set it there. Declare `animation-timeline` **after** any `animation`
shorthand.

```css
/* RIGHT - always declare animation-timeline last */
.element { animation: fade linear both; }
.element { animation-timeline: view(); }
```

**2. `@supports` is parse-time and never re-evaluates.** Loading a polyfill later does not
retroactively activate guarded CSS. Worse, a polyfill patches the object model, not the parser - so
a polyfilled engine still evaluates the CSS `@supports` guard as `false`. Polyfill-targeted styles
must live **outside** the guard.

**3. Draft-era spellings fail closed everywhere.** Guards written from early articles, such as
`@supports (scroll-timeline: root)`, test a property spelling that **shipped in no browser**.
Current longhands are `scroll-timeline-name` / `scroll-timeline-axis`. Copying a 2023-era snippet
silently disables your enhancement even in engines that support it.

### Recommendation

---

## 10. Performance-critical CSS

```css
/* Long lists - skip rendering off-screen content */
.virtual-section {
  content-visibility: auto;
  contain-intrinsic-size: auto 40rem;   /* prevent scrollbar jumping */
}

/* Promote only when needed, remove after */
.animating { will-change: transform; }  /* apply briefly, then remove */
```

**`will-change` is a promise.** Leaving it on permanently wastes GPU memory - the classic
"permanently promoted layer" leak.

**Paint-expensive properties** (cannot be GPU-composited like `transform`/`opacity`):
`box-shadow` with large blur, `filter`, `backdrop-filter`, `border-radius` on large elements,
gradients over large areas.

**Avoiding layout thrash:** never interleave reads and writes. Batch all reads, then all writes, or
schedule the write in the next `requestAnimationFrame`.

**CSS nesting** has shipped, but keep nesting shallow. Deep nesting hurts readability and makes
dev-tool inspection harder.

---

## 11. Sticky, scroll, and overflow

```css
/* sticky header that does not overlap focus - WCAG 2.4.11 */
.sticky-header {
  position: sticky;
  inset-block-start: 0;
  z-index: 10;
  scroll-margin-block-start: var(--header-height);  /* anchored targets clear it */
}

/* scroll targets land below a sticky bar */
:target { scroll-margin-block-start: calc(var(--header-height) + 1rem); }

/* don't allow scroll chaining / bounce on inner scrollers */
.scroller {
  overscroll-behavior: contain;
  scrollbar-gutter: stable;    /* reserve space so layout doesn't shift */
}

/* scroll-snap */
.gallery {
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
}
.gallery > * { scroll-snap-align: center; }

@media (prefers-reduced-motion: reduce) {
  .gallery { scroll-behavior: auto; }   /* do not force smooth scrolling */
}
```

`scroll-margin` (on the target) is the correct tool; `scroll-padding` (on the scroller) is the
alternative. Using one on the wrong element is the usual reason anchor links land under sticky
headers.

---

## 12. Sizing patterns worth reaching for

```css
/* intrinsic sizing */
.wrapper { inline-size: min(100%, 70rem); }        /* never overflow, never exceed */
.center  { margin-inline: auto; }
.chop    { inline-size: fit-content; }

/* grid patterns */
.grid-auto {
  display: grid;
  gap: var(--space-section);
  grid-template-columns: repeat(auto-fit, minmax(min(18rem, 100%), 1fr));
}
```

The `minmax(min(18rem, 100%), 1fr)` form is the important one - the inner `min()` prevents grid
overflow at narrow widths, which is a bug the naive `minmax(18rem, 1fr)` has.

**Flexbox essentials:** `gap` replaced margin hacks years ago. `min-inline-size: 0` on a flex child
overrides the `min-width: auto` default that prevents shrinking (the classic "flexbox won't shrink"
bug). `flex: 1 1 0` distributes space from zero; `flex: 1 1 auto` respects content size.

---

## Sources

- Baseline: https://web.dev/baseline
- Container queries (MDN): https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_size_and_style_queries
- Anchor Positioning L1: https://www.w3.org/TR/css-anchor-position-1/
- anchor positioning editor's draft: https://drafts.csswg.org/css-anchor-position-1/
- animation-timeline (MDN): https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timeline
- Scroll-driven animations (MDN): https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations
- WebKit Safari 26.0: https://webkit.org/blog/17333/webkit-features-in-safari-26-0/
- WebKit Safari 26.2 release notes: https://developer.apple.com/documentation/safari-release-notes/safari-26_2-release-notes
- WebKit Safari 26.3: https://webkit.org/blog/17798/webkit-features-for-safari-26-3/
- WebKit Safari 26.4: https://webkit.org/blog/17862/webkit-features-for-safari-26-4/
- Can I Use anchor positioning: https://caniuse.com/css-anchor-positioning
- content-visibility (web.dev): https://web.dev/articles/content-visibility