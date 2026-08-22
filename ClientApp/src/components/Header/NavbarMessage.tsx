import { Container } from 'react-bootstrap';

const SiteLaunchMessage = () => (
    <p className='mb-0 p-2 small text-black'>
        <span className='me-2 badge rounded-pill text-white bg-info'>
            <span className='visually-hidden'>NMI Services portal </span>
            Feedback
            <span className='visually-hidden'>:</span>
        </span>
        {'Fill in this '}
        <a
            // Site launch survey link
            href='https://industry.au1.qualtrics.com/jfe/form/SV_9X41DIbsi8FvCQu'
            rel='external noopener noreferrer'
            target='_blank'
            className='small text-black'
        >
            quick survey
            <span className='visually-hidden'> Opens in a new tab</span>
        </a>
        {' to give your feedback and help us to improve the NMI Services portal.'}
    </p>
);

const NavbarMessage = () => (
    <Container fluid className='-bg-dark-gray -bg-light-blue bg-light-blue-tint'>
        <Container>
            <SiteLaunchMessage />
        </Container>
    </Container>
);

export default NavbarMessage;
