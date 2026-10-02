# REPORT — Cartridges whose family disagrees with their name

**Task:** `cartridge-family-audit` · **Agent:** `4880a` · **Date:** 2026-10-02
**Derived from:** `tasking/completed/ammoseek-coverage/KNOWLEDGE.md`

---

## 1. What I did

Audited **all 229 cartridges** across `data/seeds/cartridge_specs/{rifle,pistol,
shotgun}.csv` for rows whose `family` disagrees with the cartridge their name
denotes — not only the two cases the source named.

Method, in the order it happened:

1. A heuristic pass matching name fragments (`colt`, `browning`, `automatic`,
   `gauge`). **It found nothing** — the real defects are bare calibre names.
2. Printed all 212 `rifle.csv` names with slug, pressure and notes, and **read them**.
   This found everything, including one case no heuristic flagged.
3. Verified each candidate against the seed row and against the built database
   (`data/generated/apex.sqlite`).
4. Searched the shipped app for consumers of `family` to establish real impact.

Step 1 failing and step 2 succeeding is itself a finding — see `KNOWLEDGE.md` §8.

## 2. What I found

Four rows where family and name disagree. **They are not the same kind of problem.**

| Row | File | Declared | Name implies | Verdict |
|---|---|---|---|---|
| `9-luger` | rifle.csv | rifle | pistol | **misfiled — fix** |
| `327-fed` | rifle.csv | rifle | pistol | misfiled, medium confidence — escalate |
| `22-lr` | rifle.csv | rifle | ambiguous | **not a defect** |
| `4-bore-rifle` | shotgun.csv | shotgun | rifle | **reverse defect** — family correct, name wrong |

Full detail with evidence in `01-family-defects.csv`.

### 2.1 `9 Luger` — the one real defect

The 9x19mm Parabellum is a handgun cartridge filed `family=rifle` in `rifle.csv:149`.
Three independent signals inside this repository agree it is a pistol cartridge:

- `data/schema/003_seed_reference_data.sql` line 18 seeds `9mm-luger` with
  `family='pistol'` for the same cartridge;
- the DB holds `9-mm-luger-p` (family=pistol);
- SAAMI lists 9mm Luger as a centerfire **pistol** cartridge.

Per `ammoseek-coverage/KNOWLEDGE.md`, 9mm Luger is **19.75%** of published search
share — the most-searched cartridge we hold.

### 2.2 `.327 Fed` — new, not in the source

Federal .327 Truncated is a handgun rimfire cartridge introduced for semi-automatic
pistols, and it sits in `rifle.csv` with `family=rifle`. **The source `KNOWLEDGE.md`
did not name this one.** Confidence is medium rather than high — the bare designation
is less self-evident than "9 Luger", and there is no Federal .327 rifle — so I
escalated rather than silently including it.

### 2.3 `.22 LR` — the source is wrong to call it a defect

## 3. Reasoning for the one change I propose

`9-luger`: `family` `rifle` → `pistol`. High confidence, corroborated by a
first-party SAAMI designation plus two in-repo agreements.

**But it is not sufficient on its own.** The built database holds a second row for
this cartridge (§5), so the diff carries a warning rather than pretending the edit
completes the job.

## 4. What I deliberately did NOT do

- **Did not edit `data/seeds/`.** Verified afterwards: `git status` on
  `data/seeds/cartridge_specs/` is clean. The diff is generated, not applied.
- **Did not change `.22 LR`.** No correct answer exists.
- **Did not change `4-bore-rifle`'s family.** It is already right.
- **Did not include `.327 Fed` in the diff.** Medium confidence; needs SAAMI Z299.3
  confirmation. Silently editing on a hunch is the failure mode this repo warns about.
- **Did not de-duplicate `9 Luger`.** Changes row identity; may break
  `cartridge_pressure_references` joins and `CARTRIDGE_ALIASES`. Not my write-set.
- **Did not run `npm run data:build`.** Per `.clinerules` §4 only one agent may run it.

## 5. The finding that changes the fix: 9 Luger is duplicated

The built DB holds **318** cartridges; the seeds hold **229**. The extras come from
`003_seed_reference_data.sql`, and two of them duplicate seed rows:

```
id=1   slug=9mm-luger  name="9mm Luger"  family=pistol  psi=35000
id=260 slug=9-luger    name="9 Luger"    family=rifle   psi=35000
```

**Fixing the family alone leaves two rows for one cartridge.** The `.22` cluster has
the same problem (`.22RF Short`, `.22RF Long & LR`, `.22WRF`, `.22WRM` alongside
`.22 Short`, `.22 Long`, `.22 LR`, `.22 WR`, `.22 WMRF`).

This is why §2.3 refuses to touch `.22 LR`: its cluster needs de-duplication before
any row can be safely re-filed.

## 6. Blast radius — measured, and it corrects the source

The source claimed "Family drives presentation and filtering, so the most-searched
cartridge is in the wrong bucket." **Measured: it does not yet.**

`apps/website/src/main.js` contains no occurrence of `cartridge`, `family`, or
`pistol`. The only `family` in `apps/website/src/` is a Google Fonts URL. Costs come
from a hardcoded `apps/website/src/data/calibers.js` that already prices `9mm` as a
handgun cartridge.

So the defect is real but **latent for the UI**, and correctable before anyone builds
a platform filter. Full analysis in `02-blast-radius.md`.

## 7. Verification

| Check | Result |
|---|---|
| `01-family-defects.csv` parses | 10 columns, 4 rows, **0 ragged** |
| CSV rows match the seeds | all 4 confirmed against `data/seeds/cartridge_specs/` |
| `git apply --check` on the diff | **PASS** |
| `data/seeds/` untouched | `git status` clean |
| Negative test: context-free hunk | **observed FAILING**, then fixed — see below |

**The negative test that earned its keep.** My first diff used `@@ -149,1 +149,1 @@`
with no context. The body was byte-identical to the file — 392 bytes both sides, zero
suspect characters — and `git apply --check` still rejected it. Adding three lines of
context made it apply. Had I trusted the visual match I would have shipped a diff that
could not be applied. Detail in `KNOWLEDGE.md` §7.

## 8. Unresolved

- **`.327 Fed`** needs SAAMI Z299.3 confirmation before any change.
- **`.22 LR`** needs a platform policy decision, not a data fix.
- **`4 Bore Rifle`** needs renaming, which this task prohibits.
- **De-duplication** of the 9mm Luger and `.22` clusters is a separate task with its
  own write-set. This is the follow-up I am proposing.
- **No gate can detect this defect class.** `family` is constrained for *validity*
  (`IN ('rifle','pistol','shotgun')`) but never for *correctness*, so a misfile loads
  cleanly. `check-seeds.mjs` even names the hazard in a comment while being unable to
  detect it. Detail in `KNOWLEDGE.md` §6.
`ammoseek-coverage/KNOWLEDGE.md` §3 lists `.22 LR` beside `9 Luger` as "a real
defect". **It is not the same case.** The .22 Long Rifle is chambered in both rifles
and pistols; both uses are correct. There is no correct single answer without a
platform policy. I report it as ambiguous and **do not propose a change**.

### 2.4 `4 Bore Rifle` — reverse defect, and a trap

`family=shotgun` is **correct**; 4 Bore is a shotgun bore. The defect is the **name**.
An agent scanning for mismatches would naturally "fix" family to `rifle` and make it
wrong. `task.json` prohibits renaming, so I reported it only.