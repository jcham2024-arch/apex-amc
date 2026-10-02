// Security rules for the shipped main app.
//
// SEPARATED FROM THE RUNNER, FOR THE SAME REASON AS check-handoff-rules.mjs
// ------------------------------------------------------------------------
// The handoff checker and the security baseline both need to know what a finding
// is. Duplicating the definition is how the two ends drift, and the first
// version of this work already had a fingerprint mismatch for exactly that
// reason. One definition, imported twice.
//
// WHAT "EXPLOITABLE" MEANS HERE
// -----------------------------
// A sink is not a vulnerability. `innerHTML` is a sink; it is a *vulnerability*
// only when data an attacker can influence reaches it. So these rules check the
// shape of the interpolation, and where they can, they check whether the value
// is sanitised first - not merely whether the string "innerHTML" appears.
//
// The distinction matters because a page that legitimately clears a container
// with `innerHTML = ''` is not a hole, while `card.innerHTML = \`...${r.name}\`` is.
// Reporting both as "innerHTML found" trains people to ignore the rule, which
// is the same failure mode the known-findings ratchet exists to avoid.
import { createHash } from 'node:crypto';

export const BLOCKER = 'blocker';
export const KNOWN = 'known';

export function fingerprintOf(rule, message) {
  return createHash('sha256').update(`${rule}:${message}`).digest('hex').slice(0, 12);
}

export class SecurityFinding {
  constructor({ rule, severity, message, consequence, evidence }) {
    this.rule = rule;
    this.severity = severity;
    this.message = message;
    this.consequence = consequence;
    this.evidence = evidence ?? null;
  }

  get blocks() {
    return this.severity === BLOCKER;
  }

  get fingerprint() {
    return fingerprintOf(this.rule, this.message);
  }

  acknowledgeIfKnown(known) {
    if (this.blocks && known.has(this.fingerprint)) this.severity = KNOWN;
    return this;
  }
}

/**
 * Data interpolated into markup via a template literal.
 *
 * `card.innerHTML = \`...${r.name}...\`` executes any markup in `r.name`. The
 * safe form is `textContent`, which cannot parse markup, or the `el()` helper in
 * apps/website/src/dom.js which sets textContent.
 *
 * `innerHTML = ''` and `element.replaceChildren()` are excluded: clearing a
 * container is not an injection sink and flagging it would bury the real ones.
 */
export function templateInjectionFindings(html, rel) {
  const out = [];

  // Assign innerHTML from a template literal containing an interpolation.
  const assign = /(\w+)\.innerHTML\s*=\s*`([^`]*)`/g;
  for (const [, node, body] of html.matchAll(assign)) {
    const fields = [...body.matchAll(/\$\{\s*([^}]+?)\s*\}/g)].map((m) => m[1]);
    if (fields.length === 0) continue; // static markup: not injectable
    out.push(new SecurityFinding({
      rule: 'xss-template-injection',
      severity: BLOCKER,
      message: `${node}.innerHTML interpolates ${fields.length} value(s): ${fields.join(', ')}`,
      consequence:
        'A value reaching this interpolation is parsed as markup, so a payload '
        + 'like <img src=x onerror=alert(1)> executes. Use textContent, or the el() '
        + 'helper in apps/website/src/dom.js, which cannot parse markup.',
      evidence: { file: rel, sink: `${node}.innerHTML`, fields },
    }));
  }

  // A URL context is the most severe form: a javascript: URL executes on click
  // and needs no <script> tag, so it survives naive HTML-escaping of the
  // surrounding markup.
  const href = /href="\$\{\s*([^}]+?)\s*\}"/g;
  for (const [, field] of html.matchAll(href)) {
    out.push(new SecurityFinding({
      rule: 'xss-url-scheme',
      severity: BLOCKER,
      message: `href interpolates ${field} with no scheme check`,
      consequence:
        'A javascript: or data: URL here becomes script execution on click, and '
        + 'HTML-escaping the surrounding markup does not help. The hardened '
        + 'safeUrl() in apps/website/src/dom.js rejects every scheme but http(s).',
      evidence: { file: rel, sink: 'href', fields: [field] },
    }));
  }

  return out;
}

/**
 * Remote scripts loaded without Subresource Integrity.
 *
 * Separate from the handoff checker's supply-chain rule on purpose: that one
 * asks "is this pinned?", this one additionally flags the runtime compiler,
 * which is a different failure with a different fix (build the CSS, do not add a
 * hash). Both report, so the reasoning is in one place.
 */
export function remoteScriptFindings(html, rel) {
  const out = [];
  const tag = /<script\b[^>]*\bsrc=["'](https?:\/\/[^"']+)["'][^>]*>/gi;
  for (const [, url, attrs] of html.matchAll(tag)) {
    const pinned = /\bintegrity=["']sha(256|384|512)-/i.test(attrs);
    if (!pinned) {
      out.push(new SecurityFinding({
        rule: 'supply-chain-unpinned',
        severity: BLOCKER,
        message: `remote script without SRI: ${url}`,
        consequence:
          'The CDN operator, or anyone who compromises that origin, can serve '
          + 'arbitrary JavaScript to every visitor with no browser-side warning. '
          + 'Add integrity + crossorigin, or self-host.',
        evidence: { file: rel, url },
      }));
    }
    if (/cdn\.tailwindcss\.com/i.test(url)) {
      out.push(new SecurityFinding({
        rule: 'runtime-compiler',
        severity: BLOCKER,
        message: 'loads cdn.tailwindcss.com, a runtime CSS compiler',
        consequence:
          'It executes code in every visitor\'s browser to compile the page. That '
          + 'is arbitrary code execution from a host we do not control, on every '
          + 'page load. Build the CSS at deploy time and self-host it.',
        evidence: { file: rel, url },
      }));
    }
  }
  return out;
}

/** Runs every content rule against a page. */
export function securityFindings(html, rel) {
  return [
    ...templateInjectionFindings(html, rel),
    ...remoteScriptFindings(html, rel),
  ];
}

/**
 * The files this check reads, and why each is in scope.
 *
 * Scoped deliberately. `archive/` holds prior drafts that are never built and
 * never served, and `node_modules` is not ours. A scanner that read them would
 * report findings nobody can act on, which is how a security check gets muted.
 */
export const SCANNED = [
  // The deployed artefact. The only file a visitor ever receives.
  { path: 'apps/website/dist/index.html', kind: 'html' },
  // The extracted modules. Not built, but the hardened reference the deployed
  // file should be brought in line with.
  { path: 'apps/website/src/main.js', kind: 'js' },
];

/**
 * Known, accepted findings, as a Set of fingerprints.
 *
 * Takes the ALREADY-PARSED baseline object, not a JSON string. An earlier
 * version took a string and called JSON.parse internally; the only caller passed
 * the parsed result, so the parse threw, the catch swallowed it, and the set
 * came back empty - every finding looked unknown and the ratchet degraded into
 * "always blocks" while appearing to work. Found by printing the set size rather
 * than trusting the exit code.
 *
 * An absent or unreadable baseline yields an EMPTY set, so everything blocks.
 * The safe direction to fail is "treat everything as new", never "treat
 * everything as known". Same ratchet semantics as the handoff baseline, and for
 * the same reason: a warning that is always present is a warning nobody reads.
 *
 * @param {object|null} baseline parsed JSON, or null when there is no baseline
 * @returns {Set<string>} fingerprints; empty means "nothing is known"
 */
export function loadKnown(baseline) {
  if (!baseline || typeof baseline !== 'object') return new Set();
  const known = Array.isArray(baseline.known) ? baseline.known : [];
  return new Set(known.map((k) => k?.fp).filter((fp) => typeof fp === 'string'));
}
