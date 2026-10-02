# Competitor and open-source research

Output directory for task **R1** in `.cline/tasks/ledger.json`. Written by a
read-only research agent; no source file may be edited from here.

Expected deliverables:

- `01-competitor-landscape.md` - who the competitors are and how they are laid out
- `02-feature-gaps.md` - what they have that we do not, prioritised
- `03-open-source-resources.md` - libraries and datasets, with LICENCE and intended use
- `04-safety-content.md` - what a responsible reloading site must surface

Every factual claim about another site must carry a URL. Anything unverifiable
is recorded as unverified rather than inferred.

This file exists so the directory is tracked by git: git does not record empty
directories, and `tasks:check` correctly failed in CI because R1, R2 and R3
each pointed at a directory that a clean checkout did not contain.
