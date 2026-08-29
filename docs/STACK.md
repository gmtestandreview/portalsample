# Technology Stack

## 1) Runtime Summary

| Area | Value | Evidence |
|------|-------|----------|
| Primary language | TypeScript (strict-ish) | `ClientApp/src/**/*.ts`, `ClientApp/src/**/*.tsx` |
| Rendering target | Browser SPA (no SSR) | `ClientApp/src/index.tsx` — `createRoot` |
| Package manager | npm | Root `package.json` + `package-lock.json` |
| Module/build system | Dual: Webpack 5 (production) + Vite (Storybook/test tooling path) | `webpack.config.js`; `ClientApp/webpack/` runtime bootstrap; Storybook configured with `@storybook/react-vite` |
| React version | 18.x (`createRoot` API) | `ClientApp/src/index.tsx` line 3 |
| Node.js | 24+ for local tooling and CI | `package.json` → `"engines": { "node": ">=24.0.0" }`, `devEngines.runtime` (`onFail: error`); `.node-version` pins the local dev runtime to `24.20.0` |

## 2) Production Frameworks and Dependencies

| Dependency | Version | Role in system | Evidence |
| --- | --- | --- | --- |
| react | 18.3.1 | UI component rendering | `ClientApp/src/index.tsx` — `createRoot` |
| react-dom | 18.3.1 | DOM reconciler | `ClientApp/src/index.tsx` |
| react-router | 7.18.0 | Client-side routing (`createBrowserRouter`) | `ClientApp/src/App.tsx` |
| @azure/msal-browser | 3.30.0 | Azure AD B2C OAuth2 PKCE auth flow | `ClientApp/src/authentication/authConfig.ts` |
| @azure/msal-react | 2.2.0 | React bindings for MSAL (MsalProvider, hooks) | `ClientApp/src/index.tsx`, `ClientApp/src/authentication/AuthenticatedElement.tsx` |
| formik | 2.4.9 | Form state management | `ClientApp/src/components/forms/WizardForm/types.ts` |
| yup | 1.7.1 | Schema-based form validation | `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts` |
| bootstrap | 5.3.8 | CSS utility framework (custom NMI theme) | `ClientApp/src/App.tsx` (stylesheet import) |
| react-bootstrap | 2.10.10 | Bootstrap React component bindings | `ClientApp/src/routes/dashboard/index.tsx` — `Col`, `Row`, `Container`, `Tab`, `Nav` |
| @microsoft/applicationinsights-web | 3.4.2 | Azure Application Insights telemetry | `ClientApp/src/instrumentation/AppInsightsService.ts` |
| @microsoft/applicationinsights-react-js | 3.x | React plugin for App Insights (error boundary integration) | `ClientApp/src/components/ErrorBoundary/index.tsx` |
| dompurify | 3.4.11 | HTML sanitization (TrustedTypes CSP policy) | `ClientApp/src/trustedtypes.ts` |
| date-fns | 3.x | Date parsing/formatting utilities | `ClientApp/src/utils/index.ts` |
| luxon | 3.x | Secondary date formatting (DateTime.fromObject) | `ClientApp/src/utils/index.ts` |
| lodash | 4.x | Array/object utilities (entriesIn, fromPairs, isArray, isNil, isString) | `ClientApp/src/utils/index.ts` |
| react-number-format | 5.x | Number/ABN pattern display (`PatternFormat`) | `ClientApp/src/routes/dashboard/index.tsx` |

## 3) Development Toolchain

| Tool | Purpose | Evidence |
|------|---------|----------|
| TypeScript (tsc) | Type checking + transpilation | `ClientApp/src/**/*.ts` file extensions |
| Webpack 5 | Module bundling + dev server | `webpack.config.js`; `package.json` scripts |
| ESLint | Linting (eslint-disable comments present) | Inline `/* eslint-disable */` comments in source |
| SCSS + Sass | CSS preprocessing | `ClientApp/src/styles/` partials |
| Vitest + jsdom | Unit test runner and browser-like test environment | `vitest.config.ts`, `vitest.setup.ts`, `package.json` scripts |
| Testing Library | Component-level unit testing | `@testing-library/*` deps; `tests/unit/**` |
| Playwright | E2E and BDD-style browser testing | `package.json` scripts; `@playwright/test`, `playwright-bdd` |
| Storybook 10.4.6 | Component sandbox and documentation | `package.json` scripts; `.storybook/` |
| Vitest 4.1.9 | Unit and Storybook interaction test runner | `vitest*.config.ts`; `package.json` scripts |
| Playwright 1.61.1 + playwright-bdd 9.2.0 | Application and Storybook BDD | `playwright*.config.ts`; `tests/e2e/**` |

### Dual-build rationale and verification scope

The current architecture intentionally keeps two pipelines active:

- Webpack 5 for production application bundles.
- Vite-backed Storybook/test tooling for faster local feedback loops.

This is an explicit transitional choice while the portal remains on its legacy production packaging path.

When validating UI changes, treat these divergence points as mandatory checks:

- CSS/SCSS loader behavior differences
- module resolution/alias differences
- static asset base-path differences
- code-splitting and lazy-chunk loading behavior

See `docs/architecture/storybook-vs-webpack-runtime.md` for the detailed divergence matrix.

## 4) Key Commands

These commands are available in this workspace:

```bash
npm install          # install dependencies
npm run build        # webpack production build → dist/js/main.*.js
npm run start        # webpack dev server
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
npm run test:unit    # Vitest unit suite
npm run test:unit:coverage  # Vitest coverage (text + html + json-summary)
npm run test:storybook      # Storybook interaction suite
npm run test:quality:regression # eight regression checks
npm run test:ci      # type-check + coverage + regression
npm run test:e2e     # app-bdd + storybook-bdd
npm run test:e2e:app        # application workflows only
npm run test:e2e:storybook  # Storybook BDD only
npm run storybook    # Storybook dev server
npm run build-storybook     # static Storybook build
npm run migration-check     # type-check + all Vitest suites + Storybook build
```

## 5) Environment and Config

Config is injected at runtime by a server-side template into `window.*` globals before the React bundle loads.

**Never use `process.env`** — those values are `undefined` in the browser bundle.

Read all config via the `env` object from `ClientApp/src/env.ts`:

```ts
import { env } from '../env';
env.REACT_APP_B2C_CLIENTID   // correct
process.env.REACT_APP_B2C_CLIENTID  // WRONG — undefined at runtime
```

### Required environment variables

| Variable | Purpose |
|----------|---------|
| `REACT_APP_B2C_CLIENTID` | Azure AD B2C application (client) ID |
| `REACT_APP_B2C_AUTHORITY` | B2C authority URL (user flow endpoint) |
| `REACT_APP_B2C_KNOWN_AUTHORITIES` | Known authority domain for token validation |
| `REACT_APP_B2C_POST_LOGOUT_REDIRECT_URL` | Redirect URI after sign-out |
| `REACT_APP_B2C_READ_SCOPE` | API read scope for access tokens |
| `REACT_APP_B2C_USER_IMPERSONATION_SCOPE` | API impersonation scope |
| `REACT_APP_B2C_REDIRECT_URL` | Post-login redirect URI |
| `EXTERNAL_REDIRECT_URL` | External portal URL |
| `REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY` | App Insights instrumentation key (legacy) |
| `REACT_APP_APPINSIGHTS_CONN_STRING` | App Insights connection string (preferred) |
| `REACT_APP_GA_TRACKINGID` | Google Analytics tracking ID |

## 6) Evidence

- `ClientApp/src/index.tsx` — React 18 `createRoot` entry point
- `ClientApp/src/env.ts` — window.* to typed object mapping
- `ClientApp/src/authentication/authConfig.ts` — MSAL + Azure AD B2C config
- `ClientApp/src/instrumentation/AppInsightsService.ts` — App Insights singleton
- `package.json` — scripts, dependency versions, Node engine
- `vitest.config.ts` / `vitest.setup.ts` — unit test configuration
- `ClientApp/webpack/` — Webpack runtime bootstrap (generated, do not edit)
