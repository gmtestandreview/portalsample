import '../../styles/media-print.scss';
import { useMsal } from '@azure/msal-react';
import ExternalLinkIcon from '../Icons/ExternalLinkIcon';
import InTextLink from '../InTextLink';
import {
    getFileUrlFromBase64,
    getQuotationFileDetails,
    getQuoteOfferPageNumber,
    openPdfPageInNewTab,
} from '../../routes/common/helperFunctions';
import type { RequestForQuoteDetails } from '../../api/web-api-client';
import { tokenRequest } from '../../authentication/authConfig';
import AppLogger from '../../instrumentation/AppLogger';
import { trackGAEvent } from '../../analytics/GoogleAnalytics';

export interface ViewPdfQuoteTermsProps {
    prefixText: string;
    suffixText: string;
    quotationData: RequestForQuoteDetails | undefined;
    setFileError(value: boolean): void;
    setIsLoading(value: boolean): void;
}

/**
 * show the Terms link and open pdf in a new tab
 * @param props MailingLabelProps
 * @returns jsx
 */
const ViewPdfQuoteTerms = (props: ViewPdfQuoteTermsProps) => {
    const {
        prefixText,
        suffixText,
        quotationData,
        setFileError,
        setIsLoading,
    } = props;

    const { accounts, instance } = useMsal();

    const viewQuoteTermsPagePdf = async () => {
        try {
            AppLogger.verbose('viewQuoteTermsPagePdf.viewQuoteTermsPagePdf', { crmQuoteRequestId: quotationData?.crmQuoteRequestId });
            setIsLoading(true);
            const tokenResult = await instance.acquireTokenSilent({
                ...tokenRequest,
                account: accounts[0],
            });
            const fileResponse = await getQuotationFileDetails(tokenResult.accessToken, quotationData as RequestForQuoteDetails, true);
            if (fileResponse?.fileData && fileResponse.mimeType && fileResponse.filename) {
                const fileUrl = getFileUrlFromBase64(fileResponse.fileData);
                // If the quote is declined then the terms pdf will have 3 pages instead of 2
                const pageNumber = getQuoteOfferPageNumber(quotationData!.quoteRequestStatus);
                openPdfPageInNewTab(fileUrl, pageNumber);
            }
            setIsLoading(false);
        } catch (e) {
            setFileError(true);
            setIsLoading(false);
            AppLogger.error('Failed to download the Quotation Terms.', e as Error);
        }
    };

    return (
        <p>
            <strong>Note: </strong>
            {prefixText}
            <InTextLink onClick={(_e) => {
                viewQuoteTermsPagePdf();
                trackGAEvent('Terms', 'download');
            }}
            >
                Terms
                <ExternalLinkIcon className='ms-2' />
                <span className='visually-hidden'> Opens in a new tab</span>
            </InTextLink>
            {suffixText}
        </p>
    );
};

export default ViewPdfQuoteTerms;
