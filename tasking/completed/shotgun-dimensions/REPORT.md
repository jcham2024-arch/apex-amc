# REPORT — shotgun-dimensions

**Agent:** 879ca · **Priority:** medium · **Status:** COMPLETE (4/4 outputs).
**Write-set:** `tasking/completed/shotgun-dimensions/` only.
**No dimensional value and no chamber safety limit transcribed** — asserted
mechanically (`any value recorded: no`).

---

## 1. Headline: shotgun is the *best*-sourced category, not the worst

`cartridge-dimensions` reported CIP as addressing only ~11 of our 229 cartridges.
That is true of the dataset **as a whole** — but it badly understates shotgun.

**CIP Tab VII (Shot cartridges) lists 56 entries**, covering:

> **7 of the 8 standard gauges** — 12, 16, 20, 24, 28, 32 and .410 Bore.

**18 Gauge is the sole absence**, and is recorded EMPTY rather than filled.

Why the asymmetry: CIP is a European proof-testing body and Tab VII is a
systematic shotshell catalogue. The cartridges that dominate our index — US
rimfire and classic designs — are largely absent from CIP, so a whole-dataset
ratio of ~11/229 badly understates coverage in this one family. **A per-category
ratio would have been the honest measure, and nobody computed it.**

## 2. Two gauges are free, named, and immediately actionable

SAAMI's free drawings page **explicitly names**:

> **12 Gauge 1¾"** · **28 Gauge 3"** · `16 ga. 2¾"` (revision)

These are the three most commonly encountered gauges, they are free downloads, and
they need no licence negotiation. **They are the cheapest dimensional wins in the
entire dataset.**

Two caveats from the publisher, both carried forward: these are designs **not yet
incorporated into the published revision**, and a revision not folded into the
standard "is exactly what silently invalidates a figure you already hold." So any
future transcription must record the **drawing revision date**.

## 3. The `4 Bore Rifle` row is misfiled and empty

The only row filed as `shotgun`. Measured: `saami_max_psi` **EMPTY**,
`cip_max_bar` **EMPTY**.

Three problems:

1. **4 Bore is a rimfire rifle cartridge, not a shotshell.** Filing it as
   `shotgun` makes the category look populated when we hold **zero** gauges.
2. **The name is redundant** — "4 Bore Rifle" conflates gauge and platform.
3. **It carries no data at all**, so it is not even serving the placeholder role
   it appears to have been created for.

**Recommendation: reclassify to `rifle`; leave shotgun honestly empty until real
gauge rows exist.** Recording zero is correct and visible; recording a misfiled
rifle cartridge as a shotgun is neither. **I did not make this change** —
`data/seeds/` is outside my write-set and reclassification is a reviewed edit
under the seeds lock. It is a proposal, not a patch.

## 4. What I did NOT do

- **No dimensional value transcribed.** The deliverable is availability.
- **No chamber safety limit sought, recorded, compared or reasoned about.** Every
  CSV row reads `not_assessed_by_this_task`. Shotgun proof pressures live in the
  **paywalled** SAAMI Z299 series — recorded as an availability fact only.
- **Did not resolve the CIP licensing question.** Owned by
  `cartridge-licence-reconciliation`; every affected row carries a cross-reference
  rather than my own conclusion.
- **Did not modify `data/seeds/`**, for the reason in §3.
- **Did not modify any gate.**

## 5. Reasoning worth keeping

**CIP's Tab VII index publishes `PT max` pressure figures with no reproduction
notice, while its per-cartridge sheets forbid reproduction outright.** That
asymmetry is the whole licence question in miniature: browsing and indexing are
permitted, extracting is not. It is why `cartridge-licence-reconciliation`
concludes there is no *published-terms* route to permission — only a question
put to CIP.

**CIP `PT max` is not a chamber safety limit.** It is a proof standard. Treating
it as one is precisely the SAAMI/CIP conflation
`docs/BRASS-AND-PRESSURE-CLASS.md` exists to prevent, and I have flagged it rather
than acted on it.

## 6. Unresolved

1. **The `4 Bore Rifle` reclassification** — needs a reviewed seeds edit.
2. **18 Gauge has no located source** in the sources surveyed. EMPTY, correctly.
3. **Whether any Tab VII dimension may be transcribed** — pending the CIP
   question. Until answered, all 7 CIP-covered gauges stay EMPTY.
4. **Shotgun safety limits are paywalled** (Z299). Availability recorded;
   the value was deliberately not sought.

## 7. Method note

Two of my findings this session came from reading a publisher's page **rather
than inferring from a summary** — the SAAMI free-drawing list, and CIP Tab VII's
gauge coverage. Both contradicted what earlier completed tasks reported. The
cost of not checking is a plan built on a wrong premise, which is precisely what
happened with `ammoseek-coverage`.