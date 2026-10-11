---
title: Compare happy-dom With jsdom
impact: HIGH
impactDescription: A lighter DOM environment can reduce environment cost when its behavior is sufficient for the tested code.
tags: perf, happy-dom, jsdom, environment, dom-testing
---

# Compare happy-dom With jsdom

Use this reference when Vitest `environment` time is material and the suite currently uses `jsdom`.

Do not assume `happy-dom` is a drop-in replacement or a fixed multiple faster. Treat the environment change as a compatibility-sensitive benchmark.

## Experiment

Compare the same representative tests under each environment:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
  },
})
```

Files that require a different environment can opt in explicitly:

```ts
/**
 * @vitest-environment jsdom
 */
```

For larger groups in Vitest 4, use projects rather than the removed `environmentMatchGlobs` option:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'fast-dom',
          include: ['tests/dom/**/*.test.ts'],
          environment: 'happy-dom',
        },
      },
      {
        test: {
          name: 'jsdom-required',
          include: ['tests/jsdom-required/**/*.test.ts'],
          environment: 'jsdom',
        },
      },
    ],
  },
})
```

## Compatibility checks

Before keeping `happy-dom`, verify the APIs and browser behavior the affected tests actually exercise, including third-party-library assumptions. Preserve `jsdom` where behavior differs or required APIs are unsupported.

Compare:

- total and `environment` duration;
- failures and snapshot/output changes;
- DOM/event behavior relevant to the application;
- memory if it is part of the original bottleneck;
- repeatability across the supported Node/Vitest environment.

## Decision rule

Keep the faster environment only when the affected tests remain behaviorally representative. A faster substitute that weakens coverage of required browser behavior is not an optimization.

## Source boundary

Vitest supports both `jsdom` and `happy-dom` environments. Performance and compatibility depend on the tested workload and library versions.

- <https://v4.vitest.dev/config/environment>
- <https://v4.vitest.dev/guide/environment>
- <https://github.com/capricorn86/happy-dom>
