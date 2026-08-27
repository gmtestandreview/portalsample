import { readFileSync } from 'node:fs';
import { test, expect, vi, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { createElement } from 'react';
import getUnexpectedErrorRoute from '../ClientApp/src/routes/common/errorRoutes';
import { HttpStatusCode } from '../ClientApp/src/types';
import SessionStorageCache from '../ClientApp/src/storage/sessionStorageCache';

afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
    document.body.innerHTML = '';
});

test('BUG-001: Gone status resolves to the router-owned error page', () => {
    expect(getUnexpectedErrorRoute(HttpStatusCode.Gone)).toBe('/no-longer-available');
});

test('BUG-002: malformed session storage values fail soft instead of throwing', () => {
    window.sessionStorage.setItem('accepted-quote-id', 'not-json');

    let value: string | undefined;

    expect(() => {
        value = SessionStorageCache().getItem<string>('accepted-quote-id');
    }).not.toThrow();

    expect(value).toBeUndefined();
    expect(window.sessionStorage.getItem('accepted-quote-id')).toBeNull();
});

test('BUG-003: missing App Insights config disables telemetry instead of loading dummy-key', async () => {
    const loadAppInsights = vi.fn();
    const applicationInsightsCtor = vi.fn(function ApplicationInsights(this: { loadAppInsights: () => void }) {
        this.loadAppInsights = loadAppInsights;
    });
    const reactPluginCtor = vi.fn(function ReactPlugin(this: { plugin: string }) {
        this.plugin = 'react';
    });

    vi.doMock('@microsoft/applicationinsights-web', () => ({
        ApplicationInsights: applicationInsightsCtor,
    }));
    vi.doMock('@microsoft/applicationinsights-react-js', () => ({
        ReactPlugin: reactPluginCtor,
    }));
    vi.doMock('../ClientApp/src/env', () => ({
        env: {
            REACT_APP_APPINSIGHTS_CONN_STRING: undefined,
        },
    }));

    const module = await import('../ClientApp/src/instrumentation/AppInsightsService');

    expect(reactPluginCtor).not.toHaveBeenCalled();
    expect(applicationInsightsCtor).not.toHaveBeenCalled();
    expect(loadAppInsights).not.toHaveBeenCalled();
    expect(module.getAppInsights()).toBeNull();
});

test('BUG-004: pristine valid create-account forms do not trigger route-leave confirmation', async () => {
    let capturedWhen: boolean | undefined;

    vi.doMock('formik', () => ({
        useFormikContext: () => ({
            dirty: false,
            isValid: true,
            submitCount: 0,
            isSubmitting: false,
            errors: {},
        }),
    }));
    vi.doMock('../ClientApp/src/components/RouteLeavingGuard', () => ({
        default: ({ when }: { when: boolean }) => {
            capturedWhen = when;
            return null;
        },
    }));

    const { default: UnsavedFormPrompt } = await import('../ClientApp/src/components/forms/UnsavedFormPrompt');

    render(createElement(UnsavedFormPrompt, { path: '/create-account/' }));

    expect(capturedWhen).toBe(false);
});

test('BUG-005: trackGAPii reads visible DOM content before redaction in localhost diagnostics', async () => {
    const send = vi.fn();
    const table = vi.spyOn(console, 'table').mockImplementation(() => {});
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    vi.stubGlobal('location', { hostname: 'localhost', pathname: '/dashboard' });
    vi.doMock('react-ga4', () => ({
        default: {
            send,
            event: vi.fn(),
            initialize: vi.fn(),
            isInitialized: false,
        },
    }));

    const { trackGAPii } = await import('../ClientApp/src/analytics/GoogleAnalytics');

    document.body.innerHTML = '<div data-pii="contactName">Visible Contact</div>';
    trackGAPii();

    expect(table).toHaveBeenCalledWith({
        originalData: {
            contactName: 'Visible Contact',
        },
    });
    expect(send).toHaveBeenCalled();
    log.mockRestore();
});

test('BUG-006: AGENTS guidance does not deny the root package.json or npm validation scripts', () => {
    const agents = readFileSync('AGENTS.md', 'utf8');
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
        scripts?: Record<string, string>;
    };

    expect(pkg.scripts?.['type-check']).toBeTruthy();
    expect(pkg.scripts?.['test:unit']).toBeTruthy();
    expect(agents).not.toContain('There is no root `package.json`');
    expect(agents).not.toContain('`npm`/`pnpm`/`yarn` commands cannot be run from the workspace root');
});

test('BUG-007: shared validation modules import yupExtensions locally', () => {
    const contactValidation = readFileSync('ClientApp/src/validationSchemas/contactValidation.ts', 'utf8');
    const commonValidation = readFileSync('ClientApp/src/validationSchemas/common.ts', 'utf8');

    expect(contactValidation).toMatch(/yupExtensions/);
    expect(commonValidation).toMatch(/yupExtensions/);
});

test('BUG-008: dashboard alert selector matches the rendered notif-* IDs', () => {
    const dashboardSource = readFileSync('ClientApp/src/routes/dashboard/index.tsx', 'utf8');

    expect(dashboardSource).toContain("[id^=\"notif-\"]");
    expect(dashboardSource).not.toContain("[id^=\"#notif-\"]");
});
