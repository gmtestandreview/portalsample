import type { ReactNode } from "react";
import { Container } from "react-bootstrap";
import GoogleAnalytics from "../../analytics/GoogleAnalytics";
import { useRouteAccessibility } from "../../hooks/useRouteAccessibility";
import Footer from "../Footer";
import Header from "../Header";
import BackToTopButton from "../Utilities/backToTopButton";
import RouteChangeScrollTop from "../Utilities/routeChangeScrollTop";
import SkipLinks from "../Utilities/skipLinks";

interface LayoutProps {
	children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
	const { announcement } = useRouteAccessibility();
	return (
		<>
			<SkipLinks />
			<Header />
			<Container fluid id="main" role="main" className="px-0" tabIndex={-1}>
				<GoogleAnalytics anonymiseIp={false} testMode={false} sendPageView>
					{children}
				</GoogleAnalytics>
			</Container>
			<Footer />
			<BackToTopButton />
			<span className="visually-hidden" role="status" aria-live="polite">
				{announcement}
			</span>
			<RouteChangeScrollTop />
		</>
	);
};

export default Layout;
