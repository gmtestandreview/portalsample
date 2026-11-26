import ReactGA from 'react-ga4';
import { useEffect, useState } from 'react';
import type { GoogleAnalyticsProps } from './types';

const getPage = (): string =>
  `${window.location.pathname}${window.location.search}${window.location.hash}`;

const GoogleAnalytics = ({
  children,
  anonymiseIp,
  testMode,
  sendPageView,
}: Readonly<GoogleAnalyticsProps>) => {
  const [page, setPage] = useState(getPage);

  useEffect(() => {
    const updatePage = (): void => {
      setPage(getPage());
    };

    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(
      window.history,
    );

    window.history.pushState = function (
      ...args: Parameters<History['pushState']>
    ) {
      originalPushState(...args);
      updatePage();
    };
    window.history.replaceState = function (
      ...args: Parameters<History['replaceState']>
    ) {
      originalReplaceState(...args);
      updatePage();
    };

    window.addEventListener('popstate', updatePage);

    return () => {
      window.removeEventListener('popstate', updatePage);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  useEffect(() => {
    const viteEnv = (
      import.meta as unknown as {
        env?: Record<string, string | undefined>;
      }
    ).env;
    const trackId = viteEnv?.['VITE_GA_TRACKINGID'];

    if (trackId && !ReactGA.isInitialized) {
      ReactGA.initialize([
        {
          trackingId: trackId,
          gaOptions: {
            anonymizeIp: anonymiseIp,
            testMode,
          },
        },
      ]);
    }
  }, [anonymiseIp, testMode]);

  useEffect(() => {
    if (!sendPageView || !ReactGA.isInitialized) return;

    ReactGA.send({
      hitType: 'pageview',
      page,
    });
  }, [sendPageView, page]);

  return <>{children}</>;
};

export default GoogleAnalytics;
