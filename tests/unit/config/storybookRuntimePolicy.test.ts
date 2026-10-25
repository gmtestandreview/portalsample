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
  key: string,
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
      expect.assertions(2);
      expect(runtimeFixtureValue(previewSetup, key)).toBe(expectedValue);
      expect(runtimeFixtureValue(browserSetup, key)).toBe(expectedValue);
    },
  );
});

describe('storybook runtime fixtures', () => {
  it('does not retain the legacy browser environment fixture names', () => {
    expect.assertions(2);
    expect(previewSetup).not.toMatch(
      /REACT_APP_|(?<!VITE_)EXTERNAL_REDIRECT_URL/,
    );
    expect(browserSetup).not.toMatch(
      /REACT_APP_|(?<!VITE_)EXTERNAL_REDIRECT_URL/,
    );
  });
});

describe('storybook runtime fixtures', () => {
  it('disables Storybook telemetry in automated pull-request execution', () => {
    expect.assertions(1);
    expect(pullRequestWorkflow).toContain("STORYBOOK_DISABLE_TELEMETRY: '1'");
  });
});
