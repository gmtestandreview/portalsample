import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import InstrumentItem from '@/components/RequestList/instrumentItem';
import NoRequests from '@/components/RequestList/noRequests';
import RequestItem from '@/components/RequestList/requestItem';
import { DashboardItemStatus } from '@/routes/common/enums';
import { trackGAEvent } from '@/analytics/GoogleAnalytics';
import {
  baseRequest,
  instrumentRequest,
  modalDispatch,
  renderInDashboardList,
  resetRequestListMocks,
} from '../helpers/requestListFixtures';

vi.mock(
  import('@/analytics/GoogleAnalytics'),
  () =>
    ({
      trackGAEvent: vi.fn<() => void>(),
    }) satisfies __ExactMockModule<__TestMockModule22>,
);

const expectAcceptedQuoteDetails = () => {
  expect(screen.getByRole('tooltip')).toHaveTextContent('RFQ-2022-000001');
  expect(
    screen.getByLabelText(
      'Info note: This request was copied from previous Ref ID RFQ-2022-000001',
    ),
  ).toBeInTheDocument();
};

const expectQuoteAvailableDetails = () => {
  expect(
    screen.getByRole('heading', { name: /mettler toledo xpe205/i }),
  ).toBeInTheDocument();
  expect(screen.getByText('Q-2023-007777')).toBeInTheDocument();
};

describe('requestList RequestItem states', () => {
  it('maps generated statuses for valid branches and keeps unknown statuses explicit', () => {
    expect.hasAssertions();

    resetRequestListMocks();
    renderInDashboardList(
      <>
        <RequestItem
          request={{
            ...baseRequest,
            referenceId: 'RFQ-generated-status',
            status: 'QuoteAvailable',
          }}
        />
        <RequestItem
          request={{
            ...baseRequest,
            referenceId: 'RFQ-unknown-status',
            status: 'ServerAddedStatus',
          }}
        />
      </>,
    );

    expect(
      screen.getByTestId('RefId-RFQ-generated-status-view-quotation-button'),
    ).toBeInTheDocument();
    expect(screen.getByText('ServerAddedStatus')).toBeInTheDocument();
  });

  it('renders the no requests empty state with a create request link', () => {
    expect.hasAssertions();

    resetRequestListMocks();

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

  it('renders RequestItem quote-available details and navigates by reference id', async () => {
    expect.hasAssertions();

    resetRequestListMocks();

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

    expectQuoteAvailableDetails();

    await user.click(screen.getByRole('button', { name: 'View quotation' }));

    expect(
      screen.getByRole('status', { name: 'Current route' }),
    ).toHaveTextContent('/quotation/RFQ-2023-009012');

    await user.click(screen.getByRole('button', { name: 'Actions' }));

    await expect(
      screen.findByRole('menuitem', { name: 'View/accept quotation' }),
    ).resolves.toHaveAttribute('href', '/quotation/RFQ-2023-009012');
    expect(
      screen.getByRole('menuitem', { name: 'View request' }),
    ).toHaveAttribute(
      'href',
      '/request-for-quote/RFQ-2023-009012/view-summary',
    );

    await user.click(
      screen.getByRole('menuitem', { name: 'View/accept quotation' }),
    );

    expect(trackGAEvent).toHaveBeenCalledWith('View/acceptquotation');
  });

  it('renders RequestItem accepted quote navigation by quotation id and clone tooltip', async () => {
    expect.hasAssertions();

    resetRequestListMocks();

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

    expectAcceptedQuoteDetails();

    await user.click(screen.getByRole('button', { name: 'View quotation' }));

    expect(
      screen.getByRole('status', { name: 'Current route' }),
    ).toHaveTextContent('/quotation/Q-2023-007777');

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(
      await screen.findByRole('menuitem', { name: 'View quotation' }),
    );

    expect(trackGAEvent).toHaveBeenCalledWith('Viewquotation');
  });

  it('renders sparse RequestItem content and the default non-draft action', async () => {
    expect.hasAssertions();

    resetRequestListMocks();

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

    await expect(
      screen.findByRole('menuitem', { name: 'View request' }),
    ).resolves.toHaveAttribute(
      'href',
      '/request-for-quote/RFQ-2023-009012/view-summary',
    );
  });

  it('opens draft RequestItem actions and dispatches the delete modal', async () => {
    expect.hasAssertions();

    resetRequestListMocks();

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
    const editRequest = await screen.findByRole('menuitem', {
      name: 'Edit request',
    });

    expect(editRequest).toHaveAttribute(
      'href',
      '/request-for-quote/RFQ-2023-009012/instrument-and-request',
    );

    await user.click(editRequest);

    expect(trackGAEvent).toHaveBeenCalledWith('Editrequest');

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(
      await screen.findByRole('menuitem', { name: 'Delete request' }),
    );

    expect(modalDispatch.setShowRFQDeleteModal).toHaveBeenCalledWith(
      true,
      'RFQ-2023-009012',
    );
    expect(trackGAEvent).toHaveBeenCalledWith('Deleterequest');
  });

  it('does not render RequestItem or InstrumentItem without a reference id', () => {
    expect.hasAssertions();

    resetRequestListMocks();
    const { container } = renderInDashboardList(
      <>
        <RequestItem request={{ ...baseRequest, referenceId: undefined }} />
        <InstrumentItem
          request={{ ...instrumentRequest, referenceId: undefined }}
        />
      </>,
    );

    expect(container.querySelector('li')).toBeNull();
  });

  it('uses the unknown status fallback when RequestItem has no status', () => {
    expect.hasAssertions();

    resetRequestListMocks();
    renderInDashboardList(
      <RequestItem
        request={{
          ...baseRequest,
          status: undefined,
          quote: undefined,
          report: undefined,
        }}
      />,
    );

    expect(screen.getByText('Unknown status')).toBeInTheDocument();
  });

  it('renders RequestItem draft fallback heading when manufacturer is absent', async () => {
    expect.hasAssertions();

    resetRequestListMocks();

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

    expect(
      screen.getByRole('heading', { name: /draft request for quote/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Actions' }));

    await expect(
      screen.findByRole('menuitem', { name: 'Edit request' }),
    ).resolves.toHaveAttribute(
      'href',
      '/request-for-quote/RFQ-2023-009012/instrument-and-request',
    );
  });

  it('renders RequestItem headings when the model or artefact name is absent', () => {
    expect.hasAssertions();

    resetRequestListMocks();

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

    expect(
      screen.getByRole('heading', { name: 'Mettler Toledo' }),
    ).toBeInTheDocument();

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

    expect(
      screen.getByRole('heading', { name: 'Draft request for Quote' }),
    ).toBeInTheDocument();
  });

  it('does not render a RequestItem card when the item is hidden from the dashboard', () => {
    expect.hasAssertions();

    resetRequestListMocks();

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

    expect(
      screen.queryByRole('heading', {
        name: /mettler toledo xpe205 analytical balance/i,
      }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('RFQ-2023-009012')).not.toBeInTheDocument();
  });
});
