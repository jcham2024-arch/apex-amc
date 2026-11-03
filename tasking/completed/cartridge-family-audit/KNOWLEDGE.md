# KNOWLEDGE — durable findings

Task `cartridge-family-audit`. Written for the next agent. Each item here cost
real work to establish; every claim names a file that proves it.

---

## 1. The source named 2 defects. There are 4, and only 1 is safe to fix

`ammoseek-coverage/KNOWLEDGE.md` §3 named `9 Luger` and `.22 LR`. Auditing all 229
rows found four rows where name and family disagree — but they are **not the same
kind of defect**, and three of the four must not be "fixed".

| Row | Real problem | Action |
|---|---|---|
| `9-luger` | genuinely misfiled | **change family to pistol** |
| `22-lr` | not a defect — genuinely ambiguous | leave alone |
| `4-bore-rifle` | **reverse** defect: NAME wrong, family right | out of scope |
| `327-fed` | probably misfiled, medium confidence | escalate, verify first |

**The lesson: "family disagrees with name" is not one defect class.** Two of the four
are traps for an agent that trusts the brief's framing and edits what it finds.

## 2. `.22 LR` is genuinely ambiguous, and the source is wrong about it

`ammoseek-coverage/KNOWLEDGE.md` §3 lists `.22 LR` beside `9 Luger` as "a real
defect". They are not the same case. **The .22 Long Rifle is chambered in both rifles
and pistols, and both uses are correct.** There is no correct single answer.

The repository already holds both flavours as separate rows: `.22RF Short` and
`.22RF Long & LR` (family=rifle) alongside `.22 Short`, `.22 Long`, `.22 LR`
(family=rifle). The naming does not resolve it either.

Resolving it needs a **platform policy** — one row per cartridge, or one row per
cartridge-platform — which is a decision, not a correction.

## 3. `4 Bore Rifle` is a reverse defect: the name is wrong, not the family

`shotgun.csv` holds exactly one row: `4-bore-rifle,4 Bore Rifle,4 Bore Rifle,shotgun`.

`family=shotgun` is **correct** — 4 Bore is a shotgun bore. The defect is that the
**name** says "Rifle". This is the only row filed as `shotgun`, and
`ammoseek-coverage/KNOWLEDGE.md` §4 calls it "a placeholder created to attach a
pressure figure".

`task.json` prohibits renaming, so I reported it rather than fixing it. **An agent
that greps for mismatches will see this row and be tempted to change family to
`rifle` — that would make it wrong.**

## 4. `9 Luger` is a duplicate, not just a misfile

The built DB has **318** cartridges; the seeds have **229**. The extras come from
`data/schema/003_seed_reference_data.sql`. Two of its rows are the same cartridge as
seed rows:

```
## 5. The shipped website does not read `family` — the "users see it" claim is latent

`ammoseek-coverage/KNOWLEDGE.md` §3 says "Family drives presentation and filtering,
so the most-searched cartridge on the index is in the wrong bucket."

**Measured: it does not yet.** `apps/website/src/main.js` (17,066 bytes) contains no
occurrence of `cartridge`, `family`, or `pistol`. The only `family` string anywhere in
`apps/website/src/` is a Google Fonts URL — a CSS parameter, not the column. Cartridge
costs come from the hardcoded `apps/website/src/data/calibers.js`, which already
prices `9mm` as a handgun cartridge.

The defect is real but **latent for the UI**. It will bite whoever builds a platform
filter, and it is correctable before they do.

**Reusable: a claim about what users see must be measured against the shipped app,
not inferred from a column name.**

## 6. `family` cannot be wrong-detected by any existing gate

`001_ammo_catalog.sql` constrains `family IN ('rifle','pistol','shotgun')`. That
validates *validity*, not *correctness* — `rifle` is always a legal value for a pistol
cartridge. `check-seeds.mjs` refuses a row with an absent or invalid family, and its
own comment names the hazard:

> this is where a wrong guess would send a pistol cartridge down a rifle page

But it has no signal to detect a *wrong* value. **Nothing in the toolchain can catch
this class of defect.** That is the argument for the follow-up proposal.

## 7. A CSV field edit cannot be safely hand-written as a context-free diff

My first `03-proposed-fix.diff` used a context-free hunk, `@@ -149,1 +149,1 @@`. The
hunk body was **byte-identical** to the file — 392 bytes both sides, zero suspect
characters (no CR, BOM, NBSP or smart quote) — and `git apply --check` still
rejected it:

```
error: data/seeds/cartridge_specs/rifle.csv: patch does not apply
```

**Three lines of context fixes it.** A context-free hunk depends on exact byte match
at a computed offset, and `.gitattributes` (`* text=auto eol=lf`) plus this repo's
history of encoding damage (`cartridge_specs.csv` was once UTF-16LE) make that
assumption unsafe.

**Generate diffs from surrounding lines, and always `git apply --check` them.** My
first diff looked correct and was unusable.

## 8. Enumerating by heuristic failed; enumerating by reading worked

My first audit matched name fragments (`colt`, `browning`, `automatic`, `gauge`) to
find handgun cartridges in `rifle.csv`. **It found nothing** — the actual defects are
bare calibre names (`9 Luger`, `.22 LR`). The signal list could not see the defect
class it was written for.

Printing all 212 `rifle.csv` names and reading them found everything, including
`.327 Fed`, which no heuristic flagged. **For a small finite set, print and read.**
id=1   slug=9mm-luger  name="9mm Luger"  family=pistol  psi=35000
id=260 slug=9-luger    name="9 Luger"    family=rifle   psi=35000
```

Identical pressure, opposite family. **Fixing the family alone leaves two rows for
one cartridge**, doubling any list or count of 9mm Luger.

The same pattern affects the `.22` cluster: `.22RF Short` / `.22RF Long & LR` /
`.22WRF` / `.22WRM` (003) coexist with `.22 Short` / `.22 Long` / `.22 LR` /
`.22 WR` / `.22 WMRF` (seeds).

**De-duplication is a separate task.** It changes row identity, which can break
`cartridge_pressure_references` joins and the `CARTRIDGE_ALIASES` map in
`scripts/gates/check-seeds.mjs`.