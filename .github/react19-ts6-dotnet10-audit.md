# React 19 + TypeScript 6 + .NET 10 Migration Audit

Date: 2026-11-28 Scope: `ClientApp/src/**` editable frontend source Source
reports:

- `.github/react19-audit.md`
- `.github/react19-ts6-dotnet10-verification-checklist.md`

This replaces the 2026-05-17 baseline, which described a `static/js` snapshot
with no runnable tooling. This repository now has a root `package.json`,
lockfile, `tsconfig`, and working validation scripts.

## Purpose

Migration baseline and closeout record for a target environment of:

- React 19
- TypeScript 6
- .NET 10 (host repository, out of scope here)

## Verified Status

| Gate                  | Result | Evidence                                                               |
| --------------------- | ------ | ---------------------------------------------------------------------- |
| React version         | Pass   | `react` and `react-dom` 19.3.1; `@testing-library/react` ^16.3.3       |
| TypeScript            | Pass   | `typescript` ^6.0.3; `npm run type-check` exits 0                      |
| Build                 | Pass   | `VITE_ENVIRONMENT=Dev npm run build` exits 0                           |
| Peer dependencies     | Pass   | `npm ls` reports no peer, invalid or unmet problems                    |
| Unit tests + coverage | Pass   | 266 files, 3187 tests; 100% statements, branches, functions and lines  |
| Deprecated React APIs | Pass   | 0 hits in `ClientApp/src` and `tests` (see `.github/react19-audit.md`) |
| .NET 10 host          | Open   | Host repository is not part of this workspace; cannot be verified here |

## Previously Blocking Findings (2026-05-17) and Current State

| #   | Original finding                                          | Current state                                                                                                                                                                  |
| --- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Render-phase side effects in `dashboard` and `quotation`  | Fixed. Notification writes and clears now run in `useEffect` (`quotation/index.tsx`, `dashboard/index.tsx`).                                                                   |
| 2   | Malformed notification selector `[id^="#notif-"]`         | Fixed 2026-11-28. Dashboard was already correct; `quotation/index.tsx` and `routes/common/helperFunctions.ts` now use `[id^="notif-"]`. Test id updated.                       |
| 3   | `quotation` loading state toggled outside async lifecycle | Fixed. `setIsLoading` is set and cleared inside the awaited `try/finally` paths (`declineQuote`, `getQuotationDetails`), with an `isActive` guard on unmount.                  |
| 4   | `useRef()` without initializer in `mailingLabel`          | Fixed. `useRef<HTMLDivElement \| null>(null)` in `components/Utilities/mailingLabel.tsx`.                                                                                      |
| 5   | Timeout-driven UI flows needing validation                | Partly verified. Listener cleanup confirmed for `useVisiblePageRange`, `CommandPalette` and `appDetails`. Interactive focus and announcement timing still needs a browser run. |

## Remaining Items

1. **Interactive validation (not automatable here):** run the app under
   `StrictMode` and exercise route announcements, error-summary focus,
   autosuggest and organisation lookup, then confirm no duplicate notifications
   or console warnings (checklist Phase 4).
2. **TypeScript hygiene review:** confirm no new `any` or broad casts were added
   to get the migration compiling (checklist 3.1) and review `tsconfig` and path
   aliases (3.2).
3. **.NET 10 host integration:** hosting model, asset pipeline, authentication,
   CI/CD publish. Requires the host repository (checklist Phase 6).

## Optional Modernization (Not Blocking)

- Four `forwardRef` sites are intentionally retained (`Actions/index.tsx` x2,
  `AriaComponents/SearchField/SearchField.tsx`,
  `Inputs/DatePicker/CustomDateInput.tsx`). `forwardRef` remains supported in
  React 19.
- `quotation/index.tsx` now imports the shared `handleAlertScroll` from
  `routes/common/helperFunctions.ts` (its private duplicate was removed on
  2026-11-28), so the notification selector lives in one place.

## React 19-Specific Non-Issues Confirmed

- `createRoot` is used in `ClientApp/src/entry.client.tsx`, wrapped in
  `StrictMode`.
- No function-component `defaultProps`, legacy context, string refs,
  `findDOMNode`, `ReactDOM.render`, `ReactDOM.hydrate`, or
  `unmountComponentAtNode`.
- No tests import `act` from `react-dom/test-utils`; no `Simulate`, Enzyme, or
  `react-test-renderer` usage.

## Final Status

- React 19 migration: complete in `ClientApp/src`
- TypeScript 6 compile: verified
- Build, unit tests, coverage: verified
- Interactive StrictMode and accessibility validation: pending
- .NET 10 host readiness: not verifiable in this workspace
