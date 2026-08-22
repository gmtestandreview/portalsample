import { Navbar } from 'react-bootstrap';
import { Link } from 'react-router';

const NavbarBrand = () => (
    <Navbar.Brand
        className='nmi-nav-brand align-self-center me-1'
        as={Link}
        to='/'
        title='Return to home page'
    >
        <img alt='National Measurement Institute logo' />
    </Navbar.Brand>
);

export default NavbarBrand;
