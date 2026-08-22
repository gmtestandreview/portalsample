# E2E Workflow Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the quote, first-time account setup, and RFQ copy Playwright BDD scenarios exercise the current portal workflows reliably without direct-navigation shortcuts or assertion fallbacks.

**Architecture:** Split the 1,100-line shared step file into a small authentication/API mock harness and domain-specific step modules. Model server state per Playwright scenario, return payloads that match `web-api-client.ts`, and make steps interact with visible UI controls and assert exact routes/content. Update the stale Gherkin scenarios to match the current two-stage account setup and multi-step quote acceptance flows.

**Tech Stack:** TypeScript, Playwright, playwright-bdd, React 18, MSAL browser cache mocks, generated NSwag API contracts

---

## File Structure

- Create `tests/e2e/support/scenario-state.ts`: scenario-local request, quote, account, and authentication state plus typed fixture builders.
- Create `tests/e2e/support/mock-authentication.ts`: MSAL cache seeding, token interception, authentication expiry, and sign-in response setup.
- Create `tests/e2e/support/mock-api.ts`: API routes backed by `ScenarioState`; route patterns and payloads mirror `web-api-client.ts`.
- Create `tests/e2e/steps/quote.steps.ts`: quote dashboard, quotation, acceptance, decline, and expiry steps.
- Create `tests/e2e/steps/account.steps.ts`: terms, organisation creation, contact creation, and session-expiry steps.
- Create `tests/e2e/steps/copy-rfq.steps.ts`: dashboard copy action and copied RFQ assertions.
- Modify `tests/e2e/steps/common.steps.ts`: retain only genuinely shared navigation, button, and dashboard steps; remove mutable globals, aliases, direct navigation, and body-visible fallbacks.
- Modify `tests/e2e/features/quote/accept-quote.feature`: represent the quotation page and the actual `/accept-quote-create/:id` wizard separately.
- Modify `tests/e2e/features/account/create-account.feature`: represent the current organisation form followed by the contact form.
- Modify `tests/e2e/features/rfq/copy-rfq.feature`: assert the copy API redirect and pre-filled organisation/instrument data.

### Task 1: Add Scenario-Local Typed State

**Files:**
- Create: `tests/e2e/support/scenario-state.ts`
- Modify: `tests/e2e/steps/common.steps.ts`
- Test: `tests/e2e/features/auth/login.feature`

- [x] **Step 1: Add a scenario state factory**

Create `tests/e2e/support/scenario-state.ts` with explicit state and fixtures instead of module-level maps:

```ts
import type {
    ApplicationDto,
    RequestForQuoteDetails,
} from '../../../ClientApp/src/api/web-api-client';
import { QuoteStatus } from '../../../ClientApp/src/routes/common/enums';

export interface ScenarioState {
    authenticated: boolean;
    email: string;
    acceptedTerms: boolean;
    accountCreationCompleted: boolean;
    accountContactCompleted: boolean;
    defaultOrganisationId: number | null;
    activeReferenceId?: string;
    requests: Map<string, string>;
    quotes: Map<string, RequestForQuoteDetails>;
    copiedApplications: Map<string, ApplicationDto>;
}

export const createScenarioState = (): ScenarioState => ({
    authenticated: true,
    email: 'test@example.com',
    acceptedTerms: true,
    accountCreationCompleted: true,
    accountContactCompleted: true,
    defaultOrganisationId: 1,
    requests: new Map(),
    quotes: new Map(),
    copiedApplications: new Map(),
});

export const buildQuote = (
    referenceId: string,
    quoteRequestStatus: QuoteStatus = QuoteStatus.QuoteAvailable,
): RequestForQuoteDetails => ({
    quoteRequestIdNum: referenceId,
    quotationIdNum: `Q-${referenceId}`,
    crmQuoteRequestId: `crm-${referenceId}`,
    quoteRequestStatus,
    quotationOfferDate: new Date('2026-06-01T00:00:00Z'),
    quotationValidUntil: new Date('2026-07-01T00:00:00Z'),
    manufacturer: 'Original Manufacturer',
    model: 'Original Model',
    serialNumber: 'SN123456',
    servicesOffered: 'Calibration service',
    nmiTestOfficerName: 'NMI Test Officer',
});
```

- [x] **Step 2: Replace process-global state in `common.steps.ts`**

Use a playwright-bdd fixture so every scenario receives a fresh state:

```ts
import { test as base } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import {
    createScenarioState,
    type ScenarioState,
} from '../support/scenario-state';

export const test = base.extend<{ scenarioState: ScenarioState }>({
    scenarioState: async ({}, use) => {
        await use(createScenarioState());
    },
});

export const { Given, When, Then } = createBdd(test);
```

Delete `mockRequestStatusByReference`, `lastReferenceId`, and `pendingQuoteAction`. Pass `scenarioState` through steps instead.

- [x] **Step 3: Remove permissive shared helpers**

Delete `fillIfPresent`, button aliases that translate feature language to different UI labels, branches that call `page.goto()` instead of clicking, and assertions that fall back to `body` visibility or a broad URL.

Keep a strict shared click step:

```ts
When('the user clicks {string}', async ({ page }, accessibleName: string) => {
    await page.getByRole('button', { name: accessibleName, exact: true }).click();
});
```

Create separate steps for links and confirmation buttons instead of guessing multiple roles.

- [x] **Step 4: Verify the existing login feature still has unique definitions**

Run:

```powershell
pnpm exec bddgen
pnpm exec playwright test tests/e2e/features/auth/login.feature --project=chromium
```

Expected: BDD generation succeeds with no duplicate or undefined steps; login scenarios pass.

- [ ] **Step 5: Commit (unavailable: snapshot has no Git metadata)**

```powershell
git add tests/e2e/support/scenario-state.ts tests/e2e/steps/common.steps.ts
git commit -m "test: isolate e2e scenario state"
```

### Task 2: Centralise MSAL and API Mocks

**Files:**
- Create: `tests/e2e/support/mock-authentication.ts`
- Create: `tests/e2e/support/mock-api.ts`
- Modify: `tests/e2e/steps/common.steps.ts`
- Test: `tests/e2e/features/auth/login.feature`

- [x] **Step 1: Extract MSAL setup and make expiry persistent**

Move the current JWT/cache creation into `mock-authentication.ts`. Use one marker that prevents the init script from restoring the session after a reload:

```ts
import type { Page } from '@playwright/test';
import type { ScenarioState } from './scenario-state';

const AUTH_DISABLED_KEY = 'e2e-auth-disabled';

export async function installMockAuthentication(
    page: Page,
    state: ScenarioState,
): Promise<void> {
    await page.addInitScript(({ email, disabledKey }) => {
        if (localStorage.getItem(disabledKey) === 'true') {
            return;
        }

        // Move the existing MSAL account, ID token, access token, and active
        // account cache construction here without changing its key format.
        localStorage.setItem('e2e-user-email', email);
    }, { email: state.email, disabledKey: AUTH_DISABLED_KEY });

    await page.route('**/oauth2/v2.0/token', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                access_token: 'mock-access-token',
                token_type: 'Bearer',
                expires_in: 3600,
                id_token: 'mock-id-token',
                scope: 'openid profile offline_access',
            }),
        });
    });
}

export async function expireMockAuthentication(page: Page): Promise<void> {
    await page.evaluate((disabledKey) => {
        sessionStorage.clear();
        localStorage.clear();
        localStorage.setItem(disabledKey, 'true');
    }, AUTH_DISABLED_KEY);
}
```

Do not replace the existing detailed MSAL cache body with only `e2e-user-email`; move it intact into the marked block.

- [x] **Step 2: Build sign-in responses from scenario state**

In `mock-api.ts`, map state to the exact fields consumed by `AccountProvider.tsx`:

```ts
const buildSignInResponse = (state: ScenarioState) => ({
    userId: 1,
    contactId: state.accountContactCompleted ? 1 : null,
    firstName: 'Test',
    lastName: 'User',
    email: state.email,
    acceptedTerms: state.acceptedTerms,
    termsVersion: state.acceptedTerms ? 1 : 0,
    defaultOrganisationId: state.defaultOrganisationId,
    organisation: state.accountCreationCompleted
        ? {
            organisationId: 1,
            name: 'Test Organisation',
            businessOrTradingName: 'Test Organisation Pty Ltd',
            branchOrLocationName: 'Main Branch',
            accountCompleted: true,
            isCompleted: true,
        }
        : null,
    contact: state.accountContactCompleted
        ? {
            id: 1,
            firstName: 'Test',
            lastName: 'User',
            email: state.email,
            isCompleted: true,
        }
        : null,
});
```

- [x] **Step 3: Register exact generated-client endpoints**

Implement `installMockApi(page, state)` with these route patterns:

```ts
await page.route('**/api/users/sign-in', signInHandler);
await page.route('**/api/users/accept-terms', acceptTermsHandler);
await page.route('**/api/quote/get-quote-request-details-byrefid?**', quoteHandler);
await page.route('**/api/quote/decline-quote?**', declineHandler);
await page.route('**/api/application/*/copy', copyApplicationHandler);
await page.route('**/api/request-for-quote/*/step-statuses', stepStatusesHandler);
await page.route('**/api/request-for-quote/*/organisation-and-contact', organisationHandler);
await page.route('**/api/request-for-quote/*/instrument-and-request', instrumentHandler);
await page.route('**/api/forms/accounts/create-account/new', newAccountHandler);
await page.route('**/api/forms/accounts/create-account/complete', completeAccountHandler);
```

Each mutation handler must update `ScenarioState` before fulfilling. The terms route must remain `/api/users/accept-terms`, matching `UsersClient.acceptTermsAndCondition`.

- [x] **Step 4: Return generated-contract property names**

For quotations, return `quotationOfferDate` and `quotationValidUntil`, not the current non-contract `quoteOfferDate` and `quoteValidUntilDate`. For RFQ step statuses, return `status: FormStepStatus.Saved|NotStarted`, not `stepName` and `isComplete`.

```ts
body: JSON.stringify([
    { status: 'Saved', crmQuoteRequestId: `crm-${referenceId}` },
    { status: 'NotStarted', crmQuoteRequestId: `crm-${referenceId}` },
    { status: 'NotStarted', crmQuoteRequestId: `crm-${referenceId}` },
])
```

- [x] **Step 5: Verify authentication and API setup**

Run:

```powershell
pnpm run type-check
pnpm exec playwright test tests/e2e/features/auth/login.feature --project=chromium
```

Expected: type-check passes and login remains green.

- [ ] **Step 6: Commit (unavailable: snapshot has no Git metadata)**

```powershell
git add tests/e2e/support/mock-authentication.ts tests/e2e/support/mock-api.ts tests/e2e/steps/common.steps.ts
git commit -m "test: centralise portal e2e mocks"
```

### Task 3: Align Quote Scenarios with the Current UI

**Files:**
- Create: `tests/e2e/steps/quote.steps.ts`
- Modify: `tests/e2e/features/quote/accept-quote.feature`
- Modify: `tests/e2e/steps/common.steps.ts`
- Test: `tests/e2e/features/quote/accept-quote.feature`

- [x] **Step 1: Rewrite the feature around real actions**

Replace direct “Accept quotation” from `/quotation/:id` with the actual “Proceed with quote” link and acceptance wizard:

```gherkin
Feature: Accept a quotation

  Background:
    Given the user is signed in as "test@example.com"
    And quote "RFQ-2024-000892" is available

  Scenario: User opens an available quote from the dashboard
    Given the user is on the dashboard
    When the user opens request "RFQ-2024-000892"
    And the user selects its "Quotation" tab
    And the user follows "View/accept quotation"
    Then the quotation page for "RFQ-2024-000892" is displayed
    And "Proceed with quote" is available
    And "Decline quote" is available

  Scenario: User starts the quote acceptance wizard
    Given the user is viewing quotation "RFQ-2024-000892"
    When the user follows "Proceed with quote"
    Then the quote acceptance wizard for "RFQ-2024-000892" is displayed

  Scenario: User declines a quote
    Given the user is viewing quotation "RFQ-2024-000892"
    When the user clicks "Decline quote"
    Then a confirmation dialog titled "Decline quote" is displayed
    When the user confirms "Decline quote"
    Then the dashboard is displayed

  Scenario: Expired quote cannot be accepted
    Given quote "RFQ-2024-000700" is expired
    When the user views quotation "RFQ-2024-000700"
    Then "Proceed with quote" is not available
    And the quote status "Quote offer expired" is displayed
```

- [x] **Step 2: Seed valid quote payloads**

Use `buildQuote(referenceId, QuoteStatus.QuoteAvailable)` and `QuoteStatus.QuoteExpired`. The expired assertion must target `QuoteStatusPill` text rendered from `quoteRequestStatus`, not an invented API `status: "expired"` response.

- [x] **Step 3: Implement strict quote UI steps**

Create `quote.steps.ts`:

```ts
When('the user follows {string}', async ({ page }, name: string) => {
    await page.getByRole('link', { name, exact: true }).click();
});

Then('the quotation page for {string} is displayed', async ({ page }, referenceId: string) => {
    await expect(page).toHaveURL(new RegExp(`/quotation/${referenceId}$`));
    await expect(page.getByRole('heading', { name: 'Quotation', exact: true })).toBeVisible();
});

Then('{string} is available', async ({ page }, name: string) => {
    await expect(page.getByRole('link', { name, exact: true }).or(
        page.getByRole('button', { name, exact: true }),
    )).toBeVisible();
});

Then('{string} is not available', async ({ page }, name: string) => {
    await expect(page.getByRole('link', { name, exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0);
});
```

Use a dialog-scoped confirmation:

```ts
When('the user confirms {string}', async ({ page }, name: string) => {
    await page.getByRole('dialog').getByRole('button', { name, exact: true }).click();
});
```

- [x] **Step 4: Run the quote feature**

Run:

```powershell
pnpm exec bddgen
pnpm exec playwright test tests/e2e/features/quote/accept-quote.feature --project=chromium
```

Expected: all quote scenarios pass; no step calls `page.goto()` after the initial Given navigation.

- [ ] **Step 5: Commit (unavailable: snapshot has no Git metadata)**

```powershell
git add tests/e2e/features/quote/accept-quote.feature tests/e2e/steps/quote.steps.ts tests/e2e/steps/common.steps.ts
git commit -m "test: align quote e2e flow with portal UI"
```

### Task 4: Align First-Time Account Setup

**Files:**
- Create: `tests/e2e/steps/account.steps.ts`
- Modify: `tests/e2e/features/account/create-account.feature`
- Modify: `tests/e2e/steps/common.steps.ts`
- Test: `tests/e2e/features/account/create-account.feature`

- [x] **Step 1: Replace the obsolete three-step wizard**

Rewrite the feature to match `/create-account` followed by `/create-contact`:

```gherkin
Feature: Create a new account

  Background:
    Given a first-time user is signed in as "newuser@example.com"

  Scenario: User accepts the terms of use
    Given the terms of use dialog is displayed
    When the user clicks "Agree and continue"
    Then the organisation form is displayed

  Scenario: User creates organisation and contact details
    Given the user has accepted the terms of use
    And the organisation form is displayed
    When the user completes the required organisation fields
    And the user submits the organisation form
    Then the contact form is displayed
    When the user completes the required contact fields
    And the user submits the contact form
    Then the account-created page is displayed

  Scenario: An expired session is not restored on refresh
    Given the user has accepted the terms of use
    And the organisation form is displayed
    When the authentication session expires
    And the user refreshes the page
    Then the sign-in page is displayed
```

- [x] **Step 2: Configure first-time user state before navigation**

In `account.steps.ts`, set state before installing routes:

```ts
Given('a first-time user is signed in as {string}', async ({
    page,
    scenarioState,
}, email: string) => {
    Object.assign(scenarioState, {
        email,
        acceptedTerms: false,
        accountCreationCompleted: false,
        accountContactCompleted: false,
        defaultOrganisationId: 1,
    });
    await installMockAuthentication(page, scenarioState);
    await installMockApi(page, scenarioState);
    await page.goto('/create-account');
});
```

`defaultOrganisationId` must remain non-null while account creation is incomplete because `PreConditions.tsx` uses that combination to select `/create-account`.

- [x] **Step 3: Make the terms mutation update context through the UI**

The mock terms handler must set `scenarioState.acceptedTerms = true`. Click `Agree and continue` normally and assert the dialog closes:

```ts
When('the user clicks "Agree and continue"', async ({ page }) => {
    await page.getByTestId('agree-continue-button').click();
});

Then('the organisation form is displayed', async ({ page }) => {
    await expect(page).toHaveURL(/\/create-account/);
    await expect(page.getByRole('heading', { name: 'Organisation' })).toBeVisible();
    await expect(page.getByTestId('prompt-termsandcondition-modal')).toHaveCount(0);
});
```

- [x] **Step 4: Fill actual form labels and submit confirmations**

Inspect `accountDetails.tsx`, `contactDetails.tsx`, and their Yup schemas while implementing. Fill every required field by label, then use the form’s real `Create account` button and `Yes, submit` confirmation.

The step must fail when a required label changes:

```ts
When('the user completes the required contact fields', async ({ page }) => {
    await page.getByLabel('First name').fill('Test');
    await page.getByLabel('Last name').fill('User');
    await page.getByLabel('Business phone').fill('02 1234 5678');
    await page.getByLabel('Email address').fill('newuser@example.com');
});

When('the user submits the contact form', async ({ page }) => {
    await page.getByRole('button', { name: 'Create account', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Yes, submit', exact: true }).click();
});
```

The organisation and contact completion handlers must update state and return successful generated-client responses so `PreConditions` redirects in the same order as production.

- [x] **Step 5: Test real session expiry**

Use `expireMockAuthentication(page)` and assert the route selected by `AuthenticatedElement`:

```ts
Then('the sign-in page is displayed', async ({ page }) => {
    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
});
```

If `AuthenticatedElement` intentionally redirects to `/` rather than `/sign-in`, use that exact established behavior and assert the visible sign-in action; do not accept multiple unrelated URLs.

- [x] **Step 6: Run the account feature**

Run:

```powershell
pnpm exec bddgen
pnpm exec playwright test tests/e2e/features/account/create-account.feature --project=chromium
```

Expected: all account scenarios pass and the page is never forced to `/create-contact` or `/dashboard` by a test step.

- [ ] **Step 7: Commit (unavailable: snapshot has no Git metadata)**

```powershell
git add tests/e2e/features/account/create-account.feature tests/e2e/steps/account.steps.ts tests/e2e/steps/common.steps.ts
git commit -m "test: model current first-time account setup"
```

### Task 5: Make RFQ Copy Exercise the Copy Endpoint

**Files:**
- Create: `tests/e2e/steps/copy-rfq.steps.ts`
- Modify: `tests/e2e/features/rfq/copy-rfq.feature`
- Modify: `tests/e2e/steps/common.steps.ts`
- Test: `tests/e2e/features/rfq/copy-rfq.feature`

- [x] **Step 1: Remove direct navigation from the copy action**

Delete the step branch that navigates directly to `/request-for-quote-copy/${lastReferenceId}`. Click the request-scoped action:

```ts
When('the user requests recalibration for {string}', async ({ page }, referenceId: string) => {
    const request = page.locator(`#RefId-${referenceId}`);
    await request.getByRole('link', { name: 'Request recalibration', exact: true }).click();
});
```

- [x] **Step 2: Return a distinct copied application ID**

The copy handler should prove that the route consumed the API response:

```ts
const copiedReferenceId = `${sourceReferenceId}-COPY`;
state.copiedApplications.set(sourceReferenceId, {
    referenceId: copiedReferenceId,
    sourceReferenceId,
    applicationType: 'QuoteRequest',
});

await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(state.copiedApplications.get(sourceReferenceId)),
});
```

- [x] **Step 3: Assert the generated redirect and pre-filled data**

```ts
Then('the copied RFQ organisation step is displayed', async ({ page }) => {
    await expect(page).toHaveURL(
        /\/request-for-quote\/RFQ-2023-009012-COPY\/organisation-and-contact$/,
    );
    await expect(page.getByRole('heading', { name: /organisation and contact/i })).toBeVisible();
});

Then('the copied organisation details are pre-filled', async ({ page }) => {
    await expect(page.getByLabel(/business or trading name/i))
        .toHaveValue('Test Organisation Pty Ltd');
});
```

Update the feature’s first scenario to assert the organisation step first. Navigate through the real `Save and next` control before asserting `Manufacturer` equals `Original Manufacturer`.

- [x] **Step 4: Remove hidden-body fallbacks**

Delete all RFQ assertions that pass when `body` is visible. Every RFQ step must assert a route, heading, current stepped-navigation item, or form value.

- [x] **Step 5: Run the RFQ copy feature**

Run:

```powershell
pnpm exec bddgen
pnpm exec playwright test tests/e2e/features/rfq/copy-rfq.feature --project=chromium
```

Expected: all copy scenarios pass; the browser visits the copy endpoint route, receives `RFQ-2023-009012-COPY`, and renders pre-filled form data.

- [ ] **Step 6: Commit (unavailable: snapshot has no Git metadata)**

```powershell
git add tests/e2e/features/rfq/copy-rfq.feature tests/e2e/steps/copy-rfq.steps.ts tests/e2e/steps/common.steps.ts
git commit -m "test: exercise RFQ copy workflow through UI"
```

### Task 6: Validate the Refactor as a Suite

**Files:**
- Modify if required: `tests/e2e/steps/common.steps.ts`
- Modify if required: `tests/e2e/support/*.ts`
- Test: all E2E, lint, and type-check targets

- [x] **Step 1: Check generated step bindings**

Run:

```powershell
pnpm exec bddgen
```

Expected: generation succeeds with no undefined, ambiguous, or duplicate step definitions.

- [x] **Step 2: Run the three repaired features together**

Run:

```powershell
pnpm exec playwright test `
  tests/e2e/features/quote/accept-quote.feature `
  tests/e2e/features/account/create-account.feature `
  tests/e2e/features/rfq/copy-rfq.feature `
  --project=chromium
```

Expected: all scenarios pass without retries.

- [x] **Step 3: Run static validation**

Run:

```powershell
pnpm run type-check
pnpm run lint
```

Expected: both commands exit successfully.

- [x] **Step 4: Run the complete E2E suite**

Run:

```powershell
pnpm test:e2e
```

Expected: all Playwright projects pass. Review `reports/playwright/index.html` only if a failure remains; do not edit generated `.features-gen`, `reports`, or `playwright-report` files.

- [ ] **Step 5: Commit final integration fixes (unavailable: snapshot has no Git metadata)**

```powershell
git add tests/e2e
git commit -m "test: stabilise portal workflow e2e suite"
```

## Self-Review

- Spec coverage: all eight reported failures are covered by the quote, account, and RFQ tasks.
- Root-cause coverage: stale feature language, incorrect API response fields, persistent MSAL rehydration, global mutable state, direct navigation, and permissive assertions all have explicit removal steps.
- Edit boundaries: the generated `ClientApp/src/api/web-api-client.ts` remains unchanged. `ClientApp/src/App.tsx` was updated to flatten affected workflow routes because the nested wildcard definitions rendered blank pages with the current router.
- Validation result: `npm run test:e2e` passed 144 tests, `npm run test:unit` passed 1,052 tests across 97 files, and type-check and lint both passed.
- Validation coverage: each domain has a targeted Playwright command, followed by BDD generation, type-check, lint, and the full E2E suite.
- Repository limitation: this workspace currently has no discoverable `.git` directory, so commit steps are documented for execution in a Git-backed checkout but cannot run in the present snapshot.
