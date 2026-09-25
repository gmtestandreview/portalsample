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

vi.mock('@azure/msal-react', () => ({
    useMsal: () => msalContext,
}));

vi.mock('@/routes/common/helperFunctions', () => helperMocks);

vi.mock('@/analytics/GoogleAnalytics', () => ({
    trackGAEvent: vi.fn(),
}));

vi.mock('@/instrumentation/AppLogger', () => ({
    default: { verbose: vi.fn(), error: vi.fn() },
}));

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

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ViewPdfQuote', () => {
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
        acquireTokenSilentMock.mockReturnValue(new Promise(() => {})); // never resolves

        render(<ViewPdfQuote {...defaultProps} />);

        expect(screen.getByRole('alert')).toHaveTextContent('Loading data...');
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('shows the download button with the file size after a successful mount fetch', async () => {
        render(<ViewPdfQuote {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Download Quote/i })).toBeInTheDocument();
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
        const setFileError = vi.fn();
        acquireTokenSilentMock.mockRejectedValue(new Error('Token expired'));

        render(<ViewPdfQuote {...defaultProps} setFileError={setFileError} />);

        await waitFor(() => {
            expect(setFileError).toHaveBeenCalledWith(true);
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });
    });

    it('skips setting file size when the response has no fileSizeBytes', async () => {
        helperMocks.getQuotationFileDetails.mockResolvedValue({});

        render(<ViewPdfQuote {...defaultProps} />);

        await waitFor(() => {
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });
        expect(helperMocks.getFileSize).not.toHaveBeenCalled();
    });

    it('fetches and opens the full PDF in a new tab when the button is clicked', async () => {
        const user = userEvent.setup();
        const setIsLoading = vi.fn();

        render(<ViewPdfQuote {...defaultProps} setIsLoading={setIsLoading} />);
        await waitFor(() => screen.getByRole('button', { name: /Download Quote/i }));

        await user.click(screen.getByRole('button', { name: /Download Quote/i }));

        await waitFor(() => {
            expect(helperMocks.getQuotationFileDetails).toHaveBeenCalledWith(
                'test-token',
                mockQuotationData,
                true, // full-file flag
            );
            expect(helperMocks.getFileUrlFromBase64).toHaveBeenCalledWith('base64data');
            expect(helperMocks.openInNewTab).toHaveBeenCalledWith('blob:test-url');
            expect(setIsLoading).toHaveBeenCalledWith(true);
            expect(setIsLoading).toHaveBeenCalledWith(false);
        });
    });

    it('sets a file error when the PDF download throws', async () => {
        const user = userEvent.setup();
        const setFileError = vi.fn();
        const setIsLoading = vi.fn();

        render(<ViewPdfQuote {...defaultProps} setFileError={setFileError} setIsLoading={setIsLoading} />);
        await waitFor(() => screen.getByRole('button', { name: /Download Quote/i }));

        acquireTokenSilentMock.mockRejectedValueOnce(new Error('Network failure'));
        await user.click(screen.getByRole('button', { name: /Download Quote/i }));

        await waitFor(() => {
            expect(setFileError).toHaveBeenCalledWith(true);
            expect(setIsLoading).toHaveBeenCalledWith(false);
            expect(helperMocks.openInNewTab).not.toHaveBeenCalled();
        });
    });

    it('skips opening the PDF when the file response is missing required fields', async () => {
        const user = userEvent.setup();

        helperMocks.getQuotationFileDetails
            .mockResolvedValueOnce({ fileSizeBytes: 1234567 }) // size fetch on mount
            .mockResolvedValueOnce({ fileSizeBytes: 1234567 }); // click fetch — no fileData

        render(<ViewPdfQuote {...defaultProps} />);
        await waitFor(() => screen.getByRole('button', { name: /Download Quote/i }));

        await user.click(screen.getByRole('button', { name: /Download Quote/i }));

        await waitFor(() => {
            expect(helperMocks.openInNewTab).not.toHaveBeenCalled();
        });
    });

    it('calls the latest setFileError when quotationData changes and the setter reference has changed', async () => {
        // Regression for exhaustive-deps fix: without setFileError in the dep array,
        // re-running the effect (triggered by a quotationData change) would call the
        // stale firstSetter even though secondSetter is now the active prop.
        const firstSetter = vi.fn();
        const secondSetter = vi.fn();
        const updatedQuotationData = {
            ...mockQuotationData,
            crmQuoteRequestId: 'Q-002',
        } as unknown as RequestForQuoteDetails;

        // First render: completes successfully — firstSetter is called with false
        const { rerender } = render(<ViewPdfQuote {...defaultProps} setFileError={firstSetter} />);
        await waitFor(() => screen.getByRole('button', { name: /Download Quote/i }));
        expect(firstSetter).not.toHaveBeenCalledWith(true);

        // Re-render: quotationData changes (triggers effect re-run) and setter swaps
        acquireTokenSilentMock.mockRejectedValue(new Error('Token failed'));
        rerender(<ViewPdfQuote {...defaultProps} quotationData={updatedQuotationData} setFileError={secondSetter} />);

        // With the fix: the re-run effect captures the fresh secondSetter
        await waitFor(() => {
            expect(secondSetter).toHaveBeenCalledWith(true);
        });
        // firstSetter must not have been called with true at any point
        expect(firstSetter).not.toHaveBeenCalledWith(true);
    });
});
