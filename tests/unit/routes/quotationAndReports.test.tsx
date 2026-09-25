import {
    act, fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import type { AccountDetails } from '../../../ClientApp/src/authentication/accountContext';
import type * as WebApiClientModule from '../../../ClientApp/src/api/web-api-client';
import type * as MsalBrowserModule from '@azure/msal-browser';
import type * as HelperFunctionsModule from '../../../ClientApp/src/routes/common/helperFunctions';
import { QuoteStatus } from '../../../ClientApp/src/routes/common/enums';

const mocks = vi.hoisted(() => ({
    acquireTokenSilent: vi.fn(),
    setAuthToken: vi.fn(),
    getQuoteRequestDetailsByRefId: vi.fn(),
    declineQuote: vi.fn(),
    getDashboardInstrumentReports: vi.fn(),
    appLoggerError: vi.fn(),
    appLoggerVerbose: vi.fn(),
    useAccountState: vi.fn(),
    setTargetOrganisation: vi.fn(),
    getDashboardNotification: vi.fn(),
    getDashboardInfoNotification: vi.fn(),
    clearDashboardNotification: vi.fn(),
    clearDashboardInfoNotification: vi.fn(),
    setDashboardNotification: vi.fn(),
    setDashboardInfoNotification: vi.fn(),
    openInternalRouteInNewTab: vi.fn(),
    handleReportFileError: vi.fn(),
    sessionGetItem: vi.fn<() => string | null>(() => null),
    sessionRemoveItem: vi.fn(),
    msalState: {
        inProgress: 'none',
        accounts: [{ homeAccountId: 'account-1' }],
        instance: { acquireTokenSilent: vi.fn() },
    },
}));

vi.mock('@azure/msal-react', () => ({
    useMsal: () => ({
        inProgress: mocks.msalState.inProgress,
        accounts: mocks.msalState.accounts,
        instance: mocks.msalState.instance,
    }),
}));

vi.mock('@azure/msal-browser', async (importOriginal) => {
    const actual = await importOriginal<typeof MsalBrowserModule>();

    return {
        ...actual,
        InteractionStatus: { None: 'none' },
    };
});

vi.mock('../../../ClientApp/src/authentication/hooks', () => ({
    useAccountState: mocks.useAccountState,
    useAccountDispatch: () => ({ setTargetOrganisation: mocks.setTargetOrganisation }),
}));

vi.mock('../../../ClientApp/src/authentication/authConfig', () => ({
    tokenRequest: { scopes: ['scope'] },
}));

vi.mock('../../../ClientApp/src/api/web-api-client', async (importOriginal) => {
    const actual = await importOriginal<typeof WebApiClientModule>();

    return {
        ...actual,
        ApplicationType: {
            QuoteAccept: 'QuoteAccept',
            QuoteRequest: 'QuoteRequest',
        },
        QuoteClient: vi.fn(function QuoteClientMock() {
            return {
                setAuthToken: mocks.setAuthToken,
                getQuoteRequestDetailsByRefId: mocks.getQuoteRequestDetailsByRefId,
                declineQuote: mocks.declineQuote,
            };
        }),
        DashboardClient: vi.fn(function DashboardClientMock() {
            return {
                setAuthToken: mocks.setAuthToken,
                getDashboardInstrumentArtefactReportsByPortalIDAndArtefactName: mocks.getDashboardInstrumentReports,
            };
        }),
    };
});

vi.mock('../../../ClientApp/src/storage/notification', () => ({
    getDashboardNotification: mocks.getDashboardNotification,
    getDashboardInfoNotification: mocks.getDashboardInfoNotification,
    clearDashboardNotification: mocks.clearDashboardNotification,
    clearDashboardInfoNotification: mocks.clearDashboardInfoNotification,
    setDashboardNotification: mocks.setDashboardNotification,
    setDashboardInfoNotification: mocks.setDashboardInfoNotification,
}));

vi.mock('../../../ClientApp/src/storage/types', () => ({
    NotificationSeverity: {
        Error: 'error',
        Information: 'information',
    },
}));

vi.mock('../../../ClientApp/src/storage/sessionStorageCache', () => ({
    default: () => ({
        getItem: mocks.sessionGetItem,
        removeItem: mocks.sessionRemoveItem,
    }),
}));

vi.mock('../../../ClientApp/src/components/Utilities/useHtmlTitle', () => ({
    default: () => {},
}));

vi.mock('../../../ClientApp/src/components/Utilities/useBodyClass', () => ({
    default: () => {},
}));

vi.mock('../../../ClientApp/src/components/BlockUISpinner', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div data-testid="block-spinner">{children}</div>,
}));

vi.mock('../../../ClientApp/src/components/Breadcrumb', () => ({
    default: ({ breadcrumbs }: { breadcrumbs: { text: string }[] }) => <nav data-testid="breadcrumb">{breadcrumbs.map((item) => item.text).join(' > ')}</nav>,
}));

vi.mock('../../../ClientApp/src/components/HeaderIntroText', () => ({
    default: ({ children }: { children: React.ReactNode }) => <p data-testid="header-intro">{children}</p>,
}));

vi.mock('../../../ClientApp/src/components/Alert/NotificationMessage', () => ({
    default: ({ message, onClose }: { message: string; onClose: () => void }) => (
        <button type="button" data-testid="notification-message" onClick={onClose}>{message}</button>
    ),
}));

vi.mock('../../../ClientApp/src/components/modals/ConfirmationModal', () => ({
    default: ({ isOpen, titleText, onModalNo, onModalYes }: {
        isOpen: boolean;
        titleText: string;
        onModalNo: () => void;
        onModalYes: () => void;
    }) => (isOpen ? (
        <div data-testid="confirmation-modal">
            <h2>{titleText}</h2>
            <button type="button" onClick={onModalNo}>Cancel</button>
            <button type="button" onClick={onModalYes}>Decline quote</button>
        </div>
    ) : null),
}));

vi.mock('../../../ClientApp/src/components/Utilities/ViewPdfQuoteTerms', () => ({
    default: ({ prefixText, suffixText }: { prefixText?: string; suffixText?: string }) => <div data-testid="view-quote-terms">{prefixText}{suffixText}</div>,
}));

vi.mock('../../../ClientApp/src/components/Utilities/ViewPdfQuote', () => ({
    default: ({ text }: { text: string }) => <button type="button">{text}</button>,
}));

vi.mock('../../../ClientApp/src/components/Utilities/ViewMeasurementReport', () => ({
    default: ({ text }: { text: string }) => <button type="button">{text}</button>,
}));

vi.mock('../../../ClientApp/src/components/Utilities/mailingLabel', () => ({
    default: ({ quotationIdNum }: { quotationIdNum?: string }) => <div data-testid="mailing-label">{quotationIdNum}</div>,
}));

vi.mock('../../../ClientApp/src/components/Utilities/deliveryInstructions', () => ({
    default: ({ deliveryInstructions }: { deliveryInstructions?: string }) => <div data-testid="delivery-instructions">{deliveryInstructions}</div>,
}));

vi.mock('../../../ClientApp/src/components/Pill/QuoteStatusPill', () => ({
    default: ({ status }: { status: string }) => <span data-testid="quote-status-pill">{status}</span>,
}));

vi.mock('../../../ClientApp/src/components/Pill/StatusPill', () => ({
    default: ({ status }: { status: string }) => <span data-testid="status-pill">{status}</span>,
}));

vi.mock('../../../ClientApp/src/components/Pagination', () => ({
    default: ({ currentPage, totalPages, onPageChange }: {
        currentPage: number;
        totalPages: number;
        onPageChange: (page: number) => void;
    }) => (
        <button type="button" data-testid="pagination" data-total={totalPages} onClick={() => onPageChange(currentPage + 1)}>
            Page {currentPage}
        </button>
    ),
}));

vi.mock('../../../ClientApp/src/components/InTextLink', () => ({
    default: ({ children, onClick }: { children: React.ReactNode; onClick: React.MouseEventHandler<HTMLButtonElement> }) => (
        <button type="button" onClick={onClick}>{children}</button>
    ),
}));

vi.mock('../../../ClientApp/src/components/Icons/ExternalLinkIcon', () => ({
    default: () => <span data-testid="external-link-icon" />,
}));

vi.mock('../../../ClientApp/src/routes/common/openWindow', () => ({
    openInternalRouteInNewTab: mocks.openInternalRouteInNewTab,
}));

vi.mock('../../../ClientApp/src/routes/common/helperFunctions', async (importOriginal) => {
    const actual = await importOriginal<typeof HelperFunctionsModule>();

    return {
        ...actual,
        handleReportFileError: mocks.handleReportFileError,
    };
});

vi.mock('../../../ClientApp/src/instrumentation/AppLogger', () => ({
    default: {
        error: mocks.appLoggerError,
        verbose: mocks.appLoggerVerbose,
    },
}));

const accountDetails = {
    givenName: 'Alex',
    familyName: 'Tester',
    abn: '12345678901',
    organisation: 'National Measurement Institute',
    organisationCRMGuid: 'ORG-CRM-1',
    targetOrganisation: {
        targetOrganisationAbn: '12345678901',
        targetOrganisationName: 'NMI',
    },
} as AccountDetails;

const quoteDetails: WebApiClientModule.RequestForQuoteDetails = {
    quoteRequestIdNum: 'RFQ-100',
    quotationIdNum: 'Q-100',
    crmQuoteRequestId: 'CRM-QUOTE-1',
    quoteRequestStatus: 'Quote offer is available',
    quotationOfferDate: new Date('2026-06-01T00:00:00Z'),
    quotationValidUntil: new Date('2026-07-01T00:00:00Z'),
    dateInstrumentRequiredNMI: new Date('2026-06-20T00:00:00Z'),
    targetDateMesurementReport: new Date('2026-07-20T00:00:00Z'),
    serialNumber: 'SN-1',
    manufacturer: 'NMI Maker',
    model: 'Model 1',
    description: 'Test instrument',
    instrumentArtefactToBeCalibrated: 'Calibrated balance',
    servicesOffered: 'Calibration',
    measurementReportCertificateRequired: 'Measurement report only',
    specialConditions: 'Handle carefully',
    feePayableAmount: 1234.5,
    nmiFacilityDeliveryInstructions: 'Deliver to dock A',
    nmiTestOfficerName: 'NMI Officer',
    nmiTestOfficerPhone: '02 0000 0000',
    nmiTestOfficerEmail: 'officer@example.test',
    nmiFacilityName: 'NMI Lindfield',
    nmiFacilityAddress: '36 Bradfield Road',
    report: {
        reportId: 'RPT-100',
        dateIssued: new Date('2026-07-25T00:00:00Z'),
        invoiceNumber: 'INV-100',
        dateDispatched: new Date('2026-07-26T00:00:00Z'),
        consignmentNote: 'CON-100',
    },
    returnContactName: 'Return Contact',
    returnContactEmail: 'return@example.test',
    returnOrganisationName: 'Return Org',
    returnAddressLine1: '1 Return Street',
    returnAddressLine2: 'Level 2',
    returnAddressLine3: 'Dock',
    returnAddressSuburb: 'Canberra',
    returnAddressState: 'ACT',
    returnAddressPostcode: '2600',
    returnMethod: 'Courier',
    carrierName: 'Carrier Co',
    carrierShipRef: 'SHIP-1',
    carrierContactName: 'Carrier Contact',
    carrierContactPhone: '02 1111 1111',
};

const renderRoute = (initialPath: string, element: React.ReactNode, routePath: string) => render(
    <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
            <Route path={routePath} element={element} />
            <Route path="/not-found" element={<div data-testid="not-found" />} />
            <Route path="/" element={<div data-testid="dashboard-route" />} />
        </Routes>
    </MemoryRouter>,
);

const settleQuotationEffects = async () => {
    await waitFor(() => expect(mocks.getQuoteRequestDetailsByRefId).toHaveBeenCalled());
    await act(async () => {
        await Promise.resolve();
    });
};

describe('quotation and measurement report routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
        mocks.msalState.instance.acquireTokenSilent = mocks.acquireTokenSilent;
        mocks.msalState.inProgress = 'none';
        mocks.msalState.accounts.splice(0, mocks.msalState.accounts.length, { homeAccountId: 'account-1' });
        mocks.useAccountState.mockReturnValue({ details: accountDetails });
        mocks.getDashboardNotification.mockReturnValue({ message: 'Dashboard notification', severity: 'info' });
        mocks.getDashboardInfoNotification.mockReturnValue({ message: 'Info notification', severity: 'info' });
        mocks.getQuoteRequestDetailsByRefId.mockResolvedValue({ ...quoteDetails });
        mocks.declineQuote.mockResolvedValue(undefined);
        mocks.sessionGetItem.mockReturnValue(null);
        mocks.getDashboardInstrumentReports.mockResolvedValue({
            currentPage: 1,
            totalPages: 2,
            items: [
                {
                    tmasTcReportName: 'RPT-100',
                    tmasTcReportDate: '2026-07-25',
                    tmasMeasurementReportCertificateRequired: 'Measurement report only',
                    tmasMeasurementCategoryName: 'Mass',
                    tmasStatus: 'Report available',
                    tmasTcQuoteName: 'AQ-100',
                    tmasPortalRequestId: 'RFQ-100',
                },
                {
                    tmasTcReportName: 'RPT-101',
                    tmasStatus: 'Withdrawn',
                    tmasPortalRequestId: 'RFQ-101',
                },
            ],
        });
    });

    it('loads quotation details and declines a quote through the confirmation modal', async () => {
        const Quotation = (await import('../../../ClientApp/src/routes/quotation')).default;

        renderRoute('/quotation/RFQ-100', <Quotation />, '/quotation/:id');

        await waitFor(() => expect(screen.getByRole('heading', { name: 'Quotation' })).toBeInTheDocument());
        expect(screen.getAllByText('Q-100').length).toBeGreaterThan(0);
        expect(screen.getByTestId('view-quote-terms')).toHaveTextContent('clause 11');

        fireEvent.click(screen.getByTestId('decline-button'));
        fireEvent.click(screen.getAllByRole('button', { name: 'Decline quote' }).at(-1)!);

        await waitFor(() => expect(mocks.declineQuote).toHaveBeenCalledWith('CRM-QUOTE-1', 'Alex', 'Tester'));
        expect(screen.getByTestId('dashboard-route')).toBeInTheDocument();
    });

    it('shows a file error notification when declining a quote fails', async () => {
        mocks.declineQuote.mockRejectedValueOnce(new Error('decline failed'));
        const Quotation = (await import('../../../ClientApp/src/routes/quotation')).default;

        renderRoute('/quotation/RFQ-100', <Quotation />, '/quotation/:id');

        await waitFor(() => expect(screen.getByTestId('decline-button')).toBeInTheDocument());
        fireEvent.click(screen.getByTestId('decline-button'));
        fireEvent.click(screen.getAllByRole('button', { name: 'Decline quote' }).at(-1)!);

        await waitFor(() => expect(mocks.appLoggerError).toHaveBeenCalledWith(
            'Failed to decline quote',
            expect.any(Error),
            { Id: 'RFQ-100' },
        ));
        expect(mocks.setDashboardNotification).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining('downloading the PDF quote'),
        }));
    });

    it('closes the decline confirmation without submitting', async () => {
        const Quotation = (await import('../../../ClientApp/src/routes/quotation')).default;
        renderRoute('/quotation/RFQ-100', <Quotation />, '/quotation/:id');

        fireEvent.click(await screen.findByTestId('decline-button'));
        await settleQuotationEffects();
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument();
        expect(mocks.declineQuote).not.toHaveBeenCalled();
    });

    it('normalises a newly accepted quotation from session storage', async () => {
        mocks.sessionGetItem.mockReturnValue('RFQ-100');
        const quotation = { ...quoteDetails, quoteRequestStatus: 'Quote - Available' };
        mocks.getQuoteRequestDetailsByRefId.mockResolvedValueOnce(quotation);
        const Quotation = (await import('../../../ClientApp/src/routes/quotation')).default;

        renderRoute('/quotation/RFQ-100', <Quotation />, '/quotation/:id');

        await waitFor(() => expect(quotation.quoteRequestStatus).toBe('Quote - Accepted'));
        expect(quotation.outcomeDate).toBeInstanceOf(Date);
        expect(mocks.sessionRemoveItem).toHaveBeenCalledWith('view-quote-id');
    });

    it('removes the session storage ID but leaves the status unchanged when IDs do not match', async () => {
        mocks.sessionGetItem.mockReturnValue('RFQ-OTHER');
        const quotation = { ...quoteDetails, quoteRequestStatus: 'Quote - Available' };
        mocks.getQuoteRequestDetailsByRefId.mockResolvedValueOnce(quotation);
        const Quotation = (await import('../../../ClientApp/src/routes/quotation')).default;

        renderRoute('/quotation/RFQ-100', <Quotation />, '/quotation/:id');

        await waitFor(() => expect(mocks.sessionRemoveItem).toHaveBeenCalledWith('view-quote-id'));
        // Status is NOT mutated because the IDs don't match
        expect(quotation.quoteRequestStatus).toBe('Quote - Available');
    });

    it('ignores a resolved load response after the quotation component unmounts', async () => {
        let resolveLoad!: (value: any) => void;
        mocks.getQuoteRequestDetailsByRefId.mockReturnValueOnce(
            new Promise((resolve) => { resolveLoad = resolve; }),
        );
        const Quotation = (await import('../../../ClientApp/src/routes/quotation')).default;
        const { unmount } = renderRoute('/quotation/RFQ-100', <Quotation />, '/quotation/:id');

        unmount();
        resolveLoad({ ...quoteDetails });
        await Promise.resolve();

        // After unmount setQuotationData is not called; no navigation or error state changes
        expect(mocks.appLoggerError).not.toHaveBeenCalled();
    });

    it('ignores a rejected load response after the quotation component unmounts', async () => {
        let rejectLoad!: (reason: any) => void;
        mocks.getQuoteRequestDetailsByRefId.mockReturnValueOnce(
            new Promise((_, reject) => { rejectLoad = reject; }),
        );
        const Quotation = (await import('../../../ClientApp/src/routes/quotation')).default;
        const { unmount } = renderRoute('/quotation/RFQ-100', <Quotation />, '/quotation/:id');

        unmount();
        rejectLoad(new Error('stale error'));
        await Promise.resolve();

        // navigate('/not-found') is NOT called because isActive is false
        expect(screen.queryByTestId('not-found')).not.toBeInTheDocument();
    });

    it('navigates quotation to not found when detail loading fails', async () => {
        mocks.getQuoteRequestDetailsByRefId.mockRejectedValueOnce(new Error('load failed'));
        const Quotation = (await import('../../../ClientApp/src/routes/quotation')).default;

        renderRoute('/quotation/RFQ-404', <Quotation />, '/quotation/:id');

        await waitFor(() => expect(screen.getByTestId('not-found')).toBeInTheDocument());
        expect(mocks.setDashboardNotification).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('renders quote details notification, view-request action, and no-delivery branch', async () => {
        const QuoteDetails = (await import('../../../ClientApp/src/routes/quotation/quoteDetails')).default;

        render(
            <MemoryRouter>
                <QuoteDetails
                    quotationData={{ ...quoteDetails, receiptandDispatchNA: true }}
                    isSummary={false}
                    firstName="Alex"
                    lastName="Tester"
                    fileError
                />
            </MemoryRouter>,
        );

        expect(screen.getAllByTestId('notification-message')[0]).toHaveTextContent('Dashboard notification');
        expect(screen.getByText(/does not require the delivery or return/)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /View request/i }));
        expect(mocks.openInternalRouteInNewTab).toHaveBeenCalledWith('/request-for-quote/RFQ-100/view-summary');
    });

    it('loads a measurement report route and renders report PDF action', async () => {
        const MeasurementReport = (await import('../../../ClientApp/src/routes/measurementReport')).default;

        renderRoute('/report/AQ-100', <MeasurementReport />, '/report/:id');

        await waitFor(() => expect(screen.getByRole('heading', { name: 'Report' })).toBeInTheDocument());
        expect(screen.getByText('RPT-100')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'View report PDF' })).toBeInTheDocument();
        expect(screen.getByTestId('go-to-dashboard-button')).toHaveAttribute('href', '/dashboard');
    });

    it('navigates measurement report to not found when loading fails', async () => {
        mocks.getQuoteRequestDetailsByRefId.mockRejectedValueOnce(new Error('load failed'));
        const MeasurementReport = (await import('../../../ClientApp/src/routes/measurementReport')).default;

        renderRoute('/report/AQ-404', <MeasurementReport />, '/report/:id');

        await waitFor(() => expect(screen.getByTestId('not-found')).toBeInTheDocument());
        expect(mocks.handleReportFileError).toHaveBeenCalled();
    });

    it('waits to load measurement reports until account and MSAL prerequisites are available', async () => {
        mocks.getDashboardNotification.mockReturnValue(null);
        mocks.getDashboardInfoNotification.mockReturnValue(null);
        mocks.useAccountState.mockReturnValue(undefined);
        const MeasurementReport = (await import('../../../ClientApp/src/routes/measurementReport')).default;
        const { unmount } = renderRoute('/report/AQ-100', <MeasurementReport />, '/report/:id');

        expect(screen.queryByTestId('notification-message')).not.toBeInTheDocument();
        expect(mocks.getQuoteRequestDetailsByRefId).not.toHaveBeenCalled();
        unmount();

        mocks.useAccountState.mockReturnValue({ details: accountDetails });
        mocks.msalState.inProgress = 'login';
        renderRoute('/report/AQ-100', <MeasurementReport />, '/report/:id');

        expect(mocks.getQuoteRequestDetailsByRefId).not.toHaveBeenCalled();
    });

    it('loads measurement report history and updates pagination', async () => {
        const InstrMeasurementReport = (await import('../../../ClientApp/src/routes/measurementReport/indexList')).default;

        renderRoute('/reports/Balance', <InstrMeasurementReport />, '/reports/:id');

        await waitFor(() => expect(screen.getByText('RPT-100')).toBeInTheDocument());
        expect(screen.getByRole('link', { name: 'View report' })).toHaveAttribute('href', '/report/AQ-100');
        expect(screen.getAllByRole('link', { name: 'Request recalibration for this instrument/artefact' })[0]).toHaveAttribute('href', '/request-for-quote-copy/RFQ-100');

        fireEvent.click(screen.getByTestId('pagination'));

        await waitFor(() => expect(mocks.getDashboardInstrumentReports).toHaveBeenLastCalledWith('ORG-CRM-1', 'Balance', 10, 2));
    });

    it('handles measurement report history load failures', async () => {
        mocks.getDashboardInstrumentReports.mockRejectedValueOnce(new Error('history failed'));
        const InstrMeasurementReport = (await import('../../../ClientApp/src/routes/measurementReport/indexList')).default;

        renderRoute('/reports/Balance', <InstrMeasurementReport />, '/reports/:id');

        await waitFor(() => expect(mocks.handleReportFileError).toHaveBeenCalled());
        expect(mocks.appLoggerError).toHaveBeenCalledWith(
            'Failed to get Measurement report data',
            expect.any(Error),
            { Id: 'Balance' },
        );
    });

    it('waits to load report history until organisation and MSAL prerequisites are available', async () => {
        mocks.useAccountState.mockReturnValue({ details: { ...accountDetails, organisationCRMGuid: undefined } });
        const InstrMeasurementReport = (await import('../../../ClientApp/src/routes/measurementReport/indexList')).default;
        const { unmount } = renderRoute('/reports/Balance', <InstrMeasurementReport />, '/reports/:id');

        expect(mocks.getDashboardInstrumentReports).not.toHaveBeenCalled();
        unmount();

        mocks.useAccountState.mockReturnValue({ details: accountDetails });
        mocks.msalState.inProgress = 'login';
        renderRoute('/reports/Balance', <InstrMeasurementReport />, '/reports/:id');

        expect(mocks.getDashboardInstrumentReports).not.toHaveBeenCalled();
    });

    it('renders report details notification and view-request action', async () => {
        const ReportDetails = (await import('../../../ClientApp/src/routes/measurementReport/reportDetails')).default;

        render(
            <MemoryRouter>
                <ReportDetails reportData={quoteDetails} fileError />
            </MemoryRouter>,
        );

        expect(screen.getByTestId('notification-message')).toHaveTextContent('Dashboard notification');
        expect(screen.getByText('RPT-100')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'return@example.test' })).toHaveAttribute('href', 'mailto:return@example.test');
        fireEvent.click(screen.getByRole('button', { name: /View request/i }));
        expect(mocks.openInternalRouteInNewTab).toHaveBeenCalledWith('/request-for-quote/RFQ-100/view-summary');
    });

    it('renders sparse quote details in summary mode without optional notifications or request links', async () => {
        mocks.getDashboardNotification.mockReturnValue(null);
        const QuoteDetails = (await import('../../../ClientApp/src/routes/quotation/quoteDetails')).default;

        render(
            <MemoryRouter>
                <QuoteDetails
                    quotationData={{
                        quoteRequestStatus: 'Unknown status',
                        receiptandDispatchNA: false,
                    }}
                    isSummary
                    fileError
                    firstName={undefined}
                    lastName={undefined}
                />
            </MemoryRouter>,
        );

        expect(screen.queryByTestId('notification-message')).not.toBeInTheDocument();
        expect(screen.queryByTestId('quote-status-pill')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /View request/i }));
        expect(mocks.openInternalRouteInNewTab).not.toHaveBeenCalled();
    });

    it('renders summary no-delivery details and valid quote status outcomes', async () => {
        const QuoteDetails = (await import('../../../ClientApp/src/routes/quotation/quoteDetails')).default;
        const { unmount } = render(
            <MemoryRouter>
                <QuoteDetails
                    quotationData={{
                        ...quoteDetails,
                        quoteRequestStatus: QuoteStatus.QuoteAccepted,
                        outcomeDate: new Date('2026-06-10T00:00:00Z'),
                        receiptandDispatchNA: true,
                    }}
                    isSummary
                    firstName="Alex"
                    lastName="Tester"
                    fileError={false}
                />
            </MemoryRouter>,
        );

        expect(screen.getByText(/does not require the delivery or return/)).toBeInTheDocument();
        expect(screen.getByTestId('quote-status-pill')).toHaveTextContent(QuoteStatus.QuoteAccepted);
        expect(screen.getByText('10 Jun 2026')).toBeInTheDocument();
        unmount();

        render(
            <MemoryRouter>
                <QuoteDetails
                    quotationData={{
                        quoteRequestStatus: QuoteStatus.QuoteAvailable,
                        receiptandDispatchNA: false,
                    }}
                    isSummary={false}
                    firstName="Alex"
                    lastName="Tester"
                    fileError={false}
                />
            </MemoryRouter>,
        );

        expect(screen.getByTestId('info-summary')).toBeInTheDocument();
        expect(screen.queryByTestId('quote-status-pill')).not.toBeInTheDocument();
    });

    it('renders sparse report details without a notification or request id', async () => {
        mocks.getDashboardNotification.mockReturnValue(null);
        const ReportDetails = (await import('../../../ClientApp/src/routes/measurementReport/reportDetails')).default;

        render(
            <MemoryRouter>
                <ReportDetails reportData={undefined} fileError />
            </MemoryRouter>,
        );

        expect(screen.queryByTestId('notification-message')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /View request/i }));
        expect(mocks.openInternalRouteInNewTab).not.toHaveBeenCalled();
    });

    it('renders quotation without dashboard notifications and skips decline when CRM id is absent', async () => {
        mocks.getDashboardNotification.mockReturnValue(null);
        mocks.getDashboardInfoNotification.mockReturnValue(null);
        mocks.getQuoteRequestDetailsByRefId.mockResolvedValue({
            ...quoteDetails,
            crmQuoteRequestId: undefined,
            quoteRequestStatus: 'Draft',
        });
        const Quotation = (await import('../../../ClientApp/src/routes/quotation')).default;

        renderRoute('/quotation/RFQ-100', <Quotation />, '/quotation/:id');

        fireEvent.click(await screen.findByTestId('decline-button'));
        fireEvent.click(screen.getAllByRole('button', { name: 'Decline quote' }).at(-1)!);

        await waitFor(() => expect(screen.queryByTestId('confirmation-modal')).toBeInTheDocument());
        expect(mocks.declineQuote).not.toHaveBeenCalled();
    });

    it('handles quotation prerequisite alternatives and shows the accepted-status back action', async () => {
        mocks.useAccountState.mockReturnValue({
            details: { ...accountDetails, targetOrganisation: undefined },
        });
        mocks.getQuoteRequestDetailsByRefId.mockResolvedValue({
            ...quoteDetails,
            quoteRequestStatus: QuoteStatus.QuoteAccepted,
        });
        const Quotation = (await import('../../../ClientApp/src/routes/quotation')).default;
        const { unmount } = renderRoute('/quotation/RFQ-100', <Quotation />, '/quotation/:id');

        expect(await screen.findByTestId('back-button')).toHaveAttribute('href', '/dashboard');
        await settleQuotationEffects();
        unmount();

        mocks.useAccountState.mockReturnValue({ details: accountDetails });
        mocks.msalState.accounts.length = 0;
        renderRoute('/quotation/RFQ-100', <Quotation />, '/quotation/:id');

        await settleQuotationEffects();
        expect(screen.getByRole('heading', { name: 'Quotation' })).toBeInTheDocument();
    });
});
