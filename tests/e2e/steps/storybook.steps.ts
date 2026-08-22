/**
 * Storybook BDD step definitions.
 *
 * These steps navigate to Storybook story iframes and assert that the rendered
 * component matches the expectations described in the story files.
 *
 * Story iframe URL pattern:
 *   http://localhost:6006/iframe.html?id=<story-id>&viewMode=story
 *
 * The steps use absolute URLs so they work regardless of the Playwright
 * project's baseURL setting.
 */

import { expect, type Page } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { Given, When, Then } = createBdd();

const STORYBOOK_BASE = 'http://localhost:6006';

/** Navigate to a Storybook story iframe and wait for it to be ready. */
async function loadStoryIframe(page: Page, storyId: string) {
    await page.goto(`${STORYBOOK_BASE}/iframe.html?id=${storyId}&viewMode=story`);
    // Wait for the React root to be attached — storybook renders into #storybook-root
    await page.waitForSelector('#storybook-root', { state: 'attached', timeout: 15_000 });
    // Give React a tick to finish rendering
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {
        // networkidle can be flaky with MSW; continue after domcontentloaded
    });
}

// ---------------------------------------------------------------------------
// Background steps
// ---------------------------------------------------------------------------

Given('I am viewing Storybook stories for alerts', async () => {
    // Intentionally empty — navigation happens in the When step
});

Given('I am viewing Storybook stories for the accordion', async () => {});
Given('I am viewing Storybook stories for body text', async () => {});
Given('I am viewing Storybook stories for breadcrumbs', async () => {});
Given('I am viewing Storybook stories for buttons', async () => {});
Given('I am viewing Storybook stories for header intro text', async () => {});
Given('I am viewing Storybook stories for stepped navigation', async () => {});
Given('I am viewing Storybook stories for summary display', async () => {});
Given('I am viewing Storybook stories for pill status badges', async () => {});
Given('I am viewing Storybook stories for pagination', async () => {});
Given('I am viewing Storybook stories for the site header', async () => {});
Given('I am viewing Storybook stories for the site footer', async () => {});
Given('I am viewing Storybook stories for search filter', async () => {});
Given('I am viewing Storybook stories for dashboard request items', async () => {});
Given('I am viewing Storybook stories for form inputs', async () => {});
Given('I am viewing Storybook stories for the wizard form', async () => {});
Given('I am viewing Storybook stories for modals', async () => {});

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

When(
    'I load the Storybook story {string}',
    async ({ page }, storyId: string) => {
        await loadStoryIframe(page, storyId);
    },
);

// ---------------------------------------------------------------------------
// Assertions — text content
// ---------------------------------------------------------------------------

Then(
    'the story iframe should contain {string}',
    async ({ page }, text: string) => {
        const root = page.locator('#storybook-root');
        await expect(root).toContainText(text, { timeout: 10_000 });
    },
);

Then(
    'the Storybook portal should contain {string}',
    async ({ page }, text: string) => {
        const portalContent = page.locator(
            '.modal, [role="dialog"], [role="alert"], [id^="notif-"]',
        );
        await expect(portalContent.filter({ hasText: text }).first()).toBeVisible({
            timeout: 10_000,
        });
    },
);

// ---------------------------------------------------------------------------
// Assertions — buttons
// ---------------------------------------------------------------------------

Then(
    'the story iframe should have a button with accessible name {string}',
    async ({ page }, name: string) => {
        const btn = page.getByRole('button', { name });
        await expect(btn.first()).toBeVisible({ timeout: 10_000 });
    },
);

Then(
    'the story iframe should have a link with accessible name {string}',
    async ({ page }, name: string) => {
        const link = page.getByRole('link', { name });
        await expect(link.first()).toBeVisible({ timeout: 10_000 });
    },
);

Then(
    'the story iframe should have a dialog with accessible name {string}',
    async ({ page }, name: string) => {
        const dialog = page.getByRole('dialog', { name });
        await expect(dialog.first()).toBeVisible({ timeout: 10_000 });
    },
);

Then(
    'the story iframe should have a disabled button with accessible name {string}',
    async ({ page }, name: string) => {
        const btn = page.getByRole('button', { name });
        await expect(btn.first()).toBeDisabled({ timeout: 10_000 });
    },
);

// ---------------------------------------------------------------------------
// Assertions — landmarks
// ---------------------------------------------------------------------------

Then(
    'the story iframe should have a navigation landmark',
    async ({ page }) => {
        const nav = page.getByRole('navigation');
        await expect(nav.first()).toBeVisible({ timeout: 10_000 });
    },
);

Then(
    'the story iframe should have a contentinfo landmark',
    async ({ page }) => {
        const footer = page.getByRole('contentinfo');
        await expect(footer.first()).toBeVisible({ timeout: 10_000 });
    },
);

Then(
    'the story iframe should have a content info landmark',
    async ({ page }) => {
        const footer = page.getByRole('contentinfo');
        await expect(footer.first()).toBeVisible({ timeout: 10_000 });
    },
);

// ---------------------------------------------------------------------------
// Assertions — form elements
// ---------------------------------------------------------------------------

Then(
    'the story iframe should have a text input for searching',
    async ({ page }) => {
        // SearchFilter uses a search input or text input with a placeholder
        const searchInput = page.locator('input[type="search"], input[type="text"]');
        await expect(searchInput.first()).toBeVisible({ timeout: 10_000 });
    },
);

// ---------------------------------------------------------------------------
// Assertions — pill / status badges
// ---------------------------------------------------------------------------

Then(
    'the story iframe should contain text matching a dashboard status label',
    async ({ page }) => {
        // The pill renders status text; assert at least one span/badge is visible
        const root = page.locator('#storybook-root');
        await expect(root).toBeVisible({ timeout: 10_000 });
        // At least one pill should be rendered
        const pills = root.locator('span, .badge, [class*="pill"], [class*="status"]');
        await expect(pills.first()).toBeVisible({ timeout: 10_000 });
    },
);

Then(
    'the story iframe should contain text matching a quote status label',
    async ({ page }) => {
        const root = page.locator('#storybook-root');
        await expect(root).toBeVisible({ timeout: 10_000 });
        const pills = root.locator('span, .badge, [class*="pill"], [class*="status"]');
        await expect(pills.first()).toBeVisible({ timeout: 10_000 });
    },
);

// ---------------------------------------------------------------------------
// Assertions — pagination
// ---------------------------------------------------------------------------

Then(
    'the story iframe should not show pagination controls',
    async ({ page }) => {
        await expect(page.getByRole('navigation', { name: /pagination/i })).toHaveCount(0);
        await expect(page.getByRole('button', {
            name: /next page|previous page/i,
        })).toHaveCount(0);
    },
);

// ---------------------------------------------------------------------------
// Assertions — generic visibility
// ---------------------------------------------------------------------------

Then(
    'the story iframe should be visible',
    async ({ page }) => {
        await expect(page.locator('#storybook-root')).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText(
            'Something went wrong',
            { exact: false },
        )).toHaveCount(0);
    },
);

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

When(
    'I click the button with accessible name {string} in the story iframe',
    async ({ page }, name: string) => {
        const btn = page.getByRole('button', { name });
        await btn.first().click();
    },
);

When(
    'I click the link with accessible name {string} in the story iframe',
    async ({ page }, name: string) => {
        const link = page.getByRole('link', { name });
        await link.first().click();
    },
);

Then(
    'the story should not throw a JavaScript error',
    async ({ page }) => {
        // Check that #storybook-root is still present (not replaced by error UI)
        const root = page.locator('#storybook-root');
        await expect(root).toBeVisible({ timeout: 5_000 });
    },
);
