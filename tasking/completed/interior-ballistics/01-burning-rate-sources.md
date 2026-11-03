# T5 / 01 — Sources of quantitative smokeless-powder properties

**Task:** interior-ballistics. **Compiled:** 10 Feb 2026.
**Write-set:** this folder only.

**Headline finding, stated first because it governs everything else:**

> **No manufacturer publishes a physical burn rate for any reloading powder.** Not
> Vihtavuori, not Hodgdon/HTM, not Alliant, not Ramshot, not IMR. Every
> consumer-available burn-rate figure is a *relative ordering*. The literature that
> does contain physical rates measures laboratory and rocket propellants, not
> retail gunpowder. The quantitative columns this project needs are not merely
> empty — **they are not obtainable from any source we can lawfully read.**

---

## 1. Method, and what a "no" here actually means

Each source below was opened and read, not inferred from a search snippet. PDFs
were parsed (a raw fetch returns binary and cannot be read as text; that is a tool
limitation, not evidence — see §7).

Three states, and this distinction is the most useful output of the document:

| State | Meaning | Usable? |
|---|---|---|
| **A. Quantitatively physical** | burn rate in m/s or mm/s at a stated reference pressure, or a pressure exponent | Yes, subject to licence |
| **B. Relative ordering** | a rank in a chart, explicitly "relative", not on a physical scale | No, not as a physics input |
| **C. Load data only** | charge/velocity/pressure for a listed combination | As an observation, never as a physical constant |

Every commercial source found is **B**. The literature is **A** but on materials we
do not sell.

---

## 2. Vihtavuori (Nammo Lapua Oy)

### 2.1 What is published

`data/seeds/powder_burn_rate_positions.csv` already holds the Vihtavuori chart as
22 rows. Measured: 22 data rows with a `column_total` of 22 — a **rank 1..22 within
one brand's own chart**.

From the Vihtavuori Reloading Guide, Edition 13 (35 pp.,
`https://www.krale.shop/media/blfa_files/vihtavuori_reloading_guide_13.pdf`,
retrieved 10 Feb 2026), parsed pp. 1–9 verbatim:

> "Current canister powders in order of *approximate* burning rate. This list is
> for reference only and **not** to be used for developing loads."

Three things in one sentence:

1. **"approximate"** — the manufacturer declines to call it exact.
2. **relative** — an order, explicitly, not a rate.
3. **"not to be used for developing loads"** — the publisher forbids the exact use
   this project wants. Not an engineering problem; a stated boundary by the owner
   of the data.

The Edition 13 chart spans **ten brands** (Vihtavuori, Norma, RWS, Vectan, PB, IMR,
Hodgdon, Accurate, Western, Alliant, Ramshot), which superficially looks like a
cross-brand common scale. It is not one. It is one vendor's *opinion* about where
other vendors' products fall — no method, no date, no uncertainty — and the same
powder appears at a different position in other charts (§2.3).

Also checked on the same pages:

- **Absolute burn rate (mm/s or m/s at a reference pressure): not published.**
- **Pressure exponent: not published.**
- **Powder density:** *qualitative only* — "bulk density" for the N500 series and
  "low bulk density" for N32C (Tin Star). **No numerical density or loading-density
  values given.**

### 2.2 Licence status

- The guide is a **copyrighted commercial publication**. Page 1 carries no
  Creative Commons or open-data licence; no redistribution permission on pp. 1–9.
- Site footer reads "© Vihtavuori 2026", a bare copyright mark.
- **Conclusion: copyrighted, all rights reserved by default.** Usable as a citation
  and for internal reasoning; **not redistributable** in our dataset or on the site.
  Same position T4 reaches for CIP tables.

### 2.3 Chart-conflict evidence

Independent confirmation that these charts are not commensurate across brands:

- Rugerforum: "Relative burn rate locations for the same powder vary on different
  burn rate charts. Load data for the same cartridge varies manual to manual."
- Nosler forum: "Powder burn rates are always relative, varying considerably batch
  to batch."
- Hodgdon's own chart (§3) assigns ordinal positions differing from Vihtavuori's.

Measured counter-evidence to any attempt to place two brands on one scale.

---

## 3. Hodgdon / HTM (and the Accurate brand)

### 3.1 What is published

`https://hodgdonpowderco.com/reference-data/` (retrieved 10 Feb 2026). The page's
own link text is **"Relative Burn Rates"** — not "burn rates".

The linked PDF is titled, verbatim from its first line:

> "RELATIVE BURN RATES FROM FASTEST TO SLOWEST (rev. NOV '23)"

and assigns ordinal positions (1, 27, 42, … 170) rather than any physical unit.

**No absolute burn rate. No pressure exponent. No numerical powder density.**

One genuine quantitative nugget, recorded because it is real and sourced — but note
it is a *historical* bulk-density figure for a discontinued product:

> "When No 2 initially came on the market in the late 1980's it was merely called
> No2, and it had **a higher bulk density** i.e. ca 0.750 to 0.800 **grams/cc**."
> — `https://hodgdonpowderco.com/accurate/`

Bulk density in g/cc for **historical** Accurate No.2, not the current product, and
bulk density is not the loading density the physics needs. In the CSV marked as
such, and **not** as a current value.

### 3.2 Licence status

No copyright, trademark, reproduction, redistribution or licence notice appears on
`/reference-data/` (checked by direct read). All content © Hodgdon Powder Company.
**Default: all rights reserved.** Cite, do not republish.

---

## 4. Hornady Load'n'Lube

`https://www.hornady.com/support/load-data/` (retrieved 10 Feb 2026) publishes
**load data**, not powder properties. Two findings worth recording:

1. Hornady's load data is a **paid product**: "Re-loading data is available as low
   as 99¢ per cartridge or as a subscription for $19.99." A commercial licence —
   redistribution is a saleable good, not merely uninvited.
2. A **live safety erratum**: "The 6.5 PRC entry in the 12th Edition Hornady Handbook
   of Cartridge Reloading contains a misprinted powder... The powder listed as
   StaBall Match should correctly read StaBall HD."

Load'n'Lube burn-velocity ratings (a ~101–110 style index) are a **relative
manufacturer index**, same class as the burn-rate charts: no reference pressure, no
units, no uncertainty. No primary Hornady page publishing the index definition was
found, so **the CSV leaves those cells EMPTY** rather than characterising it from
forum discussion.

The erratum is recorded not as physics but as **evidence about the medium**: a single
misprint in a printed handbook produced a wrong-powder load that Hornady itself says
"could result in dangerously high pressures." See §6.

---

## 5. Peer-reviewed literature

Searched the PubMed/arXiv-indexed literature for closed-vessel measurement of
burning rate and pressure exponent. Physical rates exist here — and it is the
clearest demonstration of why they cannot help us.

| Paper | Material | Rate at stated P? |
|---|---|---|
| `pmcid:PMC7411880` (doi 10.3390/ma13143243) *On Influence of Mechanical Properties of Gun Propellants on Their Ballistic Characteristics Determined in Closed Vessel Tests* | gun propellants, mechanical-property study | Yes — **research** propellants |
| `pmcid:PMC12772397` *Preparation and Characterization of Porous Propellants by Template Leaching with PAAK* | laboratory porous propellants | Yes |
| `pmid:19959284` NG/TEGDN/NC | laboratory composite | Yes |
| `pmcid:PMC8537742` *Metal Nanopowders on the Performance of Solid Rocket Propellants* | **rocket** propellants | Yes |
| `pmid:38856526` synchronized burn-rate measurement | solid rocket specimen | Yes |
| `pmid:31043046` high-pressure combustion chamber, 0.4 mbar–200 bar | instrumentation | n/a |

Three conclusions, the third decisive:

1. The literature confirms the geometric/Viebig law is *often violated* —
   PMC7411880's finding is that "closed vessel tests prove that the burning process
   of some propellants deviates from the geometric law." A model that assumes it is
   already known to be wrong in detail.
2. Rates exist **only for laboratory or rocket propellants**. Nobody publishes
   closed-vessel rates for IMR 4895 or Hodgdon Varget.
3. Producing commercial-powder rates would require **destroying the powder in a
   rated closed vessel** — a licensed, pressure-rated laboratory. A real, finite,
   expensive programme (see `05-feasibility-verdict.md`), not a scrape.

The MDPI paper at `https://www.mdpi.com/1996/1073/15/7/2680` returned HTTP 403 to
automated fetch; it has **not** been read and **no claim** is made about it.

---

## 6. A source that is not a data source: what the medium does to numbers

Two manufacturer statements bear on this project's YMYL posture, neither about
burn rate.

**Berger** (`https://bergerbullets.com/shoot-better/shooting-knowledge/reloading-disclaimer/`):

> "It is a well-known fact that the same powder type will produce different velocity
> and pressure from one lot to another. This is why we recommend that you do not
> exceed the maximum charges listed in this manual since one lot of powder of a
> specific type may produce velocity and pressure that is lower than listed. It is
> also possible and likely that another lot of the same powder will produce higher
> velocity and pressure using the same charge."

> "it is impossible to provide perfectly consistent data between all manuals and
> websites that provide load data because of performance variations from one lot to
> another."

**Nammo Lapua** (Vihtavuori guide, "Pressure" section):

> "The internal dimensions of a firearm can vary greatly even between two of the
> same make and model... Each change in brand and even within different lots of a
> specific brand component can cause notable ballistic changes."

**Interpretation, and it is the central one:** lot-to-lot variation is acknowledged
*by the manufacturers who generated the tables*. A model built on published load
data inherits that variation and cannot know which side of it a given lot falls on.
Any feature that outputs a load number inherits an irreducible uncertainty that
**no amount of modelling removes**, because the input data is not reproducible.

---

## 7. What was NOT established — stated rather than papered over

Per `.clinerules` §5 rule 1, recorded as unknowns rather than filled in:

- **No primary Hornady page defining the Load'n'Lube burn-velocity index.** Not
  sourced → EMPTY.
- **MDPI 15/7/2680 unread** (HTTP 403). No claim made about it.
- **PMC7411880 full text not retrieved.** Abstract cited; **numbers not quoted**,
  because they were not read.
- **No numerical density for any current powder** of any of our 7 brands.
- **Alliant / Ramshot / IMR** were not individually scraped; Vihtavuori's chart
  covers them as third-party opinions. This is a **coverage gap, not a finding that
  they publish nothing.**
- Whether HTM publishes anything quantitative **for a fee** — not checked.

## 8. Licence summary

| Source | Absolute rate? | Licence | Redistributable? |
|---|---|---|---|
| Vihtavuori guide ed. 13 | No — relative, "not to be used for developing loads" | © Nammo, no open licence | **No** |
| Vihtavuori burn-rate chart | No — rank 1..22 | © Vihtavuori | **No** |
| Hodgdon reference data | No — "RELATIVE BURN RATES" | © Hodgdon, no notice | **No** |
| Hornady handbook / Load'n'Lube | No — index; load data is paid | Commercial sale | **No** |
| Peer-reviewed papers | Yes, on research/rocket propellants | Varies (PMC/MDPI often CC-BY) | Sometimes — wrong material |

**Bottom line:** every lawfully-readable commercial source is relative; every
physical source concerns material we do not sell. There is no third path.