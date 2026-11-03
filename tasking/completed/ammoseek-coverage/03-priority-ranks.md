# 03 — Priority ranks

Task T7. A ranked shortlist of what would most change the site's usefulness.

**Weighting:** search demand where published, how much of the missing data is
dimensional vs. pressure, and sourcing feasibility. Where search share is not
published it is **EMPTY**, and the row is ranked on feasibility and coverage
instead of on an invented demand figure.

---

## The top 10

| # | Caliber | Why | Feasibility |
|---|---|---|---|
| 1 | **12 Gauge** | Highest-demand **genuine** gap we hold nothing for. Zero gauge coverage. And it is **explicitly named** on SAAMI's free drawings page — 5.79% share, free source | `easy` |
| 2 | **5.56x45mm NATO** | Highest-demand gap after 12 Gauge (9.62%). No metric rimfire at all — our entire 5.6× family is sporting designs | `easy` for CIP; STANAG needed for chamber |
| 3 | **.410 Bore** | Completes the gauge entry point; CIP covers dimensions | `easy` dimensions, `licence-gated` pressure |
| 4 | **8.6 Blackout** | Named on SAAMI free page; widely fielded; we have nothing near it | `easy` |
| 5 | **25 Creedmoor** | Named on SAAMI free page; fast-growing varmint cartridge | `easy` |
| 6 | **6.5 Creedmoor** | **Already held** — but 0/6 dimensional columns populated. Highest-value row on this list for that reason | `easy` |
| 7 | **30 Super Carry** | Named on SAAMI free page; handgun demand, and our pistol file has only 16 rows | `easy` |
| 8 | **5.7x28 FN** | Named on SAAMI free page; fills a PDW/carbine hole in a rifle-dominant set | `easy` |
| 9 | **28 Gauge 3″** | Named on SAAMI free page; same free route as 12 Gauge | `easy` |
| 10 | **338 Advanced Rifle** | Named on SAAMI free page; premium long-range tier | `easy` |

**Rows 6 is the tell.** 6.5 Creedmoor is a cartridge we *already hold*, and it still
earns a top-10 slot — because depth is worth more than breadth right now. If this
list were purely "add what we lack", it would have no row we already hold in it.

---

## Ranks 11–18 (lower priority)

21 Sharp, 25 Weatherby Rebated, 7mm Backcountry, 5.56 Commercial, 20 Gauge, 8
Gauge. All free-sourced and all named on the SAAMI page, but with no published
demand figure and thinner real-world use than the ten above.

---

## What the ranking exposes about the owner's premise

The premise was "we lack the cartridges they index." **That is mostly false.**

Of the six calibers the brief named as our biggest gaps, alias matching proved we
already hold **four** — 9mm Luger, .22LR, .308 Winchester and .223 Remington,
together accounting for **36.2% of their published search share**:

| Caliber | Their share | Reality |
|---|---|---|
| 9mm Luger | 19.75% | **held** as `9 Luger` |
| .22LR | 7.35% | **held** as `.22 LR` |
| .308 Winchester | 4.96% | **held** as `.308 Win` |
| .223 Remington | 4.24% | **held** as `.223` |
| **Total** | **36.30%** | **already covered** |

Only **5.56x45mm NATO (9.62%)** and **12 Gauge (5.79%)** — **15.41% combined** — are
genuinely absent.

**So the real gap is not breadth. It is depth, and one data-quality defect.**

---

## Three findings the ranking surfaces

### 1. 9mm Luger is filed under `rifle`

`9 Luger` lives in `data/seeds/cartridge_specs/rifle.csv` with `family=rifle`. It is
the most-searched cartridge on the index and it is filed in the wrong family.
`.22 LR` is likewise in `rifle` rather than a rimfire family.

That is a **data defect outside this task's write-set** — I am not touching it. It
should be raised as its own reviewed task, because family drives presentation and
filtering on the site.

### 2. Depth beats breadth

With all six dimensional columns at 0/229, the 229 cartridges we already hold have
**no dimensions**. Populating dimensions for calibers we already have is a larger
usefulness gain than adding another 20 names, and the sources are free.

### 3. The sources are better than expected

Every genuine gap in this table has a **free, named, primary** source:
SAAMI's free drawings cover the new designs including 12 Gauge and 28 Gauge; CIP
TDCC covers the dimensional tables. Only shotgun **max pressure** is
licence-gated (SAAMI Z299.5, purchasable).

**There is no licence wall on this task.** The barrier is transcription effort, not
permission — which changes what the next task should actually be.