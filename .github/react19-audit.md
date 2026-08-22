# React 19 Audit

Date: 2026-05-17
Scope: `static/js/**` editable source only
Workflow source: `.github/agents/workflows/react19/react19-commander.agent.md`

## Execution Notes

- This workspace is a source-map capture snapshot, not a runnable package-managed repository.
- There is no root `package.json`, lockfile, or `pnpm` script surface in this snapshot.
- Workflow phases that require dependency upgrades, `pnpm ls`, build, or test execution could not be run here.
- Audit coverage is static source inspection only.

## Boot Findings

- React 19-style legacy root migration is already complete in `static/js/index.tsx`.
- `createRoot` is already used in [static/js/index.tsx](/c:/Users/gregm/offline-site-robots-off/portal.measurement.gov.au/source-map-capture/portal.measurement.gov.au/static/js/index.tsx:3).
- No test files were found in the snapshot under `static/js/`, so the workflow's test-fix phase is not reviewable from local source.

## Total Issue Count

3 actionable source issues

## Issue Counts By Pattern

| Pattern | Count | Notes |
| --- | ---: | --- |
| `ReactDOM.render` | 0 | Already migrated to `createRoot` |
| `ReactDOM.hydrate` / `hydrateRoot` migration need | 0 | No legacy hydrate usage found |
| `unmountComponentAtNode` | 0 | None found |
| `findDOMNode` | 0 | None found |
| Legacy context | 0 | No `contextTypes`, `childContextTypes`, `getChildContext` |
| String refs | 0 | No `this.refs` usage found |
| Live function `defaultProps` assignments | 0 | Only commented-out historical examples remain |
| `useRef()` without initial value | 1 | Concrete React 19 migration target |
| Render-phase side effects | 2 components | StrictMode-sensitive, not React 19-only but still actionable |
| `forwardRef` occurrences | 3 | SVG asset wrappers; optional only per workflow note |

## Findings

### 1. `useRef()` without `null` initializer

React 19 migration guidance in the workflow explicitly calls out `useRef()` to `useRef(null)`. One editable source file still uses the old no-argument form and then casts around it.

- [static/js/components/Utilities/mailingLabel.tsx](/c:/Users/gregm/offline-site-robots-off/portal.measurement.gov.au/source-map-capture/portal.measurement.gov.au/static/js/components/Utilities/mailingLabel.tsx:32)

Current pattern:

- `const printAreaRef = useRef() as MutableRefObject<HTMLDivElement>;`

Impact:

- Ref shape is looser than necessary
- Migration target from the workflow remains incomplete

Recommendation:

- Replace with a typed nullable ref, for example `useRef<HTMLDivElement | null>(null)`.

### 2. Render-phase side effects in `dashboard`

This component performs imperative notification/state work during render.

- [static/js/routes/dashboard/index.tsx](/c:/Users/gregm/offline-site-robots-off/portal.measurement.gov.au/source-map-capture/portal.measurement.gov.au/static/js/routes/dashboard/index.tsx:647)
- [static/js/routes/dashboard/index.tsx](/c:/Users/gregm/offline-site-robots-off/portal.measurement.gov.au/source-map-capture/portal.measurement.gov.au/static/js/routes/dashboard/index.tsx:652)
- [static/js/routes/dashboard/index.tsx](/c:/Users/gregm/offline-site-robots-off/portal.measurement.gov.au/source-map-capture/portal.measurement.gov.au/static/js/routes/dashboard/index.tsx:668)

Impact:

- Duplicate side effects under modern `StrictMode`
- State updates during render remain fragile in React 19 just as they are in React 18

Recommendation:

- Move notification and reset logic into `useEffect` blocks keyed by the relevant flags.

### 3. Render-phase side effects in `quotation`

This route has the same class of issue as `dashboard`.

- [static/js/routes/quotation/index.tsx](/c:/Users/gregm/offline-site-robots-off/portal.measurement.gov.au/source-map-capture/portal.measurement.gov.au/static/js/routes/quotation/index.tsx:232)
- [static/js/routes/quotation/index.tsx](/c:/Users/gregm/offline-site-robots-off/portal.measurement.gov.au/source-map-capture/portal.measurement.gov.au/static/js/routes/quotation/index.tsx:239)
- [static/js/routes/quotation/index.tsx](/c:/Users/gregm/offline-site-robots-off/portal.measurement.gov.au/source-map-capture/portal.measurement.gov.au/static/js/routes/quotation/index.tsx:259)

Impact:

- Repeated notifications or context writes under `StrictMode`
- Render-phase state changes remain a correctness risk

Recommendation:

- Move these branches into effects and keep render pure.

## Non-Issues Confirmed

- [static/js/index.tsx](/c:/Users/gregm/offline-site-robots-off/portal.measurement.gov.au/source-map-capture/portal.measurement.gov.au/static/js/index.tsx:12) already uses `createRoot`.
- No editable-source hits for `ReactDOM.render`, `ReactDOM.hydrate`, `unmountComponentAtNode`, `findDOMNode`, string refs, or legacy context.
- No active `Component.defaultProps = ...` assignments were found in editable source; only commented-out examples exist.

## Optional Modernization Notes

- `forwardRef` appears only in SVG component assets under `static/js/assets/*.svg`.
- The workflow text says `forwardRef` is optional modernization and should be skipped unless explicitly needed.
- I did not count those as migration blockers in this audit.

## Gate Status

- Audit report generated: yes
- Dependency surgery: blocked by missing root manifest / `pnpm` surface
- Source migration review: partial, static only
- Test-suite review: blocked by missing tests in snapshot and no runnable manifest
- Final validation gate: blocked by missing runnable manifest/scripts
