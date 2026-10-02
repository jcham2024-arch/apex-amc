-- Apex AMC :: 014 - Ballistic coefficient basis
--
-- WHY THIS EXISTS
-- ---------------
-- A BC is not a single number. It is a number that depends on the speed at
-- which it was measured, and the industry does not agree on what that speed
-- should be.
--
-- Hornady says so explicitly on their own BC page: they "originally published
-- 800 yard average BC values for ELD-X and ELD Match", while "other
-- manufacturers list 200 yard BCs", and they now publish three columns - Mach
-- 2.25, Mach 2.0 and Mach 1.75 - so that shooters can pick the one that
-- matches their use.
--
-- That is not a quibble. A 175gr VLD Target is commonly published around 0.44
-- G1 on a 200-yard basis and around 0.50 on an 800-yard basis. Putting both
-- kinds of number in one column and sorting by it produces confident nonsense,
-- and a shooter choosing a bullet on that comparison would be misled in a way
-- no error message would catch.
--
-- The `bc_g1` / `bc_g7` columns in 004 are therefore redefined as the
-- STANDARDIZED figures: always the 200-yard / Mach 2.25 basis, which is the
-- near-universal convention for cross-manufacturer comparison. `bc_reference`
-- records which basis a row actually uses, so a row that genuinely is 800-yard
-- says so rather than quietly comparing badly.
--
-- Nothing is thrown away. The other Mach values are kept in their own columns.
-- We cannot use them today because the trajectory solver takes a single BC, but
-- they are the input a drag-coefficient solver would need tomorrow, and a
-- ballistic coefficient is expensive to re-measure and easy to lose. "We can't
-- use it yet" is not a reason to not have it.

ALTER TABLE bullets ADD COLUMN bc_reference TEXT
    -- Which basis the bc_g1/bc_g7 pair uses.
    --   'mach_2_25'  Hornady-style, 2512 fps @ ICAO. Equivalent to ~200 yard.
    --                 THE STANDARD. What bc_g1/bc_g7 mean unless stated.
    --   'mach_2_0'   2233 fps @ ICAO. Mid-range.
    --   'mach_1_75'  1954 fps @ ICAO. Beyond ~600 yard.
    --   'y800'       Older 800-yard-average convention (Hornady's pre-2012
    --                 figures, and still used by some makers). NOT comparable
    --                 to the others without conversion.
    --   'unspecified' Source does not state a basis. Honest, but it means the
    --                 figure cannot be compared across manufacturers until
    --                 someone resolves it.
    CHECK (bc_reference IS NULL OR bc_reference IN (
        'mach_2_25', 'mach_2_0', 'mach_1_75', 'y800', 'unspecified'));

-- The full published set, kept even though the solver reads only the
-- standardized pair. NULL means the manufacturer does not publish that Mach
-- number, which is different from publishing zero.
ALTER TABLE bullets ADD COLUMN bc_g1_mach_2_25 REAL;
ALTER TABLE bullets ADD COLUMN bc_g7_mach_2_25 REAL;
ALTER TABLE bullets ADD COLUMN bc_g1_mach_2_0  REAL;
ALTER TABLE bullets ADD COLUMN bc_g7_mach_2_0  REAL;
ALTER TABLE bullets ADD COLUMN bc_g1_mach_1_75 REAL;
ALTER TABLE bullets ADD COLUMN bc_g7_mach_1_75 REAL;

-- A 200-yard / Mach 2.25 G1 BC above 1.0 is physically impossible and usually
-- means a column got shifted during extraction. bc_y800 is deliberately not
-- range-guarded here for the same reason bc_y800 values run higher.
CREATE INDEX IF NOT EXISTS idx_bullets_bc_ref ON bullets(bc_reference);

-- NOTE ON RANGE GUARDS
-- The "G1 above 1.0 is impossible" rule above is true, but it is NOT enforced
-- on bc_g1, and that is a deliberate, recorded exception rather than an
-- oversight. data/schemas/bullets.yaml raises the bc_g1 ceiling to 2.0 because a
-- row's validity depends on bc_reference, a different column: Berger states no
-- basis, so bc_reference is 'unspecified', and its published G1 of 1.022 is
-- plausible on an unstated slower reference while being impossible on Mach 2.25.
-- A CHECK constraint cannot read another column, so the honest options were
-- "uselessly strict" or "uselessly loose", and it is currently loose. The real
-- protection is structural: parsers key off the publisher's own column headers
-- and throw on mismatch. See the manifest note on bc_g1 for the full reasoning.

