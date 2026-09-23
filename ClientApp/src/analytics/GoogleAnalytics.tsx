import { useEffect } from 'react';
import ReactGa from 'react-ga4';
import { env } from '../env.ts';
import type { GoogleAnalyticsProps } from './types.ts';

const GoogleAnalytics = ({
  children,
  anonymiseIp,
  testMode,
  sendPageView: _sendPageView,
}: GoogleAnalyticsProps) => {
  useEffect(() => {
    const trackId = env.REACT_APP_GA_TRACKINGID;
    if (trackId && ReactGa.isInitialized === false) {
      ReactGa.initialize([
        {
          trackingId: trackId,
          gaOptions: {
            anonymizeIp: anonymiseIp,
            testMode,
          },
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testMode, anonymiseIp]);

  return <>{children}</>;
};

const trackGAEvent = (label: string, evtCategory = 'dashboard') => {
  ReactGa.event({ action: 'Click', category: evtCategory, label });
};

const trackGAPii = () => {
  const piiFields = document.querySelectorAll<HTMLElement>('[data-pii]');
  if (piiFields.length === 0) return;

  const originalData: Record<string, string> = {};
  const redactedData: Record<string, string> = {};

  piiFields.forEach((field) => {
    const key = field.dataset.pii as string; // dataset.pii is always defined — querySelectorAll('[data-pii]') guarantees the attribute exists
    /* v8 ignore next */
    originalData[key] = field.textContent ?? '';
    redactedData[key] = '[REDACTED]';
  });

  if (globalThis.location.hostname === 'localhost') {
    // eslint-disable-next-line no-console
    console.table({ originalData });
  }

  ReactGa.send({
    hitType: 'event',
    category: 'form_viewed_sanitized',
    data: redactedData,
  });
};

const trackGAPageView = () => {
  ReactGa.send({ hitType: 'pageview', page: globalThis.location.pathname });
};

export default GoogleAnalytics;
export { trackGAEvent, trackGAPageView, trackGAPii };
