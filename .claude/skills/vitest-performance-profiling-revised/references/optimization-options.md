# Vitest 5 Optimization Options

Load this reference only after profiling identifies a matching bottleneck or
scaling problem. It applies to Vitest 5.x; options marked **5.1+** require the
installed release to be checked before use.

Use the repository's package manager and installed Vitest for every comparison.
Examples use `pnpm exec vitest`; replace that prefix with the repository's
equivalent command without changing package managers or downloading another
Vitest version.

## Test isolation

Keep the default isolated execution unless measurement shows that environment,
worker, or repeated module setup dominates the run:

```bash
pnpm exec vitest run --no-isolate
```

or:

```ts
test: {
  isolate: false,
}
```

Isolation-off runs share module state and the environment within a worker.
Validate order independence, mocks, fake timers, globals, browser APIs, and
cleanup. Prefer `vitest doctor` to measure the alternative and check whether the
suite still passes. A project can scope `isolate: false` to a controlled subset
with separate `projects` entries.

`vmThreads` cannot disable isolation. If shared state is safe and isolation is
the dominant cost, compare `threads` with `isolate: false` instead. In Vitest
5.1+, reused workers cache setup-file resolution, mocks, and warm modules, so
the optimization can be valuable, but it does not remove the need for
contamination checks.

## File parallelism and worker count

Keep `fileParallelism: true` unless startup, CPU, memory, or external-resource
contention is demonstrated. Compare one-file-at-a-time execution:

```bash
pnpm exec vitest run --no-file-parallelism
```

or bound workers in configuration:

```ts
test: {
  maxWorkers: 4,
}
```

Treat worker counts as machine- and suite-specific experiments. Disabling file
parallelism affects concurrency between files; it does not serialize tests
inside one file.

## Test environments

DOM environments can dominate a run because a fresh environment is created per
file under the default isolated pools. Compare only when the `environment` phase
is large:

| Configuration                       | Environment lifetime                       | Main trade-off                                                           |
| ----------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| `forks`/`threads` + `isolate: true` | Once per file                              | Safest; usually most setup work                                          |
| `vmThreads`                         | Once per worker, fresh VM context per file | Cross-realm `instanceof` edge cases and less reliable memory reclamation |
| `threads` + `isolate: false`        | Once per worker                            | Shared `window` and module state; requires strong cleanup                |

`happy-dom` is generally cheaper to create than `jsdom`, but changing the
environment can change browser behavior. Use real DOM/browser assertions where
fidelity matters and keep the existing environment contract unless the suite
supports the change.

## Narrow test discovery safely

If discovery scans large irrelevant trees, narrow the starting directory and
patterns:

```ts
test: {
  dir: './tests',
  include: ['**/*.{test,spec}.{ts,tsx}'],
}
```

`dir` controls where discovery starts; `include` and `exclude` control which
files qualify. Compare the discovered file list before and after. Do not omit
colocated, integration, Storybook, or other legitimate tests to improve a
number.

### Affected reruns in Vitest 5.1+

For fast feedback after an edit, the experimental `--since-last-run` option
records the files each test loaded, including dynamic imports, mocks, setup
files, and snapshots:

```bash
pnpm exec vitest run --since-last-run
```

The first run is full. Later runs select tests whose recorded inputs changed or
were deleted, and rerun tests that failed previously until they pass. This is a
development feedback optimization, not a replacement for a full suite before
completion. Verify the installed 5.1+ release and keep the final full run.

## Filesystem module cache

In Vitest 5, `fsModuleCache` is stable and enabled by default. It persists
transformed modules across reruns and separate Vitest processes:

```ts
test: {
  fsModuleCache: true,
}
```

The cache is workspace-wide, normally under `node_modules`. Use
`fsModuleCachePath` when the repository needs another location, and clear it
with:

```bash
pnpm exec vitest --clearCache
```

It currently does not affect Browser Mode. Cache keys include file content, the
module id, Vite environment configuration, and coverage status, but plugin
options and other external inputs can still make a cache stale. Do not carry
forward the Vitest 4 form `experimental.fsModuleCache`; verify the installed
types if explicitly configuring the option. Plugin authors should use
`defineCacheKeyGenerator` for dynamic inputs or opt a module out of caching.

Compare cold and warm runs, and validate correctness after Vite/plugin changes.

## Node compile cache

Vitest 5 can reuse Node's on-disk V8 bytecode for Vitest's own modules and
externalized dependencies:

```bash
NODE_COMPILE_CACHE=node_modules/.cache/node-compile-cache pnpm exec vitest run
```

The first run pays the serialization cost, so retain the directory between runs
or in a CI cache before judging the result. `NODE_DISABLE_COMPILE_CACHE=1`
overrides it. Vitest disables the worker compile cache when the `v8` coverage
provider is enabled because cached scripts lack the source positions needed for
precise coverage.

## Worker pools

Vitest 5 defaults to `forks`, which is the compatibility baseline. Compare
`threads` only when worker overhead is material:

```bash
pnpm exec vitest run --pool=forks
pnpm exec vitest run --pool=threads
```

Measure duration, peak memory, failures, hangs, native-module compatibility, and
repeatability. `vmThreads` and `vmForks` are specialized choices for VM contexts
and memory-sensitive suites; do not select them as a first tuning step. They may
improve environment or module reuse while introducing cross-realm and memory
trade-offs.

## Test sharding

Use sharding when suite size, CI wall-clock time, or a high-core machine
justifies multiple independent Vitest processes:

```bash
pnpm exec vitest run --reporter=blob --shard=1/3
pnpm exec vitest run --reporter=blob --shard=2/3
pnpm exec vitest run --reporter=blob --shard=3/3
pnpm exec vitest run --merge-reports
```

Vitest shards test files, not individual test cases. Include process startup,
duplicated setup, artifact upload/download, report merging, attachments, and
memory use in the comparison. On high-core machines, sharding can distribute
load across multiple Vite main processes; use `VITEST_MAX_WORKERS` to avoid
oversubscription and measure the total job cost, not only one shard.

## Coverage performance

Run coverage separately from the normal performance baseline. Compare
coverage-on to coverage-on, preserve the intended source set, and inspect
coverage-specific phase or debug output before changing configuration.

Vitest 5 improves coverage throughput: the `v8` provider bounds memory while
merging reports and uses precompiled globs, and both providers send less data
over RPC. These are release improvements, not a reason to remove legitimate
source from coverage. Remember that the `v8` provider disables Node's worker
compile cache; do not compare a coverage run with a non-coverage run as if they
were equivalent.

## Lifecycle costs

Use lifecycle ownership to locate repeated setup:

- `globalSetup` is for expensive one-time work such as database seeding or
  server startup.
- `setupFiles` run before each test file; avoid heavy work when many files are
  present.
- Prefer `beforeAll` over `beforeEach` for expensive setup that does not need
  per-test isolation.
- Disabling isolation can improve performance, but it does not stop setup files
  from running for each file.
- Pool selection controls parallelization and the APIs available to tests.

Do not move setup solely to make timings smaller if it changes ownership,
cleanup, or test independence.

## Benchmarking performance changes

Use repeated `vitest run` measurements for test-run performance. Vitest's
`bench` fixture measures function-level benchmarks and should not replace a
runner baseline.

Benchmark files are selected by `benchmark.include` (default
`**/*.{bench,benchmark}.?(c|m)[jt]s?(x)`) and run in their own project, separate
from regular test files. The `vitest` command ignores them unless
`benchmark.enabled: true` is set; `vitest bench` runs only benchmarks and
enables that option implicitly. The `bench` fixture comes from the test context
and is available only inside those files, so using it in a regular test file
throws. Use `bench.compare()` for alternatives, `writeResult`/`bench.from()` for
stored baselines, and `toBeFasterThan`/`toBeSlowerThan` with a `delta` when
assertions need tolerance.

Keep benchmark results stable by running them away from competing CPU load,
using their sequential execution, retrying noisy assertions when justified, and
consuming computed results so the JavaScript engine cannot eliminate the work.
Be aware that Vite's module-runner export getters can dominate a microbenchmark
of a very hot imported function; treat the warning as a measurement concern, not
automatically as a production regression.

## Optimization decision rules

- Keep isolation unless a measured gain survives contamination and
  order-dependence checks.
- Keep normal file parallelism unless resource contention is demonstrated.
- Narrow discovery only when intended test-file coverage is unchanged.
- Use `fsModuleCache` only after cold/warm and stale-cache validation.
- Use Node compile cache only when its directory survives enough runs to repay
  the first-run cost.
- Prefer `forks` unless `threads` is repeatedly faster and compatible.
- Introduce sharding only when total CI wall-clock improvement justifies
  orchestration and resource cost.
- Treat Vitest benchmark results as noisy evidence; never keep a change from a
  single run.

## Source boundary

These rules are grounded in the Vitest 5 documentation and release notes:

- [Vitest 5 performance improvements](https://vitest.dev/blog/vitest-5#performance-improvements)
- [Vitest 5.1 performance improvements](https://vitest.dev/blog/vitest-5-1#performance-improvements)
- [Profiling test performance](https://vitest.dev/guide/profiling-test-performance#profiling-test-performance)
- [Improving performance](https://vitest.dev/guide/improving-performance)
- [Benchmarking](https://vitest.dev/guide/benchmarking)
- [Coverage performance](https://vitest.dev/guide/coverage#coverage-performance)
- [Lifecycle performance considerations](https://vitest.dev/guide/lifecycle#performance-considerations)
- [The `fsModuleCache` configuration](https://vitest.dev/config/fsmodulecache)

If the installed Vitest release disagrees with a version-sensitive example,
prefer the installed package's types and documentation, record the mismatch, and
mark the optimization `Needs Human Review` rather than guessing.
