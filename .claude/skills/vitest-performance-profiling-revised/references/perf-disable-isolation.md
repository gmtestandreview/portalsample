---
title: Disable Test Isolation When Safe
impact: HIGH
impactDescription: Can reduce environment/setup overhead when cross-file shared state is controlled.
tags: perf, isolation, no-isolate, speed, configuration
---

# Disable Test Isolation When Safe

Use this reference only when profiling shows material environment/setup or per-file isolation overhead.

Vitest 4 defaults `test.isolate` to `true`. Disabling isolation can improve performance, but files in a worker can then share module/global state.

## Experiment

Compare the same suite with and without isolation:

```bash
pnpm exec vitest run
pnpm exec vitest run --no-isolate
```

For a controlled subset, use Vitest projects:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts'],
          isolate: false,
        },
      },
      {
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          isolate: true,
        },
      },
    ],
  },
})
```

## Safety checks

Before keeping `isolate: false`, verify that the affected files:

- restore globals, mocks, fake timers, and environment mutations;
- do not depend on test-file order;
- do not leak module singleton state between files;
- keep the same intended test count and pass/fail behavior across repeated runs and order changes.

`test.isolate` has no effect on `vmThreads` or `vmForks`.

If `setupFiles` are used, remember they still execute before each test file while imported modules can remain cached when isolation is disabled.

## Decision rule

Keep isolation unless a repeatable performance gain survives contamination, order-dependence, and regression checks. Prefer limiting no-isolation to a demonstrated-safe project subset over disabling it globally.

## Source boundary

Vitest documents that disabling isolation *might* improve performance. Do not treat fixed percentage speedups or memory reductions as project-independent facts.

- <https://v4.vitest.dev/config/isolate>
- <https://v4.vitest.dev/guide/recipes>
- <https://v4.vitest.dev/config/setupfiles>
