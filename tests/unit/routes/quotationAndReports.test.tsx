import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import '@testing-library/jest-dom/vitest';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MemoryRouter, Route, Routes } from 'react-router';

import type { AccountDetails } from '../../../ClientApp/src/authentication/accountContext';

import type * as WebApiClientModule from '../../../ClientApp/src/api/web-api-client';

import type * as MsalBrowserModule from '@azure/msal-browser';

import type * as HelperFunctionsModule from '../../../ClientApp/src/routes/common/helperFunctions';

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

vi.mock(
  import('@azure/msal-react'),
  () =>
    ({
      useMsal: () => ({
        inProgress: mocks.msalState.inProgress,
        accounts: mocks.msalState.accounts,
        instance: mocks.msalState.instance,
      }),
    }) satisfies __ExactMockModule<__TestMockModule2>,
);

vi.mock(import('@azure/msal-browser'), async (importOriginal) => {
  const actual = await importOriginal<typeof MsalBrowserModule>();

  return {
    ...actual,
    InteractionStatus: { None: 'none' },
  } satisfies __ExactMockModule<__TestMockModule3>;
});

vi.mock(
  import('../../../ClientApp/src/authentication/hooks'),
  () =>
    ({
      useAccountState: mocks.useAccountState,
      useAccountDispatch: () => ({
        setTargetOrganisation: mocks.setTargetOrganisation,
      }),
    }) satisfies __ExactMockModule<__TestMockModule26>,
);

vi.mock(
  import('../../../ClientApp/src/authentication/authConfig'),
  () =>
    ({
      tokenRequest: { scopes: ['scope'] },
    }) satisfies __ExactMockModule<__TestMockModule8>,
);

vi.mock(
  import('../../../ClientApp/src/api/web-api-client'),
  async (importOriginal) => {
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
          getDashboardInstrumentArtefactReportsByPortalIDAndArtefactName:
            mocks.getDashboardInstrumentReports,
        };
      }),
    } satisfies __ExactMockModule<__TestMockModule4>;
  },
);

vi.mock(
  import('../../../ClientApp/src/storage/notification'),
  () =>
    ({
      getDashboardNotification: mocks.getDashboardNotification,
      getDashboardInfoNotification: mocks.getDashboardInfoNotification,
      clearDashboardNotification: mocks.clearDashboardNotification,
      clearDashboardInfoNotification: mocks.clearDashboardInfoNotification,
      setDashboardNotification: mocks.setDashboardNotification,
      setDashboardInfoNotification: mocks.setDashboardInfoNotification,
    }) satisfies __ExactMockModule<__TestMockModule46>,
);

vi.mock(
  import('../../../ClientApp/src/storage/types'),
  () =>
    ({
      NotificationSeverity: {
        Error: 'error',
        Information: 'information',
      },
    }) satisfies __ExactMockModule<__TestMockModule47>,
);

vi.mock(
  import('../../../ClientApp/src/storage/sessionStorageCache'),
  () =>
    ({
      default: () => ({
        getItem: mocks.sessionGetItem,
        removeItem: mocks.sessionRemoveItem,
      }),
    }) satisfies __ExactMockModule<__TestMockModule72>,
);

vi.mock(
  import('../../../ClientApp/src/components/Utilities/useHtmlTitle'),
  () =>
    ({
      default: () => {},
    }) satisfies __ExactMockModule<__TestMockModule89>,
);

vi.mock(
  import('../../../ClientApp/src/components/Utilities/useBodyClass'),
  () =>
    ({
      default: () => {},
    }) satisfies __ExactMockModule<__TestMockModule59>,
);

vi.mock(
  import('../../../ClientApp/src/components/BlockUISpinner'),
  () =>
    ({
      default: ({ children }: { children: React.ReactNode }) => (
        <div data-testid='block-spinner'>{children}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule14>,
);

vi.mock(
  import('../../../ClientApp/src/components/Breadcrumb'),
  () =>
    ({
      default: ({ breadcrumbs }: { breadcrumbs: { text: string }[] }) => (
        <nav data-testid='breadcrumb'>
          {breadcrumbs.map((item) => item.text).join(' > ')}
        </nav>
      ),
    }) satisfies __ExactMockModule<__TestMockModule115>,
);

vi.mock(
  import('../../../ClientApp/src/components/HeaderIntroText'),
  () =>
    ({
      default: ({ children }: { children: React.ReactNode }) => (
        <p data-testid='header-intro'>{children}</p>
      ),
    }) satisfies __ExactMockModule<__TestMockModule76>,
);

vi.mock(
  import('../../../ClientApp/src/components/Alert/NotificationMessage'),
  () =>
    ({
      default: ({
        message,
        onClose,
      }: {
        message: string;
        onClose: () => void;
      }) => (
        <button
          type='button'
          data-testid='notification-message'
          onClick={onClose}
        >
          {message}
        </button>
      ),
    }) satisfies __ExactMockModule<__TestMockModule48>,
);

vi.mock(
  import('../../../ClientApp/src/components/modals/ConfirmationModal'),
  () =>
    ({
      default: ({
        isOpen,
        titleText,
        onModalNo,
        onModalYes,
      }: {
        isOpen: boolean;
        titleText: string;
        onModalNo: () => void;
        onModalYes: () => void;
      }) =>
        isOpen ? (
          <div data-testid='confirmation-modal'>
            <h2>{titleText}</h2>
            <button type='button' onClick={onModalNo}>
              Cancel
            </button>
            <button type='button' onClick={onModalYes}>
              Decline quote
            </button>
          </div>
        ) : null,
    }) satisfies __ExactMockModule<__TestMockModule23>,
);

vi.mock(
  import('../../../ClientApp/src/components/Utilities/ViewPdfQuoteTerms'),
  () =>
    ({
      default: ({
        prefixText,
        suffixText,
      }: {
        prefixText?: string;
        suffixText?: string;
      }) => (
        <div data-testid='view-quote-terms'>
          {prefixText}
          {suffixText}
        </div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule116>,
);

vi.mock(
  import('../../../ClientApp/src/components/Utilities/ViewPdfQuote'),
  () =>
    ({
      default: ({ text }: { text: string }) => (
        <button type='button'>{text}</button>
      ),
    }) satisfies __ExactMockModule<__TestMockModule117>,
);

vi.mock(
  import('../../../ClientApp/src/components/Utilities/ViewMeasurementReport'),
  () =>
    ({
      default: ({ text }: { text: string }) => (
        <button type='button'>{text}</button>
      ),
    }) satisfies __ExactMockModule<__TestMockModule118>,
);

vi.mock(
  import('../../../ClientApp/src/components/Utilities/mailingLabel'),
  () =>
    ({
      default: ({ quotationIdNum }: { quotationIdNum?: string }) => (
        <div data-testid='mailing-label'>{quotationIdNum}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule119>,
);

vi.mock(
  import('../../../ClientApp/src/components/Utilities/deliveryInstructions'),
  () =>
    ({
      default: ({
        deliveryInstructions,
      }: {
        deliveryInstructions?: string;
      }) => (
        <div data-testid='delivery-instructions'>{deliveryInstructions}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule120>,
);

vi.mock(
  import('../../../ClientApp/src/components/Pill/QuoteStatusPill'),
  () =>
    ({
      default: ({ status }: { status: string }) => (
        <span data-testid='quote-status-pill'>{status}</span>
      ),
    }) satisfies __ExactMockModule<__TestMockModule121>,
);

vi.mock(
  import('../../../ClientApp/src/components/Pill/StatusPill'),
  () =>
    ({
      default: ({ status }: { status: string }) => (
        <span data-testid='status-pill'>{status}</span>
      ),
    }) satisfies __ExactMockModule<__TestMockModule122>,
);

vi.mock(
  import('../../../ClientApp/src/components/Pagination'),
  () =>
    ({
      default: ({
        currentPage,
        totalPages,
        onPageChange,
      }: {
        currentPage: number;
        totalPages: number;
        onPageChange: (page: number) => void;
      }) => (
        <button
          type='button'
          data-testid='pagination'
          data-total={totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Page {currentPage}
        </button>
      ),
    }) satisfies __ExactMockModule<__TestMockModule98>,
);

vi.mock(
  import('../../../ClientApp/src/components/InTextLink'),
  () =>
    ({
      default: ({
        children,
        onClick,
      }: {
        children: React.ReactNode;
        onClick: React.MouseEventHandler<HTMLButtonElement>;
      }) => (
        <button type='button' onClick={onClick}>
          {children}
        </button>
      ),
    }) satisfies __ExactMockModule<__TestMockModule77>,
);

vi.mock(
  import('../../../ClientApp/src/components/Icons/ExternalLinkIcon'),
  () =>
    ({
      default: () => <span data-testid='external-link-icon' />,
    }) satisfies __ExactMockModule<__TestMockModule78>,
);

vi.mock(
  import('../../../ClientApp/src/routes/common/openWindow'),
  () =>
    ({
      openInternalRouteInNewTab: mocks.openInternalRouteInNewTab,
    }) satisfies __ExactMockModule<__TestMockModule91>,
);

vi.mock(
  import('../../../ClientApp/src/routes/common/helperFunctions'),
  async (importOriginal) => {
    const actual = await importOriginal<typeof HelperFunctionsModule>();

    return {
      ...actual,
      handleReportFileError: mocks.handleReportFileError,
    } satisfies __ExactMockModule<__TestMockModule9>;
  },
);

vi.mock(
  import('../../../ClientApp/src/instrumentation/AppLogger'),
  () =>
    ({
      default: {
        error: mocks.appLoggerError,
        verbose: mocks.appLoggerVerbose,
      },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

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

const renderRoute = (
  initialPath: string,
  element: React.ReactNode,
  routePath: string,
) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path={routePath} element={element} />
        <Route path='/not-found' element={<div data-testid='not-found' />} />
        <Route path='/' element={<div data-testid='dashboard-route' />} />
      </Routes>
    </MemoryRouter>,
  );

describe('quotation and measurement report routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.msalState.instance.acquireTokenSilent = mocks.acquireTokenSilent;
    mocks.msalState.inProgress = 'none';
    mocks.msalState.accounts.splice(0, mocks.msalState.accounts.length, {
      homeAccountId: 'account-1',
    });
    mocks.useAccountState.mockReturnValue({ details: accountDetails });
    mocks.getDashboardNotification.mockReturnValue({
      message: 'Dashboard notification',
      severity: 'info',
    });
    mocks.getDashboardInfoNotification.mockReturnValue({
      message: 'Info notification',
      severity: 'info',
    });
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
    expect.assertions(3);
    const Quotation = (await import('../../../ClientApp/src/routes/quotation'))
      .default;

    renderRoute('/quotation/RFQ-100', <Quotation />, '/quotation/:id');

    await waitFor(() => {
      if (!screen.queryByRole('heading', { name: 'Quotation' })) {
        throw new Error('Quotation heading has not loaded');
      }
    });

    expect(screen.getAllByText('Q-100').length).toBeGreaterThan(0);
    expect(screen.getByTestId('view-quote-terms')).toHaveTextContent(
      'clause 11',
    );

    fireEvent.click(screen.getByTestId('decline-button'));
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Decline quote' }).at(-1)!,
    );

    await waitFor(() => {
      const hasDeclinedQuote = mocks.declineQuote.mock.calls.some(
        ([quoteId, givenName, familyName]) =>
          quoteId === 'CRM-QUOTE-1' &&
          givenName === 'Alex' &&
          familyName === 'Tester',
      );

      if (!hasDeclinedQuote) {
        throw new Error('Quote decline has not been submitted');
      }
    });

    expect(screen.getByTestId('dashboard-route')).toBeInTheDocument();
  });
});
