import ReactGA from 'react-ga4';
import { useEffect } from 'react';
import type { GoogleAnalyticsProps } from './types';
import { env } from '../env';

const GoogleAnalytics = ({
  children,
  anonymiseIp,
  testMode,
  sendPageView: _sendPageView,
}: Readonly<GoogleAnalyticsProps>) => {
  useEffect(() => {
    const trackId = env.VITE_GA_TRACKINGID;
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

  return <>{children}</>;
};

export default GoogleAnalytics;
