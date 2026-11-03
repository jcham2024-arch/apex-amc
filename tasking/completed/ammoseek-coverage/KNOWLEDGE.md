# KNOWLEDGE — durable findings

Task T7. Written for other agents. Anything here would otherwise have to be
rediscovered, and two of these facts contradict a brief currently in the queue.

---

## 1. The brief's coverage baseline is WRONG. Do not plan from it.

`tasking/pending/ammoseek-coverage/BRIEF.md` §3 states:

> "We have no 9mm Luger, no .22LR, no .308, no .223 Remington."

**All four are held.** Measured against `data/seeds/cartridge_specs/*.csv`:

| AmmoSeek name | Our name | Share |
|---|---|---|
| `9mm Luger` | `9 Luger` | 19.75% |
| `.22LR` | `.22 LR` | 7.35% |
| `.308 Winchester` | `.308 Win` | 4.96% |
| `.223 Remington` | `.223` | 4.24% |

**36.30% of their published search share is already covered.** Only **5.56x45mm
NATO (9.62%)** and **12 Gauge (5.79%)** are genuinely absent.

**Only naive string matching produces the brief's answer.** Always alias-normalise
before claiming a caliber gap. This took a ten-line script.

## 2. The real gap is depth, not breadth

All six dimensional columns in `cartridge_specs` are **0 / 229 populated**:

`bullet_dia_in`, `case_length_max_in`, `max_col_in`, `rim_dia_in`, `head_dia_in`,
`capacity_gr_h2o`.

We hold 229 names and **zero dimensions**. Adding names is the visible, low-value
work; populating dimensions for cartridges we already hold is the larger gain.

## 3. 9mm Luger and `.22 LR` are filed under `rifle`

`9 Luger` sits in `data/seeds/cartridge_specs/rifle.csv` with `family=rifle`. So
does `.22 LR`. **A real defect, not yet fixed** — it was outside this task's
write-set. Family drives presentation and filtering, so the most-searched
cartridge on the index is currently in the wrong bucket.

## 4. Shotgun is empty, and it is the best-sourced cluster

We hold **0 of 8 gauges**. The only row filed as `shotgun` is `4 Bore Rifle`, a
placeholder created to attach a pressure figure.

But SAAMI's free drawings page names **12 Gauge 1¾"** and **28 Gauge 3″**
explicitly, and CIP TDCC covers shotgun dimensions. So the emptiest category is
also among the cheapest to fill.

## 5. SAAMI free drawings cover only NEW designs — not the common calibres

Easy to assume wrongly. The free "New & Revised" page lists only:

> 5.56 Commercial · 5.7 X 28 FN · 7mm Backcountry · 8.6 Blackout · 21 Sharp ·
> 25 Creedmoor · 25 Weatherby Rebated Precision Magnum · 30 Super Carry ·
> 338 Advanced Rifle Cartridge · 12 Gauge 1¾" · 28 Gauge 3″

Common calibres live in the **paid** Z299 Standards. `adopt=yes` on
`saami-drawings` in `opensource_resources.csv` is correct but does not mean "all
SAAMI data is free".

## 6. CIP vs STANAG on 5.56 — do not mix them

CIP TDCC's 5.56 is the **civilian** chamber. The **military** chamber is **STANAG
4090**. Substituting one for the other is a quiet cross-standard error. This
belongs to the family of mistakes `docs/BRASS-AND-PRESSURE-CLASS.md` documents.

## 7. No licence wall on cartridge dimensions

Every genuine gap in this task's table has a free, named, primary source. Only
shotgun **max pressure** is paywalled (SAAMI Z299.5). **The barrier to this work is
transcription effort, not permission.** Scope the next task accordingly.

---

## Reusable lesson

**A coverage comparison run on raw strings will manufacture gaps out of
abbreviations.** Our own naming is abbreviated (`9 Luger`, `.22 LR`, `.223`), any
competitor's is not. The normaliser must be tested in **both** directions:

- does it find cartridges naive matching called absent (under-match), and
- does it keep genuinely different cartridges apart (over-merge).

A normaliser that only tests the first direction will quietly merge distinct
cartridges, and that is the failure that hides real differences.