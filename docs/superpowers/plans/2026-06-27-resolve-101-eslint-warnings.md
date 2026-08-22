# Resolve 101 ESLint Warnings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the current frontend ESLint baseline from 101 warnings to zero without weakening lint rules, adding suppressions, or editing generated/vendor files.

**Architecture:** Treat `npm run lint` as the failing static-analysis test, then remediate warnings in seven independently verifiable slices. Remove dead code and dead prop plumbing where behavior is provably absent; for React hooks, stabilize dependencies with `useCallback`/`useMemo` or complete dependency arrays, and guard the dashboard branch-reset effect against repeated profile writes.

**Tech Stack:** React 18, TypeScript, Formik, React Router v7, MSAL, ESLint 8, `@typescript-eslint`, `eslint-plugin-react-hooks`, Vitest.

---

## Current Baseline

The baseline was captured on 2026-06-27 with `npm run lint`:

| Rule                                         | Warnings |
| -------------------------------------------- | -------: |
| `@typescript-eslint/no-unused-vars`          |       86 |
| `react-hooks/exhaustive-deps`                |        9 |
| `@typescript-eslint/consistent-type-imports` |        3 |
| `no-console`                                 |        2 |
| `@typescript-eslint/no-empty-object-type`    |        1 |
| **Total**                                    |  **101** |

The 101 warnings occur in 28 files. Current validation status:

- `npm run type-check`: passes.
- The three warning-bearing test files plus `tests/unit/routes/staticPages.test.tsx`: 44 tests pass.
- `npm run test:unit`: exceeded the execution harness's 124-second timeout, so the full-suite baseline is not known to be failing or passing.
- The Storybook MCP required by the workspace instructions was searched for but is not installed/callable in this session. Use the checked-in stories plus `npm run test:storybook` and `npm run build-storybook` during implementation.
- This snapshot has no `.git` directory. Commit steps below apply only when executing the plan in a Git-backed copy.

## Constraints

- Do not edit `ClientApp/src/api/web-api-client.ts`, captured bundles, vendor mirrors, `ClientApp/source-map-http-downloads/**`, `ClientApp/src/external/**`, or `ClientApp/webpack/**`.
- Do not add `eslint-disable` comments or change ESLint configuration.
- Preserve runtime configuration access through `ClientApp/src/env.ts`.
- Prefer `globalThis` in newly written global-object access.
- Use the root `package.json` scripts for validation.
- Keep the existing Yup extension imports intact; this plan does not change validation schemas.

## File Map

### Test mock typing

- `tests/unit/components/modals/BranchSelectorModal.test.tsx`: replace inline `import()` typing with a namespace type import.
- `tests/unit/routes/acceptQuote/paymentDetails.test.tsx`: replace inline API-module typing with a namespace type import.
- `tests/unit/routes/acceptQuote/props.test.ts`: replace inline API-module typing with a namespace type import.

### Shared input components

- `ClientApp/src/components/Inputs/Attachment/AttachmentItem-new.tsx`: remove unused Formik context and the unused `canUpload` prop.
- `ClientApp/src/components/Inputs/Attachment/index-new.tsx`: remove unused Formik context and stop passing `canUpload`.
- `ClientApp/src/components/Inputs/CertificateNumberLookup/index.tsx`: complete filtering-effect dependencies and remove the abandoned blur handler.
- `ClientApp/src/components/Inputs/CheckboxGroup/index.tsx`: replace the `{}` generic constraint with TSX-safe unconstrained generic syntax.
- `ClientApp/src/components/Progress/ProgressFileList.tsx`: remove the dead upload-status local.
- `tests/unit/components/inputs/complexInputs.behavior.test.tsx`: add a regression test proving certificate suggestions refresh when Formik options change.

### Pattern-approval list and filter UI

- `ClientApp/src/components/RequestList/paRequestItem.tsx`: remove dead renderers, dead pagination props, and dead ARIA ID locals.
- `ClientApp/src/components/SearchFilter/TypeApproval/paFilterMenu.tsx`: remove dead class plumbing, unused event parameters, and the duplicate unused year renderer.
- `ClientApp/src/components/SearchFilter/TypeApproval/paFilterMenuProps.ts`: remove the unused `className` contract.
- `ClientApp/src/components/SearchFilter/TypeApproval/paSearchFilter.tsx`: remove the commented-out search handler path and its account-dispatch dependency.
- `ClientApp/src/routes/services-we-offer/index.tsx`: remove an obsolete service-card renderer and imports used only by it.
- `ClientApp/src/routes/dashboard/dashboard-ta.tsx`: stop passing the removed request-list pagination props.

### Pattern-approval dashboard

- `ClientApp/src/routes/dashboard/dashboard-ta.tsx`: remove constant-false loading/scroll/search state, console calls, and abandoned branch-link code; stabilize profile saving and branch reset.
- `ClientApp/src/components/SearchFilter/types.ts`: remove the obsolete pattern-approval search placeholder prop.

### Pattern-approval application flow

- `ClientApp/src/routes/ta/applicationAndInstrument.tsx`: remove dead loading state and empty event handler; complete state-sync dependencies.
- `ClientApp/src/routes/ta/index.tsx`: complete navigation and polling callback dependencies; remove an unused caught error.
- `ClientApp/src/routes/ta/instrumentInfoPanel.tsx`: complete MSAL dependencies without a suppression.
- `ClientApp/src/routes/ta/organisationAndContact.tsx`: remove abandoned branch-selection and help-renderer code.

### Pattern-approval summary/helper cleanup

- `ClientApp/src/routes/ta/organisationAndContactProps.ts`: mark callback-contract parameters intentionally unused.
- `ClientApp/src/routes/ta/preApplication.tsx`: remove constant-false loading state.
- `ClientApp/src/routes/ta/summaryAndSubmit.tsx`: remove unused MSAL/account/error state and constant-false spinner code.
- `ClientApp/src/routes/ta/summaryAndSubmitProps.ts`: remove the unused `isComplete` factory argument and mark redirect callback parameters intentionally unused.
- `ClientApp/src/routes/ta/supportingDocuments.tsx`: remove dead HTTP 410 state and allow the existing generic error handling to display the server title.
- `ClientApp/src/routes/ta/supportingDocumentsProps.ts`: mark redirect callback parameters intentionally unused.

### Pattern-approval management screens

- `ClientApp/src/routes/ta/manage/index.tsx`: collapse the wrapper to its only live responsibility.
- `ClientApp/src/routes/ta/manage/appDetails.tsx`: remove unused props/state/renderers, make tab parsing stable, and memoize the data-loader options.
- `ClientApp/src/routes/ta/manage/appDetailsProps.ts`: remove unused account/banner arguments.
- `ClientApp/src/routes/ta/manage/appDocuments.tsx`: remove dead navigation/modal/scroll/form callback plumbing.
- `ClientApp/src/routes/ta/manage/appMessages.tsx`: remove dead navigation/modal/selection/index plumbing.
- `ClientApp/src/routes/ta/types.ts`: remove the no-longer-used `TAApplicationDetailsProps` interface.

## Task 1: Replace Inline Module Type Imports

**Warnings removed:** 3 `@typescript-eslint/consistent-type-imports`

**Files:**

- Modify: `tests/unit/components/modals/BranchSelectorModal.test.tsx`
- Modify: `tests/unit/routes/acceptQuote/paymentDetails.test.tsx`
- Modify: `tests/unit/routes/acceptQuote/props.test.ts`

- [ ] **Step 1: Confirm the targeted lint failures**

Run:

```powershell
npx eslint "tests/unit/components/modals/BranchSelectorModal.test.tsx" "tests/unit/routes/acceptQuote/paymentDetails.test.tsx" "tests/unit/routes/acceptQuote/props.test.ts"
```

Expected: three `@typescript-eslint/consistent-type-imports` warnings.

- [ ] **Step 2: Type the React Router partial mock with a namespace import**

In `tests/unit/components/modals/BranchSelectorModal.test.tsx`, add:

```ts
import type * as ReactRouterModule from "react-router";
```

Change the mock body to:

```ts
vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouterModule>();
  return { ...actual, useNavigate: () => mocks.navigate };
});
```

- [ ] **Step 3: Type the aliased API partial mock with a namespace import**

In `tests/unit/routes/acceptQuote/paymentDetails.test.tsx`, add:

```ts
import type * as WebApiClientModule from "@/api/web-api-client";
```

Change the mock body to:

```ts
vi.mock("@/api/web-api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof WebApiClientModule>();
  return {
    ...actual,
    AcceptQuoteClient: vi.fn(function (this: Record<string, unknown>) {
      this.setAuthToken = vi.fn();
      this.getPaymentDetails = mockGetPaymentDetails;
    }),
  };
});
```

- [ ] **Step 4: Type the relative API partial mock with a namespace import**

In `tests/unit/routes/acceptQuote/props.test.ts`, add:

```ts
import type * as WebApiClientModule from "../../../../ClientApp/src/api/web-api-client";
```

Change the first line of the mock body to:

```ts
vi.mock('../../../../ClientApp/src/api/web-api-client', async (importOriginal) => {
    const actual = await importOriginal<typeof WebApiClientModule>();
```

Keep the existing returned mock members unchanged.

- [ ] **Step 5: Verify the targeted tests and lint**

Run:

```powershell
npx eslint "tests/unit/components/modals/BranchSelectorModal.test.tsx" "tests/unit/routes/acceptQuote/paymentDetails.test.tsx" "tests/unit/routes/acceptQuote/props.test.ts"
npm run test:unit -- tests/unit/components/modals/BranchSelectorModal.test.tsx tests/unit/routes/acceptQuote/paymentDetails.test.tsx tests/unit/routes/acceptQuote/props.test.ts
```

Expected: ESLint prints no problems; all 37 targeted tests pass.

- [ ] **Step 6: Commit in a Git-backed copy**

```powershell
git add tests/unit/components/modals/BranchSelectorModal.test.tsx tests/unit/routes/acceptQuote/paymentDetails.test.tsx tests/unit/routes/acceptQuote/props.test.ts
git commit -m "test: use consistent module type imports"
```

## Task 2: Clean Shared Input Components and Refresh Lookup Dependencies

**Warnings removed:** 9 total: 7 unused bindings, 1 hook dependency warning, and 1 empty-object type warning.

**Files:**

- Modify: `ClientApp/src/components/Inputs/Attachment/AttachmentItem-new.tsx`
- Modify: `ClientApp/src/components/Inputs/Attachment/index-new.tsx`
- Modify: `ClientApp/src/components/Inputs/CertificateNumberLookup/index.tsx`
- Modify: `ClientApp/src/components/Inputs/CheckboxGroup/index.tsx`
- Modify: `ClientApp/src/components/Progress/ProgressFileList.tsx`
- Modify: `tests/unit/components/inputs/complexInputs.behavior.test.tsx`

- [ ] **Step 1: Add a failing certificate-options refresh test**

Add this import to `tests/unit/components/inputs/complexInputs.behavior.test.tsx`:

```ts
import CertificateNumberLookup from "@/components/Inputs/CertificateNumberLookup";
```

Add this test inside `describe('complex input behavior slice', ...)`:

```tsx
it("recomputes CertificateNumberLookup suggestions when Formik options change", async () => {
  vi.useFakeTimers();

  const renderLookup = (
    certNameOptions: Array<{ id: string; lookupName: string }>,
  ) => (
    <FormikHarness
      initialValues={{
        certificateNumber: "",
        certificateNumberId: "",
        certNameOptions,
      }}
    >
      <CertificateNumberLookup
        name="certificateNumber"
        idName="certificateNumberId"
        label="Certificate number"
        optionsFieldName="lookupName"
      />
    </FormikHarness>
  );

  const { rerender } = render(
    renderLookup([{ id: "cert-1", lookupName: "5/6A/91B" }]),
  );

  fireEvent.change(
    screen.getByRole("combobox", { name: "Certificate number" }),
    {
      target: { value: "5/6A" },
    },
  );
  await act(async () => {
    vi.advanceTimersByTime(300);
  });
  expect(
    screen.getByRole("option", { name: /5\/6A\/91B/ }),
  ).toBeInTheDocument();

  rerender(renderLookup([{ id: "cert-2", lookupName: "5/6A/92C" }]));
  await act(async () => {
    vi.advanceTimersByTime(300);
  });

  expect(
    screen.queryByRole("option", { name: /5\/6A\/91B/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("option", { name: /5\/6A\/92C/ }),
  ).toBeInTheDocument();
});
```

Run:

```powershell
npm run test:unit -- tests/unit/components/inputs/complexInputs.behavior.test.tsx
```

Expected before the implementation: the new test fails because changing `certNameOptions` does not rerun the debounced filtering effect.

- [ ] **Step 2: Remove unused attachment Formik context and prop plumbing**

In `ClientApp/src/components/Inputs/Attachment/AttachmentItem-new.tsx`, change the Formik import to:

```ts
import { useField } from "formik";
```

Delete `canUpload` from `AttachmentItemProps`, remove it from the component parameter destructuring, and delete:

```ts
const { errors, touched } = useFormikContext<any>();
```

The component signature must become:

```ts
const AttachmentItemNew = ({
    canRemove, onRemoveItem, cancelButtonId, isSummary, name, index, fileBytes, onCategoryUpdate, id,
}: AttachmentItemProps) => {
```

In `ClientApp/src/components/Inputs/Attachment/index-new.tsx`, change:

```ts
import { useField, useFormikContext } from "formik";
```

to:

```ts
import { useField } from "formik";
```

Delete:

```ts
const { errors: formikErrors, touched } = useFormikContext<any>();
```

Remove this prop from `<AttachmentItemNew>`:

```tsx
canUpload={!isSummary && attachments.length === maxFiles}
```

- [ ] **Step 3: Complete the certificate filtering dependencies**

In `ClientApp/src/components/Inputs/CertificateNumberLookup/index.tsx`, replace:

```ts
}, [inputValue]);
```

with:

```ts
}, [
    _certNumOptions.value,
    _parentField.value,
    inputValue,
    matchType,
    maxResults,
    optionsFieldName,
    parentName,
    parentOptionsName,
]);
```

Delete the unused function:

```ts
const handleBlur = () => {
  setTimeout(() => setShowSuggestions(false), 100);
};
```

Also delete the abandoned JSX comment:

```tsx
// onBlur={handleBlur}
```

- [ ] **Step 4: Replace the `{}` generic constraint with TSX-safe syntax**

In `ClientApp/src/components/Inputs/CheckboxGroup/index.tsx`, change:

```ts
const CheckboxGroup = <T extends {}>(props: CheckboxGroupProps<T> & FieldHookConfig<T>) => {
```

to:

```ts
const CheckboxGroup = <T,>(props: CheckboxGroupProps<T> & FieldHookConfig<T>) => {
```

The trailing comma is required so the TypeScript parser does not interpret `<T>` as JSX.

- [ ] **Step 5: Remove the dead upload-status local**

In `ClientApp/src/components/Progress/ProgressFileList.tsx`, delete:

```ts
const isUploading = f.status === FileStatus.Uploading;
```

Keep `isCancellable`; it is the live status check used by the cancel button.

- [ ] **Step 6: Verify the component slice**

Run:

```powershell
npx eslint "ClientApp/src/components/Inputs/Attachment/AttachmentItem-new.tsx" "ClientApp/src/components/Inputs/Attachment/index-new.tsx" "ClientApp/src/components/Inputs/CertificateNumberLookup/index.tsx" "ClientApp/src/components/Inputs/CheckboxGroup/index.tsx" "ClientApp/src/components/Progress/ProgressFileList.tsx" "tests/unit/components/inputs/complexInputs.behavior.test.tsx"
npm run type-check
npm run test:unit -- tests/unit/components/inputs/complexInputs.behavior.test.tsx
```

Expected: no targeted lint problems, type-check passes, and the complete complex-input test file passes.

- [ ] **Step 7: Commit in a Git-backed copy**

```powershell
git add ClientApp/src/components/Inputs/Attachment/AttachmentItem-new.tsx ClientApp/src/components/Inputs/Attachment/index-new.tsx ClientApp/src/components/Inputs/CertificateNumberLookup/index.tsx ClientApp/src/components/Inputs/CheckboxGroup/index.tsx ClientApp/src/components/Progress/ProgressFileList.tsx tests/unit/components/inputs/complexInputs.behavior.test.tsx
git commit -m "refactor: clean shared input component warnings"
```

## Task 3: Remove Obsolete Pattern-Approval List, Filter, and Service UI

**Warnings removed:** 16 `@typescript-eslint/no-unused-vars`

**Files:**

- Modify: `ClientApp/src/components/RequestList/paRequestItem.tsx`
- Modify: `ClientApp/src/components/SearchFilter/TypeApproval/paFilterMenu.tsx`
- Modify: `ClientApp/src/components/SearchFilter/TypeApproval/paFilterMenuProps.ts`
- Modify: `ClientApp/src/components/SearchFilter/TypeApproval/paSearchFilter.tsx`
- Modify: `ClientApp/src/routes/dashboard/dashboard-ta.tsx`
- Modify: `ClientApp/src/routes/services-we-offer/index.tsx`

- [ ] **Step 1: Remove dead pattern-approval request renderers**

In `ClientApp/src/components/RequestList/paRequestItem.tsx`, remove `RequestForQuoteDto` from the API import and remove:

```ts
import ContactDetails from "../Utilities/contactDetails";
```

Delete these three declarations in full:

```ts
const DateColumn = (props: { date: Date | string | undefined }) => {
```

```ts
const renderMultiLinkTooltip = (refIds: string[], isClonedFromRef: string): React.ReactNode => (
```

```ts
const renderRequestContent = (requestForQuote: RequestForQuoteDto, sourceReferenceId: string | undefined) => {
```

The next surviving declaration after those deletions must be the `PaRequestItemProps` interface below.

- [ ] **Step 2: Narrow the request-item prop contract**

Replace the inline prop type and destructuring in `paRequestItem.tsx` with:

```ts
interface PaRequestItemProps {
    request: PatternApprovalDashboardDetailsDto;
    tab: DashboardTab;
    setDeleteSuccess: (success: boolean) => void;
}

const PaRequestItem = ({
    request,
    tab,
    setDeleteSuccess,
}: PaRequestItemProps) => {
```

Delete these dead ARIA ID locals:

```ts
const cardDetailsId = `card-details-${portalReferenceId}`;
const cardTabContentId = `card-tab-content-${portalReferenceId}`;
```

Keep `cardSummaryId` and simplify `labelledBy` to:

```ts
const labelledBy = isFocused ? "" : cardSummaryId;
```

In `ClientApp/src/routes/dashboard/dashboard-ta.tsx`, remove these four props from `<PaRequestItem>`:

```tsx
page={initialFilters?.filterCurrentPage ?? 1}
currentPage={currentPage}
pageSize={DEFAULT_DASHBOARD_PAGESIZE}
totalCount={totalCount}
```

- [ ] **Step 3: Simplify the filter-menu handlers and remove the duplicate renderer**

In `ClientApp/src/components/SearchFilter/TypeApproval/paFilterMenu.tsx`, remove `className` from the props destructuring.

Replace the handlers with:

```ts
function handleClose(): void {
  setShow(false);
}

function handleResetFilters(): void {
  setCurrentPage(1);
  const profile = {
    filterYearType: defaultFilter.filterYearType,
    filterStatusType: defaultFilter.filterStatusType,
    filtersChanged: defaultFilter.filtersChanged,
    filterCurrentPage: 1,
    filterActiveTab: initialFilters?.filterActiveTab,
    filterSearchText: initialFilters?.filterSearchText,
  };
  setInitialFilters(profile);
  accountDispatch?.setUserProfile({ patternApprovalDashboard: profile });
  setShow(false);
}
```

Delete the unused `filterByYear` function in full. Keep `filterYear`, because the live Formik renderer uses it.

Replace all three calls:

```ts
handleClose(e);
```

with:

```ts
handleClose();
```

For the close, cancel, and apply buttons, also change the enclosing callback from:

```tsx
onClick={(e) => {
```

to:

```tsx
onClick={() => {
```

Replace:

```ts
handleResetFilters(e);
```

with:

```ts
handleResetFilters();
```

The reset callback must become:

```tsx
onClick={() => {
    trackGAEvent('ResetFilter');
    handleResetFilters();
    resetForm({ values: defaultFilter });
}}
```

In `ClientApp/src/components/SearchFilter/TypeApproval/paFilterMenuProps.ts`, remove:

```ts
className?: string;
```

- [ ] **Step 4: Remove the commented-out pattern-approval search path**

In `ClientApp/src/components/SearchFilter/TypeApproval/paSearchFilter.tsx`, remove:

```ts
import { useAccountDispatch } from "../../../authentication/hooks";
```

Remove `placeholder` from the destructuring, delete `accountDispatch`, and delete the complete `handleSearchSubmit` function.

Delete the commented `<SearchBox>` JSX block. The live return body should contain only:

```tsx
<Col className="d-flex justify-content-end">
  <PaFilterMenu
    setCurrentPage={setCurrentPage}
    initialFilters={initialFilters}
    setInitialFilters={setInitialFilters}
  />
</Col>
```

Keep the optional `placeholder` type temporarily; Task 4 removes the dashboard state and contract together.

- [ ] **Step 5: Remove the obsolete services-card renderer**

In `ClientApp/src/routes/services-we-offer/index.tsx`:

- change the MSAL import to `import { useMsal } from '@azure/msal-react';`
- change the React Router import to `import { useNavigate, useSearchParams } from 'react-router';`
- remove the `StandardPathway` and `HeaderIntroText` imports
- delete `const isAuthenticated = useIsAuthenticated();`

Delete the full function beginning with:

```ts
const renderServices = () => (
```

and ending immediately before:

```ts
const renderServicesSelector = () => (
```

Do not change `renderServicesSelector`; it is the live service-selection UI.

- [ ] **Step 6: Verify the list/filter/service slice**

Run:

```powershell
npx eslint "ClientApp/src/components/RequestList/paRequestItem.tsx" "ClientApp/src/components/SearchFilter/TypeApproval/paFilterMenu.tsx" "ClientApp/src/components/SearchFilter/TypeApproval/paFilterMenuProps.ts" "ClientApp/src/components/SearchFilter/TypeApproval/paSearchFilter.tsx" "ClientApp/src/routes/dashboard/dashboard-ta.tsx" "ClientApp/src/routes/services-we-offer/index.tsx"
npm run type-check
npm run test:unit -- tests/unit/routes/staticPages.test.tsx
```

Expected: the targeted warning count is seven, all remaining in `dashboard-ta.tsx`; type-check passes; the static-page tests pass.

- [ ] **Step 7: Commit in a Git-backed copy**

```powershell
git add ClientApp/src/components/RequestList/paRequestItem.tsx ClientApp/src/components/SearchFilter/TypeApproval/paFilterMenu.tsx ClientApp/src/components/SearchFilter/TypeApproval/paFilterMenuProps.ts ClientApp/src/components/SearchFilter/TypeApproval/paSearchFilter.tsx ClientApp/src/routes/dashboard/dashboard-ta.tsx ClientApp/src/routes/services-we-offer/index.tsx
git commit -m "refactor: remove obsolete pattern approval list and filter code"
```

## Task 4: Stabilize the Pattern-Approval Dashboard

**Warnings removed:** 7 total: 4 unused bindings, 2 console calls, and 1 hook dependency warning.

**Files:**

- Modify: `ClientApp/src/routes/dashboard/dashboard-ta.tsx`
- Modify: `ClientApp/src/components/SearchFilter/types.ts`

- [ ] **Step 1: Confirm the dashboard-only lint failures**

Run:

```powershell
npx eslint "ClientApp/src/routes/dashboard/dashboard-ta.tsx"
```

Expected: seven warnings.

- [ ] **Step 2: Remove state and handlers that can never change behavior**

Change the React import to:

```ts
import { useCallback, useEffect, useRef, useState } from "react";
```

Delete:

```ts
const DEFAULT_SEARCH_PLACEHOLDER = "Search by manufacturer, model, serial...";
```

Remove these state declarations:

```ts
const [isLoading, setIsLoading] = useState(false);
const [scrollToTop, setScrollToTop] = useState(false);
const [searchPlaceholder, setSearchPlaceholder] = useState(
  DEFAULT_SEARCH_PLACEHOLDER,
);
```

Delete the full `handleAlertScroll`, `onShowBranchSelectorClick`, and `changePlaceholderForSearchBox` functions.

Delete the commented `<Link data-testid='open-manage-branch-division-button'>` block that referenced `onShowBranchSelectorClick`.

Remove `aria-busy={isLoading}` from the welcome wrapper and organisation `<Col>`. Keep their existing `aria-live` attributes.

Delete the commented full-page `isLoading` spinner block above the welcome wrapper.

- [ ] **Step 3: Stabilize profile saving and remove the empty success callback**

Replace `saveUserProfile` with:

```ts
const saveUserProfile = useCallback(
  (userProfile: PatternApprovalDashboardDto) => {
    const profile = {
      filterYearType: userProfile.filterYearType,
      filterStatusType: userProfile.filterStatusType,
      filtersChanged: userProfile.filtersChanged,
      filterSortOrder: userProfile.filterSortOrder,
      filterCurrentPage: userProfile.filterCurrentPage,
      filterActiveTab: userProfile.filterActiveTab,
      filterSearchText: userProfile.filterSearchText,
    };
    accountDispatch
      ?.setUserProfile({ patternApprovalDashboard: profile })
      .catch((error) => {
        AppLogger.error(
          "T & C Dashboard failed to save user profile.",
          error as Error,
        );
      });
  },
  [accountDispatch],
);
```

This removes the empty `.then((success) => {})` callback and gives the branch-reset effect a stable dependency.

- [ ] **Step 4: Remove development console output**

Delete:

```ts
console.log(`Changing to tab in changeTab method ${tab}`);
```

Delete:

```ts
console.log(
  `Changing to tab in useEffect branch check method ${profile.filterActiveTab!}`,
);
```

- [ ] **Step 5: Guard the complete branch-reset dependency set**

After `tabSaveTimeoutRef`, add:

```ts
const lastBranchResetOrganisationIdRef = useRef<number>();
```

Before the branch-reset effect, add:

```ts
const savedUserProfile = accountDetails?.userProfile;
const branchSelectionModalMode = accountDetails?.branchSelectionModalMode;
const defaultOrganisationId = accountDetails?.defaultOrganisationId;
```

Replace the branch-reset effect with:

```ts
useEffect(() => {
  if (
    savedUserProfile &&
    branchSelectionModalMode === BranchSelectionModalMode.SelectAndEditOrg &&
    defaultOrganisationId !== undefined &&
    lastBranchResetOrganisationIdRef.current !== defaultOrganisationId
  ) {
    lastBranchResetOrganisationIdRef.current = defaultOrganisationId;
    const profile = {
      filterYearType: savedUserProfile.patternApprovalDashboard?.filterYearType,
      filterStatusType:
        savedUserProfile.patternApprovalDashboard?.filterStatusType,
      filtersChanged: savedUserProfile.patternApprovalDashboard?.filtersChanged,
      filterSortOrder:
        savedUserProfile.patternApprovalDashboard?.filterSortOrder,
      filterCurrentPage: defaultFilter.filterCurrentPage,
      filterActiveTab: savedUserProfile.patternApprovalDashboard
        ?.filterActiveTab as DashboardTab,
      filterSearchText:
        savedUserProfile.patternApprovalDashboard?.filterSearchText,
    };

    setActiveTab(profile.filterActiveTab);
    setCurrentPage(profile.filterCurrentPage);
    saveUserProfile(profile);
    setInitialFilters(profile);
  }
}, [
  branchSelectionModalMode,
  defaultOrganisationId,
  savedUserProfile,
  saveUserProfile,
]);
```

The ref guard is required because `saveUserProfile` updates `savedUserProfile`; without it, adding the complete dependency set can repeatedly persist the same profile.

- [ ] **Step 6: Remove dead scroll and search-placeholder plumbing**

From the data-loading effect, delete:

```ts
if (scrollToTop) {
  handleAlertScroll();
}
```

Remove `scrollToTop` from that effect's dependency array. Keep the pre-existing suppression for that separate data-loading effect unchanged; this task must not add another suppression.

Remove:

```tsx
placeholder = { searchPlaceholder };
```

from `<PaSearchFilter>`.

In `ClientApp/src/components/SearchFilter/types.ts`, remove:

```ts
placeholder?: string;
```

from `PaSearchFilterProps` only. Do not remove the property from `SearchFilterProps`, which belongs to the testing/calibration dashboard.

- [ ] **Step 7: Verify dashboard behavior statically**

Run:

```powershell
npx eslint "ClientApp/src/routes/dashboard/dashboard-ta.tsx" "ClientApp/src/components/SearchFilter/types.ts"
npm run type-check
```

Expected: no targeted lint problems and type-check passes.

- [ ] **Step 8: Commit in a Git-backed copy**

```powershell
git add ClientApp/src/routes/dashboard/dashboard-ta.tsx ClientApp/src/components/SearchFilter/types.ts
git commit -m "refactor: stabilize pattern approval dashboard effects"
```

## Task 5: Complete Application-Flow Hook Dependencies and Remove Abandoned UI

**Warnings removed:** 13 total: 9 unused bindings and 4 hook dependency warnings.

**Files:**

- Modify: `ClientApp/src/routes/ta/applicationAndInstrument.tsx`
- Modify: `ClientApp/src/routes/ta/index.tsx`
- Modify: `ClientApp/src/routes/ta/instrumentInfoPanel.tsx`
- Modify: `ClientApp/src/routes/ta/organisationAndContact.tsx`

- [ ] **Step 1: Remove the duplicate loading state and empty handler**

In `ClientApp/src/routes/ta/applicationAndInstrument.tsx`, delete:

```ts
const [isLoading, setIsLoading] = useState(false);
```

Remove all three `setIsLoading(...)` calls from the state-sync effect. The resulting effect must be:

```ts
useEffect(() => {
  if (!initialKey) {
    setIsDataLoading(true);
  } else if (initialKey !== selectedApplication) {
    setIsDataLoading(true);
    setSelectedApplication(initialKey);
    setIsDataLoading(false);
  } else {
    setIsDataLoading(false);
  }
}, [initialKey, selectedApplication]);
```

Delete the commented full-page `isLoading` spinner block.

Remove this empty prop from the instrument-type `<SelectInput>`:

```tsx
onChange={(event) => {
}}
```

- [ ] **Step 2: Complete the application loader and poller dependencies**

In `ClientApp/src/routes/ta/index.tsx`, change the application-step effect dependency array to:

```ts
}, [accounts, id, instance, isLoading, navigate, statuses]);
```

Change the polling catch block from:

```ts
} catch (err: any) {
    if (controller.signal.aborted) break;
}
```

to:

```ts
} catch {
    if (controller.signal.aborted) break;
}
```

Change the `startLongPolling` dependency array from:

```ts
[],
```

to:

```ts
[accounts, instance],
```

- [ ] **Step 3: Complete the instrument-info MSAL dependencies**

In `ClientApp/src/routes/ta/instrumentInfoPanel.tsx`, remove:

```ts
// eslint-disable-next-line react-hooks/exhaustive-deps
```

Change the effect dependency array to:

```ts
}, [
    accounts,
    instance,
    selectedInstrumentCategoryId,
    selectedInstrumentTypeId,
]);
```

- [ ] **Step 4: Remove abandoned organisation branch-selection code**

In `ClientApp/src/routes/ta/organisationAndContact.tsx`:

- delete the React Router import because neither `useLocation` nor `useParams` remains live
- change the Formik import to `import { useField } from 'formik';`
- remove `useAccountContext`
- delete `values`, `sourceReferenceField`, `accountContext`, `location`, `id`, and `rFQId`
- delete `isCorrectBranchOrLocation`
- delete the complete `onShowBranchSelectorClick` function
- delete the complete `renderAgentForManufacturer`, `renderHelpBranch`, `renderHelpIsCorrectBranchOrLocation`, and `renderHelpOrganisationType` functions
- delete the commented `inlineHelp={renderHelpOrganisationType()}` prop

The imports at the top must reduce to:

```ts
import Row from "react-bootstrap/Row";
import { useField } from "formik";
```

plus the existing live component/type imports.

- [ ] **Step 5: Verify the application flow**

Run:

```powershell
npx eslint "ClientApp/src/routes/ta/applicationAndInstrument.tsx" "ClientApp/src/routes/ta/index.tsx" "ClientApp/src/routes/ta/instrumentInfoPanel.tsx" "ClientApp/src/routes/ta/organisationAndContact.tsx"
npm run type-check
```

Expected: no targeted lint problems and type-check passes.

- [ ] **Step 6: Commit in a Git-backed copy**

```powershell
git add ClientApp/src/routes/ta/applicationAndInstrument.tsx ClientApp/src/routes/ta/index.tsx ClientApp/src/routes/ta/instrumentInfoPanel.tsx ClientApp/src/routes/ta/organisationAndContact.tsx
git commit -m "refactor: complete pattern approval application hooks"
```

## Task 6: Clean Summary Screens and Callback Contracts

**Warnings removed:** 18 `@typescript-eslint/no-unused-vars`

**Files:**

- Modify: `ClientApp/src/routes/ta/organisationAndContactProps.ts`
- Modify: `ClientApp/src/routes/ta/preApplication.tsx`
- Modify: `ClientApp/src/routes/ta/summaryAndSubmit.tsx`
- Modify: `ClientApp/src/routes/ta/summaryAndSubmitProps.ts`
- Modify: `ClientApp/src/routes/ta/supportingDocuments.tsx`
- Modify: `ClientApp/src/routes/ta/supportingDocumentsProps.ts`

- [ ] **Step 1: Preserve redirect callback signatures with intentional names**

In each of:

- `ClientApp/src/routes/ta/organisationAndContactProps.ts`
- `ClientApp/src/routes/ta/summaryAndSubmitProps.ts`
- `ClientApp/src/routes/ta/supportingDocumentsProps.ts`

replace:

```ts
const getRedirectionLocationOnError =
  (id: string) => (errorCode: number, errorType: ErrorType) =>
    "/not-found";
```

with:

```ts
const getRedirectionLocationOnError =
  (_id: string) => (_errorCode: number, _errorType: ErrorType) =>
    "/not-found";
```

The parameters remain because the wizard contract calls this function with those arguments.

- [ ] **Step 2: Remove constant-false pre-application loading state**

In `ClientApp/src/routes/ta/preApplication.tsx`:

- remove `useState`
- delete `const [isLoading, setIsLoading] = useState(false);`
- delete the commented `isLoading` spinner block
- change `<div aria-busy={isLoading} aria-live='off'>` to `<div aria-live='off'>`

- [ ] **Step 3: Remove unused summary dependencies and state**

In `ClientApp/src/routes/ta/summaryAndSubmit.tsx`:

- remove `useState`
- remove `useMsal`
- remove `useAccountContext`
- remove `BlockUISpinner`
- delete `accounts`, `instance`, and `account`
- delete both `useState` declarations
- delete the `isLoading` spinner block

The component must begin:

```ts
const SummaryAndSubmit = (props: TASummaryProps) => {
    const { id } = useParams<{ id?: string }>();
    const { isSubmitted } = props;
```

- [ ] **Step 4: Remove the unused summary-submit factory argument**

In `ClientApp/src/routes/ta/summaryAndSubmitProps.ts`, change:

```ts
const submitForm = (
    id: string,
    accounts: AccountInfo[],
    instance: IPublicClientApplication,
    isComplete: boolean,
) => async (
```

to:

```ts
const submitForm = (
    id: string,
    accounts: AccountInfo[],
    instance: IPublicClientApplication,
) => async (
```

Change:

```ts
onSaveAndNext: submitForm(id, accounts, instance, false),
```

to:

```ts
onSaveAndNext: submitForm(id, accounts, instance),
```

Keep `isCompletingStep: true` in the submitted payload; that is the actual behavior.

- [ ] **Step 5: Remove dead HTTP 410 state**

In `ClientApp/src/routes/ta/supportingDocuments.tsx`, delete:

```ts
const [gone, setGone] = useState(false);
```

Delete this special-case branch:

```ts
} else if (uploadServerError.status === HttpStatusCode.Gone) {
    setGone(true);
```

After its removal, HTTP 410 responses with a title flow through the existing `uploadServerError.title` branch and become visible upload errors instead of updating unread state.

- [ ] **Step 6: Verify the summary/helper slice**

Run:

```powershell
npx eslint "ClientApp/src/routes/ta/organisationAndContactProps.ts" "ClientApp/src/routes/ta/preApplication.tsx" "ClientApp/src/routes/ta/summaryAndSubmit.tsx" "ClientApp/src/routes/ta/summaryAndSubmitProps.ts" "ClientApp/src/routes/ta/supportingDocuments.tsx" "ClientApp/src/routes/ta/supportingDocumentsProps.ts"
npm run type-check
```

Expected: no targeted lint problems and type-check passes.

- [ ] **Step 7: Commit in a Git-backed copy**

```powershell
git add ClientApp/src/routes/ta/organisationAndContactProps.ts ClientApp/src/routes/ta/preApplication.tsx ClientApp/src/routes/ta/summaryAndSubmit.tsx ClientApp/src/routes/ta/summaryAndSubmitProps.ts ClientApp/src/routes/ta/supportingDocuments.tsx ClientApp/src/routes/ta/supportingDocumentsProps.ts
git commit -m "refactor: clean pattern approval summary warnings"
```

## Task 7: Simplify Pattern-Approval Management Screens

**Warnings removed:** 35 total: 32 unused bindings and 3 hook dependency warnings.

**Files:**

- Modify: `ClientApp/src/routes/ta/manage/index.tsx`
- Modify: `ClientApp/src/routes/ta/manage/appDetails.tsx`
- Modify: `ClientApp/src/routes/ta/manage/appDetailsProps.ts`
- Modify: `ClientApp/src/routes/ta/manage/appDocuments.tsx`
- Modify: `ClientApp/src/routes/ta/manage/appMessages.tsx`
- Modify: `ClientApp/src/routes/ta/types.ts`

- [ ] **Step 1: Collapse the management-route wrapper**

Replace `ClientApp/src/routes/ta/manage/index.tsx` with:

```tsx
import AppDetails from "./appDetails";

const TAApplicationManage = () => <AppDetails />;

export default TAApplicationManage;
```

In `ClientApp/src/routes/ta/types.ts`, delete:

```ts
export interface TAApplicationDetailsProps {
  isSummary?: boolean;
  name: string;
}
```

- [ ] **Step 2: Narrow `appDetailsProps` to its live inputs**

In `ClientApp/src/routes/ta/manage/appDetailsProps.ts`:

- remove the `AccountDetails` import
- remove `accountDetails` and `bannerTitle` from the function parameters
- delete the commented `bannerTitle` and `bannerSubTitle` lines that reference them

The factory signature must be:

```ts
const appDetailsProps = (
    id: string,
    accounts: AccountInfo[],
    instance: IPublicClientApplication,
): SinglePageFormProps<RequestForPatternApprovalAppDetails> => ({
```

- [ ] **Step 3: Make tab parsing and data-loader options stable**

In `ClientApp/src/routes/ta/manage/appDetails.tsx`:

- remove `useNavigate`
- add `useMemo` to the React import
- remove `useAccountContext`, `AccountDetails`, and `TAApplicationDetailsProps`

Move these declarations above `ApplicationDetails`:

```ts
const TAB_KEYS = ["details", "messages", "documents", "timeline"];

const getTabFromQuery = () => {
  const params = new URLSearchParams(globalThis.location.search);
  const tab = params.get("tab");
  return tab && TAB_KEYS.includes(tab) ? tab : TAB_KEYS[0];
};
```

Change the component start to:

```ts
const ApplicationDetails = () => {
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [appDetails, setAppDetails] = useState<FormikValues | null>(null);
    const { id } = useParams();
    const { accounts, instance } = useMsal();
    const options = useMemo(
        () => appDetailsProps(id!, accounts, instance),
        [accounts, id, instance],
    );
    const { loadStepValues } = options;
```

Delete the component-local `TAB_KEYS`, `getTabFromQuery`, `isLoading`, `isModalOpen`, `navigate`, account context, `hidingFields`, and `messagesRoute` declarations.

Change the popstate effect to:

```ts
useEffect(() => {
  const onPopState = () => {
    setActiveTab(getTabFromQuery());
  };
  globalThis.addEventListener("popstate", onPopState);
  return () => globalThis.removeEventListener("popstate", onPopState);
}, []);
```

Change the fetch effect dependency array from `[]` to:

```ts
}, [loadStepValues]);
```

- [ ] **Step 4: Remove the unused messages renderer and constant-false modal branches**

Delete the complete `messagesTabContent` declaration from `appDetails.tsx`; the live messages tab already renders:

```tsx
{
  loadMessagesTab ? <ApplicationMessages key={messagesRefreshKey} /> : null;
}
```

In both `detailsTabContent` and `timelineTabContent`:

- remove the `inert` spread
- use `aria-busy={isDataLoading}`
- use `aria-live='polite'`
- change `!isModalOpen && isDataLoading` to `isDataLoading`

Remove `isLoading={isLoading}` from `<FormikForm>`. Keep the existing child-level `isDataLoading` spinner, so loading output remains single and behaviorally unchanged.

- [ ] **Step 5: Remove dead document-screen plumbing**

In `ClientApp/src/routes/ta/manage/appDocuments.tsx`:

- remove `useNavigate`
- remove `useAccountContext`
- remove `CustomBreadcrumbItem`
- delete `account`, `navigate`, `breadcrumbs`, and `isModalOpen`
- delete the complete `handleAlertScroll` helper
- delete `scrollUp` state
- delete the `if (scrollUp)` block from the fetch effect

The fetch effect dependencies must become:

```ts
}, [accounts, id, instance, commitSuccess]);
```

Change the polling catch block to:

```ts
} catch {
    if (controller.signal.aborted) break;
}
```

Change the Formik submit signature to:

```tsx
onSubmit={async (values) => {
```

Remove the empty `onDeleteSuccess` prop from `<SupportingDocuments>`.

Simplify the outer content state to:

```tsx
<Col
    aria-busy={isDataLoading}
    aria-live='polite'
>
    {isDataLoading
```

Keep the existing spinner and non-loading content branches unchanged.

- [ ] **Step 6: Remove dead message-screen plumbing**

In `ClientApp/src/routes/ta/manage/appMessages.tsx`:

- remove `useNavigate`
- remove `useAccountContext`
- remove `CustomBreadcrumbItem`
- delete `account`, `navigate`, `breadcrumbs`, `isModalOpen`, and `selectedMessage` state
- change `!isModalOpen && isDataLoading` to `isDataLoading`
- change `.map((msg, index) => (` to `.map((msg) => (`

Replace:

```tsx
className={`border-0 border-bottom mb-1 shadow-sm ${selectedMessage === msg.regardingId ? ' selectedMessage' : ''}`}
```

with:

```tsx
className = "border-0 border-bottom mb-1 shadow-sm";
```

Delete both commented `className` lines that reference `selectedMessage`.

- [ ] **Step 7: Verify management screens**

Run:

```powershell
npx eslint "ClientApp/src/routes/ta/manage/index.tsx" "ClientApp/src/routes/ta/manage/appDetails.tsx" "ClientApp/src/routes/ta/manage/appDetailsProps.ts" "ClientApp/src/routes/ta/manage/appDocuments.tsx" "ClientApp/src/routes/ta/manage/appMessages.tsx" "ClientApp/src/routes/ta/types.ts"
npm run type-check
```

Expected: no targeted lint problems and type-check passes.

- [ ] **Step 8: Commit in a Git-backed copy**

```powershell
git add ClientApp/src/routes/ta/manage/index.tsx ClientApp/src/routes/ta/manage/appDetails.tsx ClientApp/src/routes/ta/manage/appDetailsProps.ts ClientApp/src/routes/ta/manage/appDocuments.tsx ClientApp/src/routes/ta/manage/appMessages.tsx ClientApp/src/routes/ta/types.ts
git commit -m "refactor: simplify pattern approval management screens"
```

## Task 8: Run the Full Quality Gate

**Files:** No planned source changes. Fix only regressions directly caused by Tasks 1-7.

- [ ] **Step 1: Confirm the warning count is zero**

Run:

```powershell
npm run lint
```

Expected: exit code 0 and no ESLint problem summary.

- [ ] **Step 2: Confirm TypeScript consistency**

Run:

```powershell
npm run type-check
```

Expected: exit code 0 and no TypeScript diagnostics.

- [ ] **Step 3: Run the targeted regression set**

Run:

```powershell
npm run test:unit -- tests/unit/components/inputs/complexInputs.behavior.test.tsx tests/unit/components/modals/BranchSelectorModal.test.tsx tests/unit/routes/acceptQuote/paymentDetails.test.tsx tests/unit/routes/acceptQuote/props.test.ts tests/unit/routes/staticPages.test.tsx
```

Expected: all targeted test files pass.

- [ ] **Step 4: Run the complete unit suite with a sufficient timeout**

Run:

```powershell
npm run test:unit
```

Expected: all unit tests pass. Allocate at least 10 minutes in the execution harness; the planning-session run was terminated by a 124-second harness timeout rather than a reported test failure.

- [ ] **Step 5: Run Storybook validation**

Run:

```powershell
npm run test:storybook
npm run build-storybook
```

Expected: Storybook interaction tests pass and the static Storybook build completes.

- [ ] **Step 6: Run the regression-quality suite**

Run:

```powershell
npm run test:quality:regression
```

Expected: all regression-quality tests pass.

- [ ] **Step 7: Review the final diff in a Git-backed copy**

Run:

```powershell
git diff --check
git diff --stat
git status --short
```

Expected: no whitespace errors; changes are limited to the files listed in this plan; no generated/vendor paths appear.

- [ ] **Step 8: Commit final validation-only corrections if required**

If Step 1-7 required a correction directly caused by this plan:

```powershell
git add ClientApp/src tests/unit
git commit -m "test: complete eslint warning remediation"
```

If no correction was required, do not create an empty commit.

## Completion Criteria

- `npm run lint` reports 0 errors and 0 warnings.
- No lint rule, ignore pattern, or warning threshold is weakened.
- No new `eslint-disable` comment is added.
- `npm run type-check` passes.
- Targeted regression tests pass.
- The full unit, Storybook, Storybook build, and regression-quality commands pass with adequate execution time.
- Generated, vendor, captured bundle, and API-client files remain untouched.
- The dashboard branch-reset effect writes once per organisation change rather than looping after its complete dependencies are added.
- Certificate suggestions refresh when their Formik option data changes.
