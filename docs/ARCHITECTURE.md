# Architecture

> **Verified against code 2026-09-01.** Provider order in §2 and §5 was corrected — the previous
> revision showed `MsalProvider` outermost with `StrictMode` inside `AccountProvider`, and omitted
> the provider-level `ErrorBoundary` entirely (contradicting its own §6 item 7). Route-coverage
> exclusions were corrected from six to zero. Counts in §6 were refreshed. See
> [`precondition-redirect-matrix.md`](architecture/precondition-redirect-matrix.md) for the
> `PreConditions` contract, which this document previously referenced but never specified.

## 1) Architectural Style

- **Primary style**: Feature-based layered SPA (Single Page Application)
- **Why**: All rendering is client-side; routing is handled by React Router v7 in the browser; the server's only role is to deliver the bundle and inject runtime config via `window.*` globals.
- **Primary constraints**:
  1. All authenticated routes are gate-kept by `<AuthenticatedElement>` — no route renders without MSAL confirming auth.
  2. Config is runtime-injected via `window.*`, not baked into the bundle — the same build artifact runs across environments.
  3. Multi-step workflows (account, RFQ, accept-quote, and pattern/type approval) use a single `WizardForm` engine rather than ad-hoc per-flow implementations.
  4. `ClientApp/src/App.tsx` is the canonical inventory for all 41 registered paths. Every one of the 41 now carries executable coverage in `tests/e2e/route-coverage.ts` — 25 `app-bdd` and 16 `storybook-bdd`, with **no reviewed exclusions remaining**. The six pattern/type approval paths that were previously excluded are now covered by `app-bdd` scenarios in `tests/e2e/features/@type-approval/type-approval.feature`.

## 2) System Flow

```
Browser load
  ↓
window.* env injection  (server-side template sets REACT_APP_B2C_CLIENTID etc.)
  ↓
ClientApp/src/index.tsx
  ├─ await PublicClientApplication.createPublicClientApplication(configuration)   ← line 16, top-level await
  ├─ TrustedTypes.createTrustedTypePolicy()   ← DOMPurify CSP guard, before render
  └─ createRoot(rootElement).render(
       <StrictMode>                           ← OUTERMOST: dev checks cover MSAL + account providers
         <ErrorBoundary appInsights={...}>    ← provider-level; reports from commit phase
           <MsalProvider instance={pca}>      ← Azure AD B2C session
             <AccountProvider>                ← User profile + org state (AccountContext — state only)
               <RouterProvider router={App} />  ← React Router v7
             </AccountProvider>
           </MsalProvider>
         </ErrorBoundary>
       </StrictMode>
     )
  ↓
Route match → App.tsx (createBrowserRouter; 41 registered paths)
  ↓
AuthenticatedElement (per protected route) — nested, not sibling:
  PreConditions                       → redirect gate + modal orchestration
    └─ MsalAuthenticationTemplate     → triggers B2C redirect if not authenticated
         └─ ErrorBoundary (appInsights) → catches + reports unhandled errors
              ↓
              Route component (e.g. Dashboard, RequestForQuote, DashboardTA)
         ├─ useAccountState() / useAccountDispatch()  → read/mutate AccountContext state
         ├─ useModalState() / useModalDispatch()    → read/mutate modal visibility state
         ├─ acquireTokenSilent()   → get fresh access token
         ├─ client.setAuthToken()  → inject bearer token
         └─ DashboardClient / *Client  → NSwag-generated typed API calls
              ↓
         WizardForm (for multi-step flows)
           └─ WizardStep × N → each step is a <Route> inside WizardForm
                └─ FormikForm → form state, Yup validation, save/next/exit
```

## 3) Layer / Module Responsibilities

| Layer | Owns | Must not own | Evidence |
| --- | --- | --- | --- |
| `routes/` | Page-level orchestration, API calls, business state, `useEffect` data loading | Reusable UI primitives, auth logic | `routes/dashboard/index.tsx` |
| `components/forms/` | Multi-step form engine, Formik wrappers, validation summary, navigation guards | Direct API calls, business rules | `components/forms/WizardForm/` |
| `components/` (other) | Reusable UI: inputs, layout, modals, tiles | Business logic, direct API calls | `components/Layout/`, `components/Inputs/` |
| `authentication/` | MSAL config, AccountContext state + mutations, auth guard, hooks | Business domain logic, API calls | `authentication/authConfig.ts`, `authentication/accountContext.tsx` |
| `api/` | Typed HTTP client contracts + bearer token header injection | State management, UI | `api/web-api-client.ts` |
| `validationSchemas/` | Yup schema definitions + 19 custom string validators | API calls, React state | `validationSchemas/yupExtensions/stringExtensions.ts` |
| `storage/` | Typed sessionStorage wrappers for cross-page state | Business logic, UI rendering | `storage/sessionStorageCache.ts` |
| `instrumentation/` | App Insights singleton, structured logging | UI, routing | `instrumentation/AppInsightsService.ts` |
| `utils/` | Pure utility functions (date, string, bytes, currency) | Side effects, state | `utils/index.ts` |

## 4) Reused Patterns

| Pattern | Where | Why |
|---------|-------|-----|
| **Compound component** | `WizardForm` + `WizardStep` | Exposes a clean JSX API for multi-step forms while keeping step-routing and lifecycle internal. `WizardForm` reads `children`, validates they are `WizardStep` elements, and converts each to a `<Route>`. |
| **Context + hook** | `AccountStateCtx` / `AccountDispatchCtx` + `useAccountState()` / `useAccountDispatch()` in `authentication/hooks.tsx` | Prevents direct context imports; splits read from write so components that only consume state do not re-render on dispatch mutations and vice versa. `ModalStateCtx` / `ModalDispatchCtx` + `useModalState()` / `useModalDispatch()` in `components/modals/ModalContext.tsx` isolate modal visibility state from user profile state. |
| **Module augmentation** | `yupExtensions/stringExtensions.ts` — `declare module 'yup'` | Adds 19 custom validators to `Yup.StringSchema` without forking the library. **Side-effect import required** in any file that calls them. |
| **Singleton** | `AppInsightsService.ts` — `createTelemetryService()` called once at module evaluation time | Single App Insights + ReactPlugin instance shared across the app. |
| **HOC / Render guard** | `AuthenticatedElement` wrapping every protected route in `App.tsx` | Centralises MSAL redirect, PreConditions gate, and ErrorBoundary into one composable boundary. |
| **Error boundary** | `ErrorBoundary` (functional component using `react-error-boundary`) wrapping every `AuthenticatedElement` | Route-level isolation: an unhandled exception in one route does not crash sibling routes. Uses `<ReactErrorBoundary FallbackComponent={ErrorFallback} onError={...}>` — no longer a class component. |
| **Session storage facade** | `SessionStorageCache()` in `storage/sessionStorageCache.ts` | Typed, JSON-serializing wrapper over `window.sessionStorage` — prevents raw `localStorage`/`sessionStorage` calls scattered through the codebase. |
| **Runtime env injection** | `env.ts` reading `window.*` globals | Allows the same webpack bundle to run across dev/staging/prod without rebuilding; environment config is injected server-side into the HTML template. |

### Runtime contracts reference

For implementation-level contracts that are easy to miss in code review, see:

- `docs/architecture/runtime-contracts.md`

This includes:

- `WizardRoutedStep` hard/soft validation behavior (`validateHard` vs `validateSoft`)
- Yup custom validator side-effect import requirements
- Current `acquireTokenSilent` route pattern (`tokenRequest` + `accounts[0]`)
- PreConditions redirect state machine flow
- Dual webpack/Vite rationale and divergence checkpoints

## 5) Key Component Relationships

Provider chain (`index.tsx:25-33`) — `StrictMode` is outermost:

```
index.tsx
  └─ StrictMode
       └─ ErrorBoundary (provider-level, react-error-boundary)
            └─ MsalProvider
                 └─ AccountProvider  (AccountContext)
                      └─ RouterProvider (App.tsx)
```

Route tree hanging off `RouterProvider`:

```
            RouterProvider (App.tsx)
                 └─ Route /dashboard
                      └─ AuthenticatedElement
                           └─ PreConditions (provides ModalStateCtx + ModalDispatchCtx)
                                └─ MsalAuthenticationTemplate
                                     └─ ErrorBoundary (route-level)
                                          └─ Dashboard
                                               ├─ useAccountState() / useAccountDispatch()
                                               ├─ useModalState() / useModalDispatch()
                                               ├─ DashboardClient (acquireTokenSilent)
                                               ├─ SearchFilter
                                               ├─ RequestItem / InstrumentItem
                                               └─ CustomPagination

                 ├─ Route /request-for-quote/:id/*
                      └─ AuthenticatedElement (displayHeaderAndFooter=false)
                           └─ ErrorBoundary
                                └─ RequestForQuote
                                     └─ WizardForm
                                          ├─ WizardStep (Step 1 — instruments)
                                          │    └─ FormikForm → Yup schema → UnsavedFormPrompt
                                          ├─ WizardStep (Step 2 — organisation)
                                          └─ WizardStep (Step N — summary)

                 ├─ Route /dashboard-ta
                 │    └─ AuthenticatedElement
                 │         └─ DashboardTA
                 │              ├─ PatternApprovalClient
                 │              ├─ PaSearchFilter / PaFilterMenu
                 │              ├─ PaRequestItem
                 │              └─ Pagination + pathway cards
                 │
                 ├─ Route /ta/:id/*
                 │    └─ AuthenticatedElement (displayHeaderAndFooter=false)
                 │         └─ ApplicationForTypeApproval
                 │              └─ WizardForm
                 │                   ├─ OrganisationAndContact
                 │                   ├─ ApplicationAndInstrument
                 │                   ├─ SupportingDocuments + upload progress
                 │                   └─ SummaryAndSubmit
                 │
                 └─ Route /ta/:id/manage
                      └─ AuthenticatedElement
                           └─ AppDetails
                                ├─ Application details
                                ├─ Application documents
                                └─ Application messages
```

## 6) Known Architectural Risks

1. ~~**`ErrorBoundary` is a class component**~~ — **RESOLVED (Phase 4.1)**: `ErrorBoundary` is now a functional component using `react-error-boundary`. This migration blocker for React 19 has been removed.
2. ~~**`React.Children.toArray` in `WizardForm/index.tsx:27`**~~ — **RESOLVED (Phase 4.2)**: Replaced with `React.Children.forEach` + array accumulator. Legacy API usage removed.
3. ~~**`AccountContext` re-renders**~~ — **RESOLVED (Phase 5.1)**: Context split into `AccountStateCtx` / `AccountDispatchCtx`. All 7 dispatch callbacks converted to functional updater form (`setAccountDetails(prev => ...)`) with `[]` dep arrays — `dispatchValue` is permanently stable after mount. Components subscribing only to dispatch never re-render due to state changes.
4. ~~**Dashboard `useEffect` dependency array**~~ — **RESOLVED (Phase 4.4)**: `AbortController` cleanup added for in-flight request cancellation; `useDebounce` (300ms) added on search text input.
5. **Top-level `await` in `index.tsx:16`** — `await PublicClientApplication.createPublicClientApplication(...)` requires bundler + browser support for top-level await. Enabled here by `experiments.topLevelAwait: true` in `webpack.config.js`; a Vite/Rollup target needs an equivalently modern build target. Still open.
6. ~~**`any` casts in `env.ts`**~~ — **RESOLVED (Phase 4.3)**: All 11 config vars now use `declare global { var VAR_NAME: string | undefined; }` + `globalThis.VAR_NAME ?? ''`. A `requiredVars.forEach` startup guard calls `console.error` for any missing vars.
7. ~~**No error boundary at provider level**~~ — **RESOLVED (Phase G)**: the outer `ErrorBoundary` now wraps `MsalProvider` and `AccountProvider` in `index.tsx`.
8. **Distributed token acquisition** — route and prop modules still construct generated clients and call `acquireTokenSilent()` independently: **81 call sites across 52 files**, with **92** `setAuthToken` sites. Preserve the current token/account selection contract (`{ ...tokenRequest, account: accounts[0] }`) during migration; centralisation remains deferred per `docs/adr/2026-05-30-acquire-token-silent-interceptor.md`. **Note that ADR undercounts the sites as "35+".**

    **No interaction-required fallback exists.** `InteractionRequiredAuthError`, `acquireTokenRedirect` and `acquireTokenPopup` appear **zero** times in first-party source. A failed silent acquisition falls into each call site's generic `catch`, so an expired session is surfaced to the user as a load/server error with no re-authentication path. The ADR describes this handling as "inconsistent"; it is absent.
9. ~~**Pattern/type approval browser fixtures (`TYPE-APPROVAL-E2E-001`)**~~ — **RESOLVED**: the six Type Approval paths now carry `app-bdd` coverage via `tests/e2e/features/@type-approval/type-approval.feature`. `tests/e2e/route-coverage.ts` holds **41 entries — 25 `app-bdd`, 16 `storybook-bdd`, 0 excluded**. The `excluded` variant remains in the type union but is unused.
10. **Unit coverage (`COVERAGE-GATE-001`)** — the last recorded run (2026-06-28) failed the configured 100% thresholds at 74.43% statements, 75.51% branches, 72.56% functions, and 74.92% lines. **That figure is stale — it was measured against 114 test files. Re-run 2026-09-01: 163 files / 1,734 tests, all passing.** The coverage percentage itself has not been re-measured. This is a migration pre-flight gate rather than an architectural defect, but it limits confidence in the Type Approval and supporting component surfaces.

    Part of the gap is artificial: **11 React Aria component families are unreferenced anywhere in `ClientApp/src`** (`ColorArea`, `ColorField`, `ColorPicker`, `ColorSlider`, `ColorSwatch`, `ColorThumb`, `ColorWheel`, `Calendar`, `CommandPalette`, `Disclosure`, `DisclosureGroup`, `DropZone`), as is `components/AriaComponents/`. They sit inside the coverage denominator while being scaffold code the portal never renders. Retiring them changes the percentage without changing risk.

11. **`PreConditions` redirect contract** — four interacting boolean predicates over account state gate 35 of the 41 routes. Now specified in [`architecture/precondition-redirect-matrix.md`](architecture/precondition-redirect-matrix.md), which records four behaviours that must be reproduced or changed deliberately, including a state where a user with no organisation is redirected to contact creation rather than account creation.

## 7) Evidence

- `ClientApp/src/index.tsx` — bootstrap + provider hierarchy
- `ClientApp/src/App.tsx` — complete route tree with auth guard usage
- `ClientApp/src/authentication/AuthenticatedElement.tsx` — auth guard composition
- `ClientApp/src/authentication/accountContext.tsx` — AccountStateContext / AccountDispatchContext split
- `ClientApp/src/authentication/hooks.tsx` — useAccountState() / useAccountDispatch() hooks
- `ClientApp/src/components/modals/ModalContext.tsx` — ModalStateCtx / ModalDispatchCtx + useModalState() / useModalDispatch()
- `ClientApp/src/components/forms/WizardForm/index.tsx` — compound component pattern
- `ClientApp/src/components/forms/FormikForm/index.tsx` — hard/soft validator dispatch contract
- `ClientApp/src/instrumentation/AppInsightsService.ts` — telemetry singleton
- `ClientApp/src/routes/preConditions/PreConditions.tsx` — redirect + modal state machine implementation
- `ClientApp/src/routes/dashboard/dashboard-ta.tsx` — pattern/type approval dashboard orchestration
- `ClientApp/src/routes/ta/index.tsx` — pattern/type approval wizard and upload-progress orchestration
- `ClientApp/src/routes/ta/manage/appDetails.tsx` — pattern/type approval management tabs
- `tests/e2e/route-coverage.ts` — executable route coverage and reviewed exclusions
- `docs/architecture/runtime-contracts.md` — cross-cutting runtime contracts
