# Unit Test Failure Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the unit suite from 14 failed files and 41 failed tests to 114 passing files and 1,168 passing tests without weakening the application contracts or editing generated API code.

**Architecture:** Correct five confirmed handwritten-source defects, then align tests with the current nested user-profile DTO, React Aria link/combobox semantics, generated API-client lifecycle, and JSX-based Storybook inventories. Keep the generated NSwag client unchanged and use explicit route-coverage exclusions for pattern/type approval routes until deterministic Playwright fixtures exist.

**Tech Stack:** React 18, TypeScript 5, Vitest 4, Testing Library, React Aria Components 1.19, React Router 7, Formik, date-fns 3, Storybook 10

---

## Failure Map

| Cluster | Failed tests | Resolution |
| --- | ---: | --- |
| Utility helpers | 3 | Fix `head`, `formatDate`, and `formatBytes` in handwritten source |
| Account/profile persistence | 12 | Align account, search-filter, and dashboard tests with nested `UserProfileDto` payloads |
| AutoSuggest and AddressLookup | 14 | Fix clear-selection behavior; align tests with React Aria listbox semantics |
| Shared UI and static routes | 6 | Fix the `Welcome` accessible name; update link, breadcrumb, and services-page tests |
| Generated API client | 1 | Test the generated instance-caching contract without editing generated code |
| Route and Storybook inventories | 5 | Register new routes/families and make drift tests understand JSX `DocsTable` rows |
| **Total** | **41** | |

## File Structure

### Handwritten production source

- Modify `ClientApp/src/utils/index.ts`: restore correct array, date, and byte-format helper behavior.
- Modify `ClientApp/src/components/Inputs/AutoSuggest/index.tsx`: clear a selected option when the controlled input is emptied.
- Modify `ClientApp/src/components/Welcome/index.tsx`: preserve a spoken space between “Welcome” and the user name.

### Unit tests

- Modify `tests/unit/authentication/AccountProvider.dispatch.test.tsx`: assert the current nested `UserProfileDto` and complete generated-client argument list.
- Modify `tests/unit/components/searchFilter.behavior.test.tsx`: assert `testingCalibrationDashboard` payloads.
- Modify `tests/unit/routes/dashboard.test.tsx`: assert nested persistence payloads and string/undefined API filters.
- Modify `tests/unit/components/inputs/complexInputs.behavior.test.tsx`: query React Aria options and verify current keyboard behavior.
- Modify `tests/unit/components/inputs/combobox.accessibility.test.tsx`: assert listbox/option roles after opening the combobox.
- Modify `tests/unit/components/inputs/residualBranches.test.tsx`: assert React Aria’s first-option focus on ArrowUp.
- Modify `tests/unit/components/simpleRuntimeComponents.test.tsx`: assert link and breadcrumb semantics on their actual elements.
- Modify `tests/unit/components/headerFooterChrome.test.tsx`: query the help guide as a link.
- Modify `tests/unit/routes/staticPages.test.tsx`: provide the account-hook state required by `ServicesWeOffer` and assert the current selector surface.
- Modify `tests/unit/api/authorizedApiBase.test.ts`: test per-client target-organisation caching.
- Modify `tests/unit/e2e/routeCoverage.test.ts`: no logic change is expected; it verifies the manifest changes.
- Modify `tests/unit/storybookMigrationInventory.test.ts`: recognize JSX `DocsTable` rows.
- Modify `tests/unit/storybook/coverageDrift.test.ts`: recognize the exact JSX phase-status row.

### Coverage and Storybook documentation

- Modify `tests/e2e/route-coverage.ts`: correct the account wildcard route and register the six pattern/type approval routes.
- Modify `ClientApp/src/routes/RouteInventory.docs.mdx`: document all 41 routes.
- Modify `ClientApp/src/components/ComponentInventory.docs.mdx`: register `Progress` and `SlateEditor`.
- Modify `ClientApp/src/storybook/CoverageMatrix.docs.mdx`: refresh counts and register the new route/component families.

### Explicitly unchanged

- Do not edit `ClientApp/src/api/web-api-client.ts`. It is generated NSwag output and the workspace instructions prohibit direct edits.
- Do not add `@react-aria/test-utils` solely for these failures. Existing Testing Library coverage can express the required behavior without adding a dependency.
- Do not change React Aria options back into buttons. A combobox popup is a `listbox`, and its children are `option` elements.

The workspace contains an empty `.git` directory rather than usable Git metadata. Commit steps are therefore omitted because `git status` and `git commit` fail with “not a git repository.”

### Task 1: Repair utility helper contracts

**Files:**

- Modify: `ClientApp/src/utils/index.ts:2-7,46-48,168-186`
- Test: `tests/unit/utils/index.test.ts:91-96,209-216,227-233`

- [ ] **Step 1: Preserve the focused red baseline**

Run:

```bash
npm run test:unit -- tests/unit/utils/index.test.ts
```

Expected: 3 failures:

- `head([1, 2, 3])` returns `[1, 2]` rather than `1`.
- `formatDate(new Date(2024, 4, 10))` returns the wrong calendar value.
- `formatBytes(1024)` returns `1 KB` rather than the established `1 kb` UI contract.

- [ ] **Step 2: Replace the three faulty implementations**

Remove the unused Luxon import:

```ts
import { DateTime } from 'luxon';
```

Replace the helper implementations with:

```ts
export const tail = <T>([_, ...rest]: T[]) => rest;
export const head = <T>([first]: T[]) => first;
```

```ts
export const formatBytes = (bytes: number, decimalPoints = 2) => {
    if (bytes === 0) {
        return '0 Bytes';
    }
    const k = 1024;
    const decimals = decimalPoints < 0 ? 0 : decimalPoints;
    const sizes = ['bytes', 'kb', 'mb', 'gb', 'tb', 'pb', 'eb', 'zb', 'yb'];
    const index = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / k ** index).toFixed(decimals))} ${sizes[index]}`;
};

export const formatDate = (
    date: Date | null | undefined,
    formatStr = 'dd MMM yyyy',
) => {
    if (date === null || date === undefined) {
        return '';
    }
    return format(date, formatStr, { locale: enAU });
};
```

This uses the already-imported date-fns `format` function, preserves custom date-fns format strings such as `yyyy/MM/dd`, and avoids Luxon’s zero-based-month/day-of-week reconstruction bug.

- [ ] **Step 3: Run the focused utility suite**

Run:

```bash
npm run test:unit -- tests/unit/utils/index.test.ts
```

Expected: 25 tests pass.

### Task 2: Align AccountProvider tests with `UserProfileDto`

**Files:**

- Modify: `tests/unit/authentication/AccountProvider.dispatch.test.tsx:7-28,72-74,104-114,129-215,312-354`
- Read only: `ClientApp/src/authentication/AccountProvider.tsx:74-83,154-191`
- Read only: `ClientApp/src/api/web-api-client.ts:1695-1743,4835-4868`

- [ ] **Step 1: Confirm the two stale profile failures**

Run:

```bash
npm run test:unit -- tests/unit/authentication/AccountProvider.dispatch.test.tsx
```

Expected: 2 failures caused by flat profile expectations and an obsolete `mapToUserProfile` mock.

- [ ] **Step 2: Remove the unused `mapToUserProfile` mock**

Delete `mapToUserProfile` from `providerMocks`, delete the `helperFunctions` module mock, and delete this `beforeEach` setup:

```ts
providerMocks.mapToUserProfile.mockReturnValue({
    activeTab: 2,
    currentPage: 3,
    searchText: 'needle',
});
```

`AccountProvider` now stores the API `UserProfileDto` directly; mapping to the dashboard’s local `UserProfile` happens inside the dashboard route.

- [ ] **Step 3: Assert nested account state**

Replace the flat JSON assertion with:

```ts
expect(details).toContain(
    '"userProfile":{"testingCalibrationDashboard":{"filterActiveTab":"2","filterCurrentPage":3,"filterSearchText":"needle","filterSortOrder":"1","filterStatusType":"4","filterYearType":"2026","filtersChanged":true}}',
);
```

- [ ] **Step 4: Assert the complete generated-client call**

Replace the seven-argument assertion with:

```ts
await waitFor(() => expect(providerMocks.setUserProfileApi).toHaveBeenCalledWith(
    undefined,
    undefined,
    undefined,
    undefined,
    '4',
    '2026',
    '1',
    true,
    3,
    '2',
    'needle',
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
));
```

The first four values are the optional identity/services fields, the next seven are the testing/calibration dashboard, and the final seven are the absent pattern-approval dashboard.

- [ ] **Step 5: Give the minimal-user fixture a valid nested profile**

Replace:

```ts
userProfile: {
    filterSearchText: 'saved',
},
```

with:

```ts
userProfile: {
    testingCalibrationDashboard: {
        filterSearchText: 'saved',
    },
},
```

Replace the obsolete mapper assertion with:

```ts
expect(details).toContain(
    '"userProfile":{"testingCalibrationDashboard":{"filterSearchText":"saved"}}',
);
```

- [ ] **Step 6: Run the focused provider suite**

Run:

```bash
npm run test:unit -- tests/unit/authentication/AccountProvider.dispatch.test.tsx
```

Expected: 10 tests pass.

### Task 3: Align dashboard and filter persistence tests

**Files:**

- Modify: `tests/unit/components/searchFilter.behavior.test.tsx:75-143,246-276`
- Modify: `tests/unit/routes/dashboard.test.tsx:467-517,606-616,671-696,813-826`
- Read only: `ClientApp/src/components/SearchFilter/index.tsx:18-35`
- Read only: `ClientApp/src/components/SearchFilter/filterMenu.tsx:77-89,162-184`
- Read only: `ClientApp/src/routes/dashboard/index.tsx:289-356,375-385`

- [ ] **Step 1: Confirm the ten persistence/parameter failures**

Run:

```bash
npm run test:unit -- tests/unit/components/searchFilter.behavior.test.tsx tests/unit/routes/dashboard.test.tsx
```

Expected: 10 failures: three filter tests and seven dashboard tests.

- [ ] **Step 2: Wrap SearchFilter persistence expectations**

In all three failing search/filter cases, keep `setInitialFilters` assertions flat because that is local component state, but wrap only the account-dispatch expectation:

```ts
expect(accountDispatchMock.setUserProfile).toHaveBeenCalledWith({
    testingCalibrationDashboard: expectedProfile,
});
```

For the search-submit case, use:

```ts
expect(accountDispatchMock.setUserProfile).toHaveBeenCalledWith({
    testingCalibrationDashboard: {
        filterYearType: 'allYears',
        filterStatusType: 'allStatuses',
        filtersChanged: false,
        filterCurrentPage: 1,
        filterActiveTab: DashboardTab.Requests,
        filterSearchText: 'caliper',
    },
});
```

- [ ] **Step 3: Wrap dashboard persistence expectations**

For paging, tab changes, returning to drafts, and branch resets, replace flat matchers with:

```ts
expect(mockSetUserProfile).toHaveBeenCalledWith({
    testingCalibrationDashboard: expect.objectContaining({
        filterCurrentPage: 2,
        filterActiveTab: 'drafts',
    }),
});
```

Use the same wrapper for each case and retain that test’s existing expected page/tab values.

- [ ] **Step 4: Assert the API filter types actually passed by Dashboard**

Replace:

```ts
expect(mockGetDrafts.mock.calls.at(-1)?.[1]).toBe(2025);
```

with:

```ts
expect(mockGetDrafts.mock.calls.at(-1)?.[1]).toBe('2025');
```

Replace:

```ts
expect(mockGetDrafts.mock.calls.at(-1)?.[1]).toBeNaN();
```

with:

```ts
expect(mockGetDrafts.mock.calls.at(-1)?.[1]).toBeUndefined();
```

The generated API accepts `filterYearType` as a string; the default/no-filter representation is `undefined`, not `NaN`.

- [ ] **Step 5: Run both focused suites**

Run:

```bash
npm run test:unit -- tests/unit/components/searchFilter.behavior.test.tsx tests/unit/routes/dashboard.test.tsx
```

Expected: 41 tests pass across the two files.

### Task 4: Restore AutoSuggest clear-selection behavior

**Files:**

- Modify: `ClientApp/src/components/Inputs/AutoSuggest/index.tsx:24-62`
- Test: `tests/unit/components/inputs/complexInputs.behavior.test.tsx:656-698`

- [ ] **Step 1: Preserve the failing clear-selection assertion**

Run:

```bash
npm run test:unit -- tests/unit/components/inputs/complexInputs.behavior.test.tsx -t "handles short, empty, and no-result"
```

Expected: failure because `onSelectedOption()` is never called after clearing the input.

- [ ] **Step 2: Move the empty-input callback before the short-query return**

Replace the current short-query block and unreachable empty-query block with:

```ts
if (term.length === 0) {
    await onSelectedOption();
}

if (term.length <= 2) {
    setOptions([]);
    setIsLoading(false);
    return;
}
```

Delete the later unreachable block:

```ts
if (term.length === 0) {
    onSelectedOption();
}
```

- [ ] **Step 3: Run the focused clear-selection test**

Run:

```bash
npm run test:unit -- tests/unit/components/inputs/complexInputs.behavior.test.tsx -t "handles short, empty, and no-result"
```

Expected: the test passes, `getOptions` remains uncalled for fewer than three characters, and empty input clears the selected value.

### Task 5: Align AutoSuggest tests with React Aria combobox semantics

**Files:**

- Modify: `tests/unit/components/inputs/complexInputs.behavior.test.tsx:9-13,194-407,467-621,700-727`
- Modify: `tests/unit/components/inputs/combobox.accessibility.test.tsx:13-49`
- Modify: `tests/unit/components/inputs/residualBranches.test.tsx:185-205`
- Read only: `ClientApp/src/components/Inputs/AutoSuggest/AutoSuggestContainer.tsx`
- Read only: `ClientApp/src/components/Inputs/AutoSuggest/AutoSuggestOptions.tsx`
- Read only: `ClientApp/src/components/Inputs/AutoSuggest/AutoSuggestOption.tsx`

- [ ] **Step 1: Change suggestion queries from `button` to `option`**

In AddressLookup and AutoSuggest result assertions, replace result-specific queries such as:

```ts
await screen.findByRole('button', { name: /1 National Circuit/i });
```

with:

```ts
await screen.findByRole('option', { name: /1 National Circuit/i });
```

Apply the same role change to:

- `No matches found`
- `The address lookup service is currently unavailable`
- `Calibration services`

Keep real controls such as “Enter it manually” and “Outside target” as `button` queries.

For the missing-fields case, replace `findAllByRole('button')` with:

```ts
const [option] = await screen.findAllByRole('option');
await user.click(option);
```

This prevents the test from accidentally clicking the unrelated “Enter it manually” button.

- [ ] **Step 2: Assert popup closure with option queries**

Replace:

```ts
expect(screen.queryByRole('button', { name: /Calibration services/ })).not.toBeInTheDocument();
```

with:

```ts
expect(screen.queryByRole('option', { name: /Calibration services/ })).not.toBeInTheDocument();
```

- [ ] **Step 3: Update keyboard navigation for React Aria’s clamped focus**

React Aria generates active-descendant IDs from the listbox and item IDs and clamps at the first/last option instead of wrapping. Update the assertions to:

```ts
await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
expect(combobox).toHaveAttribute(
    'aria-activedescendant',
    'suburb-options-option-last',
);

await user.keyboard('{ArrowUp}');
expect(combobox).toHaveAttribute(
    'aria-activedescendant',
    'suburb-options-option-first',
);

await user.keyboard('{ArrowUp}');
expect(combobox).toHaveAttribute(
    'aria-activedescendant',
    'suburb-options-option-first',
);
```

Retain the Tab assertion that commits the currently focused first option.

- [ ] **Step 4: Separate popup dismissal from application cancellation**

Rename `cancels AutoSuggestContainer with Enter when inactive and with an outside click` to `dismisses AutoSuggestContainer without invoking Escape cancellation`.

Replace the callback-count expectations with:

```ts
await user.keyboard('{Enter}');
expect(onCancel).not.toHaveBeenCalled();

await user.click(screen.getByRole('button', { name: 'Outside target' }));
expect(onCancel).not.toHaveBeenCalled();
expect(combobox).toHaveAttribute('aria-expanded', 'false');
```

Escape remains covered separately and is the only key wired to the application’s `onCancel` callback.

- [ ] **Step 5: Render an option inside its required collection**

Replace the direct `AutoSuggestOption` import with:

```ts
import AutoSuggestOptions from '@/components/Inputs/AutoSuggest/AutoSuggestOptions';
```

Replace the direct `<ul><AutoSuggestOption /></ul>` render with:

```tsx
render(
    <AutoSuggestOptions
        name='Options'
        options={[{
            id: 'option-1',
            displayText: 'Approved option',
            value: { code: 'approved' },
        }]}
        selectedOptionId='option-1'
        onOptionClick={onClick}
    />,
);
```

Assert the React Aria option:

```ts
const option = screen.getByRole('option', { name: /Approved option/ });
expect(option).toHaveClass('highlighted');
await user.click(option);
```

Keep the existing payload assertion. This avoids the runtime error “ListBoxItem cannot be rendered outside a collection.”

- [ ] **Step 6: Open the combobox before asserting popup semantics**

In `combobox.accessibility.test.tsx`, create a user instance and open/focus the popup before checking expanded state:

```ts
const user = userEvent.setup();
const combobox = screen.getByRole('combobox', { name: 'Suburb' });

expect(combobox).toHaveAttribute('aria-expanded', 'false');
await user.click(combobox);
await user.keyboard('{ArrowDown}');

await waitFor(() => {
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
});
expect(combobox).toHaveAttribute('aria-controls', 'suburb-options');
expect(screen.getByRole('listbox', { name: 'suburb' })).toHaveClass('suggestion-options');
expect(screen.getAllByRole('option')).toHaveLength(2);
expect(combobox).toHaveAttribute(
    'aria-activedescendant',
    'suburb-options-option-suburb-option-sydney',
);
expect(screen.getByRole('option', { name: /Sydney NSW \(1 of 2\)/ }))
    .toHaveClass('highlighted');
```

Rename the test from “button suggestions” to “listbox options.”

- [ ] **Step 7: Assert ArrowUp focuses the available React Aria option**

In `residualBranches.test.tsx`, replace the “unset” expectation with:

```ts
expect(input).toHaveAttribute(
    'aria-activedescendant',
    'suburb-options-option-one',
);
```

Rename the test to `focuses the first AutoSuggest option when ArrowUp opens the popup`.

- [ ] **Step 8: Run all AutoSuggest/AddressLookup suites**

Run:

```bash
npm run test:unit -- tests/unit/components/inputs/complexInputs.behavior.test.tsx tests/unit/components/inputs/combobox.accessibility.test.tsx tests/unit/components/inputs/residualBranches.test.tsx
```

Expected: 48 tests pass across the three files.

### Task 6: Align shared UI tests and fix the Welcome accessible name

**Files:**

- Modify: `ClientApp/src/components/Welcome/index.tsx:12-16`
- Modify: `tests/unit/components/simpleRuntimeComponents.test.tsx:182-197,260-297,331-342`
- Modify: `tests/unit/components/headerFooterChrome.test.tsx:183-191`
- Modify: `tests/unit/routes/staticPages.test.tsx:16-67,105-122`
- Read only: `ClientApp/src/components/Breadcrumb/index.tsx`
- Read only: `ClientApp/src/components/Buttons/LinkButton/index.tsx`
- Read only: `ClientApp/src/routes/services-we-offer/index.tsx`

- [ ] **Step 1: Confirm the six shared-UI failures**

Run:

```bash
npm run test:unit -- tests/unit/components/simpleRuntimeComponents.test.tsx tests/unit/components/headerFooterChrome.test.tsx tests/unit/routes/staticPages.test.tsx
```

Expected: 6 failures.

- [ ] **Step 2: Preserve a spoken space in the Welcome heading**

Change:

```tsx
<span className='d-block'>Welcome</span>
```

to:

```tsx
<span className='d-block'>Welcome </span>
```

The visual block layout is unchanged, while the computed accessible name changes from `WelcomeAlex` to `Welcome Alex`. Keep the existing unit-test assertion.

- [ ] **Step 3: Assert breadcrumb classes on the owning elements**

Replace:

```ts
expect(screen.getByLabelText('Request trail')).toHaveClass('custom-breadcrumb', 'mt-3');
```

with:

```ts
const navigation = screen.getByRole('navigation', { name: 'Request trail' });
expect(navigation).toHaveClass('mt-3');
expect(navigation.querySelector('.custom-breadcrumb')).toBeInTheDocument();
```

`containerClassName` belongs to the `nav`; `custom-breadcrumb` belongs to the nested React Aria breadcrumbs collection.

- [ ] **Step 4: Assert LinkButton as a styled link**

For both external and internal `LinkButton` cases:

- query `role="link"`, not `role="button"`
- assert `btn-*` classes directly on the link
- remove `.querySelector('button')`

The resulting core assertions are:

```ts
const externalButtonLink = screen.getByRole('link', { name: 'NMI website' });
expect(externalButtonLink).toHaveAttribute('href', 'https://measurement.gov.au');
expect(externalButtonLink).toHaveAttribute('target', '_blank');
expect(externalButtonLink).toHaveClass('btn-nmi-primary');
```

```ts
const internalLink = screen.getByRole('link', { name: 'Dashboard' });
expect(internalLink).toHaveAttribute('href', '/dashboard');
expect(internalLink).toHaveClass('btn-secondary', 'dashboard-button');
```

```ts
expect(screen.getByRole('link', { name: 'Help' })).toHaveClass('btn-nmi-primary');
```

- [ ] **Step 5: Query footer/help actions using their native roles**

In `headerFooterChrome.test.tsx`, replace the Help guide button query with:

```ts
expect(screen.getByRole('link', { name: 'Help guide' }))
    .toHaveAttribute('href', '/help-guide');
```

In `staticPages.test.tsx`, replace the SignoutHelper Exit portal button query with:

```ts
expect(screen.getByRole('link', { name: 'Exit portal' }))
    .toHaveAttribute('href', 'https://measurement.gov.au');
```

- [ ] **Step 6: Provide the ServicesWeOffer account-hook contract**

Add two hoisted mocks:

```ts
useAccountContext: vi.fn(),
useAccountDispatch: vi.fn(),
```

Mock the account hooks:

```ts
vi.mock('../../../ClientApp/src/authentication/hooks', () => ({
    default: mocks.useAccountContext,
    useAccountDispatch: mocks.useAccountDispatch,
}));
```

In `beforeEach`, add:

```ts
mocks.useAccountContext.mockReturnValue({
    details: {
        userProfile: {
            services: [],
        },
    },
});
mocks.useAccountDispatch.mockReturnValue({
    setUserProfile: vi.fn(),
});
```

Also add `accounts: []` to the default `useMsal` return so the services effect has a valid collection and does not start an API request.

- [ ] **Step 7: Assert the current services selector rather than the removed pathway view**

Keep the page heading/title/body-class assertions and replace the stale Testing/calibration and Cancel-link assertions with:

```ts
expect(screen.getByRole('group', {
    name: /Set your default view and\/or add more NMI services/i,
})).toBeInTheDocument();
```

This verifies the selector surface that `ServicesWeOffer` currently renders.

- [ ] **Step 8: Run the shared-UI suites**

Run:

```bash
npm run test:unit -- tests/unit/components/simpleRuntimeComponents.test.tsx tests/unit/components/headerFooterChrome.test.tsx tests/unit/routes/staticPages.test.tsx
```

Expected: 48 tests pass across the three files.

### Task 7: Test the generated API client without editing it

**Files:**

- Modify: `tests/unit/api/authorizedApiBase.test.ts:15-56`
- Read only: `ClientApp/src/api/web-api-client.ts:7-31`

- [ ] **Step 1: Confirm the generated-client lifecycle mismatch**

Run:

```bash
npm run test:unit -- tests/unit/api/authorizedApiBase.test.ts
```

Expected: the second request from the same client still uses `11111111111` because `targetOrganisation` is captured when the client instance is constructed.

- [ ] **Step 2: Rewrite the first test around instance caching**

Rename the test to `captures TargetOrganisationAbn when each client is constructed`.

After changing session storage to `22222222222`, assert that the existing client still sends `11111111111`, then construct a new client and assert that it sends `22222222222`:

```ts
const cachedOptions = await client.exposeTransformOptions({
    headers: { Existing: 'header' },
});
expect(cachedOptions.headers.TargetOrganisationAbn).toBe('11111111111');

const refreshedClient = new TestClient();
refreshedClient.setAuthToken('test-token');
const refreshedOptions = await refreshedClient.exposeTransformOptions({
    headers: { Existing: 'header' },
});
expect(refreshedOptions.headers.TargetOrganisationAbn).toBe('22222222222');
```

- [ ] **Step 3: Make the malformed-storage test name accurate**

Rename the second test to `does not parse later sessionStorage changes when the client captured no target organisation`.

Keep client construction before writing malformed JSON and retain the current expected headers. This documents why malformed later storage is not parsed by that instance without claiming the generated client performs defensive JSON parsing.

- [ ] **Step 4: Run the focused generated-client test**

Run:

```bash
npm run test:unit -- tests/unit/api/authorizedApiBase.test.ts
```

Expected: 2 tests pass.

### Task 8: Reconcile the route coverage manifest

**Files:**

- Modify: `tests/e2e/route-coverage.ts:20-54`
- Test: `tests/unit/e2e/routeCoverage.test.ts`
- Read only: `ClientApp/src/App.tsx`

- [ ] **Step 1: Confirm the exact manifest drift**

Run:

```bash
npm run test:unit -- tests/unit/e2e/routeCoverage.test.ts
```

Expected: 35 registered entries versus 41 declared routes.

- [ ] **Step 2: Correct the account route wildcard**

Replace:

```ts
{ path: '/update-organisation/:id', status: 'app-bdd', feature: 'tests/e2e/features/account/manage-account.feature', scenario: 'User updates organisation details' },
```

with:

```ts
{ path: '/update-organisation/:id/*', status: 'app-bdd', feature: 'tests/e2e/features/account/manage-account.feature', scenario: 'User updates organisation details' },
```

- [ ] **Step 3: Register the pattern/type approval routes honestly**

Add these entries adjacent to the dashboard and RFQ route families:

```ts
{ path: '/dashboard-ta', status: 'excluded', reason: 'Pattern/type approval requires authenticated backend data and has no deterministic Playwright fixture contract in this source-map snapshot.' },
{ path: '/ta/type-approval-create-pre', status: 'excluded', reason: 'Pattern/type approval requires authenticated backend data and has no deterministic Playwright fixture contract in this source-map snapshot.' },
{ path: '/ta/:id/*', status: 'excluded', reason: 'Pattern/type approval requires authenticated backend data and has no deterministic Playwright fixture contract in this source-map snapshot.' },
{ path: '/ta/type-approval-create', status: 'excluded', reason: 'Pattern/type approval requires authenticated backend data and has no deterministic Playwright fixture contract in this source-map snapshot.' },
{ path: '/ta/type-approval-success/:id/*', status: 'excluded', reason: 'Pattern/type approval requires authenticated backend data and has no deterministic Playwright fixture contract in this source-map snapshot.' },
{ path: '/ta/:id/manage', status: 'excluded', reason: 'Pattern/type approval requires authenticated backend data and has no deterministic Playwright fixture contract in this source-map snapshot.' },
```

These exclusions make the absence of deterministic E2E coverage visible; they do not falsely point to unrelated RFQ scenarios.

- [ ] **Step 4: Run the route manifest unit test**

Run:

```bash
npm run test:unit -- tests/unit/e2e/routeCoverage.test.ts
```

Expected: 3 tests pass, with 41 unique manifest paths matching the 41 routes in `App.tsx`.

### Task 9: Refresh Storybook inventories and drift assertions

**Files:**

- Modify: `ClientApp/src/routes/RouteInventory.docs.mdx`
- Modify: `ClientApp/src/components/ComponentInventory.docs.mdx`
- Modify: `ClientApp/src/storybook/CoverageMatrix.docs.mdx`
- Modify: `tests/unit/storybookMigrationInventory.test.ts:40-66`
- Modify: `tests/unit/storybook/coverageDrift.test.ts:37-42`

- [ ] **Step 1: Confirm the four Storybook inventory failures**

Run:

```bash
npm run test:unit -- tests/unit/storybookMigrationInventory.test.ts tests/unit/storybook/coverageDrift.test.ts
```

Expected: 4 failures covering JSX route-row recognition, `Progress`, `SlateEditor`, and the JSX phase-status row.

- [ ] **Step 2: Add all new routes to `RouteInventory.docs.mdx`**

Add these `DocsTable` rows:

```tsx
['`/dashboard-ta`', '`AuthenticatedElement`', 'Yes'],
['`/ta/type-approval-create-pre`', '`AuthenticatedElement`', 'Yes'],
['`/ta/:id/*`', '`AuthenticatedElement`', 'No'],
['`/ta/type-approval-create`', '`AuthenticatedElement`', 'Yes'],
['`/ta/type-approval-success/:id/*`', '`AuthenticatedElement`', 'No'],
['`/ta/:id/manage`', '`AuthenticatedElement`', 'Yes'],
```

Add the route-family row:

```tsx
['`ta`', 'Pattern/type approval pre-application, wizard, success, dashboard, and management surfaces'],
```

- [ ] **Step 3: Teach the route inventory test about JSX rows**

Replace the Markdown-table-only lookup with:

```ts
const inDoc =
    routeDoc.includes(`['\`${routePath}\`',`) ||
    routeDoc.includes(`['\`${routePath}/*\`',`);
```

This matches the checked-in `DocsTable rows={[...]}` representation without forcing the documentation back to a Markdown table.

- [ ] **Step 4: Register `Progress` and `SlateEditor` in the component inventory**

Add these rows to `ComponentInventory.docs.mdx`:

```md
| `Progress` | Upload progress bars and file-transfer status |
| `SlateEditor` | Rich-text editing surface |
```

- [ ] **Step 5: Refresh the Coverage Matrix baseline**

Update the current counts to:

```tsx
['Route paths in `ClientApp/src/App.tsx`', '`41`'],
['Route families under `ClientApp/src/routes`', '`15`'],
['Top-level component families under `ClientApp/src/components`', '`31`'],
['Story files under `ClientApp/src`', '`55`'],
['MDX docs pages under `ClientApp/src`', '`10`'],
['Route-level interactive stories', '`15`'],
```

- [ ] **Step 6: Register the new route and component families in Coverage Matrix**

Add a route row that records the current explicit-exclusion state:

```tsx
['Pattern/type approval (`ta`)', '`/dashboard-ta`, `/ta/type-approval-create-pre`, `/ta/type-approval-create`, `/ta/:id/*`, `/ta/type-approval-success/:id/*`, `/ta/:id/manage`', 'No deterministic Storybook-BDD or app-BDD fixture contract in this snapshot', 'Explicitly excluded in `tests/e2e/route-coverage.ts`; add dedicated fixtures before claiming workflow coverage'],
```

Add an explicit route-family exclusion:

```tsx
['`ta`', 'Authenticated pattern/type approval workflows depend on backend data and do not have a deterministic local fixture contract in this source-map snapshot'],
```

Add component rows:

```tsx
['`Progress`', 'Upload progress bars and file-transfer status', '`Docs only`', 'Add interactive transfer-state stories when upload work resumes'],
['`SlateEditor`', 'Rich-text editing surface', '`Docs only`', 'Add editor interaction stories before migrating rich-text authoring'],
```

- [ ] **Step 7: Match the JSX phase row exactly**

Replace:

```ts
expect(coverageDoc).toMatch(/Phase 4[^|]+\|\s*Complete/);
```

with:

```ts
expect(coverageDoc).toContain("['Phase 4: Closure', 'Complete'");
```

- [ ] **Step 8: Run the inventory suites**

Run:

```bash
npm run test:unit -- tests/unit/storybookMigrationInventory.test.ts tests/unit/storybook/coverageDrift.test.ts
```

Expected: 11 tests pass across the two files.

### Task 10: Run staged and repository-wide validation

**Files:**

- Verify all files listed above.

- [ ] **Step 1: Run all previously failing files together**

Run:

```bash
npm run test:unit -- tests/unit/components/inputs/complexInputs.behavior.test.tsx tests/unit/routes/dashboard.test.tsx tests/unit/components/searchFilter.behavior.test.tsx tests/unit/authentication/AccountProvider.dispatch.test.tsx tests/unit/components/headerFooterChrome.test.tsx tests/unit/components/inputs/combobox.accessibility.test.tsx tests/unit/components/simpleRuntimeComponents.test.tsx tests/unit/routes/staticPages.test.tsx tests/unit/components/inputs/residualBranches.test.tsx tests/unit/utils/index.test.ts tests/unit/e2e/routeCoverage.test.ts tests/unit/storybookMigrationInventory.test.ts tests/unit/api/authorizedApiBase.test.ts tests/unit/storybook/coverageDrift.test.ts
```

Expected: all 188 tests in the 14 previously failing files pass. If the exact count changes because a test was renamed but not added or removed, confirm there are still zero failures.

- [ ] **Step 2: Run TypeScript validation**

Run:

```bash
npm run type-check
```

Expected: exit code 0 with no TypeScript errors.

- [ ] **Step 3: Run ESLint**

Run:

```bash
npm run lint
```

Expected: exit code 0 with no lint errors.

- [ ] **Step 4: Run the full unit suite**

Run:

```bash
npm run test:unit
```

Expected:

```text
Test Files  114 passed (114)
Tests       1168 passed (1168)
```

If implementation adds a regression test rather than only renaming existing tests, the passing test count may increase; zero failures is mandatory.

- [ ] **Step 5: Run Storybook tests through the available repository script**

The workspace-required `your-project-sb-mcp` tools are unavailable in this session and no matching install candidate exists. Use the checked-in fallback:

```bash
npm run test:storybook
```

Expected: all Storybook interaction tests pass.

- [ ] **Step 6: Build Storybook to validate MDX**

Run:

```bash
npm run build-storybook
```

Expected: static Storybook build completes without MDX compilation errors.

- [ ] **Step 7: Review boundary compliance**

Confirm:

- `ClientApp/src/api/web-api-client.ts` is unchanged.
- No files under `ClientApp/source-map-http-downloads`, `ClientApp/src/external`, or `ClientApp/webpack` changed.
- No test assertion was weakened to a generic existence check when an accessible role, payload, or exact contract can be asserted.
- The final unit output reports zero failed files and zero failed tests.
