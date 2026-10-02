# Portability notes — what another project actually needs

The brief: *"the minimal set of files and rules another repo needs, what must be
renamed, and what is irreducibly ApexProject-specific. A portability note nobody can
apply is not a deliverable."*

**Method: read the framework's files and classify every one.** Not by what they are
about, but by whether they would work unchanged in a repository that has no
ammunition, no Cloudflare, and no D1 database.

---

## The minimal transferable set — 7 files

Copy these. They contain no domain knowledge and no project-specific assumptions.

| File | **Measured lines** | Why it travels |
|---|---|---|
| `.clinerules` §1, §5, §10, §11, §12 | ~180 | The isolation rule, engineering rules, swarm, mail, proposals |
| `tasking/README.md` | **194** | The four-tier protocol |
| `tasking/mail/README.md` | **267** | Mail protocol + header format |
| `scripts/gates/check-tasking.mjs` | **258** | Manifest/output verification |
| `scripts/gates/check-mail.mjs` | **199** | Mailbox + STOP verification |
| `scripts/gates/check-proposals.mjs` | **234** | Evidence bar for proposals |
| `scripts/tasking/ensure-standing-task.mjs` | **180** | The rotating standing slot |

**Measured total: ~1,512 lines** (I first wrote "~1,100" from estimation. The gates are
larger than the docs.) That is the whole migration cost, and it is small enough to be
worth doing.

## The write-set / manifest layer — 3 more

| File | Note |
|---|---|
| `scripts/shared/task-manifest.mjs` (or equivalent) | The `apex-task/1` schema |
| `tasks.json` | Machine-readable queue state |
| `scripts/tasking/seed-*.mjs` | Optional — only to seed an initial queue |

---

## What must be RENAMED

| As shipped | Becomes | Why |
|---|---|---|
| `tasking/` | keep — it is already generic | No rename needed |
| Agent ID `main` | your worktree dir name | Already parameterised |
| `T<n>` in old briefs | folder ids | The T-numbering is dead; do not copy it |
| `apex-task/1` | `<project>-task/1` | The schema string is cosmetic but reads as project-owned |

**No filename needs changing, and the framework is almost entirely free of
project-specific text.** Measured, `apex|Apex` occurrences:

```
tasking/README.md                      : 0
tasking/mail/README.md                 : 1
scripts/gates/check-tasking.mjs        : 0
scripts/gates/check-mail.mjs           : 0
scripts/gates/check-proposals.mjs      : 0
scripts/tasking/ensure-standing-task.mjs: 1
```

**Two mentions across ~1,500 lines.** That is the strongest evidence this framework was
written to travel — the separation is real, not aspirational.

## What must be REPLACED, not copied

| As shipped | Becomes |
|---|---|
| `.clinerules` §1 baseline | "exit 0, all stages green" + the count command for **your** `verify` |
| `.clinerules` §5 engineering rules | Domain rules: CSV conventions, `never invent a value`, encoding rules are **universal and travel as-is** |
| `npm run verify` gate list | **Entirely yours.** 19 stages here is an ApexProject fact |
| `docs/` cross-references in rules | Remove; they point at `docs/BRASS-AND-PRESSURE-CLASS.md` etc. |

## What is irreducibly ApexProject-specific

**Everything in `scripts/` outside the gates.** Specifically:

- `scripts/shared/data.mjs` — CSV loading, the `root` convention, `loadKnown()`
- `scripts/gates/check-seeds.mjs`, `check-docs.mjs`, `check-encoding.mjs`,
  `schema:check`, `data:validate`, `coverage`
- `packages/ballistics-core/` — the domain physics

**`scripts/gates/` is the boundary.** Three files travel (tasking, mail, proposals); the
rest are about ammunition data and would be replaced by whatever *your* project needs
gated.

---

## What breaks, and how it broke here

**Two things break on adoption. Both broke here first, so they are documented rather
than hypothetical.**

**1. `KNOWLEDGE.md` is a convention, not a mechanism.**
Measured here: **13 of 19** completed tasks have one. The other six put findings in
`REPORT.md` or `NOTES.md`. Nothing enforces it, and nothing reads it — an agent cannot
tell which task holds the finding it needs.

> **Do not copy `KNOWLEDGE.md` as a required output on day one.** Adopt it when a project
> has ~5 completed tasks and the recall cost is visible. Before that it is ceremony.

**2. The standing slot needs a restock, and forgetting it stops the swarm.**
`HISTORY.md` records the first version counting a *completed* rotation as busy, so:

> "after one full claim-complete cycle the slot did not come back, so it regenerated
> exactly once and never again - which is the precise failure it exists to prevent."

**On adoption: run `tasking:restock` at the end of every session that used the slot.**
That is the whole operational burden, and it is one command.

---

## What travels that is NOT in this repo

The brief asks me to look outside. **Two patterns this framework already solves, and one
it does not.**

**Solved here, worth keeping:** claiming by **folder move** rather than a lock file or a
status flag. `HISTORY.md`:

> "The same reasoning already chose a folder move over a status flag; a file only one
> agent writes completes the pattern."

That is the standard distributed-systems answer (you cannot atomically lock a shared file
from independent processes; you make the claim visible in the filesystem) arrived at
independently. **It is correct and it is portable.**

**Not solved here: the retrieval layer.** The framework has no index — measured, see
`01-finding.md`: 108 files, 794 KB, **zero** index files, one fact restated 70 times.
Multi-agent frameworks that persist memory across sessions generally provide **one**
durable memory with a lookup, not one per agent. **This framework writes one folder per
task and never joins them.**

**That is the single most valuable thing to fix on adoption**, and it is the proposal
filed alongside this note.

---

## A 30-minute adoption checklist

1. Copy the 7 framework files + the write-set layer.
2. Replace `.clinerules` §1 baseline with your own verify command.
3. Delete `docs/` cross-references from the copied rules.
4. **Do not** copy the gate scripts that read your data.
5. Add `tasking:restock` to your session-end habit.
6. After ~5 tasks: build the index. Before that, skip it.
7. Seed one standing task so an idle agent is never stuck.

**Total: an afternoon, plus the discipline to run one command at the end of each
session.** The framework is genuinely portable; what it lacks is a way to remember.