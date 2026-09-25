import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import {
    Container,
    Nav,
    Navbar,
} from 'react-bootstrap';
import NavbarBrand from './NavbarBrand';
import UnauthenticatedNavbarItems from './UnauthenticatedNavbarItems';
import AuthenticatedNavbarItems from './AuthenticatedNavbarItems';
import NavbarEnvironment from './NavbarEnvironment';
import NavbarMessage from './NavbarMessage';

const Header = () => (
    <header id='header' data-testid='nmi-header'>
        <NavbarMessage />
        <Navbar
            id='nmi-nav-menu'
            data-testid='nmi-nav-menu'
            variant='dark'
            bg='nmi-navbar'
            aria-label='Site header'
            collapseOnSelect
        >
            <Container fluid className='container-lg align-items-stretch p-0'>
                <NavbarBrand />
                <NavbarEnvironment />
                <Nav navbar>
                    <UnauthenticatedTemplate>
                        <UnauthenticatedNavbarItems />
                    </UnauthenticatedTemplate>
                    <AuthenticatedTemplate>
                        <AuthenticatedNavbarItems />
                    </AuthenticatedTemplate>
                </Nav>
            </Container>
        </Navbar>
    </header>
);

export default Header;
