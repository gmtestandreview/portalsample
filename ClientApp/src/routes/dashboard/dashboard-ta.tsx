import {
    useCallback, useEffect, useRef, useState,
} from 'react';
import { Navigate, Link, useNavigate } from 'react-router';
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
import useAccountContext, { useAccountDispatch } from '../../authentication/hooks';
import StandardPathway from '../../components/tiles/StandardPathway';
import type {
    PatternApprovalStatusEnumDto} from '../../api/web-api-client';
import {
    type PagedListOfPatternApprovalDashboardDetailsDto,
    PatternApprovalClient,
    ServiceType,
    type PatternApprovalDashboardDetailsDto,
    type PatternApprovalDashboardDto,
    type ProblemDetails,
    type ServicesOffered,
} from '../../api/web-api-client';
import { tokenRequest } from '../../authentication/authConfig';
import AppLogger from '../../instrumentation/AppLogger';
import getUnexpectedErrorRoute from '../common/errorRoutes';
import { HttpStatusCode } from '../../types';
import { DashBoardNotifications } from '../common/dashboardNotifications';
import NoRequests from '../../components/RequestList/noRequests';
import PaRequestItem from '../../components/RequestList/paRequestItem';
import { DashboardTab } from '../../components/SearchFilter/types';
import CustomPagination from '../../components/Pagination';
import CustomPaginationHeader from '../../components/PaginationHeader';
import { trackGAEvent } from '../../analytics/GoogleAnalytics';
import PaSearchFilter from '../../components/SearchFilter/TypeApproval/paSearchFilter';
import { defaultFilter } from '../common/constants';
import { BranchSelectionModalMode } from '../../components/modals/BranchSelectorModal/enums';
import useUserServices from '../../hooks/useUserServices';
import SessionStorageCache from '../../storage/sessionStorageCache';

// TS Move this to a constants file if we need this setting app wide
const DEFAULT_DASHBOARD_PAGESIZE = 10;
const TAB_SAVE_DEBOUNCE_MS = 300;

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

const fetchRequestsByTab = async (
    tab: DashboardTab,
    client: PatternApprovalClient,
    sortOrder: string,
    currentPage: number,
    pageSize: number,
    accountDetailsCrmGuid?: string,
    filterSearchText?: string,
    actualYear?: string,
    actualStatus?: PatternApprovalStatusEnumDto,
    signal?:AbortSignal,
): Promise<PagedListOfPatternApprovalDashboardDetailsDto> => {
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

const DashboardTA = () => {
    const services = useUserServices();
    const navigate = useNavigate();
    const { inProgress, accounts, instance } = useMsal();
    const [requests, setRequests] = useState<PatternApprovalDashboardDetailsDto[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [reload, setReload] = useState(false);
    const accountContext = useAccountContext();
    const accountDispatch = useAccountDispatch();
    const accountDetails = accountContext?.details;
    const [errorStatus, setErrorStatus] = useState({
        hasError: false, status: 0, forbidden: false, noThirdPartyAccess: false,
    });
    const [deleteSuccess, setDeleteSuccess] = useState(false);

    const [initialFilters, setInitialFilters] = useState<PatternApprovalDashboardDto | undefined>(undefined);
    const dashboardMessage = setNotification();
    const dashboardInfoMessage = setInfoNotification();
    const orgName = accountContext?.details?.targetOrganisation?.targetOrganisationName as string;

    // Paging
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [activeTab, setActiveTab] = useState(DashboardTab.Drafts);
    const [totalCount, setTotalCount] = useState(0);
    const tabSaveTimeoutRef = useRef<number | null>(null);
    const lastBranchResetOrganisationIdRef = useRef<number>();
    const initialFiltersLoadedRef = useRef(false);

    useHtmlTitle('Dashboard Pattern/type approval | NMI Services portal');
    useBodyClass(['dashboard', 'dashboard-ta']);

    const saveUserProfile = useCallback((userProfile: PatternApprovalDashboardDto) => {
        const profile = {
            filterYearType: userProfile.filterYearType,
            filterStatusType: userProfile.filterStatusType,
            filtersChanged: userProfile.filtersChanged,
            filterSortOrder: userProfile.filterSortOrder,
            filterCurrentPage: userProfile.filterCurrentPage,
            filterActiveTab: userProfile.filterActiveTab,
            filterSearchText: userProfile.filterSearchText,
        };
        accountDispatch?.setUserProfile({ patternApprovalDashboard: profile }).catch((error) => {
            AppLogger.error('T & C Dashboard failed to save user profile.', error as Error);
        });
    }, [accountDispatch]);

    const saveUserProfileDebounced = (userProfile: PatternApprovalDashboardDto) => {
        if (tabSaveTimeoutRef.current !== null) {
            window.clearTimeout(tabSaveTimeoutRef.current);
        }

        tabSaveTimeoutRef.current = window.setTimeout(() => {
            saveUserProfile(userProfile);
            tabSaveTimeoutRef.current = null;
        }, TAB_SAVE_DEBOUNCE_MS);
    };

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

    useEffect(() => () => {
        /* console.log('Dashboard unmounting, clearing notifications'); */
        if (tabSaveTimeoutRef.current !== null) {
            window.clearTimeout(tabSaveTimeoutRef.current);
        }
        clearDashboardNotification();
    }, []);

    // Set values from the userprofile
    useEffect(() => {
        if (initialFiltersLoadedRef.current) {
            return;
        }
        if (accountDetails?.userProfile) {
            if (accountDetails?.userProfile?.patternApprovalDashboard) {
                const tabToSet: string | null | undefined = SessionStorageCache().getItem('set-tabop-after-save');
                const p = accountDetails.userProfile.patternApprovalDashboard;
                const tabFromSession = tabToSet ?? p!.filterActiveTab;
                const updatedP = {
                    ...p,
                    filterActiveTab: tabFromSession,
                };
                setActiveTab(tabFromSession as DashboardTab);
                // changePlaceholderForSearchBox(p!.filterActiveTab! as DashboardTab);
                setCurrentPage(updatedP!.filterCurrentPage!);
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
            savedUserProfile
            && branchSelectionModalMode === BranchSelectionModalMode.SelectAndEditOrg
            && defaultOrganisationId !== undefined
            && lastBranchResetOrganisationIdRef.current !== defaultOrganisationId
        ) {
            lastBranchResetOrganisationIdRef.current = defaultOrganisationId;
            const profile = {
                filterYearType: savedUserProfile.patternApprovalDashboard?.filterYearType,
                filterStatusType: savedUserProfile.patternApprovalDashboard?.filterStatusType,
                filtersChanged: savedUserProfile.patternApprovalDashboard?.filtersChanged,
                filterSortOrder: savedUserProfile.patternApprovalDashboard?.filterSortOrder,
                filterCurrentPage: defaultFilter.filterCurrentPage,
                filterActiveTab: savedUserProfile.patternApprovalDashboard?.filterActiveTab as DashboardTab,
                filterSearchText: savedUserProfile.patternApprovalDashboard?.filterSearchText,
            };

            setActiveTab(profile.filterActiveTab);
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
            (service: ServicesOffered) => service.service === ServiceType.PatternApproval
                && service.isActive,
        );
        if (userProfileLoaded && !patternApprovalIsActive) {
            navigate('/services-we-offer');
            return;
        }
        setIsDataLoading(true); // Dashboard data
        const loadDataForDisplay = async () => {
            if (accountContext
                && accountDetails
                && accountDetails?.organisationCRMGuid
                && initialFilters) {
                if (inProgress === InteractionStatus.None && accounts.length > 0) {
                    try {
                        AppLogger.verbose('Dashboard.loadDataForDisplay', accountContext.details);
                        const client = new PatternApprovalClient();
                        const tokenResult = await instance.acquireTokenSilent({
                            ...tokenRequest,
                            account: accounts[0],
                        });
                        client.setAuthToken(tokenResult.accessToken);
                        setErrorStatus((prevState) => ({ ...prevState, hasError: false }));
                        setIsModalOpen(
                            // List and check all Actionable modals across portal app
                            (!!accountDetails?.showBranchSelector
                             || !accountDetails?.userAcceptedTermsOfUse),
                        );
                        setIsDataLoading(true);
                        const intialTab = initialFilters.filterActiveTab as DashboardTab;
                        const actualYear = initialFilters.filterYearType === defaultFilter.filterYearType || initialFilters.filterYearType === undefined
                            ? undefined
                            : initialFilters.filterYearType!;
                        const actualStatus = initialFilters.filterStatusType === defaultFilter.filterStatusType || initialFilters.filterStatusType === undefined
                            ? undefined
                            : initialFilters.filterStatusType as PatternApprovalStatusEnumDto;
                        const requestsResponse = await fetchRequestsByTab(
                            intialTab,
                            client,
                            'descending', // TS whats up here are we changing this?
                            initialFilters.filterCurrentPage!,
                            DEFAULT_DASHBOARD_PAGESIZE, // TS should we add a pagesize dropdown in the future?
                            accountDetails?.organisationCRMGuid,
                            initialFilters.filterSearchText,
                            actualYear,
                            actualStatus,
                            undefined,
                        );
                        setRequests(requestsResponse.items!);
                        setCurrentPage(requestsResponse.currentPage!);
                        setTotalPages(requestsResponse.totalPages!);
                        setTotalCount(requestsResponse.totalCount!);
                        // trackGAPii(); // Keep this here for later when we track pii-data
                    } catch (error) {
                        AppLogger.error('Failed to load dashboard.', error as Error);
                        const problemDetails = error as ProblemDetails;
                        if (problemDetails.status! > 0) setErrorStatus((prevState) => ({ ...prevState, status: problemDetails.status! }));
                        if (problemDetails.status === HttpStatusCode.Forbidden
                            && problemDetails.title
                            && problemDetails.title.includes('No third-party access')) {
                            setErrorStatus((prevState) => ({ ...prevState, noThirdPartyAccess: true }));
                        } else if (problemDetails.status === HttpStatusCode.Forbidden) {
                            setErrorStatus((prevState) => ({ ...prevState, forbidden: true }));
                        } else {
                            setErrorStatus((prevState) => ({ ...prevState, hasError: true }));
                        }
                        AppLogger.info('Dashboard load error values', errorStatus);
                    } finally {
                        setIsDataLoading(false);
                        setReload(false);
                    }
                }
            }
        };
        setDeleteSuccess(false);
        loadDataForDisplay();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountContext?.details?.organisationCRMGuid,
        instance,
        inProgress,
        reload,
        initialFilters,
        deleteSuccess,
        services]);

    const renderDashTypeTitle = () => (
        <>
            <Row className='mb-2'>
                <Col className='d-flex justify-content-between align-items-md-center'>
                    <h2 id='dash-type-title' className='mb-0 me-3' tabIndex={-1}>
                        Manage Pattern/type approval
                        {/* TO DO - Do we componentise this? */}
                        {(services && services.filter((x: ServicesOffered) => x.isActive).length > 1) && (
                            <span className='text-start ms-3 me-3'>
                                <Link to='/services-we-offer?mode=manage' className='fw-normal fs-6'>Change</Link>
                            </span>
                        )}
                    </h2>

                    <span className='text-end'>
                        <Link
                            data-testid='new-application-button'
                            to='/ta/type-approval-create-pre'
                            className='btn btn-primary text-nowrap'
                            onClick={() => trackGAEvent('New TA application')}
                        >
                            <i className='icon-plus me-md-2' aria-hidden='true' role='presentation' />
                            <span className='d-none d-md-inline-block'>
                                New application
                            </span>
                        </Link>
                    </span>
                </Col>
            </Row>
            <Row className='mb-2'>
                {initialFilters && (
                    <PaSearchFilter
                        setCurrentPage={setCurrentPage}
                        initialFilters={initialFilters}
                        setInitialFilters={setInitialFilters}
                        className='mb-md-1'
                    />
                )}
            </Row>
        </>
    );

    const showRequestList = (trequests: PatternApprovalDashboardDetailsDto[], userAcceptedTermsOfUse?: boolean) => (
        <>
            {(requests !== undefined
                    && requests?.length > 0
                    && userAcceptedTermsOfUse) // Check user has accepted terms of use before showing the request list
                ? (
                    <ol className='list-unstyled'>
                        {trequests.map((r: PatternApprovalDashboardDetailsDto) => (
                            <li key={r.referenceId}>
                                <PaRequestItem
                                    setDeleteSuccess={setDeleteSuccess}
                                    request={r}
                                    tab={initialFilters?.filterActiveTab as DashboardTab ?? activeTab}
                                />
                            </li>
                        ))}
                    </ol>

                )
                : !isDataLoading && (
                    <NoRequests
                        serviceType='Pattern/type approval'
                        serviceName='application'
                        serviceNameLinkTitle='new application'
                        serviceNameLinkUrl='/ta/type-approval-create-pre'
                    />
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

    const renderDashTASubView = () => (
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
                                    Applications
                                </Nav.Link>
                            </Nav.Item>
                            {/* <Nav.Item
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
                            </Nav.Item> */}
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
                    </Tab.Content>
                </Tab.Container>
            </Col>
        </Row>
    );

    if (errorStatus.forbidden) {
        const message = DashBoardNotifications.getForbiddenNotification();
        setDashboardNotification(message);
    }

    if (errorStatus.noThirdPartyAccess) {
        const message = DashBoardNotifications.getThirdPartyAccessNotification(orgName);
        setDashboardNotification(message);
        accountDispatch?.setTargetOrganisation(
            accountContext?.details?.abn ?? '',
            accountContext?.details?.organisation ?? '',
        );
        setErrorStatus((prevState) => ({ ...prevState, noThirdPartyAccess: false }));
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
                            <>
                                <h2 className='h1 text-body mb-1 lh-sm' aria-describedby='orgABN'>
                                    <span className='d-block mb-1 fs-5 fw-normal'>
                                        {'Currently managing '}
                                    </span>
                                    <span className='d-none d-block text-break'>
                                        {!!(accountContext?.details?.trading) && (`${accountContext?.details?.trading}`)}
                                        {!!(accountContext?.details?.trading) && !!(accountContext?.details?.branch) && (' - ')}
                                        {!!(accountContext?.details?.branch) && (`${accountContext?.details?.branch}`)}
                                    </span>
                                    <span className='d-block text-break'>
                                        {!!(accountContext?.details?.organisation) && (`${accountContext?.details?.organisation}`)}
                                    </span>
                                </h2>
                                {!!(accountContext?.details?.abn) && (
                                    <>
                                        <span id='orgABN' className='d-inline-block me-3 fw-normal'>
                                            {'ABN: '}
                                            <PatternFormat
                                                value={accountContext?.details?.abn}
                                                displayType='text'
                                                format='## ### ### ###'
                                                aria-hidden='true'
                                                role='presentation'
                                                valueIsNumericString={false}
                                            />
                                        </span>
                                        <span className='visually-hidden'>
                                            {accountContext?.details?.abn?.split('').join(' ')}
                                        </span>
                                    </>
                                )}
                            </>
                        )}
                    </Col>
                </Row>
                {renderDashTypeTitle()}
                {renderDashTASubView()}

                <Row className='mb-5'>
                    <h2 className='pt-md-4 mb-3'>Quick links</h2>
                    <Col md>
                        <StandardPathway
                            type='internal'
                            title='Add an NMI Service'
                            linkDescription=' '
                            bodyText='The National Measurement Institute (NMI) offers a range of service. Find out more...'
                            to='/services-we-offer?mode=manage'
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
                            title='Your feedback'
                            linkDescription=' '
                            bodyText='Your feedback about using the portal is important to us. Please take the time to let us know your experience.'
                            linkHref='https://industry.au1.qualtrics.com/jfe/form/SV_9X41DIbsi8FvCQu'
                            target='_blank' // 'NMI-Feedback'
                        />
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default DashboardTA;
