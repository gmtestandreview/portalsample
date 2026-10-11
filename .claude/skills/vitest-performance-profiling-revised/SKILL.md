---
name: vitest-performance-profiling
description: Use when diagnosing or improving slow Vitest 4 test runs, startup, imports, transforms, setup, environments, memory, coverage, discovery, worker usage, repeated runs, or CI scaling; profile first, then test one targeted optimization at a time.
compatibility: Designed for Vitest 4 projects using Node.js; some diagnostics and optimizations are version-sensitive or experimental.
---

# Vitest Performance Profiling and Optimization

Diagnose why Vitest is slow before optimizing it. Treat phase timings, profiler output, repeated benchmarks, test counts, failures, and resource use as evidence.

Do not enable every optimization together. A faster run is not an improvement if tests are omitted, contaminated, unstable, or incompatible.

## Workflow

1. Confirm the installed Vitest major version is 4 before using version-sensitive or experimental options; otherwise use the matching version documentation.
2. Capture a reproducible baseline with coverage disabled unless coverage is the target.
3. Record total duration, discovered test files/tests, pass/fail state, and Vitest phase timings: `transform`, `setup`, `import`, `tests`, `environment`.
4. Identify the dominant phase, resource symptom, discovery overhead, rerun cost, or CI scaling problem.
5. Run the narrowest matching diagnostic.
6. Identify a specific cause before choosing an optimization.
7. Change one variable only.
8. Repeat the same measurement several times.
9. Verify test count, correctness, independence, stability, and relevant resource usage.
10. Keep the change only when the benefit is repeatable and correctness is preserved.
11. Remove temporary profiling flags and generated profile artifacts.

Phase timings can overlap when files run concurrently, so they do not need to sum to wall-clock duration.

## Choose the diagnostic

| Symptom | First diagnostic | Investigate |
| --- | --- | --- |
| `transform` is high | Vitest UI Module Info | transformed files, barrel imports, Vite plugins |
| `setup` is high | test-worker CPU profile | `setupFiles`, global mocks, initialization |
| `import` is high | import-duration reporting | expensive modules and dependency graphs |
| `tests` is high | test-worker CPU profile | tests, hooks, rendering, async work |
| `environment` is high | compare environment setup/isolation | `jsdom`, `happy-dom`, isolation cost |
| overall startup is high | main-thread CPU profile | Vite integration, plugins, global setup |
| memory is high | heap profile | large allocations; do not infer a leak from size alone |
| coverage run is slow | coverage debug logging | expensive files and coverage selection |
| discovery is slow | compare discovery scope | unnecessary directory traversal |
| repeated runs are slow | cold/warm comparison | transform/module reuse |
| CPU/memory contention | compare workers/parallelism | oversubscription or worker overhead |
| CI suite is too large | shard experiment | wall-clock scaling and orchestration overhead |

## Profile test workers

Start with CPU profiling:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false,
    execArgv: ['--cpu-prof', '--cpu-prof-dir=test-runner-profile'],
  },
});
```

Add `--heap-prof` and `--heap-prof-dir=test-runner-profile` only when allocation pressure is suspected.

Run the normal suite, for example:

```bash
pnpm exec vitest run
```

`fileParallelism: false` is a profiling aid, not a general performance recommendation. Restore normal parallelism afterward.

Do not use Node's `--prof` with Vitest's `threads` pool.

## Profile the main process

Use this for startup, transforms, Vite plugins, or global setup:

```bash
node --cpu-prof --cpu-prof-dir=main-profile ./node_modules/vitest/vitest.mjs --run
```

This profiles the main Vitest process rather than test workers.

## Profile imports

For Vitest versions that support `experimental.importDurations`:

```bash
pnpm exec vitest run --experimental.importDurations.print
```

Interpret the report:

- `Self`: module import time excluding static imports.
- `Total`: module import time including static dependencies.
- `Total` does not include transformation time for the current module.

Low `Self` with high `Total` points toward descendants. High `Self` and `Total` points toward the module's own loading work.

`experimental.importDurations` is version-sensitive. Verify it against the installed Vitest 4 release before using it in automation.

## Optimize confirmed module overhead

Use Vitest UI Module Info before rewriting imports.

- Prefer direct imports only when measurement shows a barrel path adds meaningful cost.
- Prefer documented specific package entry points when they avoid unrelated exports.
- Use `resolve.alias` only when exports, module format, and runtime behavior remain compatible.
- Consider Vite dependency optimization only for confirmed large dependency graphs.
- For browser-like `jsdom` or `happy-dom` tests, use the client optimizer; for Node-oriented tests, use the SSR optimizer.

Do not enable dependency optimization globally just to improve benchmark numbers.

## Select a targeted optimization

Load `references/optimization-options.md` only after profiling identifies a relevant bottleneck or scaling problem. Then load at most the matching deep-dive reference; do not preload the full reference set.

| Evidence | Candidate experiment | Deep-dive reference |
| --- | --- | --- |
| environment/setup overhead dominates | compare test isolation | `references/perf-disable-isolation.md` |
| DOM environment cost dominates | compare `jsdom` and `happy-dom` | `references/perf-happy-dom.md` |
| CPU/memory contention is evident | tune file parallelism or `maxWorkers` | — |
| discovery scans irrelevant trees | narrow `test.dir`/patterns | — |
| repeated transforms dominate reruns | trial persistent module caching | — |
| worker startup/communication dominates | compare `forks` vs `threads` | `references/perf-pool-selection.md` |
| CI continues after enough failures are known | trial bounded `bail` | `references/perf-bail-fast-fail.md` |
| CI invocation watches or does not exit | enforce explicit run mode | `references/perf-run-mode-ci.md` |
| large CI suite dominates wall-clock | shard across runners | `references/perf-sharding.md` |

Do not apply an optimization merely because it exists in a reference. Preserve one-variable-at-a-time benchmarking even when several references match.

## Profile coverage separately

Run coverage as its own diagnostic. Example for PowerShell:

```powershell
$env:DEBUG = 'vitest:coverage'
pnpm exec vitest run --coverage
Remove-Item Env:DEBUG
```

Inspect unexpectedly expensive files and confirm coverage selection matches the source set you genuinely intend to measure.

Do not exclude legitimate source solely because coverage processing is slow.

## Read profile artifacts

Use a compatible CPU or heap profile viewer such as Speedscope, VS Code profiling tools, or Chrome DevTools.

For CPU profiles, find functions or stacks that repeatedly dominate recorded time. For heap profiles, identify large allocation sources; a large allocation does not by itself prove a leak.

## Acceptance rules

Keep an optimization only when all applicable checks pass:

- the same intended tests are discovered;
- tests still pass and remain independent;
- no new intermittent failures, hangs, or contamination appear;
- measured improvement is repeatable across comparable runs;
- memory/resource cost remains acceptable;
- experimental behavior is validated against the installed Vitest/Vite configuration.

Revert changes that compromise correctness, omit tests, or deliver no repeatable benefit.

## Guardrails

- Profile before optimizing.
- Keep command, test selection, environment, coverage state, and machine conditions comparable across before/after runs.
- Prefer the smallest justified change.
- Do not combine multiple tuning changes in one benchmark.
- Do not disable isolation, change worker pools, narrow discovery, enable persistent caching, or shard solely to produce better numbers.
- Treat documentation examples, worker counts, percentages, and timing improvements as illustrations rather than project predictions.
