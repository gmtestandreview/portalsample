import {
    Col, Row,
    Alert,
    Table,
} from 'react-bootstrap';
import { Link } from 'react-router';
import type { InstrumentArtefactDto, PagedListOfInstrumentArtefactDto } from '../../api/web-api-client';
import CustomPagination from '../../components/Pagination';
import StatusPill from '../../components/Pill/StatusPill';
import { ReportStatus } from '../common/enums';

const formattedDate = (dateToFormat : Date | string | undefined) => (dateToFormat ? new Date(dateToFormat).toLocaleDateString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
}) : '');

const ReportList = (props: { pagedListArtefactData: PagedListOfInstrumentArtefactDto, setCurrentPage: (page: number) => void }) => {
    const {
        pagedListArtefactData,
        setCurrentPage,
    } = props;

    return (
        <>
            <Row className='mb-3'>
                <Col>
                    <h2 className='h2 my-3'>
                        Measurement reports
                    </h2>
                </Col>
            </Row>
            <Row className='mb-3'>
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
                                The following reports are regarding the instrument/artefact that was received by the National Measurement Institute for examination.
                            </p>
                        </div>
                    </Alert>
                </Col>
            </Row>
            <Row className='mb-3'>
                <Col md={12}>
                    <h3 className='h5'>Measurement reports</h3>
                    <Table
                        id='instReports-table'
                        data-testid='instReports-table'
                        striped
                        className='table-sm table-hover table-striped table-responsive-stack small mb-4'
                        aria-live='off'
                    >
                        <caption id='caption-org-select-list' className='visually-hidden'>
                            Measurement reports history for this instrument/artefact
                        </caption>
                        <thead key='instReportsHeadKeyForThead'>
                            <tr className='table-active'>
                                <th scope='col' className='col-md-2 text-nowrap'>Report ID</th>
                                <th scope='col' className='col-md-2 text-nowrap'>Report date</th>
                                <th scope='col' className='col-md-4 text-nowrap'>Measurement report</th>
                                <th scope='col' className='col-md-2 text-nowrap'>Measurement category</th>
                                <th scope='col' className='col-md-2 text-nowrap'>Report status</th>
                                <th scope='col' className='col-md-2 text-nowrap'><span className='visually-hidden'>Actions</span></th>
                            </tr>
                        </thead>
                        <tbody key='instReportsTBodyKey'>
                            {pagedListArtefactData.items?.map((artefact: InstrumentArtefactDto) => (
                                <tr key={artefact.tmasTcReportName}>
                                    <td data-header='Report ID' className='col-md-2'>
                                        {artefact.tmasTcReportName}
                                    </td>
                                    <td data-header='Report date' className='col-md-2 pe-0'>{formattedDate(artefact.tmasTcReportDate) || 'N/A'}</td>
                                    <td data-header='Measurement report' className='col-md-4'>
                                        {artefact.tmasMeasurementReportCertificateRequired}
                                    </td>
                                    <td data-header='Measurement category' className='col-md-2'>
                                        {artefact.tmasMeasurementCategoryName}
                                    </td>
                                    <td data-header='ReportStatus' className='col-md-2'>
                                        <StatusPill status={artefact.tmasStatus!} />
                                    </td>
                                    <td data-header='Action' className='col-md-2'>
                                        <div>
                                            {artefact.tmasStatus !== ReportStatus.Withdrawn && (
                                                <Link
                                                    to={`/report/${artefact.tmasTcQuoteName}`}
                                                    className='d-block mb-2'

                                                >
                                                    View report
                                                </Link>
                                            )}
                                            <span className='visually-hidden'>
                                                {' or '}
                                            </span>
                                            <Link
                                                to={`/request-for-quote-copy/${artefact.tmasPortalRequestId}`}
                                                aria-label='Request recalibration for this instrument/artefact'
                                                className='d-block mb-2 text-nowrap'
                                            >
                                                Request recalibration
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <CustomPagination
                        currentPage={pagedListArtefactData.currentPage!}
                        totalPages={pagedListArtefactData.totalPages!}
                        onPageChange={(page: number) => {
                            setCurrentPage(page);
                        }}
                        containerClassName='d-flex justify-content-center'
                    />
                </Col>
            </Row>
        </>
    );
};

export default ReportList;
