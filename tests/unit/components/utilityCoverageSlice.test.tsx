import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    Link, MemoryRouter, Route, Routes,
} from 'react-router';
import findElementInTreeById from '../../../ClientApp/src/components/Utilities/findElementInTreeById';
import HashLink from '../../../ClientApp/src/components/Utilities/hashLink';
import MailingLabel from '../../../ClientApp/src/components/Utilities/mailingLabel';
import RouteChangeScrollTop from '../../../ClientApp/src/components/Utilities/routeChangeScrollTop';
import ViewMeasurementReport from '../../../ClientApp/src/components/Utilities/ViewMeasurementReport';
import ViewPdfButton from '../../../ClientApp/src/components/Utilities/ViewPdfButton';
import ViewPdfQuote from '../../../ClientApp/src/components/Utilities/ViewPdfQuote';
import ViewPdfQuoteTerms from '../../../ClientApp/src/components/Utilities/ViewPdfQuoteTerms';
import { trackGAEvent } from '../../../ClientApp/src/analytics/GoogleAnalytics';
import {
    getFileSize,
    getFileUrlFromBase64,
    getQuotationFileDetails,
    getQuoteOfferPageNumber,
    handleReportFileError,
    openInNewTab,
    openPdfPageInNewTab,
} from '../../../ClientApp/src/routes/common/helperFunctions';
import { DashboardClient } from '../../../ClientApp/src/api/web-api-client';

const mocks = vi.hoisted(() => {
    const acquireTokenSilent = vi.fn();
    const getQuoteReportPDFByID = vi.fn();

    return {
        acquireTokenSilent,
        getQuoteReportPDFByID,
    };
});

vi.mock('@azure/msal-react', () => ({
    useMsal: () => ({
        accounts: [{ homeAccountId: 'account-1' }],
        instance: {
            acquireTokenSilent: mocks.acquireTokenSilent,
        },
    }),
}));

vi.mock('../../../ClientApp/src/analytics/GoogleAnalytics', () => ({
    trackGAEvent: vi.fn(),
}));

vi.mock('../../../ClientApp/src/storage/notification', () => ({
    clearDashboardNotification: vi.fn(),
}));

vi.mock('../../../ClientApp/src/instrumentation/AppLogger', () => ({
    default: {
        verbose: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('../../../ClientApp/src/api/web-api-client', () => ({
    DashboardClient: vi.fn(function (this: { setAuthToken: ReturnType<typeof vi.fn>, getQuoteReportPDFByID: ReturnType<typeof vi.fn> }) {
        this.setAuthToken = vi.fn();
        this.getQuoteReportPDFByID = mocks.getQuoteReportPDFByID;
    }),
}));

vi.mock('../../../ClientApp/src/routes/common/helperFunctions', () => ({
    getFileSize: vi.fn((bytes: number) => `${bytes} bytes`),
    getFileUrlFromBase64: vi.fn((fileData: string) => `blob:${fileData}`),
    getQuotationFileDetails: vi.fn(),
    getQuoteOfferPageNumber: vi.fn(() => '5'),
    handleReportFileError: vi.fn(),
    openInNewTab: vi.fn(),
    openPdfPageInNewTab: vi.fn(),
}));

const quotationData = {
    crmQuoteRequestId: 'crm-quote-1',
    quoteRequestStatus: 'QuoteAccepted',
};

const RouteHarness = ({ showTitle }: { showTitle: boolean }) => (
    <MemoryRouter initialEntries={['/first']}>
        {showTitle ? <h1 id='page-title' tabIndex={-1}>Page title</h1> : <div id='page-top' tabIndex={-1}>Top</div>}
        <RouteChangeScrollTop />
        <Link to='/second'>Second page</Link>
        <Routes>
            <Route path='/first' element={<p>First</p>} />
            <Route path='/second' element={<p>Second</p>} />
        </Routes>
    </MemoryRouter>
);

describe('utility component coverage slice', () => {
    const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'token-1' });
        mocks.getQuoteReportPDFByID.mockResolvedValue({ fileSizeBytes: 2048 });
        vi.mocked(getQuotationFileDetails).mockResolvedValue({ fileSizeBytes: 4096 } as any);
    });

    afterEach(() => {
        vi.useRealTimers();
        document.body.innerHTML = '';
        if (originalClipboard) {
            Object.defineProperty(navigator, 'clipboard', originalClipboard);
        } else {
            Reflect.deleteProperty(navigator, 'clipboard');
        }
        vi.restoreAllMocks();
    });

    it('finds an ancestor by id and returns false for null or missing ancestors', () => {
        const wrapper = document.createElement('section');
        wrapper.id = 'wrapper-id';
        const child = document.createElement('div');
        const grandchild = document.createElement('button');
        wrapper.appendChild(child);
        child.appendChild(grandchild);

        expect(findElementInTreeById(grandchild, 'wrapper-id')).toBe(true);
        expect(findElementInTreeById(grandchild, 'missing-id')).toBe(false);
        expect(findElementInTreeById(null, 'wrapper-id')).toBe(false);
    });

    it('scrolls and focuses a hash target without an accordion delay', () => {
        vi.useFakeTimers();
        const target = document.createElement('h2');
        target.id = 'target-section';
        target.tabIndex = -1;
        document.body.appendChild(target);
        const focus = vi.spyOn(target, 'focus');

        render(<HashLink to='#target-section' scrollToBlock='center'>Target</HashLink>);
        fireEvent.click(screen.getByRole('link', { name: 'Target' }));
        act(() => vi.runOnlyPendingTimers());

        expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
        expect(focus).toHaveBeenCalled();
    });

    it('expands a collapsed accordion before scrolling to a hash target', () => {
        vi.useFakeTimers();
        document.body.innerHTML = `
            <div class="accordion-item">
                <button class="accordion-button collapsed">Section</button>
                <div class="accordion-collapse collapse">
                    <h2 id="inside-accordion" tabindex="-1">Inside accordion</h2>
                </div>
            </div>
        `;
        const target = document.querySelector('#inside-accordion') as HTMLElement;
        const collapse = document.querySelector('.accordion-collapse') as HTMLElement;
        const button = document.querySelector('button') as HTMLButtonElement;
        const buttonClick = vi.spyOn(button, 'click');

        render(<HashLink to='#inside-accordion'>Inside</HashLink>);
        fireEvent.click(screen.getByRole('link', { name: 'Inside' }));

        expect(collapse).toHaveAttribute('class', 'accordion-collapse collapse show');
        expect(buttonClick).toHaveBeenCalled();
        expect(target.scrollIntoView).not.toHaveBeenCalled();

        act(() => vi.advanceTimersByTime(300));
        expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: undefined });
    });

    it('scrolls to the top and focuses page title after route changes', () => {
        vi.useFakeTimers();
        render(<RouteHarness showTitle />);
        const title = document.querySelector('#page-title') as HTMLElement;
        const focus = vi.spyOn(title, 'focus');

        fireEvent.click(screen.getByRole('link', { name: 'Second page' }));
        act(() => vi.advanceTimersByTime(600));

        expect(globalThis.scrollTo).toHaveBeenCalledWith(0, 0);
        expect(focus).toHaveBeenCalled();
    });

    it('focuses page top when the route has no page title', () => {
        vi.useFakeTimers();
        render(<RouteHarness showTitle={false} />);
        const pageTop = document.querySelector('#page-top') as HTMLElement;
        const focus = vi.spyOn(pageTop, 'focus');

        fireEvent.click(screen.getByRole('link', { name: 'Second page' }));
        act(() => vi.advanceTimersByTime(100));

        expect(focus).toHaveBeenCalled();
    });

    it('prints, copies and can hide mailing label actions', async () => {
        const print = vi.spyOn(globalThis, 'print').mockImplementation(() => undefined);
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText },
        });

        const { rerender } = render(
            <MailingLabel
                quotationIdNum='Q-123'
                nmiTestOfficerName='Alex Officer'
                nmiFacilityName='NMI Lab'
                nmiFacilityAddress='1 Measurement Way'
            />,
        );
        Object.defineProperty(document.querySelector('#printable-label'), 'innerText', {
            configurable: true,
            value: 'Deliver to:\nQuotation ID: Q-123\nATTN: Alex Officer\nNMI Lab\n1 Measurement Way',
        });

        fireEvent.click(screen.getByRole('button', { name: /print/i }));
        expect(print).toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: /copy/i }));
        await waitFor(() => expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument());
        expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Quotation ID: Q-123'));

        rerender(<MailingLabel showPrintOrCopy={false} />);
        expect(screen.queryByRole('button', { name: /print/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /copy/i })).not.toBeInTheDocument();
    });

    it('leaves the mailing label copy action available when clipboard copy fails', async () => {
        const writeText = vi.fn().mockRejectedValue(new Error('copy failed'));
        vi.spyOn(console, 'log').mockImplementation(() => undefined);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText },
        });

        render(<MailingLabel quotationIdNum='Q-123' />);
        Object.defineProperty(document.querySelector('#printable-label'), 'innerText', {
            configurable: true,
            value: 'Quotation ID: Q-123',
        });

        fireEvent.click(screen.getByRole('button', { name: /copy/i }));

        await waitFor(() => expect(writeText).toHaveBeenCalledWith('Quotation ID: Q-123'));
        expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /copied/i })).not.toBeInTheDocument();
    });

    it('renders loaded PDF buttons and tracks downloads', () => {
        const getPdf = vi.fn();

        render(<ViewPdfButton text='Download PDF' fileSize='1.00Mb' isLoaded getPdf={getPdf} gaLabel='report' />);
        fireEvent.click(screen.getByRole('button', { name: /download pdf/i }));

        expect(getPdf).toHaveBeenCalledOnce();
        expect(trackGAEvent).toHaveBeenCalledWith('report', 'download');
        expect(screen.getByText(/PDF file size 1.00Mb/i)).toBeInTheDocument();
    });

    it('renders loading state before a PDF button is loaded', () => {
        render(<ViewPdfButton text='Download PDF' fileSize='' isLoaded={false} getPdf={vi.fn()} gaLabel='report' />);

        expect(screen.getByText('Loading data...')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /download pdf/i })).not.toBeInTheDocument();
    });

    it('loads and opens an offered quote PDF', async () => {
        vi.mocked(getQuotationFileDetails).mockImplementation((_token, _data, getFile) => Promise.resolve(
            getFile ? {
                fileData: 'quote-data',
                mimeType: 'application/pdf',
                filename: 'quote.pdf',
            } : { fileSizeBytes: 4096 } as any,
        ));
        const setFileError = vi.fn();
        const setIsLoading = vi.fn();

        render(
            <ViewPdfQuote
                text='View quote'
                quotationData={quotationData as any}
                setFileError={setFileError}
                setIsLoading={setIsLoading}
            />,
        );

        await screen.findByRole('button', { name: /view quote/i });
        fireEvent.click(screen.getByRole('button', { name: /view quote/i }));

        await waitFor(() => expect(openInNewTab).toHaveBeenCalledWith('blob:quote-data'));
        expect(getFileSize).toHaveBeenCalledWith(4096);
        expect(getFileUrlFromBase64).toHaveBeenCalledWith('quote-data');
        expect(setIsLoading).toHaveBeenNthCalledWith(1, true);
        expect(setFileError).toHaveBeenLastCalledWith(false);
    });

    it('reports an offered quote PDF size load failure', async () => {
        vi.mocked(getQuotationFileDetails).mockRejectedValueOnce(new Error('size failed'));
        const setFileError = vi.fn();

        render(
            <ViewPdfQuote
                text='View quote'
                quotationData={quotationData as any}
                setFileError={setFileError}
                setIsLoading={vi.fn()}
            />,
        );

        await screen.findByRole('button', { name: /view quote/i });
        expect(setFileError).toHaveBeenCalledWith(true);
    });

    it('reports an offered quote PDF download failure', async () => {
        vi.mocked(getQuotationFileDetails).mockImplementation((_token, _data, getFile) => (
            getFile ? Promise.reject(new Error('download failed')) : Promise.resolve({ fileSizeBytes: 4096 } as any)
        ));
        const setFileError = vi.fn();
        const setIsLoading = vi.fn();

        render(
            <ViewPdfQuote
                text='View quote'
                quotationData={quotationData as any}
                setFileError={setFileError}
                setIsLoading={setIsLoading}
            />,
        );

        await screen.findByRole('button', { name: /view quote/i });
        fireEvent.click(screen.getByRole('button', { name: /view quote/i }));

        await waitFor(() => expect(setFileError).toHaveBeenLastCalledWith(true));
        expect(setIsLoading).toHaveBeenLastCalledWith(false);
    });

    it('loads and opens a measurement report PDF', async () => {
        mocks.getQuoteReportPDFByID.mockImplementation((_id: string, getFile: boolean) => Promise.resolve(
            getFile ? {
                fileData: 'report-data',
                mimeType: 'application/pdf',
                filename: 'report.pdf',
            } : { fileSizeBytes: 8192 },
        ));
        const setFileError = vi.fn();
        const setIsLoading = vi.fn();

        render(
            <ViewMeasurementReport
                text='View report'
                quotationData={quotationData as any}
                setFileError={setFileError}
                setIsLoading={setIsLoading}
            />,
        );

        await screen.findByRole('button', { name: /view report/i });
        fireEvent.click(screen.getByRole('button', { name: /view report/i }));

        await waitFor(() => expect(openInNewTab).toHaveBeenCalledWith('blob:report-data'));
        expect(DashboardClient).toHaveBeenCalled();
        expect(mocks.getQuoteReportPDFByID).toHaveBeenCalledWith('crm-quote-1', false);
        expect(mocks.getQuoteReportPDFByID).toHaveBeenCalledWith('crm-quote-1', true);
        expect(setIsLoading).toHaveBeenCalledWith(false);
    });

    it('handles measurement report PDF download failures', async () => {
        mocks.getQuoteReportPDFByID.mockImplementation((_id: string, getFile: boolean) => (
            getFile ? Promise.reject(new Error('download failed')) : Promise.resolve({ fileSizeBytes: 8192 })
        ));
        const setFileError = vi.fn();
        const setIsLoading = vi.fn();

        render(
            <ViewMeasurementReport
                text='View report'
                quotationData={quotationData as any}
                setFileError={setFileError}
                setIsLoading={setIsLoading}
            />,
        );

        await screen.findByRole('button', { name: /view report/i });
        fireEvent.click(screen.getByRole('button', { name: /view report/i }));

        await waitFor(() => expect(handleReportFileError).toHaveBeenCalled());
        expect(setFileError).toHaveBeenLastCalledWith(true);
        expect(setIsLoading).toHaveBeenCalledWith(false);
    });

    it('handles measurement report PDF size load failures', async () => {
        mocks.getQuoteReportPDFByID.mockRejectedValueOnce(new Error('size failed'));
        const setFileError = vi.fn();

        render(
            <ViewMeasurementReport
                text='View report'
                quotationData={quotationData as any}
                setFileError={setFileError}
                setIsLoading={vi.fn()}
            />,
        );

        await screen.findByRole('button', { name: /view report/i });
        expect(handleReportFileError).toHaveBeenCalled();
        expect(setFileError).toHaveBeenCalledWith(true);
    });

    it('handles missing measurement report metadata and absent quotation data', async () => {
        mocks.getQuoteReportPDFByID.mockResolvedValue({});
        const setFileError = vi.fn();
        const setIsLoading = vi.fn();

        const { rerender } = render(
            <ViewMeasurementReport
                text='View report'
                quotationData={quotationData as any}
                setFileError={setFileError}
                setIsLoading={setIsLoading}
            />,
        );

        await screen.findByRole('button', { name: /view report/i });
        fireEvent.click(screen.getByRole('button', { name: /view report/i }));
        await waitFor(() => expect(mocks.getQuoteReportPDFByID).toHaveBeenCalledWith('crm-quote-1', true));
        expect(openInNewTab).not.toHaveBeenCalled();
        expect(getFileSize).not.toHaveBeenCalled();

        rerender(
            <ViewMeasurementReport
                text='View report'
                quotationData={undefined}
                setFileError={setFileError}
                setIsLoading={setIsLoading}
            />,
        );
        expect(screen.getByRole('button', { name: /view report/i })).toBeInTheDocument();
    });

    it('does not request measurement report PDFs when the report id is missing', async () => {
        const setFileError = vi.fn();
        const setIsLoading = vi.fn();

        render(
            <ViewMeasurementReport
                text='View report'
                quotationData={{ quoteRequestStatus: 'QuoteAccepted' } as any}
                setFileError={setFileError}
                setIsLoading={setIsLoading}
            />,
        );

        await screen.findByRole('button', { name: /view report/i });
        fireEvent.click(screen.getByRole('button', { name: /view report/i }));

        expect(mocks.acquireTokenSilent).not.toHaveBeenCalled();
        expect(mocks.getQuoteReportPDFByID).not.toHaveBeenCalled();
        expect(openInNewTab).not.toHaveBeenCalled();
        expect(setIsLoading).toHaveBeenCalledWith(false);
    });

    it('does not open quote PDFs when file metadata is incomplete', async () => {
        vi.mocked(getQuotationFileDetails).mockResolvedValue({} as any);

        render(
            <ViewPdfQuote
                text='View quote'
                quotationData={quotationData as any}
                setFileError={vi.fn()}
                setIsLoading={vi.fn()}
            />,
        );

        await screen.findByRole('button', { name: /view quote/i });
        fireEvent.click(screen.getByRole('button', { name: /view quote/i }));
        await waitFor(() => expect(getQuotationFileDetails).toHaveBeenCalledWith(
            'token-1',
            quotationData,
            true,
        ));
        expect(openInNewTab).not.toHaveBeenCalled();
        expect(getFileSize).not.toHaveBeenCalled();
    });

    it('opens quote terms at the computed PDF page and tracks the click', async () => {
        vi.mocked(getQuotationFileDetails).mockResolvedValueOnce({
            fileData: 'terms-data',
            mimeType: 'application/pdf',
            filename: 'quote.pdf',
        } as any);
        vi.mocked(getQuoteOfferPageNumber).mockReturnValueOnce('3');
        const setIsLoading = vi.fn();

        render(
            <ViewPdfQuoteTerms
                prefixText='Read the '
                suffixText=' before continuing.'
                quotationData={{ ...quotationData, quoteRequestStatus: 'QuoteDeclined' } as any}
                setFileError={vi.fn()}
                setIsLoading={setIsLoading}
            />,
        );

        fireEvent.click(screen.getByText('Terms'));

        await waitFor(() => expect(openPdfPageInNewTab).toHaveBeenCalledWith('blob:terms-data', '3'));
        expect(trackGAEvent).toHaveBeenCalledWith('Terms', 'download');
        expect(setIsLoading).toHaveBeenNthCalledWith(1, true);
        expect(setIsLoading).toHaveBeenLastCalledWith(false);
    });

    it('sets a file error when quote terms cannot be downloaded', async () => {
        vi.mocked(getQuotationFileDetails).mockRejectedValueOnce(new Error('terms failed'));
        const setFileError = vi.fn();
        const setIsLoading = vi.fn();

        render(
            <ViewPdfQuoteTerms
                prefixText='Read the '
                suffixText=' before continuing.'
                quotationData={quotationData as any}
                setFileError={setFileError}
                setIsLoading={setIsLoading}
            />,
        );

        fireEvent.click(screen.getByText('Terms'));

        await waitFor(() => expect(setFileError).toHaveBeenCalledWith(true));
        expect(setIsLoading).toHaveBeenLastCalledWith(false);
    });

    it('does not open quote terms when file metadata is incomplete', async () => {
        vi.mocked(getQuotationFileDetails).mockResolvedValueOnce({} as any);

        render(
            <ViewPdfQuoteTerms
                prefixText='Read the '
                suffixText=' before continuing.'
                quotationData={quotationData as any}
                setFileError={vi.fn()}
                setIsLoading={vi.fn()}
            />,
        );

        fireEvent.click(screen.getByText('Terms'));

        await waitFor(() => expect(getQuotationFileDetails).toHaveBeenCalled());
        expect(openPdfPageInNewTab).not.toHaveBeenCalled();
    });
});
