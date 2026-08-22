import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import type { NavigateFunction } from 'react-router';
import {
    Row, Col, Tab, Card,
    Button,
    Table,
} from 'react-bootstrap';
import Nav from 'react-bootstrap/Nav';
import type { InstrumentArtefactDto, DashboardItemDto, RequestForQuoteDto } from '../../api/web-api-client';
import Actions from '../Actions';
import type { DropdownActionItem } from '../Actions';
import { useModalDispatch } from '../modals/ModalContext';
import { DashboardItemStatus, ReportStatus } from '../../routes/common/enums';
import { viewArtefactHeadingStatus } from '../../routes/common/quoteStatus';
import ContactDetails from '../Utilities/contactDetails';
import { trackGAEvent } from '../../analytics/GoogleAnalytics';

// TS Move this to a common location
const formattedDate = (dateToFormat : Date | string | undefined) => (dateToFormat ? new Date(dateToFormat).toLocaleDateString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
}) : '');

const DateColumn = (props: { date: Date | string | undefined }) => {
    const { date } = props;
    return <Col className='small'>{formattedDate(date)}</Col>;
};

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
                        <Col className='small'>{serialNumber}</Col>
                    </Row>
                )}
                <Row>
                    <Col className='fw-bold small'>Manufacturer:</Col>
                    <Col className='small'>{manufacturer}</Col>
                </Row>
                <Row>
                    <Col className='fw-bold small'>Model:</Col>
                    <Col className='small'>{model}</Col>
                </Row>
                {!!(description) && (
                    <Row>
                        <Col className='fw-bold small'>Description:</Col>
                        <Col className='small'>{description}</Col>
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
                                {' Previous'}
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

const renderInstrumentReportsContent = (
    requestForQuoteId: string | undefined,
    artefact: InstrumentArtefactDto,
    navigate: NavigateFunction,
    referenceId: string | undefined,
) => (
    <>
        <Table
            id='instReports-table'
            data-testid='instReports-table'
            striped
            className='table-sm table-striped table-responsive-stack small mb-4'
            aria-live='off'
        >
            <caption id='caption-org-select-list' className='visually-hidden'>
                Measurement reports history for this instrument/artefact
            </caption>
            <thead key='instReportsHeadKeyForThead' className='visually-hidden'>
                <tr className='table-active'>
                    <th scope='col' className='col-md-2 text-nowrap'>Report date</th>
                    <th scope='col' className='col-md-2 text-nowrap'>Report ID</th>
                    <th scope='col' className='col-md-4 text-nowrap'>Measurement report</th>
                    <th scope='col' className='col-md-2 text-nowrap'>Measurement category</th>
                    {/* <th scope='col' className='col-md-2 text-nowrap'>Report Status</th> */}
                    <th scope='col' className='col-md-2 text-nowrap'><span className='visually-hidden'>Actions</span></th>
                </tr>
            </thead>
            <tbody key='instReportsTBodyKey'>
                <tr className='border-top-0'>
                    <td data-header='Report date' className='col-md-2 pe-0'>{formattedDate(artefact.tmasTcReportDate) || 'N/A'}</td>
                    <td data-header='Report ID' className='col-md-2'>
                        {artefact.tmasTcReportName}
                    </td>
                    <td data-header='Measurement report' className='col-md-4'>
                        {artefact.tmasMeasurementReportCertificateRequired}
                    </td>
                    <td data-header='Measurement category' className='col-md-2'>
                        {artefact.tmasMeasurementCategoryName}
                    </td>
                    {/* <td data-header='Report Status' className='col-md-2'>
                        <StatusPill status={artefact.tmasStatus!} />
                    </td> */}
                    <td data-header='Action' className='col-md-2'>
                        <div>
                            {artefact.tmasStatus !== ReportStatus.Withdrawn && (
                                <Link
                                    to={`/report/${requestForQuoteId}`}
                                    aria-label='View latest report'
                                    className='d-block mb-2'
                                >
                                    View report
                                </Link>
                            )}
                            <span className='visually-hidden'>
                                {' or '}
                            </span>

                            <Link
                                to={`/instrument-reports/${encodeURIComponent(artefact.tmasArtefactName!)}`}
                                aria-label='View all reports for this instrument/artefact'
                                className='d-block mb-2'
                            >
                                View all reports
                            </Link>
                        </div>
                    </td>
                </tr>
            </tbody>
        </Table>
        <Row>
            <Col />
            <Col md className='text-center'>
                {artefact.tmasStatus !== ReportStatus.Withdrawn && (
                    <Button
                        variant='secondary'
                        data-testid={`RefId-${artefact.tmasTcReportName}-view-latest-ReportDto-button`}
                        className='ms-md-auto mb-3'
                        onClick={() => navigate(`/report/${requestForQuoteId}`)}
                    >
                        View latest report
                    </Button>
                )}

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
    </>
);

const InstrumentItem = (props: { request: DashboardItemDto }) => {
    const {
        request,
    } = props;

    const {
        referenceId, status, requestedFor, requestForQuote, sourceReferenceId, artefact,
    } = request;

    const showArtefactHeading = useMemo(() => status !== undefined && (viewArtefactHeadingStatus as string[]).includes(status), [status]);
    const headingNoArtefact = requestForQuote?.manufacturer
        ? `${requestForQuote?.manufacturer} ${requestForQuote?.model || ''}` // If Model null display empty string
        : 'Draft Request For Quote';
    const heading = showArtefactHeading ? artefact?.tmasArtefactName : headingNoArtefact;
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

        switch (status) {
            case DashboardItemStatus.QuoteDrafted:
                actions.push(
                    {
                        action: 'Edit',
                        text: 'Edit request',
                        route: `/request-for-quote/${referenceId}`,
                        onClick: () => trackGAEvent('Edit request'),
                    },
                    {
                        action: 'Delete',
                        text: 'Delete request',
                        onClick: () => {
                            onShowRFQDeleteModalClick();
                            trackGAEvent('Delete request');
                        },
                    },
                );
                break;
            case DashboardItemStatus.ReportIssued:
                actions.push(
                    {
                        action: 'View',
                        text: 'View latest report',
                        route: `/report/${requestForQuoteId}`,
                        onClick: () => trackGAEvent('View latest report'),
                    },
                    {
                        action: 'View',
                        text: 'Request recalibration',
                        route: `/request-for-quote-copy/${referenceId}`,
                        onClick: () => trackGAEvent('Request recalibration'),
                    },
                );
                break;
            case DashboardItemStatus.ReportWithdrawn:
            case DashboardItemStatus.ReportInProgress:
                actions.push({
                    action: 'View',
                    text: 'Request recalibration',
                    route: `/request-for-quote-copy/${referenceId}`,
                    onClick: () => trackGAEvent('Request recalibration'),
                });
                break;
            case DashboardItemStatus.QuoteAvailable:
                actions.push({
                    action: 'View',
                    text: 'View/accept quotation',
                    route: `/quotation/${referenceId}`,
                    onClick: () => trackGAEvent('View/accept quotation'),
                });
                break;
            default:
                break;
        }

        return actions;
    };

    // Card aria-labelledby
    const cardSummaryId = `card-instr-summary-${referenceId}`;
    const cardTabContentId = `card-instr-tab-content-${referenceId}`;

    return (
        <li>
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
                                {heading ? `${heading}` : 'Draft request for Quote'}
                            </h3>
                            <p>
                                <span className='d-block small mb-2'>
                                    Testing and calibration service
                                </span>
                            </p>
                        </Col>
                        <Col lg={3} className='py-1'>
                            <Row>
                                <Col className='fw-bold small text-nowrap'>Most recent</Col>
                                <Col className='small text-nowrap' />
                            </Row>
                            <Row>
                                <Col className='fw-bold small text-nowrap'>Report ID:</Col>
                                <Col className='small text-nowrap'>
                                    {artefact?.tmasTcReportName}
                                </Col>
                            </Row>
                            <Row>
                                <Col className='fw-bold small'>Report date:</Col>
                                <Col className='small'>
                                    {formattedDate(artefact?.tmasTcReportDate)}
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
                            />
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <Tab.Container
                                id={`tabs-${referenceId}`}
                                defaultActiveKey='reports'
                            >
                                <Nav
                                    as='ul'
                                    variant='underline'
                                    className='flex-nowrap overflow-x-auto no-scrollbars'
                                >
                                    <Nav.Item as='li' role='presentation'>
                                        <Nav.Link eventKey='details' className='px-3'>Details</Nav.Link>
                                    </Nav.Item>

                                    <Nav.Item as='li' role='presentation'>
                                        <Nav.Link eventKey='reports' className='px-3'>Reports</Nav.Link>
                                    </Nav.Item>

                                </Nav>
                                <Tab.Content
                                    id={cardTabContentId}
                                >
                                    <Tab.Pane eventKey='details'>
                                        {requestForQuote && renderRequestContent(requestForQuote, sourceReferenceId)}
                                    </Tab.Pane>
                                    <Tab.Pane eventKey='reports'>
                                        {artefact && renderInstrumentReportsContent(requestForQuoteId, artefact, navigate, referenceId)}
                                    </Tab.Pane>
                                </Tab.Content>
                            </Tab.Container>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </li>
    );
};

export default InstrumentItem;
