import { describe, expect, it } from 'vitest';
import { auditCoverageReport } from '../../../scripts/audit-coverage-report';

const entry = (path: string): [string, { path: string }] => [path, { path }];

const repositoryRoot = 'C:/repo';

const cleanReport = Object.fromEntries([
    entry('C:/repo/ClientApp/src/components/Footer/index.tsx'),
    entry('C:/repo/ClientApp/src/utils/index.ts'),
    entry('C:/repo/ClientApp/src/env.ts'),
]);

describe('storybook coverage report audit', () => {
    it('passes a report containing only executable application source', () => {
        const audit = auditCoverageReport(cleanReport, 3, repositoryRoot);

        expect(audit.nonExecutableEntries).toEqual([]);
        expect(audit.executableEntryCount).toBe(3);
        expect(audit.verdict).toBe('clean');
    });

    it('names any non-executable asset that reached the remapper', () => {
        const report = Object.fromEntries([
            ...Object.entries(cleanReport),
            entry('C:/repo/ClientApp/src/terms-config.json?import'),
        ]);

        const audit = auditCoverageReport(report, 3, repositoryRoot);

        expect(audit.nonExecutableEntries).toEqual([
            'C:/repo/ClientApp/src/terms-config.json?import',
        ]);
        expect(audit.verdict).toBe('dirty');
    });

    it('fails when coverage has been gutted rather than narrowed', () => {
        // Excluding the JSON asset must not be achievable by excluding the
        // application source that imports it.
        const audit = auditCoverageReport(
            Object.fromEntries([entry('C:/repo/ClientApp/src/env.ts')]),
            3,
            repositoryRoot,
        );

        expect(audit.executableEntryCount).toBe(1);
        expect(audit.verdict).toBe('dirty');
    });

    it('does not count outside, generated, test, story, or Storybook-support entries', () => {
        const report = Object.fromEntries([
            ...Object.entries(cleanReport),
            entry('C:/outside-repository/src/unrelated.ts'),
            entry('C:/another-repository/ClientApp/src/unrelated.ts'),
            entry('C:/repo/ClientApp/src/api/web-api-client.ts'),
            entry('C:/repo/ClientApp/src/external/vendor.ts'),
            entry('C:/repo/ClientApp/src/components/Footer/index.test.tsx'),
            entry('C:/repo/ClientApp/src/components/Footer/index.stories.tsx'),
            entry('C:/repo/ClientApp/src/storybook/storybookFixtures.ts'),
        ]);

        const audit = auditCoverageReport(report, 4, repositoryRoot);

        expect(audit.executableEntryCount).toBe(3);
        expect(audit.verdict).toBe('dirty');
    });
});
