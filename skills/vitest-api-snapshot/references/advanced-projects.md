---
name: projects-workspaces
description: Multi-project configuration for monorepos and different test types
---

# Projects

**Load when:** Set up or debug Vitest multi-project configuration, inheritance, or project selection. **Boundary:** Do not use for unrelated @playwright/test projects; referenced config files do not inherit root options.
 These are generic Vitest examples; inspect the installed version and
 applicable project config before applying them.

**Expected outcome:** The right Vitest project receives the right config without accidental inheritance. **Acceptance check:** Check inline-vs-referenced inheritance, project names, and selected scripts.

Run different Vitest test configurations under one invocation. For local
runner ownership and the cost of cross-project startup, inspect project policy;
do not silently fold standalone Playwright suites into a Vitest project.

## Basic Projects Setup

```ts
// vitest.config.ts
defineConfig({
  test: {
    projects: [
      // Glob patterns for config files
      'packages/*',

      // Inline config
      {
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          environment: 'jsdom',
        },
      },
    ],
  },
});
```

## Monorepo Pattern

```ts
defineConfig({
  test: {
    projects: [
      // Each package has its own vitest.config.ts
      'packages/core',
      'packages/cli',
      'packages/utils',
    ],
  },
});
```

Package config:

```ts
// packages/core/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'core',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
```

## Different Environments

Run same tests in different environments:

```ts
defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'happy-dom',
          root: './shared-tests',
          environment: 'happy-dom',
          setupFiles: ['./setup.happy-dom.ts'],
        },
      },
      {
        test: {
          name: 'node',
          root: './shared-tests',
          environment: 'node',
          setupFiles: ['./setup.node.ts'],
        },
      },
    ],
  },
});
```

## Browser + Node Projects

```ts
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'browser',
          include: ['tests/browser/**/*.test.ts'],
          browser: {
            enabled: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
```

## Shared Configuration

**Vitest 5 boundary:** inline projects default to `extends: true` and merge
root options (arrays such as `setupFiles` append); a referenced config file
or directory retains its own configuration and does not inherit root options.
The supplied nmi-portal workspace uses two referenced leaf configs.

```ts
// vitest.shared.ts
export const sharedConfig = {
  testTimeout: 10000,
  setupFiles: ['./tests/setup.ts'],
};

// vitest.config.ts
import { sharedConfig } from './vitest.shared';

defineConfig({
  test: {
    projects: [
      {
        test: {
          ...sharedConfig,
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        test: {
          ...sharedConfig,
          name: 'e2e',
          include: ['tests/e2e/**/*.test.ts'],
        },
      },
    ],
  },
});
```

## Project-Specific Dependencies

Each project can have different dependencies inlined:

```ts
defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'project-a',
          server: {
            deps: {
              inline: ['package-a'],
            },
          },
        },
      },
    ],
  },
});
```

## Running Specific Projects

```bash
# Run specific project
vitest --project unit
vitest --project integration

# Multiple projects
vitest --project unit --project e2e

# Select only the project(s) to run with repeated --project flags.
```

## Providing Values to Projects

Share values from config to tests:

```ts
// vitest.config.ts
defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'staging',
          provide: {
            apiUrl: 'https://staging.api.com',
            debug: true,
          },
        },
      },
      {
        test: {
          name: 'production',
          provide: {
            apiUrl: 'https://api.com',
            debug: false,
          },
        },
      },
    ],
  },
});

// In tests, use inject
import { inject } from 'vitest';

test('uses correct api', () => {
  const url = inject('apiUrl');
  expect(url).toContain('api.com');
});
```

## With Fixtures

```ts
const test = base.extend({
  apiUrl: ['/default', { injected: true }],
});

test('uses injected url', ({ apiUrl }) => {
  // apiUrl comes from project's provide config
});
```

## Project Isolation

Projects can use separate worker pools. Use a project-specific `pool` only
when supported by that project configuration; do not assume thread ownership:

```ts
defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'isolated',
          isolate: true, // Full isolation
          pool: 'forks',
        },
      },
    ],
  },
});
```

## Global Setup per Project

```ts
defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'with-db',
          globalSetup: ['./tests/db-setup.ts'],
        },
      },
    ],
  },
});
```

## Key Points

- Projects run in same Vitest process
- Each project can have different environment, config
- Use glob patterns for monorepo packages
- Run specific projects with `--project` flag
- Use `provide` to inject config values into tests
- Vitest 5 **inline** projects inherit root config by default; configs
  referenced by file/directory do **not**. Root `globalSetup` and other
  non-project options are special; consult the current projects guide.

<!--
Source references:
- https://vitest.dev/guide/projects.html
-->
