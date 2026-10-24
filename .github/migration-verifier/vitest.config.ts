import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    include: [
      '.github/migration-verifier/tests/static/**/*.spec.ts',
      '.github/migration-verifier/tests/host/**/*.spec.ts',
    ],
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@fixtures': path.resolve(dirname, './fixtures'),
    },
  },
});
