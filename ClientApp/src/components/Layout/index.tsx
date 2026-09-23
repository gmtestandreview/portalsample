import type { ReactNode } from 'react';
import { Container } from 'react-bootstrap';
import GoogleAnalytics from '../../analytics/GoogleAnalytics.tsx';
import { useRouteAccessibility } from '../../hooks/useRouteAccessibility.ts';
import Footer from '../Footer/index.tsx';
import Header from '../Header/index.tsx';
import BackToTopButton from '../Utilities/backToTopButton.tsx';
import RouteChangeScrollTop from '../Utilities/routeChangeScrollTop.tsx';
import SkipLinks from '../Utilities/skipLinks.tsx';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: Readonly<LayoutProps>) => {
  const { announcement } = useRouteAccessibility();
  return (
    <>
      <SkipLinks />
      <Header />
      <Container
        fluid={true}
        id='main'
        role='main'
        className='px-0'
        tabIndex={-1}
      >
        <GoogleAnalytics
          anonymiseIp={false}
          testMode={false}
          sendPageView={true}
        >
          {children}
        </GoogleAnalytics>
      </Container>
      <Footer />
      <BackToTopButton />
      <span className='visually-hidden' role='status' aria-live='polite'>
        {announcement}
      </span>
      <RouteChangeScrollTop />
    </>
  );
};

export default Layout;
