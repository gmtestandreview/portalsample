# Vitest 4 Optimization Options

Load this reference only after profiling identifies a matching bottleneck or scaling problem.

## Test isolation

Default to:

```ts
test: {
  isolate: true,
}
```

Test no-isolation only when environment/setup overhead is material and shared state can be controlled:

```bash
pnpm exec vitest run --no-isolate
```

Disabling isolation can create cross-file contamination through globals, mocks, fake timers, browser APIs, module state, or other side effects.

For React component tests, preserve isolation unless repeated evidence shows a controlled subset remains independent without it.

`test.isolate` has no effect on the `vmThreads` and `vmForks` pools.

## File parallelism and worker count

Default to `fileParallelism: true`.

If CPU, memory, process startup, or resource contention is evident, compare:

```bash
pnpm exec vitest run --no-file-parallelism
```

or bounded workers such as:

```ts
test: {
  maxWorkers: 4,
}
```

Treat any worker count as an experiment, not a universal recommendation. Disabling file parallelism forces one file worker and does not change concurrency between tests inside one file.

## Narrow test discovery safely

Use `test.dir` when Vitest scans substantial irrelevant directory trees:

```ts
test: {
  dir: './tests',
  include: ['**/*.{test,spec}.{ts,tsx}'],
}
```

`dir` controls where discovery starts; `include` and `exclude` control which files qualify.

Before keeping a narrower search scope, verify the same intended test files are still discovered. Do not silently omit colocated, Storybook, integration, or other legitimate tests.

## Persistent module cache

For Vitest 4.0.11+ supporting `experimental.fsModuleCache`:

```ts
test: {
  experimental: {
    fsModuleCache: true,
  },
}
```

Or test temporarily:

```bash
pnpm exec vitest run --experimental.fsModuleCache
```

Compare cold and warm runs. If behavior becomes stale after Vite plugin or build-configuration changes, clear the cache:

```bash
pnpm exec vitest --clearCache
```

Because cache keys may not capture every plugin setting or external input, validate correctness against the actual Vite configuration before adopting persistent caching, especially in CI.

This cache currently does not affect Vitest Browser Mode.

## Worker pools

Use `forks` as the compatibility baseline and compare `threads` only when worker overhead is material:

```bash
pnpm exec vitest run --pool=forks
pnpm exec vitest run --pool=threads
```

Compare duration, peak memory, failures, hangs, and repeatability.

Threads can reduce overhead but may be incompatible with native modules, and `process.chdir()` is unavailable in worker threads.

Treat `vmThreads` and `vmForks` as specialized options because of VM-related memory and compatibility risks. Do not choose them as an initial optimization without a specific reason.

## Test sharding

Use sharding when suite size, CI wall-clock time, or a high-core machine justifies multiple independent Vitest processes.

Example across three runners:

```bash
pnpm exec vitest run --reporter=blob --shard=1/3
pnpm exec vitest run --reporter=blob --shard=2/3
pnpm exec vitest run --reporter=blob --shard=3/3
```

Collect blob reports and merge them:

```bash
pnpm exec vitest run --merge-reports
```

Vitest shards test files, not individual test cases, so equal file counts do not imply equal shard duration.

Include CI setup, artifact upload/download, report merging, memory use, and duplicated setup in the benchmark. Preserve any test attachments required by the merge step.

## Optimization decision rules

- Keep isolation unless a measured gain survives contamination and order-dependence checks.
- Keep normal file parallelism unless resource contention is demonstrated.
- Narrow discovery only when intended test-file coverage is unchanged.
- Use persistent caching only after cold/warm and clear-cache validation.
- Prefer `forks` unless `threads` is repeatedly faster and compatible.
- Introduce sharding only when total CI wall-clock improvement justifies orchestration and resource cost.

## Source boundary

These options are grounded in the Vitest 4 documentation. Treat examples and timing claims as experiments, not project predictions. If the installed major version is not 4, use the documentation for that installed version before applying flags or config.

- Profiling: <https://v4.vitest.dev/guide/profiling-test-performance.html>
- Performance: <https://v4.vitest.dev/guide/improving-performance.html>
- Isolation: <https://v4.vitest.dev/config/isolate>
- Experimental cache: <https://v4.vitest.dev/config/experimental>
