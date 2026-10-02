# Trademark and brand-name research

Output directory for task **`trademark-clearance`** (T1). Written by a read-only
research agent. **No source file, brand string, config file or ledger entry was
created or modified by this task.** Nothing here is project source until a reviewing
agent merges it — and merging requires the owner to choose a name first.

**Model:** default model, fresh instance.
**Registry searched:** USPTO Trademark Search (`https://tmsearch.uspto.gov`),
exact-string Wordmark field. **Domains checked:** 3 Oct 2026.

> **THIS IS RESEARCH ONLY. IT CHANGES NO SOURCE AND NO BRAND.**
> The owner asked for a rename. That request is blocked on these findings, and the
> owner has NOT authorised any rename.

## Deliverables

- [`01-name-clearance.md`](01-name-clearance.md) - USPTO clearance for 17 candidate
  names, with exact-match counts, LIVE/DEAD split, IC 013 / 009 / 042 hits, vertical
  (web) collisions, and a clear / caution / avoid verdict for each.
- [`02-domain-options.md`](02-domain-options.md) - domain position for the whole pool
  across `.com`, `.dev`, `.io`, each with its DNS method and an explicit confidence
  level; the top 5 ranked on clearance *and* domain; and why domain age and trademark
  rights are separate.

## Headline findings

| Finding | Evidence |
|---|---|
| **APEX AMMUNITION is a LIVE registered trademark in this product category** | Reg. 5391055, IC 013 (shotgun shells), Apex Ammunition LLC (Mississippi). Live storefront at apexmunition.com with an 18+ age gate. **Independently re-confirmed by this task** — the search routine returns it. |
| **`loadforge` is rejected despite zero registrations** | https://loadforge.app/ — *"LoadForge — Internal Ballistics for Handloaders"*, a live competitor. Registry-only clearance would have wrongly passed it. |
| **`recipelab` is rejected** | Two LIVE PENDING applications: IC 042 SaaS (RecipeLab LLC, Delaware) and IC 009 apps (NickKaz Fit LLC, Georgia). Exactly the two classes that matter for a software product. |
| **`loadsmith` is rejected** | LIVE/REGISTERED, reg. 6076028, IC 035/039, Loadsmith Holding Corporation (Denver). Reads as manufacturing. |
| **`loadsense` is caution** | Live IC 009 mark (Stress Indicators, Inc.) plus two dead filings showing prior use in instrumentation. |
| **Best cleared name: `ballisticsapi`** | 0 USPTO hits, and `.com`, `.dev` and `.io` are **all NXDOMAIN** — the only candidate with a clean `.com`. |
| Also clear: `powderlab`, `trajectorylab`, `ballisticslab` | 0 USPTO hits, no vertical collision; `.dev`/`.io` NXDOMAIN, `.com` taken. |

## How to read these documents

Every factual claim about another party carries a URL or a serial number. Anything
unverifiable is recorded as unverified rather than inferred — the same rule this
project applies to seed data, where a blank cell means "not known" and never a
plausible guess.

Two things these documents deliberately do **not** do:

- They give **no legal advice** and contain no likelihood-of-confusion opinion.
- They report **no domain as "available"**. Every domain carries its DNS method and a
  confidence level; `NXDOMAIN` is a strong signal that still needs registrar
  confirmation.

**Professional review by a qualified trademark attorney is recommended** before any
brand change or any filing, including a search outside the US register.

## Related

- `tasking/pending/brand-rename/` - the rename itself. **Blocked** on this task and on
  an owner-chosen name. This directory supplies evidence, not a decision.
- `docs/research-competitors/README.md` - the sibling research index whose format this
  file follows. (Named rather than linked: this directory is a staged copy under
  `tasking/completed/`, where a relative link to a path that does not exist inside the
  copy would be a dead pointer.)
- `.clinerules` - never invent a value; the same discipline applies to a brand name as
  to a pressure figure.

This file exists so the directory is tracked by git: git does not record empty
directories, and a task pointing at a directory a clean checkout does not contain
fails `tasking:check`.