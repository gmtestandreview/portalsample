describe('AppInsightsService', () => {
    afterEach(() => {
        vi.resetModules();
        vi.restoreAllMocks();
    });

    it('creates and initializes telemetry with the configured connection string', async () => {
        const loadAppInsights = vi.fn();
        const applicationInsightsCtor = vi.fn(function ApplicationInsights(this: any) {
            this.loadAppInsights = loadAppInsights;
        });
        const reactPluginCtor = vi.fn(function ReactPlugin(this: any) {
            this.plugin = 'react';
        });

        vi.doMock('@microsoft/applicationinsights-web', () => ({
            ApplicationInsights: applicationInsightsCtor,
        }));
        vi.doMock('@microsoft/applicationinsights-react-js', () => ({
            ReactPlugin: reactPluginCtor,
        }));
        vi.doMock('@/env', () => ({
            env: {
                REACT_APP_APPINSIGHTS_CONN_STRING: 'InstrumentationConnectionString=test-value',
            },
        }));

        const module = await import('@/instrumentation/AppInsightsService');

        expect(reactPluginCtor).toHaveBeenCalledTimes(1);
        expect(applicationInsightsCtor).toHaveBeenCalledTimes(1);
        expect(applicationInsightsCtor).toHaveBeenCalledWith({
            config: expect.objectContaining({
                connectionString: 'InstrumentationConnectionString=test-value',
                enableAutoRouteTracking: true,
                extensions: [expect.objectContaining({ plugin: 'react' })],
            }),
        });
        expect(loadAppInsights).toHaveBeenCalledTimes(1);
        expect(module.ai.reactPlugin).toEqual(expect.objectContaining({ plugin: 'react' }));
        expect(module.getAppInsights()).toEqual(expect.objectContaining({ loadAppInsights }));
    });

    it('returns null services when the connection string is missing', async () => {
        const loadAppInsights = vi.fn();
        const applicationInsightsCtor = vi.fn(function ApplicationInsights(this: any) {
            this.loadAppInsights = loadAppInsights;
        });

        vi.doMock('@microsoft/applicationinsights-web', () => ({
            ApplicationInsights: applicationInsightsCtor,
        }));
        vi.doMock('@microsoft/applicationinsights-react-js', () => ({
            ReactPlugin: vi.fn(function ReactPlugin() {}),
        }));
        vi.doMock('@/env', () => ({
            env: {
                REACT_APP_APPINSIGHTS_CONN_STRING: undefined,
            },
        }));

        const module = await import('@/instrumentation/AppInsightsService');

        expect(applicationInsightsCtor).not.toHaveBeenCalled();
        expect(module.ai.appInsights).toBeNull();
        expect(module.ai.reactPlugin).toBeNull();
        expect(module.getAppInsights()).toBeNull();
    });

    it('warns about disabled telemetry only in runtime development environment', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        vi.doMock('@microsoft/applicationinsights-web', () => ({
            ApplicationInsights: vi.fn(),
        }));
        vi.doMock('@microsoft/applicationinsights-react-js', () => ({
            ReactPlugin: vi.fn(function ReactPlugin() {}),
        }));
        vi.doMock('@/env', () => ({
            env: {
                REACT_APP_APPINSIGHTS_CONN_STRING: undefined,
                REACT_APP_ENVIRONMENT: 'development',
            },
        }));

        await import('@/instrumentation/AppInsightsService');

        expect(warn).toHaveBeenCalledWith(
            '[AppInsights] Telemetry is DISABLED: missing connection string.',
        );
    });

    it('stays silent when telemetry is deliberately disabled with the dummy sentinel', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        vi.doMock('@microsoft/applicationinsights-web', () => ({
            ApplicationInsights: vi.fn(),
        }));
        vi.doMock('@microsoft/applicationinsights-react-js', () => ({
            ReactPlugin: vi.fn(function ReactPlugin() {}),
        }));
        // 'dummy-key' is how Storybook and local dev opt out on purpose. A
        // warning per module instantiation is noise there - 48 lines across the
        // Storybook suite - and it drowns out warnings that mean something.
        vi.doMock('@/env', () => ({
            env: {
                REACT_APP_APPINSIGHTS_CONN_STRING: 'dummy-key',
                REACT_APP_ENVIRONMENT: 'development',
            },
        }));

        const module = await import('@/instrumentation/AppInsightsService');

        expect(warn).not.toHaveBeenCalled();
        expect(module.ai.appInsights).toBeNull();
        expect(module.ai.reactPlugin).toBeNull();
    });

    it('does not warn about disabled telemetry outside the runtime development environment', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        vi.doMock('@microsoft/applicationinsights-web', () => ({
            ApplicationInsights: vi.fn(),
        }));
        vi.doMock('@microsoft/applicationinsights-react-js', () => ({
            ReactPlugin: vi.fn(function ReactPlugin() {}),
        }));
        vi.doMock('@/env', () => ({
            env: {
                REACT_APP_APPINSIGHTS_CONN_STRING: 'dummy-key',
                REACT_APP_ENVIRONMENT: 'production',
            },
        }));

        const module = await import('@/instrumentation/AppInsightsService');

        expect(warn).not.toHaveBeenCalled();
        expect(module.ai.appInsights).toBeNull();
        expect(module.ai.reactPlugin).toBeNull();
    });
});
