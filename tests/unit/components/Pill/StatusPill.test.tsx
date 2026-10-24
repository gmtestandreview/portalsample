import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import StatusPill from '../../../../ClientApp/src/components/Pill/StatusPill';
import {
  DashboardItemStatus,
  PaDashboardItemStatus,
  QuoteStatus,
  ReportStatus,
} from '../../../../ClientApp/src/routes/common/enums';

describe(StatusPill, () => {
  describe('dashboard item status', () => {
    it('renders QuoteAvailable text', async () => {
      render(<StatusPill status={DashboardItemStatus.QuoteAvailable} />);
      await waitFor(() => {
        expect(
          screen.getByText(DashboardItemStatus.QuoteAvailable)
        ).toBeInTheDocument();
      });
    });

    it('renders QuoteAccepted text', async () => {
      render(<StatusPill status={DashboardItemStatus.QuoteAccepted} />);
      await waitFor(() => {
        expect(
          screen.getByText(DashboardItemStatus.QuoteAccepted)
        ).toBeInTheDocument();
      });
    });

    it('renders QuoteDrafted text', async () => {
      render(<StatusPill status={DashboardItemStatus.QuoteDrafted} />);
      await waitFor(() => {
        expect(
          screen.getByText(DashboardItemStatus.QuoteDrafted)
        ).toBeInTheDocument();
      });
    });

    it('renders QuoteDeclined text', async () => {
      render(<StatusPill status={DashboardItemStatus.QuoteDeclined} />);
      await waitFor(() => {
        expect(
          screen.getByText(DashboardItemStatus.QuoteDeclined)
        ).toBeInTheDocument();
      });
    });

    it('renders QuoteExpired text', async () => {
      render(<StatusPill status={DashboardItemStatus.QuoteExpired} />);
      await waitFor(() => {
        expect(
          screen.getByText(DashboardItemStatus.QuoteExpired)
        ).toBeInTheDocument();
      });
    });

    it('renders QuoteSubmitted text', async () => {
      render(<StatusPill status={DashboardItemStatus.QuoteSubmitted} />);
      await waitFor(() => {
        expect(
          screen.getByText(DashboardItemStatus.QuoteSubmitted)
        ).toBeInTheDocument();
      });
    });

    it('renders ReportIssued text', async () => {
      render(<StatusPill status={DashboardItemStatus.ReportIssued} />);
      await waitFor(() => {
        expect(
          screen.getByText(DashboardItemStatus.ReportIssued)
        ).toBeInTheDocument();
      });
    });

    it('renders ReportInProgress text', async () => {
      render(<StatusPill status={DashboardItemStatus.ReportInProgress} />);
      await waitFor(() => {
        expect(
          screen.getByText(DashboardItemStatus.ReportInProgress)
        ).toBeInTheDocument();
      });
    });

    it('renders ReportWithdrawn text', async () => {
      render(<StatusPill status={DashboardItemStatus.ReportWithdrawn} />);
      await waitFor(() => {
        expect(
          screen.getByText(DashboardItemStatus.ReportWithdrawn)
        ).toBeInTheDocument();
      });
    });

    it('renders ArtifactReceived text', async () => {
      render(<StatusPill status={DashboardItemStatus.ArtifactReceived} />);
      await waitFor(() => {
        expect(
          screen.getByText(DashboardItemStatus.ArtifactReceived)
        ).toBeInTheDocument();
      });
    });
  });

  describe('quoteStatus — stacked cases resolve to DashboardItemStatus labels', () => {
    it('quoteStatus.QuoteAccepted resolves to DashboardItemStatus.QuoteAccepted text', async () => {
      render(<StatusPill status={QuoteStatus.QuoteAccepted} />);
      await waitFor(() => {
        expect(
          screen.getByText(DashboardItemStatus.QuoteAccepted)
        ).toBeInTheDocument();
      });
    });

    it('quoteStatus.QuoteAvailable resolves to DashboardItemStatus.QuoteAvailable text', async () => {
      render(<StatusPill status={QuoteStatus.QuoteAvailable} />);
      await waitFor(() => {
        expect(
          screen.getByText(DashboardItemStatus.QuoteAvailable)
        ).toBeInTheDocument();
      });
    });

    it('quoteStatus.QuoteDeclined resolves to DashboardItemStatus.QuoteDeclined text', async () => {
      render(<StatusPill status={QuoteStatus.QuoteDeclined} />);
      await waitFor(() => {
        expect(
          screen.getByText(DashboardItemStatus.QuoteDeclined)
        ).toBeInTheDocument();
      });
    });

    it('quoteStatus.QuoteExpired resolves to DashboardItemStatus.QuoteExpired text', async () => {
      render(<StatusPill status={QuoteStatus.QuoteExpired} />);
      await waitFor(() => {
        expect(
          screen.getByText(DashboardItemStatus.QuoteExpired)
        ).toBeInTheDocument();
      });
    });

    it('quoteStatus.QuoteSubmitted resolves to DashboardItemStatus.QuoteSubmitted text', async () => {
      render(<StatusPill status={QuoteStatus.QuoteSubmitted} />);
      await waitFor(() => {
        expect(
          screen.getByText(DashboardItemStatus.QuoteSubmitted)
        ).toBeInTheDocument();
      });
    });

    it('quoteStatus.ReportIssued resolves to DashboardItemStatus.ReportIssued text', async () => {
      render(<StatusPill status={QuoteStatus.ReportIssued} />);
      await waitFor(() => {
        expect(
          screen.getByText(DashboardItemStatus.ReportIssued)
        ).toBeInTheDocument();
      });
    });

    it('quoteStatus.ReportInProgress resolves to DashboardItemStatus.ReportInProgress text', async () => {
      render(<StatusPill status={QuoteStatus.ReportInProgress} />);
      await waitFor(() => {
        expect(
          screen.getByText(DashboardItemStatus.ReportInProgress)
        ).toBeInTheDocument();
      });
    });

    it('quoteStatus.ReportWithdrawn resolves to DashboardItemStatus.ReportWithdrawn text', async () => {
      render(<StatusPill status={QuoteStatus.ReportWithdrawn} />);
      await waitFor(() => {
        expect(
          screen.getByText(DashboardItemStatus.ReportWithdrawn)
        ).toBeInTheDocument();
      });
    });

    it('quoteStatus.ArtifactReceived resolves to DashboardItemStatus.ArtifactReceived text', async () => {
      render(<StatusPill status={QuoteStatus.ArtifactReceived} />);
      await waitFor(() => {
        expect(
          screen.getByText(DashboardItemStatus.ArtifactReceived)
        ).toBeInTheDocument();
      });
    });
  });

  describe('default case', () => {
    it('renders the raw status string when the value is unrecognised', async () => {
      const unknownStatus = 'some-unknown-status-xyz';
      render(<StatusPill status={unknownStatus} />);
      await waitFor(() => {
        expect(screen.getByText(unknownStatus)).toBeInTheDocument();
      });
    });

    it('renders default styling for recognised statuses without a custom mapping', async () => {
      render(<StatusPill status={DashboardItemStatus.QuoteClosed} />);

      const pill = await screen.findByText(DashboardItemStatus.QuoteClosed);

      expect(pill).toHaveClass('bg-info', 'text-light');
    });
  });

  describe('reportStatus mappings', () => {
    it('maps ReportStatus.Issued to the dashboard report-issued label', async () => {
      render(<StatusPill status={ReportStatus.Issued} />);

      const pill = await screen.findByText(DashboardItemStatus.ReportIssued);

      expect(pill).toHaveClass('bg-success-dark', 'text-light');
    });

    it('maps ReportStatus.Withdrawn to the report-withdrawn label with secondary styling', async () => {
      render(<StatusPill status={ReportStatus.Withdrawn} />);

      const pill = await screen.findByText(DashboardItemStatus.ReportWithdrawn);

      expect(pill).toHaveClass('bg-secondary', 'text-light');
    });
  });

  describe('pattern approval status mappings', () => {
    it('maps a draft pattern approval status to light styling', async () => {
      render(<StatusPill status={PaDashboardItemStatus.PaDraft} />);

      const pill = await screen.findByText(PaDashboardItemStatus.PaDraft);

      expect(pill).toHaveClass('bg-light', 'text-dark');
    });

    it('uses the quote-submitted label for the shared Submitted status value', async () => {
      render(<StatusPill status={PaDashboardItemStatus.PaSubmitted} />);

      const pill = await screen.findByText(DashboardItemStatus.QuoteSubmitted);

      expect(pill).toHaveClass('bg-info', 'text-light');
    });
  });
});
