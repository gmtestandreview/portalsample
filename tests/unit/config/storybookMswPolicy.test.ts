import { readFileSync } from 'node:fs';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import * as handlersModule from '../../../.storybook/msw-handlers';
import * as policyModule from '../../../.storybook/msw-policy';

const server = setupServer(...handlersModule.mswHandlers);
const apiUrl = (path: string): URL => new URL(path, globalThis.location.origin);
const handlerSource = readFileSync('.storybook/msw-handlers.ts', 'utf8');

type UnhandledRequestCallback = (request: Request, print: { error: () => void; warning: () => void }) => void;

const onUnhandledStorybookRequest = (
    policyModule as typeof policyModule & {
        onUnhandledStorybookRequest?: UnhandledRequestCallback;
    }
).onUnhandledStorybookRequest;

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Storybook dashboard API contracts', () => {
    it('does not use a dashboard wildcard for incompatible response types', () => {
        expect(handlerSource).not.toContain('/api/dashboard/*');
    });

    it('returns only file metadata when ReturnFile is false', async () => {
        const response = await fetch(apiUrl('/api/dashboard/get-quote-report-pdf?QuoteRequestID=QR-100245&ReturnFile=false'));

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({ fileSizeBytes: 2048 });
    });

    it('returns a downloadable PDF payload when ReturnFile is true', async () => {
        const response = await fetch(apiUrl('/api/dashboard/get-quote-report-pdf?QuoteRequestID=QR-100245&ReturnFile=true'));

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({
            filename: 'measurement-report.pdf',
            mimeType: 'application/pdf',
            fileData: 'JVBERi0xLjQK',
        });
    });

    it('returns the instrument-report paginated DTO from its own endpoint', async () => {
        const response = await fetch(
            apiUrl(
                '/api/dashboard/get-dashboard-instrument-artefact-reports?PortalId=org-crm-guid-001&Name=INS-1&PageSize=10&PageNumber=1',
            ),
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({
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
        const response = await fetch(apiUrl(path));

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({
            currentPage: 1,
            items: [],
            pageSize: 10,
            totalCount: 0,
            totalPages: 0,
        });
    });
});

describe('Storybook unhandled-request policy', () => {
    it('fails an unhandled same-origin API request at its owner', () => {
        const print = { error: vi.fn(), warning: vi.fn() };

        expect(onUnhandledStorybookRequest).toBeTypeOf('function');
        onUnhandledStorybookRequest?.(new Request(apiUrl('/api/unhandled-story-owner')), print);

        expect(print.error).toHaveBeenCalledOnce();
        expect(print.warning).not.toHaveBeenCalled();
    });

    it.each(['/fonts/nmi.woff2', '/assets/logo.svg', 'https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js'])(
        'bypasses non-API request %s',
        (requestUrl) => {
            const print = { error: vi.fn(), warning: vi.fn() };
            const url = new URL(requestUrl, globalThis.location.origin);

            expect(onUnhandledStorybookRequest).toBeTypeOf('function');
            onUnhandledStorybookRequest?.(new Request(url), print);

            expect(print.error).not.toHaveBeenCalled();
            expect(print.warning).not.toHaveBeenCalled();
        },
    );
});
