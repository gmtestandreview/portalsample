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

export type RouteCoverageEntry = CoveredRoute | ExcludedRoute;

export const routeCoverage: RouteCoverageEntry[] = [
    { path: '/', status: 'storybook-bdd', feature: 'tests/e2e/features/storybook/routes/routes-coverage.feature', scenario: 'Get started public landing story renders the welcome banner' },
    { path: '/dashboard', status: 'app-bdd', feature: 'tests/e2e/features/auth/login.feature', scenario: 'Authenticated user lands on the dashboard' },
    { path: '/dashboard-ta', status: 'app-bdd', feature: 'tests/e2e/features/@type-approval/type-approval.feature', scenario: 'Applicant completes and submits a new type-approval application' },
    { path: '/create-account/*', status: 'app-bdd', feature: 'tests/e2e/features/account/create-account.feature', scenario: 'User creates organisation and contact details' },
    { path: '/update-organisation/:id/*', status: 'app-bdd', feature: 'tests/e2e/features/account/manage-account.feature', scenario: 'User updates organisation details' },
    { path: '/create-contact', status: 'app-bdd', feature: 'tests/e2e/features/account/create-account.feature', scenario: 'User creates organisation and contact details' },
    { path: '/update-contact/*', status: 'app-bdd', feature: 'tests/e2e/features/account/manage-account.feature', scenario: 'User updates contact details' },
    { path: '/success-creating-account', status: 'storybook-bdd', feature: 'tests/e2e/features/storybook/routes/routes-coverage.feature', scenario: 'Account created story renders the success heading' },
    { path: '/add-branch/*', status: 'app-bdd', feature: 'tests/e2e/features/account/manage-account.feature', scenario: 'User adds a branch or location' },
    { path: '/request-for-quote-create', status: 'app-bdd', feature: 'tests/e2e/features/rfq/create-rfq.feature', scenario: 'User completes a new RFQ through all steps' },
    { path: '/ta/type-approval-create-pre', status: 'app-bdd', feature: 'tests/e2e/features/@type-approval/type-approval.feature', scenario: 'Applicant completes and submits a new type-approval application' },
    { path: '/ta/:id/*', status: 'app-bdd', feature: 'tests/e2e/features/@type-approval/type-approval.feature', scenario: 'Applicant completes and submits a new type-approval application' },
    { path: '/ta/type-approval-create', status: 'app-bdd', feature: 'tests/e2e/features/@type-approval/type-approval.feature', scenario: 'Applicant completes and submits a new type-approval application' },
    { path: '/ta/type-approval-success/:id/*', status: 'app-bdd', feature: 'tests/e2e/features/@type-approval/type-approval.feature', scenario: 'Applicant completes and submits a new type-approval application' },
    { path: '/ta/:id/manage', status: 'app-bdd', feature: 'tests/e2e/features/@type-approval/type-approval.feature', scenario: 'Applicant manages an existing submitted type-approval application' },
    { path: '/request-for-quote-copy/:id/*', status: 'app-bdd', feature: 'tests/e2e/features/rfq/copy-rfq.feature', scenario: 'User copies a completed RFQ from the dashboard' },
    { path: '/request-for-quote/:id/view-summary/*', status: 'app-bdd', feature: 'tests/e2e/features/rfq/manage-rfq.feature', scenario: 'User views a submitted RFQ summary' },
    { path: '/request-for-quote/:id/*', status: 'app-bdd', feature: 'tests/e2e/features/rfq/create-rfq.feature', scenario: 'User completes a new RFQ through all steps' },
    { path: '/request-for-quote-success/:id/*', status: 'app-bdd', feature: 'tests/e2e/features/rfq/create-rfq.feature', scenario: 'User completes a new RFQ through all steps' },
    { path: '/submitted-success/:id/*', status: 'app-bdd', feature: 'tests/e2e/features/quote/accept-quote.feature', scenario: 'User accepts an available quote through every step' },
    { path: '/accept-quote-create/:id/*', status: 'app-bdd', feature: 'tests/e2e/features/quote/accept-quote.feature', scenario: 'User starts the quote acceptance wizard' },
    { path: '/accept-quote/:id/*', status: 'app-bdd', feature: 'tests/e2e/features/quote/accept-quote.feature', scenario: 'User accepts an available quote through every step' },
    { path: '/quotation/:id/*', status: 'app-bdd', feature: 'tests/e2e/features/quote/accept-quote.feature', scenario: 'User opens an available quote from the dashboard' },
    { path: '/instrument-reports/:id/*', status: 'app-bdd', feature: 'tests/e2e/features/reports/measurement-reports.feature', scenario: 'User opens a report from an instrument report history' },
    { path: '/report/:id/*', status: 'app-bdd', feature: 'tests/e2e/features/reports/measurement-reports.feature', scenario: 'User opens a report from an instrument report history' },
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
    { path: '*', status: 'app-bdd', feature: 'tests/e2e/features/@routing/not-found.feature', scenario: 'Unknown portal path displays the not-found page' },
];
