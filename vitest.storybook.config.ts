import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { playwright } from '@vitest/browser-playwright';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { defineConfig } from 'vitest/config';

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
    plugins: [storybookTest({ configDir: path.join(dirname, '.storybook') })],
    test: {
        name: 'storybook',
        globals: true,
        setupFiles: ['./vitest.storybook.setup.ts'],
        testTimeout: 15000,
        browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
        },
    },
});
