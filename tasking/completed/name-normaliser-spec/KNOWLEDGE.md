# KNOWLEDGE — durable findings

Task `name-normaliser-spec`. Every claim here was measured against
`data/generated/apex.sqlite` (318 rows). Two claims I started to write were **false**
and are corrected below, with the measurement that disproved them.

---

## 1. The existing alias map resolves BEFORE trying an exact match — and that is wrong

`scripts/gates/check-seeds.mjs` does:

```js
const alias = CARTRIDGE_ALIASES[key];
if (alias) { /* use the alias target */ }
```

**The alias is consulted before any exact name lookup. Measured: 4 of the 12 aliases
bypass a row whose name matches the query exactly.**

| Query | Alias sends it to | Exact row that exists |
|---|---|---|
| `9 luger` | `9mm-luger` (family=pistol) | `9-luger` (family=rifle) |
| `.308 win` | `308-winchester` | `308-win` |
| `.223` | `223-remington` | `223` |
| `.30-06 springfield` | `30-06` | `30-06-springfield` |

**Precedence rule P0:** exact `name` → exact `short_name` → exact `slug` → **only then**
the alias map. This fixes all four with no new aliases.

## 2. One of those four is a LIVE data defect, not a latent risk

| Query | Exact row psi | Alias target psi | |
|---|---|---|---|
| `9 luger` | 35000 | 35000 | same |
| `.308 win` | 62000 | 62000 | same |
| `.223` | 55000 | 55000 | same |
| `.30-06 springfield` | **NULL** | **60000** | **DIFFERS** |

`30-06-springfield` exists with `saami_max_psi = NULL`. The alias sends the query to
`30-06`, which has 60,000 psi. **A pressure lookup for that cartridge silently returns
another row's value**, and since both are `family=rifle`, no filter separates them.

The other three are benign *today* only because the duplicate rows happen to carry the
same figure. Correct either row and they break. **That asymmetry is the argument for
fixing precedence rather than patching aliases one at a time.**

## 3. `.308 Winchester` has the WRONG `short_name` — a data defect I nearly missed

I claimed folding case/whitespace/trailing-period produced zero collisions. **That was
true for `name` and false for `short_name`:**

```
".308 win" -> 308-winchester, 308-win-mag
```

`308-winchester` has `short_name = ".308 Win Mag"`, which belongs to a different
cartridge. **A wrong `short_name` makes the safety argument for those rules false**,
and it is invisible until you fold the second field.

**Reusable: test a normalisation claim against EVERY field it might be applied to.
Testing one field proves it for that field only.**

## 4. Case/whitespace folding IS safe on `name` — 0 collisions in 318 rows

Worth stating positively, because the whole specification rests on having *some* safe
rules. Collapse whitespace, strip a trailing `.`, case-fold, trim: **zero** collisions
across all 318 `name` values.

## 5. Prefix matching is the rule most likely to be written, and it is unsound

The obvious fix for under-match `9mm` is a prefix rule. Measured: `name` starting
`9mm` matches exactly **1** row (`9mm-luger`), and only 2 rows contain a 9mm
designation at all. **So a prefix rule would appear to work perfectly.**

It is still wrong, and this is the dangerous kind of wrong: it passes every test
available today and breaks the moment a genuine `9mm`-prefixed different cartridge is
added. `OM-05` in the corpus pins this.

**Reusable: a rule that passes because the data is sparse is not verified, it is
untested.** Corpus rows `OM-16`…`OM-19` are recorded for cartridges we do NOT hold
precisely so a future agent cannot add them without testing.

## 6. The source KNOWLEDGE.md's factual baseline is stale — second time

`ammoseek-coverage/KNOWLEDGE.md` §4 says:

> "We hold **0 of 8 gauges**. The only row filed as `shotgun` is `4 Bore Rifle`"

**Measured now: `family=shotgun` holds 9 rows** — `12-gauge`, `10-gauge`, `16-gauge`,
`20-gauge`, `28-gauge`, `12-gauge-3-1-2-mag`, `410-bore-2-1-2`, `410-bore-3`,
`4-bore-rifle`.

Another agent filled the gauges. The claim was true when written and is now wrong, and
`ammoseek-coverage` is cited as ground truth by tasks in the queue. **Any agent
planning from it must re-measure.** This is the second stale baseline I have hit
(`cartridge-family-audit` found the 229-vs-318 row gap).

## 7. `4 Bore Rifle` is the last placeholder among populated neighbours

Now that 8 other shotgun rows exist, `4-bore-rifle` is visibly the odd one out — and
`cartridge-family-audit` established its *name* is wrong while its family is right.
**Do not alias `4 Bore` to it.** Aliasing to a known-bad name propagates the error.
Fix the name, then add the alias.

## 8. My own test corpus was defective on first write — and the check caught it

First version of `02-test-corpus.csv`: I wrote `expected_slug = "distinct"` on the
over-merge rows. The parser reported **16 ragged rows** — a key count that looks right
while the values are shifted, the exact trap in `AGENTS.md`.

Then a second round of errors: I guessed slugs (`762x39`) instead of reading them
(real slug is `7-62x39`), and wrote an over-merge pair (`.223 Rem`) for a cartridge we
do not hold.

**Both were caught by a checker that parsed the corpus and resolved every slug against
the database.** A corpus that names cartridges we do not hold cannot fail, so it
tests nothing.