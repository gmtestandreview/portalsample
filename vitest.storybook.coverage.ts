import type { CoverageOptions } from 'vitest/node';

/**
 * Storybook coverage measures handwritten executable application source only.
 * Keeping JSON assets outside this boundary prevents V8 from attempting to
 * remap Vite's `?import` JSON module as JavaScript while retaining TS/TSX data.
 */
export const storybookCoverageConfig: CoverageOptions = {
    provider: 'v8',
    reportsDirectory: './reports/coverage/storybook',
    include: ['ClientApp/src/**/*.{ts,tsx}'],
    exclude: [
        '**/*.d.ts',
        'ClientApp/src/api/web-api-client.ts',
        'ClientApp/src/external/**',
        'ClientApp/src/parent/**',
        'ClientApp/src/storybook/**',
        'ClientApp/src/components/App/**',
        'ClientApp/src/components/AriaComponents/main.tsx',
        'ClientApp/src/components/reactaria_components/**',
        'ClientApp/source-map-http-downloads/**',
        'ClientApp/src/**/*.test.{ts,tsx}',
        'ClientApp/src/**/*.spec.{ts,tsx}',
        'ClientApp/src/**/*.stories.{ts,tsx}',
        'ClientApp/src/**/*.docs.mdx',
    ],
};
