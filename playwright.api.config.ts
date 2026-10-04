import process from 'node:process';
import { defineConfig } from '@playwright/test';

const isCi = Boolean(process.env['CI']);

export default defineConfig({
  testDir: 'tests/api-contract',
  outputDir: 'reports/test-results/api-contract',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  ...(isCi ? { workers: 1 } : {}),
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
