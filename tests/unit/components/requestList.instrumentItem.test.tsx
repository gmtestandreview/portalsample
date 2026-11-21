import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InstrumentItem from '@/components/RequestList/instrumentItem';
import { DashboardItemStatus, ReportStatus } from '@/routes/common/enums';
import { trackGAEvent } from '@/analytics/GoogleAnalytics';
import { defined } from '../helpers/defined';
import {
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

const renderInstrumentQuoteAvailableAndAssert = async (
  user: ReturnType<typeof userEvent.setup>,
) => {
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
  const quotation = await screen.findByRole('menuitem', {
    name: 'View/accept quotation',
  });

  expect(quotation).toHaveAttribute('href', '/quotation/RFQ-2023-009012');

  await user.click(quotation);

  expect(trackGAEvent).toHaveBeenCalledWith('View/accept quotation');
};

const renderInstrumentWithReportStatus = (
  tmasStatus: string,
  status?: string,
) =>
  renderInDashboardList(
    <InstrumentItem
      request={{
        ...instrumentRequest,
        ...(status === undefined ? {} : { status }),
        artefact: { ...instrumentRequest.artefact, tmasStatus },
      }}
    />,
  );

const expectNoLatestReportActions = () => {
  expect(
    screen.queryByRole('link', { name: 'View latest report' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'View latest report' }),
  ).not.toBeInTheDocument();
};

describe('requestList InstrumentItem', () => {
  it('hides latest report actions for an unknown instrument report status', () => {
    expect.hasAssertions();

    resetRequestListMocks();
    renderInstrumentWithReportStatus('ServerAddedReportStatus');
    expectNoLatestReportActions();

    expect(
      screen.getByRole('link', { name: 'Request recalibration' }),
    ).toBeInTheDocument();
  });

  it('renders InstrumentItem report history links and navigates from the latest report button', async () => {
    expect.hasAssertions();

    resetRequestListMocks();

    const user = userEvent.setup();
    renderInDashboardList(<InstrumentItem request={instrumentRequest} />);

    expect(
      screen.getByRole('heading', { name: 'Mettler Toledo XPE205' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('RPT-2023-12345')[0]).toBeInTheDocument();
    expect(screen.getByText('Measurement report only')).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: 'View all reports for this instrument/artefact',
      }),
    ).toHaveAttribute('href', '/instrument-reports/Mettler%20Toledo%20XPE205');

    await user.click(
      screen.getByRole('button', { name: 'View latest report' }),
    );

    expect(
      screen.getByRole('status', { name: 'Current route' }),
    ).toHaveTextContent('/report/Q-2023-007777');
  });

  it('renders an unlabelled latest-report button when the report name is absent', () => {
    expect.hasAssertions();

    resetRequestListMocks();
    renderInDashboardList(
      <InstrumentItem
        request={{
          ...instrumentRequest,
          artefact: {
            ...instrumentRequest.artefact,
            tmasTcReportName: undefined,
          },
        }}
      />,
    );

    const latestReport = screen.getByRole('button', {
      name: 'View latest report',
    });

    expect(latestReport).not.toHaveAttribute('data-testid');
  });

  it('omits InstrumentItem latest-report actions when the quotation id is absent', async () => {
    expect.hasAssertions();

    resetRequestListMocks();
    const user = userEvent.setup();
    renderInDashboardList(
      <InstrumentItem request={{ ...instrumentRequest, quote: undefined }} />,
    );

    expect(
      screen.queryByRole('link', { name: 'View latest report' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Actions' }));

    expect(
      screen.queryByRole('menuitem', { name: 'View latest report' }),
    ).not.toBeInTheDocument();
  });

  it('runs InstrumentItem tab and issued-report action callbacks', async () => {
    expect.hasAssertions();

    resetRequestListMocks();

    const user = userEvent.setup();
    renderInDashboardList(<InstrumentItem request={instrumentRequest} />);

    await user.click(screen.getByRole('tab', { name: 'Details' }));
    await user.click(screen.getByRole('tab', { name: 'Reports' }));

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    const latestReport = (
      await screen.findAllByRole('menuitem', { name: 'View latest report' })
    )[0];
    const recalibration = screen.getAllByRole('menuitem', {
      name: 'Request recalibration',
    })[0];
    await user.click(defined(latestReport, 'latest report link'));
    await user.click(defined(recalibration, 'recalibration link'));

    expect(trackGAEvent).toHaveBeenCalledWith('View latest report');
    expect(trackGAEvent).toHaveBeenCalledWith('Request recalibration');
  });

  it('hides InstrumentItem latest report actions for withdrawn reports but keeps recalibration available', () => {
    expect.hasAssertions();

    resetRequestListMocks();

    renderInstrumentWithReportStatus(
      ReportStatus.Withdrawn,
      DashboardItemStatus.ReportWithdrawn,
    );
    expectNoLatestReportActions();

    expect(
      screen.getByRole('link', { name: 'Request recalibration' }),
    ).toHaveAttribute('href', '/request-for-quote-copy/RFQ-2023-009012');
  });

  it('renders InstrumentItem draft and quote-available action states', async () => {
    expect.hasAssertions();

    resetRequestListMocks();

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

    expect(
      screen.getByRole('heading', { name: 'Draft Request For Quote' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(
      await screen.findByRole('menuitem', { name: 'Edit request' }),
    );

    expect(trackGAEvent).toHaveBeenCalledWith('Edit request');

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(
      await screen.findByRole('menuitem', { name: 'Delete request' }),
    );

    expect(modalDispatch.setShowRFQDeleteModal).toHaveBeenCalledWith(
      true,
      'RFQ-2023-009012',
    );
    expect(trackGAEvent).toHaveBeenCalledWith('Delete request');

    unmount();

    await renderInstrumentQuoteAvailableAndAssert(user);
  });

  it('renders InstrumentItem headings when the model or artefact name is absent', () => {
    expect.hasAssertions();

    resetRequestListMocks();

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

    expect(
      screen.getByRole('heading', { name: 'Mettler Toledo' }),
    ).toBeInTheDocument();

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

    expect(
      screen.getByRole('heading', { name: 'Draft request for Quote' }),
    ).toBeInTheDocument();
  });

  it('renders InstrumentItem in-progress report recalibration action without latest report link', async () => {
    expect.hasAssertions();

    resetRequestListMocks();

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

    expect(
      screen.getByRole('link', { name: 'Request recalibration' }),
    ).toHaveAttribute('href', '/request-for-quote-copy/RFQ-2023-009012');
    expect(
      screen.getByRole('link', { name: 'View latest report' }),
    ).toHaveAttribute('href', '/report/Q-2023-007777');

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(
      defined(
        screen.getAllByRole('menuitem', { name: 'Request recalibration' })[0],
        'recalibration link',
      ),
    );

    expect(trackGAEvent).toHaveBeenCalledWith('Request recalibration');
  });

  it('renders sparse InstrumentItem details, missing report date, and default actions', async () => {
    expect.hasAssertions();

    resetRequestListMocks();

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
