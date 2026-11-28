# Verification Checklist — React 19 + TypeScript 6 + .NET 10 Migration

This file is the verification checklist for the frontend migration baseline
captured in:

- `.github/react19-ts6-dotnet10-audit.md`

Frontend source lives under `ClientApp/src`. Build, type-check and unit-test
gates run from the repository root (`npm run build` needs `VITE_ENVIRONMENT=Dev`
locally). .NET host validation (Phase 6) still has to be executed in the real
host repository. Items ticked below were verified on 2026-11-28; unticked items
are not yet verified.

## How To Use

- Run each check as PASS/FAIL.
- If a check fails, fix the code or document the blocker before closing the
  migration.
- Prefer verifying against source, build output, test output, and runtime
  behavior, not assumptions.

---

## Phase 1 — Source Migration Gates

### 1.1 React Root and Legacy API Removal

- [x] `createRoot` is used for app bootstrap; no `ReactDOM.render` remains in
      application source.
- [x] No `ReactDOM.hydrate` remains; if hydration exists, it uses the correct
      React 19 API.
- [x] No `unmountComponentAtNode` remains in application source.
- [x] No `findDOMNode` remains in application source.
- [x] No legacy class lifecycle methods remain: `componentWillMount`,
      `componentWillReceiveProps`, `componentWillUpdate`, `UNSAFE_*`.
- [x] No legacy context APIs remain: `contextTypes`, `childContextTypes`,
      `getChildContext`.
- [x] No string refs or `this.refs` remain.

### 1.2 React 19 Ref and Component Shape

- [x] No application code uses bare `useRef()` without an initializer.
- [x] `ClientApp/src/components/Utilities/mailingLabel.tsx` uses
      `useRef<HTMLDivElement | null>(null)` or an equivalent explicit nullable
      ref.
- [x] No live function-component `defaultProps` assignments remain.
- [x] Any `forwardRef` retained in source is intentional and verified as
      non-blocking (4 sites: `Actions/index.tsx` x2, `SearchField.tsx`,
      `CustomDateInput.tsx`).

### 1.3 Render Purity

- [ ] `dashboard` contains no state updates, notification writes, or context
      writes during render.
- [ ] `quotation` contains no state updates, notification writes, or context
      writes during render.
- [ ] All side effects previously executed in render have been moved into
      `useEffect` or equivalent lifecycle-safe paths.
- [ ] Existing class components, especially `ErrorBoundary`, remain React
      19-compatible and behave correctly after the migration.

---

## Phase 2 — Known Code Fix Gates

### 2.1 Notification and Accessibility Fixes

- [x] Notification selectors use `[id^="notif-"]`, not `[id^="#notif-"]` (fixed
      2026-11-28 in `routes/quotation/index.tsx`,
      `routes/common/helperFunctions.ts`; test id in `helperFunctions.test.ts`
      updated to `notif-test`).
- [ ] Alert scroll/focus behavior works in both `dashboard` and `quotation`.
- [ ] Accessible route announcements still fire correctly after navigation.

### 2.2 Loading and Async State

- [ ] `quotation` loading state is controlled only inside real async
      `try/finally` paths.
- [ ] No immediate `setIsLoading(true)` / `setIsLoading(false)` pairs remain
      around non-awaited work.
- [ ] Spinner behavior is stable during slow network simulation.

### 2.3 Timeout-Driven UI Flows

- [ ] Error summary scroll/focus still works after submit.
- [ ] Route accessibility announcement timing still works after navigation.
- [ ] Pagination resize behavior still works after viewport changes.
- [ ] Autosuggest open/close and keyboard navigation still work.
- [ ] Organisation lookup debounce and suggestion dismissal still work.
- [ ] Route-change scroll behavior still works.
- [x] Document and window event listeners used by resize and outside-click flows
      are not duplicated under `StrictMode` and are cleaned up correctly on
      unmount (`CommandPalette.tsx`, `useVisiblePageRange.tsx` and
      `appDetails.tsx` each remove their listener in the effect cleanup).
- [x] No `flushSync` has been added unless a concrete ordering bug required it
      (only a comment in `Tabs.stories.tsx`).

---

## Phase 3 — TypeScript 6 Gates

### 3.1 Compile-Time Checks

- [x] The project compiles successfully under TypeScript 6 (`typescript`
      `^6.0.3`; `npm run type-check` exits 0).
- [ ] No new `any` or broad cast-based workarounds were introduced just to make
      the migration compile.
- [x] Ref typings compile cleanly with strict nullability enabled.
- [x] Library type packages used by React, React Router, MSAL, React Hook Form,
      and React Bootstrap are compatible with the installed TypeScript version
      (implied by the passing type-check).

### 3.2 Config and Type Hygiene

- [ ] `tsconfig` is present and valid in the real repo.
- [ ] React JSX settings are valid for the upgraded toolchain.
- [ ] Path aliases and generated API client types still resolve correctly.
- [ ] No type regressions were introduced in touched files.

---

## Phase 4 — React 19 Runtime Gates

### 4.1 StrictMode

- [ ] The app runs under `StrictMode` without duplicate notification bugs.
- [ ] No render-phase warnings appear in the console.
- [ ] No deprecated React API warnings appear in the console during core flows.

### 4.2 Core User Flows

- [ ] Dashboard loads correctly.
- [ ] Quotation page loads correctly.
- [ ] Request-for-quote flows still function.
- [ ] Accept-quote flows still function.
- [ ] Sign-in and sign-out flows still function.
- [ ] Form validation, error summary focus, and notifications still behave
      correctly.

---

## Phase 5 — Test and Build Gates

### 5.1 Automated Verification

- [x] Dependency install succeeds with no unresolved peer dependency errors
      (`npm ls` exits 0).
- [x] Project build succeeds (`VITE_ENVIRONMENT=Dev npm run build`).
- [x] Test suite succeeds with zero failing tests (266 files, 3187 tests, 100%
      statements, branches, functions and lines).
- [x] Any React test helpers updated for React 19 semantics still pass.

### 5.2 Test Migration Specifics

- [x] No tests import `act` from `react-dom/test-utils`.
- [x] Tests use the correct React 19-compatible testing APIs.
- [x] Any previous `Simulate` usage has been migrated if applicable.
- [x] StrictMode-sensitive assertion counts were updated where needed (none
      required; the suite passes).

---

## Phase 6 — .NET 10 Host Integration Gates

These checks must be executed in the real host repository, not this snapshot.

- [ ] .NET 10 SDK and target framework are configured correctly.
- [ ] The ASP.NET Core hosting model is still valid under .NET 10 for this
      application.
- [ ] Frontend asset build integrates correctly with the .NET host pipeline.
- [ ] Authentication still works end-to-end through the host environment.
- [ ] SSR or prerender integration, if used by the host app, still works
      correctly after the upgrade.
- [ ] Static asset paths, cache behavior, and publish output are correct.
- [ ] Environment-specific configuration still resolves correctly after upgrade.
- [ ] CI/CD build and publish jobs succeed on the upgraded stack.

---

## Phase 7 — Final Closeout Gates

- [ ] All findings in `.github/react19-ts6-dotnet10-audit.md` are either fixed
      or explicitly dispositioned.
- [ ] No blocker remains for React 19 migration.
- [ ] No blocker remains for TypeScript 6 compilation.
- [ ] No blocker remains for .NET 10 host integration in the real repo.
- [ ] Remaining risks, if any, are documented separately and are not hidden as
      assumed passes.

## Verification Summary

Use this section when the checklist is executed.

| Phase                | Passed | Failed | Notes                                                                                |
| -------------------- | -----: | -----: | ------------------------------------------------------------------------------------ |
| 1 — Source Migration |    [ ] |    [ ] | 1.1, 1.2 pass; 1.3 render purity not yet verified                                    |
| 2 — Known Code Fixes |    [ ] |    [ ] | 2.1 selector fixed; 2.2 loading state and timeout flows (2.3) need interactive check |
| 3 — TypeScript 6     |    [ ] |    [ ] | Compiles; `any`/cast review and config hygiene (3.2) not yet verified                |
| 4 — React 19 Runtime |    [ ] |    [ ] | Not yet verified; needs browser run                                                  |
| 5 — Test and Build   |    [x] |    [ ] | Build, type-check, 3187 tests, 100% coverage                                         |
| 6 — .NET 10 Host     |    [ ] |    [ ] |                                                                                      |
| 7 — Final Closeout   |    [ ] |    [ ] |                                                                                      |

## Failed Checks Detail

- None open. The 2.1 notification selector failure was fixed on 2026-11-28.
