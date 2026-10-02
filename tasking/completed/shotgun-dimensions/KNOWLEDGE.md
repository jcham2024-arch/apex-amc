# KNOWLEDGE — shotgun-dimensions

Task `shotgun-dimensions`. Findings for other agents. Full vectors in
`01-source-availability.csv`; reasoning in `02-per-gauge-verdict.md`.

---

## 1. Shotgun is the BEST-sourced category. Do not treat it as the worst.

`cartridge-dimensions` said CIP addresses ~11 of our 229 cartridges. True overall,
**badly misleading per category.**

**CIP Tab VII (Shot cartridges) lists 56 entries covering 7 of the 8 standard
gauges**: 12, 16, 20, 24, 28, 32 and .410 Bore. Only **18 Gauge** is absent.

Why the distortion: CIP is a European proof-testing body and Tab VII is a
systematic shotshell catalogue. The cartridges dominating our index — US rimfire
and classic designs — are largely missing from CIP. **One whole-dataset ratio
(~11/229) hid a category where coverage is 7/8.** Always compute coverage
per-family, not only in aggregate.

## 2. 12 Gauge and 28 Gauge are free, named, and ready

SAAMI's free page explicitly names:

> **12 Gauge 1¾"** · **28 Gauge 3″** · `16 ga. 2¾"` (revision)

Free download, no negotiation, and they are the most common gauges. **The cheapest
dimensional wins in the dataset.**

Carry both caveats forward: they are designs **not yet in the published revision**,
and the publisher warns a correction "not yet folded into the standard is exactly
what silently invalidates a figure you already hold." **Record the drawing
revision date, not just the SAAMI edition.**

## 3. `4 Bore Rifle` is misfiled as `shotgun` — and holds no data

Our only `family=shotgun` row. **4 Bore is a rimfire rifle cartridge, not a
shotshell**, and both `saami_max_psi` and `cip_max_bar` are **EMPTY**.

So it makes the shotgun category look populated when we hold **zero** gauges, and
does not even serve the placeholder role it appears to have been created for.

> **Recommendation: reclassify to `rifle`; leave shotgun honestly empty.** Zero is
> correct and visible. A misfiled row is neither. Not applied — `data/seeds/` is
> outside the task write-set and needs a reviewed edit.

## 4. CIP's index and CIP's sheets disagree about reproduction

The **Tab VII index** publishes `PT max` pressure figures per designation with
**no reproduction notice** — only `© C.I.P - All rights reserved`. The
**per-cartridge sheets** carry:

> "Reproduction forbidden as well as in the form of extracts without approval of
> C.I.P."

Browsing and indexing are permitted; extracting is not. This is the licence
question in miniature, and it is why there is **no published-terms route** to
permission — only a question put to CIP.

## 5. `PT max` is a proof standard, NOT a chamber safety limit

They are different quantities from different standards bodies. Conflating them is
what `docs/BRASS-AND-PRESSURE-CLASS.md` exists to prevent. **Shotgun proof
pressures are in the paywalled SAAMI Z299 series** (`proprietary`, `adopt=false`).

Availability recorded; the value deliberately not sought.

## 6. 18 Gauge has no located source — EMPTY is correct

Not in CIP Tab VII, not on the SAAMI free page. Stated honestly: **no source found
in the sources surveyed** — not "no source exists." Per `.clinerules` rule 1 the
cell stays EMPTY rather than filled from an unvetted compilation.

## 7. Method: read the publisher's page, do not inherit a summary

Three of my four findings this session came from **reading the source directly**,
and **every one contradicted a completed task's summary**:

| Claim in a completed task | What the page said |
|---|---|
| SAAMI free drawings cover few of our cartridges | names 12 & 28 Gauge explicitly |
| CIP covers ~11 of 229 | Tab VII alone covers 7 of 8 gauges |
| "no 9mm, no .22LR" | we hold both, as `9 Luger` / `.22 LR` |

> **A summary written by an agent is a hypothesis. The publisher's page is the
> evidence.** Re-verify any inherited claim before building on it — I did not, and
> it cost two tasks and a contradiction between them.