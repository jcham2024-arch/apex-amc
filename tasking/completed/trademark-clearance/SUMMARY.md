# SUMMARY — trademark-clearance (T1)

One-page digest of [`REPORT.md`](REPORT.md). Read this first; the report has the
evidence.

**What it was:** trademark and brand-name clearance research for a reloading-data
site named after a LIVE registered trademark in its own product category.
**Outcome:** complete. 17 names searched, 33 domains checked, one recommendation.

---

## The headline

**The owner should rename.** The site is named after **APEX AMMUNITION**, reg.
**5391055**, **LIVE** since 2018-01-30, **IC 013 (shotgun shells)**, held by Apex
Ammunition LLC (Mississippi) — an operating ammunition business with a live storefront
and an 18+ age gate. Live mark, live competitor, same market: about as close to the
worst fact pattern as exists.

## Recommendation

**`ballisticsapi`** — 0 USPTO hits, and `.com`, `.dev` and `.io` are **all NXDOMAIN**.
The only candidate with a clean `.com`.

Also clear: `powderlab`, `trajectorylab`, `ballisticslab` (0 hits; `.dev`/`.io`
NXDOMAIN, `.com` taken).

Rejected: `recipelab` (two LIVE PENDING — IC 042 SaaS and IC 009), `loadsmith`
(LIVE/REGISTERED, reg. 6076028), `loadforge` (**live competitor**).

## The finding worth remembering

> **`loadforge` has ZERO USPTO registrations.** Any registry-only clearance search
> would have recommended it. It is rejected *solely* because a web search found a
> live competitor at `https://loadforge.app/` — "LoadForge — Internal Ballistics for
> Handloaders".
>
> **Registry search alone is not clearance.**

That is the reusable lesson from this task, and it is why the brief required a
vertical search alongside the registry one.

## Risk

| Choice | Residual risk |
|---|---|
| **Do not rename** | Ongoing infringement exposure; realistically a demand to stop using the name, forcing a rebrand at the worst moment. |
| **Rename** | **Low**, provided the name is cleared outside the US register. |

Caveats carried in the full documents: **USPTO only** (no EUIPO/UKIPO/CIPO/IP
Australia); **not** a likelihood-of-confusion opinion; **not legal advice**. An
attorney should review any actual change.

## Deliverables

| File | Contents |
|---|---|
| `docs/research-trademark/01-name-clearance.md` | 17 candidates: exact-match count, LIVE/DEAD, IC 013/009/042 hits, vertical collisions, verdict |
| `docs/research-trademark/02-domain-options.md` | 33 domains, method + confidence each; top 5; domain-age vs trademark-rights |
| `docs/research-trademark/README.md` | Directory index |
| `REPORT.md` | Five-part §8 report, DoD checklist, known limits |

## Two things that need someone else's decision

1. **`tasking:check` cannot pass for any completed task.** The README says move the
   folder to `completed/`; the gate reads manifests only from `pending/`. Another
   agent hit the identical error on `ballistics-oracles`, so this is systemic.
   Recommendation and options in [`REPORT.md`](REPORT.md) §6.
2. **`BRIEF.md` and `task.json` disagree** on the output path (`T1/` vs
   `trademark-clearance/`) and the brief never mentions `REPORT.md`. The manifest was
   followed. Left uncorrected — `pending/` is not mine to edit.

## Did not authorise anything

**No rename was performed and none is authorised.** `brand-rename` remains blocked on
an owner-chosen name. This folder is evidence for that decision, not the decision.

---

*Model: default model, fresh instance. Registry: USPTO, exact-string Wordmark field,
3 Oct 2026. No project file was created, edited or deleted.*