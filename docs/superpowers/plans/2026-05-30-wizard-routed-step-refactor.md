# WizardRoutedStep Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate eight error-state booleans into a single discriminated union, restore the silently-suppressed network-failure path, replace the direct prop mutation, and document the 29-prop surface — creating a stable, testable baseline before migration work begins.

**Architecture:** A pure `resolveErrorState(error, callback, type)` helper is extracted to `errorState.ts` and covered by unit tests first; `WizardRoutedStep.tsx` is then simplified to call it once in each catch block and read a single `errorState` discriminant in the render guards. The stale-closure bug (reading `redirectionLocationOnError` state immediately after calling `setRedirectionLocationOnError`) disappears because the discriminant is captured synchronously from the helper return value before any `setState` is called.

**Tech Stack:** React 18, TypeScript, Vitest 4 + `@testing-library/react`, `@testing-library/user-event`, `react-router-dom v6 createMemoryRouter`

---

## Validation commands

```
npm run type-check          # tsc --noEmit — authoritative type check
npm run test:unit           # vitest run — runs tests/unit/**/*.test.{ts,tsx}
```

> **Note on pre-existing test failures:** All tests that import via `../../../static/js/…` fail with "no such file" because the `static/` symlink/alias does not exist on disk. This is a pre-existing issue unrelated to this plan. New tests in this plan use direct `ClientApp/src/…` paths and are unaffected.

---

## File map

| Action  | Path |
|---------|------|
| Modify  | `ClientApp/src/components/forms/WizardForm/types.ts` |
| Create  | `ClientApp/src/components/forms/WizardForm/errorState.ts` |
| Modify  | `ClientApp/src/components/forms/WizardForm/WizardRoutedStep.tsx` |
| Create  | `tests/unit/components/forms/wizardRoutedStep/errorState.test.ts` |
| Create  | `tests/unit/components/forms/wizardRoutedStep/WizardRoutedStep.integration.test.tsx` |

---

## Planning framework note

No DDD, C4, ADR-lite, or strangler-fig patterns required. This is a contained component refactor within one file, with a new pure-function helper. Risk-first sequencing: Task 1 (pure helper + unit tests) before Task 2 (component wiring + integration tests) before Task 3 (documentation only).

---

## Task 1: WizardStepError discriminated union type + resolveErrorState helper

**Files:**
- Modify: `ClientApp/src/components/forms/WizardForm/types.ts`
- Create: `ClientApp/src/components/forms/WizardForm/errorState.ts`
- Create: `tests/unit/components/forms/wizardRoutedStep/errorState.test.ts`

- [ ] **Step 1: Create the failing test file**

Create `tests/unit/components/forms/wizardRoutedStep/errorState.test.ts` with the following content:

```typescript
import { describe, it, expect } from 'vitest';
import { resolveErrorState } from '../../../../ClientApp/src/components/forms/WizardForm/errorState';
import { ErrorType } from '../../../../ClientApp/src/components/forms/WizardForm/types';

function makeError(status: number, title?: string, headers?: Record<string, string>) {
    return { status, title: title ?? '', headers: headers ?? {} };
}

describe('resolveErrorState', () => {
    describe('Load errors — HttpStatus dispatch', () => {
        it('returns notFound for 404', () => {
            expect(resolveErrorState(makeError(404), undefined, ErrorType.Load))
                .toEqual({ kind: 'notFound' });
        });

        it('returns gone for 410', () => {
            expect(resolveErrorState(makeError(410), undefined, ErrorType.Load))
                .toEqual({ kind: 'gone' });
        });

        it('returns noThirdPartyAccess for 403 with third-party title', () => {
            expect(
                resolveErrorState(makeError(403, 'No third-party access to this resource'), undefined, ErrorType.Load),
            ).toEqual({ kind: 'noThirdPartyAccess' });
        });

        it('returns serverError for 403 without third-party title', () => {
            const result = resolveErrorState(makeError(403, 'Forbidden'), undefined, ErrorType.Load);
            expect(result.kind).toBe('serverError');
        });

        it('returns loading for unrecognised HTTP status — restores the previously silent failure', () => {
            expect(resolveErrorState(makeError(500), undefined, ErrorType.Load))
                .toEqual({ kind: 'loading' });
        });

        it('returns loading for a network error with no status property', () => {
            expect(resolveErrorState(new Error('fetch failed'), undefined, ErrorType.Load))
                .toEqual({ kind: 'loading' });
        });

        it('returns none for an aborted request — stays silent', () => {
            const abort = new DOMException('The operation was aborted.', 'AbortError');
            expect(resolveErrorState(abort, undefined, ErrorType.Load))
                .toEqual({ kind: 'none' });
        });
    });

    describe('Update errors — HttpStatus dispatch', () => {
        it('returns concurrency for 409', () => {
            const err = makeError(409);
            const result = resolveErrorState(err, undefined, ErrorType.Update);
            expect(result.kind).toBe('concurrency');
        });

        it('returns wafViolation for 403 with Azure App Gateway server header (Update only)', () => {
            const err = makeError(403, 'Forbidden', { server: 'Microsoft-Azure-Application-Gateway/2.5' });
            const result = resolveErrorState(err, undefined, ErrorType.Update);
            expect(result.kind).toBe('wafViolation');
        });

        it('does NOT return wafViolation on a Load error even with WAF header', () => {
            const err = makeError(403, 'Forbidden', { server: 'Microsoft-Azure-Application-Gateway/2.5' });
            const result = resolveErrorState(err, undefined, ErrorType.Load);
            expect(result.kind).toBe('serverError');
        });

        it('returns serverError for 500 on Update', () => {
            const result = resolveErrorState(makeError(500), undefined, ErrorType.Update);
            expect(result.kind).toBe('serverError');
        });
    });

    describe('Custom redirect callback — fixes stale-read bug', () => {
        it('returns redirect when callback provides a location', () => {
            const cb = (code: number) => (code === 404 ? '/custom-not-found' : undefined);
            expect(resolveErrorState(makeError(404), cb, ErrorType.Load))
                .toEqual({ kind: 'redirect', location: '/custom-not-found' });
        });

        it('falls through to default dispatch when callback returns undefined', () => {
            const cb = () => undefined;
            expect(resolveErrorState(makeError(404), cb, ErrorType.Load).kind)
                .toBe('notFound');
        });

        it('redirect takes precedence over all other error kinds — stale-read fix proof', () => {
            // Old code: setRedirectionLocationOnError(loc) then immediately read
            // the stale `redirectionLocationOnError` state (still undefined), so
            // notFound was set as well. resolveErrorState returns ONE value only.
            const cb = () => '/gone-somewhere';
            const result = resolveErrorState(makeError(404), cb, ErrorType.Load);
            expect(result).toEqual({ kind: 'redirect', location: '/gone-somewhere' });
        });
    });
});
```

- [ ] **Step 2: Run the test to confirm it fails (module not found)**

```
npm run test:unit -- tests/unit/components/forms/wizardRoutedStep/errorState.test.ts
```

Expected: FAIL — `Cannot find module '…/errorState'`

- [ ] **Step 3: Add the `WizardStepError` discriminated union to `types.ts`**

Open `ClientApp/src/components/forms/WizardForm/types.ts`. Add the following import at the top of the file (after existing imports):

```typescript
import { ProblemDetails, ValidationProblemDetails } from '../../../api/web-api-client';
```

Then add the following type declaration after the existing `ErrorType` enum (currently after line 21):

```typescript
export type WizardStepError =
    | { kind: 'none' }
    | { kind: 'loading' }
    | { kind: 'notFound' }
    | { kind: 'noThirdPartyAccess' }
    | { kind: 'gone' }
    | { kind: 'concurrency'; details: ProblemDetails | ValidationProblemDetails }
    | { kind: 'wafViolation'; details: ProblemDetails | ValidationProblemDetails }
    | { kind: 'serverError'; details: ProblemDetails | ValidationProblemDetails }
    | { kind: 'redirect'; location: string };
```

> `WizardRoutedStep.tsx` already imports `ProblemDetails` and `ValidationProblemDetails` from `web-api-client`, so adding them to `types.ts` is needed only for the new type declaration.

- [ ] **Step 4: Create `errorState.ts` with the `resolveErrorState` pure helper**

Create `ClientApp/src/components/forms/WizardForm/errorState.ts`:

```typescript
import { ProblemDetails } from '../../../api/web-api-client';
import { HttpStatusCode } from '../../../types';
import { ErrorType, WizardStepError } from './types';

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

    if (serverError?.status === HttpStatusCode.Forbidden) {
        if (serverError.title?.includes('No third-party access')) return { kind: 'noThirdPartyAccess' };
        if (errorType === ErrorType.Update) {
            const server = (error as { headers?: { server?: string } }).headers?.server;
            if (server?.startsWith('Microsoft-Azure-Application-Gateway')) {
                return { kind: 'wafViolation', details: serverError };
            }
        }
        return { kind: 'serverError', details: serverError };
    }

    if (serverError?.status === HttpStatusCode.Conflict) {
        return { kind: 'concurrency', details: serverError };
    }

    // Load path: abort stays silent; every other unhandled error now surfaces as
    // a loading error. This restores the previously commented-out setLoadingError
    // branch that was suppressing all unrecognised network failures silently.
    if (errorType === ErrorType.Load) {
        if ((error as DOMException)?.code === DOMException.ABORT_ERR) return { kind: 'none' };
        return { kind: 'loading' };
    }

    return { kind: 'serverError', details: serverError };
}
```

- [ ] **Step 5: Run the test to confirm it passes**

```
npm run test:unit -- tests/unit/components/forms/wizardRoutedStep/errorState.test.ts
```

Expected: all 13 tests PASS. Zero failures.

- [ ] **Step 6: Run the type-check**

```
npm run type-check
```

Expected: no errors on the new files.

- [ ] **Step 7: Commit**

```
git add ClientApp/src/components/forms/WizardForm/types.ts \
        ClientApp/src/components/forms/WizardForm/errorState.ts \
        tests/unit/components/forms/wizardRoutedStep/errorState.test.ts
git commit -m "refactor(wizard): add WizardStepError union and resolveErrorState helper"
```

---

## Task 2: Integrate WizardStepError into WizardRoutedStep

**Files:**
- Modify: `ClientApp/src/components/forms/WizardForm/WizardRoutedStep.tsx`
- Create: `tests/unit/components/forms/wizardRoutedStep/WizardRoutedStep.integration.test.tsx`

- [ ] **Step 1: Write failing integration tests**

Create `tests/unit/components/forms/wizardRoutedStep/WizardRoutedStep.integration.test.tsx`:

```tsx
import React from 'react';
import {
    describe, it, expect, vi, beforeEach,
} from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    createMemoryRouter, RouterProvider,
} from 'react-router-dom';
import { FormStepStatus, type FormStepStatusDto } from '../../../../ClientApp/src/api/web-api-client';
import {
    AccountStateCtx, AccountDispatchCtx,
} from '../../../../ClientApp/src/authentication/accountContext';
import WizardRoutedStep from '../../../../ClientApp/src/components/forms/WizardForm/WizardRoutedStep';
import type { WizardRoutedStepProps } from '../../../../ClientApp/src/components/forms/WizardForm/types';
import { type FormikValues } from 'formik';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../../../ClientApp/src/instrumentation/AppLogger', () => ({
    default: { verbose: vi.fn(), error: vi.fn(), trace: vi.fn() },
}));

// WizardStep wraps ErrorBoundary (needs AppInsights) + GoogleAnalytics.
// Both are irrelevant to these tests; stub them out.
vi.mock('../../../../ClientApp/src/components/forms/WizardForm/WizardStep', () => ({
    default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../../../ClientApp/src/analytics/GoogleAnalytics', () => ({
    default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// ── Test helpers ─────────────────────────────────────────────────────────────

const mockStateValue = {
    isLoading: false,
    details: {
        homeAccountId: 'test-account-id',
        organisation: 'Test Org',
        trading: '',
        branch: '',
        abn: '12345678901',
        email: 'test@test.com',
        givenName: 'Test',
        familyName: 'User',
        userAcceptedTermsOfUse: true,
        accountCreationCompleted: true,
        accountContactCompleted: true,
        currentTermsVersion: '1',
        isDefaultOrganisation: true,
        organisationIsCompleted: true,
        defaultOrganisationId: 1,
        targetOrganisation: { targetOrganisationAbn: '', targetOrganisationName: '' },
    },
};

const mockDispatch = {
    setAgree: vi.fn(),
    setCompleted: vi.fn(),
    setContactCompleted: vi.fn(),
    setDefaultOrganisationId: vi.fn(),
    setTargetOrganisation: vi.fn(),
    setOrganisationAndBranch: vi.fn(),
    setUserProfile: vi.fn(),
};

function makeStepElement() {
    // A minimal React element whose .props satisfy WizardStepProps reads inside
    // WizardRoutedStep (title, location, stepStatuses used by render guards).
    return React.createElement('div' as any, {
        title: 'Test Step',
        location: '/step-1',
        stepStatuses: [{ status: FormStepStatus.NotStarted }],
        loadStepValues: async () => ({ stepValues: {} }),
        bannerTitle: 'Test',
        initialValues: {},
    }) as React.ReactElement<any>;
}

function makeRouter(
    propsOverride: Partial<WizardRoutedStepProps<FormikValues>>,
    extraRoutes: Array<{ path: string; element: React.ReactNode }> = [],
) {
    const defaultStatuses: FormStepStatusDto[] = [{ status: FormStepStatus.NotStarted }];
    const defaultProps: WizardRoutedStepProps<FormikValues> = {
        title: 'Test Step',
        location: '/step-1',
        url: '',
        initialValues: {},
        stepStatuses: defaultStatuses,
        loadStepValues: async () => ({ stepValues: {} }),
        allSteps: [makeStepElement()],
        currentStepIndex: 0,
        locationOnCompletion: '/done',
        bannerTitle: 'Test Wizard',
        ...propsOverride,
    };

    return createMemoryRouter(
        [
            {
                path: '/step-1',
                element: (
                    <AccountStateCtx.Provider value={mockStateValue}>
                        <AccountDispatchCtx.Provider value={mockDispatch}>
                            <WizardRoutedStep {...defaultProps} />
                        </AccountDispatchCtx.Provider>
                    </AccountStateCtx.Provider>
                ),
            },
            { path: '/not-found', element: <div>Not Found Page</div> },
            { path: '/server-error', element: <div>Server Error Page</div> },
            { path: '/done', element: <div>Done Page</div> },
            ...extraRoutes,
        ],
        { initialEntries: ['/step-1'] },
    );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('WizardRoutedStep — error navigation', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('navigates to /not-found when loadStepValues throws a 404', async () => {
        const router = makeRouter({
            loadStepValues: vi.fn().mockRejectedValue({ status: 404, title: 'Not Found' }),
        });
        render(<RouterProvider router={router} />);

        await waitFor(() => expect(screen.getByText('Not Found Page')).toBeInTheDocument());
    });

    it('navigates to /server-error when loadStepValues throws an unrecognised error — restores suppressed silent failure', async () => {
        const router = makeRouter({
            loadStepValues: vi.fn().mockRejectedValue({ status: 500, title: 'Internal Server Error' }),
        });
        render(<RouterProvider router={router} />);

        await waitFor(() => expect(screen.getByText('Server Error Page')).toBeInTheDocument());
    });

    it('navigates to a custom redirect URL when getRedirectionLocationOnError returns one', async () => {
        const router = makeRouter(
            {
                loadStepValues: vi.fn().mockRejectedValue({ status: 404, title: 'Not Found' }),
                getRedirectionLocationOnError: () => '/custom-gone',
            },
            [{ path: '/custom-gone', element: <div>Custom Gone Page</div> }],
        );
        render(<RouterProvider router={router} />);

        await waitFor(() => expect(screen.getByText('Custom Gone Page')).toBeInTheDocument());
    });
});

describe('WizardRoutedStep — prop mutation fix', () => {
    it('does not mutate the original FormStepStatusDto on successful step save', async () => {
        const originalDto: FormStepStatusDto = { status: FormStepStatus.NotStarted };
        const stepStatuses: FormStepStatusDto[] = [originalDto];
        const onSaveAndNext = vi.fn().mockResolvedValue({});

        const router = makeRouter({
            stepStatuses,
            onSaveAndNext,
            loadStepValues: async () => ({ stepValues: {} }),
            locationOnCompletion: '/done',
        });

        render(<RouterProvider router={router} />);

        // Wait for the loading spinner to go away and the form to be ready
        await waitFor(() => expect(screen.getByTestId('form')).toBeInTheDocument());

        const submitButton = screen.getByTestId('save-and-next-button');
        await userEvent.click(submitButton);

        await waitFor(() => expect(onSaveAndNext).toHaveBeenCalledTimes(1));

        // The fix: the original DTO object must NOT be mutated
        expect(originalDto.status).toBe(FormStepStatus.NotStarted);
        // The array element at index 0 is now a different object
        expect(stepStatuses[0]).not.toBe(originalDto);
        // And it has the updated status
        expect(stepStatuses[0].status).toBe(FormStepStatus.Completed);
    });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

```
npm run test:unit -- tests/unit/components/forms/wizardRoutedStep/WizardRoutedStep.integration.test.tsx
```

Expected: All 4 tests FAIL. The `/server-error` navigation test fails because `setLoadingError` is commented out (the silent failure). The prop mutation test fails because the current code mutates `originalDto` in place.

- [ ] **Step 3: Refactor WizardRoutedStep.tsx — state declarations**

Open `ClientApp/src/components/forms/WizardForm/WizardRoutedStep.tsx`.

**Add imports** — replace the existing `ErrorType, WizardRoutedStepProps, WizardStepProps` import on line 18 with:

```typescript
import { ErrorType, WizardRoutedStepProps, WizardStepProps, WizardStepError } from './types';
import { resolveErrorState } from './errorState';
```

**Replace the 8 error state declarations** (lines 89–96) — replace these lines:

```typescript
    const [redirectionLocationOnError, setRedirectionLocationOnError] = useState<string | undefined>(undefined);
    const [loadingError, setLoadingError] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const [noThirdPartyAccess, setNoThirdPartyAccess] = useState(false);
    const [gone, setGone] = useState(false);
    const [concurrencyError, setConcurrencyError] = useState(false);
    const [isWafViolation, setisWafViolation] = useState(false);
    const [serverError, setServerError] = useState<ProblemDetails | ValidationProblemDetails>();
```

With the single union state:

```typescript
    const [errorState, setErrorState] = useState<WizardStepError>({ kind: 'none' });
```

- [ ] **Step 4: Refactor WizardRoutedStep.tsx — loadData**

Replace the entire `loadData` useCallback (lines 98–141) with:

```typescript
    const loadData = useCallback(async () => {
        setErrorState({ kind: 'none' });
        try {
            abortSignal();
            const currentStep = await loadStepValues(controllerRef.current?.signal);
            const values = nullOrUndefinedToEmpty(currentStep.stepValues);
            setStepState({ values });
        } catch (error) {
            const err = error as Error;
            AppLogger.error('Could not load data for form step.', err);
            const loadServerError = error as ProblemDetails;
            AppLogger.trace('Could not load data for form step.', SeverityLevel.Error, { problemDetails: loadServerError, err });
            setErrorState(resolveErrorState(error, getRedirectionLocationOnError, ErrorType.Load));
            AppLogger.error('Failed to Load step values', err);
        } finally {
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadStepValues]);
```

- [ ] **Step 5: Refactor WizardRoutedStep.tsx — concurrencyError effect**

Replace the second `useEffect` (lines 151–157) — the one that watches `concurrencyError`:

```typescript
    useEffect(() => {
        let mounted = true;
        if (mounted && concurrencyError) {
            loadData();
        }
        return (() => { mounted = false; });
    }, [loadData, concurrencyError]);
```

With the union-based equivalent:

```typescript
    useEffect(() => {
        if (errorState.kind === 'concurrency') {
            loadData();
        }
    }, [errorState.kind, loadData]);
```

- [ ] **Step 6: Refactor WizardRoutedStep.tsx — onSubmitStep**

Replace the entire `onSubmitStep` function (lines 170–232):

```typescript
    const onSubmitStep = async (
        values: FormikValues,
        formikHelpers: FormikHelpers<FormikValues>,
    ) => {
        if (onSaveAndNext) {
            abortSignal();
            setErrorState({ kind: 'none' });
            try {
                const isDirty = !isEqual(stepState.values, values);
                const result = await onSaveAndNext(
                    values,
                    isDirty,
                    formikHelpers,
                    controllerRef.current?.signal,
                );
                // Immutable update: replace the DTO at currentStepIndex with a new
                // object, rather than mutating the existing one in place (was line 190).
                stepStatuses[currentStepIndex] = {
                    ...stepStatuses[currentStepIndex],
                    status: FormStepStatus.Completed,
                };
                if (nextStep) {
                    goToStep(nextStep, result?.baseUrl);
                } else {
                    navigate(locationOnCompletion);
                }
            } catch (error) {
                const err = error as Error;
                AppLogger.error('Could not submit form step.', error as Error, { stepIndex: currentStepIndex });
                const saveServerError = error as ProblemDetails;
                AppLogger.trace('Could not submit form step.', SeverityLevel.Error, { stepIndex: currentStepIndex, problemDetails: { status: saveServerError?.status, title: saveServerError?.title } });
                setErrorState(resolveErrorState(error, getRedirectionLocationOnError, ErrorType.Update));
            }
        }
    };
```

- [ ] **Step 7: Refactor WizardRoutedStep.tsx — onSaveAndExitStep**

Replace the entire `onSaveAndExitStep` function (lines 234–285):

```typescript
    const onSaveAndExitStep = async (
        values: FormikValues,
        formikHelpers: FormikHelpers<FormikValues>,
    ) => {
        if (onSaveAndExit) {
            abortSignal();
            setErrorState({ kind: 'none' });
            try {
                const isDirty = !isEqual(stepState.values, values);
                await onSaveAndExit(
                    values,
                    isDirty,
                    formikHelpers,
                    controllerRef.current?.signal,
                );
                navigate(locationAfterExit || '/');
            } catch (error) {
                const err = error as Error;
                AppLogger.error('Could not save form step.', err, { stepIndex: currentStepIndex });
                const saveServerError = error as ProblemDetails;
                AppLogger.trace('Could not save form step.', SeverityLevel.Error, { stepIndex: currentStepIndex, problemDetails: { status: saveServerError?.status, title: saveServerError?.title } });
                setErrorState(resolveErrorState(error, getRedirectionLocationOnError, ErrorType.Update));
            }
        } else {
            navigate(locationAfterExit || '/');
        }
    };
```

- [ ] **Step 8: Refactor WizardRoutedStep.tsx — render guards**

Replace the render guard block (lines 299–338) — everything from `if (redirectionLocationOnError)` through the `!isLoading && currentStepIndex > 0` block:

```typescript
    if (errorState.kind === 'redirect') {
        return <Navigate to={errorState.location} />;
    }

    if (errorState.kind === 'notFound') {
        return <Navigate to='/not-found' />;
    }

    if (errorState.kind === 'loading') {
        return <Navigate to='/server-error' />;
    }

    if (errorState.kind === 'noThirdPartyAccess') {
        setDashboardNotification({
            message: 'You no longer have access to the records for'
                + ` ${accountState?.details?.targetOrganisation?.targetOrganisationName}. Your changes have not been saved.`,
            severity: NotificationSeverity.Error,
        });
        if (accountDispatch) {
            accountDispatch.setTargetOrganisation(
                accountState?.details?.abn ?? '',
                accountState?.details?.organisation ?? '',
            );
        }
        return <Navigate to='/dashboard' />;
    }

    if (errorState.kind === 'gone') {
        setGetStartedNotification({
            message: 'You currently do not have access. Please sign in again.',
            severity: NotificationSeverity.Error,
        });
        return <Navigate to='/sign-out' />;
    }

    if (!isLoading && currentStepIndex > 0) {
        const firstIncompleteStepIndex = stepStatuses.findIndex((x) => x.status !== FormStepStatus.Completed);
        if (firstIncompleteStepIndex !== -1 && firstIncompleteStepIndex < currentStepIndex) {
            return <Navigate to={`${url}${allSteps[firstIncompleteStepIndex].props.location}`} />;
        }
    }
```

- [ ] **Step 9: Refactor WizardRoutedStep.tsx — ErrorSummary props**

Inside the JSX `return` statement, find the `<ErrorSummary>` component (near line 391 of the original). Replace:

```tsx
                                <ErrorSummary
                                    serverErrors={serverError}
                                    prefixToRemove='formStep.'
                                    disableLinkedError={isSummaryPage}
                                    isWafViolation={isWafViolation}
                                />
```

With:

```tsx
                                <ErrorSummary
                                    serverErrors={
                                        errorState.kind === 'serverError'
                                        || errorState.kind === 'wafViolation'
                                        || errorState.kind === 'concurrency'
                                            ? errorState.details
                                            : undefined
                                    }
                                    prefixToRemove='formStep.'
                                    disableLinkedError={isSummaryPage}
                                    isWafViolation={errorState.kind === 'wafViolation'}
                                />
```

- [ ] **Step 10: Run the integration tests**

```
npm run test:unit -- tests/unit/components/forms/wizardRoutedStep/WizardRoutedStep.integration.test.tsx
```

Expected: all 4 tests PASS.

- [ ] **Step 11: Run all unit tests to check for regressions**

```
npm run test:unit
```

Expected: the tests that were passing before this task continue to pass. Tests in `tests/unit/config/` and `tests/unit/storybook-autodocs.test.ts` should remain green. The `static/js`-import tests were already failing before this work; no change.

- [ ] **Step 12: Type-check**

```
npm run type-check
```

Expected: no errors. In particular, TypeScript exhaustiveness checking on `errorState.kind` in the render guards should be clean.

- [ ] **Step 13: Commit**

```
git add ClientApp/src/components/forms/WizardForm/WizardRoutedStep.tsx \
        tests/unit/components/forms/wizardRoutedStep/WizardRoutedStep.integration.test.tsx
git commit -m "refactor(wizard): consolidate error state into WizardStepError union; fix prop mutation and silent load failure"
```

---

## Task 3: Document the 29-prop contract

**Files:**
- Modify: `ClientApp/src/components/forms/WizardForm/types.ts`

No runtime change. Adds JSDoc `@property` comments to `WizardStepProps`, `WizardFormProps`, and `WizardRoutedStepProps` so IDE tooltips and code reviewers understand each prop at a glance. Validation is type-check only.

- [ ] **Step 1: Add JSDoc to `WizardStepProps`**

Open `ClientApp/src/components/forms/WizardForm/types.ts`. Replace the `WizardStepProps` interface declaration with the documented version:

```typescript
/**
 * Props owned by an individual wizard step (WizardStep).
 * WizardRoutedStep receives all of these via WizardForm's render loop.
 *
 * @property title          - Heading shown inside the step content area.
 * @property children       - Step content rendered inside the form.
 * @property location       - Route path segment for this step (e.g. '/step-1').
 * @property initialValues  - Formik initial values for this step's form fields.
 * @property isSummaryPage  - When true, suppresses the "required" hint text and disables
 *                            linked errors in ErrorSummary.
 * @property getRedirectionLocationOnError - Optional callback: given an HTTP status code
 *                            and error type (Load | Update), returns a custom redirect
 *                            path, or undefined to use the default error handling.
 * @property discard        - Configuration for the Cancel button: visibility, labels,
 *                            callbacks, and the post-discard navigation target.
 * @property onSaveAndExit  - Called when the user saves a draft and exits. Receives
 *                            form values, isDirty flag, Formik helpers, and an optional
 *                            AbortSignal.
 * @property onSaveAndNext  - Called when the user submits the step. Same signature as
 *                            onSaveAndExit. May return { baseUrl } to override the
 *                            base URL used when navigating to the next step.
 * @property stepStatuses   - Mutable array (one entry per step) tracking completion
 *                            state; used by the linear navigation guard to prevent
 *                            skipping ahead.
 * @property loadStepValues - Async function that returns the current server-side
 *                            values for this step. Called on mount and on concurrency
 *                            error retry.
 * @property validateHard   - Yup schema or validation function applied on submit.
 * @property validateSoft   - Yup schema or validation function applied on save-draft.
 * @property hidingFields   - Object describing which fields are hidden; used to strip
 *                            hidden values from the submitted payload.
 * @property bannerTitle    - Primary heading shown in the page banner.
 * @property bannerRefTitle - Secondary reference text shown in the banner.
 * @property bannerSubTitle - Supplementary subtitle shown in the banner.
 * @property canSaveDraft   - Whether the save-and-exit (draft) button is shown.
 * @property showSaveAndNextButton - Whether the primary Next/Submit button is shown.
 *                            Defaults to true when undefined.
 * @property showGoToDashboardButton - Whether a Go-to-Dashboard shortcut is shown.
 * @property showBanner     - Whether the page banner is rendered.
 */
export interface WizardStepProps<T extends FormikValues> {
    title: string;
    children?: ReactNode;
    location: string;
    initialValues: InitialValue<T>;
    isSummaryPage?: boolean;
    getRedirectionLocationOnError?: (errorCode: number, errorType: ErrorType) => string | undefined;
    discard?: DiscardProps | undefined;
    onSaveAndExit?: (
        values: T,
        isDirty: boolean,
        formikHelpers: FormikHelpers<T>,
        abortSignal?: AbortSignal) => void | Promise<any>;
    onSaveAndNext?: (
        values: T,
        isDirty: boolean,
        formikHelpers: FormikHelpers<T>,
        abortSignal?: AbortSignal) => void | Promise<any>;
    stepStatuses: FormStepStatusDto[];
    loadStepValues: (abortSignal?: AbortSignal) => WizardFormStepValues<T> | Promise<WizardFormStepValues<T>>;
    validateHard?: any;
    validateSoft?: any;
    hidingFields?: any;
    bannerTitle?: string;
    bannerRefTitle?: string;
    bannerSubTitle?: string;
    canSaveDraft?: boolean;
    showSaveAndNextButton?: boolean;
    showGoToDashboardButton?: boolean;
    showBanner?: boolean;
    [key: string]: any;
}
```

- [ ] **Step 2: Add JSDoc to `WizardFormProps`**

Replace the `WizardFormProps` interface with the documented version:

```typescript
/**
 * Props owned by the WizardForm container — shared across all steps.
 * These are passed down to WizardRoutedStep at route construction time.
 *
 * @property children               - One or more WizardStep elements.
 * @property previousButtonTitle    - Label for the Back button. Default: 'Back'.
 * @property nextButtonTitle        - Label for the Save-and-next button.
 * @property lastStepNextButtonTitle - Label for the final-step submit button.
 * @property locationAfterExit      - Route to navigate to after save-and-exit.
 * @property locationOnCompletion   - Route to navigate to after the final step
 *                                    submits successfully.
 * @property canSaveDraft           - Whether the save-and-exit button is shown
 *                                    across all steps (overridden per step).
 * @property showSaveAndNextButton  - Whether the Next/Submit button is shown.
 * @property showGoToDashboardButton - Whether the Go-to-Dashboard shortcut shows.
 * @property showBanner             - Whether the page banner renders.
 * @property confirmationOnSubmission - Optional modal config shown before the
 *                                    final step is submitted.
 * @property getRedirectionLocationOnError - See WizardStepProps; propagated to
 *                                    all steps from the form level.
 */
export interface WizardFormProps {
    children?: ReactElement<any> | Array<ReactElement<any>>;
    previousButtonTitle?: string;
    nextButtonTitle?: string;
    lastStepNextButtonTitle?: string;
    locationAfterExit?: string;
    locationOnCompletion: string;
    canSaveDraft?: boolean | undefined;
    showSaveAndNextButton?: boolean;
    showGoToDashboardButton?: boolean;
    showBanner?: boolean | undefined;
    confirmationOnSubmission?: ModalProps | undefined;
    getRedirectionLocationOnError?: (errorCode: number, errorType: ErrorType) => string | undefined;
    [key: string]: any;
}
```

- [ ] **Step 3: Add JSDoc to `WizardRoutedStepProps`**

Replace the `WizardRoutedStepProps` type alias with the documented version:

```typescript
/**
 * Full prop surface of WizardRoutedStep: the union of WizardStepProps (step-level),
 * WizardFormProps (form-level, shared across steps), and three routing props added
 * by WizardForm when it instantiates each route.
 *
 * Approximately 29 distinct props after deduplication. The [key: string]: any
 * index signatures on WizardStepProps and WizardFormProps are retained for
 * backwards compatibility; a future cleanup pass can narrow these.
 *
 * @property allSteps        - All WizardStep children of the parent WizardForm.
 *                             Used for step navigation, the SteppedNavigation bar,
 *                             and the linear progress guard.
 * @property currentStepIndex - Zero-based index of the currently active step.
 * @property url              - Resolved base URL of the WizardForm route (from
 *                             useResolvedPath in WizardForm). Prepended to each
 *                             step's location when building navigation paths.
 */
export type WizardRoutedStepProps<T extends FormikValues> = WizardStepProps<T> & WizardFormProps & {
    allSteps: React.ReactElement<any>[];
    currentStepIndex: number;
    url: string;
};
```

- [ ] **Step 4: Type-check**

```
npm run type-check
```

Expected: no errors. The JSDoc comments are purely decorative to TypeScript.

- [ ] **Step 5: Commit**

```
git add ClientApp/src/components/forms/WizardForm/types.ts
git commit -m "docs(wizard): document 29-prop contract on WizardRoutedStepProps, WizardStepProps, WizardFormProps"
```

---

## Verification checklist

After all three tasks:

| Check | Command | Expected |
|-------|---------|----------|
| Type-check clean | `npm run type-check` | No errors |
| errorState unit tests pass | `npm run test:unit -- tests/unit/components/forms/wizardRoutedStep/errorState.test.ts` | 13 tests PASS |
| WizardRoutedStep integration tests pass | `npm run test:unit -- tests/unit/components/forms/wizardRoutedStep/WizardRoutedStep.integration.test.tsx` | 4 tests PASS |
| Previously passing tests unchanged | `npm run test:unit` | Same green count as before (storybook-autodocs + webpackConfig); stale static/js tests remain broken as pre-existing baseline |

---

## Architecture decision: why NOT use a reducer

A `useReducer` is idiomatic for discriminated union state. It was considered and rejected here: `WizardRoutedStep` has only one state variable being replaced (`errorState`). The existing loading state (`isLoading`) and form state (`stepState`) are each independent single values; grouping them all into a reducer would be a larger refactor that was explicitly out of scope per YAGNI. The discriminated union gives exhaustiveness checking and naming clarity without the reducer boilerplate.

---

## Requirement traceability

| Spec requirement | Task | Step |
|-----------------|------|------|
| 8 error booleans → discriminated union | 1 | Steps 3–4 (type + helper) |
| Stale `redirectionLocationOnError` timing fix | 1 | Step 4 (`resolveErrorState` reads local return value, not stale state) |
| Silent `setLoadingError` failure restored | 1 | Step 4 (`kind: 'loading'` arm in `resolveErrorState`) |
| Direct prop mutation fixed (line 190) | 2 | Step 6 (`stepStatuses[i] = { ...s, status }`) |
| 29-prop contract documented | 3 | Steps 1–3 (JSDoc on all three interfaces) |
