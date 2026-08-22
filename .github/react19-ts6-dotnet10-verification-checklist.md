# Verification Checklist — React 19 + TypeScript 6 + .NET 10 Migration

This file is the verification checklist for the frontend migration baseline captured in:

- `.github/react19-ts6-dotnet10-audit.md`

Use it after migration changes are implemented in the real application repository. This snapshot cannot satisfy build, test, typecheck, or .NET host validation gates on its own.

## How To Use

- Run each check as PASS/FAIL.
- If a check fails, fix the code or document the blocker before closing the migration.
- Prefer verifying against source, build output, test output, and runtime behavior, not assumptions.

---

## Phase 1 — Source Migration Gates

### 1.1 React Root and Legacy API Removal

- [ ] `createRoot` is used for app bootstrap; no `ReactDOM.render` remains in application source.
- [ ] No `ReactDOM.hydrate` remains; if hydration exists, it uses the correct React 19 API.
- [ ] No `unmountComponentAtNode` remains in application source.
- [ ] No `findDOMNode` remains in application source.
- [ ] No legacy class lifecycle methods remain: `componentWillMount`, `componentWillReceiveProps`, `componentWillUpdate`, `UNSAFE_*`.
- [ ] No legacy context APIs remain: `contextTypes`, `childContextTypes`, `getChildContext`.
- [ ] No string refs or `this.refs` remain.

### 1.2 React 19 Ref and Component Shape

- [ ] No application code uses bare `useRef()` without an initializer.
- [ ] `static/js/components/Utilities/mailingLabel.tsx` uses `useRef<HTMLDivElement | null>(null)` or an equivalent explicit nullable ref.
- [ ] No live function-component `defaultProps` assignments remain.
- [ ] Any `forwardRef` retained in source is intentional and verified as non-blocking.

### 1.3 Render Purity

- [ ] `dashboard` contains no state updates, notification writes, or context writes during render.
- [ ] `quotation` contains no state updates, notification writes, or context writes during render.
- [ ] All side effects previously executed in render have been moved into `useEffect` or equivalent lifecycle-safe paths.
- [ ] Existing class components, especially `ErrorBoundary`, remain React 19-compatible and behave correctly after the migration.

---

## Phase 2 — Known Code Fix Gates

### 2.1 Notification and Accessibility Fixes

- [ ] Notification selectors use `[id^="notif-"]`, not `[id^="#notif-"]`.
- [ ] Alert scroll/focus behavior works in both `dashboard` and `quotation`.
- [ ] Accessible route announcements still fire correctly after navigation.

### 2.2 Loading and Async State

- [ ] `quotation` loading state is controlled only inside real async `try/finally` paths.
- [ ] No immediate `setIsLoading(true)` / `setIsLoading(false)` pairs remain around non-awaited work.
- [ ] Spinner behavior is stable during slow network simulation.

### 2.3 Timeout-Driven UI Flows

- [ ] Error summary scroll/focus still works after submit.
- [ ] Route accessibility announcement timing still works after navigation.
- [ ] Pagination resize behavior still works after viewport changes.
- [ ] Autosuggest open/close and keyboard navigation still work.
- [ ] Organisation lookup debounce and suggestion dismissal still work.
- [ ] Route-change scroll behavior still works.
- [ ] Document and window event listeners used by resize and outside-click flows are not duplicated under `StrictMode` and are cleaned up correctly on unmount.
- [ ] No `flushSync` has been added unless a concrete ordering bug required it.

---

## Phase 3 — TypeScript 6 Gates

### 3.1 Compile-Time Checks

- [ ] The project compiles successfully under TypeScript 6.
- [ ] No new `any` or broad cast-based workarounds were introduced just to make the migration compile.
- [ ] Ref typings compile cleanly with strict nullability enabled.
- [ ] Library type packages used by React, React Router, MSAL, Formik, and React Bootstrap are compatible with the installed TypeScript version.

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
- [ ] Form validation, error summary focus, and notifications still behave correctly.

---

## Phase 5 — Test and Build Gates

### 5.1 Automated Verification

- [ ] Dependency install succeeds with no unresolved peer dependency errors.
- [ ] Project build succeeds.
- [ ] Test suite succeeds with zero failing tests.
- [ ] Any React test helpers updated for React 19 semantics still pass.

### 5.2 Test Migration Specifics

- [ ] No tests import `act` from `react-dom/test-utils`.
- [ ] Tests use the correct React 19-compatible testing APIs.
- [ ] Any previous `Simulate` usage has been migrated if applicable.
- [ ] StrictMode-sensitive assertion counts were updated where needed.

---

## Phase 6 — .NET 10 Host Integration Gates

These checks must be executed in the real host repository, not this snapshot.

- [ ] .NET 10 SDK and target framework are configured correctly.
- [ ] The ASP.NET Core hosting model is still valid under .NET 10 for this application.
- [ ] Frontend asset build integrates correctly with the .NET host pipeline.
- [ ] Authentication still works end-to-end through the host environment.
- [ ] SSR or prerender integration, if used by the host app, still works correctly after the upgrade.
- [ ] Static asset paths, cache behavior, and publish output are correct.
- [ ] Environment-specific configuration still resolves correctly after upgrade.
- [ ] CI/CD build and publish jobs succeed on the upgraded stack.

---

## Phase 7 — Final Closeout Gates

- [ ] All findings in `.github/react19-ts6-dotnet10-audit.md` are either fixed or explicitly dispositioned.
- [ ] No blocker remains for React 19 migration.
- [ ] No blocker remains for TypeScript 6 compilation.
- [ ] No blocker remains for .NET 10 host integration in the real repo.
- [ ] Remaining risks, if any, are documented separately and are not hidden as assumed passes.

## Verification Summary

Use this section when the checklist is executed.

| Phase | Passed | Failed | Notes |
| --- | ---: | ---: | --- |
| 1 — Source Migration | [ ] | [ ] | |
| 2 — Known Code Fixes | [ ] | [ ] | |
| 3 — TypeScript 6 | [ ] | [ ] | |
| 4 — React 19 Runtime | [ ] | [ ] | |
| 5 — Test and Build | [ ] | [ ] | |
| 6 — .NET 10 Host | [ ] | [ ] | |
| 7 — Final Closeout | [ ] | [ ] | |

## Failed Checks Detail

- Check:
  File/Area:
  Failure:
  Required Fix:
