# Implementation Plan: ESLint Warning Remediation

## Overview

Refactor the code covered by `reports/eslint/diagnostics.json` until the
repository lint report has zero warnings and zero errors, while preserving test,
Storybook, CLI, and security behavior. The initial baseline captured when this
plan was written was 5,123 warnings across 919 files, with no errors and no
auto-fixable findings; 5,043 warnings are in `tests`, 67 are in `scripts`, 12
are in `ClientApp`, and one is in `quality`.

The work is intentionally staged by rule family. The report remains the
authoritative inventory, and every phase must regenerate it before moving to the
next phase. Existing worktree changes must be preserved; implementation should
stop and reconcile a file if its current contents differ from the working-tree
baseline captured at the start of that phase.

## Requirements

- Resolve all 5,123 diagnostics currently recorded in
  `reports/eslint/diagnostics.json`; do not hide them by disabling rules or
  lowering severities.
- Preserve observable behavior in unit tests, Storybook stories, Playwright
  steps, quality regressions, and CLI scripts.
- Keep mock factories type-safe and compatible with partial-module mocks; do not
  introduce broad `any` casts or unbounded assertion helpers.
- Treat dynamic filesystem paths, object-key access, and regular expressions as
  security-sensitive inputs. Validate or constrain them before any narrowly
  scoped lint suppression is considered.
- Enforce warnings as failures with both
  `npm run lint:eslint -- --max-warnings 0` and a report gate that fails when
  the regenerated report contains any warning or error.
- Leave generated, vendor, and unrelated pre-existing modifications unchanged.
- Maintain the existing lint/report contracts in `package.json`,
  `eslint.config.mjs`, and `scripts/lint-diagnostics.mjs` unless a report
  contract change is required to verify closure.

## Baseline Findings

| Rule family                           | Warnings | Main scope                                          |
| ------------------------------------- | -------: | --------------------------------------------------- |
| `vitest/prefer-expect-assertions`     |    2,369 | 252 unit-test files                                 |
| `vitest/require-mock-type-parameters` |    1,177 | 135 unit-test files                                 |
| `vitest/max-expects`                  |      507 | 74 unit-test files                                  |
| `vitest/prefer-strict-equal`          |      342 | 96 unit-test files                                  |
| `vitest/prefer-import-in-mock`        |      315 | 90 unit-test files                                  |
| Remaining Vitest rules                |      339 | Test structure, titles, hooks, and matcher validity |
| Security rules                        |       71 | `scripts`, Playwright steps, and one unit test      |
| Storybook/React/quality rules         |        3 | Two Storybook helpers and one quality regression    |

The highest-density files are
`tests/unit/validationSchemas/stringExtensions.test.ts` (137),
`tests/unit/routes/ta/props.test.ts` (92),
`tests/unit/routes/dashboard.test.tsx` (90),
`tests/unit/components/inputs/complexInputs.behavior.test.tsx` (87),
`tests/unit/routes/ta/supportingDocuments.test.tsx` (80), and
`tests/unit/routes/ta/rhfSupportingDocuments.test.tsx` (77). The complete set of
affected files must be derived from the report rather than copied into a
hand-maintained list.

## Architecture Changes

- `scripts/lint-diagnostics.mjs`: retain deterministic rule/file aggregation and
  use it as the phase closure gate.
- `scripts/lint-remediation-gate.mjs` and
  `scripts/lint-remediation-gate.test.mjs` (new): enforce phase targets,
  per-rule closure, residual-file checks, and batch warning deltas.
- `reports/eslint/remediation-batches.json` (new, generated from the report):
  provide the deterministic batch manifest, expected reductions, targeted test
  commands, and rollback identifiers.
- `tests/unit/**/*.test.ts` and `tests/unit/**/*.test.tsx`: adopt explicit
  assertion ownership, typed mocks, bounded assertion counts, strict equality,
  and valid test structure.
- `scripts/safe-file-io.mjs` (new): centralize root-constrained file and
  directory access for CLI scripts; all dynamic filesystem calls in Phase 4 must
  use this wrapper.
- `scripts/safe-file-io.test.mjs` (new): cover accepted paths, traversal,
  symlinks, missing files, and output roots.
- `docs/policies/eslint-security-suppressions.md` (new): document the narrow
  exception policy for unavoidable security-plugin false positives.
- `scripts/eslint-suppression-audit.mjs` and
  `scripts/eslint-suppression-audit.test.mjs` (new): verify every permitted
  security suppression against the policy ledger and reject undocumented or
  global disables.
- `scripts/test-baseline.mjs` and `scripts/test-baseline.test.mjs` (new):
  capture and compare test counts, test names, focused results, and coverage
  summaries before and after assertion-test splits.
- `scripts/*.mjs`, `scripts/*.ts`, and selected `tests/e2e` files: route dynamic
  paths and patterns through constrained helpers or static URL/path logic.
- `ClientApp/src/components/AriaComponents/GridLists/GridList.stories.tsx` and
  `quality/test_regression.ts`: apply the two remaining naming/quality fixes
  without changing public story or regression behavior.

## Enforcement Artifacts

The plan is not complete when the commands merely print useful information;
these artifacts must fail deterministically when their contracts are violated.

- `scripts/lint-remediation-gate.mjs` reads `reports/eslint/diagnostics.json`
  and `reports/eslint/remediation-batches.json`. It verifies the baseline, each
  phase target, each rule-family target, the maximum 25-file batch size, no
  unexpected residual files, and the final zero warning/error state.
- `scripts/eslint-suppression-audit.mjs` scans ESLint disable directives,
  requires an exact ledger entry in
  `docs/policies/eslint-security-suppressions.md`, and rejects global or
  file-wide disables.
- `scripts/test-baseline.mjs` stores machine-readable before/after results for a
  batch. A split is rejected if test names disappear, test counts decrease,
  focused tests fail, or coverage falls outside the documented tolerance.
- `reports/eslint/remediation-batches.json` is regenerated from the current
  diagnostics report at the start of each phase; hand-editing its file list is
  prohibited.

## Vitest Transformation Contract

- Use `expect.hasAssertions()` when a test has variable assertion paths; use
  `expect.assertions(n)` only when the exact count is stable and intentional.
- The assertion guard must be the first executable expression in the test, and
  tests with no meaningful assertion must gain a behavior assertion or be
  removed as setup-only tests.
- Type mocks from the production contract or imported module type. Approved
  patterns include `vi.fn<(...args) => Return>()`, typed
  `__ExactMockModule<...>` factories, and preserved partial `importOriginal`
  spreads. Broad `any` casts are not an accepted escape hatch.
- Replace `toEqual` with `toStrictEqual` only when the expected object/array
  contract intentionally includes shape, undefined properties, or ordering.
- Splitting a test may not remove a behavioral case, reduce its test count, or
  reduce coverage without an explicit reviewed exception in the batch manifest.

## Capacity and CI Constraints

- Run at most two independent remediation lanes in parallel: `tests/unit/**` and
  `scripts/**`/`tests/e2e/**`. Work touching the same directory remains
  sequential to avoid merge conflicts.
- Limit each lane to one batch of no more than 25 files and one active Vitest
  process. Reuse the repository’s existing 8 GB Node heap limit; do not raise it
  to mask a regression.
- Each batch gets one automatic rerun for an infrastructure failure. A second
  failure, a changed baseline, or a flaky test stops the lane for review.
- CI order is: diagnostics unit tests, report generation, remediation gate,
  ESLint with `--max-warnings 0`, type-check, focused tests, full unit and
  Storybook tests, Storybook build, quality regression, then E2E.
- A phase cannot merge its results until its gate output and batch manifest are
  archived with the report and the next phase’s baseline is regenerated.

## Batch and Rollback Strategy

- Partition the 919 affected files by rule family and directory into batches of
  no more than 25 files. Finish and verify one batch before starting another.
- Before each batch, record the affected-file hashes and capture a reversible
  binary patch outside the repository. Never use `git reset --hard` or restore
  the whole worktree because it contains pre-existing user changes.
- After each batch, run the targeted test files,
  `npm run lint:eslint -- --max-warnings 0` for the batch scope, and regenerate
  the diagnostics report.
- If a batch fails, stop, confirm the affected-file hashes have not changed
  concurrently, reverse only that batch from its saved patch, and preserve all
  earlier verified batches. Re-plan any batch that changes behavior rather than
  repeatedly retrying it.
- Record the before/after warning count and residual rule IDs for every batch;
  the phase is complete only when its expected count is reached.

## Implementation Steps

### Phase 1: Establish the baseline and the report-driven worklist — Minimum Viable

Expected exit: retain the baseline at 5,123 warnings while the gate and batch
protocol are established; no remediation is counted complete in this phase.

1. **Freeze the diagnostic inventory** (File: `reports/eslint/diagnostics.json`)
   - Action: Capture the report counts, rule IDs, affected files, line numbers,
     and representative messages. Record the current dirty-file list before any
     implementation work and use the report’s `diagnostics` array as the only
     source of affected-file scope.
   - Why: The worktree is already dirty and the report is newer than the
     tokensave index; a reproducible inventory prevents accidental overwrites
     and scope drift.
   - Dependencies: None
   - Risk: Low

2. **Preserve and test report generation** (Files:
   `scripts/lint-diagnostics.mjs`, `scripts/lint-diagnostics.test.mjs`)
   - Action: Keep deterministic ordering and add only the smallest test coverage
     needed to prove that the report distinguishes errors, warnings, rule IDs,
     files, and fixability. Do not add a suppression mechanism to the report.
   - Why: Later phases need a stable, machine-readable zero-warning gate.
   - Dependencies: Step 1
   - Risk: Low

3. **Make warnings fail the gate** (Files: `package.json`,
   `scripts/lint-diagnostics.mjs`, `scripts/lint-diagnostics.test.mjs`,
   `scripts/lint-remediation-gate.mjs`,
   `scripts/lint-remediation-gate.test.mjs`, and
   `reports/eslint/remediation-batches.json`)
   - Action: Add a `--fail-on-warnings` option to the diagnostics CLI and a
     `lint:diagnostics:check` script that regenerates the report and exits
     non-zero for any warning or error. Add the remediation gate and its tests,
     generate the batch manifest from the report, and add scripts for the
     machine-enforced phase and batch targets. Also run ESLint with
     `--max-warnings 0`; keep the ordinary report command available for the
     initial non-zero baseline.
   - Why: A report that still contains warnings must be impossible to mistake
     for a passing closure check.
   - Dependencies: Steps 1–2
   - Risk: Low

### Phase 2: Remediate the dominant Vitest assertion and mock rules — Core Experience

Expected exit: a dynamically rebaselined warning count after closing every Phase
2 diagnostic. The current report has 4,060 warnings and 1,806 Phase 2
diagnostics, so the current target is 2,254 warnings. The original 1,070 target
was based on the pre-existing 5,123-warning baseline and is superseded by the
report-driven target. No Phase 2-targeted rule may remain.

1. **Add explicit assertion ownership** (Files:
   `tests/unit/validationSchemas/stringExtensions.test.ts`,
   `tests/unit/config/workflowPolicy.test.ts`,
   `tests/unit/routes/ta/validation.test.ts`, and every file reported for
   `vitest/prefer-expect-assertions`)
   - Action: Add `expect.hasAssertions()` or an exact `expect.assertions(n)` as
     the first statement of each affected test. Where a test currently has no
     meaningful assertion, add the behavior assertion that the test name
     promises or split the setup-only test. Keep async branches deterministic.
   - Why: This resolves 2,369 findings without changing production behavior and
     makes tests fail when their assertion path is skipped.
   - Dependencies: Phase 1
   - Risk: Medium

2. **Type mock functions and mock factories** (Files:
   `tests/unit/routes/ta/props.test.ts`, `tests/unit/routes/dashboard.test.tsx`,
   `tests/unit/components/inputs/complexInputs.behavior.test.tsx`,
   `tests/unit/components/utilityCoverageSlice.test.tsx`,
   `tests/unit/routes/workflowStepComponents.test.setup.tsx`, and every file
   reported for `vitest/require-mock-type-parameters`)
   - Action: Apply the Vitest Transformation Contract: give `vi.fn` calls the
     target parameter/return types, preserve existing `__ExactMockModule`
     contracts, and type partial `importOriginal` factories from the imported
     module. Avoid `any` and do not convert a partial mock into a full fake
     implementation.
   - Why: This resolves 1,177 findings while improving compile-time guarantees
     around the existing test doubles.
   - Dependencies: Step 4 where a mock-bearing test is also assertion-heavy
   - Risk: Medium

3. **Split assertion-heavy tests by behavior** (Files:
   `tests/unit/routes/ta/props.test.ts`,
   `tests/unit/routes/acceptQuote/props.test.ts`,
   `tests/unit/routes/accountContactProps.test.ts`,
   `tests/unit/routes/common/helperFunctions.test.ts`,
   `tests/unit/utils/index.test.ts`, and every file reported for
   `vitest/max-expects`)
   - Action: Break tests exceeding the configured assertion limit into focused
     cases by load, save, validation, visibility, or error behavior. Use a
     composite matcher only when it still expresses one cohesive contract; do
     not delete assertions merely to satisfy the rule. Run each affected test
     file before and after splitting, preserve the original behavioral cases,
     and run `scripts/test-baseline.mjs` to compare test names, counts, focused
     results, and coverage for the batch. A failing comparison blocks the batch.
   - Why: This resolves 507 findings and makes failures local to one behavior.
   - Dependencies: Steps 4–5
   - Risk: High

### Phase 3: Normalize matchers and remaining test structure — Core Experience

Expected exit: a dynamically rebaselined warning count after closing the Phase 3
rule closure. The current report-driven target is 1,252 warnings; the earlier
374-warning estimate was based on a stale baseline and is superseded. No Vitest
warning may remain.

1. **Use strict equality intentionally** (Files:
   `tests/unit/routes/ta/validation.test.ts`,
   `tests/unit/routes/ta/supportingDocuments.test.tsx`,
   `tests/unit/routes/ta/rhfSupportingDocuments.test.tsx`,
   `tests/unit/routes/ta/applicationAndInstrument.test.tsx`,
   `tests/unit/config/viteConfig.test.ts`, and every file reported for
   `vitest/prefer-strict-equal`)
   - Action: Change equality assertions to `toStrictEqual` where the expected
     contract includes object shape, undefined properties, or array structure.
     Keep `toEqual` only for intentionally partial/semantic comparisons and
     document any exceptional matcher locally.
   - Why: This resolves 342 findings and makes object-contract tests more exact.
   - Dependencies: Phase 2
   - Risk: Medium

2. **Convert mock imports without breaking partial mocks** (Files:
   `tests/unit/routes/workflowStepComponents.test.setup.tsx`,
   `tests/unit/routes/quotationAndReports.test.tsx`,
   `tests/unit/routes/dashboard.test.tsx`,
   `tests/unit/instrumentation/appInsightsService.test.ts`, and every file
   reported for `vitest/prefer-import-in-mock`)
   - Action: Manually convert static mock module specifiers to the documented
     dynamic-import form, retaining typed `importOriginal` factories and the
     existing partial-module shapes. Run TypeScript immediately after each batch
     because the repository intentionally disables the automatic fixer for this
     rule.
   - Why: This resolves 315 findings without applying the unsafe fixer called
     out in `eslint.config.mjs`.
   - Dependencies: Step 5
   - Risk: High

3. **Resolve structural Vitest findings** (Files:
   `tests/unit/storybook/storybookDocsConfig.test.ts`,
   `tests/unit/storybook/mswHandlers.test.ts`,
   `tests/unit/config/eslintPolicy.test.ts`,
   `tests/unit/config/viteConfig.test.ts`,
   `tests/unit/components/inputs/complexInputs.behavior.test.tsx`, and every
   file reported for the remaining `vitest/*` rules)
   - Action: Add top-level `describe` wrappers, move hooks before tests and
     before cleanup hooks, remove duplicate hooks, replace conditional tests and
     conditional expectations with separate cases or precomputed values, repair
     invalid matcher argument counts, add messages to `toThrow`, fix duplicate
     titles, and make all titles literal or valid function/class names.
   - Why: This closes the remaining test-structure findings without weakening
     Vitest rules.
   - Dependencies: Steps 4–8
   - Risk: Medium

### Phase 4: Harden scripts, E2E inputs, Storybook, and quality checks — Edge Cases

1. **Constrain dynamic filesystem access** (Files:
   `scripts/audit-coverage-report.ts`, `scripts/audit-storybook-log.ts`,
   `scripts/bundle-size.mjs`, `scripts/check-react19-readiness.mjs`,
   `scripts/readonly-props.mjs`, `scripts/readonly-props.test.mjs`,
   `scripts/readonly-stories.mjs`, `scripts/readonly-stories.test.mjs`,
   `scripts/sonar-issues-backlog.mjs`, `scripts/type-check-diagnostics.mjs`,
   `scripts/validate-json.mjs`, and `scripts/verify-auth-redirect-bridge.mjs`)
   - Action: Create `docs/policies/eslint-security-suppressions.md` before
     implementation. Its policy is: default to a code fix; allow a local
     security-rule suppression only when the input is demonstrably constrained,
     the rule has an AST false positive, the invariant has a regression test,
     and the file/rule/line/rationale is recorded in the policy ledger. Global
     or file-wide disables are prohibited. Then validate CLI paths against the
     intended project/report/output roots, reject traversal and symlink escapes,
     and pass only validated paths to `scripts/safe-file-io.mjs` before
     filesystem calls. Keep any permitted security-plugin suppression limited to
     that validated wrapper and explain the invariant in the comment. Run
     `scripts/eslint-suppression-audit.mjs` before accepting the batch.
   - Why: This addresses 56 non-literal-filename warnings as real path-safety
     work rather than cosmetic suppression.
   - Dependencies: Phase 3
   - Risk: High

2. **Remove object-injection sinks** (Files: `scripts/coverage-gap-queue.mjs`,
   `scripts/run-api-contract-tests.mjs`, `scripts/sonar-issues-backlog.mjs`,
   `scripts/verify-auth-redirect-bridge.mjs`, and
   `tests/unit/config/eslintPolicy.test.ts`)
   - Action: Replace unchecked dynamic object indexing with `Map` lookups,
     `Object.hasOwn`-guarded access, or typed entry iteration. Preserve the
     current missing-key behavior and add regression assertions for unknown
     keys.
   - Why: This addresses 12 object-injection warnings without hiding unsafe
     input handling.
   - Dependencies: Step 10 where the same script handles filesystem inputs
   - Risk: Medium

3. **Replace dynamic and unsafe regular expressions** (Files:
   `tests/e2e/features/@type-approval/steps.ts`,
   `tests/e2e/steps/common.steps.ts`, and
   `tests/unit/storybook/reactAriaEvaluationContract.test.ts`)
   - Action: Use URL pathname parsing or Playwright URL predicates for the two
     dynamic URL checks, and replace the unsafe dynamic pattern in the React
     Aria contract test with bounded literal matching or a safe parser. Add
     cases for unsupported locations and malformed patterns.
   - Why: This resolves two non-literal-regexp and one unsafe-regex warning
     while preserving the user-visible journeys.
   - Dependencies: Phase 3
   - Risk: Medium

4. **Close the isolated UI and quality findings** (Files:
   `ClientApp/src/components/AriaComponents/GridLists/GridList.stories.tsx`,
   `ClientApp/src/components/Layout/Layout.test.tsx`,
   `ClientApp/src/hooks/useRouteAccessibility.test.ts`,
   `ClientApp/src/types/wafError.test.ts`, and `quality/test_regression.ts`)
   - Action: Rename `renderExample` and `renderSections` to PascalCase story
     helpers while preserving the exported story behavior; resolve the test
     title/hook findings in the three ClientApp files; and rename the non-hook
     `use...` helper in `quality/test_regression.ts` without changing the
     regression contract.
   - Why: These six findings are small, isolated, and should not remain after
     the broad test remediation.
   - Dependencies: Phase 3
   - Risk: Low

### Phase 5: Closure, regression, and cleanup — Optimization / Verification

Expected exit: 0 warnings and 0 errors, with the suppression ledger empty or
containing only individually justified, tested, and reviewed entries.

1. **Regenerate and reconcile the report** (Files:
   `reports/eslint/diagnostics.json`, `scripts/lint-diagnostics.mjs`)
   - Action: Run the report generator, compare counts by rule and file against
     the prior phase, and investigate every residual diagnostic. The final
     report must contain zero errors, zero warnings, and no unaccounted files.
   - Why: A passing command is insufficient if the report still contains a
     warning or if a changed file fell outside the lint patterns.
   - Dependencies: Steps 4–13
   - Risk: Medium

2. **Run the complete validation matrix** (Files: `package.json`,
   `reports/eslint/diagnostics.json`)
   - Action: Run `npm run test:lint:diagnostics`,
     `npm run lint:eslint -- --max-warnings 0`,
     `npm run lint:diagnostics:check`, `node scripts/lint-remediation-gate.mjs`,
     `node scripts/eslint-suppression-audit.mjs`, `npm run type-check`, targeted
     unit suites for each touched hotspot, `npm run test:unit`,
     `npm run test:storybook`, `npm run build-storybook`,
     `npm run test:quality:regression`, and the relevant Playwright BDD suites
     for the changed E2E helpers. Run the report gate again after the final code
     change.
   - Why: The warning set spans unit tests, Storybook tests, quality tests,
     scripts, and Playwright steps; each runtime surface needs evidence.
   - Dependencies: Step 14
   - Risk: Medium

3. **Review the final diff against the dirty baseline** (File: repository root
   working tree; affected files are enumerated by
   `reports/eslint/diagnostics.json`)
   - Action: Confirm every changed line is attributable to a reported warning,
     generated/vendor boundaries are untouched, no unrelated pre-existing edits
     were overwritten, and no temporary logs or debug dumps remain.
   - Why: The checkout began with extensive user modifications and requires a
     clean handoff.
   - Dependencies: Step 15
   - Risk: Low

## Testing Strategy

### Phase 1

- Unit: `scripts/lint-diagnostics.test.mjs`.
- Integration: regenerate `reports/eslint/diagnostics.json` and verify stable
  counts and ordering; confirm the warning-failing gate intentionally fails on
  the baseline. Test `scripts/lint-remediation-gate.test.mjs` against baseline,
  phase, batch-size, residual-file, and final-zero fixtures.
- E2E: none.

### Phase 2

- Unit: targeted Vitest files named in Steps 4–6, then `npm run test:unit`.
- Integration: type-check all typed mock changes with `npm run type-check`.
- Regression: compare each split test file’s before/after test count and run its
  focused suite before accepting the batch using `scripts/test-baseline.mjs`.
- E2E: none unless a changed shared fixture is consumed by BDD tests.

### Phase 3

- Unit: all touched Vitest files, especially `tests/unit/storybook` and
  `tests/unit/config`.
- Integration: `npm run test:storybook`, `npm run build-storybook`, and the unit
  coverage suite.
- E2E: `npm run test:e2e:storybook` if Storybook stories or story helpers
  change.

### Phase 4

- Unit: new or updated script tests, `tests/unit/config/eslintPolicy.test.ts`,
  and `tests/unit/storybook/reactAriaEvaluationContract.test.ts`.
- Integration: run each affected CLI script against valid, missing, traversal,
  symlink, and malformed-input fixtures; verify the shared filesystem helper’s
  root and symlink invariants. Run `scripts/eslint-suppression-audit.test.mjs`
  against approved and rejected ledger entries.
- E2E: `npm run test:e2e:app` for the changed URL helpers and
  `npm run test:e2e:storybook` for the changed Storybook story. Assert exact
  pathname behavior for supported and unsupported URL locations.

### Phase 5

- Unit: `npm run test:unit`, `npm run test:storybook`, and
  `npm run test:quality:regression`.
- Integration: `npm run lint:eslint`, `npm run type-check`, and the zero-warning
  diagnostics report, including `npm run lint:diagnostics:check` and
  `npm run build-storybook`.
- E2E: the affected app and Storybook BDD suites, followed by `npm run test:e2e`
  if the focused runs pass.

## Current Execution Status — 2026-10-26

Phase 2 manifest generation is repaired and currently produces 4 remaining
batches with no batch larger than 25 files. The current diagnostics baseline
contains 3,658 warnings, zero errors, and 99 remaining Phase 2 batch files; its
dynamically rebaselined Phase 2 target is 2,246 warnings. The manifest
structural suite passes all 12 tests.

Typed-mock remediation has been split into small, independently verified slices.
The previously completed slices in this continuation covered nine files:

- PDF utilities: `ViewPdfButton`, `ViewPdfQuote`, and `ViewPdfQuoteTerms`.
- Error/Formik controls: `errorBoundary`, `buttonControls`, and
  `contactDetails.branches`.
- Form shell contracts: `errorSummary`, `unsavedChangesPrompt`, and
  `shellContract`.

These slices removed 54 `vitest/require-mock-type-parameters` warnings in total
(1,111 to 1,057). Each focused suite passed: 16/16, 20/20, and 51/51 tests;
repository type-checking, targeted typed-mock lint, diff checks, and the
manifest tests also passed. One fixture-contract correction was required for the
Formik wrapper callback shape, and it passed re-verification.

The two additional Phase 2 slices in this continuation removed 94 warnings from
the persisted report as observed in-session: 64 from
`utilityCoverageSlice.test.tsx` and 30 from `searchFilter.behavior.test.tsx`
(4,154 to 4,060). No prior 4,154-warning report is retained as an artifact, so
that historical delta is recorded evidence rather than independently
reproducible from the current checkout. Their focused suites passed 21/21 and
10/10 tests, respectively; type-checking and the targeted Phase 2 lint rules
passed after each slice. The diagnostics report and Phase 2 manifest were
regenerated after the second slice.

The original Phase 2 batch-1 cohort was then remediated: 25 files, 179 Phase 2
diagnostics, and 275 tests. The complete cohort suite passed 25/25 files and
275/275 tests; the Phase 2-only lint gate, type-check, diagnostics tests, and
remediation-gate tests also passed. Verification initially exposed six test
failures and three type errors; targeted corrections resolved them before the
final batch run. The regenerated report now contains 3,879 warnings and zero
errors, with five Phase 2 batches and 124 files remaining.

The next Phase 2 batch was remediated in this execution: 25 files and 215 Phase
2 diagnostics (132 `vitest/prefer-expect-assertions`, 75
`vitest/require-mock-type-parameters`, and 8 `vitest/max-expects`). The current
report decreased from 3,879 to 3,658 warnings, with zero errors; the additional
six-warning reduction came from the same touched files' later-phase diagnostics.
The Phase 2-only ESLint check returned exit code 0 for all 25 files. Type-check,
Prettier, diff checks, diagnostics tests (2/2), and remediation-gate tests
(12/12) passed. The focused rerun of the three files affected by typed
constructor/logging corrections passed 29/29 tests.

The full explicit cohort Vitest run collected 22 test files and 153 tests: 21
files passed with 151 tests passing, while two assertions in
`tests/unit/config/vscodeProblemsConfig.test.ts` failed because the unchanged
`.vscode/settings.json` lacks the expected `sonarlint.focusOnNewCode` keys.
Those configuration assertions are outside this warning-remediation change and
were not weakened or bypassed; they remain an open baseline issue.

The Phase 2 gate remains intentionally open: it reports 3,658 warnings against
the dynamically rebaselined 2,246 target and still identifies
`vitest/max-expects`, `vitest/prefer-expect-assertions`, and
`vitest/require-mock-type-parameters` as open closure rules. Full unit,
Storybook, regression, E2E, and zero-warning validation remain outstanding.

The roster check is now verified: `python scripts/roster.py verify` reports 17
active agents, 19 active skills, and installed Codex project files.

### Continuation update — 2026-10-26 (Phase 2 batch 1)

The manifest-defined next Phase 2 batch was executed across 25 files. The
pre-edit batch snapshot observed in-session contained 571 diagnostics. The
batch's four Phase 2 closure rules were removed from all 25 files; the current
diagnostics report contains zero findings for those rules in the batch files.
The current repository-wide report contains 3,404 warnings and zero errors. The
batch-file snapshot contains 573 diagnostics, including later-phase and
non-closure diagnostics that remain outside this batch's acceptance scope.

Evidence recorded for this batch:

- Focused ESLint with `vitest/prefer-expect-assertions`,
  `vitest/require-mock-type-parameters`, `vitest/max-expects`, and
  `vitest/prefer-import-in-mock` as errors: exit code 0 for all 25 files.
- `npm run type-check`: exit code 0.
- Prettier check for all 25 files: exit code 0.
- `git diff --check`: exit code 0.
- Full explicit cohort Vitest run: 25/25 files and 339/339 tests passed.
- `npm run test:lint:diagnostics`: 2/2 tests passed.
- `npm run test:lint:remediation`: 12/12 tests passed.
- `npm run lint:remediation:gate -- --phase phase-2`: not passed because the
  manifest still represents the remaining Phase 2 batches; it expects the
  phase-final 2,504-warning target while the current report has 3,404 warnings,
  and the closure rules remain in later unprocessed batch files.

The batch is therefore behaviorally and statically verified in isolation, but
the Phase 2 closure gate remains open. Static `vi.mock` calls in partial mocks
retain narrow local `vitest/prefer-import-in-mock` suppressions because the
dynamic-import overload was incompatible with the existing partial factory
types; this is an explicit residual maintainability risk, not an unverified
claim that all mocks were converted.

### Follow-up correction — 2026-10-26 (VS Code settings cohort failures)

The two previously reported failures in
`tests/unit/config/vscodeProblemsConfig.test.ts` were resolved. The root cause
was a malformed `.vscode/settings.json` TypeScript language-scope block in the
dirty worktree, together with the missing `sonarlint.focusOnNewCode` setting.
The JSON structure was restored and the setting was added as `true`; the test
assertions were not weakened.

Verification evidence: the focused suite passed 9/9 tests, direct `JSON.parse`
confirmed valid settings JSON and `focusOnNewCode: true`, `npm run type-check`
passed, and `git diff --check` passed.

### Continuation update — 2026-10-26 (Phase 2 batch 2)

The manifest-defined Phase 2 batch 2 was executed across 25 files. The pre-edit
snapshot contained 424 diagnostics, including 307 closure-rule diagnostics: 169
`vitest/prefer-expect-assertions`, 74 `vitest/max-expects`, and 64
`vitest/require-mock-type-parameters`. After the batch, the current batch
contains zero findings for those three rules; its total snapshot is 394
diagnostics.

Evidence:

- Focused ESLint for all 25 files, with the three target rules as errors:
  exit 0.
- `npm run type-check`: exit 0.
- Prettier check for all 25 files: exit 0.
- `git diff --check`: exit 0.
- Batch Vitest: 25/25 files and 206/206 tests passed.
- `npm run test:lint:diagnostics`: 2/2 tests passed.
- `npm run test:lint:remediation`: 12/12 tests passed.
- `npm run lint:diagnostics`: current report contains 3,375 warnings and 10
  errors.
- `npm run lint:remediation:gate -- --phase phase-2`: not passed; the report
  contains 3,375 warnings versus the phase target of 2,504, 10 errors versus the
  expected 0, and closure-rule findings remain in batch 3.

At the time of batch 2 verification, the 10 repository-wide errors were outside
that batch, in the already-modified
`tests/unit/components/steppedNavigation.test.tsx`, and were preserved as
pre-existing worktree issues. The batch was verified in isolation;
repository-wide Phase 2 closure was not verified.

### Continuation update — 2026-10-27 (Phase 2 batch 3)

The manifest-defined Phase 2 batch 3 was executed across 24 files. The pre-edit
batch snapshot contained 233 diagnostics, including all 189 remaining closure-
rule diagnostics: 113 `vitest/prefer-expect-assertions`, 64
`vitest/max-expects`, and 12 `vitest/require-mock-type-parameters`. After the
batch, the current batch contains zero findings for those three rules and 61
non-target diagnostics remain.

Evidence:

- Focused ESLint for all 24 files, with the three target rules as errors and
  `--quiet`: exit 0.
- `npm run type-check`: exit 0.
- Prettier check for all 24 files: exit 0.
- `git diff --check`: exit 0.
- Batch Vitest: 24/24 files and 286/286 tests passed.
- `npm run test:lint:diagnostics`: 2/2 tests passed.
- `npm run test:lint:remediation`: 12/12 tests passed.
- Final repository diagnostics: 3,167 warnings and 0 errors.
- `npm run lint:remediation:gate -- --phase phase-2`: not passed; the report
  contains 3,167 warnings versus the phase target of 2,504. No Phase 2 closure
  rule residual was reported by the gate.

The batch is verified in isolation. Full Phase 2 completion remains unverified
because the repository still exceeds the phase warning target and retains
non-target diagnostics for later remediation phases. The cohort Vitest run also
reported the existing non-blocking Vite native-config warning about the missing
`.ts` extension in `vitest.config.ts`.

### Continuation update — 2026-10-27 (dynamic partial-mock adapter)

The remaining narrow `vitest/prefer-import-in-mock` suppressions were removed
from the 22-file partial-mock cohort. A typed
`__DynamicPartialMockFactory<TModule>` adapter was added to the shared test mock
types. The affected mocks now use dynamic `import(...)` module arguments, with
the adapter providing the explicit type boundary required by Vitest's dynamic
overload while preserving each factory's partial return value. One explicit
`importOriginal<Record<string, unknown>>()` call was narrowed to the
module-inferred `importOriginal()` form after type-checking identified the
overload constraint.

Evidence:

- Focused ESLint with `vitest/prefer-import-in-mock` as an error: exit 0 for all
  22 files.
- Exact suppression-phrase search: zero matches in `tests`.
- `npm run type-check`: exit 0.
- Prettier check for the helper and all 22 affected files: exit 0.
- `git diff --check`: exit 0.
- Focused Vitest: 22/22 files and 283/283 tests passed.
- Secret scan: no issues found for the helper, affected tests, and this plan.

The adapter refactor is verified in isolation. Full Phase 2 completion remains
unverified because the repository still contains the broader non-target
diagnostic backlog and unrelated dirty-worktree changes. The focused Vitest run
retained the non-blocking Vite native-config warning about the missing `.ts`
extension in `vitest.config.ts`.

### Continuation update — 2026-10-27 (merge-readiness review)

The current bounded remediation slice is verified in isolation, but the branch
is not merge-ready. The slice renamed the GridList story helpers and updated
their Storybook unit consumer, replaced the two dynamic E2E URL regular
expressions with pathname predicates, removed the unnecessary `use` prefix in
the quality regression mock, converted the touched Vitest partial mocks to the
typed dynamic-import adapter, and replaced hook-based test resets with explicit
per-test reset ownership in the touched modal cohorts.

Evidence for the latest slice:

- The focused modal cohort passed 55/55 tests across four files; the two
  additional mock-import fixes passed 7/7 tests across two files.
- TypeScript, Prettier, scoped ESLint, and `git diff --check` passed for the
  touched slices. Secret scans reported no issues for the newly edited files.
- The regenerated diagnostics report contains 492 warnings and zero errors, down
  from 536 warnings at the start of this continuation. The remaining inventory
  includes 56 non-literal filesystem warnings, 12 object-injection warnings, and
  unresolved Vitest structure/matcher/import warnings.
- `npm run test:lint:diagnostics` passed 2/2 tests and
  `npm run test:lint:remediation` passed 12/12 tests.
- `npm run lint:eslint -- --max-warnings 0`, `npm run lint:diagnostics:check`,
  and the phase-5 remediation gate fail on the remaining 492 warnings. The full
  unit suite produced no progress output after repeated 30-second polls and was
  interrupted; its result is not verified.

The plan remains PARTIALLY VERIFIED and the branch remains NOT READY for merge.
The next required work is the remaining phase-5 security/path-safety batch and
residual Vitest rule families; a fresh full-unit run and the complete Storybook,
quality, build, and E2E matrix remain required before merge.

### Continuation update — 2026-10-27 (security and Vitest residual remediation)

The follow-up remediation removed the remaining security/path-safety findings
and reduced the current diagnostic inventory from 492 to 75 warnings, with zero
errors. A shared `scripts/safe-file-io.mjs` boundary helper, declaration file,
and regression test now constrain caller-supplied file paths to an explicit
root. The redirect-bridge verifier was corrected to declare its temporary
distribution directory as that root after focused verification exposed the
legitimate external-fixture boundary.

The Vitest residual work removed strict-equality, dynamic-mock-import,
unbound-method, conditional-expect, matcher, title, and several lifecycle
warnings. Remaining diagnostics are 61 `vitest/no-hooks`, 8
`vitest/require-top-level-describe`, and 6 `vitest/no-conditional-in-test`. The
only remaining hook suppressions are narrow, documented exceptions for shared
MSW and external-process cleanup lifecycles; no global rule suppression was
added.

Evidence:

- Fresh ESLint JSON diagnostics: 75 warnings and 0 errors.
- Secret scan of the diagnostics report and all newly edited files: no issues.
- Focused safe-file/script tests: 19/19 passed.
- Focused evidence-freshness tests: 10/10 passed.
- Focused preconditions tests: 24/24 passed.
- Focused delivery/return bridge tests: 9/9 passed.
- Focused helper/display/module-coverage cohort: 95/95 passed.
- Focused redirect-bridge, coverage-lint, and MSW cohort after the boundary
  correction: 23/23 passed.
- Targeted TypeScript, Prettier, and ESLint checks passed for the latest
  cohorts. The Vite native-config message about the missing `.ts` extension is
  non-blocking and remains an environment/tooling warning, not an ESLint
  diagnostic.
- `npm run lint:eslint -- --max-warnings 0` failed with the 75 remaining
  warnings; `npm run lint:diagnostics:check` failed for the same reason.
- `npm run lint:remediation:gate -- --phase phase-5` failed because the report
  still contains 75 warnings and the three closed residual rule families are
  `vitest/no-conditional-in-test`, `vitest/no-hooks`, and
  `vitest/require-top-level-describe`.

The plan remains PARTIALLY VERIFIED and the branch remains NOT READY for merge.
The zero-warning lint gate, full unit suite, Storybook build/tests, quality
regression, and E2E matrix are still not verified. The current remaining work is
the explicit ownership conversion for the 61 ordinary test lifecycle hooks and
the six conditional-in-test cases, followed by the full verification matrix.

### Current status — 2026-10-27

**PARTIALLY VERIFIED — NOT READY FOR MERGE**

The authoritative ESLint report was regenerated after the diagnostic gate
overwrote the report path with its summary format. The fresh report contains 75
warnings and 0 errors: 61 `vitest/no-hooks`, 8
`vitest/require-top-level-describe`, and 6 `vitest/no-conditional-in-test`. The
zero-warning lint and Phase 5 remediation gates therefore remain failed.

Next action: convert the remaining ordinary lifecycle hooks and conditional test
branches, regenerate the report, then run the full unit, Storybook, quality, and
E2E verification matrix before preparing the merge commit.

### Finishing review — 2026-10-27

The branch was reviewed against the finishing-a-development-branch criteria.
TypeScript type-checking and `npm run build-storybook` passed. The full unit
suite and `npm run test:storybook` both started but produced no test progress
after 30 seconds and were interrupted; neither is verified. The authoritative
ESLint report was regenerated after those checks and remains at 75 warnings and
0 errors. The zero-warning lint gate therefore still fails.

The worktree contains 196 changed or untracked paths. No generated/vendor paths
were detected in the changed-path review, and `git diff --check` passes. No
commit, push, merge, or PR creation was performed. The branch remains
**PARTIALLY VERIFIED — NOT READY FOR MERGE**.

### Continuation update — 2026-10-27 (explicit per-test lifecycle ownership)

The remaining Vitest lifecycle warnings were refactored to explicit per-test
reset/setup functions. Ordinary suites now own their mock state after
`expect.hasAssertions()`, and the configuration/helper suites use Vitest's
`onTestFinished` for cleanup. No lint suppression or global rule change was
introduced. The six conditional-test cases and eight top-level-describe cases
were also resolved in the preceding cohorts.

Evidence:

- Fresh repository-scoped ESLint JSON diagnostics: 0 warnings and 0 errors.
- `npm run lint`: passed, including the source formatting contract.
- `npm run lint:diagnostics:check`: passed.
- `npm run lint:remediation:gate -- --phase phase-5`: passed.
- `npm run test:lint:diagnostics`: 2/2 tests passed.
- `npm run test:lint:remediation`: 12/12 tests passed.
- `npm run type-check`: passed after the final lifecycle refactor.
- Focused final lifecycle cohort: 4 files and 63/63 tests passed.
- Focused ordinary route cohorts: 7 files and 160/160 tests passed, plus earlier
  cohorts of 6 files and 163/163 tests, 4 files and 39/39 tests, and 4 files and
  23/23 tests.
- `npm run build-storybook`: passed; Vite transformed 3,861 modules and wrote
  `storybook-static` successfully.
- Full `npm run test:unit`: NOT VERIFIED. After 30 seconds it had emitted only
  the Vitest startup banner and was interrupted.
- Full `npm run test:storybook`: NOT VERIFIED. It emitted the expected
  ErrorBoundary story traces but no test-file summary after an additional
  observation window and was interrupted.

The zero-warning lint and static build criteria are verified. The full test
criteria remain unverified, so the plan remains **PARTIALLY VERIFIED — NOT READY
FOR MERGE**. The branch still contains the pre-existing dirty worktree; no
commit, push, merge, or PR creation was performed. The Vite native-config
missing-extension message remains a non-blocking tool warning, not an ESLint
diagnostic.

### Verification update — 2026-10-27 (full-suite completion)

The first bounded full-unit run exposed nine concrete failures after executing
260 files and 2,900 tests. Seven were caused by the safe-file-IO boundary
receiving explicitly created temporary Sonar fixture/output directories without
their declared roots; the backlog script now selects the repository root for
relative paths and the caller-owned absolute directory for absolute paths. Two
TA type assertions now compare the class's own fields with strict equality
instead of comparing a class instance to a plain object.

Evidence after correction:

- Focused regression verification: 14/14 tests passed across the Sonar backlog
  and TA type suites; type-check, formatting, and scoped ESLint passed.
- Full unit suite with the reproducible bounded-worker command
  `npm run test:unit -- --pool=forks --maxWorkers=2 --reporter=dot`: 260/260
  files and 2,900/2,900 tests passed.
- Full Storybook suite with the same bounded-worker mode: 150/150 files and
  373/373 tests passed. The intentional ErrorBoundary story render traces were
  emitted as expected; the run exited successfully.
- `npm run test:quality:regression`: 1/1 files and 8/8 tests passed.
- Final `npm run lint`: passed.
- Final `npm run lint:diagnostics:check`: passed.
- Final `npm run lint:remediation:gate -- --phase phase-5`: passed.
- Fresh direct ESLint JSON diagnostics: 0 warnings and 0 errors.
- Final `git diff --check`: passed.

The default Vitest worker mode still produced only its startup banner during the
earlier diagnostic attempts, but the bounded forked-worker execution is an
independently reproducible full-suite pass for both configured suites. The
requested ESLint and full configured Vitest blockers are VERIFIED. The broader
merge matrix still requires the E2E suites, which were not run in this pass. The
branch still has the pre-existing dirty worktree and no commit, push, merge, or
PR creation was performed.

## Success Criteria

- [ ] `reports/eslint/diagnostics.json` reports zero warnings and zero errors.
- [ ] `npm run lint:eslint -- --max-warnings 0` and
      `npm run lint:diagnostics:check` both fail when a warning is introduced.
- [ ] `scripts/lint-remediation-gate.mjs` enforces the baseline, phase targets,
      batch size, residual-file policy, and final zero-warning state.
- [ ] No lint rule is disabled, downgraded, or globally suppressed to obtain
      closure.
- [ ] Any unavoidable security suppression satisfies
      `docs/policies/eslint-security-suppressions.md` and has a regression test.
- [ ] Dynamic filesystem, object-key, and regular-expression inputs are
      validated or constrained, with regression tests for hostile inputs.
- [ ] All touched unit, Storybook, quality, and E2E tests pass.
- [ ] Test-baseline comparisons show no deleted test names, reduced test counts,
      focused failures, or unexplained coverage regression.
- [ ] TypeScript type-checking passes.
- [ ] `npm run build-storybook` passes and the affected Storybook stories retain
      their expected exports and interactions.
- [ ] Story names, mock contracts, assertion ownership, matcher strictness, and
      hook ordering satisfy their respective rules.
- [ ] The final diff contains no unrelated churn and preserves all pre-existing
      worktree changes.

## Open Questions

- The A Team roster check is resolved for this checkout:
  `python scripts/roster.py verify` reports 17 active agents, 19 active skills,
  and installed Codex project files.
- The shared filesystem helper is now a committed plan decision: use
  `scripts/safe-file-io.mjs` and cover it with `scripts/safe-file-io.test.mjs`.
