import { expect } from '@playwright/test';
import { Given, Then, When } from '../support/fixtures';
import { buildMeasurementReport } from '../support/mock-builders';
import { failureKey } from '../support/mock-failure';

Given('instrument {string} has an issued report', async ({ scenarioState }, name: string) => {
    scenarioState.activeReferenceId = name;
});

When('the user opens the instrument report history', async ({ page, scenarioState }) => {
    await page.goto(`/instrument-reports/${encodeURIComponent(
        scenarioState.activeReferenceId!,
    )}`);
});

Then('the instrument report history is displayed', async ({ page }) => {
    await expect(page.getByRole('heading', {
        name: 'Measurement reports',
        exact: true,
    }).first()).toBeVisible();
    await expect(page.getByRole('table', {
        name: /Measurement reports history/i,
    })).toBeVisible();
});

When('the user follows the report link {string}', async ({ page }, name: string) => {
    await page.getByRole('link', { name, exact: true }).click();
});

Then('report {string} is displayed', async ({ page }, reportId: string) => {
    await expect(page).toHaveURL(/\/report\/RFQ-REPORT-0001$/);
    await expect(page.getByText(reportId, { exact: true })).toBeVisible();
});

Given('report {string} is available', async ({ scenarioState }, referenceId: string) => {
    scenarioState.activeReferenceId = referenceId;
    scenarioState.quotes.set(
        referenceId,
        buildMeasurementReport(referenceId),
    );
});

Given(
    'report PDF retrieval will fail with status {int}',
    async ({ scenarioState }, status: number) => {
        scenarioState.failures.set(
            failureKey('GET', '/api/dashboard/get-quote-report-pdf'),
            { status, once: false },
        );
    },
);

When('the user opens report {string}', async ({ page }, referenceId: string) => {
    await page.goto(`/report/${referenceId}`);
    await expect(page.getByRole('heading', {
        name: 'Report',
        exact: true,
    })).toBeVisible();
});

Then('the report file error notification is displayed', async ({ page }) => {
    await expect(page.getByRole('alert').filter({
        hasText: /unexpected error has occurred with downloading the PDF report/i,
    })).toBeVisible();
});
