import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type * as ReactGaModule from 'react-ga4';
import { env } from '../../../ClientApp/src/env';

const reactGaMock = vi.hoisted(() => ({
  event:
    vi.fn<
      (event: { action: string; category: string; label: string }) => void
    >(),
  initialize: vi.fn<(options: unknown) => void>(),
  isInitialized: false,
  send: vi.fn<(payload: Record<string, unknown>) => void>(),
}));

vi.mock(import('react-ga4'), (async (
  importOriginal: Parameters<__DynamicPartialMockFactory<__TestMockModule1>>[0],
) => {
  const actual = await importOriginal<typeof ReactGaModule>();

  return {
    ...actual,
    default: {
      ...actual.default,
      ...reactGaMock,
      get isInitialized() {
        return reactGaMock.isInitialized;
      },
    },
  } satisfies __ExactMockModule<__TestMockModule1>;
}) as unknown as __DynamicPartialMockFactory<__TestMockModule1>);

describe('googleAnalytics', () => {
  const resetAnalyticsState = () => {
    vi.clearAllMocks();
    reactGaMock.isInitialized = false;
    document.body.innerHTML = '';
  };

  it('initializes ReactGA with configured tracking options and renders children', async () => {
    expect.hasAssertions();

    resetAnalyticsState();

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

  it('does not initialize ReactGA when it is already initialized', async () => {
    expect.hasAssertions();

    resetAnalyticsState();

    reactGaMock.isInitialized = true;
    const { default: GoogleAnalytics } =
      await import('../../../ClientApp/src/analytics/GoogleAnalytics');

    render(<GoogleAnalytics />);

    expect(reactGaMock.initialize).not.toHaveBeenCalled();
  });

  it('does not initialize ReactGA when no tracking ID is configured', async () => {
    expect.hasAssertions();

    resetAnalyticsState();

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

  it('tracks click events with the default dashboard category', async () => {
    expect.hasAssertions();

    resetAnalyticsState();

    const { trackGAEvent } =
      await import('../../../ClientApp/src/analytics/GoogleAnalytics');

    trackGAEvent('Open request');

    expect(reactGaMock.event).toHaveBeenCalledWith({
      action: 'Click',
      category: 'dashboard',
      label: 'Open request',
    });
  });

  it('tracks click events with a custom category', async () => {
    expect.hasAssertions();

    resetAnalyticsState();

    const { trackGAEvent } =
      await import('../../../ClientApp/src/analytics/GoogleAnalytics');

    trackGAEvent('Submit quote', 'quote');

    expect(reactGaMock.event).toHaveBeenCalledWith({
      action: 'Click',
      category: 'quote',
      label: 'Submit quote',
    });
  });

  it('tracks the current page path', async () => {
    expect.hasAssertions();

    resetAnalyticsState();

    globalThis.history.pushState({}, '', '/dashboard');
    const { trackGAPageView } =
      await import('../../../ClientApp/src/analytics/GoogleAnalytics');

    trackGAPageView();

    expect(reactGaMock.send).toHaveBeenCalledWith({
      hitType: 'pageview',
      page: '/dashboard',
    });
  });

  it('does not send sanitized PII event when no data-pii fields exist', async () => {
    expect.hasAssertions();

    resetAnalyticsState();

    const { trackGAPii } =
      await import('../../../ClientApp/src/analytics/GoogleAnalytics');

    trackGAPii();

    expect(reactGaMock.send).not.toHaveBeenCalled();
  });

  it('sends redacted PII field names when data-pii fields exist', async () => {
    expect.hasAssertions();

    resetAnalyticsState();

    document.body.innerHTML = `
            <input data-pii="email" value="user@example.test" />
            <input data-pii="phone" value="0400000000" />
        `;
    const consoleSpy = vi
      .spyOn(console, 'table')
      .mockImplementation(() => undefined);

    try {
      const { trackGAPii } =
        await import('../../../ClientApp/src/analytics/GoogleAnalytics');

      trackGAPii();

      expect(consoleSpy).not.toHaveBeenCalled();
      expect(reactGaMock.send).toHaveBeenCalledWith({
        hitType: 'event',
        category: 'form_viewed_sanitized',
        data: {
          email: '[REDACTED]',
          phone: '[REDACTED]',
        },
      });
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
