# Pre-Flight Checklist — NMI Portal Migration

**Document:** PRE-FLIGHT-CHECKLIST.md  
**Phase:** 4.2 — Operational Artefacts  
**Related documents:**  
- `docs/change-record/MASTER-CHANGE-RECORD.md`  
- `docs/change-record/OPEN-ITEMS-BACKLOG.md`  
- `docs/migration/MIGRATION-RUNBOOK.md`  
- `docs/migration/msw-init-checklist.md`  
- `docs/architecture/nswag-regeneration.md`

**Purpose:** This checklist must be completed in the **target environment** before any migration begins. Every item must pass (or be formally documented as a known pre-existing failure) before proceeding to the Migration Runbook.

**Baseline refreshed 2026-06-28 (CRD-041):** `npm run type-check` and `npm run lint` pass with zero diagnostics. `npm run test:unit` passes 114 files / 1,169 tests, and `npm run test:storybook` passes 87 files / 218 tests. `npm run test:unit:coverage` is **BLOCKED** by `COVERAGE-GATE-001`: statements 74.43%, branches 75.51%, functions 72.56%, lines 74.92% against configured 100% thresholds. The route manifest covers all 41 registered paths; 28 application BDD scenarios and 129 Storybook BDD scenarios are present, with six pattern/type approval paths explicitly excluded pending deterministic authenticated backend fixtures.

---

## Historical Review Gate

Complete this gate before running the technical pre-flight checks below.

| Check | Required action | Status | Notes |
|---|---|---|---|
| HR-01 | Review `docs/change-record/MASTER-CHANGE-RECORD.md` end-to-end and confirm all Phase A–N and Sprint 1 entries are represented | `[ ]` | |
| HR-02 | Review all materials predating the readiness assessment, including `analysis/portal.measurement.gov.au/ARCHITECTURE.mmd`, `analysis/portal.measurement.gov.au/ASSESSMENT.md`, `docs/CONCERNS.md`, sprint documents, ADRs, security docs, and architecture docs | `[ ]` | |
| HR-03 | Confirm every unresolved source item is present in `docs/change-record/OPEN-ITEMS-BACKLOG.md` with owner, priority, gate, and closure evidence requirement | `[ ]` | |
| HR-04 | Confirm every resolved item is recorded in `MASTER-CHANGE-RECORD.md` with evidence and no contradictory open status remains in the readiness assessment docs | `[ ]` | |
| HR-05 | Confirm the seven migration-preparation target documents have been updated from the three source inputs identified in the Master Change Record merge matrix | `[ ]` | |
| HR-06 | Confirm the security numbering mismatch is understood: historical `ASSESSMENT.md` SEC-010 is `VAL-REGEX-001`; readiness `SEC-010` is backend IDOR verification | `[ ]` | |
| HR-07 | Confirm `ARCHITECTURE.mmd` no longer includes `devAuth.ts` and that target architecture excludes auth-bypass code | `[ ]` | |

If any historical review item fails, stop pre-flight and update the Master Change Record and Open Items Backlog before continuing.

---

## Pre-Flight Baseline

Before migrating any files, run the following commands in the target environment and record pass counts as the baseline:

```bash
npm run type-check
npm run lint
npm run test:unit
npm run test:unit:coverage
npm run test:storybook
npm run test:quality:regression
npm run test:e2e
npm run build
npm run build-storybook
npm run migration-check
```

Record results in this table:

| Command | Pass count | Fail count | Date/time | Engineer |
|---|---|---|---|---|
| `npm run type-check` | | | | |
| `npm run lint` | | | | |
| `npm run test:unit` | | | | |
| `npm run test:unit:coverage` | | | | |
| `npm run build-storybook` | | | | |
| `npm run test:storybook` | | | | |
| `npm run test:quality:regression` | | | | |
| `npm run test:e2e` | | | | |
| `npm run build` | | | | |
| `npm run migration-check` | | | | |

**Note:** Any pre-existing failures must be documented before migration begins. Do not proceed if PF-13 fails or while `COVERAGE-GATE-001` remains open. Manual WCAG evidence remains separate from automated pass counts. The six Type Approval route exclusions are accepted only while the target has no deterministic authenticated fixtures; replacing those exclusions with app-BDD scenarios is the preferred migration outcome.

---

## Checklist Items

Instructions: For each item, mark the Status cell with `PASS`, `FAIL`, or `N/A (documented)`. Sign and date when all items resolve.

---

### PF-01 — `window.*` Runtime Config Injection

| Field | Detail |
|---|---|
| **Contract** | Runtime environment variables are injected into `window.*` by the server-side HTML template before the bundle loads. The codebase must never use `process.env`. |
| **Check** | Inspect the target HTML template. Confirm it injects all 11 required environment variables plus optional `REACT_APP_ENVIRONMENT` into `window.*` before the `<script>` tag that loads the bundle. Search first-party compiled output for any `process.env` references. |
| **11 required vars + 1 optional runtime flag** | Required: `REACT_APP_B2C_CLIENTID`, `REACT_APP_B2C_AUTHORITY`, `REACT_APP_B2C_KNOWN_AUTHORITIES`, `REACT_APP_B2C_POST_LOGOUT_REDIRECT_URL`, `REACT_APP_B2C_READ_SCOPE`, `REACT_APP_B2C_USER_IMPERSONATION_SCOPE`, `REACT_APP_B2C_REDIRECT_URL`, `EXTERNAL_REDIRECT_URL`, `REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY`, `REACT_APP_APPINSIGHTS_CONN_STRING`, `REACT_APP_GA_TRACKINGID`. Optional but exported: `REACT_APP_ENVIRONMENT` for runtime development telemetry warnings. |
| **Pass condition** | All 11 required vars present in template; optional `REACT_APP_ENVIRONMENT` intentionally set or intentionally blank; zero first-party `process.env` references in compiled bundle |
| **Status** | `[ ]` |
| **Notes** | |

---

### PF-02 — MSAL Bootstrap Order

| Field | Detail |
|---|---|
| **Contract** | `await PublicClientApplication.createPublicClientApplication()` must complete before `root.render()` is called. Top-level `await` must be supported by the bundler configuration. |
| **Check** | Review `ClientApp/src/index.tsx` in target. Confirm `createPublicClientApplication()` is awaited at module top level. Confirm bundler (webpack or equivalent) is configured with `output.module: true` or equivalent top-level-await support. |
| **Pass condition** | No "MSAL instance undefined" error in browser console on first authentication request; MSAL initialises synchronously from the app's perspective before the React tree mounts |
| **Status** | `[ ]` |
| **Notes** | |

---

### PF-03 — React Router Route Semantics

| Field | Detail |
|---|---|
| **Contract** | The router must use `createBrowserRouter` + `createRoutesFromElements` on React Router v7. All 41 registered paths and their wrappers must be preserved exactly. |
| **Check** | Review `ClientApp/src/App.tsx` in target. Diff the route tree against the source snapshot. Confirm 6 public/direct routes, 3 `PreConditions`-only error paths, and 32 routes behind `AuthenticatedElement`. Confirm the six Type Approval paths and each route's `displayHeaderAndFooter` value. |
| **Pass condition** | Route tree diff shows 0 unintended path or wrapper changes; all 41 paths resolve correctly in the running app |
| **Status** | `[ ]` |
| **Notes** | |

---

### PF-04 — Yup Extension Side-Effect Imports

| Field | Detail |
|---|---|
| **Contract** | Every schema file that calls a custom Yup method must import the side-effect module `validationSchemas/yupExtensions`. Explicit imports are required in `account/update/validation.ts` and `account/addBranch/validation.ts` (added during Phase 0). |
| **Check** | Search all `validationSchemas/**/*.ts` files for usage of any of the 19 custom methods (`.allowedFormat()`, `.nameAllowedFormat()`, `.businessName()`, `.maxLength()`, `.isRequired()`, `.minEntered()`, `.fixedDigits()`, `.phone()`, `.email()`, `.postcode()`, `.numbersOnly()`, `.decimalNumbersOnly()`, `.addressFormat()`, `.minValue()`, `.maxValue()`, `.noConsecutiveChars()`, `.atLeastOneChar()`, `.noConsecutivePuncuation()`, `.numberWithinRange()`). Confirm each such file has `import '../../validationSchemas/yupExtensions'` (or a transitive import that includes it). |
| **Pass condition** | `npm run test:unit` passes with 0 `schema.method is not a function` errors |
| **Status** | `[ ]` |
| **Notes** | |

---

### PF-05 — NSwag Client Regenerated from Spec

| Field | Detail |
|---|---|
| **Contract** | `web-api-client.ts` must be regenerated from the backend OpenAPI spec in the target environment. It must NOT be copied from this source snapshot. |
| **Check** | Confirm `ClientApp/src/api/web-api-client.ts` in target was produced by running the NSwag generation command against the backend spec endpoint, per `docs/architecture/nswag-regeneration.md`. Inspect the generation log or file header for spec source URL. Confirm `AuthorizedApiBase` extension class is present and correctly wired (manual patch may be required after generation). |
| **Pass condition** | Generation log shows spec source URL, not a file copy; `AuthorizedApiBase` is present; `npm run type-check` passes against the regenerated client |
| **Status** | `[ ]` |
| **Notes** | |

---

### PF-06 — App Insights and Google Analytics Wiring

| Field | Detail |
|---|---|
| **Contract** | `AppInsightsService` singleton must initialise before error boundaries mount. Google Analytics must initialise at the same point. |
| **Check** | Review `ClientApp/src/instrumentation/AppInsightsService.ts` and `ClientApp/src/analytics/` in target. Confirm singleton initialisation occurs in `index.tsx` before `root.render()`. Confirm connection string and GA measurement ID are sourced from the `env` object, not `process.env`. |
| **Pass condition** | App Insights events appear in the Azure Application Insights portal after sign-in; no `connection string is not defined` errors in browser console |
| **Status** | `[ ]` |
| **Notes** | |

---

### PF-07 — TrustedTypes/DOMPurify CSP Policy

| Field | Detail |
|---|---|
| **Contract** | `window.trustedTypes?.createPolicy('default', ...)` must run before React renders. `createHTML` must sanitise via DOMPurify. `createScript` must throw. |
| **Check** | Review `ClientApp/src/trustedtypes.ts` in target. Confirm the policy is registered in `index.tsx` before `root.render()`. Confirm `trustedtypes.ts` is not modified or omitted. Test the app with `Content-Security-Policy: require-trusted-types-for 'script'` active. |
| **Pass condition** | Zero TrustedTypes CSP violations in browser console during a full sign-in + navigation flow |
| **Status** | `[ ]` |
| **Notes** | |

---

### PF-08 — Bootstrap SCSS Configuration

| Field | Detail |
|---|---|
| **Contract** | Bootstrap 5 must be imported only via the `_bootstrap-import.scss` shim. Webpack and Storybook must both have `silenceDeprecations: ['import']` and `quietDeps: true` in their Sass loader configurations. |
| **Check** | Search all `.scss` files for `@import 'bootstrap/scss/bootstrap'` — only `_bootstrap-import.scss` should contain it. Review `webpack.config.js` and `.storybook/main.ts` for the required Sass options. |
| **Pass condition** | `npm run build` produces no SCSS deprecation errors; `npm run build-storybook` produces no SCSS deprecation errors |
| **Status** | `[ ]` |
| **Notes** | |

---

### PF-09 — Font and Asset Output Paths

| Field | Detail |
|---|---|
| **Contract** | webpack must emit fonts to `dist/fonts/` and images to `dist/images/`. SCSS files use relative paths that resolve against these output locations. |
| **Check** | Review webpack asset output configuration in target. Confirm `output.assetModuleFilename` or equivalent rules emit fonts to `dist/fonts/` and images to `dist/images/`. Build the app and inspect the `dist/` directory layout. |
| **Pass condition** | Zero 404 errors for font files or icon assets in browser DevTools Network tab during a full sign-in + navigation flow |
| **Status** | `[ ]` |
| **Notes** | |

---

### PF-10 — Storybook Test Harness

| Field | Detail |
|---|---|
| **Contract** | The global Storybook decorator must use `createMemoryRouter`. `withPortalProviders` must not double-wrap with `MemoryRouter`. `.storybook/main.ts` must include `rolldownOptions.output.codeSplitting` groups for `msw-vendor`, `testing-vendor`, and `chromatic-vendor` (CRD-021). `vitest.storybook.setup.ts` must include CRD-022 jsdom shims for `scrollTo`, canvas `getContext`, pseudo-element `getComputedStyle`, and deliberate ErrorBoundary story errors. |
| **Check** | Review `.storybook/preview.tsx` (or equivalent) in target. Confirm the global decorator calls `createMemoryRouter`, not `<MemoryRouter>`. Confirm `withPortalProviders` does not contain its own `<MemoryRouter>` wrapper. Review `.storybook/main.ts` and confirm the three vendor chunk groups are present with correct `test` patterns and priorities. Review `vitest.storybook.setup.ts` and confirm CRD-022 shims are present. |
| **Pass condition** | `npm run build-storybook` succeeds with no nested-router warnings; `npm run test:storybook` passes with clean output; `npm run test:e2e:storybook` passes all 129 scenarios; `npm run migration-check` passes without Storybook interaction or jsdom runtime errors |
| **Status** | `[ ]` |
| **Notes** | |

---

### PF-11 — Quality Regression Suite

| Field | Detail |
|---|---|
| **Contract** | All 8 regression tests must run in target CI. Import path aliases (e.g., `@/`) must be updated to resolve correctly in the target project structure. |
| **Check** | Review `quality/` directory in target. Run `npm run test:quality:regression` and confirm all 8 checks pass. Check Vitest config for alias resolution matching the target `tsconfig.json` paths. |
| **Pass condition** | `npm run test:quality:regression` passes with 0 failures across all 8 regression checks; `npm run migration-check` has no unresolved `@/...` import failures |
| **Status** | `[ ]` |
| **Notes** | |

---

### PF-12 — MSW Service Worker Initialised

| Field | Detail |
|---|---|
| **Contract** | Mock Service Worker must be initialised in the target environment per `docs/migration/msw-init-checklist.md`. `public/mockServiceWorker.js` must exist. |
| **Check** | Run `npx msw init public/` in the target project root if not already done. Confirm `public/mockServiceWorker.js` exists. Confirm the file is included in the `.gitignore` exceptions or is committed, per team convention. |
| **Pass condition** | `public/mockServiceWorker.js` exists in the target project |
| **Status** | `[ ]` |
| **Notes** | |

---

### PF-13 — devAuth.ts Absent

| Field | Detail |
|---|---|
| **Contract** | `devAuth.ts` was permanently deleted during Phase 0 (2026-05-29). It must not exist in the target repo in any form. `REACT_APP_AUTH_BYPASS` and the 5 associated mock environment variables must not be present in `env.ts` or any config. |
| **Check** | Run: `grep -r "devAuth" --include="*.ts" --include="*.tsx" .` in the target project root. Confirm zero results. Also search for `REACT_APP_AUTH_BYPASS`. |
| **Pass condition** | grep returns zero results for `devAuth` and `REACT_APP_AUTH_BYPASS` |
| **STOP CONDITION** | **If this check fails, do NOT proceed with migration. devAuth.ts must not be recreated or migrated under any circumstances.** |
| **Status** | `[ ]` |
| **Notes** | |

---

### PF-14 — env.ts Variable Count

| Field | Detail |
|---|---|
| **Contract** | `ClientApp/src/env.ts` must export the 11 required runtime variables plus optional `REACT_APP_ENVIRONMENT`. No auth-bypass variables or mock variables may be present. |
| **Check** | Open `ClientApp/src/env.ts` in the target. Count exported properties. Confirm the list matches the PF-01 vars: 11 required vars and optional `REACT_APP_ENVIRONMENT`. Confirm `REACT_APP_AUTH_BYPASS`, `REACT_APP_MOCK_USER_*`, and any other bypass/mock vars are absent. |
| **Pass condition** | File review confirms 12 exported vars total, with only the 11 required vars in `requiredVars`; no bypass or mock vars present |
| **Status** | `[ ]` |
| **Notes** | |

---

### PF-15 — BDD Test Runner Regenerated

| Field | Detail |
|---|---|
| **Contract** | `bddgen` must regenerate application and Storybook specs from all 29 feature files. Domain step modules, the route manifest, and reviewed exclusions must migrate together. |
| **Check** | Run `npx bddgen -c playwright.config.ts` and `npx bddgen -c playwright.storybook.config.ts`. Confirm 9 application and 20 Storybook feature files generate successfully. Review `tests/e2e/route-coverage.ts` against all 41 paths. |
| **Pass condition** | Both BDD projects generate; 28 application and 129 Storybook scenarios are discoverable; every registered route is covered or has a reviewed exclusion |
| **Status** | `[ ]` |
| **Notes** | |

---

### PF-16 — Source-Reconciliation Backlog Items Reviewed

| Field | Detail |
|---|---|
| **Contract** | Non-blocking deferred items from `ASSESSMENT.md` and `CONCERNS.md` must be knowingly accepted before cutover; they must not be rediscovered during the migration window. |
| **Check** | Review Priority 3 items in `OPEN-ITEMS-BACKLOG.md`, including `VAL-REGEX-001`, `API-WORKAROUND-001`, `FORM-GUARD-001`, `SESSION-KEYS-001`, `AUTH-OPS-*`, `VALIDATION-*`, and `PERF-001`. Confirm each has an owner or accepting migration lead. |
| **Pass condition** | Migration lead signs off that no Priority 3 item blocks cutover, and any item promoted to P1/P2 has been moved to the appropriate backlog section before migration begins. |
| **Status** | `[ ]` |
| **Notes** | |

---

## Pre-Flight Sign-Off

| Field | Value |
|---|---|
| All 16 items PASS (or documented exceptions logged) | `[ ]` |
| PF-13 confirmed PASS (devAuth.ts absent) | `[ ]` |
| Pre-flight baseline recorded above | `[ ]` |
| Pre-existing failures logged in OPEN-ITEMS-BACKLOG.md | `[ ]` |
| **Migration engineer sign-off** | |
| **Date** | |

Once signed off, proceed to `docs/migration/MIGRATION-RUNBOOK.md`.
