import {
    Alert,
    Button, Col, Container, Row,
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router';
import { useMsal } from '@azure/msal-react';
import useHtmlTitle from '../../components/Utilities/useHtmlTitle';

import CustomBreadcrumb, { type CustomBreadcrumbItem } from '../../components/Breadcrumb';
import useBodyClass from '../../components/Utilities/useBodyClass';
import InTextLink from '../../components/InTextLink';
import { downloadFileFromUrl } from '../common/helperFunctions';

const PreApplication = () => {
    const { accounts, instance } = useMsal();
    const navigate = useNavigate();

    const breadcrumbs: CustomBreadcrumbItem[] = [
        { to: '/', text: 'Dashboard' },
        { to: '', text: 'Pattern/type approval application' },
    ];

    useHtmlTitle('Pattern/type approval application | NMI Services portal');
    useBodyClass('pa-pre-application');

    return (
        <>
            <div aria-live='off'>
                <Container fluid className='default-banner-background mb-5'>
                    <Container>
                        <Row>
                            <Col>
                                <CustomBreadcrumb breadcrumbs={breadcrumbs} />
                            </Col>
                        </Row>
                        <Row className='gs-wrapper'>
                            <Col md={12} lg={9}>
                                <h1 id='page-title' tabIndex={-1} className='banner-title mb-4'>Pattern/type approval</h1>
                                {/* <HeaderIntroText>
                                    <strong>
                                        New application
                                    </strong>
                                </HeaderIntroText> */}
                            </Col>
                        </Row>
                    </Container>
                </Container>
                <Container>
                    <Row className='mb-4'>
                        <Col>
                            <h2>Application for Pattern/type approval</h2>
                            <h3 className='mb-3'>What you may need</h3>
                            <p className='mb-2'>
                                Before you begin, gather documents that describe your instrument&apos;s design, operation and performance. These may include:
                            </p>
                            <ul>
                                <li>test results, certificates or reports</li>
                                <li>specifications and model details</li>
                                <li>operator or technical manuals</li>
                                <li>diagrams (circuit, board layout, mechanical views)</li>
                                <li>sealing methods and nameplate layout information</li>
                            </ul>
                            <p>You&apos;ll be able to upload these documents in later steps.</p>
                            <h3 className='mb-3'>General certification procedures</h3>
                            <ul>
                                <li>
                                    <InTextLink
                                        target='_blank'
                                        href='https://www.industry.gov.au/sites/default/files/2026-03/nmi-p-106.pdf'
                                    >
                                        Approval and certification procedures for measuring instruments (NMI P 106)
                                    </InTextLink>
                                    {/* <br />
                                    PDF 1.1MB */}
                                </li>
                                <li>
                                    <InTextLink
                                        target='_blank'
                                        href='https://www.industry.gov.au/national-measurement-institute/nmi-services/pattern-approval/pattern-approval-requirements'
                                    >
                                        Pattern approval checklist
                                    </InTextLink>
                                    {/* <br />
                                    PDF 1.1MB */}
                                </li>
                                {/* <li>
                                    <InTextLink
                                        target='_blank'
                                        href='https://www.industry.gov.au/sites/default/files/2025-06/pattern-approval-fee-guide-25-26.xlsx'
                                    >
                                        Pattern approval fee guide 2025-26
                                    </InTextLink>
                                    <br />
                                    XLSX 79KB
                                </li> */}
                            </ul>
                        </Col>
                    </Row>
                    <Row className='mb-4'>
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
                                <div className='w-100'>
                                    <p className='h3 mb-0'>
                                        <strong>New customers</strong>
                                    </p>
                                    <p>
                                        If this is your first time submitting a pattern approval application, complete the credit check form (PDF) and attach it along with any supporting documentation.
                                    </p>
                                    <div className='py-3 px-4 bg-white'>
                                        <p className='mb-0'>
                                            <InTextLink
                                                href='#'
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    downloadFileFromUrl(
                                                        'https://www.industry.gov.au/sites/default/files/2025-07/NMI-credit-application-form.pdf',
                                                        instance,
                                                        accounts,
                                                        'NMI-credit-application-form.pdf',
                                                    );
                                                }}
                                            >
                                                Download credit check application form
                                                <span className='visually-hidden'> Opens in a new tab</span>
                                            </InTextLink>
                                            <br />
                                            162KB PDF
                                        </p>
                                    </div>
                                </div>
                            </Alert>
                        </Col>
                    </Row>
                    <Row className=''>
                        <Col>
                            <div className='mt-4 d-grid w-100 gap-3 d-md-flex justify-content-md-between'>
                                <Link
                                    data-testid='go-to-dashboard-ta'
                                    to='/dashboard-ta'
                                    className='btn btn-tertiary me-md-auto order-2 order-md-0'
                                >
                                    <i className='icon-close me-1' aria-hidden='true' />
                                    Cancel
                                </Link>
                                <Button
                                    data-testid='start-application-button'
                                    variant='primary'
                                    className='ms-md-auto'
                                    onClick={() => navigate('/ta/type-approval-create')}
                                >
                                    Start application
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
};

export default PreApplication;
