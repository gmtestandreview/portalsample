import { render, screen, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { RequestForQuoteDetails } from '@/api/web-api-client';

import ViewPdfQuote from '@/components/Utilities/ViewPdfQuote';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const helperMocks = vi.hoisted(() => ({
  getQuotationFileDetails: vi.fn(),
  getFileUrlFromBase64: vi.fn(() => 'blob:test-url'),
  getFileSize: vi.fn(() => '1.2 MB'),
  openInNewTab: vi.fn(),
}));

const { acquireTokenSilentMock, msalContext } = vi.hoisted(() => {
  const acquireTokenSilentMock = vi.fn();
  // Stable object reference: prevents useEffect from re-firing due to
  // new object identity on every useMsal() call (see dashboard.test.tsx pattern)
  const msalContext = {
    accounts: [{ homeAccountId: 'test-account' }],
    instance: { acquireTokenSilent: acquireTokenSilentMock },
  };
  return { acquireTokenSilentMock, msalContext };
});

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock(
  import('@azure/msal-react'),
  () =>
    ({
      useMsal: () => msalContext,
    }) satisfies __ExactMockModule<__TestMockModule2>,
);

vi.mock(
  import('@/routes/common/helperFunctions'),
  () => helperMocks satisfies __ExactMockModule<__TestMockModule9>,
);

vi.mock(
  import('@/analytics/GoogleAnalytics'),
  () =>
    ({
      trackGAEvent: vi.fn(),
    }) satisfies __ExactMockModule<__TestMockModule22>,
);

vi.mock(
  import('@/instrumentation/AppLogger'),
  () =>
    ({
      default: { verbose: vi.fn(), error: vi.fn() },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockQuotationData = {
  crmQuoteRequestId: 'Q-001',
  quoteRequestStatus: 'Offered',
} as unknown as RequestForQuoteDetails;

const defaultProps = {
  text: 'Download Quote',
  quotationData: mockQuotationData,
  setFileError: vi.fn(),
  setIsLoading: vi.fn(),
};

describe(ViewPdfQuote, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore after clearAllMocks resets implementations (Vitest 4 behaviour)
    acquireTokenSilentMock.mockResolvedValue({ accessToken: 'test-token' });
    msalContext.instance.acquireTokenSilent = acquireTokenSilentMock;
    helperMocks.getQuotationFileDetails.mockResolvedValue({
      fileSizeBytes: 1234567,
      fileData: 'base64data',
      mimeType: 'application/pdf',
      filename: 'quote.pdf',
    });
    helperMocks.getFileSize.mockReturnValue('1.2 MB');
    helperMocks.getFileUrlFromBase64.mockReturnValue('blob:test-url');
  });
  it('shows the loading spinner while the file size is being fetched', () => {
    expect.assertions(2);
    acquireTokenSilentMock.mockReturnValue(new Promise(() => {})); // never resolves

    render(<ViewPdfQuote {...defaultProps} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Loading data...');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
