# Playwright BDD Next Phase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Playwright-BDD from representative route rendering into reliable coverage of the portal's critical quote, account, RFQ, report, and failure workflows, with enforceable route traceability and faster app-versus-Storybook execution.

**Architecture:** Keep the existing scenario-local `ScenarioState`, MSAL cache mock, and generated-client-compatible API interception. Add focused domain state/builders and step modules, split application and Storybook Playwright execution into independent named projects, and make an explicit route coverage manifest the machine-checked source of truth. New scenarios must drive visible controls after initial setup navigation, assert exact outcomes, and avoid broad body assertions, optional checks, hard waits, and test-only navigation shortcuts.

**Tech Stack:** React 18, TypeScript, React Router, Playwright Test 1.60, playwright-bdd 9, Gherkin, MSAL browser mocks, generated NSwag API contracts, Vitest

## Completion Verification

Verified complete on 2026-06-14 in the source snapshot:

- `npm run type-check` passes.
- `npm run lint` passes.
- Focused route, Playwright-quality, notification, and RequestItem unit tests pass
  (`71` tests).
- `npm run test:e2e` passes with `28` application scenarios and `129`
  Storybook scenarios.
- The account-creation stability run passes `20/20`.
- All `115` Storybook IDs referenced by BDD features exist in the generated
  `storybook-static/index.json`.
- Route coverage has no `planned` entries, and both Playwright HTML reports
  exist under `reports/playwright/`.

The unsaved-navigation scenario uses the product's visible `Discard changes`
control. The draft plan called this action `Back to dashboard`, but that label
does not exist in the RFQ wizard.

This source snapshot has no `.git` directory, so the plan's per-task commit
steps cannot be executed or verified here.

---

## Scope and Delivery Order

This plan covers all eight recommendations:

1. Complete quote acceptance.
2. Cover account maintenance.
3. Complete the RFQ lifecycle.
4. Cover measurement reports.
5. Add route coverage enforcement.
6. Separate application and Storybook Playwright execution.
7. Add meaningful failure-path coverage.
8. Remove permissive Playwright patterns.

Infrastructure and traceability land first. Each workflow then lands as a separately runnable feature. Failure scenarios reuse the same state and mock contracts rather than introducing a second test harness.

## File Structure

### Create

- `playwright.storybook.config.ts`: Storybook-only Playwright project and web server.
- `tests/e2e/route-coverage.ts`: explicit router-path-to-BDD traceability manifest.
- `tests/unit/e2e/routeCoverage.test.ts`: parses `App.tsx` and enforces complete manifest registration.
- `tests/e2e/support/mock-failure.ts`: typed one-shot API failure configuration.
- `tests/e2e/support/mock-builders.ts`: generated-contract-compatible account, quote acceptance, RFQ summary, and report payload builders.
- `tests/e2e/steps/account-maintenance.steps.ts`: update organisation, update contact, and add-branch steps.
- `tests/e2e/steps/rfq-lifecycle.steps.ts`: submitted summary, draft edit, delete, and validation steps.
- `tests/e2e/steps/report.steps.ts`: instrument report list, report detail, and PDF failure steps.
- `tests/e2e/steps/failure.steps.ts`: reusable API-failure and retained-form-state assertions.
- `tests/e2e/features/account/manage-account.feature`: account maintenance workflows.
- `tests/e2e/features/rfq/manage-rfq.feature`: remaining RFQ lifecycle workflows.
- `tests/e2e/features/reports/measurement-reports.feature`: report list/detail workflows.
- `tests/e2e/features/resilience/workflow-errors.feature`: mutation, auth-expiry, and unsaved-change failures.

### Modify

- `playwright.config.ts`: application-only `app-bdd` project and application web server.
- `package.json`: separate app, Storybook, and combined BDD commands.
- `.github/workflows/pr.yml`: run the source-snapshot BDD projects and upload the actual report directories when this workflow is used in this checkout.
- `tests/e2e/support/scenario-state.ts`: add domain state, persisted values, and failure configuration.
- `tests/e2e/support/mock-api.ts`: install exact endpoint handlers for new workflows and delegate configured failures.
- `tests/e2e/steps/quote.steps.ts`: complete the acceptance wizard through submission.
- `tests/e2e/steps/storybook.steps.ts`: remove broad and optional assertions.
- `tests/e2e/features/quote/accept-quote.feature`: add complete acceptance and save-failure scenarios.
- `tests/e2e/features/storybook/**/*.feature`: replace generic visibility assertions where a user-visible semantic assertion is available.
- `ClientApp/src/storybook/CoverageMatrix.docs.mdx`: align claims with the machine-checked BDD route manifest.
- `docs/TESTING.md`: document project-specific commands and coverage semantics.

### Never Edit

- `ClientApp/src/api/web-api-client.ts`
- `.features-gen/**`
- `reports/**`
- `ClientApp/source-map-http-downloads/**`
- `ClientApp/src/external/**`
- `ClientApp/webpack/**`

## Task 1: Split Application and Storybook BDD Execution

**Files:**

- Modify: `playwright.config.ts`
- Create: `playwright.storybook.config.ts`
- Modify: `package.json`
- Modify: `docs/TESTING.md`
- Test: generated Playwright-BDD specs under `.features-gen/**`

- [ ] **Step 1: Record the current mixed-server behavior**

Run:

```powershell
npx bddgen
npx playwright test tests/e2e/features/auth/login.feature --project=chromium --list
```

Expected: the application feature is listed, but the current root configuration still declares both the application and Storybook web servers.

- [ ] **Step 2: Make the root config application-only**

Replace `playwright.config.ts` with:

```ts
import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
    outputDir: '.features-gen/app',
    features: [
        'tests/e2e/features/account/**/*.feature',
        'tests/e2e/features/auth/**/*.feature',
        'tests/e2e/features/quote/**/*.feature',
        'tests/e2e/features/reports/**/*.feature',
        'tests/e2e/features/resilience/**/*.feature',
        'tests/e2e/features/rfq/**/*.feature',
    ],
    steps: [
        'tests/e2e/steps/{account,account-maintenance,common,copy-rfq,failure,quote,report,rfq-lifecycle}.steps.ts',
        'tests/e2e/support/fixtures.ts',
    ],
});

export default defineConfig({
    testDir,
    outputDir: 'reports/test-results/app',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
        ['html', { open: 'never', outputFolder: 'reports/playwright/app' }],
        ['list'],
    ],
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [{
        name: 'app-bdd',
        use: { ...devices['Desktop Chrome'] },
    }],
    webServer: {
        command: 'npm start',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
```

- [ ] **Step 3: Add the Storybook-only config**

Create `playwright.storybook.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
    outputDir: '.features-gen/storybook',
    features: 'tests/e2e/features/storybook/**/*.feature',
    steps: ['tests/e2e/steps/storybook.steps.ts'],
});

export default defineConfig({
    testDir,
    outputDir: 'reports/test-results/storybook',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
        ['html', { open: 'never', outputFolder: 'reports/playwright/storybook' }],
        ['list'],
    ],
    use: {
        baseURL: 'http://localhost:6006',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [{
        name: 'storybook-bdd',
        use: { ...devices['Desktop Chrome'] },
    }],
    webServer: {
        command: 'npm run storybook',
        url: 'http://localhost:6006',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
```

- [ ] **Step 4: Add explicit package scripts**

Replace the BDD script block in `package.json` with:

```json
"test:e2e": "npm run test:e2e:app && npm run test:e2e:storybook",
"test:e2e:app": "bddgen -c playwright.config.ts && playwright test -c playwright.config.ts --project=app-bdd",
"test:e2e:storybook": "bddgen -c playwright.storybook.config.ts && playwright test -c playwright.storybook.config.ts --project=storybook-bdd",
"test:e2e:ui": "bddgen -c playwright.config.ts && playwright test -c playwright.config.ts --project=app-bdd --ui",
"test:e2e:debug": "bddgen -c playwright.config.ts && playwright test -c playwright.config.ts --project=app-bdd --debug",
"test:e2e:report": "playwright show-report reports/playwright/app",
"test:bdd": "npm run test:e2e",
"test:bdd:ui": "npm run test:e2e:ui"
```

- [ ] **Step 5: Update testing documentation**

Add this command table to `docs/TESTING.md`:

```markdown
| Command | Scope |
| --- | --- |
| `npm run test:e2e:app` | Real portal workflows using the `app-bdd` project |
| `npm run test:e2e:storybook` | Storybook scenarios using the `storybook-bdd` project |
| `npm run test:e2e` | Both BDD projects, run sequentially |

`app-bdd` starts only Webpack on port 3000. `storybook-bdd` starts only
Storybook on port 6006. A passing suite is scenario coverage, not JavaScript
statement or branch coverage.
```

- [ ] **Step 6: Verify independent execution**

Run:

```powershell
npm run test:e2e:app -- --list
npm run test:e2e:storybook -- --list
```

Expected: the first command lists only non-Storybook scenarios under project `app-bdd`; the second lists only `@storybook` scenarios under project `storybook-bdd`.

- [ ] **Step 7: Commit**

```powershell
git add playwright.config.ts playwright.storybook.config.ts package.json docs/TESTING.md
git commit -m "test: split app and storybook bdd projects"
```

## Task 2: Add Machine-Checked Route Coverage Traceability

**Files:**

- Create: `tests/e2e/route-coverage.ts`
- Create: `tests/unit/e2e/routeCoverage.test.ts`
- Modify: `ClientApp/src/storybook/CoverageMatrix.docs.mdx`
- Test: `tests/unit/e2e/routeCoverage.test.ts`

- [ ] **Step 1: Create the failing route inventory test**

Create `tests/unit/e2e/routeCoverage.test.ts`:

```ts
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { routeCoverage } from '../../e2e/route-coverage';

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const appSource = fs.readFileSync(
    path.join(repoRoot, 'ClientApp', 'src', 'App.tsx'),
    'utf8',
);

const routerPaths = Array.from(
    appSource.matchAll(/<Route\s+path='([^']+)'/g),
    (match) => match[1],
);

describe('Playwright-BDD route coverage manifest', () => {
    it('registers every static route declared in App.tsx exactly once', () => {
        const registered = routeCoverage.map(({ path: routePath }) => routePath);
        expect(new Set(registered).size).toBe(registered.length);
        expect(registered.sort()).toEqual(routerPaths.sort());
    });

    it('uses a feature reference or an explicit durable exclusion', () => {
        for (const entry of routeCoverage) {
            if (entry.status === 'excluded') {
                expect(entry.reason.length).toBeGreaterThan(20);
                expect(entry.feature).toBeUndefined();
            } else {
                expect(entry.feature).toMatch(/^tests\/e2e\/features\/.+\.feature$/);
                expect(entry.scenario).toBeTruthy();
            }
        }
    });

});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
npm run test:unit -- tests/unit/e2e/routeCoverage.test.ts
```

Expected: FAIL because `tests/e2e/route-coverage.ts` does not exist.

- [ ] **Step 3: Create the typed manifest**

Create `tests/e2e/route-coverage.ts`:

```ts
type CoveredRoute = {
    path: string;
    status: 'app-bdd' | 'storybook-bdd';
    feature: string;
    scenario: string;
    reason?: never;
};

type ExcludedRoute = {
    path: string;
    status: 'excluded';
    reason: string;
    feature?: never;
    scenario?: never;
};

type PlannedRoute = {
    path: string;
    status: 'planned';
    feature: string;
    scenario: string;
    reason?: never;
};

export type RouteCoverageEntry = CoveredRoute | ExcludedRoute | PlannedRoute;

export const routeCoverage: RouteCoverageEntry[] = [
    { path: '/', status: 'storybook-bdd', feature: 'tests/e2e/features/storybook/routes/routes-coverage.feature', scenario: 'Get started public landing story renders the welcome banner' },
    { path: '/dashboard', status: 'app-bdd', feature: 'tests/e2e/features/auth/login.feature', scenario: 'Authenticated user lands on the dashboard' },
    { path: '/create-account/*', status: 'app-bdd', feature: 'tests/e2e/features/account/create-account.feature', scenario: 'User creates organisation and contact details' },
    { path: '/update-organisation/:id', status: 'planned', feature: 'tests/e2e/features/account/manage-account.feature', scenario: 'User updates organisation details' },
    { path: '/create-contact', status: 'app-bdd', feature: 'tests/e2e/features/account/create-account.feature', scenario: 'User creates organisation and contact details' },
    { path: '/update-contact', status: 'planned', feature: 'tests/e2e/features/account/manage-account.feature', scenario: 'User updates contact details' },
    { path: '/success-creating-account', status: 'storybook-bdd', feature: 'tests/e2e/features/storybook/routes/routes-coverage.feature', scenario: 'Account created story renders the success heading' },
    { path: '/add-branch', status: 'planned', feature: 'tests/e2e/features/account/manage-account.feature', scenario: 'User adds a branch or location' },
    { path: '/request-for-quote-create', status: 'app-bdd', feature: 'tests/e2e/features/rfq/create-rfq.feature', scenario: 'User completes a new RFQ through all steps' },
    { path: '/request-for-quote-copy/:id/*', status: 'app-bdd', feature: 'tests/e2e/features/rfq/copy-rfq.feature', scenario: 'User copies a completed RFQ from the dashboard' },
    { path: '/request-for-quote/:id/view-summary', status: 'planned', feature: 'tests/e2e/features/rfq/manage-rfq.feature', scenario: 'User views a submitted RFQ summary' },
    { path: '/request-for-quote/:id/*', status: 'app-bdd', feature: 'tests/e2e/features/rfq/create-rfq.feature', scenario: 'User completes a new RFQ through all steps' },
    { path: '/request-for-quote-success/:id/*', status: 'app-bdd', feature: 'tests/e2e/features/rfq/create-rfq.feature', scenario: 'User completes a new RFQ through all steps' },
    { path: '/submitted-success/:id', status: 'planned', feature: 'tests/e2e/features/quote/accept-quote.feature', scenario: 'User accepts an available quote through every step' },
    { path: '/accept-quote-create/:id/*', status: 'app-bdd', feature: 'tests/e2e/features/quote/accept-quote.feature', scenario: 'User starts the quote acceptance wizard' },
    { path: '/accept-quote/:id/*', status: 'planned', feature: 'tests/e2e/features/quote/accept-quote.feature', scenario: 'User accepts an available quote through every step' },
    { path: '/quotation/:id/*', status: 'app-bdd', feature: 'tests/e2e/features/quote/accept-quote.feature', scenario: 'User opens an available quote from the dashboard' },
    { path: '/instrument-reports/:id', status: 'planned', feature: 'tests/e2e/features/reports/measurement-reports.feature', scenario: 'User opens a report from an instrument report history' },
    { path: '/report/:id', status: 'planned', feature: 'tests/e2e/features/reports/measurement-reports.feature', scenario: 'User opens a report from an instrument report history' },
    { path: '/services-we-offer', status: 'storybook-bdd', feature: 'tests/e2e/features/storybook/routes/routes-coverage.feature', scenario: 'Services we offer story renders the page heading' },
    { path: '/sign-in', status: 'storybook-bdd', feature: 'tests/e2e/features/storybook/routes/routes-coverage.feature', scenario: 'Auth sign-in loading story renders the loading message' },
    { path: '/sign-out', status: 'app-bdd', feature: 'tests/e2e/features/auth/login.feature', scenario: 'User signs out successfully' },
    { path: '/sign-out-helper', status: 'storybook-bdd', feature: 'tests/e2e/features/storybook/routes/routes-coverage.feature', scenario: 'Auth sign-out completion story renders the close-browser warning' },
    { path: '/help-guide', status: 'storybook-bdd', feature: 'tests/e2e/features/storybook/routes/routes-coverage.feature', scenario: 'Help guide public journey story renders the back to home action' },
    { path: '/help-guide/how-to-setup-access', status: 'storybook-bdd', feature: 'tests/e2e/features/storybook/routes/routes-coverage.feature', scenario: 'Help guide access article story renders the heading' },
    { path: '/help-guide/faqs', status: 'storybook-bdd', feature: 'tests/e2e/features/storybook/routes/routes-coverage.feature', scenario: 'Help guide FAQs story renders the FAQ heading' },
    { path: '/server-error', status: 'storybook-bdd', feature: 'tests/e2e/features/storybook/routes/routes-coverage.feature', scenario: 'Server error story renders the server error heading' },
    { path: '/conflict', status: 'storybook-bdd', feature: 'tests/e2e/features/storybook/routes/routes-coverage.feature', scenario: 'Conflict error story renders the conflict heading' },
    { path: '/forbidden', status: 'storybook-bdd', feature: 'tests/e2e/features/storybook/routes/routes-coverage.feature', scenario: 'Forbidden error story renders the forbidden heading' },
    { path: '/no-longer-available', status: 'storybook-bdd', feature: 'tests/e2e/features/storybook/routes/routes-coverage.feature', scenario: 'No longer available error story renders the not available heading' },
    { path: '/unprocessable', status: 'storybook-bdd', feature: 'tests/e2e/features/storybook/routes/routes-coverage.feature', scenario: 'Unprocessable error story renders the unprocessable heading' },
    { path: '/precondition-failed', status: 'storybook-bdd', feature: 'tests/e2e/features/storybook/routes/routes-coverage.feature', scenario: 'Precondition failed error story renders the precondition heading' },
    { path: '/service-unavailable', status: 'storybook-bdd', feature: 'tests/e2e/features/storybook/routes/routes-coverage.feature', scenario: 'Service unavailable error story renders the service unavailable heading' },
    { path: '/not-found', status: 'storybook-bdd', feature: 'tests/e2e/features/storybook/routes/routes-coverage.feature', scenario: 'Not found error story renders the not found heading' },
    { path: '*', status: 'excluded', reason: 'The wildcard renders the same NotFound ErrorDisplay already exercised by the explicit /not-found Storybook-BDD scenario.' },
];
```

The `planned` entries keep the uncovered work explicit until Tasks 3-6 convert each one to `app-bdd`. The no-planned-entry closure gate is added in Task 9 after the scenarios exist.

- [ ] **Step 4: Run the test and confirm the registered baseline passes**

Run:

```powershell
npm run test:unit -- tests/unit/e2e/routeCoverage.test.ts
```

Expected: PASS. All 35 router paths are represented exactly once, including eight explicitly planned routes and the durable wildcard exclusion.

- [ ] **Step 5: Update the coverage matrix wording**

Change `ClientApp/src/storybook/CoverageMatrix.docs.mdx` so it states:

```markdown
## Executable Route Traceability

`tests/e2e/route-coverage.ts` is the source of truth for router-path coverage.
`tests/unit/e2e/routeCoverage.test.ts` compares it with `ClientApp/src/App.tsx`.
Storybook coverage remains valid for isolated rendering states, while critical
mutating workflows require `app-bdd` scenarios.
```

Do not mark route closure complete while any manifest entry has `status: 'planned'`.

- [ ] **Step 6: Commit the traceability baseline**

```powershell
git add tests/e2e/route-coverage.ts tests/unit/e2e/routeCoverage.test.ts ClientApp/src/storybook/CoverageMatrix.docs.mdx
git commit -m "test: add bdd route coverage manifest"
```

## Task 3: Complete Quote Acceptance

**Files:**

- Modify: `tests/e2e/features/quote/accept-quote.feature`
- Modify: `tests/e2e/support/scenario-state.ts`
- Create: `tests/e2e/support/mock-builders.ts`
- Modify: `tests/e2e/support/mock-api.ts`
- Modify: `tests/e2e/steps/quote.steps.ts`
- Modify: `tests/e2e/route-coverage.ts`
- Test: `tests/e2e/features/quote/accept-quote.feature`

- [ ] **Step 1: Draft the new complete-flow scenario**

Append this scenario to `tests/e2e/features/quote/accept-quote.feature`:

```gherkin
  Scenario: User accepts an available quote through every step
    Given the user is viewing quotation "RFQ-2024-000892"
    When the user follows "Proceed with quote"
    Then the quote acceptance step "Report recipient" is displayed
    When the user completes the report recipient step
    And the user clicks "Save and next"
    Then the quote acceptance step "Instrument/artefact delivery and return" is displayed
    When the user completes the delivery and return step
    And the user clicks "Save and next"
    Then the quote acceptance step "Payment details" is displayed
    When the user completes the payment details step
    And the user clicks "Save and next"
    Then the quote acceptance step "Summary and accept" is displayed
    When the user accepts the quote terms
    And the user clicks "Submit and accept"
    Then a confirmation dialog titled "Are you sure you want to accept this quote?" is displayed
    When the user confirms "Yes, submit"
    Then the accepted quote success page is displayed
```

- [ ] **Step 2: Present the Gherkin diff and wait for explicit approval**

Do not implement steps or mocks until the scenario wording is approved.

- [ ] **Step 3: Run generation to prove the new steps are undefined**

Run:

```powershell
npx bddgen -c playwright.config.ts
```

Expected: FAIL listing the new quote acceptance steps as undefined.

- [ ] **Step 4: Extend scenario-local quote state**

Add to `ScenarioState`:

```ts
export interface ScenarioState {
    // existing fields
    acceptedQuoteApplicationId: string;
    completedAcceptQuoteSteps: Set<string>;
}
```

Add defaults:

```ts
acceptedQuoteApplicationId: 'QA-RFQ-2024-000892',
completedAcceptQuoteSteps: new Set(),
```

- [ ] **Step 5: Add generated-contract-compatible builders**

Create `tests/e2e/support/mock-builders.ts` with:

```ts
import {
    FormStepStatus,
    YesNo,
} from '../../../ClientApp/src/api/web-api-client';

export const buildAcceptQuoteStatuses = (crmQuoteRequestId: string) => (
    ['report-recipient', 'delivery-and-return', 'payment-details', 'summary-and-accept']
        .map(() => ({
            status: FormStepStatus.NotStarted,
            crmQuoteRequestId,
        }))
);

export const buildReportRecipient = () => ({
    organisationDifferent: YesNo.No,
    reportAddressType: 'BusinessStreetAddress',
    isRecipientMailingAddressSame: true,
    organisationName: 'Test Organisation',
    contact: {
        title: 'Mr',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '0200000000',
        mobile: '0400000000',
    },
    businessStreetAddress: {
        line1: '1 Test Street',
        suburb: 'Sydney',
        state: 'NSW',
        postcode: '2000',
    },
    recipientMailingAddress: {},
    formStepStatus: FormStepStatus.NotStarted,
});

export const buildDeliveryAndReturn = () => ({
    returnContactType: 'SamePerson',
    returnAddressType: 'BusinessStreetAddress',
    returnMethod: 'ClientWillCollect',
    returnAddress: {
        line1: '1 Test Street',
        suburb: 'Sydney',
        state: 'NSW',
        postcode: '2000',
    },
    formStepStatus: FormStepStatus.NotStarted,
});

export const buildPaymentDetails = () => ({
    invoiceSentTo: 'SamePerson',
    purchaseOrderNumber: 'PO-12345',
    formStepStatus: FormStepStatus.NotStarted,
});

export const buildAcceptQuoteSummary = () => ({
    associatedDisputes: YesNo.No,
    acceptTermsAndConditions: false,
    acceptQuotePreInfo: {
        quoteRequestIdNum: 'RFQ-2024-000892',
        crmQuoteId: 'crm-quote-892',
    },
    reportRecipient: buildReportRecipient(),
    deliveryAndReturn: buildDeliveryAndReturn(),
    paymentDetails: buildPaymentDetails(),
    requestForQuote: {
        manufacturer: 'Original Manufacturer',
        model: 'Original Model',
        serialNumber: 'SN123456',
    },
    formStepStatus: FormStepStatus.NotStarted,
});
```

- [ ] **Step 6: Install the exact accept-quote handlers**

In `installMockApi`, add GET/PUT handling for:

```ts
await page.route('**/api/accept-quote/*/report-recipient', acceptQuoteStepHandler(buildReportRecipient));
await page.route('**/api/accept-quote/*/delivery-and-return', acceptQuoteStepHandler(buildDeliveryAndReturn));
await page.route('**/api/accept-quote/*/payment-details', acceptQuoteStepHandler(buildPaymentDetails));
await page.route('**/api/accept-quote/*/summary-and-accept', acceptQuoteStepHandler(buildAcceptQuoteSummary));
await page.route('**/api/accept-quote/*/submit', async (route) => {
    scenarioState.requests.set('RFQ-2024-000892', 'Quote accepted');
    await json(route, {});
});
```

Define the handler in the same file:

```ts
const acceptQuoteStepHandler = (
    state: ScenarioState,
    buildResponse: () => Record<string, unknown>,
) => async (route: Route) => {
    if (route.request().method() === 'GET') {
        await json(route, buildResponse());
        return;
    }

    const step = new URL(route.request().url()).pathname.split('/').at(-1)!;
    state.completedAcceptQuoteSteps.add(step);
    await json(route, {});
};
```

Register each route with `acceptQuoteStepHandler(state, builder)`.

- [ ] **Step 7: Implement strict quote steps**

Add to `tests/e2e/steps/quote.steps.ts`:

```ts
Then('the quote acceptance step {string} is displayed', async ({ page }, title: string) => {
    await expect(page.getByRole('heading', { name: new RegExp(title, 'i') })).toBeVisible();
});

When('the user completes the report recipient step', async ({ page }) => {
    await page.getByLabel('Business street address', { exact: true }).check();
});

When('the user completes the delivery and return step', async ({ page }) => {
    await page.getByLabel('The main contact person for this request', { exact: true }).check();
    await page.getByLabel('Business street address', { exact: true }).check();
    await page.getByLabel('Client will collect/pickup when completed', { exact: true }).check();
});

When('the user completes the payment details step', async ({ page }) => {
    await page.getByLabel('The main contact person for this request', { exact: true }).check();
});

When('the user accepts the quote terms', async ({ page }) => {
    await page.getByLabel(
        'Yes, on behalf of my organisation, I accept the quotation',
        { exact: true },
    ).check();
});

Then('the accepted quote success page is displayed', async ({ page }) => {
    await expect(page).toHaveURL(/\/submitted-success\/QA-RFQ-2024-000892$/);
    await expect(page.getByRole('heading', {
        name: /accepted quote has been successfully submitted/i,
    })).toBeVisible();
});
```

- [ ] **Step 8: Convert quote routes from planned to covered**

In `tests/e2e/route-coverage.ts`, change `/accept-quote/:id/*` and `/submitted-success/:id` to `status: 'app-bdd'`.

- [ ] **Step 9: Verify**

Run:

```powershell
npx bddgen -c playwright.config.ts
npx playwright test -c playwright.config.ts --project=app-bdd tests/e2e/features/quote/accept-quote.feature
```

Expected: all quote scenarios pass without retries.

- [ ] **Step 10: Commit**

```powershell
git add tests/e2e/features/quote/accept-quote.feature tests/e2e/support/scenario-state.ts tests/e2e/support/mock-builders.ts tests/e2e/support/mock-api.ts tests/e2e/steps/quote.steps.ts tests/e2e/route-coverage.ts
git commit -m "test: cover complete quote acceptance"
```

## Task 4: Cover Account Maintenance

**Files:**

- Create: `tests/e2e/features/account/manage-account.feature`
- Create: `tests/e2e/steps/account-maintenance.steps.ts`
- Modify: `tests/e2e/support/scenario-state.ts`
- Modify: `tests/e2e/support/mock-builders.ts`
- Modify: `tests/e2e/support/mock-api.ts`
- Modify: `tests/e2e/route-coverage.ts`
- Test: `tests/e2e/features/account/manage-account.feature`

- [ ] **Step 1: Draft the account-maintenance feature**

Create:

```gherkin
Feature: Maintain portal account details

  Background:
    Given the user is signed in as "test@example.com"

  Scenario: User updates organisation details
    Given the user opens organisation 1 for editing
    When the user changes the business website to "https://updated.example.gov.au"
    And the user submits the account maintenance form
    Then the dashboard is displayed
    And the success notification "Your organisation details have been successfully updated." is displayed

  Scenario: User updates contact details
    Given the user opens their contact details for editing
    When the user changes the business phone to "02 6123 4567"
    And the user submits the account maintenance form
    Then the dashboard is displayed
    And the success notification "Your contact details have been successfully saved." is displayed

  Scenario: User adds a branch or location
    Given the user opens the add branch form
    When the user enters branch name "Canberra Laboratory"
    And the user submits the account maintenance form
    Then the branch selector is displayed
    And the success notification "Your branch/location details have been successfully saved." is displayed
```

- [ ] **Step 2: Present the feature and wait for approval**

Do not add step definitions until approved.

- [ ] **Step 3: Run generation and confirm undefined steps**

Run:

```powershell
npx bddgen -c playwright.config.ts
```

Expected: FAIL with the new account-maintenance steps undefined.

- [ ] **Step 4: Add account payload builders**

Add to `mock-builders.ts`:

```ts
export const buildAccountForm = (branchName = 'Main Branch') => ({
    id: 1,
    abn: '00000000000',
    name: 'Test Organisation',
    businessOrTradingName: 'Test Organisation Pty Ltd',
    branchOrLocationName: branchName,
    businessWebsiteAddress: 'https://example.gov.au',
    isDefaultOrganisation: true,
    streetAddress: {
        line1: '1 Test Street',
        suburb: 'Sydney',
        state: 'NSW',
        postcode: '2000',
        isManuallyEntered: true,
    },
    postalAddressSameAsStreetAddress: true,
    contact: {},
    status: FormStepStatus.NotStarted,
});

export const buildContactForm = () => ({
    title: 'Mr',
    firstName: 'Test',
    lastName: 'User',
    phone: '0200000000',
    mobile: '0400000000',
    email: 'test@example.com',
    formStepStatus: FormStepStatus.NotStarted,
});
```

- [ ] **Step 5: Add exact account handlers**

Add handlers for:

```ts
await page.route('**/api/forms/accounts/1', async (route) => {
    await json(route, { id: 1, stepValues: buildAccountForm() });
});
await page.route('**/api/forms/accounts/branch', async (route) => {
    await json(route, { id: 1, stepValues: buildAccountForm('') });
});
await page.route('**/api/forms/accounts/branch-add/complete', async (route) => {
    await json(route, {});
});
await page.route('**/api/contact/usercontact**', async (route) => {
    await json(route, buildContactForm());
});
```

Keep the existing PUT handlers for `/api/forms/accounts/create-account/complete` and `/api/contact/save-contact`, but record submitted bodies in `ScenarioState`:

```ts
lastAccountSubmission?: Record<string, unknown>;
lastContactSubmission?: Record<string, unknown>;
```

- [ ] **Step 6: Implement account maintenance steps**

Create `tests/e2e/steps/account-maintenance.steps.ts`:

```ts
import { expect } from '@playwright/test';
import { Given, Then, When } from '../support/fixtures';
import { waitForAppReady } from './common.steps';

Given('the user opens organisation {int} for editing', async ({ page }, id: number) => {
    await page.goto(`/update-organisation/${id}`);
    await expect(page.getByRole('heading', { name: 'Organisation', exact: true })).toBeVisible();
});

Given('the user opens their contact details for editing', async ({ page }) => {
    await page.goto('/update-contact/1');
    await expect(page.getByRole('heading', { name: 'My contact details', exact: true })).toBeVisible();
});

Given('the user opens the add branch form', async ({ page }) => {
    await page.goto('/add-branch');
    await expect(page.getByText('Add branch or location', { exact: true })).toBeVisible();
});

When('the user changes the business website to {string}', async ({ page }, value: string) => {
    await page.getByLabel('Business website address (optional)', { exact: true }).fill(value);
});

When('the user changes the business phone to {string}', async ({ page }, value: string) => {
    await page.getByLabel('Business phone', { exact: true }).fill(value);
});

When('the user enters branch name {string}', async ({ page }, value: string) => {
    await page.getByLabel('Branch or Location name (optional)', { exact: true }).fill(value);
});

When('the user submits the account maintenance form', async ({ page }) => {
    await page.getByRole('button', { name: 'Save and close', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Yes, submit', exact: true }).click();
    await waitForAppReady(page);
});

Then('the success notification {string} is displayed', async ({ page }, message: string) => {
    await expect(page.getByRole('alert')).toContainText(message);
});

Then('the branch selector is displayed', async ({ page }) => {
    await expect(page.getByRole('dialog')).toBeVisible();
});
```

- [ ] **Step 7: Convert account maintenance routes to covered**

Change `/update-organisation/:id`, `/update-contact`, and `/add-branch` to `status: 'app-bdd'`.

- [ ] **Step 8: Verify**

Run:

```powershell
npx bddgen -c playwright.config.ts
npx playwright test -c playwright.config.ts --project=app-bdd tests/e2e/features/account/manage-account.feature
```

Expected: 3 scenarios pass.

- [ ] **Step 9: Commit**

```powershell
git add tests/e2e/features/account/manage-account.feature tests/e2e/steps/account-maintenance.steps.ts tests/e2e/support/scenario-state.ts tests/e2e/support/mock-builders.ts tests/e2e/support/mock-api.ts tests/e2e/route-coverage.ts
git commit -m "test: cover account maintenance workflows"
```

## Task 5: Complete the RFQ Lifecycle

**Files:**

- Create: `tests/e2e/features/rfq/manage-rfq.feature`
- Create: `tests/e2e/steps/rfq-lifecycle.steps.ts`
- Modify: `tests/e2e/support/mock-api.ts`
- Modify: `tests/e2e/support/scenario-state.ts`
- Modify: `tests/e2e/route-coverage.ts`
- Test: `tests/e2e/features/rfq/manage-rfq.feature`

- [ ] **Step 1: Draft the RFQ lifecycle feature**

Create:

```gherkin
Feature: Manage an existing request for quote

  Background:
    Given the user is signed in as "test@example.com"

  Scenario: User views a submitted RFQ summary
    Given submitted RFQ "RFQ-2024-000321" is available
    When the user opens the submitted RFQ summary
    Then the submitted RFQ summary is displayed
    And the summary contains manufacturer "Original Manufacturer"

  Scenario: User edits and saves an existing RFQ draft
    Given draft RFQ "RFQ-DRAFT-0001" is available
    When the user opens the draft RFQ
    And the user changes the manufacturer to "Updated Manufacturer"
    And the user clicks "Save and exit"
    Then the dashboard is displayed
    And draft RFQ "RFQ-DRAFT-0001" retains manufacturer "Updated Manufacturer"

  Scenario: Required RFQ fields prevent progression
    Given draft RFQ "RFQ-DRAFT-0002" is available at the instrument step
    When the user clears the manufacturer
    And the user clicks "Save and next"
    Then the validation message "Enter a manufacturer." is displayed
    And the RFQ instrument step remains displayed
```

- [ ] **Step 2: Present the feature and wait for approval**

- [ ] **Step 3: Run `bddgen` and confirm undefined steps**

Run:

```powershell
npx bddgen -c playwright.config.ts
```

Expected: FAIL for the new RFQ lifecycle steps.

- [ ] **Step 4: Add submitted-summary and draft state**

Extend `ScenarioState`:

```ts
rfqSummaries: Map<string, Record<string, unknown>>;
rfqStepStatuses: Map<string, string[]>;
```

Defaults:

```ts
rfqSummaries: new Map(),
rfqStepStatuses: new Map(),
```

- [ ] **Step 5: Make RFQ handlers state-backed**

Update handlers so:

```ts
GET /api/request-for-quote/{id}/view-summary
```

returns `state.rfqSummaries.get(id)`, and PUT:

```ts
/api/request-for-quote/{id}/instrument-and-request
```

stores `command.formStep` in `state.instrumentDrafts`.

Use this summary payload:

```ts
{
    organisationAndContact: {
        businessOrTradingName: 'Test Organisation Pty Ltd',
        contact: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
        },
    },
    instrumentAndRequest: {
        manufacturer: 'Original Manufacturer',
        model: 'Original Model',
        serialNumber: 'SN123456',
        testingAndCalibrationRequirements: 'Calibrate across the operating range.',
    },
}
```

- [ ] **Step 6: Implement RFQ lifecycle steps**

Create `tests/e2e/steps/rfq-lifecycle.steps.ts` with exact URL and heading assertions:

```ts
Given('submitted RFQ {string} is available', async ({ scenarioState }, id: string) => {
    scenarioState.activeReferenceId = id;
    scenarioState.rfqSummaries.set(id, buildRfqSummary());
});

When('the user opens the submitted RFQ summary', async ({ page, scenarioState }) => {
    await page.goto(`/request-for-quote/${scenarioState.activeReferenceId}/view-summary`);
});

Then('the submitted RFQ summary is displayed', async ({ page }) => {
    await expect(page).toHaveURL(/\/view-summary$/);
    await expect(page.getByRole('heading', { name: /Summary/i })).toBeVisible();
});

Then('the summary contains manufacturer {string}', async ({ page }, value: string) => {
    await expect(page.getByText(value, { exact: true })).toBeVisible();
});

When('the user changes the manufacturer to {string}', async ({ page }, value: string) => {
    await page.getByLabel('Manufacturer', { exact: true }).fill(value);
});

When('the user clears the manufacturer', async ({ page }) => {
    await page.getByLabel('Manufacturer', { exact: true }).clear();
});

Then('the validation message {string} is displayed', async ({ page }, message: string) => {
    await expect(page.getByText(message, { exact: true })).toBeVisible();
});
```

Implement draft setup by setting step statuses to `Saved`, navigating to the real `/request-for-quote/{id}/instrument-and-request` route, and asserting persisted state from `ScenarioState`; do not navigate directly in action steps.

- [ ] **Step 7: Convert the submitted-summary route to covered**

Change `/request-for-quote/:id/view-summary` to `status: 'app-bdd'`.

- [ ] **Step 8: Verify**

Run:

```powershell
npx bddgen -c playwright.config.ts
npx playwright test -c playwright.config.ts --project=app-bdd tests/e2e/features/rfq/manage-rfq.feature
```

Expected: 3 scenarios pass.

- [ ] **Step 9: Commit**

```powershell
git add tests/e2e/features/rfq/manage-rfq.feature tests/e2e/steps/rfq-lifecycle.steps.ts tests/e2e/support/mock-api.ts tests/e2e/support/scenario-state.ts tests/e2e/route-coverage.ts
git commit -m "test: cover remaining rfq lifecycle"
```

## Task 6: Cover Measurement Report List and Detail

**Files:**

- Create: `tests/e2e/features/reports/measurement-reports.feature`
- Create: `tests/e2e/steps/report.steps.ts`
- Modify: `tests/e2e/support/mock-builders.ts`
- Modify: `tests/e2e/support/mock-api.ts`
- Modify: `tests/e2e/support/scenario-state.ts`
- Modify: `tests/e2e/route-coverage.ts`
- Test: `tests/e2e/features/reports/measurement-reports.feature`

- [ ] **Step 1: Draft the report feature**

Create:

```gherkin
Feature: View measurement reports

  Background:
    Given the user is signed in as "test@example.com"

  Scenario: User opens a report from an instrument report history
    Given instrument "Precision Balance" has an issued report
    When the user opens the instrument report history
    Then the instrument report history is displayed
    When the user follows the report link "View report"
    Then report "MR-2024-001" is displayed

  Scenario: User sees a report file retrieval failure
    Given report "RFQ-REPORT-FAIL" is available
    And report PDF retrieval will fail with status 503
    When the user opens report "RFQ-REPORT-FAIL"
    And the user clicks "View report PDF"
    Then the report file error notification is displayed
```

- [ ] **Step 2: Present the feature and wait for approval**

- [ ] **Step 3: Run generation and confirm undefined steps**

Run:

```powershell
npx bddgen -c playwright.config.ts
```

Expected: FAIL for the new report steps.

- [ ] **Step 4: Add report builders**

Add:

```ts
export const buildInstrumentReports = () => ({
    items: [{
        tmasTcReportName: 'MR-2024-001',
        tmasTcReportDate: new Date('2026-06-01T00:00:00Z'),
        tmasMeasurementReportCertificateRequired: 'Measurement report',
        tmasMeasurementCategoryName: 'Mass',
        tmasStatus: 'Report issued',
        tmasTcQuoteName: 'RFQ-REPORT-0001',
        tmasPortalRequestId: 'RFQ-2024-000321',
    }],
    currentPage: 1,
    totalPages: 1,
    totalCount: 1,
});

export const buildMeasurementReport = (referenceId: string) => ({
    quoteRequestIdNum: referenceId,
    manufacturer: 'Original Manufacturer',
    model: 'Original Model',
    serialNumber: 'SN123456',
    instrumentArtefactToBeCalibrated: 'Precision Balance',
    servicesOffered: 'Calibration service',
    measurementReportCertificateRequired: 'Measurement report',
    nmiTestOfficerName: 'NMI Test Officer',
    report: {
        reportId: 'MR-2024-001',
        dateIssued: new Date('2026-06-01T00:00:00Z'),
        invoiceNumber: 'INV-001',
    },
});
```

- [ ] **Step 5: Install report handlers**

Add:

```ts
await page.route('**/api/dashboard/get-dashboard-instrument-artefact-reports?**', async (route) => {
    await json(route, buildInstrumentReports());
});

await page.route('**/api/dashboard/get-quote-report-pdf?**', async (route) => {
    if (state.failures.has('report-pdf')) {
        await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
        return;
    }
    await json(route, { fileName: 'MR-2024-001.pdf', fileData: 'JVBERi0xLjQ=' });
});
```

Use the existing quote-details-by-reference handler to return `buildMeasurementReport(referenceId)` for report IDs.

- [ ] **Step 6: Implement report steps**

Create `tests/e2e/steps/report.steps.ts`:

```ts
Given('instrument {string} has an issued report', async ({ scenarioState }, name: string) => {
    scenarioState.activeReferenceId = name;
});

When('the user opens the instrument report history', async ({ page, scenarioState }) => {
    await page.goto(`/instrument-reports/${encodeURIComponent(scenarioState.activeReferenceId!)}`);
});

Then('the instrument report history is displayed', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Measurement reports', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('table', { name: /Measurement reports history/i })).toBeVisible();
});

When('the user follows the report link {string}', async ({ page }, name: string) => {
    await page.getByRole('link', { name, exact: true }).click();
});

Then('report {string} is displayed', async ({ page }, reportId: string) => {
    await expect(page).toHaveURL(/\/report\/RFQ-REPORT-0001$/);
    await expect(page.getByText(reportId, { exact: true })).toBeVisible();
});

Given('report PDF retrieval will fail with status {int}', async ({ scenarioState }, status: number) => {
    scenarioState.failures.set('report-pdf', { status });
});

Then('the report file error notification is displayed', async ({ page }) => {
    await expect(page.getByRole('alert')).toBeVisible();
});
```

- [ ] **Step 7: Convert report routes to covered**

Change `/instrument-reports/:id` and `/report/:id` to `status: 'app-bdd'`.

- [ ] **Step 8: Verify**

Run:

```powershell
npx bddgen -c playwright.config.ts
npx playwright test -c playwright.config.ts --project=app-bdd tests/e2e/features/reports/measurement-reports.feature
```

Expected: 2 scenarios pass.

- [ ] **Step 9: Commit**

```powershell
git add tests/e2e/features/reports/measurement-reports.feature tests/e2e/steps/report.steps.ts tests/e2e/support/mock-builders.ts tests/e2e/support/mock-api.ts tests/e2e/support/scenario-state.ts tests/e2e/route-coverage.ts
git commit -m "test: cover measurement report workflows"
```

## Task 7: Add Failure-Path and State-Retention Coverage

**Files:**

- Create: `tests/e2e/features/resilience/workflow-errors.feature`
- Create: `tests/e2e/steps/failure.steps.ts`
- Create: `tests/e2e/support/mock-failure.ts`
- Modify: `tests/e2e/support/scenario-state.ts`
- Modify: `tests/e2e/support/mock-api.ts`
- Test: `tests/e2e/features/resilience/workflow-errors.feature`

- [ ] **Step 1: Draft failure scenarios**

Create:

```gherkin
Feature: Recover from portal workflow failures

  Background:
    Given the user is signed in as "test@example.com"

  Scenario: RFQ save failure retains entered values
    Given draft RFQ "RFQ-DRAFT-FAIL" is available at the instrument step
    And saving the RFQ instrument step will fail with status 503
    When the user changes the manufacturer to "Retained Manufacturer"
    And the user clicks "Save and next"
    Then an RFQ save error is displayed
    And the manufacturer remains "Retained Manufacturer"

  Scenario: Organisation conflict returns the user to the dashboard
    Given the user opens organisation 1 for editing
    And saving the organisation will fail with status 412
    When the user submits the account maintenance form
    Then the dashboard is displayed
    And the error notification "This branch/location name already exists." is displayed

  Scenario: Authentication expiry during a mutation requires sign-in
    Given draft RFQ "RFQ-DRAFT-AUTH" is available at the instrument step
    When the authentication session expires
    And the user clicks "Save and exit"
    Then the sign-in page is displayed

  Scenario: Unsaved RFQ navigation can be cancelled
    Given draft RFQ "RFQ-DRAFT-UNSAVED" is available at the instrument step
    When the user changes the manufacturer to "Unsaved Manufacturer"
    And the user follows "Back to dashboard"
    Then an unsaved changes dialog is displayed
    When the user cancels leaving the form
    Then the RFQ instrument step remains displayed
    And the manufacturer remains "Unsaved Manufacturer"
```

- [ ] **Step 2: Present the feature and wait for approval**

- [ ] **Step 3: Add typed failure configuration**

Create `tests/e2e/support/mock-failure.ts`:

```ts
export interface MockFailure {
    status: number;
    body?: Record<string, unknown>;
    once?: boolean;
}

export const failureKey = (method: string, pathname: string) => (
    `${method.toUpperCase()} ${pathname}`
);
```

Change `ScenarioState.failures` to:

```ts
failures: Map<string, MockFailure>;
```

- [ ] **Step 4: Apply failures before successful handlers**

At the start of each mutable route handler:

```ts
const key = failureKey(route.request().method(), new URL(route.request().url()).pathname);
const failure = state.failures.get(key);
if (failure) {
    if (failure.once !== false) {
        state.failures.delete(key);
    }
    await route.fulfill({
        status: failure.status,
        contentType: 'application/json',
        body: JSON.stringify(failure.body ?? {
            status: failure.status,
            title: 'Configured E2E failure',
        }),
    });
    return;
}
```

- [ ] **Step 5: Implement failure setup and assertions**

Create `tests/e2e/steps/failure.steps.ts`:

```ts
Given('saving the RFQ instrument step will fail with status {int}', async ({
    scenarioState,
}, status: number) => {
    scenarioState.failures.set(
        failureKey('PUT', '/api/request-for-quote/RFQ-DRAFT-FAIL/instrument-and-request'),
        { status },
    );
});

Given('saving the organisation will fail with status {int}', async ({
    scenarioState,
}, status: number) => {
    scenarioState.failures.set(
        failureKey('PUT', '/api/forms/accounts/create-account/complete'),
        {
            status,
            body: { status, title: 'Precondition Failed' },
        },
    );
});

Then('the manufacturer remains {string}', async ({ page }, value: string) => {
    await expect(page.getByLabel('Manufacturer', { exact: true })).toHaveValue(value);
});

Then('an unsaved changes dialog is displayed', async ({ page }) => {
    await expect(page.getByRole('dialog')).toBeVisible();
});

When('the user cancels leaving the form', async ({ page }) => {
    await page.getByRole('dialog').getByRole('button', {
        name: 'Cancel',
        exact: true,
    }).click();
});
```

- [ ] **Step 6: Verify failure scenarios**

Run:

```powershell
npx bddgen -c playwright.config.ts
npx playwright test -c playwright.config.ts --project=app-bdd tests/e2e/features/resilience/workflow-errors.feature
```

Expected: 4 scenarios pass and entered values remain visible after failed mutations.

- [ ] **Step 7: Commit**

```powershell
git add tests/e2e/features/resilience/workflow-errors.feature tests/e2e/steps/failure.steps.ts tests/e2e/support/mock-failure.ts tests/e2e/support/scenario-state.ts tests/e2e/support/mock-api.ts
git commit -m "test: cover workflow failure recovery"
```

## Task 8: Remove Permissive Storybook Assertions

**Files:**

- Modify: `tests/e2e/steps/storybook.steps.ts`
- Modify: `tests/e2e/features/storybook/**/*.feature`
- Test: all Storybook BDD features

- [ ] **Step 1: Add a static regression test for forbidden patterns**

Create `tests/unit/e2e/playwrightStepQuality.test.ts`:

```ts
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const steps = fs.readFileSync(
    path.join(repoRoot, 'tests', 'e2e', 'steps', 'storybook.steps.ts'),
    'utf8',
);

describe('Storybook Playwright step quality', () => {
    it('does not use body-wide text assertions', () => {
        expect(steps).not.toContain("page.locator('body')");
    });

    it('does not convert failed visibility checks into false', () => {
        expect(steps).not.toMatch(/isVisible\(\)\.catch\(\(\) => false\)/);
    });

    it('does not branch on locator counts for optional assertions', () => {
        expect(steps).not.toMatch(/if \(count > 0\)/);
    });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
npm run test:unit -- tests/unit/e2e/playwrightStepQuality.test.ts
```

Expected: FAIL on all three current permissive patterns.

- [ ] **Step 3: Replace body-wide portal assertions**

Replace:

```ts
await expect(page.locator('body')).toContainText(text);
```

with:

```ts
const portalContent = page.locator('.modal, [role="dialog"], [role="alert"]');
await expect(portalContent.filter({ hasText: text }).first()).toBeVisible({
    timeout: 10_000,
});
```

Rename the step to:

```gherkin
Then the Storybook portal should contain "..."
```

Update footer/modal feature files to use the new wording.

- [ ] **Step 4: Make generic visibility fail on error UI**

Replace the optional check with:

```ts
Then('the story iframe should be visible', async ({ page }) => {
    await expect(page.locator('#storybook-root')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Something went wrong', { exact: false })).toHaveCount(0);
});
```

- [ ] **Step 5: Make pagination absence deterministic**

Replace count branching with:

```ts
Then('the story iframe should not show pagination controls', async ({ page }) => {
    await expect(page.getByRole('navigation', { name: /pagination/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /next page|previous page/i })).toHaveCount(0);
});
```

- [ ] **Step 6: Replace generic route-story visibility**

For every route scenario that currently ends only with:

```gherkin
Then the story iframe should be visible
```

replace it with a route-specific heading, status, or action assertion. For example:

```gherkin
Then the story iframe should contain "Currently managing"
```

Do not change component smoke scenarios where visibility is itself the behavior under test.

- [ ] **Step 7: Verify**

Run:

```powershell
npm run test:unit -- tests/unit/e2e/playwrightStepQuality.test.ts
npm run test:e2e:storybook
```

Expected: the static quality test passes and all Storybook scenarios pass.

- [ ] **Step 8: Commit**

```powershell
git add tests/unit/e2e/playwrightStepQuality.test.ts tests/e2e/steps/storybook.steps.ts tests/e2e/features/storybook
git commit -m "test: harden storybook bdd assertions"
```

## Task 9: Close Route Coverage, CI, and Documentation

**Files:**

- Modify: `tests/e2e/route-coverage.ts`
- Modify: `.github/workflows/pr.yml`
- Modify: `docs/TESTING.md`
- Modify: `ClientApp/src/storybook/CoverageMatrix.docs.mdx`
- Modify: `docs/change-record/OPEN-ITEMS-BACKLOG.md`
- Test: full validation suite

- [ ] **Step 1: Verify the route manifest has no planned entries**

Add this test to `tests/unit/e2e/routeCoverage.test.ts`:

```ts
it('does not retain temporary planned entries', () => {
    expect(routeCoverage.filter((entry) => entry.status === 'planned')).toEqual([]);
});
```

Run:

```powershell
npm run test:unit -- tests/unit/e2e/routeCoverage.test.ts
```

Expected: PASS. If it fails, convert only routes backed by an implemented scenario to `app-bdd`; otherwise retain an explicit durable exclusion with a concrete reason.

- [ ] **Step 2: Correct CI commands and artifact paths for this checkout**

Where `.github/workflows/pr.yml` targets this repository root, use:

```yaml
- name: Run application Playwright-BDD
  run: npm run test:e2e:app
  env:
    CI: true

- name: Run Storybook Playwright-BDD
  run: npm run test:e2e:storybook
  env:
    CI: true

- name: Upload application Playwright report
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: playwright-report-app
    path: reports/playwright/app/
    retention-days: 14

- name: Upload Storybook Playwright report
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: playwright-report-storybook
    path: reports/playwright/storybook/
    retention-days: 14
```

Do not overwrite target-repository monorepo jobs that intentionally run under `apps/portal-spa`; if this workflow belongs to the target monorepo rather than the snapshot, document the mismatch in `docs/TESTING.md` and leave the workflow unchanged.

- [ ] **Step 3: Update coverage documentation**

Add:

```markdown
## Playwright-BDD Coverage Definition

Route coverage means every static route in `ClientApp/src/App.tsx` has either:

1. an `app-bdd` scenario for a real user workflow,
2. a `storybook-bdd` scenario for an isolated rendering-only route, or
3. a reviewed exclusion in `tests/e2e/route-coverage.ts`.

This is behavioral route traceability. It is not JavaScript line, function, or
branch coverage.
```

Update scenario counts using fresh command output rather than preserving historical values.

- [ ] **Step 4: Close the process backlog item**

Update `STORYBOOK-BDD-PROCESS-001` only after:

- story IDs are verified by the generated Storybook index,
- route traceability passes,
- both BDD projects pass,
- permissive assertion checks pass.

- [ ] **Step 5: Run static validation**

Run:

```powershell
npm run type-check
npm run lint
npm run test:unit -- tests/unit/e2e/routeCoverage.test.ts tests/unit/e2e/playwrightStepQuality.test.ts
```

Expected: all commands exit 0.

- [ ] **Step 6: Run both BDD projects**

Run:

```powershell
npm run test:e2e:app
npm run test:e2e:storybook
```

Expected: all scenarios pass without `@only`, `@skip`, `@fixme`, or unexpected retries.

- [ ] **Step 7: Run the combined command**

Run:

```powershell
npm run test:e2e
```

Expected: both projects pass sequentially and reports exist under:

```text
reports/playwright/app/
reports/playwright/storybook/
```

- [ ] **Step 8: Stress the historically flaky account scenario**

Run:

```powershell
npx bddgen -c playwright.config.ts
npx playwright test -c playwright.config.ts --project=app-bdd --grep "User creates organisation and contact details" --repeat-each=20
```

Expected: 20 passes with no terms-modal interception timeout.

- [ ] **Step 9: Commit final closure**

```powershell
git add tests/e2e/route-coverage.ts .github/workflows/pr.yml docs/TESTING.md ClientApp/src/storybook/CoverageMatrix.docs.mdx docs/change-record/OPEN-ITEMS-BACKLOG.md
git commit -m "test: enforce complete playwright bdd traceability"
```

## Self-Review

### Spec Coverage

| Recommendation | Implemented by |
| --- | --- |
| Complete quote acceptance | Task 3 |
| Cover account maintenance | Task 4 |
| Complete RFQ lifecycle | Task 5 |
| Cover measurement reports | Task 6 |
| Add route coverage enforcement | Tasks 2 and 9 |
| Separate Playwright projects | Task 1 |
| Strengthen failure coverage | Task 7 |
| Remove permissive patterns | Task 8 |

### Placeholder Scan

- No `TBD`, `TODO`, or “implement later” steps remain.
- Every new feature includes concrete Gherkin.
- Every configuration change includes exact code.
- Every task includes a targeted command and expected result.
- Generated and vendor files remain outside edit scope.

### Type and Contract Consistency

- `ScenarioState.failures` consistently uses `Map<string, MockFailure>`.
- API paths match `ClientApp/src/api/web-api-client.ts`.
- Quote acceptance uses the four current wizard locations:
  `/report-recipient`, `/delivery-and-return`, `/payment-details`, and
  `/summary-and-accept`.
- Account maintenance uses the current generated-client endpoints:
  `/api/forms/accounts/{OrganisationId}`,
  `/api/forms/accounts/create-account/complete`,
  `/api/forms/accounts/branch`,
  `/api/forms/accounts/branch-add/complete`,
  `/api/contact/usercontact`, and `/api/contact/save-contact`.
- RFQ and report route paths match `ClientApp/src/App.tsx`.

### Residual Risks

- The checked-in `.github/workflows/pr.yml` appears to describe a target monorepo rather than this source snapshot. Task 9 explicitly prevents overwriting intentional target-repository jobs.
- API mocks validate frontend behavior against captured generated-client contracts, not a live NMI backend or Azure AD B2C tenant.
