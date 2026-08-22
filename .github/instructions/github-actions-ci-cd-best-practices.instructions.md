---
description: "Protect GitHub Actions workflows that enforce this repository's quality gates."
applyTo: '.github/workflows/*.yml,.github/workflows/*.yaml'
---

# GitHub Actions workflow rules

Apply these rules when editing GitHub Actions workflows in this repository.

## Repository defaults

- Use `pnpm`, not `npm` or `yarn`.
- Use Node `22` unless the task explicitly requires a justified change.
- Prefer existing repository scripts over ad hoc shell commands.
- Preserve the existing quality gate unless the task explicitly asks for a policy change.

## Required quality-gate protection

Do not remove, weaken, bypass, or silently narrow checks that enforce:

- `pnpm lint`
- `pnpm test -- --passWithNoTests`
- `pnpm build`
- `pnpm build-storybook` when relevant

Do not create alternate workflows, conditional skips, `continue-on-error`, or success paths that effectively weaken the repository quality gate unless the task explicitly requires a policy change.

## Security

- Keep workflow permissions least-privilege.
- Do not hardcode secrets or print secrets to logs.
- Prefer GitHub Secrets or environment secrets for sensitive values.
- Preserve existing action pinning policy. If changing `uses:` actions, follow the repository's established pinning/update approach.

## Scope control

- Keep workflow edits minimal and task-focused.
- Do not add deployment, release, matrix, cache, SAST, SCA, artifact, or environment complexity unless the task explicitly requires it.
- Do not change unrelated workflow jobs while fixing a narrow issue.

## Validation

When possible, validate affected scripts locally:

- `pnpm lint`
- `pnpm test -- --passWithNoTests`
- `pnpm build`

If validation cannot be run, say so clearly and note the risk. Do not claim validation passed.
