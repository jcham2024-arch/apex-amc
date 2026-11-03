# Reference index: external ballistics sources held locally

A catalogue of external ballistics documents acquired on 2 Oct 2026 and verified
parseable. **The documents themselves are deliberately not in this repository.**
They remain on this machine under `C:\Cline\resources\references\`.

This file exists so that nobody re-downloads 71 MB that is already on disk, and so
that the provenance of every title is written down rather than living in a folder
name.

## Why the files are not committed

`docs/SOURCES.md` sets the posture for publisher material:

> publisher load data is owned, licensed and sold. The default posture is to
> **cite and link**, never to reproduce.

Every title below is a published commercial work mirrored from `web.archive.org`.
They are complete copies, not excerpts, so they are not fair-use material. The
repository also gitignores `data/published/*` for the same reason: large vendored
binaries do not belong in version control.

What belongs in the repo is a **citation with stated conditions**, which is what
`data/reference/README.md` requires of an oracle row:

1. Stated test conditions — barrel length, temperature, pressure, altitude
2. Stated uncertainty — an SD, an ES, or an explicit tolerance
3. Independent derivation — not produced by our own code

Scraped book prose satisfies none of the three. It can be *read* and *cited*; it
cannot be *promoted* to `data/reference/` without a row that a reviewer can check.

## What is on disk

| Folder | Contents | Size |
|---|---|---|
| `C:\Cline\resources\references\applied-ballistics` | 61 PDFs + 56 extracted `.txt` | 46.2 MB |
| `C:\Cline\resources\references\ballistics-textbooks` | McCoy, plus other textbooks | 25.5 MB |

## Acquisition method

Applied Ballistics material was crawled via the Wayback Machine CDX API and
downloaded with `id_` replay, so each copy carries its original URL and snapshot
date. `arch_dl.log` in that folder records the exact URL behind every file, which
is the authoritative provenance record.

```
https://web.archive.org/web/20210724125927id_/https://appliedballisticsllc.com/...
```

**Provenance rule: cite the Wayback URL, not the publisher's bare URL.** The bare
URL has rotted repeatedly — the crawl log shows 404s and a stray `"` search
artefact in the query string. The snapshot URL always resolves.

## Highest-value titles

| Title | Why it matters here |
|---|---|
| `ARCH-ChronographChapter` | MV measurement practice; directly relevant to `data/reference/measured_data.csv` |
| `ARCH-ABDOC136_IntroToELR` | Introduction to extreme-long-range, the app's core use case |
| `ARCH-BulletPointing` | 4.3 MB; ogive and bullet-design geometry |
| `Aerodynamic-Drag-Measurement-and-Modeling-for-Small-Arms` | Independent check on the G7 drag table |
| `ARCH-NVDOC1403-Wind` | Wind effects, including where wind stops mattering |
| `Why-you-cannot-trust-the-MV-on-the-Box` | Short, and it is the reason muzzle velocity alone is not enough |

**`Aerodynamic-Drag-Measurement-and-Modeling-for-Small-Arms` is the one to read
first.** `docs/ORACLE-SOURCES.md` §1 records that our G7 table was wrong and was
replaced from McCoy, verified three ways. This title is a *fourth*, independent,
source. If it disagrees with McCoy, that disagreement is worth recording rather
than averaging — the same rule `data/reference/README.md` already states.

## Status

Nothing here has been read into the solver. This is a catalogue of what exists,
not a claim that it has been used. Any row added from these documents must be
added to `data/reference/` with its stated conditions, or cited in
`docs/SOURCES.md` and left out of the data.