import { SeverityLevel } from '@microsoft/applicationinsights-common';
import { afterEach, describe, expect, it, vi } from 'vitest';

const importLoggerWithInsights = async (insights: unknown) => {
  vi.resetModules();
  const getAppInsights = vi.fn<() => unknown>(() => insights);
  vi.doMock(
    '@/instrumentation/AppInsightsService',
    () =>
      ({
        getAppInsights,
      }) satisfies __ExactMockModule<__TestMockModule15>,
  );
  const { default: AppLogger } = await import('@/instrumentation/AppLogger');
  return { AppLogger, getAppInsights };
};

describe('appLogger', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('delegates trace severity helpers to App Insights', async () => {
    expect.hasAssertions();

    const insights = {
      trackTrace: vi.fn<(...args: unknown[]) => void>(),
    };
    const { AppLogger } = await importLoggerWithInsights(insights);
    const properties = { requestId: 'abc-123' };

    AppLogger.info('Information message', properties);
    AppLogger.warning('Warning message', properties);
    AppLogger.verbose('Verbose message', properties);
    AppLogger.critical('Critical message', properties);
    AppLogger.trace('Trace message', SeverityLevel.Error, properties);

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
    expect.hasAssertions();

    const insights = {
      trackException: vi.fn<(...args: unknown[]) => void>(),
      trackEvent: vi.fn<(...args: unknown[]) => void>(),
      startTrackPage: vi.fn<(...args: unknown[]) => void>(),
      stopTrackPage: vi.fn<(...args: unknown[]) => void>(),
      startTrackEvent: vi.fn<(...args: unknown[]) => void>(),
      stopTrackEvent: vi.fn<(...args: unknown[]) => void>(),
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
    expect({
      startTrackPage: insights.startTrackPage.mock.calls,
      stopTrackPage: insights.stopTrackPage.mock.calls,
      startTrackEvent: insights.startTrackEvent.mock.calls,
      stopTrackEvent: insights.stopTrackEvent.mock.calls,
    }).toStrictEqual({
      startTrackPage: [['Dashboard']],
      stopTrackPage: [['Dashboard']],
      startTrackEvent: [['Save']],
      stopTrackEvent: [['Save']],
    });
  });

  it('does not throw or delegate when App Insights is unavailable', async () => {
    expect.hasAssertions();

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
