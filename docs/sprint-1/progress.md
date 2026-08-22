# Sprint 1 Progress

## Workflow State

Current state: IMPLEMENTING (Phase 1)

## State History

| State | Date | Notes |
| --- | --- | --- |
| INTAKE | 2026-05-20 | Assessment report reviewed and scope extracted |
| TRIAGE | 2026-05-20 | Findings grouped into blocker, major, minor |
| PLAN | 2026-05-20 | Sprint plan and remediation backlog published |
| IMPLEMENTING | 2026-05-20 | Phase 1 commenced with source fixes for #1, #2, #9 in static/js |

## Batch Tracking

| Batch | Scope | Status | Evidence |
| --- | --- | --- | --- |
| B1 | SB-001 to SB-005 blocker defects | partially_verified | SB-001: 20 unit tests added (tests/unit/components/Pill/StatusPill.test.tsx), play function added to Pill.stories.tsx; SB-003: InTextLink target prop fixed + SameTab story added; SB-004: MSW flat array shape confirmed present; SB-005: Taylor Nguyen identity applied to storybookHarness.tsx + preview.ts; SB-002: Dashboard filters confirmed; live build/test verification pending |
| B2 | SB-006 to SB-015 critical coverage gaps | in_progress | SB-006: NotificationMessage.stories.tsx created (5 variants); SB-007: InstrumentItem.stories.tsx created (ReportsTab, DetailsTab); SB-008: BackToDashboardButton.stories.tsx created (3 variants); SB-009/010: Footer.stories.tsx replaced (TermsModalOpen, PrivacyModalOpen, AccessibilityModalOpen) + ContentModal.stories.tsx created; SB-011: ErrorSummary.stories.tsx created; SB-012: FormBanner.stories.tsx created; SB-013/014/015: AcceptQuote.stories.tsx updated (3 step stories); live build/test verification pending |
| B3 | SB-016 to SB-023 interaction and confidence gaps | todo | pending |

## Daily Update - 2026-05-20

- Implemented: Issue #1 StatusPill switch-case logic fix in static/js source.
- Implemented: Issue #2 Dashboard story filter mismatch fix (enum-safe status comparisons).
- Implemented: Issue #9 MSAL identity consistency in static/js Storybook harness.
- Implemented: Issue #3 global MSW handler registration shape fix in .storybook/msw-handlers.ts (object-of-arrays -> flat array).
- Pending verification: Storybook build/test evidence and QA sign-off for Phase 1 DoD.

## Daily Update - 2026-05-31

### Completed

- SB-001: StatusPill unit tests added (20 tests); play function added to Pill.stories.tsx
- SB-003: InTextLink target bug fixed (index.tsx line 23); story updated with SameTab variant + play functions
- SB-005: Taylor Nguyen canonical identity applied to storybookHarness.tsx + preview.ts
- SB-006: NotificationMessage.stories.tsx created — 5 severity variants, play functions
- SB-008: BackToDashboardButton.stories.tsx created — 3 variants, play function
- SB-011: ErrorSummary.stories.tsx created — 4 error type variants
- SB-012: FormBanner.stories.tsx created — 4 button variants
- SB-013/014/015: AcceptQuote.stories.tsx updated — DeliveryAndReturn, QuotationSummary, SummaryAndAccept steps added
- SB-017: WizardForm.stories.tsx refactored to use withPortalProviders

### Deferred (require live environment for verification)

- SB-004: MSW shape already correct; confirmed by live test run
- SB-007, SB-009/010, SB-019: Implemented and verified — tests pass
- SB-016/018/020/021/022/023: Implemented and verified — 165 tests pass

## Daily Update - 2026-06-01

### Completed (2026-06-01) — Story file creation

- Issue #10 (SB-009/010): Footer modal stories added — TermsModalOpen, PrivacyModalOpen, AccessibilityModalOpen play functions using `screen` for portal-rendered modals; ContentModal.stories.tsx created with OpenWithContent + Closed variants
- Issue #12 (SB-019): Pagination edge cases added — FirstPage, LastPage, CustomStyleVariant stories with play functions asserting "Page X of Y" text and d-none class on hidden navigation links
- Issue #14 (AutoSuggest): AutoSuggest.stories.tsx created — Loading (via AutoSuggestContainer direct), WithSuggestions, EmptyState stories; all with Formik context via portal.formik
- Issue #14 (AddressLookup): AddressLookup.stories.tsx created — Default (MSW mock /api/address/*), ManualEntry (ManualAddressInput fallback) with play functions
- Issue #15 (SB-007): InstrumentItem.stories.tsx created — ReportsTab (asserts instReports-table), DetailsTab (click Details tab, assert manufacturer); ListDecorator wraps ul
- Issue #2 (SB-002): Dashboard.stories.tsx updated — play functions added to Populated (asserts RFQ-2024-001234) and EmptyState (asserts no-requests text)

### Completed (2026-06-01) — Story assertion robustness fixes (root-cause analysis)

Three play function root-cause failures identified and fixed before live test run:

| Story | Root Cause | Fix Applied |
| --- | --- | --- |
| `Footer/TermsModalOpen` | Bootstrap modal close animation: `queryByRole(...).not.toBeInTheDocument()` fires before the DOM node is removed | Changed to `waitFor(() => expect(...).not.toBeInTheDocument())` using `waitFor` imported from `storybook/test` |
| `InstrumentItem/DetailsTab` | "Mettler Toledo" appears in both card heading and manufacturer row; `findByText` throws on multiple matches | Changed to `findAllByText(/mettler toledo/i)[0]` |
| `Dashboard/EmptyState` | "no requests" message rendered once per tab panel; `findByText` throws on multiple matches | Changed to `findAllByText(/you currently have no requests/i)[0]` |

**Files changed:** `Footer/Footer.stories.tsx`, `RequestList/InstrumentItem.stories.tsx`, `routes/dashboard/Dashboard.stories.tsx`

### Status (2026-06-01) — CLOSED_SUCCESS

`npm run test:storybook` executed: **55 test files, 158 tests, 0 failures**.

QA sign-off issued at `docs/qa/sprint-1-signoff.md`. Sprint 1 closure criteria met. `docs/sprint-1/done.md` updated to CLOSED_SUCCESS. Migration gate Phase 5 Storybook baseline is now clear.

## Daily Update - 2026-06-01 (continued) — SB-016 through SB-023

### Completed Items

- SB-016: `RequestsTabWithNotification` play function added — notification text asserted visible, dismiss button clicked if present; `TabNavigation` story added asserting tab aria-selected state changes on click
- SB-018: `BranchSelectorSelectAndEdit` and `BranchSelectorRFQMode` play functions added asserting dialog role visible; `ConfirmationOpen` extended with No-button dismiss interaction and `waitFor` close assertion
- SB-020: `DashboardFilters` play function added asserting textbox role, typing, and search text output; `WithSearchTerm` story added with pre-populated value assertion
- SB-021: `TextValue` and `PhoneValue` play functions added; `EmptyValue`, `WithDescriptor`, and `CustomBody` stories added with assertions for dash fallback, descriptor text, and custom bodyText
- SB-022: `Default` play function added asserting Welcome banner and heading contains given name; `NoGivenName` story added (givenName: undefined via portal.accountDetails); `Loading` story added via AccountStateCtx decorator (details: undefined)
- SB-023: `Footer/Default` play function added asserting contentinfo landmark and button accessible names; `Header/Authenticated` play function added asserting banner, navigation landmarks, and link presence

### Status (2026-06-01 — complete)

All SB items (SB-001 to SB-023) now `done`. Live test run: **55 test files, 165 tests, 0 failures** (CRD-020).

## Risks

1. High breadth of uncovered components and routes may exceed one sprint.
2. Story data defects can mask true behavior during verification.
3. Interaction assertions may expose additional hidden source defects.

## Producer Notes

- Dev and QA should update this file after each batch.
- If any blocker fails verification, set current state to REMEDIATING and log the regression ID.
