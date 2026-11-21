import ReactGA from 'react-ga4';
import {
  DashboardClient,
  FilterMessages,
  PatternApprovalStatusEnumDto,
  StatusEnumDto,
} from '../../api/web-api-client';
import type {
  AddressDetailsDto,
  DownloadedFileResponse,
  LookupResponse,
  ProblemDetails,
  RequestForQuoteDetails,
  UserProfileDto,
} from '../../api/web-api-client';
import type { AccountDetails } from '../../authentication/accountContext';
import { HttpStatusCode } from '../../types';
import { DashboardTab } from '../../components/SearchFilter/types';
import type { UserProfile } from '../../components/SearchFilter/types';
import { DashboardItemStatus, PaDashboardItemStatus } from './enums';
import { setDashboardNotification } from '../../storage/notification';
import { NotificationSeverity } from '../../storage/types';
import { base64toBlob } from '../../utils';
import { toHttpStatusCode } from '../../utils/apiEnumMappings';
import { DashBoardNotifications } from './dashboardNotifications';
import { Environment, QuoteStatus, ReportStatus } from './enums';
import type { SelectInputOption } from '../../components/Inputs/SelectInput/types';
import { openPdfPageInSecureNewTab, openUrlInSecureNewTab } from './openWindow';
import DOMPurify from 'dompurify';

const enumValue = <T extends Record<string, string>>(
  enumObject: T,
  value: unknown,
): T[keyof T] | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  return Object.values(enumObject).find((enumItem) => enumItem === value) as
    | T[keyof T]
    | undefined;
};

export const toDashboardTab = (value: unknown): DashboardTab | undefined =>
  enumValue(DashboardTab, value);

/**
 * Applies a selection from the dashboard tab control. The control reports its
 * key as `string | null`, so a key that is not a dashboard tab is ignored.
 */
export const selectDashboardTab = (
  key: unknown,
  onSelectTab: (tab: DashboardTab) => void,
) => {
  const tab = toDashboardTab(key);
  if (tab !== undefined) {
    onSelectTab(tab);
  }
};

export const toStatusEnumDto = (value: unknown): StatusEnumDto | undefined =>
  enumValue(StatusEnumDto, value);

export const toPatternApprovalStatusEnumDto = (
  value: unknown,
): PatternApprovalStatusEnumDto | undefined =>
  enumValue(PatternApprovalStatusEnumDto, value);

export const toFilterMessages = (value: unknown): FilterMessages | undefined =>
  enumValue(FilterMessages, value);

export const toDashboardItemStatus = (
  value: unknown,
): DashboardItemStatus | undefined => {
  const localStatus = enumValue(DashboardItemStatus, value);
  if (localStatus !== undefined) {
    return localStatus;
  }

  const apiStatus = toStatusEnumDto(value);
  switch (apiStatus) {
    case StatusEnumDto.Submitted:
      return DashboardItemStatus.QuoteSubmitted;
    case StatusEnumDto.QuoteInProgress:
      return DashboardItemStatus.QuoteInProgress;
    case StatusEnumDto.QuoteAvailable:
      return DashboardItemStatus.QuoteAvailable;
    case StatusEnumDto.QuoteAccepted:
      return DashboardItemStatus.QuoteAccepted;
    case StatusEnumDto.ReportInProgress:
      return DashboardItemStatus.ReportInProgress;
    case StatusEnumDto.ReportIssued:
      return DashboardItemStatus.ReportIssued;
    case StatusEnumDto.QuoteExpired:
      return DashboardItemStatus.QuoteExpired;
    case StatusEnumDto.QuoteDeclined:
      return DashboardItemStatus.QuoteDeclined;
    case StatusEnumDto.QuoteClosed:
      return DashboardItemStatus.QuoteClosed;
    case StatusEnumDto.ArtefactReceived:
      return DashboardItemStatus.ArtifactReceived;
    default:
      return undefined;
  }
};

export const toQuoteStatus = (value: unknown): QuoteStatus | undefined => {
  const localStatus = enumValue(QuoteStatus, value);
  if (localStatus !== undefined) {
    return localStatus;
  }

  // Note: StatusEnumDto.Submitted ("Submitted") shares its string value with
  // QuoteStatus.QuoteSubmitted, so the local enumValue() lookup above always
  // resolves "Submitted" first; a StatusEnumDto.Submitted arm here is
  // unreachable and is intentionally omitted.
  const apiStatus = toStatusEnumDto(value);
  switch (apiStatus) {
    case StatusEnumDto.QuoteInProgress:
      return QuoteStatus.QuoteInProgress;
    case StatusEnumDto.QuoteAvailable:
      return QuoteStatus.QuoteAvailable;
    case StatusEnumDto.QuoteAccepted:
      return QuoteStatus.QuoteAccepted;
    case StatusEnumDto.ReportInProgress:
      return QuoteStatus.ReportInProgress;
    case StatusEnumDto.ReportIssued:
      return QuoteStatus.ReportIssued;
    case StatusEnumDto.QuoteExpired:
      return QuoteStatus.QuoteExpired;
    case StatusEnumDto.QuoteDeclined:
      return QuoteStatus.QuoteDeclined;
    case StatusEnumDto.QuoteClosed:
      return QuoteStatus.QuoteClosed;
    case StatusEnumDto.ArtefactReceived:
      return QuoteStatus.ArtifactReceived;
    default:
      return undefined;
  }
};

export const toReportStatus = (value: unknown): ReportStatus | undefined =>
  enumValue(ReportStatus, value);

// PatternApprovalStatusEnumDto's members (Submitted, InProgress, OnHold,
// Completed) carry the same string values as the matching PaDashboardItemStatus
// members, so a single lookup resolves both the local and the API vocabulary.
export const toPaDashboardItemStatus = (
  value: unknown,
): PaDashboardItemStatus | undefined => enumValue(PaDashboardItemStatus, value);

/**
 * Gets downloadable files from CRM depending on status
 * @returns DownloadedFileResponse
 */

export const getFileDetails = (
  accessToken: string,
  result: RequestForQuoteDetails,
  getFile: boolean,
  isQuotationTab?: boolean,
): Promise<DownloadedFileResponse | undefined> => {
  const dashboardClient = new DashboardClient();
  dashboardClient.setAuthToken(accessToken);

  switch (result.quoteRequestStatus) {
    case QuoteStatus.QuoteAccepted:
    case QuoteStatus.ArtifactReceived:
      return dashboardClient.getQuoteRequestAcceptedPDFByID(
        result.crmQuoteRequestId,
        getFile,
      );
    case QuoteStatus.QuoteDeclined:
      return dashboardClient.getQuoteRequestRejectedPDFByID(
        result.crmQuoteRequestId,
        getFile,
      );
    case QuoteStatus.QuoteAvailable:
    case QuoteStatus.QuoteClosed:
      return dashboardClient.getQuoteOfferPDFByQuoteID(
        result.crmQuoteId,
        getFile,
      );
    case QuoteStatus.ReportIssued:
      return isQuotationTab
        ? dashboardClient.getQuoteRequestAcceptedPDFByID(
            result.crmQuoteRequestId,
            getFile,
          )
        : dashboardClient.getQuoteReportPDFByID(
            result.crmQuoteRequestId,
            getFile,
          );
    case QuoteStatus.ReportInProgress:
      return dashboardClient.getQuoteRequestAcceptedPDFByID(
        result.crmQuoteRequestId,
        getFile,
      );
    default:
      return Promise.resolve(undefined);
  }
};

/**
 * Gets downloadable files from CRM depending on status
 * @returns DownloadedFileResponse
 */
export const getQuotationFileDetails = (
  accessToken: string,
  result: RequestForQuoteDetails,
  getFile: boolean,
): Promise<DownloadedFileResponse | undefined> => {
  const dashboardClient = new DashboardClient();
  dashboardClient.setAuthToken(accessToken);

  switch (result.quoteRequestStatus) {
    case QuoteStatus.QuoteAccepted:
    case QuoteStatus.ArtifactReceived:
    case QuoteStatus.ReportIssued:
    case QuoteStatus.ReportInProgress:
    case QuoteStatus.ReportWithdrawn:
      return dashboardClient.getQuoteRequestAcceptedPDFByID(
        result.crmQuoteRequestId,
        getFile,
      );
    case QuoteStatus.QuoteDeclined:
      return dashboardClient.getQuoteRequestRejectedPDFByID(
        result.crmQuoteRequestId,
        getFile,
      );
    case QuoteStatus.QuoteAvailable:
    case QuoteStatus.QuoteClosed:
      return dashboardClient.getQuoteOfferPDFByQuoteID(
        result.crmQuoteId,
        getFile,
      );
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
  return sizeInKb > 1024
    ? `${(sizeInKb / 1024).toFixed(2)}Mb`
    : `${sizeInKb.toFixed(2)}Kb`;
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

export const getFileIdFromBase64 = (fileData: string): string =>
  getFileUrlFromBase64(fileData);

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
    const el = document.querySelector<HTMLElement>('[id^="#notif-"]');
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
  setDashboardNotification(
    DashBoardNotifications.getDashboardErrorNotification(
      toHttpStatusCode(details.status) ?? HttpStatusCode.InternalServerError,
      '',
    ),
  );
};

export const mapToUserProfile = (profile: UserProfileDto): UserProfile => ({
  filterYearType: profile.testingCalibrationDashboard?.filterYearType,
  filterStatusType: profile.testingCalibrationDashboard?.filterStatusType,
  filterSortOrder: profile.testingCalibrationDashboard?.filterSortOrder,
  filtersChanged: profile.testingCalibrationDashboard?.filtersChanged,
  filterCurrentPage: profile.testingCalibrationDashboard?.filterCurrentPage,
  filterActiveTab: toDashboardTab(
    profile.testingCalibrationDashboard?.filterActiveTab,
  ),
  filterSearchText: profile.testingCalibrationDashboard?.filterSearchText,
});

/** Account names as the formatters accept them: trading and branch may be absent. */
type NamedAccountDetails = Pick<AccountDetails, 'organisation'> & {
  trading?: string | undefined;
  branch?: string | undefined;
};

/**
 * Returns a formatted banner title string
 */
export const formatBannerTitle = (
  accountDetails: NamedAccountDetails | null | undefined,
): string => {
  if (accountDetails?.organisation !== undefined) {
    let result = '';

    if (accountDetails.trading !== undefined && accountDetails.trading !== '') {
      result = accountDetails.trading;
    }

    if (
      accountDetails.branch !== undefined &&
      accountDetails.branch !== '' &&
      accountDetails.trading !== undefined &&
      accountDetails.trading !== ''
    ) {
      result = `${result} - ${accountDetails.branch}`;
    } else if (
      accountDetails.branch !== undefined &&
      accountDetails.branch !== ''
    ) {
      result = accountDetails.branch;
    }

    if (
      (accountDetails.branch !== undefined && accountDetails.branch !== '') ||
      (accountDetails.trading !== undefined && accountDetails.trading !== '')
    ) {
      result = `${result} - ${accountDetails.organisation}`;
    } else {
      result = accountDetails.organisation;
    }

    return result;
  }
  return '';
};

export const formatOrganisationTitle = (
  organisationName: string | null | undefined,
  tradingNameInput: string | null | undefined,
  branchNameInput: string | null | undefined,
): string => {
  if (
    organisationName === null ||
    tradingNameInput === null ||
    branchNameInput === null
  ) {
    return '';
  }
  // A missing (undefined) trading or branch name is the same as an empty one.
  const tradingName = tradingNameInput ?? '';
  const branchName = branchNameInput ?? '';
  let result = '';

  if (tradingName !== '') {
    result = tradingName;
  }

  if (branchName !== '' && tradingName !== '') {
    result = `${result} - ${branchName}`;
  } else if (branchName !== '') {
    result = branchName;
  }

  if (branchName !== '' || tradingName !== '') {
    // No organisation name to append when it is missing.
    return organisationName === undefined
      ? result
      : `${result} - ${organisationName}`;
  }
  return organisationName ?? '';
};

export const formatTradingBranch = (
  accountDetails: NamedAccountDetails | null | undefined,
): string => {
  if (accountDetails?.organisation !== undefined) {
    let result = '';

    if (accountDetails.trading !== undefined && accountDetails.trading !== '') {
      result = accountDetails.trading;
    }

    if (
      accountDetails.branch !== undefined &&
      accountDetails.branch !== '' &&
      accountDetails.trading !== undefined &&
      accountDetails.trading !== ''
    ) {
      result = `${result} - ${accountDetails.branch}`;
    } else if (
      accountDetails.branch !== undefined &&
      accountDetails.branch !== ''
    ) {
      result = accountDetails.branch;
    }

    return result;
  }
  return '';
};

export const formatTradingBranchFromStrings = (
  tradingNameInput: string | null | undefined,
  branchNameInput: string | null | undefined,
): string => {
  // A missing (undefined) name is the same as an empty one; null still yields ''.
  const tradingName = tradingNameInput === undefined ? '' : tradingNameInput;
  const branchName = branchNameInput === undefined ? '' : branchNameInput;
  if (tradingName !== null && branchName !== null) {
    let result = '';

    if (tradingName !== '') {
      result = tradingName;
    }

    if (branchName !== '' && tradingName !== '') {
      result = `${result} - ${branchName}`;
    } else if (branchName !== '') {
      result = branchName;
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

export const contentLoaded = (sendPageView: boolean) => {
  const piiFields = document.querySelectorAll<HTMLElement>('[data-pii]');
  const redactedData: Record<string, string> = {};

  piiFields.forEach((field) => {
    const key = field.dataset['pii'] ?? '';
    Object.defineProperty(redactedData, key, {
      configurable: true,
      enumerable: true,
      value: '[REDACTED]',
      writable: true,
    });

    // Send redacted data to GA
    ReactGA.send({
      hitType: 'event',
      category: 'form_viewed_sanitized',
      data: redactedData,
    });
  });
  if (sendPageView)
    ReactGA.send({ hitType: 'pageview', page: globalThis.location.pathname });
};

export function sortList<T>(
  list: T[],
  lastItem: string,
  displayFieldName: keyof T,
): [T[], string];
// Lookups can be absent before they load; an absent list is returned unchanged.
export function sortList<T>(
  list: T[] | undefined,
  lastItem: string,
  displayFieldName: keyof T,
): [T[] | undefined, string];
export function sortList<T>(
  list: T[] | undefined,
  lastItem: string,
  displayFieldName: keyof T,
): [T[] | undefined, string] {
  let removedItems;
  let lastId = '';
  let removeId: string | undefined;

  if (!list || list.length === 0) {
    return [list, lastId];
  }

  const getDisplayField = (value: T): string =>
    Reflect.get(value as object, displayFieldName);

  const indexOfItemToRemove = list.findIndex((value) =>
    getDisplayField(value)
      .toLocaleLowerCase()
      .startsWith(lastItem.toLocaleLowerCase()),
  );

  if (displayFieldName === 'displayText') {
    const item =
      indexOfItemToRemove >= 0 ? list.at(indexOfItemToRemove) : undefined;
    removeId = (item as SelectInputOption<string> | undefined)?.value ?? '';
  } else {
    const item =
      indexOfItemToRemove >= 0 ? list.at(indexOfItemToRemove) : undefined;
    removeId = (item as LookupResponse | undefined)?.id ?? '';
  }

  lastId = removeId;

  if (indexOfItemToRemove >= 0) {
    removedItems = list.splice(indexOfItemToRemove, 1);
  }

  const sortedList = [...list].sort((a, b) =>
    getDisplayField(a).localeCompare(getDisplayField(b)),
  );
  const [removedItem] = removedItems ?? [];
  if (removedItem !== undefined) {
    sortedList.push(removedItem);
  }
  return [sortedList, lastId];
}

const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
const GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isEmptyGuid = (value: string | null | undefined): boolean =>
  !value || value === EMPTY_GUID;

export const isValidGUID = (value: string | null | undefined): boolean =>
  !!value && GUID_REGEX.test(value);

export const getFormattedAddress = (address: AddressDetailsDto | undefined) => {
  let formattedAddress = '';
  // Server JSON can carry null as well as a missing value; neither is printable.
  const isSet = (value: unknown) => value !== undefined && value !== null;

  if (
    address !== undefined &&
    isSet(address.suburb) &&
    isSet(address.state) &&
    isSet(address.postcode)
  ) {
    for (const line of [address.line1, address.line2, address.line3]) {
      if (line) {
        formattedAddress = `${formattedAddress}${line}, `;
      }
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
