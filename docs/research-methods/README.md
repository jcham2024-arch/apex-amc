# Numerical cross-validation research

Output directory for task **R2** in `.cline/tasks/ledger.json`. Read-only with
respect to source: findings are reported, not applied.

Expected deliverables:

- `01-cross-check-methods.md` - mathematically independent alternatives, with the actual maths
- `02-dual-computation-candidates.md` - which outputs can be computed two ways, and why that is evidence
- `03-oss-ballistics.md` - open-source implementations, exact licences, cross-check only
- `04-physics-traps.md` - newly documented unit and convention traps, cited

This directory exists for the same reason as the other two research folders: git
does not record empty directories, and `tasks:check` failed in CI when R1, R2 and
R3 pointed at directories a clean checkout did not contain.
