import Badge from 'react-bootstrap/Badge';
import { useEffect, useState } from 'react';
import {
  DashboardItemStatus,
  PaDashboardItemStatus,
} from '../../routes/common/enums';
import type { QuoteStatus, ReportStatus } from '../../routes/common/enums';

export interface StatusPillProps {
  /** Workflow status whose label and semantic colour are displayed. Unknown strings use the informational treatment. */
  status:
    | DashboardItemStatus
    | QuoteStatus
    | PaDashboardItemStatus
    | ReportStatus
    | string;
  /** Optional CSS classes applied to the rendered badge. */
  className?: string;
}

/**
 * Presents a compact, colour-coded label for request, quote, report, and
 * pattern-approval workflow states.
 */
const StatusPill = ({ status, className }: Readonly<StatusPillProps>) => {
  const [pillProps, setPillProps] = useState({
    bgColour: 'info',
    textColour: 'light',
    text: '',
  });
  const getPillProps = (itemStatus: string) => {
    switch (itemStatus) {
      case 'Withdrawn':
        setPillProps({
          bgColour: 'secondary',
          textColour: 'light',
          text: DashboardItemStatus.ReportWithdrawn,
        });
        break;
      case 'Quote offer is accepted':
      case 'Quote - Accepted':
        setPillProps({
          bgColour: 'success-dark',
          textColour: 'light',
          text: DashboardItemStatus.QuoteAccepted,
        });
        break;
      case 'Report is available':
      case 'Report - Issued':
      case 'Issued':
        setPillProps({
          bgColour: 'success-dark',
          textColour: 'light',
          text: DashboardItemStatus.ReportIssued,
        });
        break;
      case 'Report is in-progress':
      case 'Report - In progress':
        setPillProps({
          bgColour: 'success-dark',
          textColour: 'light',
          text: DashboardItemStatus.ReportInProgress,
        });
        break;
      case 'Instrument/Artefact received':
      case 'Artefact - Received':
        setPillProps({
          bgColour: 'success-dark',
          textColour: 'light',
          text: DashboardItemStatus.ArtifactReceived,
        });
        break;
      case 'Quote request drafted':
        setPillProps({
          bgColour: 'light',
          textColour: 'dark',
          text: DashboardItemStatus.QuoteDrafted,
        });
        break;
      case 'Quote offer is available':
      case 'Quote - Available':
        setPillProps({
          bgColour: 'info',
          textColour: 'light',
          text: DashboardItemStatus.QuoteAvailable,
        });
        break;
      case 'Quote offer declined':
      case 'Quote - Declined':
        setPillProps({
          bgColour: 'danger',
          textColour: 'light',
          text: DashboardItemStatus.QuoteDeclined,
        });
        break;
      case 'Quote offer expired':
      case 'Quote - Expired':
        setPillProps({
          bgColour: 'danger-light',
          textColour: 'dark',
          text: DashboardItemStatus.QuoteExpired,
        });
        break;
      case 'Quote request submitted':
      case 'Submitted':
        setPillProps({
          bgColour: 'info',
          textColour: 'light',
          text: DashboardItemStatus.QuoteSubmitted,
        });
        break;
      case 'Report is withdrawn':
      case 'Report - Withdrawn':
        setPillProps({
          bgColour: 'success-dark',
          textColour: 'light',
          text: DashboardItemStatus.ReportWithdrawn,
        });
        break;
      case 'Draft':
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
    <Badge
      pill
      bg={pillProps.bgColour}
      text={pillProps.textColour}
      className={className}
    >
      {pillProps.text}
    </Badge>
  );
};

export default StatusPill;
