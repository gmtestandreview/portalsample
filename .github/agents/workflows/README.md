# Workflow Readiness

## Purpose

This folder contains workflow-oriented agent definitions. They are not equally
ready for this repository in their current form, so this file documents which
ones are usable as-is, which require repo-specific overrides, and which are
primarily reference material.

## Workflow Matrix

| Family | Status | Notes |
| --- | --- | --- |
| `react18` | Limited | Designed for React 16/17 to 18 migration. This repo is already on React 18. |
| `react19` | Needs repo overrides | Conceptually useful, but originally assumed `src/`, JS/JSX, and `pnpm`. |
| `polyglot-test` | Needs repo overrides | Useful RPI pattern, but must target `tests/unit` and repo scripts. |
| `tdd` | Reference only | GitHub-issue-driven playbooks, not a true local orchestrator in this repo. |
| `rug` | Reference only | Written for a runtime with `runSubagent` and `manage_todo_list`; not directly portable here. |
| `ai-team` | Reference only | Assumes `PROJECT_BRIEF.md`, sprint artifact files, git operations, and GitHub handoff flows that do not yet exist here. |

## Repo Overrides

When adapting these workflows locally, use:

- source files: `static/js/**/*.{ts,tsx}`
- unit tests: `tests/unit/**/*.{test,spec}.{ts,tsx}`
- package manager: `npm`
- validation commands: `npm run type-check`, `npm run lint`, `npm run test:unit`, `npm run build`, `npm run build-storybook`

Never target:

- `static/js/main.*.js`
- `static/css/main.*.css`
- `static/source-map-http-downloads/**`
- `static/js/external/**`
- `static/webpack/**`

## Notes By Family

### `react18`

- Treat as not applicable unless a preflight check finds React `<18`.
- If used as reference, port any file search patterns from `src` to `static/js`.

### `react19`

- Use as the main migration reference for future React 19 work, but only with the
  repo-specific commands and paths above.
- The workflow files in this repo have been partially normalized for local usage.

### `polyglot-test`

- Prefer `npm run test:unit` over inferred `npm test`.
- Do not let the researcher or implementer plan work against generated bundles or
  vendor mirrors.

### `tdd`

- These files describe Red, Green, and Refactor phases, but the current
  `tdd-red` file is not a true coordinator.
- Use them as guidance, not as a drop-in orchestrator.

### `rug` and `ai-team`

- Both families are best treated as reusable patterns, not active repo defaults.
- `rug` is intentionally heavy on delegation and validation, but its wording is
  stricter than the local Codex runtime and should be adapted before direct use.
- `ai-team` should not assume `.git`, GitHub issue filing, PR merges, or backend
  surfaces in this workspace unless those capabilities are confirmed first.
