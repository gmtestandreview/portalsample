import { Nav } from 'react-bootstrap';

const UnauthenticatedNavbarItems = () => (
    <>
        <h2 className='d-none'>Banner navigation</h2>
        <Nav.Link
            className='btn btn-tertiary-dark text-nowrap align-self-center'
            data-testid='back-to-nmi-org-link'
            href='https://measurement.gov.au'
            title='Exit portal'
        >
            <i className='icon-back me-1' aria-hidden='true' />
            {'Exit '}
            <span className='d-none d-md-inline-block'>portal</span>
        </Nav.Link>
    </>
);

export default UnauthenticatedNavbarItems;
