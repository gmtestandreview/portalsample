---
description: 'This file describes the TypeScript code style for the project. Follow the rules below when editing TypeScript files to maintain consistency across the codebase. These guidelines cover naming conventions, type annotations, and best practices for writing clean and maintainable TypeScript code. Adhering to these standards will help ensure that the code is easy to read and understand for all contributors. This file applies to all TypeScript files in the project, including those in the `components/`, `pages/`, and `src/` directories.'
applyTo: 'AGENTS.md,.github/copilot-instructions.md,.github/instructions/**/*.md,package.json,COMMAND_CANON.md,eslint.config.js,eslint.config.cjs,eslint.config.mjs,eslint.config.ts,eslint.config.mts,.prettierrc,.prettierrc.json,.prettierrc.js,.prettierrc.cjs,.prettierrc.mjs,.prettierignore,.husky/**,scripts/copilot-precommit-quality.mjs'
---

# Policy-sensitive files

These files control repository behavior, linting, formatting, agent instructions, and quality-gate automation. Treat them as governance surfaces, not ordinary implementation files.

## Canonical policy

- `AGENTS.md` is the canonical repository policy.
- This instruction file adds path-specific guidance for policy-sensitive files.
- Do not weaken or contradict `AGENTS.md`.
- Preserve the current policy unless the task explicitly asks for a policy change.

## Default stance

- Optimize, do not expand.
- Prefer minimal diffs.
- Preserve existing quality intent, script names, and gate order unless the task explicitly requires a change.
- Do not invent new policy, commands, scripts, dependencies, or repo behavior to match an assumption.

## Linting and formatting rules for this repo

- Keep **ESLint code-only** for the main gate.
- ESLint covers JavaScript, TypeScript, React, Next.js, React Hooks, and Storybook code.
- Prettier covers formatting for code, JSON, Markdown, YAML, CSS, and other supported text files.
- Do **not** add `@eslint/json`, `@eslint/markdown`, or `@eslint/css` by default.
- Do **not** widen `pnpm lint` to docs, JSON, Markdown, YAML, CSS, generated files, or `.copilot-tracking/**`.
- Do **not** lint `.copilot-tracking/**`.
- Respect `.prettierignore` as the true repo-wide formatting boundary.

## If you edit package scripts

Prefer this intent unless the task explicitly requires something else:

- `format` uses repo-wide `prettier --write .`
- `format:check` uses repo-wide `prettier --check .`
- `lint` runs app lint first, then formatting check
- `lint:fix` runs auto-fixable app lint, then formatting
- `lint:prettier` points to `format:check`

Keep lint-app coverage aligned with the repo's actual code roots instead of accidentally narrowing it.

## If you edit ESLint config

Preserve the repo's intended app roots:

- `components/`
- `pages/`
- `src/`

Use modern code extensions where relevant:

- `js`, `jsx`, `mjs`, `cjs`, `ts`, `tsx`, `mts`, `cts`

Keep story globs narrow (`*.stories.*` and `*.story.*`).

Keep generated, build, test, cache, and tracking outputs ignored.

Do **not** lint `.copilot-tracking/**`.

## If you edit Prettier config or ignores

- Respect `.prettierignore` as the true repo-wide formatting boundary.
- Keep generated outputs, lockfiles, build output, test reports, caches, and most `.copilot-tracking/**` artifacts out of repo-wide formatting.
- Preserve any deliberate exception that keeps durable lessons or curated docs format-governed.
- Do not expand repo-wide formatting boundaries casually.

## If you edit pre-commit or automation quality surfaces

This includes `.husky/**` and `scripts/copilot-precommit-quality.mjs`.

- Treat the pre-commit quality gate as part of repository policy.
- Do not weaken, bypass, reorder, or silently narrow the pre-commit quality checks unless the task explicitly requires it.
- Preserve the same lint/format policy boundaries used by the normal repo quality gate.

## Anti-evasion rules

- Do not weaken lint rules, suppress warnings, add `eslint-disable` comments, or broaden ignore patterns to avoid fixing the real issue.
- Do not remove or weaken `pnpm lint`, `pnpm format:check`, CI checks, or pre-commit quality checks just to make failures disappear.
- If a referenced script or command does not exist, report the mismatch clearly instead of inventing a replacement.
- When editing `package.json`, do not add new lint, format, or policy-related dependencies unless the task explicitly requires them.

## Validation

After policy changes, run:

- `pnpm lint`
- `pnpm format:check`

Run targeted tests when the touched policy surface has them.

If a command cannot be run, say so clearly and note the likely risk area instead of pretending validation happened.
