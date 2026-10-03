# Performance

> Part of the `webpage-design` knowledge base. Research compiled October 2026.
> **Field data beats lab data.** Always.

---

## 1. Core Web Vitals - the exact numbers

Source: https://web.dev/articles/defining-core-web-vitals-thresholds

| Metric | Good | Needs improvement | Poor |
|---|---|---|---|
| **LCP** - Largest Contentful Paint | <= 2.5 s | 2.5 - 4.0 s | > 4.0 s |
| **INP** - Interaction to Next Paint | <= 200 ms | 200 - 500 ms | > 500 ms |
| **CLS** - Cumulative Layout Shift | <= 0.1 | 0.1 - 0.25 | > 0.25 |

**Assessment rules:**

- **75th percentile** of all page views.
- **Rolling 28-day window**, from the **Chrome User Experience Report (CrUX)** - real user data.
- Segmented by **mobile and desktop** separately.
- A page passes a metric when **at least 75% of visits** meet the "good" threshold.
- A site is "poor" when at least 25% of views meet the "poor" threshold.

**INP replaced FID on 12 March 2024.** INP measures responsiveness across *all* interactions, not just
the first, which is why it tracks real experience better.

### Reality check

Per 2025 Web Almanac data: **just under half of mobile sites** and **just over half of desktop sites**
currently pass all three. This is achievable but not yet normal.

### Lab vs field

A Lighthouse score is **lab data on one device at one moment**. It does not determine your
classification. **Instrument RUM** and watch the p75 in the field, or use CrUX / the PageSpeed
Insights API.

---

## 2. INP - the one to fix first

INP is almost entirely a **main-thread** problem. It decomposes into three parts:

| Subpart | Meaning | Typical cause |
|---|---|---|
| **Input delay** | Time before your handler starts | Main thread busy, long tasks queued ahead |
| **Processing time** | Time your handler runs | Too much synchronous work |
| **Presentation delay** | Handler done to next paint | Forced layout, expensive paint |

**Measure before optimizing.** Chrome DevTools Performance panel: record, interact, look at the
**Interactions track** and the long-task bars (anything over **50 ms**).

### The single biggest fix - yield

```js
function yieldToMain(options) {
  if ("scheduler" in window) {
    if ("yield" in scheduler) return scheduler.yield(options);
    if ("postTask" in scheduler) return scheduler.postTask(() => {}, options);
  }
  if (options?.priority === 'user-blocking') return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve));
}
```

```js
// Before: browser cannot paint until EVERYTHING finishes
button.addEventListener('click', () => {
  processLargeDataset(items);   // 200ms
  updateAnalytics();            // 50ms
  renderResults();              // 100ms
});                              // INP: 350ms

// After: paint happens after the immediate feedback
button.addEventListener('click', async () => {
  showLoadingState();           // instant visual feedback
  await yieldToMain();          // let the browser paint
  processLargeDataset(items);
  renderResults();
});                              // INP: ~16ms
```

### Other INP fixes, in order of impact

**Move analytics off the interaction path.** A synchronous `dataLayer.push` in a click handler runs
every GTM tag during the interaction:

```js
// Bad - all GTM tags fire during the interaction
button.addEventListener('click', () => {
  dataLayer.push({ event: 'cta_click' });
  navigateToNextPage();
});

// Better - navigate, yield, then record
button.addEventListener('click', async () => {
  navigateToNextPage();
  await yieldToMain();
  dataLayer.push({ event: 'cta_click' });
});
```

**Debounce high-frequency handlers.** Search-as-you-type and scroll handlers fire dozens of times per
second; update the input immediately, debounce the expensive work.

**React: mark expensive updates non-urgent.**

```jsx
const [query, setQuery] = useState('');
const [results, setResults] = useState([]);
const [isPending, startTransition] = useTransition();

function onChange(e) {
  setQuery(e.target.value);              // urgent - show the keystroke now
  startTransition(() => {                // non-urgent - list re-renders later
    setResults(search(e.target.value));
  });
}
```

**Virtualize long lists.** Rendering 1000 DOM nodes when 20 are visible is a classic INP killer.
`@tanstack/react-virtual` does this without changing your data model.

**Avoid forced synchronous layout.** Reading layout (offsetTop, getBoundingClientRect) after writing
styles forces recalculation. Batch reads, then writes.

**`PerformanceObserver` for long tasks** to find them in the wild:

```js
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // entry.duration > 50ms is a long task; entry.attribution tells you the culprit
    console.warn('Long task:', entry.duration, entry.attribution);
  }
}).observe({ type: 'longtask', buffered: true });
```

---

## 3. LCP

LCP marks when the main content finished loading. Optimization order:

1. **TTFB** - server/CDN response time. Nothing downstream matters if this is slow.
2. **Critical request chain** - minimize dependent round-trips.
3. **The LCP resource itself** - usually an image or a font.

```html
<!-- preload and prioritize the true LCP image -->
<link rel="preload" as="image" href="/hero.avif" fetchpriority="high" />

<img
  src="/hero.avif"
  alt="Descriptive alt text"
  width="1200" height="630"      <!-- reserves space, prevents CLS -->
  fetchpriority="high"
  decoding="async"
/>
```

**Rules:**

- `width`/`height` on **every** image - this prevents the largest CLS source.
- `loading="lazy"` on **below-the-fold images only**. Lazy-loading the LCP image *hurts* LCP.
- AVIF or WebP with `srcset`/`sizes` for responsive delivery.
- Serve from a CDN; `preconnect` if cross-origin.
- For text LCP: ensure fonts don't block, and check TTFB.

---

## 4. CLS

Sources, in rough order of frequency:

| Source | Fix |
|---|---|
| Fonts swapping in | `size-adjust`, `ascent-override`, `descent-override` metric matching |
| Images without dimensions | `width`/`height` attributes |
| Ads / embeds / iframes | Reserve space with `min-block-size` or a fixed-ratio wrapper |
| Content injected after load | Reserve the space before injecting |
| Dynamic banners | Skeletons with identical dimensions |

**The Layout Instability API** for attribution:

```js
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (!entry.hadRecentInput) {
      console.warn('Layout shift:', entry.value);
      console.warn('Sources:', entry.sources);
    }
  }
}).observe({ type: 'layout-shift', buffered: true });
```

---

## 5. Rendering cost

| Pipeline stage | Triggered by | Cheapest to fix |
|---|---|---|
| **Style** | class/attribute changes, CSS vars | reduce selectors, avoid `@layer` thrash |
| **Layout** | geometry changes: width, font-size, position | **use `transform` instead** |
| **Paint** | color, shadow, border, background | reduce `box-shadow` blur, `filter`, `backdrop-filter` |
| **Composite** | `transform`, `opacity`, `filter`, `clip-path` | GPU-accelerated - cheapest |

**`transform` and `opacity` skip layout and paint entirely.** They are not "slightly faster" - they
are categorically different.

```css
/* Forces layout every frame */
.panel { margin-top: 0; transition: margin-top 200ms; }
.panel.open { margin-top: 1rem; }

/* Compositor only */
.panel { translate: 0 0; transition: translate 200ms; }
.panel.open { translate: 0 1rem; }
```

---

## 6. Bundle and architecture

- **Client-side JS is the dominant cost** in modern apps. Every byte must parse, compile, and execute
  before it can hydrate.
- **Code-split by route**, and lazy-load heavy widgets via dynamic `import()`.
- **Server Components** send zero JS for server-rendered UI - the single biggest lever available.
- **Islands architecture** (Astro) ships JS only for interactive components.
- **Hydration cost is real** - see `08-patterns-and-craft.md` for islands vs resumability.
- **TBT** (Total Blocking Time) is the best lab proxy for INP. Watch it in CI.

---

## 7. Loading priority

```html
<!-- third parties you will definitely need -->
<link rel="preconnect" href="https://api.example.com" crossorigin />

<!-- critical CSS -->
<link rel="preload" as="style" href="/critical.css" />

<!-- high priority image -->
<link rel="preload" as="image" href="/hero.avif" fetchpriority="high" />
```

**When NOT to preload:**

- Don't preload everything - every preloaded resource competes, and unused preloads are pure waste.
- Don't preload fonts that aren't render-critical.
- Don't preload resources below the fold.
- HTTP/2 and HTTP/3 multiplexing means many preconnects are less valuable than they used to be.

**Third-party scripts** are usually the largest single perf cost. Consider:

- Deferring them off the critical path
- Loading on interaction or idle rather than on load
- Facades (load the real widget only when it comes into view or is clicked)

---

## 8. Measuring properly

### In the field

```js
// Core Web Vitals in the field, per navigation
import { onLCP, onINP, onCLS } from 'web-vitals';

onLCP(console.log);
onINP(console.log);
onCLS(console.log);
```

Aggregate by route and device, and watch the **p75** - not the mean. The mean hides the tail that
users actually feel.

### In CI

- Lighthouse CI with performance budgets that **fail the build**.
- A bundle-size budget checked on every PR.
- `web-vitals` in synthetic tests to catch obvious regressions early.

### Lab vs field is not an either/or

Use lab (Lighthouse, DevTools) to **diagnose and iterate**. Use field (RUM, CrUX) to **decide whether
it shipped well**. A lab number is never evidence that real users are happy.

---

## Sources

- Core Web Vitals thresholds: https://web.dev/articles/defining-core-web-vitals-thresholds
- CrUX: https://developer.chrome.com/docs/crux
- INP guide: https://web.dev/articles/inp
- INP subparts: https://web.dev/articles/inp#subparts
- Improve INP by yielding: https://kurtextrem.de/posts/improve-inp
- LCP: https://web.dev/articles/lcp
- CLS: https://web.dev/articles/cls
- Layout instability API: https://developer.mozilla.org/en-US/docs/Web/API/Layout_Instability_API
- web-vitals library: https://github.com/GoogleChrome/web-vitals
- Web Almanac 2025 performance: https://almanac.httparchive.org/en/2025/performance