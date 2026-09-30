import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');

// The website is a static-first app deployed to Cloudflare Pages.
// Relative base so it works from any preview path.
export default defineConfig({
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
    sourcemap: true,
  },
});
