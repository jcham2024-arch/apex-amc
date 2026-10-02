import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');

/**
 * Inline the emitted JavaScript and CSS into index.html.
 *
 * HANDOFF.md requires the shipped artefact to be SELF-CONTAINED: one file, no
 * separate .js/.css requests, and no runtime fetch of `data/`. A default Vite
 * build emits `dist/index.html` plus hashed assets, which breaks that rule.
 *
 * This is the standard single-file transform, written inline rather than pulled
 * in as `vite-plugin-singlefile` so the rule that enforces our handoff contract
 * lives in this repository, is reviewable, and needs no new dependency. It runs
 * in `generateBundle`, so it never writes an intermediate asset to disk.
 *
 * The regexes are deliberately conservative: they only touch script and link
 * tags that Vite itself generated (relative hashed paths under the configured
 * base), leaving the CDN <script>/<link> tags in <head> untouched.
 *
 * It also FAILS the build if cdn.tailwindcss.com reappears as a live reference.
 * That script is a runtime CSS compiler: it executes third-party JS on every
 * page load and requires `unsafe-eval` in any CSP, which would silently defeat
 * the policy in public/_headers. Removing it is what made a strict CSP possible.
 */
const FORBIDDEN_RUNTIME_COMPILER =
  /<script[^>]+src\s*=\s*["'][^"']*cdn\.tailwindcss\.com/i;

function inlineAssets() {
  return {
    name: 'inline-assets-for-self-contained-html',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const html = Object.values(bundle).find((f) => f.fileName.endsWith('.html'));
      if (!html || html.type !== 'asset') return;

      let source = html.source;

      // Match only a live <script src=...cdn.tailwindcss.com>, not prose.
      // Matching the bare hostname would also fire on the comment that explains
      // why the script must not come back - a gate that cries wolf gets ignored.
      if (FORBIDDEN_RUNTIME_COMPILER.test(source)) {
        throw new Error(
          'cdn.tailwindcss.com must not be loaded: it is a runtime CSS compiler, '
            + 'executes third-party JS on every page load, and forces `unsafe-eval` '
            + 'into the CSP in public/_headers.',
        );
      }

      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName === html.fileName) continue;

        // Replace <script src="./assets/x.js"> with an inline module script.
        const scriptTag = new RegExp(
          `<script([^>]*)\\ssrc="[^"]*${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"([^>]*)></script>`,
          'g',
        );
        if (chunk.type === 'chunk' && scriptTag.test(source)) {
          const attrs = chunk.isEntry ? ' type="module"' : '';
          source = source.replace(
            scriptTag,
            `<script${attrs}>\n${chunk.code}\n</script>`,
          );
          delete bundle[fileName];
        }

        // Replace <link rel="stylesheet" href="./assets/x.css"> with <style>.
        const styleTag = new RegExp(
          `<link[^>]*\\srel="stylesheet"[^>]*\\shref="[^"]*${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`,
          'g',
        );
        if (chunk.type === 'asset' && styleTag.test(source)) {
          source = source.replace(styleTag, `<style>\n${chunk.source}\n</style>`);
          delete bundle[fileName];
        }
      }

      html.source = source;
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), inlineAssets()],
  root: resolve(here, 'src'),
  publicDir: resolve(here, 'public'),
  base: './',
  resolve: {
    alias: {
      '@core': resolve(repoRoot, 'packages/ballistics-core/src'),
    },
  },
  build: {
    outDir: resolve(here, 'dist'),
    emptyOutDir: true,
    target: 'es2022',
    // Inline sources, not source maps: the map would double the payload and the
    // shipped file is a production artefact, not a debugging aid.
    sourcemap: false,
    assetsInlineLimit: 100_000_000,
    // The modulepreload polyfill injects a `fetch(o.href)` call. It is browser
    // feature detection, not app data, but HANDOFF.md's self-containment rule
    // is easier to audit when the shipped file contains no `fetch(` at all.
    // Safe to disable because this build emits a single inline script and has
    // no separate chunks to preload.
    modulePreload: { polyfill: false },
  },
});
