# Ballistics video and review sources

Written 2 Oct 2026. Covers the request to link ballistics reports and reviews for
the projectiles and cartridges we hold, and the creator-partnership model.

## Our actual coverage first, because it decides what is worth linking

We do not have uniform coverage. This matters more than the partnership idea.

| Dataset | Rows | Coverage |
| --- | --- | --- |
| `data/seeds/bullets/berger.csv` | 109 | 17 Cal through 30 cal, FB/BT/Hybrid Varmint, VLD |
| `data/seeds/bullets/hornady.csv` | 7 | ELD-X, A-Tip Match, InterLock, FTX, Match |
| `data/seeds/bullets/sierra.csv` | 4 | MatchKing, MatchLite, TMX |

**That is roughly 120 projectiles against the ammunition we price, across
20+ cartridges.** The long tail is Berger. Sierra and Hornady are four and seven
rows respectively.

So the honest position is: we can offer a curated link for the calibres a creator
actually covers well, and we will be thin or silent elsewhere. A wall of empty
links is worse than no links.

## The landscape, and the warning inside it

Long-range ballistics is a genuinely well-covered YouTube genre. A few
structural observations from research, offered as **UNVERIFIED** where I did not
open the specific video:

- Major channels publish rifle-group and all-around testing that is more
  transparent than most magazine data, because the groups are filmed.
- Hornady and Federal Premium ammunition commonly publish their own load data
  with velocity figures. That is first-party manufacturer data, not independent.
- Many creators test bullets we do not stock at all, and test the same bullet
  many times with different results.

### The trap

**A creator testing the wrong bullet in the wrong cartridge is the single
largest accuracy risk this project faces.** This repository has spent its whole
history on exactly this failure: three ballistics defects shipped behind 161
tests because the author and the test shared a wrong assumption. A video link
that a user trusts as "so it must be right" reintroduces that failure with no
gate around it.

If we link a video, a user may load a bullet the video tested in a different
cartridge. That is a chambering error. We have written a seed gate for exactly
this class of mistake in third-party data, and it must cover video claims too.

## Inclusion criteria

Set by the user, 2 Oct 2026. Applied to every video we link.

| Criterion | Threshold | Why |
| --- | --- | --- |
| Channel subscribers | **75,000+** | Excludes one-off uploaders whose testing has no track record. |
| Video views | **200,000+** | Excludes a video the audience ignored, whatever the channel size. |

Both are floor values, intended to be raised as the catalogue grows. They are a
starting filter, not a permanent definition.

### What these criteria do and do not buy

**They are a quality signal, not a quality guarantee, and they measure something
other than rigour.**

A large, successful channel is evidence that *people value the creator*. It is
not evidence that the creator runs enough controlled strings, states barrel
length and gel temperature, or tests the same bullet more than once. Popularity
and methodology are close to independent.

So the threshold is a useful first cut - it removes channels with no audience and
therefore no incentive to be careful - but it does **not** substitute for the
conditions gate. A 500k-subscriber video that omits barrel length still fails
B.3/8.3 and must not be displayed as a product fact.

Two honest consequences worth stating rather than discovering later:

- **It will exclude the best bench data we can find.** Serious precision-rifle
  work is often done by people with modest audiences who shoot thousands of
  rounds a year and publish to a few thousand viewers. The 75k floor excludes
  them. That is a real loss, accepted for now.
- **Subscriber and view counts move.** A row recording "82,000 subscribers" is
  a snapshot, not a fact. Record the observed value and the observation date, and
  treat the numbers as evidence the video met the bar *when we checked*.

### What it deliberately does not do

This filter is about **popularity**. It is not about sponsored content, and a
channel over the threshold that has taken money for a review of a product is not
automatically disqualified - that is handled separately, by the material
connection rules below. Keeping the two concerns separate matters: a popular
channel and a paid channel are different problems, and merging them would let
"but they're big" paper over a disclosure problem.

## The partnership model, and the legal problem with it

The proposal was: partner with YouTube creators, they market our site, we send
users to their content.

**This cannot be done the obvious way.** Once we pay a creator, or give them
affiliate commission, or send them free product, we have a **material
connection** with their endorsements. The FTC's rule on endorsements
(16 CFR 255) then requires disclosure, and the FTC guidance is explicit that
disclosure must:

- appear **with the endorsement message itself**, not on an about page, not at
  the end, not behind "more";
- be in the **video**, not only the description, and be repeated if live;
- use clear language: "ad", "sponsored", "paid partnership".

Critically: **if we pay them, and they then test a bullet and it goes wrong, we
have a financial interest in their conclusion.** That is not a marketing
problem, it is a safety one.

### Four rules if we ever do this

1. **Never pay for, or incentivise, a ballistics TEST.** Paying for a review is
   prohibited under 16 CFR 465.2(b) in substance and 255.5 in letter. A
   sponsored test result is not evidence.
2. **A partnership may cover promotion only, never a finding.** "Check out
   ApexProject" is a sponsor read. "This bullet is the best" is an endorsement
   and must never be one we paid for.
3. **Paid links must be labelled on our side too**, not only on theirs. If we
   link to a creator we pay, that is our disclosure obligation, not just theirs.
4. **No affiliate commission on a safety-relevant claim.** A creator who
   recommends a bullet must not receive more for the recommendation. Paid
   placement in a ballistics article is how a recommendation becomes a
   misrepresentation.

### The safe alternative that gets most of the value

**Link to creators with whom we have no relationship at all.** A neutral link
to independent testing is exactly the "consumer review hosting" the 465 rule
contemplates. No material connection, no disclosure burden, no incentive to
distort, and no financial interest on our side in what they found.

Start there. Revisit paid promotion only for site awareness, never for content.

## What to build

| # | Change | Why | Write-set |
| --- | --- | --- | --- |
| V.1 | **`ballistics_sources` dataset** | One row per (product, source, claim, cartridge, conditions). Provenance on every claim, as with physical constants. | `data/schema/021_*.sql` (SERIAL) |
| V.2 | **Extends the seed gate to video claims** | A source claiming a result for cartridge X may not be shown on bullet Y. This is the chambering-error gate, applied to video. | `scripts/gates/` |
| V.3 | **Conditions mandatory, not optional** | A ballistics claim without barrel length, temperature and pressure is not checkable, only admireable. Same standard `data/reference/README.md` already sets. | `scripts/gates/` |
| V.4 | **Neutral link display** | Title, channel, date, what it tested, what conditions. No "recommended", no star rating of a video, no summary of a conclusion we did not verify. | `apps/website/src/` |
| V.5 | **Manufacturer data labelled as such** | Hornady's own figures are first-party. Not independent, not a review, and must never appear beside independent testing unmarked. | `apps/website/src/` |
| V.6 | **Disagreement is displayed, not resolved** | Two creators, two results, two setups. Show both and the conditions. Picking a winner would be us asserting something we cannot verify. | `apps/website/src/` |

## The rule that must not bend

**We link to what other people measured. We do not summarise it into a verdict.**

V.6 is the one that will be argued about, because showing "these two sources
disagree" feels less finished than a single number. It is also the only honest
option. We have no way to adjudicate between two people's bench results without
running their test, and the moment we pick a winner we become a source of
ballistics claims we never verified.

That is the same line as the rest of the site: research and tooling, not authority.