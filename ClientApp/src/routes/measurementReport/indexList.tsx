import { useEffect, useState } from 'react';
import {
    Col, Row, Container,
} from 'react-bootstrap';
import { InteractionStatus } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { Link, useParams } from 'react-router';
import BlockUISpinner from '../../components/BlockUISpinner';

import useHtmlTitle from '../../components/Utilities/useHtmlTitle';
import useBodyClass from '../../components/Utilities/useBodyClass';
import { useAccountState } from '../../authentication/hooks';
import CustomBreadcrumb from '../../components/Breadcrumb';
import type { CustomBreadcrumbItem } from '../../components/Breadcrumb';
import HeaderIntroText from '../../components/HeaderIntroText';
import { DashboardClient } from '../../api/web-api-client';
import type { PagedListOfInstrumentArtefactDto } from '../../api/web-api-client';
import { tokenRequest } from '../../authentication/authConfig';
import { handleReportFileError } from '../common/helperFunctions';
import AppLogger from '../../instrumentation/AppLogger';
import ReportList from './reportList';

const InstrMeasurementReport = () => {
    const { id } = useParams<{ id?: string }>();
    const { inProgress, accounts, instance } = useMsal();
    const [isLoading, setIsLoading] = useState(false);
    const [reload, setReload] = useState(false);
    const [measurementReportData, setMeasurementReportData] = useState<PagedListOfInstrumentArtefactDto>();
    const [_fileError, setFileError] = useState(false);
    const accountContext = useAccountState();
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const breadcrumbs: CustomBreadcrumbItem[] = [
        { to: '/', text: 'Dashboard' },
        { to: '', text: 'Instrument/artefact reports' },
    ];

    const crmGuid = accountContext?.details?.organisationCRMGuid;

    useEffect(() => {
        const getReportList = async (portalId: string) => {
            try {
                AppLogger.verbose('MeasurementReport.getReportList', { Id: id });
                const client = new DashboardClient();
                const tokenResult = await instance.acquireTokenSilent({
                    ...tokenRequest,
                    account: accounts[0],
                });
                client.setAuthToken(tokenResult.accessToken);
                 
                const details = await client.getDashboardInstrumentArtefactReportsByPortalIDAndArtefactName(portalId, id, pageSize, currentPage);
                setMeasurementReportData(details);
            } catch (e) {
                handleReportFileError();
                setFileError(true);
                setIsLoading(false);
                AppLogger.error('Failed to get Measurement report data', e as Error, { Id: id });
            }
        };
        const loadDataForDisplay = async () => {
            if (accountContext?.details?.organisationCRMGuid) {
                if (inProgress === InteractionStatus.None && accounts.length > 0) {
                    setIsLoading(true);
                    await getReportList(accountContext.details?.organisationCRMGuid);
                    setIsLoading(false);
                    setReload(false);
                }
            }
        };
        loadDataForDisplay();
    }, [accountContext, crmGuid, accounts.length, inProgress, reload, accounts, instance, id, currentPage]);

    useHtmlTitle('Instrument/artefact reports - Testing and calibration service | NMI Services portal');
    useBodyClass('reports');

    const renderInstrMeasurementReport = () => (
        <>
            {measurementReportData && <ReportList pagedListArtefactData={measurementReportData} setCurrentPage={setCurrentPage} />}
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
                                <h1 id='page-title' tabIndex={-1} className='banner-title mb-2'>{id}</h1>
                                <HeaderIntroText>
                                    <strong>
                                        Testing and calibration service
                                    </strong>
                                </HeaderIntroText>
                            </Col>
                        </Row>
                    </Container>
                </Container>
                <Container>
                    {renderInstrMeasurementReport()}
                </Container>
                <Container>
                    <Row className='mb-4'>
                        <div className='mt-5 d-grid w-100 gap-3 d-md-flex justify-content-md-between'>
                            <Link
                                data-testid='go-to-dashboard-button'
                                to='/dashboard'
                                replace
                                className='btn btn-tertiary order-2 order-md-0'
                            >
                                <i className='icon-back me-1' aria-hidden='true' />
                                {' Back to dashboard'}
                            </Link>
                            {/* <Link
                                data-testid='request-for-quote-copy-button'
                                to={`/request-for-quote-copy/${undefined}`}
                                className='btn btn-secondary'
                            >
                                Request recalibration
                            </Link> */}
                        </div>
                    </Row>
                </Container>
            </div>
        </>
    );
};

export default InstrMeasurementReport;
