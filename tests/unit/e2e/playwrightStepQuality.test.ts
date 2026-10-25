import fs from 'node:fs';

import path from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

const steps = fs.readFileSync(
  path.join(repoRoot, 'tests', 'e2e', 'steps', 'storybook.steps.ts'),
  'utf8',
);

const quoteSteps = fs.readFileSync(
  path.join(repoRoot, 'tests', 'e2e', 'steps', 'quote.steps.ts'),
  'utf8',
);

const accountMaintenanceSteps = fs.readFileSync(
  path.join(repoRoot, 'tests', 'e2e', 'steps', 'account-maintenance.steps.ts'),
  'utf8',
);

const commonSteps = fs.readFileSync(
  path.join(repoRoot, 'tests', 'e2e', 'steps', 'common.steps.ts'),
  'utf8',
);

const rfqLifecycleSteps = fs.readFileSync(
  path.join(repoRoot, 'tests', 'e2e', 'steps', 'rfq-lifecycle.steps.ts'),
  'utf8',
);

const reportSteps = fs.readFileSync(
  path.join(repoRoot, 'tests', 'e2e', 'steps', 'report.steps.ts'),
  'utf8',
);

const workflowErrorsFeature = fs.readFileSync(
  path.join(
    repoRoot,
    'tests',
    'e2e',
    'features',
    'resilience',
    'workflow-errors.feature',
  ),
  'utf8',
);

const mockApi = fs.readFileSync(
  path.join(repoRoot, 'tests', 'e2e', 'support', 'mock-api.ts'),
  'utf8',
);

const routeHandler = (routePattern: string) => {
  const marker = `'${routePattern}',`;
  const markerStart = mockApi.indexOf(marker);
  const start =
    markerStart === -1
      ? -1
      : mockApi.lastIndexOf('await page.route(', markerStart);
  const nextRoute = mockApi.indexOf(
    '\n    await page.route(',
    markerStart + marker.length,
  );
  const end = nextRoute === -1 ? mockApi.length : nextRoute;
  const handler = start === -1 ? undefined : mockApi.slice(start, end);

  expect(handler).toBeDefined();

  return handler ?? '';
};

const extractSection = (source: string, pattern: RegExp) =>
  pattern.exec(source)?.[0];

describe('storybook Playwright step quality', () => {
  it('does not use body-wide text assertions', () => {
    expect.assertions(1);
    expect(steps).not.toContain("page.locator('body')");
  });
});

describe('storybook Playwright step quality', () => {
  it('does not convert failed visibility checks into false', () => {
    expect.assertions(1);
    expect(steps).not.toMatch(/isVisible\(\)\.catch\(\(\) => false\)/);
  });
});

describe('storybook Playwright step quality', () => {
  it('does not branch on locator counts for optional assertions', () => {
    expect.assertions(1);
    expect(steps).not.toMatch(/if \(count > 0\)/);
  });
});
