/**
 * Tailwind theme extension.
 *
 * This is the configuration object only. It is consumed two ways:
 *   - at runtime by the CDN `tailwind` global when index.html is served as a
 *     single file (the current deployable)
 *   - by a future Vite/Tailwind build, which imports `theme` directly
 *
 * Kept as a named export so the build path does not depend on a global.
 */
export const theme = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                tactical: {
                    950: '#090d16',
                    900: '#0f172a',
                    850: '#152035',
                    800: '#1e293b',
                    700: '#334155',
                    600: '#475569',
                },
                emerald: {
                    400: '#34d399',
                    500: '#10b981',
                    600: '#059669',
                },
                amber: {
                    400: '#fbbf24',
                    500: '#f59e0b',
                },
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
};

// Assign to the CDN global when one is present. Guarded so this module can be
// imported by the Node-side build without touching `window`.
if (typeof globalThis.tailwind === 'object') {
    globalThis.tailwind.config = theme;
}

