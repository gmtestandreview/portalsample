import { LogLevel } from '@azure/msal-browser';

import { describe, expect, it, vi } from 'vitest';

vi.mock(
  import('@/env'),
  () =>
    ({
      env: {
        VITE_B2C_CLIENTID: 'test-client-id',
        VITE_B2C_AUTHORITY: 'https://example.test/authority',
        VITE_B2C_KNOWN_AUTHORITIES: 'example.test',
        VITE_B2C_POST_LOGOUT_REDIRECT_URL: 'https://example.test/logout',
        VITE_B2C_READ_SCOPE: 'read',
        VITE_B2C_USER_IMPERSONATION_SCOPE: 'user_impersonation',
        VITE_B2C_REDIRECT_URL: 'https://example.test/redirect',
      },
    }) satisfies __ExactMockModule<__TestMockModule10>,
);

describe('auth configuration', () => {
  it('builds MSAL auth config from runtime env values', async () => {
    expect.assertions(1);
    const { configuration } = await import('@/authentication/authConfig');

    expect(configuration.auth).toMatchObject({
      clientId: 'test-client-id',
      authority: 'https://example.test/authority',
      knownAuthorities: ['example.test'],
      redirectUri: 'https://example.test/redirect',
      postLogoutRedirectUri: 'https://example.test/logout',
    });
  });
});

describe('auth configuration', () => {
  it('exports scopes and request objects from runtime env values', async () => {
    expect.assertions(4);
    const { authRequest, redirectUri, scopes, tokenRequest } =
      await import('@/authentication/authConfig');

    expect(scopes).toEqual(['read', 'user_impersonation']);
    expect(redirectUri).toBe('https://example.test/redirect');
    expect(authRequest).toEqual({
      redirectUri: 'https://example.test/redirect',
      scopes,
    });
    expect(tokenRequest).toEqual({ scopes });
  });
});
