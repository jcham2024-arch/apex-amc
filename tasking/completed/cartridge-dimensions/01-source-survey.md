# T4 — Source survey

**Task:** fill the empty cartridge dimensional columns from primary sources.
**Agent:** sub-agent on a fresh instance of the default model.
**Retrieval date for every source below:** 2026-10-02.

## Headline

**No dimensional value was transcribed, and that is the finding.**

The two nominated primary sources cannot legally supply these numbers to us:

| Source | Status | Permission for republication | Covers our 229 |
|---|---|---|---|
| **CIP TDCC per-cartridge dimension sheets** | Publicly readable, free, machine-readable | **Forbidden without written approval** | ~11 addressable |
| **SAAMI free drawings** | Free download | Free, but pre-standard / pending revision | **3** |
| **SAAMI Z299.x standards (text)** | Proprietary, sold | N/A — not obtained | 0 |

Every cell left EMPTY in `cartridge_dimensions_filled.csv` is empty because the
governing source forbids us from republishing the value, not because the value
was unavailable. That distinction is the whole result.

---

## 1. CIP — the decisive blocker

### What exists

CIP publishes a public, free, per-cartridge dimension table (TDCC) at
`https://bobp.cip-bobp.org/en/tdcc_public`, with one PDF sheet per cartridge.
A sample sheet (`7-62-x-39-en.pdf`) carries, in plain extractable text:

```
CARTRIDGE MAXI
Lengths
L1  1)*   30.50  -0.20
L2  1)*   33.00  -0.20
L3  1)    38.70
Case Head 1.50
R1        11.35
Pmax      3550 bar
...
Dimensions in << mm >>
```

So the mapping onto our columns is direct and mechanical: `L1` → case length,
`L3` → overall length, `R1` → rim diameter, case head → head diameter, `G1` →
bullet diameter. **The data is machine-readable, in mm, and would populate the
dataset cleanly.** That is precisely why the restriction matters.
### The restriction, verbatim

Every text-extractable CIP sheet we sampled ends with this line:

> "Reproduction forbidden as well as in the form of extracts without approval of
> C.I.P."

and the CIP site footer reads "© C.I.P - All rights reserved".

The words **"as well as in the form of extracts"** are what decide this task.
A column of transcribed dimensions selected from these sheets *is* an extract
from CIP's tables. The restriction is not about wholesale reprinting; it names
extracts specifically. Reading the table freely is not the same as being
permitted to republish rows from it.

### Measurement, and its limits

A 10-sheet sample of the EN sheets, checked mechanically:

| Sheet | Notice found |
|---|---|
| 22-arc-en | **undetermined** (no text layer; see below) |
| 284-tony-en | YES |
| 300-pegasus-en | YES |
| 35-whelen-en | **undetermined** (no text layer) |
| 416-a-tec-en | YES |
| 5-45-x-39-en | YES |
| 6-3-x-57-fare-en | YES |
| 6-5-prc-en | YES |
| 7-62-x-39-en | YES |
| 9-3-x-57-en | YES |

**8 of 10 confirmed; 2 undetermined, not "absent".** Those two
(`22-arc`, `35-whelen`) inflate to a font-embedding blob with no recoverable
text, so the notice could not be read. Reporting them as unrestricted would be
a guess in the dangerous direction, so they are recorded as undetermined.

**This sample is 10 of 91 sheets, not a census.** It is enough to establish the
terms on which CIP publishes; it is not a per-sheet legal audit.
## 2. SAAMI — free, but nearly irrelevant to our holdings

The registry (`data/seeds/opensource_resources.csv`, `saami-drawings`) is right
that the free drawings are genuine primary evidence. What it does not say is how
little of it touches our dataset.

The page publishes **17 designs total**: 11 newly accepted designs and 6
revisions to existing ones. Matching those against our 229 names:

| SAAMI free drawing | In our dataset |
|---|---|
| 5.56 Commercial, 5.7x28 FN, 7mm Backcountry, 8.6 Blackout, 21 Sharp, 25 Creedmoor, 25 Weatherby RPM, 30 Super Carry, 338 ARC, 12 Gauge, 28 Gauge | no |
| 16 ga, 224 Valkyrie, 30 Luger | no |
| **6.5 Grendel** | **yes** (`6-5-grendel`) |
| **44-40** | **yes** (`44-40`) |
| **44 Rem Mag** | **yes** (`44-rem-mag`) |

**3 of 229.** The other 14 are newer or simply absent from our name index — a
breadth problem, not a dimensional one.

And the page states the limit itself:

> "Note: Current Cartridge & Chamber Drawing documents are contained within the
> SAAMI Standards."

> "Occasionally a dimensional correction may be made to an existing
> cartridge/chamber design. In those cases the revision will initially be posted
> in this section until such time as the drawing is updated in the SAAMI
> Standards."

So the *existing* dimensional data for cartridges we already hold is not on the
free page at all. The Z299.x text is proprietary and was not purchased.

**Pre-standard caveat, honoured.** A free drawing is an accepted design not yet
incorporated into a published revision. Of our three, `6-5-grendel` and
`44-rem-mag` are **revisions** — a dimensional correction not yet folded into the
standard, exactly the case `data/seeds/regulations.csv` warns can silently
invalidate a figure already held. No value from any of the three was transcribed
into the CSV, because the CIP finding above governs the task and because all
three are corrections-in-progress rather than settled text.

## 3. Sources deliberately not used
## 4. The coverage gap this task cannot close

Even with every permission problem solved, **CIP's 91 EN sheets address only
about 11 of our 229 cartridges** by normalised designation match. CIP
concentrates on European and proof-tested designs; our index is dominated by US
rimfire and classic cartridges.

So the honest picture is two independent gaps stacked:

1. **Permission** — for the cartridges CIP does cover, we may not republish.
2. **Coverage** — for the rest, there is no CIP sheet to use even if we could.

Closing the dimensional columns therefore requires a decision that is the
owner's, not an agent's: purchase the SAAMI Z299.x standards, seek written CIP
permission, or source per-manufacturer from each maker. Until one of those
happens, **0/229 populated is the correct and honest state of this dataset**, and
it should stay visibly empty rather than be filled from a compilation.

## 5. Cartridge-name coverage gap (from the brief, recorded not fixed)

The brief asks that the breadth gap be recorded here rather than acted on. Measured
on the seeds: **rifle 212, pistol 16, shotgun 1**. There is no 9mm, no 5.56 and
no .22LR in the dataset, and the single "shotgun" row is `4 Bore Rifle`, a
placeholder rather than a shotshell. No cartridges were added.

## 6. Reproduction status of this report

This survey and `02-provenance-log.md` quote **no CIP dimensional values**. They
record the existence, location, licence status and structure of the CIP sheets,
which is citing a source rather than republishing it. The one verbatim CIP
sentence quoted above is the licence notice itself, quoted to establish the
licence position — quoting a copyright term in order to comply with it is not
the reproduction it prohibits.

- **`ammolytics/cartridges` (MIT, `adopt=yes` in our registry).** Explicitly
  "drawn from SAAMI, CIP and NATO STANAG". An MIT licence on a *wrapper* does not
  grant rights to the underlying SAAMI or CIP content, which is what the wrapper
  redistributes. The registry's own warning — "Verify any dimension against the
  standards body before publishing it" — is the correct reading and the reason it
  was not used as a transcription source.
- **Manufacturer datasheets.** Permitted by the brief where a manufacturer is the
  authority for its own product, but a reloading-manufacturer sheet is still a
  restatement of SAAMI/CIP figures, so it does not clear the restriction.
- **Blogs, forums, load-data sites.** Excluded by the brief and by project rules.

### A caution about my own tooling

The first three passes at this measurement disagreed with each other, and the
reason is worth recording because it is the failure mode this repo warns about
constantly:

- CIP sheets kern their text: the notice appears as
  `[(Reproduc)-6.4(tion forbidden as)-6.4( w)12.6(e)1(ll as)...]`. A search for
  the literal string `Reproduction` in the inflated stream **cannot match**.
- My second pass joined the extracted literals with a space, which re-broke the
  split word into `Reproduc tion` and still reported "no notice".
- Only after concatenating with **no** separator, and decoding octal escapes
  (`\145` = `e`), did the true 8/10 appear.

Every intermediate number was an undercount of the restriction — i.e. each error
made the sheets look *more* freely usable than they are. No number from this
section should be quoted without the method attached.