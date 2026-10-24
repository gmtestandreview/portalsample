<!-- Generated: 2026-10-21 | Files scanned: 1537 | Token estimate: ~500 -->

# External Dependencies & Integrations

## Runtime Services

| Service | Integration point | Purpose |
|---------|-------------------|---------|
| Azure AD B2C | `@azure/msal-browser`, `@azure/msal-react` | Identity provider — login, token |
| NMI REST API | `ClientApp/src/api/web-api-client.ts` (NSwag) | All data operations |
| Azure App Insights | `ClientApp/src/instrumentation/AppInsightsService.ts` | Telemetry / error tracking |
| Google Analytics | `ClientApp/src/analytics/GoogleAnalytics.tsx` | Page-view tracking |

## Key NPM Dependencies

| Package | Role |
|---------|------|
| `react` / `react-dom` | UI framework (v18) |
| `react-router` | Client-side routing (v7, createBrowserRouter) |
| `@azure/msal-browser` / `@azure/msal-react` | Azure AD B2C auth |
| `formik` | Legacy form library |
| `react-hook-form` | New form library (active migration) |
| `yup` | Schema validation for both form libs |
| `bootstrap` | CSS framework (v5, custom NMI theme) |
| `sass` | SCSS compilation |
| `dompurify` | HTML sanitisation (CSP/Trusted Types) |
| `@react-aria/*` | Accessible component primitives |

## Dev / Build Dependencies

| Package | Role |
|---------|------|
| `vite` | Bundler (prod) — replaced webpack 5 on this branch |
| `vitest` | Unit + Storybook interaction tests |
| `@storybook/*` | Component development + interaction tests (v10.x) |
| `playwright` | E2E test runner |
| `playwright-bdd` | Cucumber/Gherkin BDD layer on Playwright |
| `typescript` | Strict TypeScript compilation |
| `eslint` | Linting (flat config, `eslint.config.mjs`) |
| `prettier` | Formatting |
| `patch-package` | Applies patches from `patches/` post-install |

## CSP / Security

- `trustedtypes.ts` — TrustedHTML policy via `dompurify`
- `vite.config.mts` — CSP meta-tag injection at build time
- Environment variables injected at runtime from `window.*` (not process.env)

## Test Infrastructure

```text
vitest.unit.config.ts          → Unit tests (ClientApp/src)
vitest.storybook.config.ts     → Storybook interaction tests
playwright.config.ts           → App E2E (Playwright-BDD)
playwright.storybook.config.ts → Storybook E2E (Playwright-BDD)
.storybook/main.ts             → Storybook config (Vite builder, SCSS)
```
