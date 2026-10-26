import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  AuthenticationResult,
  IPublicClientApplication,
} from '@azure/msal-browser';
import type { RequestForQuoteDetails } from '@/api/web-api-client';
import type {
  getFileUrlFromBase64,
  getQuotationFileDetails,
  getQuoteOfferPageNumber,
  openPdfPageInNewTab,
} from '@/routes/common/helperFunctions';
import type { trackGAEvent } from '@/analytics/GoogleAnalytics';
import type AppLogger from '@/instrumentation/AppLogger';
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
const acquireTokenSilentMock = vi.hoisted(() =>
  vi.fn<IPublicClientApplication['acquireTokenSilent']>(),
);

vi.mock(
  '@azure/msal-react',
  () =>
    ({
      useMsal: () => ({
        accounts: [{ homeAccountId: 'test-account' }],
        instance: { acquireTokenSilent: acquireTokenSilentMock },
      }),
    }) satisfies __ExactMockModule<__TestMockModule2>,
);

vi.mock(
  '@/routes/common/helperFunctions',
  () => helperMocks satisfies __ExactMockModule<__TestMockModule9>,
);

vi.mock(
  import('@/analytics/GoogleAnalytics'),
  () =>
    ({
      trackGAEvent: trackGAEventMock,
    }) satisfies __ExactMockModule<__TestMockModule22>,
);

vi.mock(
  '@/instrumentation/AppLogger',
  () =>
    ({
      default: {
        verbose: vi.fn<typeof AppLogger.verbose>(),
        error: vi.fn<typeof AppLogger.error>(),
      },
    }) satisfies __ExactMockModule<__TestMockModule5>,
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
  container.querySelector('a.nmi-in-text-link') as HTMLElement;

describe(ViewPdfQuoteTerms, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    acquireTokenSilentMock.mockResolvedValue(mockTokenResult);
    helperMocks.getQuotationFileDetails.mockResolvedValue({
      fileData: 'base64data',
      mimeType: 'application/pdf',
      filename: 'quote-terms.pdf',
    });
  });

  it('renders the Note label, prefix text, Terms link, and suffix text', () => {
    expect.hasAssertions();
    const { container } = render(<ViewPdfQuoteTerms {...defaultProps} />);

    expect(screen.getByText('Note:')).toBeInTheDocument();
    expect(screen.getByText(/Please review the/)).toBeInTheDocument();
    expect(getTermsAnchor(container)).toHaveTextContent('Terms');
    expect(screen.getByText(/before accepting/)).toBeInTheDocument();
  });

  it('opens the PDF at the correct page and tracks a GA event on click', async () => {
    expect.hasAssertions();
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
    const user = userEvent.setup();
    helperMocks.getQuotationFileDetails.mockResolvedValue(undefined);
    const { container } = render(<ViewPdfQuoteTerms {...defaultProps} />);

    await user.click(getTermsAnchor(container));

    await waitFor(() => {
      expect(helperMocks.openPdfPageInNewTab).not.toHaveBeenCalled();
    });
  });
});
