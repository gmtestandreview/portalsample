import {
  type PatternApprovalClient,
  type PatternApprovalStatusEnumDto,
  type PagedListOfPatternApprovalDashboardDetailsDto,
  type ProblemDetails,
} from '../../api/web-api-client';
import { HttpStatusCode } from '../../types';
import { DashboardTab } from '../../components/SearchFilter/types';
import { defaultFilter } from '../common/constants';
import { toPatternApprovalStatusEnumDto } from '../common/helperFunctions';

export interface FetchRequestsParams {
  tab: DashboardTab;
  client: PatternApprovalClient;
  sortOrder: string;
  currentPage: number;
  pageSize: number;
  accountDetailsCrmGuid?: string | undefined;
  filterSearchText?: string | undefined;
  actualYear?: string | undefined;
  actualStatus?: PatternApprovalStatusEnumDto | undefined;
  signal?: AbortSignal | undefined;
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
}: FetchRequestsParams): Promise<PagedListOfPatternApprovalDashboardDetailsDto> => {
  switch (tab) {
    case DashboardTab.Drafts:
      return client.getPatternApprovalApplicationDrafts(
        accountDetailsCrmGuid,
        actualYear,
        actualStatus,
        sortOrder,
        filterSearchText,
        currentPage,
        pageSize,
        signal,
      );
    case DashboardTab.Requests:
      return client.getPatternApprovalApplications(
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
      throw new Error(`Unsupported tab: ${tab}`);
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
      : toPatternApprovalStatusEnumDto(filterStatusType),
});

export const classifyLoadError = (error: ProblemDetails) => {
  const statusCode = error.status ?? 0;
  const status = statusCode > 0 ? { status: statusCode } : {};
  if (error.status !== HttpStatusCode.Forbidden) {
    return { ...status, hasError: true };
  }
  return error.title?.includes('No third-party access')
    ? { ...status, noThirdPartyAccess: true }
    : { ...status, forbidden: true };
};
