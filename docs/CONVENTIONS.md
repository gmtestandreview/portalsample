# Coding Conventions

## 1) Naming Rules

| Item | Rule | Example | Evidence |
|------|------|---------|----------|
| React component files | PascalCase, `.tsx` extension | `AuthenticatedElement.tsx`, `Dashboard.tsx` | `ClientApp/src/authentication/AuthenticatedElement.tsx` |
| Directory entry-points | `index.tsx` as default export | `components/Layout/index.tsx` | Throughout `components/` |
| TypeScript utility files | camelCase or kebab-case, `.ts` | `authConfig.ts`, `errorRoutes.ts` | `ClientApp/src/authentication/authConfig.ts` |
| Hook files | camelCase prefixed `use`, `.tsx` | `useHtmlTitle.tsx`, `useBodyClass.tsx` | `ClientApp/src/components/Utilities/useHtmlTitle.tsx` |
| Interfaces | PascalCase, no `I` prefix (older code may use `I` prefix) | `AccountDetails`, `WizardFormProps` | `ClientApp/src/authentication/accountContext.tsx` |
| Enums | PascalCase enum name, PascalCase members | `HttpStatusCode.NotFound`, `DashboardTab.Drafts` | `ClientApp/src/types.ts`, `ClientApp/src/components/SearchFilter/types.ts` |
| Constants (module-level literals) | UPPER_SNAKE_CASE | `DEFAULT_DASHBOARD_PAGESIZE`, `YUP_PHONE_METHOD` | `ClientApp/src/routes/dashboard/index.tsx`, `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts` |
| Props interfaces | PascalCase + `Props` suffix | `WizardFormProps`, `LayoutProps` | `ClientApp/src/components/forms/WizardForm/types.ts` |
| DTO types | PascalCase + `Dto` suffix (from API codegen) | `DashboardItemDto`, `UserProfileDto` | `ClientApp/src/api/web-api-client.ts` |
| Route path strings | kebab-case matching URL | `'/request-for-quote-create'`, `'/update-organisation/:id/*'` | `ClientApp/src/App.tsx` |

## 2) Formatting and Linting

- **Linter**: ESLint (`.eslintrc.cjs`; run `npm run lint`)
- **Common suppressed rules**: `@typescript-eslint/no-explicit-any`, `max-len`, `no-useless-escape`, `no-template-curly-in-string`, `no-nested-ternary`
- **Indentation**: 4 spaces (consistent across all source files)
- **Quotes**: Single quotes for strings in TSX/TS; JSX attribute strings use single quotes
- **Semicolons**: Not used (observed in source files — ASI style)
- **Trailing commas**: Used in multi-line objects and arrays (standard ESLint airbnb-style)

> Current lint baseline (2026-06-28): `npm run lint` passes with zero diagnostics. The original 131-warning rollout record is retained historically in `docs/eslint-baseline.md`; warnings and errors are now blockers.

## 3) Import and Module Conventions

- **Import order**: External packages first, then internal modules (relative paths)
- **Relative vs alias**: Most imports use relative paths. The `@/*` alias is configured in `tsconfig.json` (`"@/*": ["ClientApp/src/*"]`) but existing source files use relative paths — prefer relative paths for consistency with the existing codebase
- **Default vs named exports**: Components use `export default`, types/hooks use named exports
- **CRITICAL — Yup extensions side-effect**: Any file that calls a custom Yup method (`.phone()`, `.postcode()`, `.allowedFormat()`, etc.) **must** include this import or those methods will be `undefined` at runtime:

  ```ts
  import '../../validationSchemas/yupExtensions';
  ```

- **CRITICAL — AccountContext access**: Never `import AccountStateCtx` or `import AccountDispatchCtx` directly in route/component files. Always use the hooks, and import only the slice you need:

  ```ts
  // OLD pattern (removed):
  import useAccountContext from '../../authentication/hooks';
  const accountContext = useAccountContext();

  // NEW pattern — use only the slice you need:
  import { useAccountState, useAccountDispatch } from '../../authentication/hooks';
  const accountState = useAccountState();    // for reading details
  const accountDispatch = useAccountDispatch(); // for mutations

  // For modal state:
  import { useModalState, useModalDispatch } from '../../components/modals/ModalContext';
  const modalState = useModalState();
  const modalDispatch = useModalDispatch();
  ```

- **CRITICAL — env vars**: Never `process.env.*`. Always:

  ```ts
  import { env } from '../env';
  env.REACT_APP_B2C_CLIENTID  // correct
  ```

## 4) Component Conventions

- **Functional components everywhere**: All React components are arrow functions or named functions (`const Foo = () => ...`). There are no class components — `ErrorBoundary` was migrated to a functional component using `react-error-boundary` in the React 19 migration prep (Phase 4.1).
- **Route components**: Each route component calls `useHtmlTitle('Page Title | NMI Services portal')` and `useBodyClass('css-class-name')` at the top level.
- **Protected routes in App.tsx**: Always wrap with `<AuthenticatedElement>`. Multi-step form routes that manage their own header/footer pass `displayHeaderAndFooter={false}`:

  ```tsx
  <AuthenticatedElement displayHeaderAndFooter={false}>
    <CreateAccount />
  </AuthenticatedElement>
  ```

- **Public routes**: Wrap with `<Layout>` (not `<AuthenticatedElement>`):

  ```tsx
  <Route path='/help-guide' element={<Layout><HelpGuide /></Layout>} />
  ```

- **Error routes**: Use `<PreConditions displayHeaderAndFooter>` for pages accessible without auth:

  ```tsx
  <Route path='/server-error' element={<PreConditions displayHeaderAndFooter><ErrorDisplay status={HttpStatusCode.InternalServerError} /></PreConditions>} />
  ```

## 5) Form Conventions

- **All forms use Formik** — never use raw React controlled inputs for form state.
- **Multi-step forms**: Use `<WizardForm>` + `<WizardStep>` compound components. Each step gets its own `location`, `initialValues`, `onSaveAndNext`, `onSaveAndExit`, and `validateHard`/`validateSoft` Yup schemas.
- **Navigation guards**: Include `<UnsavedFormPrompt path={location} />` inside any form that should warn before navigating away with unsaved changes. Do not re-implement `RouteLeavingGuard` directly.
- **Validation schemas**: Yup schemas live in `validationSchemas/` alongside their route. Schema files that use custom methods **must** import the side-effect module (see Import Conventions above).

## 6) Error and Logging Conventions

- **Route-level errors**: Thrown or unhandled exceptions are caught by `ErrorBoundary`, which renders `<ErrorDisplay>` with the appropriate `HttpStatusCode` and reports to App Insights.
- **API errors**: Caught as `ProblemDetails` shape from the NSwag client; check `problemDetails.status` and redirect via `getUnexpectedErrorRoute(status)` from `routes/common/errorRoutes.ts`.
- **Structured logging**: Use `AppLogger` (not `console.log`) in route components:

  ```ts
  AppLogger.verbose('Dashboard.loadDataForDisplay', contextObject);
  AppLogger.error('Failed to load dashboard.', error as Error);
  ```

- **PII**: MSAL logging has `piiLoggingEnabled: false`. Never log user-identifiable data. **Important:** this flag only governs MSAL's own internal logging — `AppLogger.verbose` / `AppLogger.error` route their `properties` argument directly to `insights.trackTrace` / `insights.trackException`. Always pass a scrubbed projection (e.g., `{ homeAccountId: account.homeAccountId }`) rather than a raw `AccountInfo` or `AccountDetails` object.
- **Sensitive-data**: Auth tokens are never stored in component state or `localStorage`; MSAL handles token caching internally.

## 7) State Management Conventions

- **Authenticated user state (read)**: `AccountStateCtx` via `useAccountState()` — organisation name, trading name, branch, ABN, ToU acceptance, `isLoading`, and user profile. Import from `authentication/hooks.tsx`. Use this when you only need to read auth state; subscribing to this context does not re-render on dispatch mutations.
- **Authenticated user state (mutations)**: `AccountDispatchCtx` via `useAccountDispatch()` — `setAgree`, `setCompleted`, `setContactCompleted`, `setDefaultOrganisationId`, `setTargetOrganisation`, `setOrganisationAndBranch`, `setUserProfile`. Import from `authentication/hooks.tsx`. Use this when you need to mutate user state without subscribing to the read slice.
- **Modal visibility state (read)**: `ModalStateCtx` via `useModalState()` — `showBranchSelector`, `showRFQDeleteModal`, `branchSelectionModalMode`, `callingPath`, `rfqId`. Import from `components/modals/ModalContext`. Provided by `PreConditions` inside `AuthenticatedElement` — not available at the top-level bootstrap.
- **Modal visibility state (mutations)**: `ModalDispatchCtx` via `useModalDispatch()` — `setShowBranchSelector`, `setShowRFQDeleteModal`, `setShowRFQSelectModal`. Import from `components/modals/ModalContext`.
- **Dashboard filter/tab/page state**: Persisted to `AccountContext.userProfile` so it survives navigation within the session; seeded from session storage via `mapToUserProfile()`.
- **In-flight / page-local state**: `useState` in route components (loading flags, error state, fetched data).
- **Cross-page flags**: `SessionStorageCache()` typed wrapper (e.g., `'accepted-quote-id'` workaround in Dashboard).

## 8) Evidence

- `ClientApp/src/authentication/hooks.tsx` — context access pattern
- `ClientApp/src/env.ts` — env var access pattern
- `ClientApp/src/App.tsx` — route wrapping conventions
- `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts` — side-effect import pattern
- `ClientApp/src/routes/dashboard/index.tsx` — representative route component

## 9) Storybook Test Conventions

- Storybook route-aware stories should use the global data-router decorator from `.storybook/preview.ts`.
- Do not add story-local `MemoryRouter` wrappers where global router context is already provided.
- `withPortalProviders` from `ClientApp/src/storybook/storybookHarness.tsx` must remain router-agnostic to avoid nested router errors.
- For Storybook BDD assertions:
  - Use root-scoped checks (`#storybook-root`) for normal in-canvas rendering.
  - Use page-scoped checks (`body`) when content is rendered through portals outside `#storybook-root` (for example, modal bodies).

## 10) Dependency Override Ownership

- `package.json` `overrides.unified-engine.glob`, `overrides["@npmcli/map-workspaces"].glob`, and `overrides["@npmcli/package-json"].glob` pin those three `remark-cli` / `unified-engine` transitive owners to `glob@13.0.6`, replacing the deprecated `glob@10.5.0` copies each previously resolved (Task D2; see `reports/deprecations/glob-override.md` for the full blast-radius record).
- The Dependency DRI reviews this override quarterly and whenever Dependabot proposes an update to `remark-cli`, `unified-engine`, `@npmcli/map-workspaces`, `@npmcli/package-json`, or `glob`.
- **Removal trigger**: once all three owning packages resolve a maintained, non-deprecated `glob` release on their own (without the override), remove the corresponding `overrides` entries. `tests/unit/config/dependencySecurity.test.ts`'s `"publisher deprecations"` test rejects any lockfile package with a non-empty `deprecated` field, so a now-unnecessary override left in place will not itself fail CI — but the override should still be removed at that point to keep `package.json` minimal.
- After any Storybook feature-step updates, always regenerate specs with `npx bddgen` before running Playwright.

## 11) Node and GitHub Actions Runtime Contracts

Two runtimes are versioned independently and must not be inferred from each other: the **application** Node that `setup-node` installs, and the **action** Node that GitHub uses to execute an action's own JavaScript.

- **Application/tooling floor** — `engines.node` and `devEngines.runtime.version` are both `>=24.0.0`, with `devEngines.runtime.onFail: error`. The floor deliberately excludes EOL Node 20, Node 22, and odd-numbered Node 23. `packageManager` stays on `npm@11.17.0` (Task D3; the floor itself landed early in Task D1 because `@eslint-react/eslint-plugin@5.18.6` requires Node >= 22).
- **Action runtime** — supplied by the reviewed `checkout`/`setup-node` v7 and `upload-artifact` v6 majors, independent of the application version above.

### Immutable action pins

Every `uses:` in `.github/workflows/**` is pinned to a full commit SHA with the reviewed major in a trailing comment. A floating `@v7` tag is mutable and is rejected by `tests/unit/config/workflowPolicy.test.ts`.

| Action                    | Pin                                        | Major    |
| ------------------------- | ------------------------------------------ | -------- |
| `actions/checkout`        | `3d3c42e5aac5ba805825da76410c181273ba90b1` | `v7.0.1` |
| `actions/setup-node`      | `820762786026740c76f36085b0efc47a31fe5020` | `v7.0.0` |
| `actions/upload-artifact` | `b7c566a772e6b6bfb58ed0dc250532a479d7789f` | `v6.0.0` |

`setup-node` v7 auto-detects a package manager, so the explicit `cache: 'npm'` input is retained on every invocation to keep cache ownership where it was.

### PR statuses

`.github/workflows/pr.yml` declares six job identifiers exposing eight independently named statuses — `vitest` fans out through the retained Task A1 matrix into `vitest-unit`, `vitest-storybook`, and `vitest-quality`. The others are `static-quality-node24`, `build-node24`, `date-timezone`, `e2e-node24`, and `lower-bound-node24`.

- `lower-bound-node24` installs on the **exact** floor (`node-version: '24.0.0'`) with `npm ci --strict-peer-deps`, proving the declared floor resolves rather than merely "some Node 24".
- `date-timezone` runs the focused date suite under `TZ` of UTC, Australia/Sydney, and America/Los_Angeles with `fail-fast: false`. **Its UTC leg is expected to fail** while Child Plan B is externally deferred: `datePickerWrapper.test.tsx` has three characterized timezone failures under UTC and passes in the other two zones. That visibility is the point — do not mark this job a required status in branch protection, and never add `continue-on-error` to hide it. Child Plan B's B1 makes it green and adds `tests/unit/utils/dateOnly.test.ts` to the file list.
- Every job carries an explicit `timeout-minutes` and uploads evidence with `if: always()`, `if-no-files-found: error`, and `retention-days: 14`.
- Workflow-level `defaults.run.shell: bash` is load-bearing: GitHub's implicit runner shell is `bash -e`, which has no `pipefail`, so a step piping into `tee` would otherwise report `tee`'s exit code instead of the command's.

### Update ownership

- Dependabot's `github-actions` ecosystem entry proposes weekly pin updates. The Dependency DRI reviews them, and a pin is only advanced after the full Node 24 job graph — `lower-bound-node24` included — passes on the proposed SHA.
- The `eslint-family` npm group keeps `eslint`, `@eslint/js`, `typescript-eslint`, `@eslint-react/*`, `eslint-plugin-react-hooks`, `@stylistic/*`, and `globals` in one pull request; that cohort shares peer ranges and only resolves as a set. npm majors stay review-only.
- `@types/node` tracks the runtime floor's major, not the previous one. It moved `^20.19.43` → `^24.13.3` alongside the Node 24 floor so TypeScript stops checking against Node 20 type definitions; the bump regenerates `package-lock.json`, so it lands as a dependency-cohort change rather than inside a runtime-contract commit.
- Direct devDependency versions in the lint, Vitest, and Storybook cohorts are **exact, not caret ranges**. `tests/unit/config/dependencySecurity.test.ts` enforces this. `vitest` and `@vitest/*` are exact peers of each other, so a caret range would let them resolve to different versions. Note that `syncpack` is installed and its default range style is `^`; do not run its range-rewriting commands across these cohorts.
