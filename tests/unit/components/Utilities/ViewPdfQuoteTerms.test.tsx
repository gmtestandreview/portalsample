import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestForQuoteDetails } from '@/api/web-api-client';
import ViewPdfQuoteTerms from '@/components/Utilities/ViewPdfQuoteTerms';

const helperMocks = vi.hoisted(() => ({
    getQuotationFileDetails: vi.fn(),
    getFileUrlFromBase64: vi.fn(() => 'blob:test-url'),
    getQuoteOfferPageNumber: vi.fn(() => 2),
    openPdfPageInNewTab: vi.fn(),
}));

const trackGAEventMock = vi.hoisted(() => vi.fn());
const acquireTokenSilentMock = vi.hoisted(() => vi.fn());

vi.mock('@azure/msal-react', () => ({
    useMsal: () => ({
        accounts: [{ homeAccountId: 'test-account' }],
        instance: { acquireTokenSilent: acquireTokenSilentMock },
    }),
}));

vi.mock('@/routes/common/helperFunctions', () => helperMocks);

vi.mock('@/analytics/GoogleAnalytics', () => ({
    trackGAEvent: trackGAEventMock,
}));

vi.mock('@/instrumentation/AppLogger', () => ({
    default: { verbose: vi.fn(), error: vi.fn() },
}));

const mockQuotationData = {
    crmQuoteRequestId: 'Q-001',
    quoteRequestStatus: 'Offered',
} as unknown as RequestForQuoteDetails;

const defaultProps = {
    prefixText: 'Please review the ',
    suffixText: ' before accepting.',
    quotationData: mockQuotationData,
    setFileError: vi.fn(),
    setIsLoading: vi.fn(),
};

// InTextLink renders <a> without href when only onClick is supplied.
// An <a> without href has no ARIA "link" role, so queries use the element directly.
const getTermsAnchor = (container: HTMLElement) =>
    container.querySelector('a.nmi-in-text-link') as HTMLElement;

describe('ViewPdfQuoteTerms', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        acquireTokenSilentMock.mockResolvedValue({ accessToken: 'test-access-token' });
        helperMocks.getQuotationFileDetails.mockResolvedValue({
            fileData: 'base64data',
            mimeType: 'application/pdf',
            filename: 'quote-terms.pdf',
        });
    });

    it('renders the Note label, prefix text, Terms link, and suffix text', () => {
        const { container } = render(<ViewPdfQuoteTerms {...defaultProps} />);

        expect(screen.getByText('Note:')).toBeInTheDocument();
        expect(screen.getByText(/Please review the/)).toBeInTheDocument();
        expect(getTermsAnchor(container)).toHaveTextContent('Terms');
        expect(screen.getByText(/before accepting/)).toBeInTheDocument();
    });

    it('opens the PDF at the correct page and tracks a GA event on click', async () => {
        const user = userEvent.setup();
        const setIsLoading = vi.fn();
        const { container } = render(<ViewPdfQuoteTerms {...defaultProps} setIsLoading={setIsLoading} />);

        await user.click(getTermsAnchor(container));

        await waitFor(() => {
            expect(acquireTokenSilentMock).toHaveBeenCalled();
            expect(helperMocks.getQuotationFileDetails).toHaveBeenCalledWith(
                'test-access-token',
                mockQuotationData,
                true,
            );
            expect(helperMocks.getFileUrlFromBase64).toHaveBeenCalledWith('base64data');
            expect(helperMocks.openPdfPageInNewTab).toHaveBeenCalledWith('blob:test-url', 2);
            expect(trackGAEventMock).toHaveBeenCalledWith('Terms', 'download');
            expect(setIsLoading).toHaveBeenCalledWith(true);
            expect(setIsLoading).toHaveBeenCalledWith(false);
        });
    });

    it('sets a file error and clears loading when the token request fails', async () => {
        const user = userEvent.setup();
        const setFileError = vi.fn();
        const setIsLoading = vi.fn();
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
        const user = userEvent.setup();
        helperMocks.getQuotationFileDetails.mockResolvedValue(null);
        const { container } = render(<ViewPdfQuoteTerms {...defaultProps} />);

        await user.click(getTermsAnchor(container));

        await waitFor(() => {
            expect(helperMocks.openPdfPageInNewTab).not.toHaveBeenCalled();
        });
    });
});
