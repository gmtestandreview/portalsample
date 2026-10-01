import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import storybookProjectConfig from './vitest.storybook.config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// `@storybook/addon-vitest` boots its own Vitest child (dist/node/vitest.js),
// which sets VITEST_STORYBOOK=true at module load — before Vitest resolves this
// file — then calls createVitest() with `root` pointed at this directory and
// `project: ['storybook:<configDir>']`. Because `root` selects a *directory*, not
// a config file, that child always discovers this config, so it reaches the
// Storybook project through the `projects` indirection below.
//
// Measured on this repo, that indirection costs ~50s inside createVitest
// (48.8s / 55.7s via `projects` vs a stable 2.0-2.2s when the Storybook config is
// loaded directly) — the cost is the workspace indirection itself, not the number
// of projects listed. The addon aborts its child at a hard-coded 30s
// MAX_START_TIME, so that overhead alone consumed the whole budget and the child
// was killed with SIGTERM before it could report readiness.
//
// Handing the addon the Storybook project directly removes that overhead. No
// other entry point sets VITEST_STORYBOOK, so `vitest`, `test:all`, `test:unit`
// and `test:storybook` keep the aggregated workspace unchanged.
const isStorybookAddonChild = process.env.VITEST_STORYBOOK === 'true';

const workspaceConfig = defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(dirname, 'ClientApp/src'),
    },
  },
  test: {
    // One-off by default. A bare `vitest` (no `run`) otherwise sits in watch
    // mode "Waiting for file changes"; under coverage + Browser Mode that
    // long-lived process grows past the default Node heap and OOMs after a
    // few minutes. The `test:*:watch` scripts opt back in with `--watch`.
    watch: false,
    projects: ['./vitest.unit.config.ts', './vitest.storybook.config.ts'],
  },
});

export default isStorybookAddonChild ? storybookProjectConfig : workspaceConfig;
