---
description: 'Guidance for writing Playwright-BDD step definitions, fixtures, and hooks in the e2e BDD suite.'
applyTo: 'e2e/bdd/steps.ts,e2e/bdd/fixtures.ts,e2e/bdd/hooks.ts,e2e/bdd/**/*.steps.ts,e2e/bdd/**/*.fixtures.ts,e2e/bdd/**/*.hooks.ts'
---

# Playwright BDD step rules

Use these rules when creating or editing Playwright-BDD step files, fixtures, and hooks.

## Scope

- Follow `AGENTS.md` first.
- Match the existing step style used in the file you are editing.
- Introduce a different style only when the task explicitly requests migration.
- Keep step definitions behavior-focused and locator-driven.
- Do not invent step patterns if the behavior is already covered by existing exported steps.

## Step styles

- Playwright-style:
  - Use `createBdd(test)` with exported `Given`, `When`, `Then` from fixtures.
  - Prefer async arrow functions.
  - Use Cucumber expressions (`{string}`, `{int}`, `{float}`) unless regex is clearly needed.
- Cucumber-style:
  - Use only when migration or explicit world-based behavior is required.
  - Use `function` syntax when step data must be shared via `this`.
- Decorators:
  - Use only when task explicitly requests POM-based decorator steps.
  - Keep `@Fixture` names aligned with the fixture exported from `test.extend`.

## Fixtures and hooks

- Prefer fixtures over hooks when either approach can solve the same setup/teardown problem.
- Keep shared setup in `test.extend` fixtures and inject only what a step needs.
- Use hooks only when fixture setup cannot express the required lifecycle behavior.
- Keep hook scope explicit: scenario-level by default, worker-level only when cross-scenario state is required.
- If hooks are tag-scoped, keep tag expressions explicit and testable.
- Do not add global or worker lifecycle behavior when a test-scoped fixture is sufficient.

## BDD fixtures

- Use BDD fixtures (`$test`, `$testInfo`, `$step`, `$tags`) only when needed for runtime control or metadata.
- Use `$test`/`$testInfo` for skip/timeout/attachments in-step.
- Use `$tags` for tag-aware fixture behavior.
- Keep `$step` usage limited to step-title-dependent logic.

## Data sharing

- Between steps in a scenario:
  - Use a typed `ctx` fixture (test-scoped) for shared step state.
  - Keep `ctx` shape explicit in TypeScript.
- Between scenarios:
  - Use only when serial behavior is explicitly required.
  - Prefer worker-scoped map + test-scoped context fixture pattern.
  - Avoid sharing Playwright built-in `page` across scenarios unless the task explicitly requires it.

## Scoped definitions and keyword matching

- If multiple step definitions match the same text in different domains, scope them by tags.
- Use default tags in `createBdd(test, { tags })` only when all definitions in that file share scope.
- Use path-based tag scoping only when the feature/step folder structure already uses `@`-prefixed names.
- If keyword matching conflicts occur, report the configuration dependency and avoid duplicating near-identical step text as a workaround.

## Reusing step functions and DataTable

- You may reuse step functions by storing the function returned from `Given/When/Then`.
- Pass required fixtures explicitly when invoking reusable step functions.
- For Cucumber-style reuse, call with `.call(this, ...)` when world context is required.
- For data tables, use `DataTable` from `playwright-bdd` and explicit table parsing (`hashes()`, etc.).

## Missing steps and snippets

- When missing steps are reported, align added step text with generated snippets and existing project step style.
- For full discovery and generation workflow, follow the `playwright-bdd` skill.

## Validation

- If step patterns changed, run `pnpm exec bddgen`.
- If runtime behavior changed, also run `pnpm test:e2e -- --project=app-bdd`.
- Report command failures exactly; do not claim generation or test passes without running them.
