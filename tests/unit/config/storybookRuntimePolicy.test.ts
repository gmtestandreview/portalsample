import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { storybookVitestRuntimePlugin } from '../../../vitest.storybook.runtime';
import {
  makeDirectorySync,
  pathExists,
  readDirectorySync,
  readTextFileSync,
} from '../../helpers/safeTestFilesystem';

const repositoryRoot = path.resolve(import.meta.dirname, '../../..');
const readRepositoryFile = (relativePath: string): string =>
  readTextFileSync(path.join(repositoryRoot, relativePath), repositoryRoot);

const previewSetup = readRepositoryFile('.storybook/preview-setup.ts');
const browserSetup = readRepositoryFile('vitest.storybook.setup.ts');
const preview = readRepositoryFile('.storybook/preview.ts');
const storybookMain = readRepositoryFile('.storybook/main.ts');
const pullRequestWorkflow = readRepositoryFile('.github/workflows/pr.yml');

const runtimeFixtureValue = (
  source: string,
  key: string
): string | undefined => {
  const line = source
    .split(/\r?\n/)
    .find((candidate) => candidate.trimStart().startsWith(`${key}:`));
  if (line === undefined) return undefined;

  const value = line.slice(line.indexOf(':') + 1).trim();
  return value.endsWith(',') ? value.slice(1, -2) : value.slice(1, -1);
};

const requiredTelemetryFixtures = {
  VITE_APPINSIGHTS_INSTRUMENTATIONKEY: 'storybook-test-instrumentation-key',
  VITE_APPINSIGHTS_CONN_STRING: 'dummy-key',
  VITE_GA_TRACKINGID: 'storybook-test-ga-id',
} as const;

describe('storybook runtime fixtures', () => {
  it.each(Object.entries(requiredTelemetryFixtures))(
    'supplies the non-empty %s fixture in both browser entry paths',
    (key, expectedValue) => {
      expect(runtimeFixtureValue(previewSetup, key)).toBe(expectedValue);
      expect(runtimeFixtureValue(browserSetup, key)).toBe(expectedValue);
    }
  );

  it('does not retain the legacy browser environment fixture names', () => {
    expect(previewSetup).not.toMatch(
      /REACT_APP_|(?<!VITE_)EXTERNAL_REDIRECT_URL/
    );
    expect(browserSetup).not.toMatch(
      /REACT_APP_|(?<!VITE_)EXTERNAL_REDIRECT_URL/
    );
  });

  it('disables Storybook telemetry in automated pull-request execution', () => {
    expect(pullRequestWorkflow).toContain("STORYBOOK_DISABLE_TELEMETRY: '1'");
  });
});

describe('storybook MSW diagnostic policy', () => {
  it('enables detailed MSW output only for the explicit debug query', async () => {
    const policySpecifier = path
      .join(repositoryRoot, '.storybook/msw-policy.ts')
      .replaceAll('\\', '/');
    const policy = await import(/* @vite-ignore */ policySpecifier).catch(
      () => ({ isStorybookMswDebugEnabled: undefined })
    );

    expect(policy.isStorybookMswDebugEnabled).toBeTypeOf('function');
    expect(policy.isStorybookMswDebugEnabled?.('?msw-debug=true')).toBe(true);
    expect(policy.isStorybookMswDebugEnabled?.('?msw-debug=false')).toBe(false);
    expect(policy.isStorybookMswDebugEnabled?.('?other=true')).toBe(false);
  });

  it('passes query-gated quiet mode to the installed addon-v3 loader', () => {
    expect(preview).toContain('quiet: !isStorybookMswDebugEnabled');
    expect(previewSetup).not.toContain('quiet: false');
  });

  it('registers the CSF Next MSW addon independently of browser globals', () => {
    expect(preview).toMatch(/addonMsw\(getStorybookWorker\)/);
    expect(preview).not.toContain('navigator?.serviceWorker');
  });

  it('serves the generated MSW worker from Storybook static assets', () => {
    expect(storybookMain).toContain("staticDirs: ['../ClientApp/public']");
    expect(
      pathExists('ClientApp/public/mockServiceWorker.js', repositoryRoot),
    ).toBe(true);
  });
});

describe('storybook closure child diagnostics', () => {
  type RuntimeVitest = Parameters<
    typeof storybookVitestRuntimePlugin.configureVitest
  >[0]['vitest'];

  const createVitestFixture = () =>
    ({
      config: { coverage: { exclude: [] as string[] } },
      standalone: async () => undefined,
      init: async () => undefined,
    }) as unknown as RuntimeVitest;

  it('does not write diagnostic files unless both closure values are supplied', () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'storybook-runtime-'));
    const receiptRoot = path.join(
      tempRoot,
      'reports',
      'storybook-coverage',
      'closure-run'
    );
    makeDirectorySync(receiptRoot, tempRoot);
    const previousReceiptRoot = process.env['STORYBOOK_CLOSURE_RECEIPTS'];
    const previousFreezeId = process.env['STORYBOOK_CLOSURE_FREEZE_ID'];

    try {
      delete process.env['STORYBOOK_CLOSURE_RECEIPTS'];
      delete process.env['STORYBOOK_CLOSURE_FREEZE_ID'];
      storybookVitestRuntimePlugin.configureVitest({
        vitest: createVitestFixture(),
      });

      expect(readDirectorySync(receiptRoot, tempRoot)).toEqual([]);
    } finally {
      if (previousReceiptRoot === undefined) {
        delete process.env['STORYBOOK_CLOSURE_RECEIPTS'];
      } else {
        process.env['STORYBOOK_CLOSURE_RECEIPTS'] = previousReceiptRoot;
      }
      if (previousFreezeId === undefined) {
        delete process.env['STORYBOOK_CLOSURE_FREEZE_ID'];
      } else {
        process.env['STORYBOOK_CLOSURE_FREEZE_ID'] = previousFreezeId;
      }
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('writes a redacted child record to the validated receipt directory', () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'storybook-runtime-'));
    const receiptRoot = path.join(
      tempRoot,
      'reports',
      'storybook-coverage',
      'closure-run'
    );
    makeDirectorySync(receiptRoot, tempRoot);
    const previousReceiptRoot = process.env['STORYBOOK_CLOSURE_RECEIPTS'];
    const previousFreezeId = process.env['STORYBOOK_CLOSURE_FREEZE_ID'];
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tempRoot);

    try {
      process.env['STORYBOOK_CLOSURE_RECEIPTS'] = receiptRoot;
      process.env['STORYBOOK_CLOSURE_FREEZE_ID'] = 'freeze-1';
      storybookVitestRuntimePlugin.configureVitest({
        vitest: createVitestFixture(),
      });
      const files = readDirectorySync(receiptRoot, tempRoot);

      expect(files).toHaveLength(1);

      const record = JSON.parse(
        readTextFileSync(path.join(receiptRoot, files[0]!.name), tempRoot)
      ) as Record<string, unknown>;

      expect(record).toMatchObject({
        freezeId: 'freeze-1',
        pid: process.pid,
        ppid: process.ppid,
        cwd: process.cwd(),
      });
      expect(record).not.toHaveProperty('env');
    } finally {
      cwdSpy.mockRestore();
      if (previousReceiptRoot === undefined) {
        delete process.env['STORYBOOK_CLOSURE_RECEIPTS'];
      } else {
        process.env['STORYBOOK_CLOSURE_RECEIPTS'] = previousReceiptRoot;
      }
      if (previousFreezeId === undefined) {
        delete process.env['STORYBOOK_CLOSURE_FREEZE_ID'];
      } else {
        process.env['STORYBOOK_CLOSURE_FREEZE_ID'] = previousFreezeId;
      }
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
