import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/runtime',
    timeout: 30_000,
    fullyParallel: false,
    use: {
        headless: true,
        viewport: { width: 1280, height: 900 },
    },
    reporter: [['list']],
});
