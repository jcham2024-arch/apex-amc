// Loads the built site in a real browser and fails on any CSP violation.
//
//   npm run website:build && node scripts/tests/check-csp-in-browser.mjs
//
// WHY THIS EXISTS
// ---------------
// Every other check here is static analysis. On 1 Oct 2026 that was not enough:
// `_headers` shipped `script-src 'nonce-{RANDOM}'`, an INVALID CSP source. Chrome
// discarded the whole source list and blocked the inline script, so the page
// rendered unstyled with roughly a third of its content missing.
//
// The static gate was green throughout. The header did contain a
// Content-Security-Policy directive and no `unsafe-*` keyword - by every measure
// the gate checked, it was a correct policy. It was a policy that renders nothing.
//
// So this observes behaviour instead of intent: it serves the SHIPPED dist/ under
// the SHIPPED dist/_headers and reads what the browser actually did.
//
// DELIBERATE NON-GOALS
// --------------------
// Layout, contrast and a11y are different questions needing different tools;
// folding them in would make one failure obscure the others.
//
// It skips LOUDLY when no browser is found. A silently-passing security check
// is worse than none, so the skip goes to stderr, is visible in the CI log, and
// exits 2. It never converts a missing browser into a pass.

import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { root } from '../shared/data.mjs';

const DIST = resolve(root, 'apps/website/dist');
const INDEX = resolve(DIST, 'index.html');
const HEADERS_FILE = resolve(DIST, '_headers');

if (!existsSync(INDEX)) {
  console.error('dist/index.html is missing. Run `npm run website:build` first.');
  process.exit(1);
}

/** Candidate browsers, in preference order. PATH wins over a guessed path. */
async function findBrowser() {
  const candidates =
    process.platform === 'win32'
      ? [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        ]
      : process.platform === 'darwin'
        ? [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
          ]
        : [
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable',
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
            '/snap/bin/chromium',
            '/usr/bin/microsoft-edge',
          ];

  // A binary on PATH wins over a guessed install path.
  //
  // `where`/`which` are run through spawn rather than execFileSync for the same
  // reason Chrome is: the synchronous piped-stdio path is unreliable on Windows,
  // and this lookup runs before anything else.
  const finder = process.platform === 'win32' ? 'where' : 'which';

  const run = (cmd, args) =>
    new Promise((resolve) => {
      const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'ignore'] });
      let out = '';
      child.stdout.on('data', (d) => {
        out += d;
      });
      // A non-zero exit is the normal case: the binary simply is not on PATH.
      child.on('error', () => resolve(null));
      child.on('close', () => resolve(out.split(/\r?\n/)[0]?.trim() || null));
    });

  for (const name of ['google-chrome', 'chromium', 'chromium-browser', 'microsoft-edge']) {
    const onPath = await run(finder, [name]);
    if (onPath) return onPath;
  }

  return candidates.find((p) => existsSync(p)) ?? null;
}

const browser = await findBrowser();
if (!browser) {
  console.error(
    '\nSKIPPED: no Chrome or Chromium found.\n'
      + 'This check did NOT pass. It did not run.\n'
      + 'CSP enforcement is browser behaviour and cannot be verified statically.\n',
  );
  process.exit(2);
}
/**
 * Parse the shipped `_headers` the way Cloudflare Pages does: `/*` opens a
 * block, indented `Name: value` lines follow, and a folded value continues on
 * the next line. `#` starts a comment.
 */
function parseHeaders(text) {
  const out = {};
  let inBlock = false;
  let key = null;

  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!inBlock) {
      if (t === '/*') inBlock = true;
      continue;
    }
    if (!t) continue;
    const m = /^([A-Za-z0-9-]+):\s*(.*)$/.exec(t);
    if (m) {
      key = m[1];
      out[key] = m[2];
      continue;
    }
    // A folded continuation. A bare `/*` starts the NEXT block rather than
    // joining this one - getting that wrong produced a phantom
    // `upgrade-insecure-requests /*` directive in an earlier version of this.
    if (key && t !== '/*') out[key] = `${out[key]} ${t}`.trim();
    else if (t === '/*') key = null;
  }
  return out;
}

const headers = parseHeaders(readFileSync(HEADERS_FILE, 'utf8'));
if (!headers['Content-Security-Policy']) {
  console.error('dist/_headers has no Content-Security-Policy. Cannot test enforcement.');
  process.exit(1);
}

/**
 * How long to allow before declaring the browser unable to answer.
 *
 * A served page settles in about a second. 25s is generous headroom for a cold
 * CI runner fetching two external stylesheets, and short enough that a genuine
 * failure is reported promptly rather than after a minute of silence.
 */
const TIMEOUT_MS = 25_000;
const server = createServer((req, res) => {
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  const path = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(readFileSync(join(DIST, path)));
  } catch {
    res.statusCode = 404;
    res.end('not found');
  }
});

// Port 0 lets the OS pick a free port, so parallel runs cannot collide.
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const { port } = server.address();
const url = `http://127.0.0.1:${port}/`;

/**
 * Proof that the inline script actually executed.
 *
 * The first version of this check looked for the text "Component Cost
 * Breakdown" in the dumped DOM. That string is in the STATIC markup, so it was
 * present whether or not the script ran, and the check passed against a policy
 * that blocked everything. A negative test on 2 Oct 2026 caught it: restoring
 * `nonce-{RANDOM}` still exited 0.
 *
 * What is used instead is a structural difference the script is responsible for
 * creating: `#retailerGrid` ships as an empty container and main.js appends a
 * card per retailer. Measured both ways against the same build:
 *
 *   hashes correct -> DOM 111,157 bytes, 4+ elements inside #retailerGrid
 *   nonce blocked  -> DOM  96,220 bytes, 0 elements inside #retailerGrid
 *
 * The ~15 KB difference is the rendered retailer directory. No amount of static
 * markup can produce it.
 */
const PROOF_CONTAINER = 'id="retailerGrid"';

/** Elements main.js appends into the proof container. */
const PROOF_CHILD = /<(?:a|h3|div)\s/g;

/**
 * Count the rendered children of the proof container in a dumped DOM.
 * @returns {number} 0 when the container is absent or was never populated.
 */
function countRenderedChildren(dom) {
  const start = dom.indexOf(PROOF_CONTAINER);
  if (start === -1) return 0;

  // Walk to the end of that element by counting div nesting from the container.
  const from = dom.indexOf('>', start) + 1;
  if (from <= 0) return 0;

  let depth = 1;
  let i = from;
  while (i < dom.length && depth > 0) {
    if (dom.startsWith('<div', i)) depth += 1;
    else if (dom.startsWith('</div>', i)) depth -= 1;
    i += 1;
  }

  return (dom.slice(from, i).match(PROOF_CHILD) ?? []).length;
}

/**
 * Run Chrome with `spawn` and collect stdout/stderr.
 *
 * `execFileSync` with piped stdio is what this used to call, and it is what
 * made the whole check unreliable on Windows: it blocked until its own timeout
 * and then threw, even though Chrome had already written a complete DOM.
 * Measured directly - `spawn` returns the same 111 KB DOM in ~1s, while
 * `execFileSync` with identical arguments and a served page hangs to the
 * timeout. There is no output difference to explain it; it is the sync
 * pipe-handling path on this platform.
 *
 * `spawn` is also what makes the timeout honest: `kill()` ends the process
 * immediately instead of waiting for a sync call to unwind.
 */
function runChrome(args, timeoutMs) {
  return new Promise((resolve) => {
    const child = spawn(browser, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let out = '';
    let err = '';
    let settled = false;

    child.stdout.on('data', (d) => {
      out += d;
    });
    child.stderr.on('data', (d) => {
      err += d;
    });

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill();
      resolve({ out, err, timedOut: true });
    }, timeoutMs);

    child.on('error', (e) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ out, err: `${err}\n${e.message}`, timedOut: false });
    });

    child.on('close', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      // Chrome exits non-zero for reasons unrelated to the policy - an update
      // check, a crash reporter - so the exit code is ignored and the captured
      // DOM and stderr are what the assertions below actually read.
      resolve({ out, err, timedOut: false });
    });
  });
}

const result = await runChrome(
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-component-update',
    '--disable-sync',
    '--disable-extensions',
    '--disable-default-apps',
    // Must exceed the time the page needs to fetch its external stylesheets
    // from cdnjs and Google Fonts. Measured at ~1s end to end on a warm
    // connection; 6s is headroom without letting a genuinely broken page burn
    // the whole budget.
    //
    // NOTE: do NOT add `--disable-background-networking` here. It was added on
    // 1 Oct 2026 as "offline hardening" and blocked the two stylesheets the page
    // legitimately loads, so Chrome never settled.
    '--virtual-time-budget=6000',
    '--dump-dom',
    url,
  ],
  TIMEOUT_MS,
);

// Destructured in one statement so the names exist exactly once. Assigning to
// three `let` bindings that are only written here was flagged as useless
// assignments, which is the rule being satisfied rather than silenced.
const { out: dom, err: stderr, timedOut } = result;

// `close()` alone only stops NEW connections; it waits for existing ones to
// drain, and Chrome holds keep-alive sockets open after `--dump-dom` returns.
// `closeAllConnections()` (Node 18.2+) is what actually ends them.
server.closeAllConnections?.();
server.close();

// A hung browser has told us nothing. Calling that a CSP failure would be a
// false alarm that trains people to ignore this step, so it is reported as a
// skip - loudly, and with a non-zero exit so CI shows it was never verified.
if (timedOut && dom.length === 0) {
  console.error(
    `\nSKIPPED: the browser did not return a document within ${TIMEOUT_MS / 1000}s.\n`
      + 'This check did NOT pass. It did not run to completion.\n'
      + `  browser: ${browser}\n`
      + 'Run it manually in a real browser, or rely on the CI runner.\n',
  );
  process.exit(2);
}

const problems = [];

const rendered = countRenderedChildren(dom);
if (rendered === 0) {
  problems.push(
    `the inline script did not execute - #retailerGrid has no rendered children `
      + `(expected several). The DOM was ${dom.length} bytes. This is what a `
      + 'blocked script-src looks like.',
  );
}

const cspErrors = [
  ...new Set(
    (stderr.match(/^.*(Content Security Policy|Refused to|violates the following).*$/gm) ?? [])
      .map((l) => l.trim().slice(0, 160)),
  ),
];
for (const e of cspErrors) problems.push(`CSP violation reported by the browser:\n     ${e}`);

if (problems.length) {
  console.error(`\ncsp browser check   FAILED   (${url})`);
  for (const p of problems) console.error(`  x ${p}`);
  console.error('');
  process.exit(1);
}

console.log(`csp browser check   ok   no violations, script executed (${url})`);
process.exit(0);