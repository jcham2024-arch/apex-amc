<!--
  GENERATED FILE - DO NOT EDIT.

  Built from the CSVs by scripts/data/build-data.mjs. Any edit here is lost on the
  next run, silently. To change the data, edit the CSV under "source" below,
  then run:  npm run data:build

  Dataset:  regulations
  Source:   data/seeds/regulations.csv
  Manifest: data/schemas/regulations.yaml

  Use this file for READING. For application code use the .json, which has real
  types. For the complete record use the CSV, which is the database.
-->

# regulations

> **Generated file - do not edit.** Built from
> `data/seeds/regulations.csv` by `npm run data:build`.
> The CSV is the database. Edit that, not this.

## At a glance

- **Rows:** 13
- **Source files:** data/seeds/regulations.csv
- **Column contract:** `data/schemas/regulations.yaml`
- **Populated:** ~100% of cells (a blank means "not known yet", not "zero")

## Columns

| Column | Type | Req | Meaning |
|---|---|---|---|
| `citation` | string | yes | Full citation, e.g. 18 U.S.C. 921(a)(17)(A). |
| `short_name` | string | yes | Human label used in docs and UI. |
| `jurisdiction` | string (4 values) | yes | us_state is reserved and currently empty. platform is a private ruleset we choose to live under, such as a payment processor ruleset. |
| `topic` | string (8 values) | yes | Which part of the site the rule governs. |
| `governs` | string | yes | The specific activity controlled, written as an imperative constraint rather than a topic label. A row that cannot state what it forbids has not been read closely enough. |
| `operative_text` | string | yes | The quoted language, verbatim. A paraphrase belongs in reasoning, never here. |
| `quote_status` | string (3 values) | yes | verbatim = retrieved and quoted exactly. paraphrased = retrieved but condensed by us. unverified = believed to apply, text not yet obtained. |
| `source_url` | string | yes | Where the text was read. Must be retrievable. |
| `retrieved_on` | string | yes | ISO date. Statute text can change, so this is part of the evidence. |
| `affects` | string | no | Comma-separated phase or feature ids this constrains, e.g. phase-9,phase-5b. |
| `decision` | string (4 values) | yes | What we decided, given the text. Never derived from the statute alone. |
| `review_required` | boolean | yes | True where a qualified attorney must sign off before this row is relied on for anything user-facing. |
| `reasoning` | string | yes | Why the decision follows from the text. The part a reviewer argues with. |

## Sample rows

| `citation` | `short_name` | `jurisdiction` | `topic` | `governs` | `operative_text` | `quote_status` |
|---|---|---|---|---|---|---|
| 18 U.S.C. 921(a)(17)(A) | Ammunition includes components | us_federal | ammunition | Forbids treating empty cartridge cases, primers, bullets or  | The term "ammunition" means ammunition or cartridge cases, p | verbatim |
| 18 U.S.C. 922(a)(1) | Unlicensed dealing in ammunition | us_federal | ammunition | Forbids engaging in the business of dealing in ammunition wi | except a licensed importer , licensed manufacturer , or lice | verbatim |
| 18 U.S.C. 922(g)(1) | Interstate shipment to an unlicensed person | us_federal | ammunition | Forbids shipping ammunition in interstate or foreign commerc | It shall be unlawful— (1) for any person— (A) except a licen | verbatim |
| 18 U.S.C. 921(a)(3)(B) | A frame or receiver is a firearm | us_federal | firearm | Forbids listing or transferring any firearm frame or receive | any weapon (including a starter gun) which will or is design | verbatim |
| 18 U.S.C. 921(a)(4) | Destructive device | us_federal | explosives | Forbids any combination of parts designed to convert a devic | (C) any combination of parts either designed or intended for | verbatim |
| 16 C.F.R. 465.2(a) | Writing a fake review | us_federal | reviews | Forbids writing or creating a review that misrepresents the  | It is an unfair or deceptive act or practice and a violation | verbatim |
| 16 C.F.R. 465.2(b) | Purchasing or disseminating a false review | us_federal | reviews | Forbids purchasing a review, or disseminating one we knew or | It is an unfair or deceptive act or practice and a violation | verbatim |
| 16 C.F.R. 465.2(d)(2) | Consumer review hosting is exempt | us_federal | reviews | Permits displaying genuine third-party reviews that we did n | Reviews that appear on a website or platform as a result of  | verbatim |
| 16 C.F.R. 465.3 | Duties of a review host | us_federal | reviews | Requires a monitoring procedure, a published statement of it | NOT YET RETRIEVED - see reasoning | unverified |
| 16 C.F.R. 255.2(b) | Endorsements must be substantiated | us_federal | advertising | Forbids an endorser making a representation they cannot subs | NOT YET RETRIEVED - see reasoning | unverified |
| 16 C.F.R. 465 Q&A, seller service reviews | Suppressing seller service reviews | us_federal | reviews | Forbids filtering out a seller's service, delivery, returns  | But be aware that suppressing customer reviews about a "part | verbatim |
| 16 C.F.R. 465.8 | Fake indicators of social media influence | us_federal | advertising | Forbids purchasing fake followers or engagement | The provision is limited to the purchase of fake indicators  | verbatim |
| Stripe Prohibited Businesses | Payment processor ammunition ruleset | platform | payments | May refuse ammunition-adjacent goods regardless of legality | NOT YET RETRIEVED - we have not asked | unverified |
