# BRIEF — Give the user the manufacturer's own published load data, cited

**Task id:** `published-load-lookup-spec` · **Priority:** high
**Grounded in:** `tasking/completed/interior-ballistics/03-load-synthesis-literature.md`

## Why this task exists

The owner settled the design question that had blocked this feature. His words: we should be getting the relevant data from the component manufacturers, they publish how much powder to use for what, and he wants to give the user that - NOT our own calculated load. That is materially safer and simpler than the interpolation engine an earlier task assumed, because it removes calculation from the product entirely. Every number a user sees is a manufacturer's, attributed and dated. The project becomes a good index to authoritative data rather than a second, worse source of it.

## Before you start

1. Read `.clinerules` — especially §10 (the swarm), §11 (mail), §12 (proposals), §13 (the standing slot).
2. Read your `task.json`. Every file in `required_outputs` must exist or this task is not done.
3. Read your source: `tasking/completed/interior-ballistics/03-load-synthesis-literature.md`. Your task is derived from it, not from your assumptions.
4. Read `tasking/mail/bulletin/*.md` and `tasking/mail/outbox/taskmaster/<your-id>.md`.
5. Claim it: `mv tasking/pending/published-load-lookup-spec tasking/in-progress/`
6. Send a START message to your inbox. `npm run tasking:check` must pass before you send STOP.

## Scope

- Establish, with sources and URLs, exactly WHAT each major manufacturer publishes and WHERE: Berger (load data on its website and in its manual, plus its published BC figures), Hornady (Load'n'Lube and the Hornady Handbook), Hodgdon, Vihtavuori, Winchester, and Federal for primers. For each, state the access route - public web page, free download, paid manual, or subscription - because that determines what we can link to and what we would have to buy.
- Record the LICENCE posture per source, precisely, and do not blur it. Some of this data is citable but not redistributable - Vihtavuori is (c) Nammo, Berger is (c) CPG, Hornady's handbook is sold. State clearly for each: may we DISPLAY a figure with attribution and a link, may we CACHE or store it, may we REPUBLISH a table wholesale. Those are three different permissions and conflating them is how a citation becomes infringement.
- Design the LOOKUP, which is the actual product. Given a cartridge, a projectile and a powder, find the manufacturer's published entry and present it verbatim with its attribution, edition and date. When no exact match exists, say so plainly and point at the nearest published combination rather than interpolating a value that no manufacturer published. **Interpolating is the thing this task must not do** - an interpolated figure looks identical to a sourced one and is not.
- Design the REFUSAL path, which is the safety property. A lookup that cannot say 'no manufacturer publishes this combination' is unsafe by construction, and the documented precedent is Hornady's own 12th Edition carrying a misprinted powder for 6.5 PRC that should read StaBall HD. A name-matching system inherits exactly that risk with no erratum channel. Specify how a user is told the difference between a published figure and an inferred one - they must be visually distinct, not a footnote.
- Design how edition and date are displayed. A figure from a twelve-year-old handbook edition presented as current is a claim we cannot substantiate, and manufacturers DO revise. Include what a user sees when a newer edition exists that we have not captured.
- Specify the primer dimension the owner named explicitly: manufacturer (CCI, Federal, Winchester), type (standard, match, magnum, non-magnum) and whether it is magnum. This is a lookup fact published by each manufacturer, not a calculation, so it belongs in scope - and magnum status changes the result, so getting it wrong changes the answer.
- State plainly what remains blocked. Linking to a paid manual we do not hold is not a feature. Say exactly which manufacturers are reachable with free public data today and which require a purchase decision from the owner.
- Keep the METADATA/VALUE line explicit, because it is the boundary the owner's decision turns on. Storing a POINTER is not storing a VALUE: knowing 'Berger publishes load data for bullet X at this URL, edition N' is metadata and is what makes routing possible; copying the numbers off that page into data/ is redistribution and is not permitted. The lookup cannot route a user to a page without knowing the page exists, so it MUST store metadata. Specify the metadata record shape, and state in the spec exactly what it excludes - it carries no quantities of any kind, only who publishes what, where, in which edition, and whether it is free or behind a purchase.

## Do not

- Do NOT compute, interpolate, extrapolate, average or fit any charge weight, powder constant or burn rate. This task produces a specification for a LOOKUP and a citation. The owner's instruction is explicit: give the user what the manufacturer published, not our own calculated load.
- Do not store a manufacturer's VALUES. The owner decided on 3 Oct 2026: cite and link only. Storing grain weights, even with attribution, is exactly what that decision excludes. Metadata about where to find them is permitted and necessary; the figures are not.
- Do not design a scraper for a manufacturer's load tables. The same terms-of-service reasoning that rules out retailer price scraping rules this out.
- Do not present a sourced figure and a derived one in the same visual treatment. That is the single failure this design exists to prevent.

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`
- `01-what-is-published-and-where.md`
- `02-licence-and-permissions.md`
- `03-lookup-and-refusal-design.md`
- `04-primers-and-edition-dating.md`

```
npm run tasking:check     # every declared output must exist
npm run verify            # must exit 0
```

Plus, in `REPORT.md`: what you did, what you found, the reasoning, what you did NOT
do and why, and any unresolved issue in `NOTES.md`.

## When you finish

1. `mv tasking/in-progress/published-load-lookup-spec tasking/completed/`
2. Append a STOP message to `tasking/mail/inbox/<your-id>.md` — declare the real file count, the gate is checked against disk.
3. **Write a proposal** at `tasking/mail/proposals/<your-slug>.md` for the most valuable follow-up you found. Cite a file and quote it. See `.clinerules` §12.
4. Append anything reusable to `tasking/mail/bulletin/<your-id>.md`.
5. Run `npm run tasking:restock`, then claim the next task. Do not wait for a reply.
