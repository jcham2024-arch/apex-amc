# Layout specification — implementable

Task `ui-research` (T8). Precise enough that an implementer makes **no design
decisions**. Every value here is a token from
[`03-modern-mockups/_tokens.css`](03-modern-mockups/_tokens.css).

---

## 1. Token table (actual values)

### Surface — 5 steps, because the page has exactly 4 planes

| Token | Value | Used for |
|---|---|---|
| `--ink-900` | `#080b12` | Page background |
| `--ink-800` | `#0d1219` | Card |
| `--ink-700` | `#141b26` | Input, raised panel, hero figure |
| `--ink-600` | `#1c2531` | Hover |
| `--ink-500` | `#28323f` | Active, strong border |
| `--line` | `#223040` | Default border |
| `--line-soft` | `#1a2430` | Internal divider |

### Text — contrast measured against `--ink-900`

| Token | Value | Ratio | Level | Restriction |
|---|---|---|---|---|
| `--text` | `#e8edf4` | 16.1:1 | AAA | Body and **all figures** |
| `--text-dim` | `#9aa8ba` | 8.4:1 | AAA | Labels |
| `--text-mute` | `#6b7a8d` | 4.7:1 | AA | Metadata **only — never a figure** |

### Accent and provenance

| Token | Value | Glyph | Word |
|---|---|---|---|
| `--brass` | `#c8a04a` | — | Primary action + headline figure |
| `--brass-dim` | `#8f7434` | — | Hover/pressed |
| `--blue` | `#58a6ff` | — | Link |
| `--prov-published` | `#3fb950` | `●` | Published |
| `--prov-derived` | `#58a6ff` | `○` | Derived |
| `--prov-estimated` | `#d29922` | `◐` | Estimated |
| `--prov-unresolved` | `#f85149` | `⊘` | Unresolved |
| *(unknown)* | *none* | dashed box | "not recorded" |

**Unknown has no colour token on purpose.** See `01-layout-research.md` §4.

### Spacing — 4px base

`--sp-1` 4 · `--sp-2` 8 · `--sp-3` 12 · `--sp-4` 16 · `--sp-5` 24 · `--sp-6` 32 ·
`--sp-7` 48 · `--sp-8` 64

**Rule: a component never introduces a value that is not one of these eight.**

### Type — modular scale, ratio 1.25, base 15px

| Token | Size | Line height |
|---|---|---|
| `--fs-xs` | 11.5px | 1.45 |
| `--fs-sm` | 13px | 1.5 |
| `--fs-base` | 15px | 1.55 |
| `--fs-md` | 18px | 1.45 |
| `--fs-lg` | 22.5px | 1.35 |
| `--fs-xl` | 28px | 1.25 |
| `--fs-2xl` | 35px | 1.15 |
| `--fs-fig` | `clamp(30px, 6vw, 44px)` | 1.1 |

**`--measure: 68ch` applies to PROSE ONLY.** Never to a data table — a ch-limited
figure column jitters as digits change.

### Geometry, focus

| Token | Value | Use |
|---|---|---|
| `--r` | 6px | Inputs, buttons |
| `--r-lg` | 10px | Cards |
| `--r-pill` | 999px | Badges, chips |
| `--tap` | 44px | **Minimum** control height |
| `--focus` | `0 0 0 2px ink-900, 0 0 0 4px brass` | Two-stop ring |
| `--unit` | 0.62em | Unit text relative to figure |

---

## 2. Component list with states

| Component | States | Required behaviour |
|---|---|---|
| **Figure** | default · hero · unknown | `tabular-nums` always. Unknown renders **no number**. |
| **Provenance badge** | published · derived · estimated · unresolved | Glyph + word always. Never colour alone. |
| **Unknown slot** | present | Dashed box + word. Keeps its box so tables do not reflow. |
| **Field** | default · hover · focus · disabled | `min-height: 44px`. `inputmode` set per type. No spinners. |
| **Button** | primary · ghost · disabled | `min-height: 44px`. `:focus-visible` ring on both. |
| **Card** | default · flagged | Flagged variant adds a `--unresolved` border. |
| **Result panel** | default · updated | `position: sticky` ≥900px. `aria-live="polite"`. |
| **Table** | default · scrolled | `overflow-x: auto` wrapper. Right-align figures. |
| **Empty state** | present | Explicit message + a way out. Never an empty grid. |
| **Filter chip** | on · off | `aria-pressed`. |

---

## 3. Responsive breakpoints

Only **two**, deliberately. This is a data tool, not a marketing page.

| Breakpoint | Layout |
|---|---|
| `< 900px` | Single column. Inputs, then result immediately after. Tables scroll horizontally. |
| `≥ 900px` | Two columns: inputs `1.15fr` / result `0.85fr`, result sticky at `top: 76px` (header 60 + 16 gap). Retailer grid `minmax(280px, 1fr)`. |

**The sticky offset must be ≥ header height.** Header is 60px, so 76px clears it with
16px of breathing room. This is WCAG 2.2 SC 2.4.11 Focus Not Obscured — a focused
control must not sit under the sticky header.

---

## 4. What changes in the data layer

**The good news: no schema change, no migration, no new source.** The provenance is
already recorded in `data/schemas/*.yaml` and already travels in the built JSON.

| Change | Where | Nature |
|---|---|---|
| Emit `provenance` per value | `scripts/data/build-data.mjs` → generated JSON | Read from existing schema column |
| Distinguish `null` from absent | Renderer | `null` = not recorded. **Never render 0 for `null`.** |
| Carry unresolved-conflict rows | Already exists — `npm run coverage` reports 2 | Carry through, do not publish |

**The one hard requirement:** the renderer must be able to say **"not recorded"**. If
the data layer cannot distinguish `null` from `0`, the UI cannot be honest, and every
other item in this spec is wasted.

---

## 5. Implementation order

Ranked by value per unit of risk.

| # | Change | Risk | Value |
|---|---|---|---|
| 1 | Add `tabular-nums` to figures | **Trivial** | High — stops numbers appearing to move |
| 2 | Add the provenance badge + unknown slot | Low — data exists | **Highest.** Truthfulness |
| 3 | Sticky result panel | Low — CSS only | High — removes a scroll per keystroke |
| 4 | `min-height: 44px` on controls | Low | High for mobile |
| 5 | Remove the decorative hero | Low | Medium — first screen to content |
| 6 | Remove FontAwesome | **Medium** — CSP host change | Medium |
| 7 | Fix or delete the mobile drawer | **Medium** | Medium — a11y defect |

**Items 1-4 are CSS-only, carry no CSP risk, and require no data change.** An
implementer should ship those first and stop there if time is short: they capture most
of the benefit.

---

## 6. Acceptance criteria

A reviewer can check every one of these mechanically:

1. `grep -c 'tabular-nums' dist/index.html` → **> 0**
2. Every figure with a provenance tag renders a badge with a glyph and a word.
3. A `null` value renders the words "not recorded" and **never** `0`, `—` or `--`.
4. `grep -nE 'on(click|input|change|load)=|style=' dist/index.html` → **empty**
5. Every interactive element has a computed height ≥ 44px.
6. The result panel is visible without scrolling at ≥900px.
7. Badges remain distinguishable with all colour removed (greyscale check).
8. `npm run verify` exits 0, including the CSP browser check.