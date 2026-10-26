import { describe, afterEach, it, expect } from 'vitest';
import type { ApplicationInsights } from '@microsoft/applicationinsights-web';
import type { ReactPlugin } from '@microsoft/applicationinsights-react-js';

type ApplicationInsightsFactory = (
  ...args: ConstructorParameters<typeof ApplicationInsights>
) => InstanceType<typeof ApplicationInsights>;
type ReactPluginFactory = (
  ...args: ConstructorParameters<typeof ReactPlugin>
) => InstanceType<typeof ReactPlugin>;

describe('appInsightsService', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('creates and initializes telemetry with the configured connection string', async () => {
    expect.hasAssertions();

    const loadAppInsights = vi.fn<() => void>();
    const applicationInsightsCtor = vi.fn<ApplicationInsightsFactory>(
      function ApplicationInsightsMock() {
        return { loadAppInsights } as unknown as InstanceType<
          typeof ApplicationInsights
        >;
      },
    );
    const reactPluginCtor = vi.fn<ReactPluginFactory>(
      function ReactPluginMock() {
        return { plugin: 'react' } as unknown as InstanceType<
          typeof ReactPlugin
        >;
      },
    );

    vi.doMock(
      '@microsoft/applicationinsights-web',
      () =>
        ({
          ApplicationInsights: applicationInsightsCtor,
        }) satisfies __ExactMockModule<__TestMockModule57>,
    );
    vi.doMock(
      '@microsoft/applicationinsights-react-js',
      () =>
        ({
          ReactPlugin: reactPluginCtor,
        }) satisfies __ExactMockModule<__TestMockModule58>,
    );
    vi.doMock(
      '@/env',
      () =>
        ({
          env: {
            VITE_APPINSIGHTS_CONN_STRING:
              'InstrumentationConnectionString=test-value',
          },
        }) satisfies __ExactMockModule<__TestMockModule10>,
    );

    const module = await import('@/instrumentation/AppInsightsService');

    expect([
      reactPluginCtor.mock.calls.length,
      applicationInsightsCtor.mock.calls.length,
    ]).toStrictEqual([1, 1]);
    expect(applicationInsightsCtor).toHaveBeenCalledWith({
      config: expect.objectContaining({
        connectionString: 'InstrumentationConnectionString=test-value',
        enableAutoRouteTracking: true,
        extensions: [expect.objectContaining({ plugin: 'react' })],
      }),
    });
    expect(loadAppInsights).toHaveBeenCalledTimes(1);
    expect(module.ai.reactPlugin).toEqual(
      expect.objectContaining({ plugin: 'react' }),
    );
    expect(module.getAppInsights()).toEqual(
      expect.objectContaining({ loadAppInsights }),
    );
  });

  it('returns null services when the connection string is missing', async () => {
    expect.hasAssertions();

    const loadAppInsights = vi.fn<() => void>();
    const applicationInsightsCtor = vi.fn<ApplicationInsightsFactory>(
      function ApplicationInsightsMock() {
        return { loadAppInsights } as unknown as InstanceType<
          typeof ApplicationInsights
        >;
      },
    );

    vi.doMock(
      '@microsoft/applicationinsights-web',
      () =>
        ({
          ApplicationInsights: applicationInsightsCtor,
        }) satisfies __ExactMockModule<__TestMockModule57>,
    );
    vi.doMock(
      '@microsoft/applicationinsights-react-js',
      () =>
        ({
          ReactPlugin: vi.fn<ReactPluginFactory>(),
        }) satisfies __ExactMockModule<__TestMockModule58>,
    );
    vi.doMock(
      '@/env',
      () =>
        ({
          env: {
            VITE_APPINSIGHTS_CONN_STRING: undefined,
            VITE_ENVIRONMENT: 'development',
          },
        }) satisfies __ExactMockModule<__TestMockModule10>,
    );

    const module = await import('@/instrumentation/AppInsightsService');

    expect(applicationInsightsCtor).not.toHaveBeenCalled();
    expect(module.ai.appInsights).toBeNull();
    expect(module.ai.reactPlugin).toBeNull();
    expect(module.getAppInsights()).toBeNull();
  });

  it('warns about disabled telemetry only in runtime development environment', async () => {
    expect.hasAssertions();

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.doMock(
      import('@microsoft/applicationinsights-web'),
      () =>
        ({
          ApplicationInsights: vi.fn<ApplicationInsightsFactory>(),
        }) satisfies __ExactMockModule<__TestMockModule57>,
    );
    vi.doMock(
      '@microsoft/applicationinsights-react-js',
      () =>
        ({
          ReactPlugin: vi.fn<ReactPluginFactory>(),
        }) satisfies __ExactMockModule<__TestMockModule58>,
    );
    vi.doMock(
      '@/env',
      () =>
        ({
          env: {
            VITE_APPINSIGHTS_CONN_STRING: undefined,
            VITE_ENVIRONMENT: 'development',
          },
        }) satisfies __ExactMockModule<__TestMockModule10>,
    );

    await import('@/instrumentation/AppInsightsService');

    expect(warn).toHaveBeenCalledWith(
      '[AppInsights] Telemetry is DISABLED: missing connection string.',
    );
  });

  it('stays silent when telemetry is deliberately disabled with the dummy sentinel', async () => {
    expect.hasAssertions();

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.doMock(
      import('@microsoft/applicationinsights-web'),
      () =>
        ({
          ApplicationInsights: vi.fn<ApplicationInsightsFactory>(),
        }) satisfies __ExactMockModule<__TestMockModule57>,
    );
    vi.doMock(
      '@microsoft/applicationinsights-react-js',
      () =>
        ({
          ReactPlugin: vi.fn<ReactPluginFactory>(),
        }) satisfies __ExactMockModule<__TestMockModule58>,
    );
    // 'dummy-key' is how Storybook and local dev opt out on purpose. A
    // warning per module instantiation is noise there - 48 lines across the
    // Storybook suite - and it drowns out warnings that mean something.
    vi.doMock(
      '@/env',
      () =>
        ({
          env: {
            VITE_APPINSIGHTS_CONN_STRING: 'dummy-key',
            VITE_ENVIRONMENT: 'development',
          },
        }) satisfies __ExactMockModule<__TestMockModule10>,
    );

    const module = await import('@/instrumentation/AppInsightsService');

    expect(warn).not.toHaveBeenCalled();
    expect(module.ai.appInsights).toBeNull();
    expect(module.ai.reactPlugin).toBeNull();
  });

  it('does not warn about disabled telemetry outside the runtime development environment', async () => {
    expect.hasAssertions();

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.doMock(
      import('@microsoft/applicationinsights-web'),
      () =>
        ({
          ApplicationInsights: vi.fn<ApplicationInsightsFactory>(),
        }) satisfies __ExactMockModule<__TestMockModule57>,
    );
    vi.doMock(
      '@microsoft/applicationinsights-react-js',
      () =>
        ({
          ReactPlugin: vi.fn<ReactPluginFactory>(),
        }) satisfies __ExactMockModule<__TestMockModule58>,
    );
    vi.doMock(
      '@/env',
      () =>
        ({
          env: {
            VITE_APPINSIGHTS_CONN_STRING: 'dummy-key',
            VITE_ENVIRONMENT: 'production',
          },
        }) satisfies __ExactMockModule<__TestMockModule10>,
    );

    const module = await import('@/instrumentation/AppInsightsService');

    expect(warn).not.toHaveBeenCalled();
    expect(module.ai.appInsights).toBeNull();
    expect(module.ai.reactPlugin).toBeNull();
  });
});
