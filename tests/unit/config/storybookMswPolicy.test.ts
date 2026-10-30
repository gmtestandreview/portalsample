import { readFileSync } from 'node:fs';
import { setupServer } from 'msw/node';
import { describe, expect, it, onTestFinished, vi } from 'vitest';

import * as handlersModule from '../../../.storybook/msw-handlers';
import {
  createStorybookMswWorkerLoader,
  onUnhandledStorybookRequest,
} from '../../../.storybook/msw-policy';
import type { StorybookMswWorker } from '../../../.storybook/msw-policy';

const LOCAL_BYPASS_SAMPLES = [
  '/iframe.html',
  '/index.json',
  '/mockServiceWorker.js',
  '/favicon.ico',
  '/NMI-tile.png',
  '/fonts/nmi.woff2',
  '/assets/logo.svg',
  '/@vite/client',
  '/@fs/C:/repo/node_modules/x.js',
  '/@id/virtual:storybook',
  '/@react-refresh',
  '/node_modules/.cache/storybook/vite/deps/react.js',
  '/ClientApp/src/index.tsx',
  '/.storybook/preview.tsx',
  '/sb-preview/runtime.js',
  '/sb-addons/docs/index.js',
  '/__vitest_browser__/tester.js',
] as const;

const server = setupServer(...handlersModule.mswHandlers);
const apiUrl = (path: string): URL => new URL(path, globalThis.location.origin);
const handlerSource = readFileSync('.storybook/msw-handlers.ts', 'utf8');

type UnhandledFrameCallbackArgs = Parameters<
  typeof onUnhandledStorybookRequest
>[0];
type StorybookDefaults = UnhandledFrameCallbackArgs['defaults'];

const createDefaults = (): StorybookDefaults => ({
  error: vi.fn<StorybookDefaults['error']>(),
  warn: vi.fn<StorybookDefaults['warn']>(),
});

const startStorybookMswTest = () => {
  server.listen({ onUnhandledFrame: 'bypass' });
  onTestFinished(() => {
    server.resetHandlers();
    server.close();
  });
};

describe('storybook dashboard API contracts', () => {
  it('does not use a dashboard wildcard for incompatible response types', () => {
    expect.hasAssertions();

    startStorybookMswTest();

    expect(handlerSource).not.toContain('/api/dashboard/*');
  });

  it('returns only file metadata when ReturnFile is false', async () => {
    expect.hasAssertions();

    startStorybookMswTest();

    const response = await fetch(
      apiUrl(
        '/api/dashboard/get-quote-report-pdf?QuoteRequestID=QR-100245&ReturnFile=false',
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toStrictEqual({
      fileSizeBytes: 2048,
    });
  });

  it('returns a downloadable PDF payload when ReturnFile is true', async () => {
    expect.hasAssertions();

    startStorybookMswTest();

    const response = await fetch(
      apiUrl(
        '/api/dashboard/get-quote-report-pdf?QuoteRequestID=QR-100245&ReturnFile=true',
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toStrictEqual({
      filename: 'measurement-report.pdf',
      mimeType: 'application/pdf',
      fileData: 'JVBERi0xLjQK',
    });
  });

  it('returns the instrument-report paginated DTO from its own endpoint', async () => {
    expect.hasAssertions();

    startStorybookMswTest();

    const response = await fetch(
      apiUrl(
        '/api/dashboard/get-dashboard-instrument-artefact-reports?PortalId=org-crm-guid-001&Name=INS-1&PageSize=10&PageNumber=1',
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toStrictEqual({
      currentPage: 1,
      items: [
        {
          tmasTcReportName: 'RPT-1001',
          tmasTcReportDate: '2024-03-20T00:00:00.000Z',
          tmasMeasurementReportCertificateRequired: 'Calibration certificate',
          tmasMeasurementCategoryName: 'Electrical',
          tmasStatus: 'Report issued',
          tmasTcQuoteName: 'Q-1001',
          tmasPortalRequestId: 'RFQ-1001',
        },
      ],
      pageSize: 10,
      totalCount: 1,
      totalPages: 1,
    });
  });

  it.each([
    '/api/dashboard/get-filtered-dashboard-quotes',
    '/api/dashboard/get-filtered-dashboard-drafts',
    '/api/dashboard/get-filtered-dashboard-artefacts',
  ])('keeps %s on the dashboard paginated DTO', async (path) => {
    expect.hasAssertions();

    startStorybookMswTest();

    const response = await fetch(apiUrl(path));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toStrictEqual({
      currentPage: 1,
      items: [],
      pageSize: 10,
      totalCount: 0,
      totalPages: 0,
    });
  });
});

describe('storybook unhandled-request policy', () => {
  it('fails an unhandled same-origin API request at its owner', () => {
    expect.hasAssertions();

    startStorybookMswTest();

    const defaults = createDefaults();

    onUnhandledStorybookRequest({
      frame: {
        protocol: 'http',
        data: {
          request: new Request(apiUrl('/api/unhandled-story-owner')),
        },
      } as UnhandledFrameCallbackArgs['frame'],
      defaults,
    });

    expect(defaults.error).toHaveBeenCalledExactlyOnceWith();
    expect(defaults.warn).not.toHaveBeenCalled();
  });

  const runPolicy = (
    requestUrl: string,
    protocol: 'http' | 'ws' = 'http',
  ): StorybookDefaults => {
    const defaults = createDefaults();
    const url = new URL(requestUrl, globalThis.location.origin);

    onUnhandledStorybookRequest({
      frame: {
        protocol,
        data: { request: new Request(url) },
      } as UnhandledFrameCallbackArgs['frame'],
      defaults,
    });

    return defaults;
  };

  it.each([
    'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    'https://dc.services.visualstudio.com/v2/track',
    'https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js',
    'https://www.google-analytics.com/g/collect?v=2',
    'https://www.googletagmanager.com/gtag/js?id=storybook-test-ga-id',
  ])('fails an unhandled foreign application origin %s', (requestUrl) => {
    expect.hasAssertions();

    startStorybookMswTest();

    const defaults = runPolicy(requestUrl);

    expect(defaults.error).toHaveBeenCalledExactlyOnceWith();
    expect(defaults.warn).not.toHaveBeenCalled();
  });

  it.each(['/unmapped/endpoint', '/dashboard-data.json', '/'])(
    'fails an unhandled same-origin path outside the local asset allowlist %s',
    (requestUrl) => {
      expect.hasAssertions();

      startStorybookMswTest();

      const defaults = runPolicy(requestUrl);

      expect(defaults.error).toHaveBeenCalledExactlyOnceWith();
    },
  );

  it.each(LOCAL_BYPASS_SAMPLES)(
    'bypasses explicit local asset or tooling request %s',
    (requestUrl) => {
      expect.hasAssertions();

      startStorybookMswTest();

      const defaults = runPolicy(requestUrl);

      expect(defaults.error).not.toHaveBeenCalled();
      expect(defaults.warn).not.toHaveBeenCalled();
    },
  );

  it('does not let a local asset prefix bypass an /api/ path', () => {
    expect.hasAssertions();

    startStorybookMswTest();

    const defaults = runPolicy('/api/fonts/leak');

    expect(defaults.error).toHaveBeenCalledExactlyOnceWith();
  });

  it('does not treat a lookalike foreign host as a local origin', () => {
    expect.hasAssertions();

    startStorybookMswTest();

    const defaults = runPolicy('https://evil.example/assets/logo.svg');

    expect(defaults.error).toHaveBeenCalledExactlyOnceWith();
  });

  it('keeps non-http frames on the default behaviour', () => {
    expect.hasAssertions();

    startStorybookMswTest();

    const defaults = createDefaults();

    onUnhandledStorybookRequest({
      frame: {
        protocol: 'ws',
        data: { client: { url: 'wss://example.test/socket' } },
      } as unknown as UnhandledFrameCallbackArgs['frame'],
      defaults,
    });

    expect(defaults.error).not.toHaveBeenCalled();
    expect(defaults.warn).not.toHaveBeenCalled();
  });
});

describe('storybook MSW startup boundary', () => {
  const installInertNetworkDenial = () => {
    const originalFetch = globalThis.fetch;
    const counters = {
      transportAttempts: 0,
      liveSends: 0,
    };
    let permitNextLiveSend = false;
    const liveSend = vi.fn<typeof globalThis.fetch>(async () => {
      counters.liveSends += 1;
      throw new Error('live network send disabled by test');
    });

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (...args) => {
        counters.transportAttempts += 1;
        if (permitNextLiveSend) {
          permitNextLiveSend = false;
          return liveSend(...args);
        }

        throw new Error('inert network denial');
      });

    onTestFinished(() => {
      fetchSpy.mockRestore();

      expect(globalThis.fetch).toBe(originalFetch);
    });

    return {
      counters,
      permitNextLiveSend: () => {
        permitNextLiveSend = true;
      },
    };
  };

  it('keeps worker creation lazy and starts it once before the story request', async () => {
    expect.hasAssertions();

    let resolveStart!: () => void;
    const start = vi.fn<StorybookMswWorker['start']>(
      () =>
        new Promise<void>((resolve) => {
          resolveStart = resolve;
        }),
    );
    const worker = { start };
    const createWorker = vi.fn<() => typeof worker>(() => worker);
    const getWorker = createStorybookMswWorkerLoader(createWorker, () => ({
      quiet: true,
      onUnhandledFrame: 'error',
    }));
    const transport = installInertNetworkDenial();

    expect(createWorker).not.toHaveBeenCalled();

    const storyRequest = async () => {
      await getWorker();
      await fetch(apiUrl('/api/startup-after-ready'));
    };
    const pendingStoryRequest = storyRequest();

    await Promise.resolve();

    expect(start).toHaveBeenCalledTimes(1);
    expect(transport.counters.transportAttempts).toBe(0);

    resolveStart();

    await expect(pendingStoryRequest).rejects.toThrow('inert network denial');

    expect({
      createdWorkers: createWorker.mock.calls.length,
      starts: start.mock.calls.length,
      transportAttempts: transport.counters.transportAttempts,
      liveSends: transport.counters.liveSends,
    }).toStrictEqual({
      createdWorkers: 1,
      starts: 1,
      transportAttempts: 1,
      liveSends: 0,
    });
  });

  it('does not run request-producing story code when worker startup rejects', async () => {
    expect.hasAssertions();

    const startupError = new Error('service worker unavailable');
    const start = vi.fn<StorybookMswWorker['start']>(async () => {
      throw startupError;
    });
    const getWorker = createStorybookMswWorkerLoader(
      () => ({ start }),
      () => ({ quiet: true, onUnhandledFrame: 'error' }),
    );
    const transport = installInertNetworkDenial();
    const storyRequest = vi.fn<() => Promise<Response>>(async () =>
      fetch(apiUrl('/api/never-started')),
    );
    const requestProducingScenario = async () => {
      await getWorker();
      await storyRequest();
    };

    await expect(requestProducingScenario()).rejects.toBe(startupError);
    await expect(requestProducingScenario()).rejects.toBe(startupError);

    expect({
      storyRequests: storyRequest.mock.calls.length,
      starts: start.mock.calls.length,
      transportAttempts: transport.counters.transportAttempts,
      liveSends: transport.counters.liveSends,
    }).toStrictEqual({
      storyRequests: 0,
      starts: 1,
      transportAttempts: 0,
      liveSends: 0,
    });
  });

  it('captures an eager request before readiness without allowing a live send', async () => {
    expect.hasAssertions();

    const transport = installInertNetworkDenial();
    const start = vi.fn<StorybookMswWorker['start']>(async () => undefined);
    const getWorker = createStorybookMswWorkerLoader(
      () => ({ start }),
      () => ({ quiet: true, onUnhandledFrame: 'error' }),
    );

    const eagerRequest = fetch(apiUrl('/api/eager-before-ready'));

    await expect(eagerRequest).rejects.toThrow('inert network denial');

    expect({
      transportAttempts: transport.counters.transportAttempts,
      liveSends: transport.counters.liveSends,
    }).toStrictEqual({ transportAttempts: 1, liveSends: 0 });

    await getWorker();

    expect(start).toHaveBeenCalledTimes(1);
  });

  it('fails closed when the supported no-service-worker setup cannot start', async () => {
    expect.hasAssertions();

    const transport = installInertNetworkDenial();
    const start = vi.fn<StorybookMswWorker['start']>(async () => {
      throw new Error('No service worker available in this test setup');
    });
    const getWorker = createStorybookMswWorkerLoader(
      () => ({ start }),
      () => ({ quiet: true, onUnhandledFrame: 'error' }),
    );
    const requestProducingScenario = async () => {
      await getWorker();
      await fetch(apiUrl('/api/no-service-worker-fallback'));
    };

    await expect(requestProducingScenario()).rejects.toThrow(
      'No service worker available',
    );

    expect({
      transportAttempts: transport.counters.transportAttempts,
      liveSends: transport.counters.liveSends,
    }).toStrictEqual({ transportAttempts: 0, liveSends: 0 });
  });

  it('counts a controlled permitted send at the live transport boundary', async () => {
    expect.hasAssertions();

    const transport = installInertNetworkDenial();
    transport.permitNextLiveSend();

    await expect(fetch(apiUrl('/api/controlled-live-send'))).rejects.toThrow(
      'live network send disabled by test',
    );

    expect(transport.counters).toStrictEqual({
      transportAttempts: 1,
      liveSends: 1,
    });
  });
});
