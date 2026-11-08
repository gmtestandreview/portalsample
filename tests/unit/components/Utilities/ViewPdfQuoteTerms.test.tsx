import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { InteractionStatus, Logger } from '@azure/msal-browser';
import type {
  AccountInfo,
  AuthenticationResult,
  IPublicClientApplication,
} from '@azure/msal-browser';
import type { IMsalContext } from '@azure/msal-react';
import type { RequestForQuoteDetails } from '@/api/web-api-client';
import type {
  getFileUrlFromBase64,
  getQuotationFileDetails,
  getQuoteOfferPageNumber,
  openPdfPageInNewTab,
} from '@/routes/common/helperFunctions';
import type { trackGAEvent } from '@/analytics/GoogleAnalytics';
import type AppLogger from '@/instrumentation/AppLogger';
import { defined } from '../../helpers/defined';
import ViewPdfQuoteTerms from '@/components/Utilities/ViewPdfQuoteTerms';
import type { ViewPdfQuoteTermsProps } from '@/components/Utilities/ViewPdfQuoteTerms';

const helperMocks = vi.hoisted(() => ({
  getQuotationFileDetails: vi.fn<typeof getQuotationFileDetails>(),
  getFileUrlFromBase64: vi.fn<typeof getFileUrlFromBase64>(
    () => 'blob:test-url',
  ),
  getQuoteOfferPageNumber: vi.fn<typeof getQuoteOfferPageNumber>(() => '2'),
  openPdfPageInNewTab: vi.fn<typeof openPdfPageInNewTab>(),
}));

const trackGAEventMock = vi.hoisted(() => vi.fn<typeof trackGAEvent>());
const mockMsalState = vi.hoisted(() => {
  const acquireTokenSilentMock =
    vi.fn<IPublicClientApplication['acquireTokenSilent']>();
  let msalContext: IMsalContext | undefined;

  return {
    acquireTokenSilentMock,
    setMsalContext(context: IMsalContext) {
      msalContext = context;
    },
    getMsalContext() {
      if (!msalContext) {
        throw new Error(
          'MSAL context was not initialized by the mock factory.',
        );
      }
      return msalContext;
    },
  };
});

const { acquireTokenSilentMock } = mockMsalState;

const mockAppLogger = vi.hoisted(() => {
  const MockAppLogger = {
    info: vi.fn<typeof AppLogger.info>(),
    warning: vi.fn<typeof AppLogger.warning>(),
    verbose: vi.fn<typeof AppLogger.verbose>(),
    critical: vi.fn<typeof AppLogger.critical>(),
    trace: vi.fn<typeof AppLogger.trace>(),
    error: vi.fn<typeof AppLogger.error>(),
    trackEvent: vi.fn<typeof AppLogger.trackEvent>(),
    startTrackPage: vi.fn<typeof AppLogger.startTrackPage>(),
    stopTrackPage: vi.fn<typeof AppLogger.stopTrackPage>(),
    startTrackEvent: vi.fn<typeof AppLogger.startTrackEvent>(),
    stopTrackEvent: vi.fn<typeof AppLogger.stopTrackEvent>(),
  };

  return MockAppLogger;
});

vi.mock(import('@azure/msal-react'), () => {
  const mockAccount = {
    homeAccountId: 'test-account',
    environment: 'login.microsoftonline.com',
    tenantId: 'test-tenant',
    username: 'test@example.com',
    localAccountId: 'test-local-account',
  } satisfies AccountInfo;
  const msalInstance = {
    initialize: vi.fn<IPublicClientApplication['initialize']>(),
    acquireTokenPopup: vi.fn<IPublicClientApplication['acquireTokenPopup']>(),
    acquireTokenRedirect:
      vi.fn<IPublicClientApplication['acquireTokenRedirect']>(),
    acquireTokenSilent: mockMsalState.acquireTokenSilentMock,
    acquireTokenByCode: vi.fn<IPublicClientApplication['acquireTokenByCode']>(),
    addEventCallback: vi.fn<IPublicClientApplication['addEventCallback']>(),
    removeEventCallback:
      vi.fn<IPublicClientApplication['removeEventCallback']>(),
    addPerformanceCallback:
      vi.fn<IPublicClientApplication['addPerformanceCallback']>(),
    removePerformanceCallback:
      vi.fn<IPublicClientApplication['removePerformanceCallback']>(),
    getAccount: vi.fn<IPublicClientApplication['getAccount']>(),
    getAllAccounts: vi.fn<IPublicClientApplication['getAllAccounts']>(),
    handleRedirectPromise:
      vi.fn<IPublicClientApplication['handleRedirectPromise']>(),
    loginPopup: vi.fn<IPublicClientApplication['loginPopup']>(),
    loginRedirect: vi.fn<IPublicClientApplication['loginRedirect']>(),
    logoutRedirect: vi.fn<IPublicClientApplication['logoutRedirect']>(),
    logoutPopup: vi.fn<IPublicClientApplication['logoutPopup']>(),
    ssoSilent: vi.fn<IPublicClientApplication['ssoSilent']>(),
    getLogger: vi.fn<IPublicClientApplication['getLogger']>(),
    setLogger: vi.fn<IPublicClientApplication['setLogger']>(),
    setActiveAccount: vi.fn<IPublicClientApplication['setActiveAccount']>(),
    getActiveAccount: vi.fn<IPublicClientApplication['getActiveAccount']>(),
    initializeWrapperLibrary:
      vi.fn<IPublicClientApplication['initializeWrapperLibrary']>(),
    setNavigationClient:
      vi.fn<IPublicClientApplication['setNavigationClient']>(),
    getConfiguration: vi.fn<IPublicClientApplication['getConfiguration']>(),
    hydrateCache: vi.fn<IPublicClientApplication['hydrateCache']>(),
    clearCache: vi.fn<IPublicClientApplication['clearCache']>(),
  } satisfies IPublicClientApplication;

  mockMsalState.setMsalContext({
    accounts: [mockAccount],
    instance: msalInstance,
    inProgress: InteractionStatus.None,
    logger: new Logger({ loggerCallback: () => undefined }),
  });

  return {
    useMsal: () => mockMsalState.getMsalContext(),
  } satisfies Partial<__TestMockModule2>;
});

vi.mock(
  import('@/routes/common/helperFunctions'),
  () => helperMocks satisfies Partial<__TestMockModule9>,
);

vi.mock(
  import('@/analytics/GoogleAnalytics'),
  () =>
    ({ trackGAEvent: trackGAEventMock }) satisfies Partial<__TestMockModule22>,
);

vi.mock(
  import('@/instrumentation/AppLogger'),
  () => ({ default: mockAppLogger }) satisfies Partial<__TestMockModule5>,
);

const mockQuotationData = {
  crmQuoteRequestId: 'Q-001',
  quoteRequestStatus: 'Offered',
} as unknown as RequestForQuoteDetails;

const defaultProps = {
  prefixText: 'Please review the ',
  suffixText: ' before accepting.',
  quotationData: mockQuotationData,
  setFileError: vi.fn<ViewPdfQuoteTermsProps['setFileError']>(),
  setIsLoading: vi.fn<ViewPdfQuoteTermsProps['setIsLoading']>(),
};

const mockTokenResult = {
  authority: 'https://login.microsoftonline.com/test-tenant',
  uniqueId: 'test-unique-id',
  tenantId: 'test-tenant',
  scopes: ['openid'],
  account: {
    homeAccountId: 'test-account',
    environment: 'login.microsoftonline.com',
    tenantId: 'test-tenant',
    username: 'test@example.com',
    localAccountId: 'test-local-account',
  },
  idToken: 'test-id-token',
  idTokenClaims: {},
  accessToken: 'test-access-token',
  fromCache: false,
  expiresOn: new Date('2026-01-01T00:00:00.000Z'),
  tokenType: 'Bearer',
  correlationId: 'test-correlation-id',
} satisfies AuthenticationResult & {
  account: NonNullable<AuthenticationResult['account']>;
};

// InTextLink renders <a> without href when only onClick is supplied.
// An <a> without href has no ARIA "link" role, so queries use the element directly.
const getTermsAnchor = (container: HTMLElement) =>
  defined(container.querySelector('a.nmi-in-text-link'), 'terms anchor');

const resetViewPdfQuoteTermsMocks = () => {
  vi.clearAllMocks();
  acquireTokenSilentMock.mockResolvedValue(mockTokenResult);
  helperMocks.getQuotationFileDetails.mockResolvedValue({
    fileData: 'base64data',
    mimeType: 'application/pdf',
    filename: 'quote-terms.pdf',
  });
};

describe('view pdf quote terms', () => {
  it('renders the Note label, prefix text, Terms link, and suffix text', () => {
    expect.hasAssertions();

    resetViewPdfQuoteTermsMocks();

    const { container } = render(<ViewPdfQuoteTerms {...defaultProps} />);

    expect(screen.getByText('Note:')).toBeInTheDocument();
    expect(screen.getByText(/Please review the/)).toBeInTheDocument();
    expect(getTermsAnchor(container)).toHaveTextContent('Terms');
    expect(screen.getByText(/before accepting/)).toBeInTheDocument();
  });

  it('opens the PDF at the correct page and tracks a GA event on click', async () => {
    expect.hasAssertions();

    resetViewPdfQuoteTermsMocks();

    const user = userEvent.setup();
    const setIsLoading = vi.fn<ViewPdfQuoteTermsProps['setIsLoading']>();
    const { container } = render(
      <ViewPdfQuoteTerms {...defaultProps} setIsLoading={setIsLoading} />,
    );

    await user.click(getTermsAnchor(container));

    await waitFor(() => {
      const [tokenRequest] = acquireTokenSilentMock.mock.calls.at(-1) ?? [];
      const fileDetailsRequest =
        helperMocks.getQuotationFileDetails.mock.calls.at(-1);
      const fileUrlRequest = helperMocks.getFileUrlFromBase64.mock.calls.at(-1);
      const openPdfPageRequest =
        helperMocks.openPdfPageInNewTab.mock.calls.at(-1);
      const gaEvent = trackGAEventMock.mock.calls.at(-1);
      const loadingStates = setIsLoading.mock.calls.map(([state]) => state);

      expect({
        tokenRequest,
        fileDetailsRequest,
        fileUrlRequest,
        openPdfPageRequest,
        gaEvent,
        loadingStates,
      }).toMatchObject({
        tokenRequest: {
          account: { homeAccountId: 'test-account' },
          scopes: ['openid', 'openid'],
        },
        fileDetailsRequest: ['test-access-token', mockQuotationData, true],
        fileUrlRequest: ['base64data'],
        openPdfPageRequest: ['blob:test-url', '2'],
        gaEvent: ['Terms', 'download'],
        loadingStates: [true, false],
      });
    });
  });

  it('sets a file error and clears loading when the token request fails', async () => {
    expect.hasAssertions();

    resetViewPdfQuoteTermsMocks();

    const user = userEvent.setup();
    const setFileError = vi.fn<ViewPdfQuoteTermsProps['setFileError']>();
    const setIsLoading = vi.fn<ViewPdfQuoteTermsProps['setIsLoading']>();
    acquireTokenSilentMock.mockRejectedValue(new Error('Token expired'));
    const { container } = render(
      <ViewPdfQuoteTerms
        {...defaultProps}
        setFileError={setFileError}
        setIsLoading={setIsLoading}
      />,
    );

    await user.click(getTermsAnchor(container));

    await waitFor(() => {
      expect(setFileError).toHaveBeenCalledWith(true);
      expect(setIsLoading).toHaveBeenCalledWith(false);
      expect(helperMocks.openPdfPageInNewTab).not.toHaveBeenCalled();
    });
  });

  it('skips opening the PDF when the file response is incomplete', async () => {
    expect.hasAssertions();

    resetViewPdfQuoteTermsMocks();

    const user = userEvent.setup();
    helperMocks.getQuotationFileDetails.mockResolvedValue(undefined);
    const { container } = render(<ViewPdfQuoteTerms {...defaultProps} />);

    await user.click(getTermsAnchor(container));

    await waitFor(() => {
      expect(helperMocks.openPdfPageInNewTab).not.toHaveBeenCalled();
    });
  });

  it('returns from the handler before any work when quotationData is undefined', async () => {
    expect.hasAssertions();

    resetViewPdfQuoteTermsMocks();

    const user = userEvent.setup();
    const setIsLoading = vi.fn<ViewPdfQuoteTermsProps['setIsLoading']>();
    const { container } = render(
      <ViewPdfQuoteTerms
        {...defaultProps}
        quotationData={undefined}
        setIsLoading={setIsLoading}
      />,
    );

    // The Terms link always renders, so the click reaches the handler, which
    // hits `if (!quotationData) return;` before any loading/token/fetch work.
    await user.click(getTermsAnchor(container));

    // The GA event still fires (it runs after the early-returning handler).
    await waitFor(() => {
      expect(trackGAEventMock).toHaveBeenCalledWith('Terms', 'download');
    });
    expect(setIsLoading).not.toHaveBeenCalled();
    expect(acquireTokenSilentMock).not.toHaveBeenCalled();
    expect(helperMocks.getQuotationFileDetails).not.toHaveBeenCalled();
  });
});
