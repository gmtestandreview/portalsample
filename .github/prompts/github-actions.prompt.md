---
agent: 'agent'
description: 'Review, design, or update GitHub Actions workflows for this repository with secure, minimal, repo-aligned CI/CD practices.'
argument-hint: 'Workflow file, CI/CD issue, or GitHub Actions task to review or implement'
---

# GitHub Actions CI/CD Review and Update

Use this prompt only when the task explicitly involves GitHub Actions workflows, CI/CD behavior, workflow security, workflow performance, or deployment automation.

Do not use this prompt for ordinary AGDS app code, Storybook, docs, tests, package maintenance, or unrelated repository work.

## Goal

Review, design, or update GitHub Actions workflows in a way that is secure, minimal, maintainable, and aligned with this repository’s existing quality gates.

## Repository rules

Follow these rules first:

- Follow `AGENTS.md` as the canonical repository policy.
- Use `pnpm`, not `npm` or `yarn`.
- Use Node `22` unless the task explicitly requires a justified change.
- Prefer existing repository scripts over ad hoc shell commands.
- Preserve the existing workflow architecture unless the task explicitly asks for a workflow redesign.
- Keep workflow changes minimal and task-focused.
- Do not change repository policy, linting, formatting, or quality-gate behavior unless explicitly asked.
- If the task is only to diagnose a failing workflow, do not edit files until you have identified the likely failure cause and the smallest safe change.

## Quality-gate protection

Do not remove, weaken, bypass, reorder, or silently narrow checks that enforce repository quality.

Protect these checks unless the task explicitly requires a policy change:

- `pnpm lint`
- `pnpm test -- --passWithNoTests`
- `pnpm build`
- `pnpm build-storybook` when relevant

Do not introduce:

- `continue-on-error` for quality-gate steps
- conditional skips that create an alternate success path
- duplicate workflows that bypass the normal gate
- weaker replacement commands
- broad workflow exclusions that avoid real failures

If a quality check fails, fix the underlying issue or report the failure honestly. Do not weaken the gate to make the workflow pass.

## Security review

When reviewing or editing workflows, check for:

- least-privilege `permissions`
- no hardcoded secrets, tokens, credentials, or private data
- no secrets printed to logs
- use of GitHub Secrets or environment secrets for sensitive values
- safe handling of pull request workflows, especially forks
- trusted actions and existing repository action-pinning policy
- no unnecessary write permissions
- no unsafe deployment paths
- no unreviewed escalation from CI to deployment

If changing `uses:` actions, preserve the repo’s established pinning and update approach. Do not introduce mutable or untrusted action references unless the repo already permits that pattern and the task requires it.

## Workflow design guidance

Prefer simple, explicit workflows.

Use advanced CI/CD features only when they are justified by the task:

- matrix builds
- caching
- artifacts
- reusable workflows
- deployment environments
- OIDC
- CodeQL / SAST
- dependency review / SCA
- release automation
- staging or production deployment
- canary, blue/green, or rollback workflows

Do not add deployment, release, matrix, cache, scan, artifact, environment, or observability complexity just because it is generally considered a best practice.

## Repository-aligned workflow defaults

When applicable:

- use `actions/setup-node` with Node `22`
- use `pnpm` install and script commands
- prefer the repo’s existing lockfile and package-manager setup
- prefer existing scripts:
  - `pnpm lint`
  - `pnpm test -- --passWithNoTests`
  - `pnpm build`
  - `pnpm build-storybook`
- keep job and step names clear
- use `timeout-minutes` where long-running jobs could hang
- keep trigger changes narrow and intentional
- preserve existing branch/path filters unless the task requires a change

## Review checklist

When reviewing a workflow, check:

1. Scope
   - Is the workflow change actually required by the task?
   - Does it preserve existing quality-gate intent?
   - Does it avoid unrelated workflow redesign?

2. Commands
   - Does it use `pnpm`, not `npm` or `yarn`?
   - Does it use Node `22` unless justified?
   - Does it use repo scripts instead of ad hoc equivalents?

3. Quality gates
   - Does CI still enforce lint, tests, and build?
   - Are there any hidden bypasses, skips, or alternate success paths?
   - Are failures surfaced clearly?

4. Security
   - Are permissions least-privilege?
   - Are secrets handled only through approved secret mechanisms?
   - Are no secrets printed or hardcoded?
   - Are external actions trusted and handled according to repo policy?

5. Maintainability
   - Are triggers, jobs, and steps clear?
   - Are changes minimal?
   - Is added complexity justified?
   - Are validation gaps stated honestly?

## Troubleshooting focus

When diagnosing workflow failures, prioritize:

- incorrect triggers, branch filters, or path filters
- failing repo scripts
- package-manager mismatch
- Node version mismatch
- missing install/cache setup
- permissions errors
- unavailable secrets or environment approvals
- flaky tests or environment differences
- action version or pinning issues

Do not “fix” workflow failures by weakening checks unless the task explicitly asks for a policy change.

## Output format

Return:

1. Summary
   - what workflow issue was reviewed or changed
   - whether the task required CI/CD changes

2. Files changed or reviewed
   - list workflow files and any policy-sensitive files touched

3. Findings or implementation notes
   - quality-gate impact
   - security impact
   - command/runtime alignment
   - any added or removed workflow behavior

4. Validation
   - commands run
   - results
   - if validation could not be run, say so clearly and note risk

5. Residual risks
   - unresolved workflow risk
   - assumptions
   - follow-up checks
