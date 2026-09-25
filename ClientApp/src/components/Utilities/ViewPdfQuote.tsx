import { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import {
    getFileSize, getFileUrlFromBase64, getQuotationFileDetails, openInNewTab,
} from '../../routes/common/helperFunctions';
import type { RequestForQuoteDetails } from '../../api/web-api-client';
import { tokenRequest } from '../../authentication/authConfig';
import ViewPdfButton from './ViewPdfButton';
import AppLogger from '../../instrumentation/AppLogger';

export interface ViewPdfQuoteProps {
    text: string;
    quotationData: RequestForQuoteDetails | undefined;
    setFileError(value: boolean): void;
    setIsLoading(value: boolean): void;
}

/**
 * Show the quote button and open in a new tab to view the pdf
 * @param props ViewPdfQuoteProps
 * @returns jsx
 */
const ViewPdfQuote = (props: ViewPdfQuoteProps) => {
    const {
        text,
        quotationData,
        setFileError,
        setIsLoading,
    } = props;
    const { accounts, instance } = useMsal();
    const [fileSize, setFileSize] = useState<string>();
    const [pdfSizeLoaded, setPdfSizeLoaded] = useState(false);

    const viewOfferedQuotePdf = async () => {
        try {
            setIsLoading(true);
            setFileError(false);
            AppLogger.verbose('ViewPdfQuote.viewOfferedQuotePdf', { crmQuoteRequestId: quotationData?.crmQuoteRequestId });
            const tokenResult = await instance.acquireTokenSilent({
                ...tokenRequest,
                account: accounts[0],
            });
            const fileResponse = await getQuotationFileDetails(tokenResult.accessToken, quotationData!, true);
            if (fileResponse?.fileData && fileResponse.mimeType && fileResponse.filename) {
                const fileUrl = getFileUrlFromBase64(fileResponse.fileData);
                openInNewTab(fileUrl);
            }
            setFileError(false);
            setIsLoading(false);
        } catch (e) {
            setFileError(true);
            setIsLoading(false);
            AppLogger.error('Failed to download the Offered Quotation.', e as Error);
        }
    };

    useEffect(() => {
        const getPdfFileSize = async () => {
            try {
                AppLogger.verbose('ViewPdfQuote.getPdfFileSize', { crmQuoteRequestId: quotationData?.crmQuoteRequestId });
                setPdfSizeLoaded(false);
                const tokenResult = await instance.acquireTokenSilent({
                    ...tokenRequest,
                    account: accounts[0],
                });
                const fileResponse = await getQuotationFileDetails(tokenResult.accessToken, quotationData!, false);
                if (fileResponse?.fileSizeBytes) {
                    const spnFileSize = getFileSize(fileResponse.fileSizeBytes);
                    setFileSize(spnFileSize);
                }
                setPdfSizeLoaded(true);
                setFileError(false);
            } catch (e) {
                setPdfSizeLoaded(true);
                setFileError(true);
                AppLogger.error('Failed to retrieve the Offered Quotation file size.', e as Error);
            }
        };

        getPdfFileSize();
    }, [accounts, instance, quotationData, setFileError]);

    return (
        <ViewPdfButton
            text={text}
            fileSize={fileSize as string}
            isLoaded={pdfSizeLoaded}
            getPdf={viewOfferedQuotePdf}
            gaLabel='Quote'
        />
    );
};

export default ViewPdfQuote;
