# archive/

Frozen material kept for provenance. **Nothing here is part of the build, the
tests, or the deployed site.** No script imports from this directory, and
`npm run verify` does not read it.

Do not edit these files to make a gate pass. They are preserved exactly as they
were written, including the mistakes.

## `gemini/`

Recovered verbatim from `GeminiChatRes/` on the pre-consolidation `main` branch
of `origin` on 2 Oct 2026, before that branch's tree was reorganised into the
current monorepo layout. All 47 files present on the remote are here.

The rescue was necessary, not optional. Those files existed *only* on the remote
branch; reorganising `main` would have deleted them. This directory is the only
reason the early design history survived.

The same files were additionally already partly present under
`GeminiChatRes/` locally. Where both existed, the recovered copy is the one kept,
and the filename list has one entry per remote file — `apex project chat.txt` is
the one exception, stored with spaces rather than the underscore form, because
that is how it was named locally.

### What is in here

| Group | Files | Why it matters |
| --- | --- | --- |
| Design conversation | `apex project chat.txt` | The original requirements discussion. The only record of *why* early decisions were made. |
| First web app | `apex_amc_web_application.html` | A 64 KB self-contained prototype: the calculator, retailer directory, checklist and component finder before any of them were split into modules. |
| Early data layer | `atmosphereUtils.js`, `unitConversions.js`, `types_*.ts` | The original physics interfaces. Useful as a record of intent; superseded by `packages/ballistics-core`. |
| Early schemas | `schema_v1_sqlite.sql`, `schema_v2_sqlite.sql` | Predecessors of `data/schema/`. Keep for understanding how the model evolved. |
| Scratch duplicates | `*_v2.*`, `*_final.*`, `backup*.*` | Iterations that were never promoted. Superseded, and retained only because they show what was tried. |

### Why these are not deleted

They are unreferenced by any build path, so a tidy-minded cleanup would remove
them. That would be a mistake: `apex_amc_web_application.html` and
`apex project chat.txt` cannot be regenerated from anything in this repository,
and the remote branch they came from is being restructured.

## `website-prototype/`

The superseded single-file site that `GeminiChatRes/`'s `index.html` referenced.
It is the immediate ancestor of `apps/website/`, kept so the two can be
diffed when someone asks what changed between them.

## Provenance

| Field | Value |
| --- | --- |
| Source branch | `origin/main` (flat Expo app layout) |
| Source path | `GeminiChatRes/` |
| Recovered | 2 Oct 2026 |
| Method | `git show origin/main:<path>`, byte-for-byte |
| Files | 47 (of 47 on the remote) |
| Modified since recovery | none |

`GeminiChatRes/` still exists on the remote branch. This copy is the insurance;
deleting it here would be deleting the only local copy.