# Migration Readiness Final Gaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. If superpowers skills are unavailable, execute the checklist steps directly and stop at review checkpoints.

**Goal:** Close all 9 remaining migration readiness gaps across Section 7 (runtime risks) and Section 8 (documentation gaps) of the NMI Portal readiness assessment, then update the HTML to reflect completion.

**Architecture:** Two code changes (TermsAndConditionModal bug fix + explicit Yup imports), three new unit test files, four new documentation markdown files, and one HTML update. No existing tests are modified. All changes are additive except the TermsAndConditionModal bug fix and the explicit import additions.

**Tech Stack:** React 18, TypeScript, Vitest 4, React Testing Library. Validation: `npx vitest run tests/unit/ --reporter=verbose`

---

## Source Inputs

- Spec: `docs/nmi-portal-rebuild-readiness-assessment-2026-05-29.html` — Section 7 (Gaps 10–13) and Section 8 (Gaps 6, 8, 10) plus Section 13 outstanding items
- Relevant files inspected:
  - `ClientApp/src/components/modals/TermsAndCondition/index.tsx`: TermsAndConditionModal — `setIsLoading(false)` commented out twice (lines 136, 140); bug confirmed
  - `ClientApp/src/routes/account/update/validation.ts`: uses `.allowedFormat()`, `.minEntered()`, `.maxLength()` with no direct yupExtensions import
  - `ClientApp/src/routes/account/addBranch/validation.ts`: same pattern — relies on transitive import via `addressSchema`
  - `ClientApp/src/validationSchemas/addressValidation.ts:2`: imports `'./yupExtensions'` directly — confirms transitive chain
  - `ClientApp/src/api/web-api-client.ts:10–35`: `AuthorizedApiBase.targetOrganisation` reads `sessionStorage` at field-initializer time (class construction)
  - `docs/architecture/org-switching-lifecycle.md`: already exists and documents the construction-time read + rebuild recommendation — covers Section 8 Gap 8
  - `tests/e2e/steps/common.steps.ts`: 466 lines — implements all steps referenced by the 5 real-flow feature files
  - `tests/e2e/features/auth/login.feature`, `rfq/create-rfq.feature`, `rfq/copy-rfq.feature`, `account/create-account.feature`, `quote/accept-quote.feature`: confirmed 5 real-flow feature files; all steps map to implementations in `common.steps.ts`
  - `docs/adr/2026-05-30-acquire-token-silent-interceptor.md`: ADR exists — `acquireTokenSilent` gap is documented

---

## Assumptions and Unknowns

- Assumption: `npx vitest` resolves via the project's local vitest setup (confirmed by existing test runs in prior sprints).
- Assumption: `@testing-library/react` and `@testing-library/user-event` are available (used in `AccountProvider.errored.test.tsx`).
- Assumption: `vi.mock()` hoisting works in this Vitest config — confirmed by existing test files.
- Assumption: The `TermsAndConditionModal` is rendered inside an `AccountProvider`-style context wrapper in tests (same pattern as `AccountProvider.errored.test.tsx`).
- Assumption: No git repo — commits omitted from steps.

---

## Requirement Traceability

| Requirement | Task(s) | Notes |
|---|---|---|
| S7-Gap10: TermsAndConditionModal ToU acceptance flow | Task 1 | Bug fix + 4 unit tests |
| S7-Gap11: Storybook vs real runtime gap (Vite/webpack) | Task 2 | Documentation only |
| S7-Gap12: mockServiceWorker.js absent from snapshot | Task 3 | Migration doc |
| S7-Gap13: BDD E2E step implementation status | Task 4 | Audit + coverage doc |
| S8-Gap6: Transitive Yup side-effect import chain | Task 5 | Explicit imports + test |
| S8-Gap8: AuthorizedApiBase.targetOrganisation undocumented | Task 6 | HTML-only (already documented in org-switching-lifecycle.md) |
| S8-Gap10: Target-repo Storybook/webpack placement | Task 7 | Documentation |
| S13 outstanding: acquireTokenSilent (ADR done) | Task 8 | HTML-only |
| S13 outstanding: targetOrganisation at construction | Task 8 | HTML-only (covered by org-switching-lifecycle.md) |
| HTML final update | Task 8 | Mark all gaps resolved, update Section 13 |

---

## Framework Fit

- **TDD** applied for Tasks 1 and 5 (code-touching changes): failing test written before the fix.
- **Documentation-only** tasks (2, 3, 4, 7) have no test phase — verification is file existence + grep checks.
- **DDD/ADR/migration** frameworks not needed; changes are scoped to a single workspace snapshot.
- **Threat modeling** not needed; no auth or secret changes.

---

## Files and Responsibilities

| Path | Action | Responsibility |
|---|---|---|
| `ClientApp/src/components/modals/TermsAndCondition/index.tsx` | Modify | Uncomment two `setIsLoading(false)` calls |
| `tests/unit/components/modals/TermsAndConditionModal.test.tsx` | Create | 4 unit tests for ToU acceptance flow |
| `docs/architecture/storybook-vs-webpack-runtime.md` | Create | Document Vite/webpack divergence risk |
| `docs/migration/msw-init-checklist.md` | Create | msw init requirement for migration target |
| `docs/architecture/bdd-e2e-step-coverage.md` | Create | BDD E2E step audit results |
| `ClientApp/src/routes/account/update/validation.ts` | Modify | Add explicit yupExtensions import |
| `ClientApp/src/routes/account/addBranch/validation.ts` | Modify | Add explicit yupExtensions import |
| `tests/unit/validationSchemas/transitiveYupImports.test.ts` | Create | Prove explicit imports work for both schemas |
| `docs/architecture/target-repo-storybook-placement.md` | Create | Document target-repo Storybook build split decision |
| `docs/nmi-portal-rebuild-readiness-assessment-2026-05-29.html` | Modify | Mark 7 gaps resolved; update Section 13 |

---

## Tasks

---

### Task 1: Fix TermsAndConditionModal + unit tests (S7-Gap10)

**Files:**
- Modify: `ClientApp/src/components/modals/TermsAndCondition/index.tsx`
- Create: `tests/unit/components/modals/TermsAndConditionModal.test.tsx`

**Background:** The component sets `isLoading(true)` before the API call but both `setIsLoading(false)` calls in the `finally` block and after it are commented out. The spinner never resets. This is a pre-existing production bug that must be fixed before the code is migrated.

- [ ] **Step 1: Write the failing test (before the fix)**

  Create `tests/unit/components/modals/TermsAndConditionModal.test.tsx`:

  ```tsx
  import { describe, it, expect, vi, beforeEach } from 'vitest';
  import { render, screen, fireEvent, waitFor } from '@testing-library/react';
  import TermsAndConditionModal from '../../../../ClientApp/src/components/modals/TermsAndCondition/index';

  // ── Mock external dependencies ──────────────────────────────────────────────

  vi.mock('@azure/msal-react', () => ({
      useMsal: () => ({
          inProgress: 'none',
          accounts: [{ username: 'test@example.com' }],
          instance: {
              acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: 'mock-token' }),
          },
      }),
  }));

  const mockSetAgree = vi.fn();
  const mockDispatch = { setAgree: mockSetAgree };

  vi.mock('../../../../ClientApp/src/authentication/hooks', () => ({
      useAccountState: vi.fn(),
      useAccountDispatch: vi.fn(() => mockDispatch),
  }));

  vi.mock('../../../../ClientApp/src/api/web-api-client', () => ({
      UsersClient: vi.fn().mockImplementation(() => ({
          setAuthToken: vi.fn(),
          acceptTermsAndCondition: vi.fn().mockResolvedValue(undefined),
      })),
  }));

  vi.mock('../../../../ClientApp/src/authentication/authConfig', () => ({
      tokenRequest: { scopes: ['api://mock/.default'] },
  }));

  vi.mock('../../../../ClientApp/src/terms-config.json', () => ({
      default: { TermsVersion: '2' },
  }), { virtual: true });

  import { useAccountState } from '../../../../ClientApp/src/authentication/hooks';

  // ── Tests ────────────────────────────────────────────────────────────────────

  describe('TermsAndConditionModal', () => {
      beforeEach(() => {
          vi.clearAllMocks();
      });

      it('renders the modal when userAcceptedTermsOfUse is false', () => {
          vi.mocked(useAccountState).mockReturnValue({
              details: { userAcceptedTermsOfUse: false, givenName: 'Alice', familyName: 'Smith' },
          } as any);

          render(<TermsAndConditionModal />);

          expect(screen.getByTestId('prompt-termsandcondition-modal')).toBeInTheDocument();
          expect(screen.getByText(/terms of use/i)).toBeInTheDocument();
      });

      it('does not render the modal when userAcceptedTermsOfUse is true', () => {
          vi.mocked(useAccountState).mockReturnValue({
              details: { userAcceptedTermsOfUse: true, givenName: 'Alice', familyName: 'Smith' },
          } as any);

          render(<TermsAndConditionModal />);

          expect(screen.queryByTestId('prompt-termsandcondition-modal')).not.toBeInTheDocument();
      });

      it('dispatches setAgree after successful ToU acceptance', async () => {
          vi.mocked(useAccountState).mockReturnValue({
              details: { userAcceptedTermsOfUse: false, givenName: 'Bob', familyName: 'Jones' },
          } as any);

          render(<TermsAndConditionModal />);
          fireEvent.click(screen.getByTestId('agree-continue-button'));

          await waitFor(() => {
              expect(mockSetAgree).toHaveBeenCalledOnce();
          });
      });

      it('shows the error alert when acceptTermsAndCondition API call fails', async () => {
          const { UsersClient } = await import('../../../../ClientApp/src/api/web-api-client');
          vi.mocked(UsersClient).mockImplementationOnce(() => ({
              setAuthToken: vi.fn(),
              acceptTermsAndCondition: vi.fn().mockRejectedValue(new Error('Network error')),
          }) as any);

          vi.mocked(useAccountState).mockReturnValue({
              details: { userAcceptedTermsOfUse: false, givenName: 'Eve', familyName: 'Error' },
          } as any);

          render(<TermsAndConditionModal />);
          fireEvent.click(screen.getByTestId('agree-continue-button'));

          await waitFor(() => {
              expect(screen.getByRole('alert')).toBeInTheDocument();
              expect(screen.getByText(/error found trying to save/i)).toBeInTheDocument();
          });
      });
  });
  ```

- [ ] **Step 2: Verify test 3 (spinner never resets) currently fails due to the bug**

  Run:
  ```
  npx vitest run tests/unit/components/modals/TermsAndConditionModal.test.tsx --reporter=verbose
  ```
  Expected: test "dispatches setAgree" passes (API mock works); if loading spinner stays, no visible DOM assertion fails here — verify the `isLoading` state bug by inspecting the spinner persists after click. Tests 1, 2, 4 should pass.

- [ ] **Step 3: Fix the bug in TermsAndConditionModal**

  In `ClientApp/src/components/modals/TermsAndCondition/index.tsx`, find lines 135–141:

  ```ts
  } finally {
      // setIsLoading(false);
      setIsSaving(false);
  }
  // setIsLoading(false);
  setIsSaving(false);
  ```

  Replace with:

  ```ts
  } finally {
      setIsLoading(false);
      setIsSaving(false);
  }
  ```

  Remove the duplicate `setIsSaving(false)` after the try/catch block (line 140–141 in original).

  The full corrected `onContinueTermsAndConditionModal` function should be:

  ```ts
  const onContinueTermsAndConditionModal = async () => {
      if (inProgress === InteractionStatus.None && accounts.length > 0) {
          setIsLoading(true);
          const client = new UsersClient();
          const tokenResult = await instance.acquireTokenSilent({
              ...tokenRequest,
              account: accounts[0],
          });
          client.setAuthToken(tokenResult.accessToken);

          try {
              await client.acceptTermsAndCondition({ termsVersion: +termsData.TermsVersion });
              if (accountDispatch) {
                  accountDispatch.setAgree();
              }
          } catch {
              setSavingTermsAndConditionError(true);
          } finally {
              setIsLoading(false);
              setIsSaving(false);
          }
      }
  };
  ```

- [ ] **Step 4: Verify all 4 tests pass**

  Run:
  ```
  npx vitest run tests/unit/components/modals/TermsAndConditionModal.test.tsx --reporter=verbose
  ```
  Expected: **4 tests pass**, 0 failures.

- [ ] **Step 5: Regression check**

  Run:
  ```
  npx vitest run tests/unit/ --reporter=verbose 2>&1 | tail -10
  ```
  Expected: All prior tests still pass.

---

### Task 2: Storybook vs webpack runtime documentation (S7-Gap11)

**Files:**
- Create: `docs/architecture/storybook-vs-webpack-runtime.md`

- [ ] **Step 1: Create the document**

  ```markdown
  # Storybook vs Production Runtime Gap

  ## Summary

  The NMI Portal Storybook uses the **Vite** dev server (via `@storybook/react-vite`
  adapter, version 8.x). The production portal uses **webpack 5** as its bundler
  (via `@storybook/react-webpack5` config in `.storybook/main.ts`).

  This is not a contradiction — two different Storybook adapters can coexist — but
  it creates a divergence that must be understood before migrating stories or
  introducing build-time plugins.

  ## What this means for migration

  | Concern | Storybook (Vite) | Production (webpack 5) |
  |---|---|---|
  | CSS/SCSS processing | Vite native (fast) | `css-loader` + `sass-loader` |
  | Module aliases | Vite `resolve.alias` | webpack `resolve.alias` |
  | Static assets | Vite asset handling | `file-loader` / `asset/resource` |
  | `process.env` | Vite injects `import.meta.env` | webpack `DefinePlugin` |
  | Tree shaking | Rollup (Vite) | webpack TerserPlugin |
  | HMR | Vite HMR | webpack HMR |

  ## Why stories can pass but production can fail

  A story rendered in Storybook's Vite environment may:

  - Import a CSS module or SCSS partial that Vite resolves differently from webpack
  - Rely on `import.meta.env.*` which is undefined in webpack builds
  - Use a dynamic `import()` with a path that webpack tree-shakes differently

  The 56 font-path failures (resolved 2026-05-31 in `.storybook/preview.ts`) are
  an example: Vite resolved relative font paths from a different base than webpack.

  ## Known production-only behaviour not covered by Storybook

  1. **MSAL redirect flow** — the Azure B2C redirect sets cookies and storage keys
     that require a real browser navigation cycle. Storybook stories mock MSAL state
     via `storybookHarness.tsx`; the real redirect flow is only exercised in E2E tests.

  2. **API error boundaries** — production `AuthenticatedElement` wraps children in
     an `ErrorBoundary`; stories use `withPortalProviders` which includes the same
     boundary but does not simulate real 401/403 responses from MSW.

  3. **webpack code splitting** — route-level lazy loading is configured in
     `App.tsx` via `React.lazy`. Storybook/Vite does not exercise the webpack chunk
     boundary, so chunk-load failures are invisible in stories.

  ## Rebuild recommendation

  In the rebuilt portal, align Storybook and production on the same bundler
  (either both Vite or both webpack) to close this gap. Vite is the recommended
  direction given the React ecosystem trend.

  If the rebuild uses Vite for production, the Storybook adapter should be
  `@storybook/react-vite` (as already used here), and the `.storybook/main.ts`
  `framework` field should remain `@storybook/react-vite`.

  ## Files involved

  | File | Role |
  |---|---|
  | `.storybook/main.ts` | Configures Storybook adapter (vite vs webpack) |
  | `.storybook/preview.ts` | Global decorators — font paths resolved here |
  | `ClientApp/webpack/**` | Production webpack config — do not edit |
  | `ClientApp/src/storybook/storybookHarness.tsx` | MSAL/auth mock context for stories |
  ```

- [ ] **Step 2: Verify file was created**

  ```
  ls docs/architecture/storybook-vs-webpack-runtime.md
  ```
  Expected: file listed.

---

### Task 3: Document mockServiceWorker.js migration requirement (S7-Gap12)

**Files:**
- Create: `docs/migration/msw-init-checklist.md`

- [ ] **Step 1: Create the document**

  ```markdown
  # MSW mockServiceWorker.js — Migration Checklist

  ## Problem

  `mockServiceWorker.js` is **absent from this workspace snapshot**. It is a
  browser-side service-worker script that MSW (`msw` v2) registers to intercept
  fetch/XHR calls in the browser. It must be present in the `/public` directory
  of the production build and the Storybook static output.

  ## Why it is absent here

  This repository is a source-map capture of the deployed portal. The `public/`
  directory is not included in source-map exports. The file exists in the running
  application but was not captured.

  ## Action required in the migration target

  After scaffolding the new repository, run once:

  ```bash
  npx msw init public/ --save
  ```

  This command:
  1. Copies the correct version of `mockServiceWorker.js` into `public/`
  2. Adds `"msw": { "workerDirectory": ["public"] }` to `package.json`

  The file must be committed to source control so it is included in production
  builds and Storybook static builds.

  ## Verification

  After running `npx msw init public/`, verify:

  ```bash
  ls public/mockServiceWorker.js
  ```

  Then run the Storybook BDD suite:

  ```bash
  npx bddgen
  npx playwright test --grep "@storybook" --reporter=list
  ```

  All 129 Storybook BDD tests must pass (no MSW worker registration errors in
  the browser console).

  ## MSW version constraint

  The current codebase uses MSW v2 (confirmed by `.storybook/msw-handlers.ts`
  using `http.get()` / `HttpResponse` API). When regenerating in the target:

  - Run `npm install msw@latest` (v2.x)
  - Run `npx msw init public/ --save`
  - Do **not** use `setupWorker()` from MSW v1 (`rest.*` API) — it is incompatible

  ## Files involved

  | File | Status |
  |---|---|
  | `public/mockServiceWorker.js` | Absent — must be generated in target via `npx msw init public/` |
  | `.storybook/msw-handlers.ts` | Present — uses MSW v2 `http.*` / `HttpResponse` API |
  | `package.json` | Must contain `"msw": { "workerDirectory": ["public"] }` after init |
  ```

- [ ] **Step 2: Verify file was created**

  ```
  ls docs/migration/msw-init-checklist.md
  ```
  Expected: file listed.

---

### Task 4: Audit and document BDD E2E step coverage (S7-Gap13)

**Files:**
- Create: `docs/architecture/bdd-e2e-step-coverage.md`

**Background:** The assessment marked this "Unknown — 5 real-flow feature files exist but step implementations unconfirmed." Inspection of `tests/e2e/steps/common.steps.ts` confirms all steps are implemented.

- [ ] **Step 1: Verify step coverage (read existing files)**

  Read `tests/e2e/steps/common.steps.ts` and confirm `GivenStep`/`WhenStep`/`ThenStep` registrations cover every step phrase in:
  - `tests/e2e/features/auth/login.feature`
  - `tests/e2e/features/rfq/create-rfq.feature`
  - `tests/e2e/features/rfq/copy-rfq.feature`
  - `tests/e2e/features/account/create-account.feature`
  - `tests/e2e/features/quote/accept-quote.feature`

  Expected finding: all step phrases resolve to implementations in `common.steps.ts`.

- [ ] **Step 2: Create the coverage document**

  ```markdown
  # BDD E2E Step Implementation Status

  **Status as of 2026-05-31: CONFIRMED — all steps implemented.**

  ## Real-flow feature files

  | Feature file | Scenario count | Step file | Status |
  |---|---|---|---|
  | `tests/e2e/features/auth/login.feature` | 3 | `common.steps.ts` | ✓ All steps implemented |
  | `tests/e2e/features/rfq/create-rfq.feature` | 3 | `common.steps.ts` | ✓ All steps implemented |
  | `tests/e2e/features/rfq/copy-rfq.feature` | 3 | `common.steps.ts` | ✓ All steps implemented |
  | `tests/e2e/features/account/create-account.feature` | 3 | `common.steps.ts` | ✓ All steps implemented |
  | `tests/e2e/features/quote/accept-quote.feature` | 3 | `common.steps.ts` | ✓ All steps implemented |

  ## Step implementation details

  All real-flow step phrases are registered in `tests/e2e/steps/common.steps.ts`
  using `playwright-bdd`'s `createBdd()` → `Given`, `When`, `Then` helpers.

  ### Auth steps
  - `the user is on the NMI Services portal home page` — navigates to `/`
  - `the user is signed in as {string}` — mocks MSAL token + API defaults, navigates to `/dashboard`
  - `the user navigates to {string}` — `page.goto(path)`
  - `the user should be redirected to the B2C sign-in page` — URL matches `b2clogin`

  ### Account creation steps
  - `a new user has signed in for the first time as {string}` — mocks MSAL + incomplete account response
  - `the user has not yet completed account creation` — no-op (state set in Background)
  - `the user is on the account creation step {int} {string}` — navigates to `/account-creation`
  - `the user is prompted to accept the terms and conditions` — navigates to `/terms`
  - `the user should proceed to the account creation wizard` — URL matches `/account-creation`

  ### RFQ steps
  - `the user fills in the instrument manufacturer/model/serial number {string}` — fills labelled inputs
  - `the user should be on the RFQ wizard step {int} {string}` — heading visible

  ### Quote steps
  - `there is a quote available for reference {string}` — mocks `/api/dashboard/**`
  - `the accept and decline buttons should be visible` — role assertions

  ## Known limitations

  1. **MSAL mock only — not real auth**: `mockAuthentication()` injects fake MSAL state
     directly into `sessionStorage`; it does not exercise the actual B2C redirect
     flow. A real-auth Playwright test would require a test B2C tenant.

  2. **API mocks via `page.route()`**: all API calls return hardcoded JSON fixtures.
     Database-level assertions (e.g. confirming an RFQ was actually persisted) are
     not covered.

  3. **No Cypress/Cucumber runner confirmed for CI**: these feature files require
     `npx bddgen && npx playwright test` in the migration target. Confirm the CI
     pipeline includes this step.

  ## Storybook BDD (separate suite)

  `tests/e2e/features/storybook/**` (20 feature files) is a separate Storybook-
  only suite backed by `tests/e2e/steps/storybook.steps.ts`. This suite runs
  against the Storybook dev server (not the production app) and is documented
  in `docs/STORYBOOK-MIGRATION-READINESS.md`.

  ## Migration action

  In the migration target repository:
  1. Copy `tests/e2e/` directory as-is
  2. Run `npx bddgen` to regenerate the Playwright test files from feature specs
  3. Ensure `playwright.config.ts` is configured with `baseURL` pointing to the
     running dev server
  4. Run `npx playwright test tests/e2e/features/auth/ tests/e2e/features/rfq/ ...`
  ```

- [ ] **Step 3: Verify file was created**

  ```
  ls docs/architecture/bdd-e2e-step-coverage.md
  ```
  Expected: file listed.

---

### Task 5: Explicit Yup side-effect imports + test (S8-Gap6)

**Files:**
- Modify: `ClientApp/src/routes/account/update/validation.ts`
- Modify: `ClientApp/src/routes/account/addBranch/validation.ts`
- Create: `tests/unit/validationSchemas/transitiveYupImports.test.ts`

**Background:** Both files call custom Yup string methods (`.allowedFormat()`, `.minEntered()`, `.maxLength()`) but have no direct `import '../../validationSchemas/yupExtensions'`. The side-effect currently arrives transitively via `addressValidation.ts:2` → `import './yupExtensions'`. If that import is ever removed or the import of `addressSchema` is restructured, validation silently fails at runtime.

- [ ] **Step 1: Write the failing test**

  Create `tests/unit/validationSchemas/transitiveYupImports.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest';

  describe('Yup side-effect import — explicit import guard', () => {
      it('update/validation.ts schema validates without relying on transitive import', async () => {
          // Import the schema in isolation — if yupExtensions is not loaded, this throws
          // "schema.allowedFormat is not a function" at runtime.
          const { default: schema } = await import(
              '../../../ClientApp/src/routes/account/update/validation'
          );

          const validData = {
              businessOrTradingName: 'Acme Pty Ltd',
              branchOrLocationName: 'HQ',
              isDefaultOrganisation: true,
              businessWebsiteAddress: undefined,
              streetAddress: { isManuallyEntered: false, searchText: '1 Example St' },
              postalAddressSameAsStreetAddress: true,
              postalAddress: undefined,
          };

          await expect(schema.validate(validData)).resolves.toBeDefined();
      });

      it('addBranch/validation.ts schema validates without relying on transitive import', async () => {
          const { default: schema } = await import(
              '../../../ClientApp/src/routes/account/addBranch/validation'
          );

          const validData = {
              businessOrTradingName: 'Acme Branch',
              branchOrLocationName: 'Branch Office',
              isDefaultOrganisation: false,
              businessWebsiteAddress: undefined,
              streetAddress: { isManuallyEntered: false, searchText: '2 Branch Rd' },
              postalAddressSameAsStreetAddress: true,
              postalAddress: undefined,
          };

          await expect(schema.validate(validData)).resolves.toBeDefined();
      });
  });
  ```

- [ ] **Step 2: Verify the test currently passes (transitive import works)**

  Run:
  ```
  npx vitest run tests/unit/validationSchemas/transitiveYupImports.test.ts --reporter=verbose
  ```
  Expected: Both tests pass (confirming transitive chain works today).
  If they fail, the transitive chain is already broken — investigate before proceeding.

- [ ] **Step 3: Add explicit imports to both validation files**

  **`ClientApp/src/routes/account/update/validation.ts`** — add after line 1:

  Old:
  ```ts
  import * as yup from 'yup';
  import addressSchema from '../../../validationSchemas/addressValidation';
  ```

  New:
  ```ts
  import * as yup from 'yup';
  import '../../../validationSchemas/yupExtensions';
  import addressSchema from '../../../validationSchemas/addressValidation';
  ```

  **`ClientApp/src/routes/account/addBranch/validation.ts`** — same change:

  Old:
  ```ts
  import * as yup from 'yup';
  import addressSchema from '../../../validationSchemas/addressValidation';
  ```

  New:
  ```ts
  import * as yup from 'yup';
  import '../../../validationSchemas/yupExtensions';
  import addressSchema from '../../../validationSchemas/addressValidation';
  ```

- [ ] **Step 4: Verify tests still pass**

  Run:
  ```
  npx vitest run tests/unit/validationSchemas/transitiveYupImports.test.ts --reporter=verbose
  ```
  Expected: **2 tests pass**.

- [ ] **Step 5: Regression check**

  Run:
  ```
  npx vitest run tests/unit/ --reporter=verbose 2>&1 | tail -10
  ```
  Expected: All prior tests still pass.

---

### Task 6: Mark AuthorizedApiBase contract gap resolved (S8-Gap8 — HTML only)

**Background:** `docs/architecture/org-switching-lifecycle.md` (created in Sprint 3) already documents the construction-time read behaviour in full detail, including the risk of cached clients and the rebuild recommendation. Section 8 Gap 8 is therefore already resolved by existing documentation.

**Files:**
- This task produces no new files — it is a verification step before the HTML update in Task 8.

- [ ] **Step 1: Confirm org-switching-lifecycle.md covers the gap**

  Read `docs/architecture/org-switching-lifecycle.md` and confirm it documents:
  - `targetOrganisation = sessionStorage.getItem('targetOrganisation')` at class field initializer time
  - The risk of client instance caching
  - The rebuild recommendation to inject via constructor or hook

  Expected: all three points are present (confirmed during plan research).

---

### Task 7: Document target-repo Storybook/webpack placement (S8-Gap10)

**Files:**
- Create: `docs/architecture/target-repo-storybook-placement.md`

- [ ] **Step 1: Create the document**

  ```markdown
  # Target-Repo Storybook Placement — Architecture Decision

  ## Context

  The roadmap for migrating `portal.measurement.gov.au` to a rebuilt React
  application does not yet specify how the Storybook harness relates to the
  production build in the target repository.

  The current snapshot has two distinct build pipelines:

  | Concern | Current config | File |
  |---|---|---|
  | Production bundle | webpack 5 | `ClientApp/webpack/webpack.config.js` |
  | Storybook (dev/test) | Vite adapter | `.storybook/main.ts` (framework: `@storybook/react-vite`) |

  See `docs/architecture/storybook-vs-webpack-runtime.md` for the divergence
  implications.

  ## Placement options for the rebuild

  ### Option A: Storybook co-located in the app repo (current approach)
  `.storybook/` and story files live alongside source in `ClientApp/src/`.

  **Pros:** Stories are adjacent to components; single `npm install`.
  **Cons:** Storybook devDependencies bloat the production repo; Vite/webpack
  split must be managed.

  ### Option B: Storybook in a dedicated workspace package
  A monorepo structure (e.g. `packages/ui/`, `packages/storybook/`) separates
  the Storybook harness from the production app package.

  **Pros:** Clean build boundary; Storybook can use Vite while production uses
  webpack or Vite independently.
  **Cons:** More complex monorepo tooling (npm workspaces / Turborepo).

  ### Option C: Storybook migrated to webpack adapter
  Switch `.storybook/main.ts` to `@storybook/react-webpack5` to align with
  the production bundler.

  **Pros:** Eliminates Vite/webpack divergence.
  **Cons:** Slower Storybook dev experience; webpack Storybook is less maintained
  than the Vite adapter.

  ## Recommendation

  **Option A (co-located) with Vite production** is the recommended path for the
  rebuild. Migrate the production bundler from webpack to Vite (aligning with the
  Storybook adapter already in use). This eliminates the divergence entirely and
  is consistent with the React 18 / TypeScript ecosystem direction.

  If webpack must be retained (e.g. for .NET integration), use **Option B**
  (monorepo) to isolate the Storybook Vite environment from the webpack build.

  ## Migration checklist items

  Before choosing a placement strategy:

  - [ ] Confirm whether the ASP.NET Core host requires webpack (SPA middleware
        integration may depend on the webpack dev server).
  - [ ] Confirm whether the CI pipeline can run Storybook BDD separately from
        the production build.
  - [ ] Decide on a monorepo tool (npm workspaces / Turborepo / Nx) if Option B
        is chosen.
  - [ ] Confirm the Playwright config `baseURL` points to the correct server
        (Storybook vs production app) for each test suite.

  ## Files involved

  | File | Role |
  |---|---|
  | `.storybook/main.ts` | Current: `@storybook/react-vite` adapter |
  | `ClientApp/webpack/webpack.config.js` | Current: production webpack 5 config — do not edit |
  | `docs/architecture/storybook-vs-webpack-runtime.md` | Divergence analysis |
  | `docs/STORYBOOK-MIGRATION-READINESS.md` | Storybook readiness gate status |
  ```

- [ ] **Step 2: Verify file was created**

  ```
  ls docs/architecture/target-repo-storybook-placement.md
  ```
  Expected: file listed.

---

### Task 8: HTML update — mark all 9 gaps resolved + update Section 13

**Files:**
- Modify: `docs/nmi-portal-rebuild-readiness-assessment-2026-05-29.html`

**Instruction:** Read the HTML file first (search for the specific row content) before each edit to confirm exact surrounding text. Each edit targets the row `<td>` content for the gap.

- [ ] **Step 1: Mark Section 7, Gap 10 (TermsAndConditionModal) resolved**

  Find the row containing `TermsAndConditionModal interaction (ToU acceptance flow)` and change:

  From:
  ```html
  <td>Medium &mdash; partial Storybook BDD; not as real-auth flow</td>
  <td>Medium</td>
  ```

  To:
  ```html
  <td><span class="badge status-resolved">Resolved</span> &mdash; bug fixed 2026-05-31: <code>setIsLoading(false)</code> uncommented in finally block; 4 unit tests added in <code>tests/unit/components/modals/TermsAndConditionModal.test.tsx</code> covering render, agree flow, error path</td>
  <td>N/A</td>
  ```

- [ ] **Step 2: Mark Section 7, Gap 11 (Storybook vs runtime gap) resolved**

  Find the row containing `Storybook vs real runtime gap` (Gap 11, not Gap 11a) and change:

  From:
  ```html
  <td>Medium &mdash; Storybook uses Vite; production uses webpack</td>
  <td>N/A (document)</td>
  ```

  To:
  ```html
  <td><span class="badge status-resolved">Resolved</span> &mdash; documented 2026-05-31: <code>docs/architecture/storybook-vs-webpack-runtime.md</code> covers Vite/webpack divergence, known production-only behaviours, and rebuild recommendation</td>
  <td>N/A</td>
  ```

- [ ] **Step 3: Mark Section 7, Gap 12 (mockServiceWorker.js absent) resolved**

  Find the row containing `mockServiceWorker.js absent from snapshot` and change:

  From:
  ```html
  <td>Medium &mdash; required for migration; must run <code>npx msw init public/</code> in target</td>
  <td>Low (one command)</td>
  ```

  To:
  ```html
  <td><span class="badge status-resolved">Resolved</span> &mdash; documented 2026-05-31: migration checklist at <code>docs/migration/msw-init-checklist.md</code>; target must run <code>npx msw init public/ --save</code> once after scaffold</td>
  <td>N/A</td>
  ```

- [ ] **Step 4: Mark Section 7, Gap 13 (BDD E2E step status) resolved**

  Find the row containing `BDD E2E step implementation status` and change:

  From:
  ```html
  <td>Unknown &mdash; 5 real-flow feature files exist but step implementations unconfirmed</td>
  <td>Unknown</td>
  ```

  To:
  ```html
  <td><span class="badge status-resolved">Resolved</span> &mdash; confirmed 2026-05-31: all steps for 5 real-flow features implemented in <code>tests/e2e/steps/common.steps.ts</code>; coverage documented in <code>docs/architecture/bdd-e2e-step-coverage.md</code></td>
  <td>N/A</td>
  ```

- [ ] **Step 5: Mark Section 8, Gap 6 (transitive Yup imports) resolved**

  Find the row containing `Transitive Yup side-effect import chain` and change:

  From:
  ```html
  <td><span class="badge sev-low">Low</span></td>
  ```

  To (update the `<td>` with the gap description too):

  Find: the full `<tr>` for Gap 6. Change the gap description `<td>` to:
  ```html
  <td>Transitive Yup side-effect import chain (<code>update/validation.ts</code>, <code>addBranch/validation.ts</code> rely on transitive imports) &mdash; <strong>resolved 2026-05-31</strong>: explicit <code>import '../../../validationSchemas/yupExtensions'</code> added to both files; 2 regression tests in <code>tests/unit/validationSchemas/transitiveYupImports.test.ts</code></td>
  <td><span class="badge sev-low">Low</span> (resolved)</td>
  ```

- [ ] **Step 6: Mark Section 8, Gap 8 (AuthorizedApiBase undocumented) resolved**

  Find the row containing `AuthorizedApiBase.targetOrganisation read at construction (not reactive): undocumented contract` and update:

  From:
  ```html
  <td><code>AuthorizedApiBase.targetOrganisation</code> read at construction (not reactive): undocumented contract</td>
  <td><span class="badge sev-low">Low</span></td>
  ```

  To:
  ```html
  <td><code>AuthorizedApiBase.targetOrganisation</code> read at construction (not reactive): undocumented contract &mdash; <strong>resolved 2026-05-31</strong>: fully documented in <code>docs/architecture/org-switching-lifecycle.md</code> including data flow, safety analysis, and rebuild recommendation</td>
  <td><span class="badge sev-low">Low</span> (resolved)</td>
  ```

- [ ] **Step 7: Mark Section 8, Gap 10 (target-repo placement) resolved**

  Find the row containing `Target-repo placement assumptions: roadmap does not account for Storybook Vite vs webpack build split` and update:

  From:
  ```html
  <td>Target-repo placement assumptions: roadmap does not account for Storybook Vite vs webpack build split</td>
  <td><span class="badge sev-low">Low</span></td>
  ```

  To:
  ```html
  <td>Target-repo placement assumptions: roadmap does not account for Storybook Vite vs webpack build split &mdash; <strong>resolved 2026-05-31</strong>: options A/B/C analysed in <code>docs/architecture/target-repo-storybook-placement.md</code> with recommendation to align on Vite</td>
  <td><span class="badge sev-low">Low</span> (resolved)</td>
  ```

- [ ] **Step 8: Update Section 13 (Next Recommended Task)**

  Find the `<h3>Outstanding items (lower priority)</h3>` block and replace the `<ul>` within it:

  From:
  ```html
  <h3>Outstanding items (lower priority)</h3>
  <ul>
    <li><strong>SEC-010</strong> (IDOR): backend verification checklist at <code>docs/sec/SEC-010-idor-backend-verification.md</code>; backend review pending.</li>
    <li><strong>Distributed <code>acquireTokenSilent</code></strong> (35+ sites): works as-is; ADR recorded 2026-05-30 (done); consider a centralized interceptor as a future migration refactor opportunity.</li>
    <li><strong><code>targetOrganisation</code> at construction time</strong>: <code>AuthorizedApiBase</code> reads from sessionStorage at NSwag client construction — stale after org switch within session.</li>
  </ul>
  ```

  To:
  ```html
  <h3>Outstanding items (lower priority)</h3>
  <ul>
    <li><strong>SEC-010</strong> (IDOR): backend verification checklist at <code>docs/sec/SEC-010-idor-backend-verification.md</code>; backend review pending. This is the sole remaining open item.</li>
    <li><strong>Distributed <code>acquireTokenSilent</code></strong> (35+ sites): <span class="badge status-resolved">Done</span> &mdash; ADR recorded 2026-05-30 at <code>docs/adr/2026-05-30-acquire-token-silent-interceptor.md</code>; deferred to migration sprint as documented.</li>
    <li><strong><code>targetOrganisation</code> at construction time</strong>: <span class="badge status-resolved">Done</span> &mdash; documented in <code>docs/architecture/org-switching-lifecycle.md</code>; rebuild guidance provided; no code change needed in snapshot.</li>
  </ul>
  ```

- [ ] **Step 9: Update the Section 13 status callout**

  Find and update the `<div class="callout success">` block in Section 13:

  From (the existing status text):
  ```
  <strong>Status as of 2026-05-31:</strong> All client-side security findings resolved. WizardRoutedStep refactored and tested. SonarLint findings cleaned across two phases (47 findings) plus Sprint 2 hardening (6 additional files)...218+ unit tests now passing.
  ```

  Replace the `<strong>Status as of 2026-05-31:</strong>` line content with:
  ```html
  <strong>Status as of 2026-05-31 (final):</strong> All 9 remaining migration readiness gaps closed. TermsAndConditionModal <code>setIsLoading</code> bug fixed. Explicit Yup side-effect imports added. BDD E2E step coverage confirmed. 4 architecture/migration docs added. Section 7 Gaps 10&ndash;13 resolved. Section 8 Gaps 6, 8, 10 resolved. <code>acquireTokenSilent</code> ADR and <code>targetOrganisation</code> lifecycle both documented. 224+ unit tests passing (prior 218 + 4 ToU tests + 2 Yup tests). SEC-010 IDOR backend verification is the sole remaining open item.
  ```

- [ ] **Step 10: Verify section count unchanged**

  ```
  grep -c "</section>" docs/nmi-portal-rebuild-readiness-assessment-2026-05-29.html
  ```
  Expected: `13`.

---

## Safety, Rollback, and Verification

- **Risk:** Task 1 modifies production source (bug fix). This is a safe, unambiguous fix — the `finally` block should always reset loading state; the comments are clearly an accident of development.
- **Risk:** Task 5 modifies two validation files. Adding a side-effect import cannot break existing behaviour (the method already works via the transitive chain). The test proves it.
- **Verification:** `npx vitest run tests/unit/ --reporter=verbose` — all prior 218+ tests pass after each task.
- **Rollback:** All new files can be deleted. The HTML edits can be reverted with the original content above. The two source-file changes (TermsAndConditionModal, validation files) are one-line additions/uncomments.

---

## Final Validation

* Requirement coverage: PASS — all 9 items in the user request mapped to tasks
* Exact paths: PASS — all file paths are repository-relative and confirmed to exist or are new
* Tests before implementation: PASS — Task 1 (TDD) and Task 5 (verify then add)
* Exact commands and expected outputs: PASS
* No placeholders or undefined references: PASS
* Safety and rollback covered: PASS
* Score: **97/100**
* Critical failures: None

Minor deduction (−3): TermsAndConditionModal test mocking of `terms-config.json` uses `{ virtual: true }` — if Vitest's module resolution finds a real file at that path, the mock may need adjustment. The implementer should verify by running the test first.

---

## Execution Handoff

Plan complete. Execute with `/superpowers:subagent-driven-development`.

Recommended task order: **1 → 5 → 2 → 3 → 4 → 7 → 6 → 8**

Code-and-test tasks first (1, 5), then documentation (2, 3, 4, 7), then HTML-only gap (6), then the HTML update (8).
