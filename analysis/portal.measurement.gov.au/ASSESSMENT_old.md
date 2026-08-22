# NMI Portal — Modernization Assessment

> **Tool used for LOC:** `find` + `wc -l` (neither `scc` nor `cloc` installed in this environment).
> **Complexity metric:** decision-keyword count (`if`, `for`, `while`, `case`, `catch`, `?`) per file.
> Figures are reproducible by re-running the commands cited in each section.
> **Migration-preparation reconciliation:** This assessment is a historical source document. Current migration status is governed by `docs/change-record/MASTER-CHANGE-RECORD.md`, `docs/change-record/OPEN-ITEMS-BACKLOG.md`, and `docs/nmi-portal-rebuild-readiness-assessment-2026-05-29.html`.

---

## Migration Reconciliation Addendum — 2026-06-01

The findings in this assessment have been merged into the migration-preparation documents as follows:

| Assessment item | Current migration status | Authoritative target |
|---|---|---|
| Refactor, not rebuild recommendation | CONFIRMED — remains the migration strategy | `docs/nmi-portal-modernisation-assessment-colour-revised.html`, `docs/nmi-portal-rebuild-readiness-assessment-2026-05-29.html` |
| Architecture domain map | MERGED — runtime domains mapped into pre-flight/runbook controls; `devAuth.ts` removed from diagram because it was deleted during auth-bypass remediation | `analysis/portal.measurement.gov.au/ARCHITECTURE.mmd`, `docs/migration/PRE-FLIGHT-CHECKLIST.md`, `docs/migration/MIGRATION-RUNBOOK.md` |
| SEC-001 / SEC-007 auth bypass and mock env variables | CLOSED — retired in Phase A; bypass env vars removed | `docs/change-record/MASTER-CHANGE-RECORD.md` CRD-001 |
| SEC-002 Trusted Types | CLOSED — `createHTML` sanitises via DOMPurify; `createScript` rejects dynamic script creation | `docs/change-record/MASTER-CHANGE-RECORD.md` CRD-006 |
| SEC-003 window opener / external-link hardening | CLOSED or covered by readiness remediations; verify in pre-flight where target links are rebuilt | `docs/change-record/MASTER-CHANGE-RECORD.md`, `docs/migration/PRE-FLIGHT-CHECKLIST.md` |
| SEC-004 mailto/tel encoding | CLOSED — mailto subjects encoded | `docs/change-record/MASTER-CHANGE-RECORD.md` CRD-005 |
| SEC-005 PII logging | CLOSED — raw telemetry/logging call sites scrubbed | `docs/change-record/MASTER-CHANGE-RECORD.md` CRD-003 |
| SEC-006 IDOR / ownership enforcement | OPEN — backend ownership verification required; later readiness docs track this as SEC-010 IDOR | `docs/change-record/OPEN-ITEMS-BACKLOG.md`, `docs/sec/SEC-010-idor-backend-verification.md` |
| SEC-008 external redirect allowlist | CLOSED — redirect host allowlist added | `docs/change-record/MASTER-CHANGE-RECORD.md` CRD-004 |
| SEC-010 validation regex suffix-only match | OPEN, non-blocking — documented by validator tests; requires product/security decision before changing validation semantics | `docs/change-record/OPEN-ITEMS-BACKLOG.md` |
| Token acquisition duplication | DEFERRED — accepted migration-sprint debt with ADR | `docs/change-record/OPEN-ITEMS-BACKLOG.md`, `docs/adr/2026-05-30-acquire-token-silent-interceptor.md` |
| Documentation gaps | CLOSED where architecture docs now exist; remaining operational questions moved to backlog | `docs/change-record/MASTER-CHANGE-RECORD.md`, `docs/change-record/OPEN-ITEMS-BACKLOG.md` |

Security numbering note: this historical assessment labels the validation regex finding as `SEC-010`; later readiness documentation uses `SEC-010` for backend IDOR verification. During migration, treat `SEC-010 IDOR` as the Priority 1 blocker and `VAL-REGEX-001` as the validation-regex backlog item.

---

## Executive Summary

The NMI Portal is a React 18 / TypeScript single-page application serving the Australian Government National Measurement Institute's calibration service customers — handling account onboarding, request-for-quote submission, quote acceptance, and measurement report access. At ~2,400 first-party SLOC across 281 source files it is a **small, well-structured codebase** with a modern dependency set and strong documentation. However, two **critical security findings** require immediate action before any other modernization work: an auth bypass mechanism readable and overridable from the browser console, and an incomplete Trusted Types CSP policy that together create an XSS-to-full-auth-bypass attack chain. Once those are closed, the recommended modernization pattern is **Refactor** — targeted hardening and test coverage expansion, not a rebuild.

---

## System Inventory

### LOC Table (first-party source only)

| Metric | Value |
|--------|-------|
| First-party TS/TSX files | 281 |
| First-party TS/TSX SLOC | ~2,400 |
| SCSS files | 97 |
| SCSS SLOC | ~12,500 (incl. generated Bootstrap theme) |
| E2E feature files | 20+ (.feature) |
| Unit test files | 14 |
| Total editable source files | ~378 |

> **Excluded from first-party counts:** `ClientApp/src/parent/` (vendor source embedded via webpack source maps), `ClientApp/src/external/`, and generated artifacts `main.*.js`.

### COCOMO-II Effort Estimate

```
PM = 2.94 × (KSLOC)^1.10
PM = 2.94 × (2.4)^1.10
PM = 2.94 × 2.65
PM ≈ 7.8 person-months  (±30% → 5.5–10.1 PM range)
```

Key cost drivers: small SLOC base but high component count (280+) inflates integration/test effort; wizard-form complexity adds cognitive overhead disproportionate to line count.

### Technology Fingerprint

| Concern | Technology | Version | Notes |
|---------|------------|---------|-------|
| UI Framework | React | 18.3.1 | Functional components, hooks throughout |
| Language | TypeScript | 5.9.3 | `any` suppressions present at auth boundary |
| Routing | React Router v6 | 6.30.3 | `createBrowserRouter`; all routes eager-loaded |
| Auth | Azure AD B2C (MSAL) | browser 3.30 / react 2.2 | Runtime config via `window.*` |
| Forms | Formik + Yup | 2.4.9 / 1.7.1 | Custom Yup string extensions |
| CSS | Bootstrap 5 + SCSS | 5.3.8 / Sass 1.99 | Custom NMI theme; `@import` deprecation suppressed |
| API Client | NSwag/OpenAPI generated | — | `web-api-client.ts`; 337 decision branches |
| Analytics | App Insights + GA4 | SDK 3.4.1 | Connection string via runtime env |
| CSP | Trusted Types + DOMPurify | 3.4.4 | `createHTML`/`createScript` policies not implemented |
| Build | Webpack 5 | 5.107.0 | `ts-loader` + `fork-ts-checker` |
| Testing | Vitest 4 + Playwright + Storybook 10 | — | BDD via `playwright-bdd` |
| Node requirement | Node | ≥20.0.0 | Package manager npm 11.15 |

### Highest-Complexity Files (decision-keyword count)

| Rank | File | Decisions | Risk |
|------|------|-----------|------|
| 1 | `validationSchemas/yupExtensions/stringExtensions.ts` | 64 | Med — validation hub |
| 2 | `routes/common/helperFunctions.ts` | 58 | High — business logic god-module |
| 3 | `components/forms/WizardForm/WizardRoutedStep.tsx` | 45 | High — stateful wizard engine |
| 4 | `routes/dashboard/index.tsx` | 28 | Med — main entry point |
| 5 | `utils/index.ts` | 25 | Med — utility hub |
| 6 | `components/modals/BranchSelectorModal/index.tsx` | 22 | Med |
| 7 | `components/Pill/StatusPill.tsx` | 22 | Med — status enum mapping |

---

## Architecture-at-a-Glance

> See `ARCHITECTURE.mmd` for the full Mermaid dependency diagram.

### Functional Domains

| Domain | Key Files | Depends On |
|--------|-----------|------------|
| **App Bootstrap** | `index.tsx`, `App.tsx`, `env.ts`, `trustedtypes.ts` | Auth, Layout/Shell, all Route modules |
| **Authentication & Identity** | `authentication/authConfig.ts`, `accountContext.tsx`, `AccountProvider.tsx`, `AuthenticatedElement.tsx`, `hooks.tsx`, `devAuth.ts` | API Client, Storage, Instrumentation |
| **Pre-conditions & Shell** | `routes/preConditions/PreConditions.tsx`, `components/Layout/`, `components/Header/`, `components/Footer/` | Auth, Modals, Analytics |
| **Dashboard** | `routes/dashboard/index.tsx`, `routes/common/helperFunctions.ts`, `routes/common/enums.ts` | API Client, Auth, Storage, Components |
| **RFQ Wizard** | `routes/requestForQuote/**` (index, create, copy, view, validation.ts) | API Client, Auth, WizardForm, Validation |
| **Quotation & Accept-Quote** | `routes/quotation/**`, `routes/acceptQuote/**` | API Client, Auth, WizardForm, Storage |
| **Measurement Reports** | `routes/measurementReport/**` | API Client, Auth, Storage |
| **Account & Contact Management** | `routes/account/**`, `routes/contact/**` | API Client, Auth, WizardForm, Validation |
| **Reusable UI Components** | `components/forms/WizardForm/**`, `components/Inputs/**`, `components/Buttons/**`, `components/SearchFilter/**` | Validation (side-effect import), Auth hooks |
| **Modals** | `components/modals/ModalContext.tsx`, `TermsAndCondition/`, `BranchSelectorModal/`, `RFQDeleteModal/` | API Client, Auth, Storage |
| **Validation Schemas** | `validationSchemas/yupExtensions/stringExtensions.ts`, `contactValidation.ts`, `addressValidation.ts`, `common.ts` | (no first-party deps) |
| **Instrumentation & Analytics** | `instrumentation/AppInsightsService.ts`, `AppLogger.ts`, `analytics/GoogleAnalytics.tsx` | `env.ts` |
| **Storage** | `storage/sessionStorageCache.ts`, `notification.ts`, `targetOrganisation.ts` | (no first-party deps) |
| **Utilities** | `utils/index.ts`, `components/Utilities/useHtmlTitle.tsx`, `useBodyClass.tsx`, `ViewPdfQuote.tsx` | API Client (ViewPdf*), `types.ts` |

### Dangling References & Dead Exports

| Category | File | Detail |
|----------|------|--------|
| Dead exports | `storage/notification.ts` | 6 functions (`getManageAccessNotification`, `setManageAccessNotification`, `clearManageAccessNotification`, `setReportingNotification`, `clearReportingNotification`, `getReportingNotification`) exported but never imported |
| Dead function | `routes/common/helperFunctions.ts:316` | `contentLoaded()` exported, no import found in first-party code |
| Dead stub | `routes/common/helperFunctions.ts:114` | `getFileIdFromBase64()` — body identical to `getFileUrlFromBase64`, no callers |
| Commented-out dead code | `instrumentation/AppLogger.ts:91–178` | Alternate class body never removed |
| Orphaned route file | `routes/measurementReport/reportList.tsx` | Not referenced in `index.tsx` or `App.tsx` |
| Commented-out analytics | `analytics/GoogleAnalytics.tsx:35` | `trackGAPii()` exported; only call site is commented out in `dashboard/index.tsx:392` |

---

## Production Runtime Profile

**No telemetry available.** This is a source-map capture snapshot; no APM exports or server logs were supplied. The assessment cannot include p50/p95/p99 figures.

**Gap impact:** Based on static analysis, `helperFunctions.ts` (file download routing via CRM switch on quote status) and `WizardRoutedStep.tsx` (multi-step form state machine orchestrating sequential API calls) are the two candidates most likely to exhibit p99 variance. Recommend connecting Azure Application Insights to export latency for the wizard-step API calls (`/api/quote-request/**`) before committing to any refactor sequencing.

---

## Technical Debt

| Rank | Finding | File:Line Evidence | Severity | Est. Fix |
|------|---------|-------------------|----------|---------|
| 1 | **Token acquisition copy-pasted across 36+ call sites** — `acquireTokenSilent` + `client.setAuthToken(...)` verbatim-duplicated in every route props file. A shared `createAuthenticatedClient<T>()` factory would centralise this; any MSAL strategy change currently requires 36 edits. | `routes/account/create/createAccountProps.ts:19-24` and 29+ confirmed duplicates | **High** | 8h |
| 2 | **Organisation validation schemas triplicated** — `routes/account/validation.ts`, `update/validation.ts`, and `addBranch/validation.ts` are structurally identical Yup schemas; only label strings differ. | `routes/account/validation.ts:9-29`, `update/validation.ts:8-29`, `addBranch/validation.ts:8-29` | **High** | 3h |
| 3 | **`createContactProps.ts` and `updateContactProps.ts` near-identical** — All load/save logic, error handling, and a stale comment (`// interim fix for address lookup update`) duplicated; only `bannerTitle` and `locationOnDiscard` differ. | `routes/contact/create/createContactProps.ts:1-146`, `update/updateContactProps.ts:1-147` | **High** | 2h |
| 4 | **`WizardRoutedStep.tsx` raw `any` cast for WAF detection** — Error cast `as any` to access `.headers.server` (Azure Application Gateway WAF detection). Silently skips WAF path if error shape changes. | `components/forms/WizardForm/WizardRoutedStep.tsx:207` | **High** | 2h |
| 5 | **87% component test gap** — 102 of ~117 non-story `.tsx` components have no unit test. Critical paths (StatusPill, WizardRoutedStep step logic, BranchSelectorModal) entirely untested. | `components/**` | **High** | 40h |
| 6 | **`PreConditions.tsx` god component** — 174 lines owning auth redirects, terms modal, branch-selector modal, RFQ delete modal, WCAG inert-div workaround, modal state provisioning, and route-change utilities. Mounted on every authenticated route. `children` typed `any`. | `routes/preConditions/PreConditions.tsx:17` | **Med** | 6h |
| 7 | **`ErrorDisplay.tsx` — 8 structurally-identical sub-components** — `ServerError`, `ForbiddenError`, `ConflictError`, etc. are all identical JSX patterns. Copy-paste drift: `ForbiddenError` and `ConflictError` show `visually-hidden` text `404` for non-404 status codes. | `components/ErrorBoundary/ErrorDisplay.tsx:33,43` | **Med** | 4h |
| 8 | **`AppInsightsService.ts` uses `process.env.NODE_ENV`** — violates the documented runtime-env pattern; `process.env` is undefined at runtime so this guard is dead code. | `instrumentation/AppInsightsService.ts:35` | **Med** | 1h |
| 9 | **`WizardFormProps` index signature `[key: string]: any`** — Escape-hatch index signature means misspelled props silently resolve to `undefined`. `validateHard`, `validateSoft`, `hidingFields` typed `any`. | `components/forms/WizardForm/types.ts:43-45,53,73` | **Med** | 4h |
| 10 | **Magic number `412` in 5 route prop files** — `HttpStatusCode.PreconditionFailed` exists in `types.ts` but literal `412` used in all redirect-on-error handlers. | `routes/account/create/createAccountProps.ts:88` + 4 parallel files | **Low** | 1h |

**Additional architectural debt:**
- SCSS `@import` deprecation suppressed — blocked by Bootstrap 5 internal `negativify-map()`, will break on Bootstrap 6/Sass 3. (`webpack.config.js`) — Med, 8h
- `targetOrganisation` in sessionStorage without integrity check — silent org context switch risk. (`storage/targetOrganisation.ts`) — Med, 3h
- Hardcoded `http://` links in Footer accessibility page. (`Footer/accessibility.tsx`) — Med, 1h
- No route-level code splitting — all 20+ routes are eager imports in `App.tsx`. — Low, 4h

---

## Security Findings

| # | CWE | Title | File:Line | Severity |
|---|-----|-------|-----------|----------|
| SEC-001 | CWE-287 | **Auth bypass via writable browser global** — `isAuthBypassEnabled()` reads `window.REACT_APP_AUTH_BYPASS`; any code in the page (XSS gadget, browser console) can set this before React mounts and cause `AuthenticatedElement` to render all protected routes without Azure AD B2C. `buildMockAccountDetails()` injects fully-trusted `AccountDetails` with admin-level flags and fixed CRM GUIDs. | `authentication/devAuth.ts:4`, `AuthenticatedElement.tsx:29` | **Critical** |
| SEC-002 | CWE-116 | **Incomplete Trusted Types policy** — `createHTML` and `createScript` handlers commented out with a `// TODO`. When Trusted Types is enforced any `innerHTML` path is unprotected. Also: `createScriptURL` handler passes URL through `DOMPurify.sanitize()` which is wrong (DOMPurify operates on HTML, not URLs; may return empty string for clean URLs). | `trustedtypes.ts:11-18` | **High** |
| SEC-003 | CWE-116 | **`window.open()` without `noopener` in 4 places** — Opened tabs retain `window.opener` access to the portal. In `quoteDetails.tsx` and `reportDetails.tsx`, a blank window handle is created then `quoteRequestWindow.location.href` is set from server-supplied `quoteRequestIdNum` without `encodeURIComponent()`. | `routes/quotation/quoteDetails.tsx:48-52`, `measurementReport/reportDetails.tsx:35-39`, `routes/common/helperFunctions.ts:156,165` | **High** |
| SEC-004 | CWE-79 | **Unencoded API values in `mailto:`/`tel:` hrefs** — Server-returned email addresses and IDs interpolated directly into template-literal `href` attributes (e.g., `` `mailto:${email}?subject="Reviewing Quotation ID: ${quotationIdNum}"` ``). A crafted `quotationIdNum` like `x"; onclick="alert(1)` passes through. | `routes/quotation/nMIContactDetails.tsx:40`, `measurementReport/nMIContactDetails.tsx:40`, `measurementReport/reportDetails.tsx:242,331` | **High** |
| SEC-005 | CWE-319 | **PII logged to App Insights and console** — Full MSAL `AccountInfo` objects (including email, `homeAccountId`, tenant) passed verbatim to `AppLogger.verbose()` → App Insights `trackTrace`. Also `console.log` of PII fields in `GoogleAnalytics.tsx` and `helperFunctions.ts` guarded only by `hostname === 'localhost'`. | `authentication/AccountProvider.tsx:184,188,195`, `analytics/GoogleAnalytics.tsx:53-54`, `routes/common/helperFunctions.ts:329-331` | **Medium** |
| SEC-006 | CWE-863 | **IDOR — URL params used directly in API calls without client-side ownership check** — `useParams()` `id` passed straight to API client with no assertion that the resource belongs to the authenticated user's organisation. Defence-in-depth only; authoritative fix is server-side. | `routes/requestForQuote/index.tsx:59`, `routes/acceptQuote/index.tsx:66`, `routes/measurementReport/index.tsx:112`, `routes/requestForQuote/copy/index.tsx:25` | **Medium** |
| SEC-007 | CWE-732 | **Auth bypass vars declared as `requiredVars` in all environments** — `REACT_APP_AUTH_BYPASS` and all `REACT_APP_MOCK_*` vars in `requiredVars` array; operational pressure to define them in production, making them visible in page source to any visitor. | `env.ts:59-77` | **Medium** |
| SEC-008 | CWE-601 | **Open redirect via unchecked `EXTERNAL_REDIRECT_URL`** — `window.location.replace(env.EXTERNAL_REDIRECT_URL)` called whenever `locationOnDiscard.startsWith('https://')` is true; no domain allowlist validation. | `components/forms/WizardForm/WizardRoutedStep.tsx:295` | **Low** |
| SEC-009 | CWE-1021 | **External links missing `noopener noreferrer`** — Qualtrics survey links open with `rel='external'` only; opened tabs can access `window.opener`. | `routes/requestForQuote/created/index.tsx:50-52`, `components/Header/NavbarMessage.tsx:14` | **Low** |
| SEC-010 | CWE-20 | **Validation regex suffix-only match** — `yupNameAllowedFormat(extended)` regex `/[...]$/` anchored only at end; any string whose last character is in the allowed set passes regardless of what precedes it. | `validationSchemas/yupExtensions/stringExtensions.ts:688` | **Low** |

**Critical attack chain:** SEC-001 + SEC-002. If a stored XSS gadget exists anywhere in API-sourced content (e.g., a crafted organisation name), the incomplete `createHTML` Trusted Types handler does not catch it, and the resulting script can set `window.REACT_APP_AUTH_BYPASS = 'true'` before the next page load — bypassing Azure AD B2C entirely, impersonating any user, and accessing all calibration records.

---

## Documentation Gaps

1. **Multi-organisation switching mechanism** — The `targetOrganisation` sessionStorage key drives which CRM org context all API calls use. Not explained in any doc. A new engineer would not know why routes behave differently after `BranchSelectorModal` interaction, or that clearing sessionStorage silently resets org context.

2. **Terms-of-use version check flow** — `AccountProvider.tsx` compares `user.termsVersion` against a JSON file string. The redirect-to-terms consequence of mismatch is undocumented. No doc explains how to update the version or what backend sync is required.

3. **WizardRoutedStep state machine contract** — `validateHard`/`validateSoft`/`loadStepValues`/`onSaveAndNext`/`onSaveAndExit` callbacks have implicit ordering contracts. `types.ts` provides signatures but no usage notes; no doc covers the expected call sequence.

4. **Auth bypass mechanism and production gate** — `devAuth.ts` provides a full auth bypass. No doc explains the risk, expected deployment pipeline guard, or how to verify it is disabled in staging/production.

5. **API client regeneration procedure** — `web-api-client.ts` is NSwag-generated. No doc explains how to trigger regeneration, which OpenAPI spec URL to use, or what manual patches (if any) would be lost on regeneration.

---

## Effort Estimation

| Scenario | KSLOC | COCOMO-II PM | Range | Notes |
|----------|-------|-------------|-------|-------|
| First-party TS/TSX only | 2.4 | 7.8 PM | 5.5–10.1 | Baseline |
| + SCSS (editable) | 3.0 | 10.0 PM | 7.0–13.0 | If major style refactor |
| Full refactor (security + tests + debt) | — | +8–12 PM | — | Security hardening + test coverage + wizard split |

**Key cost drivers:**
- Component test coverage drive from 13% to 80% is the largest elapsed-time item (~40 person-hours)
- Wizard form decomposition (`WizardRoutedStep.tsx`) is highest-risk — deeply stateful, zero tests
- Security fixes SEC-001 and SEC-002 are low-effort but highest business priority
- Bootstrap 6 migration (SCSS `@use` unblock) is medium effort, low disruption

---

## Recommended Modernization Pattern

**Refactor** — not Rebuild, not Replatform.

The codebase uses current framework versions (React 18, RR v6, TS 5.9, Bootstrap 5.3), has no legacy runtime dependencies, and its architecture is fundamentally sound. The routing model, authentication integration, and component decomposition are all appropriate for the problem domain. The risks are concentrated in three specific areas: two security hardening gaps with a documented attack chain, a single over-loaded wizard component, and an 87% component test gap.

**Recommended sprint sequence:**

**Sprint 0 — Immediate (1 week, security only):**
- Remove `REACT_APP_AUTH_BYPASS` from `requiredVars` and add a build-time assertion that fails the webpack build if the variable is truthy in `NODE_ENV=production`.
- Implement `createHTML` and `createScript` Trusted Types handlers using `DOMPurify.sanitize(input, { RETURN_TRUSTED_TYPE: true })`. Fix `createScriptURL` to use a URL allowlist, not DOMPurify.
- Add `noopener noreferrer` to all `window.open()` calls and `target='_blank'` links.
- Fix `mailto:`/`tel:` href values with `encodeURIComponent()`.

**Sprint 1 — Short-term (2–3 weeks):**
- Centralise token acquisition into a `createAuthenticatedClient<T>()` factory, eliminating 36 copy-paste sites.
- Merge the three organisation validation schema duplicates into a parameterised factory.
- Replace magic number `412` with `HttpStatusCode.PreconditionFailed`.

**Sprint 2 — Medium-term (4–6 weeks):**
- Decompose `WizardRoutedStep.tsx` into a `useWizardStep()` hook + thin render component.
- Decompose `ErrorDisplay.tsx` into a single `<HttpErrorPage>` component.
- Component test coverage drive: target 80% for components with ≥10 decision branches first.

**Sprint 3 — Ongoing:**
- Track Bootstrap 6 release for SCSS `@use` migration.
- Connect App Insights to export wizard-step API p99 latency for data-driven refactor sequencing.
- Add route-level code-splitting (React lazy + Suspense) to improve initial load.
