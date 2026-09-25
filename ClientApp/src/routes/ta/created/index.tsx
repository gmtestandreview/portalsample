import {
    Col, Row, Container,
    Alert,
    Button,
} from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router';
import { Link } from 'react-router';
import useHtmlTitle from '../../../components/Utilities/useHtmlTitle';
import useBodyClass from '../../../components/Utilities/useBodyClass';
import useAccountContext from '../../../authentication/hooks';
import FormBanner from '../../../components/forms/FormBanner';
import type { AccountDetails } from '../../../authentication/accountContext';
import { formatBannerTitle } from '../../common/helperFunctions';
import SessionStorageCache from '../../../storage/sessionStorageCache';
import { DashboardTab } from '../../../components/SearchFilter/types';

const RequestForPatternApprovalCreated = () => {
    const account = useAccountContext();
    const { id } = useParams();
    const navigate = useNavigate();

    useHtmlTitle('Application for Pattern/type approval created successfully | NMI Services portal');
    useBodyClass('application-created');

    const accountDetails : AccountDetails = account!.details!;
    function goToDashboard() {
        SessionStorageCache().setItem(DashboardTab.Requests, 'set-tabop-after-save');
        navigate('/dashboard-ta');
    }
    return (
        <>
            <FormBanner
                title='Pattern/type approval - Application'
                showSaveAndExitButton={false}
                refTitle={`Ref ID: ${id}`}
                subTitle={formatBannerTitle(accountDetails)}
                showGoToDashboardButton
            />
            <Container fluid id='main' role='main' className='px-0' tabIndex={-1}>
                <Container className='py-5'>
                    <Row className='mb-5'>
                        <Col sm={12} md={10} lg={8} className='mx-auto'>
                            <h1 id='page-title' tabIndex={-1}>
                                Your application has been submitted
                            </h1>
                            <Alert
                                variant='success'
                                data-testid='application-submit-success'
                                role='status'
                                aria-live='polite'
                                className='d-flex mb-4'
                            >
                                <div className='d-flex justify-content-center justify-content-md-start mb-3 mb-md-0'>
                                    <div className='bgCircle mb-3 me-3'>
                                        <i className='icon-tick' aria-hidden='true' />
                                    </div>
                                </div>
                                <div>
                                    <h2 className='h4 mb-1'>
                                        Application submitted
                                    </h2>
                                    <p>
                                        {'Your application reference number is: '}
                                        <strong>{`${id}`}</strong>
                                    </p>
                                    <p>
                                        This is a temporary number used to track your application while it&apos;s being reviewed.
                                        <br />
                                        Once the application has been processed, your application will be given a permanent reference number.
                                    </p>
                                    <div className='d-grid d-md-block mb-2'>
                                        <Button
                                            data-testid='go-to-dashboard-button'
                                            onClick={() => goToDashboard()}
                                            className='btn btn-secondary'
                                        >
                                            Go to dashboard
                                        </Button>
                                    </div>
                                </div>
                            </Alert>
                            <p>
                                We&apos;ve received your application for pattern approval.
                            </p>
                            <p>
                                A confirmation email has been sent to you, including a copy of your submitted information.
                            </p>
                            <p>
                                {'You can track the progress of your application from your Pattern Approval '}
                                <Link
                                    onClick={() => {
                                        SessionStorageCache().setItem(DashboardTab.Requests, 'set-tabop-after-save');
                                    }}
                                    to='/dashboard-ta'
                                >
                                    dashboard
                                </Link>
                                .
                            </p>
                        </Col>
                    </Row>
                </Container>
            </Container>
        </>
    );
};

export default RequestForPatternApprovalCreated;
