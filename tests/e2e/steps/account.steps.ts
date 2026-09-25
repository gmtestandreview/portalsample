import { expect } from '@playwright/test';
import { Given, Then, When } from '../support/fixtures';
import {
    disableMockAuthenticationReseed,
    expireMockAuthentication,
    installMockAuthentication,
} from '../support/mock-authentication';
import { installMockApi } from '../support/mock-api';
import { waitForAppReady } from './common.steps';
import { failureKey } from '../support/mock-failure';

Given('a first-time user is signed in as {string}', async ({
    page,
    scenarioState,
}, email: string) => {
    Object.assign(scenarioState, {
        email,
        acceptedTerms: false,
        accountCreationCompleted: false,
        accountContactCompleted: false,
        defaultOrganisationId: 1,
    });
    await installMockAuthentication(page, scenarioState);
    await installMockApi(page, scenarioState);
    await page.goto('/create-account');
    await waitForAppReady(page);
});

Given('the terms of use dialog is displayed', async ({ page }) => {
    await expect(page.getByTestId('prompt-termsandcondition-modal')).toBeVisible();
});

Given('the user has accepted the terms of use', async ({ page }) => {
    const termsDialog = page.getByRole('dialog');
    await expect(termsDialog).toBeVisible();
    await termsDialog.getByTestId('agree-continue-button').click();
    await expect(termsDialog).toHaveCount(0);
});

Given('the organisation form is displayed', async ({ page }) => {
    await expect(page).toHaveURL(/\/create-account/);
    await expect(page.getByRole('heading', { name: 'Organisation', exact: true })).toBeVisible();
});

When('the user submits the organisation form', async ({ page }) => {
    await page.getByRole('button', { name: 'Create account', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Yes, submit', exact: true }).click();
    await waitForAppReady(page);
});

When('the user submits the contact form', async ({ page }) => {
    await page.getByRole('button', { name: 'Create account', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Yes, submit', exact: true }).click();
    await waitForAppReady(page);
});

When('the authentication session expires', async ({ page, scenarioState }) => {
    scenarioState.authenticated = false;
    if (scenarioState.activeReferenceId) {
        scenarioState.failures.set(
            failureKey(
                'PUT',
                `/api/request-for-quote/${scenarioState.activeReferenceId}/instrument-and-request`,
            ),
            { status: 401 },
        );
        await disableMockAuthenticationReseed(page);
        return;
    }
    await expireMockAuthentication(page);
});

When('the user refreshes the page', async ({ page }) => {
    await page.reload();
    await waitForAppReady(page);
});

Then('the organisation form remains displayed', async ({ page }) => {
    await expect(page).toHaveURL(/\/create-account/);
    await expect(page.getByRole('heading', { name: 'Organisation', exact: true })).toBeVisible();
    await expect(page.getByTestId('prompt-termsandcondition-modal')).toHaveCount(0);
});

Then('the contact form is displayed', async ({ page }) => {
    await expect(page).toHaveURL(/\/create-contact/);
    await expect(page.getByRole('heading', { name: 'My contact details', exact: true })).toBeVisible();
});

Then('the completed account dashboard is displayed', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: /currently managing/i })).toBeVisible();
});

Then('the sign-in page is displayed', async ({ page }) => {
    if (/login\.microsoftonline\.com|b2clogin\.com/.test(page.url())) {
        return;
    }
    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page.getByRole('link', { name: /^Log in/ })).toBeVisible();
});
