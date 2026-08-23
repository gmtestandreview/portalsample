import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'ClientApp/src'),
        },
    },
    test: {
        projects: [
            './vitest.unit.config.ts',
            './vitest.storybook.config.ts',
        ],
    },
}); 
