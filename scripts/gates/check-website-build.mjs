/**
 * Gate: the built website must be a single, self-contained file.
 *
 * HANDOFF.md requires `index.html` to be self-contained - one file, no runtime
 * fetch of `data/`. A default Vite build violates that by emitting hashed
 * asset files, so this check exists to make the rule mechanical rather than a
 * convention someone has to remember.
 *
 * It runs against `dist/` (the build output), not the source tree.
 *
 * Exits non-zero on violation, so `npm run verify` fails if the build starts
 * emitting external references again.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { builtIndexFile, websiteSrcDir, root } from '../shared/data.mjs';

const distDir = resolve(root, 'apps/website/dist');
const builtIndex = resolve(distDir, 'index.html');

/**
 * The directory Cloudflare will actually publish.
 *
 * `wrangler.toml` names it; this gate reads that same value rather than
 * hardcoding its own, so the two cannot drift apart unnoticed.
 *
 * This check exists because the two DID drift. `pages_build_output_dir` was
 * `"dist"` — a root directory that does not exist and never did — while the
 * build emits `apps/website/dist/`. Deploying that way publishes nothing and
 * 404s with no error message, so nothing else in the repository would have
 * caught it before production.
 */
function readDeployOutputDir() {
  const toml = readFileSync(resolve(root, 'wrangler.toml'), 'utf8');
  const match = /^pages_build_output_dir\s*=\s*["'](.+?)["']/m.exec(toml);
  return match ? match[1].replace(/\\/g, '/').replace(/\/+$/, '') : null;
}

/**
 * Files allowed in dist/ besides index.html.
 *
 * `_headers` is Cloudflare Pages' response-header file. It carries the
 * Content-Security-Policy, so it is part of the deployed artefact, not an
 * optional extra.
 */
const ALLOWED_FILES = ['index.html', '_headers'];

/** Remote hosts that are permitted in the shipped file. */
const ALLOWED_EXTERNAL = [
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com',
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
];

/** Patterns that would break self-containment or the handoff boundary. */
const FORBIDDEN = [
  { pattern: /(?:src|href)\s*=\s*["'](?:\.{0,2}\/)?assets\//i, why: 'references a bundled asset file' },
  { pattern: /\bfetch\s*\(/, why: 'performs a runtime fetch' },
  { pattern: /["'](?:\.\.\/)*data\//i, why: 'reaches into the data layer' },
  { pattern: /["'][^"']*\.json["']/i, why: 'references a JSON file' },
  { pattern: /["'][^"']*\.csv["']/i, why: 'references a CSV file' },
];

function fail(problems, heading) {
  console.error(`\n  ${heading}`);
  for (const p of problems) console.error(`    - ${p}`);
}

if (!existsSync(distDir)) {
  console.log('website build   not built (dist/ absent) - run `npm run website:build`');
  process.exit(0);
}

/** Every file in dist/, so a stray asset is caught even if unreferenced. */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const emitted = walk(distDir).map((f) => f.slice(distDir.length + 1));
const problems = [];

// 1. Only the expected files.
const extra = emitted.filter((f) => !ALLOWED_FILES.includes(f.split(/[\\/]/).pop()));
if (extra.length) {
  problems.push(
    `dist/ must contain only ${[...ALLOWED_FILES].join(' and ')}; also found: ${extra.join(', ')}`,
  );
}

// 1b. The CSP must actually be shipped. A build that dropped public/_headers
// would send no policy and still pass every other check here.
if (!existsSync(resolve(distDir, '_headers'))) {
  problems.push('dist/_headers is missing: the Content-Security-Policy would not be sent');
} else {
  const headers = readFileSync(resolve(distDir, '_headers'), 'utf8');
  if (!/content-security-policy/i.test(headers)) {
    problems.push('dist/_headers has no Content-Security-Policy directive');
  }
  // Inspect DIRECTIVE lines only. The file is heavily commented, and those
  // comments necessarily discuss the keywords they forbid - matching the whole
  // file would make the gate fail on its own explanation.
  const directives = headers
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('#'))
    .join('\n');
  for (const kw of ['unsafe-eval', 'unsafe-hashes', 'unsafe-inline']) {
    if (directives.includes(kw)) {
      problems.push(
        `dist/_headers permits ${kw} in an actual directive. The page needs none of `
          + 'these: Tailwind is compiled at build time, and the cost bar uses CSS '
          + 'custom properties rather than inline styles.',
      );
    }
  }

  // 1c. The CSP must be one the browser will actually accept, and must cover
  // this build. Both halves were wrong in ways every check above missed.
  //
  // The header previously carried `script-src 'nonce-{RANDOM}'`. That parses as
  // an INVALID source, so the browser discarded the whole source list and
  // blocked the inline script: the page rendered unstyled with a third of its
  // content missing. `_headers` is parsed at deploy time and its values are
  // sent verbatim - Cloudflare Pages performs no per-request substitution, so a
  // nonce can never reach the already-built markup. Confirmed in Chrome.
  if (directives.includes('{RANDOM}')) {
    problems.push(
      'dist/_headers still contains a {RANDOM} placeholder. Cloudflare Pages '
        + 'serves _headers verbatim and substitutes nothing, so the browser '
        + 'discards it as an invalid nonce and blocks every inline script. Run '
        + '`npm run website:csp`.',
    );
  }

  const cspMatch = /Content-Security-Policy:\s*([\s\S]*?)(?=\n\s*\n|\n\/\*|$)/.exec(directives);
  const csp = cspMatch ? cspMatch[1].replace(/\s+/g, ' ').trim() : '';

  // 1c-bis. The policy must be ONE line, and the file must be ONE block.
  //
  // This is the check whose absence let production serve with no CSP at all on
  // 2 Oct 2026. The policy was written folded across eleven lines - one
  // directive per line - which is how a person reads a CSP, and Cloudflare
  // Pages silently discarded it. The file was also split into three separate
  // `/*` blocks; Pages starts a NEW block at each `/*` rather than merging them,
  // so the first two were dropped too.
  //
  // Both shipped as HTTP 200 with correct HTML and zero headers, and every other
  // check in this file passed, because all of them read the FILE. Nothing looked
  // at the deployed response. Both forms were confirmed against a live preview
  // deployment: folded + three blocks served no policy; single line + single
  // block served all six headers.
  //
  // Cloudflare's documented form is `[name]: [value]` on one line under one URL
  // pattern (developers.cloudflare.com/pages/configuration/headers).
  const headerLines = headers.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'));

  const cspHeaderLines = headerLines.filter((l) => /^\s*Content-Security-Policy\s*:/.test(l));
  if (cspHeaderLines.length === 1 && !/Content-Security-Policy\s*:\s*\S/.test(cspHeaderLines[0])) {
    problems.push(
      'dist/_headers has Content-Security-Policy with no value on its line. Cloudflare '
        + 'Pages parses `[name]: [value]` literally and has no folded-value support, so '
        + 'the whole policy is discarded and the site ships with no CSP. Put the entire '
        + 'policy on ONE line after the colon.',
    );
  }

  const blockCount = headerLines.filter((l) => /^\s*\/\*\s*$/.test(l)).length;
  if (blockCount > 1) {
    problems.push(
      `dist/_headers declares ${blockCount} separate /* blocks. Cloudflare Pages starts a `
        + 'NEW block at each /* instead of merging them, so every block but the last is '
        + 'dropped. Put all headers under a single /* block.',
    );
  }

  // 1d. The hashes must match THIS build. A hash is a property of the emitted
  // bytes, not of the source: the bundler rewrites module boundaries and
  // Tailwind class names, so an edit anywhere upstream changes it. A stale hash
  // blocks the script with no build error at all, which is the failure mode
  // `npm run website:csp` exists to prevent.
  const html = existsSync(builtIndex)
    ? readFileSync(builtIndex, 'utf8')
    : '';

  if (html && csp) {
    const sha256 = (s) =>
      createHash('sha256').update(s, 'utf8').digest('base64');

    // Bodies only. A <script src> is a URL covered by the host allowlist and
    // needs no hash.
    const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)];
    const inlineStyles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)];

    const directive = (name) => {
      const m = new RegExp(`${name}[^;]*`).exec(csp);
      return m ? m[0] : '';
    };

    for (const [name, blocks] of [
      ['script-src', inlineScripts],
      ['style-src', inlineStyles],
    ]) {
      if (blocks.length === 0) continue;
      const declared = directive(name);
      for (const m of blocks) {
        const want = `'sha256-${sha256(m[1])}'`;
        if (!declared.includes(want)) {
          problems.push(
            `${name} does not authorise an inline block in this build. Expected `
              + `${want}. Run \`npm run website:csp\` to regenerate - the hash `
              + 'changes whenever the bundle does.',
          );
        }
      }
    }
  }

  // 1e. No style="" attribute and no on* handler anywhere in the built page.
  //
  // Neither can be covered by a hash or nonce without `unsafe-hashes`, which is
  // forbidden above, so either one is a guaranteed runtime violation. Four
  // `style="--bar-width: 45%"` attributes were exactly this: four "Applying
  // inline style violates ... style-src" errors, with the bars rendering at 0%
  // because var(--bar-width, 0%) fell through to its fallback.
  //
  // Comments are stripped first. Both the index.html comment explaining this
  // decision and the CSS above it legitimately mention `style="` in prose.
  if (html) {
    const stripped = html
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');

    const styleAttrs = [...stripped.matchAll(/<[a-zA-Z][^>]*\sstyle\s*=\s*"/g)];
    if (styleAttrs.length) {
      problems.push(
        `dist/index.html has ${styleAttrs.length} inline style="" attribute(s). A `
          + 'nonce cannot cover a style attribute and `unsafe-hashes` is forbidden, '
          + 'so each one is a live CSP violation. Use a CSS custom property set '
          + 'through the CSSOM instead - see #barBullet in styles/theme.css.',
      );
    }

    const handlers = [...stripped.matchAll(/<[a-zA-Z][^>]*\son[a-z]+\s*=\s*"/g)];
    if (handlers.length) {
      problems.push(
        `dist/index.html has ${handlers.length} inline event handler(s). They need `
          + "`unsafe-hashes`, which is forbidden. Attach them with addEventListener.",
      );
    }
  }
}

const builtFile = resolve(distDir, 'index.html');
if (!existsSync(builtFile)) {
  fail(['dist/index.html was not produced'], 'FAILED');
  process.exit(1);
}

const html = readFileSync(builtFile, 'utf8');

// 2. No forbidden references.
for (const { pattern, why } of FORBIDDEN) {
  const hit = pattern.exec(html);
  if (hit) {
    problems.push(`${why}: found ${JSON.stringify(hit[0].slice(0, 60))}`);
  }
}

// 3. Every external reference is on the allowlist.
//
// The rule exists to keep the shipped file self-contained: nothing may be
// fetched at runtime that we did not deliberately choose.
//
// `<link rel="canonical">` is NOT a fetch. It is a metadata declaration telling
// search engines which URL is authoritative; the browser never requests it.
// Adding one made this gate fail with "external reference not on the
// allowlist", which is a false positive - it treated a search-engine hint like
// a subresource.
//
// So non-fetching link relations are excluded. This list is deliberately
// narrow: stylesheet, preload, preconnect and prefetch DO cause a request, so
// they stay checked.
const NON_FETCHING_RELS = new Set(['canonical', 'alternate', 'author', 'license', 'next', 'prev']);

for (const m of html.matchAll(/<link\b[^>]*>/g)) {
  const rel = /rel\s*=\s*["']([^"']+)["']/i.exec(m[0])?.[1]?.toLowerCase();
  if (rel && NON_FETCHING_RELS.has(rel)) continue;
  const href = /href\s*=\s*["']([^"']+)["']/i.exec(m[0])?.[1];
  if (!href || !/^(?:https?:)?\/\//.test(href)) continue;
  if (!ALLOWED_EXTERNAL.some((a) => href.startsWith(a))) {
    problems.push(`external reference not on the allowlist: ${href}`);
  }
}

for (const m of html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)) {
  // Skip anything already handled above (a <link> with a fetching rel).
  if (html.slice(Math.max(0, m.index - 90), m.index + 6).includes('<link')) continue;
  const ref = m[1];
  if (/^(?:https?:)?\/\//.test(ref)) {
    if (!ALLOWED_EXTERNAL.some((a) => ref.startsWith(a))) {
      problems.push(`external reference not on the allowlist: ${ref}`);
    }
  } else if (!ref.startsWith('#')) {
    problems.push(`non-allowlisted local reference: ${ref}`);
  }
}

if (problems.length) {
  fail(problems, 'website self-containment FAILED');
  console.error('');
  process.exit(1);
}

const deployDir = readDeployOutputDir();
if (deployDir === null) {
  console.error(
    '\nwebsite deploy path   FAILED\n'
      + '  wrangler.toml has no pages_build_output_dir, so Cloudflare has no\n'
      + '  directory to publish. It must name the build output explicitly.\n',
  );
  process.exit(1);
}

if (deployDir !== 'apps/website/dist') {
  console.error(
    '\nwebsite deploy path   FAILED\n'
      + `  wrangler.toml publishes "${deployDir}"\n`
      + '  but the build writes apps/website/dist/\n'
      + '  Deploying this way publishes nothing and 404s with no error in the\n'
      + '  logs. Fix pages_build_output_dir in wrangler.toml.\n',
  );
  process.exit(1);
}

console.log(`website build   ok   single file, ${(html.length / 1024).toFixed(1)} KB,`);
console.log(`                    ${ALLOWED_EXTERNAL.length} allowlisted CDN references, no fetch()`);
console.log(`                    entry: ${builtIndexFile.slice(root.length + 1)}`);
console.log(`                    source: ${websiteSrcDir.slice(root.length + 1)}/index.html`);
console.log(`                    deploys: ${deployDir} (matches build output)`);