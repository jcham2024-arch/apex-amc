# 01 — Method and sources

Task T7 (ammoseek-coverage). How the index was enumerated, how aliases were
normalised, and every source consulted with its licence.

---

## The binding rule, and how it shaped the method

`data/seeds/regulations.csv` carries a verbatim AmmoSeek disclaimer:

> "AmmoSeek.com does not vet or endorse any retailer listed on this site… AmmoSeek,
> LLC is not responsible for inaccurate product information displayed."

So **AmmoSeek is a discovery aid, never a source.** Concretely, this task:

- **DID** read their caliber index to work out *what to look for*.
- **DID NOT** copy any dimension, price, SKU, stock status or retailer rating.
- Answered every "do we have it" question from **our own** `cartridge_specs` seeds.

Every value in the gap table is either (a) a caliber name used as a lookup key, or
(b) a sourcing route pointing at a standards body. **No product data was copied.**

---

## How the index was enumerated

AmmoSeek indexes **600 calibers**. A gap table of 600 rows would be unreadable and
most would be long-tail calibers nobody searches for. So the candidate set was
drawn from two places:

1. **The six calibers the brief named with a published search share** — the
   high-demand end, and the ones the owner's premise is about.
2. **Newly-standardised designs published by SAAMI/CIP** — the calibers a reference
   site is expected to add next.

This is a **judgement, stated openly**: the table is *not* an exhaustive 600-row
diff. It is the top of the demand curve plus the recent-design frontier.

**`search_share_pct` is populated for 6 of 18 rows only** — those are the six the
brief recorded as published. The other 12 are **EMPTY**, not zero and not guessed.
A plausible-looking share figure would be exactly the invention `.clinerules` §5
rule 1 forbids.

---

## Alias normalisation — and why it is not optional

Our names are abbreviated in ways that make naive matching invent gaps:

| AmmoSeek | Ours | Naive verdict |
|---|---|---|
| `9mm Luger` | `9 Luger` | **false gap** |
| `.22LR` | `.22 LR` | **false gap** |
| `.308 Winchester` | `.308 Win` | **false gap** |
| `.223 Remington` | `.223` | **false gap** |
| `5.56x45mm NATO` | — | genuine gap |

The normaliser applies four rules, in this order:

1. `.45 ACP` → `.45 Colt` (same cartridge, two names).
2. Strip `mm` after a digit: `9mm Luger` → `9 luger`.
3. Spell out abbreviations: `Winchester`→`win`, `Remington`→`rem`,
   `Long Rifle`→`lr`.
4. Strip a **trailing** `rem`/`win` only when the numeric part stands alone.

**Rule 4 is the dangerous one** and is deliberately narrow. `.223 Remington` and
`.223` are the same cartridge; `5.56x45 Rem` and `5.56x45 NATO` are **not**. A
cleverer normaliser merging those would be worse than one reporting a false gap,
because it would hide a real difference between military and civilian chambers.

### The negative test, and two bugs it caught

The test checks two things: that alias matching finds cartridges naive matching
called absent, and that genuinely different cartridges stay distinct
(`.223 Remington` vs `.223 WSSM`, `.308 Winchester` vs `.308 Norma`, `.45 ACP` vs
`.45 Win Mag`).

**It found two real bugs in my own normaliser**, neither of which reading would
have caught:

1. Removing `mm` left a double space (`9mm Luger` → `9  luger`), so the whitespace
   collapse had to run *after* that substitution, not before.
2. The rimfire rule anchored on `^\d` while the string still began with `.`, so it
   **never fired on `.22LR`**. The leading-dot strip had to move *before* that rule.

The second matters most: **the rule was silently doing nothing**, and the output
still looked entirely plausible — it just quietly reported a gap we did not have.
That is the `AGENTS.md` trap *"a check that passes while producing wrong output"*
appearing inside an analysis script rather than a gate.

Final result: **0 over-merged pairs**, and alias matching resolves **4 of the 6**
calibers the brief claimed we lacked.

---

## Sources consulted, with licence status

Verified by reading the publisher's own page on **2026-10-02**.

| Source | URL | Licence | What it gives |
|---|---|---|---|
| **CIP TDCC** | `cip-bobp.org/index.php/en/tdcc` | Free download ("All rights reserved"; no purchase stated) | Cartridge + chamber dimensions; max pressure in MPa for most European calibres |
| **SAAMI New & Revised Drawings** | `saami.org/technical-information/cartridge-chamber-drawings/` | Free download | Drawings for newly standardised designs not yet in the Standards |
| **SAAMI Z299 series** | via `opensource_resources.json` | **Purchasable / paywalled** | The full Standards, incl. proof-load pressures |

### What the SAAMI free drawings ACTUALLY cover — confirmed, not assumed

The brief asks me to confirm coverage rather than assume. Reading the page, the
free "New & Revised" section covers **only these newly accepted designs**:

> 5.56 Commercial · 5.7 X 28 FN · 7mm Backcountry · 8.6 Blackout · 21 Sharp ·
> 25 Creedmoor · 25 Weatherby Rebated Precision Magnum · 30 Super Carry ·
> 338 Advanced Rifle Cartridge · 12 Gauge 1¾" · 28 Gauge 3″

Plus a "Revisions" section: `16 ga. 2¾″`, `224 Valkyrie V&P`, `6.5 Grendel`,
`30 Luger`, `44-40 Winchester`, `44 Remington Magnum`.

**This is a far narrower resource than "SAAMI free drawings" suggests.** It covers
what is *new*, not the common calibres — those live in the paid Standards. The page
also warns a revision "not yet folded into the standard is exactly what silently
invalidates a figure we already hold", which matches the warning already recorded
in `opensource_resources.csv`.

**12 Gauge 1¾" is explicitly named**, which makes the shotgun cluster the
best-sourced part of this table — the opposite of what the brief assumed.