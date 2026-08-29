import { useState, useEffect, useMemo } from 'react';
import { Navigate, Link } from 'react-router';
import {
    Col, Row, Container,
    Tab,
    Nav,
} from 'react-bootstrap';
import { InteractionStatus } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { PatternFormat } from 'react-number-format';
import Welcome from '../../components/Welcome';
import BlockUISpinner from '../../components/BlockUISpinner';
import {
    getDashboardNotification,
    clearDashboardNotification,
    setDashboardNotification,
    getDashboardInfoNotification,
    clearDashboardInfoNotification,
} from '../../storage/notification';
import NotificationMessage from '../../components/Alert/NotificationMessage';
import useHtmlTitle from '../../components/Utilities/useHtmlTitle';
import useBodyClass from '../../components/Utilities/useBodyClass';
import useDebounce from '../../components/Utilities/useDebounce';
import { useAccountState, useAccountDispatch } from '../../authentication/hooks';
import { useModalState, useModalDispatch } from '../../components/modals/ModalContext';
import StandardPathway from '../../components/tiles/StandardPathway';
import { DashboardClient } from '../../api/web-api-client';
import type { DashboardItemDto, PagedListOfDashboardItemDto, ProblemDetails , StatusEnumDto } from '../../api/web-api-client';
import { tokenRequest } from '../../authentication/authConfig';
import AppLogger from '../../instrumentation/AppLogger';
import getUnexpectedErrorRoute from '../common/errorRoutes';
import { HttpStatusCode } from '../../types';
import { DashBoardNotifications } from '../common/dashboardNotifications';
import SearchFilter from '../../components/SearchFilter';
import RequestItem from '../../components/RequestList/requestItem';
import InstrumentItem from '../../components/RequestList/instrumentItem';
import NoRequests from '../../components/RequestList/noRequests';
import { DashboardTab } from '../../components/SearchFilter/types';
import type { UserProfile } from '../../components/SearchFilter/types';
import CustomPagination from '../../components/Pagination';
import CustomPaginationHeader from '../../components/PaginationHeader';
import { defaultFilter } from '../common/constants';
import { mapToUserProfile } from '../common/helperFunctions';
import SessionStorageCache from '../../storage/sessionStorageCache';
import { DashboardItemStatus } from '../common/enums';
import { trackGAEvent } from '../../analytics/GoogleAnalytics';
import { BranchSelectionModalMode } from '../../components/modals/BranchSelectorModal/enums';

// TS Move this to a constants file if we need this setting app wide
const DEFAULT_DASHBOARD_PAGESIZE = 10;
const DEFAULT_SEARCH_PLACEHOLDER = 'Search by manufacturer, model, serial...';

const showDashboardMessage = (message: JSX.Element | null) => (
    <>
        {message && (
            <Container>
                <Row>
                    <Col>
                        {message}
                    </Col>
                </Row>
            </Container>
        )}
    </>
);

const setNotification = () => {
    const dashboardNotification = getDashboardNotification();
    return (
        dashboardNotification
            ? (
                <NotificationMessage
                    id='notif-message-1'
                    canClose
                    onClose={clearDashboardNotification}
                    {...dashboardNotification}
                />
            )
            : null);
};

const setInfoNotification = () => {
    const dashboardInfoNotification = getDashboardInfoNotification();
    return (
        dashboardInfoNotification
            ? (
                <NotificationMessage
                    id='notif-info-message-2'
                    canClose
                    onClose={clearDashboardInfoNotification}
                    {...dashboardInfoNotification}
                />
            )
            : null);
};

const handlePaginationScroll = () => {
    const titleElement = document.getElementById('dash-type-title');
    titleElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const handleNotificationScroll = () => {
    document.querySelector('[id^="notif-"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

interface FetchRequestsParams {
    tab: DashboardTab;
    client: DashboardClient;
    sortOrder: string;
    currentPage: number;
    pageSize: number;
    accountDetailsCrmGuid?: string;
    filterSearchText?: string;
    actualYear?: string;
    actualStatus?: StatusEnumDto;
    signal?: AbortSignal;
}

const fetchRequestsByTab = async ({
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

const checkAcceptedQuoteStatus = (requestsResponse: PagedListOfDashboardItemDto) => {
    const newlyAcceptedQuoteId = SessionStorageCache().getItem('accepted-quote-id');
    if (newlyAcceptedQuoteId) {
        const items = requestsResponse.items;
        if (!items) {
            SessionStorageCache().removeItem('accepted-quote-id');
            return;
        }

        const requestResponse = items.find((x) => x.referenceId === newlyAcceptedQuoteId);
        if (requestResponse?.status === DashboardItemStatus.QuoteAvailable) {
            requestResponse.status = DashboardItemStatus.QuoteAccepted;
            // Non-null assertion required: property is typed nullable but guaranteed non-null here
            requestResponse.quote!.artefactName = requestResponse.requestForQuote?.artefactName;
            requestResponse.lastUpdated = new Date();

            const index = items.findIndex((x) => x.referenceId === newlyAcceptedQuoteId);
            const [updatedItem] = items.splice(index, 1);
            items.unshift(updatedItem);

            // Non-null assertion required: property is typed nullable but guaranteed non-null here
            SessionStorageCache().setItem(requestResponse.referenceId!, 'view-quote-id');
        }
        SessionStorageCache().removeItem('accepted-quote-id');
    }
};

const handleDashboardLoadError = (
    error: unknown,
    setErrorStatus: React.Dispatch<React.SetStateAction<{
        hasError: boolean; status: number; forbidden: boolean; noThirdPartyAccess: boolean;
    }>>,
) => {
    const problemDetails = error as ProblemDetails;
    if ((problemDetails.status ?? 0) > 0) {
        // Non-null assertion required: property is typed nullable but guaranteed non-null here
        setErrorStatus((prevState) => ({ ...prevState, status: problemDetails.status! }));
    }
    if (problemDetails.status === HttpStatusCode.Forbidden
        && problemDetails.title?.includes('No third-party access')) {
        setErrorStatus((prevState) => ({ ...prevState, noThirdPartyAccess: true }));
    } else if (problemDetails.status === HttpStatusCode.Forbidden) {
        setErrorStatus((prevState) => ({ ...prevState, forbidden: true }));
    } else {
        setErrorStatus((prevState) => ({ ...prevState, hasError: true }));
    }
    AppLogger.info('Dashboard load error values', problemDetails);
};

const applyErrorNotifications = (
    forbidden: boolean,
    noThirdPartyAccess: boolean,
    orgName: string | undefined,
    abn: string | undefined,
    organisation: string | undefined,
    accountDispatch: ReturnType<typeof useAccountDispatch>,
    setErrorStatus: React.Dispatch<React.SetStateAction<{
        hasError: boolean; status: number; forbidden: boolean; noThirdPartyAccess: boolean;
    }>>,
) => {
    if (forbidden) {
        setDashboardNotification(DashBoardNotifications.getForbiddenNotification());
    }
    if (noThirdPartyAccess) {
        setDashboardNotification(DashBoardNotifications.getThirdPartyAccessNotification(orgName ?? ''));
        if (accountDispatch) {
            accountDispatch.setTargetOrganisation(abn ?? '', organisation ?? '');
        }
        setErrorStatus((prevState) => ({ ...prevState, noThirdPartyAccess: false }));
    }
};

const Dashboard = () => {
    const { inProgress, accounts, instance } = useMsal();
    const [requests, setRequests] = useState<DashboardItemDto[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [reload, setReload] = useState(false);
    const accountState = useAccountState();
    const accountDispatch = useAccountDispatch();
    const accountDetails = accountState?.details;
    const modalState = useModalState();
    const modalDispatch = useModalDispatch();
    const [errorStatus, setErrorStatus] = useState({
        hasError: false, status: 0, forbidden: false, noThirdPartyAccess: false,
    });

    const [initialFilters, setInitialFilters] = useState<UserProfile | undefined>(undefined);
    const dashboardMessage = setNotification();
    const dashboardInfoMessage = setInfoNotification();
    const orgName = accountState?.details?.targetOrganisation?.targetOrganisationName;
    const savedUserProfile = accountDetails?.userProfile;
    const organisationCRMGuid = accountDetails?.organisationCRMGuid;
    const userAcceptedTermsOfUse = accountDetails?.userAcceptedTermsOfUse;
    const accountHomeAccountId = accountDetails?.homeAccountId;
    const branchSelectionModalMode = modalState?.branchSelectionModalMode;
    const showBranchSelector = !!modalState?.showBranchSelector;
    const showRFQDeleteModal = !!modalState?.showRFQDeleteModal;

    // Paging
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [activeTab, setActiveTab] = useState(DashboardTab.Drafts);
    const [totalCount, setTotalCount] = useState(0);
    const searchPlaceholder = useMemo(
        () => (activeTab === DashboardTab.Instruments ? 'Search by instrument/artefact...' : DEFAULT_SEARCH_PLACEHOLDER),
        [activeTab],
    );

    const onShowBranchSelectorClick = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        e.preventDefault();
        modalDispatch?.setShowBranchSelector(true);
    };

    useHtmlTitle('Dashboard | NMI Services portal');
    useBodyClass('dashboard');

    useEffect(() => {
        handleNotificationScroll();
    }, []);

    const saveUserProfile = (userProfile: UserProfile) => {
        accountDispatch?.setUserProfile({ testingCalibrationDashboard: userProfile });
    };

    const changeTab = (tab: DashboardTab) => {
        setRequests([]);
        setActiveTab(tab);
        setCurrentPage(1);
        setInitialFilters((prevState) => {
            if (!prevState) {
                return prevState;
            }

            const profile = {
                ...prevState,
                filterActiveTab: tab,
                filterCurrentPage: 1,
            };
            saveUserProfile(profile);
            return profile;
        });
    };

    const changePage = (page: number) => {
        setCurrentPage(page);
        setInitialFilters((prevState) => {
            if (!prevState) {
                return prevState;
            }

            const profile = {
                ...prevState,
                filterCurrentPage: page,
            };
            saveUserProfile(profile);
            return profile;
        });
    };

    // Set values from the userprofile
    useEffect(() => {
        if (savedUserProfile) {
            const p = mapToUserProfile(savedUserProfile);
            setActiveTab(p.filterActiveTab ?? DashboardTab.Drafts);
            setCurrentPage(p.filterCurrentPage ?? defaultFilter.filterCurrentPage);
            setInitialFilters((prevState) => prevState ?? p);
        }
    }, [savedUserProfile]);

    // Set to default userprofile page number when the branch is changed
    useEffect(() => {
        if (savedUserProfile
            && branchSelectionModalMode === BranchSelectionModalMode.SelectAndEditOrg
            && savedUserProfile.testingCalibrationDashboard?.filterCurrentPage !== defaultFilter.filterCurrentPage) {
            const tcDash = savedUserProfile?.testingCalibrationDashboard;
            const profile = {
                filterYearType: tcDash?.filterYearType,
                filterStatusType: tcDash?.filterStatusType,
                filtersChanged: tcDash?.filtersChanged,
                filterSortOrder: tcDash?.filterSortOrder,
                filterCurrentPage: defaultFilter.filterCurrentPage,
                filterActiveTab: tcDash?.filterActiveTab as DashboardTab | undefined,
                filterSearchText: tcDash?.filterSearchText,
            };
            setActiveTab(profile.filterActiveTab ?? DashboardTab.Drafts);
            setCurrentPage(profile.filterCurrentPage ?? defaultFilter.filterCurrentPage);
            accountDispatch?.setUserProfile({ testingCalibrationDashboard: profile });
            setInitialFilters(profile);
        }
    }, [accountDispatch, accountDetails?.defaultOrganisationId, branchSelectionModalMode, savedUserProfile]);

    const debouncedSearchText = useDebounce(initialFilters?.filterSearchText, 300);
    const stableFilters = useMemo(() => ({
        filterActiveTab: initialFilters?.filterActiveTab,
        filterCurrentPage: initialFilters?.filterCurrentPage,
        filterYearType: initialFilters?.filterYearType,
        filterStatusType: initialFilters?.filterStatusType,
        filterSortOrder: initialFilters?.filterSortOrder,
        filterSearchText: debouncedSearchText,
    }), [
        initialFilters?.filterActiveTab,
        initialFilters?.filterCurrentPage,
        initialFilters?.filterYearType,
        initialFilters?.filterStatusType,
        initialFilters?.filterSortOrder,
        debouncedSearchText,
    ]);

    const resolveFilterParams = (
        filterYearType: string | undefined,
        filterStatusType: string | undefined,
    ) => ({
        actualYear: filterYearType === defaultFilter.filterYearType
            ? undefined
            : filterYearType,
        actualStatus: filterStatusType === defaultFilter.filterStatusType
            ? undefined
            : filterStatusType as StatusEnumDto,
    });

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
                AppLogger.verbose('Dashboard.loadDataForDisplay', { homeAccountId: accountHomeAccountId });
                const client = new DashboardClient();
                const tokenResult = await instance.acquireTokenSilent({
                    ...tokenRequest,
                    account: accounts[0],
                });
                client.setAuthToken(tokenResult.accessToken);
                setErrorStatus((prevState) => ({ ...prevState, hasError: false }));
                setIsModalOpen(
                    showBranchSelector
                    || showRFQDeleteModal
                    || !userAcceptedTermsOfUse,
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
                setCurrentPage(requestsResponse.currentPage ?? defaultFilter.filterCurrentPage);
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
        loadDataForDisplay();

        return () => controller.abort();
    }, [accounts,
        accountHomeAccountId,
        inProgress,
        instance,
        organisationCRMGuid,
        reload,
        showBranchSelector,
        showRFQDeleteModal,
        stableFilters,
        userAcceptedTermsOfUse]);

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
    }, [errorStatus.forbidden, errorStatus.noThirdPartyAccess, orgName,
        accountState?.details?.abn, accountState?.details?.organisation,
        accountDispatch]);

    const renderDashTypeTitle = () => (
        <>
            <Row className='mb-2'>
                <Col className='d-flex justify-content-between align-items-md-center'>
                    <h2 id='dash-type-title' className='mb-0 me-3'>Manage Testing and Calibration</h2>
                    <span className='text-end'>
                        <Link
                            data-testid='new-request-button'
                            to='/request-for-quote-create'
                            className='btn btn-primary text-nowrap'
                            onClick={() => trackGAEvent('New request')}
                        >
                            <i className='icon-plus me-md-2' aria-hidden='true' />
                            <span className='d-none d-md-inline-block'>
                                New request
                            </span>
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

    const showRequestList = (trequests: DashboardItemDto[], userAcceptedTermsOfUse?: boolean) => (
        <>
            {(requests !== undefined
                    && requests?.length > 0
                    && userAcceptedTermsOfUse) // Check user has accepted terms of use before showing the request list
                ? (
                    <ol className='list-unstyled'>
                        {trequests.map((r: DashboardItemDto) => (
                            <RequestItem request={r} key={r.referenceId} />
                        ))}
                    </ol>
                )
                : !isDataLoading && (
                    <NoRequests />
                )}
        </>
    );

    const showInstrumentList = (trequests: DashboardItemDto[], userAcceptedTermsOfUse?: boolean) => (
        <>
            {(requests !== undefined
                    && requests?.length > 0
                    && userAcceptedTermsOfUse) // Check user has accepted terms of use before showing the request list
                ? (
                    <ol className='list-unstyled'>
                        {trequests.map((r: DashboardItemDto) => (
                            <InstrumentItem request={r} key={r.referenceId} />
                        ))}
                    </ol>
                )
                : !isDataLoading && (
                    <NoRequests />
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
                {!isModalOpen && isDataLoading
                    ? (
                        <BlockUISpinner partial>
                            <p>Loading data...</p>
                        </BlockUISpinner>
                    )
                    : (
                        <>
                            <div className='dashboard-items mb-5'>
                                {showRequestList(requests, accountDetails?.userAcceptedTermsOfUse)}
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
                {!isModalOpen && isDataLoading
                    ? (
                        <BlockUISpinner partial>
                            <p>Loading data...</p>
                        </BlockUISpinner>
                    )
                    : (
                        <>
                            <div className='dashboard-items mb-5'>
                                {showInstrumentList(requests, accountDetails?.userAcceptedTermsOfUse)}
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
                    onSelect={(key) => changeTab(key as DashboardTab)}
                >
                    <Nav
                        as='ul'
                        variant='underline'
                        className='align-items-center overflow-x-auto no-scrollbars mb-md-3'
                        aria-label='Select your dashboard view'
                    >
                        <span className='d-flex flex-nowrap'>
                            <Nav.Item
                                as='li'
                                role='presentation'
                            >
                                <Nav.Link
                                    id={DashboardTab.Drafts}
                                    eventKey={DashboardTab.Drafts}
                                    className='px-3'
                                    onClick={() => {
                                        changeTab(DashboardTab.Drafts);
                                        trackGAEvent(DashboardTab.Drafts);
                                    }}
                                >
                                    Drafts
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item
                                as='li'
                                role='presentation'
                            >
                                <Nav.Link
                                    id={DashboardTab.Requests}
                                    eventKey={DashboardTab.Requests}
                                    className='px-3'
                                    onClick={() => {
                                        changeTab(DashboardTab.Requests);
                                        trackGAEvent(DashboardTab.Requests);
                                    }}
                                >
                                    Requests
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item
                                as='li'
                                role='presentation'
                            >
                                <Nav.Link
                                    id={DashboardTab.Instruments}
                                    eventKey={DashboardTab.Instruments}
                                    className='px-3'
                                    onClick={() => {
                                        changeTab(DashboardTab.Instruments);
                                        trackGAEvent(DashboardTab.Instruments);
                                    }}
                                >
                                    Instrument/artefacts
                                </Nav.Link>
                            </Nav.Item>
                        </span>
                        {!isDataLoading && (
                            <span className='d-flex justify-content-end ms-auto p-2 ps-4 small text-nowrap'>
                                <CustomPaginationHeader currentPage={currentPage} totalCount={totalCount} pageSize={DEFAULT_DASHBOARD_PAGESIZE} />
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
                        {!!accountState?.details && (
                            <>
                                <h2 className='h1 text-body mb-3' aria-describedby='orgABN'>
                                    <span className='d-block mb-1 fs-5 fw-normal'>
                                        {'Currently managing '}
                                    </span>
                                    <span className='d-block text-break'>
                                        {!!(accountState?.details?.trading) && (`${accountState?.details?.trading}`)}
                                        {!!(accountState?.details?.trading) && !!(accountState?.details?.branch) && (' - ')}
                                        {!!(accountState?.details?.branch) && (`${accountState?.details?.branch}`)}
                                    </span>
                                    <span className='d-block text-break'>
                                        {!!(accountState?.details?.organisation) && (`${accountState?.details?.organisation}`)}
                                    </span>
                                </h2>
                                {!!(accountState?.details?.abn) && (
                                    <>
                                        <span id='orgABN' className='d-inline-block me-3 fw-normal'>
                                            {'ABN: '}
                                            <PatternFormat
                                                value={accountState?.details?.abn}
                                                displayType='text'
                                                format='## ### ### ###'
                                                aria-hidden='true'
                                                role='presentation'
                                                valueIsNumericString={false}
                                            />
                                        </span>
                                        <span className='visually-hidden'>
                                            {accountState?.details?.abn?.split('').join(' ')}
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

                <Row className='mb-5'>
                    <h2 className='pt-md-4 mb-3'>Quick links</h2>
                    <Col md>
                        <StandardPathway
                            type='internal'
                            title='Services we offer'
                            linkDescription=' '
                            bodyText='The National Measurement Institute (NMI) offers a range of service. Find out more...'
                            to='/services-we-offer'
                        />
                    </Col>
                    <Col md>
                        <StandardPathway
                            type='internal'
                            title='Help guide'
                            linkDescription=' '
                            bodyText='View help guides for common issues and troubleshooting tips'
                            to='/help-guide'
                        />
                    </Col>
                    <Col md>
                        <StandardPathway
                            type='external'
                            title='Give us your feedback'
                            linkDescription=' '
                            bodyText='Your feedback about using the portal is important to us. Please take the time to let us know your experience.'
                            linkHref='https://industry.au1.qualtrics.com/jfe/form/SV_9X41DIbsi8FvCQu'
                            target='_blank'
                        />
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default Dashboard;
