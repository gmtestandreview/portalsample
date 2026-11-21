import { useState, useEffect } from 'react';
import { InteractionStatus } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { DashboardClient } from '../../api/web-api-client';
import type { DashboardItemDto } from '../../api/web-api-client';
import { silentRequestFor } from '../../authentication/silentRequest';
import AppLogger from '../../instrumentation/AppLogger';
import type { DashboardTab } from '../../components/SearchFilter/types';
import { defaultFilter } from '../common/constants';
import { DEFAULT_DASHBOARD_PAGESIZE } from './dashboardShared';
import {
  checkAcceptedQuoteStatus,
  fetchRequestsByTab,
  handleDashboardLoadError,
  resolveFilterParams,
} from './dashboard.helpers';
import type { SetDashboardErrorStatus } from './dashboard.helpers';

interface StableFilters {
  filterActiveTab: DashboardTab | undefined;
  filterCurrentPage: number | undefined;
  filterYearType: string | undefined;
  filterStatusType: string | undefined;
  filterSortOrder: string | undefined;
  filterSearchText: string | undefined;
}

interface UseDashboardRequestsArgs {
  stableFilters: StableFilters;
  organisationCRMGuid: string | undefined;
  accountHomeAccountId: string | undefined;
  userAcceptedTermsOfUse: boolean | undefined;
  showBranchSelector: boolean;
  showRFQDeleteModal: boolean;
  setCurrentPage: (page: number) => void;
  setErrorStatus: SetDashboardErrorStatus;
}

export const useDashboardRequests = ({
  stableFilters,
  organisationCRMGuid,
  accountHomeAccountId,
  userAcceptedTermsOfUse,
  showBranchSelector,
  showRFQDeleteModal,
  setCurrentPage,
  setErrorStatus,
}: UseDashboardRequestsArgs) => {
  const { inProgress, accounts, instance } = useMsal();
  const [requests, setRequests] = useState<DashboardItemDto[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reload, setReload] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const loadDataForDisplay = async () => {
      if (!organisationCRMGuid || !stableFilters.filterActiveTab) {
        return;
      }
      if (inProgress !== InteractionStatus.None || accounts.length === 0) {
        return;
      }

      try {
        AppLogger.verbose('Dashboard.loadDataForDisplay', {
          homeAccountId: accountHomeAccountId,
        });
        const client = new DashboardClient();
        const tokenResult = await instance.acquireTokenSilent(
          silentRequestFor(accounts[0]),
        );
        client.setAuthToken(tokenResult.accessToken);
        setErrorStatus((prevState) => ({ ...prevState, hasError: false }));
        setIsModalOpen(
          showBranchSelector || showRFQDeleteModal || !userAcceptedTermsOfUse,
        );
        setIsDataLoading(true);
        const { actualYear, actualStatus } = resolveFilterParams(
          stableFilters.filterYearType,
          stableFilters.filterStatusType,
        );
        // SEC-010 (IDOR): Verified by backend team 2026-06-04. Finding identified in
        // pentest prior to go-live and remediated before production deployment. Server-side
        // org-scoping enforcement confirmed. SEC-010 CLOSED — see docs/sec/SEC-010-idor-backend-verification.md.
        const requestsResponse = await fetchRequestsByTab({
          tab: stableFilters.filterActiveTab,
          client,
          sortOrder: 'descending',
          currentPage: stableFilters.filterCurrentPage ?? 1,
          pageSize: DEFAULT_DASHBOARD_PAGESIZE,
          accountDetailsCrmGuid: organisationCRMGuid,
          filterSearchText: stableFilters.filterSearchText,
          actualYear,
          actualStatus,
          signal: controller.signal,
        });

        checkAcceptedQuoteStatus(requestsResponse);
        setRequests(requestsResponse.items ?? []);
        setCurrentPage(
          requestsResponse.currentPage ?? defaultFilter.filterCurrentPage,
        );
        setTotalPages(requestsResponse.totalPages ?? 0);
        setTotalCount(requestsResponse.totalCount ?? 0);
        // trackGAPii(); // Keep this here for later when we track pii-data
      } catch (error) {
        if ((error as { name?: string }).name === 'AbortError') return;
        AppLogger.error('Failed to load dashboard.', error as Error);
        handleDashboardLoadError(error, setErrorStatus);
      } finally {
        setIsDataLoading(false);
        setReload(false);
      }
    };
    void loadDataForDisplay();

    return () => {
      controller.abort();
    };
  }, [
    accounts,
    accountHomeAccountId,
    inProgress,
    instance,
    organisationCRMGuid,
    reload,
    setCurrentPage,
    setErrorStatus,
    showBranchSelector,
    showRFQDeleteModal,
    stableFilters,
    userAcceptedTermsOfUse,
  ]);

  return {
    requests,
    setRequests,
    isDataLoading,
    isModalOpen,
    totalPages,
    totalCount,
  };
};
