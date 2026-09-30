// One-time structural extraction: split the single-file website into
// index.html + css + ES modules. Idempotent - run from repo root.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const root = process.cwd();
const site = resolve(root, 'apps/website');
const src = resolve(site, 'src');

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
