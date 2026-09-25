import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ViewPdfButton from '@/components/Utilities/ViewPdfButton';

const trackGAEventMock = vi.hoisted(() => vi.fn());

vi.mock('@/analytics/GoogleAnalytics', () => ({
    trackGAEvent: trackGAEventMock,
}));

describe('ViewPdfButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows the download button and file size note when loaded', () => {
        render(
            <ViewPdfButton text='Download PDF' fileSize='1.2 MB' isLoaded getPdf={vi.fn()} gaLabel='Quote' />,
        );

        expect(screen.getByRole('button', { name: /Download PDF/i })).toBeInTheDocument();
        // fileSize and its label text share a single <span>, so check the full content together
        expect(screen.getByText(/Requires Acrobat PDF reader - PDF file size/)).toHaveTextContent('1.2 MB');
    });

    it('shows the loading spinner and hides the button while not loaded', () => {
        render(
            <ViewPdfButton fileSize='1.2 MB' isLoaded={false} getPdf={vi.fn()} gaLabel='Quote' />,
        );

        expect(screen.getByRole('alert')).toHaveTextContent('Loading data...');
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(screen.queryByText(/Requires Acrobat PDF reader/)).not.toBeInTheDocument();
    });

    it('calls getPdf and tracks a GA event when the button is clicked', async () => {
        const user = userEvent.setup();
        const getPdf = vi.fn();

        render(
            <ViewPdfButton text='Download' fileSize='1 MB' isLoaded getPdf={getPdf} gaLabel='QuoteLabel' />,
        );

        await user.click(screen.getByRole('button', { name: /Download/i }));

        expect(getPdf).toHaveBeenCalledTimes(1);
        expect(trackGAEventMock).toHaveBeenCalledWith('QuoteLabel', 'download');
    });

    it('renders the button without label text when text prop is omitted', () => {
        render(
            <ViewPdfButton fileSize='500 KB' isLoaded getPdf={vi.fn()} gaLabel='TestLabel' />,
        );

        expect(screen.getByRole('button')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
});
