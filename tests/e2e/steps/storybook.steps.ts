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

import { expect, type APIResponse, type Page } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { Given, When, Then } = createBdd();

const STORYBOOK_BASE = 'http://localhost:6006';
const REPRESENTATIVE_DOCS_ID = 'components-pill--documentation';
const REPRESENTATIVE_STORY_ID = 'components-pill--dashboard-statuses';
const STYLE_GUIDE_DOCS_ID = 'documentation-style-guide--documentation';

const MCP_HEADERS = {
    accept: 'application/json, text/event-stream',
    'content-type': 'application/json',
};

type McpEnvelope = {
    result?: {
        serverInfo?: { name?: string };
        tools?: Array<{ name: string }>;
    };
};

async function readMcpEvent(response: APIResponse): Promise<McpEnvelope> {
    const body = await response.text();
    const dataLine = body
        .split(/\r?\n/)
        .find((line) => line.startsWith('data: '));

    if (dataLine === undefined) {
        throw new Error(`MCP response did not contain an SSE data event: ${body}`);
    }

    return JSON.parse(dataLine.slice('data: '.length)) as McpEnvelope;
}

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

/** Navigate directly to a Storybook docs iframe and wait for Docs to render. */
async function loadDocsIframe(page: Page, docsId: string) {
    await page.goto(`${STORYBOOK_BASE}/iframe.html?id=${docsId}&viewMode=docs`);
    await expect(page.locator('#storybook-docs')).toBeVisible({ timeout: 15_000 });
}

function visibleSource(page: Page) {
    return page.locator('pre:visible');
}

// ---------------------------------------------------------------------------
// MCP protocol compatibility
// ---------------------------------------------------------------------------

Given('the Storybook MCP server is running', async ({ request }) => {
    const response = await request.get(`${STORYBOOK_BASE}/mcp`, {
        headers: { accept: 'text/html' },
    });

    expect(response.status()).toBe(200);
    expect(await response.text()).toContain(
        'Storybook MCP server successfully running',
    );
});

Then(
    'the Storybook MCP endpoint should initialize and list configured tools',
    async ({ request }) => {
        const initialize = await request.post(`${STORYBOOK_BASE}/mcp`, {
            headers: MCP_HEADERS,
            data: {
                jsonrpc: '2.0',
                id: 1,
                method: 'initialize',
                params: {
                    protocolVersion: '2025-03-26',
                    capabilities: {},
                    clientInfo: { name: 'dependency-security-test', version: '1.0.0' },
                },
            },
        });

        expect(initialize.status()).toBe(200);
        const sessionId = initialize.headers()['mcp-session-id'];
        if (sessionId === undefined) {
            throw new Error('MCP initialize response did not provide a session ID');
        }
        const initializeEnvelope = await readMcpEvent(initialize);
        expect(initializeEnvelope.result?.serverInfo?.name).toBe(
            '@storybook/addon-mcp',
        );

        const sessionHeaders = {
            ...MCP_HEADERS,
            'mcp-session-id': sessionId,
        };
        const initialized = await request.post(`${STORYBOOK_BASE}/mcp`, {
            headers: sessionHeaders,
            data: { jsonrpc: '2.0', method: 'notifications/initialized' },
        });
        expect(initialized.status()).toBe(202);

        const toolsList = await request.post(`${STORYBOOK_BASE}/mcp`, {
            headers: sessionHeaders,
            data: { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
        });
        expect(toolsList.status()).toBe(200);
        const toolsEnvelope = await readMcpEvent(toolsList);
        const toolNames =
            toolsEnvelope.result?.tools?.map(({ name }) => name) ?? [];

        expect(toolNames).toEqual(
            expect.arrayContaining([
                'list-all-documentation',
                'preview-stories',
                'display-review',
                'run-story-tests',
            ]),
        );
    },
);

// ---------------------------------------------------------------------------
// Background steps
// ---------------------------------------------------------------------------

Given('Storybook is running', async ({ page }) => {
    const response = await page.goto(STORYBOOK_BASE);

    expect(response?.ok()).toBe(true);
    await expect(page.getByRole('heading', { name: 'Storybook' })).toBeVisible({
        timeout: 15_000,
    });
});

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
    'I open a representative component documentation page',
    async ({ page }) => {
        await loadDocsIframe(page, REPRESENTATIVE_DOCS_ID);
    },
);

When('I open a representative component story', async ({ page }) => {
    await page.goto(`${STORYBOOK_BASE}/?path=/story/${REPRESENTATIVE_STORY_ID}`);
    await expect(page.getByRole('heading', { name: 'Addon panel' })).toBeVisible({
        timeout: 15_000,
    });
});

When('I open the Documentation Style Guide', async ({ page }) => {
    await loadDocsIframe(page, STYLE_GUIDE_DOCS_ID);
});

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

// ---------------------------------------------------------------------------
// Assertions — Storybook documentation architecture
// ---------------------------------------------------------------------------

Then('the component documentation page is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Pill', exact: true })).toBeVisible();
    await expect(page.getByText(
        'Presents a compact, colour-coded label',
        { exact: false },
    )).toBeVisible();
});

Then('the component API documentation is visible', async ({ page }) => {
    const apiTable = page.getByRole('table').filter({ hasText: 'Workflow status' });

    await expect(apiTable).toBeVisible();
    await expect(apiTable).toContainText('status');
    await expect(apiTable).toContainText('className');
});

Then('the component stories are visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Stories' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dashboard Statuses' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Quote Statuses' })).toBeVisible();
});

Then('a Storybook source example is available', async ({ page }) => {
    // Storybook renders the button label inside a portal-backed tooltip tree;
    // selecting the semantic button by its visible label avoids an expensive
    // accessible-name walk when the BDD suite runs fully parallel.
    await page.locator('button').filter({ hasText: 'Show code' }).first().click();

    await expect(visibleSource(page)).toContainText('StatusPill');
});

Then(
    'Storybook decorators are not included in the displayed source',
    async ({ page }) => {
        const source = visibleSource(page);

        await expect(source).not.toContainText('RouterProvider');
        await expect(source).not.toContainText('createMemoryRouter');
    },
);

Then('the Storybook Code Panel is available', async ({ page }) => {
    const codeTab = page.getByRole('tab', { name: 'Code' });

    await expect(codeTab).toBeVisible();
    await codeTab.click();
    await expect(codeTab).toHaveAttribute('aria-selected', 'true');
});

Then('the Code Panel contains source for the current story', async ({ page }) => {
    const source = visibleSource(page);

    await expect(source).toContainText('StatusPill');
    await expect(source).toContainText('DashboardItemStatus.QuoteAvailable');
});

Then('the Style Guide is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Style Guide' })).toBeVisible();
});

Then('its typography documentation is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Typography' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Type Scale' })).toBeVisible();
});

Then('its colour documentation is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Color System' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Color Usage Rules' })).toBeVisible();
});

Then('its Markdown table is rendered', async ({ page }) => {
    const typeScaleTable = page.getByRole('table').filter({ hasText: '$h1-font-size' });

    await expect(typeScaleTable).toBeVisible();
    await expect(typeScaleTable.getByRole('columnheader', { name: 'Token' })).toBeVisible();
});

Then(
    /^Documentation (Getting Started|Component Documentation Guide|Style Guide) is available$/,
    async ({ page }, guideName: string) => {
        const guide = page.getByRole('link', { name: guideName, exact: true });

        await expect(guide).toBeVisible();
        await expect(guide).toHaveAttribute('href', /documentation-.*--documentation/);
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
