import { SeverityLevel } from '@microsoft/applicationinsights-common';

import { afterEach, describe, expect, it, vi } from 'vitest';

const importLoggerWithInsights = async (insights: unknown) => {
  vi.resetModules();
  const getAppInsights = vi.fn(() => insights);
  vi.doMock(
    import('@/instrumentation/AppInsightsService'),
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
    expect.assertions(1);
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
  });
});

describe('appLogger', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });
  it('delegates trace severity helpers to App Insights', async () => {
    expect.assertions(1);
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
    expect(insights.trackTrace).toHaveBeenNthCalledWith(1, {
      message: 'Information message',
      severityLevel: SeverityLevel.Information,
      properties,
    });
  });
});

describe('appLogger', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });
  it('delegates trace severity helpers to App Insights', async () => {
    expect.assertions(1);
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
    expect(insights.trackTrace).toHaveBeenNthCalledWith(2, {
      message: 'Warning message',
      severityLevel: SeverityLevel.Warning,
      properties,
    });
  });
});

describe('appLogger', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });
  it('delegates trace severity helpers to App Insights', async () => {
    expect.assertions(1);
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
    expect(insights.trackTrace).toHaveBeenNthCalledWith(3, {
      message: 'Verbose message',
      severityLevel: SeverityLevel.Verbose,
      properties,
    });
  });
});

describe('appLogger', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });
  it('delegates trace severity helpers to App Insights', async () => {
    expect.assertions(1);
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
    expect(insights.trackTrace).toHaveBeenNthCalledWith(4, {
      message: 'Critical message',
      severityLevel: SeverityLevel.Critical,
      properties,
    });
  });
});
