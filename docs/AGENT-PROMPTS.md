# Agent prompts — one per task in the parallel plan

**Written 2 Oct 2026.** Each prompt below is self-contained and copy-pasteable.

Every agent follows the same opening sequence:

1. Read [`AGENTS.md`](../AGENTS.md) — master context, traps, boundaries.
2. Read [`CONVENTIONS.md`](CONVENTIONS.md) — **binding.** OOP pattern, comment
   style, security rules, negative-test requirement, encoding rules.
3. Read the task brief below for your task ID.
4. Read [`PARALLEL-WORK-PLAN.md`](PARALLEL-WORK-PLAN.md) for the shared-surface
   rules — especially `data/generated/**`, which will bite you if you run
   `npm run data:build` while another agent is working.

**Universal rule, repeated in every prompt because it is the one that matters:**
do not edit a file outside your declared write-set. Report the problem instead.
Two agents editing one file is the failure this whole document set exists to
prevent.

**Baseline to confirm before you start:** `npm run verify` exits 0, 235 tests.. If it does not, stop and report — someone else has broken it and that
must be fixed before parallel work continues.

---

# A1 — CI oracle cross-check

**Priority: highest in the entire plan. Start here.**

```markdown
You are working in C:\Cline\ApexProject, task **A1: CI oracle cross-check**.

READ FIRST, IN THIS ORDER — do not skip:
1. AGENTS.md
2. docs/CONVENTIONS.md  (binding: OOP, comment style, security, negative tests)
3. docs/PARALLEL-WORK-PLAN.md — the "two shared surfaces" section
4. packages/ballistics-core/src/drag/solver.ts — the drag constant, the
   form-factor derivation, and four named unit/dimension traps in its header
5. packages/ballistics-core/src/drag/dragTables.ts — corrected tables plus the
   three-defect history in its header
6. data/reference/README.md — what makes a dataset an oracle
7. scripts/extract/crosscheck-pressures.mjs — may already do part of this
8. docs/BALLISTICS-AUDIT.md §0 — current ballistics state

BACKGROUND
Three real ballistics defects shipped while 161 tests passed. The tests agreed
with the implementation because both were wrong the same way. data/reference/
is an independent oracle that NOTHING runs in CI. That is the gap.

YOUR WRITE-SET (edit nothing else):
  .github/workflows/verify.yml
  one new gate under scripts/gates/
  one new test under scripts/tests/
  package.json  (add the script AND the verify chain entry, in one edit)
  README.md  (add the npm script to the script table)

DO NOT TOUCH:
  data/schema/011_community_layer.sql
  anything under data/seeds/ or data/schemas/
  packages/ballistics-core/src/** — you are ADDING a check, not changing physics
  apps/** — changing the main app requires `npm run handoff:accept`

WHAT TO BUILD
A gate comparing the domain implementation against data/reference/ that FAILS
npm run verify on a meaningful divergence.

- Assert QUANTITATIVE agreement, not file presence. A gate that checks the
  reference file exists has re-created the problem you are fixing.
- Tolerances must be physically justified. Comment what each is and why. Do not
  pick a number to make it pass.
- Every physical constant per CONVENTIONS §3. If a tolerance needs a constant and
  provenance/constants.ts is outside your write-set, use a named local constant
  with a full comment on its basis, and report this in your summary.
- OOP per CONVENTIONS §2 IF the comparison needs a type with invariants. If it is
  pure functions over parsed data, plain functions are correct — do not
  manufacture a class.
- Header comment: what it checks, why it exists, what it deliberately does NOT.
- If crosscheck-pressures.mjs already does this, REUSE it. Duplicated oracles
  drift, and that is the failure mode.

THE MANDATORY NEGATIVE TEST
Run green. Then deliberately break the implementation — alter a drag constant or
form-factor term in a scratch copy — and show the gate FAILS with exit 1 and a
message naming the divergence. Paste both runs in your summary.

Do NOT claim it works without showing it fail. Three gates in this repo passed
against deliberately broken input before that was discovered. A gate never
observed failing is not known to work.

DONE WHEN
- npm run verify exits 0 with the new stage included
- the negative test was run and observed failing
- README.md lists the new script
- summary states what it checks, the tolerances and their justification, both
  test runs verbatim, and anything found but not touched
```

---

# A2 — Migration for the bullet-diameter split

**Serial. Nothing else adds a migration until this lands.**

```markdown
You are working in C:\Cline\ApexProject, task **A2: migration for the
bullet-diameter split**.

READ FIRST:
1. AGENTS.md
2. docs/CONVENTIONS.md
3. docs/DATA-MODEL.md — the schema's reasoning
4. The three most recent files in data/schema/ — match their comment style
   exactly. Read 016_affiliate_outreach.sql end to end: it is the model for a
   good migration comment in this repo.
5. scripts/gates/check-schema.mjs — what your migration must satisfy
6. scripts/shared/load-database.mjs — how migrations are applied

BACKGROUND
B1 (a separate agent) splits bullets.diameter_in into caliber_designation plus a
real bullet_dia_in measurement. You write ONLY the migration and the schema
decision. B1 owns the CSVs and the manifest.

WHY YOU ARE FIRST AND SEPARATE
Migrations are numbered, append-only, and every gate replays the whole chain. Two
agents adding migrations concurrently collide on numbering and produce a chain
neither tested. One at a time.

YOUR WRITE-SET:
  one new numbered file in data/schema/
  docs/DATA-MODEL.md  (the decision and its reasoning)

CONSULT BUT DO NOT EDIT: data/schemas/bullets.yaml — B1 owns it. If the
migration and the manifest disagree, report it, do not fix it.

REQUIREMENTS
- Pick the next number by looking at what exists. Do not assume.
- Migrations are ADDITIVE. Never edit an existing one — a deployed D1 has already
  run them. A new column means a new file, not an ALTER inside 009.
- The header comment must state, in the style of 016: what this is for, why it
  exists, what is deliberately NOT here.
- Nullable throughout. An unknown diameter must be NULL and visible, never zero
  and never a guess. See CONVENTIONS §1.
- Preserve the old column. Renaming in SQLite drops data; the old name must
  survive, and the comment must explain the choice.
- If a column becomes a foreign key, confirm load-database.mjs's load order still
  works, and say in a comment that you checked.
- Part numbers and SKUs are STRINGS. If the migration touches one it stays TEXT.
  A leading zero is not cosmetic.

THE MANDATORY NEGATIVE TEST
- npm run schema:check passes with your migration.
- Then show the gate CATCHES a row violating your new constraint. Paste the
  failing output in your summary.

Verify the artefact, not the exit code: query the schema directly and print what
you actually created.

DONE WHEN
- npm run schema:check exits 0
- you have printed the resulting schema and confirmed it matches your intent
- docs/DATA-MODEL.md explains the decision and the rejected alternative
- B1 has what it needs: exact column names, types, nullability
- summary states the migration number, the decision, and what you did NOT do
```

---

# A3 — Front-door the browser CSP check in CI

```markdown
You are working in C:\Cline\ApexProject, task **A3: front-door the browser CSP
check in CI**.

READ FIRST:
1. AGENTS.md — the Traps table entries on execFileSync, server.close(), and
   proving a script ran
2. docs/CONVENTIONS.md
3. scripts/tests/check-csp-in-browser.mjs — the file this is about
4. .github/workflows/verify.yml
5. SECURITY.md

BACKGROUND
This check has NEVER run on ubuntu-latest. Locally it was skipped for weeks,
and when finally run it was two broken things at once: (a) not running at all,
because execFileSync with piped stdio deadlocks on Windows; (b) passing
VACUOUSLY, because it asserted on a string already in the static markup, so it
passed against a policy that blocked the entire site. Both fixed 2 Oct 2026.

YOUR WRITE-SET:
  .github/workflows/verify.yml
  package.json  (only if a script alias is genuinely missing)

READ-ONLY: scripts/tests/check-csp-in-browser.mjs, SECURITY.md, apps/website/**

WHAT TO DO
Ensure CI runs this step and that its failure cannot be skipped.
- The script exits 2 when no browser is found and 2 on timeout, loudly. On
  ubuntu-latest Chrome is preinstalled — confirm the step relies on that rather
  than assuming.
- A step that can exit 0 without having run is the exact failure this task
  exists to prevent. If the workflow can skip it, make it fail instead.
- Do NOT weaken assertions to get green. Wanting to relax the check is the
  signal that something is genuinely broken — report it.

THE MANDATORY NEGATIVE TEST
Copy dist/_headers, replace the script-src SHA-256 hash with a literal
nonce-{RANDOM}, run the check, show it FAILS with exit 1 and a message naming
the problem. Restore, show it passing. Paste all three runs.

Trap: "MidwayUSA" also appears inside the bundled JS data, so a naive string
replacement may silently not apply. Verify the file actually changed before
trusting the result — a negative test whose injection was eaten is worse than
none.

DONE WHEN
- the step is in verify.yml and cannot be silently skipped
- negative test run and observed failing; clean run passes
- summary includes all three runs verbatim
```

---

# B1 — Bullet diameter split

```markdown
You are working in C:\Cline\ApexProject, task **B1: bullet diameter split**.

READ FIRST:
1. AGENTS.md
2. docs/CONVENTIONS.md — especially §1 (never invent a value)
3. data/schemas/bullets.yaml — read the existing note on diameter_in
4. data/seeds/bullets/berger.csv — the shape of a real row
5. docs/OPEN-SOURCE-LANDSCAPE.md §2.3 — cross-reference sources
6. data/seeds/value_provenance.csv — it carries an `estimated` 0.308 diameter
   with a warning note you must re-label
7. scripts/tests/test-bullet-sources.mjs — parser invariants

BACKGROUND — THIS IS A LIVE CORRECTNESS DEFECT
bullets.diameter_in holds calibre DESIGNATIONS, not measurements. It reads
0.264 for a 6.5 mm bullet. A real 6.5 mm bullet is 0.256 in. Any drag, sectional
density or form-factor calculation reading that column is silently wrong.

BLOCKED ON: task A2's migration. Do not start until it lands.

YOUR WRITE-SET:
  data/seeds/bullets/*.csv
  data/schemas/bullets.yaml
  data/generated/** for YOUR datasets only
  (the migration itself is A2's — do not add one)

DO NOT TOUCH:
  packages/ballistics-core/src/** — this task must NOT change physics
  data/schemas/cartridge_specs.yaml, powders.yaml
  anything under apps/

REQUIREMENTS
- Split into caliber_designation (what it actually is) and bullet_dia_in (a real
  measurement, nullable). The sibling `caliber` column already exists — say in a
  comment how you handled the overlap and why.
- Part numbers are STRINGS. A leading zero is not cosmetic.
- Populate bullet_dia_in ONLY where a manufacturer datasheet or CIP/CIPM source
  states it. Everything else NULL. See CONVENTIONS §1: a blank is a visible gap,
  a wrong value is a silent lie that propagates into drag.
- Re-label the `estimated` provenance row in value_provenance.csv once real
  measurements exist. This is part of your task, not optional.
- Blank is null, never "".

THE MANDATORY NEGATIVE TEST
Show seed:check CATCHING a bullet row whose bullet_dia_in is a bare
designation like "6.5mm" instead of a number, or one that is out of physical
range. Paste the failing output. Then show the clean run passing.

Verify the artefact: print the parsed rows, not just the exit code.

DO NOT RUN `npm run data:build` unless the integrator has said the window is
open. It rewrites every dataset. Use `npm run seed:check` to validate your work.

DONE WHEN
- npm run seed:check and schema:check exit 0
- negative test run and observed failing
- you have printed the resulting rows and confirmed the split is correct
- summary states: rows added per manufacturer, how many diameters are NULL and
  why, and what you did NOT do
```

---

# B2 — `.45 ACP` and `.357 SIG` maximum pressures

```markdown
You are working in C:\Cline\ApexProject, task **B2: .45 ACP and .357 SIG maximum
pressures**.

READ FIRST:
1. AGENTS.md
2. docs/CONVENTIONS.md — §1 (never invent a value)
3. data/published/saami-z299.3-2022-centerfire-pistol-revolver.pdf — ON DISK AND
   UNREAD. This is your primary source.
4. data/published/manifest.json — how published documents are tracked
5. data/schemas/cartridge_specs.yaml — the column manifest
6. data/seeds/cartridge_specs/pistol.csv — a real row
7. data/seed/013_sourcing.sql is NOT relevant; the relevant schema is
   data/schema/009_cartridge_specs.sql (cartridge_pressure_references)
8. docs/OPEN-SOURCE-LANDSCAPE.md §2.3

BACKGROUND — WHY THIS IS SAFETY-CRITICAL
.45 ACP and .357 SIG chambers are dimensionally near-identical to 9mm. Selecting
the wrong one is a chambering error. We have confirmed SAAMI/CIP figures for
9mm (35,000/34,000 psi), 9mm+P (39,000), .40 S&W (35,000/33,000), 10mm
(38,000/34,000), .38 Spl (17,000/22,000) and .357 Mag (35,000/44,000). These two
are missing.

YOUR WRITE-SET:
  data/seeds/cartridge_specs/pistol.csv
  data/schemas/cartridge_specs.yaml  (only if a column must be described)
  data/generated/** for YOUR dataset only

DO NOT TOUCH: rifle.csv, shotgun.csv, any other manifest, apps/**, packages/**

REQUIREMENTS
- Read the Z299.3 PDF. Use `npm run probe:pdf <file.pdf>` — it extracts text with
  no dependencies. Do not transcribe from memory or from a third-party site.
- SAAMI and CIP DISAGREE MATERIALLY on some cartridges. Record BOTH, each in its
  own column, with `standard_body` set. NEVER average them, and never let one
  overwrite the other.
- If the PDF is illegible or ambiguous for a figure, leave the field NULL and
  note it. A made-up maximum pressure can injure someone.
- Every row needs `source_url` and provenance per CONVENTIONS §1. A row without
  a source is not data.
- Cross-check against the ammolytics/cartridges MIT dataset ONLY as a
  corroborating reference, never as a primary source — its contents are
  transcribed from SAAMI/CIP, so agreement with it is not independent evidence.

THE MANDATORY NEGATIVE TEST
Show seed:check CATCHING a pressure row that violates the unit enum, or one
where saami and cip were collapsed into a single averaged value. Paste the
failing output, then the clean run.

DO NOT run `npm run data:build` without the integrator's go-ahead.

DONE WHEN
- npm run seed:check exits 0
- both cartridges present with correct SAAMI and CIP figures, each sourced
- you have printed the rows and shown which PDF page each figure came from
- negative test run and observed failing
- summary states the figures found, their page numbers, and anything ambiguous
  you left NULL
```

---

# B3 — Load-recipe decision (and first rows)

**Longest lead time in §B. Start this first even though it finishes last.**

```markdown
You are working in C:\Cline\ApexProject, task **B3: load-recipe decision**.

READ FIRST:
1. AGENTS.md
2. docs/CONVENTIONS.md — §1 above all
3. docs/ROADMAP.md §1 — the "cite, do not reproduce" argument
4. docs/TODO.md §0.1 — the original framing
5. docs/DATA-MODEL.md — where the decision will be recorded
6. data/published/manifest.json — which manuals are archived and SHA-256'd
7. npm run probe:pdf — the tool for reading them

BACKGROUND
`recipes` is EMPTY. Every feature that justifies the project depends on it. This
is a content and licensing problem, not an engineering one, and no amount of code
fixes it. Nothing in the repo can decide it for you.

PART 1 — THE DECISION (do this first; it is the deliverable)
Record in docs/DATA-MODEL.md: the shape of a load-recipe row, and the licensing
reasoning. The recommended shape already exists in ROADMAP.md §1 — cite the
manual (recipe id, source, page, cartridge, bullet, powder, charge, velocity)
plus a free-text reproduction block, rather than reproducing copyrighted tables.
State why, and name the alternative you rejected. Verified 30 Sep 2026; say so
rather than re-arguing it.

PART 2 — THE TABLE
- data/seeds/load_recipes.csv + a manifest in data/schemas/
- A migration — COORDINATE FIRST. Migrations are serial (see A2). Report that you
  need one and wait, rather than adding it while another agent is mid-flight.
- Every row carries source_id AND a page number. A row without a page number is
  not data.
- NEVER invent a charge weight. If a manual page is illegible or a charge is
  ambiguous, leave the field blank and note it. A made-up load can injure someone.

Best first sources, already archived and hashed: SAAMI Z299.x, Hodgdon 2024,
Vihtavuori.

YOUR WRITE-SET:
  docs/DATA-MODEL.md  (the decision)
  data/schemas/load_recipes.yaml  (new)
  data/seeds/load_recipes.csv  (new)
  the migration, ONLY once serial access is confirmed

DO NOT TOUCH: existing seed CSVs, packages/**, apps/**, data/schema/011_*

THE MANDATORY NEGATIVE TEST
Show seed:check CATCHING a recipe row with no source_id, or with a charge weight
and no page number. Paste the failing output.

DONE WHEN
- the decision is written, with its reasoning and the rejected alternative
- the table and manifest exist and load
- negative test run and observed failing
- summary states: the decision, the row shape, how many rows you transcribed and
  from which pages, and how many you left blank and why
```

---

# B4 — Bullet coverage: Hornady and Sierra

```markdown
You are working in C:\Cline\ApexProject, task **B4: bullet coverage, Hornady and
Sierra**.

READ FIRST:
1. AGENTS.md
2. docs/CONVENTIONS.md — §1 (never invent a value) and §6 (real-row fixtures)
3. docs/SOURCE-SURVEY.md — READ THIS FIRST. It records which manufacturers
   publish HTML tables, PDFs, identity-only data, or nothing usable. Several
   publish nothing.
4. data/schemas/bullets.yaml — the column manifest
5. data/seeds/bullets/berger.csv — the shape of a real, complete row
6. scripts/data/import-bullets.mjs — the import pipeline
7. scripts/tests/test-bullet-sources.mjs — parser invariants
8. `npm run coverage` — current per-manufacturer status

BACKGROUND
120 bullet rows total: Berger 109, Hornady 7, Sierra 4. Hornady XTP is absent
entirely, which is conspicuous on a handloading site.

CONFLICT — READ THIS
Task B1 owns data/schemas/bullets.yaml and rewrites every file in
data/seeds/bullets/. Do NOT run concurrently. Either wait for B1, or do the
research and prepare your rows WITHOUT writing, then apply them after. Say in
your summary which you chose and why.

YOUR WRITE-SET:
  data/seeds/bullets/hornady.csv
  data/seeds/bullets/sierra.csv
  data/generated/** for YOUR dataset only

DO NOT TOUCH:
  data/schemas/bullets.yaml — B1 owns it. If it needs a new column, REPORT it.
  data/seeds/bullets/berger.csv
  packages/**, apps/**

REQUIREMENTS
- Use `npm run bullets:import -- <slug>` per manufacturer. The pipeline is
  proven; do not hand-write rows that the importer can produce.
- Bullet identity is (manufacturer_slug, part_number). NOT (name, weight) — the
  old key dropped 7 legitimate Berger bullets, because a 6.5 mm and a 7 mm
  140 gr VLD Target share a name and weight but are different projectiles.
- Part numbers are STRINGS. `065147` must not become `65147`.
- A manufacturer with no usable source is a legitimate "not started". **Do not
  invent rows to fill a coverage cell.** A blank means not known; a wrong bullet
  is a dangerous record.
- Every row needs a source_url. A row without one is not data.

THE MANDATORY NEGATIVE TEST
Show test:bullets CATCHING two rows with the same (slug, part_number), and
separately a row whose part_number lost a leading zero. Paste the failing
output, then the clean run.

Verify the artefact: print the row count before and after, and the distinct
manufacturers.

DO NOT run `npm run data:build` without the integrator's go-ahead.

DONE WHEN
- npm run test:bullets and seed:check exit 0
- `npm run coverage` shows the improvement you claimed
- negative test run and observed failing
- summary states rows added per manufacturer, which ones you left out and why,
  and confirmation you did not conflict with B1
```

---

# B5 — Powder geometry and burn-rate class

```markdown
You are working in C:\Cline\ApexProject, task **B5: powder geometry and
burn-rate class**.

READ FIRST:
1. AGENTS.md
2. docs/CONVENTIONS.md — §1 (never invent a value), §3 (provenance)
3. data/schemas/powders.yaml — the column manifest; read the notes on `geometry`
   and `burn_rate_class`
4. data/seeds/powders/accurate.csv and alliant.csv — real rows
5. data/research/powder_burn_rate/crossbrand_review.csv — read before touching
   burn rate
6. data/seeds/powder_burn_rate_positions.csv — positions are a SEPARATE dataset
7. packages/ballistics-core/src/provenance/constants.ts — SCALING_EXPONENT is
   `estimated` and depends on burn_rate_class

BACKGROUND
`geometry` (single/double/triple base) is empty on ALL 169 rows. It drives
load-density work and the is_double_base inference. `burn_rate_class` is 35%
populated and drives the barrel-scaling exponent, which is currently
`estimated` — so this data is load-bearing for ballistics accuracy.

YOUR WRITE-SET:
  data/seeds/powders/*.csv
  data/schemas/powders.yaml
  data/generated/** for YOUR datasets only

DO NOT TOUCH: bullets/**, cartridge_specs/**, packages/**, apps/**
(If you believe a physics constant must change because of this data, REPORT it —
do not edit packages/ballistics-core/src/provenance/constants.ts. A1 owns the
oracle and someone else must confirm the change.)

REQUIREMENTS
- Source geometry from manufacturer datasheets. A powder labelled "Varget" or
  similar on a can is NOT enough — that is a trade name, and inferring base type
  from it is a guess. Leave NULL when the datasheet does not state it.
- BURN-RATE POSITIONS ARE NOT COMPARABLE ACROSS BRANDS. Do not merge Vihtavuori
  and Hodgdon onto one scale. That constraint is already encoded in the manifest
  and the health output — read it and do not weaken it.
- `relative_burn_rate_position` is entirely empty on the powders table while a
  separate powder_burn_rate_positions dataset holds 22 rows. Say in a comment how
  these relate and whether the join is intended.
- Every physical constant per CONVENTIONS §3. Geometry is categorical, not a
  constant, so it does not need published() — but any numeric value you add does.

THE MANDATORY NEGATIVE TEST
Show seed:check CATCHING a geometry value outside its enum, and separately show
it CATCHING an attempt to place two brands on one burn-rate scale. Paste the
failing output, then the clean run.

DO NOT run `npm run data:build` without the integrator's go-ahead.

DONE WHEN
- npm run seed:check exits 0
- negative test run and observed failing
- you have printed how many rows gained geometry and how many remain NULL
- summary states: rows updated, how many left NULL and why, and anything that
  looks wrong in packages/ballistics-core that you did NOT touch
```

---

# C1 — YMYL trust signals — **DO NOT START: blocked on an owner decision**

```markdown
You are working in C:\Cline\ApexProject, task **C1: YMYL trust signals**.

STOP AND READ THIS FIRST
This task is BLOCKED pending an owner decision. Do not begin implementation. Your
first job is to write up the decision that is needed, then stop.

READ FIRST:
1. AGENTS.md
2. docs/CONVENTIONS.md
3. docs/AFFILIATE.md — the FTC section; the same reasoning applies to trust
4. apps/website/src/index.html — the current footer disclaimers
5. docs/SOURCES.md — how sources are cited elsewhere in this project

BACKGROUND
This is a YMYL site: it displays reloading cost data derived from powder charge
weights, on a page whose subject is ammunition. It has NO author, NO sources, NO
"reviewed by", and NO last-reviewed date anywhere. Reasonable reviewers — and
search engines applying E-E-A-T to safety content — expect those.

There is a footer safety disclaimer, and it is good. It is not the same thing: it
tells the reader to cross-reference a manual. It does not say who is responsible
for the content, or when it was last checked.

WHY IT IS NOT YOURS TO DECIDE
Naming an author is an accountability claim. You cannot invent a name,
qualifications, or a review date. Doing so would be a fabricated endorsement —
the exact defect just removed from the retailer directory (unsourced 4.9 star
ratings, "Verified" claims). It would be worse here, because the content is
safety-relevant.

WHAT TO PRODUCE
A short written brief for the owner containing:
1. What is missing today, with the current footer text quoted.
2. The options and the tradeoff of each:
   - named human author with stated reloading qualifications and a review date
   - organisational attribution with a contact and a "last reviewed" date
   - explicit "reference tool, not instruction" framing with no author
3. Your recommendation and why.
4. An implementation sketch for the chosen option: which files change, the markup,
   and how it would be gated so it cannot silently disappear.

YOUR WRITE-SET: a new document under docs/ describing the decision needed.
DO NOT TOUCH apps/website/** — that is the implementation, and it is blocked.

DONE WHEN
- the brief exists and names a specific decision with options
- you have NOT made the decision and have NOT edited any site file
- your summary states the options, your recommendation, and that you stopped
```

---

# C2 — Accessibility pass

```markdown
You are working in C:\Cline\ApexProject, task **C2: accessibility pass**.

READ FIRST:
1. AGENTS.md
2. docs/CONVENTIONS.md — §5 (security, which overlaps a11y here) and §4 (comments)
3. apps/website/src/dom.js — the reference for building DOM safely
4. apps/website/src/main.js — the calculator and retailer renderers
5. apps/website/src/index.html — current structure
6. scripts/gates/check-claims.mjs — the accessibility FLOOR already enforced
7. apps/website/src/styles/theme.css — the colour tokens

BACKGROUND
A compliance pass on 2 Oct 2026 fixed the objective failures: 5 inputs had visual
<span> text that is not a label (WCAG 4.1.2), there was no skip link despite a
sticky full-width nav (2.4.1), and there was no meta description. `claims:check`
now gates that floor. What remains needs judgement and a real screen-reader pass,
which no regex gate can certify.

YOUR WRITE-SET:
  apps/website/src/index.html
  apps/website/src/main.js
  apps/website/src/styles/theme.css
  scripts/gates/check-claims.mjs  (ONLY to strengthen the floor)

MUST RUN AFTER: `npm run website:build` then
`npm run handoff:accept -- --note="..."`
You are changing the main app deliberately. `handoff:status` inside verify will
otherwise fail you — that is the system working, not a bug.

SECURITY — NON-NEGOTIABLE
- Never build DOM with innerHTML. Use el(), icon(), safeUrl() from dom.js.
  apps/website/src/data/retailers.js is injected into the page; any new field you
  render from it must go through a DOM node. A single innerHTML reverts the XSS
  hardening that was put in deliberately.
- If you change a colour, verify the contrast ratio against its actual
  background. Do not eyeball it.
- The claim gate must keep passing. If you find a way to satisfy the gate without
  satisfying a real user, that is a bug in the gate — fix the gate.

WORK TO DO
- Keyboard: every interactive element reachable and visibly focused. Check focus
  is not clipped by the sticky header — a real and commonly missed failure.
- Contrast for text, icons, and the affiliate disclosure banner.
- Dynamic content (retailer grid, calculator output) must announce changes.
  Consider aria-live where output changes without a page load.
- Touch target sizes; the disclosure readable at 200% zoom.

THE MANDATORY NEGATIVE TEST
Break one thing deliberately — remove a label, or set focus styling to none — and
show the gate FAILS. Then restore it.

DONE WHEN
- npm run verify exits 0 INCLUDING claims:check and website:csp:browser
- keyboard-only traversal done and recorded
- ONE real screen-reader pass done and recorded
- `npm run handoff:accept` run with a --note
- summary states every issue found, every fix, what you could NOT verify without
  real assistive technology, and anything left
```

---

# C3 — Verify affiliate network parameters

```markdown
You are working in C:\Cline\ApexProject, task **C3: verify affiliate network
parameters**.

BLOCKED ON: an approved affiliate account. Without dashboard access, STOP and
report. Do not guess.

READ FIRST:
1. AGENTS.md
2. docs/CONVENTIONS.md — §1 (never invent a value) applies to a parameter name
   exactly as it applies to a pressure
3. docs/AFFILIATE.md — the whole file
4. scripts/shared/affiliate-links.mjs — the NETWORK_TAG_PARAM table
5. scripts/tests/test-affiliate-links.mjs — the existing 13 tests
6. data/seeds/sourcing_retailers.csv — which retailers, which networks

BACKGROUND
NETWORK_TAG_PARAM holds avantlinkuid, irclickid, aovmt, aid, cjevent. On 2 Oct
2026 its comment was corrected to stop claiming the values came from official
documentation. They are the CONVENTIONAL names, NOT verified against primary
sources.

The failure is silent and expensive: a wrong parameter produces a URL that loads
perfectly, looks correct in every log and on every page, and earns nothing. You
would not discover it from the site — you would discover it from a commission
report months later, and by then the traffic is gone.

YOUR WRITE-SET:
  scripts/shared/affiliate-links.mjs
  scripts/tests/test-affiliate-links.mjs

DO NOT TOUCH: apps/**, data/seeds/**. If the finding changes docs/AFFILIATE.md,
REPORT that instead of editing it.

WHAT TO DO
For each network you hold an account with:
1. Open the dashboard. Most show a sample tagged link with the exact parameter
   key. Use that, not a search engine result.
2. Record what it says and the date you looked.
3. If it matches, say so. If not, correct the table and add a test case.
4. Update the provenance comment to state what you verified and when. Be precise
   about the difference between "the dashboard showed a sample link" and "I read
   the affiliate-parameter documentation" — different claims.

NETWORKS YOU DO NOT HOLD
Leave them as they are and mark them unverified in the comment. Do NOT delete
them: they document the convention, and the module already refuses to tag an
unknown network, so an unverified entry is inert.

DO NOT WEAKEN THE SAFETY PROPERTY
Tags are appended only when BOTH affiliate_network AND network_store_id are
present. Every retailer has network_store_id = NULL today, so every link is clean
and untagged. That is what stops a link being tagged with a placeholder ID. Keep
it. The test "does NOT tag when the store id is missing" matters most — do not
touch it.

THE MANDATORY NEGATIVE TEST
Confirm the existing negative tests still pass: `npm run test:affiliate` must
include, and pass, the three asserting NO tagging when the store id or network is
missing. Paste the run.

DONE WHEN
- each held network is verified (with date and source) or explicitly unverified
- the comment states provenance honestly, at the level actually established
- npm run test:affiliate exits 0 with all negative tests intact
- summary states per network: verified or unverified, the source, the date, and
  any value you changed
```

---

# C4 — Apply to the affiliate networks

```markdown
You are working in C:\Cline\ApexProject, task **C4: apply to affiliate networks**.

BLOCKED ON THE OWNER. You cannot submit an application on someone's behalf: it
needs a bank account, a tax form, and a live site. Your job is to prepare
everything that does NOT require those, and hand the owner a precise checklist.

READ FIRST:
1. AGENTS.md
2. docs/CONVENTIONS.md
3. docs/AFFILIATE.md — the whole file, especially "What the network will check
   before approving you" and "Two things the seed data refuses to guess"
4. data/seeds/sourcing_retailers.csv
5. data/schema/016_affiliate_outreach.sql — the tracker table
6. `npm run affiliate:status` — current state

BACKGROUND
Zero of eight retailers are applied to. Every link the site emits is clean and
untagged, so nothing earns. AvantLink is the dominant network in this category.

WHAT WAS ACTUALLY WRONG WITH THE APPLICATION
The site used to display unsourced 4.9 star ratings, "Verified Shipping Partner",
"Verified Suppliers", superlative badges, and "30-60% Avg Handload Savings" — all
fabricated. That is precisely what network reviewers reject, and under
16 CFR 255.2(b) it was unsupportable regardless of disclosure. It was removed on
2 Oct 2026 and `npm run claims:check` now keeps it out. **Say this in the
application** — it is a strength, not a secret.

YOUR WRITE-SET:
  data/seeds/sourcing_retailers.csv  (network, rate, dates, application_url)
  the affiliate_outreach records for the retailers you prepare

DO NOT TOUCH: apps/**, scripts/shared/affiliate-links.mjs, any other seed CSV

RULES — THESE ARE THE POINT OF THE TASK
- `commission_rate_pct` STAYS NULL until read off the network's own directory. A
  blank rate gets looked up; a wrong one gets used.
- Record `terms_verified_on` for anything you fill in, so a stale number is
  visible as stale rather than presented as current.
- Ammunition eligibility varies: some programs exclude it, some pay a reduced
  rate, some exclude it during promotional windows. Record what the directory
  actually says.
- Brownells is listed on more than one network. Natchez migrated off AvantLink. A
  network taken from a stale third-party summary is a number that looks right and
  does nothing. Verify against the network's own directory.
- Fill in `pitch_notes` BEFORE the email is sent. Retailers approve outreach that
  argued a specific case; they decline "please add me to your list".

DELIVER
1. A per-retailer table: network, application URL, commission rate (or NULL),
   cookie window, terms_verified_on, ammunition eligibility.
2. `npm run affiliate:status` output showing the state.
3. A one-page checklist for the owner: what to click, what to provide, and the
   age-verification attestation most firearms programs require.

DONE WHEN
- every row you filled in has a source you can name and a date
- no guessed rate is recorded anywhere
- `npm run affiliate:status` reflects the research
- summary states per retailer: network, eligibility, what remains NULL and why,
  and the owner's remaining steps
```

---

# D1 — Reconcile every stale count

**Strictly serial. Run after §A and §B have landed.**

```markdown
You are working in C:\Cline\ApexProject, task **D1: reconcile stale counts**.

READ FIRST:
1. AGENTS.md
2. docs/CONVENTIONS.md
3. AGENTS.md's "Before you do anything" and "Current state" sections
4. README.md, HANDOFF.md, docs/TASK-LIST.md, docs/DATA-TODO.md
5. package.json — the actual verify chain

BACKGROUND — WHY THIS IS A PREREQUISITE, NOT COSMETIC
The docs disagree with each other and with reality:
  TASK-LIST.md  says 9 verify stages
  DATA-TODO.md  says 10
  AGENTS.md     says 11 and "~215 tests"
  README.md     says 215 passing
  ACTUAL        235 tests (2 Oct 2026)
Every §A/§B prompt states its own measured number rather than citing the docs
precisely because an agent reading a stale figure will mis-plan.

YOUR WRITE-SET:
  AGENTS.md, README.md, HANDOFF.md, docs/TASK-LIST.md, docs/DATA-TODO.md
  and any other doc quoting a stage or test count you find

DO NOT TOUCH: source files, data, scripts. This is a documentation task.

METHOD
- MEASURE first: run `npm run verify` and count the stages and tests yourself.
  Do not copy any number from any document, including this prompt. The count will
  have moved if A1 added a stage.
- Fix every stale count, not just the four named above. Search the docs.
- Where a number will go stale again, replace it with the COMMAND that produces
  the live value. AGENTS.md already uses that pattern — apply it consistently.
- Leave TASK-LIST.md's reasoning intact. It is stale on numbers and correct on
  why. Annotate the numbers; do not delete the reasoning.
- Add docs/CONVENTIONS.md and docs/AGENT-PROMPTS.md to any index listing the
  other docs, so an agent finds them.

DONE WHEN
- no document quotes a count that disagrees with a fresh measurement
- docs:check exits 0
- summary states the measured numbers and every file you changed
```

---

# D2 — Logical commit split

**Strictly serial. Run after every other task has landed.**

```markdown
You are working in C:\Cline\ApexProject, task **D2: logical commit split**.

READ FIRST:
1. AGENTS.md
2. docs/CONVENTIONS.md
3. docs/PARALLEL-WORK-PLAN.md §D2
4. `git status` and `git diff --stat` for the actual state

BACKGROUND
195 changed files (156 tracked, 39 untracked) with no logical grouping. One
commit makes the history useless and makes any revert all-or-nothing.

YOUR WRITE-SET: the git index ONLY. Do not edit any file's contents.

Suggested order, each a commit that leaves `npm run verify` green:
1. Remote-history rescue (archive/**)
2. Deploy-path fix (wrangler.toml + the gate that enforces it)
3. CSP browser-check fix (spawn, closeAllConnections, real proof-of-execution)
4. Claims/compliance pass + claims:check
5. Data corrections (pressure primary keys, regenerated data)
6. Documentation and governance

CRITICAL RULES
- Never `git add -A` across chunks. Stage explicit paths per commit.
- `npm run verify` must exit 0 BEFORE each commit. If a commit would need code
  from a later commit to pass, reorder or merge it — do not commit a broken state.
- Do NOT rewrite or squash existing history. These are new commits on top.
- If a file belongs to two commits, put it in the LATER one, where it makes the
  earlier commit coherent.
- data/generated/** is regenerated as a whole. It belongs in whichever commit
  changes the seeds that produce it — and nowhere else.

VERIFY BEFORE YOU FINISH
`git log --oneline -8` and confirm the split reads as a coherent history. Then
confirm nothing you meant to commit is still unstaged. Report anything you
deliberately left out and why.

DONE WHEN
- the history reads as the six logical changes
- every commit individually passed npm run verify
- summary lists the commits, what each contains, and what you left uncommitted
```

---

# D3 — Push a review branch, confirm CI, merge

```markdown
You are working in C:\Cline\ApexProject, task **D3: push a review branch,
confirm CI, then merge**.

BLOCKED ON: D2 complete, and A3 complete (the browser CSP check must have
actually run on ubuntu-latest at least once).

READ FIRST:
1. AGENTS.md
2. docs/CONVENTIONS.md
3. .github/workflows/verify.yml
4. docs/PARALLEL-WORK-PLAN.md §D3

SEQUENCE
1. Push a BRANCH. Not main. Never push directly to main.
2. Watch the GitHub Actions run to completion. Do not merge on assumption.
3. Confirm specifically that the browser CSP step RAN and PASSED. It has never
   executed on the runner, and a step that silently skips is the exact failure
   this task exists to prevent. Check the step list, not just the green tick.
4. Only then merge.

IF CI FAILS
Fix it. Do not weaken a gate to get green — a gate that has to be relaxed to
accept a change is telling you something true. Report what it caught.

IF THE CSP STEP DOES NOT APPEAR
Stop. That is A3's failure, not something to work around here.

YOUR WRITE-SET: git remote operations only. DO NOT TOUCH file contents.

DONE WHEN
- the branch is pushed and CI ran to completion
- you have pasted the CI step list showing the CSP check running and passing
- merged to main only after that
- summary states the branch, the CI run URL, the step list, and the merge result
```

---

# D4 — Cloudflare deploy

```markdown
You are working in C:\Cline\ApexProject, task **D4: Cloudflare deploy**.

BLOCKED ON: owner credentials, and D3 merged. Do not deploy before both.

READ FIRST:
1. AGENTS.md
2. docs/CONVENTIONS.md
3. wrangler.toml — read the comments; they explain why the path is what it is
4. docs/PARALLEL-WORK-PLAN.md §D4
5. docs/DATA-TODO.md §0.2c

BACKGROUND
wrangler.toml `database_id` is still REPLACE_WITH_YOUR_D1_DATABASE_ID. **No
deploy can succeed until that is a real ID.** That is owner credentials, not a
code change.

A PRIOR BUG WORTH KNOWING
`pages_build_output_dir` was "dist" — a root directory that does not exist and
never did. The build emits apps/website/dist/. That shape of mistake is the worst
kind: `wrangler pages deploy` on a missing output directory does not fail loudly,
it publishes nothing, and the site simply 404s with no error in the logs. It is
now corrected AND gated by npm run website:check, which asserts the deploy path
matches the real build output. Do not remove that assertion.

PRE-FLIGHT
1. `npm run verify` exits 0.
2. `npm run website:build` succeeds.
3. `npm run website:check` confirms the deploy path matches the build output.
4. `database_id` is a real ID, not the placeholder.
5. Confirm you are deploying to the intended environment. A production deploy is
   not reversible by re-running it.

VERIFY AFTER DEPLOYING
- the page loads, and it is the calculator — not a 404, not a directory listing
- the calculator computes
- the retailer directory renders
- fonts and styles load, and there are NO CSP violations in the console
- the affiliate disclosure is visible ABOVE the retailer grid

That last one is an FTC requirement, not a nicety. It is gated locally by
claims:check; confirm it survived the deploy.

YOUR WRITE-SET: deploy commands and owner credentials only.
DO NOT TOUCH file contents unless a deploy genuinely requires it — and if so,
stop and report first.

DONE WHEN
- the live site serves correctly and the console is clean
- you have pasted evidence of each pre-flight check
- summary states the deployment, the URL, each post-deploy verification with its
  result, and anything that did not behave as expected
```

---

## Running several of these at once

**Safe to run in parallel** — disjoint write-sets:
**A1, A3, B2, B5, C2, C4**

**Serial, in this order:**
- `A2 → B1` (migration, then the CSV work that depends on it)
- `A2 → B3` (also needs a migration; coordinate for serial access)
- `B1 → B4` (B1 owns `bullets.yaml` and rewrites the same CSVs)

**Do not start:**
- **C1** — blocked on an owner decision about authorship
- **C3** — needs an approved affiliate account
- **D1–D4** — need the others finished

**Rule for every one:** one agent runs `npm run data:build` at a time. Everyone
else validates with `npm run seed:check`, which does not write to
`data/generated/`.

Before launching anyone, confirm `npm run verify` exits 0. A red baseline
invalidates every "done when" in this document.
