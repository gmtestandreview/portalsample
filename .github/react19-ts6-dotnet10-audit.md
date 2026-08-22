# React 19 + TypeScript 6 + .NET 10 Migration Audit

Date: 2026-05-17
Scope: `static/js/**` editable frontend source only
Source reports:

- `.github/react18-audit.md`
- `.github/react19-audit.md`

## Purpose

This document merges the React 18 and React 19 audits into a single migration baseline for a target environment of:

- React 19
- TypeScript 6
- .NET 10

## Execution Limits

- This workspace is a source-map capture snapshot, not a normal application repository.
- There is no root `package.json`, lockfile, `tsconfig.json`, solution file, project file, or runnable script surface at repository root.
- The audit is therefore limited to static inspection of the downloaded frontend source under `static/js/`.
- Dependency upgrades, builds, tests, type-checks, and .NET runtime integration could not be executed here.

## Target-State Summary

### Already aligned or mostly aligned

- React root bootstrap is already on `createRoot`.
- React Router is already on the modern data-router API.
- No editable-source hits for legacy lifecycle methods, legacy context, string refs, `findDOMNode`, `ReactDOM.render`, `ReactDOM.hydrate`, or `unmountComponentAtNode`.

### Still blocking a clean migration baseline

1. Render-phase side effects in `dashboard` and `quotation`
2. Broken notification focus selector in both routes
3. Loading-state churn in `quotation`
4. `useRef()` without `null` initializer in `mailingLabel`
5. Timeout-driven UI flows that need interactive validation under modern batching / StrictMode

## Consolidated Issue Inventory

| Category | Count | Migration Relevance |
| --- | ---: | --- |
| Render-phase side effects | 2 components | High |
| Broken alert selector | 2 locations | High |
| Async loading state churn | 1 route, 8 lines | Medium |
| `useRef()` without initializer | 1 location | Medium |
| Timeout-driven batching-sensitive flows | 6 locations | Medium |
| Class components | 1 | Low, not a blocker by itself |
| `forwardRef` asset wrappers | 3 | Optional only |

## Merged Findings

### 1. Render-phase side effects in `dashboard` and `quotation`

These are the highest-signal issues across both audits. The components perform imperative writes during render instead of in effects.

Locations:

- `static/js/routes/dashboard/index.tsx:647`
- `static/js/routes/dashboard/index.tsx:652`
- `static/js/routes/dashboard/index.tsx:668`
- `static/js/routes/quotation/index.tsx:232`
- `static/js/routes/quotation/index.tsx:239`
- `static/js/routes/quotation/index.tsx:259`

Impact:

- Duplicate notifications under `StrictMode`
- Context writes during render
- State updates during render remain fragile in React 18 and React 19

Migration action:

- Move these branches into `useEffect` blocks keyed by the relevant flags.

### 2. Notification focus selector is malformed

Both routes query for IDs beginning with `#notif-`, which is not how DOM IDs are stored.

Locations:

- `static/js/routes/dashboard/index.tsx:100`
- `static/js/routes/quotation/index.tsx:88`

Current selector:

- `document.querySelector('[id^="#notif-"]')`

Impact:

- Alert focus/scroll logic likely never finds the element
- Accessibility behavior is likely broken already

Migration action:

- Replace with `[id^="notif-"]`.

### 3. `quotation` loading state is toggled around async work incorrectly

`Quotation` flips `isLoading` on and off outside the real async lifecycle.

Locations:

- `static/js/routes/quotation/index.tsx:127`
- `static/js/routes/quotation/index.tsx:148`
- `static/js/routes/quotation/index.tsx:158`
- `static/js/routes/quotation/index.tsx:159`
- `static/js/routes/quotation/index.tsx:164`
- `static/js/routes/quotation/index.tsx:166`
- `static/js/routes/quotation/index.tsx:208`
- `static/js/routes/quotation/index.tsx:210`

Impact:

- Spinner flicker
- Racy state transitions
- Harder-to-reason-about behavior under modern batching

Migration action:

- Keep `setIsLoading` transitions inside the awaited `try/finally` paths only.

### 4. `useRef()` shape is not yet React 19 / TS-tight

One file still uses `useRef()` without an initializer and then casts the result.

Location:

- `static/js/components/Utilities/mailingLabel.tsx:32`

Current pattern:

- `const printAreaRef = useRef() as MutableRefObject<HTMLDivElement>;`

Impact:

- Loose ref typing
- Incomplete React 19 migration target
- Less robust for stricter TypeScript environments

Migration action:

- Replace with `useRef<HTMLDivElement | null>(null)`.

### 5. Timeout-driven UI flows need interactive validation

These are not guaranteed bugs, but they are migration hotspots because React 18+ batches async updates consistently and React 19 keeps that model.

Locations:

- `static/js/components/forms/ErrorSummary/index.tsx:19`
- `static/js/components/Utilities/routeAccessibleNavigation.tsx:10`
- `static/js/components/Pagination/useVisiblePageRange.tsx:6`
- `static/js/components/Inputs/AutoSuggest/AutoSuggestContainer.tsx:57`
- `static/js/components/Inputs/OrganisationNameLookup/index.tsx:48`
- `static/js/components/Utilities/routeChangeScrollTop.tsx`

Impact:

- Timing-dependent focus and announcement ordering
- Possible regressions when moving to stricter rendering/runtime behavior

Migration action:

- Validate these flows manually after migration.
- Do not introduce `flushSync` unless a concrete ordering bug is proven.

## React 19-Specific Non-Issues Confirmed

- `createRoot` is already in use.
- No active function-component `defaultProps` assignments were found in editable source.
- No editable-source hits for `unmountComponentAtNode`.
- `forwardRef` appears only in SVG asset wrappers and is optional per the workflow guidance.

## TypeScript 6 Readiness Notes

These are bounded by snapshot visibility only.

### Confirmed from local source

- The source is already TypeScript/TSX-based.
- Most issues found are compatibility and correctness issues, not syntax blockers.
- The `useRef()` cast pattern in `mailingLabel.tsx` is the clearest candidate to tighten before moving to a stricter TS environment.

### Not verifiable here

- Actual TypeScript version in use
- `tsconfig` strictness
- Project references / path aliases
- Library type compatibility
- Compile output under TypeScript 6

## .NET 10 Readiness Notes

This frontend snapshot contains no visible .NET solution or application host surface, so .NET 10 readiness cannot be audited directly here.

### Not verifiable here

- ASP.NET Core hosting model
- Static asset pipeline
- SSR/prerender integration
- Authentication middleware alignment
- Build and publish targets
- CI/CD runtime assumptions

### Practical implication

- Treat this document as the frontend migration baseline only.
- .NET 10 work will require the actual host repository, project files, and build pipeline.

## Recommended Migration Order

1. Fix render-phase side effects in `dashboard` and `quotation`.
2. Fix the malformed notification selector.
3. Normalize `quotation` loading-state handling.
4. Replace `useRef()` with explicit nullable refs.
5. Run a real React 19 + TypeScript 6 install/build/test cycle in the actual application repository.
6. Validate timeout-driven accessibility and focus flows manually.
7. Perform .NET 10 integration checks in the real host repo.

## Final Status

- React 18 audit: merged
- React 19 audit: merged
- Frontend migration blockers identified: yes
- Build/test/typecheck verified: no, blocked by snapshot limits
- .NET 10 host readiness verified: no, host repo not present
