import { readFileSync } from 'node:fs';

import { setupServer } from 'msw/node';

import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import * as handlersModule from '../../../.storybook/msw-handlers';

import { onUnhandledStorybookRequest } from '../../../.storybook/msw-policy';

const server = setupServer(...handlersModule.mswHandlers);

const apiUrl = (path: string): URL => new URL(path, globalThis.location.origin);

const handlerSource = readFileSync('.storybook/msw-handlers.ts', 'utf8');

type UnhandledFrameCallbackArgs = Parameters<
  typeof onUnhandledStorybookRequest
>[0];

beforeAll(() => server.listen({ onUnhandledFrame: 'bypass' }));

afterEach(() => server.resetHandlers());

afterAll(() => server.close());

describe('storybook dashboard API contracts', () => {
  it('does not use a dashboard wildcard for incompatible response types', () => {
    expect.assertions(1);
    expect(handlerSource).not.toContain('/api/dashboard/*');
  });
});

describe('storybook dashboard API contracts', () => {
  it('returns only file metadata when ReturnFile is false', async () => {
    expect.assertions(2);
    const response = await fetch(
      apiUrl(
        '/api/dashboard/get-quote-report-pdf?QuoteRequestID=QR-100245&ReturnFile=false',
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ fileSizeBytes: 2048 });
  });
});

describe('storybook dashboard API contracts', () => {
  it('returns a downloadable PDF payload when ReturnFile is true', async () => {
    expect.assertions(2);
    const response = await fetch(
      apiUrl(
        '/api/dashboard/get-quote-report-pdf?QuoteRequestID=QR-100245&ReturnFile=true',
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      filename: 'measurement-report.pdf',
      mimeType: 'application/pdf',
      fileData: 'JVBERi0xLjQK',
    });
  });
});
