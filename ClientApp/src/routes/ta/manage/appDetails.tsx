/* eslint-disable @typescript-eslint/no-unused-vars */
import { Col, Container, Nav, Row, Tab } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import type { FormikValues } from 'formik';
import useHtmlTitle from '../../../components/Utilities/useHtmlTitle';

import type { CustomBreadcrumbItem } from '../../../components/Breadcrumb';
import CustomBreadcrumb from '../../../components/Breadcrumb';
import useBodyClass from '../../../components/Utilities/useBodyClass';
import BlockUISpinner from '../../../components/BlockUISpinner';
import BackToDashboardButton from '../../../components/Buttons/BackToDashboardButton';
import type {
  ApplicationDetailsDto,
  RequestForPatternApprovalAppDetails,
} from '../../../api/web-api-client';
import { RequestForPatternApprovalClient } from '../../../api/web-api-client';
import FormikForm from '../../../components/forms/FormikForm';
import appDetailsProps from './appDetailsProps';
import useAccountContext from '../../../authentication/hooks';
import type { AccountDetails } from '../../../authentication/accountContext';
import type { TAApplicationDetailsProps } from '../types';
import ApplicationDocuments from './appDocuments';
import ApplicationMessages from './appMessages';
import { tokenRequest } from '../../../authentication/authConfig';
import AppDetailsContent from './appDetailsContent';
import ApplicationTimeline from './appTimeline';
import AppLogger from '../../../instrumentation/AppLogger';
import { ApplicationsManageTab } from './types';
import { base64toBlob } from '../../../utils';

const POLL_MS = 5000;

const ApplicationDetails = (props: TAApplicationDetailsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appDetails, setAppDetails] = useState<FormikValues | null>(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const { accounts, instance } = useMsal();
  const account = useAccountContext();
  const accountDetails: AccountDetails = account!.details!;
  const options = appDetailsProps(id, accounts, instance, accountDetails, '');
  const { loadStepValues, hidingFields } = options;
  const [applicationType, setApplicationType] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState<number>(0);
  // const messagesRoute = `/ta/${id}/manage?tab=messages`;
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

  // Default bread crumbs for all PA Manage tabs
  const breadcrumbs: CustomBreadcrumbItem[] = [
    { to: '/', text: 'Dashboard' },
    { to: '', text: `Application details - ${id}` },
    // { to: '', text: `${id} - ${applicationType || 'Application details'}` },
  ];

  useHtmlTitle(`Application details - ${id} | NMI Services portal`); // Default title for all PA Manage tabs
  // useHtmlTitle(`${applicationType || 'Application details'} - ${id} manage | NMI Services portal`);
  useBodyClass('pa-application-manage'); // Default body class for all PA Manage tabs

  // Query param-based tab navigation (?tab=...)
  const TAB_KEYS = ['details', 'messages', 'documents', 'timeline'];
  const getTabFromQuery = () => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    return tab && TAB_KEYS.includes(tab) ? tab : TAB_KEYS[0];
  };
  const [activeTab, setActiveTab] = useState(getTabFromQuery);
  const [loadMessagesTab, setLoadMessagesTab] = useState(
    () => getTabFromQuery() === 'messages',
  );
  const [messagesRefreshKey, setMessagesRefreshKey] = useState(0);

  useEffect(() => {
    const onPopState = () => {
      setActiveTab(getTabFromQuery());
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  useEffect(() => {
    disposedRef.current = false;

    const poll = async () => {
      await fetchMessageCountData();
      if (!disposedRef.current) {
        pollTimeoutRef.current = setTimeout(poll, POLL_MS);
      }
    };

    poll();

    return () => {
      clearPollTimeout();
    };
  }, [fetchMessageCountData]);

  useEffect(
    () => () => {
      disposedRef.current = true;
      clearPollTimeout();
    },
    [],
  );

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

  const downloadFile = async (fileName: string): Promise<void> => {
    try {
      if (accounts.length > 0 && id) {
        const client = new RequestForPatternApprovalClient();
        const tokenResult = await instance.acquireTokenSilent({
          ...tokenRequest,
          account: accounts[0],
        });
        client.setAuthToken(tokenResult.accessToken);
        const response = await client.getSupportingDocument(id, fileName, id);
        if (response?.fileData) {
          const blob = base64toBlob(
            response!.fileData,
            'application/octet-stream',
          );
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.setAttribute('download', fileName ?? 'download');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);
        }
        return;
      }
    } catch (error) {
      AppLogger.error('Failed to download file', error as Error, {
        fileName: fileName ?? 'undefined',
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsDataLoading(true);
      try {
        const result = await loadStepValues();
        setAppDetails(result.formValues);
        const appType = result.formValues
          ?.applicationDetails as ApplicationDetailsDto;
        setApplicationType(appType.patternApprovalType || '');
        // setIsDataLoading(true);
      } catch (e) {
        AppLogger.error('Failed to load application details', e as Error, {
          Id: id,
        });
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchData();
  }, [accounts, id, instance]);

  const renderTabSubView = (data: RequestForPatternApprovalAppDetails) => (
    <Row className='mb-0'>
      <Col className='mt-1 mt-md-0 px-0'>
        <Tab.Container
          id='appl-manage-tabs'
          activeKey={activeTab}
          defaultActiveKey={ApplicationsManageTab.Details}
          onSelect={handleTabSelect}
          mountOnEnter
        >
          <Nav
            as='ul'
            variant='underline'
            className='align-items-center overflow-x-auto no-scrollbars -mb-md-3'
            aria-label='Select your dashboard view'
          >
            <span className='d-flex flex-nowrap'>
              <Nav.Item as='li' role='presentation'>
                <Nav.Link
                  id={ApplicationsManageTab.Details}
                  eventKey={ApplicationsManageTab.Details}
                  className='px-3'
                  // onClick={() => {
                  //     changeTab(DashboardTab.Drafts);
                  //     trackGAEvent(DashboardTab.Drafts);
                  // }}
                >
                  Details
                </Nav.Link>
              </Nav.Item>
              <Nav.Item as='li' role='presentation'>
                <Nav.Link
                  id={ApplicationsManageTab.Messages}
                  eventKey={ApplicationsManageTab.Messages}
                  className='px-3'
                  onClick={() => {
                    // when already on Messages, force another refresh
                    if (activeTab === ApplicationsManageTab.Messages) {
                      refreshMessagesTab();
                    }
                  }}
                >
                  Messages
                </Nav.Link>
              </Nav.Item>
              <Nav.Item as='li' role='presentation'>
                <Nav.Link
                  id={ApplicationsManageTab.Documents}
                  eventKey={ApplicationsManageTab.Documents}
                  className='px-3'
                  // onClick={() => {
                  //     changeTab(DashboardTab.Requests);
                  //     trackGAEvent(DashboardTab.Requests);
                  // }}
                >
                  Documents
                </Nav.Link>
              </Nav.Item>
              <Nav.Item as='li' role='presentation'>
                <Nav.Link
                  id={ApplicationsManageTab.Timeline}
                  eventKey={ApplicationsManageTab.Timeline}
                  className='px-3'
                  // onClick={() => {
                  //     changeTab(DashboardTab.Requests);
                  //     trackGAEvent(DashboardTab.Requests);
                  // }}
                >
                  Timeline
                </Nav.Link>
              </Nav.Item>
            </span>
          </Nav>
          <Tab.Content className='tab-content-border -bg-white py-3'>
            <Tab.Pane eventKey='details' tabIndex={0} mountOnEnter>
              {isDataLoading ? (
                <BlockUISpinner partial>
                  <p>Loading data...</p>
                </BlockUISpinner>
              ) : null}

              {data ? (
                <AppDetailsContent
                  name='applicationDetails'
                  isModalOpen={isModalOpen}
                  isDataLoading={isDataLoading}
                  setActiveTab={setActiveTab}
                  onTabChange={handleTabSelect}
                  onDownloadFile={downloadFile}
                />
              ) : null}
            </Tab.Pane>
            <Tab.Pane eventKey='messages' tabIndex={0} mountOnEnter>
              {loadMessagesTab ? (
                <ApplicationMessages key={messagesRefreshKey} />
              ) : null}
            </Tab.Pane>
            <Tab.Pane eventKey='documents' tabIndex={0} mountOnEnter>
              <ApplicationDocuments onDownloadFile={downloadFile} />
            </Tab.Pane>
            <Tab.Pane eventKey='timeline' tabIndex={0} mountOnEnter>
              <ApplicationTimeline name='timelineDetails' />
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
            <span className='visually-hidden'>Pattern/type approval:</span>
            {data?.applicationDetails?.title ||
              `${id || ''} - Application details`}
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
      isLoading={isLoading}
      isSummaryPage
      onSubmit={() => Promise.resolve()}
      promptPath=''
      bannerTitle=''
      hidingFields={options.hidingFields}
    >
      {(formik) => (
        <>
          <div aria-busy={isDataLoading} aria-live='off'>
            <Container fluid className='default-banner-background mb-5'>
              <Container>{renderTitle(formik.values)}</Container>
            </Container>
            <Container style={{ marginTop: '-6.2rem' }}>
              <Container>{renderTabSubView(formik.values)}</Container>
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
