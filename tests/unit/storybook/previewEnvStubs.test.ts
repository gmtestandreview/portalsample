import { describe, expect, it, vi } from 'vitest';

// The Storybook preview stubs runtime config on globalThis. Those stub values
// decide whether the real Application Insights SDK boots inside Storybook, so
// they are behaviour, not decoration: a connection string the service treats as
// live makes every story load reach out to js.monitor.azure.com.
describe('Storybook runtime env stubs', () => {
    it('disables Application Insights telemetry', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        vi.resetModules();

        await import('../../../.storybook/preview-setup');

        const loadAppInsights = vi.fn();
        const applicationInsightsCtor = vi.fn(function ApplicationInsights(this: { loadAppInsights: () => void }) {
            this.loadAppInsights = loadAppInsights;
        });
        vi.doMock('@microsoft/applicationinsights-web', () => ({
            ApplicationInsights: applicationInsightsCtor,
        }));
        vi.doMock('@microsoft/applicationinsights-react-js', () => ({
            ReactPlugin: vi.fn(function ReactPlugin() {}),
        }));

        const module = await import('@/instrumentation/AppInsightsService');

        expect(applicationInsightsCtor).not.toHaveBeenCalled();
        expect(module.ai.appInsights).toBeNull();
        expect(module.ai.reactPlugin).toBeNull();
    });
});
