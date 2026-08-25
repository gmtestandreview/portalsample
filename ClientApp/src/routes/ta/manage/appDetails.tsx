import {
    Button,
    Col, Container, Nav, Row,
    Tab,
} from 'react-bootstrap';
import { useParams } from 'react-router';
import {
    useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import { useMsal } from '@azure/msal-react';
import type { FormikValues } from 'formik';
import useHtmlTitle from '../../../components/Utilities/useHtmlTitle';

import CustomBreadcrumb, { type CustomBreadcrumbItem } from '../../../components/Breadcrumb';
import useBodyClass from '../../../components/Utilities/useBodyClass';
import BlockUISpinner from '../../../components/BlockUISpinner';
import { CustomAccordion, CustomAccordionBody } from '../../../components/Accordion';
import BackToDashboardButton from '../../../components/Buttons/BackToDashboardButton';
import { type ApplicationDetailsDto, type RequestForPatternApprovalAppDetails, RequestForPatternApprovalClient } from '../../../api/web-api-client';
import StatusPill from '../../../components/Pill/StatusPill';
import type { PaDashboardItemStatus } from '../../common/enums';
import FormikForm from '../../../components/forms/FormikForm';
import ApplicationAndInstrument from '../applicationAndInstrument';
import appDetailsProps from './appDetailsProps';
import OrganisationAndContact from '../organisationAndContact';
import SupportingDocuments from '../supportingDocuments';
import ApplicationDocuments from './appDocuments';
import ApplicationMessages from './appMessages';
import { tokenRequest } from '../../../authentication/authConfig';

const POLL_MS = 5000;

const TAB_KEYS = ['details', 'messages', 'documents', 'timeline'];

const getTabFromQuery = () => {
    const params = new URLSearchParams(globalThis.location.search);
    const tab = params.get('tab');
    return tab && TAB_KEYS.includes(tab) ? tab : TAB_KEYS[0];
};

const ApplicationDetails = () => {
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [appDetails, setAppDetails] = useState<FormikValues | null>(null);
    const { id } = useParams();
    const { accounts, instance } = useMsal();
    const options = useMemo(
        () => appDetailsProps(id!, accounts, instance),
        [accounts, id, instance],
    );
    const { loadStepValues } = options;
    const [applicationType, setApplicationType] = useState<string | null>(null);
    const [messageCount, setMessageCount] = useState<number>(0);
    const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const disposedRef = useRef(false);

    const clearPollTimeout = () => {
        if (pollTimeoutRef.current) {
            clearTimeout(pollTimeoutRef.current);
            pollTimeoutRef.current = null;
        }
    };

    const fetchMessageCountData = useCallback(async () => {
        if (!id || accounts.length === 0) return;

        try {
            const client = new RequestForPatternApprovalClient();
            const tokenResult = await instance.acquireTokenSilent({
                ...tokenRequest,
                account: accounts[0],
            });
            client.setAuthToken(tokenResult.accessToken);
            const count = await client.getAppMessageCount(id, id, undefined);

            if (disposedRef.current) return;
            setMessageCount(count || 0);
        } catch {
        // optional: log
        }
    }, [accounts, id, instance]);

    const breadcrumbs: CustomBreadcrumbItem[] = [
        { to: '/', text: 'Dashboard' },
        { to: '', text: `${applicationType} (${id})` },
    ];

    useHtmlTitle(`${applicationType} (${id}) manage | NMI Services portal`);
    useBodyClass('pa-application-manage');

    const formattedDate = (dateToFormat : Date | string | undefined) => (dateToFormat ? new Date(dateToFormat).toLocaleDateString('en-AU', {
        day: '2-digit', month: 'short', year: 'numeric',
    }) : '');

    const [activeTab, setActiveTab] = useState(getTabFromQuery);
    const [loadMessagesTab, setLoadMessagesTab] = useState(() => getTabFromQuery() === 'messages');
    const [messagesRefreshKey, setMessagesRefreshKey] = useState(0);

    useEffect(() => {
        const onPopState = () => {
            setActiveTab(getTabFromQuery());
        };
        globalThis.addEventListener('popstate', onPopState);
        return () => globalThis.removeEventListener('popstate', onPopState);
    }, []);

    useEffect(() => {
        disposedRef.current = false;

        const poll = async () => {
            await fetchMessageCountData();
            if (!disposedRef.current) {
                // The rule cannot trace the clear through clearPollTimeout(),
                // which this effect's cleanup calls and which does invoke
                // clearTimeout(pollTimeoutRef.current). See clearPollTimeout above.
                // eslint-disable-next-line @eslint-react/web-api-no-leaked-timeout
                pollTimeoutRef.current = setTimeout(poll, POLL_MS);
            }
        };

        poll();

        return () => {
            clearPollTimeout();
        };
    }, [fetchMessageCountData]);

    useEffect(() => () => {
        disposedRef.current = true;
        clearPollTimeout();
    }, []);

    const refreshMessagesTab = () => {
        setLoadMessagesTab(true);
        setMessagesRefreshKey((prev) => prev + 1);
    };

    const handleTabSelect = (key: string | null) => {
        if (key && TAB_KEYS.includes(key)) {
            const params = new URLSearchParams(window.location.search);
            params.set('tab', key);
            const newUrl = `${window.location.pathname}?${params.toString()}`;
            window.history.pushState({}, '', newUrl);
            setActiveTab(key);

            if (key === 'messages') {
                refreshMessagesTab(); // mount only after user opens Messages
            }
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsDataLoading(true);
            const result = await loadStepValues();
            setAppDetails(result.formValues);
            const appType = result.formValues?.applicationDetails as ApplicationDetailsDto;
            setApplicationType(appType.patternApprovalType || null);
            setMessageCount(appType.messageCount || 0);
            setIsDataLoading(false);
        };
        fetchData();
    }, [loadStepValues]);

    function routeToMessages() {
        handleTabSelect('messages');
    }

     
    const detailsTabContent = (details: RequestForPatternApprovalAppDetails) => {
        const {
            referenceId, lastUpdated, assessedAs, status, statusDetail, title, submittedDate,
        } = details.applicationDetails || {};
        return (

            <Row className='mb-4'>
                <Col
                    aria-busy={isDataLoading}
                    aria-live='polite'
                >
                    {isDataLoading
                        ? (
                            <BlockUISpinner partial>
                                <p>Loading data...</p>
                            </BlockUISpinner>
                        )
                        : (
                            <div className='appl-items mb-5'>
                                <h2 className='visually-hidden'>Details</h2>
                                <Row className='mb-5'>
                                    <Col>
                                        <h3 id='applStatus' className='h2 mb-3'>Application status</h3>
                                        <CustomAccordion id='applicationStatus' containerClassName='mb-3'>
                                            <CustomAccordionBody
                                                name={`${title}`}
                                                eventKey='0'
                                                className='mb-4 py-2'
                                                nameRHS={(
                                                    <StatusPill status={status as PaDashboardItemStatus} />
                                                )}
                                            >
                                                {/* Application Status content body */}
                                                <Row>
                                                    <Col md={12}>
                                                        <p className='fw-bold small pb-0 mb-0'>Reference ID</p>
                                                        <p className='small'>{referenceId}</p>
                                                    </Col>
                                                    <Col md={12}>
                                                        <p className='fw-bold small pb-0 mb-0'>Last Updated</p>
                                                        <p className='small'>
                                                            {formattedDate(lastUpdated)}
                                                        </p>
                                                    </Col>
                                                    <Col md={12}>
                                                        <p className='fw-bold small pb-0 mb-0'>Application submitted</p>
                                                        <p className='small'>
                                                            {formattedDate(submittedDate)}
                                                        </p>
                                                    </Col>
                                                    <Col md={12}>
                                                        <p className='fw-bold small pb-0 mb-0'>Assessed by NMI as</p>
                                                        <p className='small'>
                                                            {assessedAs}
                                                        </p>
                                                    </Col>
                                                    <Col md={12}>
                                                        <p className='fw-bold small pb-0 mb-0'>Status detail</p>
                                                        <p className='small'>
                                                            <StatusPill status={status as PaDashboardItemStatus} className='visually-hidden -me-2' />
                                                            {statusDetail}
                                                        </p>
                                                    </Col>
                                                </Row>
                                                <Row>
                                                    <Col md={12}>
                                                        <Button
                                                            onClick={() => routeToMessages()}
                                                            type='button'
                                                            className='btn btn-secondary'
                                                            title={`${messageCount} unread messages`}
                                                        >
                                                            <span>
                                                                <span className='d-none d-md-inline-block'>
                                                                    {'Messages '}
                                                                </span>
                                                                {messageCount > 0 && (
                                                                    <>
                                                                        <span className='-me-md-2'>
                                                                            <span
                                                                                 
                                                                                className='badge badge-sm rounded-pill d-inline fade show bg-dark-red text-white'
                                                                                style={{ fontFamily: 'monospace', top: '-10px' }}
                                                                                role='status'
                                                                            >
                                                                                {messageCount}
                                                                            </span>
                                                                        </span>
                                                                        <span className='visually-hidden'>
                                                                            {' unread'}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </span>
                                                        </Button>
                                                    </Col>
                                                </Row>
                                                <Row>
                                                    <Col md={12}>
                                                        {/* <Button variant='link'>Withdraw application</Button> */}
                                                    </Col>
                                                </Row>
                                            </CustomAccordionBody>
                                        </CustomAccordion>
                                    </Col>
                                </Row>
                                <Row className='mb-5'>
                                    <Col>
                                        <h3 id='recordOfSubmittedAppl' className='h2 mb-3'>Record of application submitted</h3>
                                        <CustomAccordion id='organisationAndContact' containerClassName='mb-3'>
                                            <CustomAccordionBody name='Organisation details' eventKey='1' className='mb-4 py-2'>
                                                <OrganisationAndContact isSummary name='organisationAndContact' />
                                                {/* {!isSubmitted ? <EditButton link={`/ta/${id}/organisation-details`} /> : null} */}
                                            </CustomAccordionBody>
                                        </CustomAccordion>
                                        <CustomAccordion id='applicationAndInstrument' containerClassName='mb-3'>
                                            <CustomAccordionBody name='Application details' eventKey='2' className='mb-4 py-2'>
                                                <ApplicationAndInstrument isSummary name='applicationAndInstrument' />
                                                {/* {!isSubmitted ? <EditButton link={`/ta/${id}/application-details`} /> : null} */}
                                            </CustomAccordionBody>
                                        </CustomAccordion>
                                        <CustomAccordion id='supportingDocuments' containerClassName='mb-3'>
                                            <CustomAccordionBody
                                                name='Supporting documents'
                                                eventKey='3'
                                                className='mb-4 py-2'
                                                nameRHS={(
                                                    <span
                                                        role='button'
                                                        tabIndex={0}
                                                        className='btn btn-link text-nowrap'
                                                        title='Jump to the documents tab'
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const params = new URLSearchParams(window.location.search);
                                                            params.set('tab', 'documents');
                                                            const newUrl = `${window.location.pathname}?${params.toString()}`;
                                                            window.history.pushState({}, '', newUrl);
                                                            window.scrollTo(0, 0);
                                                            setActiveTab('documents');
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                e.stopPropagation();
                                                                const params = new URLSearchParams(window.location.search);
                                                                params.set('tab', 'documents');
                                                                const newUrl = `${window.location.pathname}?${params.toString()}`;
                                                                window.history.pushState({}, '', newUrl);
                                                                window.scrollTo(0, 0);
                                                                setActiveTab('documents');
                                                            }
                                                        }}
                                                    >
                                                        View documents
                                                    </span>
                                                )}
                                            >
                                                <SupportingDocuments
                                                    isSummary
                                                    suppressDocChanges
                                                    name='supportingDocuments.form.documents'
                                                    onUploadAttachment={() => Promise.resolve([])} // Not used
                                                    attachment={{
                                                        onUploadFiles: () => Promise.resolve([]), // Not used
                                                    }}
                                                />
                                                {/*  {!isSubmitted ? <EditButton link={`/ta/${id}/supporting-documents`} /> : null} */}
                                            </CustomAccordionBody>
                                        </CustomAccordion>
                                    </Col>
                                </Row>
                            </div>
                        )}
                </Col>
            </Row>
        );
    };

    const timelineTabContent = (
        <Row className='mb-4'>
            <Col
                aria-busy={isDataLoading}
                aria-live='polite'
            >
                {isDataLoading
                    ? (
                        <BlockUISpinner partial>
                            <p>Loading data...</p>
                        </BlockUISpinner>
                    )
                    : (
                        <div className='appl-items mb-5'>
                            <h2 className='visually-hidden'>Timeline</h2>
                            <h3 className='mb-2'>Timeline tab content</h3>
                        </div>
                    )}
            </Col>
        </Row>
    );

    const renderTabSubView = (data: RequestForPatternApprovalAppDetails) => (
        <Row className='mb-0'>
            <Col className='px-0'>
                <Tab.Container
                    id='appl-manage-tabs'
                    activeKey={activeTab}
                    onSelect={handleTabSelect}
                >
                    <Nav
                        as='ul'
                        variant='underline'
                        className='align-items-center overflow-x-auto no-scrollbars -mb-md-3'
                        aria-label='Select your dashboard view'
                    >
                        <span className='d-flex flex-nowrap'>
                            <Nav.Item
                                as='li'
                                role='presentation'
                            >
                                <Nav.Link
                                    id='details-tab'
                                    eventKey='details'
                                    className='px-3'
                                    // onClick={() => {
                                    //     changeTab(DashboardTab.Drafts);
                                    //     trackGAEvent(DashboardTab.Drafts);
                                    // }}
                                >
                                    Details
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item
                                as='li'
                                role='presentation'
                            >
                                <Nav.Link
                                    id='messages-tab'
                                    eventKey='messages'
                                    className='px-3'
                                    onClick={() => {
                                        // when already on Messages, force another refresh
                                        if (activeTab === 'messages') {
                                            refreshMessagesTab();
                                        }
                                    }}
                                >
                                    Messages
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item
                                as='li'
                                role='presentation'
                            >
                                <Nav.Link
                                    id='documents-tab'
                                    eventKey='documents'
                                    className='px-3'
                                    // onClick={() => {
                                    //     changeTab(DashboardTab.Requests);
                                    //     trackGAEvent(DashboardTab.Requests);
                                    // }}
                                >
                                    Documents
                                </Nav.Link>
                            </Nav.Item>
                            {/* Temp hide Timeline tab
                            <Nav.Item
                                as='li'
                                role='presentation'
                            >
                                <Nav.Link
                                    id='timeline-tab'
                                    eventKey='timeline'
                                    className='px-3'
                                    // onClick={() => {
                                    //     changeTab(DashboardTab.Requests);
                                    //     trackGAEvent(DashboardTab.Requests);
                                    // }}
                                >
                                    Timeline
                                </Nav.Link>
                            </Nav.Item> */}
                        </span>
                    </Nav>
                    <Tab.Content className='tab-content-border -bg-white py-3'>
                        <Tab.Pane
                            eventKey='details'
                            tabIndex={0}
                        >
                            {data ? detailsTabContent(data) : null}
                        </Tab.Pane>
                        <Tab.Pane
                            eventKey='messages'
                            tabIndex={0}
                        >
                            {loadMessagesTab ? <ApplicationMessages key={messagesRefreshKey} /> : null}
                        </Tab.Pane>
                        <Tab.Pane
                            eventKey='documents'
                            tabIndex={0}
                        >
                            <ApplicationDocuments />
                        </Tab.Pane>
                        <Tab.Pane
                            eventKey='timeline'
                            tabIndex={0}
                        >
                            {timelineTabContent}
                        </Tab.Pane>
                    </Tab.Content>
                </Tab.Container>
            </Col>
        </Row>
    );

    const renderTitle = (data: RequestForPatternApprovalAppDetails) => (
        <>
            <Row>
                <Col>
                    <CustomBreadcrumb breadcrumbs={breadcrumbs} />
                </Col>
            </Row>
            <Row className='gs-wrapper-sm -mb-5'>
                <Col md={12} lg={9}>
                    <h1 id='page-title' tabIndex={-1} className='h2 banner-title mb-5'>
                        <span className='visually-hidden'>
                            Pattern/type approval:
                        </span>
                        {(data && data.applicationDetails?.title) || 'Application details'}
                        <span className='visually-hidden'> manage</span>
                    </h1>
                    {/* <HeaderIntroText className='mb-4'>
                                    <strong>
                                        Pattern/type approval
                                    </strong>
                                </HeaderIntroText> */}
                </Col>
            </Row>
        </>
    );

    return (
        <FormikForm<RequestForPatternApprovalAppDetails>
            initialValues={appDetails as RequestForPatternApprovalAppDetails}
            isSummaryPage
            onSubmit={() => Promise.resolve()}
            promptPath=''
            bannerTitle=''
            hidingFields={options.hidingFields}
        >
            { (formik) => (
                <>
                    {isDataLoading && (
                        <BlockUISpinner>
                            <p>Loading...</p>
                        </BlockUISpinner>
                    )}
                    <div aria-busy={isDataLoading} aria-live='off'>
                        <Container fluid className='default-banner-background mb-5'>
                            <Container>
                                {renderTitle(formik.values)}
                            </Container>
                        </Container>
                        <Container style={{ marginTop: '-6.2rem' }}>
                            <Container>
                                {renderTabSubView(formik.values)}
                            </Container>
                        </Container>
                    </div>
                    <Container>
                        <Row className='mb-4'>
                            {/* <div className='d-grid d-md-block'>
                        <Link
                            data-testid='go-to-dashboard-button'
                            to='/dashboard'
                            replace
                            className='btn btn-tertiary'
                        >
                            <i className='icon-back me-1' aria-hidden='true' />
                            Back to dashboard
                        </Link>
                    </div> */}
                            <BackToDashboardButton />
                        </Row>
                    </Container>
                </>
            )}
        </FormikForm>
    );
};

export default ApplicationDetails;
