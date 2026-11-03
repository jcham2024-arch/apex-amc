# 02 — Licence type meaning

Task `local-shop-directory`. **Researched 3 Oct 2026.**

> **The type codes below could not be read from the file** (ATF returns 403 — see
> `01-schema-and-licence.md` §1). The meanings are from the general FFL typology, not from a
> measurement, and **the mapping onto this dataset's actual column is unverified.**

---

## The FFL licence types

The ATF issues several licence classes. The ones the brief names:

| Code | Name | What it authorises |
|---|---|---|
| **01** | **Dealer in firearms** | Sale of firearms and ammunition to the public, subject to federal requirements (licence, recordkeeping, age/state checks) |
| **02** | **Pawnbroker** | Pawning firearms, and incidental sale |
| **03** | | Collector of curios and relics (C&F) |
| **06** | **RELOADER OF AMMUNITION** | **The one this site wants** — manufacture/reload ammunition for other licensees and non-licensees |
| **07** | **Manufacturer of ammunition** | Manufacture and sale of ammunition |

**06 is genuinely the strong signal**, and the brief is right to identify it. A reloader's
licence exists *specifically* because they reload ammunition for others — that is the
business definition, not an inference from a name.

---

## What each code implies, and what it does NOT

This is the section that matters, and the discipline is the same one
`apps/website/src/data/retailers.js` applies to retailer cards.

### Type 01 — Dealer

| | |
|---|---|
| **Implies** | A licensed firearms dealer existed at this address on the snapshot date. |
| **Does NOT imply** | ❌ That it sells **ammunition**. Federal law requires a licence to sell *firearms*; **ammunition is a separate product line and many dealers do not stock it.** |
| **Does NOT imply** | ❌ That it sells **reloading components** — powder, primers, brass, bullets. **Nothing in an FFL covers those at all.** |

**That last row is the one that bites.** Our product is reloading data. **The overwhelming
majority of what this site is about is invisible to the FFL schema.**

### Type 06 — Reloader of ammunition

| | |
|---|---|
| **Implies** | A licensed ammunition reloader at this address on the snapshot date. |
| **Does NOT imply** | ❌ That it has a **retail storefront**. Reloaders are frequently mail-order-only or wholesale-to-wholesale. |
| **Does NOT imply** | ❌ That it is **open to the public**. A 06 may sell only to licensees. |
| **Does NOT imply** | ❌ That it still **exists**. The snapshot is December 2021. |

### Type 02 — Pawnbroker

| | |
|---|---|
| **Implies** | A licensed pawn operation. |
| **Does NOT imply** | ❌ Gunsmithing, reloading services, or component sales. |

---

## The finding that should change the feature

> **The single most reliable filter (06) points at businesses least likely to have a
> storefront, and the filter that points at storefronts (01) says nothing about ammunition
> or reloading at all.**

**The dataset cannot answer the question the owner asked.** "Find me a shop near me that
sells ammo and reloading supplies" is **not a question this data can answer.** It answers
the much weaker *"where was an FFL licence held in December 2021."*

**This is not a reason to drop the feature** — it is a reason to be precise about what it
would be: **a directory of licensed businesses, presented with that framing**, not a
directory of ammunition sellers.

**And `prohibits[]` already forbids the claim the data invites:**

> "Do not claim a listed business currently sells ammunition. The FFL list says a licence
> exists, not what is on the shelf."

**The brief anticipated the risk and the data confirms it: the temptation is built into the
source.**

## Ranking, for whoever implements

| Priority | Filter | Confidence |
|---|---|---|
| **1** | Type **06** (reloader) | **Highest** — the licence exists *for* this activity |
| 2 | Type **07** (ammunition manufacturer) | High — makes ammunition, but sells wholesale |
| 3 | Type **01** (dealer) | **Low** — storefront likely, ammo unknown, components never |
| 4 | Type **02** (pawnbroker) | **Lowest** — adjacency only |

**But note the tension:** 06 is the *best filter* and the *worst storefront source.*
**A filter that is 90% correct and yields mostly mail-order businesses may produce a worse
user experience than a broad, honestly-framed list.** That is a product decision, not a
data one — and it is the owner's.

## What is unverified

- **The exact code strings in this dataset.** Commonly `01`, `02`, `06`; sometimes with a
  suffix (e.g. `01`, `07`, `06` plus a `distributor` flag). **Unverified — needs the file.**
- **Whether the file exposes type as a code, a description, or both.** Unverified.
- **Whether a licence record carries an expiry or status field** — which would be the one
  thing that could partly answer "does this still exist". **The brief's `03-` model
  assumes we cannot know; that assumption should be tested against the real file.**