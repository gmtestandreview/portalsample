import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import QuoteStatusPill from '@/components/Pill/QuoteStatusPill';
import { QuoteStatus } from '@/routes/common/enums';

describe('QuoteStatusPill', () => {
    it.each([
        QuoteStatus.ReportInProgress,
        QuoteStatus.ReportIssued,
        QuoteStatus.ReportWithdrawn,
        QuoteStatus.ArtifactReceived,
        QuoteStatus.QuoteAccepted,
    ])('renders accepted copy for %s', async (status) => {
        render(<QuoteStatusPill status={status} />);

        const pill = await screen.findByText('Quotation accepted');

        expect(pill).toHaveClass('bg-success-dark', 'text-light');
    });

    it.each([
        [QuoteStatus.QuoteDeclined, 'Quotation declined', 'bg-danger', 'text-light'],
        [QuoteStatus.QuoteExpired, 'Quotation expired', 'bg-danger-light', 'text-dark'],
        [QuoteStatus.QuoteClosed, 'Quotation closed', 'bg-dark-gray', 'text-light'],
    ])('renders mapped quote state for %s', async (status, label, bgClass, textClass) => {
        render(<QuoteStatusPill status={status} />);

        const pill = await screen.findByText(label);

        expect(pill).toHaveClass(bgClass, textClass);
    });

    it('renders the raw value for an unmapped status', async () => {
        const customStatus = 'Quote sent to delegate' as QuoteStatus;

        render(<QuoteStatusPill status={customStatus} />);

        await waitFor(() => {
            expect(screen.getByText(customStatus)).toHaveClass('bg-info', 'text-light');
        });
    });
});
