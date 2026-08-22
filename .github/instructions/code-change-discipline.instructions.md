---
description: 'General discipline rules for making code changes in the repository. These guidelines cover editing principles, repository alignment, and validation expectations to ensure that all code changes are safe, maintainable, and consistent with existing patterns and project goals. Follow these rules when making any code changes to maintain high quality and alignment with repository standards.'
applyTo: '**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}'
---

# Code change discipline

Apply these rules when editing source files.

## Editing principles

- Make the minimum necessary change to satisfy the request.
- Preserve existing structure and patterns unless the task explicitly asks for a refactor.
- Avoid unrelated cleanup in untouched areas.
- Prefer straightforward, standard solutions over clever or layered alternatives.
- Do not add speculative features, new dependencies, or new architecture unless explicitly requested.
- Do not add `eslint-disable` comments, broad ignore patterns, or warning suppressions to avoid fixing the actual issue.
- Do not weaken CI quality gates to compensate for bad code or incomplete fixes.
- If a referenced script or command is missing, report the mismatch clearly instead of inventing a replacement.

## Repository alignment

- Use `pnpm`; do not substitute `npm` or `yarn`.
- Prefer precise TypeScript types. Avoid `any`; if unavoidable, keep it narrow and justified.
- Prefer AGDS component props and repo patterns before custom styling or abstractions.
- Follow existing patterns for new code. Do not invent new patterns unless the task explicitly requires it.
- Do not edit repository policy, linting, formatting, or workflow files from a component/page task unless the task explicitly requires it.

## Validation

When relevant, validate with the repo’s existing commands.

- `pnpm lint`
- `pnpm test -- --passWithNoTests`
- `pnpm build`
- `pnpm build-storybook`

If validation fails or cannot be run, report the exact status honestly. Do not claim the quality gate passed.
