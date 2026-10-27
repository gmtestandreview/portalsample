import { describe, it, expect, vi } from 'vitest';
import type { ApplicationInsights } from '@microsoft/applicationinsights-web';
import type { ReactPlugin } from '@microsoft/applicationinsights-react-js';

type ApplicationInsightsFactory = (
  ...args: ConstructorParameters<typeof ApplicationInsights>
) => InstanceType<typeof ApplicationInsights>;
type ReactPluginFactory = (
  ...args: ConstructorParameters<typeof ReactPlugin>
) => InstanceType<typeof ReactPlugin>;

describe('appInsightsService', () => {
  const resetAppInsightsTest = () => {
    vi.resetModules();
    vi.restoreAllMocks();
  };

  it('creates and initializes telemetry with the configured connection string', async () => {
    expect.hasAssertions();

    resetAppInsightsTest();

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
      import('@microsoft/applicationinsights-web') as unknown as string,
      () =>
        ({
          ApplicationInsights: applicationInsightsCtor,
        }) satisfies __ExactMockModule<__TestMockModule57>,
    );
    vi.doMock(
      import('@microsoft/applicationinsights-react-js') as unknown as string,
      () =>
        ({
          ReactPlugin: reactPluginCtor,
        }) satisfies __ExactMockModule<__TestMockModule58>,
    );
    vi.doMock(
      import('@/env') as unknown as string,
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
    expect(module.ai.reactPlugin).toStrictEqual(
      expect.objectContaining({ plugin: 'react' }),
    );
    expect(module.getAppInsights()).toStrictEqual(
      expect.objectContaining({ loadAppInsights }),
    );
  });

  it('returns null services when the connection string is missing', async () => {
    expect.hasAssertions();

    resetAppInsightsTest();

    const loadAppInsights = vi.fn<() => void>();
    const applicationInsightsCtor = vi.fn<ApplicationInsightsFactory>(
      function ApplicationInsightsMock() {
        return { loadAppInsights } as unknown as InstanceType<
          typeof ApplicationInsights
        >;
      },
    );

    vi.doMock(
      import('@microsoft/applicationinsights-web') as unknown as string,
      () =>
        ({
          ApplicationInsights: applicationInsightsCtor,
        }) satisfies __ExactMockModule<__TestMockModule57>,
    );
    vi.doMock(
      import('@microsoft/applicationinsights-react-js') as unknown as string,
      () =>
        ({
          ReactPlugin: vi.fn<ReactPluginFactory>(),
        }) satisfies __ExactMockModule<__TestMockModule58>,
    );
    vi.doMock(
      import('@/env') as unknown as string,
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

    resetAppInsightsTest();

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.doMock(
      import('@microsoft/applicationinsights-web') as unknown as string,
      () =>
        ({
          ApplicationInsights: vi.fn<ApplicationInsightsFactory>(),
        }) satisfies __ExactMockModule<__TestMockModule57>,
    );
    vi.doMock(
      import('@microsoft/applicationinsights-react-js') as unknown as string,
      () =>
        ({
          ReactPlugin: vi.fn<ReactPluginFactory>(),
        }) satisfies __ExactMockModule<__TestMockModule58>,
    );
    vi.doMock(
      import('@/env') as unknown as string,
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

    resetAppInsightsTest();

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.doMock(
      import('@microsoft/applicationinsights-web') as unknown as string,
      () =>
        ({
          ApplicationInsights: vi.fn<ApplicationInsightsFactory>(),
        }) satisfies __ExactMockModule<__TestMockModule57>,
    );
    vi.doMock(
      import('@microsoft/applicationinsights-react-js') as unknown as string,
      () =>
        ({
          ReactPlugin: vi.fn<ReactPluginFactory>(),
        }) satisfies __ExactMockModule<__TestMockModule58>,
    );
    // 'dummy-key' is how Storybook and local dev opt out on purpose. A
    // warning per module instantiation is noise there - 48 lines across the
    // Storybook suite - and it drowns out warnings that mean something.
    vi.doMock(
      import('@/env') as unknown as string,
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

    resetAppInsightsTest();

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.doMock(
      import('@microsoft/applicationinsights-web') as unknown as string,
      () =>
        ({
          ApplicationInsights: vi.fn<ApplicationInsightsFactory>(),
        }) satisfies __ExactMockModule<__TestMockModule57>,
    );
    vi.doMock(
      import('@microsoft/applicationinsights-react-js') as unknown as string,
      () =>
        ({
          ReactPlugin: vi.fn<ReactPluginFactory>(),
        }) satisfies __ExactMockModule<__TestMockModule58>,
    );
    vi.doMock(
      import('@/env') as unknown as string,
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
