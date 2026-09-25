import { Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router';
import HashLink from '../../components/Utilities/hashLink';
import CustomBreadcrumb from '../../components/Breadcrumb';
import type { CustomBreadcrumbItem } from '../../components/Breadcrumb';
import useHtmlTitle from '../../components/Utilities/useHtmlTitle';
import useBodyClass from '../../components/Utilities/useBodyClass';
import HeaderIntroText from '../../components/HeaderIntroText';

const HelpHowToSetupAccess = () => {
    const breadcrumbs: CustomBreadcrumbItem[] = [
        { to: '/', text: 'Home' },
        { to: '/help-guide', text: 'Help guide' },
        { to: '', text: 'How to set up access' },
    ];
    useHtmlTitle('How to set up access - Help guide | NMI Services portal');
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
                                <h1 id='page-title' tabIndex={-1} className='banner-title mb-2'>
                                    {'How to set up access to the '}
                                    <span className='text-nowrap'>NMI Services portal</span>
                                </h1>
                                <HeaderIntroText>
                                    <strong>
                                        Help guide
                                    </strong>
                                </HeaderIntroText>
                            </Col>
                        </Row>
                    </Container>
                </Container>
                <Container>
                    <Row className='mb-4'>
                        <Col md={4} lg={3}>
                            <nav id='navigate-page' className='mb-4 sticky-top' style={{ top: '90px', zIndex: 2 }} aria-label='On this page'>
                                <h2 className='h4'>On this page</h2>
                                <div className='menu-wrapper'>
                                    <ol>
                                        <li>
                                            <HashLink to='#use-your-digital-id'>
                                                {'Use myID to create your '}
                                                <span className='text-nowrap'>Digital ID</span>
                                            </HashLink>
                                        </li>
                                        <li>
                                            <HashLink to='#portal-access-for-yourself-as-principal-authority'>
                                                Set up your business
                                            </HashLink>
                                        </li>
                                        <li>
                                            <HashLink to='#authorising-portal-access-for-your-staff'>
                                                Authorise others
                                            </HashLink>
                                        </li>
                                    </ol>
                                </div>
                            </nav>
                        </Col>
                        <Col md={8} lg={9}>
                            <h2>
                                {'Step by step guide on setting up access to the '}
                                <span className='text-nowrap'>NMI Services portal</span>
                            </h2>
                            <Row className='mb-4'>
                                <Col>
                                    <div className='anchor-section' id='use-your-digital-id' tabIndex={-1}>
                                        <div className='body-copy reset-last mb-8' lang='en'>
                                            <h3 className='mb-2'>1. Use myID to create your Digital ID</h3>
                                            <p>
                                                No need for usernames and passwords&mdash;you will use myID, the Australian Government&apos;s Digital ID app,
                                                to log into the NMI Services portal.
                                            </p>
                                            <p>
                                                {'myID is an easy and secure way to prove who you are online. '}
                                                {'Set up your myID once and then use it repeatedly to access participating online services. '}
                                            </p>
                                            <p>
                                                <Link to='https://www.mygovid.gov.au/'>
                                                    Learn how to set up your myID
                                                </Link>
                                            </p>
                                            <p>
                                                <strong>{'Tip: '}</strong>
                                                {'You need Standard identity strength to access the NMI Services portal.'}
                                            </p>
                                            {/* <Alert
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
                                                    <strong>myGovID is changing to myID</strong>
                                                    <p>
                                                        {'Soon myGovID will be changing its name to myID. It will have a new name and look - but you\'ll continue to use it in the same way.'}
                                                    </p>
                                                    <p>
                                                        {'Learn more about the '}
                                                        <Link to='https://www.mygovid.gov.au/mygovid-changing-myid?utm_source=myGovID%20site%20banner&amp;utm_medium=web&amp;utm_campaign=mygovid_rename_p1'>
                                                            {'new name, what\'s changing and how it affects you'}
                                                        </Link>
                                                        .
                                                    </p>
                                                </div>
                                            </Alert> */}
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                            <Row className='mb-4'>
                                <Col>
                                    <div className='anchor-section' id='portal-access-for-yourself-as-principal-authority' tabIndex={-1}>
                                        <div className='body-copy reset-last mb-8' lang='en'>
                                            <h3 className='mb-2'>2. Set up your business</h3>
                                            <p>
                                                {'Businesses need to be set up in '}
                                                <Link
                                                    to='https://info.authorisationmanager.gov.au'
                                                    rel='noreferrer'
                                                >
                                                    Relationship Authorisation Manager
                                                </Link>
                                                {' before individual users can be authorised to use the '}
                                                <Link
                                                    to='https://portal.measurement.gov.au'
                                                    rel='noreferrer'
                                                >
                                                    NMI Services portal
                                                </Link>
                                                .
                                            </p>
                                            <p>
                                                {'The '}
                                                <Link
                                                    to='https://info.authorisationmanager.gov.au/principal-authority'
                                                    rel='noreferrer'
                                                >
                                                    principal authority
                                                </Link>
                                                {' of your business needs to complete this step.'}
                                            </p>
                                            <h4 className='h5'><i>You are the principal authority</i></h4>
                                            <p className='mb-0'>Follow these steps:</p>
                                            <ol className='mb-4'>
                                                <li>
                                                    <strong>Set up</strong>
                                                    {' your myID (if you don\'t already have one)'}
                                                </li>
                                                <li>
                                                    <strong>Link</strong>
                                                    {' '}
                                                    your myID to the business&apos;s Australian Business Number (ABN) in
                                                    {' '}
                                                    <Link
                                                        to='https://info.authorisationmanager.gov.au'
                                                        rel='noreferrer'
                                                    >
                                                        Relationship Authorisation Manager
                                                    </Link>
                                                </li>
                                            </ol>
                                            <p>
                                                {'For step by instructions, visit the '}
                                                <Link
                                                    to='https://info.authorisationmanager.gov.au/'
                                                    rel='noreferrer'
                                                >
                                                    Relationship Authorisation Manager website
                                                </Link>
                                                .
                                            </p>

                                            <h4 className='h5'><i>You are not the principal authority</i></h4>
                                            <p className='mb-0'>Follow these steps:</p>
                                            <ol className='mb-4'>
                                                <li className='mb-2'>
                                                    <strong>Identify</strong>
                                                    {' the principal authority in your business'}
                                                </li>
                                                <li className='mb-2'>
                                                    <strong>Ask</strong>
                                                    {' them to follow the steps above to set up your business'}
                                                </li>
                                            </ol>
                                            <p>
                                                <strong>Tip:</strong>
                                                {' The principal authority is often a company director, '}
                                                company secretary or senior official who holds a corporate or finance role.
                                            </p>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                            <Row className='mb-4'>
                                <Col>
                                    <div className='anchor-section ' id='authorising-portal-access-for-your-staff' tabIndex={-1}>
                                        <div className='body-copy reset-last mb-8' lang='en'>
                                            <h3 className='mb-2'>3. Authorise others</h3>
                                            <p>
                                                {'The '}
                                                <Link to='https://info.authorisationmanager.gov.au/principal-authority'>
                                                    principal authority
                                                </Link>
                                                {' of the business needs to authorise individuals to use the '}
                                                <Link
                                                    to='https://portal.measurement.gov.au'
                                                    rel='noreferrer'
                                                >
                                                    NMI Services portal
                                                </Link>
                                                {' '}
                                                on the business&apos;s behalf.
                                            </p>
                                            <p>
                                                {'Individuals need to accept the authorisation request before they can log in and use the '}
                                                <Link
                                                    to='https://portal.measurement.gov.au'
                                                    rel='noreferrer'
                                                >
                                                    NMI Services portal
                                                </Link>
                                                .
                                            </p>
                                            <h4 className='h5'><i>You are the principal authority</i></h4>
                                            {/* <p className='mb-0'>Follow these steps:</p> */}
                                            <ol className='mb-4'>
                                                <li>
                                                    <strong>Confirm</strong>
                                                    {' you have the individual\'s details: '}
                                                    {/* <Link to='https://www.mygovid.gov.au/'>
                                                        set up their myGovID
                                                    </Link>
                                                    . */}
                                                    <ul>
                                                        <li>full name they used to set up myID</li>
                                                        <li>preferred email address to receive an authorisation code&mdash;this can be a work or personal email address</li>
                                                    </ul>
                                                </li>
                                                <li>
                                                    <strong>Log in</strong>
                                                    {' to '}
                                                    <Link to='https://authorisationmanager.gov.au/'>
                                                        Relationship Authorisation Manager (RAM)
                                                    </Link>
                                                </li>
                                                <li>
                                                    <strong>Authorise</strong>
                                                    {' the individual\'s myID to act on behalf of the '}
                                                    business&mdash;
                                                    {'see '}
                                                    <Link to='https://info.authorisationmanager.gov.au/set-up-authorisations'>
                                                        create an authorisation
                                                    </Link>
                                                    {' for instructions.'}
                                                </li>
                                                <li>
                                                    <strong>Inform</strong>
                                                    {' the individual they will receive a code via email to accept the authorisation.'}
                                                </li>
                                            </ol>
                                            <h4 className='h5'><i>You are an individual wanting to access the NMI Services portal</i></h4>
                                            <p className='mb-0'>Follow these steps:</p>
                                            <ol className='mb-4'>
                                                <li>
                                                    <strong>Provide</strong>
                                                    {' the principal authority of the business with your:'}
                                                    <ul>
                                                        <li>full name&mdash;the same one you used to set up myID</li>
                                                        <li>preferred email address to receive an authorisation code&mdash;this can be a work or personal email address</li>
                                                    </ul>
                                                </li>
                                                <li>
                                                    <strong>Log in</strong>
                                                    {' to your email and use the code you received to accept the '}
                                                    authorisation&mdash;you must complete this step within 7 days
                                                </li>
                                                <li>
                                                    <strong>Log in</strong>
                                                    {' to the '}
                                                    <Link to='/'>
                                                        NMI Services portal
                                                    </Link>
                                                </li>
                                            </ol>
                                            <p>
                                                <strong>{'Tip: '}</strong>
                                                {' The principal authority of the business may have delegated responsibility to an authorised administrator. '}
                                                If so, they will follow the same steps as the principal authority.
                                            </p>
                                        </div>

                                    </div>
                                </Col>
                            </Row>
                            <Row className='mb-4'>
                                <Col>
                                    <div className='anchor-section ' id='need-more-help' tabIndex={-1}>
                                        <div className='body-copy reset-last mb-8' lang='en'>
                                            <h3 className='mb-2'>I need more help</h3>
                                            <ul>
                                                <li>
                                                    {'Learn '}
                                                    <Link to='https://www.myid.gov.au/how-to-set-up-myid'>
                                                        how to use myID to access
                                                    </Link>
                                                    {' the NMI Services portal.'}
                                                </li>
                                                <li>
                                                    {'Email the NMI Support Team: '}
                                                    <Link to='mailto:infotm@measurement.gov.au?subject=Support request for NMI Services portal'>
                                                        infotm@measurement.gov.au
                                                    </Link>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={4} lg={3} />
                        <Col md={8} lg={9}>
                            <div className='mt-5 d-grid w-100 gap-3 d-md-flex justify-content-md-between'>
                                <Link
                                    data-testid='back-to-help-guide'
                                    to='/help-guide'
                                    replace
                                    className='btn btn-tertiary'
                                >
                                    <i className='icon-back me-1' aria-hidden='true' />
                                    {' Back to help guide'}
                                </Link>
                                <Link
                                    data-testid='next-faqs'
                                    to='/help-guide/faqs/'
                                    replace
                                    className='btn btn-secondary'
                                >
                                    {'View '}
                                    <abbr title='Frequently Asked Questions'>FAQs</abbr>
                                </Link>
                            </div>
                        </Col>
                    </Row>
                </Container>
        </div>
    );
};

export default HelpHowToSetupAccess;
