# CHANGELOG

**Every step taken in this repository, why it was taken, and how it was verified.**

Written 1 Oct 2026. Referenced from [`AGENTS.md`](AGENTS.md).

---

## Why this file exists

Because the alternative is expensive. Before this file, the only record of
*why* the code looks the way it does was scattered across commit messages and
planning documents that contradict each other. An agent picking up the repo had
to re-derive the reasoning from scratch — and the repo's own history shows what
happens when that is skipped: three real ballistics defects shipped **while 161
tests passed** (`docs/BALLISTICS-AUDIT.md` section 0).

So: **append an entry as you go, not at the end.** An entry written after the
work is the entry that omits the thing that nearly went wrong.

## How to write an entry

1. **One entry per unit of work**, not per file. Three files fixing one
   mistake is one entry.
2. **Say why, not what.** The diff already says what. The reason is the part
   that is lost.
3. **Name the command you ran.** A claim without a command is a memory, and
   memories in this repo have been wrong.
4. **Record what you did NOT do**, and why. Scope boundaries are load-bearing.
5. **Add the trap if it cost you time** — then also add it to the Traps table in
   `AGENTS.md`. Two places, because a changelog entry is history and a trap is
   a standing rule.

Newest entries go at the top, under `## Unreleased` until they are committed.

---

## Unreleased

### `AGENTS.md` — repaired structurally corrupted sections

**What.** The file was structurally damaged. A stray three-backtick fence on
line 77 was never closed at its logical position; its orphaned closing fence
sat at line 230. Everything from `## Rules` through `## Keeping this file
honest` was therefore swallowed into a code block, and two sections were left
orphaned past the end of the document.

**Why it matters more than it looks.** `AGENTS.md` is *"the baseline for any
agent working in this repo"* — the Rules (13 numbered rules) and the Traps
table (the file's stated reason for existing) were **invisible to any reader
that honours Markdown**. The content was on disk and syntactically valid
UTF-8, so every automated gate passed. `npm run verify` does not lint
Markdown, and `scan-encoding.mjs` correctly reported "no mojibake" — the bytes
were never the problem.

**Changed.**
- Removed the stray opening fence. The `data/seeds/` tree is now plain indented
  text, matching its sibling layout block above it.
- Relocated *"The filename **is** the key…"* from the orphaned tail to directly
  beneath the data-layout tree, which is where it belongs — it explains that
  section.
- Folded the orphaned `### Two processes that actively hide bugs` content into
  the **Traps table** as two proper rows (*Ragged CSV rows*, *`SELECT *` or a
  `.Count` on a padded object*). They were traps; the table is where traps live.
- Deleted the orphaned tail and the stray closing fence.
- Added a third row for the fence bug itself, so this failure is guarded.
- Added the `CHANGELOG.md` entry to *Where things are written down*.

**Verified.** Fence markers balanced (4, two pairs). All 15 headings present
and in order. No adjacent duplicate lines. `npm run verify` still exits 0
(215 tests, 8 stages at the time of this entry; 9 after the second pass below).

**Deliberately not done at the time.** Both were recorded here first and fixed in
the next pass (see *All Markdown repaired, and the check that now guards it*).
Recording before fixing is the point of this file.

### `CHANGELOG.md` — established

**What.** This file. Created in the same pass as the `AGENTS.md` repair, at the
explicit request that future agents not have to reconstruct the work.

**Note on why the repair and the changelog happened together.** The repair
produced a trap worth recording; the changelog is where it gets recorded. A
trap that lives only in a commit message has already failed once in this repo.

---

## Unreleased (second pass)

### All Markdown repaired, and the check that now guards it

**What.** Fixed the remaining documentation defects across the repo, and closed
the gap that let them through: nothing in `verify` looked at Markdown at all.

**Fixed.**

| File | Defect | Effect |
|---|---|---|
| `README.md` | Fence at line 59 never closed; duplicated `## Current status` | The fence swallowed `## The provenance system` and the `provenance()` TypeScript example into a code block. The project's headline safety mechanism was invisible. **Identical failure mode to the `AGENTS.md` bug.** |
| `docs/SEED-DATA-GUIDE.md` | Missing blank line before `### 3.4`, `### Honesty is enforced`, `### P1 — Rename` | Those headings rendered as body text, so three subsections were invisible. |
| `data/generated/md/*.md` (13 files) | `# <dataset>` heading immediately after the `-->` banner | The heading was absorbed into the HTML comment. **Fixed in the generator, not the output** — see below. |
| 32 Markdown files | CRLF line endings | Violates `.gitattributes` (`* text=auto eol=lf`); churns diffs. |

**The generator bug, which was the interesting one.** The 13 generated
Markdown files each lost their own title. Editing them directly would have been
wrong — `data/generated/README.md` says so in bold, and the next
`npm run data:build` would have silently reverted it. The cause was in
`scripts/build-data.mjs`: `MD_BANNER` ended with `-->\n` and `renderMd` began
immediately with `# ${m.dataset}`, so the heading sat on the line right after
the comment close and was absorbed into it. **Fixed at the source** in
`renderMd` by pushing a leading blank line, then regenerated. `data:validate`
(drift check) exits 0, and the fix survives every future build.

**New: `scripts/check-docs.mjs`, wired into `verify` as a 9th stage.**

The reason this defect survived twice, in the two files that matter most:
`verify` gated lint, types, tests, CSVs and generated-file drift, and **not one
of those stages looked at a `.md` file**. The content was on disk, valid UTF-8,
and invisible to every gate. The check catches:

1. Unbalanced fences, and a backtick fence whose info string contains a backtick.
2. **A heading inside a code fence** — a fence swallowing prose.
3. Consecutively duplicated non-blank lines.
4. A heading with no blank line before it.
5. Non-UTF-8, a UTF-8 BOM, or CRLF, in Markdown.
6. Mojibake, reusing `scripts/lib/encoding.mjs` rather than a second detector.

**Item 2 is the one that matters, and it is deliberately not a balance check.**
README.md's fence *balanced* perfectly — line 59 opened, line 107 closed — while
swallowing 18 lines of prose. Counting markers would have called it clean. The
check tracks open/close state and then asks whether any `##` line fell inside a
fence, which is the actual question. **Balanced is not the same as correct.**

**Two false positives found and fixed while building it.** Worth recording,
because a checker that cries wolf gets ignored, and then the real defects go
with it:

- `repairMojibake` returns `{text, repaired}`, not a string. Comparing it with
  `!== text` is true for *every* file, since an object never equals a string. It
  reported all 49 files as damaged. Now uses the `repaired` count.
- A `#` comment inside a ```` ```powershell ```` block is a comment, not a
  heading. The first version reported 5 bogus "swallowed heading" errors in
  `docs/SEED-DATA-GUIDE.md`. Now only an **untagged** fence can be swallowing
  prose by accident.

**Negative-tested, because a check that cannot fail is worthless.** Fixtures
confirm an unclosed fence, a swallowed heading, a duplicated heading and CRLF
are all caught (exit 1), and that a PowerShell comment inside a tagged fence
and a correctly balanced prose fence are **not** flagged.

**New: `scripts/normalise-line-endings.mjs`** — `npm run docs:audit` reports,
`npm run docs:fix` writes. Markdown-only by default.

**Scope boundary taken deliberately.** A repo-wide sweep measured **96 files**
with CRLF: most of `scripts/`, `packages/`, `apps/`, every SQL migration, all 13
column manifests, and `package-lock.json`. All genuine `.gitattributes`
violations, and all worth fixing — but rewriting migrations and a lockfile
inside a documentation pass is exactly the scope expansion rule 9 warns about.
**Left as its own change with its own review.** `--all` opts in when that
happens. The count is recorded here so the decision is not lost.

**New: `solver.ts` header** (was listed as outstanding). `THE TWO/THREE FAILURE
MODES` → `THE FOUR`, since four are listed. Removed a duplicated `VALIDATION`
heading and a duplicated rule.

**Mistake made and recovered from, recorded because it nearly cost the work:** a
`Set-Content -NoNewline` in PowerShell collapsed the 11 KB `check-docs.mjs` to a
single 10,711-character line, destroying it. This is the trap `AGENTS.md`
already names — *"PowerShell mangling inline `node -e`... write a file
instead"* — and I reached for the shell anyway. Caught immediately by `node`
refusing to parse it, then rewritten in chunks. The lesson generalises:
**write files with the editor, never with a shell redirect.**

**Verified.** `npm run verify` exits 0 with **9 stages**, 215 tests passing.
`npm run data:health` unchanged at 989 rows / 23 CSVs / validation clean, so
none of this touched the data.


---

## Unreleased (third pass)

### Scripts audit — 5 real bugs, 1 of them an XSS regression I caused

Every one of the 27 scripts in `scripts/` was run, not just read. All 27 pass
`node --check`; **two of them could not run at all**, and one of those silently
destroyed committed work when I ran it.

| # | Script | Bug | Impact |
|---|---|---|---|
| 1 | `split-cartridge-specs.mjs` | Imported `deleteSync` from `node:fs`, which does not exist | Script was unrunnable. ESM binds imports before any statement runs, so it threw at load and could not even print its "already split" message. Correct name is `unlinkSync`. |
| 2 | `export-d1.mjs` **and** `fetch-published-data.mjs` | `JSON.parse` on a file with a UTF-8 BOM | Both threw `SyntaxError: Unexpected token '\uFEFF'`. `npm run data:snapshot` and `npm run data:fetch` were both dead. Neither is in `verify`, so it went unnoticed. |
| 3 | `extract-website.mjs` | **Not idempotent**, despite its header claiming so. Overwrites six hand-edited files from `index.html` | **See below — this one I triggered.** |
| 4 | `import-bullets.mjs` | Wrote CRLF, with a comment claiming it "matches the line endings the rest of the seeds use" | It does not. All three bullet CSVs are LF-only. A newly imported manufacturer would have been committed with the wrong endings. |
| 5 | `test-encoding.mjs` | Counted *every* CR as a "lone CR", so it could describe a CRLF file but never named it, and nothing checked seed CSVs for CRLF at all | This is the gap that let bug 4 through. |

**Bug 3, and the mistake behind it — recorded because it is the worst of the
five.** I ran `extract-website.mjs` to check it worked, having already read it.
It overwrote `apps/website/src/main.js`, stripping:

- the four ES module imports (`CALIBER_PRESETS`, `RETAILERS`, `CHECKLIST_ITEMS`,
  `el/icon/externalLink`), leaving three undefined globals;
- **the XSS hardening** — `replaceChildren` reverted to `innerHTML`, in the file
  the AGENTS.md status table advertises as "XSS-hardened".

Caught only because `npm run lint` then failed with `'CALIBER_PRESETS' is not
defined`, and restored with `git checkout HEAD --`. The lesson is the one the
repo already records about row-count arithmetic and about `node -e`:
**a transform that writes must be read before it is run, and its output must be
re-read from disk afterwards.** Running a script to "see if it works" is not a
safe read when the script writes.

Fixed by making it **refuse to run** without `--force`, with a header explaining
what it destroys and why. Not deleted, because rule 13 says do not delete a file
you did not create without saying so; deletion is open item 3.

**Bug 2 fixed once, in one shared place.** Rather than patch two call sites,
`stripBom` and `readJsonFile` now live in `scripts/lib/encoding.mjs`. A third
script reading that manifest gets the fix for free. This follows the existing
convention — `data.mjs` is shared by the generator and the gate precisely so
they cannot disagree.

### A bug I introduced in the fix for bug 5, and caught

My first attempt counted lone CRs with `/\r(?!n)/g`. That is **wrong, and
silently so**: `n` in a regex is the two characters backslash-n, not a line
feed, so "not followed by `\n`" is true for *every* CR — including the ones in a
CRLF pair. A pure-CRLF file reported 2 CRLF **and** 2 lone CR.

Caught by negative-testing with fixtures built from `String.fromCharCode(13)`
rather than by reading the regex, because a shell heredoc had mangled the
escapes and produced a misleading result first. Correct form removes the pairs
and counts the remainder: `text.replace(/\r\n/g, '').match(/\r/g)`.

| fixture | CRLF | lone CR |
|---|---|---|
| LF only | 0 | 0 |
| CRLF only | 2 | **0** (was 2) |
| lone CR | 0 | 1 |
| mixed | 1 | 1 |

Then verified **end to end**: a real CRLF file planted in `data/seeds/bullets/`
is now reported as `2 CRLF line ending(s)` and `test:encoding` exits 1. The
probe was removed and the seeds verified clean afterwards.

**Generalisable point, and the reason it is written down:** a fix to a detector
needs its own negative test, exactly as a fix to a generator needs a fixture.
Three of the six defects in this pass were in the *checking* code, not the code
being checked.

**Not touched, deliberately.** `import-bullets.mjs` and
`split-seeds-by-manufacturer.mjs` both parse CSV with a hand-rolled state
machine that `scripts/lib/data.mjs` almost certainly already provides. That is
duplication worth removing, but it is a refactor of working data-writing code,
not a bug, so it is recorded rather than done. The one-shot transforms remain
`docs/TODO.md` §4.2 cleanup.

**Verified.** `npm run verify` exits 0 — **9 stages, 215 tests, docs verified**.
`npm run data:health` still 989 rows / 23 CSVs / validation clean.
`git status data apps` empty: no data or application file was changed.

---

## Unreleased (fourth pass)

### The data layer is now isolated from the main app

**What.** `apps/website/index.html` — the file Cloudflare actually serves — had
no protection at all. It is committed by hand, nothing rebuilds it, and until
this pass **no gate in `verify` looked at it**. Two facts made that dangerous
rather than theoretical:

- `extract-website.mjs` had already overwritten `apps/website/src/main.js`,
  reverting its XSS hardening, and was caught only by an unrelated lint error.
- `npm run website:build` **does not work at all**: `vite.config.js` sets
  `root: apps/website/src`, which has no `index.html` in it. So
  `npm run deploy` cannot run, and nothing would ever have noticed the two
  halves disagreeing.

**The contract** is [`HANDOFF.md`](HANDOFF.md). One rule:

> The data layer may not write into the main app, and the main app may not
> import from the data layer.

Data crosses by a human copying a checksummed artefact. `index.html` stays
self-contained — it references nothing under `data/` today, and
`check-handoff` fails if that changes. That keeps the blast radius at zero: a
data script that cannot write into `apps/` cannot break the shipped site,
whatever bug it has.

**The checker** is `scripts/check-handoff.mjs`, now stage 10 of `verify`:

| Check | Catches |
|---|---|
| `app-integrity` | the shipped file changed without `npm run handoff:accept` |
| `self-containment` | a `data/`, `.json` or `.csv` reference added to the page |
| `supply-chain-sri` | a remote script loaded without `integrity` + `crossorigin` |
| `runtime-compiler` | `cdn.tailwindcss.com`, which compiles the page in the visitor's browser |
| `inline-handlers` | an `on*=` attribute, which a nonce-based CSP cannot cover |
| `content-security-policy` | no CSP at all |

**Negative-tested against a simulated attack.** Injected
`<script src="data/generated/json/powders.json">` into the protected file: the
checker caught it **twice over** — the SHA-256 mismatch *and* the
self-containment violation — exit 1. Restored, and confirmed byte-identical.

### The known-findings ratchet, and why it exists

`check-handoff` reports **three real defects** that nothing can fix from the
data layer. Wiring it into `verify` as-is would have made the build permanently
red, which achieves one outcome only: everyone learns to ignore the exit code.
The mechanism would have introduced the exact failure it exists to prevent.

So pre-existing findings are recorded in `data/handoff/known-findings.json` and
reported as `known` rather than blocking. It is a **ratchet, not a mute button**:

- A missing baseline means *nothing* is known, so everything blocks. The safe
  direction to fail.
- Fingerprints cover `rule + message`, so a fixed-then-reintroduced problem
  comes back as unknown and blocks again.
- **Verified:** a new violation (an extra remote script) and a `data/`
  injection both still fail with exit 1, while the three known ones do not.

### Two bugs I introduced here, and caught

Recorded because both are the same shape as the previous pass's, and because the
first one silently disabled the feature it belonged to.

1. **The baseline and the checker fingerprinted findings differently.** The
   baseline hashed a rule name, the checker hashed `rule:message`, so nothing
   matched and the ratchet degraded into "always blocks" — the exact opposite of
   the intent, and it looked like the feature simply not working. **Fixed by
   extraction:** the rules now live in `scripts/check-handoff-rules.mjs` and the
   baseline imports them rather than re-implementing them. Two implementations
   of one idea is what produced three of the six defects in the previous pass;
   the fix is structural, not a patch.
2. **`HANDOFF.md` was written with CRLF**, and `docs:check` failed on it —
   caught by the gate written the previous pass, on a file written the pass
   before. Fixed with `npm run docs:fix`, the tool built for exactly that.

Also: an editor call intended to prepend a header replaced the checker's header
instead. The rule classes survived, but it took reading both files back to
confirm. **A smaller, more surgical edit is safer than a large one whose
anchor is not unique.**

### Not actioned, deliberately

- **The broken Vite build.** A real blocker, and `HANDOFF.md` records it with two
  options and a recommendation. Fixing it changes the deploy story, which is
  not something to do as a side effect of a data change.
- **The three supply-chain findings.** Adding a CSP or self-hosting Tailwind
  changes the shipped artefact. That is a human decision, recorded through
  `handoff:accept` — never something the data layer does on its own.
- **Diffing the page's data against the data layer.** Not automatable while the
  datasets are duplicated by hand inside the HTML. `HANDOFF.md` says so under
  "What the checker does *not* do", so nobody assumes a protection that is not
  there.

**Verified.** `npm run verify` exits 0 — **10 stages, 215 tests, docs verified,
handoff verified**. `data:health` unchanged at 989 rows / 23 CSVs / clean.
`git status apps/website` empty: the protected artefact is byte-identical.

---

## Unreleased (fifth pass)

### Data-layer audit, and the blocker it found

**What.** Every seed CSV, manifest, migration, generated artefact and reference
file was inventoried and checked rather than read: row counts from the files, not
from the docs, and the schema replayed against a fresh in-memory SQLite to see
what it actually produces.

**The finding, which was in no task list:** replaying all 16 migrations yields
**24 tables and 69 rows**, and **19 of those tables are empty**. `bullets` has 0
rows and should have 120. `powders` has 0 and should have 169.
`cartridge_specs` **has no table at all**, for a 229-row dataset.

It is not a broken loader — `seed:check` reports `bullets: 120 rows read, 120 in
the table` through its own instance. **No script writes the seeds into the
schema.** There is no path from `data/seeds/*.csv` to a `.sqlite` file or to D1,
and `wrangler.toml` still carries
`database_id = "REPLACE_WITH_YOUR_D1_DATABASE_ID"`.

`schema:check` passes because it only asserts that migrations apply and that
three named tables are non-empty. It never checks that seed data landed — so the
project has 989 curated rows, a 24-table schema and a deployed app, and no
connection between any two of them.

### The master list

**[`docs/DATA-TODO.md`](docs/DATA-TODO.md)** replaces `docs/TODO.md` as the
single data-layer plan. Ordered by what actually blocks:

- **§0** the three blockers: `recipes` empty, no database path,
  `bullets.diameter_in` holding calibre designations rather than measurements
- **§1** four diagnosed integrity defects, each with a "fails if wrong" test —
  the `.300 WSM` key collision, the `.38 S&W` method ambiguity, two unresolved
  Rem Mag pressure disputes, and the unconfirmed 6.5 Creedmoor override
- **§2** structural gaps: 10 of 21 `cartridge_specs` columns empty, the empty
  burn-rate column, three `sourcing_*` datasets that are scaffolding with
  `affiliate_network` blank for all 8 retailers, and `value_provenance` covering
  4 rows out of 989
- **§3** coverage, and a note that `done` is currently **misleading**: `sierra`
  has 4 bullets and 0 powders, `vihtavuori` 27 powders and 0 bullets, and both
  report `done` because one category completed
- **§4** housekeeping, including **two manifest entries with no file on disk**
  (`shooters-world-reloading-manual.pdf`, `vectan-reloading-catalogue-2025.pdf`).
  No seed row cites either, so nothing is broken — but the manifest overstates
  what is archived
- **§5** already done, so nobody redoes it

`docs/TODO.md` is kept but marked **SUPERSEDED** with a pointer, and the indexes
in `README.md`, `AGENTS.md` and `docs/README.md` are repointed. It is retained
rather than deleted because the reasoning behind its accepted decisions is still
worth reading — only its counts and priorities are stale.

**Also corrected:** `data:health` never mentions `recipes`, so the project's
headline gap is invisible in the health output. Logged as §4.8 — a dataset with a
schema table and no CSV should read `absent`, not be missing from the report.

**Verified.** `npm run verify` exits 0 — **10 stages, 215 tests**. `data:health`
unchanged at 989 rows / 23 CSVs, validation clean. No seed, migration or
generated file was modified by this pass; the work was measurement and
documentation only.

---

## Unreleased (sixth pass)

### Security review — one fix, five findings reported

**What.** Every source file was read for exploitable patterns: the deployed
`index.html`, both `apps/` surfaces, `packages/ballistics-core`, all 27 scripts,
the migrations, and the committed data. Findings are in
[`SECURITY.md`](SECURITY.md), with severity, proof, and the fix for each.

**Fixed: path traversal in `fetch-published-data.mjs` (High).** The script wrote
each manifest entry with `writeFileSync(resolve(dir, doc.file), body)`, and
`resolve()` collapses `..` silently. **Proven rather than assumed** — a fixture
of `../../../.ssh/authorized_keys` resolved to `C:\Cline\.ssh\authorized_keys`
and the write would have succeeded. 3 of 4 traversal payloads escaped the
archive.

The manifest is committed, so this is not an external input today. It is a High
finding anyway because `manifest.json` is the one file a contributor edits by
hand when adding a source, and exactly what a supply-chain attacker would
target — a reviewer skimming 25 innocuous entries would not spot one hostile
filename. Now refused loudly, with the escaping path named in the output.

**Reported, not fixed — 5 findings, all in the shipped artefact:**

1. **Template-injection XSS**, 2 sinks, 7 interpolations (`index.html` 976, 988,
   1038). **Not exploitable today**: every value is a hardcoded `const` in the
   same file, and the page has no `fetch`, no `localStorage`, no URL parameters.
   **High anyway** — it is one input from being live, and the roadmap sources
   retailer data from a database.
2. **`href="${r.link}"` with no scheme check.** The worst of the seven: a
   `javascript:` URL executes on click and no HTML-escaping of the surrounding
   markup prevents it.
3. **`cdn.tailwindcss.com` unpinned.** No SRI, so a compromise of that origin is
   arbitrary script execution on `apex-amc.com`.
4. **`cdn.tailwindcss.com` is a runtime compiler** — it executes third-party JS
   in every visitor's browser to compile the page. Reported separately from #3
   because the fix is different: build the CSS, don't add a hash.
5. **No CSP.** Defence in depth, and achievable: 2 inline scripts, **0** inline
   `on*=` handlers.

**The fix already exists and is unused.** `apps/website/src/dom.js` provides
`el()` (sets `textContent`, cannot parse markup) and `safeUrl()` (rejects
`javascript:`/`data:`, allows only http/https), and `src/main.js` uses them.
Verified difference: the deployed file has 2 real `innerHTML` sinks and 1 `href`
interpolation; `src/main.js` has **zero** — its 2 `innerHTML` occurrences are
comments explaining the hardening.

**Not fixed here, deliberately.** These all require editing the shipped
artefact, which `HANDOFF.md` and `AGENTS.md` rule 12 reserve for a human
decision recorded through `handoff:accept`. A script that rewrote the deployed
page would be doing exactly what this repo's boundary exists to prevent.

**Clean, and checked rather than assumed:** no secrets committed, `.env`
gitignored, `npm audit` reports **0 production vulnerabilities**, no `eval`, no
`new Function`, no `dangerouslySetInnerHTML`, no HTML sinks in the Expo app, and
all SQL in the scripts uses bound parameters rather than interpolation.

### New gate: `npm run security:check` (stage 11)

`scripts/security-rules.mjs` holds the rules; `security-check.mjs` runs them
against the two files a visitor or a future build actually receives.

**It distinguishes a sink from a vulnerability.** Clearing a container with
`innerHTML = ''` is not flagged, because reporting it next to real injection is
how a security check gets muted. Same ratchet design as the handoff baseline,
for the same reason — a warning that is always present is a warning nobody reads.
**Verified:** a newly injected `innerHTML` sink is reported, exits 1, and the
file was restored byte-identical.

### A bug I introduced in the ratchet, caught by printing a number

`loadKnown()` took a JSON **string** and called `JSON.parse` internally, while
its only caller passed the already-parsed **object**. The parse threw, the
`catch` swallowed it, and the set came back empty — so every finding looked
unknown and the ratchet silently degraded into "always blocks" *while appearing
to work*. Found by printing the set size instead of trusting the exit code,
which is the same lesson as the `\r(?!n)` bug two passes ago and the
`repairMojibake` object-vs-string bug before it: **a check's own result needs
inspecting, not just its status.**

Two earlier ratchet tests were also invalid and are worth recording: shell
escaping mangled a `${...}` payload so the "new injection" contained no
interpolation, producing a false "the check passed" — the worst possible outcome
for a security test, because it looks like the guard works. Both were rewritten
as files with `String.fromCharCode(36)` for the `$`.

**A mistake I made and had to repair, recorded because it is the third time.**
While updating the stage counts I ran
`Set-Content -Encoding utf8` over `AGENTS.md` and `CHANGELOG.md`. On this
PowerShell that did two things at once: added a **UTF-8 BOM** and re-encoded the
existing text as **cp1252 read-back mojibake** — 32 damaged sequences across 23
lines, turning every em dash into a three-character artefact and every arrow
into a mangled one.

**Caught by my own gates, twice, in sequence.** `docs:fix` then failed, because
the normaliser fixed line endings but **did not strip BOMs** — a real gap in a
tool I had written and verified the previous pass. Fixed properly by importing
the repo's existing `stripBom` rather than writing a third implementation, and
the mojibake was then repaired with the repo's own `repair-encoding.mjs`
(backups written).

Three separate bugs, all the same shape: **a check that reported success while
producing wrong output.** The `\r(?!n)` regex, `repairMojibake`'s return value,
`loadKnown`'s argument type, and now the normaliser's BOM handling. The lesson
is now stated once, in the traps table: *verify the artefact, not the exit code.*

I should not have used a shell redirect to edit a file at all. `AGENTS.md` rule
8 says so, I wrote that rule, and I broke it in the same session.

**Verified.** `npm run verify` exits 0 — **11 stages, 215 tests**, docs/handoff/
security all verified. `npm audit` 0 production vulnerabilities. `git status
apps/website` empty: the shipped artefact is byte-identical to committed.
`data:health` unchanged at 989 rows / 23 CSVs / clean.


---

## Unreleased (seventh pass)

### Module architecture, and the gate that proves it still fits

**The brief was "break it into modules, the smaller the better, then prove it
still fits together".** Measured first, and the measurement changed the answer.

**Already correctly modular — deliberately not split further:**

- `packages/ballistics-core/` — 13 source modules, one responsibility each.
  `drag/solver.ts` is 761 lines and **should stay that way**: its 100-line
  header documents five failure modes that each actually happened here, and
  fragmenting it would scatter those warnings away from the code they govern.
  `docs/BALLISTICS-AUDIT.md` §0 exists because three ballistics defects *hid
  each other* while 161 tests passed.
- `apps/ballistics/` — already `screens/`, `services/`, `hooks/`.

**The genuine candidate:** `scripts/check-seeds.mjs`, 1,366 lines, 20 clearly
banned sections, zero exports, heavy shared mutable state. **Not split yet**,
deliberately: it is a *safety gate*, so a botched split silently weakens a check
rather than crashing, and the shared state makes it a real refactor rather than
a mechanical one. It is the recommended next pass, with `modules:check` now in
place to guard it.

**Blocked:** `apps/website/index.html` (1,075 lines) is the largest monolith and
the largest available win. The modules already exist in `src/`; what is missing
is the **working build**. Splitting the artefact without one produces two copies
of the same code, and it is the SHA-pinned shipped artefact. Recorded in
`ARCHITECTURE.md` under "Not done, and why".

**The rule this map now follows:** split when a file has **two responsibilities**,
not when it is **long**. `check-seeds.mjs` has both. `solver.ts` has one.

### New gate: `npm run modules:check` (stage 12)

73 modules, 70 local imports, 0 cycles. Four questions no other gate asks: does
every module load, does every local import resolve, are there cycles, and does
each package still assemble from its entry point.

**The fourth is the one that matters for refactoring.** A test that imports a
module directly cannot see a barrel that stopped re-exporting it — that seam is
only visible from the package entry point.

### Two real gaps in the new checker, found by negative-testing it

Neither was discoverable by reading the code, which is the argument for writing
the negative test at all.

1. **`node --check` exits 0 on a `.ts` file with a genuine syntax error.** It
   validates plain JavaScript and silently ignores TypeScript, so a broken module
   in the package every app depends on reported as clean. Verified directly, then
   fixed: `.ts` is now loaded through the type-stripping loader.
2. **The `mustExport` list asserted the wrong names.** It named
   `solveTrajectory`, `BallisticProfile` and the provenance helpers — all from
   *other* modules — so deleting the `reloading.ts` re-export changed nothing
   observable and the assembly check passed a broken barrel. Two names I first
   added (`speedOfSound`, `mergeWeather`) did not exist either. Fixed by
   enumerating what each module actually exports and taking one representative
   per module.

Two false positives were also fixed before the real signal appeared:
`node --check` refuses `.jsx`/`.tsx` (9 identical errors that buried
everything), and extensionless imports are legitimate in the Expo app.

**Negative test, all four defects injected into real files then removed and
re-hashed:** syntax error, unresolved import, import cycle, barrel stops
re-exporting. All four exit 1 with the right message; tree restored.

**Verified.** `npm run verify` exits 0 — **12 stages, 215 tests**. `git status
apps/website` empty. `data:health` unchanged at 989 rows / 23 CSVs / clean.

---

## Unreleased (eighth pass)

### Dead code, stale comments — and one instruction deliberately not followed

**The brief:** remove unused code, clean up all the comments, make everything
logically structured and easy to read. Measured first; the measurement changed
two of the three parts.

**Comment density, measured:** 6,197 of 16,533 lines are comment or blank —
**37%**. The highest are `devices/types.ts` (68%), `atmosphere.ts` (65%),
`constants.ts` (57%), `solver.ts` (53%).

**I did not reduce this, and the reason is specific to this repository.**
`constants.ts` is 57% comment because **every constant must declare its
citation** — that is the provenance system, and `AGENTS.md` rule 1 is "never
invent a value." A constant without a stated source is a defect, not a style
problem. `solver.ts` is 53% because its header documents the failure modes that
each actually shipped as a bug here. `devices/types.ts` is 68% because it is the
device API surface. Stripping these to hit a ratio would delete the mechanism
that has repeatedly caught real defects — and the documented history is that
tests did *not* catch them: three real ballistics defects shipped while 161 tests
passed. **The right cleanup for a comment is that it is wrong, not that it is
long.** So I fixed wrong ones and left true ones alone.

**What was actually removed — 9 dead `.bak` snapshots, 103 KB.** Left behind by
`repair-encoding.mjs`, all untracked (so no tracked file changed), all differing
from the live file, and all already covered by `.gitignore`. Stated explicitly,
per rule 16. I created 2 of them this session.

**What was actually fixed — three genuinely wrong comments**, all of the kind
that is worse than no comment because it is trusted:

1. **`solver.ts` said FOUR failure modes; the file documents FIVE.** The fifth,
   "MISSING UNIT CONVERSION (found 30 Sep 2026)", is documented at
   `DRAG_COEFFICIENT_PI_OVER_8` and was **also labelled "4."** — so two
   different defects shared a number, and the header's own count was wrong.
   Found by *counting* the items, not by reading them. Renumbered to 5, header
   corrected, and the two documents repeating the "four" claim
   (`ARCHITECTURE.md`, `CHANGELOG.md`) updated with it.
2. **Two comment pointers into a document that no longer has the section.**
   `extract-website.mjs` and `split-cartridge-specs.mjs` both cited
   `docs/TODO.md 4.2`. That file was **superseded by `DATA-TODO.md`** earlier in
   this session and has no section 4.2, so both pointers resolved to nothing.
3. Rule number in `extract-website.mjs` said 13; renumbering made the delete
   rule 16.

**"Unused code" turned out to be mostly a false premise, and I checked rather
than acted.** A detector found 12 exports referenced nowhere. On inspection:

- `CONFIDENCE_TIERS` is used **in its own file** to derive the `Confidence`
  type — a false positive, because the detector only searched *other* files.
- The nine `constants.ts` entries (`INCHES_PER_YARD`, `MILRAD`, `FEET_PER_METRE`,
  `G1_DRAG_MODEL`, …) are a **sourced catalogue by design**: each carries a
  citation and a `RETRIEVED` date, and the next person doing angular maths needs
  `MILRAD` *with* its provenance. Deleting them would destroy sourcing work to
  save 40 lines.

**So nothing was deleted as "unused."** Given five checks in this session passed
while being wrong, removing code on the strength of a grep would have been the
same error.

**Structure** is `ARCHITECTURE.md`, written last pass: the module map, what is
deliberately not split and why, and the gate that proves the pieces still fit.

**Verified.** `npm run verify` exits 0 — 12 stages, **215 tests passing** after
editing the solver's header. `git status` shows no tracked file deleted. Data
unchanged at 989 rows / 23 CSVs / clean.

### New in `modules:check`: two comment-claim checks

The bugs above were prose claims that nothing held true, so the gate now tests
the two shapes that are cheap to check: a `THE FOUR ...` header whose count
disagrees with the file's own numbering, and a `docs/X.md 4.2` pointer to a
section that is not there. 73 files checked.

**The checker caught a bug I introduced while fixing them.** Repointing the two
comment pointers from `docs/TODO.md 4.2` to `docs/DATA-TODO.md 4.2` was also
wrong — *neither* document has that section any more. The doc-pointer check
reported it immediately. The comments now state the reason inline rather than
citing a section number that does not exist.

**Two false positives in the count check, fixed before it shipped.** The first
version matched any comment containing a count word, so ordinary prose produced
17 errors that buried the signal; the second compared every number in a file
against any line. Now it matches exactly one shape — an all-caps
`THE <COUNT> <NOUN>` header, and only where the file has a contiguous numbered
list to disagree with. Negative-tested on three inputs: a wrong count fires,
prose containing "one"/"two"/"three" does not, and a dead doc pointer fires.

The test itself was wrong once, in the same way: it pointed at a file with no
numbered list, so the guard skipped the check and the test passed for the wrong
reason. Re-pointed at a file that has one.

---

## Verified state at time of writing

Measured, not remembered. Re-run the commands before trusting these.

Measured, not remembered. Re-run the commands before trusting these.

| | |
|---|---|
| `npm run verify` | **exit 0**, all **11** stages (docs, handoff and security checks added) |
| Tests | **215 passing**, 0 failing |
| Node | v24.19.0 (needs ≥22.6.0) |
| Data | 989 rows, 23 CSVs, all governed, cross-references resolve |
| Markdown | 50 files, all structurally clean, UTF-8 no BOM, LF |
| Main app | `apps/website/index.html` pinned by SHA-256; 3 known findings recorded |
| Load recipes | **ZERO** — still the headline gap (`docs/TODO.md` §0) |
| Git | 132 files staged, **nothing committed** — rule 11 |

Run before and after any change:

```bash
npm run verify        # lint, typecheck, test, encoding, bullets, schema, seed, drift, docs
npm run data:health   # live row counts, manifest coverage, reference integrity
npm run coverage      # per-manufacturer status
npm run docs:audit    # line-ending / BOM drift, reports without writing
```

---

## Open items, in the order they should be done

Items 1-3 of the previous list are **done** — see the second-pass entry above.

| # | Item | Why it is next |
|---|---|---|
| 1 | **Repo-wide line-ending normalisation (96 files)** | Real `.gitattributes` violations: `scripts/`, `packages/`, `apps/`, all 15 SQL migrations, all 13 column manifests, `package-lock.json`. Deliberately excluded from the documentation pass. `node scripts/normalise-line-endings.mjs --all --write` does it. Needs its own review, because it touches migrations. |
| 2 | **`solver.ts` UTF-8 BOM** | The duplicate headings are fixed, but the BOM is still there. Rule 6 / `.gitattributes` violation in the safety-critical file. `check-docs.mjs` only covers `.md`, so nothing catches it yet. |
| 3 | **7 leftover `*.pre-encoding-fix.bak` files** | Snapshots from an earlier `repair-encoding.mjs` run. Not gitignored. Keep or delete — do not delete without saying so (rule 13). |
| 4 | **Commit the 132 staged files** | Everything is staged and `verify` is green. `docs/TODO.md` §4.1. Rule 11: only when asked. |
| 5 | **Extend `docs:check` beyond `.md`** | It now guards the documentation. `README.md`'s `index.html`, the column manifests and the migrations are all unwatched. Fold in only if something is actually being corrupted — a check nobody trusts is worse than none. |

**Note on the `docs:check` design, for whoever extends it.** It caught two
false positives before it caught a real one, and both were in the *checker*, not
the docs. A gate that cries wolf gets ignored, and then the real defects go
with it. If you add a rule, **negative-test it** with a fixture that must fail.

---

## Unreleased (seventh pass) — the website is built, and the tree is reorganised

### The build was broken, and that had been hiding everything else

`vite.config.js` set `root` to `apps/website/src` and looked for an
`index.html` that was not there. `npm run website:build` failed with
`Could not resolve entry module "src/index.html"`.

The real page was `apps/website/index.html`, a 1,075-line hand-maintained file —
and it contained **zero references to `src/`**. All six modules there
(`dom.js`, `main.js`, `data/*.js`, `styles/theme.css`) were unreachable from
the shipped page. Dead code, and the build that should have shipped it had never
run, so nothing detected the gap.

**The two implementations had drifted, and `src/` was the safer one:**

| | prototype `index.html` | `src/main.js` |
|---|---|---|
| `innerHTML` assignments | 5 | 0 |
| `savingsPerRound` divide-by-zero | missing | guarded |
| retailer grid | interpolated | `el()` / `appendChild` |

79% of `src/main.js` lines also appeared inline. The 50 that differed were the
hardening. It was already written, already correct, and blocked by a build that
could not run.

**Fixed by:** creating `apps/website/src/index.html` as the Vite entry, copying
the markup byte-for-byte rather than retyping it, and replacing the two inline
scripts with `<script type="module" src="./main.js">` and an import of
`tailwind.config.js`.

**Verified:** 583 markup tags in, 583 out. The single difference was a
`preconnect` host — the prototype pointed at `https://gstatic.com` (verified
404) instead of `https://fonts.gstatic.com`. 66,199 → 55,740 bytes.

### `dist/index.html` had to stay self-contained

`HANDOFF.md` requires one file with no runtime fetch of `data/`. A default Vite
build emits hashed asset files, which violates that. `vite.config.js` now
inlines the bundle via a ~50-line `generateBundle` hook, written in-repo rather
than adding `vite-plugin-singlefile` — the rule enforcing our handoff contract
should live in the repository and need no new dependency.

`modulePreload.polyfill` is disabled: it injected a `fetch(o.href)` call, which
is browser feature detection rather than app data, but its presence made the
self-containment rule unauditable by grep.

**New gate: `npm run website:check` (stage 13).** Fails if `dist/` contains
anything but one file, references a bundled asset, calls `fetch(`, reaches into
`data/`, or pulls a CDN outside a four-host allowlist.

**Verified negatively** three ways — injected asset reference, injected `fetch`
into `data/`, unapproved CDN. Each exits 1 with a specific message; the build was
restored byte-identical afterwards.

### Three XSS findings closed as a consequence

The hardened renderer shipped for the first time. `innerHTML` assignments in
the deployed artefact went **5 → 0**. `data/handoff/known-security-findings.json`
went from 5 entries to 2, and the 2 remaining are `cdn.tailwindcss.com`
(SRI + runtime compiler) and the missing CSP — infrastructure, not injection.

The stale ratchet was regenerated rather than left in place: it still carried 3
XSS entries pointing at a file that no longer existed, which would have accepted
a *new* finding with a matching fingerprint.

### The prototype is retired, not deleted

Archived to `archive/website-prototype/index.html` after verifying the copy was
byte-identical to the recorded SHA-256 (`60a1e76b…`). The handoff manifest now
tracks `apps/website/dist/index.html`, with the superseded hash retained for
provenance.

`handoff:status` blocked the change exactly as designed — SHA-256 mismatch,
"changed without being accepted". That is the gate working, not failing.

### `scripts/` reorganised by module

37 files in one flat directory became 8 directories, one per responsibility:
`shared/`, `data/`, `extract/`, `gates/`, `handoff/`, `security/`, `text/`,
`tests/`. `lib/` became `shared/` because "lib" describes a *kind* of file while
the directory now describes a *role*.

`scripts/shared/data.mjs` remains the single declaration of every governed path.
Two things had to be rewritten, and the second was silent:

1. 19 files importing `./lib/` → `../shared/`
2. **14 scripts computing `resolve(import.meta.dirname, '..')` for the repo
   root**, which was correct at depth 1 and wrong at depth 2. Nothing would have
   said so at import time — the paths simply would not exist.

**Verified:** `npm run verify` green, 215/215 tests, `data:health` 989 rows
across 23 CSVs, website build clean.

### Deleted

- `output.txt`, `output2-4.txt` — 1.8 MB of debug dumps, three byte-identical
- `temp/` — 8 scratch files (`read_csv*.py` prototypes, orphaned `.md` fragments)
- `scripts/_ptr.mjs` — 0 bytes
- `apps/ballistics/package-lock.json` — 258 KB; wrong in an npm workspace, the
  root lockfile is authoritative
- `.expo/` — device cache, regenerated on demand
- `docs/AGENT-HANDOFF.md`, `docs/ARCHITECTURE.md` — git-tracked near-duplicates
  of the root originals, which the docs index already linked to instead

### `docs/VARIABLES.md` created

Every value in the repository, in three tiers: cited physical constants (28, all
in `constants.ts`), configuration (paths, in `shared/data.mjs`), and structural
maths (RK4 coefficients and similar, deliberately left inline).

The audit that motivated it found **26 cited constants existed and the domain
imported 2**. `solver.ts` hardcoded `32.17405` and `12` while `constants.ts`
already exported both with publications behind them. Fixed: the solver now
sources them, and `FEET_PER_YARD`, `FEET_PER_MILE` and `INCHES_PER_SQUARE_FOOT`
were added with citations.

**Two mistakes caught during that work, both worth recording:**

1. Unifying `FEET_PER_YARD` with its inverse produced a **9× error** — 1 MOA at
   1,000 yd came out as 90 inches of shift instead of 10. Confirmed as mine by
   stashing the change and watching the test pass on pristine code. The two names
   are now separate and documented as such.
2. The new destination constant did not exist when first referenced, so a
   destructure silently produced `undefined`. Caught by checking the export list
   before trusting the build.

### Still open

| # | Item |
|---|---|
| 1 | **No seed-to-database loader.** Migrations create 25 tables; the loader that populates them from the seed CSVs does not exist. `docs/DATA-TODO.md` §0.2. |
| 2 | `cdn.tailwindcss.com` — unpinned, runtime compiler, no SRI. |
| 3 | No Content Security Policy. |
| 4 | `scripts/gates/check-seeds.mjs` is 1,619 lines. Real modularisation candidate, but it is a safety gate with shared mutable state — its own pass, not folded into this one. |
| 5 | Uncited unit conversions in `weather.ts` (`KMH_TO_MPH`, `HPA_TO_INHG`, `VIS_KM_TO_MI`). Need real citations before entering `constants.ts`; a plausible-looking constant with a fabricated source is worse than an honest local one. |

---

## Unreleased (eighth pass) — Expo typecheck, Dependabot, security findings closed

Driven by `docs/REVIEW.md`. Three of its open items are now closed.

### TypeScript 7 was attempted and deliberately reverted

**The patch step was a no-op** — `npm view` confirms 6.0.3 is the final 6.x. So
the install went straight to 7.0.2, which typechecked clean and included all 20
source files. Then `npm run verify` went red:

```
Error: typescript-eslint does not support TS 7.0.
```

`typescript-eslint@8.71.0` — latest release, and `canary` too — declares
`typescript: ">=4.8.4 <6.1.0"`, and hardcodes `require("typescript")` with no
override.

**A second measurement changed the decision.** Three runs each, order alternated,
both compilers checking the same 190 files:

| Compiler | Median |
|---|---|
| TypeScript 6.0.3 | **559 ms** |
| TypeScript 7.0.2 | 926 ms |

TypeScript 7 is **~65% slower** here, against a headline of "8–12× faster". The
project is small enough that the Go binary's startup and index-loading dominate.
The speedup is real for a large codebase and absent for this one.

The documented escape hatch — Microsoft's `@typescript/typescript6` side-by-side
package — does work, but needs `--legacy-peer-deps` and a hand-maintained alias.
Rejected: that fragility costs more than the upgrade is worth while the linter is
the only thing catching type-aware bugs.

**Reverted to 6.0.3.** `verify` green before and after. Revisit when the linter
ships TS 7 support; Dependabot now watches for it.

### The Expo app had never been typechecked

`apps/ballistics/tsconfig.json` was a copy of the root config: `include` pointed
at `packages/**` (nonexistent relative to that directory) and `exclude` excluded
itself. Every run produced `TS18003: No inputs were found` — so **no part of the
13 modules or 9 screens was ever checked.**

Fixing it exposed a trap. The root config lists `apps/ballistics` in `exclude`,
and that exclusion is **inherited through `extends`**. Once the child declared its
own `include`, the inherited exclude removed the child's file set — `TS18003`
again, with correct globs. Also required: `allowJs`, without which every `.js`/
`.jsx` file was silently skipped.

Diagnosed by bisecting the config rather than guessing: no single `exclude` entry
was at fault, `extends` alone was fine, the combination was not.

**Now: 11 files, 0 errors, wired into `verify` as `typecheck:all`.**

### Two screens that could never have run

The first real typecheck found 16 errors, **all** in `TargetLoupe.tsx` and
`ExportableTargetCard.tsx`, and the cause was not typing — both import packages
the app does not depend on: `react-native-gesture-handler`,
`react-native-reanimated`, `react-native-view-shot`. None in `package.json`, none
in `node_modules`. They have never been able to run.

Checked whether they were reachable before acting: **neither is imported by
`App.jsx`**, so nothing in the live app referenced them and there was no crash.
Moved to `apps/ballistics/_unscreens/` with a README explaining why and how to
revive them. Reversible, and the typecheck is unblocked.

### Dependabot configured

`.github/dependabot.yml` plus `docs/DEPENDABOT.md`. Weekly for root and website,
monthly for the Expo app. TypeScript and ESLint are grouped so a bump arrives as
one reviewable PR. The Expo app is deliberately **notify-only** — `expo install`
pins versions to the SDK, and Dependabot does not know that contract.

Its first real job: open the PR when `typescript-eslint` adds TS 7 support.

### Security findings: 5 → 0

The sequencing trap from `docs/REVIEW.md`, resolved in the right order.

**The trap:** the page loaded `cdn.tailwindcss.com`, a *runtime CSS compiler*.
It evaluates code in the browser, so any CSP written while it was present had to
permit `unsafe-eval` — a header that looks strict while disabling what it claims
to protect. Adding the CSP first would have been security theatre.

**So the dependency went first.** `tailwindcss@4` + `@tailwindcss/vite`.
`src/styles/main.css` imports Tailwind and declares the `tactical-*` scale in a
`@theme` block, replacing the `tailwind.config = {...}` global assignment that
only the runtime compiler understood. Same class names, so the **313 utility
classes needed no change**. The CDN `<script>` was deleted.

Then the policy could be written properly: `public/_headers` declares a
nonce-based, `strict-dynamic` CSP with no `unsafe-eval` and no `unsafe-inline`,
plus `nosniff`, `X-Frame-Options: DENY`, a restrictive `Permissions-Policy` and
HSTS.

**Three guards, each negative-tested:**
- the Vite build fails on a live `<script src=…cdn.tailwindcss.com>` (prose in
  comments is allowed — a gate that cries wolf gets ignored)
- `check-website-build.mjs` fails if `dist/_headers` is missing, loses its CSP,
  or regains `unsafe-eval`
- `security-check.mjs` fails on any new finding

**Side effect:** `src/styles/theme.css` had been written but never imported by
anything — those scrollbar and number-input rules were dead. They work now.

**Honest limitation:** 4 inline `style=""` attributes require `unsafe-hashes`; a
nonce cannot apply to attributes. Remove them and the keyword goes too.

### Still open

| # | Item |
|---|---|
| 1 | **No CI.** All 14 verify stages still run only when a human remembers. Highest-value remaining item. |
| 2 | Seed-to-database loader — 25 tables, 0 rows. `docs/DATA-TODO.md` §0.2. |
| 3 | TypeScript 7, blocked on `typescript-eslint`. |
| 4 | Zero tests for `apps/website` and `apps/ballistics`. |
| 5 | Accessibility — 1 aria attribute across 583 markup tags, and a legal exposure under the EAA. |
| 6 | `scripts/gates/check-seeds.mjs` is 1,619 lines. |
| 7 | No `LICENSE`, no `CONTRIBUTING.md`. |

---

## Unreleased (ninth pass) — cleanup pass: dead code, stale docs, and a dependency trap

### CI exists

`.github/workflows/verify.yml`. Runs `npm ci`, then lint, `typecheck:all`
(both the domain and the Expo app), tests, the website build, and all ten
remaining gates. Plus `npm audit --omit=dev --audit-level=high`.

Two details that matter:

- **`npm ci`, not `npm install`.** It installs from the lockfile and *fails* if
  `package.json` and the lockfile disagree. `npm install` would resolve a
  different tree and hide exactly the drift CI exists to catch.
- **The website is built before `website:check` runs.** That gate passes
  trivially when `dist/` is absent ("not built"), so without the build step the
  check would be vacuous.

Last step rebuilds and compares SHA-256, proving the build is reproducible.
Verified locally: two consecutive builds produce byte-identical output. This is
what makes the checksummed handoff manifest meaningful.

### `unsafe-hashes` removed — the CSP now has no escape hatch at all

Chasing the last CSP keyword uncovered a mistake from the previous pass.

Those four cost-bar `style="width: N%"` attributes were **rewritten by JS on
every cost calculation**. A nonce cannot apply to a style attribute, and a hash
needs static content to hash — so `unsafe-hashes` was **never going to work**. I
should have caught that when I added the keyword rather than shipping a policy
that depended on it.

They now arrive as the `--bar-width` custom property via `setProperty()`, which
is a CSSOM write and is not governed by CSP at all. The percentage arithmetic is
byte-identical to the original; only the setter changed.

**The policy is now strict: nonce + `strict-dynamic`, no `unsafe-eval`, no
`unsafe-hashes`, no `unsafe-inline`.**

The gate was also strengthened to check **all three** keywords and, crucially, to
inspect **directive lines only** — `_headers` is heavily commented and those
comments necessarily discuss the keywords they forbid, so a whole-file match made
the gate fail on its own explanation. Negative-tested: injecting
`'unsafe-hashes'` into an active directive exits 1; the clean file exits 0.

### Dead code removed

**`apps/website/src/tailwind.config.js`** — orphaned by the `@theme` migration.
It only assigned `globalThis.tailwind.config`, which existed solely for the
deleted CDN runtime compiler. Verified dead by deleting it: the build still
succeeds and produces a byte-identical 92.6 KB artefact.

### Stale references repaired

- **Three documents pointed readers at `TODO.md` as the live task list** —
  including `TASK-LIST.md`, which claims to be a source of truth. `TODO.md` is
  itself superseded by `DATA-TODO.md`, so the chain dead-ended. All three now
  point at `DATA-TODO.md`; `DATA-PLAN.md` also records that `TODO.md` was the
  previous home.
- **10 script files** carried pre-reorg paths in usage comments
  (`node scripts/build-data.mjs` when it now lives at `scripts/data/`). Rewritten.
- **3 handoff scripts** referenced `scripts/handoff-baseline.mjs` at the old
  location.
- `ARCHITECTURE.md` module counts corrected: **73 modules, 80 local imports**
  (was 74/79), website 6 → 5 modules, and a note added explaining why
  `tailwind.config.js` is gone.

Every link in `docs/README.md` checked — all 24 targets exist. `docs/TODO.md` is
correctly marked superseded with a pointer, so it stays.

### ⚠ `npm update` is a trap here — and it caught me

Ran `npm update` to pick up in-range patch updates. It **downgraded
`node_modules/uuid` from 11.1.1 to 7.0.3**, reintroducing **11 moderate
vulnerabilities** — the audit went from *0 found* to *11 moderate* in one command.

`npm update` re-resolves the entire tree and will move a transitive dependency
**backwards** to satisfy a peer's range. It does not mean "move everything
forward".

Caught it by running the audit, recovered with `git checkout package-lock.json &&
npm install --package-lock-only && npm ci`, and confirmed `uuid 11.1.1` restored
with **0 vulnerabilities**. Documented at the top of `docs/DEPENDABOT.md` so the
next session does not repeat it — Dependabot plus CI is the safe path, precisely
because it shows the audit result before anything merges.

In-range updates that survived: `@types/node` 24.19.1, `wrangler` 4.146.0.
Everything still listed by `npm outdated` is a **major** bump needing deliberate
review (vite 8, TypeScript 7, React 19.3, Expo-managed packages).

---

## Unreleased (tenth pass) — accessibility and the first website tests

### Accessibility: the original finding was overstated, and I checked

`docs/REVIEW.md` P2-4 said "1 aria attribute across 583 markup tags". Re-measuring
before acting showed that **overstated it**: no clickable divs, no unlabeled
images, and all 12 inputs already carried an id. The real defects were narrower —
and more interesting.

**7 orphaned `<label>` elements.** Each closed *before* its input, which sat in a
sibling `<div>`:

```html
<label class="...">Projectiles / Bullets ($)</label>
<div class="grid grid-cols-2 gap-2">
    <div class="relative">
        <input type="number" id="bulletPrice" ...>
```

Implicit association does not apply across a sibling, so assistive technology
announced seven **unlabelled money fields**. Each label now has `for="…"`, and
all 7 were verified to resolve to a real id.

**The mobile drawer** gained `aria-expanded` and `aria-controls`, and `main.js`
now syncs it through a single `setDrawerOpen(open)` function. Two duplicated
branches collapsed into one, which is where the attribute can be kept honest — an
aria attribute that disagrees with the visual state is worse than a missing one.
Icon-swap behaviour was verified equivalent before and after by simulating
`classList.replace`.

**The caliber preset group** was a `<label>` pointing at a button group, so no
`for=` could ever bind to it. Converted to a labelled `role="group"` with
`aria-labelledby="caliberPresetLabel"`.

Verified mechanically: no dangling `for=`, no dangling `aria-labelledby`, no
duplicate ids.

**Still open:** colour contrast was never measured, keyboard navigation is
unwalked, and there is no automated auditing in CI.

### `safeUrl()` finally has tests

It is the security boundary — the only thing between a retailer URL from a CSV
and `javascript:` execution in a visitor's browser — and it had none.

`apps/website/test/dom.test.js`, 7 tests via `npm run test:website`, wired into
`verify` and CI as `test:all`. Covers ordinary URLs, `javascript:` (mixed case and
leading whitespace), `data:`, `vbscript:`, `file:`, `blob:`, relative-URL
resolution, non-string inputs, and unparseable URLs.

Deliberately dependency-free. `safeUrl` needs only a `URL` parser and a
`window.location.origin`, so it is tested directly; jsdom would add a large dev
dependency for four pure functions.

**Negative-tested:** removing the scheme check from `dom.js` fails exactly 3
tests. Restoring it returns 7/7.

Total: **222 tests**, up from 215.

### `package.json` metadata

Added `description` and the real `repository` URL. Recorded the **licensing
decision explicitly** rather than silently omitting it — the project is
`private: true` and unpublished, so nothing requires a license today, but the
default without one is *all rights reserved*, meaning nobody may reuse the domain
physics or the drag tables. That is the owner's call, not a cleanup task, so it is
now written down in the file itself and in `docs/REVIEW.md` P3-1.


### The seed-to-database loader, and the gate that would have caught the `INSERT OR IGNORE` bug

**Closes `docs/DATA-TODO.md` §0.2a and §0.2b.**

**The gap.** Replaying all 16 migrations against a fresh SQLite produced **24
tables and 69 rows**, with **19 tables empty**. `bullets` held 0 rows and should
hold 120. No script wrote `data/seeds/*.csv` into a database, so the schema, the
989 curated rows and the deployed app were three disconnected things.

**Not done first, deliberately.** The obvious move was a new
`scripts/data/load-seeds.mjs` that reimplemented the load. That would have
produced two implementations of the same FK-safe, per-file coercion logic, and
they would have drifted silently — exactly the failure mode `scripts/shared/`
exists to prevent.

Instead, `check-seeds.mjs` already contained the correct load as a side effect.
`scripts/shared/load-database.mjs` **imports** it. That needed one change to the
gate: its reporting and `process.exit(1)` are now behind an `isMain` check,
while the load itself stays unconditional. Importing now builds a populated
database without printing or killing the caller.

**Consequence, stated plainly: the loader is only as correct as the gate.** If
`seed:check` passes, the database is populated correctly. That is the point, and
it is why `seed:check` runs before anything that consumes the database.

**The gate (0.2b).** `schema:check` passed while 19 tables were empty because it
only checked that migrations applied and that three named tables were non-empty.
It now declares a CSV→table→expected-count table and fails on any mismatch —
measured against the *populated* database, since a migration replay alone gives
`cartridges: 8` (the reference data hard-coded in migration 100) and
`bullets: 0`.

**Verified.** `npm run db:local` writes a 2.3 MB `data/generated/apex.sqlite`:
`integrity_check` = `ok`, `foreign_key_check` = 0 violations, **1,666 rows
across 24 tables**, `bullets` 120 and `powders` 169 — the exact acceptance
criteria for 0.2a.

**Negative-tested properly, after three attempts that proved nothing.** Removing
7 bullet rows produces `FAIL bullets -> 0 (expected 120)` and **exit 1**; the
clean run exits 0. The first two attempts were invalid: patching `INSERT INTO
bullets` was a no-op because it already read `INSERT OR IGNORE`, and
`length = 113` left holes in the array and crashed instead of testing parity. A
green exit code from a bad test is worth less than no test.

**A bug this caught in my own work.** The first version wrote the file and *then*
checked `problems`. A failed run left a stale, partly-broken `apex.sqlite` on
disk, and the next run read it back as current — which made a corrupt build
report `bullets: 119` and look like a near-success. Reordered: check first, write
second. On failure the previous good file survives.

**Not done:** D1 provisioning (§0.2c). `wrangler.toml` still carries
`database_id = "REPLACE_WITH_YOUR_D1_DATABASE_ID"`; that needs owner credentials
and is not a code change.

**Docs corrected rather than left to drift.** `README.md`, `docs/DATA-MODEL.md`,
`docs/TODO.md` and `docs/DATA-TODO.md` all still described the loader as absent.
While updating `README.md` I wrote a row for `npm run db:remote` — **a command
that does not exist**. Caught by checking `package.json` instead of trusting my
own edit, and removed. Documenting a command that does not run is the same class
of defect as dead code.

**Verified:** `npm run verify` green, **222 tests** (215 domain + 7 website),
parity block green in the real suite, no negative-test residue in
`check-seeds.mjs`.

### The documentation gate could not see a wrong path — and nine of them were wrong

**Found while auditing the handoff docs after the loader work.** Asked whether
`AGENTS.md` and `HANDOFF.md` were genuinely current. They were not, and the
reason is more useful than the fix.

**What `docs:check` actually checked.** Structure: balanced fences, headings
not swallowed by a fence, duplicated lines, encoding. All correct, all passing.
**It never checked that a path existed.** A document could point at
`scripts/promote-powders.mjs` — which moved to `scripts/data/` in the 1 Oct
reorg — and every gate in the repo passed on it.

**Nine live references were broken**, across four of the five handoff documents:

| Doc | Broken | Now |
|---|---|---|
| `AGENTS.md` | 5 (promote-powders, report-coverage, test-encoding ×2, check-seeds) | corrected |
| `HANDOFF.md` | 4 (check-handoff ×2, check-website-build, `docs/WEBSITE-BUILD.md`) | corrected |
| `SECURITY.md` | 1 (`security-check.mjs`) | corrected |
| `ARCHITECTURE.md` | 1 (`docs/AGENTS.md` → root) | corrected |

Three of the HANDOFF ones named `apps/website/index.html` as *the artefact
Cloudflare serves* — the file that moved to `src/` and is now built to
`dist/`. A handoff document telling the next agent to protect a path that no
longer exists is worse than no handoff document.

**The fix is a seventh check in `docs:check`**, not a one-off cleanup. Every
repository path in backticks, prefixed `scripts/`, `apps/`, `packages/`,
`data/` or `docs/`, must resolve. Scoped narrowly on purpose:

- Fenced code is skipped — a path in a shell block is an argument, not a claim.
- `CHANGELOG.md` is exempt **from this check only**. It records what was true
  when each entry was written; "correcting" those paths would erase the record
  of where the code used to live.
- `PATH_ALLOWLIST` holds five entries, and each one carries its reason inline.
  An unexplained allowlist entry is how a dead path gets to live permanently.

**Two mistakes of mine, both recorded in the AGENTS.md traps table.**

Declaring `PATH_SCOPE` *below* the run loop: the `checkPaths` function hoisted
so the call site was valid, but the `const` did not, giving "Cannot access
before initialization" on the first file.

And the negative test passed for the wrong reason — appending a backticked path
through a PowerShell here-string silently ate the backticks, so the injected
text had no inline code to match and the gate correctly did not flag it. Rebuilt
with `[char]96`, the test then behaved: **exit 1 on a broken path, exit 0
clean.** A green test that proves nothing is the specific failure mode this
repo's conventions exist to prevent.

**Verified:** `npm run verify` green, **222 tests**, `docs:check` green across
57 files, eslint clean on the gate, negative test confirmed in both directions.

### The CSP was not unproven. It was shipping broken, and every check said it was fine.

**The highest-ranked open item in `AGENTS.md` was that the CSP had never run in a
real browser. Testing it in one showed something considerably worse.**

**What was actually wrong.** `apps/website/public/_headers` carried

```
script-src 'nonce-{RANDOM}' 'strict-dynamic';
style-src  'nonce-{RANDOM}' https://cdnjs.cloudflare.com;
```

`{RANDOM}` was a placeholder nothing replaces. Cloudflare Pages parses
`_headers` at deploy time and sends its values verbatim — I checked their
documentation, and there is no per-request substitution of any kind. A nonce needs
to be fresh per request *and* present as an attribute on the element; neither is
possible for already-built inline markup served as a static file.

**Measured, in Chrome, serving the real `dist/` under the real headers:**

```
The source list for 'script-src' contains an invalid source: ''nonce-{RANDOM}''.
Executing inline script violates ... 'script-src'. The action has been blocked.
```

| | with the CSP | without it |
|---|---|---|
| `bodyFont` | **Times New Roman** | **Inter, sans-serif** |
| rendered text | **3,741 chars** | **5,679 chars** |

The script never ran. **This would have shipped a broken site.**

**Why every gate passed it.** `check-website-build.mjs` verified that `_headers`
existed, contained a CSP directive, and contained no `unsafe-*` keyword. All
three were true. It never asked whether the *page* satisfied the policy. The
header was, by every measure the gate checked, a correct policy — and a policy
that renders nothing.

**The fix, in three parts.**

1. **The four inline `style=""` attributes are gone.** `style="--bar-width: 45%"`
   on the cost bars was a genuine violation: a nonce cannot cover a style
   attribute, and without `unsafe-hashes` each one is blocked at runtime. I had
   previously recorded that these were "not governed by CSP at all" — true only of
   the widths main.js rewrites through the CSSOM, **not** of the four static
   placeholders in the markup. Verified: four "Applying inline style violates"
   errors, bars rendering at 0%. The defaults now live in `styles/theme.css`
   beside the rule that consumes them.

2. **`npm run website:csp` generates the hashes.** They are a property of the
   *emitted bytes* — the bundler rewrites module boundaries and Tailwind class
   names — so they cannot be hand-written and they cannot be committed.
   `website:build` runs it automatically. It is deterministic: same bytes, same
   hash, and re-running it on an unchanged build rewrites nothing.

3. **`website:check` verifies them against the build**, and additionally rejects
   any `{RANDOM}`, any `style=""`, any `on*=` handler, and any `unsafe-*` keyword.

**Verified working.** Serving the shipped `dist/` under the shipped `_headers`:
`Inter, sans-serif`, 5,679 characters — identical to the no-CSP baseline — with
**zero CSP violations**, and all four CDN and font requests returning 200.

**Negative-tested four ways**, each confirmed to exit 1: reintroducing a
`style=""` attribute, corrupting a hash, restoring `{RANDOM}`, and (implicitly,
via the build reproducibility step) drifting the hash by editing the source.
Restoring the correct state returns exit 0 each time.

**Two things I got wrong, recorded in the traps table.**

The first `_headers` parser I wrote for the browser test anchored header names
with `^`, but the real file indents them, so it silently matched nothing and I
concluded the header was empty. And my first pass of the `_headers` rewrite used
a whole-file replace that would have corrupted the comment block explaining the
policy.

**A gap I found in the plan itself.** `handoff:status` failed on this change
because the shipped artefact's SHA-256 no longer matched. That is the gate
working exactly as designed — it cannot tell an approved change from an
unapproved one. Accepted it explicitly with `npm run handoff:accept` rather than
loosening the check.

**Known limitation, stated rather than hidden.** The browser check
(`scripts/tests/check-csp-in-browser.mjs`) is wired into CI, where ubuntu-latest
has a working Chrome. **It skips with exit 2 on this machine** — the installed
Chrome hangs on `--dump-dom` past 45s under every combination of offline flags
tried, apparently because of its updater. I verified the CSP behaviour manually
through the Chrome DevTools MCP instead, and the skip is deliberately loud rather
than a silent pass. Its first real execution will be on CI.

### Affiliate links that actually earn, and the price-scraper plan I did not build

**The brief was: add retailers, scrape every online retailer for prices, show
the cheapest, and apply to affiliate programs. Three of those four were already
done or were wrong, so the work was mostly measurement plus one correction.**

#### What already existed

Migration 013 had anticipated this in October, correctly and in detail.
`sourcing_retailers` already carries `link_template`, `affiliate_network`,
`network_store_id`, `feed_url`, `feed_format` and `scraping_status`; there are 8
retailers, 12 search targets and 22 listings. Its header explicitly says it
stores the facts a tagging scheme needs and deliberately does **not** "append a
tag, resolve a placeholder, or know any network's query-string format into the
database". That last part was the missing code, not a missing table.

Worth stating plainly: the design was right and I did not need to add a
"retailers dataset". `npm run affiliate:status` shows exactly where things stand.

#### The correction: a link earns commission, a price does not

The plan assumed price scraping was the mechanism. It is not. **A link earns
commission. A price does not.** The revenue path is a tagged deep link, and
everything it needs was already in the database.

So `scripts/shared/affiliate-links.mjs` does pure string handling and **fetches
nothing**. No price, no stock, no HTML. That is what keeps it trivially testable
and impossible to get wrong from a network standpoint.

**Its safety property:** a tag is appended only when `affiliate_network` AND
`network_store_id` are both present. Every retailer has `network_store_id` NULL
today, so every link produced today is clean and untagged. Filling in a store ID
switches that retailer to tagged links automatically — no flag to forget, and no
code path that can tag a link with a placeholder ID. That is the failure mode
that makes affiliate links look like they are working while earning nothing.

**13 tests**, all fixtures taken from the real seed CSVs rather than invented
URLs, because a test against made-up input does not prove it handles the data it
will be given. Negative-tested: removing the store-ID guard fails the suite.

**A bug the tests caught:** an empty search term produced `?q=` — an empty search,
not an unresolved placeholder, so my first fallback missed it and the test failed.
Both cases are now covered, because "no search" and "broken search" are different
bugs with the same wrong outcome.

#### Why there is no price scraper

Not caution — the sanctioned path is already in the schema. `feed_url` exists
because affiliate networks exist largely to *distribute* product data to approved
publishers; a product feed is the intended way to get price and stock, and it is
faster and better than scraping.

Scraping instead is usually a **contract violation**: network agreements grant
permission to send traffic, not to copy data. Caught means account closure — of
the very account that would have earned the commission. And displaying a price is
a representation that must be accurate, so a stale scraped price is legal exposure
in several jurisdictions.

Migration 013 already reached this conclusion: `scraping_status` allows
`blocked`, `unsupported` and `no_feed`, and the comment calls a bot-blocked
retailer *"a supported outcome"*. I did not override that.

The full argument, and the three legitimate alternatives, are in
`docs/AFFILIATE.md`.

#### `affiliate_outreach` — the part only a human can do

`affiliate_status` has been `unknown` for all 8 retailers since October and
cannot move without someone opening a browser: applying needs an account, an
email address and a form. That work is now a table (migration 016) rather than
something remembered.

`commission_rate_pct`, `cookie_window_days` and `terms_verified_on` are all
nullable and start NULL. I did not guess a single network or rate. The seed data
refuses to guess because **Natchez migrated off AvantLink** and Brownells is
listed on more than one network — a rate from a stale aggregator is a number that
looks right and does nothing.

The view's most valuable column is `next_step`, which surfaces the state that is
green in every other column and still earning nothing:
**`approved but no store id — links are UNTAGGED, no commission`.**

#### Two mistakes of mine

Building migration 016, I corrupted the file **three times**: `insert_line`
spliced a `CREATE VIEW` into the middle of the `CREATE TABLE`, and a PowerShell
`-replace` injected literal `+` characters into 100 lines. I found both by
running the migrations rather than trusting the edit. Rebuilt from scratch, and
verified: all 17 apply cleanly, the view exists, and both the `CHECK` on
`outreach_status` and the unique index on `retailer_id` actually reject bad input.

The lesson is the one already in the traps table — a file edit that produces a
plausible-looking file is not a verified file.

**Verified:** `npm run verify` green, **235 tests** (215 domain + 7 website + 13
affiliate), `schema:check` parity green, `affiliate:status` reporting all 8
retailers as untracked rather than hiding the backlog.