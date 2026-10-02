# Branding - history of the Apex name

**Status: RESOLVED 3 Oct 2026 - the name is Apex. See the last section.**

## Why the previous name was removed

The site was titled **"Apex Ammunition & Components"**. That phrase was, as of
2 Oct 2026, a **LIVE registered US trademark**:

| Field | Value |
|---|---|
| Mark | APEX AMMUNITION |
| Registration | **5391055** |
| Serial | 87507153 |
| Status | LIVE, registered 2018-01-30 |
| Owner | Apex Ammunition LLC (Mississippi, USA) |
| Class | IC 013 - shotgun shells |
| Basis | 1(a) - use in commerce |

The registrant operates `apexmunition.com`, a working ammunition storefront with its
own 18+ age gate. We are not a manufacturer and never intended to imply we were.

**This was not a judgement call and it was not speculative.** The registration was
found by direct USPTO search, and the storefront was fetched and read.

## Two corrections to the reasoning behind it

Both were established by measurement, and both are recorded here because the wrong
version was believed first.

**1. Domain ownership does not confer trademark rights.** The owner had held the
domains for ten years. That protects the *domain*; it never protected the *name*.
Domain registration and trademark are separate rights - a trademark protects words
that identify a source of goods, and it is bought precisely by people who already own
domains. Copyright was never relevant here at all: it covers original expression (the
solver, the data pipeline, the written material) and never protected the name. That
work remains ours and remains safe.

**2. The obvious workaround made it worse, not better.** The first proposal was
**"Apex Automated Munitions Calculators"**. It keeps "Apex" and "Munitions" - the two
contested words - and appends qualifiers. Against a live Class 013 registration that is
the same weakness, dressed differently.

## What was changed, and what deliberately was not

**Changed** - every user-facing brand string:

| Location | Now |
|---|---|
| `<title>` | was `Project Apex (placeholder name) \| Reloading Data Directory & Cost Calculator` |
| header wordmark | was `PROJECT APEX DEV` |
| footer wordmark | was `APEXPROJECT DEV` + "Placeholder name - not yet chosen" |
| affiliate disclosure | "This site participates..." |
| footer copyright | was "Project Apex (placeholder name)" |
| `package.json` `description` | no brand name |

**Deliberately NOT changed:**

| Item | Why it stays |
|---|---|
| `wrangler.toml` `name = "apex-amc"` | This is the **Cloudflare Pages project name**. Renaming it in the file does not rename the deployed project, and a mismatch breaks deploys. |
| `wrangler.toml` `database_name` | Not the brand. It is a database identifier. |
| `wrangler.toml` `SITE_ORIGIN` | A deployment variable. Changing it does not redirect a domain. |
| GitHub repo and remote | Not a trademark use in commerce. |
| `<link rel="canonical">` | Changed to the `pages.dev` origin, because the apex domain serves nothing (403) and a canonical pointing at a dead URL is wrong. |

**Infrastructure identity and public brand are now separate.** `apex-amc` remains the
project slug; "Project Apex" is what visitors see. That separation is what lets the
real name change later without touching a single deployment setting.

## RESOLVED - the name is Apex (owner decision, 3 Oct 2026)

> "Lets go with Apex automated munitions calculators. We keep the name Apex, we dont need the
> automated munitions calculators on the top of the page, we will just have it somewhere and
> thats why we have the domain we do."

**The visible mark is `APEX`. The tagline "Automated Munitions Calculators" is secondary and
lives in the footer, the copyright line and the domain.**

### Why this resolves the conflict rather than repeating it

Both earlier attempts kept the two contested words in the masthead, which is the weakest
position against a live Class 013 registration. This one differs in two ways that matter:

1. **We publish "munitions", never "ammunition."** The registered mark is *Apex Ammunition*.
   The substitution is deliberate and must be preserved by any later copy edit.
2. **The tagline is not the masthead.** The mark in commerce is a single neutral word, and
   the descriptive phrase does descriptive work in secondary position.

The domain carries the keywords for search; the page carries only the neutral wordmark.
That separation is the entire strategy, and it is why the tagline does not need to be at the
top of the page.

### Applied

| Location | Now |
|---|---|
| `<title>` | `Apex \| Reloading Cost Calculator, Component Directory & Local Shops` |
| Header wordmark | `APEX` |
| Footer wordmark | `APEX` with `Automated Munitions Calculators` beneath |
| Footer copyright | `Apex. Automated Munitions Calculators.` |

Unchanged and still correct: the `apex-amc` Cloudflare Pages slug, `database_name`,
`SITE_ORIGIN`, the GitHub remote. Infrastructure identity and public brand stay separate,
which is exactly what allowed the real name to land without touching a deployment setting.

### What this does not do

**This is not a trademark opinion and it does not clear the mark.** `Apex` on its own is a
common word in this space, and nothing here should be read as clearance. **Nothing in this
document is legal advice**, and a professional should review the position before the site is
announced or promoted.

Full reasoning is in `tasking/review/FIX-BACKLOG.md` item 8.