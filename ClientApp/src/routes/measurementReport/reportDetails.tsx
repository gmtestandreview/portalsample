import {
    Col, Row, Container,
    Alert,
} from 'react-bootstrap';
import InTextLink from '../../components/InTextLink';
import type { RequestForQuoteDetails } from '../../api/web-api-client';
import {
    getDashboardNotification,
    clearDashboardNotification,
} from '../../storage/notification';
import NotificationMessage from '../../components/Alert/NotificationMessage';
import ExternalLinkIcon from '../../components/Icons/ExternalLinkIcon';
import { formatDateToString } from '../../utils';
import { openInternalRouteInNewTab } from '../common/openWindow';

const ReportDetails = (props: { reportData: RequestForQuoteDetails | undefined, fileError: boolean | undefined }) => {
    const {
        reportData, fileError,
    } = props;
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

    const showQuoteRequest = () => {
        if (reportData?.quoteRequestIdNum) {
            openInternalRouteInNewTab(`/request-for-quote/${encodeURIComponent(reportData.quoteRequestIdNum)}/view-summary`);
        }
    };
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

    const dashMessage = () => {
        const dashboardMessage = setNotification();
        return showDashboardMessage(dashboardMessage);
    };

    return (
        <>
            <>
                <Row className='mb-3'>
                    <Col>
                        <h2 className='h2 my-3'>
                            Measurement report
                        </h2>
                    </Col>
                </Row>
                <Row className='mb-3'>
                    {fileError && dashMessage()}
                    <Col>
                        <Alert
                            variant='info'
                            data-testid='info-summary'
                            role='status'
                            aria-live='polite'
                            className='d-flex mb-4'
                        >
                            <div className='d-flex justify-content-center justify-content-md-start mb-3 mb-md-0'>
                                <div className='bgCircle mb-3 me-3'>
                                    <i className='icon-info' aria-hidden='true' />
                                </div>
                            </div>
                            <div>
                                <strong>Important information</strong>
                                <p>
                                    The following report is regarding the instrument/artefact that was received by the National Measurement Institute for examination.
                                </p>
                            </div>
                        </Alert>
                    </Col>
                </Row>
            </>
            <Row className='mb-3'>
                <Col md={6}>
                    <div className='form-label mb-0'>Report ID</div>
                    <p className='mb-0 text-break'>
                        {!!reportData?.report?.reportId && `${reportData?.report.reportId}`}
                    </p>
                </Col>
            </Row>
            <Row className='mb-3'>
                <Col xs={6}>
                    <div className='form-label mb-0'>Report date</div>
                    <p className='mb-0 text-break'>
                        {!!reportData?.report?.dateIssued && `${formatDateToString(new Date(reportData?.report?.dateIssued))}`}
                    </p>
                </Col>
                <Col xs={6} className='text-end'>
                    {!!reportData?.report?.invoiceNumber && (
                        <>
                            <div className='form-label mb-0'>Invoice number</div>
                            <p className='mb-0 text-break'>
                                {reportData?.report.invoiceNumber}
                            </p>
                        </>
                    )}
                </Col>
            </Row>
            <Row className='mb-3'>
                <Col md={12} lg={6}>
                    <h3 className='h5 mb-0'>Requested instrument/artefact details</h3>
                    <p>These are the details you provided us when requesting the calibration</p>
                    <Row className='mb-3'>
                        <Col xs={4} lg={3}>
                            <div className='text-nowrap mb-0'>Serial:</div>
                        </Col>
                        <Col xs={8} lg={9}>
                            <p className='mb-0 text-break'>
                                {!!reportData?.serialNumber && `${reportData?.serialNumber}`}
                            </p>
                        </Col>
                        <Col xs={4} lg={3}>
                            <div className='mb-0'>Manufacturer:</div>
                        </Col>
                        <Col xs={8} lg={9}>
                            <p className='mb-0 text-break'>
                                {!!reportData?.manufacturer && `${reportData?.manufacturer}`}
                            </p>
                        </Col>
                        <Col xs={4} lg={3}>
                            <div className='mb-0'>Model:</div>
                        </Col>
                        <Col xs={8} lg={9}>
                            <p className='mb-0 text-break'>
                                {!!reportData?.model && `${reportData?.model}`}
                            </p>
                        </Col>
                        <Col xs={4} lg={3} />
                        <Col xs={8} lg={9}>
                            <p className='mb-0'>
                                <InTextLink onClick={(_e) => showQuoteRequest()}>
                                    View request
                                    <ExternalLinkIcon className='ms-2' />
                                    <span className='visually-hidden'> Opens in a new tab</span>
                                </InTextLink>
                            </p>
                        </Col>
                    </Row>
                </Col>
                <Col md={12} lg={6} />
            </Row>
            <Row className='mb-3'>
                <Col md={12}>
                    <h3 className='h5 mb-0'>Report instrument/artefact details</h3>
                    <p>
                        The instrument/artefact for this report may have been updated by NMI for the calibration service provided.
                        Please ensure these details are accurate, if any discrepancies are found, the NMI test officer listed below
                        can be contacted for assistance.
                    </p>
                    <Row>
                        <Col xs={12} md={5} lg={4} xl={3}>
                            <div className='mb-0'>
                                Instrument/artefact examined:
                            </div>
                        </Col>
                        <Col xs={12} md={7} lg={8} xl={9}>
                            <p className='mb-0 text-break'>
                                {!!reportData?.instrumentArtefactToBeCalibrated && `${reportData?.instrumentArtefactToBeCalibrated}`}
                            </p>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={12} md={5} lg={4} xl={3}>
                            <div className='text-nowrap mb-0'>Services offered:</div>
                        </Col>
                        <Col xs={12} md={7} lg={8} xl={9}>
                            <p className='mb-0 text-break'>
                                {!!reportData?.servicesOffered && `${reportData?.servicesOffered}`}
                            </p>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={12} md={5} lg={4} xl={3}>
                            <div className='text-nowrap mb-0'>Measurement report offered:</div>
                        </Col>
                        <Col xs={12} md={7} lg={8} xl={9}>
                            <p className='mb-0 text-break'>
                                {!!reportData?.measurementReportCertificateRequired && `${reportData?.measurementReportCertificateRequired}`}
                            </p>
                        </Col>
                    </Row>
                    <Row className='mb-3'>
                        <Col xs={12} md={5} lg={4} xl={3}>
                            <div className='text-nowrap mb-0'>Special conditions:</div>
                        </Col>
                        <Col xs={12} md={7} lg={8} xl={9}>
                            <p className='mb-0 text-break'>
                                {!!reportData?.specialConditions && `${reportData?.specialConditions}`}
                            </p>
                        </Col>
                    </Row>
                </Col>
            </Row>
            <Row className='mb-3'>
                <Col md={12}>
                    <h3 className='h5 mb-0'>Instrument/artefact return</h3>
                </Col>
                <Col md={12} lg={6}>
                    <Row className='mb-3'>
                        <Col xs={5} lg={4}>
                            <div className='text-nowrap mb-0'>Date dispatched:</div>
                        </Col>
                        <Col xs={7} lg={8}>
                            <p className='mb-0 text-break'>
                                {!!reportData?.report?.dateDispatched && `${formatDateToString(new Date(reportData?.report?.dateDispatched))}`}
                            </p>
                        </Col>
                    </Row>
                    <Row className='mb-3'>
                        <Col xs={5} lg={4}>
                            <div className='text-nowrap mb-0'>Return contact:</div>
                        </Col>
                        <Col xs={7} lg={8}>
                            <p className='mb-0 text-break'>
                                {!!reportData?.returnContactName && `${reportData?.returnContactName}`}
                            </p>
                            {!!reportData?.returnContactEmail && (
                                <p className='mb-0 text-break'>
                                    <a href={`mailto:${reportData?.returnContactEmail}`}>
                                        {reportData?.returnContactEmail}
                                    </a>
                                </p>
                            )}
                        </Col>
                    </Row>
                    <Row className='mb-3'>
                        <Col xs={5} lg={4}>
                            <div className='text-nowrap mb-0'>Return organisation:</div>
                        </Col>
                        <Col xs={7} lg={8}>
                            <p className='mb-0 text-break'>
                                {!!reportData?.returnOrganisationName && `${reportData?.returnOrganisationName}`}
                            </p>
                        </Col>
                    </Row>
                    <Row className='mb-3'>
                        {(!!reportData?.returnAddressLine1 || !!reportData?.returnAddressLine2 || !!reportData?.returnAddressLine3) && (
                            <>
                                <Col xs={5} lg={4}>
                                    <div className='text-nowrap mb-0'>Return address:</div>
                                </Col>
                                <Col xs={7} lg={8}>
                                    <p className='mb-0 text-break'>
                                        {!!reportData?.returnAddressLine1 && (
                                            <>
                                                {reportData?.returnAddressLine1}
                                                <br />
                                            </>
                                        )}
                                        {!!reportData?.returnAddressLine2 && (
                                            <>
                                                {reportData?.returnAddressLine2}
                                                <br />
                                            </>
                                        )}
                                        {!!reportData?.returnAddressLine3 && (
                                            <>
                                                {reportData?.returnAddressLine3}
                                                <br />
                                            </>
                                        )}
                                        {!!reportData?.returnAddressSuburb && (`${reportData?.returnAddressSuburb} `)}
                                        {!!reportData?.returnAddressState && (`${reportData?.returnAddressState} `)}
                                        {!!reportData?.returnAddressPostcode && (`${reportData?.returnAddressPostcode}`)}
                                    </p>
                                </Col>
                            </>
                        )}
                        <Col xs={5} lg={4}>
                            <div className='text-nowrap mb-0'>Return method:</div>
                        </Col>
                        <Col xs={7} lg={8}>
                            <p className='mb-0 text-break'>
                                {!!reportData?.returnMethod && `${reportData?.returnMethod}`}
                            </p>
                        </Col>
                    </Row>
                </Col>
                <Col md={12} lg={6}>
                    {(!!reportData?.carrierName || !!reportData?.carrierShipRef) && (
                        <Row className='mb-3'>
                            <Col xs={4} lg={3}>
                                <div className='text-nowrap mb-0'>Carrier:</div>
                            </Col>
                            <Col xs={8} lg={9}>
                                <p className='mb-0 text-break'>
                                    {!!reportData?.carrierName && `${reportData?.carrierName}`}
                                </p>
                            </Col>
                            <Col xs={12} md={12}>
                                <div className='mb-0'>Carrier account number / pre-paid shipment reference:</div>
                            </Col>
                            <Col xs={4} lg={3} />
                            <Col xs={8} lg={9}>
                                <p className='mb-0 text-break'>
                                    {!!reportData?.carrierShipRef && `${reportData?.carrierShipRef}`}
                                </p>
                            </Col>
                            <Col xs={4} lg={3}>
                                <div className='text-nowrap mb-0'>Carrier contact:</div>
                            </Col>
                            <Col xs={8} lg={9}>
                                <p className='mb-0 text-break'>
                                    {!!reportData?.carrierContactName && `${reportData?.carrierContactName}`}
                                </p>
                                {!!reportData?.carrierContactPhone && (
                                    <p className='mb-0 text-break'>
                                        <a href={`tel:${reportData?.carrierContactPhone}`}>
                                            {reportData?.carrierContactPhone}
                                        </a>
                                    </p>
                                )}
                            </Col>
                            {!!reportData?.report?.consignmentNote && (
                                <>
                                    <Col xs={4} lg={3}>
                                        <div className='mb-0'>Consignment note:</div>
                                    </Col>
                                    <Col xs={8} lg={9}>
                                        <p className='mb-0 text-break'>
                                            {reportData?.report.consignmentNote}
                                        </p>
                                    </Col>
                                </>
                            )}
                        </Row>
                    )}
                </Col>
            </Row>
        </>
    );
};

export default ReportDetails;
