import Badge from 'react-bootstrap/Badge';
import { useEffect, useState } from 'react';
import { DashboardItemStatus, PaDashboardItemStatus, QuoteStatus, ReportStatus } from '../../routes/common/enums';

export interface StatusPillProps {
    status: DashboardItemStatus | QuoteStatus | PaDashboardItemStatus | ReportStatus | string;
    className?: string;
}

/**
 * Show the status pill according to the status of the requestitem
 * @param props StatusPillProps
 * @returns jsx
 */
const StatusPill = ({ status }: StatusPillProps) => {
    const [pillProps, setPillProps] = useState({ bgColour: 'info', textColour: 'light', text: '' });
    const getPillProps = (itemStatus: string) => {
        switch (itemStatus) {
            case ReportStatus.Withdrawn:
                setPillProps({ bgColour: 'secondary', textColour: 'light', text: DashboardItemStatus.ReportWithdrawn });
                break;
            case DashboardItemStatus.QuoteAccepted:
            case QuoteStatus.QuoteAccepted:
                setPillProps({ bgColour: 'success-dark', textColour: 'light', text: DashboardItemStatus.QuoteAccepted });
                break;
            case DashboardItemStatus.ReportIssued:
            case QuoteStatus.ReportIssued:
            case ReportStatus.Issued:
                setPillProps({ bgColour: 'success-dark', textColour: 'light', text: DashboardItemStatus.ReportIssued });
                break;
            case DashboardItemStatus.ReportInProgress:
            case QuoteStatus.ReportInProgress:
                setPillProps({ bgColour: 'success-dark', textColour: 'light', text: DashboardItemStatus.ReportInProgress });
                break;
            case DashboardItemStatus.ArtifactReceived:
            case QuoteStatus.ArtifactReceived:
                setPillProps({ bgColour: 'success-dark', textColour: 'light', text: DashboardItemStatus.ArtifactReceived });
                break;
            case DashboardItemStatus.QuoteDrafted:
                setPillProps({ bgColour: 'light', textColour: 'dark', text: DashboardItemStatus.QuoteDrafted });
                break;
            case DashboardItemStatus.QuoteAvailable:
            case QuoteStatus.QuoteAvailable:
                setPillProps({ bgColour: 'info', textColour: 'light', text: DashboardItemStatus.QuoteAvailable });
                break;
            case DashboardItemStatus.QuoteDeclined:
            case QuoteStatus.QuoteDeclined:
                setPillProps({ bgColour: 'danger', textColour: 'light', text: DashboardItemStatus.QuoteDeclined });
                break;
            case DashboardItemStatus.QuoteExpired:
            case QuoteStatus.QuoteExpired:
                setPillProps({ bgColour: 'danger-light', textColour: 'dark', text: DashboardItemStatus.QuoteExpired });
                break;
            case DashboardItemStatus.QuoteSubmitted:
            case QuoteStatus.QuoteSubmitted:
                setPillProps({ bgColour: 'info', textColour: 'light', text: DashboardItemStatus.QuoteSubmitted });
                break;
            case DashboardItemStatus.ReportWithdrawn:
            case QuoteStatus.ReportWithdrawn:
            case 'Withdrawn':
                setPillProps({ bgColour: 'success-dark', textColour: 'light', text: DashboardItemStatus.ReportWithdrawn });
                break;
            case PaDashboardItemStatus.PaDraft:
                setPillProps({ bgColour: 'light', textColour: 'dark', text: PaDashboardItemStatus.PaDraft });
                break;
            case PaDashboardItemStatus.PaSubmitted:
                setPillProps({ bgColour: 'info', textColour: 'light', text: PaDashboardItemStatus.PaSubmitted });
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

export default StatusPill;
