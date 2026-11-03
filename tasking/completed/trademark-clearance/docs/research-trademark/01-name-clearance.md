# Brand-name clearance research — candidate pool

Task `trademark-clearance` (T1). Research only. **No brand string, source file, config
or ledger was changed by this task**, and none should be changed on the strength of
this document alone.

**Model:** default model, fresh instance.
**Registry searched:** USPTO Trademark Search (`https://tmsearch.uspto.gov`),
exact-string Wordmark field, run **3 Oct 2026**.

---

## 1. Method, and why it is written down

Every candidate below was searched by driving the live USPTO search UI in a real
browser, on the **Wordmark** field, as an **exact string**. Two things this method does
*not* do, which a reader must not mistake for clearance:

1. It is the **US** register only. EUIPO (EU), UKIPO (UK), CIPO (CA) and IP Australia
   were **not** searched. A name clear in the US can be registered elsewhere.
2. An exact-string search returns **word-mark registrations of that literal string**.
   It does **not** clear the domain, the common-law trade name, a similarly-spelled
   mark, or a mark that would be confusingly similar. No likelihood-of-confusion
   analysis was performed. **That requires an attorney, and nothing here substitutes
   for one.**

### Negative test — the search finds a mark when one exists

A search returning "no results" is only meaningful if the same routine finds a mark
that does exist. Control query, same session, same routine:

```
Search: "apex ammunition"  ->  2,764 results
  APEX AMMUNITION | LIVEREGISTERED | IC 013: Shotgun shells.
  Serial 87507153 | Apex Ammunition LLC (Mississippi, USA)
```

This matches the brief's established finding (reg. 5391055, IC 013, Apex Ammunition
LLC) and therefore **confirms the "No results found" readings in this document are
real absences, not a broken query.**

---

## 2. Established findings, carried forward not re-derived

Per the brief these are MEASURED and are reproduced here unchanged:

| Mark | Reg. No. | Status | Owner | Class |
|---|---|---|---|---|
| **APEX AMMUNITION** | 5391055 | **LIVE** (reg. 2018-01-30) | Apex Ammunition LLC (Mississippi, USA) | IC 013 — shotgun shells |
| APEXLOAD | — | no exact-match registration found | — | — |

`https://apexmunition.com/` is a live operating storefront with an 18+ age gate.
This task independently **re-confirmed** the APEX AMMUNITION registration exists
(see negative test above).

---

## 3. Registry results, all candidates

Every row was searched. "Exact-match hits" is the registry's own result count for
that literal string.

| Candidate | Exact-match hits | LIVE | DEAD | IC 013 / 009 / 042 hits | Notes from the registry record |
|---|---|---|---|---|---|
| `ballisticslab` | **0** | 0 | 0 | none | No registration of any status |
| `ballisticlab` | **0** | 0 | 0 | none | No registration |
| `ballisticsapi` | **0** | 0 | 0 | none | No registration |
| `ballisticsdb` | **0** | 0 | 0 | none | No registration |
| `caliberlab` | **0** | 0 | 0 | none | No registration |
| `ammodata` | **0** | 0 | 0 | none | No registration |
| `ammoquery` | **0** | 0 | 0 | none | No registration |
| `loadforge` | **0** | 0 | 0 | none | No registration — **but see §4: a live competitor uses it** |
| `loadsense` | **3** | **1** | 2 | **IC 009** | See below |
| `recipelab` | **2** | **2 (both PENDING)** | 0 | **IC 042, IC 009** | See below |
| `loadsmith` | **1** | **1 (LIVE/REGISTERED)** | 0 | IC 035, 039 | See below |
| `loadwise` | 4 | **0** | 4 | IC 035 etc. | All dead/abandoned |
| `ballistify` | **0** | 0 | 0 | none | No registration |
| `loadgraph` | **0** | 0 | 0 | none | No registration |
| `powderlab` | **0** | 0 | 0 | none | No registration |
| `trajectorylab` | **0** | 0 | 0 | none | No registration |
| `chargegraph` | **0** | 0 | 0 | none | No registration |
| `loadworks` | **0** | 0 | 0 | none | No registration |

### The three that are not clear

**`loadsense` — CAUTION.**
- Serial 97305112 · **LIVEREGISTERED** · IC 009 · **Stress Indicators, Inc.**
  (Maryland, USA) — measuring instruments, bolt tension/torque.
- Serial 85415507 · DEAD/ABANDONED · IC 009 · Aerogo, Inc. — pressure regulators.
- Serial 77507187 · DEAD/CANCELLED · IC 009 · Loadsense Technologies Corp (Illinois).

A live IC 009 registration in measuring instruments is adjacent to a reloading
reference site. Two dead filings do not help: they are citable in a dispute as prior
use, and they show the term was already in commerce in this space.

**`recipelab` — AVOID.**
- Serial 50065579 · **LIVEPENDING** · IC 042 SaaS · **RecipeLab LLC** (Delaware, USA)
- Serial 99772338 · **LIVEPENDING** · IC 009 downloadable apps · **NickKaz Fit LLC**
  (Georgia, USA)

Both are **pending**, i.e. unexamined, and both are in the two classes the brief names
as decisive. Pending applications mature into conflicts. Two independent owners have
already adopted the string for software.

**`loadsmith` — AVOID.**
- Serial 88365621 · **LIVEREGISTERED** (reg. **6076028**, 2020-06-09) ·
  IC 035/039 · **LOADSMITH HOLDING CORPORATION** (Denver, Colorado; Delaware corp).
  International registration A0089443/1511021. Two ownership assignments recorded.
  Freight and logistics brokerage.

Outside 013/009/042, so the strict class test passes — but it is a live US service
mark, it reads as a trade name rather than software, and "Smith" is the archetypal
smithing suffix. It signals manufacturing, which is the opposite of what the owner
wants.

---

## 4. Vertical (web) results — where the real risk is

The registry is not the whole picture. A competitor trading under the same name is a
real problem even with no registration.

| Candidate | Vertical finding | URL |
|---|---|---|
| `loadforge` | **LIVE OPERATING COMPETITOR.** "LoadForge — Internal Ballistics for Handloaders". Zero USPTO registrations does **not** save this name. | https://loadforge.app/ |
| `recipelab` | Recipe/meal apps in both live USPTO filings (meal recipes, fitness). Reads as cooking. | — |
| `loadsense` | Loadsense Technologies Corp (Illinois) filed in IC 009 for weighing scales. Prior commercial use in instrumentation. | — |
| `ammodata` | **Video-game mod data**, not reloading. Different market entirely. | — |
| `ballisticslab` | No vertical collision found in searching. | — |
| `trajectorylab` | No vertical collision found in searching. | — |
| `powderlab` | No vertical collision found in searching. | — |
| `loadgraph` | No vertical collision found in searching. | — |

---

## 5. Verdicts

Constraints applied: never "APEX"; "AMMUNITION" not distinctive; must signal
**scripting / API / possible LLM integration**, not manufacturing.

| Candidate | Verdict | Reason | Signals scripting/API? |
|---|---|---|---|
| **`trajectorylab`** | **clear** | 0 hits, no vertical collision. Distinctive for the trajectory problem domain. | **Yes** — "lab" reads as an instrument. API-ready. |
| **`powderlab`** | **clear** | 0 hits, no vertical collision. Narrow, specific, and the powder-manifest data is a genuine differentiator. | **Yes** — same. |
| **`ballisticsapi`** | **clear** | 0 hits. The word "API" in the mark is an unusual, ownable choice. | **Yes**, strongest of the pool. |
| **`ballisticslab`** | **clear** | 0 hits. But near-identical siblings (`ballisticlab`, `ballisticsdb`) are equally clear — "ballisticslab" is not the only spelling, and the .com resolves to someone. | Yes |
| `loadsense` | **caution** | Live IC 009 mark; "sense" implies a sensor, we sell no sensor. | Weak — suggests hardware. |
| `loadgraph` | **caution** | 0 marks, but reads as a single chart tool, not a platform with an API. | Weak. |
| `ballistify` | **caution** | 0 marks, but the "-ify" suffix reads consumer-app, and `ballistify.com` resolves. | Weak. |
| `loadworks` | **caution** | 0 marks, but "works" reads manufacturing. | Weak. |
| `chargegraph` | **caution** | 0 marks. "Charge" risks confusion with payment charges in SaaS naming. | Weak. |
| `loadwise` | **caution** | 4 filings, all dead/abandoned. Dead filings in IC 035 are prior-use evidence. | Weak. |
| `caliberlab` | **caution** | 0 marks, but **"Caliber" is spelled CALIBER in the US**; `caliberlab` is the misspelling, a durable SEO and trust liability. | Yes |
| `ammodata` | **avoid** | Occupied in the vertical by video-game mod data. Also generic; weak mark. | No |
| `ammoquery` | **avoid** | Generic. `ammoquery.com` resolves to a live site. | Yes, but generic. |
| `loadforge` | **avoid** | **Live competitor at loadforge.app doing interior ballistics for handloaders.** Direct collision. | Yes |
| `recipelab` | **avoid** | Two LIVE PENDING in IC 042 and IC 009; reads as cooking. | Yes |
| `loadsmith` | **avoid** | Live registered IC 035/039 mark; reads as manufacturing. | No |

### The rejected candidate, stated plainly

**`loadforge` is rejected.** The registry shows **zero** registrations — on the
registry-only test it is one of the cleanest names in the pool, and it would have
passed a search that never looked at the web. But `https://loadforge.app/` is a
**live operating competitor**, titled *"LoadForge — Internal Ballistics for
Handloaders"*: the same problem, the same audience, an operating product. Adopting it
would put a permanent confusion risk on the site. **A trademark clearance that never
searched the vertical would have recommended this name.**

---

## 6. What this document does NOT establish

- Not clearance in any non-US jurisdiction.
- Not a likelihood-of-confusion opinion. No attorney has read this.
- Not a domain availability determination — see
  [`02-domain-options.md`](02-domain-options.md), where every domain carries an
  explicit method and confidence level, and **no domain is reported "available"
  without NXDOMAIN or registrar confirmation.**
- **Not authorisation to rename.** The owner asked for a rename; the `brand-rename`
  task is blocked on the owner's choice of name. This document supplies evidence, not
  a decision.

**Professional review recommended** before any brand change or any filing.