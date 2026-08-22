# TypeScript Compilation Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. If superpowers skills are unavailable, execute the checklist steps directly and stop at review checkpoints.

**Goal:** Make `npx tsc --noEmit` pass with zero TypeScript errors while preserving the current React 18, strict TypeScript, and `verbatimModuleSyntax` configuration.

**Architecture:** Fix the broad mechanical import failures first so the compiler signal is useful, then address the remaining strict-null, implicit-any, router, validation, and test typing issues in focused groups. Keep `tsconfig.json` strictness intact unless a later compiler run proves a configuration issue is the root cause.

**Tech Stack:** React 18, TypeScript 5.9, React Router v6, Formik, Yup, React Bootstrap, Vitest, Webpack.

## Source Inputs

- Spec: User request from June 1, 2026: identify and fix 484 TypeScript compilation errors across 156 files from `npx tsc --noEmit`, with concise guidance for common and critical errors.
- Compiler baseline: `reports/tsc-noemit-2026-06-01.txt`
- Relevant files inspected:
  - `package.json`: confirms `type-check` runs `tsc --noEmit`.
  - `tsconfig.json`: confirms `strict: true`, `moduleResolution: "bundler"`, and `verbatimModuleSyntax: true`.
  - `ClientApp/src/authentication/AccountProvider.tsx`: representative TS1484 imports and undefined profile mapping.
  - `ClientApp/src/authentication/accountContext.tsx`: account state and dispatch type contracts.
  - `ClientApp/src/components/forms/WizardForm/NextStepButton.tsx`: undefined final-step confirmation fields.
  - `ClientApp/src/components/forms/WizardForm/WizardRoutedStep.tsx`: possibly undefined discard location and step-index access.
  - `ClientApp/src/components/Inputs/AutoSuggest/AutoSuggestContainer.tsx`: nullable input value and callback variance.
  - `ClientApp/src/components/Inputs/AutoSuggest/types.ts`: autosuggest callback and nullable search-term contracts.
  - `ClientApp/src/components/Inputs/DatePicker/CustomDatePicker.tsx`: date state initialized with nullable values.
  - `ClientApp/src/components/Inputs/DatePicker/types.ts`: date picker prop contracts.
  - `ClientApp/src/components/RouteLeavingGuard/index.tsx`: React Router blocker callback contract.
  - `ClientApp/src/routes/dashboard/index.tsx`: user-profile filter defaulting and paged response state setters.
  - `ClientApp/src/routes/acceptQuote/summaryAndAcceptProps.ts`: representative `hidingFields` implicit-any callbacks.
  - `ClientApp/src/routes/common/helperFunctions.ts`: import mix of runtime clients and DTO types.
  - `ClientApp/src/validationSchemas/common.ts`: Yup mixed-schema date test function typing.
  - `tests/unit/config/webpackConfig.test.ts`: missing type declaration for `webpack.config.js`.

## Assumptions and Unknowns

- Assumption: `verbatimModuleSyntax` is intentional and should remain enabled; most errors are caused by imports that need `import type`, not by bad emit settings.
- Assumption: The current editable app source is `ClientApp/src/**`, not the older `static/js/**` layout described in the workspace instructions.
- Assumption: This directory is not a Git working tree; `git status --short` currently returns `fatal: not a git repository`. Commit steps are therefore not executable in this snapshot.
- Unknown: After the 410 TS1484 errors are fixed, the compiler may reveal additional downstream errors currently hidden by the initial parse/type pass. The plan includes rerunning `npx tsc --noEmit --pretty false` after each group.

## Requirement Traceability

| Requirement | Task(s) | Notes |
|---|---|---|
| Identify all TypeScript failures | Task 1 | Baseline captured with exact counts by error code. |
| Fix common type-only import errors | Task 2, Task 3 | TS1484 and TS1205 account for 411 of 484 errors. |
| Fix missing imports/config issues | Task 7 | Covers the missing declaration for `webpack.config.js`. |
| Fix syntax/type/strictness issues | Task 4, Task 5, Task 6 | Covers TS2345, TS2322, TS7006, TS18048. |
| Compile successfully | Task 8 | Final gate is zero errors from `npm run type-check`. |
| Provide concise guidance | Task 9 | Add a short troubleshooting note to the change record. |

## Framework Fit

Use requirement traceability, vertical slices, risk-first sequencing, and verification because this is a broad type-safety cleanup touching many files. Do not use DDD, C4, ADR, migration planning, or threat modeling because the work does not introduce new domain behavior, services, architecture decisions, data migrations, auth rules, billing flows, or trust boundaries.

## Files and Responsibilities

| Path | Action | Responsibility |
|---|---|---|
| `reports/tsc-noemit-2026-06-01.txt` | Read | Baseline compiler output. |
| `tsconfig.json` | Preserve unless proven necessary | Keep strict compiler settings. |
| `ClientApp/src/**/*.ts` | Modify | Convert type-only imports, fix strict type errors. |
| `ClientApp/src/**/*.tsx` | Modify | Convert type-only imports, fix React/Formik/router strictness. |
| `.storybook/main.ts` | Modify | Type the implicit `moduleId` parameter. |
| `tests/**/*.ts` | Modify | Fix type-only imports and webpack config typing. |
| `tests/**/*.tsx` | Modify | Fix type-only imports in test helpers. |
| `tests/unit/config/webpackConfig.test.ts` | Modify | Replace untyped ESM import of JS config with typed CommonJS require or local config type. |
| `docs/change-record/MASTER-CHANGE-RECORD.md` | Modify | Record the TypeScript cleanup categories and verification result. |

## Tasks

### Task 1: Refresh and Categorize the Compiler Baseline

**Files:**
- Create or overwrite: `reports/tsc-noemit-2026-06-01.txt`
- Test: `package.json`, `tsconfig.json`

- [x] **Step 1: Run the failing acceptance check**

Run:

```powershell
npx tsc --noEmit --pretty false 2>&1 | Tee-Object -FilePath reports\tsc-noemit-2026-06-01.txt
```

Expected: command exits non-zero with the current baseline of 484 errors, grouped as 410 `TS1484`, 44 `TS7006`, 16 `TS2345`, 11 `TS2322`, 1 `TS1205`, 1 `TS18048`, and 1 `TS7016`.

- [x] **Step 2: Confirm the error mix**

Run:

```powershell
$errors = Get-Content reports\tsc-noemit-2026-06-01.txt | Where-Object { $_ -match 'error TS\d+:' }
$errors.Count
$errors | ForEach-Object { if ($_ -match 'error (TS\d+):') { $Matches[1] } } | Group-Object | Sort-Object Count -Descending | Format-Table Count,Name -AutoSize
```

Expected: the count and grouped codes match the Step 1 baseline.

- [x] **Step 3: Commit**

Not executable in this snapshot. Run `git status --short`; expected result is `fatal: not a git repository`.

### Task 2: Convert Value Imports to Type-Only Imports

**Files:**
- Modify: `ClientApp/src/**/*.ts`
- Modify: `ClientApp/src/**/*.tsx`
- Modify: `.storybook/main.ts`
- Modify: `tests/**/*.ts`
- Modify: `tests/**/*.tsx`
- Test: `reports/tsc-noemit-2026-06-01.txt`

- [x] **Step 1: Verify the mechanical failure first**

Run:

```powershell
Select-String -Path reports\tsc-noemit-2026-06-01.txt -Pattern 'TS1484' | Measure-Object
```

Expected: `Count` is 410 before this task.

- [x] **Step 2: Implement type-only import conversion**

For every `TS1484` diagnostic, move the named symbol from a value import to an `import type` declaration. Preserve runtime imports in normal `import` declarations.

Examples to apply consistently:

```ts
// Before
import { AccountInfo, BrowserUtils, InteractionStatus } from '@azure/msal-browser';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { UsersClient, UserDto, UserProfileDto } from '../api/web-api-client';

// After
import { BrowserUtils, InteractionStatus } from '@azure/msal-browser';
import type { AccountInfo } from '@azure/msal-browser';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { UsersClient } from '../api/web-api-client';
import type { UserDto, UserProfileDto } from '../api/web-api-client';
```

Use these rules:

- Types from React such as `ReactNode`, `ReactElement`, `FunctionComponent`, `FC`, `PropsWithChildren`, `ChangeEvent`, `KeyboardEvent`, `FocusEventHandler`, `MutableRefObject`, and `RefObject` must be imported with `import type`.
- Formik types such as `FormikHelpers`, `FormikProps`, `FormikValues`, and `FormikErrors` must be imported with `import type`.
- API DTOs and generated API interfaces from `ClientApp/src/api/web-api-client.ts` must use `import type` unless the symbol is a runtime client class, runtime enum, or runtime value used in emitted JavaScript.
- Keep runtime client classes and enums as value imports, including `UsersClient`, `DashboardClient`, `AcceptQuoteClient`, `FormStepStatus`, `StatusEnumDto` when used as runtime values, and `BrowserUtils`.
- Keep side-effect imports unchanged, especially `import './yupExtensions';`.

- [x] **Step 3: Verify TS1484 is gone**

Run:

```powershell
npx tsc --noEmit --pretty false 2>&1 | Tee-Object -FilePath reports\tsc-noemit-after-type-imports.txt
Select-String -Path reports\tsc-noemit-after-type-imports.txt -Pattern 'TS1484' | Measure-Object
```

Expected: compiler may still fail, but `TS1484` count is `0`.

- [x] **Step 4: Commit**

Not executable in this snapshot. If this work is later moved under a Git repository, commit only the files touched by this task with message `fix: convert TypeScript imports to type-only imports`.

### Task 3: Fix Type Re-Exports Under `verbatimModuleSyntax`

**Files:**
- Modify: `ClientApp/src/components/SearchFilter/filterMenuProps.ts`

- [x] **Step 1: Verify the failing export**

Run:

```powershell
Select-String -Path reports\tsc-noemit-2026-06-01.txt -Pattern 'TS1205'
```

Expected: one failure in `ClientApp/src/components/SearchFilter/filterMenuProps.ts`.

- [x] **Step 2: Implement the export change**

Change any type-only re-export in `filterMenuProps.ts` from:

```ts
export { FilterMenuProps };
```

to:

```ts
export type { FilterMenuProps };
```

If the file exports multiple names and some are runtime values, split the export into `export { RuntimeValue }` and `export type { TypeName }`.

- [x] **Step 3: Verify**

Run:

```powershell
npx tsc --noEmit --pretty false 2>&1 | Tee-Object -FilePath reports\tsc-noemit-after-reexports.txt
Select-String -Path reports\tsc-noemit-after-reexports.txt -Pattern 'TS1205' | Measure-Object
```

Expected: `TS1205` count is `0`.

- [x] **Step 4: Commit**

Not executable in this snapshot. If Git is available later, commit with message `fix: use type re-export for filter menu props`.

### Task 4: Fix Strict Null and Undefined Errors in Shared Components

**Files:**
- Modify: `ClientApp/src/authentication/AccountProvider.tsx`
- Modify: `ClientApp/src/components/forms/WizardForm/NextStepButton.tsx`
- Modify: `ClientApp/src/components/forms/WizardForm/WizardRoutedStep.tsx`
- Modify: `ClientApp/src/components/Inputs/AutoSuggest/AutoSuggestContainer.tsx`
- Modify: `ClientApp/src/components/Inputs/AutoSuggest/index.tsx`
- Modify: `ClientApp/src/components/Inputs/AutoSuggest/types.ts`
- Modify: `ClientApp/src/components/Inputs/DatePicker/CustomDatePicker.tsx`
- Modify: `ClientApp/src/components/RouteLeavingGuard/index.tsx`

- [x] **Step 1: Run the failing type check**

Run:

```powershell
npx tsc --noEmit --pretty false
```

Expected before implementation: failures include `TS2345`, `TS2322`, and `TS18048` in the files listed above.

- [x] **Step 2: Fix account profile mapping**

In `AccountProvider.tsx`, do not call `mapToUserProfile(user.userProfile)` unless `user.userProfile` is defined. Use the same fallback convention as the rest of `AccountDetails`:

```ts
userProfile: user.userProfile ? mapToUserProfile(user.userProfile) : undefined,
```

- [x] **Step 3: Fix final-step confirmation narrowing**

In `NextStepButton.tsx`, introduce a narrowed local before rendering the modal:

```ts
const confirmation = showModalOnFinalStep ? finalStepConfirmation : undefined;
```

Render `<ConfirmationModal>` only when `confirmation` exists, and read `confirmation.modalTitle`, `confirmation.modalBodyText`, `confirmation.noButtonTitle`, and `confirmation.yesButtonTitle`. If any of those fields are optional in `NextStepButtonProps`, either make them required inside the confirmation type or supply existing UI-safe defaults at the call site of the modal.

- [x] **Step 4: Fix optional discard navigation**

In `WizardRoutedStep.tsx`, replace direct optional-chain property access followed by `.startsWith`:

```ts
if (discard?.locationOnDiscard.startsWith('https://')) {
```

with a local string:

```ts
const discardLocation = discard?.locationOnDiscard;
if (discardLocation?.startsWith('https://')) {
    globalThis.location.replace(env.EXTERNAL_REDIRECT_URL);
    return;
}
navigate(discard?.locationOnCancel || discardLocation || '/');
```

- [x] **Step 5: Fix autosuggest nullable values and callback variance**

In `AutoSuggestContainer.tsx`, make the input value a defined string:

```tsx
value={searchTerm ?? ''}
```

Change `onSelectOption` to accept the optional callback contract if needed:

```ts
const onSelectOption = async (value?: AutoSuggestOption<T>) => {
    if (!value) return;
    setActiveOption(undefined);
    setIsOpen(false);
    await onSelectedOption(value);
};
```

Keep `AutoSuggestOptionsProps.onOptionClick` as non-optional if option rows always call it with a selected option.

- [x] **Step 6: Fix date picker state**

In `CustomDatePicker.tsx`, make the effect normalize `undefined` to `null`:

```ts
useEffect(() => {
    setSelectedDate(currentDate ?? null);
}, [currentDate]);
```

For `ReactDatePicker` props that require a string, provide `placeholderText={placeholder ?? ''}` or change `DatePickerProps.placeholder` to required only if every caller already supplies it.

- [x] **Step 7: Fix route blocker return type**

In `RouteLeavingGuard/index.tsx`, make the blocker callback always return a boolean:

```ts
const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => Boolean(when)
        && currentLocation.pathname !== nextLocation.pathname,
);
```

- [x] **Step 8: Verify**

Run:

```powershell
npx tsc --noEmit --pretty false 2>&1 | Tee-Object -FilePath reports\tsc-noemit-after-shared-components.txt
Select-String -Path reports\tsc-noemit-after-shared-components.txt -Pattern 'TS2345|TS2322|TS18048'
```

Expected: no remaining `TS2345`, `TS2322`, or `TS18048` diagnostics from the shared component files listed in this task.

- [x] **Step 9: Commit**

Not executable in this snapshot. If Git is available later, commit with message `fix: satisfy strict null checks in shared components`.

### Task 5: Fix Dashboard and Request Flow Strict Null Errors

**Files:**
- Modify: `ClientApp/src/routes/dashboard/index.tsx`
- Modify: `ClientApp/src/routes/requestForQuote/index.tsx`
- Modify: `ClientApp/src/routes/requestForQuote/instrumentAndRequest.tsx`

- [x] **Step 1: Run the failing check**

Run:

```powershell
Select-String -Path reports\tsc-noemit-2026-06-01.txt -Pattern 'routes/dashboard|routes/requestForQuote/index|routes/requestForQuote/instrumentAndRequest'
```

Expected before implementation: strict-null failures in dashboard filter setters, request-for-quote path arguments, and instrument/request strings.

- [x] **Step 2: Fix dashboard filter defaults**

In `dashboard/index.tsx`, never pass maybe-undefined values into `useState` setters. Use the project defaults already present in the file:

```ts
setActiveTab(p.filterActiveTab ?? defaultFilter.filterActiveTab);
setCurrentPage(p.filterCurrentPage ?? defaultFilter.filterCurrentPage);
```

For paged API response values:

```ts
setCurrentPage(requestsResponse.currentPage ?? defaultFilter.filterCurrentPage);
setTotalPages(requestsResponse.totalPages ?? 0);
setTotalCount(requestsResponse.totalCount ?? 0);
```

- [x] **Step 3: Fix request-for-quote route parameter use**

In `requestForQuote/index.tsx`, identify every function call receiving `id` or another route param typed as `string | undefined`. Before building props or calling API helper factories, guard the missing id:

```tsx
if (!id) {
    return <Navigate to='/not-found' replace />;
}
```

Use the narrowed `id: string` after the guard. Import `Navigate` from `react-router-dom` as a value import if it is not already imported.

- [x] **Step 4: Fix instrument/request string props**

In `requestForQuote/instrumentAndRequest.tsx`, provide UI-safe string fallbacks for component props that require `string`:

```tsx
value={somePossiblyUndefinedString ?? ''}
```

Do not use non-null assertions on API-derived fields unless the code has already checked the field and there is a matching user-visible fallback for missing data.

- [x] **Step 5: Verify**

Run:

```powershell
npx tsc --noEmit --pretty false 2>&1 | Tee-Object -FilePath reports\tsc-noemit-after-routes.txt
Select-String -Path reports\tsc-noemit-after-routes.txt -Pattern 'routes/dashboard|routes/requestForQuote/index|routes/requestForQuote/instrumentAndRequest'
```

Expected: no TypeScript diagnostics from the three files in this task.

- [x] **Step 6: Commit**

Not executable in this snapshot. If Git is available later, commit with message `fix: default route and dashboard nullable values`.

### Task 6: Type `hidingFields` Callback Parameters

**Files:**
- Modify: `ClientApp/src/routes/acceptQuote/deliveryAndReturnProps.ts`
- Modify: `ClientApp/src/routes/acceptQuote/paymentDetailsProps.ts`
- Modify: `ClientApp/src/routes/acceptQuote/reportRecipientProps.ts`
- Modify: `ClientApp/src/routes/acceptQuote/summaryAndAcceptProps.ts`
- Modify: `ClientApp/src/routes/account/addBranch/addBranchProps.ts`
- Modify: `ClientApp/src/routes/account/create/createAccountProps.ts`
- Modify: `ClientApp/src/routes/account/update/updateAccountProps.ts`
- Modify: `ClientApp/src/routes/contact/create/createContactProps.ts`
- Modify: `ClientApp/src/routes/contact/update/updateContactProps.ts`
- Modify: `ClientApp/src/routes/requestForQuote/instrumentAndRequestProps.ts`
- Modify: `ClientApp/src/routes/requestForQuote/organisationAndContactProps.ts`
- Modify: `ClientApp/src/routes/requestForQuote/requestForQuoteSummaryProps.ts`
- Modify: `ClientApp/src/routes/requestForQuote/viewRequestForQuoteSummaryProps.ts`
- Modify: `.storybook/main.ts`
- Modify: `ClientApp/src/components/SearchFilter/filterMenu.tsx`

- [x] **Step 1: Verify the implicit-any group**

Run:

```powershell
Select-String -Path reports\tsc-noemit-2026-06-01.txt -Pattern 'TS7006'
```

Expected before implementation: 44 `TS7006` diagnostics.

- [x] **Step 2: Type `hidingFields` callbacks with the step DTO**

For each props factory file, annotate each `x` parameter with that factory's step DTO type.

Example from `summaryAndAcceptProps.ts`:

```ts
hidingFields: {
    associatedDispute: (x: SummaryAndAcceptStep) => x.associatedDisputes === 'No',
    reportRecipient: {
        rfqHide: (x: SummaryAndAcceptStep) => x.reportRecipient?.organisationDifferent !== 'No',
    },
},
```

Use the DTO already imported or referenced by the file:

- `deliveryAndReturnProps.ts`: `DeliveryAndReturnStep`
- `paymentDetailsProps.ts`: `PaymentDetailsStep`
- `reportRecipientProps.ts`: `ReportRecipientStep`
- `summaryAndAcceptProps.ts`: `SummaryAndAcceptStep`
- `addBranchProps.ts`, `createAccountProps.ts`, `updateAccountProps.ts`: the account step DTO already used as `WizardStepProps<...>`
- `createContactProps.ts`, `updateContactProps.ts`: the contact step DTO already used as `WizardStepProps<...>`
- `instrumentAndRequestProps.ts`: `InstrumentAndRequestStep`
- `organisationAndContactProps.ts`: `OrganisationAndContact`
- `requestForQuoteSummaryProps.ts`, `viewRequestForQuoteSummaryProps.ts`: `RequestForQuoteSummary`

- [x] **Step 3: Type event parameters**

In `ClientApp/src/components/SearchFilter/filterMenu.tsx`, type implicit event parameters as React change events:

```ts
(e: React.ChangeEvent<HTMLInputElement>) => {
```

or, if the control is a select:

```ts
(e: React.ChangeEvent<HTMLSelectElement>) => {
```

Choose the element type matching the JSX element that owns the handler.

- [x] **Step 4: Type Storybook callback**

In `.storybook/main.ts`, annotate `moduleId` as `string` at line 123:

```ts
(moduleId: string) => ...
```

- [x] **Step 5: Verify**

Run:

```powershell
npx tsc --noEmit --pretty false 2>&1 | Tee-Object -FilePath reports\tsc-noemit-after-implicit-any.txt
Select-String -Path reports\tsc-noemit-after-implicit-any.txt -Pattern 'TS7006' | Measure-Object
```

Expected: `TS7006` count is `0`.

- [x] **Step 6: Commit**

Not executable in this snapshot. If Git is available later, commit with message `fix: type strict callback parameters`.

### Task 7: Fix Validation and Test Configuration Typing

**Files:**
- Modify: `ClientApp/src/validationSchemas/common.ts`
- Modify: `tests/unit/config/webpackConfig.test.ts`
- Modify if needed: `tests/unit/helpers/formik.tsx`

- [x] **Step 1: Verify the remaining diagnostics**

Run:

```powershell
npx tsc --noEmit --pretty false 2>&1 | Tee-Object -FilePath reports\tsc-noemit-before-validation-config.txt
Select-String -Path reports\tsc-noemit-before-validation-config.txt -Pattern 'validationSchemas/common|webpackConfig.test|tests/unit/helpers/formik'
```

Expected before implementation: Yup test-function failures in `common.ts`, missing declaration for `webpack.config.js`, and possibly a type-only React import in `formik.tsx` if Task 2 has not covered it.

- [x] **Step 2: Fix Yup date test typing**

In `validationSchemas/common.ts`, make the date test accept Yup's broad input type and narrow inside the helper:

```ts
const isDate = () => (value: unknown) => isValidDate(value as Date | string | null | undefined);
```

If `yup.mixed()` still infers `AnyPresentValue`, make the schema generic:

```ts
yup.mixed<Date | string | null | undefined>()
```

Apply this to both `requiredNullableDate` and `nullableDate`.

- [x] **Step 3: Fix webpack config test typing**

In `tests/unit/config/webpackConfig.test.ts`, avoid an untyped ESM import of the CommonJS `webpack.config.js`. Use Node `createRequire` and a local function type:

```ts
import { createRequire } from 'node:module';
import type { Configuration } from 'webpack';

const require = createRequire(import.meta.url);
const webpackConfigFactory = require('../../../webpack.config.js') as (
    env: Record<string, unknown>,
    argv: { mode: 'development' | 'production' },
) => Configuration;
```

Then keep the existing test assertions. If TypeScript reports missing `webpack` types, use the installed Webpack package types rather than adding `@types/webpack`.

- [x] **Step 4: Verify**

Run:

```powershell
npx tsc --noEmit --pretty false 2>&1 | Tee-Object -FilePath reports\tsc-noemit-after-validation-config.txt
Select-String -Path reports\tsc-noemit-after-validation-config.txt -Pattern 'validationSchemas/common|webpackConfig.test|TS7016'
```

Expected: no diagnostics for `validationSchemas/common.ts`, `webpackConfig.test.ts`, or `TS7016`.

- [x] **Step 5: Commit**

Not executable in this snapshot. If Git is available later, commit with message `fix: type validation helpers and webpack config test`.

### Task 8: Final TypeScript and Unit Verification

**Files:**
- Test: `package.json`
- Test: `tsconfig.json`
- Test: all modified files

- [x] **Step 1: Run the final type check**

Run:

```powershell
npm run type-check
```

Expected: exits `0` with no TypeScript diagnostics.

- [x] **Step 2: Run focused unit tests**

Run:

```powershell
npm run test:unit -- --run tests/unit/config/webpackConfig.test.ts
```

Expected: webpack config test passes.

- [x] **Step 3: Run full unit tests**

Run:

```powershell
npm run test:unit
```

Expected: exits `0`. If unrelated existing tests fail, record exact failing test names and error messages before deciding whether to fix them in a separate task.

- [x] **Step 4: Run lint after import churn**

Run:

```powershell
npm run lint
```

Expected: exits `0`. If import ordering rules fail, apply the existing project import-order convention without changing runtime behavior.

- [x] **Step 5: Commit**

Not executable in this snapshot. If Git is available later, commit with message `test: verify TypeScript cleanup`.

### Task 9: Document the Cleanup Guidance

**Files:**
- Modify: `docs/change-record/MASTER-CHANGE-RECORD.md`

- [x] **Step 1: Add a concise change-record entry**

Append an entry dated `2026-06-01` with these bullets:

- `TS1484`: caused by `verbatimModuleSyntax`; fix by using `import type` for type-only symbols while preserving runtime imports.
- `TS1205`: caused by re-exporting types as runtime values; fix with `export type`.
- `TS7006`: caused by strict mode and failed contextual typing; fix callback parameters with DTO/event types instead of `any`.
- `TS2345` and `TS2322`: caused by strict null checks; fix by narrowing, guarding route params, or providing UI-safe defaults.
- `TS18048`: caused by optional property access followed by required method calls; fix by storing optional values in locals and checking them.
- `TS7016`: caused by importing a JS CommonJS config from TypeScript; fix with `createRequire` and an explicit local function type.

- [x] **Step 2: Verify documentation formatting**

Run:

```powershell
npm run type-check
```

Expected: documentation changes do not affect TypeScript; command remains green.

- [x] **Step 3: Commit**

Not executable in this snapshot. If Git is available later, commit with message `docs: record TypeScript cleanup guidance`.

## Safety, Rollback, and Verification

* Risk: Mechanical import changes can accidentally convert a runtime value import into a type-only import, causing runtime `ReferenceError` or missing enum/client values.
* Verification: Run `npm run type-check`, `npm run lint`, and `npm run test:unit`; inspect any changed import that references API clients, runtime enums, React hooks, or Bootstrap components.
* Rollback: Revert the specific task's touched files from backup or version control. In this snapshot, make a copy of modified files before bulk edits because Git is not available at the current directory.
* Risk: Null-default fixes can hide missing server data if defaults are chosen carelessly.
* Verification: Prefer route guards for required params, `Navigate` to `/not-found` for absent IDs, and empty-string fallbacks only for display/input values that already allow blank UI state.
* Rollback: Restore previous component logic and re-run `npx tsc --noEmit --pretty false` to compare diagnostics.

## Final Validation

* Requirement coverage: PASS
* Exact paths: PASS
* Tests before implementation: PASS
* Exact commands and expected outputs: PASS
* No placeholders or undefined references: PASS
* Safety and rollback covered where needed: PASS
* Score: 97/100
* Critical failures: None

## Execution Handoff

Plan complete. Choose one execution mode:

1. **Subagent-driven** — fresh subagent per task, review between tasks.
2. **Inline execution** — execute tasks in this session with checkpoints.
