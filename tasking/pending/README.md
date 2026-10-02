# Pending tasks

Task briefs waiting for an agent. Read the file, then follow
[the workflow](../README.md).

These are the **only** place a task brief belongs. `docs:check` and `lint` both
process this directory, so a brief naming a path that does not resolve fails the
build before an agent follows it. That is intentional.

## Available now

All five are **research-only** and safe to run at the same time as each other or
alongside any code task, because each writes only inside its own
`tasking/completed/<ID>/` folder and copies nothing into the main tree.

| Brief | Task | Agent | Delivers |
|---|---|---|---|
| [task-T1-trademark-clearance.md](task-T1-trademark-clearance.md) | T1 | scout-legal | Trademark clearance for 12+ candidate names, plus domain availability |
| [task-T2-ballistics-oracles.md](task-T2-ballistics-oracles.md) | T2 | scout-math | Peer-reviewed methods that can verify the solver from outside |
| [task-T4-cartridge-dimensions.md](task-T4-cartridge-dimensions.md) | T4 | scout-data | SAAMI/CIP dimensional transcription for the 229 cartridges we hold |
| [task-T5-interior-ballistics.md](task-T5-interior-ballistics.md) | T5 | scout-math | Powder properties, load-synthesis physics, **and a feasibility verdict** |
| [task-T6-exterior-ballistics.md](task-T6-exterior-ballistics.md) | T6 | scout-data | Measured trajectory datasets and BC reference data |

### Two to read before you dispatch an agent

**T5 is safety-critical.** It carries a **hard prohibition**: the agent must not
produce or recommend any charge weight, not even as an example. That is the one output
in this domain where a plausible-looking wrong number injures people. If the agent
reports it could not complete the task without stating one, that is the finding, and
it is a good one.

**T4 expects an incomplete result.** Six dimensional columns are currently 0/229
populated. The correct output leaves cells EMPTY where a source does not state a
value. An agent that reports "I filled 90%" has probably invented the other 10%.

## Blocked

| Brief | Task | Waiting on |
|---|---|---|
| [task-T3-brand-rename.md](task-T3-brand-rename.md) | T3 | T1, **and** an owner-chosen name |

T3 is not a research task and does not follow the copy-out workflow. It edits the
live site and must not start on an assumption. See the brief.

## Before you start

Read `.clinerules` §1: **if `npm run verify` is red when you start, stop and
report.** A red baseline invalidates every Definition of Done in every task.

The recorded baseline is **exit 0, 235 tests**. `ci:check` currently reports 25
tasks in the ledger. If either differs, measure and report it rather than assuming
your brief is current.

## Dispatching

Give the agent three things:

1. the brief file - read §3 "Execution Prompt" and paste it to them verbatim
2. [tasking/README.md](../README.md) - the copy-out workflow they must follow
3. `.clinerules` - binding on isolation and on never inventing a value

Then tell them explicitly: **do not edit anything in the main tree.** That is the one
instruction whose violation undoes the whole system.