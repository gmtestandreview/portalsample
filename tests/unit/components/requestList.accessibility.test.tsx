import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import RequestItem from '@/components/RequestList/requestItem';
import InstrumentItem from '@/components/RequestList/instrumentItem';
import { ModalDispatchCtx } from '@/components/modals/ModalContext';
import { DashboardItemStatus, ReportStatus } from '@/routes/common/enums';
import type { DashboardItemDto } from '@/api/web-api-client';

vi.mock('@/analytics/GoogleAnalytics', () => ({
    trackGAEvent: vi.fn(),
}));

const modalDispatch = {
    setShowBranchSelector: vi.fn(),
    setShowRFQDeleteModal: vi.fn(),
    setShowRFQSelectModal: vi.fn(),
};

const renderDashboardItem = (children: React.ReactNode) => render(
    <MemoryRouter>
        <ModalDispatchCtx.Provider value={modalDispatch}>
            <ul>{children}</ul>
        </ModalDispatchCtx.Provider>
    </MemoryRouter>,
);

const reportIssuedRequest: DashboardItemDto = {
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
    ...reportIssuedRequest,
    artefact: {
        tmasArtefactName: 'Mettler Toledo XPE205',
        tmasTcReportName: 'RPT-2023-12345',
        tmasTcReportDate: new Date('2023-11-25'),
        tmasMeasurementReportCertificateRequired: 'Measurement report only',
        tmasMeasurementCategoryName: 'Mass',
        tmasStatus: ReportStatus.Issued,
    },
};

describe('RequestList accessibility', () => {
    it('keeps RequestItem recalibration actions as native links and avoids extra card/panel tab stops', () => {
        const { container } = renderDashboardItem(<RequestItem request={reportIssuedRequest} />);

        const recalibrationLink = screen.getByRole('link', { name: 'Request recalibration' });
        expect(recalibrationLink).toHaveAttribute('href', '/request-for-quote-copy/RFQ-2023-009012');
        expect(recalibrationLink).not.toHaveAttribute('role', 'button');

        expect(container.querySelector('#RefId-RFQ-2023-009012')).not.toHaveAttribute('tabindex');
        expect(container.querySelectorAll('.tab-pane[tabindex="0"]')).toHaveLength(0);
        expect(container.querySelectorAll('[aria-hidden="true"] a, [aria-hidden="true"] button')).toHaveLength(0);
    });

    it('keeps InstrumentItem recalibration actions as native links and avoids extra card/panel tab stops', () => {
        const { container } = renderDashboardItem(<InstrumentItem request={instrumentRequest} />);

        const recalibrationLink = screen.getByRole('link', { name: 'Request recalibration' });
        expect(recalibrationLink).toHaveAttribute('href', '/request-for-quote-copy/RFQ-2023-009012');
        expect(recalibrationLink).not.toHaveAttribute('role', 'button');

        expect(container.querySelector('#RefId-RFQ-2023-009012')).not.toHaveAttribute('tabindex');
        expect(container.querySelectorAll('.tab-pane[tabindex="0"]')).toHaveLength(0);
        expect(container.querySelectorAll('[aria-hidden="true"] a, [aria-hidden="true"] button')).toHaveLength(0);
    });
});
