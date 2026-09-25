import { expect } from '@playwright/test';
import { QuoteStatus } from '../../../ClientApp/src/routes/common/enums';
import { Given, Then, When } from '../support/fixtures';
import { buildQuote } from '../support/scenario-state';
import { waitForAppReady } from './common.steps';

Given('quote {string} is available', async ({ scenarioState }, referenceId: string) => {
    scenarioState.activeReferenceId = referenceId;
    scenarioState.requests.set(referenceId, 'Quote offer is available');
    scenarioState.quotes.set(referenceId, buildQuote(referenceId));
});

Given('quote {string} is expired', async ({ scenarioState }, referenceId: string) => {
    scenarioState.activeReferenceId = referenceId;
    scenarioState.requests.set(referenceId, 'Quote offer expired');
    scenarioState.quotes.set(referenceId, buildQuote(referenceId, QuoteStatus.QuoteExpired));
});

Given('the user is viewing quotation {string}', async ({ page, scenarioState }, referenceId: string) => {
    scenarioState.activeReferenceId = referenceId;
    await page.goto(`/quotation/${referenceId}`);
    await waitForAppReady(page);
});

When('the user opens request {string}', async ({ page, scenarioState }, referenceId: string) => {
    scenarioState.activeReferenceId = referenceId;
    await page.getByRole('tab', { name: 'Requests', exact: true }).click();
    const request = page.getByRole('tabpanel', { name: 'Requests' })
        .locator(`#RefId-${referenceId}`);
    await expect(request).toBeVisible();
    await request.scrollIntoViewIfNeeded();
});

When('the user selects its {string} tab', async ({ page }, tabName: string) => {
    await page.getByRole('tab', { name: tabName, exact: true }).click();
});

When('the user follows {string}', async ({ page }, name: string) => {
    if (name === 'View quotation') {
        await page.getByRole('button', { name, exact: true }).click();
    } else {
        await page.getByRole('link', { name, exact: true }).click();
    }
    await waitForAppReady(page);
});

When('the user views quotation {string}', async ({ page, scenarioState }, referenceId: string) => {
    scenarioState.activeReferenceId = referenceId;
    await page.goto(`/quotation/${referenceId}`);
    await waitForAppReady(page);
});

When('the user confirms {string}', async ({ page }, name: string) => {
    await page.getByRole('dialog').getByRole('button', { name, exact: true }).click();
    await waitForAppReady(page);
});

Then('the quotation page for {string} is displayed', async ({ page }, referenceId: string) => {
    await expect(page).toHaveURL(new RegExp(`/quotation/${referenceId}$`));
    await expect(page.getByRole('heading', { name: 'Quotation', exact: true })).toBeVisible();
});

Then('the quote acceptance wizard for {string} is displayed', async ({ page }, referenceId: string) => {
    await expect(page).toHaveURL(/\/accept-quote\/QA-RFQ-2024-000892\/report-recipient$/);
    await expect(page.getByText(referenceId, { exact: false }).first()).toBeVisible();
    await expect(page.locator('.stepped-navigation')).toBeVisible();
});

Then('{string} is available', async ({ page }, name: string) => {
    const link = page.getByRole('link', { name, exact: true });
    const button = page.getByRole('button', { name, exact: true });
    await expect(link.or(button)).toBeVisible();
});

Then('{string} is not available', async ({ page }, name: string) => {
    await expect(page.getByRole('link', { name, exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0);
});

Then('a confirmation dialog titled {string} is displayed', async ({ page }, title: string) => {
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: title, exact: true })).toBeVisible();
});

Then('the dashboard is displayed', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: /currently managing/i })).toBeVisible();
});

Then('the quote status {string} is displayed', async ({ page }, status: string) => {
    await expect(page.getByText(status, { exact: true })).toBeVisible();
});

Then('the quote acceptance step {string} is displayed', async ({ page }, title: string) => {
    await expect(page.getByRole('heading', {
        name: new RegExp(title.replace('/', String.raw`\/`), 'i'),
    }).first()).toBeVisible();
});

When('the user completes the report recipient step', async ({ page }) => {
    await page.locator('label').filter({
        hasText: 'Business street address',
    }).click();
});

When('the user completes the delivery and return step', async ({ page }) => {
    await page.locator('label').filter({
        hasText: 'The main contact person for this request',
    }).click();
    await page.locator('label').filter({
        hasText: 'Business street address',
    }).click();
    await page.locator('label').filter({
        hasText: 'Client to arrange when completed',
    }).click();
});

When('the user completes the payment details step', async ({ page }) => {
    await page.getByLabel('Purchase Order (PO) number (optional)', {
        exact: true,
    }).fill('PO-E2E-12345');
    await page.locator('label').filter({
        hasText: 'The main contact person for this request',
    }).click();
});

When('the user accepts the quote terms', async ({ page }) => {
    const acceptance = page.getByLabel(
        'Yes, on behalf of my organisation, I accept the quotation',
        { exact: true },
    );
    await page.getByText(
        'Yes, on behalf of my organisation, I accept the quotation',
        { exact: true },
    ).click();
    await expect(acceptance).toBeChecked();
});

Then('the accepted quote success page is displayed', async ({ page }) => {
    await expect(page).toHaveURL(/\/submitted-success\/QA-RFQ-2024-000892$/);
    await expect(page.getByRole('heading', {
        name: /accepted quote has been successfully submitted/i,
    })).toBeVisible();
});
