import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { VITE_ENV_FIXTURES } from '../../../runtime-env-fixtures';
import { pathExists, readTextFileSync } from '../../helpers/safeTestFilesystem';

const repositoryRoot = path.resolve(import.meta.dirname, '../../..');
const readRepositoryFile = (relativePath: string): string =>
  readTextFileSync(path.join(repositoryRoot, relativePath), repositoryRoot);

const previewSetup = readRepositoryFile('.storybook/preview-setup.ts');
const browserSetup = readRepositoryFile('vitest.storybook.setup.ts');
const preview = readRepositoryFile('.storybook/preview.tsx');
const storybookMain = readRepositoryFile('.storybook/main.ts');
const pullRequestWorkflow = readRepositoryFile('.github/workflows/pr.yml');

type StorybookMswPolicy = {
  isStorybookMswDebugEnabled?: (query: string) => boolean;
};

describe('storybook runtime fixtures', () => {
  it('uses the shared Storybook fixture in both browser entry paths', () => {
    expect.hasAssertions();

    expect(previewSetup).toContain('VITE_ENV_FIXTURES.storybook');
    expect(browserSetup).toContain('VITE_ENV_FIXTURES.storybook');
    expect(VITE_ENV_FIXTURES.storybook).toMatchObject({
      VITE_APPINSIGHTS_INSTRUMENTATIONKEY: 'storybook-test-instrumentation-key',
      VITE_APPINSIGHTS_CONN_STRING: 'dummy-key',
      VITE_GA_TRACKINGID: 'storybook-test-ga-id',
    });
  });

  it('does not retain the legacy browser environment fixture names', () => {
    expect.hasAssertions();

    expect(previewSetup).not.toMatch(
      /REACT_APP_|(?<!VITE_)EXTERNAL_REDIRECT_URL/,
    );
    expect(browserSetup).not.toMatch(
      /REACT_APP_|(?<!VITE_)EXTERNAL_REDIRECT_URL/,
    );
  });

  it('disables Storybook telemetry in automated pull-request execution', () => {
    expect.hasAssertions();

    expect(pullRequestWorkflow).toContain("STORYBOOK_DISABLE_TELEMETRY: '1'");
  });
});

describe('storybook MSW diagnostic policy', () => {
  it('enables detailed MSW output only for the explicit debug query', async () => {
    expect.hasAssertions();

    const policySpecifier = path
      .join(repositoryRoot, '.storybook/msw-policy.ts')
      .replaceAll('\\', '/');
    const policy: StorybookMswPolicy = await import(
      /* @vite-ignore */ policySpecifier
    ).then(
      (module: unknown) => module as StorybookMswPolicy,
      (): StorybookMswPolicy => ({}),
    );

    expect(policy.isStorybookMswDebugEnabled).toBeTypeOf('function');
    expect(policy.isStorybookMswDebugEnabled?.('?msw-debug=true')).toBe(true);
    expect(policy.isStorybookMswDebugEnabled?.('?msw-debug=false')).toBe(false);
    expect(policy.isStorybookMswDebugEnabled?.('?other=true')).toBe(false);
  });

  it('passes query-gated quiet mode to the installed addon-v3 loader', () => {
    expect.hasAssertions();

    expect(preview).toContain('quiet: !isStorybookMswDebugEnabled');
    expect(previewSetup).not.toContain('quiet: false');
  });

  it('registers the CSF Next MSW addon independently of browser globals', () => {
    expect.hasAssertions();

    expect(preview).toMatch(/addonMsw\(getStorybookWorker\)/);
    expect(preview).not.toContain('navigator?.serviceWorker');
  });

  it('serves the generated MSW worker from Storybook static assets', () => {
    expect.hasAssertions();

    expect(storybookMain).toContain("staticDirs: ['../ClientApp/public']");
    expect(
      pathExists('ClientApp/public/mockServiceWorker.js', repositoryRoot),
    ).toBe(true);
  });
});
