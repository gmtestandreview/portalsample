---
title: Choose the Right Worker Pool
impact: HIGH
impactDescription: Pool choice can change worker overhead, compatibility, and resource use.
tags: perf, pool, threads, forks, workers, configuration
---

# Choose the Right Worker Pool

Use this reference when profiling indicates worker startup, IPC, or process overhead is material.

Vitest 4 defaults to `forks`. Compare `threads` only as an experiment; some packages and native modules may not work correctly in worker threads.

## Experiment

```bash
pnpm exec vitest run --pool=forks
pnpm exec vitest run --pool=threads
```

If worker count is also a suspected bottleneck, test it separately with the Vitest 4 top-level option:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    pool: 'threads',
    maxWorkers: 4,
  },
})
```

Do not use legacy `poolOptions`, `minThreads`, or `maxThreads` examples with Vitest 4; pool-specific worker-count configuration was replaced by `maxWorkers`.

## Compatibility checks

Compare:

- total duration and startup overhead;
- peak memory/CPU;
- failures, hangs, and repeatability;
- native-module behavior;
- code that depends on process-only APIs.

`process.chdir()` is not available in worker threads. Treat `vmThreads` and `vmForks` as specialized pools rather than default performance choices.

## Decision rule

Keep `forks` as the compatibility baseline unless `threads` is repeatably faster for the actual suite and preserves correctness. Tune `maxWorkers` as a separate variable so pool and worker-count effects are not conflated.

## Source boundary

Vitest 4 reworked pool configuration and removed `poolOptions`; examples from earlier versions can be invalid.

- <https://v4.vitest.dev/guide/features>
- <https://v4.vitest.dev/config/pool>
- <https://v4.vitest.dev/config/maxworkers>
- <https://v4.vitest.dev/guide/migration>
