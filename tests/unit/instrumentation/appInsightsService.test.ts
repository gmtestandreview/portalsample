import { describe, afterEach, it, expect } from 'vitest';

describe('appInsightsService', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });
  it('creates and initializes telemetry with the configured connection string', async () => {
    expect.assertions(1);
    const loadAppInsights = vi.fn();
    const applicationInsightsCtor = vi.fn(function ApplicationInsights(
      this: any,
    ) {
      this.loadAppInsights = loadAppInsights;
    });
    const reactPluginCtor = vi.fn(function ReactPlugin(this: any) {
      this.plugin = 'react';
    });
    vi.doMock(
      import('@microsoft/applicationinsights-web'),
      () =>
        ({
          ApplicationInsights: applicationInsightsCtor,
        }) satisfies __ExactMockModule<__TestMockModule57>,
    );
    vi.doMock(
      import('@microsoft/applicationinsights-react-js'),
      () =>
        ({
          ReactPlugin: reactPluginCtor,
        }) satisfies __ExactMockModule<__TestMockModule58>,
    );
    vi.doMock(
      import('@/env'),
      () =>
        ({
          env: {
            VITE_APPINSIGHTS_CONN_STRING:
              'InstrumentationConnectionString=test-value',
          },
        }) satisfies __ExactMockModule<__TestMockModule10>,
    );
    const module = await import('@/instrumentation/AppInsightsService');
    expect(reactPluginCtor).toHaveBeenCalledTimes(1);
  });
});

describe('appInsightsService', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });
  it('creates and initializes telemetry with the configured connection string', async () => {
    expect.assertions(1);
    const loadAppInsights = vi.fn();
    const applicationInsightsCtor = vi.fn(function ApplicationInsights(
      this: any,
    ) {
      this.loadAppInsights = loadAppInsights;
    });
    const reactPluginCtor = vi.fn(function ReactPlugin(this: any) {
      this.plugin = 'react';
    });
    vi.doMock(
      import('@microsoft/applicationinsights-web'),
      () =>
        ({
          ApplicationInsights: applicationInsightsCtor,
        }) satisfies __ExactMockModule<__TestMockModule57>,
    );
    vi.doMock(
      import('@microsoft/applicationinsights-react-js'),
      () =>
        ({
          ReactPlugin: reactPluginCtor,
        }) satisfies __ExactMockModule<__TestMockModule58>,
    );
    vi.doMock(
      import('@/env'),
      () =>
        ({
          env: {
            VITE_APPINSIGHTS_CONN_STRING:
              'InstrumentationConnectionString=test-value',
          },
        }) satisfies __ExactMockModule<__TestMockModule10>,
    );
    const module = await import('@/instrumentation/AppInsightsService');
    expect(applicationInsightsCtor).toHaveBeenCalledTimes(1);
  });
});

describe('appInsightsService', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });
  it('creates and initializes telemetry with the configured connection string', async () => {
    expect.assertions(1);
    const loadAppInsights = vi.fn();
    const applicationInsightsCtor = vi.fn(function ApplicationInsights(
      this: any,
    ) {
      this.loadAppInsights = loadAppInsights;
    });
    const reactPluginCtor = vi.fn(function ReactPlugin(this: any) {
      this.plugin = 'react';
    });
    vi.doMock(
      import('@microsoft/applicationinsights-web'),
      () =>
        ({
          ApplicationInsights: applicationInsightsCtor,
        }) satisfies __ExactMockModule<__TestMockModule57>,
    );
    vi.doMock(
      import('@microsoft/applicationinsights-react-js'),
      () =>
        ({
          ReactPlugin: reactPluginCtor,
        }) satisfies __ExactMockModule<__TestMockModule58>,
    );
    vi.doMock(
      import('@/env'),
      () =>
        ({
          env: {
            VITE_APPINSIGHTS_CONN_STRING:
              'InstrumentationConnectionString=test-value',
          },
        }) satisfies __ExactMockModule<__TestMockModule10>,
    );
    const module = await import('@/instrumentation/AppInsightsService');
    expect(applicationInsightsCtor).toHaveBeenCalledWith({
      config: expect.objectContaining({
        connectionString: 'InstrumentationConnectionString=test-value',
        enableAutoRouteTracking: true,
        extensions: [expect.objectContaining({ plugin: 'react' })],
      }),
    });
  });
});

describe('appInsightsService', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });
  it('creates and initializes telemetry with the configured connection string', async () => {
    expect.assertions(1);
    const loadAppInsights = vi.fn();
    const applicationInsightsCtor = vi.fn(function ApplicationInsights(
      this: any,
    ) {
      this.loadAppInsights = loadAppInsights;
    });
    const reactPluginCtor = vi.fn(function ReactPlugin(this: any) {
      this.plugin = 'react';
    });
    vi.doMock(
      import('@microsoft/applicationinsights-web'),
      () =>
        ({
          ApplicationInsights: applicationInsightsCtor,
        }) satisfies __ExactMockModule<__TestMockModule57>,
    );
    vi.doMock(
      import('@microsoft/applicationinsights-react-js'),
      () =>
        ({
          ReactPlugin: reactPluginCtor,
        }) satisfies __ExactMockModule<__TestMockModule58>,
    );
    vi.doMock(
      import('@/env'),
      () =>
        ({
          env: {
            VITE_APPINSIGHTS_CONN_STRING:
              'InstrumentationConnectionString=test-value',
          },
        }) satisfies __ExactMockModule<__TestMockModule10>,
    );
    const module = await import('@/instrumentation/AppInsightsService');
    expect(loadAppInsights).toHaveBeenCalledTimes(1);
  });
});

describe('appInsightsService', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });
  it('creates and initializes telemetry with the configured connection string', async () => {
    expect.assertions(1);
    const loadAppInsights = vi.fn();
    const applicationInsightsCtor = vi.fn(function ApplicationInsights(
      this: any,
    ) {
      this.loadAppInsights = loadAppInsights;
    });
    const reactPluginCtor = vi.fn(function ReactPlugin(this: any) {
      this.plugin = 'react';
    });
    vi.doMock(
      import('@microsoft/applicationinsights-web'),
      () =>
        ({
          ApplicationInsights: applicationInsightsCtor,
        }) satisfies __ExactMockModule<__TestMockModule57>,
    );
    vi.doMock(
      import('@microsoft/applicationinsights-react-js'),
      () =>
        ({
          ReactPlugin: reactPluginCtor,
        }) satisfies __ExactMockModule<__TestMockModule58>,
    );
    vi.doMock(
      import('@/env'),
      () =>
        ({
          env: {
            VITE_APPINSIGHTS_CONN_STRING:
              'InstrumentationConnectionString=test-value',
          },
        }) satisfies __ExactMockModule<__TestMockModule10>,
    );
    const module = await import('@/instrumentation/AppInsightsService');
    expect(module.ai.reactPlugin).toEqual(
      expect.objectContaining({ plugin: 'react' }),
    );
  });
});
