import { Container, Col, Row } from 'react-bootstrap';
import { useIsAuthenticated } from '@azure/msal-react';
import { Navigate } from 'react-router';
import useHtmlTitle from '../Utilities/useHtmlTitle';
import useBodyClass from '../Utilities/useBodyClass';
import StandardPathway from '../tiles/StandardPathway';
import InTextLink from '../InTextLink';
import HeaderIntroText from '../HeaderIntroText';
import { clearGetStartedNotification, getGetStartedNotification } from '../../storage/notification';
import NotificationMessage from '../Alert/NotificationMessage';

const GetStarted = () => {
    const isAuthenticated = useIsAuthenticated();
    useHtmlTitle('NMI Services portal | NMI');
    useBodyClass('home');
    const getStartedNotification = getGetStartedNotification();
    const getStartedMessage = getStartedNotification
        ? <NotificationMessage canClose onClose={clearGetStartedNotification} {...getStartedNotification} />
        : null;

    if (isAuthenticated) {
        return <Navigate to='/dashboard' />;
    }

    return (
        <>
            <Container fluid className='default-banner-background gs-wrapper mb-5'>
                <Container>
                    <Row>
                        <Col md={12} lg={9}>
                            <h1 id='page-title-nofocus' tabIndex={-1} className='banner-title -mb-0'>
                                {'National Measurement Institute (NMI) '}
                                <span className='text-nowrap'>Services portal</span>
                            </h1>
                            <h2 className='h4 mb-0'>Welcome to the NMI Services portal</h2>
                            <HeaderIntroText className='mb-0 col-12 col-lg-9'>
                                The NMI delivers secure, user-friendly and transparent physical test and calibration services through the portal.
                            </HeaderIntroText>
                        </Col>
                    </Row>
                </Container>
            </Container>
            {getStartedMessage && (
                <Container className='gs-wrapper'>
                    <Row>
                        <Col>
                            {getStartedMessage}
                        </Col>
                    </Row>
                </Container>
            )}
            <Container>
                <Row className='mb-3'>
                    <Col>
                        <p className='mb-0'><strong>By using the portal, you can:</strong></p>
                        <ul className='ms-4'>
                            <li>request, receive and accept quotes</li>
                            <li>view real-time progress of quote requests and calibrations</li>
                            <li>access and download calibration reports as soon as they are available</li>
                        </ul>
                        <p>The NMI plans to expand the portal to deliver other services in future.</p>
                    </Col>
                </Row>
                <Row className='mb-3'>
                    <h2 className='visually-hidden'>Please choose from the following options:</h2>
                    <Col md={6}>
                        {/* <StandardPathway
                            type='external'
                            title='Create a Digital ID'
                            linkDescription='Find out how to set up your Digital ID'
                            linkHref='https://www.digitalidsystem.gov.au/set-up-your-digital-id'
                            target='_blank'
                        /> */}
                        <StandardPathway
                            type='internal'
                            title='How to set up access'
                            bodyText='Step by step guide on setting up access to the NMI Services portal'
                            linkDescription='Learn more'
                            to='/help-guide/how-to-setup-access'
                        />
                    </Col>
                    <Col md={6}>
                        <StandardPathway
                            type='internal'
                            title='Log in'
                            bodyText='Already have a Digital ID? Log in'
                            linkDescription='Continue with Digital ID'
                            to='/dashboard'
                            digitalIdentity
                        />
                    </Col>
                </Row>
                <Row className='mb-5'>
                    <Col md={6} />
                    <Col md={6}>
                        <p>
                            <InTextLink
                                target='_blank'
                                href='https://www.digitalidsystem.gov.au'
                            >
                                Digital ID
                            </InTextLink>
                            is a safe, secure and convenient way to prove and reuse your identity online.
                        </p>
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default GetStarted;
