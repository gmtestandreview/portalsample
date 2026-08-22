# Codebase Concerns

> **Migration-preparation reconciliation (2026-06-01):** This concerns register has been merged into `docs/change-record/MASTER-CHANGE-RECORD.md`, `docs/change-record/OPEN-ITEMS-BACKLOG.md`, `docs/migration/PRE-FLIGHT-CHECKLIST.md`, `docs/migration/MIGRATION-RUNBOOK.md`, `docs/superpowers/plans/2026-05-31-migration-preparation.md`, and both assessment HTML files. Items marked resolved below are closed in the Master Change Record. Items that still require action or a product/team decision are tracked in the Open Items Backlog.

## Migration Reconciliation Summary

| Concern group | Current disposition | Migration target |
|---|---|---|
| ErrorBoundary class component, `React.Children.toArray`, `env.ts` config typing, dashboard debounce | CLOSED | Master Change Record |
| Provider-level ErrorBoundary and Trusted Types gaps | CLOSED | Master Change Record CRD-006 and CRD-007 |
| `checkAcceptedQuoteStatus` client-side workaround | OPEN, non-blocking | Open Items Backlog `API-WORKAROUND-001` |
| `UnsavedFormPrompt` browser refresh protection | OPEN, non-blocking | Open Items Backlog `FORM-GUARD-001` |
| Session-storage magic strings / dashboard workaround keys | OPEN, non-blocking | Open Items Backlog `SESSION-KEYS-001` |
| MSAL logging visibility and production MSAL version | OPEN decision | Open Items Backlog `AUTH-OPS-001` and `AUTH-OPS-002` |
| Phone/postcode validation edge-case questions | OPEN decision | Open Items Backlog `VALIDATION-001` and `VALIDATION-002` |
| Bootstrap/design-system replacement question | OPEN, Batch E blocker | Open Items Backlog Priority 2 design-platform inputs |

## 1) Top Risks (Prioritised)

| Severity | Concern | Evidence | Impact | Suggested action |
|----------|---------|----------|--------|------------------|
| **✅ RESOLVED** | `ErrorBoundary` was a class component | `ClientApp/src/components/ErrorBoundary/index.tsx` | ~~Hard blocker for React 19 adoption~~ — replaced with functional component using `react-error-boundary` (Phase 4.1) | Done |
| **✅ RESOLVED** | `React.Children.toArray` was a Legacy API | `ClientApp/src/components/forms/WizardForm/index.tsx` | ~~High migration risk~~ — replaced with `React.Children.forEach` + array accumulator (Phase 4.2) | Done |
| **✅ RESOLVED** | `any` casts in `env.ts` hid config failures | `ClientApp/src/env.ts` | ~~Silent undefined on injection failure~~ — `declare global` + `globalThis` + `console.error` startup guard added (Phase 4.3) | Done |
| **✅ RESOLVED** | Dashboard `useEffect` lacked debounce for search | `ClientApp/src/routes/dashboard/index.tsx` | ~~Every keystroke triggered a full API call~~ — `useDebounce` (300ms) + `AbortController` cleanup added (Phase 4.4) | Done |
| **Med** | `checkAcceptedQuoteStatus` — client-side status mutation | `ClientApp/src/routes/dashboard/index.tsx:212-238` | Masks a known API eventual-consistency bug (Azure board #489452); a future API fix or timing change could cause double-mutation or stale display | Fix at API level; remove workaround when API is consistent; log the session storage key centrally |
| **Med** | No error boundary at provider level | `ClientApp/src/index.tsx:16-23` | An unhandled exception inside `AccountProvider` or `MsalProvider` unmounts the entire app with no fallback UI | Wrap `<AccountProvider>` with its own `<ErrorBoundary>` |
| **Low** | TrustedTypes `createHTML`/`createScript` commented out | `ClientApp/src/trustedtypes.ts:11-17` | HTML and script injection vectors are not sanitised via TrustedTypes | Implement `createHTML` using DOMPurify; add `createScript` sanitisation |

---

## 2) Technical Debt

| Debt item | Why it exists | Where | Risk if ignored | Suggested fix |
|-----------|---------------|-------|-----------------|---------------|
| Inline `// TS` deferred-engineering comments | Time-boxed feature development | `ClientApp/src/routes/dashboard/index.tsx` (4+ instances) | Signals deferred decisions that can become bugs | Review and action each comment; move to issue tracker |
| `window.onbeforeunload` commented out in `UnsavedFormPrompt` | `// stopped working correctly and we couldn't find the culprit` | `ClientApp/src/components/forms/UnsavedFormPrompt/index.tsx:7-12` | Users can lose form data on browser refresh/tab close | Investigate root cause; re-enable or use `beforeunload` event listener |
| Magic strings for session storage keys | Ad-hoc implementation | `ClientApp/src/routes/dashboard/index.tsx` — `'accepted-quote-id'`, `'view-quote-id'` | Key collisions; hard to audit cross-page state | Extract to a `SessionKeys` enum in `storage/` |

---

## 3) Security Concerns

| Risk | OWASP category | Evidence | Current mitigation | Gap |
|------|---------------|----------|--------------------|-----|
| XSS via unmitigated HTML injection | A03 Injection | `ClientApp/src/trustedtypes.ts:11-17` | TrustedTypes `createScriptURL` uses DOMPurify | `createHTML` + `createScript` callbacks commented out with TODO |
| MSAL auth events not logged | A09 Security Logging | `ClientApp/src/authentication/authConfig.ts:22-30` | Error-level MSAL logs active | Info/verbose/warning MSAL logs commented out; auth events are invisible below error threshold |
| Phone validator accepts inconsistent spacing | A03 Injection (input validation) | `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts:432-443` | Regex validates AU phone format | Regex matches spaced variants but does not normalise before regex; `'0400000000'` and `'0400 000 000'` both pass; `' 0400 000 000'` (leading space) may fail unexpectedly |
| `env.ts` config loaded without validation | A05 Security Misconfiguration | `ClientApp/src/env.ts` | `declare global` + `globalThis` pattern | Fixed — `declare global` + `globalThis` + `console.error` startup guard added (Phase 4.3) |
| Access tokens acquired per call (correct) | — | `ClientApp/src/routes/dashboard/index.tsx:349-352` | Silent token renewal via MSAL | No gap — this is correct usage |

---

## 4) Performance and Scaling Concerns

| Concern | Evidence | Current symptom | Scaling risk | Suggested improvement |
|---------|----------|-----------------|--------------|----------------------|
| ~~Dashboard refetches on every `initialFilters` change — including every search keystroke~~ | `ClientApp/src/routes/dashboard/index.tsx` | ~~Every filter change and every typed character triggered a full API call~~ — **RESOLVED (Phase 4.4)**: `useDebounce` (300ms) + `AbortController` cleanup added | — | Done |
| `DashboardClient` instantiated inside `useEffect` | `ClientApp/src/routes/dashboard/index.tsx:349` | New client object per request | Minor per-call object allocation overhead | Move client creation outside the effect or memoize with `useMemo` |
| `AccountContext` mutators on one context — partially resolved | `ClientApp/src/authentication/accountContext.tsx` | Any state mutation re-renders all consumers | With React 19 concurrent rendering, contention increases | Partially resolved — `AccountStateCtx`/`AccountDispatchCtx` split implemented (Phase 5.1); modal flags extracted to `ModalContext` (Phase 5.2). Remaining dispatch mutators (7) are still on one dispatch context. |
| `handleAlertScroll` uses `setTimeout + querySelector` | `ClientApp/src/routes/dashboard/index.tsx:97-104` | Fragile selector `[id^="#notif-"]` on timeout | Will silently fail if DOM isn't ready | Use `useRef` + `scrollIntoView` in a `useEffect` |
| No pagination cache | `ClientApp/src/routes/dashboard/index.tsx` | Navigating back to a page re-fetches data | Grows worse as page counts increase | Cache page results in a `useRef` or `React Query` with stale-while-revalidate |

---

## 5) Fragile / High-Churn Areas

| Area | Why fragile | Churn signal | Safe change strategy |
|------|-------------|-------------|----------------------|
| `ClientApp/src/api/web-api-client.ts` | Auto-generated; hand-editing is immediately overwritten on next regeneration | Backend OpenAPI schema changes | Never edit manually; track schema version; run NSwag codegen in CI |
| `ClientApp/src/routes/dashboard/index.tsx` | 776-line monolith with 10+ concerns: API, state, UI, notifications, modals | 4+ inline `// TS` TODOs | Extract tab content, API calls, and notification logic into dedicated hooks and sub-components |
| `ClientApp/src/components/forms/WizardForm/` | Central form engine; changes affect all wizard flows (account, RFQ, accept-quote) | `WizardRoutedStepProps` has 20+ fields | Add targeted unit tests around navigation and submit contracts before any change; document the `allSteps` + `currentStepIndex` contract |
| `ClientApp/src/authentication/accountContext.tsx` | Changing `AccountStateContext` or `AccountDispatchContext` breaks all consumers — state/dispatch split (Phase 5.1) reduces blast radius by limiting which consumers need updating | Any new auth state requirement touches this file + `AccountProvider` | Add interface tests that enumerate all exported methods; use `as const` for mutation method names |
| `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts` | Any change to a validator affects every form that uses it | Phone and postcode validators have AU-specific business rules | Unit test every validator before and after changes; use the current unit-test workflow in `TESTING.md` rather than relying on ad hoc browser checks |

---

## 6) Open Questions

1. **[ASK USER]** Is there a backend API versioning strategy? When `web-api-client.ts` is regenerated for .NET 10, will the DTOs change significantly (e.g., new required fields, renamed properties)?
2. **[ASK USER]** The `REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY` env var appears alongside the newer connection string. Is the instrumentation key still required, or can it be removed?
3. **[ASK USER]** The postcode validator accepts numeric ranges 200–299 and 800–9999 (via `parseInt(postcode, 10)`, so `'0200'` → 200 passes; `'0800'` → 800 passes). The numeric gap 300–799 is excluded — are there valid NMI customer postcodes in this range (e.g., some PO Box or delivery point codes)?
4. **[ASK USER]** The `UnsavedFormPrompt` `window.onbeforeunload` was commented out. Is there a ticket tracking re-investigation of browser reload protection?
5. **[ASK USER]** Which version of MSAL (`@azure/msal-browser`) is in production? MSAL v3 has breaking changes from v2 that affect token caching and redirect handling.
6. **[ASK USER]** The new Design System platform — what component library will replace Bootstrap 5? This will be the largest visual migration surface.

---

## 7) Evidence

- `ClientApp/src/components/ErrorBoundary/index.tsx` — functional boundary using `react-error-boundary` (Phase 4.1)
- `ClientApp/src/components/forms/WizardForm/index.tsx` — `React.Children.forEach` accumulator (Phase 4.2)
- `ClientApp/src/routes/dashboard/index.tsx` — complexity hotspot, workaround comments; debounce + AbortController (Phase 4.4)
- `ClientApp/src/trustedtypes.ts` — incomplete TrustedTypes coverage
- `ClientApp/src/env.ts` — `declare global` + `globalThis` + startup guard (Phase 4.3)
- `ClientApp/src/authentication/authConfig.ts` — MSAL logging gaps
- `ClientApp/src/authentication/accountContext.tsx` — `AccountStateCtx` / `AccountDispatchCtx` split (Phase 5.1)
- `ClientApp/src/components/modals/ModalContext.tsx` — `ModalStateCtx` / `ModalDispatchCtx` + hooks (Phase 5.2)
- `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts` — postcode range
