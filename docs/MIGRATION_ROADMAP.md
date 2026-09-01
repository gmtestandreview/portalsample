# Migration & Merge Roadmap: portal.measurement.gov.au Snapshot

## Objective

Map this repository into a migration-ready structure so it can be merged into another repo/platform with minimal regressions.

## Snapshot Reality

- This workspace is a source-map capture with both editable app code and generated/vendor artifacts.
- Migration should treat `ClientApp/src/**` and `ClientApp/src/styles/**` as source-of-truth app code.
- Generated outputs (`dist/**`, `storybook-static/**`, compiled `ClientApp/src/main.*.js`, `ClientApp/css/main.*.css`) should not be merged as source.

## 1) Migration Units (What to Move)

### A. Core App Source (migrate first)

- `ClientApp/src/index.tsx` (bootstrap)
- `ClientApp/src/App.tsx` (route tree)
- `ClientApp/src/env.ts` (runtime `window.*` config contract)
- `ClientApp/src/authentication/**` (MSAL + auth context)
- `ClientApp/src/routes/**` (feature pages/flows)
- `ClientApp/src/components/**` (shared UI)
- `ClientApp/src/validationSchemas/**` (Formik/Yup rules)
- `ClientApp/src/storage/**` (session state)
- `ClientApp/src/instrumentation/**` (App Insights logging)
- `ClientApp/src/analytics/**` (GA event hooks)
- `ClientApp/src/utils/**`, `ClientApp/src/types.ts`
- `ClientApp/src/styles/**` (theme SCSS)
- `ClientApp/src/assets/**` (canonical source assets) and `ClientApp/public/fonts/**` (Public Sans `.ttf`, `nmi-iconfonts.woff`)

> **Corrected 2026-09-01.** The previous revision listed "`fonts/**` and required assets under
> `ClientApp/media/**`". Both are wrong: there is **no root `fonts/` directory** (fonts live at
> `ClientApp/public/fonts/`), and `ClientApp/media/**` holds **hash-suffixed build duplicates** of
> `ClientApp/src/assets/**` — it is output, not source, and belongs in the exclude list. Note
> `ClientApp/src/assets/GovCrest..svg` has a malformed double-dot filename and appears unused.
>
> SCSS references assets by relative path (`url('../assets/logo_nmi_white.svg')`,
> `url('../../media/icon-invalid.png')`), so re-placement in the target will break them unless the
> paths are rebased deliberately.

### B. Tooling & Quality (migrate in parallel)

- `package.json`, `tsconfig.json`, `webpack.config.js`
- `vitest.config.ts`, `vitest.unit.config.ts`, `vitest.storybook.config.ts`, `quality/vitest.regression.config.ts`, `vitest.setup.ts`
- `playwright.config.ts`, `playwright.storybook.config.ts`
- `tests/unit/**` (163 files)
- `tests/e2e/**` (33 `.feature` files) — **including `tests/e2e/route-coverage.ts`**, the executable route-to-scenario register and the highest-value migration asset here: it is the acceptance oracle for the routes the target still stubs
- `docs/ARCHITECTURE.md`, `docs/STACK.md`, `docs/TESTING.md`, `docs/STRUCTURE.md`, `docs/INTEGRATIONS.md`, `docs/CONVENTIONS.md`, `docs/architecture/**`
- `quality/**` (audit and regression traceability) — port `BUG-001`…`BUG-005` (behavioural); `BUG-006`/`BUG-007`/`BUG-008` are snapshot-specific and `BUG-007` becomes obsolete once Yup is replaced by zod

### C. Exclude From Merge (rebuild instead)

- `node_modules/**`
- `dist/**`
- `reports/**` (coverage, playwright, test-results, vitest)
- `storybook-static/**`
- `ClientApp/src/main.*.js`, `ClientApp/css/main.*.css`
- `ClientApp/source-map-http-downloads/**`
- `ClientApp/src/external/**`, `ClientApp/webpack/**`, `ClientApp/src/parent/node_modules/**`

## 2) Target Repo Placement Map

> **Updated 2026-09-01 — the target is no longer hypothetical.** It is the
> `React19DesignSystem` pnpm/turbo workspace, and `apps/portal-spa` (v0.2.0) already exists with the
> **full 41-route skeleton**: 25 routes render real pages and **16 render `StubPage` placeholders**.
> The Type Approval vertical is migrated; the RFQ → Quote → Report vertical is not. Placement is
> therefore an observed fact, not a proposal, and this roadmap's phases should be read as *remaining*
> work rather than work not yet begun.
>
> Target stack differences that shape every mapping below: React 19 with the React Compiler,
> react-hook-form with zod, TanStack Query, `openapi-typescript` (not NSwag), **no Bootstrap**, and
> the `@nmi/design-tokens`, `@nmi/react-components` and `@nmi/portal-patterns` workspace packages.
> Notably, `react-aria-components` is pinned at the **same 1.19.0** on both sides.

| Current | Target |
| --- | --- |
| `ClientApp/src/routes/**` | `apps/portal-spa/src/routes/` + `src/features/` |
| `ClientApp/src/components/**` (shared primitives) | `packages/react-components/src/components/` |
| `ClientApp/src/components/**` (portal-specific patterns) | `packages/portal-patterns/src/` |
| `ClientApp/src/authentication/**` | `apps/portal-spa/src/auth/` (`AuthProvider`, `RequireAuth`, `AccountProvider`, `msalConfig`) |
| `ClientApp/src/api/web-api-client.ts` | `apps/portal-spa/src/integrations/apiClient/` — **regenerate**, do not port |
| `ClientApp/src/env.ts` | `apps/portal-spa/src/config/config.ts` (zod-validated `VITE_*`) |
| `ClientApp/src/styles/**` | `packages/design-tokens/` + component-scoped `*.module.scss` |
| `ClientApp/src/assets/**`, `ClientApp/public/fonts/**` | `packages/icons/` + app assets |
| `ClientApp/src/validationSchemas/**` | `packages/portal-patterns/src/validation/` — **already ported at 19/19 parity** |
| `tests/unit/**` | `apps/portal-spa/src/**/*.test.tsx` (co-located) |
| `tests/e2e/**` | `apps/portal-spa/e2e/bdd/` |

## 3) Dependency & Runtime Contracts to Preserve

- Auth: Azure AD B2C MSAL (`@azure/msal-browser` 3.30.0, `@azure/msal-react` 2.2.0). **The target platform is on MSAL v5 for both** — a major version jump on each.
- Forms: Formik + Yup with custom extension side-effect import (`validationSchemas/yupExtensions`). **The target uses react-hook-form + zod**; the binding layer does not transfer.
- Routing: **React Router v7** route semantics from `App.tsx` (`react-router` 7.18.2 — *the previous revision said v6, which was wrong by a major version*). `App.tsx` still passes v6-era `future.v7_*` flags, which are inert on v7 and should be dropped.
- Telemetry: App Insights + GA integration behavior. Note `'dummy-key'` is a **disabled sentinel**, not a fallback — absent config disables telemetry entirely.
- Runtime config: `env.ts` reads `window.*` (via `globalThis`), **not** `process.env`, and validates `EXTERNAL_REDIRECT_URL` against a host allow-list that throws at module load.
- CSP: Trusted Types + DOMPurify contract via `trustedtypes.ts`. Preserve the *intent* — `createScriptURL` currently delegates to `DOMPurify.sanitize`, which does not validate URLs.
- Precondition redirects: four interacting predicates gating 35 of 41 routes — see `docs/architecture/precondition-redirect-matrix.md`.

## 4) Merge Execution Plan

### Phase 0: Baseline Capture

1. Freeze source import set (A + B above).
2. Record current route inventory from `ClientApp/src/App.tsx`.
3. Record environment keys consumed by `ClientApp/src/env.ts`.

### Phase 1: Skeleton in Target Repo

1. Create destination module layout mirroring `ClientApp/src/*` domains.
2. Wire entry bootstrap and router shell.
3. Add core dependencies from current `package.json`.

### Phase 2: Vertical Flow Migration

1. Migrate auth layer (`authentication/**`) and protected-route wrapper patterns.
2. Migrate dashboard and one complete form wizard flow end-to-end.
3. Migrate shared components/utilities used by those flows.

### Phase 3: Validation & Storage Contracts

1. Migrate all validation schemas and ensure extension side-effect imports are retained.
2. Migrate storage wrappers and defensive parsing behavior.
3. Migrate route error mapping helpers.

### Phase 4: Observability & Non-Functional

1. Migrate App Insights + logger wiring.
2. Migrate GA hooks.
3. Migrate Trusted Types policy and confirm CSP-safe rendering paths.

### Phase 5: Styling and Asset Integration

1. Port SCSS partials and Bootstrap theme overrides.
2. Port fonts and icon assets.
3. Resolve asset path assumptions (`ClientApp/media/...` source path vs target bundler output conventions — webpack emits to `dist/images/` and `dist/fonts/`).

### Phase 6: Test Parity & Quality Gates

1. Bring over unit tests and fix import-path drift.
2. Bring over BDD feature specs and step glue.
3. Recreate critical checks from `quality/` artifacts as repeatable CI gates.

## 5) Risk Register (High Impact)

- **Env contract mismatch — real, but not via `process.env`.** The target platform uses Vite `import.meta.env` with `VITE_*` names, validated by zod in `src/config/config.ts`. Every variable is **renamed** (`REACT_APP_B2C_CLIENTID` → `VITE_B2C_CLIENT_ID`, and so on), and config moves from **runtime injection to build-time inlining**. Consequence: a bundle built with the wrong environment value cannot be corrected at deploy time — it needs a rebuild. CI must assert the built artifact's environment value, not just the build inputs. A name-mapping table is required before any migration of `env.ts` consumers.
- Auth bootstrapping drift: MSAL init order in bootstrap can break protected routes.
- Yup extension omission: custom validators fail silently without side-effect import.
- Generated/vendor contamination: copying built artifacts increases merge noise and hides source ownership.
- CSS asset path drift: fonts/icons may fail after path rebasing.

## 6) Recommended Merge Order (Practical)

1. `ClientApp/src/env.ts`, `index.tsx`, `App.tsx`
2. `authentication/**`
3. `components/**` shared primitives
4. `routes/dashboard/**`
5. remaining `routes/**` by business flow priority
6. `validationSchemas/**`, `storage/**`, `instrumentation/**`, `analytics/**`, `utils/**`
7. `ClientApp/src/styles/**` and assets
8. tests + docs + quality automation

## 7) Definition of Done for Migration

- All route modules from `App.tsx` are reachable in the target repo.
- Authenticated and unauthenticated flows both render correctly.
- Custom Yup validators execute without runtime missing-method errors.
- Runtime env values resolve via target equivalent of `window.*` injection.
- Unit/BDD suites execute in target CI with no reliance on generated source-map artifacts.

## 8) Quick File/Folder Classification Table

| Area | Status | Action |
|---|---|---|
| `ClientApp/src/**` | Canonical source | Migrate |
| `ClientApp/src/styles/**` | Canonical source | Migrate |
| `tests/**` | Validation assets (unit + e2e) | Migrate |
| `docs/**`, `quality/**` | Governance/traceability | Migrate selectively |
| `dist/**`, `storybook-static/**`, `reports/**` | Generated outputs | Exclude |
| `node_modules/**`, `ClientApp/source-map-http-downloads/**` | Vendor/cache mirror | Exclude |
| `ClientApp/src/main.*.js`, `ClientApp/css/main.*.css`, `ClientApp/webpack/**` | Build artifacts/runtime | Exclude |
