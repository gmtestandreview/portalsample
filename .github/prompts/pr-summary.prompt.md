---
name: PR Validation Summary Comment
description: 'Convert pre-pr-validation results into a standardized PR checklist comment aligned to this repository template.'
argument-hint: 'Paste pre-pr-validation output and optional PR context'
agent: 'agent'
---

Create a PR comment from the provided pre-pr-validation output.

Use this repository checklist as the canonical structure:

- [PR template](../pull_request_template.md)

## Requirements

1. Output only a PR-ready markdown comment body.
2. Include sections in this order:
   - Summary
   - Validation
   - Risk and rollback
3. In Validation, map results to checklist items from the PR template.
4. For each known check:
   - Use `[x]` when explicitly passed.
   - Use `[ ]` when failed, skipped, or unknown.
   - Append short evidence in parentheses (command + pass/fail).
5. Include an `Overall` line: `PR-READY` or `NOT PR-READY`.
6. If not ready, include a `Blocking failures` list with minimal next actions.
7. Keep output concise and reviewer-friendly.

## Mapping Rules

- `npm run typecheck` -> Typecheck passed
- `npm run lint` -> Lint passed
- `npm test` -> Unit/component tests passed
- `dotnet test src/Nmi.Portal.sln` -> Backend/API validation evidence (add in Summary and Validation notes)
- `npm run test:e2e` -> Playwright tests updated where relevant
- `npm run test:coverage` -> Add coverage note in Summary (do not invent thresholds)

If input is incomplete or ambiguous, keep uncertain items unchecked and add a short `Needs confirmation` note.
