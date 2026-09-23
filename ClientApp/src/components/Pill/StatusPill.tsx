import Badge from 'react-bootstrap/Badge';
import {
  DashboardItemStatus,
  PaDashboardItemStatus,
  QuoteStatus,
  ReportStatus,
} from '../../routes/common/enums.ts';

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
const getPillProps = (itemStatus: string) => {
  switch (itemStatus) {
    case ReportStatus.Withdrawn:
      return {
        bgColour: 'secondary',
        textColour: 'light',
        text: DashboardItemStatus.ReportWithdrawn,
      };
    case DashboardItemStatus.QuoteAccepted:
    case QuoteStatus.QuoteAccepted:
      return {
        bgColour: 'success-dark',
        textColour: 'light',
        text: DashboardItemStatus.QuoteAccepted,
      };
    case DashboardItemStatus.ReportIssued:
    case QuoteStatus.ReportIssued:
    case ReportStatus.Issued:
      return {
        bgColour: 'success-dark',
        textColour: 'light',
        text: DashboardItemStatus.ReportIssued,
      };
    case DashboardItemStatus.ReportInProgress:
    case QuoteStatus.ReportInProgress:
      return {
        bgColour: 'success-dark',
        textColour: 'light',
        text: DashboardItemStatus.ReportInProgress,
      };
    case DashboardItemStatus.ArtifactReceived:
    case QuoteStatus.ArtifactReceived:
      return {
        bgColour: 'success-dark',
        textColour: 'light',
        text: DashboardItemStatus.ArtifactReceived,
      };
    case DashboardItemStatus.QuoteDrafted:
      return {
        bgColour: 'light',
        textColour: 'dark',
        text: DashboardItemStatus.QuoteDrafted,
      };
    case DashboardItemStatus.QuoteAvailable:
    case QuoteStatus.QuoteAvailable:
      return {
        bgColour: 'info',
        textColour: 'light',
        text: DashboardItemStatus.QuoteAvailable,
      };
    case DashboardItemStatus.QuoteDeclined:
    case QuoteStatus.QuoteDeclined:
      return {
        bgColour: 'danger',
        textColour: 'light',
        text: DashboardItemStatus.QuoteDeclined,
      };
    case DashboardItemStatus.QuoteExpired:
    case QuoteStatus.QuoteExpired:
      return {
        bgColour: 'danger-light',
        textColour: 'dark',
        text: DashboardItemStatus.QuoteExpired,
      };
    case DashboardItemStatus.QuoteSubmitted:
    case QuoteStatus.QuoteSubmitted:
      return {
        bgColour: 'info',
        textColour: 'light',
        text: DashboardItemStatus.QuoteSubmitted,
      };
    case DashboardItemStatus.ReportWithdrawn:
    case QuoteStatus.ReportWithdrawn:
    case 'Withdrawn':
      return {
        bgColour: 'success-dark',
        textColour: 'light',
        text: DashboardItemStatus.ReportWithdrawn,
      };
    case PaDashboardItemStatus.PaDraft:
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

const StatusPill = ({ status }: StatusPillProps) => {
  const pillProps = getPillProps(status);

  return (
    <Badge pill={true} bg={pillProps.bgColour} text={pillProps.textColour}>
      {pillProps.text}
    </Badge>
  );
};

export default StatusPill;
