# SUMMARY — code-audit

**Task:** Source code quality and dead-code audit. **Status:** COMPLETE.
**Agent:** scout-code. **Date:** 10 Feb 2026.
**Write-set:** `tasking/completed/code-audit/` only. **Nothing refactored.**

---

## The answer in one paragraph

**The important finding is not dead code — it is the inverse.** `tasking:check`, the
gate whose entire purpose is to make "finished" a checkable claim, shipped with a
missing brace that reduced it to checking **one task per run**; it reported `0
declared output(s) verified` while four completed tasks sat in `completed/`. A stray
`}` at end-of-file balanced the missing one, so the file was net brace-balanced and
**every syntax gate passed**. It was found by an agent doing its own work, not by a
gate. Alongside it: one **real latent bug** (a CSV parser reimplemented on a
*write* path, against the repo's own "one loader, not two" rule), systematic
under-use of an existing `scripts/shared/` module (23 sites), and **zero** stale
numeric comments — the comment discipline about data is genuinely excellent.

---

## Deliverables

| File | Substance |
|---|---|
| `REPORT.md` | Five-part summary per `.clinerules` §8 |
| `KNOWLEDGE.md` | Durable findings and traps for future agents |
| `01-dead-code.md` | Symbol-level analysis; the gate defect in full |
| `02-dupes.md` | Duplication against "one loader, not two" |
| `03-comments.md` | Ten numeric claims verified; two false comments |
| `04-config-review.md` | ESLint, tsconfigs, 49-script graph, 14 gates executed |

---

## Findings, ranked

| # | Finding | Severity | Open? |
|---|---|---|---|
| 1 | `tasking:check` verified one task; braces cancelled out | **Critical** | Fixed mid-audit by another agent |
| 2 | `import-bullets.mjs` re-implements RFC 4180 CSV on a write path | **High (latent)** | **Yes** |
| 3 | 9 scripts root at `process.cwd()`, incl. `check-docs.mjs` | Medium | Yes |
| 4 | `ledger.json` records `stages: 14`; real is 20 | Medium | Yes |
| 5 | 14 scripts re-derive `root`; 9 re-implement sha256 | Low | Yes |
| 6 | `eslint.config.js` ignores a `temp/` that does not exist | Low/Med | Yes |
| 7 | 6 unused exports in `shared/data.mjs` | Trivial | Yes |

---

## Three things that will change how another agent works

1. **`scripts/shared/` is correct and 23 scripts ignore it.** Import `root` and
   `readCsv` from it rather than re-deriving. The `process.cwd()` group is the
   urgent one: `check-docs.mjs` walks the wrong tree — and can report a false green
   — when run from anywhere but the repo root.

2. **A zero reference count is a candidate, never a verdict.** Two candidates in
   this audit looked dead and were not (`security-rules.mjs` helpers are used
   internally). `AGENTS.md` already says a file referenced only by a gate is alive.

3. **On Windows, run npm as `cmd.exe /c npm run <script>`.** `execFileSync('npm')`
   returned `ERR` on all 15 gates and `spawnSync('npm.cmd')` returned `EINVAL` —
   either would have produced a fabricated "every gate is broken" finding. Three
   attempts before a correct measurement.

---

## Constraints honoured

- **Nothing was refactored.** `scripts/`, `packages/`, `apps/`, `data/` and
  `package.json` are untouched; my footprint is only this folder plus the claim
  move.
- **`packages/ballistics-core/` was read, never proposed for change.** It is 860 +
  588 lines and safety-critical; I make **no claim** about it, per the brief.
- **Negative tests pasted.** Two things that looked dead but were not, with the
  search proving them alive; both false comments quoted verbatim and corrected.
- **One self-correction recorded:** my automated check wrongly flagged
  `bullet-sources.mjs:27`'s "111 rows" as false. It was my error — the comment
  describes the *source page* row count (109 + 2 skipped), not seed rows.

---

## Concurrency note for the reviewer

**Another agent was editing `scripts/gates/check-tasking.mjs`, `package.json` and
`scripts/gates/` while this audit ran.** None of it is mine. Findings 1 and the
`ci:check` failure are time-sensitive and should be re-measured before acting.
Notably, the newly-fixed `tasking:check` immediately caught **two tasks existing in
two folders at once** — a *copy* where the protocol requires a *move* — which
validates the fix: a gate that could not see the queue could not see that either.

---

## Recommended next actions

1. **Fix the CSV re-implementation** in `import-bullets.mjs` — use `readCsv` from
   `scripts/shared/data.mjs`, which it already imports from.
2. **Move the 9 `process.cwd()` roots** to the shared `root` import. `check-docs.mjs`
   is the one that matters.
3. **Correct or delete `stages` in the ledger.** `.clinerules` sets the precedent:
   delete the stored count rather than replacing it.
4. **Record the brace defect in `tasking/review/HISTORY.md`** if not already done —
   *a gate in `verify` can be green and verify nothing* is the most valuable trap
   this audit produced.
5. **Adopt the negative-test-first habit for gates.** The comments about data are
   excellent; the comment that lied was the one describing a gate's guarantee.