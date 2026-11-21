import { createServer, type Server, type ServerResponse } from 'node:http';

import { expect, test } from '@playwright/test';

import {
  expectJsonResponseToMatchSchema,
  expectValueToMatchSchema,
} from '../e2e/support/api-contract';

const dashboardResponseSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  additionalProperties: false,
  required: ['items', 'currentPage', 'totalPages', 'totalCount'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['referenceId', 'status'],
        properties: {
          referenceId: { type: 'string', minLength: 1 },
          status: { type: 'string', minLength: 1 },
        },
      },
    },
    currentPage: { type: 'integer', minimum: 1 },
    totalPages: { type: 'integer', minimum: 1 },
    totalCount: { type: 'integer', minimum: 0 },
  },
} as const;

const validDashboardResponse = {
  items: [
    {
      referenceId: 'RFQ-2026-000001',
      status: 'Draft',
    },
  ],
  currentPage: 1,
  totalPages: 1,
  totalCount: 1,
};

const invalidDashboardResponse = {
  items: [
    {
      status: 'Draft',
    },
  ],
  currentPage: 1,
  totalPages: 1,
  totalCount: 1,
};

const writeJson = (
  serverResponse: ServerResponse,
  body: unknown,
  contentType = 'application/json',
) => {
  serverResponse.writeHead(200, { 'content-type': contentType });
  serverResponse.end(JSON.stringify(body));
};

test.describe('API contract helper', () => {
  let server: Server;
  let baseUrl: string;

  test.beforeAll(async () => {
    server = createServer((request, response) => {
      if (request.url === '/dashboard') {
        writeJson(response, validDashboardResponse);
        return;
      }

      if (request.url === '/dashboard-invalid') {
        writeJson(response, invalidDashboardResponse);
        return;
      }

      if (request.url === '/dashboard-problem') {
        writeJson(response, validDashboardResponse, 'application/problem+json');
        return;
      }

      if (request.url === '/dashboard-text-json') {
        writeJson(response, validDashboardResponse, 'text/example+json');
        return;
      }

      response.writeHead(404);
      response.end();
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });

    const address = server.address();
    if (address === null || typeof address === 'string') {
      throw new Error('API contract fixture server did not expose a TCP port');
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  test.afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  });

  test('validates JSON responses returned by the Playwright request fixture', async ({
    request,
  }) => {
    const response = await request.get(`${baseUrl}/dashboard`);

    await expect(
      expectJsonResponseToMatchSchema(response, dashboardResponseSchema),
    ).resolves.toEqual(validDashboardResponse);
  });

  test('reports response contract mismatches with the failing JSON path', async ({
    request,
  }) => {
    const response = await request.get(`${baseUrl}/dashboard-invalid`);

    await expect(
      expectJsonResponseToMatchSchema(response, dashboardResponseSchema),
    ).rejects.toThrow('/items/0');
  });

  test('accepts JSON structured-suffix response media types', async ({
    request,
  }) => {
    const response = await request.get(`${baseUrl}/dashboard-problem`);

    await expect(
      expectJsonResponseToMatchSchema(response, dashboardResponseSchema),
    ).resolves.toEqual(validDashboardResponse);
  });

  test('rejects non-application structured-suffix media types', async ({
    request,
  }) => {
    const response = await request.get(`${baseUrl}/dashboard-text-json`);

    await expect(
      expectJsonResponseToMatchSchema(response, dashboardResponseSchema),
    ).rejects.toThrow('not JSON');
  });

  test('rejects invalid runtime schema values before compiling them', () => {
    for (const schema of [null, undefined, 'schema', []]) {
      expect(() => {
        expectValueToMatchSchema(validDashboardResponse, schema);
      }).toThrow('JSON Schema object or boolean');
    }
  });

  test('accepts boolean JSON Schemas', () => {
    expect(() => {
      expectValueToMatchSchema(validDashboardResponse, true);
    }).not.toThrow();
    expect(() => {
      expectValueToMatchSchema(validDashboardResponse, false);
    }).toThrow('did not match its JSON Schema contract');
  });
});
