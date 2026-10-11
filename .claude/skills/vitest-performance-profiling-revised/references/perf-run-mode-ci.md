---
title: Use Explicit Run Mode in CI
impact: MEDIUM
impactDescription: Makes one-shot CI execution explicit and avoids accidental watch-mode configuration.
tags: perf, ci, run-mode, watch, configuration
---

# Use Explicit Run Mode in CI

Use this reference when reviewing CI invocation or diagnosing a job that remains interactive, watches files, or does not exit as expected.

Vitest 4 already selects run mode automatically when `CI` is present or the terminal is non-interactive. `vitest run` is still a clear, deterministic CI command.

## Recommended CI invocation

```yaml
jobs:
  test:
    env:
      CI: true
    steps:
      - run: pnpm exec vitest run
```

Equivalent configuration can make the mode explicit:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    watch: !process.env.CI,
  },
})
```

Do not claim a general startup speedup merely from replacing an invocation that Vitest already auto-detects as run mode.

## Check when a CI job hangs

Verify:

- the command is not explicitly forcing `--watch`;
- `CI`/TTY detection matches the runner;
- no custom reporter/server/plugin keeps the process open;
- the hang is not caused by open handles or unfinished async work.

## Decision rule

Prefer `vitest run` in CI for clarity and one-shot semantics. Treat it as CI hygiene unless measurement shows an actual watch-mode misconfiguration was consuming time or preventing exit.

## Source boundary

Vitest 4 defaults to watch mode in interactive development and run mode in CI or non-interactive shells.

- <https://v4.vitest.dev/config/watch>
- <https://v4.vitest.dev/guide/cli>
