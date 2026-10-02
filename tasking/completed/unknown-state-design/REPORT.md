# REPORT — unknown-state-design

**Task:** `tasking/in-progress/unknown-state-design/`. **Derived from:**
`tasking/completed/ui-research/KNOWLEDGE.md`. **No file in `apps/website/` was edited** —
this is a specification; a human implements it.

---

## What I did

Measured the claim instead of restating it, specified a four-state unknown vocabulary with the
data-layer contract it requires, and inventoried nine data surfaces with the behaviour each
needs when its value is absent.

| File | Contents |
|---|---|
| `01-unknown-state-spec.md` | The four absences, the vocabulary and why each token, data-layer contract, aggregate rules, the accent defect |
| `02-surface-inventory.md` | Nine surfaces; the live `\|\| 0` defect; priority order |
| `KNOWLEDGE.md` | One-page version for the implementer |

## What I found

**1. The brief's premise is right, and the bug is already live.** `main.js` contains **7**
occurrences of `|| 0` (counted, not enumerated — my first pass said six and was wrong), on
every cost input. An empty field becomes `0`, renders as `$0.000`, and break-even renders
**"0 rounds"** — meaning *equipment is free* rather than *unknown*. **This is the exact failure
this task exists to prevent, shipping today.**

**2. The 0/229 claim is true but incomplete, and the incomplete part is worse.**

```
saami_max_psi    98/229   42.8%      <- not 0/229
saami_max_cup    82/229   35.8%
bullet_dia_in     0/229
```

**The dominant state is mixed.** A design that handles only the fully-empty case renders `0` for
131 rows in a column where 16 rows hold a real number — and a plausible number beside a blank is
*more* misleading than a uniformly blank column.

**3. The four absences all occur here, and one is a licence restriction.** `cip_max_bar` is
0/229 because **CIP forbids reproduction without written approval**
(`cartridge-dimensions/01-source-survey.md`). Rendering it "Not recorded" is **actively false** —
it claims we searched and found nothing, when we have the source and may not copy it.

**4. The dimensional table does not exist yet.** No match for any dimensional column in
`apps/website/src/`. The live data surface is a **cost calculator**, which is why finding 1
matters more than the brief's framing.

**5. The mockups already solved part of it.** `_tokens.css` defines `--text-mute` and a `.empty`
block (lines 136–138), unported. Checking first, as the brief instructs, saved designing
something that exists.

## What I did NOT do, and why

- **I did not fix the `|| 0` defect.** `apps/` is outside my write-set and the brief forbids
  editing it. **It is the most urgent thing in this task and I have only documented it.** That
  is the correct boundary, not an oversight.
- **I did not design the populated-data presentation.** Explicitly prohibited, and the ordering
  is the finding.
- **I did not implement the four-state vocabulary in the data layer.** It requires a loader /
  CSV-contract change; see below.
- **I did not touch `pending/` or repair the brief.** Its DoD references no stale path this
  time; nothing needed reporting.

## The blocking dependency — the spec cannot be completed by the UI implementer

**A CSV cell carries only that it is empty. That is three bits, not four states.** The reason a
cell is empty lives in the loader and the provenance record, not in the data file.

So: `01-` §4 requires dimensional columns to return **a value or a state token**, never `""`.
**That is a change to `scripts/gates/check-seeds.mjs` and the seed CSV contract** — outside both
my write-set and the UI's. **Whoever implements this in the app will hit a wall unless the data
layer changes first.** Recorded rather than assumed away.

## The thing I am most confident about

**The priority order inverts the brief, deliberately.** The brief's six empty columns are the
largest data surface; the live `|| 0` defect is the only one currently producing a *wrong
number*. The empty columns are a bigger design problem. The `|| 0` is a smaller one that is
already wrong in front of users.

**Fix the thing that ships first.** That ordering is the finding, not a preference.

## Unresolved

1. **Who changes the loader?** Blocking, above. Needs an owner decision or a new task.
2. **Is "Restricted" acceptable branding?** It admits a limit we imposed on ourselves. It is the
   honest token and I recommend it — but it is a product/owner call, not mine.
3. **Does Google Play or Apple require anything specific about empty states?** Not checked;
   out of scope and not needed for a specification.
4. **The `emerald-500` accent split** — specified, not implemented. Same boundary as the
   `|| 0` fix.

## Verification

```
$ node tmp/unknown/tally.mjs
total cartridge rows: 229
saami_max_psi   98/229   42.8%      <- differs from the brief's "0/229"
bullet_dia_in    0/229    0.0%
```

All four files: LF only, no BOM, no lone CR, verified by re-reading bytes.
`git status --porcelain -- packages data scripts apps package.json` shows **no changes of mine**
(§10.5: the gates prove isolation, not correctness — so this was checked by reading).