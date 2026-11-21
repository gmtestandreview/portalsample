import { useState, useEffect, useMemo } from 'react';
import { Navigate, Link } from 'react-router';
import { Col, Row, Container, Tab, Nav } from 'react-bootstrap';
import { PatternFormat } from 'react-number-format';
import Welcome from '../../components/Welcome';
import BlockUISpinner from '../../components/BlockUISpinner';
import { clearDashboardInfoNotification } from '../../storage/notification';
import useHtmlTitle from '../../components/Utilities/useHtmlTitle';
import useBodyClass from '../../components/Utilities/useBodyClass';
import {
  useAccountState,
  useAccountDispatch,
} from '../../authentication/hooks';
import {
  useModalState,
  useModalDispatch,
} from '../../components/modals/ModalContext';
import type { DashboardItemDto } from '../../api/web-api-client';
import getUnexpectedErrorRoute from '../common/errorRoutes';
import SearchFilter from '../../components/SearchFilter';
import RequestItem from '../../components/RequestList/requestItem';
import InstrumentItem from '../../components/RequestList/instrumentItem';
import NoRequests from '../../components/RequestList/noRequests';
import { DashboardTab } from '../../components/SearchFilter/types';
import CustomPagination from '../../components/Pagination';
import CustomPaginationHeader from '../../components/PaginationHeader';
import { selectDashboardTab } from '../common/helperFunctions';
import { trackGAEvent } from '../../analytics/GoogleAnalytics';
import {
  DEFAULT_DASHBOARD_PAGESIZE,
  showDashboardMessage,
  setNotification,
  setInfoNotification,
  handlePaginationScroll,
} from './dashboardShared';
import {
  DEFAULT_SEARCH_PLACEHOLDER,
  applyErrorNotifications,
  handleNotificationScroll,
} from './dashboard.helpers';
import type { DashboardErrorStatus } from './dashboard.helpers';
import { DashboardQuickLinks } from './dashboard.sections';
import { useDashboardFilters } from './useDashboardFilters';
import { useDashboardRequests } from './useDashboardRequests';

const Dashboard = () => {
  const accountState = useAccountState();
  const accountDispatch = useAccountDispatch();
  const accountDetails = accountState?.details;
  const modalState = useModalState();
  const modalDispatch = useModalDispatch();
  const [errorStatus, setErrorStatus] = useState<DashboardErrorStatus>({
    hasError: false,
    status: 0,
    forbidden: false,
    noThirdPartyAccess: false,
  });

  const dashboardMessage = setNotification();
  const dashboardInfoMessage = setInfoNotification();
  const orgName =
    accountState?.details?.targetOrganisation?.targetOrganisationName;
  const organisationCRMGuid = accountDetails?.organisationCRMGuid;
  const userAcceptedTermsOfUse = accountDetails?.userAcceptedTermsOfUse;
  const accountHomeAccountId = accountDetails?.homeAccountId;
  const branchSelectionModalMode = modalState?.branchSelectionModalMode;
  const showBranchSelector = !!modalState?.showBranchSelector;
  const showRFQDeleteModal = !!modalState?.showRFQDeleteModal;

  const {
    initialFilters,
    setInitialFilters,
    currentPage,
    setCurrentPage,
    activeTab,
    changeTab: applyTabChange,
    changePage,
    stableFilters,
  } = useDashboardFilters({
    accountDetails,
    accountDispatch,
    branchSelectionModalMode,
  });
  const searchPlaceholder = useMemo(
    () =>
      activeTab === DashboardTab.Instruments
        ? 'Search by instrument/artefact...'
        : DEFAULT_SEARCH_PLACEHOLDER,
    [activeTab],
  );

  const onShowBranchSelectorClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    modalDispatch?.setShowBranchSelector(true);
  };

  useHtmlTitle('Dashboard | NMI Services portal');
  useBodyClass('dashboard');

  useEffect(() => {
    handleNotificationScroll();
  }, []);

  useEffect(() => {
    clearDashboardInfoNotification();
  }, []);

  const {
    requests,
    setRequests,
    isDataLoading,
    isModalOpen,
    totalPages,
    totalCount,
  } = useDashboardRequests({
    stableFilters,
    organisationCRMGuid,
    accountHomeAccountId,
    userAcceptedTermsOfUse,
    showBranchSelector,
    showRFQDeleteModal,
    setCurrentPage,
    setErrorStatus,
  });

  const changeTab = (tab: DashboardTab) => {
    setRequests([]);
    applyTabChange(tab);
  };

  useEffect(() => {
    applyErrorNotifications(
      errorStatus.forbidden,
      errorStatus.noThirdPartyAccess,
      orgName,
      accountState?.details?.abn,
      accountState?.details?.organisation,
      accountDispatch,
      setErrorStatus,
    );
  }, [
    errorStatus.forbidden,
    errorStatus.noThirdPartyAccess,
    orgName,
    accountState?.details?.abn,
    accountState?.details?.organisation,
    accountDispatch,
  ]);

  const renderDashTypeTitle = () => (
    <>
      <Row className='mb-2'>
        <Col className='d-flex justify-content-between align-items-md-center'>
          <h2 id='dash-type-title' className='mb-0 me-3'>
            Manage Testing and Calibration
          </h2>
          <span className='text-end'>
            <Link
              data-testid='new-request-button'
              to='/request-for-quote-create'
              className='btn btn-primary text-nowrap'
              onClick={() => {
                trackGAEvent('New request');
              }}
            >
              <i className='icon-plus me-md-2' aria-hidden='true' />
              <span className='d-none d-md-inline-block'>New request</span>
            </Link>
          </span>
        </Col>
      </Row>
      <Row className='mb-2'>
        {initialFilters && (
          <SearchFilter
            setCurrentPage={setCurrentPage}
            initialFilters={initialFilters}
            setInitialFilters={setInitialFilters}
            placeholder={searchPlaceholder}
            className='mb-md-1'
          />
        )}
      </Row>
    </>
  );

  const showRequestList = (
    trequests: DashboardItemDto[],
    userAcceptedTermsOfUse?: boolean,
  ) => (
    <>
      {requests.length > 0 && userAcceptedTermsOfUse ? ( // Check user has accepted terms of use before showing the request list
        <ol className='list-unstyled'>
          {trequests.map((r: DashboardItemDto) => (
            <RequestItem request={r} key={r.referenceId} />
          ))}
        </ol>
      ) : (
        !isDataLoading && <NoRequests />
      )}
    </>
  );

  const showInstrumentList = (
    trequests: DashboardItemDto[],
    userAcceptedTermsOfUse?: boolean,
  ) => (
    <>
      {requests.length > 0 && userAcceptedTermsOfUse ? ( // Check user has accepted terms of use before showing the request list
        <ol className='list-unstyled'>
          {trequests.map((r: DashboardItemDto) => (
            <InstrumentItem request={r} key={r.referenceId} />
          ))}
        </ol>
      ) : (
        !isDataLoading && <NoRequests />
      )}
    </>
  );

  const requestTabContent = (
    <Row className='mb-4'>
      <Col
        {...{ inert: isModalOpen ? '' : undefined }}
        aria-busy={!isModalOpen && isDataLoading}
        aria-live={isModalOpen ? undefined : 'polite'}
      >
        {!isModalOpen && isDataLoading ? (
          <BlockUISpinner partial>
            <p>Loading data...</p>
          </BlockUISpinner>
        ) : (
          <>
            <div className='dashboard-items mb-5'>
              {showRequestList(
                requests,
                accountDetails?.userAcceptedTermsOfUse,
              )}
            </div>
            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page: number) => {
                changePage(page);
                handlePaginationScroll();
                trackGAEvent('Request/pagechange');
              }}
              containerClassName='d-flex justify-content-center'
            />
          </>
        )}
      </Col>
    </Row>
  );

  const instrumentTabContent = (
    <Row className='mb-4'>
      <Col
        {...{ inert: isModalOpen ? '' : undefined }}
        aria-busy={!isModalOpen && isDataLoading}
        aria-live={isModalOpen ? undefined : 'polite'}
      >
        {!isModalOpen && isDataLoading ? (
          <BlockUISpinner partial>
            <p>Loading data...</p>
          </BlockUISpinner>
        ) : (
          <>
            <div className='dashboard-items mb-5'>
              {showInstrumentList(
                requests,
                accountDetails?.userAcceptedTermsOfUse,
              )}
            </div>
            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page: number) => {
                changePage(page);
                handlePaginationScroll();
                trackGAEvent('Instrument/pagechange');
              }}
              containerClassName='d-flex justify-content-center'
            />
          </>
        )}
      </Col>
    </Row>
  );

  const renderDashTCSubView = () => (
    <Row className='mb-3'>
      <Col>
        <Tab.Container
          id='dashboard-type'
          activeKey={activeTab}
          onSelect={(key) => {
            selectDashboardTab(key, (tab) => {
              changeTab(tab);
              trackGAEvent(tab);
            });
          }}
        >
          <Nav
            as='ul'
            variant='underline'
            className='align-items-center overflow-x-auto no-scrollbars mb-md-3'
            aria-label='Select your dashboard view'
          >
            <span className='d-flex flex-nowrap'>
              <Nav.Item as='li' role='presentation'>
                <Nav.Link
                  id={DashboardTab.Drafts}
                  eventKey={DashboardTab.Drafts}
                  className='px-3'
                >
                  Drafts
                </Nav.Link>
              </Nav.Item>
              <Nav.Item as='li' role='presentation'>
                <Nav.Link
                  id={DashboardTab.Requests}
                  eventKey={DashboardTab.Requests}
                  className='px-3'
                >
                  Requests
                </Nav.Link>
              </Nav.Item>
              <Nav.Item as='li' role='presentation'>
                <Nav.Link
                  id={DashboardTab.Instruments}
                  eventKey={DashboardTab.Instruments}
                  className='px-3'
                >
                  Instrument/artefacts
                </Nav.Link>
              </Nav.Item>
            </span>
            {!isDataLoading && (
              <span className='d-flex justify-content-end ms-auto p-2 ps-4 small text-nowrap'>
                <CustomPaginationHeader
                  currentPage={currentPage}
                  totalCount={totalCount}
                  pageSize={DEFAULT_DASHBOARD_PAGESIZE}
                />
              </span>
            )}
          </Nav>
          <Tab.Content>
            <Tab.Pane eventKey={DashboardTab.Drafts} tabIndex={0}>
              {requestTabContent}
            </Tab.Pane>
            <Tab.Pane eventKey={DashboardTab.Requests} tabIndex={0}>
              {requestTabContent}
            </Tab.Pane>
            <Tab.Pane eventKey={DashboardTab.Instruments} tabIndex={0}>
              {instrumentTabContent}
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Col>
    </Row>
  );

  if (errorStatus.hasError) {
    return <Navigate to={getUnexpectedErrorRoute(errorStatus.status)} />;
  }

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
            {!!accountState?.details && (
              <>
                <h2 className='h1 text-body mb-3' aria-describedby='orgABN'>
                  <span className='d-block mb-1 fs-5 fw-normal'>
                    {'Currently managing '}
                  </span>
                  <span className='d-block text-break'>
                    {!!accountState.details.trading &&
                      accountState.details.trading}
                    {!!accountState.details.trading &&
                      !!accountState.details.branch &&
                      ' - '}
                    {!!accountState.details.branch &&
                      accountState.details.branch}
                  </span>
                  <span className='d-block text-break'>
                    {!!accountState.details.organisation &&
                      accountState.details.organisation}
                  </span>
                </h2>
                {!!accountState.details.abn && (
                  <>
                    <span id='orgABN' className='d-inline-block me-3 fw-normal'>
                      {'ABN: '}
                      <PatternFormat
                        value={accountState.details.abn}
                        displayType='text'
                        format='## ### ### ###'
                        aria-hidden='true'
                        role='presentation'
                        valueIsNumericString={false}
                      />
                    </span>
                    <span className='visually-hidden'>
                      {accountState.details.abn.split('').join(' ')}
                    </span>
                  </>
                )}
                <Link
                  data-testid='open-manage-branch-division-button'
                  role='button'
                  onClick={onShowBranchSelectorClick}
                  to='#0'
                  className='text-nowrap'
                >
                  Add or manage branch/location
                </Link>
              </>
            )}
          </Col>
        </Row>
        {renderDashTypeTitle()}
        {renderDashTCSubView()}

        <DashboardQuickLinks />
      </Container>
    </>
  );
};

export default Dashboard;
