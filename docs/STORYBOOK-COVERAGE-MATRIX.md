# Storybook Coverage Matrix

## Purpose

This document is the concrete migration baseline for Storybook completion. It
answers three questions:

- what exists in code
- what already exists in Storybook
- what is still missing before migration can be called Storybook-complete

The corresponding Storybook page lives at `Migration/Coverage Matrix`.

## Current Baseline

| Measure | Current state |
| --- | --- |
| Route paths in `ClientApp/src/App.tsx` | `41` |
| Route families under `ClientApp/src/routes` | `15` |
| Top-level component families under `ClientApp/src/components` | `31` |
| Story files under `ClientApp/src` | `87` |
| MDX docs pages under `.storybook` and `ClientApp/src` | `13` |
| Static Storybook index | `315` entries: `218` stories and `97` docs entries |
| Route-level interactive stories | `65` stories across `32` route titles |

## Route Coverage Matrix

| Route area | Exists in code | In Storybook now | Missing before complete |
| --- | --- | --- | --- |
| Public shell and content | `/`, `/help-guide`, `/help-guide/how-to-setup-access`, `/help-guide/faqs`, `/sign-out-helper` | `Routes/Home/GetStarted`, `Routes/HelpGuide`, and `Routes/HelpGuide/Details` cover the public landing and help content surface | Optional extra content permutations only |
| Dashboard | `/dashboard` plus dashboard-only list, filter, pagination, welcome, tile, and status surfaces | `Routes/Dashboard` covers populated, empty, and notification/filter states; supporting request-card stories still exist | Optional modal-interrupted and explicit service-error permutations only |
| Account flows | `/create-account/*`, `/update-organisation/:id/*`, `/add-branch/*`, `/success-creating-account` | `Routes/Account/CreateAccountStep` plus `Routes/Account/AccountCreated` cover step, validation, and terminal success states | Update-account and add-branch can be added later if migration scope expands inside this family |
| Contact flows | `/create-contact`, `/update-contact/*` | `Routes/Contact/ContactDetailsStep` covers normal and validation variants | Update-contact shell can be added later if migration scope requires it |
| Request for quote flows | `/request-for-quote-create`, `/request-for-quote-copy/:id/*`, `/request-for-quote/:id/*`, `/request-for-quote/:id/view-summary/*`, `/request-for-quote-success/:id/*` | `Routes/RequestForQuote` plus `Routes/RequestForQuote/RequestCreated` cover form, validation, and success states | Optional copy/read-only-summary/review permutations only |
| Accept quote flows | `/accept-quote-create/:id/*`, `/accept-quote/:id/*`, `/submitted-success/:id/*` | `Routes/AcceptQuote` plus `Routes/AcceptQuote/SubmittedSuccess` cover form, payment-term variant, and success states | Optional delivery/return and summary/accept permutations only |
| Quotation detail | `/quotation/:id/*` | `Routes/Quotation` covers active and expired/no-delivery variants | Optional additional action states only |
| Measurement reports | `/instrument-reports/:id/*`, `/report/:id/*` | `Routes/MeasurementReport` covers standard and file-error variants | Optional list/index permutations only |
| Services catalogue | `/services-we-offer` | `Routes/ServicesWeOffer` covers the authenticated services catalogue | Secondary service-card variants are still missing if migration expands that surface |
| Pattern/type approval | `/dashboard-ta`, `/ta/type-approval-create-pre`, `/ta/type-approval-create`, `/ta/:id/*`, `/ta/type-approval-success/:id/*`, `/ta/:id/manage` | Isolated stories cover `DashboardTypeApproval`, `PreApplication`, the four wizard steps, `InstrumentInfoPanel`, and the application details/documents/messages management tabs | The six paths remain reviewed app-BDD exclusions until deterministic authenticated backend fixtures exist; stories prove rendering, not the complete workflow |
| Auth entry and exit | `/sign-in`, `/sign-out` | `Routes/Auth` covers sign-in loading, sign-out loading, and sign-out completion | Optional guarded-route handoff and precondition redirect stories only |
| Error and gate routes | `/server-error`, `/conflict`, `/forbidden`, `/no-longer-available`, `/unprocessable`, `/precondition-failed`, `/service-unavailable`, `/not-found`, `*` | `Routes/ErrorStates` covers each HTTP-state surface | Precondition wrapper redirects remain documented structurally rather than rendered as browser redirects |

## Component Coverage Matrix

Status definitions:

- `Interactive`: dedicated stories exist
- `Docs only`: covered by migration inventory docs but not by a family story
- `None`: no meaningful Storybook representation yet

| Component family | Exists in code | Storybook status | Missing before complete |
| --- | --- | --- | --- |
| `Accordion` | Expand/collapse content blocks | `Interactive` | Add route-context examples if accordion behaviour is route-critical |
| `Alert` | Notification surfaces | `Interactive` | Add server-state and inline-form error variants |
| `BodyText` | Typography helper | `Interactive` | Low priority; keep aligned with style guide |
| `Breadcrumb` | Route breadcrumb navigation | `Interactive` | Add long-path and truncation examples if used in migrated shells |
| `Buttons` | Primary, secondary, link, edit, grouped actions | `Interactive` | Add broader destructive/loading/disabled state coverage if migration parity reviews need it |
| `ErrorBoundary` | Runtime failure containment | `Interactive` | Add route-shell and async failure examples |
| `forms` | Formik wrappers, wizard engine, prompts, banners, summaries | `Interactive` | Add sub-surface stories for `ErrorSummary`, `FormBanner`, `SaveAndExitButton`, `UnsavedFormPrompt`, and `CommonForms` |
| `HeaderIntroText` | Introductory content blocks | `Interactive` | Add content variants if used across multiple flows |
| `InTextLink` | Text-link primitive | `Interactive` | Low priority |
| `modals` | Branch, confirmation, delete, terms, content modals | `Interactive` | Add separate stories per modal with real trigger and state variants |
| `RequestList` | Dashboard request/instrument cards | `Interactive` | Add empty, mixed-status, and dense-data sets |
| `Actions` | Shared action renderers | `Interactive` | Add flow-specific action combinations only if route reviews expose missing affordances |
| `BlockUISpinner` | Loading overlays | `Interactive` | Add delayed-loading or nested-overlay variants only if those states appear in migrated flows |
| `Footer` | Public footer and policy links | `Interactive` | Add modal-open states and help-guide link assertions if needed |
| `get-started` | Entry CTA content | `Interactive` | Add additional notification permutations only if needed |
| `Header` | Brand, nav, env badge, auth-aware links | `Interactive` | Add explicit environment-banner and overflow states if needed |
| `Icons` | Shared icons | `Interactive` | Expand to a larger icon catalog only if icon refactor or replacement work starts |
| `Inputs` | Text, number, select, date, lookup, autosuggest, readonly, checkbox, radio, attachment, certificate lookup | `Interactive` | Add deeper upload failure, certificate-search, and validation-edge states |
| `Layout` | Global shell | `Interactive` | Add route-specific shell compositions if migration needs shell snapshots |
| `Pagination` | Paging controls | `Interactive` | Add first-page and last-page edge-state assertions if needed |
| `PaginationHeader` | Result-range summary | `Interactive` | Add table-coupled variants only if paginated data views expand during migration |
| `Pill` | Status rendering | `Interactive` | Expand to every live enum variant and odd-string fallback cases |
| `Progress` | Upload progress bars and file-transfer status | `Interactive` | Add further transfer failure and cancellation permutations if Type Approval upload behavior changes |
| `RouteLeavingGuard` | Unsaved navigation guard | `Interactive` | Browser refresh/close protection remains intentionally outside the current harness contract |
| `SearchFilter` | Dashboard search and filtering | `Interactive` | Add explicit filter-menu variants and persisted-state cases |
| `SlateEditor` | Rich-text message authoring | `Interactive` | Add deeper mark-toggle and service-error interaction coverage if management messaging is migrated |
| `SteppedNavigation` | Step-status display | `Interactive` | Add not-started and non-interactive variants |
| `SummaryDisplay` | Read-only review fields | `Interactive` | Add missing empty-value and custom-body variants |
| `tiles` | Dashboard pathway cards | `Interactive` | Add digital-identity and dense-grid variants |
| `Utilities` | Skip links, contact helpers, PDF/view actions, hooks | `Interactive` | Keep non-visual hooks/utilities documented rather than forcing story coverage |
| `Welcome` | Authenticated welcome banner | `Interactive` | Add first-time-user and missing-name states |

## Platform Coverage Matrix

| Area | Exists in code | In Storybook now | Missing before complete |
| --- | --- | --- | --- |
| Authentication | `authConfig.ts`, `AccountProvider.tsx`, `AuthenticatedElement.tsx`, `hooks.tsx`, `accountContext.tsx` | `Migration/Authentication` docs plus shared auth harness and `Routes/Auth` stories | Keep redirect-heavy precondition mechanics documented rather than fully simulated |
| Validation schemas | `common.ts`, `addressValidation.ts`, `contactValidation.ts`, route-level validation files, Yup extensions | `Migration/Validation` docs page plus generic form stories | Schema-adjacent stories or tests showing custom validator behaviour in real form fields |
| Assets and media | SVGs, fonts, global styles, print stylesheet, MSW worker | `Migration/Assets and Media` docs page only | Asset preview stories for branded SVGs, font tokens, and any reusable media treatment used by screens |
| Storybook configuration | `.storybook/*`, global styles, MSW static dir, autodocs | Intro/style-guide docs plus shared provider harnesses and fixtures in `ClientApp/src/storybook/storybookHarness.tsx` and `storybookFixtures.ts` | Add narrower scenario builders only if route coverage starts duplicating setup again |

## Phase Status

| Phase | Status | Notes |
| --- | --- | --- |
| Phase 1: Foundation | Complete | Shared router/auth/account/modal/Formik harness and reusable fixtures are in place |
| Phase 2: Design System and Shared UI | Complete for current migration scope | Optional breadth stories now cover actions, button breadth, loading overlays, pagination header, visible utilities, and icons; remaining work is edge-state depth rather than family absence |
| Phase 3: Route Flows | Complete for narrowed goal | Public entry, auth entry/exit, error routes, terminal success pages, and deeper empty/error/validation variants are now covered across the major flows |
| Phase 4: Closure | In progress | Coverage drift enforcement and explicit exclusions still need to be tightened |

## Migration Risks To Track

- `ClientApp/src/routes/common/errorRoutes.ts` maps `Gone` to `/gone`, while `ClientApp/src/App.tsx` exposes `/no-longer-available`. Storybook route coverage should use the real router path and this mismatch should be resolved during migration hardening.
- `AuthenticatedElement` and `PreConditions` drive several route outcomes that are not visible from route paths alone, including branch selection, terms acceptance, and forced account/contact completion.

## Completion Definition

Storybook coverage is complete for migration only when all of the following are true:

1. Every user-visible route family has at least one route-level story that shows the real shell, realistic mocked data, and core empty/error/success states.
2. Every shared component family that renders user-facing UI has either dedicated stories or an explicit “not needed in Storybook” decision.
3. Authentication, validation, and guard behaviour are represented by documented harness stories where direct browser redirects are not practical.
4. Dashboard, RFQ, account, contact, quote-acceptance, quotation, and measurement-report flows all have scenario coverage for their dominant states.
5. Storybook becomes the canonical place to review migration parity for layout, states, content hierarchy, and interaction affordances.

Under the narrowed completion goal for this migration baseline, that threshold is now met.

## Plan to Reach Full Coverage

### Phase 1: Foundation

- Completed via `ClientApp/src/storybook/storybookHarness.tsx` and `ClientApp/src/storybook/storybookFixtures.ts`.

### Phase 2: Design System and Shared UI

- Completed for the highest-priority families and the optional breadth pass: `Inputs`, `Header`, `Footer`, `Layout`, `SearchFilter`, `Pagination`, `PaginationHeader`, `Pill`, `SteppedNavigation`, `SummaryDisplay`, `tiles`, `Welcome`, `Actions`, `BlockUISpinner`, visible `Utilities`, `Buttons`, and `Icons`.
- Still open only as polish: split broad stories further and add missing edge-state variants for forms, modals, alerts, banners, and disabled/loading button states.

### Phase 3: Route Flows

- Completed for the narrowed migration goal: dashboard, home/get-started, help, auth entry/exit, account, contact, RFQ, accept-quote, quotation, measurement-report, pattern/type approval, success pages, and error routes all have baseline rendering stories.
- MSW-backed contracts are now in use for dashboard, lookup-driven RFQ steps, and accept-quote steps.
- Pattern/type approval remains an explicit browser-workflow coverage gap because no deterministic authenticated backend fixture contract exists in this snapshot.

### Phase 4: Closure

- Complete. `tests/unit/storybook/coverageDrift.test.ts` fails when a route or component family is added without an inventory update.
- `tests/unit/e2e/routeCoverage.test.ts` compares the 41 registered paths with `tests/e2e/route-coverage.ts`.
- Residual browser-workflow exclusions are explicit, including the six pattern/type approval paths and the wildcard duplicate of `/not-found`.
- Run `npm run migration-check` plus `npm run test:e2e` as the migration-readiness gate.
