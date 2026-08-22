---
description: 'Playwright best-practice guardrails for this repository. Use these rules when editing Playwright tests, Playwright config, and e2e wrappers.'
applyTo: 'e2e/**/*.spec.ts,e2e/bdd/**/*.ts,playwright.config.ts,scripts/e2e.mjs,scripts/e2e-lib.mjs'
---

# Playwright best-practice rules

Use these rules when working on Playwright in this repository.

## Scope and precedence

- Follow `AGENTS.md` first.
- Keep edits minimal and task-focused.
- Do not weaken existing quality gates or workflow security controls.
- Use `pnpm` scripts and wrappers already defined in `package.json`.

## Test authoring

- Test user-visible behavior, not implementation details.
- Prefer resilient user-facing locators (`getByRole`, `getByLabel`, `getByText`) over DOM-shape selectors.
- Use Playwright web-first assertions (`await expect(...)`) rather than manual `isVisible()`-style checks.
- Keep tests isolated and deterministic.
- Do not add hard waits (`waitForTimeout`) unless the task explicitly requires and justifies them.
- Avoid testing third-party systems you do not control; use routing/mocking when needed.

## Configuration and stability

- Preserve CI stability defaults unless the task explicitly changes policy.
- Keep trace capture focused (`on-first-retry`) rather than always-on for normal CI runs.
- Keep failure diagnostics (`video`, `screenshot`, report artifacts) available for CI triage.
- Use explicit retries in CI where needed to reduce transient flake noise.

## Validation

After meaningful Playwright changes, run relevant checks when possible:

- `pnpm lint`
- `pnpm test:e2e -- --project=app-bdd` for BDD changes
- `pnpm test:e2e --project=app` for app-route e2e changes
- `pnpm test:e2e --project=storybook` for storybook e2e changes

If validation cannot be run, state that clearly.
