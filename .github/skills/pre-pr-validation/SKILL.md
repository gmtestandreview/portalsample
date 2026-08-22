---
name: pre-pr-validation
description: 'Run consistent pre-PR validation for this monorepo and return a pass/fail summary. Use for PR readiness checks, regression gates, and final validation before merge.'
argument-hint: 'Optional scope: frontend, backend, or full'
user-invocable: true
---

# Pre-PR Validation

Reusable workflow for fast, consistent PR validation in this repository.

## When To Use

- Before opening a PR.
- After making code changes that might affect tests or build.
- When a reviewer asks for proof that checks passed.

## Inputs

Optional scope argument:

- `frontend`
- `backend`
- `full` (default)

If no scope is provided, use `full`.

Mode normalization:

- If scope is `backend`, normalize to `full` so .NET tests run in the mandatory gate.

## Decision Flow

1. Classify changed files by area:
   - Frontend: `apps/**`, `packages/**`
   - Backend: `src/**`, `tests/**`
2. Choose run mode:
   - Scope argument provided: respect it.
   - Scope `backend`: normalize to `full`.
   - No scope argument: run `full`.
3. Run targeted checks first for fast feedback.
4. Run final PR gate checks before reporting completion.

## Commands

Use task runner when available; otherwise run the equivalent commands.

### Frontend Targeted Checks

1. `npm run typecheck`
2. `npm run lint`
3. `npm test`

Optional as needed:

- `npm run test:coverage`
- `npm run test:e2e`

### Backend Targeted Checks

No standalone backend-only targeted command is required in this repository.
Use `full` mode for backend validation so .NET tests run in the mandatory gate.

### Final PR Gate (Full)

Always run this sequence before declaring PR-ready:

1. `npm run typecheck`
2. `npm run lint`
3. `npm test`
4. `dotnet test src/Nmi.Portal.sln`

## Execution Rules

- Run the full planned command set in one pass to collect all failures.
- Do not stop on the first failure unless the environment is genuinely blocked (for example toolchain unavailable).
- If a command fails, capture:
  - command
  - exit status
  - primary error summary (first actionable failure)
- Do not claim success if any mandatory gate command failed.

## Output Format

Return a compact report with one row per executed command:

| Command             | Scope    | Result    | Duration | Notes             |
| ------------------- | -------- | --------- | -------- | ----------------- |
| `npm run typecheck` | frontend | PASS/FAIL | `Xm Ys`  | key warning/error |

Then include:

1. Overall status: `PR-READY` or `NOT PR-READY`
2. Blocking failures list (if any)
3. Minimal next actions to reach green

## Completion Criteria

Mark `PR-READY` only when all mandatory commands in the Final PR Gate pass.

## Repository References

- [CONTRIBUTING.md](../../../CONTRIBUTING.md)
- [AGENTS.md](../../../AGENTS.md)
