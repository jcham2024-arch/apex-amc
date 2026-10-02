# SUMMARY — shot-group-taxonomy

**Status:** complete. **Outputs:** 5 of 5 declared. **Agent:** scout-research sub-agent.
**Start here:** [`KNOWLEDGE.md`](KNOWLEDGE.md) (one page, for a feature owner) ·
[`REPORT.md`](REPORT.md) (full evidence)

---

## The headline

> **The feature as briefed cannot be built honestly — and the reason is not caution. A named
> instructor says the artifact behind the idea is "the most misused tool in the training
> industry," and no source anywhere supplies a diagnostic accuracy, a false-positive rate, or
> a single confidence percentage.**

The taxonomy was compiled as asked. But every pattern in the canonical chart maps to **two or
three unrelated faults**, **not one pattern is unambiguous**, and Patrick Henry (Aegis Academy
staff) argues the whole exercise *"is like looking at an image of golf ball impacts and trying
to diagnose a swing issue."*

`04-rebuttals-and-exceptions.md` is not a caveat appended to the research. **It is the result.**

## What was produced

| File | Contents |
|---|---|
| `01-fault-taxonomy.md` | 10 chart patterns + 8 named faults, each with confidence; the disagreement; evidence quality |
| `02-instructor-sources.md` | 4 tiers — named instructors, industry, reposts, peer-reviewed — plus failed retrievals |
| `03-mapping-to-measurements.csv` | 17 rows × 7 cols; every quantity traceable to `dispersion.ts` |
| `04-rebuttals-and-exceptions.md` | Alternative explanations, instructor disagreement quoted, what a photo cannot show |
| `KNOWLEDGE.md` | What a future feature owner needs to know, one page |

## Three findings that decide the feature

**1. No number exists.** Across every source: diagnostic accuracy EMPTY, false-positive rate
EMPTY, minimum shot count EMPTY, confidence percentage EMPTY. **16 of 17 CSV rows read `not
stated`.** The 17th is the only real statistic in the task — and it is about *qualification
score*, not POI direction.

**2. The one statistic is about dominance, not pattern position.** Jones, Classé, Hester &
Harris (1996), 308 military recruits: uncrossed dominance qualified at **86.1% vs 56.5%**
(p = .000). Large and real — but it gives **no POI offset direction**, and it is rifle, not
handgun. The canonical chart is explicitly conditional on handedness and eye dominance and
supplies no way to detect either.

**3. The quantitative trap in our own code.** `centreOfImpact` returns the **mean of the shots
taken**, so a "high group" describes those shots, not a fault. Any rule "`poi.y` > t ⇒ vertical
fault" must threshold against the group's **own standard error** or it fires on sampling
noise. `dispersion.ts` does not compute that, and no source states a threshold. **This is the
gap most likely to produce confident nonsense.**

## What is supportable from a photo

**Yes:** group size, `sigma`, `cep50`, `extremeSpread`, which axis it is elongated on, and
displacement from the aim point (stated with its ambiguity attached).

**The only defensible fault: cant** — the target's ellipse shows it.

**Never:** any named fault from POI direction. Sight alignment is not in a photograph (though
the chart lists it for four patterns). Timing faults have no time axis. Habit cannot be
separated from a one-off in a single string.

## Two corrections I made to my own work

**The traceability check failed all 12 valid rows.** The CSV writes `poi_vertical_offset`;
`dispersion.ts` declares `poi.y`. Comparing raw strings rejected correct data. **The check was
wrong, not the CSV.**

**A negative case passed for the wrong reason.** My "dropped column" case actually deleted a
data row, and only exited 1 because a row-count rule noticed — an unrelated cause. Split into
a true column-drop and a true row-drop, and added an expected-signature rule, because deleting
one mapping row is otherwise undetectable: the remaining table is perfectly well-formed.

## Two things needing a decision

- **`npm run verify` fails on `tasking:check` only** — the gate reads manifests from
  `pending/`, so every completed task reports having none. All 19 other stages pass. Not mine
  to fix; reported in the exterior-ballistics NOTES.
- **The brief's vocabulary does not match `dispersion.ts`.** It lists "group width, group
  height, aspect ratio" as existing; **none appear in the file** — all are derivable from
  `sigma` but nothing computes them. The Definition of Done clause is unsatisfiable as
  literally written; recorded rather than worked around.

## Verification

```
CSV CHECK PASSED            CHECK_EXIT=0   17 rows, 0 ragged, 0 untraceable,
                                           0 bare percentages, 0 diagnoses asserted,
                                           11/11 expected mappings present
NEGATIVE TEST HOLDS         NEG_EXIT=0     7 cases, control passes,
                                           every broken variant rejected
```

All 5 deliverables: LF only, no BOM, no lone CR. No main-tree file touched.