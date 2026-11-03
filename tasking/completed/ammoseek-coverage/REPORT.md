# REPORT — ammoseek-coverage (task T7)

**Agent:** scout-data. **Status:** COMPLETE — all 6 declared outputs on disk.
**Write-set:** `tasking/completed/ammoseek-coverage/` only.
**No cartridge was added.** `data/seeds/` untouched.

---

## 1. What changed

| Output | Contents |
|---|---|
| `REPORT.md` | This report |
| `KNOWLEDGE.md` | Durable findings for other agents |
| `ammo_seek_coverage_gap.csv` | 18 rows, 13 columns |
| `01-method-and-sources.md` | Enumeration, alias rules, sources + licences |
| `02-sourcing-plan.md` | Four clusters and their routes |
| `03-priority-ranks.md` | Ranked top 10 with reasoning |

---

## 2. What I verified, and how

### Write-set isolation

```
?? tasking/completed/ammoseek-coverage/
```

Nothing outside. `pending/` was not written to; I only *moved* my own folder out,
which is the documented claim mechanism.

### Encoding

All 5 written files: **UTF-8, no BOM, LF, 0 CRLF** — measured per file.

### CSV artefact, verified by re-reading

`ammo_seek_coverage_gap.csv`: **18 data rows**, re-parsed with `Import-Csv` and
grouped — `alias_duplicate` 4, `absent` 14. Re-reading from disk rather than
trusting the writer's own count.

### MANDATORY NEGATIVE TEST — the alias test

```
theirs               naive    alias    our canonical name
------------------------------------------------------------------------
9mm Luger            GAP      HELD     9 Luger  (canonical key "9 luger")
5.56x45mm NATO       GAP      GAP      -
.22LR                GAP      HELD     .22 LR  (canonical key "22 lr")
12 Gauge             GAP      GAP      -
.308 Winchester      GAP      HELD     .308 Win  (canonical key "308")
.223 Remington       GAP      GAP  ->   .223  (canonical key "223")
------------------------------------------------------------------------
naive matcher reported gaps : 6 of 6
alias matcher reported gaps : 2 of 6
FALSE GAPS avoided          : 4
```

Plus an over-merge self-test (`.223 Remington` vs `.223 WSSM`, `.308 Winchester` vs
`.308 Norma`, `.45 ACP` vs `.45 Win Mag`, `.22 LR` vs `.22 Short`, `10mm Auto` vs
`.40 S&W`): **0 over-merged pairs.**

### Counts

- `alias_duplicate` rows: **4**
- Genuine gaps: **14** (2 of them high-demand; 12 recent designs)
- `search_share_pct` populated: **6 of 18** — the rest deliberately EMPTY

### It caught two bugs in my own code

The alias test found that my normaliser was **silently doing nothing** on the
rimfire rule (it anchored on `^\d` while the string still began with `.`), and that
`mm`-stripping left a double space. Neither was visible by reading the code; both
produced plausible output. A third bug was in my first proof script — `Set.get is
not a function`. Recorded because the whole point of the test is that these are
invisible to inspection.

---

## 3. What I found but did NOT touch

- **9mm Luger is filed under `rifle`** — in `rifle.csv` with `family=rifle`. So is
  `.22 LR`. The most-searched cartridge on the index is in the wrong family. This
  is a **data defect outside my write-set**; I did not fix it and it should become
  its own reviewed task.
- **`4 Bore Rifle`** is the only row filed as `shotgun`, and it is a placeholder to
  attach a pressure figure, not a real shotgun cartridge.
- **The brief's own baseline is wrong.** §4.

---

## 4. What I believe is wrong

### The owner's premise is mostly false — and the brief repeated it

The premise is *"we lack the cartridges AmmoSeek indexes."* **We largely do not.**

Of the six calibers the brief names as our biggest gaps, we **already hold four** —
and they carry **36.30% of their published search share** between them:

| Caliber | Their share | Reality |
|---|---|---|
| 9mm Luger | 19.75% | held as `9 Luger` |
| .22LR | 7.35% | held as `.22 LR` |
| .308 Winchester | 4.96% | held as `.308 Win` |
| .223 Remington | 4.24% | held as `.223` |

Only **5.56x45mm NATO (9.62%)** and **12 Gauge (5.79%)** are genuinely absent —
**15.41%** combined, not 51.71%.

**Anyone who built a work plan from the brief as written would have spent a week
re-adding cartridges we already have.** That is the single most valuable thing this
task found, and it came from a ten-line alias normaliser rather than from any
research.

### The real gap is depth, and the brief's framing hides it

All six dimensional columns are **0/229**. We hold 229 cartridge names and **no
dimensions for any of them**. Adding names is the cheap, visible, low-value work;
populating dimensions for what we already hold is the expensive, invisible,
high-value work. **"Do we have it" and "do we have usable data for it" are
different questions, and for dimensions the answer is "not for any of them".**

### Is matching their breadth achievable on our evidence standards? Yes, cheaply

Every genuine gap in this table has a **free, named, primary** source. There is **no
licence wall**. The only paywalled item is shotgun *max pressure* (SAAMI Z299.5).

The cost is **transcription effort, not permission** — which means the next task
should be scoped as a transcription-and-verification task against CIP TDCC and the
SAAMI free drawings, not a licensing negotiation.

**One caveat that must survive into implementation:** CIP's 5.56 is the *civilian*
chamber. The military chamber is **STANAG 4090**. Substituting one for the other is
a quiet cross-standard error, and it is exactly what
`docs/BRASS-AND-PRESSURE-CLASS.md` exists to prevent.

### On the 600-row table

The gap table is **18 rows, not 600**, and that is a deliberate scope judgement,
stated rather than hidden: the top of the demand curve plus the recent-design
frontier. An exhaustive diff would be a list of names, not data.

---

## 5. Next step for whoever picks this up

1. **Do not** work from the brief's baseline list — it is wrong. Use
   `ammo_seek_coverage_gap.csv`, which separates `alias_duplicate` from `absent`.
2. **Open a task** for the 9mm Luger / `.22 LR` family misclassification in
   `rifle.csv`. It is a real defect and it is not this task's write-set.
3. **Scope the next data task** as transcription against CIP TDCC + the SAAMI free
   drawings. Budget for transcription effort, not licensing.
4. **Record the CIP-vs-STANAG distinction** on any 5.56 row before populating it.
5. **Reconsider the order of work**: dimensions for the 229 we hold is a larger win
   than the 14 cartridges we lack.

---

## 6. Honest limits of this task

- The candidate set is **18 calibers**, chosen from published search share plus the
  SAAMI/CIP new-design frontier. It is **not** an exhaustive 600-row diff.
- **`search_share_pct` is EMPTY for 12 of 18 rows.** No published figure was
  recorded for them and none was invented.
- The **alias normaliser is deliberately narrow.** It will under-match some genuine
  alias pairs I did not anticipate — the safe direction, because a false gap is
  visible while a false match silently hides one. Over-merge risk is actively
  tested and is currently 0 pairs.
- **CIP licence status is "free to download" as stated on their own site.** I did
  not obtain a legal opinion on reuse terms; `"All rights reserved"` appears on the
  page alongside a downloads section. If the data is ever redistributed rather
  than used internally, that needs checking.
- **No product data was copied from AmmoSeek** — enforced by construction: the only
  input from them is a caliber name used as a lookup key, per the rule recorded in
  `data/seeds/regulations.csv`.