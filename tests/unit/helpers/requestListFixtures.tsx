import { vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { ModalDispatchCtx } from '@/components/modals/ModalContext';
import type { DashboardItemDto } from '@/api/web-api-client';
import { DashboardItemStatus, ReportStatus } from '@/routes/common/enums';

export const modalDispatch = {
  setShowBranchSelector: vi.fn<() => void>(),
  setShowRFQDeleteModal: vi.fn<() => void>(),
  setShowRFQSelectModal: vi.fn<() => void>(),
};

export const resetRequestListMocks = () => {
  vi.clearAllMocks();
};

export const LocationDisplay = () => {
  const location = useLocation();
  return <output aria-label='Current route'>{location.pathname}</output>;
};

export const renderInDashboardList = (children: React.ReactNode) =>
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <ModalDispatchCtx.Provider value={modalDispatch}>
        <ul>{children}</ul>
        <LocationDisplay />
      </ModalDispatchCtx.Provider>
    </MemoryRouter>,
  );

export const baseRequest: DashboardItemDto = {
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

export const instrumentRequest: DashboardItemDto = {
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
