# Project Structure

## 1) Directory Layout

```
portal.measurement.gov.au/           ← workspace root
├── AGENTS.md                         ← AI coding agent context (first stop)
├── CLAUDE.md                         ← Claude Code instructions
├── .gitignore
├── package.json                      ← npm scripts, dependencies, Node engine
├── package-lock.json                 ← npm lockfile
├── webpack.config.js                 ← Webpack 5 config for build/dev server
├── tsconfig.json                     ← TypeScript config
├── vitest.config.ts                  ← Vitest workspace root (composes unit + storybook projects)
├── vitest.unit.config.ts             ← unit project: jsdom, 100% thresholds, coverage reporters
├── vitest.storybook.config.ts        ← story play functions in real Chromium (Browser Mode)
├── playwright.storybook.config.ts    ← storybook-bdd project
├── vitest.setup.ts                   ← Shared test setup (`jest-dom`, globals, mocks)
├── playwright.config.ts              ← Playwright E2E + BDD config
├── index.html                        ← HTML template (webpack HtmlWebpackPlugin)
│
├── tests/                            ← All test source
│   ├── unit/                         ← Vitest unit suites and helpers
│   └── e2e/                          ← Playwright BDD tests
│       ├── features/                 ← BDD feature files grouped by domain
│       │   ├── account/              ←   Account creation scenarios
│       │   ├── auth/                 ←   Login / sign-out scenarios
│       │   ├── quote/                ←   Quote acceptance scenarios
│       │   ├── rfq/                  ←   RFQ create/copy scenarios
│       │   └── storybook/            ←   Component-level BDD specs (25 files)
│       └── steps/                    ← Shared step definitions
│           ├── common.steps.ts
│           └── storybook.steps.ts
│
├── reports/                          ← ALL generated test output (gitignored)
│   ├── coverage/unit/                ← Vitest V8 coverage (html, json-summary, text)
│   ├── playwright/                   ← Playwright HTML report
│   ├── test-results/                 ← Playwright per-test artifacts
│   └── vitest/
│       ├── unit-junit.xml            ← CI JUnit report (`npm run test:ci:unit`)
│       ├── storybook-junit.xml       ← CI JUnit report (`npm run test:ci:storybook`)
│       └── quality-junit.xml         ← CI JUnit report (`npm run test:ci:quality`)
│
├── quality/                          ← QA workspace (regression configs, audits, docs)
├── .features-gen/                    ← Generated Playwright specs from `npx bddgen`
├── node_modules/                     ← Installed dependencies
├── docs/                             ← Architecture and onboarding docs (this folder)
├── .storybook/                       ← Storybook config for component development
├── .tours/                           ← CodeTour guided walkthroughs
├── plugins/                          ← Plugin assets
│
└── ClientApp/                        ← React web application
    ├── public/                       ← Static public assets (served at root in dev)
    │   └── fonts/                    ← Icon font files (woff, ttf, css)
    │
    ├── media/                        ← Static media assets (PNG, SVG logos)
    │
    ├── src/                          ← ★ PRIMARY EDITABLE SOURCE ★
    │   ├── index.tsx                 ← App bootstrap (MSAL → TrustedTypes → React render)
    │   ├── App.tsx                   ← createBrowserRouter — all 25+ route definitions
    │   ├── env.ts                    ← Runtime env vars from window.* (MUST use this)
    │   ├── types.ts                  ← Shared types: KeyValue, FilterKeys, HttpStatusCode
    │   ├── trustedtypes.ts           ← TrustedTypes CSP policy using DOMPurify
    │   │
    │   ├── styles/                   ← ★ EDITABLE: SCSS partials (NMI Bootstrap theme)
    │   │   ├── index.scss            ←   Main entry point — imports all partials
    │   │   ├── _variables.scss       ←   NMI design tokens + Bootstrap variable overrides
    │   │   ├── _bootstrap-import.scss ←  Bootstrap @import shim (isolated here only)
    │   │   ├── _mixins.scss          ←   focusGlow, focusDangerGlow, media breakpoints
    │   │   ├── media-print.scss      ←   Print-only styles (PDF export views)
    │   │   └── _*.scss               ←   Component-level SCSS partials (20 files)
    │   │
    │   ├── authentication/           ← Azure AD B2C / MSAL auth layer
    │   │   ├── authConfig.ts         ← MSAL Configuration + scopes + tokenRequest
    │   │   ├── accountContext.tsx    ← AccountContext definition + AccountDetails type
    │   │   ├── AccountProvider.tsx   ← Context provider — holds full user state
    │   │   ├── AuthenticatedElement.tsx ← Route auth guard (MsalAuthenticationTemplate)
    │   │   └── hooks.tsx             ← useAccountState(), useAccountDispatch() — use these instead of importing contexts directly
    │   │
    │   ├── api/
    │   │   └── web-api-client.ts     ← NSwag/OpenAPI auto-generated typed HTTP client
    │   │
    │   ├── components/               ← Reusable UI components
    │   │   ├── Layout/               ← Public page chrome (Header + Footer + GA + skip links)
    │   │   ├── Header/               ← Navbar: brand, auth/unauth nav items, env badge
    │   │   ├── Footer/               ← Footer + Terms, Privacy, Accessibility pages
    │   │   ├── ErrorBoundary/        ← React error boundary (functional, react-error-boundary) + App Insights reporting
    │   │   ├── Alert/                ← NotificationMessage + dismissable alerts
    │   │   ├── Breadcrumb/           ← Route breadcrumb navigation
    │   │   ├── Pagination/           ← Page number controls + visible range hook
    │   │   ├── PaginationHeader/     ← "Showing X–Y of Z" display
    │   │   ├── RequestList/          ← Dashboard list items: requestItem, instrumentItem
    │   │   ├── SearchFilter/         ← Filter menu + search box + filter types
    │   │   ├── SteppedNavigation/    ← Step indicator for multi-step forms
    │   │   ├── tiles/StandardPathway ← Dashboard quick-link pathway cards
    │   │   ├── Welcome/              ← Authenticated welcome banner
    │   │   ├── BlockUISpinner/       ← Full-screen + partial loading overlay
    │   │   │   ├── index.tsx         ←   Component
    │   │   │   └── index.scss        ←   Co-located styles (canonical copy)
    │   │   ├── Buttons/              ← PrimaryButton, LinkButton, ButtonGroup
    │   │   ├── Icons/                ← ExternalLinkIcon etc.
    │   │   ├── Inputs/               ← Form field primitives:
    │   │   │   ├── AddressLookup/    ←   Address autocomplete
    │   │   │   ├── DatePicker/       ←   Date picker
    │   │   │   ├── NumberInput/      ←   Numeric input with types
    │   │   │   ├── RadioButton/      ←   Single radio
    │   │   │   ├── RadioButtonGroup/ ←   Radio group
    │   │   │   ├── SelectInput/      ←   Dropdown select
    │   │   │   ├── TextAreaInput/    ←   Multi-line text
    │   │   │   └── TextReadOnly/     ←   Read-only display field
    │   │   ├── modals/               ← Dialog components:
    │   │   │   ├── ModalContext.tsx     ← Modal visibility state contexts + hooks (useModalState, useModalDispatch)
    │   │   │   ├── BranchSelectorModal/ ← Organisation/branch switcher
    │   │   │   ├── ConfirmationModal/   ← Generic yes/no confirmation
    │   │   │   ├── ContentModal/        ← Rich content modal
    │   │   │   ├── RFQDeleteModal/      ← RFQ deletion confirmation
    │   │   │   └── TermsAndCondition/   ← T&C acceptance modal
    │   │   ├── forms/
    │   │   │   ├── WizardForm/           ← ★ Multi-step form engine (compound component)
    │   │   │   │   ├── index.tsx         ←   Orchestrator: children → Routes
    │   │   │   │   ├── WizardStep.tsx    ←   Step wrapper: ErrorBoundary + GA
    │   │   │   │   ├── WizardRoutedStep.tsx ← Routed step: loads values, runs submit
    │   │   │   │   ├── NextStepButton.tsx   ← "Next" button with final-step variant
    │   │   │   │   ├── PreviousStepButton.tsx ← "Back" button
    │   │   │   │   └── types.ts          ←   WizardFormProps, WizardStepProps types
    │   │   │   ├── FormikForm/           ← Base Formik wrapper used by WizardRoutedStep
    │   │   │   ├── UnsavedFormPrompt/    ← Formik dirty-state navigation guard
    │   │   │   ├── ErrorSummary/         ← Validation error summary list
    │   │   │   ├── FormBanner/           ← Reference/title banner for form pages
    │   │   │   ├── HidableField/         ← Conditionally visible form field wrapper
    │   │   │   └── SaveAndExitButton/    ← Save-draft-and-exit form action
    │   │   ├── SummaryDisplay/           ← Read-only summary of form data
    │   │   └── Utilities/
    │   │       ├── hashLink.tsx          ← Anchor hash navigation
    │   │       ├── skipLinks.tsx         ← Accessibility skip-to-content links
    │   │       ├── backToTopButton.tsx   ← Scroll-to-top FAB
    │   │       ├── [deleted] routeAccessibleNavigation.tsx ← replaced by useRouteAccessibility hook (CRD-037)
    │   │       ├── routeChangeScrollTop.tsx ← Scroll reset on route change
    │   │       ├── contactDetails.tsx    ← NMI contact info component
    │   │       ├── useHtmlTitle.tsx      ← Sets document.title per page
    │   │       ├── useBodyClass.tsx      ← Adds CSS class to <body> per page
    │   │       └── findElementInTreeById.ts ← DOM utility
    │   │
    │   ├── routes/                   ← Page-level route components
    │   │   ├── dashboard/            ← ★ Main authenticated landing (tabs + pagination + API)
    │   │   ├── account/
    │   │   │   ├── create/           ←   Create account wizard
    │   │   │   ├── update/           ←   Update organisation details wizard
    │   │   │   ├── addBranch/        ←   Add branch/location wizard
    │   │   │   └── created/          ←   Account created confirmation
    │   │   ├── contact/
    │   │   │   ├── create/           ←   Create contact wizard
    │   │   │   └── update/           ←   Update contact wizard
    │   │   ├── requestForQuote/      ← ★ RFQ flow:
    │   │   │   ├── create/           ←   Create new RFQ wizard
    │   │   │   ├── copy/             ←   Copy existing RFQ
    │   │   │   ├── viewRequestForQuoteSummary/ ← Read-only RFQ view
    │   │   │   └── created/          ←   RFQ submission confirmation
    │   │   ├── acceptQuote/          ← Quote acceptance wizard + success page
    │   │   ├── quotation/            ← View quotation details
    │   │   ├── measurementReport/    ← View + list measurement reports
    │   │   ├── help-guide/           ← Help hub + how-to-setup-access + FAQs
    │   │   ├── sign-in/              ← Sign-in redirect handler
    │   │   ├── sign-out/             ← Sign-out flow
    │   │   ├── sign-out-helper/      ← Post sign-out intermediate page
    │   │   ├── services-we-offer/    ← Service catalogue
    │   │   ├── preConditions/        ← ToU/account-setup gate component
    │   │   └── common/               ← Shared route utilities:
    │   │       ├── constants.ts      ←   defaultFilter and other literals
    │   │       ├── enums.ts          ←   DashboardItemStatus enum
    │   │       ├── errorRoutes.ts    ←   HTTP status → error route map
    │   │       ├── quoteStatus.ts    ←   Quote status helpers
    │   │       ├── helperFunctions.ts ←  mapToUserProfile and other helpers
    │   │       └── dashboardNotifications.ts ← Notification message factories
    │   │
    │   ├── validationSchemas/        ← Yup validation
    │   │   ├── common.ts             ← Shared helpers (NotEmpty etc.)
    │   │   └── yupExtensions/
    │   │       ├── index.ts          ← Re-exports stringExtensions (side-effect entry point)
    │   │       └── stringExtensions.ts ← ★ 17 custom Yup string validators
    │   │
    │   ├── storage/                  ← Browser storage layer
    │   │   ├── sessionStorageCache.ts ← Generic typed sessionStorage wrapper
    │   │   ├── notification.ts        ← Dashboard notification session state
    │   │   ├── targetOrganisation.ts  ← Target org session state
    │   │   └── types.ts               ← StorageCache interface
    │   │
    │   ├── instrumentation/
    │   │   ├── AppInsightsService.ts  ← App Insights singleton + ReactPlugin
    │   │   └── AppLogger.ts           ← Structured logging: verbose/info/error
    │   │
    │   ├── analytics/
    │   │   └── GoogleAnalytics.tsx    ← GA component wrapper + trackGAEvent helper
    │   │
    │   ├── utils/
    │   │   └── index.ts               ← Pure utilities: date, string, bytes, currency
    │   │
    │   ├── parent/node_modules/       ← VENDOR: do not edit (formik, dompurify sources)
    │   ├── external/                  ← VENDOR: do not edit (ts-async, ts-utils)
    │   └── main.*.js                  ← GENERATED: do not edit
    │
    ├── css/
    │   └── main.*.css                 ← GENERATED: do not edit
    │
    ├── source-map-http-downloads/     ← VENDOR mirrors: do not edit
    └── webpack/                       ← GENERATED: webpack runtime bootstrap
```

### Test and tooling folders

| Path | Purpose |
|------|---------|
| `tests/unit/` | Vitest unit suites for components, helpers, and instrumentation |
| `tests/unit/helpers/` | Shared test wrappers and form helpers |
| `tests/e2e/features/` | BDD feature files grouped by domain (25 files) |
| `tests/e2e/features/storybook/` | Storybook BDD feature specifications |
| `tests/e2e/steps/` | Shared Playwright-BDD step definitions |
| `.features-gen/` | Generated Playwright specs from `npx bddgen` |
| `reports/coverage/unit/` | Unit coverage reports (`text`, `html`, `json-summary`) |
| `reports/vitest/` | CI-oriented JUnit output from `npm run test:ci` |
| `reports/playwright/` | Playwright HTML report |
| `reports/test-results/` | Per-test Playwright artifacts (traces, screenshots) |
| `.storybook/` | Storybook config for component development |

## 2) Entry Points

| Entry point | Purpose |
|-------------|---------|
| `ClientApp/src/index.tsx` | App bootstrap — top-level `await` MSAL init (line 16), TrustedTypes policy, then `createRoot` render. Provider order is `StrictMode` → `ErrorBoundary` → `MsalProvider` → `AccountProvider` → `RouterProvider`; `StrictMode` is outermost. |
| `ClientApp/src/App.tsx` | Router — `createBrowserRouter` + `createRoutesFromElements` |
| `ClientApp/src/styles/index.scss` | SCSS entry point for the NMI Bootstrap theme |

## 3) Key Files (read these early)

| File | Why critical |
|------|-------------|
| `ClientApp/src/env.ts` | All runtime config lives here; `process.env` is undefined at runtime |
| `ClientApp/src/authentication/hooks.tsx` | ONLY way to access AccountContext — exports `useAccountState()` and `useAccountDispatch()`; do not import the contexts directly |
| `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts` | Side-effect import required in every Yup schema that uses custom methods |
| `ClientApp/src/api/web-api-client.ts` | Auto-generated; never hand-edit; regenerate via NSwag on backend schema change |
| `ClientApp/src/routes/common/errorRoutes.ts` | Maps HTTP status codes to error page routes — use this, don't hardcode paths |

## 4) Edit Boundaries

| Status | Paths |
|--------|-------|
| **Edit freely** | `ClientApp/src/**/*.ts`, `ClientApp/src/**/*.tsx`, `ClientApp/src/styles/**/*.scss` |
| **Edit with care** | `docs/**/*.md`, `tests/**/*.ts`, `tests/**/*.tsx`, `vitest.config.ts`, `vitest.unit.config.ts`, `vitest.storybook.config.ts`, `quality/vitest.regression.config.ts`, `vitest.setup.ts`, `playwright.config.ts`, `playwright.storybook.config.ts`, `webpack.config.js`, `package.json`, `sonar-project.properties`, `.github/workflows/**` |
| **Never edit** | `ClientApp/src/main.*.js`, `ClientApp/css/main.*.css`, `ClientApp/source-map-http-downloads/**`, `ClientApp/src/external/**`, `ClientApp/webpack/**`, `ClientApp/src/parent/node_modules/**`, `reports/**`, `node_modules/**` |

## 5) Evidence

- `ClientApp/src/index.tsx` — bootstrap entry
- `ClientApp/src/App.tsx` — full route tree
- `package.json` — root scripts and tooling entrypoint
- `AGENTS.md` — architecture pointer table
