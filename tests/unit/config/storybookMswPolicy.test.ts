import { readFileSync } from 'node:fs';
import { setupServer } from 'msw/node';
import { describe, expect, it, onTestFinished, vi } from 'vitest';

import * as handlersModule from '../../../.storybook/msw-handlers';
import { onUnhandledStorybookRequest } from '../../../.storybook/msw-policy';

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

  it.each([
    '/fonts/nmi.woff2',
    '/assets/logo.svg',
    'https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js',
  ])('bypasses non-API request %s', (requestUrl) => {
    expect.hasAssertions();

    startStorybookMswTest();

    const defaults = createDefaults();
    const url = new URL(requestUrl, globalThis.location.origin);

    onUnhandledStorybookRequest({
      frame: {
        protocol: 'http',
        data: { request: new Request(url) },
      } as UnhandledFrameCallbackArgs['frame'],
      defaults,
    });

    expect(defaults.error).not.toHaveBeenCalled();
    expect(defaults.warn).not.toHaveBeenCalled();
  });
});
