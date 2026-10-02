/**
 * Gate: the site must not make claims it cannot substantiate.
 *
 * WHY A SEPARATE GATE
 * --------------------
 * `check-website-build.mjs` covers structure and CSP. This covers *truthfulness*,
 * which is a different class of failure: the build can be perfect and the page
 * can still be deceptive.
 *
 * The site earns money from retailer links. That makes it an advertising
 * surface governed by the FTC Endorsement Guides (16 CFR 255), and it touches
 * ammunition and reloading data, which is safety-relevant. Both raise the bar
 * on what may be asserted.
 *
 * Everything checked here was a real, shipped problem on 2 Oct 2026:
 *
 *   - `rating: 4.9` on all eight retailers, rendered as a gold star, with no
 *     review count and no source. A bare number implies a measurable quantity
 *     we had never measured. 16 CFR 255.2(b): an endorser may not make
 *     representations they cannot substantiate.
 *   - Superlative badges: "Top Choice", "Powder Authority", "Component Stock
 *     Leader". Comparative advertising claims, each unsubstantiated.
 *   - "Verified Shipping Partner" and "Verified Suppliers" on every card and in
 *     the directory heading. Nothing in this codebase verifies a retailer.
 *   - "30% - 60% Avg Handload Savings" in the hero. A quantified financial claim
 *     whose truth depends entirely on the cartridge, the components and the
 *     volume bought.
 *   - Affiliate disclosure in the footer only. The FTC's own guidance is that
 *     disclosures at "the end" of content are likely to be missed; the reader is
 *     at the directory, looking at the link, and has not been told.
 *
 * WHAT THIS DELIBERATELY DOES NOT ENFORCE
 * --------------------------------------
 * It does not police tone, design, or how warm the copy is. It checks only for
 * specific unsupported claims, so it will not stop a well-written page. A gate
 * that cries wolf gets ignored, which is worse than no gate.
 *
 * It reads the built artefact, because that is what ships, and it strips HTML
 * comments first so the explanatory comments documenting these removals do not
 * trip it.
 */
import { existsSync, readFileSync } from 'node:fs';
import { builtIndexFile } from '../shared/data.mjs';

const problems = [];

if (!existsSync(builtIndexFile)) {
  console.error('dist/index.html is missing. Run `npm run website:build` first.');
  process.exit(1);
}

const html = readFileSync(builtIndexFile, 'utf8');

/** Visible page content only. The removed claims are named in source comments. */
const visible = html.replace(/<!--[\s\S]*?-->/g, '');

/**
 * Claims that must not appear in visible text.
 *
 * Each entry is [pattern, why]. A bare word like "best" is deliberately NOT here:
 * it appears in ordinary copy ("work best in short barrels") and flagging it
 * would make the gate noise rather than signal. These are the specific,
 * identifiable unsupported assertions.
 */
const FORBIDDEN = [
  [
    /Verified\s+Shipping\s+Partner/i,
    '"Verified Shipping Partner" asserts a verification that never happens - '
      + 'no code in this repository checks any retailer.',
  ],
  [
    /Verified\s+Suppliers?/i,
    '"Verified Suppliers" makes the same unsupported assertion in the directory '
      + 'heading and stats bar.',
  ],
  [
    /Avg\s+Handload\s+Savings/i,
    '"Avg Handload Savings" is a quantified financial claim. Savings depend on '
      + 'the cartridge, components and volume; there is no dataset behind it.',
  ],
  [
    /\b\d{1,2}\s*%\s*[-–]\s*\d{1,2}\s*%\s*(?:avg|average)?\s*(?:savings|save|cheaper)/i,
    'A percentage-range savings claim. Real savings are a function of the '
      + 'specific products bought and cannot be stated up front.',
  ],
  [
    /\b(Top\s+Choice|Powder\s+Authority|Component\s+Stock\s+Leader)\b/i,
    'Superlative retailer badges are comparative advertising claims requiring '
      + 'substantiation we do not have.',
  ],
];

/** A star icon next to a retailer card means a rating we cannot source. */
if (visible.includes('fa-star')) {
  problems.push(
    'a star icon is rendered. Retailer ratings were removed on 2 Oct 2026 '
      + 'because no review count or source exists for any of them. If real '
      + 'ratings are wanted, they need a review table and a stored count.',
  );
}

for (const [pattern, why] of FORBIDDEN) {
  const hit = pattern.exec(visible);
  if (hit) problems.push(`unsupported claim ${JSON.stringify(hit[0])}: ${why}`);
}

/**
 * The affiliate disclosure must appear ABOVE the retailer links, not only in the
 * footer.
 *
 * FTC Endorsement Guides 16 CFR 255.5 require a material connection to be
 * disclosed clearly and conspicuously, and Commission guidance states that
 * disclosures at the end of content are likely to be missed. Checking the
 * order of the two positions is what makes "proximate" mechanical: a footer
 * disclosure on its own passes a naive presence test and fails this one.
 */
const gridIndex = visible.indexOf('id="retailerGrid"');
const disclosureIndex = visible.search(/affiliate disclosure/i);

if (gridIndex === -1) {
  problems.push('the retailer grid is missing, so disclosure placement cannot be verified.');
} else if (disclosureIndex === -1) {
  problems.push(
    'no affiliate disclosure found anywhere. FTC Endorsement Guides require the '
      + 'material connection to be disclosed.',
  );
} else if (disclosureIndex > gridIndex) {
  problems.push(
    'the affiliate disclosure appears AFTER the retailer grid. It must precede '
      + 'the links it qualifies - a reader who reaches the links has not yet '
      + 'been told.',
  );
}

/** Every outbound retailer link must carry rel="sponsored". */
const sponsored = visible.match(/rel="[^"]*sponsored[^"]*"/g) ?? [];

if (sponsored.length === 0) {
  problems.push(
    'no link carries rel="sponsored". Paid links must be marked as such for '
      + 'search engines.',
  );
} else if (!/noopener/.test(visible)) {
  problems.push('outbound links are missing rel="noopener" (reverse tabnabbing).');
}

/**
 * Accessibility floor.
 *
 * Deliberately minimal - labelled inputs, a skip link, one h1 - because those
 * are objective and cheap to check. Full WCAG conformance needs
 * assistive-technology testing and a human audit, which this is not a substitute
 * for.
 */
const inputs = [...html.matchAll(/<input[^>]*>/g)].map((m) => m[0]);
const unlabelled = inputs.filter((input) => {
  const id = /id="([^"]+)"/.exec(input)?.[1];
  if (!id) return true;
  const byFor = new RegExp(`<label[^>]*for="${id}"`).test(html);
  const wrapped = new RegExp(`<label[^>]*>(?:(?!</label>)[\\s\\S])*id="${id}"`).test(html);
  return !byFor && !wrapped;
});

if (unlabelled.length) {
  const ids = unlabelled
    .map((i) => /id="([^"]+)"/.exec(i)?.[1] ?? '(no id)')
    .join(', ');
  problems.push(
    `${unlabelled.length} input(s) have no <label for> and are not wrapped in a `
      + `label (WCAG 4.1.2 Name, Role, Value): ${ids}. A visible <span> is not a `
      + 'label - it is not programmatically associated with the field.',
  );
}

if (!/Skip to main content/i.test(visible)) {
  problems.push(
    'no skip link. The sticky header carries the full nav, so without one a '
      + 'keyboard user tabs through every nav item on every load (WCAG 2.4.1 '
      + 'Bypass Blocks).',
  );
}

const h1Count = (visible.match(/<h1[\s>]/g) ?? []).length;
if (h1Count !== 1) {
  problems.push(`expected exactly one <h1>, found ${h1Count}.`);
}

if (problems.length) {
  console.error(`\nclaims & compliance   FAILED   (${problems.length} problem(s))`);
  for (const p of problems) console.error(`  x ${p}`);
  console.error('');
  process.exit(1);
}

console.log(
  `claims & compliance   ok   ${FORBIDDEN.length} claim types banned, `
    + `${inputs.length} inputs labelled, disclosure precedes retailer links`,
);