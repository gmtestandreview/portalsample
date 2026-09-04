import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { playwright } from '@vitest/browser-playwright';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { defineConfig } from 'vitest/config';
import { storybookCoverageConfig } from './vitest.storybook.coverage';
import { storybookVitestRuntimePlugin } from './vitest.storybook.runtime';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vitest config for running Storybook story play-function tests in isolation.
 *
 * Usage:
 *   npm run test:storybook          (single run)
 *   npm run test:storybook:watch    (watch mode)
 *
 * The storybookTest plugin compiles stories via the Storybook Vite pipeline and
 * executes their play() functions in Chromium through Vitest Browser Mode.
 */
export default defineConfig({
    plugins: [
        storybookTest({ configDir: path.join(dirname, '.storybook') }),
        storybookVitestRuntimePlugin,
    ],
    test: {
        name: 'storybook',
        // Single run unless `--watch` is passed (see `test:storybook:watch`).
        // A resident watch process here accumulates the Vite module graph and
        // v8 coverage data in Browser Mode until it exhausts the Node heap.
        watch: false,
        globals: true,
        setupFiles: ['./vitest.storybook.setup.ts'],
        testTimeout: 15000,
        coverage: storybookCoverageConfig,
        // The addon keeps this project alive for MCP-triggered runs. A single
        // orchestrator prevents broad runs from exhausting the shared browser
        // and leaving a ready session whose orchestrator has disconnected.
        maxWorkers: 1,
        browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
        },
    },
});
