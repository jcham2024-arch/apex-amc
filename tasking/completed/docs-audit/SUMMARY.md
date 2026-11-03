# SUMMARY — docs-audit (T9)

One-page digest of [`REPORT.md`](REPORT.md). Audit only — **no file in `docs/` was
modified.**

**Scope:** 154 Markdown files. **Audited:** 3 Oct 2026. **Result:** 15 findings.

---

## The finding that matters most

> **The trademark risk is documented nowhere in `docs/`.**
>
> The site is named after a **LIVE** registered trademark in its own product category —
> APEX AMMUNITION, reg. **5391055**, IC 013, held by an operating ammunition business
> with a live storefront and 18+ age gate. `grep` across `docs/` returns **zero hits**.
> It exists only in `tasking/`.
>
> `docs/DATA-TODO.md` carefully records the other open legal blocker (the empty
> `recipes` table). **The brand risk is larger and invisible.** That asymmetry is the
> defect: the repo tracks its content risk carefully and its legal risk not at all.

## Count drift — 9 of 11 live quotes are wrong

Measured 3 Oct 2026, each with the command that produced the truth:

| Quantity | Docs say | Truth |
|---|---|---|
| `verify` stages | 9, 14, 15 | **19** |
| Tests | 215 | **235** (215 core + 7 web + 13 affiliate) |
| Data rows | 989 | **1031** |
| Seed CSVs | 23 | **26** |
| Manufacturers | 50 | **58** |
| Coverage | not started=32, n/a=8 | **33 / 15** |

`CHANGELOG.md` counts are **deliberately excluded** — they are historical records and
"correcting" them would be the error.

## The trap worth remembering

> **`.clinerules` already solved this and no other document followed.**
>
> It was amended to say *"never quote a stage or test count… a stale count in a rules
> file is worse than no count because agents trust it."* `.clinerules` obeys it — it
> **removed** the numbers instead of updating them, which is exactly why its figures are
> the only correct ones. **The fix is known and proven; it has not spread.**

## Recommended deletion

**`docs/PARALLEL-WORK-PLAN.md` — delete, do not correct.** It describes a protocol
replaced three commits ago and breaks its own "do not quote a stage count" rule three
times. Correcting its numbers would make a dead document look *maintained*.

## Corrected belief (the mandatory negative test)

I carried in "215 tests, not 235" from my previous task, and this brief said 235 was
correct. **Measuring:** `npm run test:all` → 215 + 7 + 13 = **235**. The brief was right
on the total. But `docs/TODO.md:198` is wrong for a subtler reason than arithmetic — it
says "`npm test` reports 215", and `npm test` genuinely does, because it runs only the
core suite. **The defect there is scope.** A reader who follows the doc's own advice
reproduces "215" and concludes the doc is right.

## Deliverables

| File | Contents |
|---|---|
| `01-findings.md` | 15 findings, `file:line` + severity, grouped |
| `02-stale-counts.md` | Every stale count + the command measuring the truth |
| `03-doc-index.md` | Reading order, authority tiers, 7 documented contradictions |
| `REPORT.md` | Five-part §8 report, DoD checklist, limits |

**No `corrected/` staged.** `task.json` does not require it, and the brief warns a
"corrected" copy identical to the original is noise in a review. Every fix is a one-line
number change or a deletion decision — the reviewer's to apply.

## Verification

`npm run verify` → **exit 0**, before and after. `git status` shows **no `docs/`
modification**. All files UTF-8, no BOM, LF.

## Not verified, stated rather than guessed

`1,666 rows / 24 tables` (`AGENTS.md:58`, `README.md:54,68`) — **left uncorrected.**
Verifying needs `npm run db:local`, which writes outside my write-set. Correcting an
unmeasured number is the exact failure this repo exists to prevent.

---

*Model: default model, fresh instance. No project file was created, edited or deleted.*