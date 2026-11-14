import type {
  AccountInfo,
  IPublicClientApplication,
} from '@azure/msal-browser';
import { describe, expect, it, vi } from 'vitest';
import { createAuthenticatedClient } from '../../../ClientApp/src/authentication/authenticatedClient';

class FakeClient {
  token: string | undefined;
  setAuthToken(token: string) {
    this.token = token;
  }
}

const account = { homeAccountId: 'home-1' } as AccountInfo;

describe(createAuthenticatedClient, () => {
  it('acquires a silent token for the first account and hands it to the client', async () => {
    expect.assertions(3);

    const acquireTokenSilent = vi
      .fn<IPublicClientApplication['acquireTokenSilent']>()
      .mockResolvedValue({ accessToken: 'token-1' } as never);
    const instance = {
      acquireTokenSilent,
    } as unknown as IPublicClientApplication;

    const client = await createAuthenticatedClient(
      FakeClient,
      [account],
      instance,
    );

    expect(client).toBeInstanceOf(FakeClient);
    expect(client.token).toBe('token-1');
    expect(acquireTokenSilent).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ account }),
    );
  });

  it('propagates a token acquisition failure unchanged', async () => {
    expect.assertions(1);

    const failure = new Error('interaction required');
    const instance = {
      acquireTokenSilent: vi
        .fn<IPublicClientApplication['acquireTokenSilent']>()
        .mockRejectedValue(failure),
    } as unknown as IPublicClientApplication;

    await expect(
      createAuthenticatedClient(FakeClient, [account], instance),
    ).rejects.toBe(failure);
  });
});
