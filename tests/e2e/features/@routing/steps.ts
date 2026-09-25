import { expect } from '@playwright/test';
import { Then } from '../../support/fixtures';

Then('the not-found page is displayed', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /not found/i })).toBeVisible();
});
