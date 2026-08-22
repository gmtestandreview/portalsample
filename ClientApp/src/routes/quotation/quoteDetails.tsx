import {
    Col, Row, Alert, Container,
} from 'react-bootstrap';
import { useMemo } from 'react';
import InTextLink from '../../components/InTextLink';
import type { RequestForQuoteDetails } from '../../api/web-api-client';
import { formatDateToString, formatCurrencyAmount } from '../../utils';
import {
    getDashboardNotification,
    clearDashboardNotification,
} from '../../storage/notification';
import NotificationMessage from '../../components/Alert/NotificationMessage';
import ExternalLinkIcon from '../../components/Icons/ExternalLinkIcon';
import { QuoteStatus } from '../common/enums';
import {
    getMakeModelDetails,
} from '../common/helperFunctions';
import { validPillStatuses } from '../common/quoteStatus';
import QuoteStatusPill from '../../components/Pill/QuoteStatusPill';
import MailingLabel from '../../components/Utilities/mailingLabel';
import type { MailingLabelProps } from '../../components/Utilities/mailingLabel';
import DeliveryInstructions from '../../components/Utilities/deliveryInstructions';
import { openInternalRouteInNewTab } from '../common/openWindow';

const QuoteDetails = (props: {
    quotationData: RequestForQuoteDetails | undefined,
    isSummary: boolean | undefined,
    firstName: string | undefined,
    lastName: string | undefined,
    fileError: boolean | undefined }) => {
    const {
        quotationData, isSummary, fileError,
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
        if (quotationData?.quoteRequestIdNum) {
            openInternalRouteInNewTab(`/request-for-quote/${encodeURIComponent(quotationData.quoteRequestIdNum)}/view-summary`);
        }
    };

    const showStatusPill = useMemo(
        () => quotationData?.quoteRequestStatus && validPillStatuses.includes(quotationData.quoteRequestStatus as QuoteStatus),
        [quotationData?.quoteRequestStatus],
    );

    const dashboardMessage = setNotification();
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

    const mailingLabelProps: MailingLabelProps = {
        quotationIdNum: quotationData?.quotationIdNum,
        nmiTestOfficerName: quotationData?.nmiTestOfficerName,
        nmiFacilityName: quotationData?.nmiFacilityName,
        nmiFacilityAddress: quotationData?.nmiFacilityAddress,
        showPrintOrCopy: false,
    };

    const renderNoDeliveryInfoMsg = () => (
        <p className='mb-0'>
            This quotation does not require the delivery or return of the
            instrument/artefact to the NMI.
            <br />
            Contact your NMI test officer for further details.
        </p>
    );

    const renderNoDeliveryInfoPanel = () => (
        <Alert
            variant={`${isSummary ? 'basic' : 'info'}`}
            role='status'
            aria-live='off'
            className='d-flex mb-4'
        >
            <div className='d-flex justify-content-center justify-content-md-start mb-3 mb-md-0'>
                <div className='-bgCircle mb-3 me-3'>
                    <i className='icon-warning text-primary' aria-hidden='true' />
                </div>
            </div>
            <div>
                <p className='mb-0 visually-hidden'>
                    <strong>Important information</strong>
                </p>
                {renderNoDeliveryInfoMsg()}
            </div>
        </Alert>
    );

    return (
        <>
            {!isSummary && (
                <>
                    <Row className='mb-3'>
                        <Col>
                            <h2>
                                Quotation summary
                            </h2>
                        </Col>
                    </Row>
                    <Row className='mb-3'>
                        {fileError && showDashboardMessage(dashboardMessage)}
                        {(quotationData?.quoteRequestStatus === QuoteStatus.QuoteAvailable)
                            && (
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
                                                The following information is based on the information you have
                                                provided to us. Please view the detailed quote and contact your
                                                NMI test officer if any of the details are not correct before
                                                proceeding.
                                            </p>
                                        </div>
                                    </Alert>
                                </Col>
                            )}
                    </Row>
                </>
            )}
            <Row className='mb-3'>
                <Col xs={6}>
                    {/* Render field label + values
                        Use SummaryDisplay components instead (TBC)
                        */}
                    <div className='-mb-4'>
                        <div className='form-label mb-0'>Quotation ID</div>
                        <p className='mb-0 text-break'>
                            {/* TO DO - insert correct Quotation ID */}
                            {!!quotationData?.quotationIdNum && `${quotationData?.quotationIdNum}`}
                        </p>
                    </div>
                </Col>
                <Col xs={6} className='text-end'>
                    <div className='-mb-4'>
                        {showStatusPill && (
                            <>
                                <Col className='small'>
                                    {/* <Badge
                                        pill
                                        bg={getPillColour(quotationData!.quoteRequestStatus)}
                                        text={getPillTextColour(quotationData!.quoteRequestStatus)}
                                    >
                                        {getPillText(quotationData!.quoteRequestStatus)}
                                    </Badge> */}
                                    <QuoteStatusPill status={quotationData!.quoteRequestStatus as QuoteStatus} />
                                </Col>
                                <p className='mb-0 text-break'>
                                    {!!quotationData?.outcomeDate && `${formatDateToString(new Date(quotationData?.outcomeDate))}`}
                                </p>
                            </>
                        )}
                    </div>
                </Col>
            </Row>
            <Row className='mb-3'>
                <Col xs={6}>
                    {/* Render field label + values
                        Use SummaryDisplay components instead (TBC)
                        */}
                    <div className='-mb-4'>
                        <div className='form-label mb-0'>Quotation offer date</div>
                        <p className='mb-0 text-break'>
                            {!!quotationData?.quotationOfferDate && `${formatDateToString(new Date(quotationData?.quotationOfferDate))}`}
                        </p>
                    </div>
                </Col>
                <Col xs={6} className='text-end'>
                    <div className='-mb-4'>
                        <div className='form-label mb-0'>Quotation valid until</div>
                        <p className='mb-0 text-break'>
                            {!!quotationData?.quotationValidUntil && `${formatDateToString(new Date(quotationData?.quotationValidUntil))}`}
                        </p>
                    </div>
                </Col>
            </Row>
            <Row className='mb-3'>
                <Col lg={6}>
                    <div className='-mb-4'>
                        <div className='form-label mb-0'>
                            Date instrument/artefact required at NMI
                        </div>
                        <p className='mb-0 text-break'>
                            {!!quotationData?.dateInstrumentRequiredNMI && `${formatDateToString(new Date(quotationData?.dateInstrumentRequiredNMI))}`}
                        </p>
                    </div>
                </Col>
                <Col lg={6} className='mt-3 mt-lg-0 text-lg-end'>
                    <div className='-mb-4'>
                        <div className='form-label mb-0'>
                            Target date for Measurement Report
                        </div>
                        <p className='mb-0 text-break'>
                            {!!quotationData?.targetDateMesurementReport && `${formatDateToString(new Date(quotationData?.targetDateMesurementReport))}`}
                        </p>
                    </div>
                </Col>
            </Row>
            <Row className='mb-3'>
                <Col md={12}>
                    <h3 className='h5 mb-0'>Requested instrument/artefact details</h3>
                    <p>These are the details you provided us when requesting the calibration</p>
                    <Row className='mb-3'>
                        <Col xs={4} md={2}>
                            <div className='text-nowrap mb-0'>Serial number:</div>
                        </Col>
                        <Col xs={8} md={10}>
                            <p className='mb-0 text-break'>
                                {!!quotationData?.serialNumber && `${quotationData?.serialNumber}`}
                            </p>
                        </Col>
                        <Col xs={4} md={2}>
                            <div className='mb-0'>Manufacturer:</div>
                        </Col>
                        <Col xs={8} md={10}>
                            <p className='mb-0 text-break'>
                                {!!quotationData?.manufacturer && `${quotationData?.manufacturer}`}
                            </p>
                        </Col>
                        <Col xs={4} md={2}>
                            <div className='mb-0'>Model:</div>
                        </Col>
                        <Col xs={8} md={10}>
                            <p className='mb-0 text-break'>
                                {!!quotationData?.model && `${quotationData?.model}`}
                            </p>
                        </Col>
                        <Col xs={4} md={2}>
                            <div className='mb-0'>Description:</div>
                        </Col>
                        <Col xs={8} md={10}>
                            <p className='text-break'>
                                {!!quotationData?.description && `${quotationData?.description}`}
                            </p>
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
            </Row>
            <Row className='mb-3'>
                <Col md={12}>
                    <h3 className='h5 mb-0'>Quoted instrument/artefact details</h3>
                    <p>
                        The specific details of the instrument/artefact to be calibrated may have been updated by NMI in preparing this quotation.
                        Please ensure these details are accurate, if any discrepancies are found, the NMI test officer listed below can be contacted
                        for assistance.
                    </p>
                    <Row>
                        <Col xs={12} md={5} lg={4} xl={3}>
                            <div className='mb-0'>
                                Instrument/artefact to be calibrated:
                            </div>
                        </Col>
                        <Col xs={12} md={7} lg={8} xl={9}>
                            <p className='mb-0 text-break'>
                                {quotationData !== undefined && `${getMakeModelDetails(quotationData)}`}
                            </p>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={12} md={5} lg={4} xl={3}>
                            <div className='text-nowrap mb-0'>Services offered:</div>
                        </Col>
                        <Col xs={12} md={7} lg={8} xl={9}>
                            <p className='mb-0 text-break'>
                                {!!quotationData?.servicesOffered && `${quotationData?.servicesOffered}`}
                            </p>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={12} md={5} lg={4} xl={3}>
                            <div className='mb-0'>Measurement report offered:</div>
                        </Col>
                        <Col xs={12} md={7} lg={8} xl={9}>
                            <p className='mb-0 text-break'>
                                {!!quotationData?.measurementReportCertificateRequired && `${quotationData?.measurementReportCertificateRequired}`}
                            </p>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={12} md={5} lg={4} xl={3}>
                            <div className='text-nowrap mb-0'>Special conditions:</div>
                        </Col>
                        <Col xs={12} md={7} lg={8} xl={9}>
                            <p className='mb-0 text-break'>
                                {!!quotationData?.specialConditions && `${quotationData?.specialConditions}`}
                            </p>
                        </Col>
                    </Row>
                </Col>
            </Row>
            {quotationData && (
                <>
                    {quotationData?.receiptandDispatchNA ? (
                        <Row>
                            <Col md={12}>
                                <h3 className='h5 mb-0 py-2'>Instrument/artefact delivery or return</h3>
                                {renderNoDeliveryInfoPanel()}
                            </Col>
                        </Row>
                    ) : (
                        <Row>
                            <h3 className='h5 mb-0 py-2'>
                                On quotation acceptance, please deliver the instrument/artefact to NMI with the following label attached
                            </h3>
                            <MailingLabel {...mailingLabelProps} />
                            <DeliveryInstructions deliveryInstructions={quotationData?.nmiFacilityDeliveryInstructions} />
                        </Row>
                    )}
                </>
            )}
            {!!quotationData?.quoteRequestStatus
                && (quotationData.quoteRequestStatus !== QuoteStatus.QuoteExpired)
                && (
                    <Row className='mb-3'>
                        <Col md={12}>
                            {/* Render field label + values
                    Use SummaryDisplay components instead (TBC)
                    */}
                            <div className='-mb-4'>
                                <h3 className='h5 mb-0'>
                                    Fee payable to National Measurement Institute (NMI)
                                </h3>
                                <p className='mb-0 text-break'>
                                    {'AUD '}
                                    {!!quotationData?.feePayableAmount && `${formatCurrencyAmount(quotationData?.feePayableAmount)}`}
                                    {' (inc. GST)'}
                                </p>
                            </div>
                        </Col>
                        <Col md={6} />
                    </Row>
                )}
        </>
    );
};

export default QuoteDetails;
