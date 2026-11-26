import ReactGA from 'react-ga4';

const trackGAEvent = (label: string, evtCategory = 'dashboard') => {
  ReactGA.event({ action: 'Click', category: evtCategory, label });
};

const trackGAPii = () => {
  const piiFields = document.querySelectorAll<HTMLElement>('[data-pii]');
  if (piiFields.length === 0) return;

  const redactedEntries: [string, string][] = [];

  piiFields.forEach((field) => {
    const key = field.dataset['pii'] ?? ''; // Preserve empty markers without reading field values.
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

export { trackGAEvent, trackGAPii, trackGAPageView };
