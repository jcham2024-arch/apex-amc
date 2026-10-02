// The rules that decide whether the main app is in a shippable state.
//
// SEPARATED FROM THE RUNNER ON PURPOSE
// ------------------------------------
// Two consumers need exactly the same rules: the checker, which reports them,
// and scripts/handoff/handoff-baseline.mjs, which records the pre-existing ones so they
// stop blocking. The first version had each side carry its own copy, and they
// disagreed immediately - the baseline hashed a rule name while the checker
// hashed rule+message, so nothing ever matched and the ratchet silently degraded
// into "always blocks". Three of the six defects fixed in the previous pass were
// this exact shape: two implementations of one idea.
//
// A module exists so the second consumer asks the first what it finds, rather
// than re-deriving it. This is the same reasoning that makes scripts/shared/data.mjs
// shared between the generator and the build gate, and the same reasoning behind
// the repo's own provenance tiers: a rule that lives in one place cannot be
// quietly satisfied by a second, laxer version of itself.
//
// WHAT IS HERE, AND WHY
// ---------------------
// Each rule is a class because a rule is a named predicate with a consequence
// attached. A rule cannot be added without also stating what it protects,
// which is the coupling the provenance system already enforces in
// packages/ballistics-core - and which exists because a value without a stated
// authority gets quietly invented later.
import { createHash } from 'node:crypto';

/** Severity, worst first. Only `blocker` fails the check. */
export const BLOCKER = 'blocker';
/** Reported, not blocking, and not in the baseline. */
export const WARNING = 'warning';
/** Present in the baseline: reported, not blocking. */
export const KNOWN = 'known';

/**
 * Stable identity for a finding: the rule plus the specific message.
 *
 * Written once and used by both consumers. The message is part of the identity
 * on purpose: fixing a problem changes the message, and therefore the
 * fingerprint, so a problem that is fixed and later reintroduced comes back as
 * unknown and blocks again. That is what makes the baseline a ratchet rather
 * than a mute button.
 */
export function fingerprintOf(rule, message) {
  return createHash('sha256').update(`${rule}:${message}`).digest('hex').slice(0, 12);
}

/**
 * One rule's verdict.
 *
 * A value object rather than a bare string, so the reason travels with the
 * result. Returning `['no csp']` loses the explanation at exactly the point
 * someone needs to act on it - the same mistake the repo corrected for data
 * values, where a problem without a reason gets deferred.
 */
export class Finding {
  constructor({ rule, severity, message, consequence }) {
    this.rule = rule;
    this.severity = severity;
    this.message = message;
    this.consequence = consequence;
  }

  get blocks() {
    return this.severity === BLOCKER;
  }

  get fingerprint() {
    return fingerprintOf(this.rule, this.message);
  }

  /**
   * Re-label as KNOWN if the baseline lists this exact finding.
   *
   * Returns `this` so a caller can map over findings in one expression.
   */
  acknowledgeIfKnown(known) {
    if (this.blocks && known.has(this.fingerprint)) this.severity = KNOWN;
    return this;
  }
}

/** Base class: a named predicate plus the reason it matters. */
export class Rule {
  constructor(name, consequence) {
    this.name = name;
    this.consequence = consequence;
  }

  /** @returns {Finding[]} empty when the page satisfies this rule. */
  check() {
    throw new Error(`${this.name} must implement check()`);
  }

  finding(message) {
    return new Finding({
      rule: this.name,
      severity: BLOCKER,
      message,
      consequence: this.consequence,
    });
  }
}

/**
 * The page must not reference the data layer.
 *
 * This is the rule that makes the isolation real. The moment index.html fetches
 * a file from data/, an upstream data change becomes a possible live-site
 * regression, and the shipped artefact stops being verifiable offline. It is
 * also the failure mode most likely to be introduced innocently, by someone
 * adding a `fetch('data/generated/json/powders.json')` to surface a new dataset.
 */
export class SelfContainment extends Rule {
  constructor() {
    super(
      'self-containment',
      'The shipped page must stay self-contained. A runtime data/ import makes '
      + 'every data-layer change a possible live-site regression and makes the '
      + 'deployed file unverifiable offline.',
    );
  }

  check(html) {
    const out = [];
    // Matched inside quotes, which is where a fetch or import path would appear.
    // Requiring a closing quote or whitespace after the path stops `data/`
    // appearing in prose from matching.
    for (const ref of html.match(/["'`]\s*\.?\.?\/data\/[^"'`\s)]*/g) ?? []) {
      out.push(this.finding(`references the data layer: ${ref}`));
    }
    // A local .json or .csv is the same coupling by another name, and a relative
    // src/href to one breaks the moment the build layout changes.
    for (const ref of html.match(/["'`][^"'`\s)]*\.(json|csv)["'`]/g) ?? []) {
      out.push(this.finding(`loads a local data file at runtime: ${ref}`));
    }
    return out;
  }
}

/**
 * Every remotely loaded script needs Subresource Integrity.
 *
 * Without `integrity`, a changed or compromised CDN response executes with full
 * page privileges. With it, the browser refuses any response whose bytes do not
 * hash to the pinned value. `crossorigin` is part of the same mechanism:
 * without it the browser can be tricked into omitting the CORS check, so
 * `integrity` alone is not the full protection and is reported separately.
 */
export class RemoteIntegrity extends Rule {
  constructor() {
    super(
      'supply-chain-sri',
      'A remote script without an integrity hash executes with full page '
      + 'privileges if the CDN is ever compromised. SRI makes the browser refuse '
      + 'any response whose bytes do not match the pinned hash.',
    );
  }

  check(html) {
    const out = [];
    const tag = /<script\b[^>]*\bsrc=["'](https?:\/\/[^"']+)["'][^>]*>/gi;
    for (const [, url, attrs] of html.matchAll(tag)) {
      if (!/\bintegrity=["']sha(256|384|512)-/i.test(attrs)) {
        out.push(this.finding(`remote script without SRI: ${url}`));
      } else if (!/\bcrossorigin=["']anonymous["']/i.test(attrs)) {
        out.push(
          this.finding(
            `remote script has integrity but no crossorigin="anonymous": ${url}`,
          ),
        );
      }
    }
    return out;
  }
}

/**
 * cdn.tailwindcss.com is a compiler, not a stylesheet.
 *
 * It downloads Tailwind and generates CSS by inspecting the page in the
 * visitor's browser. That is arbitrary code execution on every page load, from a
 * host we do not control, in a file that serves real users. The fix is to build
 * the CSS at deploy time and self-host it - which is also what a working Vite
 * build would give us for free.
 */
export class NoRuntimeCompiler extends Rule {
  constructor() {
    super(
      'runtime-compiler',
      "cdn.tailwindcss.com compiles the page in the visitor's browser, which is "
      + 'arbitrary code execution on every page load from a host we do not '
      + 'control. Build the CSS at deploy time and self-host it.',
    );
  }

  check(html) {
    return /cdn\.tailwindcss\.com/i.test(html)
      ? [this.finding('loads cdn.tailwindcss.com, a runtime CSS compiler (see HANDOFF.md)')]
      : [];
  }
}

/**
 * Inline on*= handlers.
 *
 * A nonce-based CSP cannot cover them, so their presence means the page cannot
 * adopt a strict policy without restructuring. The current page has none, which
 * is why this passes today and is kept as a guard: adding one is easy and
 * invisible in review.
 */
export class NoInlineHandlers extends Rule {
  constructor() {
    super(
      'inline-handlers',
      'An on*= attribute cannot be covered by a script nonce, so its presence '
      + 'means the page cannot adopt a strict CSP without restructuring.',
    );
  }

  check(html) {
    // `on` + letters + `=`, and deliberately not matching text like "button=1".
    const handlers = html.match(/\son[a-z]{2,20}=["'][^"']*["']/gi) ?? [];
    if (handlers.length === 0) return [];
    return [
      this.finding(`${handlers.length} inline event handler(s), e.g. ${handlers[0].trim()}`),
    ];
  }
}

/**
 * No Content-Security-Policy at all.
 *
 * The defence in depth that still holds when an XSS bug slips past review, which
 * matters more than usual here: the page has 5 innerHTML writes and previously
 * lost its replaceChildren hardening to a script overwrite.
 */
export class CspPresent extends Rule {
  constructor() {
    super(
      'content-security-policy',
      'Without a CSP, an XSS bug runs unrestricted. A nonce-based strict policy '
      + "(script-src 'nonce-...' 'strict-dynamic') is the target state; "
      + "'unsafe-inline' must not appear, as it disables the protection.",
    );
  }

  check(html) {
    return /content-security-policy/i.test(html)
      ? []
      : [this.finding('no Content-Security-Policy is declared')];
  }
}

/**
 * Runs every content rule against a page and returns the findings.
 *
 * The single entry point both consumers use. `Integrity` is deliberately NOT
 * included: it compares the recorded SHA-256 against the file, so it needs the
 * manifest, and a baseline has no business deciding what is approved. The
 * baseline records what the *content* rules find, which is exactly the set of
 * defects that are properties of the page rather than of the process.
 *
 * @param {string} html  the page source
 * @returns {Finding[]} blocking findings, unsuppressed by the baseline
 */
export function rulesFor(html) {
  return [
    new SelfContainment(),
    new RemoteIntegrity(),
    new NoRuntimeCompiler(),
    new NoInlineHandlers(),
    new CspPresent(),
  ].flatMap((rule) => rule.check(html));
}
