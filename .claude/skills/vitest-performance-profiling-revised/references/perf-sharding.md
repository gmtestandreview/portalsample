---
title: Use Sharding for CI Parallelization
impact: HIGH
impactDescription: Can reduce CI wall-clock time when suite size justifies multiple independent runners.
tags: perf, sharding, ci, parallel, blob-reporter
---

# Use Sharding for CI Parallelization

Use this reference when CI wall-clock time is dominated by a large test suite and additional runners are available.

Vitest shards test files across independent processes. Sharding is not guaranteed to scale linearly because files can have unequal duration and each shard can duplicate setup, dependency installation, and reporting overhead.

## Experiment

Example across three runners:

```bash
pnpm exec vitest run --reporter=blob --shard=1/3
pnpm exec vitest run --reporter=blob --shard=2/3
pnpm exec vitest run --reporter=blob --shard=3/3
```

Upload each shard's blob report to shared CI artifacts, download all reports in a merge job, then merge:

```bash
pnpm exec vitest --merge-reports
```

For coverage, follow the Vitest 4 reporter/coverage merge flow and verify that the merged output matches the non-sharded baseline.

## Measure end-to-end cost

Compare:

- total wall-clock time from job start through merged reporting;
- slowest shard duration, not only average shard duration;
- duplicated setup/dependency-install cost;
- artifact upload/download and report-merge time;
- total compute consumption and runner cost;
- test count, failures, coverage, and attachments versus the unsharded run.

Blob reports do not contain file-based attachments. Preserve and merge `attachmentsDir` separately when those artifacts are required.

## Choose shard count empirically

Do not select shard count from test-count tables alone. Increase shards only while the reduction in critical-path duration exceeds the added orchestration and compute cost.

## Decision rule

Keep sharding when end-to-end CI wall-clock improvement is repeatable and merged results preserve required test, coverage, and artifact semantics.

## Source boundary

Vitest 4 supports `--shard`, blob reporting, and `--merge-reports`; the achievable speedup is workload- and CI-dependent.

- <https://v4.vitest.dev/guide/features#sharding>
- <https://v4.vitest.dev/guide/reporters#blob-reporter>
- <https://v4.vitest.dev/guide/improving-performance>
