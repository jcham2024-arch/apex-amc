# Smokeless Powder Manufacturers & Canister Product Lines (Project Apex AMC)

Reference directory of smokeless (canister-grade) propellant manufacturers and their
current reloading product lines, compiled from manufacturer / primary sources.

- **Compiled:** 2026-09-30
- **Scope:** smokeless propellants sold in consumer "canister" packaging (1 lb / 0.5 kg
  bottles etc.). Military-only / OEM-only bulk propellants and black-powder and
  black-powder substitutes are out of scope and are called out where relevant.
- **Companion data file:** `powders.csv` (same directory).

## Accuracy doctrine applied here

This is safety-critical reference data. Rules used while building these files:

1. **No invented values.** A cell is left EMPTY rather than guessed.
2. **Every row carries a real `source_url` that was actually retrieved** during this
   research pass. Manufacturer/primary sources are preferred; distributor listings are
   used only where the manufacturer blocks automated retrieval and are labelled as such.
3. **`relative_burn_rate_position` is intentionally left EMPTY for every row.** Reliable
   relative positions require transcribing a specific published burn-rate chart; the
   charts that publish them are linked below under *BURN-RATE CHARTS* so the values can be
   derived and verified directly from the primary document instead of being guessed here.
4. **`burn_rate_class` is filled ONLY where the manufacturer's own wording maps cleanly**
   onto the DB enum (`pistol`, `rifle_medium`, `rifle_slow`, `shotgun`). Handgun/handgun-
   and-shotshell powders -> `pistol`; shotshell powders -> `shotgun`; rifle powders are
   left EMPTY unless the maker explicitly says "medium rifle" (-> `rifle_medium`) or
   "heavy / magnum rifle" / ".50 BMG" (-> `rifle_slow`). Splitting "medium" vs "slow"
   rifle powders without a published chart would be a guess, so it is not done.
5. **Charge weights are NOT copied.** Only published *specifications* (calibre/application,
   geometry, series) are recorded. Load data stays in the manufacturer's own document -
   linked, not rehosted.

## Manufacturer directory

| Manufacturer (brand) | Slug | Website | Product line(s) | Primary source retrieved | Notes |
|---|---|---|---|---|---|
| Hodgdon | hodgdon | https://hodgdonpowderco.com | Hodgdon smokeless (rifle/pistol/shotshell) | https://shop.hodgdon.com/brand/hodgdon/ ; https://hodgdonpowderco.com/hodgdon/ | US house brand. Owns the IMR, Winchester, Accurate, Ramshot and Blackhorn brands; also distributes Pyrodex / Triple Seven / White Hots (muzzleloading - out of scope). |
| IMR | imr | https://hodgdonpowderco.com/imr/ | IMR Legendary Powders; IMR Enduron | https://shop.hodgdon.com/brand/imr/ | Brand of Hodgdon Powder Company. |
| Winchester | winchester | https://hodgdonpowderco.com/winchester/ | Winchester smokeless (rifle/pistol/shotshell); StaBALL | https://shop.hodgdon.com/brand/winchester/ | Winchester-brand propellant, manufactured/distributed by Hodgdon. (Distinct from Winchester Ammunition / Olin.) |
| Accurate | accurate | https://hodgdonpowderco.com/accurate/ | Accurate smokeless (rifle/pistol) | https://shop.hodgdon.com/brand/accurate/ | Formerly Western Powders; acquired by Hodgdon (2020). |
| Ramshot | ramshot | https://hodgdonpowderco.com/ramshot/ | Ramshot smokeless (rifle/pistol/shotshell) | https://shop.hodgdon.com/brand/ramshot/ | Formerly Western Powders; acquired by Hodgdon (2020). |
| Alliant Powder | alliant | https://www.alliantpowder.com | Alliant rifle / handgun / shotshell; Reloder, Power Pro | https://www.alliantpowder.com/products/rifle.aspx , /handgun.aspx , /shotshell.aspx | US maker (part of The Kinetic Group / Vista Outdoor). |
| Vihtavuori | vihtavuori | https://www.vihtavuori.com | N100 series, N300 series, N500 series | https://www.vihtavuori.com/reloading-powders/vihtavuori-powders/ ; https://vihtavuori.com/powder-sitemap.xml | Finnish maker, part of Nammo Group (with Lapua, SK, Berger). |
| Reload Swiss | reload-swiss | https://www.reload-swiss.com | RS pistol / rifle powders | https://www.reload-swiss.com/en/product/products | Brand of Nitrochemie Wimmis AG (Switzerland). |
| LOVEX (Explosia) | lovex | https://explosia.cz | LOVEX single-base (S) and double-base (D) reloading powders | https://explosia.cz/en/propellants/reloading-powders/ ; https://explosia.cz/wp-content/uploads/2025/07/Explosia_kat-Propellants-2023_en.pdf | Czech maker Explosia a.s. LOVEX is the reloading brand; also supplies OEM/bulk to third parties. |
| Vectan (Nobel Sport) | vectan | https://www.vectan.fr | Vectan Ba, Tubal, Sp, A ranges | https://www.vectan.fr/UK/range-of-powders | French maker Nobel Sport (NobelSport). |
| ADI World Class Powders | adi-world-class | https://www.adiworldclass.com.au | ADI pistol / rifle / shotgun powders | https://www.adiworldclass.com.au/data-rifle/ ; https://www.adiworldclass.com.au/product-powders/ | Thales Australia. Former domain adi-powders.com.au now redirects to adiworldclass.com.au. |
| Somchem (Rheinmetall Denel Munition) | somchem | https://www.somchemreload.com | Somchem S-series, MS/MP | https://www.somchemreload.com/ | South African maker; Rheinmetall Denel Munition (Pty) Ltd. |
| Shooter's World | shooters-world | https://shootersworldpowder.com | Shooter's World canister propellants | https://web.archive.org/web/20250118234401/https://shootersworldpowder.com/canister-propellants/ (archived) | US supplier (Shooters World, LLC). Rebrands LOVEX OEM propellants under its own names. Live site Cloudflare-protected against automated retrieval; an archived official snapshot was used. |
| Norma | norma | https://www.norma-ammunition.com | Norma reloading powders | https://www.norma-ammunition.com/products/components/gunpowder (category page only) ; names via Vihtavuori Burning Rate Chart | Swedish maker (Norma Precision AB, Beretta Holding). Own site did not publish the individual powder names at the time of retrieval. |
| RWS / Rottweil | rws | https://www.rws-ammunition.com | RWS/Rottweil P80x and R90x powders | https://www.rws-ammunition.com/en/ ; names via Vihtavuori Burning Rate Chart | RWS/Rottweil propellants (RUAG Ammotec origin; now Beretta Holding). Own site did not enumerate the powder names at the time of retrieval. |
| MAXAM | maxam | https://www.maxam.net | (not enumerated) | https://web.archive.org/web/20210625002817/https://www.maxam.net/en (404) | Spanish group (MaxamCorp). Owns Nobel Sport/Vectan. Product line NOT verified in this pass - site blocked automated retrieval. |
| Baschieri & Pellagri | baschieri-pellagri | https://www.baschieriepellagri.com | (not enumerated) | (blocked, HTTP 422) | Italian maker (shotgun-oriented). Product line NOT verified in this pass. |
| Cheddite France | cheddite | https://www.cheddite.com | (primers, cases, loaded shotshells) | https://www.cheddite.com/ | French maker of primers/cases/shells. NO canister smokeless reloading-powder line was found on its site, so it is listed for completeness only. |

### Companies considered and deliberately excluded

| Company | Website | Reason excluded |
|---|---|---|
| Eurenco / PB Clermont | https://www.eurenco.com | Military/defence and OEM bulk propellants; no consumer canister reloading line identified. |
| GOEX | https://www.goexpowder.com | Black powder (not smokeless). Distributed by Hodgdon. |
| Hodgdon Blackhorn 209 / Pyrodex / Triple Seven / White Hots | https://hodgdonpowderco.com | Black-powder substitutes / muzzleloading propellants, not smokeless. |
| Fiocchi, Sellier & Bellot, Magtech etc. | - | Ammunition makers; not canister smokeless powder lines. |

## Per-manufacturer product lists

Product names are spelled exactly as the manufacturer does. Product-page URLs are the
manufacturer's own where available. `burn_rate_class` values shown here are the ones
carried into `powders.csv` (see the doctrine above for when a class is left blank).

### Hodgdon (https://hodgdonpowderco.com)

Source: https://shop.hodgdon.com/brand/hodgdon/ (pages 1-3) and
https://hodgdonpowderco.com/hodgdon/

**Rifle:** H1000, Varget, H4350, Retumbo, H4895, CFE 223, H4831SC, H335, H4198, CFE BLK,
BL-C(2), LEVERevolution, Superformance, H322, H380, H4831, Benchmark, Hybrid 100V,
H50BMG, US 869, Trail Boss (reduced rifle loads).

**Pistol:** Titegroup, CFE Pistol, H110, HP-38, HS-6, Lil'Gun, Longshot.

**Shotshell:** Titewad, Hi-Skor 700-X, Clays, International, Universal, High Gun,
Perfect Pattern.

Product pages (examples): https://shop.hodgdon.com/hodgdon-h1000/ ,
https://shop.hodgdon.com/hodgdon-varget/ , https://shop.hodgdon.com/hodgdon-h4350/ ,
https://shop.hodgdon.com/hodgdon-titegroup/ , https://shop.hodgdon.com/hodgdon-h110/ ,
https://shop.hodgdon.com/hodgdon-clays/ , https://shop.hodgdon.com/hodgdon-universal/ .
Reloading data center: https://hodgdonreloading.com/

### IMR (https://hodgdonpowderco.com/imr/)

Source: https://shop.hodgdon.com/brand/imr/

IMR Legendary Powders: IMR 3031, IMR 4064, IMR 4895, IMR 4198, IMR 4227, IMR 4350,
IMR 4831, IMR 7828 SSC, IMR 8208 XBR.
IMR Enduron: IMR Enduron 4166, IMR Enduron 4451, IMR Enduron 4955, IMR Enduron 7977,
IMR Enduron 8133.

### Winchester (https://hodgdonpowderco.com/winchester/)

Source: https://shop.hodgdon.com/brand/winchester/

Winchester 748, 760, 231, 296, 572, AUTOCOMP, WST, Super Field, WinClean 244,
Super Handicap, StaBALL 6.5, StaBALL HD, StaBALL Match.

### Accurate (https://hodgdonpowderco.com/accurate/)

Source: https://shop.hodgdon.com/brand/accurate/

Accurate No. 2, No. 5, No. 7, No. 9, 1680, 2200, 2230, 2460, 2495, 2520, 4064, 4350,
5744, 11FS, MAGPRO, Nitro 100 New Formulation, LT-32, TCM, High Country.

### Ramshot (https://hodgdonpowderco.com/ramshot/)

Source: https://shop.hodgdon.com/brand/ramshot/

Ramshot TAC, X-Terminator, Big Game, Hunter, Magnum, LRT, Grand, Competition,
Silhouette, True Blue, Zip, Enforcer.

### Alliant Powder (https://www.alliantpowder.com)

Sources: https://www.alliantpowder.com/products/rifle.aspx ,
https://www.alliantpowder.com/products/handgun.aspx ,
https://www.alliantpowder.com/products/shotshell.aspx

**Rifle (Reloder / Power Pro):** AR-Comp, Power Pro 1200-R, Power Pro 2000-MR,
Power Pro 4000-MR, Power Pro Varmint, Reloder 7, Reloder 10X, Reloder 15,
Reloder TS 15.5, Reloder 16, Reloder 17, Reloder 19, Reloder 22, Reloder 23,
Reloder 25, Reloder 26, Reloder 33, Reloder 50.

**Handgun:** Sport Pistol, 2400, BE-86, Bullseye, Power Pistol, Power Pro 300-MP, Unique.

**Shotshell:** 20/28, 410, American Select, Blue Dot, Clay Dot, e3, Extra-Lite, Green Dot,
Herco, Pro Reach, Promo, Red Dot, Steel, Unique.

The manufacturer's own description of each powder ("Smokeless medium rifle",
"Smokeless magnum rifle powder", "Smokeless pistol", "Smokeless Shotshell Powder", etc.)
is what drives the `burn_rate_class` mapping in the CSV.

### Vihtavuori (https://www.vihtavuori.com)

Sources: https://www.vihtavuori.com/reloading-powders/vihtavuori-powders/ and
https://vihtavuori.com/powder-sitemap.xml

**N100 series (rifle, single-base):** N110, N120, N130, N133, N135, N140, N150, N160,
N165, N170, 24N41, 20N29.
**N300 series (handgun/shotgun, porous single-base):** N310, N320, N330, N340, N350,
3N37, 3N38, N105.
**N500 series (rifle, high-energy):** N540, N550, N555, N560, N565, N568, N570.

Note: N105 appears in Vihtavuori's own consumer-package chart (on the fetched
`vihtavuori-powders` page) but is absent from the current `powder-sitemap.xml`; it is
therefore flagged as *possibly discontinued - verify before use*.

### Reload Swiss (https://www.reload-swiss.com)

Source: https://www.reload-swiss.com/en/product/products

**Pistol/short-gun:** RS12, RS14, RS20, RS24, RS30.
**Rifle/long-gun:** RS36, RS40, RS50, RS52, RS60, RS62, RS70, RS76, RS80.

Note: the manufacturer page states verbatim "_Our propellant RS30 will be removed from the
portfolio in 2025._" - treat RS30 as discontinued.

### LOVEX / Explosia (https://explosia.cz)

Sources: https://explosia.cz/en/propellants/reloading-powders/ and
https://explosia.cz/wp-content/uploads/2025/07/Explosia_kat-Propellants-2023_en.pdf

**Single-base (S, tubular):** S040, S053, S062, S065, S070, S071.
**Double-base (D):** D032, D036, D037.1, D037.2, D063, D073.4, D073.5, D073.6, D100.

LOVEX also produces the "Vesuvit" black powders (LC, LC-1, LC-2) - out of scope here.
Explosia states the catalogue "has been specifically selected from the entire range of
powders produced by our company" - i.e. the OEM/internal range is larger than the
published reloading line.

### Vectan (Nobel Sport) (https://www.vectan.fr)

Source: https://www.vectan.fr/UK/range-of-powders

- **Ba range (single-base stick, handgun):** Ba10, Ba9 1/2, Ba9, Ba7 1/2, Ba6 1/2.
- **Tubal range (tubular single-base, rifle):** Tubal 3000, Tubal 5000, Tubal 7000,
  Tubal 8000.
- **Sp range (spherical/flattened double-base, handgun + rifle):** Sp 2, Sp 3, Sp 7,
  Sp 8, Sp 9, Sp 10, Sp 11, Sp 12, Sp 13.
- **A range (single-base flake, handgun):** A1, AS, A0.

Reloading tables: https://www.vectan.fr/UK/reloading-charges
(pistol / rifle / black-powder), catalogue:
https://www.vectan.fr/images/files/NS-23-12-CATALOGUE-PP-WEB.pdf

### ADI World Class Powders (Thales Australia) (https://www.adiworldclass.com.au)

Source: https://www.adiworldclass.com.au/data-rifle/ (powder selector) and
https://www.adiworldclass.com.au/product-powders/

Pistol/shotgun powders: APS350, AS30N, APS450, AP50N, AP70N, AP100.
Rifle powders: AR2205, AR2207, Bench Mark 1, AR2219, Bench Mark 2, Bench Mark 8208,
AR2206, AR2206H, AR2208, AR2209, AR2213SC, AR2217, AR2225, AR2218.
Reduced/recreational: Trail Boss.

Load data: https://www.adiworldclass.com.au/data-pistol/ ,
https://www.adiworldclass.com.au/data-rifle/ ,
https://www.adiworldclass.com.au/data-shotgun/ ,
https://www.adiworldclass.com.au/data-single-action/ .
Bushing charts: https://www.adiworldclass.com.au/shotgun-powder-bushing-charts/

### Somchem / Rheinmetall Denel Munition (https://www.somchemreload.com)

Source: https://www.somchemreload.com/ and the per-product `/propellants/<name>` pages

S121, S221, S265, S321, S335, S341, S355, S361, S365, S385, MS200, MP200.

### Shooter's World (https://shootersworldpowder.com)

Source (archived official snapshot):
https://web.archive.org/web/20250118234401/https://shootersworldpowder.com/canister-propellants/
and https://web.archive.org/web/20250517023621/https://shootersworldpowder.com/products/

Canister propellants: Sparta 100, Competition, Clean Shot, Ultimate Pistol, Auto Pistol,
Major Pistol, Heavy Pistol, Buffalo Rifle, SOCOM, Blackout, AR-Plus, Tactical Rifle,
Match Rifle, Precision Rifle, Long Rifle, SW4350, SW 50BMG.
(Multi Purpose Black and The Hunter are black-powder substitutes - out of scope.)

The manufacturer's own burn-rate chart maps several of these to their LOVEX OEM
designations (e.g. Clean Shot = D032-03, Ultimate Pistol = D036-07, Auto Pistol = D036-03,
Major Pistol = D037-01, Heavy Pistol = D037-02, Blackout = D063, Precision = S062,
Long Rifle = S065, SW4350 = S070). Some pairs in the chart could not be read
unambiguously and are flagged in the CSV.

### Norma (https://www.norma-ammunition.com)

Source for names: Vihtavuori Burning Rate Chart (cross-reference, see BURN-RATE CHARTS).
Norma's own components page (https://www.norma-ammunition.com/products/components/gunpowder)
confirms it sells "Gunpowder" but does not publish the individual names in the HTML.

Powder designations: 200, 201, 202, 203B, URP, 204, MRP, 217.

### RWS / Rottweil (https://www.rws-ammunition.com)

Source for names: Vihtavuori Burning Rate Chart (cross-reference, see BURN-RATE CHARTS).
RWS's own site did not enumerate the powder names in the HTML retrieved.

Powder designations: P801, P803, P804, P805, P806, R901, R902, R903, R904, R905, R907,
R910.

## Burn-rate charts

These are the primary documents that publish the relative ordering of the powders above.
Use these (not this file) to populate `relative_burn_rate_position`.

- Vihtavuori Burning Rate Chart (cross-brand, fastest -> slowest; includes Vihtavuori,
  Norma, RWS, Vectan, Reload Swiss, IMR, Hodgdon, Accurate, Winchester, Alliant, Ramshot):
  https://vihtavuori.com/wp-content/uploads/2025/11/Vihtavuori_BurningRateChart_Tabloid.pdf
- Hodgdon "Relative Burn Rates" (linked from the Hodgdon Reference Data page):
  https://hodgdonpowderco.com/reference-data/
- Shooter's World burning-rate chart (fast -> slow, with LOVEX OEM column):
  https://web.archive.org/web/20250118234401/https://shootersworldpowder.com/canister-propellants/

## DOWNLOADABLE PUBLISHED DATA

Markdown table (`url | publisher | document_title | doc_type | year`):

| url | publisher | document_title | doc_type | year |
|---|---|---|---|---|
| https://vihtavuori.com/wp-content/uploads/2025/11/Vihtavuori_BurningRateChart_Tabloid.pdf | Vihtavuori | Vihtavuori Burning Rate Chart (Tabloid) | burn rate chart (PDF) | 2025 |
| https://hodgdonpowderco.com/reference-data/ | Hodgdon | Reference Data (Relative Burn Rates + bushing charts) | reference data page (HTML) | 2026 |
| https://hodgdonpowderco.com/reloading-manuals-library/ | Hodgdon | Reloading Manuals Library | manuals index (HTML) | 2026 |
| https://hodgdonpowderco.com/wp-content/uploads/2026/04/AM23.pdf | Hodgdon | 2023 Annual Manual | reloading manual (PDF) | 2023 |
| https://hodgdonpowderco.com/wp-content/uploads/2026/04/2023-MDATA.pdf | Hodgdon | 2023 Muzzleloading Manual | muzzleloading manual (PDF) | 2023 |
| https://hodgdonpowderco.com/wp-content/uploads/2026/04/AM22.pdf | Hodgdon | 2022 Annual Manual | reloading manual (PDF) | 2022 |
| https://hodgdonpowderco.com/wp-content/uploads/2026/04/AM21.pdf | Hodgdon | 2021 Annual Manual | reloading manual (PDF) | 2021 |
| https://hodgdonpowderco.com/wp-content/uploads/2026/04/AM20.pdf | Hodgdon | 2020 Annual Manual | reloading manual (PDF) | 2020 |
| https://hodgdonpowderco.com/wp-content/uploads/2026/04/AM19-LR.pdf | Hodgdon | 2019 Annual Manual | reloading manual (PDF) | 2019 |
| https://hodgdonpowderco.com/wp-content/uploads/2026/04/AM18-LR-File.pdf | Hodgdon | 2018 Annual Manual | reloading manual (PDF) | 2018 |
| https://hodgdonpowderco.com/wp-content/uploads/2026/04/AM17-LR-File.pdf | Hodgdon | 2017 Annual Manual | reloading manual (PDF) | 2017 |
| https://hodgdonpowderco.com/wp-content/uploads/2023/04/WesternPowdersHandloadingGuide8.0_WEB-1.pdf | Hodgdon (Ramshot) | Ramshot Complete Load Guide, Edition 8.0 | load guide (PDF) |  |
| https://hodgdonpowderco.com/wp-content/uploads/2023/04/BushingData-Competition-1.pdf | Hodgdon (Ramshot) | Ramshot Competition Bushing Data | bushing chart (PDF) |  |
| https://hodgdonpowderco.com/wp-content/uploads/2023/04/Wild_Boar_Data-1.pdf | Hodgdon (Ramshot) | Ramshot Wild Boar Data (European availability) | load data (PDF) |  |
| https://hodgdonpowderco.com/wp-content/uploads/2023/04/Accurate_DP2230-C-1.pdf | Hodgdon (Accurate) | Accurate 2230-C data | load data (PDF) |  |
| https://hodgdonpowderco.com/wp-content/uploads/2023/04/Accurate_2230-s-1.pdf | Hodgdon (Accurate) | Accurate 2230-S data | load data (PDF) |  |
| https://hodgdonpowderco.com/wp-content/uploads/2023/04/Accurate_DP68-1.pdf | Hodgdon (Accurate) | Accurate DP68 data | load data (PDF) |  |
| https://hodgdonpowderco.com/wp-content/uploads/2023/04/Accurate_DP73-1.pdf | Hodgdon (Accurate) | Accurate DP73 data | load data (PDF) |  |
| https://hodgdonpowderco.com/wp-content/uploads/2023/04/Accurate_DP74-1.pdf | Hodgdon (Accurate) | Accurate DP74 data | load data (PDF) |  |
| https://hodgdonpowderco.com/wp-content/uploads/2023/04/Accurate_DP79-1.pdf | Hodgdon (Accurate) | Accurate DP79 data | load data (PDF) |  |
| https://hodgdonpowderco.com/wp-content/uploads/2023/04/Accurate_DP85-1.pdf | Hodgdon (Accurate) | Accurate DP85 data | load data (PDF) |  |
| https://hodgdonpowderco.com/wp-content/uploads/2023/04/Accurate_DP86-1.pdf | Hodgdon (Accurate) | Accurate DP86 data | load data (PDF) |  |
| https://hodgdonpowderco.com/wp-content/uploads/2023/04/Blackhorn_209_b209blackpowdercartridgedata-1.pdf | Hodgdon | Blackhorn 209 Cartridge Data | cartridge data (PDF) |  |
| https://hodgdonpowderco.com/wp-content/uploads/2024/12/MZ-DATA-BH209.pdf | Hodgdon | Blackhorn 209 Muzzleloader Rifle data | load data (PDF) | 2024 |
| https://hodgdonreloading.com/ | Hodgdon | Hodgdon Reloading Data Center | load data (web app) | 2026 |
| https://www.alliantpowder.com/resources/catalog/AP399_2023AlliantPowderReloadersGuide_SinglePgsNoCrops.pdf | Alliant Powder | 2023 Alliant Powder Reloader's Guide | load guide (PDF) | 2023 |
| https://www.alliantpowder.com/reloaders/default.aspx | Alliant Powder | Reloader's Guide (online) | load data (HTML) | 2026 |
| https://explosia.cz/wp-content/uploads/2025/07/Explosia_kat-Propellants-2023_en.pdf | Explosia (LOVEX) | Propellants Catalogue (EN) | product catalogue (PDF) | 2023 |
| https://www.vectan.fr/images/files/NS-23-12-CATALOGUE-PP-WEB.pdf | Nobel Sport / Vectan | Vectan catalogue ("Poudres & Passions") | product catalogue (PDF) |  |
| https://www.vectan.fr/UK/reloading-charges | Nobel Sport / Vectan | Reloading charges (tables) | load data (HTML) |  |
| https://www.adiworldclass.com.au/data-rifle/ | ADI World Class Powders | Rifle load data | load data (HTML) | 2024 |
| https://www.adiworldclass.com.au/data-pistol/ | ADI World Class Powders | Pistol load data | load data (HTML) | 2024 |
| https://www.adiworldclass.com.au/data-shotgun/ | ADI World Class Powders | Shotgun load data | load data (HTML) | 2024 |
| https://www.adiworldclass.com.au/data-single-action/ | ADI World Class Powders | Single Action load data | load data (HTML) | 2024 |
| https://www.adiworldclass.com.au/shotgun-powder-bushing-charts/ | ADI World Class Powders | Shotgun powder bushing charts | bushing charts (HTML) | 2024 |
| https://www.adiworldclass.com.au/powder-equivalents/ | ADI World Class Powders | Powder equivalents | cross-reference (HTML) | 2024 |
| https://vihtavuori.com/reloading-data/reloading-data-tool/ | Vihtavuori | Reloading Data Tool | load data (web app) | 2026 |
| https://www.reload-swiss.com/en/tools/relative-burn-off-velocity | Reload Swiss | Relative burn-off velocity | burn rate reference (HTML) | 2026 |
| https://www.reload-swiss.com/en/loading-data/rs-loading-data | Reload Swiss | RS loading data | load data (HTML) | 2026 |
| https://www.somchemreload.com/ | Somchem (RDM) | Somchem reloading data (per-propellant pages) | load data (HTML) | 2026 |
| https://web.archive.org/web/20250118234401/https://shootersworldpowder.com/canister-propellants/ | Shooter's World | Canister Propellants (burn-rate chart + LOVEX OEM map) | product + burn rate chart (archived HTML) | 2025 |

**Notes on the table:** URLs above were *link-validated*: each was read off a page that was
actually retrieved from the publisher (or, for the Shooter's World row, an official archived
snapshot). The Vihtavuori, Explosia, Alliant Reloader's Guide and Hodgdon reference/manual
PDFs were additionally opened and parsed. Some Hodgdon PDFs (e.g. the individual Accurate
"DP" data sheets) were link-validated only - verify each file when archiving.
