# 03 — Comments

**Task:** code-audit. **Audit only — nothing was changed.**

The repo's rule is that comments explain **why** and carry trap history
(`.clinerules` §5 rule 7). That is a high bar, and this audit's main finding is
that **the codebase largely meets it** — which is worth stating, because the brief
asked for problems and the honest answer includes a large amount of sound work.

**The dangerous class, per the brief, is a comment stating something now false.**
One was found. Many candidate "stale" comments turned out to be correct.

---

## FINDING 1 — a rule that contradicts itself about where scratch goes (false as written)

`.clinerules` §5 rule 10 states, in a numbered rules list that agents are told is
binding:

> 10. **Scratch goes in `tmp/`**, not the repo root. `npm run lint` runs `eslint .`
>     and a stray diagnostic file fails the build for everyone.

`eslint.config.js` still exempts a **second** scratch directory:

```js
// eslint.config.js:38-41
      // Second scratch directory created by later data-agent work.
      'tmp/**',
      'temp/**',
      '**/_tmp-*.mjs',
      '**/_tmp*/**',
```

**Why this is false rather than merely untidy.** Two things are wrong with it.

**One — it contradicts the binding rule.** The rule says `tmp/`. The config also
silently tolerates `temp/`. An agent following rule 10 correctly has no way to know
`temp/` is also permitted, so the tolerance buys nothing and the rule reads as
incomplete.

**Two — the justification no longer applies to `temp/`.** The comment says `temp/` is
where "later data-agent work" went. Measured now:

```
$ Test-Path temp
False
$ (Get-ChildItem scripts -Recurse -Include _*.mjs,fix_*,remove_*,replace_* -File).Count
0
```

**`temp/` does not exist, and none of the `scripts/_*`, `fix_*`, `remove_*` or
`replace_*` scratch files exist.** Those exclusions were real once — the comment
records that they produced 40 lint errors that "made the whole build look broken
while every real source file was clean," and that history should be kept.

**Correct statement.** The exclusions for `tmp/**`, `_tmp-*` and `scripts/_*.mjs`
remain justified. The `temp/**` entry has no remaining referent, and its one-line
justification describes a directory that no longer exists. Either the directory
reappears (in which case the rule should say so) or the entry should go.

**Note the trap this repo already records about exactly this kind of thing:**

> **Trusting row-count arithmetic after a copy** — Re-read from disk. The count you
> expect is the count you assert, until proven otherwise.

and

> **A doc path that no gate could see** — a structural check cannot catch a wrong
> path.

`temp/**` is an *unreferenced* path: no gate can notice that an ignored glob points
at nothing. It is the config-file version of the same failure.

---

## FINDING 2 — a stale count in `.cline/tasks/ledger.json` (false, and load-bearing)

The ledger records the project baseline:

```json
"baseline": {
  "command": "npm run verify",
  "exit_code": 0,
  "tests": 235,
  "stages": 14,
  "note": "Re-measure before trusting this. If it differs, report before starting."
}
```

Measured:

```
actual stage count in verify: 19
```

**`stages: 14` is wrong; the real figure is 19.** Four stages were added since it
was written — `tasking:check`, `oracle:check`, `audit:check`, `regulations:check` —
and none of them appears in that list.

**Why this one is worse than a stale number in a comment.** The ledger is the
authoritative coordination file. `.cline/tasks/ledger.json` is cited by name in
`tasking/README.md` and `tasking/pending/README.md` as *"the authoritative task
ledger and write-sets."* An agent sizing its expectation from `stages: 14` would
miscount the gate surface by a quarter — and `tasking:check` is one of the five it
would miss, which is the gate that was **supposed** to catch unwritten work.

**The correct fix is already the house style.** `.clinerules` had exactly this
problem and resolved it by deleting the number rather than replacing it:

```json
"baseline": {
  "exit_code": 0,
  "tests": 235,
  "stages": 14,
```

was changed, per `.clinerules` §31:

> **Baseline: exit 0, all stages green.** Never quote a stage or test count from
> memory.

and `tasking/review/HISTORY.md` records why:

> **`.clinerules` §1 stated a stale stage count.** Removed the number rather than
> replacing it: a number in a rules file is trusted, and a wrong one is worse than
> none. The count must be measured from `package.json`.

**The ledger did not get the same treatment.** `tests: 235` is currently correct
(verified below), but the same logic applies: a stage count in a coordination file
that agents are told to trust is exactly the kind of number that must be measured,
not stored.

---

## FINDING 3 — numeric comments audited: **all of them hold**

Ten numeric claims were extracted from code comments and checked against the data.
Every one is accurate:

| Site | Claim | Verdict |
|---|---|---|
| `build-data.mjs:175` | "169 rows" | HOLDS — powders=169 |
| `build-database.mjs:7` | "bullets 120 and powders 169" | HOLDS — 120 / 169 |
| `import-bullets.mjs:139` | "109 rows … and 2 more we could not use" | HOLDS — berger=109 |
| `bullet-sources.mjs:27` | "13 explicitly named columns, 111 rows" | HOLDS — see note |
| `split-cartridge-specs.mjs:5` | "229 rows … 212 of them rifle" | HOLDS — 229 / 212 |
| `split-cartridge-specs.mjs:17` | "EMPTY ON ALL 229 ROWS" | HOLDS |
| `check-seeds.mjs:755` | "empty on all 229 rows" | HOLDS — filled=0 |
| `data.mjs:352` | "orphaning 98 of 169 rows" | HOLDS — saami_max_psi=98 |
| `AGENTS.md` | "check-seeds.mjs … 1,644 lines" | HOLDS — 1644 lines |
| `AGENTS.md` | "235 tests" / "215 passing" | HOLDS — 215 + 7 + 13 = 235 |

**Note on `bullet-sources.mjs:27`.** My automated check first flagged this as
**false** — it compares "111 rows" against Hornady's 7 seed rows. **That was my
error, not the comment's.** Line 27 says *"See BERGER below"*, and
`import-bullets.mjs:139` independently records *"109 rows"* **and** *"2 more we could
not use"*. 109 + 2 = 111: the comment describes the **source page's** row count,
which is exactly what a parser comment should describe. Corrected statement:

> Correct as written. The 111 rows are the Berger catalogue page's rows; 109 became
> seed rows and 2 were skipped as unusable. The count is not the seed count and is
> not meant to be.

This is the repo's own principle applied to my own work — verify the claim, and if a
"finding" is really a misreading, say so rather than reporting it.

---

## FINDING 4 — comments that restate the code: **none material**

Searched for comments adjacent to the code they describe. The samples that looked
like restatement are all carrying a *why*:

```js
// scripts/shared/data.mjs:116-118
// RFC-4180. The seed data genuinely needs it: cartridge names contain commas
// and escaped quotes (".500 NE 3""", '12 gauge 3 1/2" mag'), so split(',')
// is not merely inelegant, it is wrong.
```

```js
// scripts/gates/check-docs.mjs:86-88
// Only the BARE directory name goes here. SKIP_DIRS is compared against each
// entry's own name as the walk recurses, so a path like 'tasking/completed'
// can never match - `readdirSync` yields 'completed'. That was the first
// attempt and it silently did nothing.
```

Both prevent a specific, already-made mistake. **No comment in the audited set was
found that merely restates its line.**

---

## FINDING 5 — the gate's own header claims a guarantee it does not deliver

This is the serious one, and it belongs here because it is a comment stating
something false.

`scripts/gates/check-tasking.mjs` opens by describing what the gate is for:

> "It does not judge whether the CONTENT of an output is correct… **This gate answers
> 'did the work get written down', not 'is the work right'.**"

and:

> "4. Every task in `completed/` has EVERY declared output. **This is the one that
>    matters**: it makes 'done' a checkable claim rather than a self-report."

**Measured, that is not what it does:**

```
  1 task(s) in pending/, 1 ready
  4 task(s) in completed/, 0 declared output(s) verified
```

It verified **zero** declared outputs, for four completed tasks. `completed/` held
four tasks with all their outputs present; the gate reported none of them.

The comment is not wrong about intent — it is wrong about **behaviour**, and the
gap is a missing brace plus a stray one at EOF that cancel:

```
open=58 close=58 delta=0
```

**Correct statement:** the gate is *intended* to make "done" checkable. As shipped
it checks one task per run and reports zero verified outputs, so the guarantee its
header describes does not currently exist. Full diagnosis in `01-dead-code.md`.

The general lesson, and it is the repo's own: **a comment describing a gate's
guarantee is not evidence the guarantee exists.** Only a measurement is. That is the
same reason `AGENTS.md` records four separate instances of "a check that passes
while producing wrong output."

---

## Summary

| Finding | Class | Severity |
|---|---|---|
| 1. `eslint.config.js` exempts a `temp/` that does not exist; contradicts `.clinerules` rule 10 | **False / self-contradicting** | Low–Medium |
| 2. `ledger.json` records `stages: 14`; real is 19 | **False** | **Medium–High** |
| 3. Ten numeric comments | **All hold** | — |
| 4. Restating comments | **None material** | — |
| 5. `check-tasking.mjs` header claims a guarantee the code does not deliver | **False** | **Critical** |

**The uncomfortable conclusion:** the comments about *data* are excellent and all
accurate. The comments about *gates* are the ones that lie — because a gate's
comment records what it was written to do, and nothing forces it to keep doing it.
`HISTORY.md` already warns that "the gate had passed, because every gate read the
file rather than the deployed response." The same shape, one layer up.