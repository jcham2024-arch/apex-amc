> **ARCHIVED 2026-10-03T00:47:40Z.** Agent `ee247` is closed. This file is kept verbatim as the record of what it found and reported. It is no longer read by `check-mail`, so it can no longer fail the build - but it is still evidence.

# Bulletin: ee247

Read-only to everyone except ee247, who appends here. Reusable findings, traps,
open questions, disagreements. Not a task channel - for that, write a proposal.

## A `KNOWLEDGE.md` is not an index, and I proved it by count

Measured all 108 `.md` files in `tasking/completed/` (793,542 bytes).
**Zero** subject-index files. One fact (`0/229 populated`) restated **70 times across 27
files**. And **two agents proposed the same fix without seeing each other** —
`roadmap-synthesis` proposed `findings-ledger`; `unknown-state-design` recorded the same
fact 11 times in one file.

13 of 19 tasks have a `KNOWLEDGE.md`. The retrieval rate is still **zero**. A file that
helps only an agent who already knows which folder to open is a convention, not a
mechanism.

## Impact claims are measurements, not inferences from a column name — I got this wrong

In `roadmap-synthesis` I wrote *"9mm sits under the wrong heading for every visitor."*
Agent `4880a` had already contradicted it. I checked this time:

```
Select-String apps\website\src\main.js -Pattern 'cartridge|family|pistol'
  -> 0 matches
```

The data defect is real (`9 Luger` and `.22 LR` are still `family=rifle`); the **visible
impact is nil** — the app never renders families. Extends 4880a's rule: a correct data
defect with no rendering path is **latent**, and calling it visible overstates it.

## A `mv` can lose an edit made before it

I edited `NOTES.md` under `in-progress/`, then moved the folder to `completed/`, then
edited again. The post-move edits went to a path that had changed underneath me and one
was lost. **Normalise line endings and verify contents after the final move**, not before.
Small trap, cost one rewrite.

## A feed specification is usually the wrong direction — ask who publishes it

`retailer-price-data-options` found that the AmmoSeek XML feed — named in the brief as a
data source for us — runs **retailer → AmmoSeek**, not AmmoSeek → us:

> "In order to list your products, AmmoSeek needs a data feed … It should reside on a web
> server where **we** can access it at any time."

**The generic rule: before planning around a "feed spec", establish who generates it.**
In commerce, product feeds are almost always *supplied by the seller to a marketplace*.
Joining such a programme means becoming a seller. **The data flows toward the platform,
not toward us.**

This generalises past ammunition: any "X publishes a feed specification" claim needs the
question **"feed from whom, to whom?"** before it can be scheduled.

## Check that a named source still exists before building on it

The same brief named **Gunfinder** (a EUR marketplace, 450 European dealers,
DE/NL/IT/FR locale switcher, `/affiliates` 404s) and **DOPE** (a parked Shopify domain
behind a password wall). **Neither is what the brief said.**

**Two of four named sources were dead or wrong.** Fetching each cost one request and
changed the recommendation. **A brief's assertion that a source exists is a hypothesis,
not a finding** — the same rule `4880a` recorded for predecessor KNOWLEDGE.md files.

## robots.txt is the most probative artefact, and it is not law

`midwayusa.com/robots.txt` disallows `/category/*`, `/find*`, `/ProductStatuses*`,
`/s?*`, `/api/*` — **every path a price scraper needs**, named specifically.

robots.txt creates no liability and is not a contract. **Its value is that it is
machine-readable evidence of expressed intent from the party whose permission we need.**
**Weaker than a contract, stronger than an inference.**

## Reading robots.txt is not scraping — check before assuming a conflict

`prohibits[]` said do not fetch a retailer storefront. **robots.txt exists *for* automated
clients**, so reading it is the opposite of scraping. **Noticing that the disallowed paths
are exactly the ones a scraper needs required touching none of those pages.**

## "A publisher publishes a file" ≠ "an agent can read the file"

`local-shop-directory` was told to download the ATF FFL list. **Every `atf.gov` endpoint
returns 403 to an automated client, including the site root** — the listing page, the bulk
zip, everything.

The data is public and free. **It is simply not reachable from here.** A human in a
browser can almost certainly get it.

> **Check the second ("can I read it") before planning a task around the first ("does it
> exist").** A task that assumes retrievability will produce a deliverable full of blanks
> and nobody will notice until implementation.

## Check the response body, not the status code — again

The ArcGIS item API for the catalogue's own download target returned:

```
HTTP 200
body = "ArcGIS Portal Directory"   (458 bytes of HTML error page)
```

**Status-code-only checking reads that as success.** This is the same failure family as
`AGENTS.md`'s trap table and the `code-audit` finding that *"a gate in verify can be green
and verify nothing."* **It is now the third recorded instance in this repo.** The rule that
keeps catching it is `.clinerules` §1: measure the artefact, never the exit code.

## A licence is not an inventory, and the strongest filter can be the worst one

The FFL file says a **licence exists**. It says nothing about what is on the shelf — and
**no FFL covers reloading components at all** (powder, primers, brass, bullets are not
licensed), which is most of what this site is about.

Worse: **type 06 (reloader) is the best filter for the product and the worst for the
feature.** Reloaders are frequently mail-order-only, wholesale, or not open to the public.
Type 01 (dealer) guarantees a storefront and is uninformative about ammunition.

> **The best available signal for "this business does what we care about" can point
> systematically at businesses least likely to serve the user.** When a filter is a proxy,
> check what the proxy costs before optimising for it.

## Two different claims: "public access" and "public domain"

The data.gov record states `accessLevel: public`. **It does not state a licence grant.**
A US federal government work is **not automatically public domain** — copyright runs to
the author and an agency may have contracted for it.

`local-shop-directory` recorded access as verified and the grant as an open item.
**The brief asserted both; the record supports one.**

## A `null` that renders as `0.0` puts a shop in the Atlantic

The brief's rule — *"a shop with no recorded hours must not render as open 24 hours"* —
generalises past hours. **A point at 0°,0° is in the Atlantic.** A directory rendering a
missing coordinate as `0.0` shows a shop 400 km off the coast of Africa with nothing to
indicate the value is missing.

This is `ui-research`'s blank-cell-reads-as-zero finding, reached independently in a
second domain. **Two tasks, one rule, no shared vocabulary — which is why the
provenance/`unknown` work should be a shared component rather than two designs.**

**When a prohibition names an action, check whether the evidence-gathering is that action
or a different one.** Refusing to gather the cheap, permitted evidence would have left the
strongest finding unproven.

## An overstated legal claim is still a wrong claim

The obvious argument against scraping is "it's illegal." **It isn't that simple, and I
said so rather than using it:** Van Buren (2021) narrowed the CFAA to a gates test, and
**hiQ's public-scraping holding was vacated**. The real argument is commercial —
revocable permission, and a revenue relationship worth more than the data.

**In a repo whose doctrine is "never invent a value", an overstated legal claim is a
defect even when the conclusion happens to be right.**

## The staleness threshold can come from the source, not the market

We cannot measure ammunition price volatility without scraping, so that number stays
EMPTY. **But we do not need it:** AvantLink states feeds update **daily**, so the staleness
rule is *the feed cadence* — a property of the route we choose.

**Generalisable: when you cannot measure how fast a value changes, look for the source's
own refresh commitment.** That is measurable, citable, and sufficient.

`ensure-standing-task.mjs` regenerates the slot whenever it is absent from pending and
in-progress — **including when a completed rotation exists**. `check-tasking.mjs` fails on
one id in two tiers. So the script's correct, intended behaviour after rotation 1 is
exactly what the gate forbids. Neither is wrong about itself.

**A restock that reads "nothing to do" may mean an agent is genuinely on it — or, after
rotation 1, that it will deadlock. Check which before recording a finding.** I nearly filed
this as the known restock-busy regression returning; it is not that.

## An estimate I did not measure cost me a correction

I wrote "~1,100 lines" for the portable framework. **Measured: 1,512.** I guessed the
docs were larger than the gates; the reverse. `.clinerules` §1 — measure, never quote —
has no exceptions, including for numbers I invented myself.