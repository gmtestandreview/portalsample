---
name: vitest
description: Use when answering, implementing, debugging, configuring, or migrating Vitest tests, including test/describe/expect APIs, hooks, mocking/vi, snapshots, coverage, fixtures/context, filtering, concurrency, environments, type tests, CLI, config, or projects. Do not use for Jest-only or other test-runner tasks unless Vitest compatibility or migration is involved.
metadata:
  author: Greg Mico
  version: "2026.1.28"
  source: https://github.com/vitest-dev/vitest
  source-revision: 4a7321e10672f00f0bb698823a381c2cc245b8f7
---

# Vitest reference

Use this skill as a versioned Vitest reference. Load only the smallest relevant
topic file for the request; combine topic files only when the task crosses those
boundaries. Apply retrieved guidance to the user's concrete code, configuration,
debugging, or migration task instead of merely restating the reference.

## Routing rules

- For configuration or command-line behavior, use `core-config.md` or
  `core-cli.md`.
- For test structure and assertions, use `core-test-api.md`,
  `core-describe.md`, `core-expect.md`, and `core-hooks.md` as needed.
- For mocking questions, start with `features-mocking.md`; load
  `advanced-vi.md` only when the request needs broader `vi` utilities.
- For snapshots, coverage, fixtures/context, concurrency, or filtering, load the
  matching `features-*.md` file.
- For environments, type-level tests, or multi-project setups, load the matching
  `advanced-*.md` file.
- Do not answer Jest-only or other-runner questions from these references unless
  the user is asking about Vitest compatibility or migration.
- This snapshot was generated on 2026-01-28 from the source revision recorded in
  [GENERATION.md](GENERATION.md). For behavior introduced after that revision,
  state that the bundled reference does not establish the answer rather than
  guessing.
- If the bundled references do not establish a material claim, say so. When a
  newer authoritative source is available and the task permits external
  research, distinguish that newer evidence from the bundled snapshot.
- When terminology overlaps with Jest or another runner, resolve the request
  from explicit Vitest intent or migration context rather than shared API names
  alone.

## Core

| Topic | Reference |
| --- | --- |
| Configuration | [core-config](references/core-config.md) |
| CLI | [core-cli](references/core-cli.md) |
| Test API | [core-test-api](references/core-test-api.md) |
| Describe API | [core-describe](references/core-describe.md) |
| Expect API | [core-expect](references/core-expect.md) |
| Hooks | [core-hooks](references/core-hooks.md) |

## Features

| Topic | Reference |
| --- | --- |
| Mocking | [features-mocking](references/features-mocking.md) |
| Snapshots | [features-snapshots](references/features-snapshots.md) |
| Coverage | [features-coverage](references/features-coverage.md) |
| Test Context | [features-context](references/features-context.md) |
| Concurrency | [features-concurrency](references/features-concurrency.md) |
| Filtering | [features-filtering](references/features-filtering.md) |

## Advanced

| Topic | Reference |
| --- | --- |
| Vi Utilities | [advanced-vi](references/advanced-vi.md) |
| Environments | [advanced-environments](references/advanced-environments.md) |
| Type Testing | [advanced-type-testing](references/advanced-type-testing.md) |
| Projects | [advanced-projects](references/advanced-projects.md) |
