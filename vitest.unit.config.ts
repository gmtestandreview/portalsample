import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CoverageOptions } from 'vitest/node';
import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const UNIT_TEST_TIMEOUT_MS = 30_000;

/**
 * Vitest 4 removed `coverage.all`. The explicit `include` below already brings
 * matching covered and uncovered files into the report, so no all-files sweep is
 * needed — and without it, Vite-transformed non-source assets such as
 * `terms-config.json?import` never reach the V8-to-istanbul remapper.
 */
const coverageConfig: CoverageOptions = {
  provider: 'v8',
  // `json` emits coverage-final.json, which retains the statement, function and
  // branch maps. `json-summary` carries only per-file totals, so Task A3's gap
  // queue could rank work but not locate it. Both are needed.
  // `lcov` is the only format SonarQube imports for TypeScript
  // (sonar.javascript.lcov.reportPaths in sonar-project.properties); without
  // it SonarCloud reports 0% coverage regardless of the real figure.
  reporter: ['text', 'html', 'json-summary', 'json', 'lcov'],
  // Vitest defaults this to false, which writes no coverage report at all when
  // any test fails - and it cleans the output directory first, so a red run
  // leaves nothing behind. The PR workflow uploads reports/coverage/unit/**
  // with `if: always()` and `if-no-files-found: error`, so a red unit run would
  // fail that upload with "no files found" and mask the real failure behind an
  // artifact error. Under the T1 exemption a red vitest-unit is the expected
  // state until Child Plan B1 lands, so coverage evidence has to survive it.
  reportOnFailure: true,
  reportsDirectory: './reports/coverage/unit',
  include: ['ClientApp/src/**/*.{ts,tsx}', 'vite.config.mts'],
  exclude: [
    '**/*.d.ts',
    // Untracked `.remember` plugin scratch files (e.g. tmp/last-ndc.ts) land
    // under ClientApp/src and match the include glob, but are tooling state,
    // not source, and can never be covered.
    '**/.remember/**',
    'ClientApp/src/api/web-api-client.ts',
    'ClientApp/src/external/**',
    'ClientApp/src/parent/**',
    'ClientApp/src/{storybook,testing}/**',
    'ClientApp/src/components/{App/**,AriaComponents/main.tsx,reactaria_components/**}',
    'ClientApp/source-map-http-downloads/**',
    'ClientApp/src/**/*.{test,spec,stories}.{ts,tsx}',
    'ClientApp/src/**/*.docs.mdx',
    'ClientApp/src/{analytics,authentication}/types.ts',
    'ClientApp/src/routes/{requestForQuote,quotation,acceptQuote}/types.ts',
    'ClientApp/src/components/{Accordion,Alert,Pagination,RouteLeavingGuard,SteppedNavigation,SummaryDisplay}/types.ts',
    'ClientApp/src/components/Inputs/{AddressLookup,AutoSuggest,Checkbox,DatePicker,RadioButton,RadioButtonGroup,SelectInput,TextAreaInput}/types.ts',
    'ClientApp/src/components/SearchFilter/{filterMenuProps,searchBoxProps}.ts',
    'ClientApp/src/components/forms/{types.ts,Details/types.ts,ErrorSummary/types.ts,FormBanner/types.ts,FormikForm/types.ts,HidableField/types.ts}',
    'ClientApp/src/components/tiles/StandardPathway/types.ts',
  ],
  thresholds: {
    statements: 100,
    branches: 100,
    functions: 100,
    lines: 100,
  },
};

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
      '@': path.resolve(dirname, 'ClientApp/src'),
    },
  },
  test: {
    name: 'unit',
    // Single run unless `--watch` is passed (see `test:unit:watch`).
    watch: false,
    environment: 'jsdom',
    pool: 'forks',
    execArgv: ['--max-old-space-size=8192'],
    maxWorkers: 2,
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // Keep snapshot output aligned with @vitest/pretty-format's documented
    // snapshot defaults while making the safety budget explicit.
    snapshotFormat: {
      escapeRegex: true,
      escapeString: false,
      maxOutputLength: 2 ** 27,
      printBasicPrototype: false,
      printFunctionName: false,
    },
    // Heavy route tests render full Formik/RHF trees under V8 coverage with
    // two workers; hosted runners exceed Vitest's 5s default on them.
    testTimeout: UNIT_TEST_TIMEOUT_MS,
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    css: false,
    coverage: coverageConfig,
  },
});
