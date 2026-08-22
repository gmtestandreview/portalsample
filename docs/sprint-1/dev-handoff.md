# Dev Agent Handoff — Sprint 1 Storybook Quality Remediation

**From:** Producer (Remy)  
**To:** Dev Agent  
**Date:** 2026-05-20  
**Sprint:** Sprint 1  
**Status:** INTAKE → DESIGN_REVIEW (awaiting your acceptance)

---

## Overview

You are tasked with fixing **15 critical, high, and medium-priority issues** identified in the **Storybook vs Source Quality Assessment Report**. The work spans component bugs, story coverage gaps, and infrastructure fixes.

**Scope:**

- 4 critical bugs (StatusPill, Dashboard filters, MSW handlers, AcceptQuote missing steps)
- 6 high-priority coverage gaps (NotificationMessage, ErrorSummary, InTextLink, BackToDashboardButton, Footer modals, WizardForm context)
- 5 medium-priority stories (FormBanner, AutoSuggest, AddressLookup, InstrumentItem, Pagination edge cases)

**Deliverables:**

- All 15 issues CLOSED_SUCCESS with evidence (tests, story plays, no console errors)
- QA sign-off on full Storybook test run (`npm run test:storybook` 100% pass)
- No regressions in existing passing tests

---

## Issue Triage & Recommended Sequence

### Phase 1: Critical Infrastructure Fixes (Days 1–2)

These unblock everything else.

1. **Issue #3: MSW Global Handlers** — fix shape, verify fallback registration
2. **Issue #1: StatusPill Switch-Case Bug** — fix logic, add comprehensive unit + story tests
3. **Issue #2: Dashboard Filter Strings** — align with enum values, verify tabs visible
4. **Issue #9: MSAL Account Inconsistency** — unify mock across files

**Acceptance Criteria for Phase 1:**

- [ ] No MSW unhandled request warnings in any story
- [ ] StatusPill renders both DashboardItemStatus and QuoteStatus correctly
- [ ] Dashboard Drafts and Instruments tabs show items in story
- [ ] Account name/email consistent across all contexts

---

### Phase 2: Critical Story Coverage (Days 3–4)

1. **Issue #4: AcceptQuote Missing Steps** — add 3 wizard step stories + container
2. **Issue #5: NotificationMessage Story** — cover all severity variants, dismiss, aria-live
3. **Issue #6: ErrorSummary Story** — server errors, WAF, Conflict, Unprocessable variants

**Acceptance Criteria for Phase 2:**

- [ ] AcceptQuote step 5 (final acceptance) has interactive story with play function
- [ ] NotificationMessage story plays without errors
- [ ] ErrorSummary renders all error type variants

---

### Phase 3: High-Priority Coverage (Days 5–6)

1. **Issue #7: InTextLink target Bug** — fix hardcoded '_blank', add tests
2. **Issue #8: BackToDashboardButton Story** — add basic + className variants
3. **Issue #10: Footer Modal Stories** — Terms, Privacy, Accessibility modals
4. **Issue #11: WizardForm Context Pattern** — refactor to use withPortalProviders
5. **Issue #12: Pagination Edge Cases** — first/last page, page text assertions

**Acceptance Criteria for Phase 3:**

- [ ] InTextLink can render same-tab links (target prop honored)
- [ ] BackToDashboardButton story renders with custom styles
- [ ] Footer modal stories all pass with open/close play functions
- [ ] Pagination stories assert "Page X of Y" text

---

### Phase 4: Medium-Priority Coverage (Days 7–8)

1. **Issue #13: FormBanner Story** — 3 button variants, callbacks
2. **Issue #14: AutoSuggest + AddressLookup Stories** — async loading, suggestions, fallback
3. **Issue #15: InstrumentItem Story** — tab navigation, actions menu

**Acceptance Criteria for Phase 4:**

- [ ] FormBanner plays with all 3 button variants
- [ ] AutoSuggest story simulates user typing, shows suggestions
- [ ] InstrumentItem story tabs navigate correctly

---

## Technical Constraints & Patterns

### Storybook Harness & Providers

- **Always use `withPortalProviders` decorator** for route-level stories and any story needing auth/router context
- Pattern: `export default { decorators: [withPortalProviders] }`
- This includes: router context, auth context, account state, modals, form providers
- See: `static/js/storybook/storybookHarness.tsx`

### MSW (Mock Service Worker)

- Global handlers: `static/js/storybook/msw-handlers.ts`
- Must export flat array or `{ handlers: [...] }` shape
- Story-level MSW: `parameters: { msw: { handlers: [...] } }`
- Endpoint fallback: use global handlers for API endpoints not explicitly mocked in story

### Story Structure

```typescript
// Template + args pattern (required for accessibility)
const meta: Meta<typeof Component> = {
  title: 'ComponentPath',
  component: Component,
  parameters: {
    // router entry if needed
    // msw handlers if needed
  },
  decorators: [withPortalProviders], // if using auth/router
};

export const Variant = {
  args: { /* props */ },
  play: async ({ canvasElement }) => {
    // interaction test with user event simulations
    // assertions on DOM state
  },
};
```

### Play Functions (Required for QA)

Every story should have a `play` function that:

1. Simulates user interaction (click, type, navigate)
2. Verifies DOM state changes (rendered text, class changes, disabled state)
3. Asserts accessibility (aria-live, role, aria-label)
4. Uses `within(canvasElement)` for root-scoped, `screen` for portal-rendered

Example:

```typescript
play: async ({ canvasElement }) => {
  const { getByRole, getByText } = within(canvasElement);
  const button = getByRole('button', { name: /submit/i });
  await userEvent.click(button);
  expect(getByText(/success/i)).toBeInTheDocument();
}
```

### Accessibility & a11y

- Every story with interactive elements must have a play function asserting accessibility
- Use `aria-live`, `role`, `aria-label` assertions where applicable
- color-contrast rule only a11y rule currently enabled in Storybook

### Console Errors

- No console errors, warnings (except known MSW logs), or unhandled rejections
- Run `npm run build-storybook` after each phase to verify

---

## Definitions of Done (Per Issue)

Each issue in `docs/sprint-1/github-issues.md` has a DoD checklist.  
**Issue is CLOSED_SUCCESS only when:**

- [ ] All DoD checkboxes checked
- [ ] Story file committed with play functions
- [ ] Unit tests added (if bug fix)
- [ ] No console errors in Storybook build
- [ ] QA agent has verified and signed off

---

## Tools & Commands

**Build Storybook:**

```bash
npm run build-storybook
```

**Run Storybook locally:**

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

---

## Communication Protocol

**Daily Standup:**

- Update `docs/sprint-1/progress.md` with:
  - Issues moved to IMPLEMENTING state
  - Blockers or questions
  - ETA for next phase

**When Stuck:**

- Post blocker in progress.md with error details
- Producer will triage and escalate to QA or infrastructure if needed

**Phase Completion:**

- Move all issues in phase to VERIFYING state
- Notify Producer when ready for QA handoff
- Producer will route to QA Agent for testing

---

## Next Steps

1. **Accept this handoff** — reply "ACCEPTED" or ask clarifying questions
2. **Triage Phase 1 issues** — estimate effort, flag any unknowns
3. **Start Phase 1 (Critical Infrastructure)** — begin with Issue #3 (MSW)
4. **Daily updates** to `docs/sprint-1/progress.md`

**Expected Timeline:** 8 days (4 phases × 2 days each)  
**QA Gate:** 100% test pass before merge

---

**Handoff Date:** 2026-05-20  
**Producer:** Remy  
**Status:** Awaiting Dev Agent acceptance
