# T5 / 04 — Published equivalency rules for an unlisted projectile

**Task:** interior-ballistics. Verbatim where possible. **No charge weight appears
here.**

The finding that matters: **no manufacturer in this field publishes an
interpolation rule.** Every one of them routes the unlisted-bullet case to a human —
themselves. That is the strongest possible evidence that the load-synthesis goal as
posed is not something the industry considers solvable by rule.

---

## 1. Berger Bullets (Capstone Precision Group)

### 1.1 The rule

Berger publishes no interpolation formula. Their published guidance is to telephone
the manufacturer:

> "Looking for reloading data that is not in our reloading manual or listed below? We
> can help you out! Call us at 660-460-2802 for the latest load data for ..."
> — `https://bergerbullets.com/reloading-data/`

Restated by users of their manual: *"If your bullet is NOT listed, call the bullet
maker, i.e. Berger. They will give you a close match to one that is listed."*

**Note the shape of this:** "a close match to one that is listed" is exactly the
**neighbour-interpolation** of route 1 in `03-load-synthesis-literature.md` §6 — done
by a human, using unpublished judgement, case by case.

### 1.2 What they say about verification

Verbatim, `https://bergerbullets.com/shoot-better/shooting-knowledge/reloading-disclaimer/`:

> "When loading using new components or the same components but from a different lot
> we recommend that you start testing your loads with the Starting Loads listed in
> this manual. You can work up to our maximum loads while looking for signs of
> excessive pressure but do not exceed the loads listed on our website and/or in our
> reloading manual."

> "It is a well-known fact that the same powder type will produce different velocity
> and pressure from one lot to another. This is why we recommend that you do not
> exceed the maximum charges listed in this manual since one lot of powder of a
> specific type may produce velocity and pressure that is lower than listed. It is
> also possible and likely that another lot of the same powder will produce higher
> velocity and pressure using the same charge."

> "Such variations in velocity and pressure is one of the reasons why bullet and
> powder manufacturers do not list the same velocity with corresponding powder
> charges in other loading manuals; it is impossible to provide perfectly consistent
> data between all manuals and websites that provide load data because of performance
> variations from one lot to another."

And on liability:

> "**SINCE HANDLOADING MATERIALS, HANDLOADING TOOLS, HANDLOADING PROCEDURES AND
> COMPONENTS OF A SHOOTING SYSTEM (FIREARM) USED BY AN INDIVIDUAL ARE BEYOND OUR
> CONTROL, CAPSTONE PRECISION GROUP, DBA BERGER, DISCLAIMS ANY AND ALL LIABILITY FOR
> ANY DAMAGES, INJURY OR DEATH THAT MAY RESULT.**"

> "Buyers and users assume all risk, responsibility and liability whatsoever for any
> and all injuries (including death)..."

---

## 2. Hornady

Hornady's route for a new, unlisted bullet is also human, but with an important
twist: **they publish the data for it, temporarily.**

> "Occasionally, we will temporarily publish load data on this page when a bullet
> becomes available and is not yet listed in the latest edition of the handbook."
> — `https://www.hornady.com/support/load-data/`

So Hornady's answer to "my bullet isn't listed" is: they will run the test and post
the answer. **Measurement on demand, not inference.**

### 2.1 The erratum — read this twice

The same page currently carries an unprompted safety notice:

> "Hornady has identified a misprint in the 12th Edition Hornady Handbook of
> Cartridge Reloading involving the 6.5 PRC load data on page 350. **The powder
> listed as StaBall Match should correctly read StaBall HD.**
> Using the misprinted powder could result in dangerously high pressures..."

**Why this belongs in an equivalency-rules document.** A *single wrong powder name in
a printed table* produced a dangerous pressure. The failure mode is not exotic — it
is transcription. Any system mapping a projectile to a load by resolving names to a
table carries the identical risk, and would carry it with **no erratum channel**,
because nobody would be watching. Our equivalent rule should be: the resolver must
be able to say "I am not sure this is the same thing," and must return EMPTY rather
than a guess.

### 2.2 Commercial status

> "Reloading data is available as low as 99¢ per cartridge or as a subscription for
> $19.99."

Sold, not given. **Not redistributable.**

---

## 3. Hodgdon

Hodgdon publishes load data per cartridge in a data centre, with columns including
`C.O.L.`, `Grs.`, `Vel. (ft/s)`, `Pressure` and `Load Density %`
(`https://hodgdonreloading.com/rldc/`). The published list is keyed to **listed**
bullets. No interpolation rule is published for an unlisted bullet.

Noteworthy: Hodgdon publishes **Load Density %** alongside each load. This is the
one manufacturer datum that touches interior ballistics directly — it ties a charge
to the case volume it occupies. It is a per-load observation, not a powder constant,
and it depends on the case volume we do not hold (0/229). It is the single most
useful quantity in these tables for our purpose, and it is still not enough, because
it is recorded per combination rather than per powder.

---

## 4. Conflicts between the sources

| Conflict | Detail |
|---|---|
| **Load data differs manual to manual** | Rugerforum: "Load data for the same cartridge varies manual to manual." Component manufacturers and equipment manufacturers (Lee, Lyman) are reported to publish higher charges than Hornady. **No arbitration rule exists.** |
| **Relative burn rates disagree across charts** | "Relative burn rate locations for the same powder vary on different burn rate charts." Vihtavuori's cross-brand chart and Hodgdon's chart disagree in ordering. |
| **Lot-to-lot variation** | Stated by the manufacturers themselves (Berger, Nammo). Unresolvable from published data. |
| **C.I.P. vs SAAMI pressures** | Different standards, different numbers. |
| **Errata are published separately, not in-table** | Hornady's 6.5 PRC correction lives on a web page, not in the handbook. A data pipeline reading tables will not see it. |

---

## 5. What every one of them says about verification — the common clause

All four converge on the same three-part statement:

1. **A published load is a starting point, not a guarantee.** Berger: "we recommend
   that you start testing your loads with the Starting Loads."
2. **Verification is the reloader's, by working up from the minimum.** No source
   removes it.
3. **The data cannot be made consistent between sources**, because the underlying
   material varies.

**Synthesis — this is the deliverable's conclusion:** the industry rule for an
unlisted projectile is *find the nearest listed analogue, start at its minimum, and
verify by measurement*. The inference is human, conservative, and case-by-case. Any
automated system claiming to do better is claiming information the industry does not
have.

**Licence summary:** Berger — © CPG, no redistribution. Hornady — sold product, no
redistribution. Hodgdon — © Hodgdon, no redistribution. All cite-only.