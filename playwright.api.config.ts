import process from 'node:process';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/api-contract',
  outputDir: 'reports/test-results/api-contract',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    [
      'html',
      { open: 'never', outputFolder: 'reports/playwright/api-contract' },
    ],
    ['list'],
  ],
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'api-contract',
    },
  ],
});
