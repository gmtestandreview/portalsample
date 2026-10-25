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

vi.mock(
  import('@azure/msal-react'),
  () =>
    ({
      useMsal: () => ({
        accounts: mocks.msalAccounts,
        instance: mocks.msalInstance,
      }),
    }) satisfies __ExactMockModule<__TestMockModule2>,
);

vi.mock(
  import('../../../ClientApp/src/authentication/authConfig'),
  () =>
    ({
      tokenRequest: { scopes: ['scope'] },
    }) satisfies __ExactMockModule<__TestMockModule8>,
);

vi.mock(
  import('../../../ClientApp/src/authentication/hooks'),
  () =>
    ({
      useAccountState: mocks.useAccountState,
    }) satisfies __ExactMockModule<__TestMockModule26>,
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
    } satisfies __ExactMockModule<__TestMockModule4>;
  },
);

vi.mock(
  import('../../../ClientApp/src/components/forms/WizardForm'),
  () =>
    ({
      default: ({
        children,
        locationOnCompletion,
        lastStepNextButtonTitle,
      }: {
        children: React.ReactNode;
        locationOnCompletion: string;
        lastStepNextButtonTitle: string;
      }) => (
        <section
          data-testid='wizard-form'
          data-complete-location={locationOnCompletion}
          data-last-button={lastStepNextButtonTitle}
        >
          {children}
        </section>
      ),
    }) satisfies __ExactMockModule<__TestMockModule60>,
);

vi.mock(
  import('../../../ClientApp/src/components/forms/WizardForm/WizardStep'),
  () =>
    ({
      default: ({
        children,
        bannerTitle,
        bannerRefTitle,
      }: {
        children: React.ReactNode;
        bannerTitle?: string;
        bannerRefTitle?: string;
      }) => (
        <article
          data-testid='wizard-step'
          data-banner-title={bannerTitle}
          data-ref-title={bannerRefTitle}
        >
          {children}
        </article>
      ),
    }) satisfies __ExactMockModule<__TestMockModule24>,
);

vi.mock(
  import('../../../ClientApp/src/components/forms/FormBanner'),
  () =>
    ({
      default: ({
        title,
        refTitle,
        subTitle,
      }: {
        title: string;
        refTitle?: string;
        subTitle?: string;
      }) => (
        <div
          data-testid='form-banner'
          data-ref-title={refTitle}
          data-sub-title={subTitle}
        >
          {title}
        </div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule90>,
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
  import('../../../ClientApp/src/components/HeaderIntroText'),
  () =>
    ({
      default: ({ children }: { children: React.ReactNode }) => (
        <p data-testid='header-intro'>{children}</p>
      ),
    }) satisfies __ExactMockModule<__TestMockModule76>,
);

vi.mock(
  import('../../../ClientApp/src/components/Utilities/useBodyClass'),
  () =>
    ({
      default: () => {},
    }) satisfies __ExactMockModule<__TestMockModule59>,
);

vi.mock(
  import('../../../ClientApp/src/components/Utilities/useHtmlTitle'),
  () =>
    ({
      default: () => {},
    }) satisfies __ExactMockModule<__TestMockModule89>,
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

vi.mock(
  import('../../../ClientApp/src/storage/notification'),
  () =>
    ({
      setDashboardNotification: vi.fn(),
    }) satisfies __ExactMockModule<__TestMockModule46>,
);

vi.mock(
  import('../../../ClientApp/src/routes/requestForQuote/organisationAndContact'),
  () =>
    ({
      default: () => <div>Organisation and contact step</div>,
    }) satisfies __ExactMockModule<__TestMockModule149>,
);

vi.mock(
  import('../../../ClientApp/src/routes/requestForQuote/instrumentAndRequest'),
  () =>
    ({
      default: () => <div>Instrument and request step</div>,
    }) satisfies __ExactMockModule<__TestMockModule150>,
);

vi.mock(
  import('../../../ClientApp/src/routes/requestForQuote/requestForQuoteSummary'),
  () =>
    ({
      default: () => <div>Request summary step</div>,
    }) satisfies __ExactMockModule<__TestMockModule151>,
);

vi.mock(
  import('../../../ClientApp/src/routes/acceptQuote/reportRecipient'),
  () =>
    ({
      default: () => <div>Report recipient step</div>,
    }) satisfies __ExactMockModule<__TestMockModule61>,
);

vi.mock(
  import('../../../ClientApp/src/routes/acceptQuote/deliveryAndReturn'),
  () =>
    ({
      default: () => <div>Delivery and return step</div>,
    }) satisfies __ExactMockModule<__TestMockModule62>,
);

vi.mock(
  import('../../../ClientApp/src/routes/acceptQuote/paymentDetails'),
  () =>
    ({
      default: () => <div>Payment details step</div>,
    }) satisfies __ExactMockModule<__TestMockModule63>,
);

vi.mock(
  import('../../../ClientApp/src/routes/acceptQuote/summaryAndAccept'),
  () =>
    ({
      default: () => <div>Summary and accept step</div>,
    }) satisfies __ExactMockModule<__TestMockModule64>,
);

vi.mock(
  import('../../../ClientApp/src/routes/quotation/quoteDetails'),
  () =>
    ({
      default: ({
        quotationData,
        fileError,
      }: {
        quotationData?: { quotationIdNum?: string };
        fileError?: boolean;
      }) => (
        <div data-testid='quotation-details' data-file-error={fileError}>
          {quotationData?.quotationIdNum}
        </div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule152>,
);

vi.mock(
  import('../../../ClientApp/src/routes/quotation/nMIContactDetails'),
  () =>
    ({
      default: () => <div>NMI contact details</div>,
    }) satisfies __ExactMockModule<__TestMockModule153>,
);

vi.mock(
  import('../../../ClientApp/src/components/Utilities/ViewPdfQuoteTerms'),
  () =>
    ({
      default: () => <div>Quote terms</div>,
    }) satisfies __ExactMockModule<__TestMockModule116>,
);

vi.mock(
  import('../../../ClientApp/src/components/Utilities/ViewPdfQuote'),
  () =>
    ({
      default: () => <div>Detailed quote PDF</div>,
    }) satisfies __ExactMockModule<__TestMockModule117>,
);

const accountDetails = {
  organisation: 'National Measurement Institute',
  trading: 'Trading',
  branch: 'Branch',
  defaultOrganisationId: 1,
} as AccountDetails;

const renderAt = (
  initialPath: string,
  element: React.ReactNode,
  routePath = initialPath,
) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path={routePath} element={element} />
        <Route path='/not-found' element={<div data-testid='not-found' />} />
        <Route path='*' element={<div data-testid='fallback-route' />} />
      </Routes>
    </MemoryRouter>,
  );

const renderWithNavigationDestinations = (
  initialPath: string,
  element: React.ReactNode,
  routePath: string,
) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path={routePath} element={element} />
        <Route
          path='/request-for-quote/:id/organisation-and-contact'
          element={<div data-testid='rfq-created-destination' />}
        />
        <Route
          path='/accept-quote/:id/report-recipient'
          element={<div data-testid='accept-created-destination' />}
        />
        <Route path='*' element={<div data-testid='fallback-route' />} />
      </Routes>
    </MemoryRouter>,
  );

describe('workflow route wrappers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.msalInstance.acquireTokenSilent.mockImplementation(
      mocks.acquireTokenSilent,
    );
    mocks.useAccountState.mockReturnValue({ details: accountDetails });
    mocks.requestForQuoteGetStepStatuses.mockResolvedValue([
      { name: 'Organisation and contact', status: 'current' },
    ]);
    mocks.acceptQuoteGetStepStatuses.mockResolvedValue([
      {
        name: 'Report recipient',
        status: 'current',
        crmQuoteRequestId: 'CRM-QUOTE-1',
      },
    ]);
    mocks.createApplication.mockResolvedValue({ referenceId: 'APP-1' });
    mocks.copyApplication.mockResolvedValue({ referenceId: 'APP-COPY-1' });
    mocks.getQuoteRequestDetails.mockResolvedValue({
      quoteRequestIdNum: 'RFQ-123',
    });
    mocks.getQuoteRequestDetailsByRefId.mockResolvedValue({
      crmQuoteRequestId: 'CRM-QUOTE-1',
    });
    mocks.getPaymentDetails.mockResolvedValue({
      acceptQuotePreInfo: { paymentTerms: 'Prepaid' },
    });
  });
  it('renders the request-for-quote wizard after loading statuses', async () => {
    expect.assertions(1);
    const RequestForQuote = (
      await import('../../../ClientApp/src/routes/requestForQuote')
    ).default;
    renderAt(
      '/request-for-quote/APP-1/organisation-and-contact',
      <RequestForQuote />,
      '/request-for-quote/:id/*',
    );
    await waitFor(() =>
      expect(screen.getByTestId('wizard-form')).toBeInTheDocument(),
    );
  });
});

describe('workflow route wrappers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.msalInstance.acquireTokenSilent.mockImplementation(
      mocks.acquireTokenSilent,
    );
    mocks.useAccountState.mockReturnValue({ details: accountDetails });
    mocks.requestForQuoteGetStepStatuses.mockResolvedValue([
      { name: 'Organisation and contact', status: 'current' },
    ]);
    mocks.acceptQuoteGetStepStatuses.mockResolvedValue([
      {
        name: 'Report recipient',
        status: 'current',
        crmQuoteRequestId: 'CRM-QUOTE-1',
      },
    ]);
    mocks.createApplication.mockResolvedValue({ referenceId: 'APP-1' });
    mocks.copyApplication.mockResolvedValue({ referenceId: 'APP-COPY-1' });
    mocks.getQuoteRequestDetails.mockResolvedValue({
      quoteRequestIdNum: 'RFQ-123',
    });
    mocks.getQuoteRequestDetailsByRefId.mockResolvedValue({
      crmQuoteRequestId: 'CRM-QUOTE-1',
    });
    mocks.getPaymentDetails.mockResolvedValue({
      acceptQuotePreInfo: { paymentTerms: 'Prepaid' },
    });
  });
  it('renders the request-for-quote wizard after loading statuses', async () => {
    expect.assertions(1);
    const RequestForQuote = (
      await import('../../../ClientApp/src/routes/requestForQuote')
    ).default;
    renderAt(
      '/request-for-quote/APP-1/organisation-and-contact',
      <RequestForQuote />,
      '/request-for-quote/:id/*',
    );
    expect(mocks.setAuthToken).toHaveBeenCalledWith('access-token');
  });
});

describe('workflow route wrappers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.msalInstance.acquireTokenSilent.mockImplementation(
      mocks.acquireTokenSilent,
    );
    mocks.useAccountState.mockReturnValue({ details: accountDetails });
    mocks.requestForQuoteGetStepStatuses.mockResolvedValue([
      { name: 'Organisation and contact', status: 'current' },
    ]);
    mocks.acceptQuoteGetStepStatuses.mockResolvedValue([
      {
        name: 'Report recipient',
        status: 'current',
        crmQuoteRequestId: 'CRM-QUOTE-1',
      },
    ]);
    mocks.createApplication.mockResolvedValue({ referenceId: 'APP-1' });
    mocks.copyApplication.mockResolvedValue({ referenceId: 'APP-COPY-1' });
    mocks.getQuoteRequestDetails.mockResolvedValue({
      quoteRequestIdNum: 'RFQ-123',
    });
    mocks.getQuoteRequestDetailsByRefId.mockResolvedValue({
      crmQuoteRequestId: 'CRM-QUOTE-1',
    });
    mocks.getPaymentDetails.mockResolvedValue({
      acceptQuotePreInfo: { paymentTerms: 'Prepaid' },
    });
  });
  it('renders the request-for-quote wizard after loading statuses', async () => {
    expect.assertions(1);
    const RequestForQuote = (
      await import('../../../ClientApp/src/routes/requestForQuote')
    ).default;
    renderAt(
      '/request-for-quote/APP-1/organisation-and-contact',
      <RequestForQuote />,
      '/request-for-quote/:id/*',
    );
    expect(mocks.requestForQuoteGetStepStatuses).toHaveBeenCalledWith('APP-1');
  });
});

describe('workflow route wrappers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.msalInstance.acquireTokenSilent.mockImplementation(
      mocks.acquireTokenSilent,
    );
    mocks.useAccountState.mockReturnValue({ details: accountDetails });
    mocks.requestForQuoteGetStepStatuses.mockResolvedValue([
      { name: 'Organisation and contact', status: 'current' },
    ]);
    mocks.acceptQuoteGetStepStatuses.mockResolvedValue([
      {
        name: 'Report recipient',
        status: 'current',
        crmQuoteRequestId: 'CRM-QUOTE-1',
      },
    ]);
    mocks.createApplication.mockResolvedValue({ referenceId: 'APP-1' });
    mocks.copyApplication.mockResolvedValue({ referenceId: 'APP-COPY-1' });
    mocks.getQuoteRequestDetails.mockResolvedValue({
      quoteRequestIdNum: 'RFQ-123',
    });
    mocks.getQuoteRequestDetailsByRefId.mockResolvedValue({
      crmQuoteRequestId: 'CRM-QUOTE-1',
    });
    mocks.getPaymentDetails.mockResolvedValue({
      acceptQuotePreInfo: { paymentTerms: 'Prepaid' },
    });
  });
  it('renders the request-for-quote wizard after loading statuses', async () => {
    expect.assertions(1);
    const RequestForQuote = (
      await import('../../../ClientApp/src/routes/requestForQuote')
    ).default;
    renderAt(
      '/request-for-quote/APP-1/organisation-and-contact',
      <RequestForQuote />,
      '/request-for-quote/:id/*',
    );
    expect(screen.getByTestId('wizard-form')).toHaveAttribute(
      'data-complete-location',
      '/request-for-quote-success/APP-1',
    );
  });
});

describe('workflow route wrappers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.msalInstance.acquireTokenSilent.mockImplementation(
      mocks.acquireTokenSilent,
    );
    mocks.useAccountState.mockReturnValue({ details: accountDetails });
    mocks.requestForQuoteGetStepStatuses.mockResolvedValue([
      { name: 'Organisation and contact', status: 'current' },
    ]);
    mocks.acceptQuoteGetStepStatuses.mockResolvedValue([
      {
        name: 'Report recipient',
        status: 'current',
        crmQuoteRequestId: 'CRM-QUOTE-1',
      },
    ]);
    mocks.createApplication.mockResolvedValue({ referenceId: 'APP-1' });
    mocks.copyApplication.mockResolvedValue({ referenceId: 'APP-COPY-1' });
    mocks.getQuoteRequestDetails.mockResolvedValue({
      quoteRequestIdNum: 'RFQ-123',
    });
    mocks.getQuoteRequestDetailsByRefId.mockResolvedValue({
      crmQuoteRequestId: 'CRM-QUOTE-1',
    });
    mocks.getPaymentDetails.mockResolvedValue({
      acceptQuotePreInfo: { paymentTerms: 'Prepaid' },
    });
  });
  it('renders the request-for-quote wizard after loading statuses', async () => {
    expect.assertions(1);
    const RequestForQuote = (
      await import('../../../ClientApp/src/routes/requestForQuote')
    ).default;
    renderAt(
      '/request-for-quote/APP-1/organisation-and-contact',
      <RequestForQuote />,
      '/request-for-quote/:id/*',
    );
    expect(screen.getAllByTestId('wizard-step')).toHaveLength(3);
  });
});
