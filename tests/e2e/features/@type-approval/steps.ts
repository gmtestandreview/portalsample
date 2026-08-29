import { expect, type Page } from '@playwright/test';
import type { DataTable } from 'playwright-bdd';
import { Given, Then, When } from '../../support/fixtures';

const stepLocations: Record<string, string> = {
    'Organisation details': 'organisation-details',
    'Application details': 'application-details',
    'Supporting documents': 'supporting-documents',
    'Summary and submit': 'summary',
};

const waitForAppReady = async (page: Page) => {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => undefined);
};

Given('the user is on the pattern\\/type approval dashboard', async ({ page }) => {
    await page.goto('/dashboard-ta');
    await waitForAppReady(page);
    await expect(page).toHaveURL(/\/dashboard-ta$/);
    await expect(page.getByRole('heading', { name: /manage pattern\/type approval/i })).toBeVisible();
});

When('the applicant starts a new pattern\\/type approval application', async ({ page }) => {
    await page.getByRole('link', { name: 'New application', exact: true }).click();
});

Then('the pattern\\/type approval pre-application guidance is displayed', async ({ page }) => {
    await expect(page).toHaveURL(/\/ta\/type-approval-create-pre$/);
    await expect(page.getByRole('heading', { name: 'Application for Pattern/type approval' })).toBeVisible();
});

When('the applicant begins the application', async ({ page }) => {
    await page.getByRole('button', { name: 'Start application', exact: true }).click();
    await waitForAppReady(page);
});

Then('the type-approval step {string} is displayed', async ({ page }, title: string) => {
    const location = stepLocations[title];
    if (!location) {
        throw new Error(`Unsupported type-approval step: ${title}`);
    }
    await expect(page).toHaveURL(new RegExp(`/ta/[^/]+/${location}$`));
    await expect(page.getByTestId('form')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: new RegExp(title, 'i') })).toBeVisible();
});

When('the applicant confirms the organisation and contact details', async ({ page }) => {
    await page.getByTestId('save-and-next-button').click();
});

When('the applicant provides new-certificate application details:', async ({ page }, dataTable: DataTable) => {
    const values = dataTable.rowsHash();
    await page.getByLabel('New Certificate of Approval (CoA)', { exact: true }).check();
    await page.locator('label[for="q-appl-new-nmiapprcert"]').click();
    await page.getByLabel('Select the category of your instrument').selectOption({
        label: values['Instrument category'],
    });
    await page.getByLabel('Select the type of your instrument').selectOption({
        label: values['Instrument type'],
    });
    await page.getByLabel('Instrument make (optional)').fill(values['Instrument make']);
    await page.getByLabel('Model (optional)').fill(values.Model);
    await page.getByLabel('Summary of application').fill(values.Summary);
    await page.getByTestId('save-and-next-button').click();
});

When('the applicant uploads {string} as a {string}', async ({ page }, fileName: string, category: string) => {
    await page.locator('input[type="file"]').setInputFiles({
        name: fileName,
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 type approval evidence'),
    });
    await expect(page.getByText(fileName, { exact: true })).toBeVisible();
    await page.getByLabel('Category').selectOption(category);
    await page.getByTestId('save-and-next-button').click();
});

When('the applicant accepts the declarations and submits the application', async ({ page }) => {
    await page.locator('label[for="acceptNMIP106"]').click();
    await page.locator('label[for="acceptTermsAndConditions"]').click();
    await page.locator('label[for="acceptDeclaration"]').click();
    await page.getByTestId('save-and-next-button').click();
    await page.getByRole('dialog').getByRole('button', { name: 'Yes, submit', exact: true }).click();
});

Then('the type-approval submission success page is displayed', async ({ page }) => {
    await expect(page).toHaveURL(/\/ta\/type-approval-success\/PA-2026-000002$/);
    await expect(page.getByRole('heading', { name: 'Your application has been submitted' })).toBeVisible();
});

When('the applicant returns to the pattern\\/type approval dashboard', async ({ page }) => {
    await page.getByRole('button', { name: 'Go to dashboard', exact: true }).click();
    await waitForAppReady(page);
});

Then('submitted type-approval application {string} appears', async ({ page }, referenceId: string) => {
    await expect(page).toHaveURL(/\/dashboard-ta$/);
    await expect(
        page.getByRole('tabpanel', { name: 'Applications' }).locator(`#RefId-${referenceId}`),
    ).toBeVisible();
});

Given('submitted type-approval application {string} is available', async ({ page }, referenceId: string) => {
    await page.getByRole('tab', { name: 'Applications', exact: true }).click();
    await expect(
        page.getByRole('tabpanel', { name: 'Applications' }).locator(`#RefId-${referenceId}`),
    ).toBeVisible();
});

When('the applicant opens the submitted type-approval application', async ({ page }) => {
    await page.getByRole('button', { name: 'View application details', exact: true }).first().click();
});

Then('its application details are displayed', async ({ page }) => {
    await expect(page).toHaveURL(/\/ta\/PA-2026-000001\/manage$/);
    await expect(page.getByRole('heading', { name: 'Record of application submitted' })).toBeVisible();
});

When('the applicant views its documents', async ({ page }) => {
    await page.getByRole('tab', { name: 'Documents', exact: true }).click();
});

Then('document {string} is displayed', async ({ page }, fileName: string) => {
    await expect(
        page.getByRole('tabpanel', { name: 'Documents' }).getByText(fileName, { exact: true }),
    ).toBeVisible();
});

When('the applicant sends the message {string}', async ({ page }, message: string) => {
    await page.getByRole('tab', { name: 'Messages', exact: true }).click();
    await page.getByRole('textbox', { name: 'Message NMI' }).fill(message);
    await page.getByRole('button', { name: 'Send message' }).click();
});

Then('the message appears in the application thread', async ({ page }) => {
    await expect(page.locator('#application-messages')).toContainText(
        'Please confirm that the certificate was received.',
    );
});
