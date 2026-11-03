# T5 / 05 — Feasibility verdict

**Task:** interior-ballistics. The brief requires the answer in this document's
first paragraph.

---

## 1. Verdict

**Not achievable as asked, and the reason is not cost — it is that the required
physical constants are not obtainable from any lawfully readable source, and cannot
be inferred from published load data without an ill-conditioned, unbounded
extrapolation.** Specifically: **no manufacturer publishes a burn rate, pressure
exponent, force curve, heat of explosion, or loading density for any reloading
powder we hold.** Every consumer-facing burn-rate figure is a *relative ordering*,
and Vihtavuori's guide states in terms that its chart is "**not** to be used for
developing loads." The peer-reviewed literature does contain physical burn rates,
but for laboratory and rocket propellants, not retail gunpowder. The owner wants to
compute a charge for an unlisted projectile; the physics cannot do that from
published data, because the four independent unknowns that determine the answer are
all missing, and jointly fitting them to velocity/pressure observations is
degenerate rather than merely noisy. **The achievable goal is an interpolation
engine over published load data, with mandatory EMPTY on an unresolvable match —
which is exactly what Berger and Hornady do by hand.** A genuine interior-ballistics
calculator is achievable, but only by *measuring* powder constants in a
pressure-rated closed vessel, not by inference.

---

## 2. Minimum viable dataset, and its licence burden

### 2.1 For the interpolation product (recommended)

| Dataset | Volume | Licence |
|---|---|---|
| Load observations (cartridge × bullet × powder × charge → velocity, pressure, load density %) | thousands | **Per manufacturer, mostly paid or ©** |
| Bullet identity and sectional density | 109 held | Mixed; Berger/Hornady © |
| Cartridge pressure standards | 231 held | kwk-derived; CIP/SAAMI restricted for wholesale reprint |
| Cartridge dimensions (case volume, COL) | **0 / 229** | SAAMI free drawings; CIP restricted |

**The licence burden is the dominant constraint.** The load tables are the substance,
and they are copyrighted commercial material — Hornady sells them at 99¢/cartridge. A
site cannot redistribute them without a licence. This is a commercial decision, not
an engineering one.

### 2.2 For a true interior-ballistics solver

Per powder: burn-rate coefficient `a` at a stated reference pressure, pressure
exponent `n`, characteristic velocity `v_c`, force/form curve, density `Δ`,
temperature sensitivity `φ_σ`. **All must be measured; none are published.**

Plus per cartridge: case volume, and per barrel: action capacity and safe pressure.

---

## 3. What is per-powder and what is per-cartridge

- **Per powder:** `a`, `n`, `v_c`, force curve, `Δ`, `φ_σ`, geometry, burn-rate class.
- **Per cartridge:** case volume, neck/chamber dimensions, SAAMI/CIP maximum pressure.
- **Per bullet:** mass, sectional density, BC (G1/G7 — not interchangeable).
- **Per (bullet × powder × cartridge):** the load itself, its velocity and pressure,
  its uncertainty. **This is where the knowledge actually lives**, and it is the one
  category nobody publishes in a form we can compute with.

---

## 4. What must be EMPTY for the result to be honest

This is the operative list. If any is filled with a plausible number, the output
becomes dangerous:

1. `burn_rate`, `pressure_exponent`, `force_curve`, `heat_of_explosion`,
   `loading_density` — **absent from our schema today, and must stay absent** unless
   measured under a documented method with a stated uncertainty.
2. Any charge weight for an unlisted projectile.
3. Any inferred charge weight at all — including one presented with an error bar.
   `03-load-synthesis-literature.md` §4 shows the uncertainty is unbounded in the
   direction that matters, so an error bar would be cosmetic.
4. Relative burn-rate rank **presented as a rate**, or ranks from two charts
   **presented on one scale**. Hodgdon's and Vihtavuori's charts disagree.
5. Cross-lot transferability: a value derived from one lot, presented as
   property-of-the-powder. Manufacturers state lot variation is material.
6. A bulk density substituted for a loading density.
7. Any accuracy claim for a computed load. No manufacturer publishes one; neither
   should we.

---

## 5. Failure modes, ranked by severity

1. **A plausible-looking charge weight for an unlisted projectile.** Injuries, and
   the reason this task carries a hard prohibition. Silent: the output looks
   authoritative and is wrong.
2. **Lot substitution.** A load computed for today's lot, loaded with a lot that
   runs hotter. Manufacturers explicitly warn this occurs.
3. **Errata blindness.** Hornady's 6.5 PRC misprint produced a dangerous pressure
   from one wrong powder name. A name-resolving engine with no erratum channel
   repeats it silently. **Our resolver must be able to return EMPTY.**
4. **Cross-chart rank conflation.** Ranking powder A from one chart and powder B
   from another as if comparable. We already hold 22 Vihtavuori ranks and must not
   merge them with Hodgdon positions.
5. **Geometry extrapolation.** Carrying a diameter or case volume across cartridges.
   `AGENTS.md` records this class of bug for bullets.
6. **Publication as guarantee.** Presenting a starting load without the "verify
   before firing" clause that every manufacturer attaches. This is the YMYL failure
   the project's own `docs/CONVENTIONS.md` is about.

---

## 6. The safety case, in my own words

Every manufacturer in this field prints, in the same words, that a published load is
a **starting point** requiring verification by the reloader, and none of them
publishes the constants that would let anyone compute a load independently. Berger
disclaims liability and says lot-to-lot variation makes consistency between manuals
impossible. Hornady publishes an erratum for a one-word misprint that could produce
dangerous pressures. Hornady **sells** the data. Vihtavuori explicitly forbids using
its burn-rate chart for developing loads.

That is not an industry that believes a load can be computed from a catalogue. It is
an industry that believes the reverse: a load is a **starting point for a physical
test**, and the test is the safety mechanism.

A product that emitted a charge weight without the test would be doing the thing
this entire industry refuses to do, using strictly less information. The correct
output for an unresolvable projectile is not a number — it is a refusal with a route
to a real answer (nearest listed analogue, start at minimum, verify at the range).
That refusal is the safety feature, and it must be designed deliberately, not left
as an empty string.

---

## 7. Recommendation

1. **Ship interpolation over published data, with EMPTY on no-match.** Honest,
   matches industry practice, no liability exposure.
2. **Do not build a charge-weight inference engine.** `03-load-synthesis-literature.md`
   §4 shows it would be an unbounded extrapolation presented as an estimate.
3. **If a real calculator is wanted, measure the powders.** A closed-vessel
   programme, one powder at a time, with stated uncertainty. A legitimate product
   and a legitimate business — but a laboratory, not a script, starting by acquiring
   the equipment this brief asks about.
4. **Close the cartridge dimensions (`cartridge-dimensions`) regardless.** 0/229
   dimensional columns block *any* interior ballistics, independent of powder data.
5. **Treat the recipe table as the real gap.** It is empty. Populating it with
   licensed, cited observations is the only route to a defensible feature.

---

## 8. What could not be established

Recorded per `.clinerules` §5 rule 1, as unknowns rather than gaps quietly filled:

- No primary Hornady page defining the Load'n'Lube burn-velocity index → not sourced.
- MDPI `10.3390/en15072680` returned HTTP 403; unread, and **no claim made** about it.
- PMC7411880 full text not retrieved; abstract cited, **no numbers quoted from it**.
- Alliant, Ramshot, IMR manufacturer pages not individually scraped. Absence of
  evidence, not evidence of absence — recorded as a coverage gap.
- Whether HTM sells quantitative powder data — not checked.
- Any pressure-exponent figure for a commercial reloading powder: **none found.**

## 9. Sources

`01-burning-rate-sources.md` (sources and licences),
`03-load-synthesis-literature.md` (equations and inputs),
`04-equivalence-rules.md` (manufacturer rules, verbatim).