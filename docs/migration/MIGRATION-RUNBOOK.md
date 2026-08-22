# Migration Runbook — NMI Portal

**Document:** MIGRATION-RUNBOOK.md  
**Phase:** 4.2 — Operational Artefacts  
**Last updated:** 2026-06-28 (CRD-041) — Current-tree reconciliation adds the six pattern/type approval routes and their dashboard, wizard, upload, and management surfaces; updates the route total to 41; records React Router v7; and refreshes the validation baseline. Type-check, lint, unit tests (114 files / 1,169 tests), Storybook tests (87 files / 218 tests), and 8 quality regression tests pass. `COVERAGE-GATE-001` is open because unit coverage is 74.43% statements / 75.51% branches / 72.56% functions / 74.92% lines against configured 100% thresholds. `TYPE-APPROVAL-E2E-001` remains the affected-route cutover gate.  
**Related documents:**  

- `docs/change-record/MASTER-CHANGE-RECORD.md`  
- `docs/change-record/OPEN-ITEMS-BACKLOG.md`  
- `docs/migration/PRE-FLIGHT-CHECKLIST.md`  
- `docs/migration/msw-init-checklist.md`  
- `docs/migration/2026-05-30-auth-token-acquisition-migration-checklist.md`  
- `docs/architecture/nswag-regeneration.md`

---

> ⚠️ **STOP CONDITIONS**
> Do not proceed past pre-flight if:
>
> - PF-13 FAILS (devAuth.ts is present in target)
> - Any open P1 item in `docs/change-record/OPEN-ITEMS-BACKLOG.md` is unresolved
> - `COVERAGE-GATE-001` is unresolved
> - Type Approval is in the migration scope and `TYPE-APPROVAL-E2E-001` is unresolved or unaccepted
> - ~~SEC-010 backend verdict has not been returned~~ **CLEARED 2026-06-04** — pentest-confirmed remediation; CRD-035
> - Sprint 1 QA sign-off (`docs/qa/sprint-1-signoff.md`) is not PASS

---

## 1. Overview and Prerequisites

This runbook is the step-by-step execution guide for migrating the NMI Portal source from this source-map snapshot workspace into the target buildable repository. It is executed by the migration engineer after all prerequisite phases are complete and all pre-flight checks pass.

### Phase Prerequisites

The following phases must be complete before executing this runbook:

| Phase | Description | Artefact |
| --- | --- | --- |
| Phase 0 | Source assessment and gap closure | `docs/change-record/MASTER-CHANGE-RECORD.md` |
| Phase 1 | Auth bypass removal | `docs/change-record/MASTER-CHANGE-RECORD.md` — AUTH-* entries |
| Phase 2 | Quality regression suite | `quality/` directory; 8 regression tests passing |
| Phase 3 | Architecture documentation | `docs/architecture/` |
| Phase 4.1 | Open items backlog | `docs/change-record/OPEN-ITEMS-BACKLOG.md` |
| Phase 4.2 | Operational artefacts (this doc) | `docs/migration/PRE-FLIGHT-CHECKLIST.md`, `docs/migration/MIGRATION-RUNBOOK.md` |

### Pre-Flight Requirement

Complete every item in `docs/migration/PRE-FLIGHT-CHECKLIST.md` and obtain the migration engineer sign-off before running any batch in this runbook.

### Recording Changes

After each batch completes, add an entry to `docs/change-record/MASTER-CHANGE-RECORD.md` recording:

- Batch letter and name
- Files migrated
- Verification result (pass count, fail count)
- Migration engineer initials and date

### Mandatory Historical Review Before Batch A

Before Batch A starts, the migration lead must complete the Historical Review Gate in `docs/migration/PRE-FLIGHT-CHECKLIST.md`. The objective is to make the reconstructed `MASTER-CHANGE-RECORD.md` the single operational source of truth for the live migration.

The review must confirm:

- All previous actions, decisions, and supporting documentation predating `docs/nmi-portal-rebuild-readiness-assessment-2026-05-29.html` have been reviewed.
- `analysis/portal.measurement.gov.au/ARCHITECTURE.mmd`, `analysis/portal.measurement.gov.au/ASSESSMENT.md`, and `docs/CONCERNS.md` have been reconciled into the Master Change Record, Open Items Backlog, this runbook, the pre-flight checklist, the migration preparation plan, and both assessment HTML files.
- Every unresolved finding has a backlog item with owner, priority, migration gate, and target closure timing.
- Every resolved finding is represented in the Master Change Record and no longer appears as open in readiness documentation.
- The historical `ASSESSMENT.md` security numbering mismatch is resolved for the team: `SEC-010 IDOR` in migration docs is the backend ownership-verification blocker; the older validation regex issue is tracked separately as `VAL-REGEX-001`.

If the review discovers a missing or contradictory item, do not begin Batch A. Update `MASTER-CHANGE-RECORD.md` and `OPEN-ITEMS-BACKLOG.md`, then rerun the pre-flight review.

---

## 2. Batch Execution Order

Batches must execute in the following order. Do not begin a batch until the previous batch's verification command passes.

```
Batch A → Batch B → Batch C → Batch D → Batch E
```

**Batch E prerequisites are COMPLETE** — the original design-platform blockers were resolved by decisions received 2026-06-04 (CRD-034), and BATCH-E-PREREQ-001–003 closed on 2026-06-05 (CRD-037, CRD-038, CRD-039). Batch E may begin after Item 22 repository provisioning and pre-flight sign-off.

| Batch | Name | Files | Key risk |
| --- | --- | --- | --- |
| A | Core bootstrap and auth | `index.tsx`, `App.tsx`, `env.ts`, `authentication/**` (excl. devAuth.ts), `routes/**`, `utils/**`, `types.ts` | MSAL bootstrap order; React Router v7; 41-path parity; distributed `acquireTokenSilent` sites |
| B | UI components | `components/**` | Bootstrap coupling; Type Approval attachment/progress/filter/editor surfaces |
| C | Storage, analytics, instrumentation | `storage/**`, `analytics/**`, `instrumentation/**` | AppInsights singleton pattern |
| D | Validation, tests | `validationSchemas/**`, `tests/unit/**`, `tests/e2e/**`, `quality/**` | Yup side-effect import chain; import path aliases |
| E | Styles and assets (prerequisites complete) | `styles/**`, `ClientApp/media/**`, `ClientApp/public/fonts/**`, `.storybook/**` | Preserve the current live-theme baseline while translating Bootstrap/SCSS to target tokens and primitives |

### Source-Reconciliation Items Carried Into Migration

The following items were revalidated from `ASSESSMENT.md` and `CONCERNS.md` and are intentionally handled as migration gates or accepted debt:

| Item | Disposition | Runbook handling |
| --- | --- | --- |
| `SEC-010 IDOR` backend ownership verification | **CLEARED 2026-06-04** | Pentest-confirmed remediation prior to go-live; dashboard route migration unblocked (CRD-035) |
| `VALIDATION-GATE-001` combined validation gate | Closed P1 blocker | CRD-030 classified the failure as combined Vitest/Storybook debt rather than TypeScript debt; CRD-032 resolved it and `npm run migration-check` now passes |
| WCAG component/E2E validation baseline | Updated automated evidence | CRD-036 resolved the previously failing authenticated account/RFQ/quote E2E flows and two route Storybook stories; Actions, RequestList, combobox, modal/footer/date-picker accessibility evidence added; manual AT/zoom evidence remains outside automated gates |
| `VAL-REGEX-001` validation regex semantics | P3 decision | Do not change validation behaviour during migration unless promoted and explicitly approved |
| `API-WORKAROUND-001` dashboard accepted-quote workaround | P3 accepted debt | Preserve existing behaviour during migration; remove only after backend/API fix is verified |
| `AUTH-OPS-002` production MSAL version confirmation | Pre-flight evidence | Confirm in PF-16 / environment review before cutover |
| Design-platform inputs 1–10 | P2 — **RESOLVED 2026-06-04** | Original blockers closed; three hard prerequisites (BATCH-E-PREREQ-001–003) are complete as of CRD-039 — see Section 7 |
| OpenAPI spec availability / CI / Storybook target | P2 — **RESOLVED 2026-06-04** | Actions outstanding: backend commits `openapi.json`; DevOps provisions CI; see CRD-034 |
| Batch E prerequisites BATCH-E-PREREQ-001–003 | P2 — **COMPLETE 2026-06-05** | `useRouteAccessibility` hook (CRD-037), icon audit (CRD-038), and WAF-TYPE-001 typed guard (CRD-039) are complete; Item 22 repository provisioning remains the remaining Batch E gate |

---

## 3. Batch A — Core Bootstrap and Authentication

### Files to Migrate

```
ClientApp/src/index.tsx
ClientApp/src/App.tsx
ClientApp/src/env.ts
ClientApp/src/types.ts
ClientApp/src/authentication/authConfig.ts
ClientApp/src/authentication/accountContext.tsx
ClientApp/src/authentication/hooks.tsx
ClientApp/src/authentication/AuthenticatedElement.tsx
ClientApp/src/routes/**   (all route modules)
ClientApp/src/utils/index.ts
```

**Do NOT migrate:** `ClientApp/src/authentication/devAuth.ts` — this file was permanently deleted on 2026-05-29 and must not exist in any form.

### Critical Items

1. **MSAL bootstrap order** — `await PublicClientApplication.createPublicClientApplication()` must complete before `root.render()`. Verify the target bundler supports top-level `await`.
2. **`acquireTokenSilent` sites** — The current production surface contains 81 matches across 52 files. Each must use the pattern confirmed in `docs/migration/2026-05-30-auth-token-acquisition-migration-checklist.md`. Review each after migration.
3. **env.ts var count** — confirm the 11 required runtime vars plus optional `REACT_APP_ENVIRONMENT`, no bypass vars (see PF-14).
4. **devAuth.ts** — grep for `devAuth` after migration. Zero results required. If any result appears, stop and investigate before continuing.
5. **Route count** — confirm 41 registered paths in `App.tsx` after migration: 6 public/direct routes, 3 `PreConditions`-only error paths, and 32 routes behind `AuthenticatedElement`. The six pattern/type approval paths are `/dashboard-ta`, `/ta/type-approval-create-pre`, `/ta/:id/*`, `/ta/type-approval-create`, `/ta/type-approval-success/:id/*`, and `/ta/:id/manage`.
6. **TrustedTypes policy** — `trustedtypes.ts` must be imported and registered in `index.tsx` before `root.render()`.
7. **React Router v7 contract** — retain `createBrowserRouter`, `createRoutesFromElements`, the current v7 future options, wildcard semantics, and `displayHeaderAndFooter` settings. Do not reintroduce React Router v6 future-flag test guidance.
8. **Type Approval workflow boundary** — migrate `routes/ta/**`, `routes/dashboard/dashboard-ta.tsx`, and their generated-client contracts as one coherent slice. The Type Approval wizard depends on long-running upload progress, document cancellation, certificate lookup, rich-text messages, and management-tab state.

### Verification

```bash
npm run type-check && npm run test:unit
```

**Expected result:** Pass count same or better than pre-migration baseline recorded in `PRE-FLIGHT-CHECKLIST.md`.

### Post-Batch Record

Log batch completion in `docs/change-record/MASTER-CHANGE-RECORD.md`.

---

## 4. Batch B — UI Components

### Files to Migrate

```
ClientApp/src/components/**   (all component files)
```

This includes all reusable UI components:

- Form components (Formik-integrated, `UnsavedFormPrompt`, `RouteLeavingGuard`)
- Layout components (header, footer, navigation)
- `WizardRoutedStep` and multi-step form scaffolding
- Table, card, modal, and alert components
- Type Approval components: attachment/upload controls, certificate lookup, checkbox groups, progress display, `PaRequestItem`, Type Approval search/filter controls, and `SlateEditor`
- Any component test files co-located with components

### Critical Items

1. **Bootstrap coupling** — Components reference Bootstrap 5 CSS classes and SCSS variables. The Bootstrap shim (`_bootstrap-import.scss`) must be in place before components are tested visually. Until Batch E completes, visual appearance is not the acceptance criterion — type-check and unit tests are.
2. **`UnsavedFormPrompt`** — Must use `useFormikContext`; must wrap `RouteLeavingGuard`. Do not re-implement navigation guard logic.
3. **`WizardRoutedStep` refactor** — The refactor is complete in source. Confirm the migrated version matches; do not revert to the pre-refactor pattern.
4. **SonarLint phase 2** — Phase 2 cleanup is complete in source. Do not reintroduce suppressed patterns.
5. **Storybook parity evidence** — preserve the Type Approval stories for dashboard, pre-application, four wizard steps, instrument information, and application details/documents/messages. These stories are isolated rendering evidence; they do not replace an authenticated app-BDD workflow.

### Verification

```bash
npm run type-check && npm run test:unit
```

**Expected result:** Pass count same or better than pre-migration baseline.

### Post-Batch Record

Log batch completion in `docs/change-record/MASTER-CHANGE-RECORD.md`.

---

## 5. Batch C — Storage, Analytics, and Instrumentation

### Files to Migrate

```
ClientApp/src/storage/**
ClientApp/src/analytics/**
ClientApp/src/instrumentation/AppInsightsService.ts
ClientApp/src/instrumentation/**   (all instrumentation files)
```

### Critical Items

1. **AppInsights singleton** — `AppInsightsService` must be imported and initialised in `index.tsx` before `root.render()`. The singleton pattern must be preserved; do not convert to a React context or lazy-initialise.
2. **Connection string source** — must be `env.REACT_APP_APPINSIGHTS_CONN_STRING`, not `process.env`.
3. **GA measurement ID source** — must be `env.REACT_APP_GA_TRACKINGID`, not `process.env`.
4. **PII logging** — PII scrubbing applied during Phase 0 is complete. Do not reintroduce any logging that emits user PII (names, email addresses, ABNs) to App Insights or GA telemetry.
5. **Session storage** — review `storage/**` for any references to auth-bypass state; none should remain.

### Verification

```bash
npm run type-check && npm run test:unit
```

**Expected result:** Pass count same or better than pre-migration baseline.

### Post-Batch Record

Log batch completion in `docs/change-record/MASTER-CHANGE-RECORD.md`.

---

## 6. Batch D — Validation Schemas and Test Suites

### Files to Migrate Selectively

**Migrate:**
```
ClientApp/src/validationSchemas/**
tests/unit/**
tests/e2e/**
quality/**
```

**Selective notes:**

- `validationSchemas/yupExtensions/stringExtensions.ts` — migrate; verify all 19 custom methods are present
- `tests/e2e/` — migrate feature files and step files; re-run `bddgen` after migration (see PF-15)
- `quality/` — migrate all 8 regression test files; verify import path aliases resolve

### Critical Items

1. **Yup side-effect import chain** — After migration, search all `validationSchemas/**/*.ts` files for custom method calls. Every such file must have `import '../../validationSchemas/yupExtensions'` (or a transitive import). Explicit imports were added to `account/update/validation.ts` and `account/addBranch/validation.ts` during Phase 0 — confirm these are present.
2. **Import path aliases** — The target `tsconfig.json` may define path aliases (`@/`, `~/`, etc.) differently from the source. Update all alias-relative imports in test files to match the target configuration before running tests. CRD-032 confirms this snapshot's root Vitest config mirrors the `@` alias used by unit tests so the combined migration gate resolves those imports.
3. **`bddgen` regeneration** — Run `npx bddgen` after migrating `tests/e2e/`. Do not commit `.features-gen/` from the source snapshot; regenerate in target.
4. **1,169 unit tests across 114 files** — all must pass after alias updates. This is the verified 2026-06-28 source baseline. Any test that fails due to import resolution (not logic) must be fixed before the batch is considered complete.
5. **`quality/` regression suite** — 8 regression tests must all pass. Failures here indicate a regression in core portal logic and must be treated as blocking.
6. **BDD inventory** — migrate all 29 feature files (28 application scenarios and 129 Storybook scenarios). Retain `tests/e2e/route-coverage.ts`, including reviewed exclusions for the six pattern/type approval paths until deterministic authenticated fixtures are implemented.
7. **Coverage enforcement** — retain the V8 coverage configuration in `vitest.unit.config.ts`, including the measured handwritten source surface and 100% thresholds. Do not add generated, vendor, story, or type-only files to the coverage denominator.

### Verification

```bash
npm run type-check && npm run test:unit
```

Followed by:

```bash
npm run test:quality:regression
npm run test:storybook
npm run test:e2e
```

**Expected result:** All current unit tests pass under the configured unit-test command; all 8 regression tests pass; `npm run migration-check` has no unresolved `@/...` import failures.

### Post-Batch Record

Log batch completion in `docs/change-record/MASTER-CHANGE-RECORD.md`.

---

## 7. Batch E — Styles and Assets (Prerequisites Complete — Pending Repository Provisioning)

> ⚠️ **BATCH E IS PENDING** Item 22 target repository provisioning (DevOps sign-off required). All three hard prerequisites are complete as of 2026-06-05 (CRD-037, CRD-038, CRD-039). The original design-platform blockers were closed by design decisions received 2026-06-04 (CRD-034). Design Lead SVG source sign-off for BATCH-E-PREREQ-002 is also required before the SCSS icon migration step.

**Original blockers — RESOLVED 2026-06-04 (CRD-034):**

| Blocker | Resolution |
| --- | --- |
| Bootstrap 6 upgrade decision | RESOLVED — Bootstrap grid dropped entirely; CSS Grid/Flexbox replaces it. No Bootstrap 6 dependency. |
| `rfs-value()` / `negativify-map()` compatibility | RESOLVED — Bootstrap SCSS not imported in target; these internal functions are not needed. |
| Icon font vendor resolution | RESOLVED — NMI icon font retired; SVG React components from `packages/icons` replace all usages. |

**Prerequisites — complete before Batch E begins, except repository provisioning:**

| Prerequisite | Owner | Status |
| --- | --- | --- |
| BATCH-E-PREREQ-001: Add `useRouteAccessibility` hook to AppShell in target system (WCAG 2.4.2/2.4.3) | Frontend Lead / Target System Owner | COMPLETE 2026-06-05 — CRD-037 |
| BATCH-E-PREREQ-002: Icon audit — confirm all `nmi-icon-*` usages have SVG equivalents in `packages/icons` (`rg -n "nmi-icon-" ClientApp/src`) | Design Lead / Frontend Lead | COMPLETE 2026-06-05 — CRD-038; Design Lead SVG source sign-off still required before SCSS migration |
| BATCH-E-PREREQ-003: Resolve `WAF-TYPE-001` — typed guard for WAF 412 error shape before wizard port | Frontend Lead | COMPLETE 2026-06-05 — CRD-039 |
| Item 22 target repository — confirm branch protection, team write access, and CI secrets for React19DesignSystem `dependencymangement` branch | DevOps | STRUCTURAL — awaiting confirmation |

### Files to Migrate (when unblocked)

```
ClientApp/src/styles/**
ClientApp/media/**
ClientApp/public/fonts/**
.storybook/**
```

### Critical Items (when prerequisites are complete)

The design-platform decisions received 2026-06-04 (CRD-034) significantly change the approach for several items. The Bootstrap grid is dropped, the icon font is retired, and several components are replaced with target-platform equivalents. Critical items reflect the new approach.

1. **No Bootstrap SCSS import in target** — Do not import Bootstrap SCSS in the target platform. Bootstrap grid classes (`.container`, `.row`, `.col-*`) must be replaced with CSS Grid/Flexbox in component-scoped SCSS modules. The `_bootstrap-import.scss` shim and `silenceDeprecations: ['import']` are not carried forward.
2. **Design token CSS import** — Import `@nmi/design-tokens/dist/css/variables.css` once in `apps/portal-spa/src/main.tsx`. This replaces `_variables.scss` as the source of colour, typography, and spacing values.
   Use the current `_variables.scss`, typography, shell, forms, navigation, attachment, and step-navigation partials as the visual parity baseline; they were aligned with the live portal before this documentation refresh.
3. **`math.div()` still required** — Any remaining SCSS that performs Sass division must use `math.div()` and declare `@use 'sass:math'` as its first `@use` statement.
4. **`@use` / `@forward`** — All new SCSS files must use `@use` / `@forward`, not `@import`. Bootstrap 6 migration is no longer deferred — it is irrelevant since Bootstrap SCSS is not carried forward.
5. **Icon migration** — Replace all `<i className="nmi-icon-*">` usages with SVG React components from `packages/icons`. Delete `_replace-svgicons-csp.scss` and icon font files only after all usages are confirmed migrated. Carry out BATCH-E-PREREQ-002 icon audit before starting.
6. **`print.css`** — Port `media-print.scss` verbatim to `apps/portal-spa/src/styles/print.css`. Import in `main.tsx` after the design token CSS. Replace Bootstrap print selectors (`.d-print-none`, `.d-print-block`) with direct element selectors.
7. **Storybook decorator** — global decorator must use `createMemoryRouter`; `withPortalProviders` must not wrap with `MemoryRouter`. Verify after migration to Vite Storybook.
8. **Storybook chunk splitting** — `.storybook/main.ts` includes `rolldownOptions.output.codeSplitting` groups for `msw-vendor`, `testing-vendor`, and `chromatic-vendor` (CRD-021). Confirm these groups are present; `pnpm build-storybook` must complete with no chunks exceeding 1500 KB.
9. **Storybook Vitest jsdom shims** — `vitest.storybook.setup.ts` includes browser API shims for `scrollTo`, canvas `getContext`, and pseudo-element `getComputedStyle`, plus a narrow filter for deliberate ErrorBoundary story errors (CRD-022). Confirm these remain present after migration so `pnpm test:storybook` output stays clean.
10. **`useRouteAccessibility` hook** — Confirm BATCH-E-PREREQ-001 is complete: the hook must be in AppShell updating `document.title`, moving focus to `<main>`, and posting a polite live-region announcement on every route change before Batch E sign-off.

### Verification (when unblocked)

```bash
npm run type-check && npm run lint && npm run test:unit && npm run build-storybook && npm run build
```

**Expected result:** No SCSS deprecation errors; no 404 font errors; Storybook builds successfully.

### Post-Batch Record

Log batch completion in `docs/change-record/MASTER-CHANGE-RECORD.md`.

---

## 8. NSwag Client Regeneration

> ⚠️ **DO NOT COPY `web-api-client.ts` FROM THIS SNAPSHOT.** The file must be regenerated from the backend OpenAPI spec in the target environment.

Follow the procedure in `docs/architecture/nswag-regeneration.md` exactly. Summary:

1. Obtain the backend OpenAPI spec URL from the backend team (or from the running backend in the target environment).
2. Run the NSwag generation command against that URL.
3. Confirm the generated file header shows the spec source URL, not a local file path.
4. Verify `AuthorizedApiBase` is present in the generated output. If it is absent or incomplete, apply the manual patch documented in `docs/architecture/nswag-regeneration.md`.
5. Run `npm run type-check` to confirm the generated client is type-compatible with the rest of the migrated codebase.

NSwag regeneration should be performed after Batch A is complete (so that `AuthorizedApiBase` dependencies are in place) and before Batches B–D rely on API calls in their tests.

**Recommended timing:** Between Batch A and Batch B.

---

## 9. Post-Migration Verification

After all batches complete (Batches A–D, and E when unblocked), run the full verification suite:

### Full Verification Suite

```bash
npm run type-check
npm run lint
npm run test:unit
npm run test:unit:coverage
npm run migration-check
npm run test:storybook
npm run test:quality:regression
npm run test:e2e
npm run build
npm run build-storybook
```

All commands must pass with zero failures.

### Manual Smoke Test — 41 Routes

Perform a manual smoke test covering all 41 registered paths. For each route, confirm:

- Route loads without JavaScript console errors
- Authenticated routes correctly redirect unauthenticated users to the sign-in page
- Page title and heading match expected values
- No TrustedTypes CSP violations in browser console

| Route category | Count | Smoke test status |
| --- | --- | --- |
| Public routes | 6 | `[ ]` |
| `PreConditions`-only error paths | 3 | `[ ]` |
| `AuthenticatedElement` routes | 32 | `[ ]` |
| **Total** | **41** | |

### App Insights Verification

After sign-in, confirm App Insights events appear in the Azure Application Insights portal within 2–5 minutes. Confirm no PII is present in event properties.

### CSP Header Verification

Confirm the Content-Security-Policy header returned by the target server includes `require-trusted-types-for 'script'` and the DOMPurify policy name.

---

## 10. Rollback Procedure

If any batch produces failures that cannot be resolved within the migration window, roll back that batch using the following procedure:

### Per-Batch Rollback Steps

1. Identify the batch that introduced the failure (use git history in the target repo).
2. Revert all files introduced in that batch:
   ```bash
   git revert --no-commit <commit-range>
   ```
   Or restore individual files from the previous commit:
   ```bash
   git checkout HEAD~1 -- <file-path>
   ```
3. Run the verification command to confirm a clean revert:
   ```bash
   npm run type-check && npm run test:unit
   ```
4. Confirm the pass count returns to the pre-batch baseline.
5. Log the regression in `docs/change-record/MASTER-CHANGE-RECORD.md`:
   - Batch reverted
   - Root cause (if known)
   - Files affected
   - Date and engineer
6. Add a blocking item to `docs/change-record/OPEN-ITEMS-BACKLOG.md` with priority P1 if the root cause is not known.
7. Do not re-attempt the batch until the root cause is identified and resolved.

### Full Rollback

If multiple batches must be rolled back, work in reverse order: D → C → B → A. Do not skip batches when rolling back.

---

## 11. Change Record Update

After full migration is complete and all verification steps pass, update `docs/change-record/MASTER-CHANGE-RECORD.md` with final migration entries:

For each batch, add a row:

| Date | Ref | Change | Files | Outcome | Engineer |
| --- | --- | --- | --- | --- |---|
| | MIG-A | Batch A migration complete | `index.tsx`, `App.tsx`, `env.ts`, `authentication/**`, `routes/**`, `utils/**`, `types.ts` | All tests pass | |
| | MIG-B | Batch B migration complete | `components/**` | All tests pass | |
| | MIG-C | Batch C migration complete | `storage/**`, `analytics/**`, `instrumentation/**` | All tests pass | |
| | MIG-D | Batch D migration complete | `validationSchemas/**`, `tests/**`, `quality/**` | 1,169 unit tests, 157 BDD scenarios, Storybook interaction tests, and 8 regression tests pass; all reviewed route exclusions retained or replaced with fixtures | |
| | MIG-E | Batch E migration complete | `styles/**`, `media/**`, `fonts/**`, `.storybook/**` | Build clean; 0 SCSS deprecations | |
| | MIG-NSWAG | NSwag client regenerated | `api/web-api-client.ts` | Regenerated from spec; type-check passes | |

Also update the `Status` column of any OPEN-ITEMS-BACKLOG.md items that were resolved during migration.

---

## Appendix — Verification Command Reference

| Command | Purpose | Batch(es) |
| --- | --- | --- |
| `npm run type-check` | TypeScript compilation check | All |
| `npm run test:unit` | Vitest unit tests (1,169 tests, 114 files verified 2026-06-28) | All |
| `npm run test:unit:coverage` | Unit suite plus V8 coverage thresholds | D, post-migration |
| `npm run migration-check` | Combined TypeScript + Vitest + Storybook build gate; CRD-032 confirms this passes in the source snapshot | Pre-flight, post-migration |
| `npm run test:quality:regression` | 8 quality regression tests | D, post-migration |
| `npm run build-storybook` | Storybook build (SCSS + component stories) | E, post-migration |
| `npm run test:storybook` | Storybook interaction tests; output must be clean of known jsdom API noise | Post-migration |
| `npm run test:e2e` | 28 application BDD scenarios plus 129 Storybook BDD scenarios | D, post-migration |
| `npm run lint` | ESLint source linting; 2026-06-28 baseline passes with zero diagnostics | Pre-flight, target CI, post-migration |
| `npm run build` | Production webpack build | E, post-migration |
| `npx bddgen -c playwright.config.ts` | Regenerate application `.features-gen/` specs | D |
| `npx bddgen -c playwright.storybook.config.ts` | Regenerate Storybook `.features-gen/` specs | D |
| `npx msw init public/` | Initialise MSW service worker | Pre-flight (PF-12) |
