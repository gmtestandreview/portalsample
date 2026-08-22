import {
    Col, Row, Container,
} from 'react-bootstrap';
import { Link } from 'react-router';
import useHtmlTitle from '../../../components/Utilities/useHtmlTitle';
import useBodyClass from '../../../components/Utilities/useBodyClass';
import { useAccountState } from '../../../authentication/hooks';
import FormBanner from '../../../components/forms/FormBanner';
import HeaderIntroText from '../../../components/HeaderIntroText';

const AccountCreated = () => {
    const account = useAccountState();

    useHtmlTitle('Account created successfully | NMI Services portal');
    useBodyClass('account-created');

    return (
        <>
            <FormBanner
                title='Create portal account'
                showSaveAndExitButton={false}
            />
            <Container fluid id='main' role='main' className='px-0' tabIndex={-1}>
                <Container className='py-5'>
                    <Row className='mb-5'>
                        <Col sm={12} md={10} lg={8} className='mx-auto'>
                            <h1 id='page-title' tabIndex={-1}>
                                {'Your portal account is ready, '}
                                {account?.details?.givenName !== undefined && (`${account?.details?.givenName}`)}
                            </h1>

                            <HeaderIntroText>
                                Thank you for creating your National Measurement Institute (NMI) Services portal account,
                                you can now create and manage requests on the portal.
                                Continue by clicking &quot;Go to dashboard&quot; below.
                            </HeaderIntroText>
                            <div className='d-grid d-md-block'>
                                <Link
                                    data-testid='go-to-dashboard-button'
                                    to='/dashboard'
                                    className='btn btn-primary'
                                >
                                    Go to dashboard
                                </Link>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </Container>
        </>
    );
};

export default AccountCreated;
