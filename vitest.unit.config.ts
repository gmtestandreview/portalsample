import path from 'node:path';
import type { CoverageOptions } from 'vitest/node';
import { defineConfig } from 'vitest/config';

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
        'ClientApp/src/components/App/**',
        'ClientApp/src/components/AriaComponents/main.tsx',
        'ClientApp/src/components/reactaria_components/**',
        'ClientApp/source-map-http-downloads/**',
        'ClientApp/src/**/*.test.{ts,tsx}',
        'ClientApp/src/**/*.spec.{ts,tsx}',
        'ClientApp/src/**/*.stories.{ts,tsx}',
        'ClientApp/src/**/*.docs.mdx',
        // React Aria evaluation surface, retained for assessment rather than shipped.
        // These are being evaluated to understand how they might work within the portal. They are
        // unreachable from the application: nothing outside the evaluation surface imports them,
        // directly or transitively. Unlike the block below they are NOT covered in Storybook
        // either, so this is an explicit decision to leave a spike unmeasured - not a claim that
        // the measurement lives elsewhere. If any of these is promoted into the portal it must
        // come off this list and be covered.
        'ClientApp/src/components/AriaComponents/ListBox.tsx',
        'ClientApp/src/components/AriaComponents/Menu.tsx',
        'ClientApp/src/components/AriaComponents/Table.tsx',
        'ClientApp/src/components/AriaComponents/Tree.tsx',
        'ClientApp/src/components/CommandPalette/CommandPalette.tsx',
        'ClientApp/src/components/GridLists/GridList.tsx',

        // React Aria evaluation surface, measured in Storybook instead of here.
        // These are Storybook-only spike components: they are reachable from stories, not from
        // index.tsx or App.tsx. Each entry below was verified at 100% statements, branches,
        // functions and lines in the Storybook coverage run before being listed, so it is still
        // measured - just by the runner that can actually drive it. Evaluation components NOT
        // verified there are deliberately absent, and stay in this denominator.
        // Guarded by tests/unit/config/coverageRemapPolicy.test.ts and mirrored into
        // sonar.coverage.exclusions by tests/unit/config/sonarCoverageContract.test.ts.
        'ClientApp/src/components/AriaComponents/RangeCalendar.tsx',
        'ClientApp/src/components/AriaComponents/Slider.tsx',
        'ClientApp/src/components/AriaComponents/Switch.tsx',
        'ClientApp/src/components/Breadcrumb/AriaBreadcrumb/Breadcrumbs.tsx',
        'ClientApp/src/components/Buttons/AriaButton/Button.tsx',
        'ClientApp/src/components/Calendar/Calendar.tsx',
        'ClientApp/src/components/ColorArea/ColorArea.tsx',
        'ClientApp/src/components/ColorField/ColorField.tsx',
        'ClientApp/src/components/ColorPicker/ColorPicker.tsx',
        'ClientApp/src/components/ColorSlider/ColorSlider.tsx',
        'ClientApp/src/components/ColorSwatch/ColorSwatch.tsx',
        'ClientApp/src/components/ColorSwatch/ColorSwatchPicker.tsx',
        'ClientApp/src/components/ColorThumb/ColorThumb.tsx',
        'ClientApp/src/components/ColorWheel/ColorWheel.tsx',
        'ClientApp/src/components/ComboBox/ComboBox.tsx',
        'ClientApp/src/components/Disclosure/Disclosure.tsx',
        'ClientApp/src/components/DisclosureGroup/DisclosureGroup.tsx',
        'ClientApp/src/components/DropZone/DropZone.tsx',
        'ClientApp/src/components/Inputs/AriaCheckbox/Checkbox.tsx',
        'ClientApp/src/components/Inputs/AriaCheckbox/CheckboxGroup.tsx',
        'ClientApp/src/components/Inputs/AriaDateField/DateField.tsx',
        'ClientApp/src/components/Inputs/AriaDatePicker/DatePicker.tsx',
        'ClientApp/src/components/Inputs/AriaDateRangePicker/DateRangePicker.tsx',
        'ClientApp/src/components/Inputs/AriaInputGroup/InputGroup.tsx',
        'ClientApp/src/components/forms/AriaForm/Form.tsx',
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
            '@': path.resolve(__dirname, 'ClientApp/src'),
        },
    },
    test: {
        name: 'unit',
        // Single run unless `--watch` is passed (see `test:unit:watch`).
        watch: false,
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
