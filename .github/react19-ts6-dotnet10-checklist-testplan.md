# Unit Test Plan — Migration Verification Checklist

Target checklist:

- `.github/react19-ts6-dotnet10-verification-checklist.md`

Cross-check baseline:

- `.github/react19-ts6-dotnet10-audit.md`

## Purpose

This is a devil's-advocate test plan for the migration verification checklist. Its job is to prove that the checklist:

- passes when the migration is actually correct (`Green`)
- fails when known migration defects are present (`Red`)
- fails when a superficial or partial fix tries to sneak through (`Edge`)

This test plan treats the checklist as a verifier specification. The recommended implementation is a checklist-verifier test harness that runs against synthetic fixture repos and selected real-source snapshots.

## Cross-Check Summary

Audit finding to checklist coverage:

| Audit Finding | Checklist Coverage | Status |
| --- | --- | --- |
| Render-phase side effects in `dashboard` | Phase 1.3 | Covered |
| Render-phase side effects in `quotation` | Phase 1.3 | Covered |
| Broken notification selector | Phase 2.1 | Covered |
| `quotation` loading-state churn | Phase 2.2 | Covered |
| `useRef()` without initializer | Phase 1.2 | Covered |
| Timeout-driven flows | Phase 2.3 | Covered |
| Class component compatibility | Phase 1.3 | Added during cross-check |
| StrictMode listener duplication / cleanup | Phase 2.3 | Added during cross-check |
| .NET 10 hosting model | Phase 6 | Added during cross-check |
| SSR / prerender integration | Phase 6 | Added during cross-check |

No merged-audit blocker is currently uncovered by the checklist after the checklist update.

## Test Harness Strategy

Recommended structure:

- `tests/checklist-verifier/fixtures/green/*`
- `tests/checklist-verifier/fixtures/red/*`
- `tests/checklist-verifier/fixtures/edge/*`

Recommended verifier layers:

1. Static source verifier
   - AST or grep-backed checks for source migration rules
2. Type/build verifier
   - compile/build checks in isolated fixture repos
3. Runtime verifier
   - React test runner exercising StrictMode and user flows
4. Host verifier
   - .NET 10 integration fixture or contract tests in the real host repo

## Green Tests

These prove the checklist does not over-report when the migration is correct.

### G01 — Clean React 19 source fixture

- Goal: all Phase 1 source-migration checks pass.
- Fixture:
  - `createRoot`
  - no legacy APIs
  - `useRef<HTMLDivElement | null>(null)`
  - side effects moved to `useEffect`
- Expected:
  - Phase 1 passes
  - no false failures on `forwardRef` asset wrappers

### G02 — Clean notification and loading fixture

- Goal: all known-code-fix checks pass.
- Fixture:
  - `[id^="notif-"]` selector in both routes
  - `quotation` loading state only inside async `try/finally`
  - no render-time notification writes
- Expected:
  - Phase 2.1 and 2.2 pass

### G03 — Stable timeout behavior under StrictMode

- Goal: Phase 2.3 passes when behavior is correct.
- Fixture:
  - debounced input, resize listener, route announcement, and scroll/focus utilities
  - listener cleanup on unmount
- Expected:
  - no duplicated listener effects
  - no duplicate announcements
  - checklist passes runtime timing checks

### G04 — TypeScript 6 compile fixture

- Goal: Phase 3 passes on a strict TS6 repo.
- Fixture:
  - strict null checks
  - no broad casts added for migration
  - generated client imports resolve
- Expected:
  - compile and type hygiene checks pass

### G05 — .NET 10 host integration fixture

- Goal: Phase 6 passes in the real host repo.
- Fixture:
  - valid .NET 10 host
  - frontend assets publish correctly
  - auth works
  - SSR/prerender works if applicable
- Expected:
  - host integration checks pass

## Red Tests

These prove the checklist catches the exact blocker classes from the merged audit.

### R01 — Render-time side effect in `dashboard`

- Inject:
  - `setDashboardNotification(...)` directly in render
- Expected:
  - Phase 1.3 fails

### R02 — Render-time side effect in `quotation`

- Inject:
  - `setNoThirdPartyAccess(false)` or notification writes in render
- Expected:
  - Phase 1.3 fails

### R03 — Broken notification selector

- Inject:
  - `[id^="#notif-"]`
- Expected:
  - Phase 2.1 fails

### R04 — Bare `useRef()` ref

- Inject:
  - `const ref = useRef() as MutableRefObject<HTMLDivElement>;`
- Expected:
  - Phase 1.2 fails

### R05 — Loading flicker pattern

- Inject:
  - `setIsLoading(true); asyncCall(); setIsLoading(false);`
- Expected:
  - Phase 2.2 fails

### R06 — StrictMode listener duplication

- Inject:
  - event listener registration without stable cleanup
- Expected:
  - Phase 2.3 fails

### R07 — Legacy API regression

- Inject one of:
  - `ReactDOM.render`
  - `findDOMNode`
  - `componentWillReceiveProps`
  - `this.refs`
- Expected:
  - Phase 1.1 fails

### R08 — TypeScript 6 compatibility break

- Inject:
  - migration compiles only with `any` or unsafe casts
- Expected:
  - Phase 3 fails

### R09 — .NET 10 host regression

- Inject:
  - broken publish path or auth middleware mismatch
- Expected:
  - Phase 6 fails

## Edge / Devil's Advocate Tests

These are the important ones. They simulate fixes that look correct at a glance but should still fail.

### E01 — Selector fixed in one route only

- Inject:
  - `dashboard` uses `[id^="notif-"]`
  - `quotation` still uses `[id^="#notif-"]`
- Expected:
  - checklist fails Phase 2.1

### E02 — Side effect hidden behind helper call

- Inject:
  - render calls `emitForbiddenNotice()` and helper performs `setState`
- Expected:
  - Phase 1.3 still fails

### E03 — `useRef(null as any)` fake fix

- Inject:
  - `useRef(null as any)`
- Expected:
  - Phase 1.2 or Phase 3 fails because the fix is not type-tight

### E04 — Loading moved into helper but still not awaited

- Inject:
  - `startLoading(); fetchData(); stopLoading();`
- Expected:
  - Phase 2.2 fails

### E05 — Listener cleanup present but closure identity changes

- Inject:
  - add/remove listener use different function instances
- Expected:
  - Phase 2.3 fails

### E06 — Timeout flow passes once, fails under StrictMode remount

- Inject:
  - flow behaves in single mount but duplicates on remount
- Expected:
  - checklist runtime tests fail under StrictMode harness

### E07 — DefaultProps removed, but commented legacy code remains reactivated in another file

- Inject:
  - one clean component, one hidden live `Component.defaultProps = ...`
- Expected:
  - Phase 1.2 fails

### E08 — TS6 compile passes only with relaxed config

- Inject:
  - test repo compiles after turning off strictness
- Expected:
  - Phase 3 fails because strict-nullability and type hygiene gates are not satisfied

### E09 — .NET 10 works locally but publish output is wrong

- Inject:
  - local debug works
  - publish omits frontend asset path or static file mapping
- Expected:
  - Phase 6 fails

### E10 — SSR/prerender silently broken in host repo

- Inject:
  - CSR works
  - SSR/prerender path throws or renders blank content
- Expected:
  - Phase 6 fails

## Coverage Matrix

| Checklist Area | Green | Red | Edge |
| --- | --- | --- | --- |
| Phase 1.1 legacy API removal | G01 | R07 | E07 |
| Phase 1.2 ref/component shape | G01 | R04 | E03 |
| Phase 1.3 render purity | G01 | R01, R02 | E02 |
| Phase 2.1 selector/accessibility | G02 | R03 | E01 |
| Phase 2.2 loading/async state | G02 | R05 | E04 |
| Phase 2.3 timeout/listener flows | G03 | R06 | E05, E06 |
| Phase 3 TS6 gates | G04 | R08 | E08 |
| Phase 6 .NET 10 host gates | G05 | R09 | E09, E10 |

## Minimum Acceptance Criteria For The Verifier

- Every red test must fail the intended checklist phase.
- Every green test must pass without manual exception handling.
- Every edge test must fail unless the verifier is intentionally weakened.
- At least one test must run each runtime-sensitive path under `StrictMode`.
- At least one test must run the host validation in publish-like conditions, not only local debug.

## Recommended First Implementation Order

1. Static verifier fixtures for Phase 1 and Phase 2.
2. StrictMode runtime fixtures for timeout/listener/notification behavior.
3. TS6 compile fixtures.
4. Real-host .NET 10 integration fixtures.

## Outcome

If this plan is implemented and all tests behave as expected, the checklist is strong enough to serve as the basis for the migration plan. If any edge case passes unexpectedly, the checklist or verifier needs to be tightened before migration execution starts.
