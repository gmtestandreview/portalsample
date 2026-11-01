import Badge from 'react-bootstrap/Badge';
import { useEffect, useState } from 'react';
import {
  DashboardItemStatus,
  PaDashboardItemStatus,
  QuoteStatus,
  ReportStatus,
} from '../../routes/common/enums';

export interface StatusPillProps {
  /** Workflow status whose label and semantic colour are displayed. Unknown strings use the informational treatment. */
  status:
    | DashboardItemStatus
    | QuoteStatus
    | PaDashboardItemStatus
    | ReportStatus
    | string;
  /** Accepted for API compatibility; the current renderer does not apply this value. */
  className?: string;
}

/**
 * Presents a compact, colour-coded label for request, quote, report, and
 * pattern-approval workflow states.
 */
const StatusPill = ({ status }: Readonly<StatusPillProps>) => {
  const [pillProps, setPillProps] = useState({
    bgColour: 'info',
    textColour: 'light',
    text: '',
  });
  const getPillProps = (itemStatus: string) => {
    switch (itemStatus) {
      case String(ReportStatus.Withdrawn):
        setPillProps({
          bgColour: 'secondary',
          textColour: 'light',
          text: DashboardItemStatus.ReportWithdrawn,
        });
        break;
      case String(DashboardItemStatus.QuoteAccepted):
      case String(QuoteStatus.QuoteAccepted):
        setPillProps({
          bgColour: 'success-dark',
          textColour: 'light',
          text: DashboardItemStatus.QuoteAccepted,
        });
        break;
      case String(DashboardItemStatus.ReportIssued):
      case String(QuoteStatus.ReportIssued):
      case String(ReportStatus.Issued):
        setPillProps({
          bgColour: 'success-dark',
          textColour: 'light',
          text: DashboardItemStatus.ReportIssued,
        });
        break;
      case String(DashboardItemStatus.ReportInProgress):
      case String(QuoteStatus.ReportInProgress):
        setPillProps({
          bgColour: 'success-dark',
          textColour: 'light',
          text: DashboardItemStatus.ReportInProgress,
        });
        break;
      case String(DashboardItemStatus.ArtifactReceived):
      case String(QuoteStatus.ArtifactReceived):
        setPillProps({
          bgColour: 'success-dark',
          textColour: 'light',
          text: DashboardItemStatus.ArtifactReceived,
        });
        break;
      case String(DashboardItemStatus.QuoteDrafted):
        setPillProps({
          bgColour: 'light',
          textColour: 'dark',
          text: DashboardItemStatus.QuoteDrafted,
        });
        break;
      case String(DashboardItemStatus.QuoteAvailable):
      case String(QuoteStatus.QuoteAvailable):
        setPillProps({
          bgColour: 'info',
          textColour: 'light',
          text: DashboardItemStatus.QuoteAvailable,
        });
        break;
      case String(DashboardItemStatus.QuoteDeclined):
      case String(QuoteStatus.QuoteDeclined):
        setPillProps({
          bgColour: 'danger',
          textColour: 'light',
          text: DashboardItemStatus.QuoteDeclined,
        });
        break;
      case String(DashboardItemStatus.QuoteExpired):
      case String(QuoteStatus.QuoteExpired):
        setPillProps({
          bgColour: 'danger-light',
          textColour: 'dark',
          text: DashboardItemStatus.QuoteExpired,
        });
        break;
      case String(DashboardItemStatus.QuoteSubmitted):
      case String(QuoteStatus.QuoteSubmitted):
        setPillProps({
          bgColour: 'info',
          textColour: 'light',
          text: DashboardItemStatus.QuoteSubmitted,
        });
        break;
      case String(DashboardItemStatus.ReportWithdrawn):
      case String(QuoteStatus.ReportWithdrawn):
        setPillProps({
          bgColour: 'success-dark',
          textColour: 'light',
          text: DashboardItemStatus.ReportWithdrawn,
        });
        break;
      case String(PaDashboardItemStatus.PaDraft):
        setPillProps({
          bgColour: 'light',
          textColour: 'dark',
          text: PaDashboardItemStatus.PaDraft,
        });
        break;
      default:
        setPillProps({
          bgColour: 'info',
          textColour: 'light',
          text: itemStatus,
        });
    }
  };

  useEffect(() => {
    getPillProps(status);
  }, [status]);

  return (
    <Badge pill bg={pillProps.bgColour} text={pillProps.textColour}>
      {pillProps.text}
    </Badge>
  );
};

export default StatusPill;
