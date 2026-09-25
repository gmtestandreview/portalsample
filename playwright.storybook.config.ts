import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

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
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
        ['html', { open: 'never', outputFolder: 'reports/playwright/storybook' }],
        ['list'],
    ],
    use: {
        baseURL: 'http://localhost:6006',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [{
        name: 'storybook-bdd',
        use: { ...devices['Desktop Chrome'] },
    }],
    webServer: {
        command: 'npm run storybook',
        url: 'http://localhost:6006',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
