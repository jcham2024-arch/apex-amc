# Branding - why the site currently says "Project Apex"

**Status: placeholder. A real name has not been chosen.**

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
| `<title>` | `Project Apex (placeholder name) \| Reloading Data Directory & Cost Calculator` |
| header wordmark | `PROJECT APEX DEV` |
| footer wordmark | `APEXPROJECT DEV` + "Placeholder name - not yet chosen" |
| affiliate disclosure | "This site participates..." |
| footer copyright | "Project Apex (placeholder name)" |
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

## What this does and does not fix

It removes the registered phrase from the public page. It is **not** a trademark
opinion and it does not clear the mark. The site is still deployed at
`apex-amc.pages.dev`, so **"Project Apex" is a visible mark** - chosen only because it is
obviously provisional and not a plausible confusion with a Class 013 registration.

**Nothing here is legal advice.** A professional should review the position before the
site is announced or promoted anywhere.

## Next step

Task **T1** in [`tasking/pending/task-T1-trademark-clearance.md`](../tasking/pending/task-T1-trademark-clearance.md)
clears candidate names against USPTO in IC 013 and IC 009/042. When it reports, the
owner chooses, and task **T3** applies the decision. Until then this placeholder stands.