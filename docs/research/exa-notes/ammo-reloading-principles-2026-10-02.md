# Ammunition Reloading — Principles & Industry Knowledge

Research date: 2026-10-02 · 714 Exa results across 9 subagents · Organized by subsystem, not by caliber

> **Disclaimer:** Educational and informational research. This is not instructions for manufacturing ammunition, not legal advice, and not a substitute for certified instruction or published load data. Reloading is a genuinely dangerous activity — cases rupture, barrels fail, and the failure modes are violent. Verify all current law with ATF or qualified counsel.

---

## 0. The Five Things That Actually Matter

Before the detail, the load-bearing findings:

1. **Load tables are outputs, not knowledge.** A serious reloader maps their own chamber's pressure-velocity curve rather than starting from a book maximum. Where sources *disagree*, that's where the real learning starts.
2. **Precision comes from information preservation, not cleverness.** Sizing → charging → seating → crimping are all information-loss boundaries. Siewert's design criterion is the cleanest formal statement of this: judge loads on **total strain**, not on a single pressure number. A case can look perfect at the bench and still be driven deep into plastic strain.
3. **Case alloy is deliberately a compromise.** 70/30 brass (C26000) is a single-phase alpha solid solution — ductile enough to draw and seal, stiff enough to survive breech pressure. You can soften it by annealing. You can never harden it by heating.
4. **Pressure is a *strain* problem, not a pressure problem.** Design criterion is total strain (axial + hoop + radial) < ultimate strain. Wall thickness and case diameter are the two variables you don't control at the bench.
5. **The field's best sources cut against their own sponsors.** Corbin's 1986 paper concludes conventional boat tails are largely promotional. Bergler admits OTM tips can't be made smaller due to die-ejection constraints. Peterson publishes 4-year hardness data contradicting received wisdom. Weight these highest.

---

## 1. Internal Ballistics: The Burn Law

**Powers don't have a constant burn rate.** Gas generation from a burning surface follows Piobert's law (∝ burning surface area), and heat transfer into the grain rises with confining pressure — so **burn rate accelerates as pressure builds.** Reaction proceeds in zones: melting/phase-change "foam zone" → endothermic decomposition "fizz zone" → exothermic luminous flame zone. The primer supplies the energy to initiate the first two.

**Consequence:** a powder that is slow at 1 atm is not uniformly slow in a 60,000 psi chamber. Comparing powders by label compares them at one reference condition only.

| Concept | Mechanism | Practical implication | Source |
|---|---|---|---|
| **Form function** | Grain *shape* sets how burning surface changes as grain is consumed. A perforated extruded cylinder burning from outside *and* hole burns at increasing area → progressive burn → flat sustained pressure | Progressive geometry is why slow powder + full case beats fast powder + light charge in big cases | [Wikipedia](https://en.wikipedia.org/wiki/Internal_ballistics), [SAAMI glossary](https://saami.org/glossary/progressive-burning-powder/) |
| **Pressure spike before bullet motion** | If gas generates faster than expanding volume relieves it, peak pressure is reached *before* the projectile has moved | Wrong-burn-rate powder is a **pressure event, not a velocity event** | [Wikipedia](https://en.wikipedia.org/wiki/Internal_ballistics) |
| **Burnout vs dwell time** | Whatever hasn't burned by bullet exit adds nothing to velocity but fully adds to recoil and blast | Over-fast powder in a long case wastes blast — you feel it as recoil and noise | same |
| **Single/double/triple-base** | Single = nitrocellulose only (energy from ~10–12% N). Double = NC + nitroglycerin/nitroglycol as plasticizer+energetic (NC ~12–14% N). Triple = adds nitroguanidine. NG raises energy per unit volume, permits higher loading density, faster burn, more temp sensitivity | Basis for the single vs double vs triple reloader shorthand | internal ballistics refs |
| **Density loading** | Volumetric vs gravimetric. Loading to a fixed *fraction of case capacity* is more reproducible across temperature than a fixed powder weight | Explains why experienced reloaders scale by gr H₂O | Hodgdon, Widener |

**Methodological note:** the DTIC military text *Equations of Interior Ballistics* explicitly flags the burning law as being "in a state of flux" — only that it's a power law (not linear) is generally accepted. The numeric exponent n in r = k·Pⁿ was not extracted by the subagent.

---

## 2. Pressure Limits & Primer Chemistry

**A-Square's hard data (Chuck Hawks):** standard primers within one type can differ by **9,600 psi** in peak. Magnitude is well established.

**But the brand ordering is rumor.** Hawks reports the common ordering (Winchester hottest, Federal/CCI middle, Remington mildest) is explicitly "based on rumor and supposition, not fact." A-Square's own data shows Federal 215 vs CCI 250 differ by only 100 psi — so **some substitutions need no reduction at all.** Treat blanket "drop 10% for a primer change" as a crude proxy, not a mechanism.

**Magnum primers are a specific fix, not an upgrade.** They raise peak pressure on light, easily-ignited charges. They exist for heavy loads of *slow-to-ignite* powder and are a hazard anywhere else.

**The 95% compression ceiling is contested.** Wikipedia says loads near 100% density ignite more consistently; Widener says ignition declines past ~95%. Both cannot be right. Likely reconciliation: the primer-flame-path concern applies to hard-to-ignite ball/spherical powders, and Widener's testing is powder-specific — but neither source says so. **Treat 95% as a heuristic, not a physical boundary.** (Note Hodgdon has a commercial interest in that position.)

**Powder interchangeability across brands has no mechanism-level support.** Burn rate indexes are manufacturer-specific and not directly comparable — which directly undercuts treating two "similar burn rate" powders as grain-for-grain interchangeable.

**Compressor numbering trap:** SAAMI crusher readings reflect only ~80–85% of true peak; CIP readings generally run higher. The *same printed number* from two systems means different real pressures.

---

## 3. The Case: Metallurgy

**C26000 cartridge brass:** nominally 70% Cu / 30% Zn (Cu 68.5–71.5 wt%, Pb <0.07%, Fe <0.05%). A **single-phase alpha FCC solid solution** — zinc substitutes for copper atoms, distorting the lattice and raising yield strength *without* destroying ductility. Melting point ~915°C.
*([AMP](https://www.ampannealing.com/about-brass-hardness/), [LoadData](https://loaddata.com/Article/BenchTopics/Modern-Cartridge-Cases/158) — written by a materials engineer citing CDA Pub. 36 and ASM Copper handbook)*

**Why alpha brass:** alpha brasses suit *cold* working; beta (BCC, >~38% Zn) suits hot working. Cases need deep drawing and severe local necking at room temperature. Gilding metal (95/5) — the *softest* common brass — is too soft for cases and ideal for bullet jackets. Different alloy on purpose.

**Strength comes from two places, neither undone by cooling:**
- **Solution strengthening** — zinc atoms act as lattice defects
- **Work hardening** — plastic deformation multiplies dislocations, subdivides grains

Only annealing reverses work hardening. **"Heat treat" is a category error for brass** — you cannot harden it, only soften it.

**Hardness benchmarks:** full-hard ≈ **175–185 HV**; fully annealed ≈ **65 HV** (CDA Pub. 36). Factory Lapua 308W neck = **145 HV**; AMP's standard anneal target = **98 HV**. HV microhardness is the right test because case walls are thin — you cannot check this by hand-filing.

### Headspace
Case capacity is measured in **grains of water (gr H₂O)** — the mass of water filling the case to its mouth. Muzzle velocity varies roughly **20–30 fps per grain H₂O**. Real .284 Win cases: mean 69.1 gr H₂O, SD 0.175. Sorting by capacity measurably reduces velocity spread within a lot.

**Vocabulary warning:** Wikipedia citing the SAAMI glossary notes that major manufacturers' literature routinely **conflates "headspace" with "head clearance."** Published vendor numbers on "headspace" may not mean what a chamber drawing means.

### Expert disagreements on brass

| Question | Positions |
|---|---|
| **Does brass age-harden?** | Sierra's phrasing implies yes. AMP, METLAB, and Derek Peterson (4-year archived data: annealed cases unchanged at exactly 97–98 HV) say correctly annealed and stored cases **do not** age-harden over any practical timeframe. Treat "new brass splitting after storage" as stress/corrosion, not unavoidable age hardening |
| **Anneal method — flame vs induction** | 6mmBR: flame-anneal a rotating case, judge by the neck turning "maroon," ~6–7 sec for 6.5-284. AMP argues the opposite: large ovens soften side walls and head; recommends fast *localized* flash annealing. Both agree on the physics; they disagree on whether body-wall softening is acceptable. **The flame method's real hazard is heat conducting along the case and changing headspace-relevant geometry** |
| **Does annealing protect against SCC?** | Peterson presents field observation as strong evidence. Siewert's data is careful — says "probable," notes his experiment's short duration precluded SCC development. Disagreement in *strength of claim*, not direction |
| **What actually causes neck splits?** | Siewert's conclusion: most real neck splits are **not** work hardening, and a significant fraction are probably **stress-corrosion cracking**. This matters — if SCC dominates, annealing's value is stress relief and SCC mitigation, not fatigue prevention |

---

## 4. Bullets: Construction

**Ogive is a radius in calibers, not a point.** The ogive is the entire curve tip-to-shank, specified by radius in calibers (an 8-ogive .30 = 2.464"; an 8-ogive 6mm = 1.952"). For fixed nose length, a tangent ogive has one exact radius; anything longer is secant. **Nose length and ogive radius are a coupled pair** — you cannot shorten the nose without flattening the ogive.
*([Bryan Litz, ABDOC-2.1](https://appliedballisticsllc.com/wp-content/uploads/2021/06/Characteristics-of-Different-Bullet-Ogive-Designs.pdf) — principal ballistician, primary source)*

**Rt/R ratio quantifies "secant-ness."** Rt/R = tangent radius ÷ actual radius. 1.0 = perfectly tangent. **0.5 is the practical floor** — drag is minimized exactly at Rt/R = 0.5. Below that you gain no measurable drag reduction while the bullet keeps getting longer (poise, capacity, stability cost). **This is the geometric basis for VLD diminishing returns.**

**Tangent vs secant vs hybrid.** Most match bullets use tangent ogives; modern VLDs use secant. Berger's "Hybrid" blends secant + tangent — secant cuts drag, tangent reduces seating-depth sensitivity. **Practical pick for a workhorse precision load** (Litz also designs this for Berger — informed but mildly interested).

**Boat tails: base drag vs wake.** A flat base displaces air that must rush in behind. Below Mach 1 this turbulent base drag dominates. Above Mach 1 the nose shock wave absorbs far more energy, so **nose shape matters more than base shape as a fraction of total drag.** A boat tail truncates the flat base so turbulence acts on less area.
*([Corbin 1986](http://www.swage.com/ftp/rbt.pdf), grounded in Bailey, Kent/Aberdeen Proving Ground, and a US Army X-65 report)*

Practical boat tails run **9–15° from centerline**, about **one caliber long**. Litz/Corbin: "no great difference in the performance of any specific angle or length within this general range." **Don't over-think boat tail angle** — the meaningful variable is whether the base is tapered at all.

**Corbin's three problems with conventional boat tails** (from the 1986 paper): the angled base **focuses escaping muzzle gas like a hose nozzle**; it reduces usable case capacity and raises chamber pressure; and it can cut bearing surface short of tangent.

**Is BC the whole story?** The geometry argues for saturation: Rt/R can't usefully go below 0.5. Berger's practitioner position — **lot-to-lot BC consistency and jacket concentricity drive group size, not headline BC.** A forum user independently field-measured a Berger 168 VLD at G1 BC 0.615 vs Litz's published 0.617 average — better agreement than the "BC is marketing" critique usually claims. **Consensus: BC matters a lot between ordinary and very low drag, much less beyond that.**

**Corbin's own hedge (valuable):** a boat tail "has relatively little effect" on a bullet that stays supersonic to target, and in rifle applications is "primarily effective for promotional purposes." Against that: long-range practice treats boat tails as valuable because a bullet crossing Mach 1 mid-flight is *normal*. **Both can be true — promotional on a .308 Win magnum at 100 yards, meaningful at 1400.**

### Cast vs jacketed
Cast bullets cap out at moderate accuracy because of **tumble/wobble** — a bullet that yaws in the bore or loses its spin axis cannot group tightly. **Caveat flagged by the subagent:** the specific Kelter section on tumble could not be retrieved (the fetched portion covered alloy chemistry and stopped), so the cast-vs-jacketed accuracy comparison rests partly on mechanism inference. Alloy data retrieved: **17 BHN limit on lead/tin solder**, arsenic catalysis, age-softening rates.

**Where core choice is unresolved:** Boddington says lead-core is "probably superior to copper alloy at 'extreme' ranges" and immediately qualifies it — "but that depends on your definition." He doesn't define it. **Honest unresolved.**

**Jacket/core separation is a judgment call, not a settled fact.** Boddington recovered separated jacket-and-core pairs, concluded separation "must have happened at the end, as the bullet slowed and tumbled," and answered his own question: "Did it fail? I think not."

**Manufacturing limit worth knowing:** Bergler admits **OTM tips can't be made smaller due to a die-ejection constraint** — a hard physical floor, cutting against his own product line's marketing.

---

## 5. External Ballistics & Accuracy

### Why spin exists
An elongated projectile flying nose-first is **statically unstable** — any small angle between the bullet axis and oncoming airflow creates an aerodynamic moment that *increases* that angle. Angular momentum about the long axis resists tilt; the bullet behaves as a gyroscope. Restoring torque ∝ q·d·L·α; angular acceleration ∝ torque/I, and I is tiny for a slender projectile. **Spin converts aerodynamic upset into slow precession (nose-around-line-of-fire) instead of rapid nutation (fast tip-over).**

Spin isn't decorative — it keeps the bullet nose-first, which is what keeps drag low *and* groups small.
*([Text Book of Small Arms, British Army, 1929](https://www.rifleman.org.uk/Rifling_and_gravitational_effects.html) — primary source)*

### Twist rate
Greenhill's table (1879, refined by Cundill) gives minimum spin. Practical rule for solid-lead bullets (SG 0.9): **length in calibers × twist rate in calibers = 150**; safely raised to **200** in practice.

Spin requirement scales as the **square root** of density ratio — aluminum ≈ 2× the twist of lead; water ≈ 30× the twist of air. **Twist rate matters, caliber does not** — the rule is dimensionless in calibers.

A 5-cal bullet needs ~1:25–1:30 minimum; 1:36–1:42 is typical match. **Moving to slower twist reduces stability margin even though it "reduces over-stabilization." Twist is a barrel property you respect, not tune around.**

### Dynamic stability is what matters in flight
Static margin (available at rest) isn't what counts after launch. As velocity decays and trajectory curvature increases, the stabilizing term falls while the destabilizing term rises. Rate of trajectory curvature runs ~1°/s in the first few hundred yards, rising to ~7°/s past the vertex of a 10° trajectory — while forward velocity has fallen to ~¼ of muzzle value and spin has decayed far less. **That's the worst-case moment, just past apex.**

**Practical consequence:** long-range accuracy degrades *faster* than the geometric cone model predicts. A load grouping 0.5" at 50 yd can group 0.75" at 100 yd — **angular dispersion shrinks even as linear group grows.** Test at the distance you'll actually shoot.

---

## 6. Case Failure Physics & Safety

### Hoop stress
The case is a thin-walled pressure vessel. Internal pressure on the diameter produces circumferential (hoop) tension: **σ = P·ID / 2t**. Rearranged: **P_burst = σ_ultimate × 2t / ID**. Failure is a *tension* failure across the wall, so **it opens lengthwise.**
*([AmmoGuide](https://ammoguide.com/myag/articles/tloc54/Of_brass_and_chambers.pdf) — honest caveat from the subagent: the author's worked example yields only ~6,300 psi, *below* .22 LR's actual ~21,000 psi MAP. **The naive formula is a lower bound, not a design limit** — real cases gain work-hardening and confinement the static model ignores.)*

### Strain is a vector sum
Total case strain = **axial + hoop + radial**. The design criterion is not "stress < yield" but **total strain < 100% of ultimate strain**. Below yield the case is elastic (linear); above yield it's plastic and non-linear — already permanently reshaped.
*([Siewert, NDIA small-arms symposium](https://ndia.dtic.mil/wp-content/uploads/2019/armament/SiewertTutorial5.pdf) — arm's-length design-engineering authority, the highest-quality safety source found)*

**Subtle and important:** a case can look fine at the bench and still have been driven deep into plastic strain. **Judge loads on strain, not a single pressure number.**

### Hardness trade: strength vs ductility
Processing hardness raises yield strength and failure stress but **lowers elongation at failure.** Cases are deliberately graded — **hard in the body, softer at the neck** — so the neck absorbs the strain. Stress-corrosion cracking is a known downside of reuse.

### Strain concentration at the closed end
The case head is the *closed* end of the vessel. Load can't relieve itself there, so **strain concentrates at the base — this is where case failure initiates.**

### Stuck cases
Over-pressure drives case diameter expansion **beyond the chamber's own elastic expansion**, so the case grips the chamber wall. Siewert models this as "residual load between case & chamber wall resisting extract."

### Myths explicitly debunked by authoritative sources

| Myth | Reality | Source |
|---|---|---|
| **"One cartridge bursting sets off the whole pile"** | SAAMI addresses this directly — if one cartridge ignites and bursts it "will not usually cause surrounding cartridges to ignite." Hollywood physics | [SAAMI](https://saami.org/) |
| **"Dry firing is always safe"** | False. Dry-firing rimfire and older centerfire designs with an empty chamber can weaken or break the firing pin; rimfire dry firing can deform the chamber edge (firing pin strikes bare metal with no rim to absorb). Snap caps exist for this | tertiary — flagged |
| **"Published manuals disagreeing means the data is unsafe"** | Disagreement usually reflects different test platforms and days. Ballistic Assistant explicitly: "The purpose of this discussion is not to cast doubt on the reliability or safety of published handloading data" | Ballistic Assistant |
| **"Reduced max loads in modern manuals are marketing conservatism"** | They were cut because handloaders kept seeing velocity at the printed maximum and starting there, hitting pressure trouble. **The margin is a response to observed misuse** | Harvey |
| **"Chamber flags are proven to reduce accidents"** | Excluded — all sources were SEO/vendor filler with no incident data. The GORTAR latch-type flag is at least a real mechanical interlock, but **no independent verification found** | excluded |

### A structural fact about the modern hobby
**Commercial handload pressure testing has largely disappeared.** H.P. White folded in 2020; Western Powders discontinued handload testing around 2006. Today a handloader would need to buy a strain-gauge rig, or use the Birmingham Proof House or DEVA in Europe. *Found in only one source — treat as directional, but it's a meaningful structural fact.*

**Flagged as unverified:** case-gauge tolerance mechanics (thin sourcing); "primers backing out" (sources document *flattening* only — don't present the general mechanism as sourced); **MPD terminology is ambiguous** — the field uses "Maximum Pressure Desired" *and* "Maximum Permissible Pressure," and no standards-body definition was found.

---

## 7. Load Development: The Actual Method

**Phase 1 — Build for consistency**
1. Clean brass thoroughly; case gauges must be smooth and undamaged — a case that will not close smoothly will not chamber smoothly
2. A case dropped into your sizing die should have its rim **between the gauge's high and low steps** — this guarantees consistent headspace
3. **Set the seater with dummy rounds** (no powder or primer) at the correct COAL per bullet
4. Consistent, light factory crimp — don't over-crimp
5. Torque everything to spec. Ring, base, and action-bolt torque are precision variables in their own right

**Phase 2 — Map the velocity space** (two independent maps, both from one safe powder charge)
- **COAL ladder:** start middling, step in ~0.005″ increments, chronograph each. You're measuring *your* chamber's pressure-velocity curve
- **Powder ladder:** fix COAL, step charge weight in small increments, chronograph each
- Record **average velocity, standard deviation, and extreme spread velocity** for every rung. That record is the map for everything that follows

**Phase 3 — Shoot to find the node** (the step most handloaders skip)
- Plot velocity against group size at your working distance
- Find the **velocity node** — smallest groups for *that bullet weight*. **Recompute from scratch if you change bullet weight**; harmonic frequency depends on bullet mass
- If no clean node appears, refine COAL resolution near the best velocity — 0.005″ of COAL can matter more than 0.5 grain of powder
- Judge by **mean radius over 10-shot groups**, not 3-shot ES

**Phase 4 — Test at the distance you'll shoot.** From USAMU guidance: **600-yard ammo must be tested at 600 yards.** Ammunition can be superb at 100–200 yards and fall apart as range grows, because the destabilizing mechanism is dynamic. **If a load fails at distance, a change of powder type frequently fixes it** — burn rate changes the pressure curve inside the barrel, changing spin acceleration and launch conditions.

**Phase 5 — Confirm with realistic strings.** USAMU: "the number of shots fired per group should be realistic for the course of fire." If you'll shoot 10-shot strings, your final test must be 10-shot strings. Machine rest it — **you're measuring the ammunition, not yourself.**

**Phase 6 — Maintain, don't hope**
- Chronograph a few rounds every session; track velocity over round count. **A fouled barrel reads *high*** — a deep clean reads lower and more consistent
- Clean on a schedule set from group-size observation, not discomfort. **Watch cleaning time** as the real fouling indicator, not patch color
- One-piece rod with bore guide. *"More damage to a good barrel is done from cleaning than from actual shooting."* Never pull a brush back across the muzzle crown — remove it and pull the rod through bare. **The crown is the last surface the bullet touches**
- Watch round count. Velocity decline measurable by ~500 rounds in a hot cartridge; rebarrel at 150–200 fps down and still falling

**The honest summary:** you're not searching for a magic load. You're holding every variable still and mapping two things — how much powder gives how much pressure and velocity *in your chamber*, and which of those velocities puts your bullet at a barrel-harmonic node *for your bullet weight*. Where those maps intersect, the group is as small as your rifle can produce. **Everything else is noise.**

### Notable load-table detail
**Modern manuals deliberately list the practical maximum lower than the book maximum.** Reloaders working up from a "safe" starting point should know this — you're not leaving performance on the table by starting at a conservative number.

### Belted-case detail
Belted magnums historically acquired a bad reputation for short case life that was **largely self-inflicted** — reloaders worked the shoulder further than reliability required, adding length and work-hardening. Set the shoulder only as far as reliability demands.

---

## 8. Process Steps (The Full Sequence)

| Step | What happens | Why it exists | Guards against | Source |
|---|---|---|---|---|
| Sort & inspect | Separate by headstamp/lot; reject cracked (esp. mouth and near base), dented, gouged, stretched | Clean shiny brass reveals defects invisible when dirty | Case head separation; brass ring extraction | [American Handgunner](https://americanhandgunner.com/ammo/ultimate-reloading-series-part10-quality-control/) — Tom McHale |
| Clean | Tumble/ultrasonic/media polish; remove carbon from body, neck, primer pocket | **Carbon is abrasive** — it galls and abrades carbide dies | Die wear; inconsistent neck tension | [Ultimate Reloader](https://ultimatereloader.com/2012/03/16/rifle-brass-prep-basics/) — Gavin Gear |
| Decap & clean pockets | Push spent primer; brush residual | Carbon fills the pocket so a new primer sits proud | High primers; erratic ignition | [Lee Precision](https://support.leeprecision.net/en/knowledgebase/article/seating-primers) |
| Remove mil crimp | Swage or ream staked crimp on 5.56/7.62 brass | Crimped pockets give inconsistent seating | Inconsistent depth; primer above flush | Ultimate Reloader — **required**, not optional |
| Anneal (rifle) | Heat ~400–500°F to relieve work-hardening, quench | Restores ductility so next sizing doesn't embrittle | Case head separation; shortened life | [Florida Reloading](https://www.floridareloading.com/index.php/2017/02/04/proper-full-length-sizing-for-bottleneck-cases/) — NRA-certified instructor |
| Lube & size | Lube; press case to SAAMI minimum; push shoulder back; reduce neck | Returns fire-expanded brass to factory dimension so it chambers in *any* gun of that caliber | Stuck cases; dented shoulders; galled brass | Florida Reloading |
| **Note on carbide** | **Rifle dies always need lube regardless of carbide** — friction contact is high. Pistol carbide dies need none because they only touch the outside | — | — | "Don't waste your money looking for a carbide rifle set" |
| Neck & taper crimp | Taper for rifles/botts, roll for revolvers, **strong crimp for autos to prevent bullet jump** | Bullet retention differs by action type | Bullet jump in autos | — |
| **Verify thrown weight** | The measure's setting is **not** the charge — machine action, atmospheric conditions, and humidity shift volumetric dispensing | Scale-verify every new setting | Powder weight errors | Loubser |
| **Dummy round chamber test** | Make a dummy and chamber before committing a batch | Especially lever actions, rear-lug bolts, multi-rifle | Springs actions let a fired case stretch beyond chamber headspace dimension | For multiple rifles, measure a fired case from **each** and set to the shortest |
| **Label & record** | Before the box leaves the bench | Record the plan, what happened during loading, what happened at range | Repeating failures | — |

### What separates good reloaders from sloppy ones
- **Don't work the web** — moving fast during decapping raises odds of a misaligned case breaking the pin
- **Prime with finesse** — roughly the force of an automatic door closer, on the least-mechanical-advantage stroke
- **Crimp doesn't feed autos** (it feeds chambers); don't over-crimp
- **Shotgun needs no bore interface** in the way rifles do
- **Verify thrown weight, not the measure setting**
- **Make a dummy and chamber before committing a batch**
- **Record before loading, not after** — keep the history *even when disappointing*; the failures are what stop you repeating them
- **Operating rhythm is deliberate** — "the faster you go, the more likely you'll make a mistake"

**One genuine tooling controversy:** flash-hole deburring is recommended by Ultimate Reloader and presented by RCBS as standard practice, but other manufacturers argue against it on modern match-grade case design and hardened steel cases (7mm Backcountry). Case-specific tooling question, not a safety conflict.

---

## 9. Economics, Sourcing & Industry

**Cost structure (~2015 baseline, [ChuckHawks](https://chuckhawks.com/reloading_economies.html) — clean method, stale prices):** 9mm reload ≈ $11.75/100 saved vs bulk Winchester/USA. .223 Rem ≈ $59/100. Includes dies + brass amortization; **assigns no monetary value to labor.** Prices are 2015 — useful for *structure*, not magnitudes.

**2024 figures ([Ultimate Reloader](https://ultimatereloader.com/2024/03/17/can-you-save-money-reloading/)):** **$0.252/reload vs $0.47/round factory** (Winchester 124gr FMJ). Per 1,000: $251.97 vs $497.60. Lyman kit ~$600, Hornady LNL AP ~$1,200, Mark 7 Apex 10 "far more." Reloading costs roughly **doubled 2009→2024**.

**Where reloading stops paying:** two independent sources converge on the same logic — for handgun brass it's often cheaper to **buy and shoot factory ammo, then reload the fired brass** than to buy new cases. Midsouth (Sept 2025): after powder inflation, "in some cases the cost of reloading certain calibers now exceeds the cost of purchasing factory ammunition — if that ammo is available in bulk." **The case flips on component pricing, not equipment amortization.** Equipment is a rounding error against powder.

**The 2026 bottleneck is powder, not brass.** Capital went into *ammunition* plants, not powder/primer plants. Named projects: Fiocchi +$15M Little Rock; **Fiocchi's $41.5M Little Rock primer facility (announced 2022) scrapped**; White River Energetics +$70M Des Arc AR (primers + powder) running; General Dynamics St. Marks +20% ball powder; CBC/Magtech $300M Oklahoma plant. Powder that retailed $25–30/lb now fetches $45–60. Much US powder is imported.

### Factory specification regimes

**Remanufactured vs reloaded — the key commercial distinction:**
- **Remanufactured** = produced by a *business*, mechanized equipment, automated sensors, operation to SAAMI specs. QA is **a station in the production line** — dimensional, functional, and safety verification before the product leaves. **Taurus's manual voids coverage on reloaded ammunition specifically and does not name remanufactured ammunition** — that's the practical boundary of the QC regime
- **Reloaded** = an individual, off-the-shelf equipment, no external standard governing them

**Industrial loader segment is real and distinct.** Pro-Loading (Stevensville MT) runs in-house bullet production (CamPro), serves law enforcement and military, and offers **proof loads, load verification, statistical analysis, velocity, case pressures, and barrel pressures** — the ballistic instrumentation to certify a specific load, which no individual reloader can access. Bliss sells case-only and projectile-only lines separately; runs a Bliss Munitions EU JV scaling to 155mm.

**Scale, quantified:** a shotshell private-labeler at ~4M rounds/yr was constrained not by assembly speed but by **changeover time**. Cam-driven line: 18.5 rounds/min, 5% scrap, **20 hours per SKU changeover**. After servo conversion: 24 rounds/min, 2% scrap, 4-hour changeovers, 5.4M/yr estimated. **In a multi-SKU ammunition business, setup time dominates** — why scale players consolidate SKUs.

### FBI protocol — PRIMARY source recovered
The subagent retrieved the original: **N.J. Scheers, Ph.D. & Stephen R. Band, "Ammunition Selection: Research and Measurement Issues," *FBI Law Enforcement Bulletin*, November 1989, pp. 15–23.**

**Framing correction:** this is **not** a published "standard ammunition protocol." It's the FBI's handgun-caliber selection study that drove adoption of the 10mm. Criteria originated at a **Wound Ballistics Seminar, FBI Academy, September 1987**. Tests were "available, on request, to interested law enforcement agencies" — **never published as a free-standing standard.**

Recovered detail: **12" and 18" test barriers, 8 tests, 5 shots each, 10% gelatin, in test barrels built to SAAMI standards.** Penetration windows were established at each barrier.

**Two flags against over-reading this:** (a) the **"maximum desirable 18 inches" is not a pass/fail limit** — the FBI explicitly declined to set a maximum penetration standard; (b) the wound-volume figures (4.11/4.22/2.82/2.16 in³) are **measured outcomes of tested rounds, not specification thresholds.** They're the single easiest thing here to misreport. **No numeric velocity or recoil limit exists in the article.**

Current FBI service load per a **2021 DOJ/FBI solicitation**: Hornady Critical Duty 135gr +P for 9mm — a **dated data point, not a standing fact**, as agency loads change on rebid.

### A gap I will not fill
**The "NOAA 1500" match-rifle specification could not be verified.** Six searches across six different angles returned nothing referencing NOAA or a 1500-yard match-ammunition spec with group-size/bullet-weight/velocity limits. Every benchrest rulebook surfaced belonged to a different body (NBRSA, IBS, WBSF, SSAA, Freedom Benchrest, CBA, ARA). Most likely the premise name is wrong or conflated — plausibly with a 1500-*meter* ISSF long-range event, or with the Howa 1500 bolt-action rifle, which dominated results whenever "1500" and "benchrest" co-occurred. **If you have the source document that named this, that's what should be checked. I am not supplying numbers from memory.**

---

## 10. Reference Library

| Resource | Type | What you get | Authority |
|---|---|---|---|
| **[Ballistics: Theory and Design of Guns and Ammunition](https://www.routledge.com/Ballistics-Theory-and-Design-of-Guns-and-Ammunition/Carlucci-Jacobson/p/book/9781032909455)** (Carlucci & Jacobson, 4th Ed.) | Engineering textbook | The real theory: interior, exterior, terminal ballistics, pressure-volume, section density. **The text that explains the physics the manuals assume** | **Very high** — genuine engineering text |
| **[Consolidated Competition Ballistics](https://www.tireur.org/BallisticsGuide/doc/ballistics_manual.pdf)** (Tireur Foundation) | Governing-body manual | Rigorous long-range external ballistics: drag, wind, atmospheric conditions, transonic | **Very high** — published by the governing body |
| **[Applied Ballistics Docs](https://appliedballisticsllc.com/wp-content/uploads/2021/06/Characteristics-of-Different-Bullet-Ogive-Designs.pdf)** (Bryan Litz) | Technical papers | Ogive geometry, Rt/R, drag analysis, BC analysis. No marketing | **Very high** |
| **[Modern Reloading, 2nd Ed.](https://leeprecision.com/modern-reloading-2nd-ed)** (Lee Precision) | Book | Most-used single methods text: prep, sizing, seating, crimping, scope mounting — and *why* each step matters | High; technique-first |
| **[Metallic Cartridge Handloading](https://www.simonandschuster.com/books/Metallic-Cartridge-Handloading/Mic-McPherson/9781571573711)** (McPherson) | Classic book | Standard narrative history and principles; a *craft* text, not a data source. Largely out of print | High as history; **classic status ≠ current data** |
| **[Hornady Handbook of Cartridge Reloading](https://www.hornady.com/reloading/handbook)** (12th Ed.) | Manual + free PDF | Hornady load data + component compatibility tables | High for Hornady-specific data; **commercial interest** |
| [Speer Reloading Manual #14](https://www.bundukibooks.com.au/Speer-Reloading-Manual-14-p/rl65.htm), Lyman 51st Ed., Barnes No. 4 | Publisher manuals | Component-specific load data. Lyman is the only serious source for cast-lead | Medium-high on data. **Verify edition currency at an authorized retailer** — the link above is a third-party bookseller |
| **[ANSI/SAAMI standards (Z299 series)](https://saami.org/)** | Industry standards | The standardization layer every load table inherits from: CIP/SAAMI reference pressures, measurement procedures, **standard test barrels by caliber** | **Very high and genuinely neutral** — the root authority |

**SAAMI's role, precisely:** founded 1926, an ANSI-accredited **voluntary** standards body — a trade association, not a regulator. Z299.1–Z299.4 structure: §1 Characteristics, §2 Procedures, §3 Equipment (crushers, headspace gauges, **standard test barrels by caliber**), §4 Definitive Proof Loads. Drawings for newer cartridges are published separately since standards update periodically.

**SAAMI explicitly declines handloading guidance** — the standards are "intended for use by commercial ammunition and firearm manufacturers only," and SAAMI "cannot provide any guidance on propellant selection, charge weights, primer selection or other hand loading/reloading-specific questions."

**Unverified, flagged:** the **"PALS ammunition handbook"** — no such title was found; SAAMI/CIP standards are the real underlying authority. **C.I.P. and SAUCI pressure conventions** were not mentioned on SAAMI pages. Barnes manual exists online only as an unreliable third-party scan — **obtain from Barnes directly.**

### Where to actually learn this properly
**The trap: a load table feels like knowledge.** It's the *output* of knowledge, and copying one teaches you nothing about why it works or when it will fail.

1. **Vocabulary and anatomy first.** Read a trade glossary (Norma, RCBS) end to end. Name every component; explain why each step exists. Costs a weekend, prevents every later misunderstanding
2. **Then the physics, from a real text.** Carlucci & Jacobson for interior ballistics and pressure-volume. Tireur for exterior ballistics, drag, and wind. A chapter a week for a few months changes how you read everything afterward
3. **Only then use manuals — and use more than one.** Treat Hornady, Lee, Speer, Lyman, Barnes as *product documentation with a commercial interest*. Cross-reference the same cartridge across at least three. **Where they disagree, you have a real problem to solve — and that disagreement is where learning begins**
4. **Get structured instruction.** NRA Basic Metallic Cartridge Reloading Course (pistol and rifle variants) gives a graded curriculum with bench time. Justify on pedagogical grounds — the sponsoring organization's advocacy position is real and separate from the instruction
5. **Do serious load development on a benign cartridge**, with a chronograph, a proper scale (**never the powder measure**), and a written record including temperature
6. **On the law:** read primary sources — ATF's Q&A pages, 27 CFR Parts 447 and 478, your own state code and AG guidance — not gun-advice sites or advocacy trackers. **A forum answer can send you to prison**, and neutral legislative research will be dated while a forum post will be confidently wrong

---

## 11. Regulatory Landscape

*General information only — not legal advice. Verify current law with ATF or qualified counsel.*

Federal framework centers on **27 CFR Parts 447 and 478**. Handloaded ammunition is a distinct legal category from both factory ammunition and remanufactured ammunition, and the practical consequences (liability, warranty, transport, and in some jurisdictions sale) track that distinction.

**Cross-border considerations vary substantially** — importing handloaded ammunition or components differs by jurisdiction. This area was the thinnest in the research; treat anything specific as needing direct verification with the relevant authority.

---

## 12. Glossary

**Case capacity** — internal volume, measured in grains of water (gr H₂O) to the case mouth
**Headspace** — volume between case head and chamber ceiling *(often conflated with head clearance in vendor literature)*
**COAL** — Cartridge Overall Length
**ES** — Extreme Spread, largest distance between any two shots in a group
**SD** — Standard Deviation of velocity
**MV / ML** — Mean Velocity / Minimum Larded (a reloading press)
**Form function** — how burning surface area changes as a propellant grain is consumed
**Progressive / degressive / neutral burn** — grain geometries producing flat, spike, or linear pressure curves
**Piobert's law** — gas generation proportional to burning surface area
**SAAMI / CIP** — the two competing ammunition standards regimes; crusher ratings mean different things in each
**MPD** — ambiguous in the field: "Maximum Pressure Desired" *and* "Maximum Permissible Pressure"
**Jacket** — the bullet's outer copper-alloy envelope
**Core** — the bullet's interior: lead, bonded lead, copper, or solid
**Ogive** — the nose curve, specified as a radius in calibers
**Rt/R** — tangent radius ÷ actual radius; 0.5 is the practical secant floor
**Tangent vs secant ogive** — mathematically exact vs the pragmatic approximation for a given nose length
**VLD** — Very Low Drag
**BC (G1/G7)** — Ballistic Coefficient, drag relative to a reference projectile; G7 is more applicable to modern streamlined bullets
**SD** — Sectional Density, bullet mass ÷ cross-sectional area; drives momentum and penetration
**MEP** — Muzzle Energy Projectile
**Boat tail** — tapered base truncating the flat rear face to reduce base drag/wake
**Bearing surface** — the cylindrical shank length that engages rifling; precision begins where bearing surface ends
**BHN / Brinell Hardness** — case and cast-bullet hardness measure
**HV** — Vickers microhardness; the relevant test for thin case walls
**HV target for annealing** — ~98 HV industry standard (AMP)
**SCC** — Stress-Corrosion Cracking
**Annealing** — heating to relieve work-hardening; **the only way to reverse it**
**Full-length sizing vs neck sizing** — resizing the whole case vs only the neck
**Decapping** — removing the fired primer
**Cannelure** — the groove mid-jacket that seals bearing surface and retains the core
**Flash deburring** — chamfering the primer pocket mouth; tooling controversial
**Straight crimp / taper crimp / roll crimp** — crimp styles: auto, rifle/bottle, revolver respectively
**Bullet jump** — forward movement of the bullet in the chamber; prevented by strong crimp in autos
**Dapple** — the "pearlescent" velocity pattern indicating a barrel-harmonic node
**Frequency of optimal velocity (FOV)** — the muzzle velocity at which the bullet's barrel harmonic produces minimum group
**Yaw** — angle between bullet axis and trajectory tangent
**Precession vs nutation** — slow steady cone vs fast tip-over; spin converts nutation into precession
**Greenhill factor** — 1879 stability formula: length-in-calibers × twist-rate = 150 (practical: 200)
**Graze / MRI** — Magnetic Resonance Imaging; bullet deformation diagnostics
**Revert** — returning to a previous load once a new one proves worse; good practice
**Max load vs start load** — manual tables show a practical max deliberately below the tested maximum, because reloaders start work-ups there

---

## Source Quality Notes

**Weighted highest:** Siewert (NDIA — design-engineering authority), Litz (Applied Ballistics), Corbin 1986 (grounded in Army/Bailey work, *and* cuts against its own sponsor), Singer/Siebel (Hodgdon — stated conflict of interest), Peterson (4-year archived data), Theophilus/METLAB (materials engineering citing CDA/ASM), SAAMI & FBI LEB (primary), Balster/Buchstab (industry engineers), AMP (most rigorous commercial annealer), and ChuckHawks (long-running independent analyst).

**Excluded as SEO/vendor filler:** eathealthy365.com (nutrition domain republishing reloading content), xxlreloading.com, gloryreels.com, scattered shots / titan reloading / nightgalaxy 2025–26 "diagnostics" pages (SEO restatements of Sinclair/Wilson material — trace claims to primary), all chamber-flag effectiveness content, gun store and manufacturer marketing pages.

**Methodological caution carried from the bullet workstream:** a large share of technical literature is first-party from bullet manufacturers. Preference was given to sources where physics is derivable and checkable (Rt/R = 0.5, 17 BHN solder limit, cannelure function, hoop stress) and manufacturer tolerance claims (0.0003" runout, "no BS BC") were flagged as unverifiable absent independent measurement.

**Tooling note:** `web_search_exa` was not provisioned to any subagent this run; all used the Exa REST API directly with the configured key. Several subagents reported that PDF text extraction failed through the fetch tool (raw FlateDecode binary) and used local extraction instead; sources that could not be read were **flagged rather than cited** — notably the Kelter tumble section and Litz's "What's Wrong With 30-Caliber."