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

const trackGAEvent = (label: string, evtCategory = 'dashboard') => {
  ReactGA.event({ action: 'Click', category: evtCategory, label });
};

const trackGAPii = () => {
  const piiFields = document.querySelectorAll<HTMLElement>('[data-pii]');
  if (piiFields.length === 0) return;

  const redactedEntries: [string, string][] = [];

  piiFields.forEach((field) => {
    const key = field.dataset['pii'] ?? ''; // dataset.pii is always defined — querySelectorAll('[data-pii]') guarantees the attribute exists
    redactedEntries.push([key, '[REDACTED]']);
  });

  const redactedData = Object.fromEntries(redactedEntries);

  ReactGA.send({
    hitType: 'event',
    category: 'form_viewed_sanitized',
    data: redactedData,
  });
};

const trackGAPageView = () => {
  ReactGA.send({ hitType: 'pageview', page: globalThis.location.pathname });
};

export default GoogleAnalytics;
export { trackGAEvent, trackGAPii, trackGAPageView };
