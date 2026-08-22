# QA Agent Handoff — Sprint 1 Storybook Quality Remediation

**From:** Producer (Remy)  
**To:** QA Agent  
**Date:** 2026-05-20  
**Sprint:** Sprint 1  
**Status:** INTAKE (standby for dev completion)

---

## Overview

You will validate the **15 Storybook remediation issues** that the Dev Agent is fixing. Your role:

1. **Verify each issue closure** against its Definition of Done
2. **Run the full Storybook test suite** (`npm run test:storybook`)
3. **Check for regressions** in existing passing tests
4. **Sign off with evidence** before merge

**When to Start:** After Dev Agent reaches VERIFYING state  
**Success Criteria:** 100% pass rate on all Storybook tests + no new console errors

---

## Testing Protocol

### Phase-Based Sign-Off

After Dev Agent completes each phase and notifies Producer, **you** will:

1. **Read the phase updates** in `docs/sprint-1/progress.md`
2. **Verify each issue's DoD checklist** is complete
3. **Run targeted tests** for that phase
4. **Check for console errors** in Storybook build
5. **Run regression tests** to ensure no breakage

### Full Test Run (Final Sign-Off)

After all 4 phases complete:

```bash
npm run build-storybook   # Verify build succeeds, no errors
npm run test:storybook    # Run all Storybook tests
npm run test:unit         # Run all unit tests
npm run type-check        # Verify no TS errors
```

**Expected:** 100% pass, zero console errors (except known MSW logs)

---

## Validation Checklist Per Issue

### Critical Issues (1–4)

**Issue #1: StatusPill Switch-Case Bug**
- [ ] Switch cases use correct pattern (separate cases or type guard)
- [ ] Unit test exists covering every DashboardItemStatus AND QuoteStatus
- [ ] Storybook story renders both enums across all status variants
- [ ] Story play function asserts correct color/icon per status
- [ ] Story plays in Storybook without errors
- [ ] No console errors or warnings

**Issue #2: Dashboard Filter Strings**
- [ ] Filter strings match exact enum values
- [ ] Drafts tab shows at least one item in story
- [ ] Instruments tab shows at least one item in story
- [ ] Play function asserts both tabs are non-empty
- [ ] InstrumentItem component is visible in Instruments tab
- [ ] Dashboard story snapshot updated (if applicable)

**Issue #3: MSW Global Handlers**
- [ ] mswHandlers exports correct shape (flat array or { handlers: [...] })
- [ ] No MSW "unhandled request" warnings in stories
- [ ] Create test story that omits MSW config and verify fallback kicks in
- [ ] `npm run build-storybook` succeeds with no errors

**Issue #4: AcceptQuote Missing Steps**
- [ ] DeliveryAndReturn story created with all delivery/return variants
- [ ] QuotationSummary story created
- [ ] SummaryAndAccept story created (final acceptance visible)
- [ ] Wizard container story shows all 5 steps
- [ ] Play functions test Next button navigation
- [ ] Stories render with auth/router context
- [ ] All stories pass with no console errors

---

### High-Priority Issues (5–12)

**Issue #5: NotificationMessage Story**
- [ ] Story covers all NotificationSeverity enum variants
- [ ] Icon-circle rendering visible
- [ ] Message text renders correctly
- [ ] Play function tests dismiss callback
- [ ] Play function verifies aria-live and role per severity
- [ ] Stories render with mocked App Insights
- [ ] All stories pass

**Issue #6: ErrorSummary Story**
- [ ] Server error variant created and renders
- [ ] WAF violation variant renders
- [ ] Conflict (409) variant renders
- [ ] Unprocessable Entity (422) variant renders
- [ ] Key-to-label mapping story created
- [ ] Play function tests error message rendering
- [ ] All stories pass

**Issue #7: InTextLink target Bug**
- [ ] target prop is honored (not hardcoded '_blank')
- [ ] InlineText story renders with target='_self' and asserts it
- [ ] External story still asserts target='_blank'
- [ ] Play function checks target attribute value
- [ ] All stories pass

**Issue #8: BackToDashboardButton Story**
- [ ] Story created with default styling
- [ ] Variant with custom containerClassName
- [ ] Variant with custom className
- [ ] Play function tests onClick navigation (mocked router)
- [ ] Renders within Layout/PortalShell
- [ ] All stories pass

**Issue #9: MSAL Account Inconsistency**
- [ ] Account name/username unified across preview.ts and storybookHarness.tsx
- [ ] Canonical mock account chosen (recommend Taylor Nguyen)
- [ ] All related stories use consistent account
- [ ] No hardcoded assertions on old account names/emails
- [ ] `npm run build-storybook` succeeds

**Issue #10: Footer Modal Stories**
- [ ] TermsOfUse modal story shows open state
- [ ] Privacy modal story shows open state
- [ ] Accessibility modal story shows open state
- [ ] ContentModal wrapper story created
- [ ] Play functions test open/close lifecycle
- [ ] Play function tests link click → modal appears
- [ ] All stories pass

**Issue #11: WizardForm Context Pattern**
- [ ] Story refactored to use withPortalProviders decorator
- [ ] All WizardForm scenarios still render correctly
- [ ] Duplicate MockAccountProvider removed
- [ ] Audit complete on BranchSelector, RFQDelete, RequestList stories
- [ ] No duplicate provider patterns found
- [ ] `npm run build-storybook` succeeds

**Issue #12: Pagination Edge Cases**
- [ ] FirstPage story created (prev/first buttons hidden)
- [ ] LastPage story created (next/last buttons hidden)
- [ ] CustomStyleVariant with containerClassName/className
- [ ] Play function tests page change button click
- [ ] Play function verifies "Page X of Y" text
- [ ] Play function tests first/last button disabled states
- [ ] All stories pass

---

### Medium-Priority Issues (13–15)

**Issue #13: FormBanner Story**
- [ ] SaveAndExit variant story created
- [ ] Discard variant story created
- [ ] GoToDashboard variant story created
- [ ] Play functions test button click callbacks
- [ ] Play function verifies banner text
- [ ] All stories pass

**Issue #14: AutoSuggest + AddressLookup Stories**
- [ ] AutoSuggest story with loading state created
- [ ] AutoSuggest story with suggestions displayed
- [ ] AutoSuggest story with empty state
- [ ] AddressLookup story with address found
- [ ] AddressLookup/ManualAddressInput fallback story
- [ ] Play functions simulate user typing
- [ ] Play functions verify suggestion list appears
- [ ] All stories pass

**Issue #15: InstrumentItem Story**
- [ ] InstrumentItem story shows report details
- [ ] Variant showing details tab active
- [ ] Variant showing reports tab active
- [ ] Play functions test tab navigation
- [ ] Play function tests actions menu
- [ ] Story renders with mocked report data
- [ ] All stories pass

---

## Regression Testing

After all issues are CLOSED_SUCCESS, run:

```bash
npm run test:unit        # All unit tests pass
npm run test:storybook   # All Storybook tests pass
npm run build-storybook  # Build succeeds, no TS errors
npm run type-check       # No TypeScript errors
```

**If any test fails:**
1. Identify which issue(s) caused regression
2. File a new issue with "REGRESSION" tag
3. Route back to Dev Agent for remediation
4. Do NOT approve merge until regressions cleared

---

## Acceptance Criteria for QA Sign-Off

✅ **All 15 issues have Definition of Done verified**
✅ **All Storybook tests pass (100%)**
✅ **All unit tests pass (0 failures)**
✅ **No new console errors or warnings**
✅ **No TypeScript errors**
✅ **No regressions vs baseline**
✅ **Evidence captured in `docs/sprint-1/qa-signoff.md`**

---

## Communication Protocol

**When Dev Agent Says Issue is Ready:**
- Read their progress.md update
- Check issue against DoD checklist
- Run targeted tests for that issue
- Update `docs/sprint-1/progress.md` with QA status (VERIFYING → VERIFIED or BLOCKED)
- If blocked, post error details and escalate to Producer

**Before Final Merge:**
- Run full test suite
- Generate final QA sign-off report
- Post to `docs/sprint-1/qa-signoff.md`
- Notify Producer when ready for merge

---

## Tools & Commands

**Build Storybook (verbose output):**
```bash
npm run build-storybook
```

**Run Storybook in browser:**
```bash
npm run storybook
```

**Run all tests:**
```bash
npm run test:unit
```

**Type check:**
```bash
npm run type-check
```

**Filter test run by pattern:**
```bash
npm run test:unit -- --grep="StatusPill"
```

---

## Timeline & Milestones

| Phase | Dev Duration | QA Duration | Total |
|-------|-------------|------------|-------|
| Phase 1 (Critical Infrastructure) | 2 days | 1 day | 3 days |
| Phase 2 (Critical Stories) | 2 days | 1 day | 3 days |
| Phase 3 (High Priority) | 2 days | 1 day | 3 days |
| Phase 4 (Medium Priority) | 2 days | 1 day | 3 days |
| **Final Verification** | — | 1 day | 1 day |
| **Total** | 8 days | 5 days | **~13 days** |

---

## What to Do Now (Standby Phase)

1. **Review this handoff** — understand scope, DoD criteria, validation process
2. **Familiarize yourself with Storybook build/test commands**
3. **Set up workspace** — clone repo, install deps, verify `npm run build-storybook` works
4. **Prepare test environment** — verify node version, npm/pnpm setup
5. **Wait for Dev Agent to reach VERIFYING state** — Producer will notify you

---

**Handoff Date:** 2026-05-20  
**Producer:** Remy  
**Status:** INTAKE (standby for Dev Agent completion)  
**Next Action:** Developer starts work on Phase 1; QA remains on standby
