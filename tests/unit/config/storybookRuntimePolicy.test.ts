import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = path.resolve(import.meta.dirname, '../../..');
const readRepositoryFile = (relativePath: string): string => readFileSync(path.join(repositoryRoot, relativePath), 'utf8');

const previewSetup = readRepositoryFile('.storybook/preview-setup.ts');
const browserSetup = readRepositoryFile('vitest.storybook.setup.ts');
const preview = readRepositoryFile('.storybook/preview.ts');
const pullRequestWorkflow = readRepositoryFile('.github/workflows/pr.yml');

const runtimeFixtureValue = (source: string, key: string): string | undefined =>
    new RegExp(`${key}\\s*:\\s*['"]([^'"]*)['"]`).exec(source)?.[1];

const requiredTelemetryFixtures = {
    REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY: 'storybook-test-instrumentation-key',
    REACT_APP_APPINSIGHTS_CONN_STRING: 'dummy-key',
    REACT_APP_GA_TRACKINGID: 'storybook-test-ga-id',
} as const;

describe('Storybook runtime fixtures', () => {
    it.each(Object.entries(requiredTelemetryFixtures))(
        'supplies the non-empty %s fixture in both browser entry paths',
        (key, expectedValue) => {
            expect(runtimeFixtureValue(previewSetup, key)).toBe(expectedValue);
            expect(runtimeFixtureValue(browserSetup, key)).toBe(expectedValue);
        },
    );

    it('disables Storybook telemetry in automated pull-request execution', () => {
        expect(pullRequestWorkflow).toContain("STORYBOOK_DISABLE_TELEMETRY: '1'");
    });
});

describe('Storybook MSW diagnostic policy', () => {
    it('enables detailed MSW output only for the explicit debug query', async () => {
        const policySpecifier = path.join(repositoryRoot, '.storybook/msw-policy.ts').replaceAll('\\', '/');
        const policy = await import(/* @vite-ignore */ policySpecifier).catch(() => ({ isStorybookMswDebugEnabled: undefined }));

        expect(policy.isStorybookMswDebugEnabled).toBeTypeOf('function');
        expect(policy.isStorybookMswDebugEnabled?.('?msw-debug=true')).toBe(true);
        expect(policy.isStorybookMswDebugEnabled?.('?msw-debug=false')).toBe(false);
        expect(policy.isStorybookMswDebugEnabled?.('?other=true')).toBe(false);
    });

    it('passes query-gated quiet mode to the installed addon-v3 loader', () => {
        expect(preview).toContain('quiet: !isStorybookMswDebugEnabled');
        expect(previewSetup).not.toContain('quiet: false');
    });
});
