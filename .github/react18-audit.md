# React 18 Audit

Date: 2026-05-17
Scope: `static/js/**` source only
Workflow source: `.github/agents/workflows/react18/react18-commander.agent.md`

## Execution Notes

- This repository snapshot does not contain a root `package.json`, lockfile, or runnable project scripts.
- Dependency, build, and test phases from the workflow could not be executed from this workspace snapshot.
- Audit coverage is limited to static source inspection of the editable React/TypeScript files under `static/js/`.

## Boot Findings

- React 18-style root bootstrap is already present in `static/js/index.tsx` via `createRoot`.
- React Router is already on the data-router API via `createBrowserRouter`.
- The source does not look like an untouched React 16/17 bootstrap; the workflow's migration phases are therefore mostly not applicable here.

## Issue Counts By Category

| Category | Count | Notes |
| --- | ---: | --- |
| `ReactDOM.render` / `ReactDOM.hydrate` | 0 | `createRoot` already used |
| Legacy lifecycle methods (`componentWill*`, `UNSAFE_*`) | 0 | None found in editable source |
| Legacy context (`contextTypes`, `childContextTypes`, `getChildContext`) | 0 | None found |
| `findDOMNode` | 0 | None found |
| String refs / `this.refs` | 0 | None found |
| Class components | 1 | `static/js/components/ErrorBoundary/index.tsx` |
| Render-phase side effects | 2 components | `dashboard`, `quotation` |
| Automatic batching / async state risk areas | 6 locations | Mostly timeout-driven UI/focus flows and loading state churn |
| Direct document/window event wiring | 4 locations | Resize and outside-click handlers |
| Broken DOM selector usage | 2 locations | Notification focus logic likely never finds target |

## Findings

### 1. Render-phase side effects will be re-fired under React 18 StrictMode

These components perform imperative work during render instead of in an effect. In React 18 development StrictMode, render paths are intentionally invoked more than once, which can duplicate storage writes, navigation-related state changes, and context updates.

- `static/js/routes/dashboard/index.tsx:647`
- `static/js/routes/dashboard/index.tsx:652`
- `static/js/routes/dashboard/index.tsx:668`
- `static/js/routes/quotation/index.tsx:232`
- `static/js/routes/quotation/index.tsx:239`
- `static/js/routes/quotation/index.tsx:259`

Impact:

- Duplicate notifications
- Repeated context writes
- State updates during render (`setErrorStatus`, `setNoThirdPartyAccess`) that are fragile under StrictMode

Recommendation:

- Move these branches into `useEffect` blocks keyed by the relevant flags.

### 2. Notification focus selector is malformed in two routes

Both routes query for `"[id^=\"#notif-\"]"`, which matches IDs that literally begin with `#notif-`. Real element IDs do not include `#`, so the selector likely never finds anything.

- `static/js/routes/dashboard/index.tsx:100`
- `static/js/routes/quotation/index.tsx:88`

Impact:

- Notification scroll/focus behavior likely fails silently
- Accessibility regression for alert announcements

Recommendation:

- Use `[id^="notif-"]`.

### 3. Quotation loading state is toggled around async work in a way that can flicker and race

`Quotation` sets `isLoading` to `true` and `false` immediately around async function invocation, including before awaited work has completed.

- `static/js/routes/quotation/index.tsx:127`
- `static/js/routes/quotation/index.tsx:148`
- `static/js/routes/quotation/index.tsx:158`
- `static/js/routes/quotation/index.tsx:159`
- `static/js/routes/quotation/index.tsx:164`
- `static/js/routes/quotation/index.tsx:166`
- `static/js/routes/quotation/index.tsx:208`
- `static/js/routes/quotation/index.tsx:210`

Impact:

- Spinner may hide before network work completes
- React 18 batching can compress these updates and make the state transitions harder to reason about

Recommendation:

- Keep loading transitions inside the async function `try/finally` path only.

### 4. Timeout-driven focus and announcement flows should be treated as batching-sensitive

These are not automatic failures, but they are the main React 18 audit hotspots because async updates now batch consistently.

- `static/js/components/forms/ErrorSummary/index.tsx:19`
- `static/js/components/Utilities/routeAccessibleNavigation.tsx:10`
- `static/js/components/Pagination/useVisiblePageRange.tsx:6`
- `static/js/components/Inputs/AutoSuggest/AutoSuggestContainer.tsx:57`
- `static/js/components/Inputs/OrganisationNameLookup/index.tsx:48`
- `static/js/components/Utilities/routeChangeScrollTop.tsx`

Impact:

- Possible timing-dependent UI behavior
- Focus/announcement ordering bugs if downstream code assumes an intermediate render

Recommendation:

- Review each timeout-based UI flow during interactive testing.
- Only use `flushSync` if a concrete ordering bug is observed.

## Non-Issues Confirmed

- `static/js/index.tsx` already uses `createRoot`.
- No editable-source hits for deprecated class lifecycle APIs.
- No editable-source hits for legacy context, string refs, or `findDOMNode`.

## Gate Status

- Audit report generated: yes
- Dependency surgery: blocked by missing root manifest/scripts in snapshot
- Class surgery: not required for deprecated lifecycle APIs based on source scan
- Batching review: partial, static only
- Tests/build verification: blocked by missing runnable project manifest/scripts
