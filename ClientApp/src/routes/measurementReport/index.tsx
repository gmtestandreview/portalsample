import { useEffect, useState } from 'react';
import { Col, Row, Container } from 'react-bootstrap';
import { InteractionStatus } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import BlockUISpinner from '../../components/BlockUISpinner';
import {
  getReportingNotification,
  clearReportingNotification,
  getDashboardInfoNotification,
  setDashboardInfoNotification,
  clearDashboardInfoNotification,
  setDashboardNotification,
} from '../../storage/notification';
import NotificationMessage from '../../components/Alert/NotificationMessage';
import useHtmlTitle from '../../components/Utilities/useHtmlTitle';
import useBodyClass from '../../components/Utilities/useBodyClass';
import useAccountContext from '../../authentication/hooks';
import { NotificationSeverity } from '../../storage/types';
import type { CustomBreadcrumbItem } from '../../components/Breadcrumb';
import CustomBreadcrumb from '../../components/Breadcrumb';
import HeaderIntroText from '../../components/HeaderIntroText';
import type { RequestForQuoteDetails } from '../../api/web-api-client';
import { ApplicationType, QuoteClient } from '../../api/web-api-client';
import ReportDetails from './reportDetails';
import NMIContactDetails from '../common/NMIContactDetails';
import ViewMeasurementReport from '../../components/Utilities/ViewMeasurementReport';
import { tokenRequest } from '../../authentication/authConfig';
import { handleReportFileError } from '../common/helperFunctions';
import AppLogger from '../../instrumentation/AppLogger';

const showReportingMessage = (message: JSX.Element | null) => (
  <>
    {message && (
      <Container>
        <Row>
          <Col>{message}</Col>
        </Row>
      </Container>
    )}
  </>
);

const showDashboardMessage = (message: JSX.Element | null) => (
  <>
    {message && (
      <Container>
        <Row>
          <Col>{message}</Col>
        </Row>
      </Container>
    )}
  </>
);

const setNotification = () => {
  const reportingNotification = getReportingNotification();
  return reportingNotification ? (
    <NotificationMessage
      id='notif-message-1'
      canClose
      onClose={clearReportingNotification}
      {...reportingNotification}
    />
  ) : null;
};

const setInfoNotification = () => {
  // Optionally bubble up error message to Dashboard
  const dashboardInfoNotification = getDashboardInfoNotification();
  return dashboardInfoNotification ? (
    <NotificationMessage
      id='notif-info-message-2'
      canClose
      onClose={clearDashboardInfoNotification}
      {...dashboardInfoNotification}
    />
  ) : null;
};

const MeasurementReport = () => {
  const { id } = useParams<{ id?: string }>();
  const { inProgress, accounts, instance } = useMsal();
  const [isLoading, setIsLoading] = useState(false);
  const [errored] = useState(false);
  const [reload, setReload] = useState(false);
  const [forbidden] = useState(false);
  const [showInfo] = useState(false);
  const [noThirdPartyAccess, setNoThirdPartyAccess] = useState(false);
  const [measurementReportData, setMeasurementReportData] = useState<
    RequestForQuoteDetails | undefined
  >();
  const [fileError, setFileError] = useState(false);
  const accountContext = useAccountContext();
  const reportingMessage = setNotification();
  const dashboardInfoMessage = setInfoNotification();
  const navigate = useNavigate();

  const breadcrumbs: CustomBreadcrumbItem[] = [
    { to: '/', text: 'Dashboard' },
    { to: '', text: 'Testing and calibration service - Report' },
  ];

  const targetOrganisationAbn =
    accountContext!.details?.targetOrganisation?.targetOrganisationAbn;

  useEffect(() => {
    const getReportDetails = async () => {
      const account = accounts[0];
      if (!account) return;

      try {
        AppLogger.verbose('MeasurementReport.getReportDetails', { Id: id });
        setFileError(false);
        clearReportingNotification();
        const client = new QuoteClient();
        const tokenResult = await instance.acquireTokenSilent({
          ...tokenRequest,
          account,
        });
        client.setAuthToken(tokenResult.accessToken);
        const details = await client.getQuoteRequestDetailsByRefId(
          ApplicationType.QuoteAccept,
          id,
        );
        setMeasurementReportData(details);
      } catch (e) {
        handleReportFileError();
        setFileError(true);
        setIsLoading(false);
        AppLogger.error('Failed to get Measurement report data', e as Error, {
          Id: id,
        });
        navigate('/not-found');
      }
    };
    const loadDataForDisplay = async () => {
      if (accountContext?.details?.targetOrganisation?.targetOrganisationAbn) {
        if (inProgress === InteractionStatus.None && accounts.length > 0) {
          setIsLoading(true);
          await getReportDetails();
          setIsLoading(false);
          setReload(false);
        }
      }
    };
    loadDataForDisplay();
  }, [
    accountContext,
    targetOrganisationAbn,
    accounts.length,
    inProgress,
    reload,
    accounts,
    instance,
    id,
  ]);

  useHtmlTitle(
    'Report - Testing and calibration service | NMI Services portal',
  );
  useBodyClass('report');

  if (forbidden) {
    setDashboardNotification({
      message:
        'We are unable to process your request. Your changes have not been saved. Please contact support.',
      severity: NotificationSeverity.Error,
    });
  }

  if (noThirdPartyAccess) {
    setDashboardNotification({
      message: `You no longer have access to the records 
      for ${accountContext?.details?.targetOrganisation?.targetOrganisationName}. 
      Your changes have not been saved.`,
      severity: NotificationSeverity.Error,
    });
    if (accountContext) {
      accountContext.setTargetOrganisation?.(
        accountContext?.details?.abn ?? '',
        accountContext?.details?.organisation ?? '',
      );
    }
    setNoThirdPartyAccess(false);
  }

  if (errored) {
    return <Navigate to='/server-error' />;
  }

  if (showInfo) {
    setDashboardInfoNotification({
      message:
        'New initial reporting and/or ongoing reporting forms have been generated',
      severity: NotificationSeverity.Information,
    });
  } else {
    clearDashboardInfoNotification();
  }
  const renderMeasurementReport = () => (
    <>
      <ReportDetails reportData={measurementReportData} fileError={fileError} />
      <Row className='mb-3'>
        <Col md={12}>
          <div className='d-grid w-100 gap-1 d-md-flex flex-column justify-content-md-between text-end'>
            <ViewMeasurementReport
              text='View report PDF'
              quotationData={measurementReportData}
              setFileError={setFileError}
              setIsLoading={setIsLoading}
            />
          </div>
        </Col>
      </Row>
      <NMIContactDetails
        heading='Contact your NMI test officer if you have any questions about the report outcomes.'
        quotationData={measurementReportData}
      />
    </>
  );

  return (
    <>
      {isLoading && (
        <BlockUISpinner>
          <p>Loading...</p>
        </BlockUISpinner>
      )}
      <div aria-busy={isLoading} aria-live='polite'>
        <Container fluid className='default-banner-background mb-5'>
          <Container>
            <Row>
              <Col>
                <CustomBreadcrumb breadcrumbs={breadcrumbs} />
              </Col>
            </Row>
            <Row className='gs-wrapper-sm'>
              <Col md={12} lg={9}>
                <h1 id='page-title' tabIndex={-1} className='banner-title mb-2'>
                  Report
                </h1>
                <HeaderIntroText>
                  <strong>Testing and calibration service</strong>
                </HeaderIntroText>
              </Col>
            </Row>
          </Container>
        </Container>
        {!fileError && showReportingMessage(reportingMessage)}
        {!fileError && showDashboardMessage(dashboardInfoMessage)}
        <Container>{renderMeasurementReport()}</Container>
        <Container>
          <Row className='mb-4'>
            <div className='d-grid d-md-block'>
              <Link
                data-testid='go-to-dashboard-button'
                to='/dashboard'
                replace
                className='btn btn-tertiary'
              >
                <i className='icon-back me-1' aria-hidden='true' />
                Back to dashboard
              </Link>
            </div>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default MeasurementReport;
