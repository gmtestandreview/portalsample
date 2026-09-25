import { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import {
    getFileSize,
    getFileUrlFromBase64,
    handleReportFileError,
    openInNewTab,
} from '../../routes/common/helperFunctions';
import { DashboardClient } from '../../api/web-api-client';
import type { RequestForQuoteDetails } from '../../api/web-api-client';
import { tokenRequest } from '../../authentication/authConfig';
import ViewPdfButton from './ViewPdfButton';
import { clearDashboardNotification } from '../../storage/notification';
import AppLogger from '../../instrumentation/AppLogger';

export interface ViewMeasurementReportProps {
    text?: string;
    quotationData: RequestForQuoteDetails | undefined;
    setFileError(value: boolean): void;
    setIsLoading(value: boolean): void;
}

/**
 * Show the quote button and open in a new tab to view the pdf
 * @param props ViewPdfQuoteProps
 * @returns jsx
 */
const ViewMeasurementReport = (props: ViewMeasurementReportProps) => {
    const {
        text,
        quotationData,
        setFileError,
        setIsLoading,
    } = props;
    const { accounts, instance } = useMsal();
    const reportId = quotationData?.crmQuoteRequestId;
    const [fileSize, setFileSize] = useState('');
    const [pdfSizeLoaded, setPdfSizeLoaded] = useState(false);

    const viewReportPdf = async () => {
        try {
            AppLogger.verbose('ViewMeasurementReport.viewReportPdf', { crmQuoteRequestId: reportId });
            setFileError(false);
            clearDashboardNotification();
            if (!reportId) {
                setIsLoading(false);
                return;
            }
            const client = new DashboardClient();
            const tokenResult = await instance.acquireTokenSilent({
                ...tokenRequest,
                account: accounts[0],
            });
            client.setAuthToken(tokenResult.accessToken);
            const fileResponse = await client.getQuoteReportPDFByID(reportId, true);
            if (fileResponse?.fileData && fileResponse.mimeType && fileResponse.filename) {
                const fileUrl = getFileUrlFromBase64(fileResponse.fileData);
                openInNewTab(fileUrl);
            }
            setIsLoading(false);
        } catch (e) {
            handleReportFileError();
            setFileError(true);
            setIsLoading(false);
            AppLogger.error('Failed to download the Report.', e as Error);
        }
    };

    useEffect(() => {
        const getReportPdfFileSize = async () => {
            try {
                AppLogger.verbose('ViewMeasurementReport.getReportPdfFileSize', { crmQuoteRequestId: reportId });
                setFileError(false);
                clearDashboardNotification();
                if (!reportId) {
                    setFileSize('');
                    setPdfSizeLoaded(true);
                    return;
                }
                setPdfSizeLoaded(false);
                const client = new DashboardClient();
                const tokenResult = await instance.acquireTokenSilent({
                    ...tokenRequest,
                    account: accounts[0],
                });
                client.setAuthToken(tokenResult.accessToken);
                const fileResponse = await client.getQuoteReportPDFByID(reportId, false);
                if (fileResponse?.fileSizeBytes) {
                    const spnFileSize = getFileSize(fileResponse.fileSizeBytes);
                    setFileSize(spnFileSize);
                }
                setPdfSizeLoaded(true);
            } catch (e) {
                handleReportFileError();
                setPdfSizeLoaded(true);
                setFileError(true);
                AppLogger.error('Failed to retrieve the Report file size.', e as Error);
            }
        };

        getReportPdfFileSize();
    }, [accounts, instance, reportId, setFileError]);

    return (
        <ViewPdfButton
            text={text}
            fileSize={fileSize}
            isLoaded={pdfSizeLoaded}
            getPdf={viewReportPdf}
            gaLabel='report'
        />
    );
};

export default ViewMeasurementReport;
