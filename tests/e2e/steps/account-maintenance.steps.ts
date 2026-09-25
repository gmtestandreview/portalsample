import { expect } from '@playwright/test';
import { Given, Then, When } from '../support/fixtures';
import { waitForAppReady } from './common.steps';

Given('the user opens organisation {int} for editing', async ({ page }, id: number) => {
    await page.goto(`/update-organisation/${id}`);
    await expect(page.getByRole('heading', {
        name: 'Organisation',
        exact: true,
    })).toBeVisible();
});

Given('the user opens their contact details for editing', async ({ page }) => {
    await page.goto('/update-contact');
    await expect(page.getByRole('heading', {
        name: 'My contact details',
        exact: true,
    })).toBeVisible();
});

Given('the user opens the add branch form', async ({ page }) => {
    await page.goto('/add-branch');
    await expect(page.getByText('Add branch or location', {
        exact: true,
    }).first()).toBeVisible();
});

When('the user changes the business website to {string}', async ({ page }, value: string) => {
    await page.getByLabel('Business website address (optional)', {
        exact: true,
    }).fill(value);
});

When('the user changes the business phone to {string}', async ({ page }, value: string) => {
    await page.getByLabel('Business phone', { exact: true }).fill(value);
});

When('the user enters branch name {string}', async ({ page }, value: string) => {
    await page.getByLabel('Branch or Location name (optional)', {
        exact: true,
    }).fill(value);
});

When('the user submits the account maintenance form', async ({ page }) => {
    await page.getByRole('button', { name: 'Save and close', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', {
        name: 'Yes, submit',
        exact: true,
    }).click();
    await waitForAppReady(page);
});

Then('the success notification {string} is displayed', async ({ page }, message: string) => {
    await expect(page.getByRole('alert').filter({
        hasText: message,
    })).toBeVisible();
});

Then('the error notification {string} is displayed', async ({ page }, message: string) => {
    await expect(page.getByRole('alert').filter({
        hasText: message,
    })).toBeVisible();
});

Then('the branch selector is displayed', async ({ page }) => {
    await expect(page.locator('[role="dialog"].show')).toContainText('Manage your branch or location');
});
