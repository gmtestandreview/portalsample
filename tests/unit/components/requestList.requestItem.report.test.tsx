import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RequestItem from '@/components/RequestList/requestItem';
import { DashboardItemStatus } from '@/routes/common/enums';
import { trackGAEvent } from '@/analytics/GoogleAnalytics';
import { defined } from '../helpers/defined';
import {
  baseRequest,
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

const expectRequestReportDetails = () => {
  expect(
    screen.getByRole('heading', {
      name: /mettler toledo xpe205 analytical balance/i,
    }),
  ).toBeInTheDocument();
  expect(screen.getByText('RFQ-2023-009012')).toBeInTheDocument();
  expect(
    screen.getByText(DashboardItemStatus.ReportIssued),
  ).toBeInTheDocument();
  expect(screen.getByText('INV-2023-009012')).toBeInTheDocument();
};

describe('requestList RequestItem report actions', () => {
  it('renders RequestItem report details and navigates from the report action button', async () => {
    expect.hasAssertions();

    resetRequestListMocks();

    const user = userEvent.setup();
    renderInDashboardList(<RequestItem request={baseRequest} />);

    expectRequestReportDetails();

    await user.click(screen.getByRole('button', { name: 'View report' }));

    expect(
      screen.getByRole('status', { name: 'Current route' }),
    ).toHaveTextContent('/report/Q-2023-007777');
    expect(
      screen.getByRole('link', { name: 'Request recalibration' }),
    ).toHaveAttribute('href', '/request-for-quote-copy/RFQ-2023-009012');

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(
      await screen.findByRole('menuitem', { name: 'View report' }),
    );

    expect(trackGAEvent).toHaveBeenCalledWith('Viewreport');
  });

  it('omits the report button test id when the report has no id', () => {
    expect.hasAssertions();

    resetRequestListMocks();

    renderInDashboardList(
      <RequestItem
        request={{
          ...baseRequest,
          report: { ...baseRequest.report, reportId: undefined },
        }}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'View report' }),
    ).not.toHaveAttribute('data-testid');
  });

  it('offers no report action when the issued report has no quotation id', () => {
    expect.hasAssertions();

    resetRequestListMocks();

    renderInDashboardList(
      <RequestItem
        request={{
          ...baseRequest,
          quote: { ...baseRequest.quote, quotationId: undefined },
        }}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'View report' }),
    ).not.toBeInTheDocument();
  });

  it('omits the report menu action when the request has no quote', async () => {
    expect.hasAssertions();

    resetRequestListMocks();
    const user = userEvent.setup();

    renderInDashboardList(
      <RequestItem request={{ ...baseRequest, quote: undefined }} />,
    );

    await user.click(screen.getByRole('button', { name: 'Actions' }));

    expect(
      screen.queryByRole('menuitem', { name: 'View report' }),
    ).not.toBeInTheDocument();
  });

  it('runs RequestItem tab and issued-report action callbacks', async () => {
    expect.hasAssertions();

    resetRequestListMocks();

    const user = userEvent.setup();
    renderInDashboardList(<RequestItem request={baseRequest} />);

    await user.click(screen.getByRole('tab', { name: 'Request' }));
    await user.click(screen.getByRole('tab', { name: 'Quotation' }));
    await user.click(screen.getByRole('tab', { name: 'Report' }));

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    const viewRequest = await screen.findByRole('menuitem', {
      name: 'View request',
    });
    const recalibration = screen.getAllByRole('menuitem', {
      name: 'Request recalibration',
    })[0];
    await user.click(viewRequest);
    await user.click(defined(recalibration, 'recalibration link'));

    expect(trackGAEvent).toHaveBeenCalledWith('Requestitem/requesttab');
    expect(trackGAEvent).toHaveBeenCalledWith('Requestitem/quotationtab');
    expect(trackGAEvent).toHaveBeenCalledWith('Requestitem/reporttab');
    expect(trackGAEvent).toHaveBeenCalledWith('Viewrequest');
    expect(trackGAEvent).toHaveBeenCalledWith('Requestrecalibration');
  });

  it('renders withdrawn RequestItem report content and runs every withdrawn action', async () => {
    expect.hasAssertions();

    resetRequestListMocks();

    const user = userEvent.setup();
    renderInDashboardList(
      <RequestItem
        request={{
          ...baseRequest,
          status: DashboardItemStatus.ReportWithdrawn,
        }}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'View report' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Request recalibration' }),
    ).toHaveAttribute('href', '/request-for-quote-copy/RFQ-2023-009012');

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(
      await screen.findByRole('menuitem', { name: 'View request' }),
    );
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(
      screen.getByRole('menuitem', { name: 'Request recalibration' }),
    );
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'View quotation' }));

    expect(trackGAEvent).toHaveBeenCalledWith('Viewrequest');
    expect(trackGAEvent).toHaveBeenCalledWith('Requestrecalibration');
    expect(trackGAEvent).toHaveBeenCalledWith('Viewquotation');
  });

  it('omits withdrawn quotation actions when the quotation id is absent', async () => {
    expect.hasAssertions();

    resetRequestListMocks();
    const user = userEvent.setup();
    renderInDashboardList(
      <RequestItem
        request={{
          ...baseRequest,
          status: DashboardItemStatus.ReportWithdrawn,
          quote: undefined,
        }}
      />,
    );

    expect(
      screen.getByRole('link', { name: 'Request recalibration' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Actions' }));

    expect(
      screen.queryByRole('menuitem', { name: 'View quotation' }),
    ).not.toBeInTheDocument();
  });
});
