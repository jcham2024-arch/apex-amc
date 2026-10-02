// One-time structural extraction: split the single-file website into
// index.html + css + ES modules.
//
// DESTRUCTIVE - AND NOW HARD-STOPPED BY DEFAULT
// ==============================================
// This script is NOT idempotent, despite the old header comment claiming it was.
// It reads `apps/website/index.html` and OVERWRITES six files in `src/`. Those
// files have since been hand-edited: `main.js` gained its ES module imports and
// its XSS hardening (replaceChildren instead of innerHTML), and
// `tailwind.config.js` gained a module export. Re-running this script silently
// strips all of that back out, leaving `main.js` referencing CALIBER_PRESETS,
// RETAILERS and CHECKLIST_ITEMS as undefined globals.
//
// That is not hypothetical. It happened on 2026-10-02 during a scripts audit:
// the script was run to check it worked, and it reverted committed work. It was
// caught only because `npm run lint` failed afterwards, reporting
// 'CALIBER_PRESETS' is not defined. Reverting further, it changed
// `replaceChildren` back to `innerHTML` - a real XSS regression in a file the
// AGENTS.md status table calls "XSS-hardened".
//
// It now REFUSES TO RUN unless --force is passed, and even then it prints what
// it is about to overwrite. The split it performs has long since been applied
// and the output committed, so there is no remaining reason to run it.
//
// WHY NOT JUST DELETE IT
// ---------------------
// The one-shot transforms (split-cartridge-specs, split-seeds-by-manufacturer)
// were listed in `docs/TODO.md` §4.2 as optional cleanup "idempotent and
// documented". This one is neither, so it does not qualify. It is neutralised
// instead of deleted, because rule 16 says do not delete a file you did not
// create without saying so - and deletion is the more permanent decision.
//
// (This comment pointed at a document and a section number. Both were wrong:
// `docs/TODO.md` was superseded by `docs/DATA-TODO.md`, and neither document
// carries a §4.2 about the one-shot transforms any more. Verified by
// `npm run modules:check`, which is what prompted the correction. A comment
// that points at nothing is worse than no comment, because it is trusted.)
//
// The transform's own value: it is the documented record of how the 229-row
// cartridge_specs monolith was split into rifle/pistol/shotgun. That work is
// done and committed. Running this again is not a no-op, it is a rewrite.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const root = process.cwd();
const site = resolve(root, 'apps/website');
const src = resolve(site, 'src');

if (!process.argv.includes('--force')) {
  console.error(
    'REFUSING TO RUN.\n\n' +
    '  This script OVERWRITES six hand-edited files in apps/website/src/ from\n' +
    '  apps/website/index.html. It is one-shot, not idempotent, and re-running it\n' +
    '  reverts the ES module imports and the XSS hardening in main.js.\n\n' +
    '  The split has already been applied and committed. There is no reason to\n' +
    '  run this. If you are certain, pass --force.',
  );
  process.exit(1);
}

console.warn('WARNING: --force passed. Overwriting apps/website/src/ from index.html.');
console.warn('         Check `git status apps/website` afterwards and revert if it differs.');

const html = readFileSync(resolve(site, 'index.html'), 'utf8');
const lines = html.split('\n');

// Locate structural boundaries by line content.
const find = (needle, from = 0) => {
  const i = lines.findIndex((l, n) => n >= from && l.includes(needle));
  if (i === -1) throw new Error(`not found: ${needle}`);
  return i;
};

const styleStart = find('<style>');
const styleEnd = find('</style>');
const tailScriptStart = find('<script>', styleEnd);
const tailScriptEnd = find('</script>', tailScriptStart);

const css = lines.slice(styleStart + 1, styleEnd).join('\n');
const tailJs = lines.slice(tailScriptStart + 1, tailScriptEnd).join('\n');

// The main script block also carries the Tailwind theme config; split it out.
const cfgStart = find('tailwind.config', 0);
const cfgEnd = find('</script>', cfgStart);
const tailwindCfg = lines.slice(cfgStart, cfgEnd).join('\n');

// Main application script is everything in the tail <script> except the
// leading dataset constants, which we relocate into data modules.
const dataStart = tailJs.indexOf('const CALIBER_PRESETS');
const dataEnd = tailJs.indexOf('// Mobile Drawer Elements');
if (dataStart === -1 || dataEnd === -1) throw new Error('dataset boundaries not found');

const calibers = tailJs.slice(
  tailJs.indexOf('const CALIBER_PRESETS'),
  tailJs.indexOf('// Retailer Directory Dataset'),
);
const retailers = tailJs.slice(
  tailJs.indexOf('const RETAILERS'),
  tailJs.indexOf('// Beginner Checklist Items'),
);
const checklist = tailJs.slice(
  tailJs.indexOf('const CHECKLIST_ITEMS'),
  tailJs.indexOf('// Mobile Drawer Elements'),
);
const appJs = tailJs.slice(dataEnd);

const w = (p, s) => {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, s.trimEnd() + '\n', 'utf8');
  console.log('wrote', p.replace(root + '\\', ''));
};

w(resolve(src, 'styles/theme.css'), `/* Extracted from the original single-file site. */\n${css}`);
w(resolve(src, 'tailwind.config.js'), tailwindCfg);
w(resolve(src, 'data/calibers.js'), `// Cost-per-round presets by caliber.\nexport ${calibers.replace(/^const CALIBER_PRESETS/, 'const CALIBER_PRESETS')}\nexport default CALIBER_PRESETS;`);
w(resolve(src, 'data/retailers.js'), `// Affiliate retailer directory.\nexport ${retailers}\nexport default RETAILERS;`);
w(resolve(src, 'data/checklist.js'), `// Beginner bench checklist.\nexport ${checklist}\nexport default CHECKLIST_ITEMS;`);
w(resolve(src, 'main.js'), appJs);

console.log('\nOK - data extracted, index.html left untouched for now.');
