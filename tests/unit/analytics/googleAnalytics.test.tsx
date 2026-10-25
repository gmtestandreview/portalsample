import { render, screen } from '@testing-library/react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { env } from '../../../ClientApp/src/env';

const reactGaMock = vi.hoisted(() => ({
  event: vi.fn(),
  initialize: vi.fn(),
  isInitialized: false,
  send: vi.fn(),
}));

vi.mock(
  import('react-ga4'),
  () =>
    ({
      default: reactGaMock,
    }) satisfies __ExactMockModule<__TestMockModule1>,
);

describe('googleAnalytics', () => {
  afterEach(() => {
    vi.clearAllMocks();
    reactGaMock.isInitialized = false;
    document.body.innerHTML = '';
  });
  it('initializes ReactGA with configured tracking options and renders children', async () => {
    expect.assertions(2);
    const { default: GoogleAnalytics } =
      await import('../../../ClientApp/src/analytics/GoogleAnalytics');

    render(
      <GoogleAnalytics anonymiseIp testMode>
        <span>Analytics child</span>
      </GoogleAnalytics>,
    );

    expect(screen.getByText('Analytics child')).toBeInTheDocument();
    expect(reactGaMock.initialize).toHaveBeenCalledWith([
      {
        trackingId: 'test-ga-id',
        gaOptions: {
          anonymizeIp: true,
          testMode: true,
        },
      },
    ]);
  });
});

describe('googleAnalytics', () => {
  afterEach(() => {
    vi.clearAllMocks();
    reactGaMock.isInitialized = false;
    document.body.innerHTML = '';
  });
  it('does not initialize ReactGA when it is already initialized', async () => {
    expect.assertions(1);
    reactGaMock.isInitialized = true;
    const { default: GoogleAnalytics } =
      await import('../../../ClientApp/src/analytics/GoogleAnalytics');

    render(<GoogleAnalytics />);

    expect(reactGaMock.initialize).not.toHaveBeenCalled();
  });
});

describe('googleAnalytics', () => {
  afterEach(() => {
    vi.clearAllMocks();
    reactGaMock.isInitialized = false;
    document.body.innerHTML = '';
  });
  it('does not initialize ReactGA when no tracking ID is configured', async () => {
    expect.assertions(1);
    const originalTrackingId = env.VITE_GA_TRACKINGID;
    env.VITE_GA_TRACKINGID = '';
    const { default: GoogleAnalytics } =
      await import('../../../ClientApp/src/analytics/GoogleAnalytics');

    try {
      render(<GoogleAnalytics />);

      expect(reactGaMock.initialize).not.toHaveBeenCalled();
    } finally {
      env.VITE_GA_TRACKINGID = originalTrackingId;
    }
  });
});

describe('googleAnalytics', () => {
  afterEach(() => {
    vi.clearAllMocks();
    reactGaMock.isInitialized = false;
    document.body.innerHTML = '';
  });
  it('tracks click events with the default dashboard category', async () => {
    expect.assertions(1);
    const { trackGAEvent } =
      await import('../../../ClientApp/src/analytics/GoogleAnalytics');

    trackGAEvent('Open request');

    expect(reactGaMock.event).toHaveBeenCalledWith({
      action: 'Click',
      category: 'dashboard',
      label: 'Open request',
    });
  });
});
