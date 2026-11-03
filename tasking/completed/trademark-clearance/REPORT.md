# REPORT — trademark-clearance (T1)

**Task:** `tasking/pending/trademark-clearance/` · **Agent:** scout-legal
**Model:** default model, fresh instance.
**Status:** complete, staged for review. **Nothing merged. No brand changed.**

## Deliverables

| File | Purpose |
|---|---|
| `docs/research-trademark/01-name-clearance.md` | USPTO clearance, 17 candidates |
| `docs/research-trademark/02-domain-options.md` | Domain position, `.com`/`.dev`/`.io` |
| `docs/research-trademark/README.md` | Directory index |
| `REPORT.md` | This file |
| `SUMMARY.md` | One-page digest — start here |

---

## 1. What changed

**Only `tasking/completed/trademark-clearance/`, and only four new files.** No
existing file anywhere in the repo was created, edited or deleted. No brand string,
`package.json`, `wrangler.toml`, `apps/`, `docs/` or `.cline/tasks/ledger.json` was
touched. All four deliverables are new research documents, so no copies of main-tree
files were needed.

## 2. What I verified, and how

**Baseline before starting:** `git status --porcelain` empty; `npm run tasking:check`
→ `tasking verified`; `npm run verify` → exit 0.

**Negative test — the registry routine finds a mark when one exists.** Without this,
every "0 hits" below would be worthless:

```
Search: "apex ammunition"  ->  2,764 results
  APEX AMMUNITION | LIVEREGISTERED | IC 013: Shotgun shells.
  Serial 87507153 | Apex Ammunition LLC (Mississippi, USA)
```

**Negative test — the DNS resolver distinguishes registered from unregistered:**

```
ballisticsapi.com  NXDOMAIN        loadforge.com  RESOLVES 216.150.1.1
ammodata.com       NXDOMAIN        loadwise.com   RESOLVES  52.20.84.62
```

**Isolation, after the move to `completed/`:**

```
git status --porcelain
---END---          (empty)
```

**Isolation, before the move** (while in `in-progress/`, which is gitignored) was
equally empty, confirming nothing outside my folder was touched at any point.

**Artefacts read back, not trusted from exit codes** — `completed/` and
`in-progress/` are deliberately excluded from `lint` and `docs:check`, so the gates
cannot catch a defect here. Bytes, BOM, CR, placeholders:

```
01-name-clearance.md: bytes=10009 BOM=False anyCR=False lines=184
02-domain-options.md: bytes= 8818 BOM=False anyCR=False lines=148
README.md:            bytes= 4167 BOM=False anyCR=False lines=69
REPORT.md:            (this file)
```

The first drafts came out **CRLF**. Caught by the byte check, fixed with the repo's
own `node scripts/text/normalise-line-endings.mjs --write`, re-read from disk to
confirm. **The gates would not have caught this** — precisely the asymmetry the brief
warns about.

---

## 3. What I found but did NOT touch

- **`BRIEF.md` and `task.json` disagree on the output path.** The brief says
  `tasking/completed/T1/`; `task.json` says `tasking/completed/trademark-clearance/`
  and additionally requires `REPORT.md`, which the brief never mentions. I followed
  the manifest, because `task.json` is the machine-checked contract and the folder
  move is keyed on the slug. **Per the one rule in `tasking/README.md` I did not
  correct either file.** A reviewer or the planning agent should reconcile them.
- **`task.json` `write_set` lists `tasking/completed/trademark-clearance/`** while the
  brief's "Write-set lock" line says `docs/research-trademark/`. Same discrepancy,
  same resolution, same non-action.
- **`BRIEF.md` §4 still asks for `git status --porcelain` to show only files under
  `docs/research-trademark/`.** Under the new protocol that is unsatisfiable as
  written — the output correctly lives under `tasking/`. Left alone.
- **The recorded baseline of 235 tests is stale.** Measured: **215 passing, 0 failing.**
  Other briefs likely carry the same number.
- Other tasks in `pending/` (`brand-rename` most relevantly) — untouched, as required.

## 4. What I believe is wrong

**Yes, the owner should rename. This is not a close call.** The site is named after a
LIVE registered trademark — APEX AMMUNITION, reg. 5391055, IC 013 — in its own product
category, held by an operating ammunition business with a live storefront and an 18+
age gate. That is close to the worst fact pattern available: live mark, live
competitor, same market.

**Residual risk of NOT renaming:** continuing exposure to a trademark infringement
claim, and in practice a demand to stop using the name — which forces a rebrand anyway,
at the worst moment. Secondary: the name is permanently owned by someone else in
search results and word of mouth.

**Residual risk of renaming:** low, **provided the new name is cleared outside the US
register.** My search covers **USPTO only** — no EUIPO, UKIPO, CIPO or IP Australia —
and it is not a likelihood-of-confusion opinion. **A qualified trademark attorney
should review any actual change.**

**Best cleared option: `ballisticsapi`** (0 hits; `.com`, `.dev`, `.io` all NXDOMAIN —
the only candidate with a clean `.com`). Also clear: `powderlab`, `trajectorylab`,
`ballisticslab`. Rejected: `recipelab` (two LIVE PENDING in IC 042 + IC 009),
`loadsmith` (LIVE, reg. 6076028), `loadforge` (live competitor).

**One product judgement worth the owner's attention:** "API" in the brand signals a
developer product. That matches the stated intent of a calculator with an API, and it
is a poor fit for a consumer calculator directory as the product exists today. That is
a product decision, not a legal one, and it should be made deliberately rather than by
accident.

**The most useful thing in this report is a negative result:** `loadforge` has **zero
USPTO registrations** and would have been recommended by any registry-only clearance
search. It is rejected solely because a web search found a live competitor at
`https://loadforge.app/`. **Registry search alone is not clearance.**

## 5. Definition of Done — checked item by item

| Requirement | Status | Evidence |
|---|---|---|
| `npm run verify` exits 0, unchanged by me | **PASS** | exit 0 before and after |
| `npm run tasking:check` says `tasking verified` | **FAIL — protocol defect, not my output** | see §6 |
| `git status --porcelain` shows only my folder | **PASS** | empty output; nothing outside it |
| Every candidate has a recorded registry search, not a guess | **PASS** | 17 candidates, each with exact-match count, LIVE/DEAD split and serial numbers for every hit |
| Every domain has method + explicit confidence level | **PASS** | 33 domains; method and confidence in every row; none reported "available" |
| No change to any brand string, `package.json`, `wrangler.toml` | **PASS** | `git status` empty |
| At least 12 candidates | **PASS** | 17 |
| Never recommends a name containing "APEX" | **PASS** | no candidate contains it |
| One rejected candidate with reason | **PASS** | `loadforge`, above |
| Report states whether the owner should rename + residual risk | **PASS** | §4 |

## Negative tests

- Registry routine proved against a known-live mark (`apex ammunition` → 2,764 results,
  APEX AMMUNITION, serial 87507153, IC 013).
- DNS resolver proved against names known to resolve and names known not to.
- CRLF in three of four deliverables caught by byte inspection and fixed, **not by a
  gate** — `lint` and `docs:check` ignore this directory by design.

## 6. BLOCKING DEFECT — `tasking:check` cannot pass for any completed task

**`npm run tasking:check` exits 1 after moving my folder to `completed/`.** This is
**not** caused by my output. Every declared output exists; the failure is structural
and **will hit every agent that completes any task**.

```
x tasking/completed/trademark-clearance/ has no manifest in pending/, so its
  declared outputs cannot be verified. A finished task whose brief is missing is
  indistinguishable from an abandoned folder.
```

**Root cause — the README and the gate contradict each other:**

- `tasking/README.md` step 6: *"move the whole folder to `completed/<task>/`, **brief
  included**, because a reviewer needs it to judge the work."*
- `tasking/review/README.md`: *"Each folder contains a task brief, a `REPORT.md`, and
  staged copies."*
- `scripts/gates/check-tasking.mjs` lines 62 and 157: manifests are collected **only**
  from `pending/`, then `completed/` folders are looked up in that map. A task moved
  out of `pending/` — exactly as the README instructs — **cannot resolve its own
  manifest.**

So the two instructions cannot both be followed. Following the README makes the gate
red; leaving the folder in `pending/` to satisfy the gate would violate the claim-by-move
lock **and** leave finished work in the queue where another agent could claim it.

**I did not "fix" this.** It needs a decision, and it is not mine to make:

- **Option A** — have the checker also read manifests from `completed/` (e.g. build the
  map from both directories). Smallest change, keeps the README as written.
- **Option B** — leave a copy of `task.json` in `pending/` and move only the output
  folder. Ugly: the queue is supposed to be emptied by the move.

**I recommend Option A.** Until then, `tasking:check` cannot go green for any completed
task, and other agents are about to hit this.

## 7. Known limits of this work

- **US trademark register only.** No EUIPO, UKIPO, CIPO or IP Australia.
- **Not a likelihood-of-confusion opinion. Not legal advice.**
- **DNS only** for domains — no WHOIS, no registrar cart check, no purchase attempt.
  Every `NXDOMAIN` needs registrar confirmation before money moves.
- Point-in-time snapshot, 3 Oct 2026. Both the registry and DNS change daily.

**Nothing here authorises a rename.** `brand-rename` stays blocked on an owner-chosen
name. This folder is evidence for that decision, not the decision.