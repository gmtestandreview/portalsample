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
    path.join(repoRoot, 'tests', 'e2e', 'features', 'resilience', 'workflow-errors.feature'),
    'utf8',
);
const mockApi = fs.readFileSync(
    path.join(repoRoot, 'tests', 'e2e', 'support', 'mock-api.ts'),
    'utf8',
);

const routeHandler = (routePattern: string) => {
    const start = mockApi.indexOf(`await page.route('${routePattern}'`);
    const end = mockApi.indexOf('\n    await page.route(', start + 1);

    expect(start).toBeGreaterThanOrEqual(0);
    return mockApi.slice(start, end === -1 ? undefined : end);
};

const extractSection = (source: string, pattern: RegExp) => pattern.exec(source)?.[0];

describe('Storybook Playwright step quality', () => {
    it('does not use body-wide text assertions', () => {
        expect(steps).not.toContain("page.locator('body')");
    });

    it('does not convert failed visibility checks into false', () => {
        expect(steps).not.toMatch(/isVisible\(\)\.catch\(\(\) => false\)/);
    });

    it('does not branch on locator counts for optional assertions', () => {
        expect(steps).not.toMatch(/if \(count > 0\)/);
    });

    it('interacts with controls when completing quote wizard steps', () => {
        const completionSteps = extractSection(
            quoteSteps,
            /When\('the user completes[\s\S]+?(?=\nWhen\('the user accepts)/,
        );

        expect(completionSteps).toBeTruthy();
        expect(completionSteps).toContain('.click()');
        expect(completionSteps).toContain('.fill(');
        expect(completionSteps).not.toContain('toBeChecked()');
    });

    it('waits for the RFQ route and form before treating a wizard step as ready', () => {
        const readinessHelper = extractSection(
            commonSteps,
            /const waitForRfqStep = async[\s\S]+?(?=\nGiven\()/,
        );
        const numericStepAssertion = extractSection(
            commonSteps,
            /Then\('the user should be on the RFQ wizard step \{int\}'[\s\S]+?(?=\nThen\()/,
        );

        expect(readinessHelper).toBeTruthy();
        expect(numericStepAssertion).toBeTruthy();
        expect(readinessHelper).toContain('toHaveURL');
        expect(readinessHelper).toContain("getByTestId('form')");
        expect(numericStepAssertion).toContain('waitForRfqStep(page, step)');
    });

    it('scopes success notifications to the alert role', () => {
        expect(accountMaintenanceSteps).toContain("getByRole('alert')");
    });

    it('opens an existing RFQ draft through its visible dashboard action', () => {
        const actionStep = extractSection(
            rfqLifecycleSteps,
            /When\('the user opens the draft RFQ'[\s\S]+?(?=\nWhen\()/,
        );

        expect(actionStep).toBeTruthy();
        expect(actionStep).toContain("page.goto('/dashboard')");
        expect(actionStep).toMatch(
            /getByRole\('button', \{\s+name: 'Actions'/,
        );
        expect(actionStep).toMatch(
            /getByRole\('link', \{\s+name: 'Edit request'/,
        );
    });

    it('asserts the accessible measurement report history table', () => {
        expect(reportSteps).toMatch(
            /getByRole\('table', \{\s+name: \/Measurement reports history\/i/,
        );
    });

    it('attempts unsaved navigation with the visible discard action', () => {
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
        expect(routeHandler(routePattern)).toContain(
            'fulfillConfiguredFailure(route, state)',
        );
    });
});
