import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AddressClient,
  ApplicationClient,
  ApplicationType,
  ContactClient,
  FileClient,
  SwaggerException,
} from '../../../ClientApp/src/api/web-api-client.ts';

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
    globalThis.sessionStorage.setItem(
      'targetOrganisation',
      '{"targetOrganisationAbn":"11111111111"}'
    );
    const http = transport(
      Response.json({ matches: [{ displayText: '1 Main St' }] })
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
      }
    );
  });

  it('serializes application commands without changing the wire contract', async () => {
    const http = transport(Response.json({ id: 42, referenceId: 'RFQ-42' }));
    const client = new ApplicationClient('', http);
    await expect(
      client.createApplication({
        applicationType: ApplicationType.QuoteRequest,
        referenceId: 'RFQ-42',
      })
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

  it('accepts a successful void response', async () => {
    const http = transport(new Response(null, { status: 200 }));
    await expect(
      new ContactClient('', http).saveContactDetails({})
    ).resolves.toBeUndefined();
    expect(http.fetch).toHaveBeenCalledExactlyOnceWith(
      '/api/contact/save-contact',
      {
        method: 'PUT',
        signal: undefined,
        body: '{}',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  });
});

describe('web-api-client RED: rejected requests', () => {
  it.each([400, 409, 412])(
    'preserves the raw problem payload for form error handling (%i)',
    async (status) => {
      const problem = {
        status,
        title: 'Cannot save',
        errors: { email: ['Invalid email'] },
      };
      const http = transport(Response.json(problem, { status }));
      await expect(
        new ContactClient('', http).saveContactDetails({})
      ).rejects.toEqual(problem);
    }
  );

  it('preserves unexpected error status, body and response headers', async () => {
    const http = transport(
      new Response('Service unavailable', {
        status: 503,
        headers: { 'Retry-After': '60' },
      })
    );
    const result = new AddressClient('', http).search('Main');
    await expect(result).rejects.toBeInstanceOf(SwaggerException);
    await expect(result).rejects.toMatchObject({
      status: 503,
      response: 'Service unavailable',
      headers: { 'retry-after': '60' },
    });
  });

  it.each([
    new TypeError('Network unavailable'),
    new DOMException('Cancelled', 'AbortError'),
  ])('propagates transport failure: $name', async (error) => {
    const http = transport(new Response());
    http.fetch.mockRejectedValue(error);
    await expect(new AddressClient('', http).search('Main')).rejects.toBe(
      error
    );
    expect(http.fetch).toHaveBeenCalledTimes(1);
  });

  it('rejects malformed JSON rather than returning a successful empty result', async () => {
    const http = transport(new Response('not-json', { status: 200 }));
    await expect(
      new AddressClient('', http).search('Main')
    ).rejects.toBeInstanceOf(SyntaxError);
  });
});

describe('web-api-client AMBER: existing boundary semantics', () => {
  it.each([null, undefined])(
    'omits an absent search parameter (%s) and auth headers',
    async (keyword) => {
      const http = transport(Response.json({ matches: [] }));
      await expect(
        new AddressClient('', http).search(keyword)
      ).resolves.toEqual({ matches: [] });
      expect(http.fetch).toHaveBeenCalledExactlyOnceWith(
        '/api/address/search',
        {
          method: 'GET',
          signal: undefined,
          headers: { Accept: 'application/json' },
        }
      );
    }
  );

  it.each([200, 204])(
    'preserves a null result for an empty %i response despite the generated non-null signature',
    async (status) => {
      const http = transport(new Response(null, { status }));
      await expect(
        new AddressClient('', http).search(undefined)
      ).resolves.toBeNull();
    }
  );

  it.each([
    {
      status: 200,
      disposition: 'attachment; filename="form.pdf"',
      name: 'form.pdf',
    },
    {
      status: 206,
      disposition: "attachment; filename*=UTF-8''form%20one.pdf",
      name: 'form one.pdf',
    },
  ])(
    'returns binary content and filename for status $status',
    async ({ status, disposition, name }) => {
      const http = transport(
        new Response('pdf-content', {
          status,
          headers: {
            'Content-Disposition': disposition,
            'Content-Type': 'application/pdf',
          },
        })
      );
      const result = await new FileClient('', http).fetchBytesFromUrl(
        'https://files.test/form.pdf?a=1&b=2'
      );
      expect(result).toMatchObject({
        status,
        fileName: name,
        headers: { 'content-disposition': disposition },
      });
      expect(await result.data.text()).toBe('pdf-content');
      expect(http.fetch).toHaveBeenCalledWith(
        '/api/file/fetch-accessible-form?url=https%3A%2F%2Ffiles.test%2Fform.pdf%3Fa%3D1%26b%3D2',
        expect.objectContaining({
          headers: { Accept: 'application/octet-stream' },
        })
      );
    }
  );
});
