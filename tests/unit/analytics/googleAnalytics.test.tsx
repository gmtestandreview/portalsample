import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const reactGaMock = vi.hoisted(() => ({
    event: vi.fn(),
    initialize: vi.fn(),
    isInitialized: false,
    send: vi.fn(),
}));

vi.mock('react-ga4', () => ({
    default: reactGaMock,
}));

describe('GoogleAnalytics', () => {
    afterEach(() => {
        vi.clearAllMocks();
        reactGaMock.isInitialized = false;
        document.body.innerHTML = '';
    });

    it('initializes ReactGA with configured tracking options and renders children', async () => {
        const { default: GoogleAnalytics } = await import('../../../ClientApp/src/analytics/GoogleAnalytics');

        render(
            <GoogleAnalytics anonymiseIp testMode>
                <span>Analytics child</span>
            </GoogleAnalytics>,
        );

        expect(screen.getByText('Analytics child')).toBeInTheDocument();
        expect(reactGaMock.initialize).toHaveBeenCalledWith([{
            trackingId: 'test-ga-id',
            gaOptions: {
                anonymizeIp: true,
                testMode: true,
            },
        }]);
    });

    it('does not initialize ReactGA when it is already initialized', async () => {
        reactGaMock.isInitialized = true;
        const { default: GoogleAnalytics } = await import('../../../ClientApp/src/analytics/GoogleAnalytics');

        render(<GoogleAnalytics />);

        expect(reactGaMock.initialize).not.toHaveBeenCalled();
    });

    it('tracks click events with the default dashboard category', async () => {
        const { trackGAEvent } = await import('../../../ClientApp/src/analytics/GoogleAnalytics');

        trackGAEvent('Open request');

        expect(reactGaMock.event).toHaveBeenCalledWith({
            action: 'Click',
            category: 'dashboard',
            label: 'Open request',
        });
    });

    it('tracks click events with a custom category', async () => {
        const { trackGAEvent } = await import('../../../ClientApp/src/analytics/GoogleAnalytics');

        trackGAEvent('Submit quote', 'quote');

        expect(reactGaMock.event).toHaveBeenCalledWith({
            action: 'Click',
            category: 'quote',
            label: 'Submit quote',
        });
    });

    it('tracks the current page path', async () => {
        globalThis.history.pushState({}, '', '/dashboard');
        const { trackGAPageView } = await import('../../../ClientApp/src/analytics/GoogleAnalytics');

        trackGAPageView();

        expect(reactGaMock.send).toHaveBeenCalledWith({
            hitType: 'pageview',
            page: '/dashboard',
        });
    });

    it('does not send sanitized PII event when no data-pii fields exist', async () => {
        const { trackGAPii } = await import('../../../ClientApp/src/analytics/GoogleAnalytics');

        trackGAPii();

        expect(reactGaMock.send).not.toHaveBeenCalled();
    });

    it('sends redacted PII field names when data-pii fields exist', async () => {
        document.body.innerHTML = `
            <input data-pii="email" value="user@example.test" />
            <input data-pii="phone" value="0400000000" />
        `;
        // JSDOM defaults hostname to 'localhost'; override to avoid triggering the console.table branch
        const origLocation = globalThis.location;
        Object.defineProperty(globalThis, 'location', {
            configurable: true,
            value: { ...origLocation, hostname: 'portal.measurement.gov.au' },
        });

        const { trackGAPii } = await import('../../../ClientApp/src/analytics/GoogleAnalytics');

        trackGAPii();

        expect(reactGaMock.send).toHaveBeenCalledWith({
            hitType: 'event',
            category: 'form_viewed_sanitized',
            data: {
                email: '[REDACTED]',
                phone: '[REDACTED]',
            },
        });

        Object.defineProperty(globalThis, 'location', { configurable: true, value: origLocation });
    });

    it('logs original PII data to console.table when running on localhost', async () => {
        document.body.innerHTML = '<span data-pii="name">Alice</span>';
        const consoleSpy = vi.spyOn(console, 'table').mockImplementation(() => {});
        const origLocation = globalThis.location;
        Object.defineProperty(globalThis, 'location', {
            configurable: true,
            value: { ...origLocation, hostname: 'localhost' },
        });

        const { trackGAPii } = await import('../../../ClientApp/src/analytics/GoogleAnalytics');
        trackGAPii();

        expect(consoleSpy).toHaveBeenCalledWith({ originalData: { name: 'Alice' } });
        expect(reactGaMock.send).toHaveBeenCalled();

        Object.defineProperty(globalThis, 'location', { configurable: true, value: origLocation });
        consoleSpy.mockRestore();
    });

    it('does not call console.table when hostname is not localhost', async () => {
        document.body.innerHTML = '<span data-pii="name">Bob</span>';
        const consoleSpy = vi.spyOn(console, 'table').mockImplementation(() => {});
        const origLocation = globalThis.location;
        Object.defineProperty(globalThis, 'location', {
            configurable: true,
            value: { ...origLocation, hostname: 'portal.measurement.gov.au' },
        });

        const { trackGAPii } = await import('../../../ClientApp/src/analytics/GoogleAnalytics');
        trackGAPii();

        expect(consoleSpy).not.toHaveBeenCalled();
        expect(reactGaMock.send).toHaveBeenCalled();

        Object.defineProperty(globalThis, 'location', { configurable: true, value: origLocation });
        consoleSpy.mockRestore();
    });
});
