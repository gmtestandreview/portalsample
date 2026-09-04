import { act, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StrictMode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import type { AccountDetails } from '../../../ClientApp/src/authentication/accountContext';
import type * as WebApiClientModule from '../../../ClientApp/src/api/web-api-client';

const mocks = vi.hoisted(() => ({
    acquireTokenSilent: vi.fn(),
    msalInstance: { acquireTokenSilent: vi.fn() },
    msalAccounts: [{ homeAccountId: 'account-1' }],
    setAuthToken: vi.fn(),
    requestForQuoteGetStepStatuses: vi.fn(),
    acceptQuoteGetStepStatuses: vi.fn(),
    createApplication: vi.fn(),
    copyApplication: vi.fn(),
    getQuoteRequestDetails: vi.fn(),
    getQuoteRequestDetailsByRefId: vi.fn(),
    getPaymentDetails: vi.fn(),
    appLoggerError: vi.fn(),
    appLoggerVerbose: vi.fn(),
    useAccountState: vi.fn(),
}));

vi.mock('@azure/msal-react', () => ({
    useMsal: () => ({
        accounts: mocks.msalAccounts,
        instance: mocks.msalInstance,
    }),
}));

vi.mock('../../../ClientApp/src/authentication/authConfig', () => ({
    tokenRequest: { scopes: ['scope'] },
}));

vi.mock('../../../ClientApp/src/authentication/hooks', () => ({
    useAccountState: mocks.useAccountState,
}));

vi.mock('../../../ClientApp/src/api/web-api-client', async (importOriginal) => {
    const actual = await importOriginal<typeof WebApiClientModule>();

    return {
        ...actual,
        ApplicationType: {
            QuoteAccept: 'QuoteAccept',
            QuoteRequest: 'QuoteRequest',
        },
        RequestForQuoteClient: vi.fn(function RequestForQuoteClientMock() {
            return {
                setAuthToken: mocks.setAuthToken,
                getStepStatuses: mocks.requestForQuoteGetStepStatuses,
            };
        }),
        AcceptQuoteClient: vi.fn(function AcceptQuoteClientMock() {
            return {
                setAuthToken: mocks.setAuthToken,
                getStepStatuses: mocks.acceptQuoteGetStepStatuses,
                getPaymentDetails: mocks.getPaymentDetails,
            };
        }),
        ApplicationClient: vi.fn(function ApplicationClientMock() {
            return {
                setAuthToken: mocks.setAuthToken,
                createApplication: mocks.createApplication,
                copyApplication: mocks.copyApplication,
            };
        }),
        QuoteClient: vi.fn(function QuoteClientMock() {
            return {
                setAuthToken: mocks.setAuthToken,
                getQuoteRequestDetails: mocks.getQuoteRequestDetails,
                getQuoteRequestDetailsByRefId: mocks.getQuoteRequestDetailsByRefId,
            };
        }),
    };
});

vi.mock('../../../ClientApp/src/components/forms/WizardForm', () => ({
    default: ({ children, locationOnCompletion, lastStepNextButtonTitle }: {
        children: React.ReactNode;
        locationOnCompletion: string;
        lastStepNextButtonTitle: string;
    }) => (
        <section
            data-testid="wizard-form"
            data-complete-location={locationOnCompletion}
            data-last-button={lastStepNextButtonTitle}
        >
            {children}
        </section>
    ),
}));

vi.mock('../../../ClientApp/src/components/forms/WizardForm/WizardStep', () => ({
    default: ({ children, bannerTitle, bannerRefTitle }: {
        children: React.ReactNode;
        bannerTitle?: string;
        bannerRefTitle?: string;
    }) => (
        <article data-testid="wizard-step" data-banner-title={bannerTitle} data-ref-title={bannerRefTitle}>
            {children}
        </article>
    ),
}));

vi.mock('../../../ClientApp/src/components/forms/FormBanner', () => ({
    default: ({ title, refTitle, subTitle }: { title: string; refTitle?: string; subTitle?: string }) => (
        <div data-testid="form-banner" data-ref-title={refTitle} data-sub-title={subTitle}>
            {title}
        </div>
    ),
}));

vi.mock('../../../ClientApp/src/components/BlockUISpinner', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div data-testid="block-spinner">{children}</div>,
}));

vi.mock('../../../ClientApp/src/components/HeaderIntroText', () => ({
    default: ({ children }: { children: React.ReactNode }) => <p data-testid="header-intro">{children}</p>,
}));

vi.mock('../../../ClientApp/src/components/Utilities/useBodyClass', () => ({
    default: () => {},
}));

vi.mock('../../../ClientApp/src/components/Utilities/useHtmlTitle', () => ({
    default: () => {},
}));

vi.mock('../../../ClientApp/src/instrumentation/AppLogger', () => ({
    default: {
        error: mocks.appLoggerError,
        verbose: mocks.appLoggerVerbose,
    },
}));

vi.mock('../../../ClientApp/src/storage/notification', () => ({
    setDashboardNotification: vi.fn(),
}));

vi.mock('../../../ClientApp/src/routes/requestForQuote/organisationAndContact', () => ({
    default: () => <div>Organisation and contact step</div>,
}));

vi.mock('../../../ClientApp/src/routes/requestForQuote/instrumentAndRequest', () => ({
    default: () => <div>Instrument and request step</div>,
}));

vi.mock('../../../ClientApp/src/routes/requestForQuote/requestForQuoteSummary', () => ({
    default: () => <div>Request summary step</div>,
}));

vi.mock('../../../ClientApp/src/routes/acceptQuote/reportRecipient', () => ({
    default: () => <div>Report recipient step</div>,
}));

vi.mock('../../../ClientApp/src/routes/acceptQuote/deliveryAndReturn', () => ({
    default: () => <div>Delivery and return step</div>,
}));

vi.mock('../../../ClientApp/src/routes/acceptQuote/paymentDetails', () => ({
    default: () => <div>Payment details step</div>,
}));

vi.mock('../../../ClientApp/src/routes/acceptQuote/summaryAndAccept', () => ({
    default: () => <div>Summary and accept step</div>,
}));

vi.mock('../../../ClientApp/src/routes/quotation/quoteDetails', () => ({
    default: ({ quotationData, fileError }: {
        quotationData?: { quotationIdNum?: string };
        fileError?: boolean;
    }) => (
        <div data-testid="quotation-details" data-file-error={fileError}>
            {quotationData?.quotationIdNum}
        </div>
    ),
}));

vi.mock('../../../ClientApp/src/routes/quotation/nMIContactDetails', () => ({
    default: () => <div>NMI contact details</div>,
}));

vi.mock('../../../ClientApp/src/components/Utilities/ViewPdfQuoteTerms', () => ({
    default: () => <div>Quote terms</div>,
}));

vi.mock('../../../ClientApp/src/components/Utilities/ViewPdfQuote', () => ({
    default: () => <div>Detailed quote PDF</div>,
}));

const accountDetails = {
    organisation: 'National Measurement Institute',
    trading: 'Trading',
    branch: 'Branch',
    defaultOrganisationId: 1,
} as AccountDetails;

const renderAt = (initialPath: string, element: React.ReactNode, routePath = initialPath) => render(
    <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
            <Route path={routePath} element={element} />
            <Route path="/not-found" element={<div data-testid="not-found" />} />
            <Route path="*" element={<div data-testid="fallback-route" />} />
        </Routes>
    </MemoryRouter>,
);

const renderWithNavigationDestinations = (initialPath: string, element: React.ReactNode, routePath: string) => render(
    <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
            <Route path={routePath} element={element} />
            <Route path="/request-for-quote/:id/organisation-and-contact" element={<div data-testid="rfq-created-destination" />} />
            <Route path="/accept-quote/:id/report-recipient" element={<div data-testid="accept-created-destination" />} />
            <Route path="*" element={<div data-testid="fallback-route" />} />
        </Routes>
    </MemoryRouter>,
);

describe('workflow route wrappers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
        mocks.msalInstance.acquireTokenSilent.mockImplementation(mocks.acquireTokenSilent);
        mocks.useAccountState.mockReturnValue({ details: accountDetails });
        mocks.requestForQuoteGetStepStatuses.mockResolvedValue([
            { name: 'Organisation and contact', status: 'current' },
        ]);
        mocks.acceptQuoteGetStepStatuses.mockResolvedValue([
            { name: 'Report recipient', status: 'current', crmQuoteRequestId: 'CRM-QUOTE-1' },
        ]);
        mocks.createApplication.mockResolvedValue({ referenceId: 'APP-1' });
        mocks.copyApplication.mockResolvedValue({ referenceId: 'APP-COPY-1' });
        mocks.getQuoteRequestDetails.mockResolvedValue({ quoteRequestIdNum: 'RFQ-123' });
        mocks.getQuoteRequestDetailsByRefId.mockResolvedValue({ crmQuoteRequestId: 'CRM-QUOTE-1' });
        mocks.getPaymentDetails.mockResolvedValue({ acceptQuotePreInfo: { paymentTerms: 'Prepaid' } });
    });

    it('renders the request-for-quote wizard after loading statuses', async () => {
        const RequestForQuote = (await import('../../../ClientApp/src/routes/requestForQuote')).default;

        renderAt('/request-for-quote/APP-1/organisation-and-contact', <RequestForQuote />, '/request-for-quote/:id/*');

        await waitFor(() => expect(screen.getByTestId('wizard-form')).toBeInTheDocument());

        expect(mocks.setAuthToken).toHaveBeenCalledWith('access-token');
        expect(mocks.requestForQuoteGetStepStatuses).toHaveBeenCalledWith('APP-1');
        expect(screen.getByTestId('wizard-form')).toHaveAttribute('data-complete-location', '/request-for-quote-success/APP-1');
        expect(screen.getAllByTestId('wizard-step')).toHaveLength(3);
        expect(screen.getByText('Organisation and contact step')).toBeInTheDocument();
        expect(screen.getByText('Instrument and request step')).toBeInTheDocument();
        expect(screen.getByText('Request summary step')).toBeInTheDocument();
    });

    it('still loads statuses when StrictMode mounts, unmounts and remounts the wizard', async () => {
        // StrictMode mounts, tears down and remounts every effect in development. An unmount flag
        // that is only initialised - rather than reset each time the effect runs - latches true
        // during that simulated teardown and is never cleared, so the first real response is
        // discarded and the wizard sits on its spinner forever.
        //
        // This shipped once. The plain render above could not catch it, because RTL does not wrap
        // in StrictMode, so it took a browser-driven e2e run to surface. Rendering the wizard the
        // way index.tsx actually renders it keeps that gap closed here.
        const RequestForQuote = (await import('../../../ClientApp/src/routes/requestForQuote')).default;

        renderAt(
            '/request-for-quote/APP-1/organisation-and-contact',
            <StrictMode><RequestForQuote /></StrictMode>,
            '/request-for-quote/:id/*',
        );

        await waitFor(() => expect(screen.getByTestId('wizard-form')).toBeInTheDocument());
        expect(screen.getAllByTestId('wizard-step')).toHaveLength(3);
    });

    it('redirects request-for-quote to not found for invalid ids and failed status loads', async () => {
        const RequestForQuote = (await import('../../../ClientApp/src/routes/requestForQuote')).default;
        const { unmount } = renderAt('/request-for-quote/!bad/organisation-and-contact', <RequestForQuote />, '/request-for-quote/:id/*');

        expect(screen.getByTestId('not-found')).toBeInTheDocument();
        expect(mocks.requestForQuoteGetStepStatuses).not.toHaveBeenCalled();
        unmount();

        mocks.requestForQuoteGetStepStatuses.mockRejectedValueOnce(new Error('load failed'));
        renderAt('/request-for-quote/APP-2/organisation-and-contact', <RequestForQuote />, '/request-for-quote/:id/*');

        await waitFor(() => expect(screen.getByTestId('not-found')).toBeInTheDocument());
        expect(mocks.appLoggerError).toHaveBeenCalledWith(
            'Failed to load application steps',
            expect.any(Error),
            { Id: 'APP-2' },
        );
    });

    it('recovers from a rejected token refresh instead of deadlocking the wizard', async () => {
        // `acquireTokenSilent` sat outside the `try`, so a rejected refresh threw
        // past the `finally` that resets `isLoading.current`. The ref stayed true
        // for the life of the component and its own `!isLoading.current` guard
        // then blocked every subsequent attempt - the wizard hung with no error
        // and no way back. Statement coverage never caught it: the happy path
        // executes the same line.
        const RequestForQuote = (await import('../../../ClientApp/src/routes/requestForQuote')).default;

        mocks.acquireTokenSilent.mockRejectedValueOnce(new Error('interaction_required'));

        renderAt('/request-for-quote/APP-5/organisation-and-contact', <RequestForQuote />, '/request-for-quote/:id/*');

        await waitFor(() => expect(screen.getByTestId('not-found')).toBeInTheDocument());

        expect(mocks.appLoggerError).toHaveBeenCalledWith(
            'Failed to load application steps',
            expect.any(Error),
            { Id: 'APP-5' },
        );
        // The rejection must be handled before the client is ever built.
        expect(mocks.requestForQuoteGetStepStatuses).not.toHaveBeenCalled();
    });

    it('does not log or navigate once the wizard has unmounted', async () => {
        // The unmount guard. A token refresh that settles after the user has
        // navigated away must not push them to /not-found from a route they are
        // no longer on, and must not write to unmounted state.
        const RequestForQuote = (await import('../../../ClientApp/src/routes/requestForQuote')).default;

        let rejectToken: (reason: Error) => void = () => undefined;
        mocks.acquireTokenSilent.mockReturnValueOnce(
            new Promise((_resolve, reject) => {
                rejectToken = reject;
            }),
        );

        const { unmount } = renderAt('/request-for-quote/APP-6/organisation-and-contact', <RequestForQuote />, '/request-for-quote/:id/*');

        await waitFor(() => expect(mocks.acquireTokenSilent).toHaveBeenCalled());
        unmount();

        rejectToken(new Error('interaction_required'));
        await act(async () => {
            await Promise.resolve();
        });

        expect(mocks.appLoggerError).not.toHaveBeenCalled();
    });

    it('does not apply loaded statuses once the wizard has unmounted', async () => {
        // The success half of the same unmount guard: a status load that lands
        // after the user has navigated away must not write to dead state.
        const RequestForQuote = (await import('../../../ClientApp/src/routes/requestForQuote')).default;

        let resolveStatuses: (value: unknown) => void = () => undefined;
        mocks.requestForQuoteGetStepStatuses.mockReturnValueOnce(
            new Promise((resolve) => {
                resolveStatuses = resolve;
            }),
        );

        const { unmount } = renderAt('/request-for-quote/APP-7/organisation-and-contact', <RequestForQuote />, '/request-for-quote/:id/*');

        await waitFor(() => expect(mocks.requestForQuoteGetStepStatuses).toHaveBeenCalledWith('APP-7'));
        unmount();

        resolveStatuses([{ name: 'Organisation and contact', status: 'current' }]);
        await act(async () => {
            await Promise.resolve();
        });

        expect(mocks.appLoggerError).not.toHaveBeenCalled();
        expect(screen.queryByTestId('wizard-form')).not.toBeInTheDocument();
    });

    it('shows a loading state until request-for-quote account details are available', async () => {
        mocks.useAccountState.mockReturnValue({ details: undefined });
        const RequestForQuote = (await import('../../../ClientApp/src/routes/requestForQuote')).default;

        renderAt('/request-for-quote/APP-3/organisation-and-contact', <RequestForQuote />, '/request-for-quote/:id/*');

        expect(screen.getByTestId('block-spinner')).toHaveTextContent('Loading...');
        expect(mocks.requestForQuoteGetStepStatuses).not.toHaveBeenCalled();
    });

    it('does not load workflow statuses until an MSAL account is available', async () => {
        mocks.msalAccounts.length = 0;
        const RequestForQuote = (await import('../../../ClientApp/src/routes/requestForQuote')).default;
        const { unmount } = renderAt(
            '/request-for-quote/APP-4/organisation-and-contact',
            <RequestForQuote />,
            '/request-for-quote/:id/*',
        );

        expect(screen.getByTestId('block-spinner')).toHaveTextContent('Loading...');
        expect(mocks.requestForQuoteGetStepStatuses).not.toHaveBeenCalled();
        unmount();

        const AcceptQuote = (await import('../../../ClientApp/src/routes/acceptQuote')).default;
        renderAt('/accept-quote/AQ-4/report-recipient', <AcceptQuote />, '/accept-quote/:id/*');

        expect(screen.getByTestId('block-spinner')).toHaveTextContent('Loading...');
        expect(mocks.acceptQuoteGetStepStatuses).not.toHaveBeenCalled();
        mocks.msalAccounts.push({ homeAccountId: 'account-1' });
    });

    it('creates and copies request-for-quote applications before navigating into the wizard', async () => {
        const CreateRequestForQuote = (await import('../../../ClientApp/src/routes/requestForQuote/create')).default;
        const CopyRequestForQuote = (await import('../../../ClientApp/src/routes/requestForQuote/copy')).default;
        const { unmount } = renderWithNavigationDestinations(
            '/request-for-quote-create',
            <StrictMode><CreateRequestForQuote /></StrictMode>,
            '/request-for-quote-create',
        );

        await waitFor(() => expect(screen.getByTestId('rfq-created-destination')).toBeInTheDocument());
        expect(mocks.createApplication).toHaveBeenCalledWith({ applicationType: 'QuoteRequest' });
        unmount();

        renderWithNavigationDestinations(
            '/request-for-quote-copy/RFQ-1',
            <StrictMode><CopyRequestForQuote /></StrictMode>,
            '/request-for-quote-copy/:id',
        );

        await waitFor(() => expect(screen.getByTestId('rfq-created-destination')).toBeInTheDocument());
        expect(mocks.copyApplication).toHaveBeenCalledWith('RFQ-1', { applicationType: 'QuoteRequest' });
    });

    it('logs request-for-quote application creation failures', async () => {
        mocks.createApplication.mockRejectedValueOnce(new Error('create failed'));
        const CreateRequestForQuote = (await import('../../../ClientApp/src/routes/requestForQuote/create')).default;

        renderWithNavigationDestinations('/request-for-quote-create', <CreateRequestForQuote />, '/request-for-quote-create');

        await waitFor(() => expect(mocks.appLoggerError).toHaveBeenCalledWith(
            'Failed to create application',
            expect.any(Error),
        ));
        expect(screen.getByTestId('block-spinner')).toHaveTextContent('Loading...');
    });

    it('logs request-for-quote application copy failures', async () => {
        mocks.copyApplication.mockRejectedValueOnce(new Error('copy failed'));
        const CopyRequestForQuote = (await import('../../../ClientApp/src/routes/requestForQuote/copy')).default;

        renderWithNavigationDestinations('/request-for-quote-copy/RFQ-FAIL', <CopyRequestForQuote />, '/request-for-quote-copy/:id');

        await waitFor(() => expect(mocks.appLoggerError).toHaveBeenCalledWith(
            'Failed to copy application',
            expect.any(Error),
        ));
        expect(screen.getByTestId('block-spinner')).toHaveTextContent('Loading...');
    });

    it('renders request-for-quote submitted success content', async () => {
        const RequestForQuoteCreated = (await import('../../../ClientApp/src/routes/requestForQuote/created')).default;

        renderAt('/request-for-quote-success/RFQ-123', <RequestForQuoteCreated />, '/request-for-quote-success/:id');

        expect(screen.getByTestId('form-banner')).toHaveAttribute('data-ref-title', 'Ref ID: RFQ-123');
        expect(screen.getByRole('heading', { name: 'Your request has been submitted' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'short survey' })).toHaveAttribute('target', '_blank');
        expect(screen.getByTestId('go-to-dashboard-button')).toHaveAttribute('href', '/dashboard');
    });

    it('renders the submitted request-for-quote summary view after loading statuses', async () => {
        const ViewRequestForQuoteSummary = (await import('../../../ClientApp/src/routes/requestForQuote/viewRequestForQuoteSummary')).default;

        renderAt('/request-for-quote/RFQ-123/view-summary', <ViewRequestForQuoteSummary isSubmitted />, '/request-for-quote/:id/*');

        await waitFor(() => expect(screen.getByTestId('wizard-form')).toBeInTheDocument());
        expect(mocks.requestForQuoteGetStepStatuses).toHaveBeenCalledWith('RFQ-123');
        expect(screen.getByTestId('wizard-form')).toHaveAttribute('data-complete-location', '/dashboard');
        expect(screen.getByText('Request summary step')).toBeInTheDocument();
    });

    it('logs submitted request summary status loading failures', async () => {
        mocks.requestForQuoteGetStepStatuses.mockRejectedValueOnce(new Error('status failed'));
        const ViewRequestForQuoteSummary = (await import('../../../ClientApp/src/routes/requestForQuote/viewRequestForQuoteSummary')).default;

        renderAt('/request-for-quote/RFQ-FAIL/view-summary', <ViewRequestForQuoteSummary isSubmitted />, '/request-for-quote/:id/*');

        await waitFor(() => expect(mocks.appLoggerError).toHaveBeenCalledWith(
            'Failed to retrieve step statuses',
            expect.any(Error),
            { Id: 'RFQ-FAIL' },
        ));
        expect(screen.getByTestId('block-spinner')).toHaveTextContent('Loading...');
    });

    it('does not load submitted summary statuses without an account or after Strict Mode cleanup', async () => {
        mocks.msalAccounts.length = 0;
        const ViewRequestForQuoteSummary = (await import('../../../ClientApp/src/routes/requestForQuote/viewRequestForQuoteSummary')).default;

        renderAt(
            '/request-for-quote/RFQ-NO-ACCOUNT/view-summary',
            <StrictMode><ViewRequestForQuoteSummary isSubmitted /></StrictMode>,
            '/request-for-quote/:id/*',
        );

        expect(screen.getByTestId('block-spinner')).toHaveTextContent('Loading...');
        expect(mocks.requestForQuoteGetStepStatuses).not.toHaveBeenCalled();
        mocks.msalAccounts.push({ homeAccountId: 'account-1' });
    });

    it('renders the accept-quote wizard after loading quote and status details', async () => {
        const AcceptQuote = (await import('../../../ClientApp/src/routes/acceptQuote')).default;

        renderAt('/accept-quote/AQ-1/report-recipient', <AcceptQuote />, '/accept-quote/:id/*');

        await waitFor(() => expect(screen.getByTestId('wizard-form')).toBeInTheDocument());

        expect(mocks.acceptQuoteGetStepStatuses).toHaveBeenCalledWith('AQ-1');
        expect(mocks.getQuoteRequestDetails).toHaveBeenCalledWith('CRM-QUOTE-1');
        expect(screen.getByTestId('wizard-form')).toHaveAttribute('data-complete-location', '/submitted-success/AQ-1');
        expect(screen.getAllByTestId('wizard-step')).toHaveLength(4);
        expect(screen.getByText('Report recipient step')).toBeInTheDocument();
        expect(screen.getByText('Delivery and return step')).toBeInTheDocument();
        expect(screen.getByText('Payment details step')).toBeInTheDocument();
        expect(screen.getByText('Summary and accept step')).toBeInTheDocument();
    });

    it('redirects accept-quote to not found when status loading fails', async () => {
        mocks.acceptQuoteGetStepStatuses.mockRejectedValueOnce(new Error('load failed'));
        const AcceptQuote = (await import('../../../ClientApp/src/routes/acceptQuote')).default;

        renderAt('/accept-quote/AQ-2/report-recipient', <AcceptQuote />, '/accept-quote/:id/*');

        await waitFor(() => expect(screen.getByTestId('not-found')).toBeInTheDocument());
        expect(mocks.appLoggerError).toHaveBeenCalledWith(
            'Failed to load quote request details',
            expect.any(Error),
            { Id: 'AQ-2' },
        );
    });

    it('creates an accept-quote application from a quote reference before navigating into the wizard', async () => {
        const CreateAcceptQuote = (await import('../../../ClientApp/src/routes/acceptQuote/create')).default;

        renderWithNavigationDestinations(
            '/accept-quote-create/RFQ-123',
            <StrictMode><CreateAcceptQuote /></StrictMode>,
            '/accept-quote-create/:id',
        );

        await waitFor(() => expect(screen.getByTestId('accept-created-destination')).toBeInTheDocument());
        expect(mocks.getQuoteRequestDetailsByRefId).toHaveBeenCalledWith('QuoteRequest', 'RFQ-123');
        expect(mocks.createApplication).toHaveBeenCalledWith({
            applicationType: 'QuoteAccept',
            referenceId: 'CRM-QUOTE-1',
        });
    });

    it('logs accept-quote application creation failures', async () => {
        mocks.getQuoteRequestDetailsByRefId.mockRejectedValueOnce(new Error('create failed'));
        const CreateAcceptQuote = (await import('../../../ClientApp/src/routes/acceptQuote/create')).default;

        renderWithNavigationDestinations('/accept-quote-create/RFQ-FAIL', <CreateAcceptQuote />, '/accept-quote-create/:id');

        await waitFor(() => expect(mocks.appLoggerError).toHaveBeenCalledWith(
            'Failed to create an application',
            expect.any(Error),
            { Id: 'RFQ-FAIL' },
        ));
        expect(screen.getByTestId('block-spinner')).toBeInTheDocument();
    });

    it('renders submitted-success prepaid payment copy', async () => {
        const SubmittedSuccess = (await import('../../../ClientApp/src/routes/acceptQuote/submittedSuccess')).default;

        renderAt('/submitted-success/AQ-3', <SubmittedSuccess />, '/submitted-success/:id');

        expect(screen.getByTestId('form-banner')).toHaveAttribute('data-ref-title', 'Quotation ID: AQ-3');
        await waitFor(() => expect(screen.getByText('Prepayment required')).toBeInTheDocument());
        expect(mocks.getPaymentDetails).toHaveBeenCalledWith('AQ-3');
    });

    it('renders submitted-success postpaid payment copy', async () => {
        mocks.getPaymentDetails.mockResolvedValue({ acceptQuotePreInfo: { paymentTerms: 'Postpaid' } });
        const SubmittedSuccess = (await import('../../../ClientApp/src/routes/acceptQuote/submittedSuccess')).default;

        renderAt('/submitted-success/AQ-4', <SubmittedSuccess />, '/submitted-success/:id');

        await waitFor(() => expect(screen.getByText('Invoices must be paid within 30 days of NMI invoice date.')).toBeInTheDocument());
        expect(screen.queryByText('Prepayment required')).not.toBeInTheDocument();
    });

    it('logs submitted-success payment detail failures', async () => {
        mocks.getPaymentDetails.mockRejectedValueOnce(new Error('payment failed'));
        const SubmittedSuccess = (await import('../../../ClientApp/src/routes/acceptQuote/submittedSuccess')).default;

        renderAt('/submitted-success/AQ-FAIL', <SubmittedSuccess />, '/submitted-success/:id');

        await waitFor(() => expect(mocks.appLoggerError).toHaveBeenCalledWith(
            'Failed to retrieve AcceptQuotePreInfo',
            expect.any(Error),
            { Id: 'AQ-FAIL' },
        ));
    });

    it('loads quotation summary details and exposes quote actions', async () => {
        mocks.getQuoteRequestDetails.mockResolvedValueOnce({ quotationIdNum: 'Q-500' });
        const QuotationSummary = (await import('../../../ClientApp/src/routes/acceptQuote/quotationSummary')).default;

        renderAt('/quotation-summary', (
            <QuotationSummary cRMQuoteRequestId="CRM-500" isSummary={false} />
        ));

        expect(screen.getByTestId('block-spinner')).toHaveTextContent('Loading...');
        await waitFor(() => expect(screen.getByTestId('quotation-details')).toHaveTextContent('Q-500'));
        expect(mocks.getQuoteRequestDetails).toHaveBeenCalledWith('CRM-500');
        expect(screen.getByText('Quote terms')).toBeInTheDocument();
        expect(screen.getByText('Detailed quote PDF')).toBeInTheDocument();
        expect(screen.getByText('NMI contact details')).toBeInTheDocument();
    });

    it('marks quotation summary file errors when quote loading fails', async () => {
        mocks.getQuoteRequestDetails.mockRejectedValueOnce(new Error('quote failed'));
        const QuotationSummary = (await import('../../../ClientApp/src/routes/acceptQuote/quotationSummary')).default;

        renderAt('/quotation-summary', (
            <QuotationSummary cRMQuoteRequestId="CRM-FAIL" isSummary />
        ));

        await waitFor(() => expect(screen.getByTestId('quotation-details')).toHaveAttribute('data-file-error', 'true'));
        expect(screen.queryByTestId('block-spinner')).not.toBeInTheDocument();
        expect(mocks.appLoggerError).toHaveBeenCalledWith(
            'Failed to get Quotedetails: CRM-FAIL',
            expect.any(Error),
        );
    });
});
