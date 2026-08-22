---
description: 'This file describes best practices for writing GitHub Copilot Chat prompt files (.prompt.md) in this repository. Follow these guidelines to create effective, safe, and maintainable prompts that align with repository policy and provide clear value to users.'
applyTo: 'README.md'
---

# README documentation rules

Use these rules when editing `README.md`.

## Scope

- Follow `AGENTS.md` and repository policy first.
- Keep README edits minimal and focused on the requested documentation change.
- Do not change scripts, workflows, linting, formatting, CI, package policy,
  or repository architecture just to make README text true.
- If a documented command is wrong, either update the documentation to match
  the repo or ask for a task to change the underlying workflow.

## Command documentation

Treat documented commands as claims that require current evidence.

- Use `pnpm`, not `npm` or `yarn`.
- Prefer package scripts over raw shell pipelines.
- Document commands as runnable from the repository root unless explicitly
  stated otherwise.
- Do not claim a command passes unless it was run successfully in the current
  context.
- If a command cannot be run, document the limitation or caveat instead of
  implying success.
- If reusing older workflow evidence, rerun the relevant current commands
  before treating it as valid.
- Prefer the repository command canon when available, and do not invent new
  command names.

## Validation expectations

When README changes affect general setup or validation, consider:

- `pnpm lint`
- `pnpm test -- --passWithNoTests`
- `pnpm build`

When README changes affect Storybook setup, Storybook commands, component docs,
or Storybook-facing workflows, also validate or recommend:

- `pnpm storybook`
- `pnpm build-storybook`

When README changes affect e2e/browser workflow documentation, also validate or
recommend:

- `pnpm test:e2e`

For long-running startup commands such as `pnpm storybook`, validate startup
health, stop the process when finished, and report exactly what was verified.

## Evidence and caveats

- Record current command results accurately.
- Put environment-specific setup or failures next to the relevant command.
- Do not imply green validation from stale workflow runs, old tracking slugs,
  or previous local checks.
- If validation is deferred, state what remains unverified.

## Links and structure

- Preserve existing headings and anchors unless the task requires a restructure.
- Keep links relative and verify changed links when possible.
- Avoid broad README rewrites during narrow documentation updates.
