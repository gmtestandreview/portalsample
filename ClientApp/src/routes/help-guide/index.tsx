import { Col, Container, Row } from 'react-bootstrap';
import { useIsAuthenticated } from '@azure/msal-react';
import { Link } from 'react-router';
import CustomBreadcrumb from '../../components/Breadcrumb';
import type { CustomBreadcrumbItem } from '../../components/Breadcrumb';
import useHtmlTitle from '../../components/Utilities/useHtmlTitle';
import useBodyClass from '../../components/Utilities/useBodyClass';
import StandardPathway from '../../components/tiles/StandardPathway';
import HeaderIntroText from '../../components/HeaderIntroText';
import BackToDashboardButton from '../../components/Buttons/BackToDashboardButton';

const HelpGuide = () => {
    const isAuthenticated = useIsAuthenticated();

    const breadcrumbs: CustomBreadcrumbItem[] = [
        { to: '/', text: 'Home' },
        { to: '', text: 'Help guide' },
    ];
    useHtmlTitle('Help guide | NMI Services portal');
    useBodyClass('help-guide');

    return (
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
                                <h1 id='page-title' tabIndex={-1} className='banner-title mb-2'>Help guide</h1>
                                <HeaderIntroText>
                                    These resources are designed to save you time with solutions to common issues, helping you troubleshoot and resolve issues on your own.
                                </HeaderIntroText>
                            </Col>
                        </Row>
                    </Container>
                </Container>
                <Container>
                    <h2 className='visually-hidden'>Please choose from the following help guides:</h2>
                    <Row className='mb-2'>
                        <Col>
                            <h2>Getting started</h2>
                        </Col>
                    </Row>
                    <Row className='mb-5'>
                        <Col md={4} className='mb-4'>
                            <StandardPathway
                                type='internal'
                                title='How to set up access'
                                linkDescription='Learn more'
                                bodyText='Step by step guide on setting up access to the NMI Services portal'
                                to='/help-guide/how-to-setup-access'
                            />
                        </Col>
                        <Col md={4} className='mb-4'>
                            <StandardPathway
                                type='internal'
                                title='Frequently Asked Questions (FAQs)'
                                linkDescription='Learn more'
                                bodyText='Find answers to common questions and troubleshooting tips in our FAQ section'
                                to='/help-guide/faqs'
                            />
                        </Col>
                        <Col md={4} className='mb-4'>
                            <StandardPathway
                                type='external'
                                title='Give us your feedback'
                                linkDescription=' '
                                bodyText='Your feedback about using the portal is important to us. Please take the time to let us know your experience.'
                                linkHref='https://industry.au1.qualtrics.com/jfe/form/SV_9X41DIbsi8FvCQu'
                                target='_blank'
                            />
                        </Col>
                    </Row>
                    <Row className='mt-4'>
                        <Col>
                            {isAuthenticated
                                ? <BackToDashboardButton />
                                : (
                                    <Link
                                        data-testid='back-to-home'
                                        to='/'
                                        replace
                                        className='btn btn-tertiary'
                                    >
                                        <i className='icon-back me-1' aria-hidden='true' />
                                        {' Back to home'}
                                    </Link>
                                )}
                        </Col>
                    </Row>
                </Container>
        </div>
    );
};

export default HelpGuide;
