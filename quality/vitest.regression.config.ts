import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        setupFiles: ['vitest.setup.ts'],
        include: ['quality/test_regression.ts'],
        globals: true,
    },
});
