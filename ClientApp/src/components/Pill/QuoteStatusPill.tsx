import Badge from 'react-bootstrap/Badge';
import { useEffect, useState } from 'react';
import type { DashboardItemStatus} from '../../routes/common/enums';
import { QuoteStatus } from '../../routes/common/enums';

export interface StatusPillProps {
    status: DashboardItemStatus | QuoteStatus;
}

/**
 * Show the status pill according to the status of the requestitem
 * @param props StatusPillProps
 * @returns jsx
 */
const QuoteStatusPill = ({ status }: StatusPillProps) => {
    const [pillProps, setPillProps] = useState({ bgColour: 'info', textColour: 'light', text: '' });

    const getPillProps = (itemStatus: string) => {
        switch (itemStatus) {
            case QuoteStatus.ReportInProgress:
            case QuoteStatus.ReportIssued:
            case QuoteStatus.ReportWithdrawn:
            case QuoteStatus.ArtifactReceived:
            case QuoteStatus.QuoteAccepted:
                setPillProps({ bgColour: 'success-dark', textColour: 'light', text: 'Quotation accepted' });
                break;
            case QuoteStatus.QuoteDeclined:
                setPillProps({ bgColour: 'danger', textColour: 'light', text: 'Quotation declined' });
                break;
            case QuoteStatus.QuoteExpired:
                setPillProps({ bgColour: 'danger-light', textColour: 'dark', text: 'Quotation expired' });
                break;
            case QuoteStatus.QuoteClosed:
                setPillProps({ bgColour: 'dark-gray', textColour: 'light', text: 'Quotation closed' });
                break;
            default:
                setPillProps({ bgColour: 'info', textColour: 'light', text: itemStatus });
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
        >
            {pillProps.text}
        </Badge>
    );
};

export default QuoteStatusPill;
