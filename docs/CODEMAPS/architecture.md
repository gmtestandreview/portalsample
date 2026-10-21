<!-- Generated: 2026-10-21 | Files scanned: 1537 | Token estimate: ~600 -->

# Architecture

## System Type

Single-page React application (SPA) hosted on Azure. Server-side is a .NET backend exposing an OpenAPI-spec REST API; the portal is the front-end only.

## High-Level Data Flow

```text
Browser
  └─ Vite SPA (ClientApp/)
       ├─ Azure AD B2C  ←─ MSAL silent/popup token refresh
       ├─ NMI REST API  ←─ web-api-client.ts (NSwag/OpenAPI-generated)
       ├─ Azure App Insights  ←─ telemetry
       └─ Google Analytics   ←─ page tracking
```

## Service Boundaries

| Boundary | Description |
|----------|-------------|
| Auth | Azure AD B2C — MSAL popup/redirect + silent token renewal |
| API | NMI backend REST — auto-generated typed client (`web-api-client.ts`) |
| Analytics | App Insights (instrumentation) + Google Analytics (page tracking) |
| Storage | sessionStorage only — multi-step wizard state, notification flags |

## Bootstrap Sequence

```text
index.html
  → ClientApp/src/index.tsx   (ReactDOM root, MsalProvider, AccountProvider)
  → ClientApp/src/App.tsx     (createBrowserRouter — 30+ routes)
  → Layout / AuthenticatedElement / route-specific wizard
```

## Branch / Feature Work

Current branch: `feat/storybook-coverage-remediation`

Key changes on branch:

- **Webpack 5 → Vite 8** migration (`vite.config.mts`) — uncommitted
- **ContactDetailsInput** NLOC refactor (172 → ~22 via sub-component extraction)
- **Storybook coverage** remediation (branch primary purpose)
- **pre_tool_use_wrapper** hook: `.mjs` → `.mts` with dynamic import

## Key Technology Decisions

| Decision | Rationale |
|----------|-----------|
| No Redux/Zustand | Session-scoped wizard state fits sessionStorage; no global shared state needed |
| Formik → RHF migration | Incremental, per-component via useFormikRhfBridge adapter |
| Vite (replacing Webpack 5) | Faster HMR, ESM-native, simpler config |
| SCSS @import shim | Bootstrap 5 requires @import cascade; full @use migration deferred to Bootstrap 6 |
