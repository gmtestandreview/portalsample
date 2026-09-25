import { expect } from '@playwright/test';
import { FormStepStatus } from '../../../ClientApp/src/api/web-api-client';
import { DashboardItemStatus } from '../../../ClientApp/src/routes/common/enums';
import { Given, Then, When } from '../support/fixtures';
import { buildRfqSummary } from '../support/mock-builders';
import type { ScenarioState } from '../support/scenario-state';
import { waitForAppReady } from './common.steps';

const prepareDraft = (
    scenarioState: ScenarioState,
    id: string,
) => {
    scenarioState.activeReferenceId = id;
    scenarioState.requests.set(id, DashboardItemStatus.QuoteDrafted);
    scenarioState.rfqStepStatuses.set(id, [
        FormStepStatus.Completed,
        FormStepStatus.Saved,
        FormStepStatus.NotStarted,
    ]);
};

Given('submitted RFQ {string} is available', async ({ scenarioState }, id: string) => {
    scenarioState.activeReferenceId = id;
    scenarioState.rfqSummaries.set(id, buildRfqSummary());
});

When('the user opens the submitted RFQ summary', async ({ page, scenarioState }) => {
    await page.goto(`/request-for-quote/${scenarioState.activeReferenceId}/view-summary`);
});

Then('the submitted RFQ summary is displayed', async ({ page }) => {
    await expect(page).toHaveURL(/\/view-summary$/);
    await expect(page.getByRole('heading', { name: /Summary/i }).first()).toBeVisible();
});

Then('the summary contains manufacturer {string}', async ({ page }, value: string) => {
    await page.getByRole('button', {
        name: /Instrument and request/i,
    }).click();
    await expect(page.getByText(value, { exact: true })).toBeVisible();
});

Given('draft RFQ {string} is available', async ({ scenarioState }, id: string) => {
    prepareDraft(scenarioState, id);
});

Given(
    'draft RFQ {string} is available at the instrument step',
    async ({ page, scenarioState }, id: string) => {
        prepareDraft(scenarioState, id);
        await page.goto(`/request-for-quote/${id}/instrument-and-request`);
        await expect(page.getByRole('heading', {
            name: /Instrument and request/i,
        })).toBeVisible();
    },
);

When('the user opens the draft RFQ', async ({ page, scenarioState }) => {
    await page.goto('/dashboard');
    await waitForAppReady(page);
    const draft = page.getByRole('tabpanel', {
        name: 'Drafts',
        exact: true,
    }).locator(`#RefId-${scenarioState.activeReferenceId}`);
    await expect(draft).toBeVisible();
    const actions = draft.getByRole('button', {
        name: 'Actions',
        exact: true,
    });
    await actions.dispatchEvent('click');
    const editRequest = draft.getByRole('link', {
        name: 'Edit request',
        exact: true,
    });
    await expect(editRequest).toBeVisible();
    await editRequest.click();
    await expect(page.getByRole('heading', {
        name: /Instrument and request/i,
    })).toBeVisible();
});

When('the user changes the manufacturer to {string}', async ({ page }, value: string) => {
    await page.getByLabel('Manufacturer', { exact: true }).fill(value);
});

When('the user clears the manufacturer', async ({ page }) => {
    await page.getByLabel('Manufacturer', { exact: true }).clear();
});

Then(
    'draft RFQ {string} retains manufacturer {string}',
    async ({ scenarioState }, id: string, value: string) => {
        expect(scenarioState.instrumentDrafts.get(id)?.manufacturer).toBe(value);
    },
);

Then('the validation message {string} is displayed', async ({ page }, message: string) => {
    await expect(page.getByText(message, { exact: true })).toBeVisible();
});

Then('the RFQ instrument step remains displayed', async ({ page }) => {
    await expect(page).toHaveURL(/\/instrument-and-request$/);
    await expect(page.getByRole('heading', {
        name: /Instrument and request/i,
    })).toBeVisible();
});
