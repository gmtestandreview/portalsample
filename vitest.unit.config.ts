import path from 'node:path';
import type { UserConfig } from 'vite';
import { defineConfig } from 'vitest/config';

type CoverageOptionsWithAll = NonNullable<NonNullable<UserConfig['test']>['coverage']> & {
    all: true;
};

const coverageConfig = {
    provider: 'v8',
    all: true,
    reporter: ['text', 'html', 'json-summary'],
    reportsDirectory: './reports/coverage/unit',
    include: [
        'ClientApp/src/**/*.{ts,tsx}',
        'webpack.config.js',
    ],
    exclude: [
        '**/*.d.ts',
        'ClientApp/src/api/web-api-client.ts',
        'ClientApp/src/external/**',
        'ClientApp/src/parent/**',
        'ClientApp/src/storybook/**',
        'ClientApp/source-map-http-downloads/**',
        'ClientApp/src/**/*.test.{ts,tsx}',
        'ClientApp/src/**/*.spec.{ts,tsx}',
        'ClientApp/src/**/*.stories.{ts,tsx}',
        'ClientApp/src/**/*.docs.mdx',
        'ClientApp/src/analytics/types.ts',
        'ClientApp/src/authentication/types.ts',
        'ClientApp/src/routes/requestForQuote/types.ts',
        'ClientApp/src/routes/quotation/types.ts',
        'ClientApp/src/routes/acceptQuote/types.ts',
        'ClientApp/src/components/Accordion/types.ts',
        'ClientApp/src/components/Alert/types.ts',
        'ClientApp/src/components/Inputs/AddressLookup/types.ts',
        'ClientApp/src/components/Inputs/AutoSuggest/types.ts',
        'ClientApp/src/components/Inputs/Checkbox/types.ts',
        'ClientApp/src/components/Inputs/DatePicker/types.ts',
        'ClientApp/src/components/Inputs/RadioButton/types.ts',
        'ClientApp/src/components/Inputs/RadioButtonGroup/types.ts',
        'ClientApp/src/components/Inputs/SelectInput/types.ts',
        'ClientApp/src/components/Inputs/TextAreaInput/types.ts',
        'ClientApp/src/components/Pagination/types.ts',
        'ClientApp/src/components/RouteLeavingGuard/types.ts',
        'ClientApp/src/components/SearchFilter/filterMenuProps.ts',
        'ClientApp/src/components/SearchFilter/searchBoxProps.ts',
        'ClientApp/src/components/SteppedNavigation/types.ts',
        'ClientApp/src/components/SummaryDisplay/types.ts',
        'ClientApp/src/components/forms/types.ts',
        'ClientApp/src/components/forms/Details/types.ts',
        'ClientApp/src/components/forms/ErrorSummary/types.ts',
        'ClientApp/src/components/forms/FormBanner/types.ts',
        'ClientApp/src/components/forms/FormikForm/types.ts',
        'ClientApp/src/components/forms/HidableField/types.ts',
        'ClientApp/src/components/tiles/StandardPathway/types.ts',
    ],
    thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
    },
} as CoverageOptionsWithAll;

/**
 * Vitest config for running unit tests only (no Storybook stories).
 *
 * Usage:
 *   npm run test:unit          (single run)
 *   npm run test:unit:watch    (watch mode)
 *   npm run test:unit:coverage (with coverage)
 */
export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'ClientApp/src'),
        },
    },
    test: {
        name: 'unit',
        environment: 'jsdom',
        pool: 'forks',
        execArgv: ['--max-old-space-size=8192'],
        maxWorkers: 1,
        globals: true,
        setupFiles: ['./vitest.setup.ts'],
        include: ['tests/unit/**/*.test.{ts,tsx}'],
        css: false,
        coverage: coverageConfig,
    },
});
