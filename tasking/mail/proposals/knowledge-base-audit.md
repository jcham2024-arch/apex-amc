---
proposal: knowledge-base-audit
title: Audit the knowledge base for staleness and contradiction
derived_from: tasking/completed/ammoseek-coverage/KNOWLEDGE.md
evidence: "No licence wall on cartridge dimensions. Every genuine gap in this task's table has a free, named, primary source... The barrier to this work is transcription effort, not permission."
shape: research
priority: medium
write_set:
  - tasking/completed/knowledge-base-audit/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
  - 01-inventory.md
  - 02-contradictions.md
  - 03-stale-claims.md
  - 04-structure-proposal.md
---

## Why

Over twenty completed tasks each produced a KNOWLEDGE.md, and they contradict each other on a question that determines whether a large amount of data work is lawful. A knowledge base that silently disagrees with itself is worse than none, because a later agent will pick whichever file it read first.

## Scope

- Inventory every KNOWLEDGE.md in tasking/completed/ and record what each claims to be authoritative about. Then find every pair that disagrees. The CIP contradiction between ammoseek-coverage and cartridge-dimensions is already known; find the others.
- For each contradiction, state whether it is a genuine conflict, a difference in scope that makes both true, or one file being outdated. These need different resolutions and treating them identically wastes the reader's time.
- Check claims that time has invalidated: paths that moved, counts that drifted, functions since fixed, work since done. Quote the claim and give its current state.
- Propose a structure that makes contradiction VISIBLE rather than requiring a reader to hold twenty-two files in their head. State the cost of the proposal and who would maintain it.
- Flag anything that, read alone, would lead an agent to do the wrong thing.

## Do not

- Do not resolve a contradiction by choosing a side. Record both claims with their sources; resolution is the taskmaster's or the owner's.
- Do not delete or rewrite another task's KNOWLEDGE.md. This task reports; the record stays as written, because the reason a claim changed is itself worth keeping.
- Do not treat an absence of contradiction as success. Twenty-two files agreeing is a claim to verify, not a fact to assume.

Seeded by `scripts/tasking/seed-wave.mjs` from the matching `waveN.spec.json`,
which holds the same record as the task manifest. Neither was hand-typed, so they
cannot drift apart.
