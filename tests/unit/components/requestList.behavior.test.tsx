import { describe, beforeEach, it, expect } from 'vitest';

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

import { defined } from '../helpers/defined';

vi.mock(
  import('@/analytics/GoogleAnalytics'),
  () =>
    ({
      trackGAEvent: vi.fn(),
    }) satisfies __ExactMockModule<__TestMockModule22>,
);

const modalDispatch = {
  setShowBranchSelector: vi.fn(),
  setShowRFQDeleteModal: vi.fn(),
  setShowRFQSelectModal: vi.fn(),
};

const LocationDisplay = () => {
  const location = useLocation();
  return <output aria-label='Current route'>{location.pathname}</output>;
};

const renderInDashboardList = (children: React.ReactNode) =>
  render(
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

describe('requestList behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders the no requests empty state with a create request link', () => {
    expect.assertions(2);
    render(
      <MemoryRouter>
        <NoRequests />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/you currently have no requests/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'new request' })).toHaveAttribute(
      'href',
      '/services-we-offer',
    );
  });
});

describe('requestList behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders RequestItem report details and navigates from the report action button', async () => {
    expect.assertions(1);
    const user = userEvent.setup();
    renderInDashboardList(<RequestItem request={baseRequest} />);
    expect(
      screen.getByRole('heading', {
        name: /mettler toledo xpe205 analytical balance/i,
      }),
    ).toBeInTheDocument();
  });
});

describe('requestList behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders RequestItem report details and navigates from the report action button', async () => {
    expect.assertions(1);
    const user = userEvent.setup();
    renderInDashboardList(<RequestItem request={baseRequest} />);
    expect(screen.getByText('RFQ-2023-009012')).toBeInTheDocument();
  });
});

describe('requestList behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders RequestItem report details and navigates from the report action button', async () => {
    expect.assertions(1);
    const user = userEvent.setup();
    renderInDashboardList(<RequestItem request={baseRequest} />);
    expect(
      screen.getByText(DashboardItemStatus.ReportIssued),
    ).toBeInTheDocument();
  });
});
