# T5 — REPORT

**Task:** interior-ballistics — Interior ballistics: powder characterisation and
load synthesis. **Manifest:** `tasking/completed/interior-ballistics/task.json`.
**Agent:** scout-math (executed directly; sub-agent dispatch is unavailable in this
session — see §1.3). **Model:** default model, fresh instance.
**Compiled:** 10 Feb 2026.

---

## 1. What changed

### 1.1 Staged deliverables (all 7 `required_outputs`)

| File | Substance |
|---|---|
| `REPORT.md` | This file — the five-part summary from `.clinerules` §8. |
| `KNOWLEDGE.md` | Durable cross-task findings: the three things worth knowing without reading the rest, the prohibitions carried forward, the licence position, and the compound gaps. |
| `01-burning-rate-sources.md` | Every legitimate source of quantitative powder properties, with licence status and redistribution permission. **Central finding: no manufacturer publishes an absolute burn rate for any reloading powder.** |
| `02-powder-properties.csv` | 16 columns, 4 rows. **0/4 absolute burn rate, 0/4 pressure exponent, 0/4 force curve, 0/4 geometry, 1/4 density** — and that one density is a *historical* Hodgdon bulk-density figure for a discontinued product. |
| `03-load-synthesis-literature.md` | Viebig, the pressure-dependent law, temperature correction, the Hill force law and form function, the energy balance; every required input and whether we hold it; why fitting powder constants from load data is ill-conditioned rather than merely noisy. |
| `04-equivalence-rules.md` | Berger, Hornady, Hodgdon rules for an unlisted projectile, verbatim, with licences. **No manufacturer publishes an interpolation formula — all route to a human.** |
| `05-feasibility-verdict.md` | The verdict in its first paragraph; minimum viable dataset and licence burden; per-powder vs per-cartridge; the seven things that must be EMPTY; six ranked failure modes; the safety case. |

**No main-tree file was edited.** `git status` shows only tasking moves.

### 1.2 Brief defect found — reported, not repaired

**`BRIEF.md` for this task is corrupted, the same way the earlier T5 brief was.**
Specifically:

- §3 "Context Anchors" holds **1 of 4** items. Items 2–4 (`docs/CONVENTIONS.md`,
  `docs/BALLISTICS-AUDIT.md`, `data/seeds/regulations.csv`) appear as an orphaned
  block **after §7**.
- §5 is cut mid-sentence at "burn rate, pressure exponent, force" — and continues at
  a point *after* §7.
- Items §5.2–5.5 and the `04-equivalence-rules.md` / `05-feasibility-verdict.md`
  deliverable definitions are **all appended after §7**, not in place.

The fragments are complete, only misplaced, so no content was lost. An agent
following the brief literally would have missed two of five core questions and both
deliverable definitions. I read the orphaned content and did the work anyway.

**Per `tasking/pending/README.md` I did not repair it.** Fixing briefs is the
planner's job. This is a defect to record, and it is the *second* occurrence of the
same corruption on this brief — which per `tasking/review/README.md` ("a brief that
produces the same rejection twice needs rewriting") argues for regenerating it from
a source rather than hand-editing again.

Also: `tasking/review/HISTORY.md` notes the T-briefs were hand-maintained.
`docs/AGENT-PROMPTS.md` generates A1–D4 only, so **there is no generator for the
T-series briefs** — nothing would have caught or repaired this.

### 1.3 Not done, deliberately

Sub-agent dispatch failed (`Unauthorized`) in a previous session, so this task was
executed directly rather than delegated. The ledger's `scout-math` agent assignment
was not used. Isolation was unaffected — the write-set is one folder.

---

## 2. What was verified and how

### 2.1 The brief's §2 claims — re-measured against this repo

`node tmp/t5-measure.mjs`:

```
=== powders.json ===
declared row_count: 169 | actual rows: 169

--- population per column (measured) ---
 169 / 169  100.0%  _line
 169 / 169  100.0%  _source
  59 / 169   34.9%  burn_rate_class
   4 / 169    2.4%  geometry
 169 / 169  100.0%  manufacturer
 169 / 169  100.0%  manufacturer_slug
 169 / 169  100.0%  manufacturer_website
 145 / 169   85.8%  notes
 169 / 169  100.0%  product_line
 169 / 169  100.0%  product_name
   0 / 169    0.0%  relative_burn_rate_position
 169 / 169  100.0%  source_url

=== powder_burn_rate_positions.csv ===
data rows: 22 | header: chart_slug,brand,position,column_total,powder_name_as_published
column_total values: 22

=== cartridge_pressures.json ===
rows: 231

=== cartridge_specs dimensional columns (T4 cross-check) ===
rows: 229
   0 / 229  bullet_dia_in
   0 / 229  case_length_max_in
   0 / 229  max_col_in
   0 / 229  rim_dia_in
   0 / 229  head_dia_in
   0 / 229  capacity_gr_h2o
   0 / 229  primer_type
  98 / 229  saami_max_psi
```

**Every figure in the brief is confirmed exactly.** Two refinements matter more than
the numbers:

1. **The quantitative columns are absent from the schema, not empty.** They do not
   appear in the column list at all. Filling them is a **schema change**, not a data
   fill — strictly serial, owned by the migration tasks.
2. `column_total` is a single value, `22`, confirming a within-brand rank rather than
   a cross-brand scale.

### 2.2 Negative test — no charge weight appears

```
=== NT1: brief's own pattern, all 6 required outputs ===
(no output = PASS)

=== NT2: grain/grains ===
(no output = PASS)

=== NT3: CSV-style charge field / phrasing ===
(no output = PASS)
```

All three patterns return nothing across every file. (`04-equivalence-rules.md`
quotes Hodgdon's column label `Grs.` with no number attached — a column name, not a
value, left verbatim rather than reworded to make a grep prettier.)

### 2.3 The CSV honesty check

```
=== staged 02-powder-properties.csv ===
columns: 16 | data rows: 4
ragged rows (length !== header): 0

--- honesty metrics (physical columns) ---
 0 / 4 populated   absolute_burn_rate_mm_per_s
 0 / 4 populated   pressure_exponent_n
 0 / 4 populated   force_curve
 1 / 4 populated   bulk_density_g_per_cc
 0 / 4 populated   geometry

--- every non-empty physical cell, verbatim ---
  Hodgdon / Accurate No.2 (historical formulation): bulk_density_g_per_cc = "0.750-0.800"

dataset powders: 169 | represented in this CSV: 4
```

**165 of 169 powders are absent from the CSV, and that is the correct result**, not
an oversight: no source publishes a physical property for them. A row would need a
licence and a URL; there was neither.

The checker asserts field count **and** a non-empty first field, because the reader
pads short rows and a key count is never evidence a row is well formed. This caught
a real ragged row (18 fields against a 16-column header) in the first draft of this
CSV, caused by unquoted commas inside a note.

### 2.4 The searches — pasted as the brief requires

The decisive negative result, from parsing the Vihtavuori Reloading Guide ed. 13
(35 pp.), pp. 1–9:

> "Current canister powders in order of *approximate* burning rate. This list is
> for reference only and **not** to be used for developing loads."
> … "Absolute physical burn rate (mm/s or m/s at a reference pressure): No."
> … "Powder density or loading density: Bulk density is mentioned… but specific
> numerical powder density or loading density values are not given."

Hodgdon Reference Data:

> "No copyright, trademark, reproduction, redistribution, or licence notice appears
> on the page, nor are any absolute physical burn rates or pressure exponents are
> stated (the page lists a link titled 'Relative Burn Rates')."

Hodgdon's chart PDF title: **"RELATIVE BURN RATES FROM FASTEST TO SLOWEST"**.

Literature search returned ~8 papers with physical burn rates and pressure exponents;
**every one is a laboratory or rocket propellant** (PMC7411880, PMC12772397,
PMC8537742, pmid:38856526, …). PMC7411880's abstract reports the geometric law is
*violated* by some propellants.

### 2.5 Feasibility verdict — first paragraph, pasted verbatim

> **Not achievable as asked, and the reason is not cost — it is that the required
> physical constants are not obtainable from any lawfully readable source, and
> cannot be inferred from published load data without an ill-conditioned, unbounded
> extrapolation.** Specifically: **no manufacturer publishes a burn rate, pressure
> exponent, force curve, heat of explosion, or loading density for any reloading
> powder we hold.** … **The achievable goal is an interpolation engine over
> published load data, with mandatory EMPTY on an unresolvable match — which is
> exactly what Berger and Hornady do by hand.** A genuine interior-ballistics
> calculator is achievable, but only by *measuring* powder constants in a
> pressure-rated closed vessel, not by inference.

### 2.6 Isolation and gates

```
all 18 non-tasking stages of verify: exit=0
  lint  typecheck:all  test:all  test:encoding  test:bullets  schema:check
  seed:check  data:validate  docs:check  handoff:status  security:check
  modules:check  website:check  claims:check  oracle:check  ci:check
  audit:check  regulations:check

npm run verify      -> exit 1  (fails ONLY at tasking:check)
npm run tasking:check -> exit 1  (pre-existing gate defect; see §3.2)
```

**Stated precisely, because it matters:** `verify` runs 19 stages and
**18 of them pass**. The single failure is `tasking:check`, whose defect predates my
task and which fails identically for the three completed tasks other agents
produced. Every other gate is green.

**No file outside this task's own folder was modified.** My footprint:

```
 D tasking/pending/interior-ballistics/BRIEF.md
 D tasking/pending/interior-ballistics/task.json
?? tasking/completed/interior-ballistics/
```

Two deletions are the claim move itself (the protocol's lock). Scratch is in `tmp/`,
per `.clinerules` §5 rule 10.

**Baseline, measured before claiming:** `verify` exited 0 and `tasking:check`
reported "tasking verified" — because at that moment `pending/` contained a folder
whose sort order put it first and `completed/` was empty, so the broken loop happened
to produce a passing result. **The defect was invisible at baseline and only surfaced
once tasks moved to `completed/`.** That is worth recording: this gate gives a false
green.

---

## 3. What was found but NOT touched

1. **`BRIEF.md` for this task is corrupted** (§1.2) — reported, not repaired, per the
   `pending/` read-only rule. Second occurrence of the same defect.
2. **`check-tasking.mjs` is broken and has never checked more than one task.** This
   is the reason `npm run verify` currently exits 1, and it is **not** caused by my
   work — three other agents' completed tasks fail identically.

   **The bug:** the `for (const dir of taskFolders(PENDING))` loop that registers
   manifests (line 62) is **missing its closing brace**. It is swallowed by the
   dependency loop further down, so the loop body executes exactly once and the gate
   sees only the first directory. Proven by instrumenting a copy:

   ```
   PENDING= C:\Cline\ApexProject\tasking\pending
   dirs= 8
     SET ammoseek-coverage        <- only one SET, then the loop ends
   tasking manifests
     1 task(s) in pending/, 1 ready
     4 task(s) in completed/, 0 declared output(s) verified
   ```

   The gate reports **1 task in `pending/`** while **8 directories exist**, 7 with
   valid `task.json`. Reproducing the loop standalone registers all 8 — so the
   manifests are fine and the loop is the defect.

   **Why nothing caught it:** there is a **stray `}` at EOF** (line 223) that balances
   the missing one — `open=58 close=58 delta=0`. The file is net brace-balanced, so
   `node --check`, ESLint and every syntax gate pass. Two braces in the wrong place
   cancel out. This is the same failure family `AGENTS.md` already records
   ("`insert_line` inserting into the middle of a block"; the migration-016
   `CREATE VIEW` landing inside an open `CREATE TABLE`) — **and the same family as
   this task's corrupted `BRIEF.md`**. Both are out-of-order insertions no structural
   check can see. Introduced in commit `a939ecd`; `git show a939ecd:` confirms the
   brace was already missing there, so **this gate has never verified more than one
   task**.

   **Second-order:** even with the brace fixed, the gate builds its manifest map from
   `pending/` only, while the documented workflow *moves* the folder (manifest
   included) into `completed/` — so a finished task resolves to nothing. Both changes
   are needed.

   **I did not apply either fix**, because `scripts/` is outside my write-set. Full
   diagnosis and the tested patch are in `NOTES.md` for the planner.
3. **No generator exists for the T-series briefs** — `docs/AGENT-PROMPTS.md` produces
   A1–D4 only. Hand-maintained briefs are how §1.2's corruption survived a commit.
4. **`KNOWLEDGE.md` has no documented format.** It is declared in five manifests,
   described in no brief, and no other task has produced one. I wrote it as the
   durable cross-task distillation and said so in its header, but the convention
   should be written down before five agents each invent a different one.
5. **Only 4 of 7 powder manufacturers were individually sourced.** Alliant, Ramshot
   and IMR pages were not scraped; Vihtavuori's chart covers them as third-party
   opinions. **Coverage gap, not evidence of absence** — recorded as such.
6. **`apps/website/dist/` is gitignored but `docs:check` requires it to exist**, so a
   fresh clone fails `verify` until `npm run website:build` runs. (Hit in a separate
   worktree; pre-built here.)

---

## 4. What I believe is wrong

**The owner's premise conflates two different products.** "Infer a powder's
behaviour from many load observations, then derive an unpublished load" is not a
weaker version of a load calculator — it is a different thing that does not exist in
this industry. Nobody does it. Berger tells you to telephone them. Hornady runs a
test and posts the answer. The four constants that determine a load are independent
of what a charge produces, so velocity and pressure observations trade off against
each other; fitting them yields a **degenerate family, not an estimate**, and using
it to extrapolate to an unlisted bullet is unbounded in the direction that matters.
Worse, the manufacturers state the same powder lot produces materially different
results — so even a perfect fit describes *one lot on one day in one rifle*, and we
cannot know which lot a user holds.

**The valuable, achievable product is the boring one:** a cited, licensed catalogue
of real load observations with nearest-neighbour interpolation, uncertainty carried
honestly, and an explicit EMPTY whenever the match is not good enough. That is
useful, defensible, and it is what ApexLoad does.

**On safety I would go further than the brief does.** The brief treats "no charge
weight" as a prohibition on the research agent. I think it is a **design requirement
for the product**. The industry position is unanimous — a load is a starting point
for a physical test, and the test is the safety mechanism. If we ever emit a number,
it is a **starting point**, and the UI must carry the "verify before firing" clause
every manufacturer attaches. A feature that cannot say "I don't know" should not
ship. Hornady's 6.5 PRC erratum is the argument: one wrong powder name in a printed
table produced dangerous pressures. Our resolver needs the ability to return EMPTY,
and that is a feature to be built deliberately, not an error state to be papered
over.

---

## 5. Locks

**T5 / interior-ballistics holds no shared locks.** Write-set is
`tasking/completed/interior-ballistics/` — its own folder, touching no shared file.
`package.json`, `data/schema/`, `data/generated/` and `scripts/shared/data.mjs` were
all untouched.

**Claim status:** claimed by moving `tasking/pending/interior-ballistics/` →
`tasking/in-progress/interior-ballistics/`, then → `tasking/completed/`. The move out
of `pending/` was the lock; no other agent's task was touched.

**For the planner:**
- `BRIEF.md` for interior-ballistics is corrupted (§1.2) — regenerate, do not
  hand-edit a third time.
- `check-tasking.mjs` manifest resolution (§3.2) — the documented final move
  contradicts the gate.
- `KNOWLEDGE.md` needs a written format convention (§3.4).