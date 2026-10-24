import process from 'node:process';
import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { resolveStorybookTestTarget } from './.storybook/storybook-test-target';

const isCi = Boolean(process.env['CI']);
const storybookTestURL = process.env['STORYBOOK_TEST_URL'];
const storybookServerMode = process.env['STORYBOOK_TEST_SERVER_MODE'];
const storybookTarget = resolveStorybookTestTarget({
  ...(storybookTestURL === undefined ? {} : { url: storybookTestURL }),
  ...(storybookServerMode === undefined
    ? {}
    : { serverMode: storybookServerMode }),
  ci: isCi,
});

const testDir = defineBddConfig({
  aiFix: {
    promptAttachment: true,
  },
  outputDir: '.features-gen/storybook',
  features: 'tests/e2e/features/storybook/**/*.feature',
  steps: ['tests/e2e/steps/storybook.steps.ts'],
});

export default defineConfig({
  testDir,
  outputDir: 'reports/test-results/storybook',
  // The first MCP test-run can cold-start Vitest and compile browser tests.
  timeout: 180_000,
  // Storybook's preview compiler and MCP test runner share one browser state;
  // parallel BDD workers make docs and MCP scenarios race that state.
  fullyParallel: false,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { open: 'never', outputFolder: 'reports/playwright/storybook' }],
    ['list'],
  ],
  use: {
    baseURL: storybookTarget.baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'storybook-bdd',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  ...(storybookTarget.webServer === undefined
    ? {}
    : { webServer: storybookTarget.webServer }),
});
