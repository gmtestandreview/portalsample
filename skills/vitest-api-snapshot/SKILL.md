---
name: vitest-api-snapshot
description: >-
  Raw Vitest API syntax reference (upstream snapshot, Git SHA
  4a7321e, generated 2026-01-28), remediated for Vitest 5.0.5. Use only as a
  supplemental syntax lookup for Vitest tests, mocks, matchers, snapshots,
  hooks, fixtures, coverage, CLI, config, environments, or type testing when the
  installed types or official docs are not reachable. Project testing policy,
  lane ownership, and coverage rules are NOT here — the separate `vitest` skill
  owns those. Do not use for Playwright, Jest, or framework-agnostic testing.
license: MIT
metadata:
  role: supplemental API reference (quarantined snapshot)
  governance-skill: vitest
  upstream-source: https://github.com/vitest-dev/vitest
  upstream-revision: 4a7321e10672f00f0bb698823a381c2cc245b8f7
  generated: '2026-01-28'
  sunset: delete this skill when the project reaches online mode and installed
    types + official docs are reliably reachable
---

# Vitest API snapshot (supplemental reference only)

## What this is, and what it is not

This skill holds a remediated snapshot of upstream Vitest API documentation,
provided for **syntax lookup only**. It is a frozen mirror pinned to the Git SHA
in the metadata and verified against Vitest 5.0.5 — not a live source.

- It does **not** decide test ownership, lanes, coverage policy, or project
  configuration. The **`vitest`** skill owns all project governance; consult it
  first for anything project-specific.
- A snapshot can drift. Installed `@vitest/*` types and version-appropriate
  official docs **override** anything here. A page in this snapshot is not proof
  a feature exists in the installed version.

## Quarantine and sunset

This skill is intentionally separate so it can be **deleted as one directory**
when the project transitions from offline source-map capture to the online
application, at which point installed types and official docs are reachable and
this mirror is pure liability. Until then, treat every example as subject to
runtime validation against the installed 5.0.5 package.

Within the audited removed-API pattern set (`*.sequential`, `poolOptions`/
`minWorkers`/`maxThreads`/`maxForks`, `coverage.all`/`.extensions`,
`test.scoped`, `test.browser.api`, removed `vitest/*` entrypoints, string
Browser provider, bare `--tags`), these 16 references contain **no executable
removed-API examples** (static grep, 2026-11-06). That is a static text check,
not runtime proof.

## Reference routing

| Topic | Reference |
| --- | --- |
| Config and command line | [core-config](references/core-config.md), [core-cli](references/core-cli.md) |
| Tests, suites, assertions, lifecycle | [core-test-api](references/core-test-api.md), [core-describe](references/core-describe.md), [core-expect](references/core-expect.md), [core-hooks](references/core-hooks.md) |
| Mocking / broad vi helpers | [features-mocking](references/features-mocking.md); [advanced-vi](references/advanced-vi.md) only if needed |
| Snapshot / coverage | [features-snapshots](references/features-snapshots.md), [features-coverage](references/features-coverage.md) |
| Context / concurrency / filtering | [features-context](references/features-context.md), [features-concurrency](references/features-concurrency.md), [features-filtering](references/features-filtering.md) |
| Environments / type tests / projects | [advanced-environments](references/advanced-environments.md), [advanced-type-testing](references/advanced-type-testing.md), [advanced-projects](references/advanced-projects.md) |

For version-sensitive migration guidance (removed APIs and supported
replacements), the **`vitest`** skill's `vitest-5-compatibility.md` is
authoritative; this snapshot's examples defer to it.

## Evals

[evals/retrieval-cases.md](evals/retrieval-cases.md) defines the topic→reference
routing cases for this skill (which bundled file a topic resolves to, plus
near-misses that must defer to the `vitest` skill). They are **definitions**,
not executed evidence; unverified behavior is `NHR`.

See [GENERATION.md](GENERATION.md) for upstream provenance.
