---
name: vitest
description: >-
  Use when creating, modifying, diagnosing, reviewing, configuring, migrating,
  or validating Vitest unit tests, mocks, fixtures, assertions, coverage, or
  Vitest-powered Storybook play-function tests in the nmi-portal project.
  Includes vitest.config.ts, vitest.unit.config.ts, vitest.storybook.config.ts,
  @storybook/addon-vitest, Vitest Browser Mode, and Vitest 5 migration. Applies
  this repository's testing contracts and coverage policy. Do not activate for
  standalone Playwright Test E2E/BDD/API-contract, Storybook BDD alone, Jest-only,
  Node node:test, or framework-agnostic testing requests unless Vitest
  compatibility, migration, or ownership is established.
license: MIT
metadata:
  author: Greg Mico
  version: '2026.11.06'
  governance-source: merged from vitest + vitest-skill-validated (2026-11-06)
  api-reference: vitest-api-snapshot skill (separate; see Reference routing)
---

# Vitest — project testing governance

## Purpose

Apply **this repository's Vitest contracts**, not merely generic Vitest syntax.
Vitest 5.0.5 owns unit tests and Storybook play-function tests; separate
Playwright Test configurations own app E2E, API-contract, and Storybook BDD. Do
not interchange their runners, setup, commands, assertions, or coverage
policies. Generic Vitest expertise cannot decide which project runner owns a
test, which coverage exclusions are intentional, or which Storybook integration
exceptions must survive a change.

Raw Vitest 5 API syntax (the upstream reference cookbook) lives in the separate
**`vitest-api-snapshot`** skill. This skill governs project policy; it does not
restate the API. See [Reference routing](#reference-routing).

## Objective and finished state

For each activated request, deliver the smallest correct test, diagnosis,
configuration change, or review that satisfies the requested behavior **and**
remains Vitest 5.0.5-compatible and consistent with the relevant project test
lane. A completed change is **behaviorally correct, minimal, version-compatible,
and project-consistent**, not merely a followed workflow. Following a workflow
without a correct outcome is not success.

**Acceptance criteria (apply as relevant):**

- Correct suite/runner/lane selected; no Vitest Browser Mode vs standalone
  Playwright conflation, and no migration of tests across owners without
  authorization.
- Requested behavior covered by meaningful assertions or a supported
  explanation; no unrelated changes and no **unapproved** weakening of coverage,
  exclusions, safety, timeouts, worker limits, or CI policy.
- Proposed APIs/configuration supported by the installed version (5.0.5 in the
  supplied project); no deprecated/removed API examples.
- Run the narrowest feasible relevant check, then broader checks if warranted.
  Report exact commands and outcomes, or state **not run** and why. An
  unexecuted example or static inspection is not a passing test.
- Expose missing files, uncertain post-snapshot APIs, unverified behavior, and
  any remaining acceptance criterion as **Needs Human Review (NHR)** rather than
  claiming success. A successful local unit run alone does not establish
  Storybook or Playwright E2E success.

## Operating mode: offline snapshot vs online repository

This skill began as an offline source-map capture and will transition to an
online application. Before judging evidence availability, determine the mode:

- **Online-repo mode** — the live repository, `node_modules`, and lockfile are
  reachable. **Read live files first**, verify installed versions against actual
  `package.json`/typings, and run the narrowest real checks. Downgrade a
  would-be `NHR` to an actual check whenever the file or command is genuinely
  available. Treat the snapshot references below as historical context; report
  drift from live files.
- **Offline-snapshot mode** — only uploaded snapshots are present. Uploaded
  snapshots may omit repository files; mark missing files **unavailable**, never
  infer their contents, and record unverifiable outcomes as `NHR`. A manifest is
  not proof of installed/resolved versions.

Do not claim `NHR` for a file or command that is actually reachable in
online-repo mode; do not fabricate contents or results in offline mode.

## Decide ownership first

1. **Unit test / jsdom / `tests/unit` / mocks:** `vitest.unit.config.ts`; read
   [project-nmi-portal.md](references/project-nmi-portal.md), then only the
   relevant API topic in the `vitest-api-snapshot` skill.
2. **Storybook stories' `play()` functions / `@storybook/addon-vitest` / Vitest
   Browser Mode:** `vitest.storybook.config.ts`, `.storybook` integration; read
   [storybook-browser.md](references/storybook-browser.md).
3. **Supplied Storybook-oriented Vitest contract suites:** read
   [supplied-test-contracts.md](references/supplied-test-contracts.md) for the
   seven case-specific GREEN/RED/AMBER boundaries; do not infer the runner from
   the subject being tested.
4. **App E2E, Storybook BDD/MCP E2E, or API-contract tests using
   `@playwright/test`:** Playwright-owned; do **not** apply this skill as the
   runner. If a request spans both, separate validation and ownership
   explicitly. Shared `expect`/`describe` syntax or the word *Playwright* alone
   is not sufficient to activate or to exclude.
5. **Configuration, coverage, or uncertain Vitest 5 API:** read
   [vitest-5-compatibility.md](references/vitest-5-compatibility.md), then
   consult the exact installed version/types and official documentation when
   accessible. Do not invent undocumented flags or signatures. A newer web page
   is **not** proof a feature exists in the installed version.

**If ambiguous:** determine ownership from supplied imports, config/script, or
explicit user context before using Vitest-specific guidance; do not infer Vitest
solely from matcher names. A Playwright **provider inside Vitest Browser Mode**
does not make the test a standalone Playwright E2E suite.

## Required execution boundaries

- Inspect the target code, existing tests, applicable config, `package.json`
  scripts, and any local exception before suggesting a change.
- Preserve the `watch: false` default, direct leaf configs and explicit watch
  commands, unit `jsdom`/`forks`/`maxWorkers: 2` settings, the Storybook
  Chromium provider, and configured coverage inclusion/exclusion/thresholds.
- Do not weaken the unit 100% threshold, overwrite excluded paths, drop
  `reportOnFailure`, merge coverage domains, or remove the Storybook addon
  compatibility bridge without verified upstream compatibility and explicit
  change scope.
- Treat `vitest.storybook.runtime.ts` as an **observed project compatibility
  workaround**, not a general recommendation or evidence the upstream package is
  fixed. Confirm against installed dependency behavior before removing it.
- Do not carry forward Vitest-4/earlier snippets such as `coverage.all`,
  `browser: { provider: 'playwright', name: 'chromium' }`, or
  `poolOptions.threads`. Avoid deprecated/removed imports and CLI options; check
  Vitest 5 docs and installed types for any ambiguous API.
- Keep deterministic tests focused on behavior; use real browser assertions for
  Browser Mode when DOM/browser fidelity matters. Preserve setup mocks for the
  appropriate lane; never silently transplant unit jsdom shims into Chromium.
- If a check fails, distinguish pre-existing failure from regression only with
  comparative evidence. Do not mask failures with retries, snapshots, relaxed
  thresholds, `.only`, `allowOnly`, or unsupported API changes. Do not treat
  historical T1-exemption comments as authorization to ignore current failures.
- Narrow validation first: changed test/config, then its lane's script; expand
  to coverage or related suites as justified. Distinguish static review, actual
  CLI output, and project CI evidence. Never claim tests, coverage, or a browser
  run passed without execution evidence.

## Coverage policy and the exclusion list as monitored debt

Unit coverage thresholds are **100% statements/branches/functions/lines**, and
the exclusion arrays are policy, not a suggested default (full detail in
[project-nmi-portal.md](references/project-nmi-portal.md)). Preserve them — but
do not treat the exclusion list as a sacred artifact. Every excluded path is an
invisible coverage hole that a green 100% hides. Therefore:

- When a change **adds to** an exclusion list, or would raise coverage only by
  excluding source, flag it explicitly as **coverage-policy drift requiring
  review**, not a routine edit — even though preserving existing exclusions is
  the default.
- Never copy unit thresholds, `reportOnFailure`, reporters, or exclusions to the
  Storybook lane; the Storybook coverage object does **not** define 100%
  thresholds. Do not generalize one lane's exclusions to the other.

## Reference routing

Load the **smallest sufficient** reference; project policy before API topics.

| Need | Reference |
| --- | --- |
| Project test ownership, scripts, unit config, coverage policy | [project-nmi-portal.md](references/project-nmi-portal.md) |
| Seven supplied contract suites, GREEN/RED/AMBER evidence | [supplied-test-contracts.md](references/supplied-test-contracts.md) |
| Storybook addon, Browser Mode, Test-panel compatibility, coverage | [storybook-browser.md](references/storybook-browser.md) |
| Vitest 5 removed APIs, migration, configuration safety | [vitest-5-compatibility.md](references/vitest-5-compatibility.md) |
| Raw Vitest 5 API syntax (tests, mocks, matchers, hooks, fixtures, config, CLI, environments, type testing) | **`vitest-api-snapshot`** skill (separate, deletable at go-online) |

Project source/configuration controls **local policy**; version-appropriate
official Vitest documentation controls **API validity**. Neither generic
examples nor the snapshot overrides applicable user requirements or safety.

## Evidence, provenance, and evals

Use [evals/](evals/) as test **definitions**, not executed evidence:
`activation-cases.md` and `project-governance-cases.md` (QAQ/RMI activation,
retrieval, P01–P22 governance, R01–R04 near-misses); `activation-cases.json`,
`source-mapping-results.json`, and `supplied-test-green-red-amber.json`
(machine-readable activation and seven-suite GREEN/RED/AMBER definitions). A
case definition or expected result is not evidence the case passed; required
behavior-critical `AMBER`/`FAIL`/`NHR` blocks deployment.

See [MAINTENANCE.md](MAINTENANCE.md) and [MERGE.md](MERGE.md) for provenance,
change history, rollback, and the audit record of this consolidation.
