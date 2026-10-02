/**
 * Standard drag functions.
 *
 * G1 and G7 are the two standard projectile drag models used since the
 * 1930s. Each is a piecewise interpolation table of Cd against Mach number.
 * A projectile's "ballistic coefficient" is not a measured property in the
 * abstract - it is the ratio that makes that projectile *match* one of these
 * reference curves. So the tables must be data, not a fitted curve.
 *
 * SOURCE AND VERIFICATION (corrected 30 Sep 2026)
 * -----------------------------------------------
 * Values are from McCoy, "Modern Exterior Ballistics" (2012), and were verified
 * against THREE independent implementations, which agree exactly at all fifteen
 * comparable Mach points:
 *
 *   - McCoy 2012, via the Tireur "Competition Ballistics" manual, Table 5.2
 *   - js-ballistics (ISC), DragTables.G1 / .G7
 *   - py_ballistics, pyballistic/drag_tables.py
 *
 * The machine-readable copy lives in data/reference/drag_tables.csv, which also
 * carries G2, G5, G6, G8, GI, GS and RA4 for future models.
 *
 * WHY THIS FILE WAS REWRITTEN
 * ---------------------------
 * The previous G1 and G7 tables in this file were wrong in the most consequential
 * way possible: **neither had a transonic region.** Both declined smoothly from
 * Mach 0 onward with no rise through the sound barrier. Real drag coefficients
 * roughly TRIPLE between Mach 0.8 and Mach 1.0 as the pressure wave cannot
 * clear the base.
 *
 * The old G7 table was flat at Cd = 0.0886 from Mach 1.3 through Mach 3.5 - 37
 * of 63 rows sharing a single value. The symptom was the solver reporting about
 * 22 inches less drop at 1000 yards than an independent implementation, and
 * retaining up to 3.7% more velocity through transonic flight.
 *
 * Every test passed while this was wrong. The regression test asserts agreement
 * at one range for one bullet, and a single end-point check cannot see a wrong
 * curve. See docs/BALLISTICS-AUDIT.md section 0.
 *
 * The lesson, recorded so it is not repeated: **data copied from an unread
 * citation is a guess with a reference attached.** These tables now have three
 * independent sources agreeing on them.
 *
 * EXTRAPOLATION
 * --------------
 * Below Mach 0 the curve is extrapolated linearly from the first segment, which
 * is the conventional treatment. Above Mach 4 the curve is held flat; the
 * reference data extends to Mach 5 and the tables were truncated to 4 for
 * compactness. Neither regime is reached by a rifle load in normal use.
 */

/** [Mach, Cd] pairs for the G1 drag function. */
export const G1_DRAG_TABLE: readonly (readonly [number, number])[] = [
  [0, 0.2629], [0.05, 0.2558], [0.1, 0.2487], [0.15, 0.2413], [0.2, 0.2344], [0.25, 0.2278],
  [0.3, 0.2214], [0.35, 0.2155], [0.4, 0.2104], [0.45, 0.2061], [0.5, 0.2032], [0.55, 0.202],
  [0.6, 0.2034], [0.7, 0.2165], [0.725, 0.223], [0.75, 0.2313], [0.775, 0.2417], [0.8, 0.2546],
  [0.825, 0.2706], [0.85, 0.2901], [0.875, 0.3136], [0.9, 0.3415], [0.925, 0.3734],
  [0.95, 0.4084], [0.975, 0.4448], [1, 0.4805], [1.025, 0.5136], [1.05, 0.5427],
  [1.075, 0.5677], [1.1, 0.5883], [1.125, 0.6053], [1.15, 0.6191], [1.2, 0.6393],
  [1.25, 0.6518], [1.3, 0.6589], [1.35, 0.6621], [1.4, 0.6625], [1.45, 0.6607], [1.5, 0.6573],
  [1.55, 0.6528], [1.6, 0.6474], [1.65, 0.6413], [1.7, 0.6347], [1.75, 0.628], [1.8, 0.621],
  [1.85, 0.6141], [1.9, 0.6072], [1.95, 0.6003], [2, 0.5934], [2.05, 0.5867], [2.1, 0.5804],
  [2.15, 0.5743], [2.2, 0.5685], [2.25, 0.563], [2.3, 0.5577], [2.35, 0.5527], [2.4, 0.5481],
  [2.45, 0.5438], [2.5, 0.5397], [2.6, 0.5325], [2.7, 0.5264], [2.8, 0.5211], [2.9, 0.5168],
  [3, 0.5133], [3.1, 0.5105], [3.2, 0.5084], [3.3, 0.5067], [3.4, 0.5054], [3.5, 0.504],
  [3.6, 0.503], [3.7, 0.5022], [3.8, 0.5016], [3.9, 0.501], [4, 0.5006]
] as const;

/** [Mach, Cd] pairs for the G7 drag function. */
export const G7_DRAG_TABLE: readonly (readonly [number, number])[] = [
  [0, 0.1198], [0.05, 0.1197], [0.1, 0.1196], [0.15, 0.1194], [0.2, 0.1193], [0.25, 0.1194],
  [0.3, 0.1194], [0.35, 0.1194], [0.4, 0.1193], [0.45, 0.1193], [0.5, 0.1194], [0.55, 0.1193],
  [0.6, 0.1194], [0.65, 0.1197], [0.7, 0.1202], [0.725, 0.1207], [0.75, 0.1215],
  [0.775, 0.1226], [0.8, 0.1242], [0.825, 0.1266], [0.85, 0.1306], [0.875, 0.1368],
  [0.9, 0.1464], [0.925, 0.166], [0.95, 0.2054], [0.975, 0.2993], [1, 0.3803], [1.025, 0.4015],
  [1.05, 0.4043], [1.075, 0.4034], [1.1, 0.4014], [1.125, 0.3987], [1.15, 0.3955],
  [1.2, 0.3884], [1.25, 0.381], [1.3, 0.3732], [1.35, 0.3657], [1.4, 0.358], [1.5, 0.344],
  [1.55, 0.3376], [1.6, 0.3315], [1.65, 0.326], [1.7, 0.3209], [1.75, 0.316], [1.8, 0.3117],
  [1.85, 0.3078], [1.9, 0.3042], [1.95, 0.301], [2, 0.298], [2.05, 0.2951], [2.1, 0.2922],
  [2.15, 0.2892], [2.2, 0.2864], [2.25, 0.2835], [2.3, 0.2807], [2.35, 0.2779], [2.4, 0.2752],
  [2.45, 0.2725], [2.5, 0.2697], [2.55, 0.267], [2.6, 0.2643], [2.65, 0.2615], [2.7, 0.2588],
  [2.75, 0.2561], [2.8, 0.2533], [2.85, 0.2506], [2.9, 0.2479], [2.95, 0.2451], [3, 0.2424],
  [3.1, 0.2368], [3.2, 0.2313], [3.3, 0.2258], [3.4, 0.2205], [3.5, 0.2154], [3.6, 0.2106],
  [3.7, 0.206], [3.8, 0.2017], [3.9, 0.1975], [4, 0.1935]
] as const;

export function dragCoefficient(table: readonly (readonly [number, number])[], mach: number): number {
  if (table.length === 0) throw new RangeError('Drag table must not be empty.');

  const first = table[0]!;
  const last = table[table.length - 1]!;

  if (mach <= first[0]) {
    // Extrapolate using the slope of the first segment.
    const second = table[1]!;
    const slope = (second[1] - first[1]) / (second[0] - first[0]);
    return first[1] + slope * (mach - first[0]);
  }
  if (mach >= last[0]) {
    // Beyond the table the curve is treated as flat; the transonic region
    // has no reliable reference data and this is the conventional choice.
    return last[1];
  }

  // Binary search for the bracketing segment.
  let lo = 0;
  let hi = table.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (table[mid]![0] < mach) lo = mid;
    else hi = mid;
  }

  const [m0, c0] = table[lo]!;
  const [m1, c1] = table[hi]!;
  const t = (mach - m0) / (m1 - m0);
  return c0 + t * (c1 - c0);
}
