/**
 * Provenance model.
 *
 * Every physical constant, coefficient, and piece of load data in this
 * package carries a `SourceCitation` and a confidence tier. Nothing may be
 * invented: a value either comes from a published source, is derived from
 * published sources by a documented method, or is explicitly flagged as an
 * approximation with the reasoning recorded.
 *
 * The tiers, in descending order of authority:
 *
 *   `published`  Transcribed from a manufacturer manual, CIP, SAAMI, or
 *                NIST. Quote it verbatim; `page`/`table` are required.
 *   `derived`    Computed from published values by a documented method
 *                (e.g. the Homann expansion model). `method` is required.
 *   `estimated`  No published value exists. An approximation inferred from
 *                related published data. `reasoning` is required and the
 *                UI must present these differently.
 *
 * `estimated` is not a loophole for making numbers up. It exists so that a
 * user asking "where does this come from?" gets an honest answer rather than
 * a confident fabrication.
 */

/** How much authority a value carries. Ordered least to most trusted. */
export const CONFIDENCE_TIERS = ['estimated', 'derived', 'published'] as const;

export type Confidence = (typeof CONFIDENCE_TIERS)[number];

/** A published work the value was taken from. */
export interface SourceCitation {
  /** Stable slug, e.g. `hodgdon-2024`. */
  readonly id: string;
  /** Publisher, e.g. 'Hodgdon Powder Company'. */
  readonly publisher: string;
  /** Title of the manual, CIP, or standard. */
  readonly title: string;
  /** Edition or revision, e.g. '2024' or '10th Edition'. */
  readonly edition?: string;
  /** Where to find it. */
  readonly url?: string;
  /** ISO date the value was read, so stale data is visible. */
  readonly retrievedOn: string;
  /** Page or table within the source. */
  readonly page?: string;
  /** Table number, for tabulated data. */
  readonly table?: string;
}

/** A value together with where it came from and how much to trust it. */
export interface Sourced<T> {
  readonly value: T;
  readonly source: SourceCitation;
  readonly confidence: Confidence;
  /** Required when `confidence` is `derived`: the formula or method used. */
  readonly method?: string;
  /** Required when `confidence` is `estimated`: why no published value exists. */
  readonly reasoning?: string;
  /** Comparable units, when the raw figure is unitless. */
  readonly units?: string;
}

/**
 * A value for which no acceptable published figure exists.
 *
 * Note: declared with an explicit field rather than a TypeScript parameter
 * property, because this package runs under Node's type-stripping loader,
 * which rejects parameter-property syntax.
 */
export class UnverifiedValueError extends Error {
  override readonly name = 'UnverifiedValueError';

  /** The value that could not be verified. */
  readonly subject: string;

  constructor(subject: string, message: string) {
    super(message);
    this.subject = subject;
  }
}


/**
 * Construction helpers. These are the only sanctioned way to create a
 * `Sourced` value, and they enforce the tier requirements so an `estimated`
 * value can never exist without a recorded reason.
 */

/** A value read directly from a published source. */
export function published<T>(
  value: T,
  source: SourceCitation,
  meta: { units?: string; page?: string; table?: string } = {},
): Sourced<T> {
  if (!source.id || !source.publisher || !source.title) {
    throw new UnverifiedValueError(
      String(value),
      'A published value requires a source with id, publisher, and title.',
    );
  }
  return {
    value,
    source: {
      ...source,
      ...(meta.page !== undefined ? { page: meta.page } : {}),
      ...(meta.table !== undefined ? { table: meta.table } : {}),
    },
    confidence: 'published',
    ...(meta.units !== undefined ? { units: meta.units } : {}),
  };
}

/** A value computed from published values by a documented method. */
export function derived<T>(
  value: T,
  source: SourceCitation,
  method: string,
  meta: { units?: string } = {},
): Sourced<T> {
  if (!method) {
    throw new UnverifiedValueError(
      String(value),
      'A derived value requires the method used to compute it.',
    );
  }
  return {
    value,
    source,
    confidence: 'derived',
    method,
    ...(meta.units !== undefined ? { units: meta.units } : {}),
  };
}

/**
 * A value for which no published figure exists.
 *
 * Requires `reasoning` explaining why, and ideally naming the published data
 * the approximation was inferred from. The UI is expected to render these
 * differently — a shooter deserves to know a coefficient is an estimate.
 */
export function estimated<T>(
  value: T,
  source: SourceCitation,
  reasoning: string,
  meta: { units?: string } = {},
): Sourced<T> {
  if (!reasoning) {
    throw new UnverifiedValueError(
      String(value),
      'An estimated value requires a documented reason it could not be sourced.',
    );
  }
  return {
    value,
    source,
    confidence: 'estimated',
    reasoning,
    ...(meta.units !== undefined ? { units: meta.units } : {}),
  };
}

/** Narrowing helper: is this value quoted from a published source? */
export function isPublished<T>(s: Sourced<T>): boolean {
  return s.confidence === 'published';
}

/** True when the value is not authoritative enough to present as fact. */
export function isApproximate<T>(s: Sourced<T>): boolean {
  return s.confidence === 'estimated';
}
