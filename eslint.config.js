// ESLint flat config.
//
// Scoping note: type-aware rules only run where a tsconfig covers the file.
// `packages/` has one; the website and the Expo app do not, so those blocks
// disable type checking rather than erroring. Ordering matters in flat config
// — later blocks override earlier ones — so the non-typed blocks come last.
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.expo/**',
      '**/.wrangler/**',
      'archive/**',
      // Single-file site; superseded by apps/website/src modules.
      'apps/website/index.html',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  // --- Everything outside `packages/` has no tsconfig coverage. -----------
  // Type-aware rules must be switched off for these paths, not per-block,
  // because `recommendedTypeChecked` applied them to all files above.
  {
    files: ['**/*.js', '**/*.jsx', '**/*.mjs', 'apps/ballistics/**/*.ts', 'apps/ballistics/**/*.tsx'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // --- Type-aware scope: packages/ (the shared domain library) -----------
  {
    files: ['packages/**/*.ts', 'packages/**/*.tsx'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-console': 'warn',
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true },
      ],
    },
  },

  // --- Tests: node:test's `test()` returns a promise the runner owns, so
  // no-floating-promises fires on every single case. Also allow non-null
  // assertions, which are idiomatic when indexing validated arrays.
  {
    files: ['packages/*/test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    },
  },

  // --- Repo scripts: plain Node ESM, no types ----------------------------
  // `scripts/**/*.ts` is here too: tsconfig.json only includes packages/**,
  // so nothing covers scripts/ and the type-aware rules inherited from
  // recommendedTypeChecked would fail with "rule requires type information".
  {
    files: ['scripts/**/*.mjs', 'scripts/**/*.ts', 'eslint.config.js'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      'no-console': 'off',
    },
  },

  // --- Website: browser ESM, plain JS ------------------------------------
  {
    files: ['apps/website/**/*.js'],
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      'no-unused-vars': 'warn',
      'prefer-const': 'warn',
    },
  },

  // --- Expo app: legacy JSX, not yet on the shared domain package --------
  {
    files: ['apps/ballistics/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // `require()` is deliberate in this app: the native-only Expo modules
      // (expo-sqlite, expo-file-system, expo-sharing) must not be bundled for
      // web targets, so they are loaded lazily behind a Platform check.
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      'no-unused-vars': 'warn',
      'no-undef': 'off',
      'no-console': 'off',
    },
  },
);

