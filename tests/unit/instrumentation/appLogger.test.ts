import { SeverityLevel } from '@microsoft/applicationinsights-common';
import {
    afterEach, describe, expect, it, vi,
} from 'vitest';

const importLoggerWithInsights = async (insights: unknown) => {
    vi.resetModules();
    const getAppInsights = vi.fn(() => insights);
    vi.doMock('@/instrumentation/AppInsightsService', () => ({
        getAppInsights,
    }));
    const { default: AppLogger } = await import('@/instrumentation/AppLogger');
    return { AppLogger, getAppInsights };
};

describe('AppLogger', () => {
    afterEach(() => {
        vi.resetModules();
        vi.restoreAllMocks();
    });

    it('delegates trace severity helpers to App Insights', async () => {
        const insights = {
            trackTrace: vi.fn(),
        };
        const { AppLogger } = await importLoggerWithInsights(insights);
        const properties = { requestId: 'abc-123' };

        AppLogger.info('Information message', properties);
        AppLogger.warning('Warning message', properties);
        AppLogger.verbose('Verbose message', properties);
        AppLogger.critical('Critical message', properties);
        AppLogger.trace('Trace message', SeverityLevel.Error, properties);

        expect(insights.trackTrace).toHaveBeenCalledTimes(5);
        expect(insights.trackTrace).toHaveBeenNthCalledWith(1, {
            message: 'Information message',
            severityLevel: SeverityLevel.Information,
            properties,
        });
        expect(insights.trackTrace).toHaveBeenNthCalledWith(2, {
            message: 'Warning message',
            severityLevel: SeverityLevel.Warning,
            properties,
        });
        expect(insights.trackTrace).toHaveBeenNthCalledWith(3, {
            message: 'Verbose message',
            severityLevel: SeverityLevel.Verbose,
            properties,
        });
        expect(insights.trackTrace).toHaveBeenNthCalledWith(4, {
            message: 'Critical message',
            severityLevel: SeverityLevel.Critical,
            properties,
        });
        expect(insights.trackTrace).toHaveBeenNthCalledWith(5, {
            message: 'Trace message',
            severityLevel: SeverityLevel.Error,
            properties,
        });
    });

    it('delegates exception, event, page, and event timing calls to App Insights', async () => {
        const insights = {
            trackException: vi.fn(),
            trackEvent: vi.fn(),
            startTrackPage: vi.fn(),
            stopTrackPage: vi.fn(),
            startTrackEvent: vi.fn(),
            stopTrackEvent: vi.fn(),
        };
        const { AppLogger } = await importLoggerWithInsights(insights);
        const error = new Error('Boom');
        const properties = { requestId: 'abc-123' };

        AppLogger.error('Failed to save', error, properties);
        AppLogger.trackEvent('Save clicked', properties);
        AppLogger.startTrackPage('Dashboard');
        AppLogger.stopTrackPage('Dashboard');
        AppLogger.startTrackEvent('Save');
        AppLogger.stopTrackEvent('Save');

        expect(insights.trackException).toHaveBeenCalledWith({
            message: 'Failed to save',
            severityLevel: SeverityLevel.Error,
            error,
            properties,
        });
        expect(insights.trackEvent).toHaveBeenCalledWith({
            name: 'Save clicked',
            properties,
        });
        expect(insights.startTrackPage).toHaveBeenCalledWith('Dashboard');
        expect(insights.stopTrackPage).toHaveBeenCalledWith('Dashboard');
        expect(insights.startTrackEvent).toHaveBeenCalledWith('Save');
        expect(insights.stopTrackEvent).toHaveBeenCalledWith('Save');
    });

    it('does not throw or delegate when App Insights is unavailable', async () => {
        const { AppLogger, getAppInsights } = await importLoggerWithInsights(null);
        const error = new Error('Unavailable');

        expect(() => {
            AppLogger.info('Info');
            AppLogger.warning('Warning');
            AppLogger.verbose('Verbose');
            AppLogger.critical('Critical');
            AppLogger.trace('Trace', SeverityLevel.Information);
            AppLogger.error('Error', error);
            AppLogger.trackEvent('Event');
            AppLogger.startTrackPage('Page');
            AppLogger.stopTrackPage('Page');
            AppLogger.startTrackEvent('Event');
            AppLogger.stopTrackEvent('Event');
        }).not.toThrow();
        expect(getAppInsights).toHaveBeenCalledTimes(11);
    });
});
