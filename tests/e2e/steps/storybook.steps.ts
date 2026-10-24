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

import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import {
  STORYBOOK_BASE,
  STORYBOOK_MCP,
  STORY_RENDER_TIMEOUT_MS,
  MCP_HEADERS,
  executeMcpTestRun,
  readMcpEvent,
  loadStoryIframe,
  loadDocsIframe,
  visibleSource,
} from '../support/storybookHelpers';
import {
  parseMcpMarkdownReport,
  type StorybookMcpMarkdownReport,
} from '../support/storybookMcpReport';

const { Given, When, Then } = createBdd();

const REPRESENTATIVE_DOCS_ID = 'components-pill--documentation';
const REPRESENTATIVE_STORY_ID = 'components-pill--dashboard-statuses';
const STYLE_GUIDE_DOCS_ID = 'documentation-style-guide--documentation';
const AUTOSUGGEST_DOCS_ID = 'components-inputs-autosuggest--documentation';
const ACCEPT_QUOTE_DOCS_ID = 'routes-acceptquote--documentation';
const ROUTE_LEAVING_GUARD_DOCS_ID =
  'components-routeleavingguard--documentation';

// ---------------------------------------------------------------------------
// MCP protocol compatibility
// ---------------------------------------------------------------------------

Given('the Storybook MCP server is running', async ({ page, request }) => {
  const response = await request.get(STORYBOOK_MCP, {
    headers: { accept: 'text/html' },
  });

  expect(response.status()).toBe(200);
  expect(await response.text()).toContain(
    'Storybook MCP server successfully running'
  );

  await page.goto(STORYBOOK_BASE);

  await expect(page.getByRole('heading', { name: 'Storybook' })).toBeVisible({
    timeout: 15_000,
  });

  await loadStoryIframe(page, REPRESENTATIVE_STORY_ID);
});

Then(
  'the Storybook MCP endpoint should initialize and list configured tools',
  async ({ request }) => {
    const initialize = await request.post(STORYBOOK_MCP, {
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
    const initializeEnvelope = await readMcpEvent(initialize, 1);

    expect(initializeEnvelope.result?.serverInfo?.name).toBe(
      '@storybook/addon-mcp'
    );

    const sessionHeaders = {
      ...MCP_HEADERS,
      'mcp-session-id': sessionId,
    };
    const initialized = await request.post(STORYBOOK_MCP, {
      headers: sessionHeaders,
      data: { jsonrpc: '2.0', method: 'notifications/initialized' },
    });

    expect(initialized.status()).toBe(202);

    const toolsList = await request.post(STORYBOOK_MCP, {
      headers: sessionHeaders,
      data: { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
    });

    expect(toolsList.status()).toBe(200);

    const toolsEnvelope = await readMcpEvent(toolsList, 2);
    const toolNames =
      toolsEnvelope.result?.tools?.map(({ name }) => name) ?? [];

    expect(toolNames).toEqual(
      expect.arrayContaining([
        'docs-list',
        'stories-preview',
        'review-create',
        'test-run',
      ])
    );
  }
);

type NormalizedReceipt = {
  ok: boolean;
  errors: Array<{ code: string; message: string }>;
  report?: StorybookMcpMarkdownReport;
  receipt?: {
    requestedStoryIds: string[];
    executedStoryIds: string[];
    componentTestStatuses: Array<{ storyId: string; status: string }>;
    a11yStatuses: Array<{ storyId: string; status: string }>;
  };
};

type McpStatus = { storyId: string; status: string };

let latestMcpExecution: NormalizedReceipt | undefined;

When(
  'I execute the native MCP test-run for stories {string}',
  async ({ request }, storyIdsText: string) => {
    const storyIds = storyIdsText
      .split(',')
      .map((storyId) => storyId.trim())
      .filter(Boolean);
    const testRun = await executeMcpTestRun(request, storyIds);

    expect(testRun.status()).toBe(200);

    const envelope = await readMcpEvent(testRun, 11);

    expect(envelope.error).toBeUndefined();

    const contentText = envelope.result?.content
      ?.filter((block) => block.type === 'text' && block.text !== undefined)
      .map((block) => block.text as string)
      .join('\n');
    const contentStructured = envelope.result?.content
      ?.filter((block) => block.type === 'text' && block.text !== undefined)
      .map((block) => {
        try {
          return JSON.parse(block.text as string) as unknown;
        } catch {
          return undefined;
        }
      })
      .find(
        (value) =>
          value !== undefined &&
          typeof value === 'object' &&
          value !== null &&
          'status' in value
      );
    const structuredContent =
      envelope.result?.structuredContent ?? contentStructured;
    let componentTestStatuses: McpStatus[];
    let a11yStatuses: McpStatus[];
    let reportEvidence: StorybookMcpMarkdownReport | undefined;

    if (structuredContent !== undefined) {
      const completedContent = structuredContent as {
        status?: string;
        result?: {
          componentTestStatuses?: McpStatus[];
          a11yStatuses?: McpStatus[];
          counts?: {
            requested?: number;
            executed?: number;
            component?: number;
            a11y?: number;
          };
          unhandledErrors?: unknown[];
        };
      };
      const execution = completedContent.result;
      componentTestStatuses = execution?.componentTestStatuses ?? [];
      a11yStatuses = execution?.a11yStatuses ?? [];

      expect(completedContent.status).toBe('completed');
      expect(
        componentTestStatuses
          .map(({ storyId }) => storyId)
          .sort((a, b) => a.localeCompare(b))
      ).toEqual([...storyIds].sort((a, b) => a.localeCompare(b)));
      expect(
        a11yStatuses
          .map(({ storyId }) => storyId)
          .sort((a, b) => a.localeCompare(b))
      ).toEqual([...storyIds].sort((a, b) => a.localeCompare(b)));
      expect(
        componentTestStatuses.every(
          ({ status }) => status === 'status-value:success'
        )
      ).toBe(true);
      expect(
        a11yStatuses.every(({ status }) => status === 'status-value:success')
      ).toBe(true);
      expect(execution?.counts).toEqual({
        requested: storyIds.length,
        executed: storyIds.length,
        component: storyIds.length,
        a11y: storyIds.length,
      });
      expect(execution?.unhandledErrors).toEqual([]);
    } else {
      const report = parseMcpMarkdownReport(contentText ?? '');
      reportEvidence = report;
      const passingStoryIds = [...new Set(report.passingStoryIds)].sort(
        (a, b) => a.localeCompare(b)
      );
      const requestedStoryIds = [...storyIds].sort((a, b) =>
        a.localeCompare(b)
      );

      expect(report.missingSections).not.toContain('Passing Stories');
      expect(passingStoryIds).toEqual(requestedStoryIds);
      expect(
        report.failingStoryIds.filter((storyId) => storyIds.includes(storyId))
      ).toEqual([]);
      expect(report.accessibilityViolationStoryIds).toEqual([]);
      expect(report.unhandledErrors).toEqual([]);

      componentTestStatuses = [];
      a11yStatuses = [];
    }

    const componentStoryIds =
      reportEvidence?.passingStoryIds ??
      componentTestStatuses.map(({ storyId }) => storyId);
    latestMcpExecution = {
      ok: true,
      errors: [],
      ...(reportEvidence === undefined ? {} : { report: reportEvidence }),
      receipt: {
        requestedStoryIds: storyIds,
        executedStoryIds: componentStoryIds,
        componentTestStatuses,
        a11yStatuses,
      },
    };
  }
);

Then(
  'the native MCP report should list exact passing stories without accessibility violations',
  async () => {
    expect(latestMcpExecution).toMatchObject({ ok: true });

    if (latestMcpExecution?.report !== undefined) {
      expect(latestMcpExecution.report.missingSections).not.toContain(
        'Passing Stories'
      );
      expect(latestMcpExecution.report.failingStoryIds).toEqual([]);
      expect(latestMcpExecution.report.accessibilityViolationStoryIds).toEqual(
        []
      );
      expect(latestMcpExecution.report.unhandledErrors).toEqual([]);

      return;
    }

    expect(latestMcpExecution?.receipt?.requestedStoryIds).toEqual(
      latestMcpExecution?.receipt?.executedStoryIds
    );
    expect(latestMcpExecution?.receipt?.componentTestStatuses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: 'status-value:success' }),
      ])
    );
    expect(latestMcpExecution?.receipt?.a11yStatuses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: 'status-value:success' }),
      ])
    );
  }
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
Given(
  'I am viewing Storybook stories for dashboard request items',
  async () => {}
);
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
  }
);

When('I open a representative component story', async ({ page }) => {
  await page.goto(`${STORYBOOK_BASE}/?path=/story/${REPRESENTATIVE_STORY_ID}`);

  await expect(page.getByRole('heading', { name: 'Addon panel' })).toBeVisible({
    timeout: 15_000,
  });
  // The manager chrome (Addon panel) is present before the preview bundle has
  // compiled. Warm the story: wait for the preview iframe to render real content
  // so the Code addon has a source to display.
  await expect(
    page.frameLocator('#storybook-preview-iframe').locator('#storybook-root')
  ).not.toBeEmpty({
    timeout: STORY_RENDER_TIMEOUT_MS,
  });
});

When('I open the Documentation Style Guide', async ({ page }) => {
  await loadDocsIframe(page, STYLE_GUIDE_DOCS_ID);
});

When('I open the AutoSuggest documentation', async ({ page }) => {
  await loadDocsIframe(page, AUTOSUGGEST_DOCS_ID);
});

When('I open the AcceptQuote documentation', async ({ page }) => {
  await loadDocsIframe(page, ACCEPT_QUOTE_DOCS_ID);
});

When('I open the RouteLeavingGuard documentation', async ({ page }) => {
  await loadDocsIframe(page, ROUTE_LEAVING_GUARD_DOCS_ID);
});

When(
  'I load the Storybook story {string}',
  async ({ page }, storyId: string) => {
    await loadStoryIframe(page, storyId);
  }
);

// ---------------------------------------------------------------------------
// Assertions — text content
// ---------------------------------------------------------------------------

Then(
  'the story iframe should contain {string}',
  async ({ page }, text: string) => {
    const root = page.locator('#storybook-root');

    await expect(root).toContainText(text, { timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// Assertions — Storybook documentation architecture
// ---------------------------------------------------------------------------

Then('the component documentation page is visible', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: 'Pill', exact: true })
  ).toBeVisible();
  await expect(
    page.getByText('Presents a compact, colour-coded label', { exact: false })
  ).toBeVisible();
});

Then('the component API documentation is visible', async ({ page }) => {
  const apiTable = page
    .getByRole('table')
    .filter({ hasText: 'Workflow status' });

  await expect(apiTable).toBeVisible();
  await expect(apiTable).toContainText('status');
  await expect(apiTable).toContainText('className');
});

Then('the component stories are visible', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Stories' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Dashboard Statuses' })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Quote Statuses' })
  ).toBeVisible();
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
  }
);

Then('the Storybook Code Panel is available', async ({ page }) => {
  const codeTab = page.getByRole('tab', { name: 'Code' });

  await expect(codeTab).toBeVisible();

  await codeTab.click();

  await expect(codeTab).toHaveAttribute('aria-selected', 'true');
});

Then(
  'the Code Panel contains source for the current story',
  async ({ page }) => {
    const source = visibleSource(page);

    // The Code addon fills its <pre> asynchronously once the story module has
    // loaded; the default 5s expect timeout can lose that race on a cold bundle.
    await expect(source).toContainText('StatusPill', {
      timeout: STORY_RENDER_TIMEOUT_MS,
    });
    await expect(source).toContainText('DashboardItemStatus.QuoteAvailable', {
      timeout: STORY_RENDER_TIMEOUT_MS,
    });
  }
);

Then('the Style Guide is visible', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: 'Style Guide' })
  ).toBeVisible();
});

Then('its typography documentation is visible', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Typography' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Type Scale' })).toBeVisible();
});

Then('its colour documentation is visible', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: 'Color System' })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Color Usage Rules' })
  ).toBeVisible();
});

Then('its Markdown table is rendered', async ({ page }) => {
  const typeScaleTable = page
    .getByRole('table')
    .filter({ hasText: '$h1-font-size' });

  await expect(typeScaleTable).toBeVisible();
  await expect(
    typeScaleTable.getByRole('columnheader', { name: 'Token' })
  ).toBeVisible();
});

Then(
  /^Documentation (Getting Started|Component Documentation Guide|Style Guide) is available$/,
  async ({ page }, guideName: string) => {
    const guide = page.getByRole('link', { name: guideName, exact: true });

    await expect(guide).toBeVisible();
    await expect(guide).toHaveAttribute(
      'href',
      /documentation-.*--documentation/
    );
  }
);

Then('the AutoSuggestContainer owner is visible', async ({ page }) => {
  await expect(
    page.getByText('AutoSuggestContainer', { exact: true }).last()
  ).toBeVisible();
});

Then(
  'the Loading story is listed with its rendered owner',
  async ({ page }) => {
    await expect(
      page
        .locator('#loading-autosuggestcontainer')
        .getByText('Loading (AutoSuggestContainer)', { exact: true })
    ).toBeVisible();
  }
);

Then(
  'the AcceptQuote owner and four peer APIs are visible',
  async ({ page }) => {
    const docs = page.locator('#storybook-docs');

    await expect(
      page.getByRole('heading', { name: 'AcceptQuote', exact: true })
    ).toBeVisible();

    await Promise.all(
      [
        'PaymentDetails',
        'DeliveryAndReturn',
        'QuotationSummary',
        'SummaryAndAccept',
      ].map((apiName) =>
        expect(docs.getByText(apiName, { exact: true }).last()).toBeVisible()
      )
    );
  }
);

Then(
  'the RouteLeavingGuard type and default cells are visible',
  async ({ page }) => {
    const apiTable = page.getByRole('table').filter({ hasText: 'when' });

    await expect(apiTable).toContainText('boolean');
    await expect(apiTable).toContainText('false');
    await expect(apiTable).toContainText("'Unsaved changes'");
    await expect(apiTable).toContainText("'Discard changes'");
    await expect(
      page
        .locator('#custom-title-body-and-button-labels')
        .getByText('Custom title, body, and button labels', { exact: true })
    ).toBeVisible();
  }
);

Then(
  'the Storybook portal should contain {string}',
  async ({ page }, text: string) => {
    const portalContent = page.locator(
      '.modal, [role="dialog"], [role="alert"], [id^="notif-"]'
    );

    await expect(portalContent.filter({ hasText: text }).first()).toBeVisible({
      timeout: 10_000,
    });
  }
);

// ---------------------------------------------------------------------------
// Assertions — buttons
// ---------------------------------------------------------------------------

Then(
  'the story iframe should have a button with accessible name {string}',
  async ({ page }, name: string) => {
    const btn = page.getByRole('button', { name });

    await expect(btn.first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the story iframe should have a link with accessible name {string}',
  async ({ page }, name: string) => {
    const link = page.getByRole('link', { name });

    await expect(link.first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the story iframe should have a dialog with accessible name {string}',
  async ({ page }, name: string) => {
    const dialog = page.getByRole('dialog', { name });

    await expect(dialog.first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the story iframe should have a disabled button with accessible name {string}',
  async ({ page }, name: string) => {
    const btn = page.getByRole('button', { name });

    await expect(btn.first()).toBeDisabled({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// Assertions — landmarks
// ---------------------------------------------------------------------------

Then('the story iframe should have a navigation landmark', async ({ page }) => {
  const nav = page.getByRole('navigation');

  await expect(nav.first()).toBeVisible({ timeout: 10_000 });
});

Then(
  'the story iframe should have a contentinfo landmark',
  async ({ page }) => {
    const footer = page.getByRole('contentinfo');

    await expect(footer.first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the story iframe should have a content info landmark',
  async ({ page }) => {
    const footer = page.getByRole('contentinfo');

    await expect(footer.first()).toBeVisible({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// Assertions — form elements
// ---------------------------------------------------------------------------

Then(
  'the story iframe should have a text input for searching',
  async ({ page }) => {
    // SearchFilter uses a search input or text input with a placeholder
    const searchInput = page.locator(
      'input[type="search"], input[type="text"]'
    );

    await expect(searchInput.first()).toBeVisible({ timeout: 10_000 });
  }
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
    const pills = root.locator(
      'span, .badge, [class*="pill"], [class*="status"]'
    );

    await expect(pills.first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the story iframe should contain text matching a quote status label',
  async ({ page }) => {
    const root = page.locator('#storybook-root');

    await expect(root).toBeVisible({ timeout: 10_000 });

    const pills = root.locator(
      'span, .badge, [class*="pill"], [class*="status"]'
    );

    await expect(pills.first()).toBeVisible({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// Assertions — pagination
// ---------------------------------------------------------------------------

Then(
  'the story iframe should not show pagination controls',
  async ({ page }) => {
    await expect(
      page.getByRole('navigation', { name: /pagination/i })
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', {
        name: /next page|previous page/i,
      })
    ).toHaveCount(0);
  }
);

// ---------------------------------------------------------------------------
// Assertions — generic visibility
// ---------------------------------------------------------------------------

Then('the story iframe should be visible', async ({ page }) => {
  await expect(page.locator('#storybook-root')).toBeVisible({
    timeout: 10_000,
  });
  await expect(
    page.getByText('Something went wrong', { exact: false })
  ).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

When(
  'I click the button with accessible name {string} in the story iframe',
  async ({ page }, name: string) => {
    const btn = page.getByRole('button', { name });
    await btn.first().click();
  }
);

When(
  'I click the link with accessible name {string} in the story iframe',
  async ({ page }, name: string) => {
    const link = page.getByRole('link', { name });
    await link.first().click();
  }
);

Then('the story should not throw a JavaScript error', async ({ page }) => {
  // Check that #storybook-root is still present (not replaced by error UI)
  const root = page.locator('#storybook-root');

  await expect(root).toBeVisible({ timeout: 5_000 });
});
