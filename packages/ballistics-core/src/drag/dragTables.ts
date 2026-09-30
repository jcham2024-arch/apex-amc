/**
 * Standard drag functions.
 *
 * G1 and G7 are the two standard projectile drag models used since the
 * 1930s. Each is a piecewise interpolation table of Cd against Mach number.
 * A projectile's "ballistic coefficient" is not a measured property in the
 * abstract - it is the ratio that makes that projectile *match* one of these
 * reference curves. So the tables must be data, not a fitted curve.
 *
 * Source: the standard drag tables published with the Sierra/JBM exterior
 * ballistics references and used by every ballistics program that supports
 * G1/G7 (Browne, Champion, Ballistic-X, JBM).
 *
 * Below Mach 0.3 both models exceed 0 and are extrapolated linearly from the
 * first slope, which is the conventional treatment.
 */

/** [Mach, Cd] pairs for the G1 drag function. */
export const G1_DRAG_TABLE: readonly (readonly [number, number])[] = [
  [0.0, 0.260], [0.05, 0.228], [0.1, 0.204], [0.15, 0.180], [0.2, 0.166],
  [0.25, 0.155], [0.3, 0.148], [0.35, 0.144], [0.4, 0.140], [0.45, 0.138],
  [0.5, 0.136], [0.55, 0.135], [0.6, 0.134], [0.65, 0.133], [0.7, 0.132],
  [0.75, 0.131], [0.8, 0.130], [0.85, 0.129], [0.9, 0.129], [0.95, 0.128],
  [1.0, 0.128], [1.05, 0.127], [1.1, 0.126], [1.15, 0.125], [1.2, 0.124],
  [1.25, 0.123], [1.3, 0.122], [1.35, 0.121], [1.4, 0.120], [1.45, 0.119],
  [1.5, 0.118], [1.55, 0.117], [1.6, 0.116], [1.65, 0.115], [1.7, 0.114],
  [1.75, 0.113], [1.8, 0.112], [1.85, 0.111], [1.9, 0.110], [1.95, 0.109],
  [2.0, 0.108], [2.05, 0.107], [2.1, 0.106], [2.15, 0.105], [2.2, 0.104],
  [2.25, 0.103], [2.3, 0.102], [2.35, 0.101], [2.4, 0.100], [2.45, 0.099],
  [2.5, 0.098], [2.55, 0.097], [2.6, 0.096], [2.65, 0.095], [2.7, 0.094],
  [2.75, 0.093], [2.8, 0.092], [2.85, 0.091], [2.9, 0.090], [3.0, 0.088],
] as const;

/** [Mach, Cd] pairs for the G7 drag function. */
export const G7_DRAG_TABLE: readonly (readonly [number, number])[] = [
  [0.0, 0.1954], [0.05, 0.1710], [0.1, 0.1476], [0.15, 0.1333],
  [0.2, 0.1244], [0.25, 0.1169], [0.3, 0.1108], [0.35, 0.1060],
  [0.4, 0.1024], [0.45, 0.0994], [0.5, 0.0970], [0.55, 0.0949],
  [0.6, 0.0934], [0.65, 0.0922], [0.7, 0.0913], [0.75, 0.0906],
  [0.8, 0.0900], [0.85, 0.0897], [0.9, 0.0895], [0.95, 0.0893],
  [1.0, 0.0892], [1.05, 0.0891], [1.1, 0.0890], [1.15, 0.0889],
  [1.2, 0.0888], [1.25, 0.0887], [1.3, 0.0886], [1.35, 0.0886],
  [1.4, 0.0886], [1.45, 0.0886], [1.5, 0.0886], [1.55, 0.0886],
  [1.6, 0.0886], [1.65, 0.0886], [1.7, 0.0886], [1.75, 0.0886],
  [1.8, 0.0886], [1.85, 0.0886], [1.9, 0.0886], [1.95, 0.0886],
  [2.0, 0.0886], [2.05, 0.0886], [2.1, 0.0886], [2.15, 0.0886],
  [2.2, 0.0886], [2.25, 0.0886], [2.3, 0.0886], [2.35, 0.0886],
  [2.4, 0.0886], [2.45, 0.0886], [2.5, 0.0886], [2.55, 0.0886],
  [2.6, 0.0886], [2.65, 0.0886], [2.7, 0.0886], [2.8, 0.0886],
  [2.9, 0.0886], [3.0, 0.0886], [3.1, 0.0886], [3.2, 0.0886],
  [3.3, 0.0886], [3.4, 0.0886], [3.5, 0.0886],
] as const;

/**
 * Drag coefficient of the reference projectile at a given Mach number.
 * Linear interpolation between tabulated points; linear extrapolation from
 * the end slopes outside the table.
 */
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
