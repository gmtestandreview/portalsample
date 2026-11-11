# ESLint Filesystem-Path Warning Exception Register

Date: 2026-11-09

## Scope

This register reconciles the current `npm run lint:diagnostics` report for the
working tree. The report contains 57 actionable findings, all from
`security/detect-non-literal-fs-filename`. There are no stale, accepted, or
generated-vendor findings in the reconciliation result.

The warning is a static-analysis signal, not proof of attacker-controlled paths.
Each entry below records the source, containment, regression evidence, residual
risk, and approval state. No ESLint suppression or threshold change is used.

## Register

| Source                                            | Count | Containment and regression evidence                                                                 | Residual risk                                                                    | Approval               |
| ------------------------------------------------- | ----: | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------- |
| `scripts/lint-diagnostics.mjs`                    |     3 | Diagnostics output is written to the task-owned report path; diagnostics and baseline tests pass.   | Caller-controlled report paths retain filesystem semantics.                      | Pending owner approval |
| `scripts/lint-diagnostics.test.mjs`               |     6 | Test fixtures use task-scoped temporary paths; baseline reconciliation passes 3/3.                  | Test-only dynamic paths remain visible to the security rule.                     | Pending owner approval |
| `scripts/readonly-props.mjs`                      |     1 | Read-only analysis resolves repository inputs; existing script tests pass.                          | Analysis input paths are runtime-selected.                                       | Pending owner approval |
| `scripts/readonly-stories.mjs`                    |     1 | Read-only Storybook analysis resolves repository inputs; existing script tests pass.                | Analysis input paths are runtime-selected.                                       | Pending owner approval |
| `scripts/safe-file-io.mjs`                        |    10 | Safe I/O wrapper validates repository boundaries; safe-file-I/O tests pass.                         | Dynamic paths are accepted by the wrapper and retain a path-based TOCTOU window. | Pending owner approval |
| `scripts/safe-file-io.test.mjs`                   |     3 | Symlink and boundary regressions exercise the wrapper contract.                                     | Test fixture paths are dynamic by design.                                        | Pending owner approval |
| `scripts/storybook-coverage-worklist.mjs`         |     3 | Nested, external, overwrite, traversal-like, and symlink-ancestor cases pass in the worklist suite. | Path validation and the later write are separate filesystem operations.          | Pending owner approval |
| `scripts/verify-rule-citations.mjs`               |     3 | Citation validation passes 121/121.                                                                 | Verifier input paths are runtime-selected.                                       | Pending owner approval |
| `scripts/verify-storybook-docs.mjs`               |     2 | Storybook documentation verification runs against task-scoped inputs.                               | Documentation input paths are runtime-selected.                                  | Pending owner approval |
| `scripts/verify-vite-build.mjs`                   |     3 | Build-verifier tests and JSON validation pass.                                                      | Build artifact paths are runtime-selected.                                       | Pending owner approval |
| `tests/helpers/safeTestFilesystem.ts`             |    11 | Shared test filesystem helper owns temporary directories and is covered by its unit tests.          | Test paths are intentionally dynamic.                                            | Pending owner approval |
| `tests/unit/config/sonarCoverageContract.test.ts` |     1 | Contract test reads repository configuration and passes in the full unit suite.                     | Test input path is runtime-selected.                                             | Pending owner approval |
| `tests/unit/e2e/playwrightStepQuality.test.ts`    |     8 | Step-quality tests read fixed repository fixtures and pass in the full unit suite.                  | Test fixture paths are dynamic to the test runner.                               | Pending owner approval |
| `tests/unit/helpers/safeTestFilesystem.test.ts`   |     1 | Symlink fixture regression passes in the full unit suite.                                           | Test fixture paths are dynamic by design.                                        | Pending owner approval |
| `tests/unit/storybook/worklist.test.ts`           |     1 | Symlink-ancestor regression passes in the Storybook unit suite.                                     | Test fixture path is dynamic by design.                                          | Pending owner approval |

## Acceptance evidence

- `npm run lint:diagnostics`: 57 findings, 0 errors.
- `npm run lint:eslint`: 0 errors, 57 warnings.
- `npm run test:lint:baseline`: 3/3 passed; actionable 57, stale 0, accepted 0,
  generated-vendor 0.
- `npm run test:storybook`: 166 files and 408 tests passed.
- `npm run test:unit` with coverage: 265 files and 3,219 tests passed.
- `git diff --check`: passed.

## Decision required

The register is complete, but the acceptance exit remains blocked until the
security owner either approves these contained exceptions or authorizes
additional remediation. The Storybook worklist entries additionally require
acceptance of the documented path-based TOCTOU residual or a stronger atomic
filesystem design.
