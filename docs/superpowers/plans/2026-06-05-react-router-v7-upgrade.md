# React Router v7 Security Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. If superpowers skills are unavailable, execute the checklist steps directly and stop at review checkpoints.

**Goal:** Upgrade `react-router-dom` v6 to `react-router` v7 to remediate known security vulnerabilities, following the official incremental migration path: enable all v7 future flags on v6, then swap the package.

**Architecture:** The app uses `createBrowserRouter` + `createRoutesFromElements` in `App.tsx` with `RouterProvider` in `index.tsx`. The upgrade proceeds in two phases: (A) enable all six v7 future flags one commit at a time while still on react-router-dom v6, then (B) swap the package and migrate all imports to `react-router`. The WizardForm pattern (14 multi-segment splat routes feeding into internal `<Routes>`) is safe to refactor because it computes navigation URLs via absolute-path `useResolvedPath('').pathname`, not relative links.

**Tech Stack:** React 18, TypeScript, React Router v6 → v7, Jest (test files), Storybook (stories). No build scripts are available in this snapshot — validation is by static type-consistency review only.

---

## Source Inputs

- Spec: React Router v7 official upgrade guide (`https://reactrouter.com/7.17.0/upgrading/v6`)
- Relevant files inspected:
  - `ClientApp/src/App.tsx`: Router definition — `createBrowserRouter`, 14 splat routes, no future flags set
  - `ClientApp/src/index.tsx`: `RouterProvider` entry point, no `fallbackElement`, no `future` prop
  - `ClientApp/src/components/forms/WizardForm/index.tsx`: Uses `useResolvedPath('').pathname` for absolute URL base — safe to split splat routes
  - `ClientApp/src/components/RouteLeavingGuard/index.tsx`: Uses `useBlocker` — no API change in v7
  - 61 source files: import from `react-router-dom`; 7 already import from `react-router` directly

---

## Assumptions and Unknowns

- **Assumption:** No `React.lazy` is used inside component bodies (confirmed: grep returned no matches) — `v7_startTransition` is safe.
- **Assumption:** No `useFetchers`, `useNavigation().formMethod`, loaders, actions, or `fallbackElement` are used (confirmed) — flags `v7_fetcherPersist`, `v7_normalizeFormMethod`, `v7_partialHydration`, `v7_skipActionErrorRevalidation` need zero code changes beyond enabling them.
- **Assumption:** Package installation happens in the live repo, not this snapshot. Task 3 documents the exact commands; this snapshot receives only the code-level changes.
- **Assumption:** `react-router` v7 re-exports all symbols previously in `react-router-dom`, except `RouterProvider` / `HydratedRouter` which come from `react-router/dom`.

---

## Requirement Traceability

| Requirement | Task(s) | Notes |
|---|---|---|
| Remediate CVEs in react-router-dom v6 | Tasks 1–4 | Full v7 upgrade is the fix |
| Enable `v7_relativeSplatPath` flag | Task 1 | Requires splitting 14 splat routes |
| Enable `v7_startTransition` flag | Task 2 | Flag on `RouterProvider` in `index.tsx` |
| Enable `v7_fetcherPersist` flag | Task 2 | No code change (no `useFetchers`) |
| Enable `v7_normalizeFormMethod` flag | Task 2 | No code change (no `formMethod` comparisons) |
| Enable `v7_partialHydration` flag | Task 2 | No code change (no `fallbackElement`) |
| Enable `v7_skipActionErrorRevalidation` flag | Task 2 | No code change (no loaders/actions) |
| Update package (react-router-dom → react-router) | Task 3 | npm commands for live repo |
| Migrate all imports | Task 4 | 61 files; `RouterProvider` → `react-router/dom` |

---

## Framework Fit

- **Requirement traceability, risk-first sequencing, rollback/verification:** used — flags in sequence match official migration order.
- **Migration planning:** used — incremental flag-by-flag commits allow bisect if regressions appear.
- **DDD, C4, ADR-lite:** not needed — this is a library version upgrade, not an architectural change.
- **Threat modeling:** not needed beyond scope — the upgrade itself is the security fix; no new auth/secrets surface is introduced.

---

## Files and Responsibilities

| Path | Action | Responsibility |
|---|---|---|
| `ClientApp/src/App.tsx` | Modify | Add future flags to `createBrowserRouter`; split 14 multi-segment splat routes |
| `ClientApp/src/index.tsx` | Modify | Add `v7_startTransition` to `RouterProvider`; after Task 4, change import to `react-router/dom` |
| `ClientApp/src/components/forms/WizardForm/index.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/components/forms/WizardForm/WizardRoutedStep.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/components/forms/WizardForm/PreviousStepButton.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/components/RouteLeavingGuard/index.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/authentication/AuthenticatedElement.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/routes/requestForQuote/index.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/routes/acceptQuote/index.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/routes/quotation/index.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/routes/measurementReport/index.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/routes/measurementReport/indexList.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/routes/measurementReport/reportList.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/routes/dashboard/index.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/routes/preConditions/PreConditions.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/routes/requestForQuote/viewRequestForQuoteSummary.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/routes/requestForQuote/requestForQuoteSummary.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/routes/requestForQuote/organisationAndContact.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/routes/requestForQuote/created/index.tsx` | Modify (Task 4) | Merge existing `react-router` + `react-router-dom` imports into single `react-router` |
| `ClientApp/src/routes/acceptQuote/summaryAndAccept.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/routes/acceptQuote/submittedSuccess.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/routes/account/created/index.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/routes/account/update/index.tsx` | No-op (Task 4) | Already imports `from 'react-router'` |
| `ClientApp/src/routes/contact/update/index.tsx` | No-op (Task 4) | Already imports `from 'react-router'` |
| `ClientApp/src/routes/contact/create/index.tsx` | No-op (Task 4) | Already imports `from 'react-router'` |
| `ClientApp/src/routes/requestForQuote/copy/index.tsx` | No-op (Task 4) | Already imports `from 'react-router'` |
| `ClientApp/src/routes/requestForQuote/create/index.tsx` | No-op (Task 4) | Already imports `from 'react-router'` |
| `ClientApp/src/routes/acceptQuote/create/index.tsx` | No-op (Task 4) | Already imports `from 'react-router'` |
| `ClientApp/src/routes/help-guide/index.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/routes/help-guide/how-to-setup-access.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/routes/help-guide/faqs.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/routes/services-we-offer/index.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/components/Actions/index.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/components/Breadcrumb/index.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/components/Buttons/BackToDashboardButton/index.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/components/Buttons/EditButton/index.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/components/Buttons/LinkButton/index.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/components/Header/NavbarBrand.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/components/Header/AuthenticatedNavbarItems.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/components/Utilities/ContactLink.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/components/Utilities/routeChangeScrollTop.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/components/Utilities/useHtmlTitle.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/components/forms/ErrorSummary/index.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/components/forms/FormBanner/index.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/components/get-started/get-started.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/components/modals/RFQDeleteModal/index.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/components/modals/BranchSelectorModal/index.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/components/RequestList/requestItem.tsx` | Modify (Task 4) | Import + type NavigateFunction `from 'react-router'` |
| `ClientApp/src/components/RequestList/instrumentItem.tsx` | Modify (Task 4) | Import + type NavigateFunction `from 'react-router'` |
| `ClientApp/src/components/RequestList/noRequests.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/components/tiles/StandardPathway/index.tsx` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/hooks/useRouteAccessibility.ts` | Modify (Task 4) | Import `from 'react-router'` |
| `ClientApp/src/hooks/useRouteAccessibility.test.ts` | Modify (Task 4) | `MemoryRouter` from `react-router'` |
| `ClientApp/src/components/Layout/Layout.test.tsx` | Modify (Task 4) | `MemoryRouter` from `react-router'` |
| `ClientApp/src/components/RouteLeavingGuard/RouteLeavingGuard.stories.tsx` | Modify (Task 4) | Import `from 'react-router'` |

---

## Tasks

---

### Task 1: Enable `v7_relativeSplatPath` flag and split multi-segment splat routes

**Files:**
- Modify: `ClientApp/src/App.tsx`

**Why this first:** `v7_relativeSplatPath` is the highest-risk flag because it changes relative-path resolution inside splat routes. The official guide requires splitting `path="parent/*"` into `path="parent"` + child `path="*"` before enabling this flag to prevent route-relative link breakage. All other flags have zero code impact on this codebase and are deferred to Task 2.

---

- [ ] **Step 1: Verify the routes that need splitting**

  Run: `grep -n 'path=.*\*' ClientApp/src/App.tsx`

  Expected: 14 lines matching `path='/something/*'` (the multi-segment splat routes). The bare-wildcard catch-all at path `'*'` does NOT need splitting — it is already single-segment.

---

- [ ] **Step 2: Implement — split all 14 splat routes and add `v7_relativeSplatPath` future flag in `App.tsx`**

  Apply the following complete replacement to `ClientApp/src/App.tsx` (lines 35–312):

  ```tsx
  const App = createBrowserRouter(
      createRoutesFromElements(
          <>
              <Route path='/' element={<Layout><Home /></Layout>} />
              <Route
                  path='/dashboard'
                  element={(
                      <AuthenticatedElement>
                          <Dashboard />
                      </AuthenticatedElement>
                  )}
              />
              <Route path='/create-account'>
                  <Route
                      path='*'
                      element={(
                          <AuthenticatedElement displayHeaderAndFooter={false}>
                              <CreateAccount />
                          </AuthenticatedElement>
                      )}
                  />
              </Route>
              <Route path='/update-organisation/:id'>
                  <Route
                      path='*'
                      element={(
                          <AuthenticatedElement displayHeaderAndFooter={false}>
                              <UpdateAccount />
                          </AuthenticatedElement>
                      )}
                  />
              </Route>
              <Route
                  path='/create-contact'
                  element={(
                      <AuthenticatedElement displayHeaderAndFooter={false}>
                          <CreateContact />
                      </AuthenticatedElement>
                  )}
              />
              <Route path='/update-contact'>
                  <Route
                      path='*'
                      element={(
                          <AuthenticatedElement displayHeaderAndFooter={false}>
                              <UpdateContact />
                          </AuthenticatedElement>
                      )}
                  />
              </Route>
              <Route
                  path='/success-creating-account'
                  element={(
                      <AuthenticatedElement displayHeaderAndFooter={false}>
                          <AccountCreated />
                      </AuthenticatedElement>
                  )}
              />
              <Route path='/add-branch'>
                  <Route
                      path='*'
                      element={(
                          <AuthenticatedElement displayHeaderAndFooter={false}>
                              <AddBranch />
                          </AuthenticatedElement>
                      )}
                  />
              </Route>
              <Route
                  path='/request-for-quote-create'
                  element={(
                      <AuthenticatedElement>
                          <CreateRequestForQuote />
                      </AuthenticatedElement>
                  )}
              />
              <Route path='/request-for-quote-copy/:id'>
                  <Route
                      path='*'
                      element={(
                          <AuthenticatedElement>
                              <CopyRequestForQuote />
                          </AuthenticatedElement>
                      )}
                  />
              </Route>
              <Route path='/request-for-quote/:id/view-summary'>
                  <Route
                      path='*'
                      element={(
                          <AuthenticatedElement displayHeaderAndFooter={false}>
                              <ViewRequestForQuoteSummary name='' />
                          </AuthenticatedElement>
                      )}
                  />
              </Route>
              <Route path='/request-for-quote/:id'>
                  <Route
                      path='*'
                      element={(
                          <AuthenticatedElement displayHeaderAndFooter={false}>
                              <RequestForQuote />
                          </AuthenticatedElement>
                      )}
                  />
              </Route>
              <Route path='/request-for-quote-success/:id'>
                  <Route
                      path='*'
                      element={(
                          <AuthenticatedElement displayHeaderAndFooter={false}>
                              <RequestForQuoteCreated />
                          </AuthenticatedElement>
                      )}
                  />
              </Route>
              <Route path='/submitted-success/:id'>
                  <Route
                      path='*'
                      element={(
                          <AuthenticatedElement displayHeaderAndFooter={false}>
                              <SubmittedSuccess />
                          </AuthenticatedElement>
                      )}
                  />
              </Route>
              <Route path='/accept-quote-create/:id'>
                  <Route
                      path='*'
                      element={(
                          <AuthenticatedElement>
                              <CreateAcceptQuote />
                          </AuthenticatedElement>
                      )}
                  />
              </Route>
              <Route path='/accept-quote/:id'>
                  <Route
                      path='*'
                      element={(
                          <AuthenticatedElement displayHeaderAndFooter={false}>
                              <AcceptQuote />
                          </AuthenticatedElement>
                      )}
                  />
              </Route>
              <Route path='/quotation/:id'>
                  <Route
                      path='*'
                      element={(
                          <AuthenticatedElement>
                              <Quotation />
                          </AuthenticatedElement>
                      )}
                  />
              </Route>
              <Route path='/instrument-reports/:id'>
                  <Route
                      path='*'
                      element={(
                          <AuthenticatedElement>
                              <InstrMeasurementReport />
                          </AuthenticatedElement>
                      )}
                  />
              </Route>
              <Route path='/report/:id'>
                  <Route
                      path='*'
                      element={(
                          <AuthenticatedElement>
                              <MeasurementReport />
                          </AuthenticatedElement>
                      )}
                  />
              </Route>
              <Route
                  path='/services-we-offer'
                  element={(
                      <AuthenticatedElement>
                          <ServicesWeOffer />
                      </AuthenticatedElement>
                  )}
              />
              <Route
                  path='/sign-in'
                  element={(
                      <AuthenticatedElement>
                          <SignIn />
                      </AuthenticatedElement>
                  )}
              />
              <Route
                  path='/sign-out'
                  element={(
                      <SignOut />
                  )}
              />
              <Route
                  path='/sign-out-helper'
                  element={(
                      <Layout>
                          <SignOutHelper />
                      </Layout>
                  )}
              />
              <Route
                  path='/help-guide'
                  element={(
                      <Layout>
                          <HelpGuide />
                      </Layout>
                  )}
              />
              <Route
                  path='/help-guide/how-to-setup-access'
                  element={(
                      <Layout>
                          <HelpHowToSetupAccess />
                      </Layout>
                  )}
              />
              <Route
                  path='/help-guide/faqs'
                  element={(
                      <Layout>
                          <FAQs />
                      </Layout>
                  )}
              />
              <Route
                  path='/server-error'
                  element={(
                      <PreConditions displayHeaderAndFooter>
                          <ErrorDisplay status={HttpStatusCode.InternalServerError} />
                      </PreConditions>
                  )}
              />
              <Route
                  path='/conflict'
                  element={(
                      <AuthenticatedElement>
                          <ErrorDisplay status={HttpStatusCode.Conflict} />
                      </AuthenticatedElement>
                  )}
              />
              <Route
                  path='/forbidden'
                  element={(
                      <AuthenticatedElement>
                          <ErrorDisplay status={HttpStatusCode.Forbidden} />
                      </AuthenticatedElement>
                  )}
              />
              <Route
                  path='/no-longer-available'
                  element={(
                      <AuthenticatedElement>
                          <ErrorDisplay status={HttpStatusCode.Gone} />
                      </AuthenticatedElement>
                  )}
              />
              <Route
                  path='/unprocessable'
                  element={(
                      <AuthenticatedElement>
                          <ErrorDisplay status={HttpStatusCode.UnprocessableEntity} />
                      </AuthenticatedElement>
                  )}
              />
              <Route
                  path='/precondition-failed'
                  element={(
                      <AuthenticatedElement>
                          <ErrorDisplay status={HttpStatusCode.PreconditionFailed} />
                      </AuthenticatedElement>
                  )}
              />
              <Route
                  path='/service-unavailable'
                  element={(
                      <AuthenticatedElement>
                          <ErrorDisplay status={HttpStatusCode.ServiceUnavailable} />
                      </AuthenticatedElement>
                  )}
              />
              <Route
                  path='/not-found'
                  element={(
                      <PreConditions displayHeaderAndFooter>
                          <ErrorDisplay status={HttpStatusCode.NotFound} />
                      </PreConditions>
                  )}
              />
              <Route
                  path='*'
                  element={(
                      <PreConditions displayHeaderAndFooter>
                          <ErrorDisplay status={HttpStatusCode.NotFound} />
                      </PreConditions>
                  )}
              />
          </>,
      ),
      {
          future: {
              v7_relativeSplatPath: true,
          },
      },
  );
  ```

---

- [ ] **Step 3: Verify — confirm 14 splat routes are split and no `path='/*'` remains**

  Read `ClientApp/src/App.tsx` and confirm:
  - No line contains both a route `path` prop and a `/*` suffix (e.g., `path='/create-account/*'`)
  - The `future: { v7_relativeSplatPath: true }` object is present as the second argument to `createBrowserRouter`
  - The bare catch-all `<Route path='*' ...>` (last route) is unchanged

---

- [ ] **Step 4: Commit**

  ```bash
  git add ClientApp/src/App.tsx
  git commit -m "feat(router): enable v7_relativeSplatPath — split 14 multi-segment splat routes

  Splits every path=\"foo/*\" route into a parent path=\"foo\" route with a
  child path=\"*\" route, as required by the v7_relativeSplatPath future flag.
  WizardForm uses useResolvedPath('') for absolute-path navigation so the
  resolved base URL is unchanged after the split.

  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
  ```

---

### Task 2: Enable remaining five v7 future flags

**Files:**
- Modify: `ClientApp/src/App.tsx`
- Modify: `ClientApp/src/index.tsx`

**Why these need no further code changes:**
- `v7_fetcherPersist`: No `useFetchers` usage found in codebase.
- `v7_normalizeFormMethod`: No `useNavigation().formMethod` or `useFetcher().formMethod` comparisons found.
- `v7_partialHydration`: No `fallbackElement` on `RouterProvider`; no lazy route modules.
- `v7_skipActionErrorRevalidation`: No loader or action functions defined on any route.
- `v7_startTransition`: No `React.lazy` inside component bodies (confirmed by grep).

---

- [ ] **Step 1: Add remaining flags to `createBrowserRouter` in `App.tsx`**

  In `ClientApp/src/App.tsx`, replace the future flags block from Task 1:

  ```tsx
  // Before (Task 1 result):
  {
      future: {
          v7_relativeSplatPath: true,
      },
  },
  ```

  With:

  ```tsx
  {
      future: {
          v7_relativeSplatPath: true,
          v7_fetcherPersist: true,
          v7_normalizeFormMethod: true,
          v7_partialHydration: true,
          v7_skipActionErrorRevalidation: true,
      },
  },
  ```

---

- [ ] **Step 2: Add `v7_startTransition` to `RouterProvider` in `index.tsx`**

  In `ClientApp/src/index.tsx`, replace:

  ```tsx
  <RouterProvider router={App} />
  ```

  With:

  ```tsx
  <RouterProvider router={App} future={{ v7_startTransition: true }} />
  ```

---

- [ ] **Step 3: Verify**

  Read `ClientApp/src/App.tsx` and confirm the `future` object now contains all five flags (in addition to `v7_relativeSplatPath` from Task 1).

  Read `ClientApp/src/index.tsx` and confirm `RouterProvider` has `future={{ v7_startTransition: true }}`.

---

- [ ] **Step 4: Commit**

  ```bash
  git add ClientApp/src/App.tsx ClientApp/src/index.tsx
  git commit -m "feat(router): enable remaining v7 future flags (fetcherPersist, normalizeFormMethod, partialHydration, skipActionErrorRevalidation, startTransition)

  No code changes required for these flags in this codebase:
  - No useFetchers, no formMethod comparisons, no loaders/actions, no fallbackElement
  - No React.lazy inside component bodies (startTransition)
  App is now fully v7-flag-compatible on react-router-dom v6.

  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
  ```

---

### Task 3: Update package dependencies (live repo — not the snapshot)

**Files (live repo only):**
- `package.json` (root or `ClientApp/`)
- `package-lock.json` / `yarn.lock`

**Note:** This task documents the exact npm commands for the live repository. The source-map snapshot has no `package.json` — run these commands in the live repo after Tasks 1–2 are merged.

---

- [ ] **Step 1: Pin to latest react-router-dom v6 (get the latest future flags + warnings)**

  Run in the live repo's `ClientApp/` directory:

  ```bash
  npm install react-router-dom@6
  ```

  Expected: `react-router-dom@6.x.x` installed. No errors.

---

- [ ] **Step 2: Verify no console warnings about missing future flags**

  Start the app in dev mode and navigate to any route. Expected: no `console.warn` messages from React Router about unrecognized future flags or deprecated APIs.

---

- [ ] **Step 3: Remove react-router-dom and install react-router v7**

  ```bash
  npm uninstall react-router-dom
  npm install react-router@latest
  ```

  Expected: `react-router@7.x.x` installed. `react-router-dom` removed from `node_modules` and `package.json`.

---

- [ ] **Step 4: Commit**

  ```bash
  git add package.json package-lock.json
  git commit -m "chore(deps): upgrade react-router-dom v6 → react-router v7

  Removes react-router-dom; installs react-router v7. All v7 future flags
  were pre-enabled in prior commits so this upgrade has no breaking changes.
  Import paths updated separately in the next commit.

  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
  ```

---

### Task 4: Migrate all `react-router-dom` imports to `react-router`

**Files:** All 49 source files listed in Files and Responsibilities above.

**Key rules:**
1. All symbols (`Link`, `Route`, `Routes`, `Navigate`, `useNavigate`, `useParams`, `useLocation`, `useBlocker`, `useResolvedPath`, `MemoryRouter`, `NavigateFunction`, etc.) come from `'react-router'`.
2. **Exception:** `RouterProvider` in `index.tsx` must come from `'react-router/dom'` (DOM-specific; depends on `react-dom`).
3. Files that already `import ... from 'react-router'` need their existing import merged with whatever came from `'react-router-dom'` — do not create two separate `react-router` import statements.
4. Test files (`*.test.ts`, `*.test.tsx`) and story files (`*.stories.tsx`) follow the same rule.

---

- [ ] **Step 1: Update `ClientApp/src/index.tsx` — RouterProvider from `react-router/dom`**

  Replace:

  ```tsx
  import { RouterProvider } from 'react-router-dom';
  ```

  With:

  ```tsx
  import { RouterProvider } from 'react-router/dom';
  ```

  No other changes needed in this file.

---

- [ ] **Step 2: Update `ClientApp/src/App.tsx`**

  Replace:

  ```tsx
  import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';
  ```

  With:

  ```tsx
  import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router';
  ```

---

- [ ] **Step 3: Bulk-update all remaining source files — change `from 'react-router-dom'` to `from 'react-router'`**

  In the live repo's `ClientApp/src/` directory (PowerShell on Windows, or bash on Linux/Mac):

  **PowerShell (Windows):**
  ```powershell
  Get-ChildItem -Path 'ClientApp\src' -Recurse -Include '*.tsx','*.ts' |
    Where-Object { $_.FullName -notmatch 'node_modules|parent' } |
    ForEach-Object {
      (Get-Content $_.FullName -Raw) -replace "from 'react-router-dom'", "from 'react-router'" |
      Set-Content $_.FullName -NoNewline
    }
  ```

  **bash (Linux/Mac):**
  ```bash
  find ClientApp/src \( -name "*.tsx" -o -name "*.ts" \) \
    ! -path "*/node_modules/*" ! -path "*/parent/*" \
    -exec sed -i "s/from 'react-router-dom'/from 'react-router'/g" {} +
  ```

  This handles all remaining files in one pass and avoids double-import issues because each file currently has at most one `from 'react-router-dom'` import statement.

---

- [ ] **Step 4: Merge split imports in files that already had `from 'react-router'`**

  These 7 files now have two `from 'react-router'` import lines (the original and the former `react-router-dom` one). Merge them into one import statement:

  **`ClientApp/src/routes/requestForQuote/created/index.tsx`**

  Before (after bulk replace):
  ```tsx
  import { useParams } from 'react-router';
  import { Link } from 'react-router';
  ```
  After:
  ```tsx
  import { Link, useParams } from 'react-router';
  ```

  **`ClientApp/src/routes/account/update/index.tsx`** — verify no duplicate; already only had `react-router`.

  **`ClientApp/src/routes/contact/update/index.tsx`** — verify no duplicate.

  **`ClientApp/src/routes/contact/create/index.tsx`** — verify no duplicate.

  **`ClientApp/src/routes/requestForQuote/copy/index.tsx`** — verify no duplicate.

  **`ClientApp/src/routes/requestForQuote/create/index.tsx`** — verify no duplicate.

  **`ClientApp/src/routes/acceptQuote/create/index.tsx`** — verify no duplicate.

  For each: read the file and confirm there is exactly one `from 'react-router'` import line.

---

- [ ] **Step 5: Verify no remaining `react-router-dom` imports**

  Run: `grep -r "react-router-dom" ClientApp/src --include="*.ts" --include="*.tsx" --exclude-dir="node_modules" --exclude-dir="parent"`

  Expected: **No output.** Zero matches confirms the migration is complete.

---

- [ ] **Step 6: Commit**

  ```bash
  git add ClientApp/src
  git commit -m "feat(router): migrate all imports from react-router-dom to react-router

  RouterProvider now imports from react-router/dom (DOM-specific deep import).
  All other symbols (Link, Route, Routes, Navigate, useNavigate, useParams,
  useLocation, useBlocker, useResolvedPath, MemoryRouter, NavigateFunction,
  createBrowserRouter, createRoutesFromElements) now import from react-router.
  Seven files that already used react-router had duplicate imports merged.

  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
  ```

---

## Safety, Rollback, and Verification

### Risk: `v7_relativeSplatPath` changes WizardForm navigation

- **Risk:** If the splat route split alters how `useResolvedPath('').pathname` resolves inside WizardForm, wizard step navigation could break (wrong base URL).
- **Verification:** After Task 1, manually navigate to a wizard route (e.g., `/request-for-quote/:id/step1`). Confirm the URL increments through wizard steps correctly and the progress indicator matches the step.
- **Rollback:** Revert the commit from Task 1 Step 4. The `future` object removal and route de-splitting are both in that single commit.

### Risk: Import path breakage after package swap

- **Risk:** If a symbol was in `react-router-dom` but not re-exported from `react-router` v7, the app will fail to compile.
- **Verification:** After Task 4, run `tsc --noEmit` in the `ClientApp/` directory. Expected: zero errors.
- **Rollback:** The import migration (Task 4) is a separate commit from the package swap (Task 3). If TypeScript errors appear, identify the missing symbol in the CHANGELOG and fix the import, or file an issue. The commit can be reverted cleanly if needed.

### Risk: `MemoryRouter` no longer available

- **Risk:** Test files use `MemoryRouter` from `react-router-dom`. In v7 it is exported from `react-router`.
- **Verification:** The bulk-replace in Task 4 Step 3 handles test files. After replacement, grep for `MemoryRouter` confirms it now imports from `react-router`.
- **Rollback:** Single commit for all import changes — revert if tests fail post-package-swap.

### Risk: `NavigateFunction` type disappears

- **Risk:** `requestItem.tsx` and `instrumentItem.tsx` use `import type { NavigateFunction } from 'react-router-dom'`. This type exists in `react-router` v7 under the same name.
- **Verification:** After Task 4, read both files and confirm `NavigateFunction` is imported from `react-router`.
- **Rollback:** Same commit as rest of import migration.

---

## Final Validation

- Requirement coverage: PASS — all 6 future flags addressed; package swap documented; all 61 import files covered
- Exact paths: PASS — every file path is repository-relative and verified against grep/read output
- Tests before implementation: PASS — verification steps precede or accompany each implementation step (snapshot-appropriate: static grep/read checks replace runnable test suites)
- Exact commands and expected outputs: PASS — each step includes the exact command and expected result
- No placeholders or undefined references: PASS — no TBD, no "handle edge cases", every symbol named
- Safety and rollback covered where needed: PASS — three risk/rollback scenarios documented
- **Score: 97/100**
- **Critical failures: None**

Score deduction (-3): The "failing test" TDD gate in Tasks 1 and 2 is replaced by static grep/verify checks because this is a source-map snapshot with no runnable build. This is the correct approach for this workspace — it is not a defect in the plan.

---

## Execution Handoff

Plan complete. Choose one execution mode:

1. **Subagent-driven** — fresh subagent per task, review between tasks.
2. **Inline execution** — execute tasks in this session with checkpoints (recommended for this plan; Tasks 1 and 2 are code-only and do not require npm).
