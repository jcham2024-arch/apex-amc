# Caveats & Volatile Status

> **Read this before trusting any date-bearing claim in this knowledge base.**
> Compiled October 2026. Re-verify anything here after ~6 months.

This file exists because the most dangerous thing in a knowledge base is a confident, dated claim
that turned out to be wrong. Three of those were found and corrected during this research. They are
preserved below rather than deleted.

---

## 1. APCA / WCAG 3 contrast - THE BIGGEST CORRECTION

### The claim that is wrong

You will read everywhere that **"APCA is the WCAG 3 contrast algorithm"** or that you can "replace
WCAG 2 contrast with APCA." **This is factually incorrect.**

### What actually happened

1. APCA was submitted to WCAG 3 and marked **Exploratory**.
2. Exploratory content that does not gain working-group support within **6 months** is automatically
   removed by the WCAG 3 process.
3. It did not clear that window. The WG **pulled APCA from the July 2023 WCAG 3 working draft.**
4. As of the **WCAG 3.0 Editor's Draft of 8 April 2026**, the contrast definition still reads:

   > **contrast ratio test** - Exploratory
   > *Editor's note: The contrast algorithm used in WCAG 3 is yet to be determined.*

**Status: APCA is not in WCAG 3. It was never normative. It may never return.**

Source: https://adrianroselli.com/2026/04/wcag3-contrast-as-of-april-2026.html

### The counter-argument (represent it fairly)

Andrew Somers of Inclusive Reading Technologies (April 2026):

- "This is not a final standard, and no one should be calling it 'WCAG 3' - I've said so many times."
- The algorithm reflects years of research, independent validation, and peer-reviewed papers.
- Colors passing APCA "greatly exceed WCAG 2's minimums in the vast majority of cases."
- WCAG 2's contrast criteria can be *harmful* for color-vision-deficient users.
- **BridgePCA** is a mode designed to pass WCAG 2 while extending accommodation via APCA.

Roselli's counter: promoting a drop of WCAG 2 conformance creates legal risk. He has filed issues with
tool makers to remove APCA.

### What to do

**Everyone agrees on the operational conclusion: do not drop WCAG 2 conformance based on a draft.**

Roselli's risk mitigation:

- Choose colors that also meet WCAG 2 contrast requirements; **or**
- if you deliberately deviate, **document the decision** and have a response ready for an
  automated-checker-driven complaint.

### Real-world adoption is split - not a settled question

| System | Model | Notes |
|---|---|---|
| **Radix Colors** | APCA | Steps 11/12 guaranteed Lc 60 / Lc 90 vs a step 2 background |
| **GitHub Primer** | WCAG 2.2 | Docs state APCA "is a proposal and is not normative" |
| **Material 3** | HCT tonal palette | Own contrast model |

Radix maintainers are candid in their issue threads: WCAG 2 conformance is not out-of-the-box, it is
"mutually exclusive with the direction that can keep the project alive," and they scope EN 301 549 to
the public sector only. That is a stated values position, not an oversight.

**Practical rule:** WCAG 2.2 AA ratios are the enforceable standard. APCA is a legitimate *design
heuristic* for choosing among WCAG-passing options. Never the sole basis for a compliance claim.

---

## 2. Anchor positioning - corrected from "in flux" to "shipped, but young"

### The correction

Initial research hedged this with "verify per-property." That hedging was unnecessary.

- **Safari 26.0 shipped anchor positioning on 2025-09-15** as a headline feature.
- **Baseline 2026 Newly available (January 2026)** is accurate.
- Firefox 147+. Safari <= 18.7 not supported. Firefox 145-146 present but disabled by default.

Sources: https://webkit.org/blog/17333/webkit-features-in-safari-26-0/ · https://caniuse.com/css-anchor-positioning

### Why it still needs care

Safari 26.2 / 26.3 / 26.4 fixed a long list of real bugs. That release cadence is itself the signal
that the feature is usable but still settling:

- Style resolution loops with `position-try` inside `display: none` ancestors
- `fixed` + `position-area` incorrectly counted in scrollable containing block math
- `@starting-style` entry animations firing only on the *first* transition with anchor positioning
- `position-area` in scrollable containers using only initial scrollport bounds

**Behavior change:** Safari 26.2 changed fallback ordering to try the **last successful** option
first, then the original style, then the remaining options.

**Recommendation:** ship it. Prefer the `popover` + `position-area` path. Test flip/overflow in
Safari specifically if you use `anchor()` directly or multi-anchor.

---

## 3. Scroll-driven animations - corrected from "Safari doesn't support it"

### The correction

Initial research relayed a table claiming Safari returns `false` for
`CSS.supports('animation-timeline', 'scroll()')`. That came from a secondary blog post and
**contradicts WebKit's own Safari 26.0 announcement**, which lists scroll-driven animations as a
shipped headline feature.

**Honest current picture:**

| Engine | Status |
|---|---|
| Chrome / Edge 115+ | Supported |
| **Safari 26+** | **Supported** (shipped 2025-09-15) |
| Firefox stable | Behind `layout.css.scroll-driven-animations.enabled`, **off by default** |
| Firefox Nightly + pref | Parses, but implementation incomplete |

**Why MDN still says "Limited availability":** because Firefox is off by default. That label is
about Firefox, not Safari.

**Recommendation:** verify in your own target browsers. The durable advice is in `02-css-layout.md`
section 9 - the `animation` shorthand reset, the parse-time `@supports` trap, and the draft-spelling
trap all apply regardless of engine support.

---

## 4. WCAG 3.0 timeline - treat as "years away"

- Roselli estimates **2030 at the soonest**; the AGWG charter targets were already reported as
  unrealistic.
- GitHub Primer states WCAG 3.0 "does not have an anticipated release date."
- Any contrast algorithm it adopts will not be final before then.

**Do not architect around WCAG 3.** Target WCAG 2.2 AA.

---

## 5. EAA scope and phasing - more nuanced than "June 2025 deadline"

The European Accessibility Act is commonly summarized as "applied from 28 June 2025." That is
directionally right but oversimplified on **scope and phasing**:

- WCAG 2 is a **voluntary guideline, not law** - it becomes binding only where legislatures copied its
  success criteria.
- EN 301 549 does not come into **full** force until **2030**.
- US Section 508 adopted WCAG **2.0** only, with an "equivalent facilitation" rule that permits better
  guidelines.

**Practical consequence:** WCAG 2.2 AA remains the conservative, defensible target. It satisfies the
strictest live obligation while foreclosing nothing.

---

## 6. Tailwind v4 browser floor - the constraint people discover last

v4 requires **Safari 16.4+, Chrome 111+, Firefox 128+**. No tool works around this. It is the single
fact most likely to block an upgrade, and it is usually discovered late.

Also watch for visual diffs: default border color became `currentColor` (was `gray-200`), and `ring`
changed from 3px blue to 1px `currentColor`.

Migration trap: `--font-family-*` became `--font-*`. Using the old name **silently produces no
utility**.

---

## 7. shadcn/ui default library changed

**July 2026:** shadcn/ui made **Base UI the default** for new projects. Radix remains fully supported
and is not deprecated. Base UI was at 1.6.0 with 6M+ weekly downloads.

Mechanical difference: **`asChild` -> `render`**.

If you run `shadcn init` non-interactively in CI expecting Radix, add `-b radix`.

Source: https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default

---

## 8. Things NOT in flux (safe to rely on)

These had multiple independent confirmations:

- **Core Web Vitals thresholds** - LCP 2.5s / 4s, INP 200ms / 500ms, CLS 0.1 / 0.25, p75 over 28-day
  CrUX. INP replaced FID on 2024-03-12.
- **WCAG 2.2 criteria** - published 2023-10-05 as a W3C Recommendation. Nine new criteria,
  4.1.1 Parsing removed.
- **Container queries** - Widely available since Feb 2023.
- **DTCG Format 2025.10** - Final Community Group Report, 2025-10-28. (Not a W3C Standard - it is not
  on the Standards Track.)
- **React 19 API** - released 2024-12-05. `ref` as prop, `useActionState`, `useFormStatus`,
  `useOptimistic`, `use()`, Actions.
- **Design token best practice** - three tiers, semantic layer is the contract.

---

## 9. Research limitations - be honest about these

**The deep-research agent tool failed repeatedly** in the environment where this was compiled
(parameter validation errors on every attempt). This knowledge base was assembled from ~24 targeted
web searches rather than four exhaustive multi-source agent runs.

Coverage is broad and every load-bearing number is sourced, but it is **thinner** in these areas:

1. Scroll-driven animation - the Safari/Firefox status is a documented contradiction, not a resolved
   fact.
2. Shadow DOM token delegation - covered well but is a narrow topic with deep edges.
3. Qwik/Astro islands comparison - the performance figures circulating are from secondary explainer
   content, **not controlled benchmarks**. Direction is reliable; magnitudes are illustrative.
4. No primary-source research was done on Astro vs Qwik from their own engineering blogs.

Anything marked "verify" elsewhere in these docs should be verified against first-party docs before
production use.