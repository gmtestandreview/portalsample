import {
	AuthenticatedTemplate,
	UnauthenticatedTemplate,
} from "@azure/msal-react";
import { Container, Nav, Navbar } from "react-bootstrap";
import AuthenticatedNavbarItems from "./AuthenticatedNavbarItems.tsx";
import NavbarBrand from "./NavbarBrand.tsx";
import NavbarEnvironment from "./NavbarEnvironment.tsx";
import NavbarMessage from "./NavbarMessage.tsx";
import UnauthenticatedNavbarItems from "./UnauthenticatedNavbarItems.tsx";

const Header = () => (
	<header id="header" data-testid="nmi-header">
		<NavbarMessage />
		<Navbar
			id="nmi-nav-menu"
			data-testid="nmi-nav-menu"
			variant="dark"
			bg="nmi-navbar"
			aria-label="Site header"
			collapseOnSelect={true}
		>
			<Container fluid={true} className="container-lg align-items-stretch p-0">
				<NavbarBrand />
				<NavbarEnvironment />
				<Nav navbar={true}>
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
