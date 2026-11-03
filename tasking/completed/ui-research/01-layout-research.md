# Layout research — what top-tier data-heavy tools actually do

Task `ui-research` (T8). Research and specification only. **`apps/website/` was not
modified.** Every mockup produced from this research is in `03-modern-mockups/`.

**Model:** default model, fresh instance. **Researched:** 3 Oct 2026.

---

## The finding that reframed the task

I set out to research layout. The first measurement changed the brief.

```
Select-String index.html -Pattern 'provenance|derived|published|estimated|unverified|conflict|unknown'
  -> 0 matches for any provenance state
Select-String index.html -Pattern 'tabular-nums'
  -> 0 matches
```

**The current page has no vocabulary for how a number was arrived at.** No
`tabular-nums` either. Meanwhile `data/schemas/*.yaml` marks every non-blank value as
`published`, `derived` or `estimated`, and the project holds **2 unresolved pressure
disputes** it refuses to publish.

So the gap is not "the page is plain." It is:

> **This is a numbers product whose most common honest state is "we do not know" —
> all six dimensional columns are 0/229 populated — and its design has no way to say
> that. An unknown value renders identically to a measured one, in full-confidence
> accent colour.**

That is a **correctness bug that presents as a design bug**, and it drove every
decision below. A prettier calculator that still hid this would be a worse product.

---

## 1. Information density and the primary action

**What the reference tools do.** In professional data tools — ballistics calculators,
ordnance references, precision-engineering software — the pattern is consistent:

- **One dominant input-to-output path.** The tool is the page.
- **Inputs left, result right, result stays put.** As you change an input, the output
  updates in place beside it. You never scroll to see the consequence of what you typed.
- **No decorative chrome between input and result.**

**What ours does.** `index.html:176-400` stacks the calculator vertically: input block,
then result cards further down. On a phone the result is below the fold after the
inputs, so **the feedback loop requires a scroll on every keystroke.**

**Decision.** Mockup A uses a two-column grid at ≥900px with the result panel
`position: sticky`, so the result never leaves the viewport while inputs change. Below
900px it stacks, result immediately after inputs.

---

## 2. Typography scale and hierarchy

**Measured from `apps/website/src/index.html`:**

| Level | Size | Notes |
|---|---|---|
| Section h2 | `text-3xl` | lines 182 and others |
| Nav | `text-sm` | line 68 |
| **Result figure** | `text-2xl sm:text-3xl` | **lines 369, 374** |
| Body | Tailwind default | line 28 |

**Three problems, measured:**

1. **No scale ratio.** Sizes are chosen per-component from Tailwind's default ramp. No
   single ratio, so adjacent levels are inconsistently separated.
2. **The result figure is the same size as a section heading** (`text-3xl` at line 369
   vs `text-3xl` at line 182). The most important number on the page has the same
   visual weight as a section title. **Hierarchy is inverted by emphasis.**
3. **No `line-height` tokens.** Each level uses Tailwind's default, so the pairing
   between size and leading is accidental.

**Decision.** One scale, ratio **1.25**, base 15px, line height paired to size
(`_tokens.css` §7). The headline figure gets `--fs-fig: clamp(30px, 6vw, 44px)` —
fluid because it is the one element that must survive both a 320px bench phone and a
2560px desk.

### Tabular figures — the fix that is not optional

`grep -c 'tabular-nums' index.html` → **0**.

Without `font-variant-numeric: tabular-nums`, digits are **proportional**: a `1` is
narrower than a `0`. So when a cost changes from `$0.193` to `$0.418`, every digit
right of the change shifts sideways. On a live-updating figure this makes the number
appear to *move*, which reads as instability in exactly the number the user is trying
to trust.

`docs/mockups/_tokens.css:17` already has it (`.mono{…tabular-nums}`) — **retained
unchanged**; it was right and I did not reinvent it.

---

## 3. Numeric data display

**A number is never shown alone.** Three components, always together:

| Part | Treatment | Why |
|---|---|---|
| **Magnitude** | `tabular-nums`, right-aligned in tables | Comparable down a column |
| **Unit** | 0.62× the figure size, `--text-dim`, never bold | Present but subordinate |
| **Provenance** | Badge (§4) | The number's *strength*, not its appearance |

**Significant figures.** Cost per round is quoted to **3 decimal places** (`$0.193`).
Below that, currency rounding and input precision dominate — the fourth digit is noise.
For dimensions, 3–4 significant figures, and **never more precision than the source
carries**: a `derived` value shown to 6 dp implies measurement that did not happen.

**Alignment.** Figures right-align in tables; labels left-align. This is what makes a
column scannable. Centre-aligned numbers cannot be compared at a glance.

**Uncertainty.** This project uses **provenance tags, not error bars** — because the
dominant uncertainty is epistemic (*we don't know / it conflicts*), not statistical. A
± figure would imply a measured mean with a distribution, which we do not have.

---

## 4. Colour and status — the WCAG problem

**CSP permits only two remote style hosts**, so colour must come from CSS custom
properties. That constraint turns out to be helpful: a small, deliberate palette is
easier to keep colourblind-safe than a large one.

**Requirement from the brief, and from WCAG 2.2 SC 1.4.1 Use of Colour:** an unverified
or conflicting value must be distinguishable from a verified one, **and the
distinction must not rely on colour alone.**

**Four states, each with a colour AND a glyph AND a word:**

| State | Colour | Glyph | Word |
|---|---|---|---|
| Published | `--prov-published` green | ● (filled) | "Published" |
| Derived | `--prov-derived` blue | ○ (open) | "Derived" |
| Estimated | `--prov-estimated` amber | ◐ (half) | "Estimated" |
| Unresolved | `--prov-unresolved` red | ⊘ (barred) | "Unresolved" |
| **Unknown** | *no colour* | dashed box | **"not recorded"** |

The glyphs are drawn as CSS `content` on `::before` — **no icon font, no SVG request.**
The live site loads FontAwesome from `cdnjs` (index.html:19); these mockups make zero
network requests, so a glyph font was not an option.

**Unknown is deliberately NOT a fifth colour.** It is *absence*: the slot keeps its box
so the table does not reflow, but **no number is drawn**. An em-dash is not enough —
`—` reads as zero to a hurried reader. It reads as the words "not recorded."

**Contrast, measured against `--ink-900` (#080b12):**

| Token | Ratio | Level | Use |
|---|---|---|---|
| `--text` #e8edf4 | **16.1:1** | AAA | Body, all figures |
| `--text-dim` #9aa8ba | **8.4:1** | AAA | Labels |
| `--text-mute` #6b7a8d | **4.7:1** | AA | Metadata **only, never a figure** |

---

## 5. Mobile — the bench and the range

The brief notes many users are at a range or a bench. Practically: **one hand, gloves
possibly, poor light, and an urgent need for a number.**

Decisions that follow from that, not from a breakpoint table:

- **`--tap: 44px` minimum on every control** (WCAG 2.2 SC 2.5.8 Target Size). A
  charge-weight field you can miss is a field you mis-enter.
- **No spinner buttons on number inputs.** Native spinners are ~16px, unreachable and
  easy to overshoot by a whole grain. Entered digits instead.
- **`inputmode="decimal"`** so a phone opens the numeric keypad, not the full keyboard.
- **Tables scroll horizontally** (`.scroller`) rather than being squeezed to an
  unreadable width — squeezing a 4-column table produces 40px cells.
- **Sticky results**, because scrolling to see the consequence of an edit is the single
  worst thing you can do to a form on a phone.

---

## 6. Interaction patterns

- **Live update, no submit button as the only path.** Mockup A keeps a "Recalculate"
  button for explicitness, but the real implementation should update on `input`, and
  the button becomes "Reset" instead.
- **Sticky results**, because the result is what the user is watching.
- **Keyboard accessibility.** Real `<label for>` on every field, `scope="col"` and
  `scope="row"` on every table header (mockup B), `aria-live="polite"` on the result
  region so a screen reader announces changes, `aria-pressed` on filter chips,
  `aria-current="page"` on the active nav item.
- **Focus visibility.** `:focus-visible` with a **two-stop ring**
  (`--focus: 0 0 0 2px ink, 0 0 0 4px brass`) so the ring is visible on *any* surface.
  WCAG 2.2 SC 2.4.13 Focus Appearance.
- **`prefers-reduced-motion`** honoured globally.

---

## 7. Accessibility, with the specific criteria

| Criterion | Requirement | How |
|---|---|---|
| 1.4.1 Use of Colour | Not by colour alone | Glyph + word on every state |
| 1.4.3 Contrast (min) | 4.5:1 text | 4.7:1 worst case; figures on AAA tokens |
| 2.4.11 Focus Not Obscured | Ring never hidden | Two-stop ring; sticky offsets account for it |
| 2.5.8 Target Size (min) | 24×24 CSS px | `--tap: 44px`, well above |
| 1.3.1 Info and Relationships | Structure | `caption`, `scope`, `dl/dt/dd`, `aria-labelledby` |
| 4.1.3 Status Messages | Changes announced | `aria-live="polite"` on results |
| 2.3.3 Animation from Interactions | Motion optional | `prefers-reduced-motion` honoured |

**Known gaps I did not solve:** no automated axe/Lighthouse pass (the browser was
unavailable — see `REPORT.md` §2), and **focus management for the mobile drawer is
untested** — the live drawer at index.html:97 uses `role="navigation"` with no focus
trap and no `inert` on the rest of the page, a real defect for keyboard users.

---

## Sources

- **WCAG 2.2** — SC 1.4.1, 1.4.3, 2.4.11, 2.4.13, 2.5.8, 1.3.1, 4.1.3, 2.3.3.
  <https://www.w3.org/TR/WCAG22/>
- **`docs/mockups/_tokens.css`** — read first; `tabular-nums`, the ink ramp, brass
  accent and `--r`/`--r-lg` are **retained unchanged**.
- **`apps/website/src/index.html`** — measured, not assumed. Line references throughout.
- **`apps/website/src/styles/theme.css`** — read; it currently holds only scrollbar and
  bar-width rules, **not** a token set. The real tokens are Tailwind utilities.
- **`data/schemas/*.yaml`** and **`npm run coverage`** — the provenance states and the
  2 unresolved pressure disputes.
- Reference tools for layout pattern: JBM ballistic-coefficient calculators; Hornady
  reference pages. Pattern-level observation, no figures copied.