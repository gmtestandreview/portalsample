import { expect } from '@playwright/test';
import { Given, Then, When } from '../support/fixtures';
import { waitForAppReady } from './common.steps';

Given('completed report {string} is available', async ({ scenarioState }, referenceId: string) => {
    scenarioState.activeReferenceId = referenceId;
    scenarioState.requests.set(referenceId, 'Report is available');
});

Given('the copied RFQ organisation step for {string} is displayed', async ({
    page,
    scenarioState,
}, referenceId: string) => {
    scenarioState.activeReferenceId = referenceId;
    await page.goto(`/request-for-quote-copy/${referenceId}`);
    await waitForAppReady(page);
    await expect(page).toHaveURL(
        new RegExp(`/request-for-quote/${referenceId}-COPY/organisation-and-contact$`),
    );
});

When('the user requests recalibration for {string}', async ({
    page,
    scenarioState,
}, referenceId: string) => {
    scenarioState.activeReferenceId = referenceId;
    await page.getByRole('tab', { name: 'Requests', exact: true }).click();
    const request = page.getByRole('tabpanel', { name: 'Requests' })
        .locator(`#RefId-${referenceId}`);
    await expect(request).toBeVisible();
    await request.getByRole('link', { name: /Request recalibration/i }).click();
    await waitForAppReady(page);
});

Then('the copied RFQ organisation step is displayed', async ({ page }) => {
    await expect(page).toHaveURL(
        /\/request-for-quote\/RFQ-2023-009012-COPY\/organisation-and-contact$/,
    );
    await expect(page.getByRole('heading', {
        name: 'Organisation and contact',
        exact: true,
    })).toBeVisible();
});

Then('the copied organisation details are pre-filled', async ({ page }) => {
    await expect(page.getByRole('heading', {
        name: /Currently managing Test Organisation Pty Ltd - Main Branch/,
    })).toBeVisible();
});

Then('the copied RFQ instrument step is displayed', async ({ page }) => {
    await expect(page).toHaveURL(/\/instrument-and-request$/);
    await expect(page.getByRole('heading', {
        name: 'Instrument and request',
        exact: true,
    })).toBeVisible();
});

Then('the instrument manufacturer is {string}', async ({ page }, manufacturer: string) => {
    await expect(page.getByLabel('Manufacturer', { exact: true })).toHaveValue(manufacturer);
});
