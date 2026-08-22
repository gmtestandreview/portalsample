---
description: 'This file describes the TypeScript code style for the project. Follow these guidelines when creating or editing TypeScript files to maintain consistency, readability, and maintainability across the codebase. These rules cover naming conventions, formatting, best practices, and specific guidelines for Playwright e2e tests.'
applyTo: 'e2e/**/*.spec.ts,playwright.config.ts,scripts/e2e.mjs,scripts/e2e-lib.mjs'
---

# Playwright TypeScript e2e rules

Use these rules when creating, editing, or reviewing Playwright e2e tests, Playwright configuration, or the e2e wrapper scripts.

## Scope

- Follow `AGENTS.md` and repository policy first.
- Apply this guidance only to Playwright e2e tests, Playwright configuration, and e2e wrapper scripts.
- Do not apply this guidance to Vitest, Testing Library, Storybook story files, app unit tests, docs, linting, formatting, or workflow files.
- Keep test changes minimal and focused on the requested user behavior.
- Do not add Playwright dependencies, browser projects, CI jobs, config changes, or new test directories unless the task explicitly requires them.
- Follow existing repository patterns for test structure, naming, and assertions.

## Repository e2e commands

Use repo scripts and wrappers:

- `pnpm test:e2e`
- `pnpm test:e2e --project=app`
- `pnpm test:e2e --project=storybook`
- `pnpm test:e2e:install` when browser installation is required

Do not use `npx playwright`, `npm`, or `yarn` unless the task explicitly requires it.

By default, do not reuse existing servers. Use `PLAYWRIGHT_REUSE_EXISTING_SERVER=1` only when intentionally trading reproducibility for speed.

## Project split

The e2e suite has separate Playwright projects for app routes and Storybook coverage.

- Keep app-route browser tests under the existing app e2e project pattern.
- Keep Storybook browser tests under the existing Storybook e2e project pattern.
- Do not make Storybook-only runs build or start the app.
- Do not make app-only runs start Storybook unless the task explicitly requires it.
- Preserve the wrapper behavior in `scripts/e2e.mjs` and `scripts/e2e-lib.mjs` unless the task is specifically about e2e orchestration.

## Test locations and naming

- Follow existing `e2e/` locations and naming patterns.
- Do not move tests into a universal `tests/` directory.
- Do not place Playwright e2e tests in `components/`, `pages/`, or `scripts/`; those are covered by Vitest or other repo test layers.
- Use `.spec.ts` suffix for Playwright test files.
- Use descriptive test names that describe user-observable behavior.
- Use `test.describe()` to group related tests when it improves clarity, but do not overuse it for every test file.
- Use `test.beforeEach()` only for setup that applies to every test in the group, not for one-off setup steps.
- Use `test.step()` for multi-step flows when it improves reporting and readability, but do not use it for every assertion.
- Keep test structure consistent with existing Playwright tests in the repo.

## Test structure

- Import from Playwright with:

```ts
import { test, expect } from '@playwright/test';
```

- Group related tests with `test.describe()` when it improves clarity.
- Use `test.beforeEach()` only for setup that applies to every test in the group.
- Use descriptive test names that describe user-observable behavior.
- Use `test.step()` for multi-step flows when it improves reporting and readability.

## Locators

- Prefer user-facing locators:
  - `getByRole`
  - `getByLabel`
  - `getByText`
  - `getByPlaceholder`
  - `getByAltText`
  - `getByTitle`

- Prefer accessible names that reflect what users see or hear.
- Avoid brittle selectors based on implementation details unless no accessible locator is available.
- Avoid strict-mode violations by making locators specific.

## Assertions

- Prefer Playwright web-first assertions.
- Use the assertion that best matches the user-observable outcome.
- Use `toBeVisible()` when visibility is the behavior being tested.
- Use `toHaveText()` for exact text expectations.
- Use `toContainText()` for partial text expectations.
- Use `toHaveURL()` for navigation expectations.
- Use `toHaveCount()` for expected element counts.
- Use `toMatchAriaSnapshot()` selectively for accessibility-tree structure, not as the default assertion for every UI state.

## Stability

- Rely on Playwright auto-waiting.
- Do not add hard-coded waits such as `waitForTimeout()` unless explicitly justified.
- Do not increase global timeouts to hide flaky tests.
- Prefer fixing locator, state, data, or synchronization issues at the source.
- Keep tests deterministic and independent.
- Do not depend on external demo sites or remote services for repository e2e tests unless the task explicitly requires it.

## Validation

When relevant, validate with existing repo commands:

- `pnpm test:e2e`
- `pnpm test:e2e --project=app`
- `pnpm test:e2e --project=storybook`
- `pnpm lint`
- `pnpm build` when production app code is affected
- `pnpm build-storybook` when Storybook-facing behavior is affected

If tests or validation cannot be run, say so clearly and do not claim they passed.

## Review checklist

Before finishing:

- confirm the test covers the requested user behavior
- confirm locators are resilient and user-facing
- confirm assertions are specific and meaningful
- confirm no hard-coded waits or timeout inflation were added
- confirm existing e2e project and location conventions were preserved
- confirm Storybook-only and app-only project behavior was not regressed
- confirm no unrelated Playwright config, dependency, CI, or directory changes were introduced
- confirm validation status is reported honestly
- confirm any test failures are reported clearly without inventing passing results
- confirm the test structure is consistent with existing Playwright tests and the new test is in the appropriate location
- confirm the test name describes the user-observable behavior being tested
- confirm the test code uses Playwright's `expect` for assertions without inventing custom assertion logic
