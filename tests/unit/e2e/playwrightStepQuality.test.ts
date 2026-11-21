import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { readTextFileSync } from '../../helpers/safeTestFilesystem';

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const steps = readTextFileSync(
  path.join(repoRoot, 'tests', 'e2e', 'steps', 'storybook.steps.ts'),
  repoRoot,
);
const quoteSteps = readTextFileSync(
  path.join(repoRoot, 'tests', 'e2e', 'steps', 'quote.steps.ts'),
  repoRoot,
);
const accountMaintenanceSteps = readTextFileSync(
  path.join(repoRoot, 'tests', 'e2e', 'steps', 'account-maintenance.steps.ts'),
  repoRoot,
);
const commonSteps = readTextFileSync(
  path.join(repoRoot, 'tests', 'e2e', 'steps', 'common.steps.ts'),
  repoRoot,
);
const rfqLifecycleSteps = readTextFileSync(
  path.join(repoRoot, 'tests', 'e2e', 'steps', 'rfq-lifecycle.steps.ts'),
  repoRoot,
);
const reportSteps = readTextFileSync(
  path.join(repoRoot, 'tests', 'e2e', 'steps', 'report.steps.ts'),
  repoRoot,
);
const workflowErrorsFeature = readTextFileSync(
  path.join(
    repoRoot,
    'tests',
    'e2e',
    'features',
    'resilience',
    'workflow-errors.feature',
  ),
  repoRoot,
);
const mockApi = readTextFileSync(
  path.join(repoRoot, 'tests', 'e2e', 'support', 'mock-api.ts'),
  repoRoot,
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
    expect.hasAssertions();

    expect(steps).not.toContain("page.locator('body')");
  });

  it('does not convert failed visibility checks into false', () => {
    expect.hasAssertions();

    expect(steps).not.toMatch(/isVisible\(\)\.catch\(\(\) => false\)/);
  });

  it('does not branch on locator counts for optional assertions', () => {
    expect.hasAssertions();

    expect(steps).not.toMatch(/if \(count > 0\)/);
  });

  it('interacts with controls when completing quote wizard steps', () => {
    expect.hasAssertions();

    const completionSteps = extractSection(
      quoteSteps,
      /When\('the user completes[\s\S]+?(?=\nWhen\('the user accepts)/,
    );

    expect(completionSteps).toBeDefined();
    expect(completionSteps).toContain('.click()');
    expect(completionSteps).toContain('.fill(');
    expect(completionSteps).not.toContain('toBeChecked()');
  });

  it('waits for the RFQ route and form before treating a wizard step as ready', () => {
    expect.hasAssertions();

    const readinessHelper = extractSection(
      commonSteps,
      /const waitForRfqStep = async[\s\S]+?(?=\nGiven\()/,
    );
    const numericStepAssertion = extractSection(
      commonSteps,
      /Then\(\s*'the user should be on the RFQ wizard step \{int\}'[\s\S]+?(?=\nThen\()/,
    );

    expect(readinessHelper).toBeDefined();
    expect(numericStepAssertion).toBeDefined();
    expect(readinessHelper).toContain('toHaveURL');
    expect(readinessHelper).toContain("getByTestId('form')");
    expect(numericStepAssertion).toContain('waitForRfqStep(page, step)');
  });

  it('scopes success notifications to the alert role', () => {
    expect.hasAssertions();

    expect(accountMaintenanceSteps).toContain("getByRole('alert')");
  });

  it('opens an existing RFQ draft through its visible dashboard action', () => {
    expect.hasAssertions();

    const actionStep = extractSection(
      rfqLifecycleSteps,
      /When\('the user opens the draft RFQ'[\s\S]+?(?=\nWhen\()/,
    );

    expect(actionStep).toBeDefined();
    expect(actionStep).toContain("page.goto('/dashboard')");
    expect(actionStep).toMatch(/getByRole\('button', \{\s+name: 'Actions'/);
    expect(actionStep).toMatch(
      /getByRole\('menuitem', \{\s+name: 'Edit request'/,
    );
  });

  it('asserts the accessible measurement report history table', () => {
    expect.hasAssertions();

    expect(reportSteps).toMatch(
      /getByRole\('table', \{\s+name: \/Measurement reports history\/i/,
    );
  });

  it('attempts unsaved navigation with the visible discard action', () => {
    expect.hasAssertions();

    expect(workflowErrorsFeature).toContain(
      'And the user clicks "Discard changes"',
    );
  });

  it.each([
    '**/api/users/accept-terms',
    '**/api/quote/decline-quote**',
    '**/api/accept-quote/*/submit',
    '**/api/application',
    '**/api/application/*/copy',
    '**/api/request-for-quote/*/organisation-and-contact',
    '**/api/request-for-quote/*/instrument-and-request',
    '**/api/request-for-quote/*/submit',
    '**/api/forms/accounts/create-account/complete',
    '**/api/forms/accounts/branch-add/complete',
    '**/api/contact/save-contact',
    '**/api/dashboard/get-quote-report-pdf?**',
  ])('delegates configured failures for mutable handler %s', (routePattern) => {
    expect.hasAssertions();

    expect(routeHandler(routePattern)).toContain(
      'fulfillConfiguredFailure(route, state)',
    );
  });
});
