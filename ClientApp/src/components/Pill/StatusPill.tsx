import Badge from 'react-bootstrap/Badge';
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

interface PillProps {
  bgColour: string;
  textColour: string;
  text: string;
}

const getPillProps = (itemStatus: string): PillProps => {
  switch (itemStatus) {
    case 'Withdrawn':
      return {
        bgColour: 'secondary',
        textColour: 'light',
        text: DashboardItemStatus.ReportWithdrawn,
      };
    case 'Quote offer is accepted':
    case 'Quote - Accepted':
      return {
        bgColour: 'success-dark',
        textColour: 'light',
        text: DashboardItemStatus.QuoteAccepted,
      };
    case 'Report is available':
    case 'Report - Issued':
    case 'Issued':
      return {
        bgColour: 'success-dark',
        textColour: 'light',
        text: DashboardItemStatus.ReportIssued,
      };
    case 'Report is in-progress':
    case 'Report - In progress':
      return {
        bgColour: 'success-dark',
        textColour: 'light',
        text: DashboardItemStatus.ReportInProgress,
      };
    case 'Instrument/Artefact received':
    case 'Artefact - Received':
      return {
        bgColour: 'success-dark',
        textColour: 'light',
        text: DashboardItemStatus.ArtifactReceived,
      };
    case 'Quote request drafted':
      return {
        bgColour: 'light',
        textColour: 'dark',
        text: DashboardItemStatus.QuoteDrafted,
      };
    case 'Quote offer is available':
    case 'Quote - Available':
      return {
        bgColour: 'info',
        textColour: 'light',
        text: DashboardItemStatus.QuoteAvailable,
      };
    case 'Quote offer declined':
    case 'Quote - Declined':
      return {
        bgColour: 'danger',
        textColour: 'light',
        text: DashboardItemStatus.QuoteDeclined,
      };
    case 'Quote offer expired':
    case 'Quote - Expired':
      return {
        bgColour: 'danger-light',
        textColour: 'dark',
        text: DashboardItemStatus.QuoteExpired,
      };
    case 'Quote request submitted':
    case 'Submitted':
      return {
        bgColour: 'info',
        textColour: 'light',
        text: DashboardItemStatus.QuoteSubmitted,
      };
    case 'Report is withdrawn':
    case 'Report - Withdrawn':
      return {
        bgColour: 'success-dark',
        textColour: 'light',
        text: DashboardItemStatus.ReportWithdrawn,
      };
    case 'Draft':
      return {
        bgColour: 'light',
        textColour: 'dark',
        text: PaDashboardItemStatus.PaDraft,
      };
    default:
      return {
        bgColour: 'info',
        textColour: 'light',
        text: itemStatus,
      };
  }
};

/**
 * Presents a compact, colour-coded label for request, quote, report, and
 * pattern-approval workflow states.
 */
const StatusPill = ({ status, className }: Readonly<StatusPillProps>) => {
  const pillProps = getPillProps(status);

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
