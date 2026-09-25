import { expect } from '@playwright/test';
import { Given, Then, When } from '../support/fixtures';
import { failureKey } from '../support/mock-failure';

Given(
    'saving the RFQ instrument step will fail with status {int}',
    async ({ scenarioState }, status: number) => {
        scenarioState.failures.set(
            failureKey(
                'PUT',
                `/api/request-for-quote/${scenarioState.activeReferenceId}/instrument-and-request`,
            ),
            { status },
        );
    },
);

Given(
    'saving the organisation will fail with status {int}',
    async ({ scenarioState }, status: number) => {
        scenarioState.failures.set(
            failureKey('PUT', '/api/forms/accounts/create-account/complete'),
            {
                status,
                body: { status, title: 'Precondition Failed' },
            },
        );
    },
);

Then('an RFQ save error is displayed', async ({ page }) => {
    await expect(page.getByRole('alert')).toBeVisible();
});

Then('the manufacturer remains {string}', async ({ page }, value: string) => {
    await expect(page.getByLabel('Manufacturer', { exact: true })).toHaveValue(value);
});

Then('an unsaved changes dialog is displayed', async ({ page }) => {
    await expect(page.getByRole('dialog')).toBeVisible();
});

When('the user cancels leaving the form', async ({ page }) => {
    await page.getByRole('dialog').getByRole('button', {
        name: 'Cancel',
        exact: true,
    }).click();
});
