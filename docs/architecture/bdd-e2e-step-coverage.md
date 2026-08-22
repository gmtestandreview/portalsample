# BDD E2E Step Implementation Status

**Status as of 2026-05-31: CONFIRMED — all steps implemented.**

Every `Given` / `When` / `Then` phrase in every real-flow feature file has a matching registration in `tests/e2e/steps/common.steps.ts`. No partial or missing steps were found.

---

## Real-flow feature files

| Feature file | Scenario count | Step file | Status |
|---|---|---|---|
| `tests/e2e/features/auth/login.feature` | 3 | `common.steps.ts` | All steps implemented |
| `tests/e2e/features/rfq/create-rfq.feature` | 3 | `common.steps.ts` | All steps implemented |
| `tests/e2e/features/rfq/copy-rfq.feature` | 3 | `common.steps.ts` | All steps implemented |
| `tests/e2e/features/account/create-account.feature` | 3 | `common.steps.ts` | All steps implemented |
| `tests/e2e/features/quote/accept-quote.feature` | 4 | `common.steps.ts` | All steps implemented |

Total: 16 scenarios across 5 feature files.

---

## Step implementation details

### Auth steps (login.feature)

Implemented via `GivenStep`, `WhenStep`, and `ThenStep` registrations in the auth/login section of `common.steps.ts`:

- `the user is on the NMI Services portal home page` — navigates to `/` and waits for network idle
- `the user is signed in as {string}` — calls `mockAuthentication()` to inject a mock MSAL account into `sessionStorage`, then mocks `/api/account/**` and `/api/dashboard/**` via `page.route()`
- `the user navigates to {string}` — calls `page.goto(path)`
- `the page finishes loading` — calls `page.waitForLoadState('networkidle')`
- `the user clicks {string}` — resolves by role `button` with the given text
- `the user should be redirected to the B2C sign-in page` — asserts URL matches `login.microsoftonline.com|b2clogin.com`
- `the user should see the dashboard heading` — asserts heading `/dashboard|my requests/i` is visible
- `the user should see their organisation name` — asserts `'Test Organisation'` text is visible
- `the user should be redirected to the home page` — asserts URL matches `^/`
- `the sign-in button should be visible` — asserts role `button` named `/sign in/i` is visible

### Account creation steps (create-account.feature)

- `a new user has signed in for the first time as {string}` — calls `mockAuthentication()` then routes `/api/account/**` to return a first-time-user payload (`accountCreationCompleted: false`, `userAcceptedTermsOfUse: false`)
- `the user has not yet completed account creation` — no-op; state set by Background step above
- `the user is on the account creation step {int} {string}` / `{int}` — navigates to `/account-creation`
- `the user is prompted to accept the terms and conditions` — navigates to `/terms`
- `the user checks the {string} checkbox` — calls `page.getByLabel(label).check()`
- `the user fills in the ABN {string}` — fills label `'ABN'`
- `the user fills in the organisation name {string}` — fills label `/organisation name/i`
- `the user selects the state {string}` — selects option on label `/state/i`
- `the user fills in the contact first name {string}` / `last name` / `phone` — fill matching labels
- `the session expires` — clears `sessionStorage` and `localStorage` via `page.evaluate()`
- `the user refreshes the page` — calls `page.reload()`
- `the user should be on account creation step {int} {string}` — asserts heading with `stepTitle` is visible
- `the user should be on account creation summary step` — asserts heading `/summary/i` is visible
- `the user should proceed to the account creation wizard` — asserts URL matches `/account-creation/`
- `the user should be redirected to sign in` — asserts URL matches `/login|sign-in|b2clogin/`
- `after signing in should continue from the last saved step` — asserts URL matches `/account-creation/`
- `the dashboard should show a welcome message` — asserts text `/welcome/i` is visible

### RFQ steps (create-rfq.feature, copy-rfq.feature)

- `the user is on the dashboard` — navigates to `/dashboard`
- `the user fills in the instrument manufacturer {string}` / `model` / `serial number` — fill labels `'Manufacturer'`, `'Model'`, `'Serial number'`
- `the user fills in the contact email {string}` — fills label `/email/i`
- `the user should be on the RFQ wizard step {int} {string}` — asserts heading with `stepTitle` is visible
- `the user should be on the RFQ wizard step {int}` — asserts `.stepped-navigation .current-step` is visible
- `the stepped navigation should show {int} steps` — asserts `.stepped-navigation li` count
- `the stepped navigation should show the account creation steps` — asserts `.stepped-navigation` is visible
- `a confirmation dialog should appear with {string}` — asserts text `title` is visible
- `a confirmation dialog should appear` — asserts `[data-testid="prompt-confirmation-modal"]` is visible
- `the user confirms the dialog` — clicks `[data-testid="prompt-yes-button"]`
- `the dashboard should show a success notification` — asserts `[role="alert"]` is visible
- `the dashboard should show the draft request {string}` — asserts text is visible
- `the instrument manufacturer field should contain {string}` — asserts label `'Manufacturer'` has value
- `the user has a completed report with reference ID {string}` — routes `/api/dashboard/**` to return an item with `status: 'Report issued'`
- `the user finds the request {string}` — scrolls `[id="RefId-{referenceId}"]` into view
- `the user clicks {string} for that request` — clicks role `button` with label
- `the user should be on the copy RFQ wizard step 1` — asserts URL matches `/copy|recalibration/`
- `the instrument details should be pre-filled from the original request` — asserts `'Manufacturer'` label is not empty
- `the user is on the copy RFQ step 1 for {string}` — navigates to `/dashboard`
- `the instrument manufacturer field should contain the original manufacturer` — asserts `'Manufacturer'` label is not empty
- `the user should be on the copy RFQ step 2` — asserts `.stepped-navigation .current-step` is visible
- `the user should be on the copy RFQ summary step` — asserts heading `/summary/i` is visible
- `the dashboard should show a new request` — asserts `[data-testid="request-item"]` first item is visible

### Quote steps (accept-quote.feature)

- `there is a quote available for reference {string}` — routes `/api/dashboard/**` to return an item with `status: 'Quote offer is available'`
- `the user finds the request {string} with status {string}` — scrolls `[id="RefId-{referenceId}"]` into view (status param unused in step body; status is verified by dashboard data)
- `the user clicks the {string} tab on that request` — clicks role `tab` with name
- `the quotation details should be visible` — asserts text `/quotation|quote details/i` is visible
- `the user should be on the quotation page for {string}` — asserts URL matches `quotation.*{referenceId}`
- `the quotation summary should be displayed` — asserts text `/quotation/i` is visible
- `the accept and decline buttons should be visible` — asserts role `button` `/accept/i` and `/decline/i` are visible
- `the user is on the quotation page for {string}` — navigates to `/quotation/{referenceId}`
- `a quote for {string} has expired` — routes `/api/quotation/{referenceId}**` to return `status: 'expired'`
- `the user navigates to the quotation page for {string}` — navigates to `/quotation/{referenceId}`
- `the request status should be {string}` — asserts text `status` is visible
- `the accept button should not be visible` — asserts role `button` `/accept/i` is not visible
- `an expiry message should be displayed` — asserts text `/expired/i` is visible

---

## Known limitations

1. **MSAL mock only — not real auth**: `mockAuthentication()` injects a fabricated MSAL account object directly into `sessionStorage` and intercepts `**/oauth2/v2.0/token` via `page.route()`. Tests never reach a real Azure AD B2C tenant. Auth flows such as MFA, password reset, and social login are not exercised.

2. **API mocks via `page.route()`**: All `/api/**` calls are intercepted and fulfilled with static JSON payloads in the step definitions. No real NMI backend or database is involved. This means integration failures (schema mismatches, new required fields, changed endpoint paths) will not be caught by these tests. Each feature's route mocks must be kept in sync with actual API contracts when the backend evolves.

3. **No Playwright/BDD runner confirmed for CI**: These tests use `playwright-bdd` (`createBdd()` from `playwright-bdd`) which requires a two-step execution: first run `bddgen` to generate Playwright test files from the `.feature` sources, then run `playwright test`. There is no evidence in this snapshot of a CI pipeline step that performs either command. The target repository must add both steps to its CI workflow and wire `playwright.config.ts` with the correct `baseURL` for the deployed (or dev-server) app.

---

## Storybook BDD (separate suite)

The Storybook BDD test suite is entirely separate from the real-flow E2E suite documented above. It is backed by its own step file (`tests/e2e/steps/storybook.steps.ts` or equivalent) and runs against the Storybook dev server rather than the full portal app. Storybook BDD scenarios test individual component stories (rendering, interaction, accessibility) and share no step definitions with `common.steps.ts`. The two suites have independent `playwright.config.ts` configurations and different `baseURL` values. Do not conflate coverage from one suite with coverage from the other.

---

## Migration action

To carry the real-flow E2E suite into the rebuilt portal repository:

1. Copy the entire `tests/e2e/` directory (features, steps, fixtures, playwright config) into the target repo.
2. Install `playwright-bdd` and `@playwright/test` as dev dependencies.
3. Add a `bddgen` pre-step to the test script in `package.json`:
   ```json
   "test:e2e": "bddgen && playwright test"
   ```
4. Configure `playwright.config.ts` with the correct `baseURL` pointing to the dev server or staging environment (e.g. `http://localhost:3000`).
5. Add environment-specific API mock overrides if the new backend's endpoint paths differ from those intercepted in `common.steps.ts`.
6. Add the `test:e2e` script to the CI pipeline after the build step.
7. Confirm that the MSAL mock strategy remains compatible with the new app's auth bootstrap; if the token cache key format changes, update `mockAuthentication()` accordingly.
