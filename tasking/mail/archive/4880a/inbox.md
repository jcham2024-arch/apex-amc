> **ARCHIVED 2026-10-03T00:47:40Z.** Agent `4880a` is closed. This file is kept verbatim as the record of what it found and reported. It is no longer read by `check-mail`, so it can no longer fail the build - but it is still evidence.

# Inbox: 4880a


Only 4880a writes this file. Full protocol: ../README.md

<!-- 2026-10-02T15:05:00Z | AGENT 4880a | STOP -->
**Task:** cartridge-dimensions
**Status:** complete
**Written:** 7 files in completed/cartridge-dimensions/ — the 4 declared in task.json
(REPORT.md, cartridge_dimensions_filled.csv, 01-source-survey.md,
02-provenance-log.md) plus task.json and BRIEF.md carried through, plus
03-protocol-findings.md (protocol analysis, undeclared).
**Moved to:** tasking/completed/cartridge-dimensions/
**tasking:check:** passes (46 declared outputs verified across the swarm)
**Key finding:** 0 dimensional cells transcribed, deliberately. CIP states verbatim
that reproduction "as well as in the form of extracts" is forbidden without
approval, and a column of dimensions IS an extract. Second blocker: CIP's 91 public
sheets address only ~11 of our 229 cartridges. The brief's premise understates the
restriction: reading is free, extracting is not.
**Unresolved:** SAAMI vs CIP disagreement could NOT be checked, because holding both
values side by side requires holding a CIP value. Needs permission first.

<!-- 2026-10-02T15:07:00Z | AGENT 4880a | NOTE -->
**Task:** cartridge-dimensions
**Correction to my own earlier claim.** I reported to HISTORY.md that
check-tasking.mjs undercounts pending/, and that it was reproducible and not a race.
That was WRONG, and it was my own measurement error. I instrumented a copy placed
under tmp/, whose relative import of the shared data module resolved to a path that
does not exist, so my probe measured a different module graph than the real gate. I
also compared its output against directory listings taken seconds apart. With the
swarm quiet the gate reports correctly: 12 tasks, 46 outputs verified.
The manifest-lookup defect I reported alongside it WAS real, and commit a729634 fixed
it to search all three tiers. Full correction and six throughput proposals are in
completed/cartridge-dimensions/03-protocol-findings.md.
**Highest-value proposal:** auto-derive blocked_by from a recorded blockers file, so a
task that cannot succeed is not re-attempted by every future agent.

<!-- 2026-10-02T15:09:00Z | AGENT 4880a | QUESTION -->
**Task:** cartridge-dimensions
**Q (BLOCKER, high priority): check-mail.mjs rejects every legal message, so no
agent can use the mailbox.**
**Evidence, constructed against a throwaway inbox so no real message was touched:**
- a header with no body: passes
- the README's own minimal STOP, being a header plus a Task line: FAILS
- a one-line NOTE: FAILS
**Why:** the gate splits the file on header boundaries and then fails if any
resulting chunk has content. Splitting on headers leaves the leading text plus each
message BODY as separate chunks, so every non-empty body trips the test. The gate is
satisfied only by an empty-bodied message, which is the opposite of its purpose. The
headers are located correctly; the bodies are simply never consumed.
**Suggested fix:** parse into messages instead of testing chunk emptiness. Match
every header and treat the text between header N and header N+1 as body N.
**Also:** the error text, "a message was written but its header is malformed", is
misleading. The headers are fine. The load-bearing check, a STOP claiming complete
with a missing output, passed correctly; only this parse check is broken.
**Confirm?:** needs the mailbox owner; it is not in my write-set.
<!-- 2026-10-02T15:40:00Z | AGENT 4880a | START -->
**Task:** cartridge-family-audit
**Claimed by moving:** tasking/pending/cartridge-family-audit -> tasking/in-progress/
**Priority:** high (roadmap-synthesis is the only 'highest' and another agent had
already claimed it; three 'high' remained and this was the first)
**Expected outputs:** 5 files, 1 of them CSV
(REPORT.md, KNOWLEDGE.md, 01-family-defects.csv, 02-blast-radius.md,
03-proposed-fix.diff)
**Reading:** task.json, BRIEF.md, and the seed columns the brief names. Nothing else.
Only 4880a writes this file. Full protocol: ../README.md

<!-- 2026-10-02T16:30:00Z | AGENT 4880a | STOP -->
**Task:** cartridge-family-audit
**Status:** complete
**Written:** 7/5 files in completed/cartridge-family-audit/. The 5 declared outputs
are present; task.json and BRIEF.md travelled with the folder.
**Moved to:** tasking/completed/cartridge-family-audit/
**tasking:check:** passes (69 declared outputs verified across the swarm)
**Key finding:** the brief's premise is right that family disagrees with name, but
wrong that this is one defect class. Four rows disagree; only ONE is safe to fix.
**  9-luger** genuinely misfiled (rifle to pistol). Corroborated three ways: SAAMI
designation, plus 003_seed_reference_data.sql line 18 seeds the same cartridge as
pistol.
**  327-fed** also misfiled, and NOT in the source KNOWLEDGE.md. Medium confidence,
so I escalated it rather than editing on a hunch.
**  22-lr** is NOT a defect. The source KNOWLEDGE.md section 3 calls it one. .22 LR
is chambered in rifles AND pistols; both are correct, so no correct single answer
exists.
**  4-bore-rifle** is a REVERSE defect: family=shotgun is CORRECT and the NAME is
wrong. An agent scanning for mismatches would "fix" it to rifle and make it worse.
**The finding that changes the fix:** 9 Luger is a DUPLICATE, not just a misfile.
The built DB holds 318 cartridges against 229 seeds. 003_seed_reference_data.sql
adds slug 9mm-luger (family=pistol, psi=35000) alongside our 9-luger (family=rifle,
psi=35000). Fixing family alone leaves two rows for one cartridge, and the .22
cluster has the same duplication. So I deliberately did NOT de-duplicate: that
changes row identity and can break cartridge_pressure_references joins and the
CARTRIDGE_ALIASES map in check-seeds.mjs.
**Also corrected the source's impact claim:** it says users see it in the wrong
bucket. Measured, they do not. apps/website/src/main.js contains no occurrence of
cartridge, family or pistol; the only family string in apps/website/src/ is a Google
Fonts URL. Costs come from a hardcoded calibers.js. The defect is LATENT for the UI,
not visible in it, and is correctable before anyone builds a platform filter.
**Contradicted the brief, and saying so:** the brief asks me to find them all and
produce rows to change. Two of the four rows must NOT be changed, so the diff
contains one change, with the three exclusions named in its own header.
**Unresolved:** .327 Fed needs SAAMI Z299.3 confirmation. .22 LR needs a platform
policy. 4 Bore Rifle needs renaming, which task.json prohibits. And no gate can
<!-- 2026-10-02T16:45:00Z | AGENT 4880a | START -->
**Task:** name-normaliser-spec
**Claimed by moving:** tasking/pending/name-normaliser-spec -> tasking/in-progress/
**Priority:** medium (the only three left were medium; gate-negative-tests was taken
by another agent while I worked)
**Expected outputs:** 4 files, 1 of them CSV (REPORT.md, KNOWLEDGE.md, 01-rules.md,
02-test-corpus.csv)
**Chosen because:** it is the task cartridge-family-audit could not do. That audit
found 4 Bore Rifle has a WRONG NAME rather than a wrong family, and renaming was
prohibited there. This task owns naming.
**Reading:** its task.json, BRIEF.md, and the alias map it names.
detect this defect class at all: family is CHECK-constrained for validity, never for
correctness. Proposal filed for the de-duplication.
<!-- 2026-10-02T17:10:00Z | AGENT 4880a | STOP -->
**Task:** name-normaliser-spec
**Status:** complete
**Written:** 6/4 files in completed/name-normaliser-spec/. The 4 declared outputs are
present; task.json and BRIEF.md travelled with the folder.
**Moved to:** tasking/completed/name-normaliser-spec/
**tasking:check:** passes (90 declared outputs verified across the swarm)
**Key finding:** the existing CARTRIDGE_ALIASES map in check-seeds.mjs is consulted
BEFORE any exact name lookup, and measured against the DB, 4 of its 12 entries bypass
a row whose name matches the query exactly. "9 luger" goes to 9mm-luger while our own
9-luger exists; same for ".308 win", ".223" and ".30-06 springfield". The fix is a
precedence change (exact name, then short_name, then slug, THEN alias), not a bigger
alias map.
**One of the four is a LIVE defect, not a latent risk.** 30-06-springfield exists with
saami_max_psi NULL; the alias redirects to 30-06 which carries 60000 psi. A pressure
lookup for that cartridge silently returns another row's value, and both rows are
family=rifle so no filter separates them. The other three return identical figures
today only by coincidence.
**Second defect found:** 308-winchester has short_name ".308 Win Mag", which belongs to
a different cartridge. I had claimed case/whitespace folding produced zero collisions.
That was true for name and FALSE for short_name. Corrected in KNOWLEDGE.md section 3.
**Prefix matching is unsound and currently looks correct:** a prefix rule for bare 9mm
matches exactly 1 row today, so it would pass every available test and break when a
real 9mm-prefixed different cartridge is added. Corpus OM-05 pins it.
**Second stale baseline in the swarm:** ammoseek-coverage KNOWLEDGE.md section 4 says
we hold 0 of 8 gauges and that 4 Bore Rifle is the only shotgun row. Measured now:
family=shotgun holds 9 rows, including 5 gauges and 2 .410 bores. Another agent filled
them. That document is cited as ground truth by queued tasks and is now wrong.
**My own corpus was defective on first write** and I am recording that rather than
quietly fixing it: 16 ragged rows from a missing field, then two slugs I guessed
(762x39) instead of reading (real slug is 7-62x39), and one over-merge pair for a
cartridge we do not hold. A checker that parsed the CSV and resolved every slug
against the database caught all of it. Final: 31 rows, 0 ragged, 46 of 46 slugs
resolve, 2 intentional (not-held) future-trap markers.
**Did NOT:** implement the normaliser, rename any stored name, or edit
CARTRIDGE_ALIASES or check-seeds.mjs. Also deliberately did NOT alias "4 Bore" - it
would point at 4 Bore Rifle, whose name is itself wrong per cartridge-family-audit.
Fix the name first.
**Unresolved:** 30-06 Springfield NULL psi needs a source or the redirect needs
dropping. 308 Winchester short_name blocks safe short_name folding. The duplicate-row
policy from my cartridge-row-identity proposal gates several rules here.
**Note on verify:** npm run verify is currently red on OTHER agents' files - mail:check
(552f4) and docs:check (552f4 bulletin, 879ca inbox, a new proposal). None are mine;
my inbox and my outputs pass their checks.