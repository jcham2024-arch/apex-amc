# Lessons — what this swarm has taught, in one place

Compiled 3 Oct 2026 from `tasking/completed/swarm-improvement/` and the corrections the
agents filed on each other. **Every line here was paid for.** If you add to this, add
the event that earned it — a lesson with no incident is a slogan.

Read this before changing how the swarm works. It records *why* each mechanism exists,
and several exist because I got it wrong first.

---

## 1. A folder move is a lock; a file you rewrite is a race

**Paid for by:** two claims lost to a shared `tasks.json`, then a corrupted brief.

A queue where agents read status and write it back has no lock. Two interleaved claims
lose one update, the task reverts to pending, and a third agent takes it — with the file
showing nothing wrong. Measured, not assumed:

```
tasks claimed: 1
>>> LOST UPDATE: two agents claimed, only one survives in the file.
```

`mv` is atomic. A task exists in exactly one tier, or the move failed. **Prefer a move
over a flag you rewrite, always.** The same rule scaled up: mail is one file per agent,
because appending to a shared file is read-modify-write and destroys messages silently.

## 2. One writer per file, so a mistake stays with its owner

**Paid for by:** an agent copying a seeded example header into its mailbox and turning
`check-mail` red for the whole swarm.

It was my fault — an example is an invitation — but the recovery is the lesson:
per-agent mailboxes contain the blast radius. Do not add shared writable files without a
reason.

## 3. A comment describing a guarantee is a hypothesis

**Paid for by:** a gate that shipped with a missing brace, silently reduced to checking
one task per run, and reported `0 outputs verified` while four completed tasks sat
unchecked. ESLint and `node --check` both passed.

Also: the CSP was never served in production. Every gate passed because every gate read
the *file* while the *response* carried no policy. **Verify the effect, not the input.**
An agent found the brace bug while doing its own task, not a gate.

## 4. Proof beats plausibility

**Paid for by:** approving a fix to a data *write* path on a plausible story.

`import-bullets.mjs` split CSVs on a bare comma — silent corruption, row count
unchanged. I did not reason about it; I measured it:

```
berger     naive===readCsv: true | rows: 109
hornady    naive===readCsv: true | rows: 7
sierra     naive===readCsv: true | rows: 4
```

Byte-identical across 120 real rows. **Prove a no-op before touching a write path.** That
is what makes "low risk" a measurement rather than a hope.

## 5. A gate that fails an accurate report trains silence

**Paid for by:** agent `ee247` filing a correct STOP that the gate rejected.

It declared 4/4 files; the gate said 6 were present. The agent was right — 4 outputs plus
the `task.json` and `BRIEF.md` that travel with the folder because claiming is a move.
**A gate that punishes truth teaches agents to stop reporting**, which defeats the entire
mailbox design.

## 6. Read intent, not keywords

**Paid for by:** two opposite failures in one day.

The safety bar banned `/reloading/`, blocking a lawful shop-directory task for saying
"reloading supplies" — while `recommend a charge for 9mm` sailed through, which is
precisely what `interior-ballistics` forbids. **The domain word is not the hazard; a
recommendation is.**

The same scan then flagged my own proposal for the phrase "charge weight" inside its own
`## Do not` section. **A gate that punishes honesty makes honesty impossible.** The scan
now excludes prohibitions before matching.

## 7. An agent's correction beats the agent's earlier claim

**Paid for by:** `ee247` twice — retracting a race claim, then a false impact claim in
`roadmap-synthesis`.

The first: it insisted a gate bug was "a race, not a measurement error", then found its
probe sat under `tmp/` with a broken relative import, measuring a different module graph.

The second: `roadmap-synthesis` claimed 9mm "sits under the wrong heading for every
visitor." `main.js` contains **zero** occurrences of `cartridge`, `family` or `pistol`.
The data defect is real; the user-visible impact was invented from a column name.

> **A wrong finding retracted by its author, with the reason, is the system working.**

Verify your own prior claims hardest. That is where the errors are.
## 8. Compliance is not the same as correctness

**Paid for by:** the owner asking for OOP factories in a deliberately functional codebase.

`ballistics-core` is pure exported functions with no hidden state; its 10 classes are
reserved for things that genuinely have state. Blanket OOP there is a regression dressed
as progress. The task was briefed to *assess* with evidence and to name the one place a
factory would actually pay. **When asked to apply a pattern, check whether it fits first.**

## 9. The swarm has no index, and duplicates what it cannot find

**Measured by:** `ee247`, in `swarm-improvement`.

108 markdown files / 794 KB at the time, growing to 134 / 915 KB within the hour. **The
single fact "0/229 populated" was restated 70 times across 27 files.** No `INDEX.md`, no
`FINDINGS.md`, no ledger.

Two agents independently proposed `findings-ledger` and **neither could see the other's
proposal**, because nothing reads that folder before starting a task.

> **`KNOWLEDGE.md` is a naming convention, not a retrieval mechanism.** It helps only an
> agent that already knows which folder to open — which is the agent that does not need it.

Duplication is not waste; restating a fact where it matters is right. **The absence of an
index is the defect.** The fix is additive — keep the restatements, add the lookup.

## 10. A proposal nobody reads is not a queue

**Paid for by:** twelve `shape: change` proposals sitting undispatched while agents went
idle.

They were correctly barred from unattended dispatch. But nothing triaged them, so the
swarm stalled on decisions nobody had been shown. `scripts/tasking/proposal-triage.mjs`
now records a verdict per proposal, and `seed-from-proposals.mjs` dispatches the approved
ones. **A backlog nobody reads is the same as no backlog.**

## 11. Put the decision where the next actor looks

**Paid for by:** my own brief telling an agent to datestamp its output folder, which fails
`check-tasking`'s id-equals-folder rule on every rotation and collides on rotation 1.

The agent recorded the conflict in `NOTES.md` §3 with a better rule than mine, and I
replaced my instruction with its analysis. **Rotation history accumulates inside one
folder, because the folder name is the lock.**

## 12. Idle is a failure state

An agent that finishes into an empty queue is a swarm that has stopped. Work completed;
nothing generated; the next thing needed a human. Hence the standing `swarm-improvement`
slot, regenerated rather than stocked — a task folder cannot be always-available, because
claiming *moves* it.

**And the honest limit:** none of this runs while every session is idle. It works *across
turns*. Two schedules maintain it, on offset cadences so they never collide.

---

## Related

- [HISTORY.md](HISTORY.md) — dated narrative of why each decision was made
- [FIX-BACKLOG.md](FIX-BACKLOG.md) — every defect the swarm found, and its status
- [../completed/swarm-improvement/01-finding.md](../completed/swarm-improvement/01-finding.md) — the index finding, measured
- [../completed/swarm-improvement/02-measurement.md](../completed/swarm-improvement/02-measurement.md) — including two negative tests that failed as expected