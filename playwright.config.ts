import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
    outputDir: '.features-gen/app',
    features: [
        'tests/e2e/features/account/**/*.feature',
        'tests/e2e/features/auth/**/*.feature',
        'tests/e2e/features/quote/**/*.feature',
        'tests/e2e/features/reports/**/*.feature',
        'tests/e2e/features/resilience/**/*.feature',
        'tests/e2e/features/rfq/**/*.feature',
    ],
    steps: [
        'tests/e2e/steps/{account,account-maintenance,common,copy-rfq,failure,quote,report,rfq-lifecycle}.steps.ts',
        'tests/e2e/support/fixtures.ts',
    ],
});

export default defineConfig({
    testDir,
    outputDir: 'reports/test-results/app',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
        ['html', { open: 'never', outputFolder: 'reports/playwright/app' }],
        ['list'],
    ],
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [{
        name: 'app-bdd',
        use: { ...devices['Desktop Chrome'] },
    }],
    webServer: {
        command: 'npm start',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
