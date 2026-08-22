---
description: 'Guidance for writing Playwright-BDD feature files. Use when editing .feature files in the BDD suite.'
applyTo: 'e2e/bdd/features/**/*.feature'
---

# Playwright BDD feature rules

Use these rules when creating or editing Playwright-BDD feature files.

## Scope

- Follow `AGENTS.md` first.
- Write features in Gherkin syntax and keep scenarios aligned with the existing step definitions.
- Use short feature names, scenario names, and step text that describe user-observable behavior.
- Do not invent new step text if an existing step definition already covers the behavior.
- Keep feature files focused on behavior, not implementation details.
- Use `@only`, `@skip`, `@fixme`, and `@fail` only as temporary task tags or when the task explicitly requests them to remain.

## Feature structure

- Use `Feature` to describe the user goal.
- Use `Scenario` for a single path through the behavior.
- Use `Scenario Outline` and `Examples` when the same flow should run with multiple data sets.
- Use `Background` only for shared setup that applies to every scenario in the file.
- Use `And` to continue the same keyword type within a flow.
- In `Scenario Outline`, every `<placeholder>` used in the scenario text or steps must appear as an `Examples` column header with the same spelling and case.
- Keep doc strings and data tables directly under the step they belong to.

## Tags

- Use ordinary tags such as `@smoke`, `@regression`, or `@jira:123` only when they help filter or identify scenarios.
- Use special tags only when the behavior is intentional:
  - `@only` for a single feature or scenario under active focus
  - `@skip` / `@fixme` for scenarios that should not run yet
  - `@fail` for scenarios that are expected to fail
  - `@slow` for scenarios that need a longer timeout
  - `@timeout:N` for an explicit timeout
  - `@retries:N` for retries
  - `@mode:parallel`, `@mode:serial`, or `@mode:default` for execution mode
- Use tags from path only when the feature tree intentionally uses `@`-prefixed directories or filenames.
- Keep tag placement consistent with the rest of the feature file.
- Do not introduce new path-tag directory conventions in this repo unless the task explicitly requests that layout.

## Localization

- Use the feature file language that matches the project configuration.
- If a file starts with a `# language:` directive, keep all keywords in that language.
- Do not mix languages within the same feature file.

## Formatting

- Use two-space indentation under `Feature` and `Scenario` blocks.
- Leave one blank line between scenarios.
- Keep `Examples` tables and data tables aligned.
- Do not rewrite step wording solely for style.

## Drafting from user stories

- If a feature file is drafted from a user story, keep the scenarios limited to the steps already supported by the project.
- Use `pnpm exec bddgen export` output as the source of truth for available steps.
- If `pnpm exec bddgen export` fails, report the exact failure and do not invent unsupported step text.
- If a behavior cannot be expressed with existing steps, record that gap instead of inventing unsupported step text.
