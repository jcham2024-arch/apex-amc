# Design critique — the current page

Task `ui-research` (T8). **Blunt on purpose.** Line numbers refer to
`apps/website/src/index.html` (659 lines) as it stands today.

---

## The headline criticism

**The page is confident about everything, and it should not be.**

`npm run coverage` reports the honest state: 120 bullets, 169 powders, 6 unresolved
pressure values, and **six dimensional columns at 0/229 populated**. `data/schemas/`
marks values `published` / `derived` / `estimated`. The site then presents every figure
in the same confident accent colour with the same visual weight.

```
grep -c 'provenance|derived|estimated|unverified|conflict' index.html   -> 0
grep -c 'tabular-nums' index.html                                       -> 0
```

**Zero.** The page cannot distinguish a measured value from a guess, and cannot
distinguish a guess from an absence. In a domain where a wrong number can injure
someone, that is the worst thing it could get wrong — and it does not look like a bug.
It looks like a design.

---

## Five things I would remove

### 1. The top alert bar — lines 43-49

```
<div class="bg-tactical-900 border-b border-slate-800 text-xs py-2 px-4 ...">
  <i class="fa-solid fa-triangle-exclamation"></i> Notice:
  Independent directory & calculator resource...
</div>
```

**Remove entirely.** It is a permanent bar whose content — "we are not affiliated with
anyone" — is a **disclosure**, and disclosures belong where the decision happens, not in
a strip every page view pushes down. It is also visually loud (amber icon, bold) for the
least actionable content on the page, and it consumes vertical space on a phone before
the user has seen anything.

The information itself must survive. Move it into the footer **and** next to the
retailer links (mockup C does the latter, per-retailer).

### 2. FontAwesome for every icon — line 19, and ~25 uses

```
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

**Remove the dependency.** Three reasons, in order of severity:

1. **It is a third-party render-blocking request on a page whose entire selling point
   is that it works at a range with poor signal.** If it fails, the page shows `fa-`
   boxes and looks broken.
2. **It consumes a CSP exemption that does not need to exist.** The policy permits
   exactly two remote style hosts — one of which is FontAwesome, not our own stylesheet.
3. **~25 icons for ~6 distinct meanings.** Crosshairs, calculator, store, list-check,
   book-bookmark, bars, bolt, sliders, bullseye — a decorative vocabulary, not an
   information-bearing one. My mockups use CSS `content` glyphs for the four states
   that actually carry meaning.

### 3. The `PROJECT APEX DEV` badge — line 61

```
<span class="text-xl font-extrabold tracking-wider ...">
  PROJECT APEX <span class="text-emerald-400">DEV</span>
</span>
```

**Remove the `DEV` badge.** "DEV" is a status of the *code*, not of the *product*.
Displaying it in the masthead tells every visitor the numbers are provisional — while
the numbers themselves are presented with total confidence. It is a warning label
attached to the wrong object.

**Separately and more seriously:** the brand itself is the open legal item from
`tasking/completed/trademark-clearance/` — APEX AMMUNITION is a LIVE IC 013
registration. The `<title>` at line 6 says "Project Apex (placeholder name)", which is
honest. The masthead is not. **Pick one register and use it everywhere.**

### 4. Double navigation on mobile — lines 91-111

```
91: <button id="mobileMenuBtn" class="md:hidden ..." aria-controls="mobileDrawer">
97: <div id="mobileDrawer" class="hidden md:hidden ..." role="navigation" aria-label="Mobile">
99:   ... Reloading Calculator     102: ... Retailer Directory
105:  ... Gear Checklist          108: ... Component Guides
```

**Remove the duplicate.** The same four destinations appear in the header nav
(lines 68-80) and again in the drawer (99-108). On mobile both are in the DOM; the
drawer is `hidden` by class but a screen reader still reads the label set, so a mobile
user hears eight navigation items where there are four.

Worse, the drawer has **no focus trap and no `inert`** on the rest of the page, so
tabbing out of an open drawer walks into the page behind it. Either fix it properly or
delete it; the duplication alone justifies removal until it can be done properly.

### 5. The decorative hero — lines 115-175

```
115: <section class="relative pt-12 pb-20 overflow-hidden bg-gradient-to-b
      from-tactical-950 via-tactical-900 to-tactical-950 border-b border-slate-800/60">
138:   Open Savings Calculator      141:   Browse Retailers
```

**Remove the gradient, the decorative layer, and one of the two CTA buttons.** This is
~60 lines (9% of the page) of gradient and shadow before the calculator — the product —
starts. Both buttons lead to on-page anchors the user can already see below them.

The specific defect: `pt-12 pb-20` plus a three-stop gradient on a phone consumes
roughly the entire first screen for content with no information in it. **A user at a
range opens this page to get a number.** The number should be in the first viewport.

---

## What is weak but should stay

| Item | Line | Verdict |
|---|---|---|
| Skip-to-content link | 38-40 | **Keep.** Correct pattern, well commented. |
| `role="navigation"` on the drawer | 97 | **Keep** the attribute; fix the trap. |
| Cost result cards | 369-383 | **Keep** the structure; they need provenance and sticky behaviour. |
| Safety disclaimer | 643 | **Keep.** Accurate, names real manuals. |

---

## Hostile-to-use specifics

1. **The result is below the fold on mobile** (lines 176-400 stack input then result).
   You scroll on every keystroke.
2. **Proportional digits on a live figure** — `0.193 → 0.418` shifts every digit right
   of the change, so the number appears to move.
3. **A preset button row of nine cartridges** (line 199, `role="group"`) before any
   input. It presumes what the user wants.
4. **One accent doing two jobs.** `emerald-500` (~20 uses) marks both *interactive*
   elements and *positive results*. A button and a good result look the same. In a
   product where "this is good news" and "click me" must never be confused, that is a
   real defect.
5. **No empty state.** Filter the directory to nothing and the grid simply has no
   children — which reads as a broken page, not as "no matches".

---

## The one thing I would fix first

**Add the provenance vocabulary.** Not a restyle, not a gradient, not the icon font.

Add four states (published / derived / estimated / unresolved) plus an explicit "not
recorded", each with a glyph and a word as well as a colour, and apply it to every
number the site shows. Then add `tabular-nums`.

**Reason:** everything else on this list is cosmetic. This one is the difference between
a site that tells the truth and one that looks like it does. The site already knows
which value is which — `data/schemas/*.yaml` records it. The information exists and is
being discarded at the render step, which makes this the cheapest possible fix: **no
new data, no new source, no schema change, no migration.**