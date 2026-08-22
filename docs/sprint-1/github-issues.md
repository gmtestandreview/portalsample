# Storybook Quality Remediation — GitHub Issues

**Sprint:** Sprint 1 (Storybook Coverage Hardening)  
**Date Created:** 2026-05-20  
**Total Issues:** 15  
**Blocker Status:** 4 critical, 6 high, 5 medium

---

## 🔴 CRITICAL ISSUES (Must fix for rebuild fidelity)

### Issue #1: StatusPill Switch-Case Logic Bug

**Title:** StatusPill: Switch case using OR operator breaks QuoteStatus matches  
**Severity:** Critical  
**Component:** `static/js/components/Pill/StatusPill.tsx`  
**Description:**

Lines 24–51 use `case DashboardItemStatus.QuoteAccepted || QuoteStatus.QuoteAccepted:` pattern.  
In JavaScript, this evaluates to the first truthy value only. QuoteStatus variants are silently ignored.

**Affected Statuses:**

- QuoteAccepted (QuoteStatus never matched)
- ReportIssued (QuoteStatus never matched)
- ReportInProgress (QuoteStatus never matched)
- ArtifactReceived (QuoteStatus never matched)
- QuoteAvailable (QuoteStatus never matched)
- QuoteDeclined (QuoteStatus never matched)
- QuoteExpired (QuoteStatus never matched)
- QuoteSubmitted (QuoteStatus never matched)
- ReportWithdrawn (QuoteStatus never matched)

**Root Cause:** OR operator in case label misused; should use separate case statements or switch on type discriminator.

**Definition of Done:**

- [ ] Fix all 9 switch cases to use correct pattern (separate cases or type guard)
- [ ] Add unit test covering every DashboardItemStatus AND QuoteStatus value
- [ ] Add Storybook story rendering both enums across all status variants
- [ ] Story play function asserts correct color/icon per status
- [ ] Story plays and passes with no console errors

**Assigned To:** Dev Agent  
**Blocks:** Dashboard rebuild, Quote flows, Status rendering integrity  
**Depends on:** None

---

### Issue #2: Dashboard Tab Filter Strings Don't Match Enum Values

**Title:** Dashboard: Filter strings don't match DashboardItemStatus enum values  
**Severity:** Critical  
**Component:** `static/js/routes/dashboard/Dashboard.stories.tsx` + `static/js/enums.ts`  
**Description:**

Lines 13–14 in Dashboard.stories.tsx filter by 'Quote drafted' and 'Report issued'.  
Actual enum values: 'Quote request drafted' and 'Report is available'.

Result: Drafts tab and Instruments tab always show empty lists in stories (and likely in production if using same filter logic).

**Current State:**

```typescript
const draftItems = dashboardItems.filter(i => i.status === 'Quote drafted'); // ← empty!
const instrumentItems = dashboardItems.filter(i => i.status === 'Report issued'); // ← empty!
```

**Definition of Done:**

- [ ] Fix filter strings to match exact enum values
- [ ] Verify Drafts tab now shows at least one item in story
- [ ] Verify Instruments tab now shows at least one item in story
- [ ] Add play function asserting both tabs are non-empty
- [ ] Verify InstrumentItem component is now visible in Instruments tab story
- [ ] Update Dashboard story snapshot if needed

**Assigned To:** Dev Agent  
**Blocks:** Dashboard display integrity, InstrumentItem visibility  
**Depends on:** None

---

### Issue #3: MSW Global Handlers Malformed (Object of Arrays vs Flat Array)

**Title:** MSW global handlers: Wrong shape breaks fallback registration  
**Severity:** Critical  
**Files:** `static/js/storybook/msw-handlers.ts` + `.storybook/preview.ts`  
**Description:**

`msw-handlers.ts` exports `{ dashboard: [...] }` (object of arrays).  
`msw-storybook-addon` expects `{ handlers: [...] }` (flat array) or plain array.

Result: Global /api/dashboard/* fallback may never register. Stories with explicit MSW overrides work; stories without explicit MSW config for dashboard endpoints hit unhandled requests.

**Current State:**

```typescript
// msw-handlers.ts
export const mswHandlers = { dashboard: [ http.get(...) ] };

// preview.ts
msw: { handlers: mswHandlers } // ← wrong shape
```

**Definition of Done:**

- [ ] Refactor mswHandlers to correct shape (flat array or proper { handlers: [...] })
- [ ] Verify all stories using dashboard endpoints show no MSW unhandled request warnings
- [ ] Add a story that intentionally omits MSW config and verify fallback handler kicks in
- [ ] Run `npm run build-storybook` with no console errors

**Assigned To:** Dev Agent  
**Blocks:** MSW reliability, integration story data loading  
**Depends on:** None

---

### Issue #4: AcceptQuote Missing Final 3 Wizard Steps (Including Acceptance)

**Title:** AcceptQuote wizard: Steps 3–5 have no stories (highest business criticality)  
**Severity:** Critical  
**Route:** `static/js/routes/accept-quote/`  
**Description:**

3 of 5 steps missing stories:

- deliveryAndReturn.tsx (step 3)
- quotationSummary.tsx (step 4)
- summaryAndAccept.tsx (step 5 — **final acceptance, business-critical**)
- index.tsx (WizardForm container — no story)

Result: Final acceptance flow is untestable via Storybook. Rebuild has no visual baseline for confirmation page.

**Definition of Done:**

- [ ] Create AcceptQuote/DeliveryAndReturn story with all delivery/return permutations
- [ ] Create AcceptQuote/QuotationSummary story with summary display
- [ ] Create AcceptQuote/SummaryAndAccept story with payment confirmation state
- [ ] Create AcceptQuote/Wizard story showing full 5-step progression
- [ ] Add play functions testing Next button navigation between steps
- [ ] Verify all stories render with real router + auth context
- [ ] All stories pass with no console errors

**Assigned To:** Dev Agent  
**Blocks:** AcceptQuote route rebuild, payment flow confidence  
**Depends on:** Issue #7 (NotificationMessage story needed for error display)

---

## 🟠 HIGH-PRIORITY ISSUES

### Issue #5: NotificationMessage Component Zero Coverage (App-Wide)

**Title:** Add Storybook story for NotificationMessage (used app-wide)  
**Severity:** High  
**Component:** `static/js/components/Alert/NotificationMessage.tsx`  
**Description:**

NotificationMessage wraps all alert types with structured icon-in-circle layout.  
Used by Dashboard, WizardForm, and likely every page-level notification.  
**Zero story coverage.** Icon layout and NotificationSeverity switch are entirely untested.

**Definition of Done:**

- [ ] Create NotificationMessage story covering all NotificationSeverity enum variants
- [ ] Story includes icon-circle rendering, message text, dismiss button
- [ ] Add play function testing dismiss callback
- [ ] Add play function verifying aria-live and role per severity
- [ ] Story renders with mocked App Insights context
- [ ] All stories pass with no console errors

**Assigned To:** Dev Agent  
**Blocks:** Alert/notification rebuild, app-wide error display  
**Depends on:** None

---

### Issue #6: ErrorSummary Component Missing Story (Server Errors, WAF, Conflict)

**Title:** Add Storybook story for ErrorSummary (complex error handling)  
**Severity:** High  
**Component:** `static/js/components/Forms/ErrorSummary/index.tsx`  
**Description:**

ErrorSummary handles server errors, WAF violations, Conflict/Unprocessable variants, key-to-label mapping.  
**Zero story coverage.** Complex branching and error type handling is invisible in rebuild.

**Definition of Done:**

- [ ] Create ErrorSummary story with server error variant
- [ ] Create variant with WAF violation error
- [ ] Create variant with Conflict (409) error
- [ ] Create variant with Unprocessable Entity (422) error
- [ ] Add story showing key-to-label mapping
- [ ] Add play function testing error message rendering
- [ ] Story renders with form context if needed
- [ ] All stories pass with no console errors

**Assigned To:** Dev Agent  
**Blocks:** Error UI rebuild, form error display integrity  
**Depends on:** None

---

### Issue #7: InTextLink target Attribute Always Hardcoded to '_blank'

**Title:** InTextLink: target prop ignored, always opens in new tab  
**Severity:** High  
**Component:** `static/js/components/InTextLink/index.tsx`  
**Description:**

Line 23 destructures `target` from props (removes it from spread), but rendered `<a>` always has `target='_blank'` hardcoded.

InlineText story passes no target, yet link opens new tab.  
Story has no assertion to catch this.

**Current State:**

```typescript
const { target, ...rest } = props; // target removed
return <a {...rest} target='_blank' />; // hardcoded override
```

**Definition of Done:**

- [ ] Fix: either honor passed target prop or remove target from destructure
- [ ] Update InlineText story to pass target prop and assert rendering
- [ ] Update External story to assert target='_blank' still works as intended
- [ ] Add story covering target='_self' (same-tab) use case
- [ ] Story play function asserts target attribute value
- [ ] All stories pass with no console errors

**Assigned To:** Dev Agent  
**Blocks:** Link behavior fidelity, same-tab links broken  
**Depends on:** None

---

### Issue #8: BackToDashboardButton Missing Story

**Title:** Add story for BackToDashboardButton  
**Severity:** High  
**Component:** `static/js/components/Buttons/BackToDashboardButton/index.tsx`  
**Description:**

BackToDashboardButton is a distinct component with `containerClassName` and `className` props.  
Zero story coverage. No baseline for button styling or navigation behavior.

**Definition of Done:**

- [ ] Create BackToDashboardButton story
- [ ] Story shows button rendered with default styling
- [ ] Story includes variant with custom containerClassName
- [ ] Story includes variant with custom className
- [ ] Add play function testing onClick navigation (mock router)
- [ ] Story renders within Layout/PortalShell context
- [ ] All stories pass with no console errors

**Assigned To:** Dev Agent  
**Blocks:** Navigation button rebuild  
**Depends on:** None

---

### Issue #9: Dual MSAL Account Inconsistency (Test User vs Taylor Nguyen)

**Title:** MSAL mock account mismatch between preview.ts and storybookHarness.tsx  
**Severity:** High  
**Files:** `.storybook/preview.ts` + `static/js/storybook/storybookHarness.tsx`  
**Description:**

preview.ts: `mockMsalAccount.name = 'Test User'` / `username = '<test@example.com>'`  
storybookHarness.tsx: `mockMsalAccount.name = 'Taylor Nguyen'` / `username = '<taylor.nguyen@example.com>'`

Components using `useMsal()` directly see 'Test User'.  
Components using `useAccountState()` see 'Taylor Nguyen'.  
Inconsistency is invisible until component accesses both paths.

**Definition of Done:**

- [ ] Align account name and username across both files
- [ ] Choose single canonical mock account (recommend Taylor Nguyen for realism)
- [ ] Update all related stories to use consistent mocked account
- [ ] Add comment explaining why account is unified in single place
- [ ] Verify no stories have hardcoded assertions on 'Test User' or old email
- [ ] Run `npm run build-storybook` with no errors

**Assigned To:** Dev Agent  
**Blocks:** Auth context reliability  
**Depends on:** None

---

### Issue #10: Footer Modal Content Never Rendered (Terms, Privacy, Accessibility)

**Title:** Add stories for Footer modal dialogs (Terms, Privacy, Accessibility)  
**Severity:** High  
**Component:** `static/js/components/Footer/` — missing stories for modals  
**Description:**

Footer component has 3 modal dialogs (TermsOfUse, Privacy, Accessibility) that are never opened or rendered in any story.  
No stories test the three onClick handlers (Terms, Privacy, Accessibility links).

Files with zero coverage:

- Footer/termsOfUse.tsx
- Footer/privacy.tsx
- Footer/accessibility.tsx

**Definition of Done:**

- [ ] Create TermsOfUse story showing modal open state
- [ ] Create Privacy story showing modal open state
- [ ] Create Accessibility story showing modal open state
- [ ] Create ContentModal story (reusable modal wrapper)
- [ ] Add play functions testing modal open/close lifecycle
- [ ] Add play function testing link click → modal appears
- [ ] Stories render with mocked data (no real content fetches)
- [ ] All stories pass with no console errors

**Assigned To:** Dev Agent  
**Blocks:** Footer legal content rebuild  
**Depends on:** None

---

### Issue #11: WizardForm Uses Duplicate MockAccountProvider (Not withPortalProviders)

**Title:** WizardForm story: Inconsistent context pattern vs rest of codebase  
**Severity:** High  
**Component:** `static/js/components/Forms/WizardForm.stories.tsx`  
**Description:**

WizardForm story creates its own `MockAccountProvider` instead of using `withPortalProviders` decorator.

Creates inconsistent pattern vs rest of Storybook.  
Other stories like BranchSelector do same—duplicates provider stack, makes maintenance harder.

**Definition of Done:**

- [ ] Refactor WizardForm story to use `withPortalProviders` decorator
- [ ] Verify all WizardForm scenarios still render correctly
- [ ] Remove duplicate MockAccountProvider from story
- [ ] Audit other stories (BranchSelector, RFQDelete, RequestList) for same pattern
- [ ] Create standardized pattern guidance in CONVENTIONS.md
- [ ] Run `npm run build-storybook` with no errors

**Assigned To:** Dev Agent  
**Blocks:** Story architecture consistency  
**Depends on:** None

---

### Issue #12: Pagination Story Missing Edge Cases (First/Last Page, Page Text)

**Title:** Pagination: Add play functions for edge cases and page text assertion  
**Severity:** High  
**Component:** `static/js/components/Pagination/Pagination.stories.tsx`  
**Description:**

Current stories: MidRange, SinglePageHidden

Missing cases:

- First page (prev/first buttons hidden)
- Last page (next/last buttons hidden)
- visiblePageRange variation
- containerClassName, className
- Page change interaction (play function)
- "Page X of Y" text assertion

**Definition of Done:**

- [ ] Add Pagination/FirstPage story
- [ ] Add Pagination/LastPage story
- [ ] Add Pagination/CustomStyleVariant story with containerClassName/className
- [ ] Add play function testing page change button click
- [ ] Add play function verifying "Page X of Y" text rendered
- [ ] Add play function for first/last button disabled states
- [ ] All stories pass with no console errors

**Assigned To:** Dev Agent  
**Blocks:** Pagination UI rebuild  
**Depends on:** None

---

## 🟡 MEDIUM-PRIORITY ISSUES

### Issue #13: FormBanner Component Missing Story (3 Button Variants)

**Title:** Add story for FormBanner (Save-and-Exit, Discard, Go-to-Dashboard variants)  
**Severity:** Medium  
**Component:** `static/js/components/Forms/FormBanner/index.tsx`  
**Description:**

FormBanner renders page-level form header with 3 button variants.  
Zero story coverage. Button behavior and layout variants are invisible.

**Definition of Done:**

- [ ] Create FormBanner/SaveAndExit story
- [ ] Create FormBanner/Discard story variant
- [ ] Create FormBanner/GoToDashboard story variant
- [ ] Add play functions testing button click callbacks
- [ ] Add play function verifying banner text rendered
- [ ] Stories render within form context if needed
- [ ] All stories pass with no console errors

**Assigned To:** Dev Agent  
**Blocks:** Form UI rebuild  
**Depends on:** None

---

### Issue #14: AutoSuggest + AddressLookup Components Missing Stories (Complex Async Inputs)

**Title:** Add stories for complex async inputs (AutoSuggest, AddressLookup)  
**Severity:** Medium  
**Files:**

- `static/js/components/Inputs/AutoSuggest/index.tsx`
- `static/js/components/Inputs/AddressLookup/index.tsx`
- `static/js/components/Inputs/AddressLookup/ManualAddressInput.tsx`

**Description:**

Complex async inputs with suggestion/lookup behavior.  
Zero story coverage. Async data loading, user interaction, and fallback paths are untested in Storybook.

**Definition of Done:**

- [ ] Create AutoSuggest story with loading state
- [ ] Create AutoSuggest story with suggestions displayed
- [ ] Create AutoSuggest story with no suggestions (empty state)
- [ ] Create AddressLookup story with address found
- [ ] Create AddressLookup/ManualAddressInput story (fallback)
- [ ] Add play functions simulating user typing
- [ ] Add play functions verifying suggestion list appears
- [ ] All stories pass with no console errors

**Assigned To:** Dev Agent  
**Blocks:** Input component rebuild  
**Depends on:** None

---

### Issue #15: InstrumentItem Card Component Never Rendered (Entirely Hidden)

**Title:** Add story for InstrumentItem (separate card type for reports history)  
**Severity:** Medium  
**Component:** `static/js/components/RequestList/instrumentItem.tsx`  
**Description:**

InstrumentItem is a distinct card type for reports history (different tabs, heading, actions).  
Currently hidden because Dashboard story filter is broken (Issue #2).  
Zero story coverage. Card layout and interaction are untested.

**Definition of Done:**

- [ ] Create InstrumentItem story showing report details
- [ ] Create variant showing details tab active
- [ ] Create variant showing reports tab active
- [ ] Add play functions testing tab navigation
- [ ] Add play function testing actions menu
- [ ] Story renders with mocked report data
- [ ] All stories pass with no console errors
- [ ] Note: depends on Dashboard filter fix (Issue #2) so card becomes visible

**Assigned To:** Dev Agent  
**Blocks:** InstrumentItem rebuild  
**Depends on:** Issue #2 (Dashboard filter fix)

---

## Summary by Assignee

| Agent | Count | Issues |
|-------|-------|--------|
| **Dev Agent** | 15 | All (core implementation) |
| **QA Agent** | 15 | All (play-function validation + regression testing) |

## Release Gate

**All 15 issues must be in `CLOSED_SUCCESS` state before:**

- Merge to main
- Release to production
- Call Storybook migration "complete"

**Verification:** QA Agent runs full suite (`npm run test:storybook`) and confirms 100% pass rate.

---

**Last Updated:** 2026-05-20  
**Created By:** Producer (Remy)  
**Status:** INTAKE → ready for Dev agent triage
