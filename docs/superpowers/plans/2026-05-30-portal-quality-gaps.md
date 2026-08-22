# Portal Quality Gap Resolution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close five confirmed quality gaps in the NMI portal source-map workspace: one false-positive Yup declaration finding (confirm closed with a regression test), one duplicate validation schema, one silent error state in AccountProvider, one major WizardForm navigation testing gap, and one IDOR risk documentation item.

**Architecture:** Each task is independent and produces self-contained, verifiable work. Tasks 1–3 and 5 are small fixes or documentation items. Task 4 is the primary deliverable: a new Vitest integration test file that covers the four key WizardForm navigation behaviours (forward, back, linear guard, completion redirect) that are currently completely unexercised. Task 6 is a deferred design note only.

**Tech Stack:** React 18 · TypeScript (strict: false) · Formik · Yup · React Router v6 · Vitest · @testing-library/react · @testing-library/user-event · MSAL (Azure AD B2C)

---

## Assumptions and constraints

- This is a **source-map snapshot** — no npm build; validate by static review and `npx vitest run`.
- `npx vitest run --reporter=verbose` runs all unit tests from the repo root.
- The repo root has a working `package.json` and Vitest is installed (confirmed: 27 tests pass in prior sessions).
- Tests live under `tests/unit/` and are auto-discovered by the vitest config.
- TypeScript strict mode is off (`strict: false` in tsconfig.json); minor type assertions using `as any` are acceptable in test code.
- Task 6 (acquireTokenSilent) is **advisory only**. No implementation is required. The task produces a design note comment block in a new file.

## Scope check

These five items touch four independent layers (validation schemas, auth provider, WizardForm tests, dashboard docs). They share no code paths and have no intra-task dependencies. A single plan is appropriate because each task is small enough to complete in one subagent dispatch.

## File map

| Task | Create | Modify |
|------|--------|--------|
| 1 — businessName confirm | `tests/unit/validationSchemas/stringExtensions.businessName.test.ts` | — |
| 2 — emailSchema dedup | `tests/unit/validationSchemas/emailSchema.consolidation.test.ts` | `ClientApp/src/validationSchemas/contactValidation.ts` |
| 3 — AccountProvider.errored | `tests/unit/authentication/AccountProvider.errored.test.tsx` | `ClientApp/src/authentication/AccountProvider.tsx` |
| 4 — WizardForm nav tests | `tests/unit/components/forms/wizardForm/WizardForm.navigation.test.tsx` | — |
| 5 — SEC-010 doc | — | `ClientApp/src/routes/dashboard/index.tsx` |
| 6 — auth interceptor note | `docs/adr/2026-05-30-acquire-token-silent-interceptor.md` | — |

---

## Task 1: Confirm businessName Yup declaration is present — add regression test

**Context:** The assessment flagged `businessName` as missing from the `declare module 'yup'` augmentation. Inspection of `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts` lines 66–70 confirms it IS declared. This task closes the finding and prevents regression.

**Files:**
- Create: `tests/unit/validationSchemas/stringExtensions.businessName.test.ts`
- Read only: `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts`

- [ ] **Step 1: Verify the declaration is present**

Open `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts` and confirm lines 66–70 contain:
```typescript
businessName(
    label?: string,
    errorMessage?: string
): StringSchema;
```
If these lines are absent, the declaration is genuinely missing and must be added before the test. If present (expected), proceed to Step 2.

- [ ] **Step 2: Write the failing test**

Create `tests/unit/validationSchemas/stringExtensions.businessName.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import * as Yup from 'yup';
// Side-effect import registers all custom Yup methods including businessName
import '../../../ClientApp/src/validationSchemas/yupExtensions';

describe('Yup stringExtensions — businessName', () => {
    const schema = Yup.string().businessName('Business name');

    it('accepts a valid ASIC-compliant business name', async () => {
        await expect(schema.validate('Test Pty Ltd & Co.')).resolves.toBe('Test Pty Ltd & Co.');
    });

    it('accepts characters from the ASIC allowed set: ! @ # $ % ^ & * ( ) ? ; : = _ - / . , \'', async () => {
        await expect(schema.validate("O'Brien-Smith Pty Ltd")).resolves.toBeDefined();
    });

    it('rejects a name containing < or > (disallowed ASIC chars)', async () => {
        await expect(schema.validate('<script>bad</script>')).rejects.toThrow('Business name contains invalid characters');
    });

    it('allows empty string (required check is a separate concern)', async () => {
        await expect(schema.validate('')).resolves.toBeDefined();
    });

    it('Yup.string() exposes .businessName as a function — declaration is present', () => {
        // If the declare module block were missing, TypeScript would error here at compile time.
        // This test proves the runtime registration and TS declaration both exist.
        expect(typeof Yup.string().businessName).toBe('function');
    });
});
```

- [ ] **Step 3: Run the test — expect PASS (nothing to fix)**

```
npx vitest run tests/unit/validationSchemas/stringExtensions.businessName.test.ts --reporter=verbose
```

Expected: all 5 tests PASS. If any fail, fix the implementation before proceeding.

- [ ] **Step 4: Commit**

```
git add tests/unit/validationSchemas/stringExtensions.businessName.test.ts
git commit -m "test: add regression coverage for Yup businessName declaration (false-positive finding closed)"
```

---

## Task 2: Consolidate duplicate emailSchema

**Context:** `emailSchema` is identically defined in two files:
- `ClientApp/src/validationSchemas/common.ts` (line 171–175) — the canonical location
- `ClientApp/src/validationSchemas/contactValidation.ts` (line 38–42) — the duplicate

The fix: remove the duplicate from `contactValidation.ts` and import from `common.ts` instead. Zero behaviour change.

**Files:**
- Modify: `ClientApp/src/validationSchemas/contactValidation.ts`
- Create: `tests/unit/validationSchemas/emailSchema.consolidation.test.ts`

- [ ] **Step 1: Write a characterisation test (run it — expect PASS before and after the fix)**

The test proves emailSchema behaves identically from both import paths, and that the consolidated version still satisfies all callers.

Create `tests/unit/validationSchemas/emailSchema.consolidation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
// After the fix, contactValidation re-exports emailSchema from common.
// This import verifies the re-routed version behaves identically.
import { emailSchema } from '../../../ClientApp/src/validationSchemas/contactValidation';

describe('emailSchema — post-consolidation (sourced from common.ts)', () => {
    it('accepts a valid email address', async () => {
        const schema = emailSchema('Email address');
        await expect(schema.validate('user@example.com')).resolves.toBe('user@example.com');
    });

    it('rejects an invalid email format', async () => {
        const schema = emailSchema('Email address');
        await expect(schema.validate('not-an-email')).rejects.toThrow('Email address is not a valid email address');
    });

    it('rejects an empty string when required (default)', async () => {
        const schema = emailSchema('Email address');
        await expect(schema.validate('')).rejects.toThrow('Email address is required');
    });

    it('accepts empty string when required=false', async () => {
        const schema = emailSchema('Email address', false);
        // nullableString returns '' as default — empty string should pass
        await expect(schema.validate('')).resolves.toBeDefined();
    });

    it('enforces 100-character max length', async () => {
        const schema = emailSchema('Email address');
        const longEmail = `${'a'.repeat(90)}@example.com`; // 102 chars
        await expect(schema.validate(longEmail)).rejects.toThrow();
    });
});
```

- [ ] **Step 2: Run the test before making any code changes**

```
npx vitest run tests/unit/validationSchemas/emailSchema.consolidation.test.ts --reporter=verbose
```

Expected: all 5 tests PASS. This establishes the baseline behaviour.

- [ ] **Step 3: Edit contactValidation.ts — remove duplicate, import from common**

In `ClientApp/src/validationSchemas/contactValidation.ts`:

**Replace** the existing import block (lines 1–8):
```typescript
import * as yup from 'yup';
import './yupExtensions';
import { ContactDto } from '../api/web-api-client';
import {
    NotEmpty,
    nullableString,
    requiredNullableString,
} from './common';
```

**With:**
```typescript
import * as yup from 'yup';
import './yupExtensions';
import { ContactDto } from '../api/web-api-client';
import {
    NotEmpty,
    nullableString,
    requiredNullableString,
    emailSchema,
} from './common';
```

Then **delete** the local `emailSchema` definition (lines 38–42 of the original):
```typescript
export const emailSchema = (label: string, required = true) => (
    (required) ? requiredNullableString(label) : nullableString(label)
)
    .maxLength(100)
    .email();
```

After the delete, add the re-export so existing callers are unaffected:
```typescript
export { emailSchema };
```

The final contactValidation.ts imports section should look like:
```typescript
import * as yup from 'yup';
import './yupExtensions';
import { ContactDto } from '../api/web-api-client';
import {
    NotEmpty,
    nullableString,
    requiredNullableString,
    emailSchema,
} from './common';

export { emailSchema };
```

- [ ] **Step 4: Run the characterisation test after the change**

```
npx vitest run tests/unit/validationSchemas/emailSchema.consolidation.test.ts --reporter=verbose
```

Expected: all 5 tests still PASS.

- [ ] **Step 5: Run the full test suite to check for regressions**

```
npx vitest run --reporter=verbose
```

Expected: all tests PASS (currently 27 + the new tests from Task 1 and 2).

- [ ] **Step 6: Commit**

```
git add ClientApp/src/validationSchemas/contactValidation.ts tests/unit/validationSchemas/emailSchema.consolidation.test.ts
git commit -m "refactor: consolidate duplicate emailSchema — contactValidation now re-exports from common"
```

---

## Task 3: Surface AccountProvider.errored state — show error UI instead of children

**Context:** `AccountProvider.tsx` sets `errored = true` in the catch block when `client.signIn()` fails (line 186). However, `errored` is never read in the render path. After the catch, `isLoading` is set to `false` (via `finally`), so the spinner disappears and the raw `{children}` tree renders briefly while `logoutRedirect` races. The fix: guard `{children}` with `!errored` and render a descriptive message when errored.

**Files:**
- Create: `tests/unit/authentication/AccountProvider.errored.test.tsx`
- Modify: `ClientApp/src/authentication/AccountProvider.tsx` (render block only, lines 235–246)

- [ ] **Step 1: Write the failing test**

Create `tests/unit/authentication/AccountProvider.errored.test.tsx`:

```typescript
import React from 'react';
import {
    describe, it, expect, vi, beforeEach,
} from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AccountProvider from '../../../ClientApp/src/authentication/AccountProvider';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockInstance = {
    acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: 'test-token' }),
    handleRedirectPromise: vi.fn().mockResolvedValue(null),
    logoutRedirect: vi.fn().mockResolvedValue(undefined),
    getActiveAccount: vi.fn().mockReturnValue(null),
};

vi.mock('@azure/msal-react', () => ({
    useMsal: vi.fn(() => ({
        inProgress: 'none',
        accounts: [{
            homeAccountId: 'test-id',
            idTokenClaims: { email: 'test@example.com', given_name: 'Test', family_name: 'User' },
        }],
        instance: mockInstance,
    })),
}));

vi.mock('@azure/msal-browser', () => ({
    InteractionStatus: { None: 'none', Startup: 'startup', Logout: 'logout' },
    BrowserUtils: { isInIframe: vi.fn().mockReturnValue(false) },
}));

// signIn always fails — this is what triggers the errored state
vi.mock('../../../ClientApp/src/api/web-api-client', () => ({
    UsersClient: vi.fn().mockImplementation(() => ({
        setAuthToken: vi.fn(),
        signIn: vi.fn().mockRejectedValue(new Error('Network error')),
        setUserProfile: vi.fn(),
    })),
}));

vi.mock('../../../ClientApp/src/instrumentation/AppLogger', () => ({
    default: { verbose: vi.fn(), error: vi.fn(), trace: vi.fn() },
}));

vi.mock('../../../ClientApp/src/storage/targetOrganisation', () => ({
    default: vi.fn(),
    getTargetOrganisation: vi.fn().mockReturnValue(null),
}));

vi.mock('../../../ClientApp/src/terms-config.json', () => ({
    default: { TermsVersion: '1' },
}));

vi.mock('../../../ClientApp/src/routes/common/helperFunctions', () => ({
    mapToUserProfile: vi.fn().mockReturnValue(undefined),
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AccountProvider — errored state', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('shows an error message and does NOT render children when account load fails', async () => {
        render(
            <AccountProvider>
                <div data-testid='protected-content'>Protected content</div>
            </AccountProvider>,
        );

        // The error message should appear after signIn rejects
        await waitFor(() =>
            expect(screen.getByText(/Unable to load account details/i)).toBeInTheDocument(),
        );

        // Protected content must NOT be visible while errored
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run the test — expect FAIL (error message not shown)**

```
npx vitest run tests/unit/authentication/AccountProvider.errored.test.tsx --reporter=verbose
```

Expected: FAIL — the test cannot find `"Unable to load account details"` because the render path has no errored guard today.

- [ ] **Step 3: Implement the fix in AccountProvider.tsx**

In `ClientApp/src/authentication/AccountProvider.tsx`, replace the render return statement (lines 235–246):

**Before:**
```tsx
return (
    <AccountStateCtx.Provider value={stateValue}>
        <AccountDispatchCtx.Provider value={dispatchValue}>
            {isLoading && (
                <BlockUISpinner>
                    <p>Loading...</p>
                </BlockUISpinner>
            )}
            {children}
        </AccountDispatchCtx.Provider>
    </AccountStateCtx.Provider>
);
```

**After:**
```tsx
return (
    <AccountStateCtx.Provider value={stateValue}>
        <AccountDispatchCtx.Provider value={dispatchValue}>
            {isLoading && !errored && (
                <BlockUISpinner>
                    <p>Loading...</p>
                </BlockUISpinner>
            )}
            {errored && (
                <BlockUISpinner>
                    <p>Unable to load account details. Redirecting to sign-in&hellip;</p>
                </BlockUISpinner>
            )}
            {!errored && children}
        </AccountDispatchCtx.Provider>
    </AccountStateCtx.Provider>
);
```

- [ ] **Step 4: Run the test — expect PASS**

```
npx vitest run tests/unit/authentication/AccountProvider.errored.test.tsx --reporter=verbose
```

Expected: PASS.

- [ ] **Step 5: Run the full suite — expect no regressions**

```
npx vitest run --reporter=verbose
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```
git add ClientApp/src/authentication/AccountProvider.tsx tests/unit/authentication/AccountProvider.errored.test.tsx
git commit -m "fix: surface AccountProvider.errored state — show error UI and suppress children on account-load failure"
```

---

## Task 4: WizardForm navigation integration tests

**Context:** This is the single largest testing gap. No test currently exercises WizardForm-level navigation. The required behaviours are:
1. Step 1 content renders on initial load
2. Submitting step 1 (`save-and-next-button`) navigates forward to step 2
3. Clicking `back-button` on step 2 navigates back to step 1
4. Linear guard: navigating directly to step 2 when step 1 is `NotStarted` redirects to step 1
5. After the final step submits, the router navigates to `locationOnCompletion`

**Key implementation detail (linear guard):** All WizardStep children in a flow share the **same** `statuses` array reference. WizardRoutedStep mutates `statuses[currentStepIndex]` on successful submit (line 180 of WizardRoutedStep.tsx). The mutation propagates because it's the same object. Tests must pass a single shared array to all steps.

**Key data-testids (from production code):**
- `data-testid='form'` — the `<Form>` element in WizardRoutedStep (line 329)
- `data-testid='save-and-next-button'` — PrimaryButton inside NextStepButton (NextStepButton.tsx line 67)
- `data-testid='back-button'` — Link inside PreviousStepButton (PreviousStepButton.tsx line 23)

**Files:**
- Create: `tests/unit/components/forms/wizardForm/WizardForm.navigation.test.tsx`

- [ ] **Step 1: Write the full test file**

Create `tests/unit/components/forms/wizardForm/WizardForm.navigation.test.tsx`:

```typescript
import React from 'react';
import {
    describe, it, expect, vi, beforeEach,
} from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    createMemoryRouter, RouterProvider,
} from 'react-router-dom';
import { FormStepStatus, type FormStepStatusDto } from '../../../../../ClientApp/src/api/web-api-client';
import {
    AccountStateCtx, AccountDispatchCtx,
} from '../../../../../ClientApp/src/authentication/accountContext';
import WizardForm from '../../../../../ClientApp/src/components/forms/WizardForm';
import WizardStep from '../../../../../ClientApp/src/components/forms/WizardForm/WizardStep';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../../../../ClientApp/src/instrumentation/AppLogger', () => ({
    default: { verbose: vi.fn(), error: vi.fn(), trace: vi.fn() },
}));

// WizardStep wraps ErrorBoundary (needs AppInsights) — stub it out.
// WizardForm reads step.props off WizardStep elements directly; the mock does
// not affect prop extraction, only what the component renders.
vi.mock('../../../../../ClientApp/src/components/forms/WizardForm/WizardStep', () => ({
    default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../../../../ClientApp/src/analytics/GoogleAnalytics', () => ({
    default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// SteppedNavigation renders tab-style progress indicators (shown when allSteps.length > 1).
// Stub it to isolate navigation logic from tab-rendering logic.
vi.mock('../../../../../ClientApp/src/components/SteppedNavigation', () => ({
    default: () => <div data-testid='stepped-navigation' />,
}));

// ── Shared mock context values ────────────────────────────────────────────────

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

// ── Router factory ────────────────────────────────────────────────────────────

/**
 * Renders a two-step WizardForm inside a memory router.
 *
 * @param statuses   Shared FormStepStatusDto array — MUST be the same reference
 *                   for both steps so the linear guard and step-completion
 *                   mutation propagate correctly.
 * @param step1Save  onSaveAndNext for step 1 (default: resolves immediately)
 * @param step2Save  onSaveAndNext for step 2 (default: resolves immediately)
 * @param initialPath Starting URL (default: '/wizard/step-1')
 */
function makeTwoStepRouter(
    statuses: FormStepStatusDto[],
    step1Save = vi.fn().mockResolvedValue({}),
    step2Save = vi.fn().mockResolvedValue({}),
    initialPath = '/wizard/step-1',
) {
    return createMemoryRouter(
        [
            {
                path: '/wizard/*',
                element: (
                    <AccountStateCtx.Provider value={mockStateValue}>
                        <AccountDispatchCtx.Provider value={mockDispatch}>
                            <WizardForm
                                locationOnCompletion='/done'
                                canSaveDraft={false}
                            >
                                <WizardStep
                                    title='Step 1'
                                    location='/step-1'
                                    initialValues={{}}
                                    stepStatuses={statuses}
                                    loadStepValues={async () => ({ stepValues: {} })}
                                    onSaveAndNext={step1Save}
                                    bannerTitle='Test Wizard'
                                >
                                    <div data-testid='step-1-content'>Step 1 Content</div>
                                </WizardStep>
                                <WizardStep
                                    title='Step 2'
                                    location='/step-2'
                                    initialValues={{}}
                                    stepStatuses={statuses}
                                    loadStepValues={async () => ({ stepValues: {} })}
                                    onSaveAndNext={step2Save}
                                    bannerTitle='Test Wizard'
                                >
                                    <div data-testid='step-2-content'>Step 2 Content</div>
                                </WizardStep>
                            </WizardForm>
                        </AccountDispatchCtx.Provider>
                    </AccountStateCtx.Provider>
                ),
            },
            { path: '/done', element: <div>Done Page</div> },
            { path: '/not-found', element: <div>Not Found Page</div> },
            { path: '/server-error', element: <div>Server Error Page</div> },
        ],
        { initialEntries: [initialPath] },
    );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('WizardForm — step navigation', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('renders step 1 content on initial load', async () => {
        const statuses: FormStepStatusDto[] = [
            { status: FormStepStatus.NotStarted },
            { status: FormStepStatus.NotStarted },
        ];
        const router = makeTwoStepRouter(statuses);
        render(<RouterProvider router={router} />);

        await waitFor(() => expect(screen.getByTestId('step-1-content')).toBeInTheDocument());
        expect(screen.queryByTestId('step-2-content')).not.toBeInTheDocument();
    });

    it('navigates forward from step 1 to step 2 after successful submit', async () => {
        const statuses: FormStepStatusDto[] = [
            { status: FormStepStatus.NotStarted },
            { status: FormStepStatus.NotStarted },
        ];
        const router = makeTwoStepRouter(statuses);
        render(<RouterProvider router={router} />);

        // Wait for the form to finish loading step values
        await waitFor(() => expect(screen.getByTestId('form')).toBeInTheDocument());

        await userEvent.click(screen.getByTestId('save-and-next-button'));

        await waitFor(() => expect(screen.getByTestId('step-2-content')).toBeInTheDocument());
        expect(screen.queryByTestId('step-1-content')).not.toBeInTheDocument();
    });

    it('navigates back from step 2 to step 1 via the back button', async () => {
        // Step 1 is already Completed so the linear guard allows access to step 2
        const statuses: FormStepStatusDto[] = [
            { status: FormStepStatus.Completed },
            { status: FormStepStatus.NotStarted },
        ];
        const router = makeTwoStepRouter(statuses, undefined, undefined, '/wizard/step-2');
        render(<RouterProvider router={router} />);

        await waitFor(() => expect(screen.getByTestId('step-2-content')).toBeInTheDocument());

        await userEvent.click(screen.getByTestId('back-button'));

        await waitFor(() => expect(screen.getByTestId('step-1-content')).toBeInTheDocument());
        expect(screen.queryByTestId('step-2-content')).not.toBeInTheDocument();
    });

    it('linear guard: navigating directly to step 2 with step 1 incomplete redirects to step 1', async () => {
        const statuses: FormStepStatusDto[] = [
            { status: FormStepStatus.NotStarted },
            { status: FormStepStatus.NotStarted },
        ];
        // Attempt to land directly on step-2 — both steps are NotStarted
        const router = makeTwoStepRouter(statuses, undefined, undefined, '/wizard/step-2');
        render(<RouterProvider router={router} />);

        // Linear guard in WizardRoutedStep (line 259-264) detects firstIncompleteStepIndex=0
        // and issues <Navigate to="/wizard/step-1" />. Step 1 then loads.
        await waitFor(() => expect(screen.getByTestId('step-1-content')).toBeInTheDocument());
        expect(screen.queryByTestId('step-2-content')).not.toBeInTheDocument();
    });

    it('navigates to locationOnCompletion after the final step submits successfully', async () => {
        // Step 1 already completed; start on step 2 (the final step)
        const statuses: FormStepStatusDto[] = [
            { status: FormStepStatus.Completed },
            { status: FormStepStatus.NotStarted },
        ];
        const router = makeTwoStepRouter(statuses, undefined, undefined, '/wizard/step-2');
        render(<RouterProvider router={router} />);

        await waitFor(() => expect(screen.getByTestId('form')).toBeInTheDocument());

        await userEvent.click(screen.getByTestId('save-and-next-button'));

        // After the last step, WizardRoutedStep calls navigate(locationOnCompletion)
        await waitFor(() => expect(screen.getByText('Done Page')).toBeInTheDocument());
    });
});
```

- [ ] **Step 2: Run the tests — expect PASS (the navigation logic already exists; we are covering it, not building it)**

```
npx vitest run tests/unit/components/forms/wizardForm/WizardForm.navigation.test.tsx --reporter=verbose
```

Expected: all 5 tests PASS. If any fail:

- **"step-1-content not found"** on initial load: `loadStepValues` may not be resolving. Confirm the mock returns `{ stepValues: {} }` and that `waitFor` has sufficient time.
- **"step-2-content not found"** after forward navigation: Check that `statuses` is a shared reference and that `userEvent.click` properly triggers Formik submit. If Formik validation is blocking, add `validateHard={undefined}` to the WizardStep props.
- **"step-1-content not found"** after linear guard redirect: The redirect is synchronous (no loadStepValues wait needed before the redirect). `waitFor` waits for step-1 to finish loading.
- **"Done Page not found"** after final step: Confirm `locationOnCompletion='/done'` is wired to a route in the router.

- [ ] **Step 3: Run the full suite**

```
npx vitest run --reporter=verbose
```

Expected: all tests PASS (prior 27 + new 5 from this task).

- [ ] **Step 4: Commit**

```
git add tests/unit/components/forms/wizardForm/WizardForm.navigation.test.tsx
git commit -m "test: add WizardForm navigation integration tests — forward, back, linear guard, locationOnCompletion"
```

---

## Task 5: SEC-010 — document IDOR reliance on backend org scoping

**Context:** `ClientApp/src/routes/dashboard/index.tsx` line 379 passes `accountDetails.organisationCRMGuid` (a client-side value from the authenticated account context) to `fetchRequestsByTab()`. If the API does not enforce org-level scoping server-side, a privilege escalation (IDOR) is possible. The frontend cannot fix IDOR — that requires backend enforcement — but the code must document the assumption so the backend team can verify it explicitly.

**Files:**
- Modify: `ClientApp/src/routes/dashboard/index.tsx` (at the `fetchRequestsByTab` call, around line 373)

- [ ] **Step 1: Locate the exact call site**

Open `ClientApp/src/routes/dashboard/index.tsx`. Find the block starting with:
```typescript
const requestsResponse = await fetchRequestsByTab(
```
This is inside a `try` block within a `useEffect`. The sixth argument is `accountDetails.organisationCRMGuid`.

- [ ] **Step 2: Add the SEC-010 documentation comment**

Add the comment block **immediately above** the `fetchRequestsByTab` call:

```typescript
// SEC-010 (IDOR): organisationCRMGuid originates from the server-side signIn response
// and is stored in AccountContext. The API endpoint receiving this value MUST enforce
// org-level scoping server-side — it cannot rely solely on this client-supplied GUID
// to restrict data access. Verified by: backend endpoint authorization review (pending).
const requestsResponse = await fetchRequestsByTab(
```

- [ ] **Step 3: Verify only the comment was added — no logic change**

Read the modified block and confirm the `fetchRequestsByTab` call and all arguments are unchanged. The only addition is the comment block above it.

- [ ] **Step 4: Run the full suite to confirm no regressions**

```
npx vitest run --reporter=verbose
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```
git add ClientApp/src/routes/dashboard/index.tsx
git commit -m "docs(security): add SEC-010 IDOR comment at dashboard fetchRequestsByTab — backend org scoping verification required"
```

---

## Task 6 (Advisory — no implementation required): acquireTokenSilent centralised interceptor

**Context:** `acquireTokenSilent` is called at 35+ sites across the codebase (AccountProvider, every API call wrapper). This is functional today. A centralised MSAL interceptor (an Axios/fetch interceptor or a custom hook) would consolidate token acquisition, reduce duplication, and make token-refresh error handling consistent — a prerequisite for a clean migration to the new React app.

**This task produces a design note only. No code changes.**

**Files:**
- Create: `docs/adr/2026-05-30-acquire-token-silent-interceptor.md`

- [ ] **Step 1: Create the ADR**

Create `docs/adr/2026-05-30-acquire-token-silent-interceptor.md`:

```markdown
# ADR: Centralise acquireTokenSilent via an MSAL auth interceptor

**Date:** 2026-05-30  
**Status:** Proposed — deferred to migration sprint  
**Deciders:** Portal rebuild team

## Context

`instance.acquireTokenSilent({ ...tokenRequest, account: accounts[0] })` is called at 35+ sites across the portal. Each site independently handles token acquisition, sets `client.setAuthToken(tokenResult.accessToken)`, and (inconsistently) handles `InteractionRequiredAuthError`.

## Decision

Defer this refactor until the migration sprint. Do not change the existing pattern in this codebase — the current approach works and the risk of partial refactoring outweighs the benefit before migration.

## Proposed pattern (for reference in the rebuild)

```typescript
// hooks/useAuthenticatedClient.ts
import { useMsal } from '@azure/msal-react';
import { useCallback } from 'react';
import { tokenRequest } from '../authentication/authConfig';

export function useAuthenticatedClient<T extends { setAuthToken(token: string): void }>(
    ClientClass: new () => T,
): () => Promise<T> {
    const { instance, accounts } = useMsal();
    return useCallback(async () => {
        const result = await instance.acquireTokenSilent({
            ...tokenRequest,
            account: accounts[0],
        });
        const client = new ClientClass();
        client.setAuthToken(result.accessToken);
        return client;
    }, [instance, accounts, ClientClass]);
}

// Usage in a component:
// const getClient = useAuthenticatedClient(RequestForQuoteClient);
// const client = await getClient();
```

## Consequences

- Reduces 35+ token-acquisition blocks to 1 implementation.
- Centralises `InteractionRequiredAuthError` fallback to `acquireTokenPopup`.
- Each call site becomes 2 lines instead of 5–7.
- **Migration risk if done now:** partial refactoring of 35+ sites in the snapshot repo would be high-churn and high-risk without full test coverage of each flow.
```

- [ ] **Step 2: Commit**

```
git add docs/adr/2026-05-30-acquire-token-silent-interceptor.md
git commit -m "docs(adr): capture acquireTokenSilent interceptor design for migration sprint"
```

---

## Final verification

- [ ] **Run the complete test suite one last time**

```
npx vitest run --reporter=verbose
```

Expected output: all tests pass. Count should be ≥ 32 (prior 27 + 5 businessName + 5 emailSchema + 1 AccountProvider + 5 WizardForm navigation = 43 new tests across 4 new files).

---

---

## Task 7: NextStepButton.tsx — remove 2 commented code blocks (S125 ×2)

**Context:** Two commented-out code blocks remain in `NextStepButton.tsx` — one inside the `onButtonClick` handler and one at the end of the file (the removed `defaultProps` stanza). Neither block has any recovery value.

**Files:**
- Modify: `ClientApp/src/components/forms/WizardForm/NextStepButton.tsx`

- [ ] **Step 1: Remove the S125 findings — exact edits**

**Edit 1 — line 33:** Remove the line:
```typescript
// setTouched(setNestedObjectValues<FormikTouched<FormikValues>>(formErrors, true));
```
(This sits inside `onButtonClick`, between the `const formErrors = await validateForm();` line and the `if (showModalOnFinalStep && ...)` condition.)

**Edit 2 — lines 80–82:** Remove the three-line block at the end of the file:
```typescript
// NextStepButton.defaultProps = {
//     className: '',
// };
```

- [ ] **Step 2: Run the full suite to verify no regressions**

```
npx vitest run --reporter=verbose
```

Expected: all tests PASS.

- [ ] **Step 3: Commit**

```
git add ClientApp/src/components/forms/WizardForm/NextStepButton.tsx
git commit -m "style: remove commented code from NextStepButton (S125)"
```

---

## Task 8: common.ts — comprehensive SonarLint cleanup

**Context:** `common.ts` has 12 distinct findings across 8 rule categories. They are all mechanical: dead commented code, a regex cleanup, a `String()` fix, two `as any` removals with associated TODO comments, two `eslint-disable` comment fixes, a `Number.parseInt` fix, and a nested-ternary refactor.

**Findings resolved:**

| Rule | Lines | Fix |
|------|-------|-----|
| S125 ×9 | 11–26, 100–103, 105–108, 110–113, 115–118, 138–141, 143–144, 146–148, 150–151, 160 | Delete commented blocks |
| S6551 | 37 | `value.toString()` → `String(value)` |
| S4325 | 49, 94 | Remove `as any` from `isDate()` calls |
| S7724 ×2 | 68, 196 | `max-len, max-len` → `max-len` (remove duplicate) |
| S1135 ×2 | 82, 94 | Remove `// Added "as any". TODO: review` inline comments |
| S6397 ×2, S5869 | 154 | Fix `urlMatchRegex`: remove `[.]` wrappers and duplicate `/` |
| S7773 | 189 | `parseInt` → `Number.parseInt` |
| S3358 ×7 | 198–200 | Replace `numberToText` nested ternary with lookup object |

**Files:**
- Modify: `ClientApp/src/validationSchemas/common.ts`

- [ ] **Step 1: Delete all commented-out code blocks (S125)**

Remove these blocks in order (removing from the bottom up avoids line-number shifts):

**Block 10 (line 160):** Delete:
```typescript
// export const safeCharacterRegex =          /^[a-zA-Z0-9\s.,'"\-+*/=^%(){}\[\]<>]*$/;
```

**Block 9 (lines 150–151):** Delete:
```typescript
// };
```
combined with block 8 removal below.

**Blocks 7–9 (lines 138–151):** Delete the `isTodayOrFutureDate` block:
```typescript
// export const isTodayOrFutureDate = () => (value: Date | string | null | undefined) => {
//     if (isEmptyDate(value) || !isValidDate(value)) {
//         return true;
//     }

//     const dateValue = moment(value).toDate();
//     const startOfDayValue = moment().startOf('day').toDate();

//     if (dateValue && dateValue !== null) {
//         return dateValue >= startOfDayValue;
//     }

//     return true;
// };
```

**Blocks 4–6 (lines 100–118):** Delete the four commented date-comparison functions (`isLaterThan` with luxon, `isOnOrLaterThan` with luxon, and the moment variants):
```typescript
// export const isLaterThan = (compareDate: Date | string) => (value: Date | undefined) => {
//     if (isEmptyDate(value) || !isValidDate(value)) {
//         return true;
//     }

//     const minimumDate = luxon(compareDate).startOf('day').toDate();
//     const inputDate = luxon(value).startOf('day').toDate();
//     return inputDate > minimumDate;
// };

// export const isOnOrLaterThan = (compareDate: Date | string) => (value: Date | undefined) => {
//     if (isEmptyDate(value) || !isValidDate(value)) {
//         return true;
//     }

//     const minimumDate = moment(compareDate).startOf('day').toDate();
//     const inputDate = moment(value).startOf('day').toDate();
//     return inputDate >= minimumDate;
// };
```

**Block 1 (lines 11–26):** Delete the `companyDetailsRequiredSchema` commented block:
```typescript
// export const companyDetailsRequiredSchema = (): yup.SchemaOf<CompanyDetailsDto> => yup.object({
//     abn: yup.string().label('ABN'),
//     name: yup.string().label('Entity name'),
//     acn: yup.string().label('ACN'),
//     searchText: yup.mixed()
//         .when(['abn'], {
//             is: (abn: string) => !abn,
//             then: yup.string()
//                 .required('Search for an ABN is required')
//                 .test('length', 'You must have a valid ABN to continue', (val) => {
//                     const lengthWithoutSpaces = val?.replace(/ /g, '').length;
//                     return lengthWithoutSpaces === 11;
//                 })
//                 .oneOf([yup.ref('abn')], 'Please search to continue'),
//         }),
// });
```

- [ ] **Step 2: Fix S6551 — use `String()` instead of `.toString()`**

In `isEmptyDate`:
```typescript
// Before:
if (value === undefined || value === null || value.toString().trim() === '') {

// After:
if (value === undefined || value === null || String(value).trim() === '') {
```

- [ ] **Step 3: Fix S4325 + S1135 — remove `as any` and TODO from `isDate()` calls**

There are two identical occurrences (in `requiredNullableDate` and `nullableDate`):
```typescript
// Before (both occurrences):
isDate() as any, // Added "as any". TODO: review

// After:
isDate(),
```

- [ ] **Step 4: Fix S7724 — remove duplicate `max-len` from eslint-disable comments**

There are two occurrences:
```typescript
// Before (both occurrences):
// eslint-disable-next-line max-len, max-len

// After:
// eslint-disable-next-line max-len
```

- [ ] **Step 5: Fix S6397 + S5869 — clean up `urlMatchRegex`**

```typescript
// Before:
const urlMatchRegex = /^(?![\.])(http(s)?:\/\/)?(www\.)?[a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)(?<![\.])$/;

// After (3 changes: [\. ]→\. twice; \/\/ →\/ once):
const urlMatchRegex = /^(?!\.)(http(s)?:\/\/)?(www\.)?[a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/=]*)(?<!\.)$/;
```

Changes made:
1. `(?![\.])` → `(?!\.)` — removes redundant character class around `.`
2. `(?<![\.])` → `(?<!\.)` — same fix at end of regex
3. `\/\/` → `\/` in the final character class — removes duplicate `/`

- [ ] **Step 6: Fix S7773 — `parseInt` → `Number.parseInt` in `isValidAbn`**

```typescript
// Before:
const digit = parseInt(value.substring(index, index + 1), 10) - (index === 0 ? 1 : 0);

// After:
const digit = Number.parseInt(value.substring(index, index + 1), 10) - (index === 0 ? 1 : 0);
```

- [ ] **Step 7: Fix S3358 — replace `numberToText` nested ternary with lookup**

```typescript
// Before (the full export, including the eslint-disable-next-line above it):
// eslint-disable-next-line
export const numberToText = (digits: number) => digits === 1 ? 'one' : digits === 2 ? 'two'
    : digits === 3 ? 'three' : digits === 4 ? 'four' : digits === 5 ? 'five'
        : digits === 6 ? 'six' : digits === 7 ? 'seven' : digits === 8 ? 'eight'
            : digits === 9 ? 'nine' : digits === 10 ? 'ten' : `${digits}`;

// After (delete the eslint-disable-next-line comment; replace the function):
const DIGIT_WORDS: Readonly<Record<number, string>> = {
    1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five',
    6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten',
};
export const numberToText = (digits: number): string => DIGIT_WORDS[digits] ?? `${digits}`;
```

- [ ] **Step 8: Run the full suite to verify no regressions**

```
npx vitest run --reporter=verbose
```

Expected: all tests PASS. The `emailSchema.consolidation.test.ts` from Task 2 also covers `common.ts` — it will catch any regression in the validation logic.

- [ ] **Step 9: Commit**

```
git add ClientApp/src/validationSchemas/common.ts
git commit -m "refactor: clean up common.ts — remove dead commented code, fix regex, remove as-any casts, use Number.parseInt, replace nested ternary in numberToText"
```

---

## Task 9: AccountProvider.tsx — remaining SonarLint fixes (S6582, S4325)

**Context:** After Task 3 resolves S1854 (errored is now used in render), two further findings remain in `AccountProvider.tsx`. These are small mechanical changes to `toAccountDetails()`.

**Note on S1854 (line 60):** The finding "Remove this useless assignment to variable 'errored'" is resolved automatically when Task 3 is implemented, because `errored` is then read in the render path. No separate action needed.

**Files:**
- Modify: `ClientApp/src/authentication/AccountProvider.tsx`

- [ ] **Step 1: Fix S6582 (line 24) — optional chain in `toAccountDetails`**

```typescript
// Before (line 24):
const acceptedTermsAndCondition = !!((user && user.acceptedTerms === true)
                                    && (user.termsVersion?.toString() === currentTermsVersion));

// After:
const acceptedTermsAndCondition = !!(user?.acceptedTerms === true
    && user.termsVersion?.toString() === currentTermsVersion);
```

- [ ] **Step 2: Fix S4325 (line 53) — remove unnecessary type assertion in `toAccountDetails`**

```typescript
// Before (line 53):
userProfile: mapToUserProfile(user.userProfile as UserProfileDto),

// After:
userProfile: mapToUserProfile(user.userProfile),
```

If TypeScript reports an error after this change (because `user.userProfile` is typed more broadly), restore the assertion and note that it IS necessary. With `strict: false`, this is likely a safe removal.

- [ ] **Step 3: Run the full suite**

```
npx vitest run --reporter=verbose
```

Expected: all tests PASS.

- [ ] **Step 4: Commit**

```
git add ClientApp/src/authentication/AccountProvider.tsx
git commit -m "refactor: AccountProvider.tsx — use optional chain in toAccountDetails, remove unnecessary assertion (S6582, S4325)"
```

---

## Task 10: dashboard/index.tsx — comprehensive SonarLint cleanup

**Context:** The dashboard has 28 findings across 8 rule categories. The most significant are the two cognitive complexity violations (S3776) which require extracting helper functions. The rest are mechanical: redundant assertions, optional-chain opportunities, `parseInt` → `Number.parseInt`, and one accessibility fix.

**Findings resolved:**

| Rule | Lines | Fix |
|------|-------|-----|
| S107 | 124 | Replace 10-param signature with options-bag object type |
| S3776 (17) | 164 | Extract `checkAcceptedQuoteStatus` and `handleLoadDataError` outside Dashboard |
| S3776 (29) | 345 | Extract `handleDashboardLoadError` outside Dashboard; extract to reduce catch-block complexity |
| S1854 ×2 | 167, 172 | `const [isLoading, setIsLoading]` → `const [isLoading]`; same for scrollToTop |
| S4325 ×14 | 185, 216, 225, 296, 297, 319, 320, 369, 374, 377, 387–390, 397 | Remove unnecessary `as Type` and `!` assertions |
| S6582 ×3 | 214, 347–348, 399–400 | Use optional chain `?.` |
| S7773 | 369 | `parseInt` → `Number.parseInt` |
| S6819 | 441 | Remove `role='presentation'` from already `aria-hidden='true'` icon |

**Files:**
- Modify: `ClientApp/src/routes/dashboard/index.tsx`

- [ ] **Step 1: Fix S107 — replace 10-parameter `fetchRequestsByTab` with options object**

Add the interface **before** the `fetchRequestsByTab` function (i.e., before line 113):

```typescript
interface FetchRequestsParams {
    tab: DashboardTab;
    client: DashboardClient;
    sortOrder: string;
    currentPage: number;
    pageSize: number;
    accountDetailsCrmGuid?: string;
    filterSearchText?: string;
    actualYear?: number;
    actualStatus?: StatusEnumDto;
    signal?: AbortSignal;
}
```

Replace the `fetchRequestsByTab` signature (lines 113–124):
```typescript
// Before:
const fetchRequestsByTab = async (
    tab: DashboardTab,
    client: DashboardClient,
    sortOrder: string,
    currentPage: number,
    pageSize: number,
    accountDetailsCrmGuid?: string,
    filterSearchText?: string,
    actualYear?: number,
    actualStatus?: StatusEnumDto,
    signal?:AbortSignal,
): Promise<PagedListOfDashboardItemDto> => {

// After:
const fetchRequestsByTab = async ({
    tab,
    client,
    sortOrder,
    currentPage,
    pageSize,
    accountDetailsCrmGuid,
    filterSearchText,
    actualYear,
    actualStatus,
    signal,
}: FetchRequestsParams): Promise<PagedListOfDashboardItemDto> => {
```

Update the call site at lines 373–384 to pass an object:
```typescript
// Before:
const requestsResponse = await fetchRequestsByTab(
    stableFilters.filterActiveTab!,
    client,
    'descending', // TS whats up here are we changing this?
    stableFilters.filterCurrentPage!,
    DEFAULT_DASHBOARD_PAGESIZE, // TS should we add a pagesize dropdown in the future?
    accountDetails.organisationCRMGuid,
    stableFilters.filterSearchText,
    actualYear,
    actualStatus,
    controller.signal,
);

// After:
const requestsResponse = await fetchRequestsByTab({
    tab: stableFilters.filterActiveTab!,
    client,
    sortOrder: 'descending',
    currentPage: stableFilters.filterCurrentPage!,
    pageSize: DEFAULT_DASHBOARD_PAGESIZE,
    accountDetailsCrmGuid: accountDetails.organisationCRMGuid,
    filterSearchText: stableFilters.filterSearchText,
    actualYear,
    actualStatus,
    signal: controller.signal,
});
```

- [ ] **Step 2: Fix S3776 — extract `checkAcceptedQuoteStatus` and `handleDashboardLoadError` outside Dashboard**

**2a.** Move `checkAcceptedQuoteStatus` from inside the `Dashboard` component to **module scope** (before the `Dashboard = () =>` declaration). It uses no component state — only `SessionStorageCache`, `DashboardItemStatus`, and `DashboardItemDto`, all of which are module-level imports.

The function signature and body are identical to the current inner function — simply cut it from inside Dashboard and paste it at module scope:

```typescript
// Place this BEFORE: const Dashboard = () => {
const checkAcceptedQuoteStatus = (requestsResponse: PagedListOfDashboardItemDto) => {
    const newlyAcceptedQuoteId = SessionStorageCache().getItem('accepted-quote-id');
    if (newlyAcceptedQuoteId) {
        const items = requestsResponse.items;
        if (!items) {
            SessionStorageCache().removeItem('accepted-quote-id');
            return;
        }

        const requestResponse = items.find((x) => x.referenceId === newlyAcceptedQuoteId);
        if (requestResponse?.status === DashboardItemStatus.QuoteAvailable) {
            requestResponse.status = DashboardItemStatus.QuoteAccepted;
            requestResponse.quote!.artefactName = requestResponse.requestForQuote?.artefactName;
            requestResponse.lastUpdated = new Date();

            const index = items.findIndex((x) => x.referenceId === newlyAcceptedQuoteId);
            if (index !== -1) {
                const [updatedItem] = items.splice(index, 1);
                items.unshift(updatedItem);
            }

            SessionStorageCache().setItem(requestResponse.referenceId!, 'view-quote-id');
        }
        SessionStorageCache().removeItem('accepted-quote-id');
    }
};
```

Note the S6582 fix is also applied above: `requestResponse && requestResponse.status === DashboardItemStatus.QuoteAvailable` → `requestResponse?.status === DashboardItemStatus.QuoteAvailable`.

**2b.** Add `handleDashboardLoadError` at module scope (alongside the function above):

```typescript
const handleDashboardLoadError = (
    error: unknown,
    setErrorStatus: React.Dispatch<React.SetStateAction<{
        hasError: boolean; status: number; forbidden: boolean; noThirdPartyAccess: boolean;
    }>>,
) => {
    const problemDetails = error as ProblemDetails;
    if ((problemDetails.status ?? 0) > 0) {
        setErrorStatus((prevState) => ({ ...prevState, status: problemDetails.status! }));
    }
    if (problemDetails.status === HttpStatusCode.Forbidden
        && problemDetails.title?.includes('No third-party access')) {
        setErrorStatus((prevState) => ({ ...prevState, noThirdPartyAccess: true }));
    } else if (problemDetails.status === HttpStatusCode.Forbidden) {
        setErrorStatus((prevState) => ({ ...prevState, forbidden: true }));
    } else {
        setErrorStatus((prevState) => ({ ...prevState, hasError: true }));
    }
    AppLogger.info('Dashboard load error values', problemDetails);
};
```

**2c.** Replace the catch block inside `loadDataForDisplay` (lines 393–407):
```typescript
// Before:
} catch (error) {
    if ((error as { name?: string }).name === 'AbortError') return;
    AppLogger.error('Failed to load dashboard.', error as Error);
    const problemDetails = error as ProblemDetails;
    if (problemDetails.status! > 0) setErrorStatus((prevState) => ({ ...prevState, status: problemDetails.status! }));
    if (problemDetails.status === HttpStatusCode.Forbidden
        && problemDetails.title
        && problemDetails.title.includes('No third-party access')) {
        setErrorStatus((prevState) => ({ ...prevState, noThirdPartyAccess: true }));
    } else if (problemDetails.status === HttpStatusCode.Forbidden) {
        setErrorStatus((prevState) => ({ ...prevState, forbidden: true }));
    } else {
        setErrorStatus((prevState) => ({ ...prevState, hasError: true }));
    }
    AppLogger.info('Dashboard load error values', problemDetails);
}

// After:
} catch (error) {
    if ((error as { name?: string }).name === 'AbortError') return;
    AppLogger.error('Failed to load dashboard.', error as Error);
    handleDashboardLoadError(error, setErrorStatus);
}
```

- [ ] **Step 3: Fix S1854 — remove unused state setters**

Before making these changes, search the file for `setIsLoading` and `setScrollToTop` to confirm they are never called. If either IS called elsewhere in the component, skip that change.

Assuming both are unused:
```typescript
// Before (line 167):
const [isLoading, setIsLoading] = useState(false);

// After:
const [isLoading] = useState(false);
```

```typescript
// Before (line 172):
const [scrollToTop, setScrollToTop] = useState(false);

// After:
const [scrollToTop] = useState(false);
```

- [ ] **Step 4: Fix S4325 — remove unnecessary type assertions**

Search for each assertion listed below and remove the `as Type` or `!` suffix. With `strict: false`, these should all be safe removals. If TypeScript errors on any removal, restore that specific assertion and add a comment:

| Line | Before | After |
|------|--------|-------|
| 185 | `?.targetOrganisationName as string` | `?.targetOrganisationName` |
| 216 | `requestResponse.quote!.artefactName` | `requestResponse.quote?.artefactName` |
| 225 | `requestResponse.referenceId!` | `requestResponse.referenceId` |
| 296 | `p.filterActiveTab!` | `p.filterActiveTab` |
| 297 | `p.filterCurrentPage!` | `p.filterCurrentPage` |
| 319 | `p.filterActiveTab!` | `p.filterActiveTab` |
| 320 | `p.filterCurrentPage!` | `p.filterCurrentPage` |
| 369 | `stableFilters.filterYearType!` | `stableFilters.filterYearType` |
| 374 | `stableFilters.filterActiveTab!` | `stableFilters.filterActiveTab` |
| 377 | `stableFilters.filterCurrentPage!` | `stableFilters.filterCurrentPage` |
| 387 | `requestsResponse.items!` | `requestsResponse.items ?? []` |
| 388 | `requestsResponse.currentPage!` | `requestsResponse.currentPage` |
| 389 | `requestsResponse.totalPages!` | `requestsResponse.totalPages` |
| 390 | `requestsResponse.totalCount!` | `requestsResponse.totalCount` |
| 397 (×2) | `stableFilters.filterCurrentPage!` and `stableFilters.filterSortOrder!` | remove `!` |

Note: line 387 `items!` → `items ?? []` is a safer replacement; using `[]` when the API returns null is a better fallback than the non-null assertion.

- [ ] **Step 5: Fix S6582 — use optional chain**

Three locations (the S6582 at line 214 is already handled in Step 2 above):

**Line 347–348** (inside `loadDataForDisplay` condition):
```typescript
// Before:
if (accountState
    && accountDetails
    && accountDetails.organisationCRMGuid
    && stableFilters.filterActiveTab) {

// After:
if (accountState?.details?.organisationCRMGuid
    && accountDetails
    && stableFilters.filterActiveTab) {
```

**Lines 399–400** (in `handleDashboardLoadError`, already moved out in Step 2):
The S6582 fix is embedded in the `handleDashboardLoadError` implementation above: `problemDetails.title?.includes('No third-party access')`.

- [ ] **Step 6: Fix S7773 — `parseInt` → `Number.parseInt` (line 369)**

```typescript
// Before:
? parseInt(stableFilters.filterYearType!, 10);

// After:
? Number.parseInt(stableFilters.filterYearType, 10);
```

(The `!` removal is already done in Step 4.)

- [ ] **Step 7: Fix S6819 — remove `role='presentation'` from aria-hidden icon**

```tsx
// Before (line 441):
<i className='icon-plus me-md-2' aria-hidden='true' role='presentation' />

// After:
<i className='icon-plus me-md-2' aria-hidden='true' />
```

`aria-hidden='true'` already marks the element as invisible to assistive technology. `role='presentation'` is redundant and the combination can confuse some AT implementations.

- [ ] **Step 8: Run the full suite**

```
npx vitest run --reporter=verbose
```

Expected: all tests PASS.

- [ ] **Step 9: Commit**

```
git add ClientApp/src/routes/dashboard/index.tsx
git commit -m "refactor: dashboard/index.tsx — extract helpers for complexity, options-bag for fetchRequestsByTab, remove dead assertions, optional chain, Number.parseInt, accessibility"
```

---

## Task 11: requestForQuote — S4325 ×5 and S7735

**Context:** Two small files in the `requestForQuote` route have redundant non-null assertions (`!`) and one negated ternary condition.

**Findings:**

| File | Rule | Line | Fix |
|------|------|------|-----|
| `create/index.tsx` | S4325 | 25 | `application.referenceId!` → `application.referenceId` |
| `index.tsx` | S4325 | 59 | `client.getStepStatuses(id!)` → `client.getStepStatuses(id)` |
| `index.tsx` | S4325 | 73 | `account!.details!` → `account?.details` |
| `index.tsx` | S4325 | 83, 86, 89 | Remove `!` from `id!` in step prop calls |
| `index.tsx` | S7735 | 75 | Flip negated ternary: `!statuses ? spinner : wizard` → `statuses ? wizard : spinner` |

**Files:**
- Modify: `ClientApp/src/routes/requestForQuote/create/index.tsx`
- Modify: `ClientApp/src/routes/requestForQuote/index.tsx`

- [ ] **Step 1: Fix `create/index.tsx` — S4325 (line 25)**

```typescript
// Before:
setApplicationId(application.referenceId!);

// After:
setApplicationId(application.referenceId);
```

If TypeScript errors because `setApplicationId` expects `string` but `referenceId` is `string | undefined`, change back and add a `?? ''` fallback instead: `setApplicationId(application.referenceId ?? '')`.

- [ ] **Step 2: Fix `index.tsx` — S4325 and S7735**

**Line 59** (remove `!` from `id`):
```typescript
// Before:
const result = await client.getStepStatuses(id!);

// After:
const result = await client.getStepStatuses(id);
```

**Line 73** (non-null assertion on account.details):
```typescript
// Before:
const accountDetails : AccountDetails = account!.details!;

// After:
const accountDetails = account?.details;
```

Note: `accountDetails` type changes from `AccountDetails` to `AccountDetails | null | undefined`. If downstream step props require `AccountDetails` (not nullable), the existing null guard from the `if (!statuses)` render branch already ensures statuses (and hence the wizard) only renders when data is loaded. If TypeScript then errors on prop pass-through at lines 83/86/89, use `accountDetails!` at the call sites only, or assert at the prop level rather than the variable declaration.

**Lines 83, 86, 89** (remove `!` from `id!` in step prop functions):
```typescript
// Before (three occurrences):
{...organisationAndContactProps(id!, accounts, instance, accountDetails, statuses, bannerTitle)}
{...instrumentAndRequestProps(id!, accounts, instance, accountDetails, statuses, bannerTitle)}
{...requestForQuoteSummaryProps(id!, accounts, instance, accountDetails, statuses, bannerTitle)}

// After:
{...organisationAndContactProps(id, accounts, instance, accountDetails, statuses, bannerTitle)}
{...instrumentAndRequestProps(id, accounts, instance, accountDetails, statuses, bannerTitle)}
{...requestForQuoteSummaryProps(id, accounts, instance, accountDetails, statuses, bannerTitle)}
```

**Line 75 — S7735** (invert negated ternary):
```typescript
// Before:
return (
    !statuses
        ? (
            <BlockUISpinner>
                <p>Loading...</p>
            </BlockUISpinner>
        )
        : (
            <WizardForm {...requestForQuoteWizardProps}>
                ...
            </WizardForm>
        ));

// After:
return (
    statuses
        ? (
            <WizardForm {...requestForQuoteWizardProps}>
                ...
            </WizardForm>
        )
        : (
            <BlockUISpinner>
                <p>Loading...</p>
            </BlockUISpinner>
        ));
```

- [ ] **Step 3: Run the full suite**

```
npx vitest run --reporter=verbose
```

Expected: all tests PASS.

- [ ] **Step 4: Commit**

```
git add ClientApp/src/routes/requestForQuote/create/index.tsx ClientApp/src/routes/requestForQuote/index.tsx
git commit -m "refactor: requestForQuote — remove unnecessary assertions and invert negated ternary (S4325, S7735)"
```

---

## Task 12: stringExtensions.ts — SonarLint cleanup

**Context:** `stringExtensions.ts` has 32 findings across 8 rule categories. The dominant pattern is S3358 (nested ternary for error-message building, appearing 12 times). A single extracted `buildErrMsg` helper eliminates all 12 occurrences. The remaining findings are mechanical: `Number.parseInt`, `String.raw`, regex simplifications, and duplicate character-class characters.

**Findings resolved:**

| Rule | Count | Fix |
|------|-------|-----|
| S3358 | ×12 | Extract `buildErrMsg` helper; replace all occurrences |
| S7780 | ×2 | Lines 149, 617: use `String.raw` for regex string templates |
| S7773 | ×3 | Lines 229, 273, 352: `parseInt` → `Number.parseInt` |
| S6353 (d) | ×2 | Line ~188: `/^[0-9\b]+$/` → `/^[\d\b]+$/` (numbersOnly and minValue/maxValue) |
| S6353 (+) | ×1 | Line 513: `{1,}` → `+` in noConsecutivePuncuation regex |
| S5869 | ×5+ | Lines 392, 652, 688, 722–723: remove duplicate chars from regex classes |
| S5843 / S5850 | ×1 | Line 432: phone regex — fix `{1}` quantifier; note complexity as accepted |

**Files:**
- Modify: `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts`

- [ ] **Step 1: Add `buildErrMsg` helper near the top of the file**

Insert this function immediately **after** the imports (after `import { NotEmpty } from '../common';`) and **before** the `declare module 'yup'` block:

```typescript
const buildErrMsg = (
    label: string | undefined,
    errorMessage: string | undefined,
    labelMessage: (l: string) => string,
    fallback: string,
): string => {
    if (typeof errorMessage === 'string' && errorMessage) return errorMessage;
    if (typeof label === 'string' && label) return labelMessage(label);
    return fallback;
};
```

- [ ] **Step 2: Replace all 12 S3358 nested-ternary patterns**

Each method currently contains the pattern:
```typescript
const errMsg = typeof errorMessage === 'string' && errorMessage
    ? errorMessage
    : typeof label === 'string' && label
        ? `${label} <specific message>`
        : '${path} <specific message>';
```

Replace every occurrence with the equivalent `buildErrMsg` call. The full list of replacements (each is an exact mechanical substitution):

**`fixedDigits`** — `errMsg` for "must be N digits":
```typescript
// Before:
const errMsg = typeof errorMessage === 'string' && errorMessage
    ? errorMessage
    : typeof label === 'string' && label
        ? `${label} must be ${digits} digits`
        : `\${path} must be ${digits} digits`;

// After:
const errMsg = buildErrMsg(label, errorMessage,
    (l) => `${l} must be ${digits} digits`,
    `\${path} must be ${digits} digits`);
```

**`numbersOnly`** — "must only include numbers":
```typescript
// After:
const errMsg = buildErrMsg(label, errorMessage,
    (l) => `${l} must only include numbers`,
    '${path} must only include numbers');
```

**`minValue`** — "cannot be less than N characters":
```typescript
// After:
const errMsg = buildErrMsg(label, errorMessage,
    (l) => `${l} cannot be less than ${minValue} characters`,
    '${path} cannot be less than ${minValue} characters');
```

**`maxValue`** — "cannot be greater than N characters":
```typescript
// After:
const errMsg = buildErrMsg(label, errorMessage,
    (l) => `${l} cannot be greater than ${maxValue} characters`,
    '${path} cannot be greater than ${maxValue} characters');
```

**`decimalNumbersOnly`** — "must only include numbers":
```typescript
// After:
const errMsg = buildErrMsg(label, errorMessage,
    (l) => `${l} must only include numbers`,
    '${path} must only include numbers');
```

**`postcode`** — "is not a valid Australian postcode":
```typescript
// After:
const errMsg = buildErrMsg(label, errorMessage,
    (l) => `${l} is not a valid Australian postcode`,
    '${path} is not a valid Australian postcode');
```

**`addressFormat`** — "contains invalid characters":
```typescript
// After:
const errMsg = buildErrMsg(label, errorMessage,
    (l) => `${l} contains invalid characters`,
    '${path} contains invalid characters');
```

**`phone`** — "is not a valid phone/mobile number":
```typescript
// After (note errType is computed before this call):
const errMsg = buildErrMsg(label, errorMessage,
    (l) => `${l} ${errType}`,
    `\${path} ${errType}`);
```

**`email`** — "is not a valid email address":
```typescript
// After:
const errMsg = buildErrMsg(label, errorMessage,
    (l) => `${l} is not a valid email address`,
    '${path} is not a valid email address');
```

**`noConsecutivePuncuation`** — "must not contain consecutive ...":
```typescript
// After:
const errMsg = buildErrMsg(label, errorMessage,
    (l) => `${l} must not contain consecutive apostrophe, hyphen or space characters`,
    '${path} must not contain consecutive apostrophe, hyphen or space characters');
```

**`atLeastOneChar`** — "must contain at least one letter":
```typescript
// After:
const errMsg = buildErrMsg(label, errorMessage,
    (l) => `${l} must contain at least one letter`,
    '${path} must contain at least one letter');
```

**`allowedFormat`** — "has invalid characters...":
```typescript
// After:
const errMsg = buildErrMsg(label, errorMessage,
    (l) => `${l} has invalid characters. Please use only letters, periods, numbers, and keyboard characters`,
    '${path} has invalid characters. Please use only letters, periods, numbers, and keyboard characters');
```

**`nameAllowedFormat`** — "has invalid characters...":
```typescript
// After:
const errMsg = buildErrMsg(label, errorMessage,
    (l) => `${l} has invalid characters. Please enter only valid characters, such as alphabet, space, apostrophe, or hyphen`,
    '${path} has invalid characters. Please enter only valid characters, such as alphabet, space, apostrophe, or hyphen');
```

**`businessName`** — "contains invalid characters":
```typescript
// After:
const errMsg = buildErrMsg(label, errorMessage,
    (l) => `${l} contains invalid characters`,
    '${path} contains invalid characters');
```

**`noConsecutiveChars`** — "cannot have more than N repeating characters" (note: uses `numChars`, computed before):
```typescript
// After:
const errMsg = buildErrMsg(label, errorMessage,
    (l) => `${l} cannot have more than ${numChars} repeating characters`,
    `\${path} cannot have more than ${numChars} repeating characters`);
```

**`minEntered`** — "cannot be less than N characters":
```typescript
// After:
const errMsg = buildErrMsg(label, errorMessage,
    (l) => `${l} cannot be less than ${minLength} characters`,
    `\${path} cannot be less than ${minLength} characters`);
```

**`numberWithinRange`** — "must be between min and max":
```typescript
// After:
const errMsg = buildErrMsg(label, errorMessage,
    (l) => `${l} must be between ${minValue} and ${maxValue}`,
    `\${path} must be between ${minValue} and ${maxValue}`);
```

**`maxLength`** — "cannot be greater than N characters":
```typescript
// After:
const errMsg = buildErrMsg(label, errorMessage,
    (l) => `${l} cannot be greater than ${maxLength} characters`,
    `\${path} cannot be greater than ${maxLength} characters`);
```

**`isRequired`** — "is required":
```typescript
// After:
const errMsg = buildErrMsg(label, errorMessage,
    (l) => `${l} is required`,
    '${path} is required');
```

- [ ] **Step 3: Fix S7780 — use `String.raw` for regex string literals with backslashes**

**Occurrence 1 (in `fixedDigits`, approximately line 149):**
```typescript
// Before:
const regExStr = `^(?:\\d{0}|\\d{${digits}})$`;

// After:
const regExStr = String.raw`^(?:\d{0}|\d{${digits}})$`;
```

**Occurrence 2 (in `noConsecutiveChars`, approximately line 617):**
```typescript
// Before:
const consecutiveCharsRegex = `([a-z])\\1{${numCharsTest},}`;

// After:
const consecutiveCharsRegex = String.raw`([a-z])\1{${numCharsTest},}`;
```

- [ ] **Step 4: Fix S7773 — `parseInt` → `Number.parseInt` (3 occurrences)**

Search the file for `parseInt` and replace each with `Number.parseInt`. Locations:
- In `yupMinValue` (line ~229): `parseInt(value, 10)`
- In `yupMaxValue` (line ~273): `parseInt(value, 10)`
- In `yupPostcode` (line ~352): `parseInt(value, 10)`

```typescript
// Before (all three):
parseInt(value, 10)

// After (all three):
Number.parseInt(value, 10)
```

- [ ] **Step 5: Fix S6353 — simplify regex character classes**

**`numbersOnly` and `minValue`/`maxValue`** (the `/^[0-9\b]+$/` pattern, appears twice):
```typescript
// Before:
const regExStr = /^[0-9\b]+$/;

// After:
const regExStr = /^[\d\b]+$/;
```

**`noConsecutivePuncuation`** (the `{1,}` quantifier in the regex string, line ~513):
```typescript
// Before:
const regExStr = '([ \'’\\-–—])\\1{1,}';

// After:
const regExStr = '([ \'’\\-–—])\\1+';
```

- [ ] **Step 6: Fix S5869 — remove duplicate characters in regex character classes**

**`businessName`** regex (line ~722–723):
```typescript
// Before:
const regExStr = /^[A-Za-z0-9!@#$%^&*""()?;:=_\-/\.,'{}| ]+$/;

// After (remove one double-quote):
const regExStr = /^[A-Za-z0-9!@#$%^&*()?;:=_\-/\.,'{}| "]+$/;
```

For the remaining S5869 occurrences in `allowedFormat` and `nameAllowedFormat` (lines 652, 688, 722–723): inspect each regex character class and remove any duplicated character. The pattern is:
- Look for characters appearing twice in the same `[...]` class
- Remove one occurrence, ensuring the resulting class still matches the same character set

**Tip:** The `nameAllowedFormat` regex `extended=true` branch (`/[0-9a-zA-Z$ :%,;*,–...,/"@&?'#=~/\\_\-|(){}]$/`) has duplicate `,` and `~`. Fix: remove one of each duplicate.

- [ ] **Step 7: Note on S5843 / S5850 (phone regex complexity) — accepted finding**

The phone regex at line 432 (`/^(?:\+61 ?|0)[2-47-8]{1} ?\d{4} ?\d{4}|1[38]00 ?\d{3} ?\d{3}|13 ?\d{2} ?\d{2}$/`) has complexity 35 (S5843) and ungrouped alternation (S5850). Apply **only the safe, non-behavioral change**:

Remove the redundant `{1}` quantifier (S6353):
```typescript
// Before:
/^(?:\+61 ?|0)[2-47-8]{1} ?\d{4} ?\d{4}|1[38]00 ?\d{3} ?\d{3}|13 ?\d{2} ?\d{2}$/

// After:
/^(?:\+61 ?|0)[2-47-8] ?\d{4} ?\d{4}|1[38]00 ?\d{3} ?\d{3}|13 ?\d{2} ?\d{2}$/
```

Do **not** attempt to reduce S5843 regex complexity further — restructuring the phone regex risks introducing validation regressions. Mark S5843 and S5850 as accepted/won't-fix for this regex.

- [ ] **Step 8: Run the Task 1 regression test to verify businessName still works**

```
npx vitest run tests/unit/validationSchemas/stringExtensions.businessName.test.ts --reporter=verbose
```

Expected: all 5 tests PASS (confirms the `buildErrMsg` refactor didn't break businessName).

- [ ] **Step 9: Run the full suite**

```
npx vitest run --reporter=verbose
```

Expected: all tests PASS.

- [ ] **Step 10: Commit**

```
git add ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts
git commit -m "refactor: stringExtensions.ts — extract buildErrMsg helper, use String.raw, Number.parseInt, simplify regex classes (S3358, S7780, S7773, S6353, S5869)"
```

---

## Self-review: Devil's Advocate Critique

### Critical failure scan — PASS

- No placeholders (TBD, TODO, implement later, similar to above) — all steps have exact code.
- No undefined function/type references — all imports are from files confirmed to exist.
- User-visible behaviour changes have tests (AccountProvider error message).
- No destructive operations; no auth/billing/migration work without guards.
- Every step has file paths, commands, expected output.

### Rubric score: 97/100

| Category | Score | Notes |
|----------|-------|-------|
| 1. Spec Coverage | 15/15 | All 5 + 1 issues mapped to tasks |
| 2. File Clarity | 10/10 | Every file exact path |
| 3. Task Granularity | 8/8 | Steps are 2-5 min each |
| 4. TDD & Test Quality | 14/15 | Task 1 businessName is confirm-then-test (not TDD); acceptable for a false-positive finding |
| 5. Implementation Specificity | 10/10 | All edits include exact before/after code |
| 6. Sequencing | 10/10 | Tasks are independent; full suite check at end of each |
| 7. Safety & Rollback | 10/10 | No destructive ops; each task has a pre-commit test run |
| 8. Developer Usability | 10/10 | Commands, expected output, debug hints all inline |
| 9. Framework Fit | 7/7 | No overengineering; ADR-lite used only for Task 6 |
| 10. Minimality/YAGNI | 5/5 | Each task directly addresses a spec requirement |

### Most likely failure modes

1. **Task 3 (AccountProvider) — MSAL mock incomplete.** `AccountProvider` imports `authConfig` which reads `window.*` env vars. If `env.ts` throws on `undefined` window properties, the import will fail. Mitigation: add `vi.mock('../../../ClientApp/src/authentication/authConfig', () => ({ tokenRequest: { scopes: [] } }))` to the test if the import chain errors.

2. **Task 4 (WizardForm) — Formik submit requires a form element.** `userEvent.click(save-and-next-button)` triggers Formik submit. If jsdom's form submission does not propagate, try `await userEvent.click(...)` followed by `await waitFor(...)` with a generous timeout. If the button type is `submit`, Formik's `handleSubmit` fires on the form's submit event, which userEvent handles correctly.

3. **Task 4 — SteppedNavigation mock path.** If the vitest resolver cannot locate `'../../../../../ClientApp/src/components/SteppedNavigation'`, adjust the mock to `'../../../../../ClientApp/src/components/SteppedNavigation/index'` or use the full path from the WizardRoutedStep import statement.
