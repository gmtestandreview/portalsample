import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AddressClient,
  ApplicationClient,
  ApplicationType,
  ContactClient,
  FileClient,
  SwaggerException,
} from '../../../ClientApp/src/api/web-api-client';

function transport(response: Response) {
  return {
    fetch: vi
      .fn<(url: RequestInfo, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValue(response),
  };
}

beforeEach(() => {
  globalThis.sessionStorage.clear();
});

describe('web-api-client GREEN: successful requests', () => {
  it('encodes the search and forwards auth, organisation and cancellation without losing Accept', async () => {
    expect.assertions(2);
    globalThis.sessionStorage.setItem(
      'targetOrganisation',
      '{"targetOrganisationAbn":"11111111111"}',
    );
    const http = transport(
      Response.json({ matches: [{ displayText: '1 Main St' }] }),
    );
    const client = new AddressClient('https://portal.test', http);
    client.setAuthToken('test-token');
    const { signal } = new AbortController();

    await expect(client.search('Main & First', signal)).resolves.toEqual({
      matches: [{ displayText: '1 Main St' }],
    });
    expect(http.fetch).toHaveBeenCalledExactlyOnceWith(
      'https://portal.test/api/address/search?Keyword=Main%20%26%20First',
      {
        method: 'GET',
        signal,
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer test-token',
          TargetOrganisationAbn: '11111111111',
        },
      },
    );
  });
});

describe('web-api-client GREEN: successful requests', () => {
  it('serializes application commands without changing the wire contract', async () => {
    expect.assertions(2);
    const http = transport(Response.json({ id: 42, referenceId: 'RFQ-42' }));
    const client = new ApplicationClient('', http);

    await expect(
      client.createApplication({
        applicationType: ApplicationType.QuoteRequest,
        referenceId: 'RFQ-42',
      }),
    ).resolves.toEqual({ id: 42, referenceId: 'RFQ-42' });
    expect(http.fetch).toHaveBeenCalledExactlyOnceWith('/api/application', {
      method: 'POST',
      signal: undefined,
      body: '{"applicationType":"QuoteRequest","referenceId":"RFQ-42"}',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  });
});
