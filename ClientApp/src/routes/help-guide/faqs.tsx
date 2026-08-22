import { Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router';
import CustomBreadcrumb from '../../components/Breadcrumb';
import type { CustomBreadcrumbItem } from '../../components/Breadcrumb';
import useHtmlTitle from '../../components/Utilities/useHtmlTitle';
import useBodyClass from '../../components/Utilities/useBodyClass';
import HeaderIntroText from '../../components/HeaderIntroText';
import HashLink from '../../components/Utilities/hashLink';

const FAQs = () => {
    const breadcrumbs: CustomBreadcrumbItem[] = [
        { to: '/', text: 'Home' },
        { to: '/help-guide', text: 'Help guide' },
        { to: '', text: 'Frequently Asked Questions (FAQs)' },
    ];
    useHtmlTitle('Frequently Asked Questions (FAQs) - Help guide | NMI Services portal');
    useBodyClass('help-guide');

    return (
        <>
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
                                Frequently Asked Questions (FAQs)
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
                                        <HashLink to='#faqs-01'>
                                            Portal benefits
                                        </HashLink>
                                    </li>
                                    <li>
                                        <HashLink to='#faqs-02'>
                                            Set up myID
                                        </HashLink>
                                    </li>
                                    <li>
                                        <HashLink to='#faqs-03'>
                                            Set up a business
                                        </HashLink>
                                    </li>
                                    <li>
                                        <HashLink to='#faqs-04'>
                                            Authorise others
                                        </HashLink>
                                    </li>
                                    <li>
                                        <HashLink to='#faqs-05'>
                                            I need more help
                                        </HashLink>
                                    </li>
                                </ol>
                            </div>
                        </nav>
                    </Col>
                    <Col md={8} lg={9}>
                        <h2 className='visually-hidden'>
                            List of Frequently Asked Questions (FAQs) with answers
                        </h2>
                        {/* Portal benefits */}
                        <Row className='mb-4'>
                            <h2 id='faqs-01' className='mb-3'>Portal benefits</h2>
                            <Col>
                                <div className='anchor-section' id='faqs-01-01' tabIndex={-1}>
                                    <div className='body-copy reset-last mb-4' lang='en'>
                                        <h3 className='mb-2'>What services are available to clients via the NMI Services portal?</h3>
                                        <p>
                                            Clients can access NMI&apos;s physical test and calibration services through
                                            the NMI Services portal. The NMI is working to provide additional services in the future.
                                        </p>
                                        <p>
                                            <Link
                                                to='https://www.industry.gov.au/national-measurement-institute/nmi-services/physical-measurement-services'
                                                target='_blank'
                                                rel='noreferrer'
                                            >
                                                Learn more about NMI&apos;s physical measurement services
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        <Row className='mb-4'>
                            <Col>
                                <div className='anchor-section' id='faqs-01-02' tabIndex={-1}>
                                    <div className='body-copy reset-last mb-4' lang='en'>
                                        <h3 className='mb-2'>What are the benefits of the NMI Services portal?</h3>
                                        <p className='mb-2'>
                                            {'We have designed the NMI Services portal to be '}
                                            <strong>secure</strong>
                                            {', '}
                                            <strong>user-friendly</strong>
                                            {' and '}
                                            <strong>transparent</strong>
                                            {'. It is available 24 hours a day for authorised representatives from your organisation to:'}
                                        </p>
                                        <ul>
                                            <li>request, receive and accept quotes</li>
                                            <li>view real-time progress of quote requests and calibrations</li>
                                            <li>access and download calibration reports as soon as they are available</li>
                                        </ul>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        <Row className='mb-4'>
                            <Col>
                                <div className='anchor-section' id='faqs-01-03' tabIndex={-1}>
                                    <div className='body-copy reset-last mb-4' lang='en'>
                                        <h3 className='mb-2'>Will I still be able to email or call the NMI to discuss test and calibration services?</h3>
                                        <p>
                                            Yes, you can. The NMI Services portal is the primary method to request and receive physical test and
                                            calibration services. It streamlines processes and will complement the excellent customer service you receive
                                            from NMI staff via the telephone and email.
                                        </p>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        <hr className='mb-5' />
                        {/* Set up myID */}
                        <Row className='mb-4'>
                            <h2 id='faqs-02' className='mb-3'>Set up myID</h2>
                            <Col>
                                <div className='anchor-section' id='faqs-02-01' tabIndex={-1}>
                                    <div className='body-copy reset-last mb-4' lang='en'>
                                        <h3 className='mb-2'>Why do I need to use myID to access the NMI Services portal?</h3>
                                        <p className='mb-2'>Using myID helps to maintain the security of the NMI Services portal. It:</p>
                                        <ul>
                                            <li>
                                                ensures only authorised representatives can access the portal and
                                                act on behalf of organisations to request and receive services
                                            </li>
                                            <li>
                                                helps to protect your personal information and organisation data,
                                                minimising the risk of cyber threats and privacy breaches.
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        <Row className='mb-4'>
                            <Col>
                                <div className='anchor-section' id='faqs-02-02' tabIndex={-1}>
                                    <div className='body-copy reset-last mb-4' lang='en'>
                                        <h3 className='mb-2'>How do I set up my myID?</h3>
                                        <p>
                                            Download the myID app, enter your details and choose your identity strength&mdash;
                                            you will need Standard identity strength to access the NMI Services portal.
                                        </p>
                                        <p>Step-by-step instructions are on the myID website.</p>
                                        <p>
                                            <Link to='https://www.myid.gov.au/how-set-myid' target='_blank' rel='noreferrer'>
                                                Learn how to set up your myID
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        <Row className='mb-4'>
                            <Col>
                                <div className='anchor-section' id='faqs-02-03' tabIndex={-1}>
                                    <div className='body-copy reset-last mb-4' lang='en'>
                                        <h3 className='mb-2'>Why do I need to use a personal email address to set up myID?</h3>
                                        <p>
                                            {'Your myID is your '}
                                            <i>personal</i>
                                            {' digital identity, '}
                                            so it&apos;s important that you use an email address that
                                            {' '}
                                            <u>only you</u>
                                            {'  can access. You should '}
                                            <u>not use</u>
                                            {' your work email address.'}
                                        </p>
                                        <p>You may wish to use your myID to log into other Australian Government online services.</p>
                                        <p>
                                            <Link to='https://www.myid.gov.au/online-services-you-can-use' target='_blank' rel='noreferrer'>
                                                Learn what Australian Government services you can access with myID
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        <Row className='mb-4'>
                            <Col>
                                <div className='anchor-section' id='faqs-02-04' tabIndex={-1}>
                                    <div className='body-copy reset-last mb-4' lang='en'>
                                        <h3 className='mb-2'>What level of myID identity strength do I need to access to the NMI Services Portal?</h3>
                                        <p>You need Standard identity strength to access the NMI Services portal.</p>
                                        <p>
                                            <Link to='https://www.myid.gov.au/how-set-myid' target='_blank' rel='noreferrer'>
                                                Learn how to set up your myID
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        <Row className='mb-4'>
                            <Col>
                                <div className='anchor-section' id='faqs-02-05' tabIndex={-1}>
                                    <div className='body-copy reset-last mb-4' lang='en'>
                                        <h3 className='mb-2'>What is the difference between myID and myGov?</h3>
                                        <p>
                                            myID is the Australian Government Digital ID app&mdash;it&apos;s a secure,
                                            convenient way to prove who you are online. Once set up, you can use myID to log into myGov.
                                        </p>
                                        <p>
                                            myGov is a secure digital portal to access Australian Government services,
                                            such as Medicare, Centrelink, and the Australian Taxation Office (ATO).
                                        </p>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        <Row className='mb-4'>
                            <Col>
                                <div className='anchor-section' id='faqs-02-06' tabIndex={-1}>
                                    <div className='body-copy reset-last mb-4' lang='en'>
                                        <h3 className='mb-2'>
                                            Will people in my organisation or the NMI be able to see the personal information I use to set up myID?
                                        </h3>
                                        <p>
                                            No, only your full name that you used to set up myID is visible to the principal authority
                                            (or authorised administrator) when they authorise you to use the NMI Services portal.
                                            You must provide consent to parties to access any other personal information.
                                        </p>
                                        <p>
                                            The NMI gathers and holds information you enter in the NMI Services portal after you first log in
                                            (e.g. first name, last name, work email address and phone number).
                                            More information about how the NMI protects your privacy is outlined in the Department&apos;s
                                            {' '}
                                            <Link
                                                to='https://www.industry.gov.au/publications/privacy-policy'
                                                target='_blank'
                                                rel='noreferrer'
                                            >
                                                privacy policy
                                            </Link>
                                            .
                                        </p>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        <Row className='mb-4'>
                            <Col>
                                <div className='anchor-section' id='faqs-02-07' tabIndex={-1}>
                                    <div className='body-copy reset-last mb-4' lang='en'>
                                        <h3 className='mb-2'>Will I be able to see any details regarding my organisation (e.g., financial data)?</h3>
                                        <p>
                                            No, only authorised representatives, such as the principal authority,
                                            can access and view this type of information.
                                        </p>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        <Row className='mb-4'>
                            <Col>
                                <div className='anchor-section' id='faqs-02-08' tabIndex={-1}>
                                    <div className='body-copy reset-last mb-4' lang='en'>
                                        <h3 className='mb-2'>Do all staff in my organisation need a myID?</h3>
                                        <p>
                                            {'No, only the '}
                                            <Link
                                                to='https://info.authorisationmanager.gov.au/principal-authority'
                                                target='_blank'
                                                rel='noreferrer'
                                            >
                                                principal authority
                                            </Link>
                                            {' and staff who need access to the NMI Services portal '}
                                            (i.e., to request and receive physical test and calibration services) need a myID.
                                        </p>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        <hr className='mb-5' />
                        {/* Set up a business */}
                        <Row className='mb-4'>
                            <h2 id='faqs-03' className='mb-3'>Set up a business</h2>
                            <Col>
                                <div className='anchor-section' id='faqs-03-01' tabIndex={-1}>
                                    <div className='body-copy reset-last mb-4' lang='en'>
                                        <h3 className='mb-2'>How do I set up a business to use the NMI Services portal?</h3>
                                        <p>
                                            {'Businesses need to be set up in '}
                                            <Link
                                                to='https://info.authorisationmanager.gov.au'
                                                target='_blank'
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
                                                target='_blank'
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
                                                    target='_blank'
                                                    rel='noreferrer'
                                                >
                                                    Relationship Authorisation Manager
                                                </Link>
                                            </li>
                                            {/* <li>
                                                <strong>Log in</strong>
                                                {' to the '}
                                                <Link to='https://portal.measurement.gov.au'>NMI Services portal</Link>
                                                {' and set up your organisation details.'}
                                            </li> */}
                                        </ol>
                                        <p>
                                            {'For step by instructions, visit the '}
                                            <Link
                                                to='https://info.authorisationmanager.gov.au/'
                                                target='_blank'
                                                rel='noreferrer'
                                            >
                                                Relationship Authorisation Manager website
                                            </Link>
                                            .
                                        </p>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        <Row className='mb-4'>
                            <Col>
                                <div className='anchor-section' id='faqs-03-02' tabIndex={-1}>
                                    <div className='body-copy reset-last mb-4' lang='en'>
                                        <h3 className='mb-2'>What is Relationship Authorisation Manager (RAM)?</h3>
                                        <p>
                                            RAM is an Australian Government authorisation service businesses use to:
                                        </p>
                                        <ol className='mb-4'>
                                            <li>
                                                <strong>access</strong>
                                                {' government online services'}
                                            </li>
                                            <li>
                                                <strong>authorise</strong>
                                                {' '}
                                                individuals (e.g., employees) to act on the business&apos; behalf to use such services.
                                            </li>
                                        </ol>
                                        <p>
                                            <Link to='https://info.authorisationmanager.gov.au/' target='_blank' rel='noreferrer'>
                                                Learn more about Relationship Authorisation Manager
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        <Row className='mb-4'>
                            <Col>
                                <div className='anchor-section' id='faqs-03-03' tabIndex={-1}>
                                    <div className='body-copy reset-last mb-4' lang='en'>
                                        <h3 className='mb-2'>Who is a principal authority?</h3>
                                        <p className='mb-2'>
                                            {'A '}
                                            <Link to='https://info.authorisationmanager.gov.au/principal-authority' target='_blank' rel='noreferrer'>
                                                principal authority
                                            </Link>
                                            {' is a person responsible for the business/organisation, such as a:'}
                                        </p>
                                        <ul>
                                            <li>sole trader</li>
                                            <li>
                                                an eligible individual associate listed on an Australian Business Number (ABN)
                                                in the Australian Business Register (ABR).
                                                For example, a trustee, director, or public officer
                                            </li>
                                            <li>an office holder or authorised contact</li>
                                        </ul>
                                        <p>
                                            <strong>Tip:</strong>
                                            {' '}
                                            The principal authority is often a company director, company secretary or senior official
                                            who holds a corporate or finance role.
                                        </p>
                                        <p>
                                            <Link
                                                to='https://info.authorisationmanager.gov.au/link-to-a-business-in-ram/set-up-a-business-in-ram/who-can-set-up'
                                                target='_blank'
                                                rel='noreferrer'
                                            >
                                                Learn more about who is a principal authority
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        <hr className='mb-5' />
                        {/* Authorise others */}
                        <Row className='mb-4'>
                            <h2 id='faqs-04' className='mb-3'>Authorise others</h2>
                            <Col>
                                <div className='anchor-section' id='faqs-04-01' tabIndex={-1}>
                                    <div className='body-copy reset-last mb-4' lang='en'>
                                        <h3 className='mb-2'>Why do organisations need to authorise individuals to access the NMI Services portal?</h3>
                                        <p className='mb-2'>Organisations need to authorise staff for 2 reasons:</p>
                                        <ul>
                                            <li>
                                                It helps to ensure the security of the system and associated data
                                                (i.e., it minimises risk of cyber threats and data breaches).
                                            </li>
                                            <li>
                                                A calibration service request, quote acceptance and receipt of the report is a commercial transaction
                                                between the NMI and a client with regulatory and compliance significance.
                                                <br />
                                                <br />
                                                Identity validation (with myID) and authorisation (with Relationship Authorisation Manager)
                                                ensures the requestor of the service, and the recipient of the service is:
                                                <br />
                                                <ul>
                                                    <li>who they purport to be, and</li>
                                                    <li>
                                                        are authorised to act on the organisation&apos;s behalf
                                                        (i.e., request a quote, accept the quote, and access the calibration report).
                                                    </li>
                                                </ul>
                                            </li>
                                        </ul>

                                    </div>
                                </div>
                            </Col>
                        </Row>
                        <Row className='mb-4'>
                            <Col>
                                <div className='anchor-section' id='faqs-04-02' tabIndex={-1}>
                                    <div className='body-copy reset-last mb-4' lang='en'>
                                        <h3 className='mb-2'>How are people authorised to access the NMI Services portal?</h3>
                                        <p className='mb-2'>
                                            {'The '}
                                            <Link to='https://info.authorisationmanager.gov.au/principal-authority' target='_blank' rel='noreferrer'>
                                                principal authority
                                            </Link>
                                            {' '}
                                            (or the organisation&apos;s authorised administrator) need to authorise individuals to use the NMI Services portal
                                            on the organisation&apos;s behalf. Follow these steps:
                                        </p>
                                        <ul>
                                            <li>
                                                <strong>Confirm</strong>
                                                {' '}
                                                you have the individual&apos;s details:
                                                <ul>
                                                    <li>full name they used to set up myID</li>
                                                    <li>
                                                        preferred email address to receive an authorisation code&mdash;
                                                        this can be a work or personal email address
                                                    </li>
                                                </ul>
                                            </li>
                                            <li>
                                                <strong>Log in</strong>
                                                {' to '}
                                                <Link
                                                    to='https://info.authorisationmanager.gov.au'
                                                    target='_blank'
                                                    rel='noreferrer'
                                                >
                                                    Relationship Authorisation Manager
                                                </Link>
                                            </li>
                                            <li>
                                                <strong>Authorise</strong>
                                                {' '}
                                                the individual&apos;s myID to act on behalf of the business&mdash;
                                                {'see '}
                                                <Link
                                                    to='https://info.authorisationmanager.gov.au/manage-authorisations/create-an-authorisation'
                                                    target='_blank'
                                                    rel='noreferrer'
                                                >
                                                    create an authorisation
                                                </Link>
                                                {' for instructions'}
                                            </li>
                                            <li>
                                                <strong>Inform</strong>
                                                {' the individual they will receive a code via email to accept the authorisation.'}
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        <Row className='mb-4'>
                            <Col>
                                <div className='anchor-section' id='faqs-04-03' tabIndex={-1}>
                                    <div className='body-copy reset-last mb-4' lang='en'>
                                        <h3 className='mb-2'>What is an authorised administrator?</h3>
                                        <p>
                                            {'The '}
                                            <Link
                                                to='https://info.authorisationmanager.gov.au/principal-authority'
                                                target='_blank'
                                                rel='noreferrer'
                                            >
                                                principal authority
                                            </Link>
                                            {' '}
                                            of an organisation can authorise an individual to be an Authorisation Administrator
                                            for the Relationship Authorisation Manager service.
                                        </p>
                                        <p>Once appointed, the authorisation administrator can create and manage authorisations for individuals.</p>
                                        <p>
                                            <Link
                                                to='https://info.authorisationmanager.gov.au/manage-authorisations'
                                                target='_blank'
                                                rel='noreferrer'
                                            >
                                                Learn more about managing authorisations
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        <Row className='mb-4'>
                            <Col>
                                <div className='anchor-section' id='faqs-04-04' tabIndex={-1}>
                                    <div className='body-copy reset-last mb-4' lang='en'>
                                        <h3 className='mb-2'>How do I manage authorisations within my organisation?</h3>
                                        <p>
                                            {'The '}
                                            <Link to='https://info.authorisationmanager.gov.au/principal-authority' target='_blank' rel='noreferrer'>
                                                principal authority
                                            </Link>
                                            {' '}
                                            of an organisation (or authorisation administrator) is responsible for managing authorisations,
                                            including disconnecting or de-authorising employees if they change jobs or leave the organisation,
                                            using Relationship Authorisation Manager.
                                        </p>
                                        <p>Once an employee has been de-authorised, they will be unable to access the NMI Services portal.</p>
                                        <p>
                                            <Link to='https://info.authorisationmanager.gov.au/manage-authorisations' target='_blank' rel='noreferrer'>
                                                Learn more about managing authorisations
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        <hr className='mb-5' />
                        {/* I need more help */}
                        <Row className='mb-4'>
                            <h2 id='faqs-05' className='mb-3'>I need more help</h2>
                            <Col>
                                <div className='anchor-section' id='faqs-05-01' tabIndex={-1}>
                                    <div className='body-copy reset-last mb-4' lang='en'>
                                        <h3 className='mb-2'>Who do I contact for support setting up access to the NMI Services portal?</h3>
                                        <p className='mb-2'>
                                            The myID and Relationship Authorisation Manager websites provide step by step instructions and help guides.
                                        </p>
                                        <ul className='list-unstyled'>
                                            <li>
                                                {'Visit the '}
                                                <Link to='https://www.myid.gov.au/help' target='_blank' rel='noreferrer'>myID help guide</Link>
                                            </li>
                                            <li>
                                                {'Visit the '}
                                                <Link
                                                    to='https://info.authorisationmanager.gov.au/help'
                                                    target='_blank'
                                                    rel='noreferrer'
                                                >
                                                    Relationship Authorisation Manager help guide
                                                </Link>
                                            </li>
                                        </ul>
                                        <p>
                                            {'If you need more help, email the NMI Support Team: '}
                                            <Link to='mailto:infotm@measurement.gov.au?subject=Support request for NMI Services portal'>
                                                infotm@measurement.gov.au
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        <Row className='mb-4'>
                            <Col>
                                <div className='anchor-section' id='faqs-05-02' tabIndex={-1}>
                                    <div className='body-copy reset-last mb-4' lang='en'>
                                        <h3 className='mb-2'>Who do I contact to get help logging into the NMI Services portal?</h3>
                                        <p>
                                            The myID website provides step by step instructions on how to use myID to log in to government online services.
                                        </p>
                                        <p>
                                            <Link to='https://www.myid.gov.au/how-to-use-myid' target='_blank' rel='noreferrer'>
                                                Learn how to use myID to access the NMI Services portal
                                            </Link>
                                        </p>
                                        <p>
                                            {'If you need more help, email the NMI Support Team: '}
                                            <Link to='mailto:infotm@measurement.gov.au?subject=Support request for NMI Services portal'>
                                                infotm@measurement.gov.au
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        <Row className='mb-4'>
                            <Col>
                                <div className='anchor-section' id='faqs-05-03' tabIndex={-1}>
                                    <div className='body-copy reset-last mb-4' lang='en'>
                                        <h3 className='mb-2'>Who do I contact if I need help using the NMI Services portal to process a request?</h3>
                                        <p>
                                            {'If you need more help, email the NMI Support Team: '}
                                            <Link to='mailto:infotm@measurement.gov.au?subject=Support request for NMI Services portal'>
                                                infotm@measurement.gov.au
                                            </Link>
                                        </p>
                                        <p>
                                            Using the NMI Services portal will complement the customer service you receive from NMI staff
                                            (e.g., Calibration Coordinators or Test Officers) via the telephone and email.
                                        </p>
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
                        </div>
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default FAQs;
