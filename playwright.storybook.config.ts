import process from 'node:process';
import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const isCi = Boolean(process.env['CI']);

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
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  ...(isCi ? { workers: 1 } : {}),
  reporter: [
    ['html', { open: 'never', outputFolder: 'reports/playwright/storybook' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:6006',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'storybook-bdd',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run storybook',
    url: 'http://localhost:6006',
    reuseExistingServer: !isCi,
    timeout: 120_000,
  },
});
