import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Col, Row, Container } from 'react-bootstrap';
import { InteractionStatus } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import Welcome from '../../components/Welcome';
import {
  clearDashboardNotification,
  setDashboardNotification,
  clearDashboardInfoNotification,
} from '../../storage/notification';
import useHtmlTitle from '../../components/Utilities/useHtmlTitle';
import useBodyClass from '../../components/Utilities/useBodyClass';
import useAccountContext, {
  useAccountDispatch,
} from '../../authentication/hooks';
import {
  PatternApprovalClient,
  ServiceType,
  type PatternApprovalDashboardDetailsDto,
  type PatternApprovalDashboardDto,
  type ProblemDetails,
  type ServicesOffered,
} from '../../api/web-api-client';
import { silentRequestFor } from '../../authentication/silentRequest';
import AppLogger from '../../instrumentation/AppLogger';
import getUnexpectedErrorRoute from '../common/errorRoutes';
import { DashBoardNotifications } from '../common/dashboardNotifications';
import { DashboardTab } from '../../components/SearchFilter/types';
import { trackGAEvent } from '../../analytics/GoogleAnalytics';
import { defaultFilter } from '../common/constants';
import { BranchSelectionModalMode } from '../../components/modals/BranchSelectorModal/enums';
import useUserServices from '../../hooks/useUserServices';
import SessionStorageCache from '../../storage/sessionStorageCache';
import { toDashboardTab } from '../common/helperFunctions';
import {
  DEFAULT_DASHBOARD_PAGESIZE,
  handlePaginationScroll,
  setInfoNotification,
  setNotification,
  showDashboardMessage,
} from './dashboardShared';
import {
  classifyLoadError,
  fetchRequestsByTab,
  resolveFilterParams,
} from './dashboard-ta.helpers';
import {
  DashboardTaOrgSummary,
  DashboardTaQuickLinks,
  DashboardTaTabs,
  DashboardTaTitle,
  RequestTabContent,
} from './dashboard-ta.sections';
import useDashboardTaProfile from './useDashboardTaProfile';

const DashboardTA = () => {
  const services = useUserServices();
  const navigate = useNavigate();
  const { inProgress, accounts, instance } = useMsal();
  const [requests, setRequests] = useState<
    PatternApprovalDashboardDetailsDto[]
  >([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reload, setReload] = useState(false);
  const accountContext = useAccountContext();
  const accountDispatch = useAccountDispatch();
  const accountDetails = accountContext?.details;
  const [errorStatus, setErrorStatus] = useState({
    hasError: false,
    status: 0,
    forbidden: false,
    noThirdPartyAccess: false,
  });
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const [initialFilters, setInitialFilters] = useState<
    PatternApprovalDashboardDto | undefined
  >(undefined);
  const dashboardMessage = setNotification();
  const dashboardInfoMessage = setInfoNotification();
  const orgName =
    accountContext?.details?.targetOrganisation?.targetOrganisationName ?? '';

  // Paging
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState(DashboardTab.Drafts);
  const [totalCount, setTotalCount] = useState(0);
  const lastBranchResetOrganisationIdRef = useRef<number>();
  const initialFiltersLoadedRef = useRef(false);

  useHtmlTitle('Dashboard Pattern/type approval | NMI Services portal');
  useBodyClass(['dashboard', 'dashboard-ta']);

  const { saveUserProfile, saveUserProfileDebounced } = useDashboardTaProfile();

  const changeTab = (tab: DashboardTab) => {
    setRequests([]);
    setActiveTab(tab);
    setCurrentPage(1);
    setInitialFilters((prevState) => ({
      ...prevState,
      filterActiveTab: tab,
      filterCurrentPage: 1,
    }));

    const profile = {
      filterYearType: initialFilters?.filterYearType,
      filterStatusType: initialFilters?.filterStatusType,
      filtersChanged: initialFilters?.filtersChanged,
      filterSortOrder: initialFilters?.filterSortOrder,
      filterCurrentPage: 1,
      filterActiveTab: tab,
      filterSearchText: initialFilters?.filterSearchText,
    };
    saveUserProfileDebounced(profile);
  };

  const changePage = (page: number) => {
    setCurrentPage(page);
    setInitialFilters((prevState) => ({
      ...prevState,
      filterCurrentPage: page,
    }));

    const profile = {
      filterYearType: initialFilters?.filterYearType,
      filterStatusType: initialFilters?.filterStatusType,
      filtersChanged: initialFilters?.filtersChanged,
      filterSortOrder: initialFilters?.filterSortOrder,
      filterCurrentPage: page,
      filterActiveTab: initialFilters?.filterActiveTab,
      filterSearchText: initialFilters?.filterSearchText,
    };
    saveUserProfile(profile);
  };

  useEffect(
    () => () => {
      /* console.log('Dashboard unmounting, clearing notifications'); */
      clearDashboardNotification();
    },
    [],
  );

  // Set values from the userprofile
  useEffect(() => {
    if (initialFiltersLoadedRef.current) {
      return;
    }
    if (accountDetails?.userProfile) {
      if (accountDetails.userProfile.patternApprovalDashboard) {
        const tabToSet: string | null | undefined =
          SessionStorageCache().getItem('set-tabop-after-save');
        const p = accountDetails.userProfile.patternApprovalDashboard;
        const tabFromSession = tabToSet ?? p.filterActiveTab;
        const updatedP = {
          ...p,
          filterActiveTab: tabFromSession,
        };
        setActiveTab(toDashboardTab(tabFromSession) ?? DashboardTab.Drafts);
        setCurrentPage(updatedP.filterCurrentPage ?? 1);
        SessionStorageCache().removeItem('set-tabop-after-save');

        // Only need to do this on first load`
        setInitialFilters(updatedP);
        initialFiltersLoadedRef.current = true;
      }
    }
  }, [accountDetails?.userProfile]);

  const savedUserProfile = accountDetails?.userProfile;
  const branchSelectionModalMode = accountDetails?.branchSelectionModalMode;
  const defaultOrganisationId = accountDetails?.defaultOrganisationId;

  // Set to default userprofile page number when the branch is changed
  useEffect(() => {
    if (
      savedUserProfile &&
      branchSelectionModalMode === BranchSelectionModalMode.SelectAndEditOrg &&
      defaultOrganisationId !== undefined &&
      lastBranchResetOrganisationIdRef.current !== defaultOrganisationId
    ) {
      lastBranchResetOrganisationIdRef.current = defaultOrganisationId;
      const profile = {
        filterYearType:
          savedUserProfile.patternApprovalDashboard?.filterYearType,
        filterStatusType:
          savedUserProfile.patternApprovalDashboard?.filterStatusType,
        filtersChanged:
          savedUserProfile.patternApprovalDashboard?.filtersChanged,
        filterSortOrder:
          savedUserProfile.patternApprovalDashboard?.filterSortOrder,
        filterCurrentPage: defaultFilter.filterCurrentPage,
        filterActiveTab: toDashboardTab(
          savedUserProfile.patternApprovalDashboard?.filterActiveTab,
        ),
        filterSearchText:
          savedUserProfile.patternApprovalDashboard?.filterSearchText,
      };

      setActiveTab(profile.filterActiveTab ?? DashboardTab.Drafts);
      setCurrentPage(profile.filterCurrentPage);
      saveUserProfile(profile);
      setInitialFilters(profile);
    }
  }, [
    branchSelectionModalMode,
    defaultOrganisationId,
    savedUserProfile,
    saveUserProfile,
  ]);

  useEffect(() => {
    const userProfileLoaded = accountDetails?.userProfile !== undefined;
    const patternApprovalIsActive = services.some(
      (service: ServicesOffered) =>
        service.service === ServiceType.PatternApproval && service.isActive,
    );
    if (userProfileLoaded && !patternApprovalIsActive) {
      void navigate('/services-we-offer');
      return;
    }
    setIsDataLoading(true); // Dashboard data
    const loadDataForDisplay = async () => {
      if (
        !accountContext ||
        !accountDetails?.organisationCRMGuid ||
        !initialFilters
      ) {
        return;
      }
      if (inProgress !== InteractionStatus.None || accounts.length === 0) {
        return;
      }
      try {
        AppLogger.verbose(
          'Dashboard.loadDataForDisplay',
          accountContext.details,
        );
        const client = new PatternApprovalClient();
        const tokenResult = await instance.acquireTokenSilent(
          silentRequestFor(accounts[0]),
        );
        client.setAuthToken(tokenResult.accessToken);
        setErrorStatus((prevState) => ({ ...prevState, hasError: false }));
        setIsModalOpen(
          // List and check all Actionable modals across portal app
          accountDetails.showBranchSelector ||
            !accountDetails.userAcceptedTermsOfUse,
        );
        setIsDataLoading(true);
        const { actualYear, actualStatus } = resolveFilterParams(
          initialFilters.filterYearType,
          initialFilters.filterStatusType,
        );
        const requestsResponse = await fetchRequestsByTab({
          tab:
            toDashboardTab(initialFilters.filterActiveTab) ??
            DashboardTab.Drafts,
          client,
          sortOrder: 'descending', // TS whats up here are we changing this?
          currentPage: initialFilters.filterCurrentPage ?? 1,
          pageSize: DEFAULT_DASHBOARD_PAGESIZE, // TS should we add a pagesize dropdown in the future?
          accountDetailsCrmGuid: accountDetails.organisationCRMGuid,
          filterSearchText: initialFilters.filterSearchText,
          actualYear,
          actualStatus,
          signal: undefined,
        });
        setRequests(requestsResponse.items ?? []);
        setCurrentPage(requestsResponse.currentPage ?? 1);
        setTotalPages(requestsResponse.totalPages ?? 0);
        setTotalCount(requestsResponse.totalCount ?? 0);
        // trackGAPii(); // Keep this here for later when we track pii-data
      } catch (error) {
        AppLogger.error('Failed to load dashboard.', error as Error);
        const problemDetails = error as ProblemDetails;
        setErrorStatus((prevState) => ({
          ...prevState,
          ...classifyLoadError(problemDetails),
        }));
        AppLogger.info('Dashboard load error values', problemDetails);
      } finally {
        setIsDataLoading(false);
        setReload(false);
      }
    };
    setDeleteSuccess(false);
    void loadDataForDisplay();
  }, [
    accountContext,
    accountDetails?.organisationCRMGuid,
    accountDetails?.showBranchSelector,
    accountDetails?.userAcceptedTermsOfUse,
    accountDetails?.userProfile,
    accounts,
    instance,
    inProgress,
    reload,
    initialFilters,
    deleteSuccess,
    services,
    navigate,
  ]);

  const requestTabContent = (
    <RequestTabContent
      requests={requests}
      isModalOpen={isModalOpen}
      isDataLoading={isDataLoading}
      userAcceptedTermsOfUse={accountDetails?.userAcceptedTermsOfUse}
      currentPage={currentPage}
      totalPages={totalPages}
      activeTab={activeTab}
      initialFilters={initialFilters}
      setDeleteSuccess={setDeleteSuccess}
      onPageChange={(page: number) => {
        changePage(page);
        handlePaginationScroll();
        trackGAEvent('Request/pagechange');
      }}
    />
  );

  if (errorStatus.forbidden) {
    const message = DashBoardNotifications.getForbiddenNotification();
    setDashboardNotification(message);
  }

  if (errorStatus.noThirdPartyAccess) {
    const message =
      DashBoardNotifications.getThirdPartyAccessNotification(orgName);
    setDashboardNotification(message);
    accountDispatch?.setTargetOrganisation(
      accountContext?.details?.abn ?? '',
      accountContext?.details?.organisation ?? '',
    );
    setErrorStatus((prevState) => ({
      ...prevState,
      noThirdPartyAccess: false,
    }));
  }

  if (errorStatus.hasError) {
    return <Navigate to={getUnexpectedErrorRoute(errorStatus.status)} />;
  }

  clearDashboardInfoNotification();

  return (
    <>
      <div aria-live={isModalOpen ? undefined : 'off'}>
        <Welcome />
      </div>
      {showDashboardMessage(dashboardMessage)}
      {showDashboardMessage(dashboardInfoMessage)}
      <Container>
        <Row className='mb-5'>
          <Col aria-live={isModalOpen ? undefined : 'off'}>
            {!!accountContext?.details && (
              <DashboardTaOrgSummary details={accountContext.details} />
            )}
          </Col>
        </Row>
        <DashboardTaTitle
          services={services}
          initialFilters={initialFilters}
          setCurrentPage={setCurrentPage}
          setInitialFilters={setInitialFilters}
        />
        <DashboardTaTabs
          activeTab={activeTab}
          changeTab={changeTab}
          isDataLoading={isDataLoading}
          currentPage={currentPage}
          totalCount={totalCount}
        >
          {requestTabContent}
        </DashboardTaTabs>

        <DashboardTaQuickLinks />
      </Container>
    </>
  );
};

export default DashboardTA;
