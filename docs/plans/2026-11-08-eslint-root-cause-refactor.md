# Implementation Plan: Root-Cause ESLint Remediation

## Overview

Refactor the code identified by `reports/eslint/diagnostics.json` so the
remaining ESLint findings are resolved through safer data flow, clearer types,
and correct React lifecycle behavior. The report contains 287 diagnostics (215
errors and 72 warnings), led by unsafe enum assignments, dynamic filesystem
paths, render-time ref access, and conditional React rendering.

The approved Webpack-to-Vite spec lists unrelated application refactors as out
of scope, but the explicit request for ESLint remediation supersedes that scope
for this plan. Existing intentional `eslint-disable-next-line` exceptions must
be preserved and reviewed, not deleted; no new broad suppression, ignore, or
severity downgrade is part of this work.

## Requirements

- Regenerate the ESLint report from the current worktree before editing. The
  checked-in report contains a stale missing-file diagnostic for
  `ClientApp/src/components/Inputs/.remember/tmp/last-ndc.ts`; this is currently
  an untracked scratch artifact and must be reconciled before triage.
- Fix actionable findings in source, tests, stories, and scripts rather than
  hiding them in `eslint.config.mjs`.
- Preserve the existing user modification in
  `tests/helpers/safeTestFilesystem.ts` and preserve any intentional inline
  exceptions that are confirmed during the baseline review.
- Do not edit generated API output, vendor mirrors, captured source maps, or
  other generated artifacts.
- Preserve observable form, dashboard, quotation, Storybook, and filesystem
  helper behavior.
- Finish with no unapproved diagnostics. Any remaining security-wrapper
  exception must have structural path validation, regression coverage, and an
  explicit owner decision; it must not be silently ignored.

## Architecture Changes

- `ClientApp/src/components/Inputs/useRhfFieldA11y.ts`: expose render-safe field
  values and handlers so RHF inputs do not treat a ref-bearing controller object
  as render data.
- `ClientApp/src/routes/common/`: add or extend narrow runtime enum mappers and
  guards at the handwritten API boundary; keep
  `ClientApp/src/api/web-api-client.ts` unchanged.
- `tests/helpers/safeTestFilesystem.ts` and `scripts/safe-file-io.mjs`: keep all
  filesystem operations behind root-constrained helpers and test traversal and
  symlink/real-path behavior explicitly.
- `scripts/lint-diagnostics.mjs`: make baseline generation deterministic and
  testable without filtering out real parser or lint failures.

## Implementation Steps

### Phase 1: Baseline, exception inventory, and safety foundations — Minimum Viable

1. **Reconcile the diagnostic baseline** (File:
   `reports/eslint/diagnostics.json`)
   - Action: Regenerate the report with `npm run lint:diagnostics`; compare the
     result with the current 287-finding inventory; identify all existing
     `eslint-disable-next-line` exceptions and classify each finding as
     actionable, intentionally accepted, stale, or generated/vendor.
   - Why: The report is evidence, not a reliable current source of truth; the
     missing `.remember` path and the modified filesystem helper could otherwise
     lead to deleting valid work or planning against stale diagnostics.
   - Dependencies: None
   - Risk: Low

2. **Make report generation deterministic** (File:
   `scripts/lint-diagnostics.mjs`)
   - Action: Add focused coverage for the configured lint globs, fatal parser
     diagnostics, and output-path handling; ensure the script reports missing or
     transient files instead of silently filtering them. Keep its output write
     inside the repository root and do not add an ESLint suppression.
   - Why: The report currently flags a file that exists now but was absent when
     the report was generated, so repeatable triage is required before fixes.
   - Dependencies: Step 1
   - Risk: Medium

3. **Harden dynamic filesystem boundaries** (File:
   `tests/helpers/safeTestFilesystem.ts`)
   - Action: Preserve the existing user change, then consolidate path
     normalization and root checks so every read, write, directory, stat, and
     existence operation receives the same validated absolute path. Add tests
     for `..` traversal, absolute paths, sibling prefixes, and allowed nested
     paths.
   - Why: The `security/detect-non-literal-fs-filename` findings represent real
     dynamic inputs. A single auditable boundary and tests address the security
     risk instead of merely disabling the rule.
   - Dependencies: Step 1
   - Risk: Medium

4. **Apply the same boundary contract to tooling I/O** (File:
   `scripts/safe-file-io.mjs`)
   - Action: Align `safePath`, `realPath`, and all wrapper functions with the
     test helper's traversal contract; add script-level tests for symlink
     escape, output-root containment, and rejected paths. Keep the existing
     intentional exception decision separate from ordinary application
     diagnostics.
   - Why: The script wrappers account for 41 security findings across tooling
     and tests; the fix must demonstrate containment rather than hide the calls.
   - Dependencies: Step 3
   - Risk: Medium

5. **Remove object-injection risk from progress state** (File:
   `ClientApp/src/components/Progress/ProgressFileList.tsx`)
   - Action: Replace dynamic indexing of `cancelling[fileName]` with a typed
     `Map<string, boolean>` or an own-key lookup established at the state
     boundary; update the prop type and component tests accordingly.
   - Why: This is a concrete `security/detect-object-injection` sink and can be
     fixed without changing the security policy.
   - Dependencies: Step 1
   - Risk: Low

#### Phase 1 testing

- Unit: `scripts/lint-diagnostics.test.mjs`, the safe filesystem helper tests,
  and `ProgressFileList` tests.
- Integration: `npm run lint:diagnostics` against a clean current worktree and
  traversal/symlink checks through the script helpers.
- E2E: No new journey; run the existing upload/progress coverage if the state
  representation changes.

### Phase 2: React render purity, refs, and effect lifecycles — Core Experience

1. **Refactor the shared RHF field adapter** (File:
   `ClientApp/src/components/Inputs/useRhfFieldA11y.ts`)
   - Action: Return explicitly named render values and event handlers instead of
     exposing a ref-bearing `field` object to every JSX consumer; keep the RHF
     registration ref as a narrowly scoped DOM attachment. Update the RHF input
     components to use the new contract.
   - Why: `react-hooks/refs` is repeated across `RhfTextInput`,
     `RhfTextAreaInput`, `RhfCheckbox`, `RhfSelectInput`,
     `RhfAutoSuggestContainer`, `RhfRadioButtonGroup`, `RhfNumberInput`, and
     related lookup/date inputs. A shared fix prevents inconsistent local
     workarounds.
   - Dependencies: Phase 1, Step 1
   - Risk: High

2. **Update the RHF input family without leaking conditional values** (File:
   `ClientApp/src/components/Inputs/RhfTextInput/index.tsx`)
   - Action: Apply the shared adapter to `RhfTextInput`, `RhfTextAreaInput`,
     `RhfCheckbox`, `RhfSelectInput`,
     `RhfAutoSuggest/RhfAutoSuggestContainer.tsx`, `RhfRadioButtonGroup`, and
     `RhfNumberInput`; replace `condition && node` expressions where the
     condition can be a string or React node with explicit boolean checks and
     `null` branches.
   - Why: This addresses the 30 render-ref findings and 26 leaked conditional
     rendering findings as one component-family refactor while preserving
     labels, help text, validation, summary mode, and focus behavior.
   - Dependencies: Step 1
   - Risk: High

3. **Remove render-time ref mutation and stabilize form validation** (File:
   `ClientApp/src/components/forms/RhfForm/index.tsx`)
   - Action: Replace `hiddenRef.current = hidden` during render with a
     lifecycle-safe synchronization or a resolver design that receives the
     current hidden rules without reading or mutating refs during render; retain
     the submit-mode and validation semantics. Add tests for hidden fields,
     soft/hard validation, and render-prop children.
   - Why: The current code directly mutates a ref in render and passes
     ref-backed callbacks through the resolver, producing three
     `react-hooks/refs` findings.
   - Dependencies: Step 1
   - Risk: High

4. **Make date-picker initialization pure** (File:
   `ClientApp/src/components/Inputs/DatePicker/CustomDatePicker.tsx`)
   - Action: Create the wrapper id and “today” values through lazy state or an
     equivalent stable initializer; pass the stable id as a normal value rather
     than reading `wrapperUUID.current` in JSX. Preserve the existing date and
     child-plan characterization behavior.
   - Why: This resolves `crypto.randomUUID()` and `new Date()` purity findings
     plus the date-picker ref reads without changing user-visible date
     semantics.
   - Dependencies: Step 1
   - Risk: High

5. **Correct effect dependencies and timer cleanup** (File:
   `ClientApp/src/routes/dashboard/dashboard-ta.tsx`)
   - Action: For all `react-hooks/exhaustive-deps` findings in dashboard,
     quotation, request-for-quote, service, and application/instrument routes,
     either include stable dependencies or extract stable callbacks/derived
     values so the effect has an honest dependency set. In
     `ClientApp/src/routes/ta/manage/appDetails.tsx`, make the polling timeout
     id local to the effect and clear it directly in cleanup while retaining the
     disposed guard.
   - Why: Missing dependencies and leaked timers can create stale data, reload
     loops, or updates after unmount; the fix must follow behavior, not silence
     the hook rules.
   - Dependencies: Steps 1–4
   - Risk: High

6. **Fix analytics side effects and allowed logging** (File:
   `ClientApp/src/analytics/GoogleAnalytics.tsx`)
   - Action: Make initialization semantics explicit for `anonymiseIp` and
     `testMode` (stable config or honest dependencies), and replace the local
     `console.table` diagnostic with the repository logger or remove it after
     preserving the sanitized event behavior. Apply the same logging decision to
     `ClientApp/src/components/Utilities/mailingLabel.tsx`.
   - Why: This resolves the remaining hook and `no-console` findings without
     exposing PII or changing analytics payloads.
   - Dependencies: Step 5
   - Risk: Medium

#### Phase 2 testing

- Unit: RHF input tests, form-shell and wizard tests, date-picker tests,
  dashboard tests, and analytics tests.
- Integration: Form submission, validation, summary-mode rendering, dashboard
  first-load/branch-change flows, and polling unmount behavior.
- E2E: Existing app BDD journeys for dashboard, quotation, request-for-quote,
  and form submission; verify no console errors and no stale timer updates.

### Phase 3: Type boundaries, deprecated APIs, and ordinary correctness — Edge Cases

1. **Replace unsafe enum assertions with runtime mappings** (File:
   `ClientApp/src/routes/common/helperFunctions.ts`)
   - Action: Add narrow guards or mapping functions for generated API enum-like
     values and use them from `dashboard-ta.tsx`, `dashboard/index.tsx`,
     `quotation/index.tsx`, `quotation/quoteDetails.tsx`,
     `ta/manage/appDetails.tsx`, `ta/manage/appMessages.tsx`, request-list
     components, and their tests. Do not edit the generated API client.
   - Why: Forty-one `no-unsafe-enum-assignment` findings show that type
     assertions are crossing the API boundary without runtime evidence. Mapping
     once at the boundary removes repeated casts and makes unknown server values
     explicit.
   - Dependencies: Phase 2, Step 5
   - Risk: High

2. **Remove redundant conversions and generic parameters** (File:
   `ClientApp/src/routes/quotation/quoteDetails.tsx`)
   - Action: Remove `String()`/`!!` conversions whose input types are already
     correct; simplify unused type parameters in `HidableField`,
     `sessionStorageCache`, `storage/types`, and `utils/index`; remove useless
     default assignments in `SelectInput` and `ta/instrumentInfoPanel`.
   - Why: This resolves the 25 unnecessary-conversion and six unnecessary-type-
     parameter findings while making the intended types easier to read.
   - Dependencies: Step 1
   - Risk: Medium

3. **Replace deprecated global JSX types and unused props** (File:
   `ClientApp/src/components/forms/types.ts`)
   - Action: Migrate remaining global `JSX` references to `React.JSX`, remove or
     use unused `firstName`, `lastName`, and `serviceType` props in quotation
     and request-list components, and update callers/tests so the public prop
     contracts match actual behavior.
   - Why: Sixteen deprecated-type findings and three unused-prop findings point
     to stale contracts rather than formatting issues.
   - Dependencies: Step 1
   - Risk: Medium

4. **Make validation and arithmetic types explicit** (File:
   `ClientApp/src/validationSchemas/common.ts`)
   - Action: Replace the `{}`-resolving enum generic with a meaningful value
     constraint, remove the three unnecessary regex escapes, and update the
     validation tests. In
     `ClientApp/src/components/AriaComponents/Meter/Meter.tsx` and
     `ProgressBar/ProgressBar.tsx`, normalize operands before `+`.
   - Why: These are small but real correctness/type-contract findings and should
     not be masked with casts.
   - Dependencies: Step 1
   - Risk: Low

5. **Fix catch, spread, method, and optional-chain findings** (File:
   `tests/unit/analytics/googleAnalytics.test.tsx`)
   - Action: Type catch callback values as `unknown` and narrow them; replace
     spreads of class instances with explicit properties or supported test
     factories; bind or redesign unbound methods; use optional chaining; move
     void expressions to standalone statements. Apply changes to the affected
     dashboard, MSAL, attachment, route, and helper tests listed in the report.
   - Why: These findings identify unsafe assumptions in tests and support code,
     not merely style preferences.
   - Dependencies: Step 1 and enum mapping in Step 1
   - Risk: Medium

#### Phase 3 testing

- Unit: all affected route, validation, helper, MSAL, attachment, and ARIA
  tests; specifically `tests/unit/routes/dashboard.test.tsx`, quotation tests,
  and `tests/unit/routes/common/helperFunctions.test.ts`.
- Integration: API-shaped unknown enum values, invalid status values, validation
  schemas, and rendered status/summary branches.
- E2E: Dashboard, quotation, and request-for-quote journeys with representative
  server responses for every mapped enum status.

### Phase 4: Storybook, Vitest structure, and final cleanup — Optimization/Polish

1. **Repair Storybook render functions and default props** (File:
   `ClientApp/src/components/AriaComponents/CommandPalette/CommandPalette.stories.tsx`)
   - Action: Move hook usage into named React components, replace unstable
     object default props with module-stable constants, remove useless fragments
     and children on void elements, add `type='button'` where needed, and add
     `rel='noreferrer'` to external `_blank` links. Apply the same pattern to
     `SlateEditor.stories.tsx`, `Forms.stories.tsx`, `storybookHarness.tsx`, and
     `ButtonBreadth.stories.tsx`.
   - Why: Storybook findings are genuine hook/lifecycle and DOM-contract issues;
     changing the story structure fixes them without weakening Storybook
     linting.
   - Dependencies: Phase 2, Steps 1–4
   - Risk: Medium

2. **Make dashboard Vitest structure valid** (File:
   `tests/unit/routes/dashboard.test.tsx`)
   - Action: Put `afterEach` and other hooks inside the appropriate top-level
     `describe`, remove unnecessary nullish/enum conditions, and apply the
     padding fixes as small readable groups rather than running a blind autofix.
   - Why: The file contains 13 findings across test structure, enum typing, and
     formatting; its hooks currently violate the test runner's ownership rules.
   - Dependencies: Phase 3
   - Risk: Low

3. **Clean script and support-code leftovers** (File:
   `scripts/storybook-coverage.mjs`)
   - Action: Stop destructuring the unused `_provenance`, fix the empty pattern
     in `tests/e2e/support/fixtures.ts`, and resolve the isolated diagnostics in
     `scripts/pre_tool_use_wrapper.mts`, `quality/test_functional.ts`,
     `tests/unit/config/workflowPolicy.test.ts`, and related support files.
   - Why: These are isolated findings that should be closed after the shared
     refactors so the final report reflects only unresolved root causes.
   - Dependencies: Phases 1–3
   - Risk: Low

4. **Close the report and verify intentional exceptions** (File:
   `eslint.config.mjs`)
   - Action: Do not add a global ignore or lower rule severity. Re-run the
     diagnostics, compare against the exception inventory, and require a written
     reason and coverage for any retained intentional `eslint-disable-next-line`
     or structurally mitigated filesystem wrapper finding. Remove only stale or
     unused disables.
   - Why: The completion gate must prove that the code was fixed and that
     exceptions were deliberate, not that the signal was hidden.
   - Dependencies: Steps 1–3
   - Risk: Medium

#### Phase 4 testing

- Unit: `tests/unit/routes/dashboard.test.tsx`, Storybook story tests, and
  script-contract tests.
- Integration: `npm run test:storybook` and Storybook documentation/build
  checks.
- E2E: `npm run test:e2e:storybook` plus the affected app BDD smoke journeys.

## Testing Strategy

- Baseline and final static gates: `npm run lint:diagnostics`,
  `npm run lint:eslint`, `npm run type-check`, and `npm run lint`.
- Focused unit gates after each phase: the affected Vitest files first, then
  `npm run test:unit` and `npm run test:storybook`.
- Browser gates after React and Storybook changes: `npm run test:e2e:app` and
  `npm run test:e2e:storybook`.
- Final regression gate: `npm run test:ci` or the repository's full
  CI-equivalent command available on the branch, with the generated diagnostics
  report retained as evidence.

## Open Questions

- Is `ClientApp/src/components/Inputs/.remember/tmp/last-ndc.ts` a disposable
  agent/editor artifact, or is it intended to be part of the TypeScript project?
  The plan assumes it is disposable because it is untracked; if it is intended
  source, it needs a real tsconfig/project-service contract instead of an
  ignore.
- Which current `eslint-disable-next-line` comments are approved exceptions?
  Inventory them before Phase 1 edits; none should be removed by assumption.
- For the security plugin's dynamic filesystem warnings, does the repository
  want a zero-warning policy for validated wrappers, or an owner-approved
  exception register? The implementation must keep the path validation either
  way; only the policy decision remains open.

## Success Criteria

- [ ] The ESLint report is regenerated from the current worktree and no longer
      contains the stale missing-file diagnostic.
- [ ] All actionable diagnostics are fixed in code, tests, stories, or scripts;
      no broad ignore, severity downgrade, or new unexplained suppression is
      introduced.
- [ ] Existing intentional `eslint-disable-next-line` exceptions are preserved
      unless their owner explicitly confirms they are stale.
- [ ] React Hook Form inputs, date picker, dashboard effects, polling cleanup,
      and analytics behavior retain their existing user-visible contracts.
- [ ] Generated API, vendor, source-map, and captured-artifact boundaries remain
      unchanged.
- [ ] `npm run lint`, `npm run type-check`, the focused unit/Storybook tests,
      and the affected E2E journeys pass.
- [ ] The final report has zero unapproved diagnostics and documents any
      structurally mitigated exception that remains.
