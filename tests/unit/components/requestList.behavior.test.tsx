import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import InstrumentItem from '@/components/RequestList/instrumentItem';
import NoRequests from '@/components/RequestList/noRequests';
import RequestItem from '@/components/RequestList/requestItem';
import { ModalDispatchCtx } from '@/components/modals/ModalContext';
import type { DashboardItemDto } from '@/api/web-api-client';
import { DashboardItemStatus, ReportStatus } from '@/routes/common/enums';
import { trackGAEvent } from '@/analytics/GoogleAnalytics';

vi.mock('@/analytics/GoogleAnalytics', () => ({
    trackGAEvent: vi.fn(),
}));

const modalDispatch = {
    setShowBranchSelector: vi.fn(),
    setShowRFQDeleteModal: vi.fn(),
    setShowRFQSelectModal: vi.fn(),
};

const LocationDisplay = () => {
    const location = useLocation();
    return <output aria-label='Current route'>{location.pathname}</output>;
};

const renderInDashboardList = (children: React.ReactNode) => render(
    <MemoryRouter initialEntries={['/dashboard']}>
        <ModalDispatchCtx.Provider value={modalDispatch}>
            <ul>{children}</ul>
            <LocationDisplay />
        </ModalDispatchCtx.Provider>
    </MemoryRouter>,
);

const baseRequest: DashboardItemDto = {
    referenceId: 'RFQ-2023-009012',
    status: DashboardItemStatus.ReportIssued,
    requestedFor: 'Storybook Organisation',
    lastUpdated: new Date('2023-11-28'),
    requestForQuote: {
        id: 3,
        manufacturer: 'Mettler Toledo',
        model: 'XPE205',
        serialNumber: 'B123456789',
        measurementCategory: 'Mass',
        artefactType: 'Analytical Balance',
        requestSubmitted: new Date('2023-09-01'),
        contactDetails: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            businessPhone: '02 1234 5678',
        },
        hideFromDashboard: false,
    },
    quote: {
        quotationId: 'Q-2023-007777',
        artefactName: 'Mettler Toledo XPE205 Analytical Balance',
        dateRequired: new Date('2023-09-15'),
        offerDate: new Date('2023-09-10'),
        validUntil: new Date('2023-11-10'),
        nmiContactDetails: {
            firstName: 'NMI',
            lastName: 'Officer',
            email: 'nmi@industry.gov.au',
            businessPhone: '02 6213 6800',
        },
    },
    report: {
        reportId: 'NMI/T/C/12345',
        invoiceNumber: 'INV-2023-009012',
        dateRequired: new Date('2023-09-15'),
        dateReceived: new Date('2023-09-16'),
        dateIssued: new Date('2023-11-25'),
        targetReportDate: new Date('2023-11-28'),
        returnMethod: 'Courier',
        dateDispatched: new Date('2023-11-28'),
        carrier: 'TNT',
        consignmentNote: 'CON123456789',
    },
};

const instrumentRequest: DashboardItemDto = {
    ...baseRequest,
    artefact: {
        tmasArtefactName: 'Mettler Toledo XPE205',
        tmasTcReportName: 'RPT-2023-12345',
        tmasTcReportDate: new Date('2023-11-25'),
        tmasMeasurementReportCertificateRequired: 'Measurement report only',
        tmasMeasurementCategoryName: 'Mass',
        tmasStatus: ReportStatus.Issued,
    },
};

describe('RequestList behavior', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the no requests empty state with a create request link', () => {
        render(
            <MemoryRouter>
                <NoRequests />
            </MemoryRouter>,
        );

        expect(screen.getByText(/you currently have no requests/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'new request' })).toHaveAttribute('href', '/services-we-offer');
    });

    it('renders RequestItem report details and navigates from the report action button', async () => {
        const user = userEvent.setup();
        renderInDashboardList(<RequestItem request={baseRequest} />);

        expect(screen.getByRole('heading', { name: /mettler toledo xpe205 analytical balance/i })).toBeInTheDocument();
        expect(screen.getByText('RFQ-2023-009012')).toBeInTheDocument();
        expect(screen.getByText(DashboardItemStatus.ReportIssued)).toBeInTheDocument();
        expect(screen.getByText('INV-2023-009012')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'View report' }));

        expect(screen.getByRole('status', { name: 'Current route' })).toHaveTextContent('/report/Q-2023-007777');
        expect(screen.getByRole('link', { name: 'Request recalibration' }))
            .toHaveAttribute('href', '/request-for-quote-copy/RFQ-2023-009012');

        await user.click(screen.getByRole('button', { name: 'Actions' }));
        await user.click(await screen.findByRole('link', { name: 'View report' }));
        expect(trackGAEvent).toHaveBeenCalledWith('Viewreport');
    });

    it('runs RequestItem tab and issued-report action callbacks', async () => {
        const user = userEvent.setup();
        renderInDashboardList(<RequestItem request={baseRequest} />);

        await user.click(screen.getByRole('tab', { name: 'Request' }));
        await user.click(screen.getByRole('tab', { name: 'Quotation' }));
        await user.click(screen.getByRole('tab', { name: 'Report' }));

        await user.click(screen.getByRole('button', { name: 'Actions' }));
        const viewRequest = await screen.findByRole('link', { name: 'View request' });
        const recalibration = screen.getAllByRole('link', { name: 'Request recalibration' })[0];
        await user.click(viewRequest);
        await user.click(recalibration);

        expect(trackGAEvent).toHaveBeenCalledWith('Requestitem/requesttab');
        expect(trackGAEvent).toHaveBeenCalledWith('Requestitem/quotationtab');
        expect(trackGAEvent).toHaveBeenCalledWith('Requestitem/reporttab');
        expect(trackGAEvent).toHaveBeenCalledWith('Viewrequest');
        expect(trackGAEvent).toHaveBeenCalledWith('Requestrecalibration');
    });

    it('renders RequestItem quote-available details and navigates by reference id', async () => {
        const user = userEvent.setup();
        renderInDashboardList(
            <RequestItem
                request={{
                    ...baseRequest,
                    status: DashboardItemStatus.QuoteAvailable,
                    report: undefined,
                }}
            />,
        );

        expect(screen.getByRole('heading', { name: /mettler toledo xpe205/i })).toBeInTheDocument();
        expect(screen.getByText('Q-2023-007777')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'View quotation' }));

        expect(screen.getByRole('status', { name: 'Current route' })).toHaveTextContent('/quotation/RFQ-2023-009012');

        await user.click(screen.getByRole('button', { name: 'Actions' }));
        expect(await screen.findByRole('link', { name: 'View/accept quotation' }))
            .toHaveAttribute('href', '/quotation/RFQ-2023-009012');
        expect(screen.getByRole('link', { name: 'View request' }))
            .toHaveAttribute('href', '/request-for-quote/RFQ-2023-009012/view-summary');
        await user.click(screen.getByRole('link', { name: 'View/accept quotation' }));
        expect(trackGAEvent).toHaveBeenCalledWith('View/acceptquotation');
    });

    it('renders RequestItem accepted quote navigation by quotation id and clone tooltip', async () => {
        const user = userEvent.setup();
        renderInDashboardList(
            <RequestItem
                request={{
                    ...baseRequest,
                    status: DashboardItemStatus.QuoteAccepted,
                    report: undefined,
                    sourceReferenceId: 'RFQ-2022-000001',
                    requestForQuote: {
                        ...baseRequest.requestForQuote,
                        isClone: true,
                        isClonedFromRef: 'RFQ-2022-000001',
                        clonedReferenceIds: ['RFQ-2022-000002', 'RFQ-2022-000003'],
                    },
                }}
            />,
        );

        expect(screen.getByRole('tooltip')).toHaveTextContent('RFQ-2022-000001');
        expect(screen.getByLabelText('Info note: This request was copied from previous Ref ID RFQ-2022-000001')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'View quotation' }));

        expect(screen.getByRole('status', { name: 'Current route' })).toHaveTextContent('/quotation/Q-2023-007777');
        await user.click(screen.getByRole('button', { name: 'Actions' }));
        await user.click(await screen.findByRole('link', { name: 'View quotation' }));
        expect(trackGAEvent).toHaveBeenCalledWith('Viewquotation');
    });

    it('renders withdrawn RequestItem report content and runs every withdrawn action', async () => {
        const user = userEvent.setup();
        renderInDashboardList(
            <RequestItem
                request={{
                    ...baseRequest,
                    status: DashboardItemStatus.ReportWithdrawn,
                }}
            />,
        );

        expect(screen.queryByRole('button', { name: 'View report' })).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Request recalibration' }))
            .toHaveAttribute('href', '/request-for-quote-copy/RFQ-2023-009012');

        await user.click(screen.getByRole('button', { name: 'Actions' }));
        await user.click(await screen.findByRole('link', { name: 'View request' }));
        await user.click(screen.getAllByRole('link', { name: 'Request recalibration' })[0]);
        await user.click(screen.getByRole('link', { name: 'View quotation' }));

        expect(trackGAEvent).toHaveBeenCalledWith('Viewrequest');
        expect(trackGAEvent).toHaveBeenCalledWith('Requestrecalibration');
        expect(trackGAEvent).toHaveBeenCalledWith('Viewquotation');
    });

    it('renders sparse RequestItem content and the default non-draft action', async () => {
        const user = userEvent.setup();
        renderInDashboardList(
            <RequestItem
                request={{
                    ...baseRequest,
                    status: DashboardItemStatus.QuoteSubmitted,
                    lastUpdated: undefined,
                    quote: undefined,
                    report: undefined,
                    requestForQuote: {
                        ...baseRequest.requestForQuote,
                        serialNumber: undefined,
                        description: 'Handle with care',
                        requestSubmitted: undefined,
                        contactDetails: {
                            firstName: 'Mobile',
                            lastName: 'Contact',
                            mobilePhone: '0400 000 000',
                        },
                    },
                }}
            />,
        );

        expect(screen.getByText('Handle with care')).toBeInTheDocument();
        expect(screen.getByText('0400 000 000')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Actions' }));
        expect(await screen.findByRole('link', { name: 'View request' }))
            .toHaveAttribute('href', '/request-for-quote/RFQ-2023-009012/view-summary');
    });

    it('opens draft RequestItem actions and dispatches the delete modal', async () => {
        const user = userEvent.setup();
        renderInDashboardList(
            <RequestItem
                request={{
                    ...baseRequest,
                    status: DashboardItemStatus.QuoteDrafted,
                    quote: undefined,
                    report: undefined,
                }}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Actions' }));
        const editRequest = await screen.findByRole('link', { name: 'Edit request' });
        expect(editRequest).toHaveAttribute(
            'href',
            '/request-for-quote/RFQ-2023-009012/instrument-and-request',
        );
        await user.click(editRequest);
        expect(trackGAEvent).toHaveBeenCalledWith('Editrequest');
        await user.click(screen.getByRole('button', { name: 'Actions' }));
        await user.click(await screen.findByRole('button', { name: 'Delete request' }));

        expect(modalDispatch.setShowRFQDeleteModal).toHaveBeenCalledWith(true, 'RFQ-2023-009012');
        expect(trackGAEvent).toHaveBeenCalledWith('Deleterequest');
    });

    it('renders RequestItem draft fallback heading when manufacturer is absent', async () => {
        const user = userEvent.setup();
        renderInDashboardList(
            <RequestItem
                request={{
                    ...baseRequest,
                    status: DashboardItemStatus.QuoteDrafted,
                    quote: undefined,
                    report: undefined,
                    requestForQuote: {
                        ...baseRequest.requestForQuote,
                        manufacturer: undefined,
                        model: undefined,
                        serialNumber: undefined,
                        description: undefined,
                    },
                }}
            />,
        );

        expect(screen.getByRole('heading', { name: /draft request for quote/i })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Actions' }));
        expect(await screen.findByRole('link', { name: 'Edit request' }))
            .toHaveAttribute(
                'href',
                '/request-for-quote/RFQ-2023-009012/instrument-and-request',
            );
    });

    it('renders RequestItem headings when the model or artefact name is absent', () => {
        const { unmount } = renderInDashboardList(
            <RequestItem
                request={{
                    ...baseRequest,
                    status: DashboardItemStatus.QuoteDrafted,
                    quote: undefined,
                    requestForQuote: {
                        ...baseRequest.requestForQuote,
                        model: undefined,
                    },
                }}
            />,
        );

        expect(screen.getByRole('heading', { name: 'Mettler Toledo' })).toBeInTheDocument();
        unmount();

        renderInDashboardList(
            <RequestItem
                request={{
                    ...baseRequest,
                    status: DashboardItemStatus.ReportIssued,
                    quote: {
                        ...baseRequest.quote,
                        artefactName: undefined,
                    },
                }}
            />,
        );

        expect(screen.getByRole('heading', { name: 'Draft request for Quote' })).toBeInTheDocument();
    });

    it('does not render a RequestItem card when the item is hidden from the dashboard', () => {
        renderInDashboardList(
            <RequestItem
                request={{
                    ...baseRequest,
                    requestForQuote: {
                        ...baseRequest.requestForQuote,
                        hideFromDashboard: true,
                    },
                }}
            />,
        );

        expect(screen.queryByRole('heading', { name: /mettler toledo xpe205 analytical balance/i })).not.toBeInTheDocument();
        expect(screen.queryByText('RFQ-2023-009012')).not.toBeInTheDocument();
    });

    it('renders InstrumentItem report history links and navigates from the latest report button', async () => {
        const user = userEvent.setup();
        renderInDashboardList(<InstrumentItem request={instrumentRequest} />);

        expect(screen.getByRole('heading', { name: 'Mettler Toledo XPE205' })).toBeInTheDocument();
        expect(screen.getAllByText('RPT-2023-12345')[0]).toBeInTheDocument();
        expect(screen.getByText('Measurement report only')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'View all reports for this instrument/artefact' }))
            .toHaveAttribute('href', '/instrument-reports/Mettler%20Toledo%20XPE205');

        await user.click(screen.getByRole('button', { name: 'View latest report' }));

        expect(screen.getByRole('status', { name: 'Current route' })).toHaveTextContent('/report/Q-2023-007777');
    });

    it('runs InstrumentItem tab and issued-report action callbacks', async () => {
        const user = userEvent.setup();
        renderInDashboardList(<InstrumentItem request={instrumentRequest} />);

        await user.click(screen.getByRole('tab', { name: 'Details' }));
        await user.click(screen.getByRole('tab', { name: 'Reports' }));

        await user.click(screen.getByRole('button', { name: 'Actions' }));
        const latestReport = (await screen.findAllByRole('link', { name: 'View latest report' }))[0];
        const recalibration = screen.getAllByRole('link', { name: 'Request recalibration' })[0];
        await user.click(latestReport);
        await user.click(recalibration);

        expect(trackGAEvent).toHaveBeenCalledWith('View latest report');
        expect(trackGAEvent).toHaveBeenCalledWith('Request recalibration');
    });

    it('hides InstrumentItem latest report actions for withdrawn reports but keeps recalibration available', () => {
        renderInDashboardList(
            <InstrumentItem
                request={{
                    ...instrumentRequest,
                    status: DashboardItemStatus.ReportWithdrawn,
                    artefact: {
                        ...instrumentRequest.artefact,
                        tmasStatus: ReportStatus.Withdrawn,
                    },
                }}
            />,
        );

        expect(screen.queryByRole('link', { name: 'View latest report' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'View latest report' })).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Request recalibration' }))
            .toHaveAttribute('href', '/request-for-quote-copy/RFQ-2023-009012');
    });

    it('renders InstrumentItem draft and quote-available action states', async () => {
        const user = userEvent.setup();
        const { unmount } = renderInDashboardList(
            <InstrumentItem
                request={{
                    ...instrumentRequest,
                    status: DashboardItemStatus.QuoteDrafted,
                    artefact: undefined,
                    quote: undefined,
                    requestForQuote: {
                        ...instrumentRequest.requestForQuote,
                        manufacturer: undefined,
                        model: undefined,
                    },
                }}
            />,
        );

        expect(screen.getByRole('heading', { name: 'Draft Request For Quote' })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Actions' }));
        await user.click(await screen.findByRole('link', { name: 'Edit request' }));
        expect(trackGAEvent).toHaveBeenCalledWith('Edit request');
        await user.click(screen.getByRole('button', { name: 'Actions' }));
        await user.click(await screen.findByRole('button', { name: 'Delete request' }));
        expect(modalDispatch.setShowRFQDeleteModal).toHaveBeenCalledWith(true, 'RFQ-2023-009012');
        expect(trackGAEvent).toHaveBeenCalledWith('Delete request');
        unmount();

        renderInDashboardList(
            <InstrumentItem
                request={{
                    ...instrumentRequest,
                    status: DashboardItemStatus.QuoteAvailable,
                    artefact: undefined,
                    report: undefined,
                }}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Actions' }));
        const quotation = await screen.findByRole('link', { name: 'View/accept quotation' });
        expect(quotation).toHaveAttribute('href', '/quotation/RFQ-2023-009012');
        await user.click(quotation);
        expect(trackGAEvent).toHaveBeenCalledWith('View/accept quotation');
    });

    it('renders InstrumentItem headings when the model or artefact name is absent', () => {
        const { unmount } = renderInDashboardList(
            <InstrumentItem
                request={{
                    ...instrumentRequest,
                    status: DashboardItemStatus.QuoteDrafted,
                    artefact: undefined,
                    requestForQuote: {
                        ...instrumentRequest.requestForQuote,
                        model: undefined,
                    },
                }}
            />,
        );

        expect(screen.getByRole('heading', { name: 'Mettler Toledo' })).toBeInTheDocument();
        unmount();

        renderInDashboardList(
            <InstrumentItem
                request={{
                    ...instrumentRequest,
                    status: DashboardItemStatus.ReportIssued,
                    artefact: undefined,
                }}
            />,
        );

        expect(screen.getByRole('heading', { name: 'Draft request for Quote' })).toBeInTheDocument();
    });

    it('renders InstrumentItem in-progress report recalibration action without latest report link', async () => {
        const user = userEvent.setup();
        renderInDashboardList(
            <InstrumentItem
                request={{
                    ...instrumentRequest,
                    status: DashboardItemStatus.ReportInProgress,
                    artefact: {
                        ...instrumentRequest.artefact,
                        tmasStatus: ReportStatus.NotIssued,
                    },
                }}
            />,
        );

        expect(screen.getByRole('link', { name: 'Request recalibration' }))
            .toHaveAttribute('href', '/request-for-quote-copy/RFQ-2023-009012');
        expect(screen.getByRole('link', { name: 'View latest report' }))
            .toHaveAttribute('href', '/report/Q-2023-007777');
        await user.click(screen.getByRole('button', { name: 'Actions' }));
        await user.click(screen.getAllByRole('link', { name: 'Request recalibration' })[0]);
        expect(trackGAEvent).toHaveBeenCalledWith('Request recalibration');
    });

    it('renders sparse InstrumentItem details, missing report date, and default actions', async () => {
        const user = userEvent.setup();
        renderInDashboardList(
            <InstrumentItem
                request={{
                    ...instrumentRequest,
                    status: DashboardItemStatus.QuoteSubmitted,
                    sourceReferenceId: 'RFQ-2022-000001',
                    requestForQuote: {
                        ...instrumentRequest.requestForQuote,
                        serialNumber: undefined,
                        description: 'Instrument description',
                        requestSubmitted: undefined,
                        contactDetails: {
                            firstName: 'Mobile',
                            lastName: 'Contact',
                            mobilePhone: '0400 000 000',
                        },
                    },
                    artefact: {
                        ...instrumentRequest.artefact,
                        tmasTcReportDate: undefined,
                    },
                }}
            />,
        );

        expect(screen.getAllByText('N/A')[0]).toBeInTheDocument();
        await user.click(screen.getByRole('tab', { name: 'Details' }));
        expect(screen.getByText('Instrument description')).toBeInTheDocument();
        expect(screen.getByText('RFQ-2022-000001')).toBeInTheDocument();
        expect(screen.getByText('0400 000 000')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Actions' }));
        expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
    });
});
