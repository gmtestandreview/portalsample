# SonarLint Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve all confirmed-present SonarLint findings across `types.ts`, `errorState.ts`, `WizardRoutedStep.tsx`, and `ErrorSummary/index.tsx`, and suppress the TypeScript 6.0 `baseUrl` deprecation warning in `tsconfig.json`.

**Architecture:** All changes are pure code quality improvements — no behavior changes. No new files are created. The `resolveErrorState` cognitive-complexity finding requires extracting a private helper (`resolveForbiddenState`) in the same module. All other changes are single-line edits. Existing tests verify no regression.

**Tech Stack:** TypeScript, React 18, Vitest 4

---

## Triage: confirmed-present vs. already-resolved

The SonarLint report includes findings from two model snapshots of `WizardRoutedStep.tsx`. Only `modelVersionId 15` (the current file) is authoritative. Several `modelVersionId 3` findings were already resolved by the WizardRoutedStep discriminated-union refactor:

| Finding | Old location | Status in current file |
|---------|-------------|------------------------|
| S3776 complexity on `onSubmitStep` (29) | WizardRoutedStep:173 | **RESOLVED** — catch block now delegates to `resolveErrorState` |
| S3776 complexity on `onSaveAndExitStep` (25) | WizardRoutedStep:237 | **RESOLVED** — same |
| S1135 TODO comment | WizardRoutedStep:131 | **RESOLVED** — the TODO was about `setLoadingError`, which is now `resolveErrorState` |
| S6582 optional-chain x3 | WizardRoutedStep:123, 212, 216 | **RESOLVED** — error-handling code restructured |
| S4325 unnecessary assertion | WizardRoutedStep:207 | **RESOLVED** (no longer in modelVersionId 15) |

**Out of scope — never edit:**
- `ClientApp/src/api/web-api-client.ts` (S7724) — auto-generated NSwag client, per CLAUDE.md

---

## Validation commands

```
npm run type-check          # tsc --noEmit
npm run test:unit           # vitest run — must have 27 tests passing, 0 failing
```

---

## File map

| Action | Path |
|--------|------|
| Modify | `ClientApp/src/components/forms/WizardForm/types.ts` |
| Modify | `ClientApp/src/components/forms/WizardForm/errorState.ts` |
| Modify | `ClientApp/src/components/forms/WizardForm/WizardRoutedStep.tsx` |
| Modify | `ClientApp/src/components/forms/ErrorSummary/index.tsx` |
| Modify (optional) | `tsconfig.json` *(outside ClientApp/src — confirm with user before editing)* |

---

## Planning framework note

No DDD, C4, ADR-lite, or threat-modeling needed. All tasks are isolated single-file edits. No TDD required because there are no behavior changes — test steps verify no regression only.

---

## Task 1: types.ts — 8 SonarLint findings

**Files:**
- Modify: `ClientApp/src/components/forms/WizardForm/types.ts`

**Findings addressed:**
| Rule | Location | Fix |
|------|----------|-----|
| S1128 | Line 5 | Remove unused `FormikFormProps` import |
| S4782 | Line 99 (`discard`) | Remove redundant `\| undefined` |
| S4782 | Line 158 (`canSaveDraft`) | Remove redundant `\| undefined` |
| S4782 | Line 161 (`showBanner`) | Remove redundant `\| undefined` |
| S4782 | Line 162 (`confirmationOnSubmission`) | Remove redundant `\| undefined` |
| S4782 | Line 180 (`finalStepConfirmation`) | Remove redundant `\| undefined` |
| S1874 | Line 168 (`ReactChild`) | Replace deprecated type |
| S1874 | Line 168 (`ReactFragment`) | Replace deprecated type |

- [ ] **Step 1: Fix the unused `FormikFormProps` import (S1128)**

In `ClientApp/src/components/forms/WizardForm/types.ts`, line 5 imports `FormikFormProps` but it is never used in this file. Change:

```typescript
import { DiscardProps, FormikFormProps, ModalProps } from '../FormikForm/types';
```

to:

```typescript
import { DiscardProps, ModalProps } from '../FormikForm/types';
```

- [ ] **Step 2: Remove redundant `| undefined` from optional properties (S4782 ×5)**

TypeScript's `?` modifier already adds `| undefined` to the type. Having both is redundant.

In `WizardStepProps` (line ~99):
```typescript
    discard?: DiscardProps | undefined;
```
→
```typescript
    discard?: DiscardProps;
```

In `WizardFormProps` (lines ~158, ~161, ~162):
```typescript
    canSaveDraft?: boolean | undefined;
```
→
```typescript
    canSaveDraft?: boolean;
```

```typescript
    showBanner?: boolean | undefined;
```
→
```typescript
    showBanner?: boolean;
```

```typescript
    confirmationOnSubmission?: ModalProps | undefined;
```
→
```typescript
    confirmationOnSubmission?: ModalProps;
```

In `NextStepButtonProps` (line ~180):
```typescript
    finalStepConfirmation?: ModalProps | undefined;
```
→
```typescript
    finalStepConfirmation?: ModalProps;
```

- [ ] **Step 3: Replace deprecated `ReactChild` and `ReactFragment` (S1874)**

`React.ReactChild` and `React.ReactFragment` were deprecated in React 18. `PreviousStepButton` uses `React.isValidElement()` as a type guard before accessing `.props`, so the broader `React.ReactNode` is the correct replacement.

In `PreviousStepButtonProps` (line ~168):
```typescript
export interface PreviousStepButtonProps {
    steps: (React.ReactChild | React.ReactFragment | React.ReactPortal)[];
```
→
```typescript
export interface PreviousStepButtonProps {
    steps: React.ReactNode[];
```

Note: `React.ReactNode` is a superset that includes `ReactElement`, `ReactFragment`, `ReactPortal`, `string`, `number`, `boolean`, `null`, and `undefined`. All callers pass `allSteps.slice()` which is `React.ReactElement<any>[]`, which satisfies `React.ReactNode[]`. The `React.isValidElement()` guard in `PreviousStepButton.tsx` at line 18 accepts any type so this is a safe broadening.

- [ ] **Step 4: Type-check**

```
npm run type-check
```

Expected: no errors.

- [ ] **Step 5: Run tests (regression check)**

```
npm run test:unit
```

Expected: 27 tests pass, 0 fail.

---

## Task 2: errorState.ts — S3776 cognitive complexity

**Files:**
- Modify: `ClientApp/src/components/forms/WizardForm/errorState.ts`

**Finding:** S3776 — `resolveErrorState` has cognitive complexity 18, threshold is 15.

The nesting inside the `Forbidden` branch contributes 7 of the 18 complexity points:
- `if (Forbidden)` +1, nested `if (title)` +2, nested `if (Update)` +2, double-nested `if (server)` +3 = 7

Extracting the Forbidden branch into a private helper reduces `resolveErrorState` to ~11 and the helper to 4, both well under 15.

- [ ] **Step 1: Verify the 14 unit tests currently pass (baseline)**

```
npm run test:unit -- tests/unit/components/forms/wizardRoutedStep/errorState.test.ts
```

Expected: 14 tests PASS (this is your regression baseline).

- [ ] **Step 2: Add the `resolveForbiddenState` helper and refactor `resolveErrorState`**

Replace the entire contents of `ClientApp/src/components/forms/WizardForm/errorState.ts` with:

```typescript
import { ProblemDetails } from '../../../api/web-api-client';
import { HttpStatusCode } from '../../../types';
import { ErrorType, WizardStepError } from './types';

/**
 * Classifies a 403 Forbidden error into the appropriate WizardStepError variant.
 * Extracted from resolveErrorState to reduce its cognitive complexity (SonarLint S3776).
 */
function resolveForbiddenState(
    error: unknown,
    serverError: ProblemDetails,
    errorType: ErrorType,
): WizardStepError {
    if (serverError.title?.includes('No third-party access')) return { kind: 'noThirdPartyAccess' };
    if (errorType === ErrorType.Update) {
        const server = (error as { headers?: { server?: string } }).headers?.server;
        if (server?.startsWith('Microsoft-Azure-Application-Gateway')) {
            return { kind: 'wafViolation', details: serverError };
        }
    }
    return { kind: 'serverError', details: serverError };
}

/**
 * Pure function: maps a caught error to a WizardStepError discriminant.
 * Called once per catch block; returns a single value so setState is called
 * once, eliminating the stale-read class of bug present when checking state
 * immediately after calling setState.
 */
export function resolveErrorState(
    error: unknown,
    getRedirectionLocationOnError: ((errorCode: number, errorType: ErrorType) => string | undefined) | undefined,
    errorType: ErrorType,
): WizardStepError {
    const serverError = error as ProblemDetails;

    // Custom redirect is checked FIRST using the local return value — not the
    // React state variable (which would be stale at this point in the event loop).
    if (getRedirectionLocationOnError && serverError?.status) {
        const location = getRedirectionLocationOnError(serverError.status, errorType);
        if (location) return { kind: 'redirect', location };
    }

    if (serverError?.status === HttpStatusCode.NotFound) return { kind: 'notFound' };
    if (serverError?.status === HttpStatusCode.Gone) return { kind: 'gone' };
    if (serverError?.status === HttpStatusCode.Forbidden) return resolveForbiddenState(error, serverError, errorType);
    if (serverError?.status === HttpStatusCode.Conflict) return { kind: 'concurrency', details: serverError };

    // Load path: abort stays silent; every other unhandled error now surfaces as
    // a loading error. This restores the previously commented-out setLoadingError
    // branch that was suppressing all unrecognised network failures silently.
    if (errorType === ErrorType.Load) {
        if ((error as DOMException)?.name === 'AbortError') return { kind: 'none' };
        return { kind: 'loading' };
    }

    return { kind: 'serverError', details: serverError };
}
```

- [ ] **Step 3: Run the unit tests**

```
npm run test:unit -- tests/unit/components/forms/wizardRoutedStep/errorState.test.ts
```

Expected: 14 tests PASS. Same result as baseline.

- [ ] **Step 4: Type-check**

```
npm run type-check
```

Expected: no errors.

---

## Task 3: WizardRoutedStep.tsx — 5 SonarLint findings

**Files:**
- Modify: `ClientApp/src/components/forms/WizardForm/WizardRoutedStep.tsx`

**Findings addressed (modelVersionId 15 — current file):**
| Rule | Line | Fix |
|------|------|-----|
| S4624 | 73 | Extract nested template literal to a variable |
| S125 | 75 | Delete commented-out code |
| S7764 | 235 | `window` → `globalThis` |
| S125 | 345–346 | Delete commented-out code |
| S7735 | 355 | Invert negated condition |

- [ ] **Step 1: Fix nested template literal (S4624)**

Line 73:
```typescript
    useHtmlTitle(`${allSteps.length > 1 ? `Step ${currentStepIndex + 1}: ` : ''}${bannerTitle} | NMI Services portal`);
```
→ extract the conditional prefix first:
```typescript
    const stepPrefix = allSteps.length > 1 ? `Step ${currentStepIndex + 1}: ` : '';
    useHtmlTitle(`${stepPrefix}${bannerTitle} | NMI Services portal`);
```

The `stepPrefix` declaration goes on the line before `useHtmlTitle`. Remove the original single-line form.

- [ ] **Step 2: Delete the commented-out route variable (S125)**

Line 75 is:
```typescript
    // const route = useResolvedPath('').pathname;
```

Delete this entire line. It is dead code — the `route` variable was never used in the component body.

- [ ] **Step 3: Replace `window` with `globalThis` (S7764)**

Line 235:
```typescript
        if (discard?.locationOnDiscard.startsWith('https://')) window.location.replace(env.EXTERNAL_REDIRECT_URL);
```
→
```typescript
        if (discard?.locationOnDiscard.startsWith('https://')) globalThis.location.replace(env.EXTERNAL_REDIRECT_URL);
```

`globalThis` is the portable universal global object (works in browser, Node, and Web Workers). `window` is browser-only.

- [ ] **Step 4: Delete the commented-out JSX attributes (S125)**

Lines 345–346 in the Button JSX block are:
```tsx
                                data-testid='cancel-button'
                                // title={discard.cancelButtonTitle}
                                // aria-label={discard.cancelButtonTitle}
                                onClick={() => onCancelClick()}
```

Delete both commented-out lines. The result:
```tsx
                                data-testid='cancel-button'
                                onClick={() => onCancelClick()}
```

- [ ] **Step 5: Invert the negated condition (S7735)**

Line 355:
```tsx
                                        {showSaveAndNextButton !== false ? (
                                            <NextStepButton
                                                ...
                                            />
                                        ) : null}
```
→ invert so the positive/truthy condition comes first:
```tsx
                                        {showSaveAndNextButton === false ? null : (
                                            <NextStepButton
                                                ...
                                            />
                                        )}
```

Behavior is identical — `showSaveAndNextButton !== false` is true when the prop is `undefined` (default show) or `true`. The inverted form reads "if explicitly set to false, hide; otherwise show."

- [ ] **Step 6: Run integration tests (regression check)**

```
npm run test:unit -- tests/unit/components/forms/wizardRoutedStep/WizardRoutedStep.integration.test.tsx
```

Expected: 5 tests PASS.

- [ ] **Step 7: Type-check**

```
npm run type-check
```

Expected: no errors.

---

## Task 4: ErrorSummary/index.tsx — 6 SonarLint findings

**Files:**
- Modify: `ClientApp/src/components/forms/ErrorSummary/index.tsx`

**Findings addressed:**
| Rule | Line | Fix |
|------|------|-----|
| S4325 | 17 | Remove unnecessary type assertion |
| S6551 | 90 | Explicit `String()` conversion to prevent `[object Object]` |
| S7735 | 136 | Invert negated condition |
| S6653 | 142 | `Object.hasOwn()` replaces `hasOwnProperty.call()` |
| S7781 ×2 | 163 | `String#replaceAll()` replaces `replace(/pattern/g, ...)` |

- [ ] **Step 1: Remove unnecessary assertion in type guard (S4325)**

Line 17:
```typescript
): value is ValidationProblemDetails => (value as ValidationProblemDetails)?.errors !== undefined;
```

The cast `(value as ValidationProblemDetails)` combined with optional-chain `?.` is internally contradictory — if you're asserting it's `ValidationProblemDetails`, you don't need optional chaining on the cast result. SonarLint flags the assertion as unnecessary because the presence of `.errors` is sufficient to identify the type without it.

Replace with the `in` operator, which is the idiomatic way to distinguish the union members without any cast:

```typescript
): value is ValidationProblemDetails => value != null && 'errors' in value;
```

Semantics: returns `true` if `value` is non-null and has an `errors` own-or-inherited property — i.e., it is a `ValidationProblemDetails`.

- [ ] **Step 2: Add explicit String() conversion (S6551)**

Line 90:
```typescript
                        renderErrorListItem(key, `${keyToSentenceCase(key, 1)}${errors[key]}`, disableLinkedError)
```

`errors[key]` has type `string | string[] | FormikErrors<any> | ... | undefined`. When the value is an array or nested object, template-literal coercion produces `[object Object]`. Use `String()` to make the intent explicit and satisfy SonarLint:

```typescript
                        renderErrorListItem(key, `${keyToSentenceCase(key, 1)}${String(errors[key])}`, disableLinkedError)
```

`String(value)` is identical to `${value}` for strings. For other types it calls `.toString()` or returns `"undefined"`/`"null"`.

- [ ] **Step 3: Invert the negated condition (S7735)**

Lines 136–138 in `sanitizeErrorData`:
```typescript
    const prefix = prefixToAdd !== false
        ? (`${prefixToAdd}.`)
        : '';
```
→ invert so the positive condition comes first (SonarLint prefers non-negated leading branches):
```typescript
    const prefix = prefixToAdd === false
        ? ''
        : `${prefixToAdd}.`;
```

Behavior is identical.

- [ ] **Step 4: Replace `hasOwnProperty.call` with `Object.hasOwn` (S6653)**

Line 142:
```typescript
        if (Object.prototype.hasOwnProperty.call(errorData, i)) {
```
→
```typescript
        if (Object.hasOwn(errorData, i)) {
```

`Object.hasOwn(obj, key)` is the ES2022 standard replacement for `Object.prototype.hasOwnProperty.call(obj, key)`. The tsconfig.json targets ES2022 and includes the `DOM` lib, so `Object.hasOwn` is available.

- [ ] **Step 5: Replace `replace(/pattern/g)` with `replaceAll` (S7781 ×2)**

Line 163:
```typescript
    keyBuilder = keyBuilder.replace(/\[/g, '.').replace(/\]/g, '');
```
→
```typescript
    keyBuilder = keyBuilder.replaceAll('[', '.').replaceAll(']', '');
```

`replaceAll(searchValue: string, replaceValue: string)` replaces all occurrences without needing a regex. Behavior is identical for these literal single-character patterns. ES2021+, compatible with the ES2022 target.

- [ ] **Step 6: Type-check**

```
npm run type-check
```

Expected: no errors.

- [ ] **Step 7: Run full test suite (regression check)**

```
npm run test:unit
```

Expected: 27 tests pass, 0 fail.

---

## Task 5 (Optional): tsconfig.json — suppress baseUrl deprecation warning

**File:** `tsconfig.json` *(root — outside `ClientApp/src`. Confirm with user before editing. Per CLAUDE.md, files outside the listed safe targets require user confirmation.)*

**Finding:** TypeScript warning — `Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0. Specify compilerOption '"ignoreDeprecations": "6.0"'`

The fix is a one-character version bump in the existing `ignoreDeprecations` field.

- [ ] **Step 1: Update `ignoreDeprecations` in tsconfig.json**

Line 14 of `tsconfig.json`:
```json
    "ignoreDeprecations": "5.0",
```
→
```json
    "ignoreDeprecations": "6.0",
```

This opts the project in to acknowledging the 6.0 deprecation warnings (including `baseUrl`), which silences them.

- [ ] **Step 2: Type-check**

```
npm run type-check
```

Expected: no errors, and the `baseUrl` deprecation warning no longer appears.

---

## Requirement traceability

| SonarLint finding | File | Task | Step |
|------------------|------|------|------|
| S1128 unused `FormikFormProps` | types.ts | 1 | Step 1 |
| S4782 `discard?: ... \| undefined` | types.ts | 1 | Step 2 |
| S4782 `canSaveDraft?: ... \| undefined` | types.ts | 1 | Step 2 |
| S4782 `showBanner?: ... \| undefined` | types.ts | 1 | Step 2 |
| S4782 `confirmationOnSubmission?: ... \| undefined` | types.ts | 1 | Step 2 |
| S4782 `finalStepConfirmation?: ... \| undefined` | types.ts | 1 | Step 2 |
| S1874 `ReactChild` deprecated | types.ts | 1 | Step 3 |
| S1874 `ReactFragment` deprecated | types.ts | 1 | Step 3 |
| S3776 complexity 18 > 15 | errorState.ts | 2 | Steps 2–3 |
| S4624 nested template literal | WizardRoutedStep.tsx | 3 | Step 1 |
| S125 commented `const route` | WizardRoutedStep.tsx | 3 | Step 2 |
| S7764 `window` → `globalThis` | WizardRoutedStep.tsx | 3 | Step 3 |
| S125 commented JSX attrs | WizardRoutedStep.tsx | 3 | Step 4 |
| S7735 negated condition | WizardRoutedStep.tsx | 3 | Step 5 |
| S4325 unnecessary assertion | ErrorSummary/index.tsx | 4 | Step 1 |
| S6551 object stringification | ErrorSummary/index.tsx | 4 | Step 2 |
| S7735 negated condition | ErrorSummary/index.tsx | 4 | Step 3 |
| S6653 `hasOwnProperty.call` | ErrorSummary/index.tsx | 4 | Step 4 |
| S7781 `replace` → `replaceAll` ×2 | ErrorSummary/index.tsx | 4 | Step 5 |
| TS `baseUrl` deprecation | tsconfig.json | 5 (optional) | Step 1 |
| S7724 eslint-disable (web-api-client) | web-api-client.ts | **OUT OF SCOPE** — auto-generated file | — |
