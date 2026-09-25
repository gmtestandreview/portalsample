import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { Given, Then, When } from '../support/fixtures';
import {
    disableMockAuthenticationReseed,
    installMockAuthentication,
} from '../support/mock-authentication';
import { installMockApi } from '../support/mock-api';

const rfqStepLocations = [
    'organisation-and-contact',
    'instrument-and-request',
    'summary',
] as const;

export const waitForAppReady = async (page: Page) => {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {
        // MSAL and Storybook can keep background network activity alive.
    });
};

const waitForRfqStep = async (
    page: Page,
    step: number,
    title?: string,
) => {
    const location = rfqStepLocations[step - 1];
    if (!location) {
        throw new Error(`Unsupported RFQ wizard step: ${step}`);
    }

    await expect(page).toHaveURL(
        new RegExp(`/request-for-quote/[^/]+/${location}$`),
    );
    await expect(page.getByTestId('form')).toBeVisible();
    await expect(page.locator('.stepped-navigation .current-step'))
        .toContainText(`${step}`);

    if (title) {
        const heading = step === 3 && title === 'Summary'
            ? 'Summary and submit'
            : title;
        await expect(page.getByRole('heading', {
            name: heading,
            exact: true,
        })).toBeVisible();
    }
};

Given('the user is on the NMI Services portal home page', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
});

Given('the user is signed in as {string}', async ({ page, scenarioState }, email: string) => {
    scenarioState.email = email;
    await installMockAuthentication(page, scenarioState);
    await installMockApi(page, scenarioState);
    await page.goto('/dashboard');
    await waitForAppReady(page);
});

Given('the user is on the dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForAppReady(page);
});

When('the user navigates to {string}', async ({ page }, path: string) => {
    await page.goto(path);
    await waitForAppReady(page);
});

When('the page finishes loading', async ({ page }) => {
    await waitForAppReady(page);
});

When('the user clicks {string}', async ({ page }, accessibleName: string) => {
    if (accessibleName === 'Sign out') {
        await page.locator('#user-menu').click();
        await disableMockAuthenticationReseed(page);
        await page.getByRole('link', { name: 'Log out', exact: true }).click();
        return;
    }

    if (accessibleName === 'Create new request') {
        await page.getByRole('link', { name: 'New request', exact: true }).click();
        await waitForAppReady(page);
        return;
    }

    if (accessibleName === 'Back') {
        await page.getByRole('link', { name: accessibleName, exact: true }).click();
        return;
    }

    await page.getByRole('button', { name: accessibleName, exact: true }).click();
});

When('the user fills in the instrument manufacturer {string}', async ({ page }, value: string) => {
    await page.getByLabel('Manufacturer', { exact: true }).fill(value);
});

When('the user fills in the instrument model {string}', async ({ page }, value: string) => {
    await page.getByLabel('Model', { exact: true }).fill(value);
});

When('the user fills in the serial number {string}', async ({ page }, value: string) => {
    await page.getByLabel('Serial number', { exact: true }).fill(value);
});

When('the user fills in the contact first name {string}', async ({ page }, value: string) => {
    await page.getByLabel('First name', { exact: true }).fill(value);
});

When('the user fills in the contact last name {string}', async ({ page }, value: string) => {
    await page.getByLabel('Last name', { exact: true }).fill(value);
});

When('the user fills in the contact email {string}', async ({ page }, value: string) => {
    await page.getByLabel('Email address', { exact: true }).fill(value);
});

When('the user confirms the dialog', async ({ page }) => {
    const dialog = page.getByRole('dialog');
    const preferred = dialog.getByRole('button', { name: /yes|confirm|submit|discard/i }).last();
    await preferred.click();
});

Then('the user should be redirected to the B2C sign-in page', async ({ page }) => {
    await expect(page).toHaveURL(/login\.microsoftonline\.com|b2clogin\.com/);
});

Then('the user should see the dashboard heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /currently managing/i })).toBeVisible();
});

Then('the user should see their organisation name', async ({ page }) => {
    await expect(page.locator('#main').getByText('Test Organisation', { exact: true }).first()).toBeVisible();
});

Then('the sign-in button should be visible', async ({ page }) => {
    await expect(page.getByRole('link', { name: /^Log in/ })).toBeVisible();
});

Then('the user should be redirected to the home page', async ({ page }) => {
    await expect(page).toHaveURL(/\/$/);
});

Then('the stepped navigation should show {int} steps', async ({ page }, count: number) => {
    await expect(page.locator('.stepped-navigation li')).toHaveCount(count);
});

Then('the user should be on the RFQ wizard step {int} {string}', async ({ page }, _step: number, title: string) => {
    await waitForRfqStep(page, _step, title);
});

Then('the user should be on the RFQ wizard step {int}', async ({ page }, step: number) => {
    await waitForRfqStep(page, step);
});

Then('the user should be redirected to the dashboard', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard$/);
});

Then('the dashboard should show a success notification', async ({ page }) => {
    await expect(page.locator('[role="alert"], .alert').first()).toBeVisible();
});

Then('the dashboard should show the draft request {string}', async ({ page }, text: string) => {
    await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
});

Then('a confirmation dialog should appear with {string}', async ({ page }, title: string) => {
    await expect(page.getByRole('dialog')).toContainText(new RegExp(title, 'i'));
});

Then('the instrument manufacturer field should contain {string}', async ({ page }, value: string) => {
    await expect(page.getByLabel('Manufacturer', { exact: true })).toHaveValue(value);
});

Then('the RFQ submitted page should be displayed', async ({ page }) => {
    await expect(page).toHaveURL(/\/request-for-quote-success\/RFQ-NEW-0001$/);
    await expect(page.getByRole('heading', {
        name: 'Your request has been submitted',
        exact: true,
    })).toBeVisible();
});
