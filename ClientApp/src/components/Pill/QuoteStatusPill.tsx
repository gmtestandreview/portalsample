import Badge from 'react-bootstrap/Badge';
import type { DashboardItemStatus } from '../../routes/common/enums.ts';
import { QuoteStatus } from '../../routes/common/enums.ts';

export interface StatusPillProps {
  status: DashboardItemStatus | QuoteStatus;
}

/**
 * Show the status pill according to the status of the requestitem
 * @param props StatusPillProps
 * @returns jsx
 */
const getPillProps = (itemStatus: string) => {
  switch (itemStatus) {
    case QuoteStatus.ReportInProgress:
    case QuoteStatus.ReportIssued:
    case QuoteStatus.ReportWithdrawn:
    case QuoteStatus.ArtifactReceived:
    case QuoteStatus.QuoteAccepted:
      return {
        bgColour: 'success-dark',
        textColour: 'light',
        text: 'Quotation accepted',
      };
    case QuoteStatus.QuoteDeclined:
      return {
        bgColour: 'danger',
        textColour: 'light',
        text: 'Quotation declined',
      };
    case QuoteStatus.QuoteExpired:
      return {
        bgColour: 'danger-light',
        textColour: 'dark',
        text: 'Quotation expired',
      };
    case QuoteStatus.QuoteClosed:
      return {
        bgColour: 'dark-gray',
        textColour: 'light',
        text: 'Quotation closed',
      };
    default:
      return {
        bgColour: 'info',
        textColour: 'light',
        text: itemStatus,
      };
  }
};

const QuoteStatusPill = ({ status }: Readonly<StatusPillProps>) => {
  const pillProps = getPillProps(status);

  return (
    <Badge pill={true} bg={pillProps.bgColour} text={pillProps.textColour}>
      {pillProps.text}
    </Badge>
  );
};

export default QuoteStatusPill;
