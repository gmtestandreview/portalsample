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

const pillPropsByStatus = new Map<string, PillProps>([
  [
    'Withdrawn',
    {
      bgColour: 'secondary',
      textColour: 'light',
      text: DashboardItemStatus.ReportWithdrawn,
    },
  ],
  ...['Quote offer is accepted', 'Quote - Accepted'].map(
    (status) =>
      [
        status,
        {
          bgColour: 'success-dark',
          textColour: 'light',
          text: DashboardItemStatus.QuoteAccepted,
        },
      ] as [string, PillProps],
  ),
  ...['Report is available', 'Report - Issued', 'Issued'].map(
    (status) =>
      [
        status,
        {
          bgColour: 'success-dark',
          textColour: 'light',
          text: DashboardItemStatus.ReportIssued,
        },
      ] as [string, PillProps],
  ),
  ...['Report is in-progress', 'Report - In progress'].map(
    (status) =>
      [
        status,
        {
          bgColour: 'success-dark',
          textColour: 'light',
          text: DashboardItemStatus.ReportInProgress,
        },
      ] as [string, PillProps],
  ),
  ...['Instrument/Artefact received', 'Artefact - Received'].map(
    (status) =>
      [
        status,
        {
          bgColour: 'success-dark',
          textColour: 'light',
          text: DashboardItemStatus.ArtifactReceived,
        },
      ] as [string, PillProps],
  ),
  [
    'Quote request drafted',
    {
      bgColour: 'light',
      textColour: 'dark',
      text: DashboardItemStatus.QuoteDrafted,
    },
  ],
  ...['Quote offer is available', 'Quote - Available'].map(
    (status) =>
      [
        status,
        {
          bgColour: 'info',
          textColour: 'light',
          text: DashboardItemStatus.QuoteAvailable,
        },
      ] as [string, PillProps],
  ),
  ...['Quote offer declined', 'Quote - Declined'].map(
    (status) =>
      [
        status,
        {
          bgColour: 'danger',
          textColour: 'light',
          text: DashboardItemStatus.QuoteDeclined,
        },
      ] as [string, PillProps],
  ),
  ...['Quote offer expired', 'Quote - Expired'].map(
    (status) =>
      [
        status,
        {
          bgColour: 'danger-light',
          textColour: 'dark',
          text: DashboardItemStatus.QuoteExpired,
        },
      ] as [string, PillProps],
  ),
  ...['Quote request submitted', 'Submitted'].map(
    (status) =>
      [
        status,
        {
          bgColour: 'info',
          textColour: 'light',
          text: DashboardItemStatus.QuoteSubmitted,
        },
      ] as [string, PillProps],
  ),
  ...['Report is withdrawn', 'Report - Withdrawn'].map(
    (status) =>
      [
        status,
        {
          bgColour: 'success-dark',
          textColour: 'light',
          text: DashboardItemStatus.ReportWithdrawn,
        },
      ] as [string, PillProps],
  ),
  [
    'Draft',
    {
      bgColour: 'light',
      textColour: 'dark',
      text: PaDashboardItemStatus.PaDraft,
    },
  ],
]);

const getPillProps = (itemStatus: string): PillProps => {
  return (
    pillPropsByStatus.get(itemStatus) ?? {
      bgColour: 'info',
      textColour: 'light',
      text: itemStatus,
    }
  );
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
