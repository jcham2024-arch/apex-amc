# T6-01 — External trajectory / drag datasets: candidate survey and oracle verdicts

**Task:** exterior-ballistics (brief id T6). **Author:** scout-data sub-agent.
**Scope:** research only. Nothing in the main tree was modified. This file is task
output under `tasking/in-progress/exterior-ballistics/`, moving to
`tasking/completed/exterior-ballistics/`.

**Note on T2:** `docs/research-oracles/` did **not** exist when this task started
(re-verified in the final session: `Test-Path docs/research-oracles` -> `False`). T2's
methods findings were therefore unavailable. Where T2's work would have changed a
verdict, that is called out explicitly in section 7.

---

## 1. The test being applied (binding)

From `data/reference/README.md`:

1. **Stated test conditions** — barrel length, temperature, pressure, altitude.
   *"Data without conditions cannot be checked, only admired."*
2. **Stated uncertainty** — an SD, an ES, or an explicit tolerance.
   *"A number with no error bar can never fail a comparison."*
3. **Independent derivation** — not produced by our own code or assumptions.

A candidate must satisfy **all three** to be marked `ORACLE`. Anything else is marked
`NOT-AN-ORACLE` and the failing part is named. There is no partial credit.

---

## 2. Machine-readable verdict table

This table is the authoritative index. `tmp/t6-oracle-check.mjs` parses it and exits
non-zero if any row is marked `ORACLE` without `yes` in all three test columns. That
check is proven to fail on deliberately broken input in section 6 of `REPORT.md`.

| id | dataset | source_url | licence | machine_readable | stated_conditions | stated_uncertainty | independent | verdict |
|---|---|---|---|---|---|---|---|---|
| D01 | Courtney, Courtney & Courtney (2015), *Experimental Tests of the Proportionality of Aerodynamic Drag to Air Density for Supersonic Projectiles* | https://arxiv.org/abs/1510.07336 | arXiv perpetual non-exclusive licence; earlier version at 28th Int. Symp. on Ballistics 2014 | yes (text tables in PDF) | yes | yes | yes | ORACLE |
| D02 | Courtney, Morris & Courtney (2016), *Accurate Measurements of Free Flight Drag Coefficients with Amateur Doppler Radar* | https://arxiv.org/abs/1608.06500 | arXiv perpetual non-exclusive licence | yes (text tables in PDF) | no | yes | yes | NOT-AN-ORACLE |
| D03 | Courtney & Courtney (2007), *The Truth About Ballistic Coefficients* | https://arxiv.org/abs/0705.0389 | arXiv perpetual non-exclusive licence | yes (text table in PDF) | no | yes | yes | NOT-AN-ORACLE |
| D04 | Lapua, *Bullets Drag Coefficient Data for QuickTARGET Unlimited* (archived PDF) | https://web.archive.org/web/20101229203547/http://www.lapua.com/uploads/media/LapuaBulletsDragCoefficient.pdf | archived; upstream all-rights-reserved | no | no | no | yes | NOT-AN-ORACLE |
| D05 | Hornady, *Drag Variability and the use of the "Axial Form Factor" in the Hornady 4DOF Trajectory Calculator* (archived PDF) | https://web.archive.org/web/20161019035255/http://www.hornady.com/assets/files/faqs/AxialFormFactor.pdf | archived; upstream all-rights-reserved | yes (text tables in PDF) | partial | no | yes | NOT-AN-ORACLE |
| D06 | Wikipedia *External ballistics* 2.5 - Lapua GB528 Scenar 300 gr Doppler Cd(Mach) table | https://en.wikipedia.org/wiki/External_ballistics | CC BY-SA 4.0 | yes (Wikimedia Commons `.tab` source) | no | no | partial | NOT-AN-ORACLE |
| D07 | Wikipedia *External ballistics* 2.5 - Lost River J40 .510-773 gr BC(range) table | https://en.wikipedia.org/wiki/External_ballistics | CC BY-SA 4.0 | yes (in page) | no | no | partial | NOT-AN-ORACLE |
| D08 | Hornady published BC tables: ELD Match / ELD-X / A-Tip / ELD-VT, G1 and G7 at Mach 2.25, 2.0 and 1.75 | https://www.hornady.com/bc | all-rights-reserved | no (HTML page) | yes | no | partial | NOT-AN-ORACLE |
| D09 | Berger Bullets, *Bullet Reference Charts* - SD, G1 BC, G7 BC, G7 form factor | https://bergerbullets.com/information/lines-and-designs/bullet-reference-charts/ | all-rights-reserved | no (HTML page) | no | no | partial | NOT-AN-ORACLE |
| D10 | Barnes Bullets (2015), *Use of Doppler Radar to Generate Trajectory Solutions*, Rev 1.6.15 (archived PDF) | https://web.archive.org/web/20150923182334/http://www.barnesbullets.com/files/2015/01/Use-of-Doppler-Radar-to-Generate-Trajectory-Solutions-Rev-1-6-15-V2.pdf | archived; upstream all-rights-reserved | unverified | unverified | unverified | yes | NOT-AN-ORACLE |
| D11 | Accurate Shooter Daily Bulletin (2024-03-19), *Bullet Ballistics Measured with Doppler Radar by Barnes* | https://bulletin.accurateshooter.com/2024/03/bullet-ballistics-measured-with-doppler-radar-by-barnes/ | copyrighted; not reproducible | no | no | no | no | NOT-AN-ORACLE |
| D12 | DTIC ADA439796, *Analytical Prediction of Trajectories for High-Velocity Direct-Fire Munitions* | https://apps.dtic.mil/sti/tr/pdf/ADA439796.pdf | US Government, public domain | unverified | unverified | unverified | yes | NOT-AN-ORACLE |
| D13 | DTIC ADA441359, *Conceptual Design Approach for Small-Caliber Aeroballistics* | https://apps.dtic.mil/sti/pdfs/ADA441359.pdf | US Government, public domain | unverified | unverified | unverified | yes | NOT-AN-ORACLE |
| D14 | US Army Research Laboratory, Silton & Weinacht (2009), *Effect of Rifling Grooves on the Performance of Small-Caliber Ammunition*, ADA505719 | https://web.archive.org/web/20121006194613/http://www.dtic.mil/cgi-bin/GetTRDoc?Location=U2&doc=GetTRDoc.pdf&AD=ADA505719 | US Government, public domain | unverified | unverified | unverified | yes | NOT-AN-ORACLE |
| D15 | West Virginia University thesis, *Computerized Trajectory Analysis for Firearms Examiners* | https://researchrepository.wvu.edu/context/etd/article/12784/viewcontent/Thesis_FINAL___Poulton.pdf | institutional repository; licence unverified | unverified | unverified | unverified | yes | NOT-AN-ORACLE |
| D16 | Precision Rifle Blog / PRS aggregate match statistics (muzzle-velocity SD vs match performance) | https://precisionrifleblog.com/2025/05/16/muzzle-velocity-sd-vs-prs-performance/ | copyrighted blog | no | no | no | no | NOT-AN-ORACLE |
| D17 | Competition and forum DOPE tables (Tireur public dope pages, Accurate Shooter forum, Precision Rifle Blog) | https://precisionrifleblog.com/ | copyrighted; mixed | no | partial | no | no | NOT-AN-ORACLE |
| D18 | NIST Ballistics Toolmark Research Database | https://www.nist.gov/programs-projects/nist-ballistics-toolmark-database | US Government, public domain | yes (API) | n/a | n/a | yes | NOT-AN-ORACLE |
| D19 | Wikipedia *External ballistics* as a whole, including 2.8.2 and the 2.9 method-comparison prose | https://en.wikipedia.org/wiki/External_ballistics | CC BY-SA 4.0 | yes | no | no | partial | NOT-AN-ORACLE |
| D20 | Litz, *Ballistic Performance of Rifle Bullets* (Applied Ballistics) | referenced from https://bergerbullets.com/nobsbc/comparing-bcs-of-different-brands/ | commercial, paywalled | unverified | unverified | unverified | yes | NOT-AN-ORACLE |
| D21 | Enthusiast ballistics sites: exteriorballistics.com, frfrogspad.com, Canadian Gun Nutz, shooting forums | multiple | mixed / copyrighted | no | no | no | partial | NOT-AN-ORACLE |
| D22 | Tireur, *Competition Ballistics* manual (already held by this repo) | https://www.tireur.org/BallisticsGuide/doc/ballistics_manual.pdf | free, no registration | yes (PDF; already text-extracted) | partial | partial | yes | NOT-AN-ORACLE |

**Counts:** 22 candidates surveyed (D01 to D22), **1 ORACLE**, **21 NOT-AN-ORACLE**.
These counts are re-derived at run time by `tmp/t6-oracle-check.mjs`, not asserted
here; the pasted output is in `REPORT.md`.
---

## 3. The one strict oracle: D01

> Elya Courtney, Amy Courtney, Michael Courtney, *Experimental Tests of the Proportionality
> of Aerodynamic Drag to Air Density for Supersonic Projectiles*, arXiv:1510.07336,
> 26 Oct 2015. Earlier version: 28th International Symposium on Ballistics, Sept 2014.

**Why it passes all three parts.**

1. *Stated test conditions.* Two firing sites, altitudes **0 m** and **1981 m**. Full
   environmental table published verbatim:

   | Condition | Temperature (degC) | Humidity (%) | Pressure (mm Hg) | Density (kg/m3) | Uncertainty in density (kg/m3) | Speed of sound (m/s) |
   |---|---|---|---|---|---|---|
   | Low air density | 26.7 | 22.6 | 602.2 | 0.9293 | 0.0016 | 347.1 |
   | High air density | 29.4 | 40.0 | 755.7 | 1.1526 | 0.0003 | 348.7 |

   Plus, all stated in the paper: chronograph separation 91.44 m (300 ft); projectile
   2.59 g **Nosler Ballistic Tip part #39510** in .223 Rem Lapua brass; rifle Remington
   700 ADL, 1 in 12 in twist; powder 6, 8, 10, 11, 12 and 14 gr Alliant Blue Dot plus
   29 gr Hodgdon CFE 223; **CED Millenium chronographs with LED skyscreens**; Kestrel
   4500 weather meter; density computed with the JBM Ballistics Calculator; gyroscopic
   stability above 1.4 throughout the Mach range; **ten shots per powder charge, twenty
   at the lowest charge**.
2. *Stated uncertainty.* "The uncertainties in the mean values of each supersonic drag
   coefficient were under 2%." The abstract states "within the experimental error of
   1%-2%". Density uncertainty is tabulated per site and was obtained by error
   propagation from temperature, pressure and humidity.
3. *Independent derivation.* Free-flight near/far chronograph velocities reduced to Cd by
   the authors. Nothing derived from our solver, our drag tables or our form factors.

**What it reports.** Cd falls from about **0.54 at M1.2** to about **0.33 at M2.9**.
Quadratic fits give R2 = 0.9521 at high density and R2 = 0.9618 at low density. At every
Mach number the two density datasets agree inside the 1-2 % experimental error: **Cd is
independent of air density over M1.2 to M2.9, to within 1-2 %.**

**Limits, stated by the authors themselves, reproduced so nobody over-claims it.**
A 24 % density change is "relatively a small change in atmospheric densities compared to
what is theoretically possible". Both sites had nearly identical temperature (26.7 degC
vs 29.4 degC), so a temperature-driven viscosity change is not independently exercised.
One projectile, .223 calibre, **no transonic coverage** (M1.2 and above only), gyroscopic
stability above 1.4, and **no drop or point-of-impact measurement at all**. It supplies
retained velocity at 300 ft and drag coefficient; it does not supply a trajectory.

---

## 4. Conditionally admissible: D02 and D03

Both are first-rate measurements that **fail part 1 of the binding test** for the same
reason: the paper states *how* the atmosphere was measured but never publishes the
temperature, pressure, humidity or altitude actually recorded.

### D02 - Courtney, Morris & Courtney (2016), arXiv:1608.06500

LabRadar Doppler radar, projectiles 4.4 mm to 9 mm, M0.3 to M3.0. Method statement,
verbatim: *"Air density is computed from directly measuring barometric pressure,
temperature, and relative humidity with a Kestrel 4500 weather meter... the uncertainties
in most inputs are less than 0.3%."* No values are given for any of them.

Fields actually published - the most useful single set found in this whole survey:

- **Table 1**, 17 rows, 7.62 mm projectiles: bullet, weight (gr), near velocity (ft/s),
  Cd by the "Track" method, SEM %, Cd by the "Report" method, SEM %, n. Identities are
  abbreviated and decoded in the caption: Sp FP = Speer flat point, DGHP = Cutting Edge
  Dangerous Game HP, FBBT = Berger Fullbore boat tail, Sp FB = Speer flat base,
  NP = Nosler Partition, NET = Nosler E-Tip, AMAX = Hornady A-MAX,
  TMK = Sierra Tipped MatchKing, ELD = Hornady ELD, HSP = Hornady Spire Point,
  VMAX = Hornady V-MAX, NBT = Nosler Ballistic Tip,
  TTSXBT = Barnes Tipped Triple-Shock Boat Tail, SST = Hornady Super Shock Tip.
- **Table 2**, 13 rows, 5.56 mm: same fields, including BFB (Berger flat base) at eight
  separate powder charges spanning 1724 to 3075 ft/s, plus SMK and SMK-pt at 80 gr.
- **Tables 3 and 4**, 4.5 mm projectiles and 0.177 in steel bbs.
- **Appendix A1 to A3**: **G1 BC and G7 BC, each with its own SEM and n**, for the same
  measured shots. This is the only source in the entire survey that publishes *both*
  drag models with stated error bars for the same measurements.
- Raw velocity-vs-range Track tables for three individual shots (22 cal VMAX, and a
  tumbling 200 gr Lehigh ME bullet, which is a genuinely valuable negative result).
- Per-shot uncertainty method: least-squares slope uncertainty propagated to Cd; plus an
  independent SNR-derived bar (100/SNR) plotted on Figure 2.

**Verdict: NOT-AN-ORACLE (fails part 1).** Admissible only for comparisons whose
atmospheric sensitivity is smaller than the stated SEM. Recorded SEMs run from 0.2 % to
3.4 %, with 3.4 % the largest (175 gr TMK); most are at or under 2 %.

### D03 - Courtney & Courtney (2007), arXiv:0705.0389

Two chronographs at 8 ft and 299 ft; BC computed with the **G1 resistance model only**;
three to six shots per bullet; uncertainty quoted as an error in the last significant
digit(s). Sixteen rows, reproduced in full in `02-bc-reference.csv`.

The three Nosler 125 gr BT rows are a **velocity sweep of one and the same bullet** at
2245, 2794 and 3010 fps giving measured G1 BC 0.306, 0.308 and 0.319. That is direct
evidence that a "BC" is not a constant, which is exactly the error mode
`02-bc-reference.csv` exists to prevent.

**Verdict: NOT-AN-ORACLE (fails part 1).** The method line reads *"used along with the
relative humidity, air temperature, atmospheric pressure, and altitude to compute the
bullet BC"* - the values themselves are absent.

---
## 5. Why each of the other 21 candidates is not an oracle

Grouped by reason, so the reviewer does not have to re-derive it.

### 5a. Fails part 2, no error bar - the commonest failure

**D05, Hornady Axial Form Factor (archived PDF).** Four complete Cd-vs-Mach tables with
genuinely useful conditions attached: 26 in 1-10 in Bartlein barrels chambered with the
same physical reamer; 1 in 7, 8, 9, 10 and 11 in twist variants of the same barrel;
24 in Thompson Center 5R against a 6-groove square-rifled Wiseman 6.5 Creedmoor barrel;
five muzzle brakes; four propellants; and a 212 gr ELD-X table at three Axial Form Factor
values (0.90, 1.00, 1.10). **No temperature, no pressure, no altitude, no sample size and
no uncertainty anywhere in the document.** The differences between its twist-rate columns
reach 0.05 in Cd at M1.0 - larger than any stated tolerance we could compare against,
which is precisely why an unlabelled number there proves nothing. That said, this is the
best available evidence that drag is not a function of the bullet alone: rifling form,
muzzle brake, propellant and twist all move Cd measurably, and our solver models none of
them.

**D08, Hornady published BC tables.** The best-conditioned manufacturer data found: G1
**and** G7 at Mach 2.25 (2512 fps), Mach 2.0 (2232 fps) and Mach 1.75 (1953 fps), all
*"corrected back to International Civil Aviation Organization (ICAO) Standard Atmosphere
(Sea Level, 59 degrees F, 29.92 inHg, 0% Humidity)"*, with per-bullet twist qualifiers
where the BC depends on twist (7 mm 180 gr ELD Match is published separately for 1 in
8.75 in and 1 in 7.5 in; 30 Cal 212 gr ELD-X and 225 gr ELD Match for 1 in 10 in and
1 in 7 in). A genuine stated condition, and a genuinely useful velocity banding.
**No uncertainty is stated for any figure**, so a comparison against our solver could
never fail. Also vendor-published, so not fully independent of its own product.

**D04, Lapua QuickTARGET drag-coefficient PDF.** Retrieved and text-extracted in this
session: 521,670 bytes, 59 streams, 71 recoverable text runs. The entire recoverable text
is plot furniture - four chart titles (*Side Deflection (Wind+Coriolis)*, *Trajectory
versus Line of Sight*, *Downrange Velocity*, *Coefficient (Cd)*), axis tick labels, and
the single caption `.338 Lapua GB528 Scenar 19.44g (300gr) Drag Coefficient`. **No
conditions, no uncertainty, no sample size, and no tabulated values at all**; the numbers
live inside vector graphics. This is the most-cited small-arms drag dataset on the
public web and it is neither machine-readable nor an oracle.

**D09, Berger Bullet Reference Charts.** Publishes SD, G1 BC, G7 BC, G7 form factor and
minimum twist across the whole catalogue, and states its method on a separate page:
*"the way Berger assesses BC's for all bullets is to test fire them using Doppler radar,
and then average the BC's over a common velocity range of 3000-1500 fps."* It carries
exactly one explicit tolerance statement and it is about dimensions, not BC: *"ALL
DIMENSIONS ARE FOR REFERENCE ONLY. THEY WILL VARY FROM LOT TO LOT, BUT WILL BE CONSISTENT
WITHIN A LOT."* **No BC uncertainty and no atmosphere.**

**D11, Barnes via Accurate Shooter (2024).** Narrative only - *"Using Doppler radar,
Barnes has learned that neither the G1 nor G7 BC models are perfect"* and a custom drag
curve is used per bullet. No numbers, no conditions, downloadable data: none.

**D17, competition and forum DOPE tables.** Conditions are often present (barrel length,
zero, elevation, sometimes a weather line) but **group SD and ES are essentially never
published**, and the loads themselves are frequently the thing in dispute. A DOPE card
without a dispersion figure cannot fail a drop comparison.

### 5b. Fails parts 1 and 2 - and in one case the source says so itself

**D06 and D07, the two Wikipedia Doppler tables.** D06 (Lapua GB528 Scenar, 19.44 g,
8.59 mm) gives Cd at 28 Mach numbers from 0.000 to 2.400 and *is* machine-readable - a
Wikimedia Commons `.tab` source file is linked from the page - which is exactly why it is
tempting. It states no atmosphere, no shot count and no error bar. D07 (Lost River J40
.510-773 grain) states its own disqualification in the article body: *"The test results
were obtained by averaging multiple shots, although the exact quantity is unknown."* A
dataset that cannot tell you how many shots went into it cannot carry an uncertainty.

**D19, Wikipedia article as a whole.** Carries a maintenance banner - *"This article
needs more citations"* - and its section 2.8.2 contains the claim that matters most to
`03-atmospheric-validation.md`: the CD(Ma) tables *"are aerodynamic data: CD is
dimensionless and depends only on the projectile geometry and the Mach number, not on
the atmosphere"*. That claim is sourced to an enthusiast-published manual, not to a
measurement. Good corroboration, bad oracle.

### 5c. Fails part 3, independence

**D04, D08, D09, D11** are all published by the company selling the bullet. Berger at
least discloses that all major brands have been third-party tested to a common standard
(Litz), and that result is commercial.

### 5d. Wrong domain entirely

**D18, NIST Ballistics Toolmark Research Database.** Open, government, genuinely
machine-readable, and irrelevant: it is a **toolmark** (land engraving) database for
firearm identification. It contains no trajectory, no drag and no point-of-impact data.
Recorded here so nobody re-suggests it.

**D16, PRS and Precision Rifle Blog match statistics.** Real match records with real
dispersion - the aggregate dataset reports muzzle-velocity SD across hundreds of
competitors. But it is muzzle velocity only. **There is no measured drop or
point-of-impact in it at all.**

### 5e. Could not be verified in this session - marked not-an-oracle, not an endorsement

`apps.dtic.mil` returned **HTTP 403 Forbidden** to every request in this session and then
served *"Our Site is Getting an Upgrade - We'll be back shortly!"* on retry. The Wayback
Machine has no capture at the legacy `dtic.mil/dtic/tr/fulltext/u2/*.pdf` paths (404).
The DTIC PDFs were therefore never opened. What follows is what a search index reported
for the DTIC landing pages, **not** verified document content:

- **D12, ADA439796** - landing-page text reports *"This data contains the drag coefficient
  data used to develop firing tables for U.S. Army munitions and represents a definitive
  source of drag"*. If accurate, this is the most valuable government dataset in the
  field and it is public domain. **Unverified. Highest-priority retry.**
- **D13, ADA441359**, *Conceptual Design Approach for Small-Caliber Aeroballistics* - the
  index snippet discusses the drag-coefficient exponent against ballistic-coefficient
  data. **Unverified.**
- **D14, ARL-TR (Silton & Weinacht 2009), ADA505719** - cited by Wikipedia as the source
  for the claim that presented Cd data cannot be transferred between gun-ammunition
  combinations. **Unverified.**
- **D15, WVU thesis** - the repository returned a body larger than 5 MB and the fetch
  refused. **Unverified.**
- **D10, Barnes 2015 PDF** - the PDF downloaded (268,491 bytes) but yielded **zero**
  recoverable text runs through `scripts/data/probe-pdf-text.mjs`; it is an image or uses
  a font encoding that probe cannot read. Its content is described second-hand by D11.
  **Unverified.**
- **D20, Litz, *Ballistic Performance of Rifle Bullets*** - reportedly 800+ bullets from
  all major brands tested to one standard in one format. Commercial, paywalled.
  **Unverified.**
- **D22, Tireur *Competition Ballistics*** - already held by this repo, and still the best
  of the commercially published manuals: it publishes raw 20-round chronograph strings
  with mean, ES and SD, an explicit error budget in Table 13.1, and 3-DOF versus 6-DOF
  limits in Table 8.3. It nevertheless **fails all three parts as a whole** - most of its
  trajectory tables are *modelled* output, its Table 3.1 velocities carry no SD, and two
  of the seven rows we already hold are explicitly labelled load-data envelopes rather
  than measurements. Useful as a secondary cross-check; not the oracle of record.

---

## 6. The finding that matters most

> **No candidate in this survey supplies a measured exterior *trajectory* - drop and
> windage as a function of range - with both stated conditions and stated uncertainty.**

The gap named in the task brief (`BRIEF.md` section 2) survives this survey unchanged.
What exists is:

- **retained velocity and drag** at range, with error bars - D01, D02, D03 (subject to
  the conditions caveat on D02 and D03);
- **modelled trajectories** with an error budget - Tireur, already held;
- **unvalidated vendor curves** - Hornady, Barnes, Lapua, Berger, Litz.

The first two are useful; none of them is a drop oracle. Nobody publishes the thing we
most need, because publishing it requires a long range, a calibrated survey instrument
and a funded programme, and the people who have all three sell the result rather than
release it.

**So the honest answer to "which single dataset would you add first" is not a dataset at
all.** It is a measurement we run ourselves, designed to the three-part test before the
first shot is fired: fix the rifle, bullet and load; log temperature, pressure, humidity
and altitude with a calibrated instrument; fire at least 24 rounds so the standard error
of the mean drop is defensible (Wikipedia section 2.8.2, quoting a requirement of at least
24 shots for a statistically significant confidence interval); record raw per-shot impacts
rather than a group centre; and publish all of it. The one candidate to add *from this
survey* is D01, and what it would prove is set out in `REPORT.md`.

---

## 7. What T2 would have changed

`docs/research-oracles/` did not exist at task start. Two things here are methods
questions T2 may already have settled; both are flagged rather than guessed.

1. **Whether a dataset with a stated method but unstated atmospheric *values* should be
   admitted.** I applied the strict reading, so it fails part 1. If T2 reads part 1
   differently, D02 and D03 flip from NOT-AN-ORACLE to ORACLE - and those two carry most
   of the usable measured data in this entire survey, so the decision matters more than
   any other in this file.
2. **Whether drag data (Cd, BC, retained velocity) may stand in for trajectory data.** I
   have treated them as distinct throughout, and treated retained velocity as a partial
   substitute only. T2 may hold a sharper position on what counts as an end-to-end
   check on a trajectory solver.

---

## 8. Retrieval evidence (reproducible)

Every claim above about document *contents* was obtained in this session by one of:
`firecrawl scrape` (returns Markdown), `firecrawl search`, a direct
`Invoke-WebRequest` download, or `npm run probe:pdf` (this repo's own PDF text probe).
The following retrievals **failed** and are recorded rather than glossed:

| target | method | result |
|---|---|---|
| `apps.dtic.mil/sti/tr/pdf/ADA439796.pdf` | `Invoke-WebRequest` | HTTP 403 Forbidden |
| `apps.dtic.mil/sti/pdfs/ADA441359.pdf` | `Invoke-WebRequest`, `firecrawl scrape` | HTTP 403; then DTIC maintenance page |
| Wayback legacy paths for both DTIC PDFs | `Invoke-WebRequest` | HTTP 404 Not Found |
| `researchrepository.wvu.edu/.../Thesis_FINAL___Poulton.pdf` | `fetch_web_content` | body over 5 MB, refused |
| `doi.org/10.3390/technologies13050190` (MDPI) | `fetch_web_content` | HTTP 403 Forbidden |
| `calhoun.nps.edu` search | `fetch_web_content` | HTTP 403 Forbidden |
| `pubmed.ncbi.nlm.nih.gov/27044032` | `fetch_web_content` | cookies wall |
| Wayback HTML route for the Lapua QuickTARGET PDF | `fetch_web_content` | Wayback toolbar shell only |
| Barnes 2015 Doppler PDF | `npm run probe:pdf` | 0 recoverable text runs |

Successfully opened and read in full: arXiv 1510.07336, arXiv 1608.06500, arXiv
0705.0389, the Hornady Axial Form Factor PDF (all four tables), the Lapua QuickTARGET PDF
(raw stream text), `hornady.com/bc`, the Berger bullet reference charts, Wikipedia
*External ballistics* (full article including all references), the Accurate Shooter 2024
article, and Berger "Comparing BCs of Different Brands".

---

## 9. Second-pass verification (what was re-checked, and what was NOT)

This file was written across two sessions of this same task. A reviewer should know
exactly which numbers were confirmed a second time, independently, and which still rest
solely on the first pass's transcription of a PDF. Recording this is the point: an
uncited-and-unconfirmed table row is exactly the kind of thing that becomes an oracle by
accident.

**Re-verified independently in the second pass.**

| Claim | How | Result |
|---|---|---|
| D01 identity: title, authors, 26 Oct 2015, arXiv perpetual non-exclusive licence | `fetch_web_content` on `arxiv.org/abs/1510.07336` | confirmed |
| D01 headline result, verbatim: densities "0.93 kg/m3 and 1.15 kg/m3", "from M1.2 to M2.9", "separation of 91.44 m", "2.59 g projectile", "within the experimental error of 1%-2%" | same abstract | confirmed, and the abstract states *pure theory recognises* the Reynolds dependence our model omits - which is the strongest single support for treating this dataset as the real test of our assumption |
| D02 identity: Courtney, Morris & Courtney, 23 Aug 2016, arXiv licence | `arxiv.org/abs/1608.06500` | confirmed |
| D02 scope: 4.4-9 mm, M0.3-M3.0, "accuracy of 1% or better" | same abstract | confirmed |
| D03 identity: Courtney & Courtney (2007) | first pass | not re-fetched |
| The whole G7/G1 non-interchangeability argument in `03-atmospheric-validation.md` section 6 - the 21 % G1 drop, 3 % G7 drop, 4.2 % NBT rise, and the SST row where G7 (0.314) exceeds G1 (0.309) | recomputed from the CSV figures in this session | confirmed: 21.1 %, 3.2 %, 4.2 %, and the SST pair is present and transcribed as printed |
| `sigma_low = 0.759`, `sigma_high = 0.941` | recomputed as density / 1.2250 | confirmed: 0.7586 and 0.9409 |
| The repo constant `STANDARD_SEA_LEVEL_DENSITY_SLUG_PER_FT3 = 0.0023769` really is the ISA value | 1.2250 kg/m3 x 0.00194032033 slug/ft3 per m3 | confirmed: 0.0023769 exactly |

**NOT re-verified. These rest on the first pass alone and should be re-read against the
PDF before any of them is promoted into `data/reference/`.**

- **The D01 atmospheric conditions table** - 26.7/29.4 degC, 22.6/40.0 % humidity,
  602.2/755.7 mm Hg, 0.9293/1.1526 kg/m3, density uncertainties 0.0016/0.0003 kg/m3, and
  the 0 m / 1981 m altitudes. The arXiv **abstract** independently confirms only the two
  densities at two significant figures (0.93 and 1.15) and the Mach range; it does **not**
  contain the temperature, humidity, pressure, per-site uncertainty or altitude. Those
  came from the PDF body and I could not reproduce them in the second pass: the fetched
  PDF is binary, `scripts/data/probe-pdf-text.mjs` returns glyph codes rather than text
  (1,924 hex `Tj` strings, 0 literal strings), and `tmp/t6-pdf-cmap.mjs` found 4 `bfchar`
  maps of 41/28/80/4 entries with no `/Differences` and no `bfrange`, so there is no
  ToUnicode mapping to decode the body text through. **This is the one gap that matters,
  because part 1 of the oracle test is entirely about these numbers.**
- The part number 39510, the 1-in-12 twist, the Remington 700 ADL, the Alliant Blue Dot
  charge list, the Kestrel 4500, the CED Millenium skyscreens, the ten-shots-per-charge
  and twenty-at-lowest-charge counts, and the gyroscopic stability above 1.4.
- The long quotations in `03-atmospheric-validation.md` sections 4.2 and 4.3 (skin
  friction as 8-16 % of total drag; the negative-1/3-to-1/5 Reynolds power law; the base
  drag caution; the McCoy 1981 citation). These are **quotation marks around text this
  survey did not re-extract in the second pass.** They are almost certainly right - they
  read as faithful transcription - but a reviewer should treat them as *cited, not
  verified*, and confirm against the PDF before quoting them onward. `ADA098110` was
  never retrieved at all, so the McCoy Reynolds treatment is second-hand via Courtney and
  is labelled as such in `03-atmospheric-validation.md` section 4.3.
- Every row of `02-bc-reference.csv` traced to a PDF body (D02, D03), and every row from
  D04, D05, D08, D09, D10, D11, D20.

**Consequence for a reviewer.** D01 is the only ORACLE in this survey, and the second pass
independently confirmed its *identity, its density span, its Mach span and its 1-2 %
claim* - which is enough to accept the verdict. It did **not** re-confirm the full
conditions table that earns it part 1. Before that row enters `data/reference/`, open
`tmp/t6-courtney-density.pdf` and read Table 1 directly.