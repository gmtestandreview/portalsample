import Badge from 'react-bootstrap/Badge';
import type {
  DashboardItemStatus,
  QuoteStatus,
} from '../../routes/common/enums';

export interface StatusPillProps {
  status: DashboardItemStatus | QuoteStatus;
}

/**
 * Show the status pill according to the status of the requestitem
 * @param props StatusPillProps
 * @returns jsx
 */
const QuoteStatusPill = ({ status }: Readonly<StatusPillProps>) => {
  const getPillProps = (itemStatus: DashboardItemStatus | QuoteStatus) => {
    switch (String(itemStatus)) {
      case 'Report - In progress':
      case 'Report - Issued':
      case 'Report - Withdrawn':
      case 'Artefact - Received':
      case 'Quote - Accepted':
        return {
          bgColour: 'success-dark',
          textColour: 'light',
          text: 'Quotation accepted',
        };
      case 'Quote - Declined':
        return {
          bgColour: 'danger',
          textColour: 'light',
          text: 'Quotation declined',
        };
      case 'Quote - Expired':
        return {
          bgColour: 'danger-light',
          textColour: 'dark',
          text: 'Quotation expired',
        };
      case 'Quote - Closed':
        return {
          bgColour: 'dark-gray',
          textColour: 'light',
          text: 'Quotation closed',
        };
      default:
        return {
          bgColour: 'info',
          textColour: 'light',
          text: String(itemStatus),
        };
    }
  };

  const pillProps = getPillProps(status);

  return (
    <Badge pill bg={pillProps.bgColour} text={pillProps.textColour}>
      {pillProps.text}
    </Badge>
  );
};

export default QuoteStatusPill;
