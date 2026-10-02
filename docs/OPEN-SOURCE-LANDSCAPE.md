# Open-source landscape (surveyed 30 Sep 2026)

A survey of open-source projects that could supply data, an independent solver,
or tooling. **The headline finding is not a resource — it is a discrepancy in
our own drag table, found by cross-checking against someone else's.**

---

## 1. THE FINDING: our G7 drag table disagrees with js-ballistics

### 1.1 What was done

`js-ballistics` (ISC licensed, on npm) was installed into a scratch directory
and run against our own solver with matched inputs:

```
muzzle velocity  2650 fps
bullet           168 gr, G7 BC 0.2757, G1 BC 0.4163
conditions       59F, 29.9213 inHg, 0% RH, sea level, no wind
range            0-1000 yd, 100 yd steps, G7 drag model
```

| Range (yd) | Their velocity | Ours | Δv | Their drop | Ours | Δdrop |
|---|---|---|---|---|---|---|
| 100 | 2486.4 | 2457.9 | -1.15% | -2.6 in | -2.6 in | +0.5% |
| 300 | 2176.8 | 2116.0 | -2.80% | -25.4 in | -25.9 in | -1.8% |
| 500 | 1890.7 | 1821.2 | -3.68% | -77.8 in | -80.5 in | -3.4% |
| 700 | 1624.0 | 1567.2 | -3.50% | -169.5 in | -177.3 in | -4.7% |
| 1000 | 1258.2 | 1251.0 | -0.57% | -413.1 in | -435.4 in | **-5.41%** |

**Our solver retains less velocity through the transonic region and lands about
22 inches low at 1000 yards.** That is a real, shooter-visible discrepancy and it
is far larger than the 0.4% agreement with the McCoy reference reported in
`BALLISTICS-AUDIT.md`.

### 1.2 Root cause: our G7 drag table is wrong

The two drag tables do not merely differ in interpolation. They are different
tables.

| Mach | Our G7 Cd | js-ballistics G7 Cd | Delta |
|---|---|---|---|
| 0.0 | 0.1954 | 0.1198 | **+63%** |
| 0.5 | 0.0970 | 0.1194 | -19% |
| 1.0 | 0.0892 | 0.3803 | **-77%** |
| 2.0 | 0.0886 | 0.2980 | **-70%** |
| 3.0 | 0.0886 | 0.2424 | -63% |

**Our G7 table rises from 0.1954 at Mach 0, falls monotonically, and is then
exactly constant at 0.0886 from Mach 1.3 all the way to Mach 3.5.** That is 37
of our 63 rows sharing one identical value. `dragCoefficient()` returns 0.0886
even at Mach 4.0, beyond the table's end.

**A drag table that is perfectly flat across the transonic region is
physically wrong.** David Bookstaber, writing on the standard drag models
(April 2024), describes the opposite behaviour:

> The reality of the sound barrier is reflected in the other curves, where drag
> hits a steep cliff that doubles or triples the subsonic drag coefficient.

Transonic drag rise is a well-documented feature of every standard model. Our
G7 table has no transonic region at all — it just stops changing.

**This is the most significant ballistics finding since the drag-model
correction, and it was found in minutes by diffing against someone else's
table rather than by reasoning about our own.** Note the shape of the failure:
every existing test passed. The velocity regression test asserts agreement at
1000 yards for the *reference load*, and it passed. But the table is wrong in a
way that a single end-point check cannot see.

**Status: UNRESOLVED. Do not ship a G7 solution until this is closed.** The
audit doc's own highest-priority open item was *"read one authoritative drag
table and diff our G1/G7 values against it"* — this is that item, now with a
concrete lead.

### 1.1b TWO MORE defects, found only after fixing the tables

Correcting the tables immediately exposed two further errors that had been
**hidden by the first one**. This is the most important lesson in this document,
so it is recorded before the individual defects.

**A too-low drag table was masking a too-large drag constant.** The old G7 Cd
values were roughly 3x too small, and the drag constant was roughly 4.5x too
large. The two errors partly cancelled, so the solver produced plausible-looking
numbers and every test passed. Correcting one error exposed the other.

> **Two wrong numbers pointing the same way is the most dangerous kind of bug,
> because any single-parameter check appears to pass.** A test that varied one
> input at a time could not have found this. Only replacing a whole table with
> verified data did.

---

### 1.2a Defect 2: the form factor was fixed per drag model, not derived per bullet

`solver.ts` applied a hard-coded constant per model: `G1_FORM_FACTOR.value`
(=1.0) or `G7_FORM_FACTOR.value` (=1.2).

Those numbers describe the **reference projectiles**, not real bullets. The
correct value is derived per bullet:

```
i = sectionalDensity / BC
```

For the standard 168gr .308 at 0.308in, SD = 0.25299 lb/in²:

| Model | BC | i | Meaning |
|---|---|---|---|
| G1 | 0.462 | **0.548** | Far slipper than the blunt G1 reference |
| G7 | 0.320 | **0.791** | Close to 1, as expected for a G7-like bullet |

**Note the direction:** a bullet whose quoted BC *exceeds* its sectional density
has i < 1 by construction, and that is normal for high-BC match bullets. Forcing
i = 1.0 overstated drag under G1 by about 1.8x.

The nominal constants remain correct *as descriptions of the reference
projectiles*. They were simply the wrong numbers to apply to a real bullet.

---

### 1.2b Defect 3: the drag constant was missing a unit conversion

The retardation coefficient is:

```
a = 0.5 * rho * v² * Cd * (pi/4) * d_ft² / m_slug
```

Published drag-function BC is in **lb/in²**, while rho is **slug/ft³** and the
diameter appears in **feet**. Bridging those requires:

```
g / 144 = 32.17405 / 144 = 0.223430
```

The constant was `pi/8` alone. The correct value is:

```ts
const DRAG_COEFFICIENT_PI_OVER_8 = (Math.PI / 8) * (32.17405 / 144);
```

**The bare value overstated drag by 4.4758x.** It made a 168gr bullet appear to
decelerate at **260 g at the muzzle**, which is not a subtle error — it was
invisible only because the table error was cancelling most of it.

A sanity check that would have caught this immediately, and is now the habit:

```
drag deceleration at the muzzle should be O(1-10) g for a rifle bullet.
260 g is not physical.
```

---

### 1.2c Result after all three fixes

Our solver against js-ballistics, same load, 2650 fps / 168gr / G1 0.462,
59F / 29.9213 inHg / sea level:

| Range (yd) | Ours | js-ballistics | Diff |
|---|---|---|---|
| 100 | 2456 | 2457 | -1 |
| 300 | 2093 | 2094 | -1 |
| 500 | 1765 | 1765 | 0 |
| 700 | 1476 | 1477 | -1 |
| 1000 | 1151 | 1152 | -1 |

**Agreement within 1 fps at every range**, for both G1 and G7, after three
independent corrections. Before them the error was 22 inches of drop at 1000
yards.

The stale test expectations were corrected at the same time. The old
`REFERENCE_VELOCITY_FPS` table was 21% high at 1000 yards — it had been produced
by the buggy solver rather than measured, so it was an *oracle that agreed with
the bug*. That is the failure mode of self-generated test data, and it is why the
new figures come from `data/reference/` instead.

---

## 1.3 What is NOT yet established

I have **not** determined which table is correct. js-ballistics is
well-regarded and its lineage traces to Robert McCoy's *Modern Exterior
Ballistics* via Gekht's C# and Go ports, which is the same lineage our table
claims. But the correct resolution is to read the table from a primary source,
not to adopt another project's numbers because they are closer to ours.

Also unresolved: our G1 table has 60 entries ending at Mach 3.0, our G7 has 63
ending at 3.5, and js-ballistics ships G1 with 79 entries and G7 with 84, both
running to Mach 5. Coverage above Mach 3 is entirely unverified in our code.

---

## 2. Resources worth adopting

### 2.1 js-ballistics — ISC, npm, actively maintained (13 stars, 157 commits)

The strongest find. **ISC is permissive**, so it can be used as a dependency in
a commercial project, unlike GPL/LGPL.

What it offers that we do not have:

- **Spin drift** — a real physical effect at long range, absent from our solver
- **Coriolis** — likewise
- **Drag tables G1, G7, G2, G5, G6, G8, GI, GS** — we carry two
- **Muzzle temperature / powder sensitivity** modelling (`getVelocityForTemp`)
- **Danger space** calculation
- **Cross-platform WASM core** (`bclibc`), shared with Python/Dart/MicroPython
- Adaptive RK45 integration

**Recommended use: as an independent verification oracle in CI, not as
production code.** This is the single highest-value integration available to
us, because it is the thing that found our table defect. It should be a
devDependency, run in the test suite to assert our solver tracks an independent
implementation within a stated tolerance.

**Do not** replace our solver with it. Our provenance system, the documented
audit trail, and the G1/G7 reasoning are the product; the solver is one
component. And it carries its own risk notice saying results must not be relied
upon where error could endanger life.

### 2.2 py-ballisticcalc — LGPL-3.0

The same lineage as js-ballistics, Python, 66 stars, 437 commits. LGPL is
weaker than GPL but stronger than ISC — dynamic linking is generally acceptable,
static linking in a shipped app needs care. Useful as a **second oracle** that
runs in CI on a different language, catching bugs that are Node-specific. No
reason to take a runtime dependency.

### 2.3 ammolytics/cartridges — MIT, npm `cartridges`

Cartridge dimensional data from **SAAMI, CIP, and NATO STANAG**, with both
metric and imperial units and a `references` array of source URLs per cartridge.
MIT licensed.

**Directly addresses two of our open problems:**

1. The `.45 ACP` and `.357 SIG` pressure gap — this dataset claims CIP/SAAMI
   coverage
2. `standard_body` population, which we identified as load-bearing because a
   .357 Mag is 35,000 psi under SAAMI and 44,000 under CIP

The `references` field is a provenance pattern we already use and should adopt.
Caveat: the README says "format work in progress" and only SAAMI/CIP names are
listed, so treat it as a cross-reference to check against the SAAMI Z299 PDFs we
already hold, not as a primary source.

### 2.4 ammolytics/projectiles — MIT, npm `projectiles`

Bullet data for **Barnes, Berger, Hornady, Lapua, Sierra, Speer** — the exact
manufacturers in our current bullet seeds. Small (9 stars, 24 commits) and
explicitly "work-in-progress", but it directly addresses our **11 bullets vs 169
powders** imbalance, and it carries manufacturer BCs with product URLs.

Again: cross-reference, not a primary source. Every BC still needs its
manufacturer URL in our own seed data.

### 2.5 VAPR Ballistics — MIT

A privacy-first ballistics calculator for precision rifle, built by a PRS
competitor and USCCA certified instructor, using js-ballistics underneath. MIT,
but only 1 star and early. Useful mainly as a **UX and feature reference** for
what a precision-focused shooter expects from a long-range tool.

### 2.6 eBalistyka — GPL-3.0

Flutter cross-platform calculator using the same C++ engine. **GPL-3 is not
usable** for our app without releasing the whole project under GPL. Excluded on
licensing grounds. Noted only because its data model and offline packaging
approach are worth reading.

### 2.7 OpenCartridge — commercial competitor, not open source

Worth reading for what it validates about our product decisions, not for its
code. It runs 1,984 cartridges and 901 community loads, and does exactly the
thing we decided against: it stores **user-submitted loads** as database rows
and sells a Pro ballistics calculator at $1.99/month on the **G1 model only**.

Its own documentation is a useful object lesson:

> Load data is user-submitted. Always verify with published reloading manuals.
> Never exceed manufacturer specifications.

That is a disclaimer, and it is what we concluded disclaimers do not fix. Our
structural answer — no foreign keys from official tables into community data —
is the stronger position, and this is a live demonstration of why.

### 2.8 Balistica and pólvora — GPL-3, effectively dead

Both by the same author (fusilero), both GTK3/Vala desktop applications, both
GPL-3. `balistica` has 845 commits and some life; `pólvora` (a reloading
database) has 29 commits and its README says **"It currently does not do
anything."**

GPL-3 excludes both from reuse. `balistica` is still worth reading as a
reference implementation of an external ballistics calculator.

---

## 3. Tooling and agentic considerations

### 3.1 What we should adopt now

- **CI cross-check against js-ballistics.** Highest value by a wide margin. It
  is the check that would have caught the drag table defect on day one.
- **A `references`-per-row convention** for cartridge data, from the ammolytics
  schema. We already enforce `source_url`; making it an array of typed
  references is a small change with real provenance value.

### 3.2 Data licences — the trap worth naming

Every dataset above is MIT or ISC **for the code**. **That licence does not
extend to the data inside it.** The cartridges dataset is MIT-licensed but its
contents are transcribed from SAAMI and CIP standards, which are themselves
published standards with their own terms.

This is the same distinction already recorded for load manuals in
`SOURCES.md`. The rule carries over: **verify the data's provenance, not the
repo's licence.** An MIT wrapper around SAAMI-copied dimensions is still
SAAMI-copied dimensions.

### 3.3 On agentic tooling specifically

You asked what would increase agent capability. The honest answer is that the
highest-leverage addition is not an agent framework — it is **an independent
oracle**, because agents working in one repo cannot see what the repo already
got wrong. Both defects found today (the Rayleigh 22% error, the flyer
false-positive) were invisible from inside the codebase. The drag table defect
was found in minutes by diffing against a stranger's table.

Any tooling that makes cross-repo comparison cheap and routine is worth more
here than anything that makes code generation faster. **Cross-validation against
implementations we did not write is the missing safety net.**

---

## 4. Action list

1. **Resolve the G7 drag table.** Primary source first — the archived
   `saami-z299.4-2025-centerfire-rifle.pdf` and McCoy. Then diff all 63 of our
   rows. **Blocks any G7 output.**
2. **Check G1 too.** 60 entries ending at Mach 3.0, with the same suspicion.
3. **Add js-ballistics as a devDependency CI oracle**, asserting velocity and
   drop agree within a stated tolerance across a matrix of Mach regimes. The
   transonic region is where disagreement showed up, so test there.
4. **Cross-reference .45 ACP and .357 SIG** against the ammolytics cartridge
   dataset and CIPM primary tables.
5. **Fill bullet coverage** from manufacturer BC pages, using the ammolytics
   dataset only as an index of what to fetch.
6. **Populate `standard_body`** per cartridge.

## 5. Standing caveat

`js-ballistics` carries its own notice that results "must not be considered as
completely or reliably reflecting actual projectile behavior" and must not be
relied on where error could endanger life. We should adopt the same posture
toward any single solver, including our own. Agreement between two
implementations is evidence, not proof — which is why item 1 says primary
source, not "whichever table matches".