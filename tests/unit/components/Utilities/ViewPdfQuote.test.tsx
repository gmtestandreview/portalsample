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
  getFileSize,
  getFileUrlFromBase64,
  getQuotationFileDetails,
  openInNewTab,
} from '@/routes/common/helperFunctions';
import type { trackGAEvent } from '@/analytics/GoogleAnalytics';
import type AppLogger from '@/instrumentation/AppLogger';
import ViewPdfQuote from '@/components/Utilities/ViewPdfQuote';
import type { ViewPdfQuoteProps } from '@/components/Utilities/ViewPdfQuote';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const helperMocks = vi.hoisted(() => ({
  getQuotationFileDetails: vi.fn<typeof getQuotationFileDetails>(),
  getFileUrlFromBase64: vi.fn<typeof getFileUrlFromBase64>(
    () => 'blob:test-url',
  ),
  getFileSize: vi.fn<typeof getFileSize>(() => '1.2 MB'),
  openInNewTab: vi.fn<typeof openInNewTab>(),
}));

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

// ── Module mocks ──────────────────────────────────────────────────────────────

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

  // Stable object reference: prevents useEffect from re-firing due to
  // new object identity on every useMsal() call (see dashboard.test.tsx pattern)
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
    ({
      trackGAEvent: vi.fn<typeof trackGAEvent>(),
    }) satisfies Partial<__TestMockModule22>,
);

vi.mock(
  import('@/instrumentation/AppLogger'),
  () =>
    ({
      default: mockAppLogger,
    }) satisfies Partial<__TestMockModule5>,
);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockQuotationData = {
  crmQuoteRequestId: 'Q-001',
  quoteRequestStatus: 'Offered',
} as unknown as RequestForQuoteDetails;

const defaultProps = {
  text: 'Download Quote',
  quotationData: mockQuotationData,
  setFileError: vi.fn<ViewPdfQuoteProps['setFileError']>(),
  setIsLoading: vi.fn<ViewPdfQuoteProps['setIsLoading']>(),
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
  accessToken: 'test-token',
  fromCache: false,
  expiresOn: new Date('2026-01-01T00:00:00.000Z'),
  tokenType: 'Bearer',
  correlationId: 'test-correlation-id',
} satisfies AuthenticationResult & {
  account: NonNullable<AuthenticationResult['account']>;
};

// ── Tests ─────────────────────────────────────────────────────────────────────

const resetViewPdfQuoteMocks = () => {
  vi.clearAllMocks();
  // Restore after clearAllMocks resets implementations (Vitest 4 behaviour)
  acquireTokenSilentMock.mockResolvedValue(mockTokenResult);
  mockMsalState.getMsalContext().instance.acquireTokenSilent =
    acquireTokenSilentMock;
  helperMocks.getQuotationFileDetails.mockResolvedValue({
    fileSizeBytes: 1234567,
    fileData: 'base64data',
    mimeType: 'application/pdf',
    filename: 'quote.pdf',
  });
  helperMocks.getFileSize.mockReturnValue('1.2 MB');
  helperMocks.getFileUrlFromBase64.mockReturnValue('blob:test-url');
};

describe('view pdf quote', () => {
  it('shows the loading spinner while the file size is being fetched', () => {
    expect.hasAssertions();

    resetViewPdfQuoteMocks();

    acquireTokenSilentMock.mockReturnValue(
      new Promise(() => {
        // Never resolves — simulates an in-flight request for loading-state assertions.
      }),
    );

    render(<ViewPdfQuote {...defaultProps} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Loading data...');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the download button with the file size after a successful mount fetch', async () => {
    expect.hasAssertions();

    resetViewPdfQuoteMocks();

    render(<ViewPdfQuote {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Download Quote/i }),
      ).toBeInTheDocument();
    });

    expect(helperMocks.getQuotationFileDetails).toHaveBeenCalledWith(
      'test-token',
      mockQuotationData,
      false, // size-only flag
    );
    expect(helperMocks.getFileSize).toHaveBeenCalledWith(1234567);
    expect(screen.getByText(/1\.2 MB/)).toBeInTheDocument();
    expect(defaultProps.setFileError).toHaveBeenCalledWith(false);
  });

  it('sets a file error and removes the spinner when the size fetch throws', async () => {
    expect.hasAssertions();

    resetViewPdfQuoteMocks();

    const setFileError = vi.fn<ViewPdfQuoteProps['setFileError']>();
    acquireTokenSilentMock.mockRejectedValue(new Error('Token expired'));

    render(<ViewPdfQuote {...defaultProps} setFileError={setFileError} />);

    await waitFor(() => {
      expect(setFileError).toHaveBeenCalledWith(true);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('skips setting file size when the response has no fileSizeBytes', async () => {
    expect.hasAssertions();

    resetViewPdfQuoteMocks();

    helperMocks.getQuotationFileDetails.mockResolvedValue({});

    render(<ViewPdfQuote {...defaultProps} />);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    expect(helperMocks.getFileSize).not.toHaveBeenCalled();
  });

  it('fetches and opens the full PDF in a new tab when the button is clicked', async () => {
    expect.hasAssertions();

    resetViewPdfQuoteMocks();

    const user = userEvent.setup();
    const setIsLoading = vi.fn<ViewPdfQuoteProps['setIsLoading']>();

    render(<ViewPdfQuote {...defaultProps} setIsLoading={setIsLoading} />);
    await waitFor(() =>
      screen.getByRole('button', { name: /Download Quote/i }),
    );

    await user.click(screen.getByRole('button', { name: /Download Quote/i }));

    await waitFor(() => {
      expect(helperMocks.getQuotationFileDetails).toHaveBeenCalledWith(
        'test-token',
        mockQuotationData,
        true, // full-file flag
      );
      expect(helperMocks.getFileUrlFromBase64).toHaveBeenCalledWith(
        'base64data',
      );
      expect(helperMocks.openInNewTab).toHaveBeenCalledWith('blob:test-url');
      expect(setIsLoading).toHaveBeenCalledWith(true);
      expect(setIsLoading).toHaveBeenCalledWith(false);
    });
  });

  it('sets a file error when the PDF download throws', async () => {
    expect.hasAssertions();

    resetViewPdfQuoteMocks();

    const user = userEvent.setup();
    const setFileError = vi.fn<ViewPdfQuoteProps['setFileError']>();
    const setIsLoading = vi.fn<ViewPdfQuoteProps['setIsLoading']>();

    render(
      <ViewPdfQuote
        {...defaultProps}
        setFileError={setFileError}
        setIsLoading={setIsLoading}
      />,
    );
    await waitFor(() =>
      screen.getByRole('button', { name: /Download Quote/i }),
    );

    acquireTokenSilentMock.mockRejectedValueOnce(new Error('Network failure'));
    await user.click(screen.getByRole('button', { name: /Download Quote/i }));

    await waitFor(() => {
      expect(setFileError).toHaveBeenCalledWith(true);
      expect(setIsLoading).toHaveBeenCalledWith(false);
      expect(helperMocks.openInNewTab).not.toHaveBeenCalled();
    });
  });

  it('skips opening the PDF when the file response is missing required fields', async () => {
    expect.hasAssertions();

    resetViewPdfQuoteMocks();

    const user = userEvent.setup();

    helperMocks.getQuotationFileDetails
      .mockResolvedValueOnce({ fileSizeBytes: 1234567 }) // size fetch on mount
      .mockResolvedValueOnce({ fileSizeBytes: 1234567 }); // click fetch — no fileData

    render(<ViewPdfQuote {...defaultProps} />);
    await waitFor(() =>
      screen.getByRole('button', { name: /Download Quote/i }),
    );

    await user.click(screen.getByRole('button', { name: /Download Quote/i }));

    await waitFor(() => {
      expect(helperMocks.openInNewTab).not.toHaveBeenCalled();
    });
  });

  it('skips the mount size fetch entirely when quotationData is undefined', async () => {
    expect.hasAssertions();

    resetViewPdfQuoteMocks();

    render(<ViewPdfQuote {...defaultProps} quotationData={undefined} />);

    // The size-fetch effect returns before any token/file work.
    await waitFor(() => {
      expect(acquireTokenSilentMock).not.toHaveBeenCalled();
    });

    expect(helperMocks.getQuotationFileDetails).not.toHaveBeenCalled();
  });

  it('returns early from the view handler when quotationData has been cleared', async () => {
    expect.hasAssertions();

    resetViewPdfQuoteMocks();

    const user = userEvent.setup();
    const setIsLoading = vi.fn<ViewPdfQuoteProps['setIsLoading']>();

    // Mount with data so the size fetch completes and the button renders.
    const { rerender } = render(
      <ViewPdfQuote {...defaultProps} setIsLoading={setIsLoading} />,
    );
    await waitFor(() =>
      screen.getByRole('button', { name: /Download Quote/i }),
    );

    // Clear the data while the button stays rendered; clicking now hits the
    // `if (!quotationData) return;` guard before any loading/fetch work.
    rerender(
      <ViewPdfQuote
        {...defaultProps}
        quotationData={undefined}
        setIsLoading={setIsLoading}
      />,
    );
    helperMocks.getQuotationFileDetails.mockClear();
    setIsLoading.mockClear();

    await user.click(screen.getByRole('button', { name: /Download Quote/i }));

    expect(setIsLoading).not.toHaveBeenCalled();
    expect(helperMocks.getQuotationFileDetails).not.toHaveBeenCalled();
    expect(helperMocks.openInNewTab).not.toHaveBeenCalled();
  });

  it('calls the latest setFileError when quotationData changes and the setter reference has changed', async () => {
    expect.hasAssertions();

    resetViewPdfQuoteMocks();

    // Regression for exhaustive-deps fix: without setFileError in the dep array,
    // re-running the effect (triggered by a quotationData change) would call the
    // stale firstSetter even though secondSetter is now the active prop.
    const firstSetter = vi.fn<ViewPdfQuoteProps['setFileError']>();
    const secondSetter = vi.fn<ViewPdfQuoteProps['setFileError']>();
    const updatedQuotationData = {
      ...mockQuotationData,
      crmQuoteRequestId: 'Q-002',
    } as unknown as RequestForQuoteDetails;

    // First render: completes successfully — firstSetter is called with false
    const { rerender } = render(
      <ViewPdfQuote {...defaultProps} setFileError={firstSetter} />,
    );
    await waitFor(() =>
      screen.getByRole('button', { name: /Download Quote/i }),
    );

    expect(firstSetter).not.toHaveBeenCalledWith(true);

    // Re-render: quotationData changes (triggers effect re-run) and setter swaps
    acquireTokenSilentMock.mockRejectedValue(new Error('Token failed'));
    rerender(
      <ViewPdfQuote
        {...defaultProps}
        quotationData={updatedQuotationData}
        setFileError={secondSetter}
      />,
    );

    // With the fix: the re-run effect captures the fresh secondSetter
    await waitFor(() => {
      expect(secondSetter).toHaveBeenCalledWith(true);
    });

    // firstSetter must not have been called with true at any point
    expect(firstSetter).not.toHaveBeenCalledWith(true);
  });
});
