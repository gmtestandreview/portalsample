---
description: 'This file describes best practices for updating user-facing documentation in response to code, configuration, README, or docs changes in this repository. Follow these guidelines to ensure that documentation remains accurate, relevant, and helpful without creating unnecessary work or maintenance burden.'
applyTo: 'components/**/*.{ts,tsx,js,jsx},pages/**/*.{ts,tsx,js,jsx},src/**/*.{ts,tsx,js,jsx},scripts/**/*.{js,mjs,cjs,ts,mts,cts},package.json,README.md,docs/**/*.md'
---

# Documentation impact rules

Use these rules when code, scripts, configuration, README, or docs changes may affect user-facing documentation.

## Scope

- Follow `AGENTS.md` and repository policy first.
- Do not automatically update documentation for every code change.
- Check whether the requested change affects documented behaviour, commands, setup, configuration, public APIs, examples, or user-facing workflows.
- If no documentation update is needed, say so briefly.
- Keep documentation edits minimal and tied to the actual change.
- For README-specific command evidence and structure rules, follow `.github/instructions/readme.instructions.md`.

## Update docs when the change affects

- documented commands or package scripts
- setup, prerequisites, or installation steps
- environment variables or configuration
- public routes, user-facing features, or navigation
- public APIs or reusable component usage
- Storybook, e2e, test, build, or validation workflows
- documented examples that would become stale

## Do not do by default

- Do not create new docs folders, changelogs, migration guides, or examples unless requested.
- Do not add documentation tooling, linters, link checkers, pre-commit hooks, or CI jobs unless requested.
- Do not use `npm` or `yarn`; use `pnpm` and existing repo scripts.
- Do not rewrite broad README sections during narrow changes.
- Do not document features that do not exist.

## Validation

When documentation mentions command results, do not claim a command passes unless it was run successfully in the current context.

Relevant checks may include:

- `pnpm lint`
- `pnpm test -- --passWithNoTests`
- `pnpm build`
- `pnpm build-storybook` when Storybook-facing docs change
- `pnpm test:e2e` when browser/e2e workflow docs change

- If validation cannot be run, state what remains unverified.
- If a referenced script or command is missing, report the mismatch clearly instead of inventing a replacement.
- When editing docs, do not weaken lint rules, bypass failures, add `eslint-disable` comments, suppress warnings, or broaden ignore patterns unless the task is explicitly about repository policy.
