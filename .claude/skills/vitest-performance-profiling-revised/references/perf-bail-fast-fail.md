---
title: Use Bail for Fast Failure in CI
impact: MEDIUM
impactDescription: Can reduce time-to-feedback by stopping after a configured number of failures.
tags: perf, bail, ci, fail-fast, early-exit
---

# Use Bail for Fast Failure in CI

Use this reference when CI time is being spent continuing a run after enough failures are already known to make the job unsuccessful.

## Experiment

Compare the normal CI command with a bounded failure count:

```bash
pnpm exec vitest run
pnpm exec vitest run --bail=1
```

Or configure bail only in CI:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    bail: process.env.CI ? 1 : 0,
  },
})
```

`bail` controls how many test failures Vitest permits before stopping the run. Treat the threshold as a workflow decision, not a universal optimum.

## Keep only when

Keep bail when earlier termination materially improves feedback or compute use and the job does not require a complete failure inventory.

Do not use fail-fast mode for runs whose purpose is:

- collecting the full failure set;
- producing comprehensive coverage or diagnostics;
- investigating multiple related failures;
- generating artifacts that require the entire suite to finish.

If retries are enabled, verify the observed interaction between `retry` and `bail` in the installed Vitest release before relying on it for CI control flow.

## Measure

Record:

- time to first actionable failure;
- total CI duration and compute usage;
- failure information lost by early termination;
- whether downstream reporting/artifact steps still behave as intended.

## Source boundary

Vitest 4 exposes `bail` as a configuration/CLI option. Timing savings depend on where failures occur and cannot be predicted from test count alone.

- <https://v4.vitest.dev/config/bail>
- <https://v4.vitest.dev/guide/cli>
