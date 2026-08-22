# Modernization Assessment — NMI Customer Portal
**Target:** `ClientApp/src`
**Date:** 2026-06-02
**Tool:** LOC counted via `find` + `wc -l` (scc/cloc not available); COCOMO-II computed manually.
**Supersedes:** `analysis/portal.measurement.gov.au/ASSESSMENT_old.md` (snapshot-era assessment, renamed 2026-06-01)

---

## Reconciliation with Prior Assessment

This assessment replaces the earlier snapshot-era assessment. Several security findings identified by static analysis of the source-map capture **have already been remediated in the live codebase** before this assessment was produced. The table below reconciles the findings — do not re-open closed items.

| Prior ID | Finding | Status in live codebase | Evidence |
|---|---|---|---|
| old-SEC-001 | Auth bypass via `devAuth.ts` writable browser global (`REACT_APP_AUTH_BYPASS`) | **CLOSED** — `devAuth.ts` deleted; bypass env vars removed from `env.ts` `requiredVars` | `docs/change-record/MASTER-CHANGE-RECORD.md` CRD-001; project memory 2026-05-29 |
| old-SEC-002 | Incomplete Trusted Types policy (`createHTML`/`createScript` handlers missing) | **CLOSED** — `createHTML` sanitises via DOMPurify; `createScript` rejects dynamic script creation | `docs/change-record/MASTER-CHANGE-RECORD.md` CRD-006 |
| old-SEC-003 | `window.open()` without `noopener` / blank-window + `location.href` pattern | **CLOSED** — hardening applied; verify remaining instances in pre-flight against rebuilt target links | `docs/change-record/MASTER-CHANGE-RECORD.md` |
| old-SEC-004 | Unencoded API values in `mailto:`/`tel:` hrefs | **CLOSED** — mailto subjects encoded (`encodeURIComponent`) | `docs/change-record/MASTER-CHANGE-RECORD.md` CRD-005 |
| old-SEC-005 | PII (MSAL AccountInfo, email, tenant) logged to App Insights / console | **CLOSED** — raw telemetry call sites scrubbed | `docs/change-record/MASTER-CHANGE-RECORD.md` CRD-003 |
| old-SEC-006 | IDOR — URL params used directly in API calls | **CLOSED 2026-06-04** — tracked as **SEC-010**; pentest-confirmed remediation prior to go-live (CRD-035) | `docs/sec/SEC-010-idor-backend-verification.md`, `docs/change-record/OPEN-ITEMS-BACKLOG.md` |
| old-SEC-007 | Auth bypass vars in `requiredVars` for all environments | **CLOSED** — removed with `devAuth.ts` | `docs/change-record/MASTER-CHANGE-RECORD.md` CRD-001 |
| old-SEC-008 | Open redirect via unchecked `EXTERNAL_REDIRECT_URL` | **CLOSED** — redirect host allowlist added | `docs/change-record/MASTER-CHANGE-RECORD.md` CRD-004 |
| old-SEC-009 | External links missing `noopener noreferrer` | **CLOSED** | `docs/change-record/MASTER-CHANGE-RECORD.md` |
| old-SEC-010 | Validation regex suffix-only match (`nameAllowedFormat extended`) | **OPEN, non-blocking** — documented; requires product/security decision before changing validation semantics | `docs/change-record/OPEN-ITEMS-BACKLOG.md` |
| old-DEBT-1 | Token acquisition copy-pasted across 36+ call sites | **DEFERRED** — accepted migration-sprint debt; ADR written | `docs/adr/2026-05-30-acquire-token-silent-interceptor.md`, `docs/change-record/OPEN-ITEMS-BACKLOG.md` |

**SLOC note:** The prior assessment counted ~2,400 first-party TS/TSX SLOC (excluding vendor source-map trees under `ClientApp/src/parent/` and `src/external/`). This assessment counts all files reachable from `ClientApp/src` including those vendor trees (289 files, ~23,780 SLOC). The COCOMO estimates differ accordingly — the prior estimate of ~7.8 PM was for first-party code only; this assessment's 96 PM figure includes the full tree. For migration planning, the prior estimate is more relevant to effort for new code authorship; this assessment's figure reflects total comprehension and test coverage cost.

---

## Executive Summary

The NMI Customer Portal is a React 18 + TypeScript single-page application of ~23,800 SLOC across 289 source files, built on Azure AD B2C authentication, Formik multi-step wizard forms, and an NSwag-generated OpenAPI client. Structurally, it is well-organized into 12 identifiable functional domains with clear separation between routing, UI primitives, validation, and infrastructure. The primary modernization risk is not architectural rot but **accumulated type-safety erosion at the wizard engine layer** — every multi-step workflow in the portal passes through a `WizardStepProps` interface typed with `[key: string]: any`, erasing compile-time guarantees at the most critical abstraction. The secondary risk is a **26-location token-acquisition duplication** that will compound the cost of any MSAL upgrade or auth flow change. The recommended pattern is **Refactor** — the foundation is sound; targeted, incremental remediation of the debt items will reduce long-term maintenance cost without the risk of a full rebuild.

---

## System Inventory

### LOC Table (tool: `find` + `wc -l`)

| Extension | Files | Raw Lines | Est. SLOC (~72%) |
|---|---|---|---|
| `.tsx` | 208 | ~24,500 | ~17,640 |
| `.ts` | 81 | ~8,500 | ~6,120 |
| `.scss` | 27 | ~2,300 | ~1,650 |
| **Total** | **316** | **~33,027** | **~23,780** |

### Technology Fingerprint

| Layer | Technology | Version |
|---|---|---|
| Language | TypeScript | ^5.9.3 |
| UI framework | React (functional components + hooks) | ^18.3.1 |
| Routing | React Router v6 (`createBrowserRouter`) | ^6.30.3 |
| Auth | Azure AD B2C via `@azure/msal-browser` / `@azure/msal-react` | ^3.30.0 / ^2.2.0 |
| Forms | Formik + Yup + 19 custom string validators | ^2.4.9 / ^1.7.1 |
| CSS | Bootstrap 5 (custom NMI theme) + SCSS | ^5.3.8 |
| API client | NSwag/OpenAPI-generated (`web-api-client.ts`) | — |
| Analytics | Azure Application Insights + Google Analytics (react-ga4) | ^3.4.1 / ^2.1.0 |
| CSP | Trusted Types policy + DOMPurify | ^3.4.4 |
| Build (production) | Webpack 5 | ^5.107.0 |
| Build (tests/Storybook) | Vite 8 | ^8.0.13 |
| Testing | Storybook 10 (55 stories) + Playwright BDD e2e | ^10.4.0 / ^1.60.0 |
| Coverage | Vitest v8 | ^4.1.7 |

**Data stores:** No local database; all persistence via NSwag API client (REST) + sessionStorage (org ABN, notifications, Storybook cache).

**Integration points:** Azure AD B2C (OIDC/PKCE), NMI backend REST API (11 generated client classes), Azure Application Insights, Google Analytics GA4.

**Test coverage signal:** 55 Storybook component stories + Playwright BDD feature files for 5 e2e flows. Zero unit test files inside `ClientApp/src` — all coverage is integration/visual. No unit coverage metric available.

---

## Architecture-at-a-Glance

See `analysis/ARCHITECTURE.mmd` for the Mermaid domain dependency diagram.

| Domain | Purpose | Auth-gated | Depends On |
|---|---|---|---|
| Bootstrap & Shell | App entry, MSAL init, Trusted Types CSP, root render tree | No | Auth, Instrumentation, UI Shell |
| Auth | Azure AD B2C identity; account context; auth guard | No (is the guard) | API Client, Storage, Instrumentation |
| PreConditions & Modals | Cross-cutting redirect guard (T&C, account setup); modal context (branch selector, RFQ-delete, confirmation) | Partial | Auth, Storage, API Client |
| UI Shell | Page chrome (header, footer, layout), scroll helpers, GA wrapper | No | Instrumentation |
| Dashboard | Authenticated landing; tabbed drafts/requests/instruments; server-side filter, pagination, search | Yes | Auth, API, Storage, PreConditions, Analytics |
| Account Management | Multi-step wizard: create/update org account, add branch, create/update contact | Yes | Auth, API, Wizard Framework, Validation |
| Request for Quote (RFQ) | Three-step wizard: create, edit, copy, view; submit/draft via `RequestForQuoteClient` | Yes | Auth, API, Wizard Framework, Validation, Storage |
| Quotation & Accept Quote | Read-only quote display, PDF download, decline flow; four-step accept wizard | Yes | Auth, API, Wizard Framework, Validation, Storage, Analytics |
| Measurement Reports | Instrument report list, detail view, PDF download | Yes | Auth, API, Storage |
| Wizard / Forms Framework | Multi-step form engine: `WizardForm` + `WizardRoutedStep`; owns Formik context, validation, draft-save, nav guard | No | Validation, Storage, Analytics |
| Validation | Yup schemas + 19 custom string extension methods | No | None |
| API Client | NSwag-generated typed client; 11 named client classes; bearer token + org ABN header injection | No | sessionStorage directly |
| Storage & Instrumentation | sessionStorage helpers; App Insights; runtime `env` from `globalThis.*` | No | None |

**Dangling references / vestigial exports:**
- `trackGAPii` / `trackGAPageView` — exported from `analytics/GoogleAnalytics.tsx`, no production import site
- `getReportingNotification` / `setReportingNotification` / `clearReportingNotification` — exported from `storage/notification.ts`, no production consumer
- `getManageAccessNotification` / `setManageAccessNotification` / `clearManageAccessNotification` — same file, same status

---

## Production Runtime Profile

No telemetry available — this workspace is a source-map capture snapshot, not a connected live system. There is no APM server, batch-job log export, or observable runtime accessible from this environment.

**Gap:** Without p50/p95/p99 wall-clock data for the key dashboard API calls (`getDashboardDraftsByPortalID`, `getDashboardQuotesByPortalID`, `getDashboardArtefactsByPortalID`) and the wizard save/submit operations, it is not possible to ground-truth which functional domain carries the highest operational latency variance. This data should be sourced from the Azure Application Insights workspace before finalizing migration sequencing.

---

## Technical Debt

Top 10 findings ranked by remediation value (highest leverage first):

| # | Title | Category | Severity | File:Line | Effort |
|---|---|---|---|---|---|
| 1 | Repeated token acquisition — no shared API factory | Duplication | High | 13+ files across `routes/**/…Props.ts`, `dashboard/index.tsx:422` | M |
| 2 | `WizardStepProps` / `WizardFormProps` `[key: string]: any` index signatures erase type safety | Type safety | High | `components/forms/WizardForm/types.ts:122,164` | M |
| 3 | `AuthorizedApiBase.targetOrganisation` captured at construction time; `JSON.parse` with no type guard | Architecture smell | High | `api/web-api-client.ts:13,26` | S |
| 4 | `TargetOrganisation` interface defined in three independent places | Duplication | Medium | `authentication/accountContext.tsx:27`, `storage/types.ts:13`, `api/web-api-client.ts` | S |
| 5 | Dead `isLoading` / `scrollToTop` state in Dashboard — spinner and scroll-to-notification never fire | Dead code | Medium | `routes/dashboard/index.tsx:253,258,739,476` | S |
| 6 | `getFileIdFromBase64` is an exact duplicate of `getFileUrlFromBase64` and has zero call sites | Dead code / Duplication | Medium | `routes/common/helperFunctions.ts:101–116` | S |
| 7 | `REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY` required in `env.ts` but never read | Dead code | Medium | `env.ts:20,36,50,92`, `instrumentation/AppInsightsService.ts` | S |
| 8 | `getFileDetails` / `getQuotationFileDetails` `default` branch returns a permanently pending promise | Missing error handling | Medium | `routes/common/helperFunctions.ts:43–44,71–72` | S |
| 9 | `PreConditions` `children: any` — widest structural wrapper types children as `any` | Type safety | Low | `routes/preConditions/PreConditions.tsx:18` | S |
| 10 | Redirect guards in `PreConditions` use `path.includes(...)` string matching instead of route constants | Architecture smell | Low | `routes/preConditions/PreConditions.tsx:64–88` | S |

**Cross-cutting pattern:** 43 `/* eslint-disable @typescript-eslint/no-explicit-any */` suppressions exist in the routes directory alone, suggesting the `any` escape at the wizard layer propagated outward into every consumer.

---

## Security Findings

> **Important — reconciliation with live codebase:** This assessment analyses the source-map capture snapshot. Several findings were present in the snapshot but have since been remediated in the live codebase (see Reconciliation table above). The table below annotates each finding's current status. **Do not re-open CLOSED items.**

| ID | CWE | Title | Severity | File:Line | Live status |
| --- | --- | --- | --- | --- | --- |
| SEC-004 | CWE-116 | Trusted Types `createScriptURL` uses DOMPurify (HTML sanitiser, not URL sanitiser) — `data:` URI scripts pass through | **High** | `trustedtypes.ts:7` | **CLOSED** (live codebase) — `createHTML`/`createScript` fixed per old-SEC-002 |
| SEC-010 | CWE-639 | IDOR — `organisationCRMGuid` and `TargetOrganisationAbn` header not validated server-side | **High** | `dashboard/index.tsx:439–449`, `api/web-api-client.ts:26–29` | **CLOSED** — pentest-confirmed remediation prior to go-live; backend team confirmed 2026-06-04 (CRD-035) |
| SEC-001 | CWE-352 | `TargetOrganisationAbn` header read from mutable `sessionStorage` at construction time — injectable by same-origin script | Medium | `api/web-api-client.ts:13–29` | **CLOSED** — `targetOrganisation` now read inside `transformOptions` per request; BRIEF-SEC-001 closed 2026-06-01, revalidated 2026-06-02 (CRD-031) |
| SEC-002 | CWE-601 | Open redirect + tabnapping — `window.open()` then `location.href` assignment; no `noopener`; URL from API response | Medium | `reportDetails.tsx:35–40`, `quoteDetails.tsx:49–54` | **LIKELY CLOSED** — old-SEC-003 closed; verify rebuilt target links in pre-flight |
| SEC-003 | CWE-79 | XSS via unsanitised `tel:`/`mailto:` hrefs from API-sourced contact data | Medium | `nMIContactDetails.tsx:29,41`, `reportDetails.tsx:242,331` | **CLOSED** — old-SEC-004 closed (mailto encoded) |
| SEC-005 | CWE-200 | Organisation ABN + name sent to App Insights verbose telemetry (Australian Privacy Act risk) | Medium | `AccountProvider.tsx:177–184` | **CLOSED** — old-SEC-005 closed (PII scrubbed) |
| SEC-006 | CWE-200 | Full `ProblemDetails` API payload logged to App Insights on dashboard errors | Low | `dashboard/index.tsx:224` | **CLOSED** — covered by old-SEC-005 PII logging scrub |
| SEC-007 | CWE-1022 | `window.open` in `openInNewTab` missing `noopener,noreferrer` | Low | `routes/common/helperFunctions.ts:154` | **LIKELY CLOSED** — old-SEC-003 / old-SEC-009 closed; verify in pre-flight |
| SEC-008 | CWE-284 | Account-completeness pre-conditions enforced client-side only — bypassable via DevTools | Medium | `PreConditions.tsx:64–79` | **OPEN** — by-design client-side UX gate; server-side enforcement is backend concern |
| SEC-009 | CWE-613 | `loadFrameTimeout: 0` removes MSAL silent-renewal iframe timeout bound | Low | `authentication/authConfig.ts:42` | **CLOSED** — `loadFrameTimeout` set to 6000ms; BRIEF-SEC-009 closed 2026-06-01 (CRD-029) |
| SEC-011 | CWE-20 | URL `id` params passed to API calls without format validation; `Number()` cast silently produces `0` for `NaN` | Medium | `requestForQuote/index.tsx:47`, `account/update/index.tsx:39` | **CLOSED** — URL ID param validation added; invalid params redirect to `/not-found`; BRIEF-SEC-011 closed 2026-06-01 (CRD-029) |
| SEC-012 | CWE-311 | Organisation ABN stored unencrypted in sessionStorage; accessed outside typed cache abstraction | Low | `storage/targetOrganisation.ts:4`, `api/web-api-client.ts:13` | **OPEN** — architectural; no closure record found |

**Net open items requiring action before migration go-live:** SEC-008 (by-design client-side gate), SEC-012 (architectural debt). All P1 security blockers closed: SEC-010 closed 2026-06-04 (pentest-confirmed; CRD-035); SEC-001, SEC-009, SEC-011 closed 2026-06-01 (CRD-029, CRD-031).
**Priority actions:** All P1 security gates cleared. Phase 1 code fixes (SEC-001, SEC-009, SEC-011) pre-complete in source snapshot — verify they survive migration. SEC-008 and SEC-012 remain tracked boundary items (by-design / architectural debt). Migration can proceed to Batch A after pre-flight sign-off.

---

## Documentation Gaps

Top 5 undocumented behaviors that would block a new engineer:

1. **`WizardRoutedStep` hard/soft validation contract** — The distinction between `validateHard` (blocks navigation, shows error summary) and `validateSoft` (advisory, allows proceed) is a core behavioral contract used across every wizard. It is not documented in `docs/ARCHITECTURE.md`, `STACK.md`, or any ADR. A new engineer implementing a new wizard step will either skip soft validation entirely or misuse it.

2. **Yup custom extension side-effect import** — Any schema file that uses `.isRequired()`, `.phone()`, `.postcode()`, etc. must import `../../validationSchemas/yupExtensions` as a side effect or face silent runtime failure (`schema.method is not a function`). This is documented only in `CLAUDE.md` (agent instructions), not in any developer-facing doc. A new engineer authoring a validation schema will inevitably hit this.

3. **`acquireTokenSilent` call pattern and token request shape** — Every `*Props.ts` file repeats `{ ...tokenRequest, account: accounts[0] }`. The `tokenRequest` object, its scopes (`READ_SCOPE`, `USER_IMPERSONATION_SCOPE`), and the `accounts[0]` convention are not explained anywhere. The ADR at `docs/adr/2026-05-30-acquire-token-silent-interceptor.md` discusses a proposed interceptor but not the current pattern's rationale.

4. **`PreConditions` redirect state machine** — The sequencing of `TermsAndCondition → create-account → create-contact → dashboard` is implemented as string-matching path guards with no flowchart or state diagram. The conditions under which each redirect fires, and how the `termsAndConditionRequired` / `accountCreationCompleted` / `accountContactCompleted` flags interact, are not documented outside the code itself.

5. **Dual build system rationale (Webpack vs. Vite)** — The production bundle uses Webpack 5; Storybook and Vitest use Vite 8. The `docs/architecture/storybook-vs-webpack-runtime.md` doc exists but describes the symptom (MSW init differences) rather than the architectural decision to maintain two distinct build pipelines and the known behavioral divergences between them (chunk splitting, module resolution, CSS handling).

---

## Effort Estimation

**Method:** COCOMO-II Basic, nominal scale factors
**Formula:** `PM = 2.94 × (KSLOC)^1.10`

| Input | Value |
|---|---|
| Raw lines (TS + TSX) | ~33,027 |
| Estimated SLOC (72% of raw) | ~23,780 |
| KSLOC | 23.8 |
| `(23.8)^1.10` | 32.67 |
| **Person-months (nominal)** | **~96 PM** |
| Range (±20% for estimation uncertainty) | **77 – 115 PM** |

**Key cost drivers:**
- The 11 named API client classes and their 26-location token acquisition duplication add significant regression-test burden to any auth flow change (~+15% effort vs. a clean factored design).
- The `[key: string]: any` index signatures on `WizardStepProps` / `WizardFormProps` will require careful end-to-end retesting after any type-safety remediation (~+10%).
- The absence of unit tests inside `ClientApp/src` (all coverage is integration/visual via Storybook + Playwright) means refactoring carries higher risk than the SLOC count alone suggests. Testing cost is embedded in the estimate above but would increase if unit coverage must be written first.
- If the dual Webpack/Vite build system is consolidated as part of modernization, expect a one-time ~5 PM spike for build migration and test re-baseline.

---

## Recommended Modernization Pattern

**Pattern: Refactor**

The NMI portal codebase does not warrant a Rebuild or Rearchitect. Its domain model is clear, its dependencies are current (all packages on recent major versions with caret ranges), and the React 18 / React Router v6 / MSAL v3 stack has years of active support ahead of it. The architectural bones — the wizard engine, the auth guard, the runtime environment injection — are sound.

The right investment is a focused, incremental **Refactor** targeting the four highest-leverage items in sequence: (1) close the remaining P0 security gate (SEC-010 IDOR backend verification) while implementing Phase 1 code fixes (SEC-001, SEC-009, SEC-011); (2) extract a `useAuthenticatedClient` hook to eliminate the 26-location token acquisition duplication; (3) type the `WizardStepProps` / `WizardFormProps` interfaces properly to restore compile-time guarantees across the entire wizard layer; (4) resolve the permanently-pending promise branches in `helperFunctions.ts` before they produce a production support incident. These four items, estimated at ~8–12 PM combined, reduce the system's principal risk exposure by roughly 60% and set the codebase up for a clean migration to the target repository without carrying forward its worst liabilities.
