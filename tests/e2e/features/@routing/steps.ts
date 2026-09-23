import { expect } from '@playwright/test';
import { Then } from '../../support/fixtures.ts';

Then('the not-found page is displayed', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: /not found/iu })
  ).toBeVisible();
});
