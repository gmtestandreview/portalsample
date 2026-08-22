import ReactGA from 'react-ga4';
import { DashboardClient } from '../../api/web-api-client';
import type { AddressDetailsDto, DownloadedFileResponse, LookupResponse, ProblemDetails, RequestForQuoteDetails, UserProfileDto } from '../../api/web-api-client';
import type { AccountDetails } from '../../authentication/accountContext';
import type { DashboardTab, UserProfile } from '../../components/SearchFilter/types';
import { setDashboardNotification } from '../../storage/notification';
import { NotificationSeverity } from '../../storage/types';
import { base64toBlob } from '../../utils';
import { DashBoardNotifications } from './dashboardNotifications';
import { Environment, QuoteStatus } from './enums';
import type { SelectInputOption } from '../../components/Inputs/SelectInput/types';
import { openPdfPageInSecureNewTab, openUrlInSecureNewTab } from './openWindow';
import DOMPurify from 'dompurify';

/**
 * Gets downloadable files from CRM depending on status
 * @returns DownloadedFileResponse
 */

export const getFileDetails = (accessToken: string, result: RequestForQuoteDetails, getFile: boolean, isQuotationTab?: boolean | undefined): Promise<DownloadedFileResponse | undefined> => {
    const dashboardClient = new DashboardClient();
    dashboardClient.setAuthToken(accessToken);

    switch (result.quoteRequestStatus) {
        case QuoteStatus.QuoteAccepted:
        case QuoteStatus.ArtifactReceived:
            return dashboardClient.getQuoteRequestAcceptedPDFByID(result.crmQuoteRequestId, getFile);
        case QuoteStatus.QuoteDeclined:
            return dashboardClient.getQuoteRequestRejectedPDFByID(result.crmQuoteRequestId, getFile);
        case QuoteStatus.QuoteAvailable:
        case QuoteStatus.QuoteClosed:
            return dashboardClient.getQuoteOfferPDFByQuoteID(result.crmQuoteId, getFile);
        case QuoteStatus.ReportIssued:
            return isQuotationTab
                ? dashboardClient.getQuoteRequestAcceptedPDFByID(result.crmQuoteRequestId, getFile)
                : dashboardClient.getQuoteReportPDFByID(result.crmQuoteRequestId, getFile);
        case QuoteStatus.ReportInProgress:
            return dashboardClient.getQuoteRequestAcceptedPDFByID(result.crmQuoteRequestId, getFile);
        default:
            return Promise.resolve(undefined);
    }
};

/**
 * Gets downloadable files from CRM depending on status
 * @returns DownloadedFileResponse
 */
export const getQuotationFileDetails = (accessToken: string, result: RequestForQuoteDetails, getFile: boolean): Promise<DownloadedFileResponse | undefined> => {
    const dashboardClient = new DashboardClient();
    dashboardClient.setAuthToken(accessToken);

    switch (result.quoteRequestStatus) {
        case QuoteStatus.QuoteAccepted:
        case QuoteStatus.ArtifactReceived:
        case QuoteStatus.ReportIssued:
        case QuoteStatus.ReportInProgress:
        case QuoteStatus.ReportWithdrawn:
            return dashboardClient.getQuoteRequestAcceptedPDFByID(result.crmQuoteRequestId, getFile);
        case QuoteStatus.QuoteDeclined:
            return dashboardClient.getQuoteRequestRejectedPDFByID(result.crmQuoteRequestId, getFile);
        case QuoteStatus.QuoteAvailable:
        case QuoteStatus.QuoteClosed:
            return dashboardClient.getQuoteOfferPDFByQuoteID(result.crmQuoteId, getFile);
        default:
            return Promise.resolve(undefined);
    }
};

export const getMakeModelDetails = (result: RequestForQuoteDetails): string => {
    switch (result.quoteRequestStatus) {
        case QuoteStatus.ArtifactReceived:
        case QuoteStatus.ReportInProgress:
            return result.portalArtefactName ?? '';
        default:
            return result.instrumentArtefactToBeCalibrated ?? '';
    }
};

/**
 * Takes the filesizebytes value and converts into a formatted string
 * @param value The file size value received from the API
 * @returns a formatted string indicating the size of the file in either Mb or Kb
 */
export const getFileSize = (value: number): string => {
    const sizeInKb = value / 1024;
    return sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(2)}Mb` : `${sizeInKb.toFixed(2)}Kb`;
};

/**
 * Creates a file url based off the fileData param
 * @param fileData The file represented as a base64 string
 * @returns returns a url that can be used to download or view the pdffile
 */
export const getFileUrlFromBase64 = (fileData: string): string => {
    const blob = base64toBlob(fileData, 'application/pdf');
    const fileUrl = URL.createObjectURL(blob);
    return fileUrl;
};

export const getFileIdFromBase64 = (fileData: string): string => getFileUrlFromBase64(fileData);

/**
 * Resolves the page number the pdf opens on
 * @param status the status of the quote
 * @returns a page number
 */
export const getQuoteOfferPageNumber = (status: string | undefined): string => {
    switch (status) {
        case QuoteStatus.QuoteDeclined:
            return '3';
        case QuoteStatus.QuoteAccepted:
        case QuoteStatus.ArtifactReceived:
        case QuoteStatus.ReportIssued:
        case QuoteStatus.ReportInProgress:
            return '5';
        default:
            return '2';
    }
};

/**
 * triggers a download of a file
 * @param fileUrl The url of the file
 * @param fileName the name of the file
 */
export const triggerDownload = (fileUrl: string, fileName: string) => {
    const fileLink = document.createElement('a');
    fileLink.href = fileUrl;
    fileLink.download = fileName;
    fileLink.click();
};

/**
 * Open the specified fileUrl in a new browser tab
 * @param fileUrl the url of the file
 */
export const openInNewTab = (fileUrl: string) => {
    openUrlInSecureNewTab(fileUrl);
};

/**
 * Open the specified fileUrl in a new browser tab
 * @param fileUrl the url of the file
 */
export const openPdfPageInNewTab = (fileUrl: string, pageNumber: string) => {
    openPdfPageInSecureNewTab(fileUrl, pageNumber);
};

/**
 * Scrolls the windows to the top
 */
export const handleAlertScroll = () => {
    window.scrollTo(0, 0);
    setTimeout(() => {
        const el: HTMLElement = document.querySelector(('[id^="#notif-"]')) as HTMLElement;
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el?.focus();
    }, 100);
};

export const handleReportFileError = () => {
    handleAlertScroll();
    setDashboardNotification({
        message: `Oops - An unexpected error has occurred with downloading the PDF report. 
            Please wait a minute before reloading this page to try again.`,
        severity: NotificationSeverity.Error,
    });
};

export const handleUnexpectedError = (details: ProblemDetails) => {
    handleAlertScroll();
    setDashboardNotification(DashBoardNotifications.getDashboardErrorNotification(details.status! ?? 0, ''));
};

export const mapToUserProfile = (profile: UserProfileDto): UserProfile => ({
    filterYearType: profile.testingCalibrationDashboard?.filterYearType,
    filterStatusType: profile.testingCalibrationDashboard?.filterStatusType,
    filterSortOrder: profile.testingCalibrationDashboard?.filterSortOrder,
    filtersChanged: profile.testingCalibrationDashboard?.filtersChanged,
    filterCurrentPage: profile.testingCalibrationDashboard?.filterCurrentPage,
    filterActiveTab: profile.testingCalibrationDashboard?.filterActiveTab as DashboardTab,
    filterSearchText: profile.testingCalibrationDashboard?.filterSearchText,
});

/**
 * Returns a formatted banner title string
 */
export const formatBannerTitle = (accountDetails: AccountDetails): string => {
    if (accountDetails?.organisation !== undefined) {
        let result = '';

        if (accountDetails.trading !== undefined && accountDetails.trading !== '') {
            result = `${accountDetails.trading}`;
        }

        if (accountDetails.branch !== undefined && accountDetails.branch !== '' && accountDetails.trading !== undefined && accountDetails.trading !== '') {
            result = `${result} - ${accountDetails.branch}`;
        } else if (accountDetails.branch !== undefined && accountDetails.branch !== '') {
            result = `${accountDetails.branch}`;
        }

        if ((accountDetails.branch !== undefined && accountDetails.branch !== '') || (accountDetails.trading !== undefined && accountDetails.trading !== '')) {
            result = `${result} - ${accountDetails.organisation}`;
        } else {
            result = `${accountDetails.organisation}`;
        }

        return result;
    }
    return '';
};

export const formatOrganisationTitle = (organisationName: string | undefined, tradingName: string | undefined, branchName: string | undefined): string => {
    if (organisationName !== null && tradingName !== null && branchName !== null) {
        let result = '';

        if (tradingName !== '') {
            result = `${tradingName}`;
        }

        if (branchName !== '' && tradingName !== '') {
            result = `${result} - ${branchName}`;
        } else if (branchName !== '') {
            result = `${branchName}`;
        }

        if (branchName !== '' || tradingName !== '') {
            result = `${result} - ${organisationName}`;
        } else {
            result = `${organisationName}`;
        }

        return result;
    }
    return '';
};

export const formatTradingBranch = (accountDetails: AccountDetails): string => {
    if (accountDetails?.organisation !== undefined) {
        let result = '';

        if (accountDetails.trading !== undefined && accountDetails.trading !== '') {
            result = `${accountDetails.trading}`;
        }

        if (accountDetails.branch !== undefined && accountDetails.branch !== '' && accountDetails.trading !== undefined && accountDetails.trading !== '') {
            result = `${result} - ${accountDetails.branch}`;
        } else if (accountDetails.branch !== undefined && accountDetails.branch !== '') {
            result = `${accountDetails.branch}`;
        }

        return result;
    }
    return '';
};

export const formatTradingBranchFromStrings = (tradingName: string, branchName: string): string => {
    if (tradingName !== null && branchName !== null) {
        let result = '';

        if (tradingName !== '') {
            result = `${tradingName}`;
        }

        if (branchName !== '' && tradingName !== '') {
            result = `${result} - ${branchName}`;
        } else if (branchName !== '') {
            result = `${branchName}`;
        }

        return result;
    }
    return '';
};

export const getEnvironment = () => {
    let environment = '';
    if (globalThis.location.hostname.includes('localhost')) {
        environment = Environment.Local;
    }
    if (globalThis.location.hostname.includes('.dev.')) {
        environment = Environment.Dev;
    }
    if (globalThis.location.hostname.includes('.test.')) {
        environment = Environment.Test;
    }
    if (globalThis.location.hostname.includes('.preprod.')) {
        environment = Environment.PreProd;
    }
    if (globalThis.location.hostname.includes('.uat.')) {
        environment = Environment.UAT;
    }
    return environment;
};

export const contentLoaded = (sendPageView:boolean) => {
    const piiFields = document.querySelectorAll<HTMLElement>('[data-pii]');
    const redactedData: Record<string, string> = {};

    piiFields.forEach((field) => {
        const key = field.dataset.pii as string;
        redactedData[key] = '[REDACTED]';

        // Send redacted data to GA
        ReactGA.send({ hitType: 'event', category: 'form_viewed_sanitized', data: redactedData });
    });
    if (sendPageView) ReactGA.send({ hitType: 'pageview', page: globalThis.location.pathname });
};

export function sortList<T>(list: T[], lastItem: string, displayFieldName: keyof T): [T[], string] {
    let removedItems;
    let lastId = '';
    let removeId: string | undefined;

    if (!list || list.length === 0) {
        return [list, lastId];
    }

    const indexOfItemToRemove = list.findIndex(
        (value, _index, _c) => (value[displayFieldName] as string).toLocaleLowerCase().startsWith(lastItem.toLocaleLowerCase()),
    );

    if (displayFieldName === 'displayText') {
        removeId = (list[indexOfItemToRemove] as SelectInputOption<string>)?.value ?? '';
    } else {
        removeId = (list[indexOfItemToRemove] as LookupResponse)?.id ?? '';
    }

    lastId = removeId!;

    if (indexOfItemToRemove >= 0) {
        removedItems = list.splice(indexOfItemToRemove, 1);
    }

    const sortedList = [...list].sort((a, b) => (a[displayFieldName] as string).localeCompare(b[displayFieldName] as string));
    if (removedItems) {
        sortedList.push(removedItems[0]);
    }
    return [sortedList, lastId];
}

const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isEmptyGuid = (value: string | null | undefined): boolean =>
    !value || value === EMPTY_GUID;

export const isValidGUID = (value: string | null | undefined): boolean =>
    !!value && GUID_REGEX.test(value);

export const getFormattedAddress = (address: AddressDetailsDto | undefined) => {
    let formattedAddress = '';

    if (address !== undefined && address !== null && address.suburb !== null && address.state !== null && address.postcode !== null && address.suburb !== undefined && address.suburb !== null) {
        if (address.line1 !== null && address.line1 !== '') {
            formattedAddress = `${formattedAddress}${address.line1}, `;
        }
        if (address.line2 !== null && address.line2 !== '') {
            formattedAddress = `${formattedAddress}${address.line2}, `;
        }
        if (address.line3 !== null && address.line3 !== '') {
            formattedAddress = `${formattedAddress}${address.line3}, `;
        }
        formattedAddress = `${formattedAddress} ${address.suburb} ${address.state} ${address.postcode}`;
    }

    if (formattedAddress.length === 0) {
        formattedAddress = 'No Address Found';
    }

    return formattedAddress;
};

export const sanitiseHtml = (html: string): string => DOMPurify.sanitize(html);

export const downloadFileFromUrl = (
    url: string,
    _instance: unknown,
    _accounts: unknown[],
    _filename: string,
): void => {
    openUrlInSecureNewTab(url);
};
