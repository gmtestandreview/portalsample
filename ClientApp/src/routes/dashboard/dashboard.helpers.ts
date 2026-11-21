import type {
  DashboardClient,
  PagedListOfDashboardItemDto,
  ProblemDetails,
  StatusEnumDto,
} from '../../api/web-api-client';
import { setDashboardNotification } from '../../storage/notification';
import type { useAccountDispatch } from '../../authentication/hooks';
import AppLogger from '../../instrumentation/AppLogger';
import { HttpStatusCode } from '../../types';
import { DashBoardNotifications } from '../common/dashboardNotifications';
import { DashboardTab } from '../../components/SearchFilter/types';
import { defaultFilter } from '../common/constants';
import { toStatusEnumDto } from '../common/helperFunctions';
import SessionStorageCache from '../../storage/sessionStorageCache';
import { DashboardItemStatus } from '../common/enums';

export const DEFAULT_SEARCH_PLACEHOLDER =
  'Search by manufacturer, model, serial...';

export interface DashboardErrorStatus {
  hasError: boolean;
  status: number;
  forbidden: boolean;
  noThirdPartyAccess: boolean;
}

export type SetDashboardErrorStatus = React.Dispatch<
  React.SetStateAction<DashboardErrorStatus>
>;

export const handleNotificationScroll = () => {
  document
    .querySelector('[id^="notif-"]')
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

interface FetchRequestsParams {
  tab: DashboardTab;
  client: DashboardClient;
  sortOrder: string;
  currentPage: number;
  pageSize: number;
  accountDetailsCrmGuid: string | undefined;
  filterSearchText: string | undefined;
  actualYear: string | undefined;
  actualStatus: StatusEnumDto | undefined;
  signal: AbortSignal | undefined;
}

export const fetchRequestsByTab = async ({
  tab,
  client,
  sortOrder,
  currentPage,
  pageSize,
  accountDetailsCrmGuid,
  filterSearchText,
  actualYear,
  actualStatus,
  signal,
}: FetchRequestsParams): Promise<PagedListOfDashboardItemDto> => {
  switch (tab) {
    case DashboardTab.Requests:
      return client.getDashboardQuotesByPortalID(
        accountDetailsCrmGuid,
        actualYear,
        actualStatus,
        sortOrder,
        filterSearchText,
        currentPage,
        pageSize,
        signal,
      );
    case DashboardTab.Instruments:
      return client.getDashboardArtefactsByPortalID(
        accountDetailsCrmGuid,
        actualYear,
        actualStatus,
        sortOrder,
        filterSearchText,
        currentPage,
        pageSize,
        signal,
      );
    default:
      return client.getDashboardDraftsByPortalID(
        accountDetailsCrmGuid,
        actualYear,
        actualStatus,
        sortOrder,
        filterSearchText,
        currentPage,
        pageSize,
        signal,
      );
  }
};

export const resolveFilterParams = (
  filterYearType: string | undefined,
  filterStatusType: string | undefined,
) => ({
  actualYear:
    filterYearType === defaultFilter.filterYearType
      ? undefined
      : filterYearType,
  actualStatus:
    filterStatusType === defaultFilter.filterStatusType
      ? undefined
      : toStatusEnumDto(filterStatusType),
});

export const checkAcceptedQuoteStatus = (
  requestsResponse: PagedListOfDashboardItemDto,
) => {
  const newlyAcceptedQuoteId =
    SessionStorageCache().getItem('accepted-quote-id');
  if (newlyAcceptedQuoteId) {
    const items = requestsResponse.items;
    if (!items) {
      SessionStorageCache().removeItem('accepted-quote-id');
      return;
    }

    const requestResponse = items.find(
      (x) => x.referenceId === newlyAcceptedQuoteId,
    );
    if (requestResponse?.status === DashboardItemStatus.QuoteAvailable) {
      requestResponse.status = DashboardItemStatus.QuoteAccepted;
      if (requestResponse.quote) {
        requestResponse.quote.artefactName =
          requestResponse.requestForQuote?.artefactName;
      }
      requestResponse.lastUpdated = new Date();

      const index = items.findIndex(
        (x) => x.referenceId === newlyAcceptedQuoteId,
      );
      items.unshift(...items.splice(index, 1));

      // The item was found by `referenceId === newlyAcceptedQuoteId`, so the
      // accepted quote id is exactly its reference id.
      SessionStorageCache().setItem(newlyAcceptedQuoteId, 'view-quote-id');
    }
    SessionStorageCache().removeItem('accepted-quote-id');
  }
};

export const handleDashboardLoadError = (
  error: unknown,
  setErrorStatus: SetDashboardErrorStatus,
) => {
  const problemDetails = error as ProblemDetails;
  const status = problemDetails.status ?? 0;
  if (status > 0) {
    setErrorStatus((prevState) => ({ ...prevState, status }));
  }
  if (
    problemDetails.status === HttpStatusCode.Forbidden &&
    problemDetails.title?.includes('No third-party access')
  ) {
    setErrorStatus((prevState) => ({ ...prevState, noThirdPartyAccess: true }));
  } else if (problemDetails.status === HttpStatusCode.Forbidden) {
    setErrorStatus((prevState) => ({ ...prevState, forbidden: true }));
  } else {
    setErrorStatus((prevState) => ({ ...prevState, hasError: true }));
  }
  AppLogger.info('Dashboard load error values', problemDetails);
};

export const applyErrorNotifications = (
  forbidden: boolean,
  noThirdPartyAccess: boolean,
  orgName: string | undefined,
  abn: string | undefined,
  organisation: string | undefined,
  accountDispatch: ReturnType<typeof useAccountDispatch>,
  setErrorStatus: SetDashboardErrorStatus,
) => {
  if (forbidden) {
    setDashboardNotification(DashBoardNotifications.getForbiddenNotification());
  }
  if (noThirdPartyAccess) {
    setDashboardNotification(
      DashBoardNotifications.getThirdPartyAccessNotification(orgName ?? ''),
    );
    if (accountDispatch) {
      accountDispatch.setTargetOrganisation(abn ?? '', organisation ?? '');
    }
    setErrorStatus((prevState) => ({
      ...prevState,
      noThirdPartyAccess: false,
    }));
  }
};
