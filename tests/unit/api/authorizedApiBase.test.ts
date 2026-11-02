import { describe, expect, it } from 'vitest';
import { AuthorizedApiBase } from '../../../ClientApp/src/api/web-api-client';

type TransformOptions = { headers: Record<string, string> };
type TransformedOptions = TransformOptions;

class TestClient extends AuthorizedApiBase {
  public async exposeTransformOptions(
    options: TransformOptions,
  ): Promise<TransformedOptions> {
    return (await this.transformOptions(options)) as TransformedOptions;
  }
}

describe('authorized API base', () => {
  const resetSessionStorage = () => {
    globalThis.sessionStorage.clear();
  };

  it('captures TargetOrganisationAbn when each client is constructed', async () => {
    expect.hasAssertions();

    resetSessionStorage();

    globalThis.sessionStorage.setItem(
      'targetOrganisation',
      JSON.stringify({ targetOrganisationAbn: '11111111111' }),
    );
    const client = new TestClient();
    client.setAuthToken('test-token');

    const firstOptions = await client.exposeTransformOptions({
      headers: { Existing: 'header' },
    });

    expect(firstOptions.headers).toStrictEqual({
      Existing: 'header',
      Authorization: 'Bearer test-token',
      TargetOrganisationAbn: '11111111111',
    });

    globalThis.sessionStorage.setItem(
      'targetOrganisation',
      JSON.stringify({ targetOrganisationAbn: '22222222222' }),
    );

    const secondOptions = await client.exposeTransformOptions({
      headers: { Existing: 'header' },
    });

    expect(secondOptions.headers).toStrictEqual({
      Existing: 'header',
      Authorization: 'Bearer test-token',
      TargetOrganisationAbn: '11111111111',
    });

    const nextClient = new TestClient();
    nextClient.setAuthToken('test-token');
    const nextClientOptions = await nextClient.exposeTransformOptions({
      headers: { Existing: 'header' },
    });

    expect(nextClientOptions.headers).toStrictEqual({
      Existing: 'header',
      Authorization: 'Bearer test-token',
      TargetOrganisationAbn: '22222222222',
    });
  });

  it('does not parse later sessionStorage changes when the client captured no target organisation', async () => {
    expect.hasAssertions();

    resetSessionStorage();

    const client = new TestClient();
    client.setAuthToken('test-token');
    globalThis.sessionStorage.setItem('targetOrganisation', 'not-json{{{');

    await expect(
      client.exposeTransformOptions({ headers: { Existing: 'header' } }),
    ).resolves.toStrictEqual({
      headers: {
        Existing: 'header',
        Authorization: 'Bearer test-token',
      },
    });
  });
});
