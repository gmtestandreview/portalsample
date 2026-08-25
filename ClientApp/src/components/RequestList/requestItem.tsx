import type React from 'react';
import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import type { NavigateFunction } from 'react-router';
import {
    Row, Col, Tab, Card,
    Button,
} from 'react-bootstrap';
import Nav from 'react-bootstrap/Nav';
import type { DashboardItemDto, DashboardQuoteDto, ReportDto, RequestForQuoteDto } from '../../api/web-api-client';
import Actions from '../Actions';
import type { DropdownActionItem } from '../Actions';
import { useModalDispatch } from '../modals/ModalContext';
import { DashboardItemStatus } from '../../routes/common/enums';
import { validQuoteIdStatus, viewArtefactHeadingStatus, viewQuotationAcceptMenu } from '../../routes/common/quoteStatus';
import StatusPill from '../Pill/StatusPill';
import ContactDetails from '../Utilities/contactDetails';
import { trackGAEvent } from '../../analytics/GoogleAnalytics';

const formattedDate = (dateToFormat : Date | string | undefined) => (dateToFormat ? new Date(dateToFormat).toLocaleDateString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
}) : '');

const DateColumn = (props: { date: Date | string | undefined }) => {
    const { date } = props;
    return <Col className='small'>{formattedDate(date)}</Col>;
};

const renderMultiLinkTooltip = (refIds: string[], isClonedFromRef: string): React.ReactNode => (
    <>
        {/* Note: Keep tooltips content formatting basic, consider the parent DOM node for tooltip - avoid UL, LI */}
        Note: This is linked to Ref ID:
        <br />
        <strong>
            {isClonedFromRef}
            <br />
        </strong>
        {refIds.map((id) => (
            <span key={id}>
                &bull;
                {` ${id}`}
                <br />
            </span>

        ))}
    </>
);

const renderRequestContent = (requestForQuote: RequestForQuoteDto, sourceReferenceId: string | undefined) => {
    const {
        serialNumber,
        manufacturer,
        model,
        description,
        measurementCategory,
        artefactType,
        requestSubmitted,
        contactDetails,
    } = requestForQuote;

    // Request tab content placeholder (1 col pairs)
    return (
        <Row>
            <Col lg={4} md={6}>
                {/*  Column 1 */}
                <Row>
                    <Col>
                        <h4 className='h6 mb-0'>Instrument/artefact</h4>
                    </Col>
                </Row>
                {!!(serialNumber) && (
                    <Row>
                        <Col className='fw-bold small'>Serial:</Col>
                        <Col className='small text-break'>{serialNumber}</Col>
                    </Row>
                )}
                <Row>
                    <Col className='fw-bold small'>Manufacturer:</Col>
                    <Col className='small text-break'>{manufacturer}</Col>
                </Row>
                <Row>
                    <Col className='fw-bold small'>Model:</Col>
                    <Col className='small text-break'>{model}</Col>
                </Row>
                {!!(description) && (
                    <Row>
                        <Col className='fw-bold small'>Description:</Col>
                        <Col className='small text-break text-truncate text-truncate-2'>{description}</Col>
                    </Row>
                )}
            </Col>
            <Col lg={4} md={6}>
                {/*  Column 2 */}
                <Row>
                    <Col>
                        <h4 className='h6 mb-0'>
                            <span className='visually-hidden'>Measurement type</span>
                            <br />
                        </h4>
                    </Col>
                </Row>
                <Row>
                    <Col className='fw-bold small'>Measurement category:</Col>
                    <Col className='small'>{measurementCategory}</Col>
                </Row>
                <Row>
                    <Col className='fw-bold small'>Instrument/artefact type:</Col>
                    <Col className='small'>{artefactType}</Col>
                </Row>
                {!!(requestSubmitted) && (
                    <Row>
                        <Col className='fw-bold small'>Request submitted:</Col>
                        <DateColumn date={requestSubmitted} />
                    </Row>
                )}
            </Col>
            <Col lg={4} md={6}>
                {/*  Column 3 */}
                {!!(sourceReferenceId) && (
                    <Row>
                        <Col xs={6} md={5} lg={5} className='fw-bold small'>
                            <span className='text-nowrap'>
                                <i
                                    className='icon-info bgCircle me-1'
                                    aria-label='Info note: This is the previous request Ref ID'
                                    title='Info note: This is the previous request Ref ID'
                                />
                                Previous
                            </span>
                            {' '}
                            <span className='text-nowrap'>Ref ID:</span>
                        </Col>
                        <Col xs={6} md={7} lg={7} className='small text-nowrap'>
                            {sourceReferenceId}
                        </Col>
                    </Row>
                )}
                <ContactDetails
                    label='Request main contact'
                    name={`${contactDetails?.firstName} ${contactDetails?.lastName}`}
                    businessPhone={contactDetails?.businessPhone}
                    mobilePhone={contactDetails?.mobilePhone}
                    email={contactDetails?.email}
                />
            </Col>
        </Row>
    );
};

const renderQuotationContent = (dashboardQuoteDto: DashboardQuoteDto, quoteStatus: string | undefined, referenceId: string | undefined, navigate: NavigateFunction) => {
    // Quotation tab content placeholder (3 col pairs)
    const nmiOfficer = dashboardQuoteDto.nmiContactDetails;
    const useQuoteId = validQuoteIdStatus.some((x) => x === quoteStatus);
    return (
        <>
            <Row className='mb-3'>
                <Col md={4}>
                    {/*  Column 1 */}
                    <Row>
                        <Col>
                            <h4 className='h6 mb-0'>Instrument/artefact delivery</h4>
                        </Col>
                    </Row>
                    <Row className='mb-2'>
                        <Col className='fw-bold small'>Date required:</Col>
                        <DateColumn date={dashboardQuoteDto.dateRequired} />
                    </Row>
                </Col>
                <Col md={4}>
                    {/*  Column 2 */}
                    <Row>
                        <Col>
                            <h4 className='h6 mb-0 visually-hidden'>Quotation</h4>
                        </Col>
                    </Row>
                    <Row>
                        <Col className='fw-bold small'>Quotation ID:</Col>
                        <Col className='small'>{dashboardQuoteDto.quotationId}</Col>
                    </Row>
                    <Row>
                        <Col className='fw-bold small'>Offer date:</Col>
                        <DateColumn date={dashboardQuoteDto.offerDate} />
                    </Row>
                    <Row className='mb-2'>
                        <Col className='fw-bold small'>Valid until:</Col>
                        <DateColumn date={dashboardQuoteDto.validUntil} />
                    </Row>
                </Col>
                <Col md={4}>
                    {/*  Column 3 */}
                    <ContactDetails
                        label='NMI test officer'
                        name={`${nmiOfficer?.firstName} ${nmiOfficer?.lastName}`}
                        businessPhone={nmiOfficer?.businessPhone}
                        mobilePhone={nmiOfficer?.mobilePhone}
                        email={nmiOfficer?.email}
                    />
                    {/* <Row>
                        <Col>
                            <h4 className='h6 mb-0 visually-hidden'>Request</h4>
                        </Col>
                    </Row>
                    <Row className='mb-2'>
                        <Col className='fw-bold small'>Request submitted:</Col>
                        <DateColumn date={dashboardQuoteDto.requestSubmitted} />
                    </Row> */}
                </Col>
            </Row>
            <Row>
                <Col md className='text-center'>
                    <Button
                        variant='secondary'
                        data-testid={useQuoteId
                            ? `RefId-${dashboardQuoteDto.quotationId}-view-quotation-button`
                            : `RefId-${referenceId}-view-quotation-button`}
                        className='ms-md-auto'
                        onClick={() => {
                            trackGAEvent('Request item/quotation tab');
                            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                            (useQuoteId
                                ? navigate(`/quotation/${dashboardQuoteDto.quotationId}`)
                                : navigate(`/quotation/${referenceId}`));
                        }}
                    >
                        View quotation
                    </Button>
                </Col>
            </Row>
        </>
    );
};

const renderReportDtoContent = (reportDto: ReportDto, requestForQuoteId: string | undefined, navigate: NavigateFunction, status: string | undefined, referenceId: string | undefined) => (
    // ReportDto tab content placeholder (3 col pairs)
    <>
        <Row>
            <Col md={4}>
                {/*  Column 1 */}
                <Row className='mb-2'>
                    <Col className='fw-bold small'>Invoice number:</Col>
                    <Col className='small'>{reportDto.invoiceNumber}</Col>
                </Row>
            </Col>
            <Col md={4} />
            <Col md={4} />
        </Row>
        <Row className='mb-3'>
            <Col md={4}>
                {/*  Column 1 */}
                <Row>
                    <Col>
                        <h4 className='h6 mb-0'>Instrument/artefact delivery</h4>
                    </Col>
                </Row>
                <Row>
                    <Col className='fw-bold small'>Date required:</Col>
                    <DateColumn date={reportDto.dateRequired} />
                </Row>
                <Row className='mb-2'>
                    <Col className='fw-bold small'>Date received:</Col>
                    <DateColumn date={reportDto.dateReceived} />
                </Row>
            </Col>
            <Col md={4}>
                {/*  Column 2 */}
                <Row>
                    <Col>
                        <h4 className='h6 mb-0'>Measurement report</h4>
                    </Col>
                </Row>
                <Row>
                    <Col className='fw-bold small'>Report ID:</Col>
                    <Col className='small'>{reportDto.reportId}</Col>
                </Row>
                <Row>
                    <Col className='fw-bold small'>Report date:</Col>
                    <DateColumn date={reportDto.dateIssued} />
                </Row>
                <Row className='mb-2'>
                    <Col className='fw-bold small'>Target report date:</Col>
                    <DateColumn date={reportDto.targetReportDate} />
                </Row>
            </Col>
            <Col md={4}>
                {/*  Column 3 */}
                <Row>
                    <Col>
                        <h4 className='h6 mb-0'>Instrument/artefact return</h4>
                    </Col>
                </Row>
                <Row>
                    <Col className='fw-bold small'>Return method:</Col>
                    <Col className='small'>{reportDto.returnMethod}</Col>
                </Row>
                <Row>
                    <Col className='fw-bold small'>Date dispatched:</Col>
                    <DateColumn date={reportDto.dateDispatched} />
                </Row>
                <Row>
                    <Col className='fw-bold small'>Carrier:</Col>
                    <Col className='small'>{reportDto.carrier}</Col>
                </Row>
                <Row className='mb-2'>
                    <Col className='fw-bold small'>Consignment note:</Col>
                    <Col className='small text-truncate'>
                        {reportDto.consignmentNote}
                    </Col>
                </Row>
            </Col>
        </Row>
        {status === DashboardItemStatus.ReportIssued
            && (
                <Row>
                    <Col />
                    <Col md className='text-center'>
                        <Button
                            variant='secondary'
                            data-testid={`RefId-${reportDto.reportId}-view-ReportDto-button`}
                            className='ms-md-auto mb-3'
                            onClick={() => {
                                trackGAEvent('Request item/report tab');
                                navigate(`/report/${requestForQuoteId}`);
                            }}
                        >
                            View report
                        </Button>
                    </Col>
                    <Col md>
                        <Link
                            data-testid='request-for-quote-copy-button'
                            to={`/request-for-quote-copy/${referenceId}`}
                            className='d-inline-block py-2 text-nowrap'
                        >
                            Request recalibration
                        </Link>
                    </Col>
                </Row>
            )}
        {status === DashboardItemStatus.ReportWithdrawn
            && (
                <Row>
                    <Col />
                    <Col md />
                    <Col md>
                        <Link
                            data-testid='request-for-quote-copy-button'
                            to={`/request-for-quote-copy/${referenceId}`}
                            className='d-inline-block py-2 text-nowrap'
                        >
                            Request recalibration
                        </Link>
                    </Col>
                </Row>
            )}

    </>
);

const RequestItem = (props: { request: DashboardItemDto }) => {
    const {
        request,
    } = props;

    const {
        referenceId, status, requestedFor, lastUpdated, quote, report, requestForQuote, sourceReferenceId,
    } = request;

    const showArtefactHeading = useMemo(() => viewArtefactHeadingStatus.some((x) => x === status), [status]);
    const headingNoArtefact = requestForQuote?.manufacturer
        ? `${requestForQuote?.manufacturer} ${requestForQuote?.model || ''}` // If Model null display empty string
        : 'Draft Request For Quote';
    const heading = showArtefactHeading ? quote?.artefactName : headingNoArtefact;
    const requestForQuoteId = request.quote?.quotationId;
    const modalDispatch = useModalDispatch();

    const onDelete = () => (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        e.preventDefault();
        onShowRFQDeleteModalClick();
    };

    const navigate = useNavigate();

    const onShowRFQDeleteModalClick = () => { modalDispatch?.setShowRFQDeleteModal(true, referenceId!); };

    const getActions = (): DropdownActionItem[] => {
        const actions: DropdownActionItem[] = [];

        // TODO: Move this to an enum? refactor this...
        switch (status) {
            case DashboardItemStatus.QuoteDrafted:
                actions.push({
                    action: 'Edit',
                    text: 'Edit request',
                    route: `/request-for-quote/${referenceId}/instrument-and-request`,
                    onClick: () => trackGAEvent('Editrequest'),
                });
                actions.push({
                    action: 'Delete',
                    text: 'Delete request',
                    onClick: () => {
                        onShowRFQDeleteModalClick();
                        trackGAEvent('Deleterequest');
                    },
                });
                break;
            case DashboardItemStatus.ReportIssued:
                actions.push({
                    action: 'View',
                    text: 'View report',
                    route: `/report/${requestForQuoteId}`,
                    onClick: () => trackGAEvent('Viewreport'),
                });
                break;
            case DashboardItemStatus.QuoteAvailable:
                actions.push({
                    action: 'View',
                    text: 'View/accept quotation',
                    route: `/quotation/${referenceId}`,
                    onClick: () => trackGAEvent('View/acceptquotation'),
                });
                break;
            default:
                break;
        }

        if (viewQuotationAcceptMenu.some((x) => status === x)) {
            actions.push({
                action: 'View',
                text: 'View quotation',
                route: `/quotation/${requestForQuoteId}`,
                onClick: () => trackGAEvent('Viewquotation'),
            });
        }

        // We want 'view request' in every case other than draft.
        if (status !== DashboardItemStatus.QuoteDrafted) {
            actions.push({
                action: 'View',
                text: 'View request',
                route: `/request-for-quote/${referenceId}/view-summary`,
                onClick: () => trackGAEvent('Viewrequest'),
            });
        }

        if (status === DashboardItemStatus.ReportIssued) {
            actions.push({
                action: 'View',
                text: 'Request recalibration',
                route: `/request-for-quote-copy/${referenceId}`,
                onClick: () => trackGAEvent('Requestrecalibration'),
            });
        }

        if (status === DashboardItemStatus.ReportWithdrawn) {
            actions.push({
                action: 'View',
                text: 'Request recalibration',
                route: `/request-for-quote-copy/${referenceId}`,
                onClick: () => trackGAEvent('Requestrecalibration'),
            });
            actions.push({
                action: 'View',
                text: 'View quotation',
                route: `/quotation/${requestForQuoteId}`,
                onClick: () => trackGAEvent('Viewquotation'),
            });
        }

        return actions;
    };

    // Card aria-labelledby
    const cardSummaryId = `card-summary-${referenceId}`;
    const cardTabContentId = `card-tab-content-${referenceId}`;

    return (
        <li>
            {requestForQuote?.hideFromDashboard !== true && (
                <Card
                    as='article'
                    id={`RefId-${referenceId}`}
                    key={`RefId-${referenceId}`}
                    className='mb-4 p-2 shadow'
                    aria-labelledby={cardSummaryId}
                >
                    <Card.Body>
                        <Row>
                            <Col lg={8}>
                                <h3 id={cardSummaryId} className='mb-1'>
                                    {heading ? `${heading} ` : 'Draft request for Quote '}
                                    {requestForQuote?.clonedReferenceIds && requestForQuote?.isClone && (
                                        <>
                                            <i
                                                className='icon-link text-primary ms-1 me-1'
                                                aria-describedby={`multiLinkTooltip-${referenceId}`}
                                            />
                                            <span role='tooltip' id={`multiLinkTooltip-${referenceId}`}>
                                                {renderMultiLinkTooltip(requestForQuote.clonedReferenceIds, requestForQuote.isClonedFromRef!)}
                                            </span>
                                        </>
                                    )}
                                </h3>
                                <p>
                                    <span className='d-block small mb-2'>
                                        Testing and calibration service
                                    </span>
                                </p>
                            </Col>
                            <Col lg={3} className='py-1'>
                                <Row>
                                    <Col className='fw-bold small text-nowrap'>Ref ID:</Col>
                                    <Col className='small text-nowrap'>
                                        {referenceId}
                                        {!!(sourceReferenceId) && (
                                            <i
                                                className='icon-info bgCircle ms-1'
                                                aria-label={`Info note: This request was copied from previous Ref ID ${sourceReferenceId}`}
                                                title={`Info note: This request was copied from previous Ref ID ${sourceReferenceId}`}
                                            />
                                        )}
                                    </Col>
                                </Row>
                                <Row>
                                    <Col className='fw-bold small'>Status:</Col>
                                    <Col className='small'>
                                        <StatusPill status={status as DashboardItemStatus} />
                                    </Col>
                                </Row>
                                <Row>
                                    <Col className='fw-bold small text-nowrap'>Last updated:</Col>
                                    <Col className='small'>
                                        {formattedDate(lastUpdated)}
                                    </Col>
                                </Row>
                                <Row>
                                    <Col className='fw-bold small'>Requested for:</Col>
                                    <Col className='small'>
                                        {requestedFor}
                                    </Col>
                                </Row>
                            </Col>
                            <Col lg={1} className='text-end'>
                                <Actions
                                    id={`actions-${referenceId}`}
                                    as='icon'
                                    variant='Blue'
                                    dropDownActions={getActions()}
                                    align='start'
                                    containerClassName='dash-item-actions align-self-center'
                                    onItemClick={onDelete()}
                                //     buttonAriaTitle={
                                //         ` menu for ${heading ? `${heading}` : 'Draft request for Quote'},
                                // Ref ID: ${referenceId}`
                                //     }
                                />
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <Tab.Container
                                    id={`tabs-${referenceId}`}
                                    defaultActiveKey={
                                     
                                        report ? 'report'
                                            : (quote ? 'quotation' : 'request')
                                    }
                                >
                                    <Nav
                                        as='ul'
                                        variant='underline'
                                        className='flex-nowrap overflow-x-auto no-scrollbars'
                                    >
                                        <Nav.Item as='li' role='presentation'>
                                            <Nav.Link
                                                eventKey='request'
                                                className='px-3'
                                                onClick={() => { trackGAEvent('Requestitem/requesttab'); }}
                                            >
                                                Request
                                            </Nav.Link>
                                        </Nav.Item>
                                        {quote
                                    && (
                                        <Nav.Item as='li' role='presentation'>
                                            <Nav.Link
                                                eventKey='quotation'
                                                className='px-3'
                                                onClick={() => { trackGAEvent('Requestitem/quotationtab'); }}
                                            >
                                                Quotation
                                            </Nav.Link>
                                        </Nav.Item>
                                    )}
                                        {report
                                    && (
                                        <Nav.Item as='li' role='presentation'>
                                            <Nav.Link
                                                eventKey='report'
                                                className='px-3'
                                                onClick={() => { trackGAEvent('Requestitem/reporttab'); }}
                                            >
                                                Report
                                            </Nav.Link>
                                        </Nav.Item>
                                    )}
                                    </Nav>
                                    <Tab.Content
                                        id={cardTabContentId}
                                    >
                                        {requestForQuote
                                    && (
                                        <Tab.Pane eventKey='request'>
                                            {renderRequestContent(requestForQuote, sourceReferenceId)}
                                        </Tab.Pane>
                                    )}
                                        {quote
                                    && (
                                        <Tab.Pane eventKey='quotation'>
                                            {renderQuotationContent(quote, status, referenceId, navigate)}
                                        </Tab.Pane>
                                    )}
                                        {report
                                    && (
                                        <Tab.Pane eventKey='report'>
                                            {renderReportDtoContent(report, requestForQuoteId, navigate, status, referenceId)}
                                        </Tab.Pane>
                                    )}
                                    </Tab.Content>
                                </Tab.Container>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}
        </li>
    );
};

export default RequestItem;
