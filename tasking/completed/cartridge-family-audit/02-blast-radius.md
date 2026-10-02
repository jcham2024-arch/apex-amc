# 02 — Blast radius

What reads `family`, and what visibly breaks for a user who filters by it.

**Measured, not assumed.** The source `KNOWLEDGE.md` asserted "family drives
presentation and filtering". I checked, and that claim is **partly wrong for the
shipped app** — which matters, because it changes what fixing this is worth.

---

## 1. Where `family` is defined

`data/schema/001_ammo_catalog.sql`:

```sql
family            TEXT NOT NULL             -- 'rifle' | 'pistol' | 'shotgun'
CHECK (family IN ('rifle', 'pistol', 'shotgun')),
```

Line 31 of the same file creates the index:

```sql
CREATE INDEX IF NOT EXISTS idx_cartridges_family ON cartridges(family);
```

**The CHECK constraint is why a wrong value cannot be caught by the loader.** Any of
the three strings loads cleanly. `family` is validated for *validity*, never for
*correctness* — so nothing in the toolchain can tell a right answer from a wrong one.

`data/schemas/cartridge_specs.yaml` states the intent:

> Family is the split key because it is the coarsest key that is both populated and
> meaningful.

## 2. Who reads it

| Consumer | Reads `family`? | Consequence of a wrong value |
|---|---|---|
| `data/schema/003_seed_reference_data.sql` | yes — inserts cartridges with a family | Seeds `9mm-luger` as **pistol**, creating the duplicate (§4) |
| `scripts/gates/check-seeds.mjs` | yes — `resolveCartridge()` | Its own comment: "this is where a wrong guess would send a pistol cartridge down a rifle page". It refuses only an *absent or invalid* family, never an incorrect one. |
| `data/generated/json/cartridge_specs.json` | yes — emitted per row | The misfiled row is published in the JSON artefacts |
| `apps/website/src/main.js` | **no** | Nothing |

### The shipped website does not read it at all

`apps/website/src/main.js` is 17,066 bytes and contains **no occurrence** of
`cartridge`, `family`, or `pistol`. The only `family` match anywhere in
`apps/website/src/` is a Google Fonts URL (`…family=Inter&wght@300…`) — a CSS
parameter, not the column.

Cartridge costs come from a **hardcoded** table, `apps/website/src/data/calibers.js`,
with five presets (`9mm`, `223`, `308`, `65`, `9mmSub`). It is hand-maintained and
completely independent of `data/seeds/`. It already prices `9mm` as a pistol
cartridge.

**So today, a user of the live site sees no incorrect family.** The defect is
in the data layer and the generated artefacts, and it is latent for the UI rather
than visible in it. Correcting that in `HISTORY.md` would have been a claim I had
not measured.

## 3. What breaks once a UI does read it

If a family filter or "browse by platform" control is built on this column, then with
the current data:

- **9mm Luger is absent from the pistol list.** It is the most common handgun
  cartridge in the index — `ammoseek-coverage/KNOWLEDGE.md` puts it at **19.75%** of
  published search share. A user filtering *Pistol* would not find it. A user
  filtering *Rifle* would find a handgun cartridge.
- **`.22 LR` is in the rifle list**, where it is defensible, and absent from the
  pistol list, where it is equally defensible. Either way a user looking for it
  under Pistol does not find it.
- **`4 Bore Rifle` appears under Shotgun with a name saying Rifle.** Any label
  rendered from `name` next to a family badge would read "Rifle" inside a shotgun
  list. This is the one row where the contradiction is *visible on screen*.

The index is used, confirmed by query plan:

```
SEARCH cartridges USING INDEX idx_cartridges_family (family=?)
```

So the query is efficient; the data behind it is what is wrong.

## 4. The part the source did not know: 9 Luger is also a duplicate

The built database holds **318** cartridges where the seeds hold **229**. The extra
rows come from `003_seed_reference_data.sql`. Two of them are the same cartridge:

```
id=1   slug=9mm-luger  name="9mm Luger"  family=pistol  psi=35000
id=260 slug=9-luger    name="9 Luger"    family=rifle   psi=35000
```

Identical pressure figure, opposite family. **Changing `9-luger`'s family to pistol
fixes the misfile and leaves two rows for one cartridge**, both pistol. Any count,
list, or join on 9mm Luger is then doubled.

This is why `03-proposed-fix.diff` contains only the family change and carries an
explicit warning instead of silently also de-duplicating. Row identity is a separate
decision with its own blast radius (it can break `cartridge_pressure_references`
joins and the `CARTRIDGE_ALIASES` map in `check-seeds.mjs`), and it is not mine to
make.

Related, also unremarked: the DB contains `.22RF Short`, `.22RF Long & LR`,
`.22WRF` and `.22WRM` (from the 003 set) **alongside** the seeds' `.22 Short`,
`.22 Long`, `.22 LR`, `.22 WR`, `.22 WMRF`. That is a second duplication cluster in
the same calibre, and it is why I did not touch `.22 LR` at all — the `.22` family
needs a de-duplication decision before any of its rows can be safely re-filed.

## 5. Practical impact of applying the diff

| Change | Risk |
|---|---|
| `9-luger` family → pistol | Low on its own. Corrects a demonstrable error. Makes the §4 duplicate **visible** rather than fixing it. |
| `seed:check` | Must be re-run after applying; `family` participates in loader resolution. |
| `data:validate` | Generated JSON changes, so generated artefacts must be rebuilt (`npm run data:build`) — and per `.clinerules` only one agent may run that at a time. |
| `apps/` | **No impact.** The website does not read `family`. No `handoff:accept` is needed because `apps/` is untouched. |

**Recommendation:** apply the diff, then decide de-duplication as its own task, then
rebuild generated data under the one-builder rule.