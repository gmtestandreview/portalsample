import { describe, expect, it } from 'vitest';

import config from '../../../vitest.unit.config';

const resolveConfig = async () => {
    return config.test;
};

describe('unit coverage configuration', () => {
    it('keeps coverage config under test so Vitest applies it', async () => {
        const testConfig = await resolveConfig();

        expect(testConfig?.coverage).toBeDefined();
        expect(testConfig?.coverage?.provider).toBe('v8');
        expect(testConfig?.coverage?.reporter).toEqual(['text', 'html', 'json-summary']);
        expect(testConfig?.coverage?.reportsDirectory).toBe('./reports/coverage/unit');
    });

    it('measures editable handwritten source and excludes generated/vendor artifacts', async () => {
        const testConfig = await resolveConfig();

        // Vitest 4 removed `coverage.all`; the explicit include below is what
        // brings uncovered files into the report. See
        // tests/unit/config/coverageRemapPolicy.test.ts for the remap policy.
        expect(testConfig?.coverage?.include).toEqual([
            'ClientApp/src/**/*.{ts,tsx}',
            'webpack.config.js',
        ]);
        expect(testConfig?.coverage?.exclude).toEqual(expect.arrayContaining([
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
        ]));
        expect(testConfig?.coverage?.exclude).not.toEqual(expect.arrayContaining([
            'ClientApp/src/**/types.ts',
            'ClientApp/src/**/*Props.ts',
            'ClientApp/src/components/Inputs/NumberInput/types.ts',
            'ClientApp/src/routes/account/addBranch/addBranchProps.ts',
        ]));
    });

    it('fails the unit coverage gate below 100 percent', async () => {
        const testConfig = await resolveConfig();

        expect(testConfig?.coverage?.thresholds).toEqual({
            statements: 100,
            branches: 100,
            functions: 100,
            lines: 100,
        });
    });
});
