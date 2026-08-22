# Test Contract Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the unit and Storybook suites by aligning stale test mocks and assertions with the current persisted-modal, validation-copy, hard-redirect, and accessible-role contracts.

**Architecture:** Keep application behavior unchanged because each reported failure is caused by test code that no longer matches an intentional production contract. Update each test at its owning boundary, add a regression assertion for persisted branch notifications, and then run targeted and repository-wide validation.

**Tech Stack:** React 18, TypeScript, Vitest 4, Testing Library, React Router, Storybook 10, Yup

---

## File Structure

- Modify `tests/unit/routes/preConditions.test.tsx`: provide the complete notification-storage mock used by `PreConditions` and verify persisted branch notifications initialize the selector modal.
- Modify `tests/unit/routes/requestForQuote/validation.test.ts`: assert the user-facing manufacturer validation copy already required by the RFQ BDD feature.
- Modify `tests/unit/components/forms/wizardRoutedStep/WizardRoutedStep.integration.test.tsx`: test the 410 flow as a hard browser redirect instead of in-memory router navigation.
- Modify `ClientApp/src/components/Alert/NotificationMessage.stories.tsx`: query the accessible role explicitly supplied by the success story.

Production files are deliberately not modified:

- `ClientApp/src/routes/preConditions/PreConditions.tsx` correctly reads `getBranchModalNotification()` when initializing modal state.
- `ClientApp/src/routes/requestForQuote/validation.ts` intentionally returns `Enter a manufacturer.`, matching `tests/e2e/features/rfq/manage-rfq.feature`.
- `ClientApp/src/components/forms/WizardForm/WizardRoutedStep.tsx` intentionally uses `globalThis.location.replace('/sign-out')` for a full sign-out document load.
- `ClientApp/src/components/Alert/NotificationMessage.tsx` correctly forwards the story's explicit `role="status"`.

This source-map snapshot has no `.git` directory, so commit steps are omitted; `git status` and `git commit` cannot run in this workspace.

### Task 1: Restore the PreConditions storage mock contract

**Files:**
- Modify: `tests/unit/routes/preConditions.test.tsx:1-85`
- Test: `tests/unit/routes/preConditions.test.tsx`

- [ ] **Step 1: Run the focused test and preserve the failure evidence**

Run:

```bash
npm run test:unit -- tests/unit/routes/preConditions.test.tsx
```

Expected: all 19 tests fail before rendering with `No "getBranchModalNotification" export is defined`.

- [ ] **Step 2: Import the mocked storage getter**

Add this import with the other application imports:

```ts
import { getBranchModalNotification } from '../../../ClientApp/src/storage/notification';
import { NotificationSeverity } from '../../../ClientApp/src/storage/types';
```

- [ ] **Step 3: Add the getter to the notification-storage mock**

Replace the current storage mock with:

```ts
vi.mock('../../../ClientApp/src/storage/notification', () => ({
    clearDashboardNotification: vi.fn(),
    getBranchModalNotification: vi.fn(() => null),
}));
```

- [ ] **Step 4: Reset the persisted-notification fixture between tests**

Add this line to the existing `beforeEach`:

```ts
vi.mocked(getBranchModalNotification).mockReturnValue(null);
```

The complete reset block should end with:

```ts
beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getBranchModalNotification).mockReturnValue(null);
    mockIsAuthenticated = false;
    mockAccountStateDetails = null;
    mockAccountDispatchAvailable = true;
});
```

- [ ] **Step 5: Add a regression test for persisted branch notifications**

Add this test beside the existing branch-selector cases:

```tsx
it('initializes the branch selector from a persisted notification', () => {
    vi.mocked(getBranchModalNotification).mockReturnValue({
        message: 'Select a branch to continue.',
        severity: NotificationSeverity.Information,
    });
    mockIsAuthenticated = true;
    mockAccountStateDetails = { ...BASE };

    renderAt('/dashboard');

    expect(screen.getByTestId('branch-selector-modal')).toBeInTheDocument();
});
```

- [ ] **Step 6: Run the focused test**

Run:

```bash
npm run test:unit -- tests/unit/routes/preConditions.test.tsx
```

Expected: 20 tests pass.

### Task 2: Align the RFQ validation assertion with approved copy

**Files:**
- Modify: `tests/unit/routes/requestForQuote/validation.test.ts:84-96`
- Test: `tests/unit/routes/requestForQuote/validation.test.ts`

- [ ] **Step 1: Run the focused test and confirm the copy mismatch**

Run:

```bash
npm run test:unit -- tests/unit/routes/requestForQuote/validation.test.ts
```

Expected: only `requires missing submit fields` fails because the schema returns `Enter a manufacturer.`.

- [ ] **Step 2: Update the stale expected message**

In the `errors: expect.arrayContaining([...])` assertion, replace:

```ts
'Manufacturer is a required field',
```

with:

```ts
'Enter a manufacturer.',
```

Do not change `ClientApp/src/routes/requestForQuote/validation.ts`; the current copy is also asserted by `tests/e2e/features/rfq/manage-rfq.feature`.

- [ ] **Step 3: Run the focused test**

Run:

```bash
npm run test:unit -- tests/unit/routes/requestForQuote/validation.test.ts
```

Expected: 10 tests pass.

### Task 3: Test the Wizard 410 flow as a hard redirect

**Files:**
- Modify: `tests/unit/components/forms/wizardRoutedStep/WizardRoutedStep.integration.test.tsx:189-196`
- Test: `tests/unit/components/forms/wizardRoutedStep/WizardRoutedStep.integration.test.tsx`

- [ ] **Step 1: Run the focused test and confirm jsdom cannot perform document navigation**

Run:

```bash
npm run test:unit -- tests/unit/components/forms/wizardRoutedStep/WizardRoutedStep.integration.test.tsx
```

Expected: `navigates to sign-out after a gone load error` fails, and jsdom reports `Not implemented: navigation to another Document`.

- [ ] **Step 2: Replace the memory-router assertion with a location spy**

Add `afterEach` to the existing Vitest import:

```ts
import {
    describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
```

Add automatic spy restoration below the existing `beforeEach`:

```ts
afterEach(() => {
    vi.restoreAllMocks();
});
```

Then replace the failing test with:

```tsx
it('replaces the document location with sign-out after a gone load error', async () => {
    const replace = vi.fn();
    vi.spyOn(window, 'location', 'get').mockReturnValue({
        ...window.location,
        replace,
    } as Location);
    const router = makeRouter({
        loadStepValues: vi.fn().mockRejectedValue({ status: 410, title: 'Gone' }),
    });

    render(<RouterProvider router={router} />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/sign-out'));
});
```

Keep the `/sign-out` route in `makeRouter`; it is harmless shared fixture data, while the revised assertion documents that this path is not reached through React Router.

- [ ] **Step 3: Run the focused test**

Run:

```bash
npm run test:unit -- tests/unit/components/forms/wizardRoutedStep/WizardRoutedStep.integration.test.tsx
```

Expected: 22 tests pass with no document-navigation warning.

### Task 4: Align the NotificationMessage story with its explicit accessible role

**Files:**
- Modify: `ClientApp/src/components/Alert/NotificationMessage.stories.tsx:15-27`
- Test: `ClientApp/src/components/Alert/NotificationMessage.stories.tsx`

- [ ] **Step 1: Run the focused Storybook test**

Run:

```bash
npm run test:storybook -- ClientApp/src/components/Alert/NotificationMessage.stories.tsx
```

Expected: `Success` fails because the rendered live region has role `status`, not `alert`.

- [ ] **Step 2: Correct the play-function query and comment**

Replace the current `Success.play` function with:

```ts
play: async ({ canvas }) => {
    const status = canvas.getByRole('status');
    await expect(status).toHaveAttribute('aria-live', 'polite');
},
```

The story explicitly passes `role: 'status'`, and `NotificationMessage` forwards that prop through `AlertSuccess`, so the role query should assert the rendered accessibility contract.

- [ ] **Step 3: Run the focused Storybook test**

Run:

```bash
npm run test:storybook -- ClientApp/src/components/Alert/NotificationMessage.stories.tsx
```

Expected: 5 tests pass.

### Task 5: Verify the complete quality gates

**Files:**
- Verify only: all files changed in Tasks 1-4

- [ ] **Step 1: Run the complete unit suite**

Run:

```bash
npm run test:unit
```

Expected: all unit test files and tests pass.

- [ ] **Step 2: Run the complete Storybook test suite**

Run:

```bash
npm run test:storybook
```

Expected: all Storybook test files and stories pass.

- [ ] **Step 3: Run TypeScript checking**

Run:

```bash
npm run type-check
```

Expected: exits with code 0 and no TypeScript diagnostics.

- [ ] **Step 4: Run lint**

Run:

```bash
npm run lint
```

Expected: exits with code 0 and no ESLint errors.

- [ ] **Step 5: Review the final change scope**

Run:

```powershell
Get-Item `
  tests/unit/routes/preConditions.test.tsx, `
  tests/unit/routes/requestForQuote/validation.test.ts, `
  tests/unit/components/forms/wizardRoutedStep/WizardRoutedStep.integration.test.tsx, `
  ClientApp/src/components/Alert/NotificationMessage.stories.tsx |
  Select-Object FullName, LastWriteTime
```

Expected: only the four planned test/story source files were modified during implementation; no generated, vendor, API-client, or production behavior files were changed.
