import { LogLevel } from '@azure/msal-browser';
import { describe, expect, it, vi } from 'vitest';

vi.mock(
  '@/env',
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
    expect.hasAssertions();

    const { configuration } = await import('@/authentication/authConfig');

    expect(configuration.auth).toMatchObject({
      clientId: 'test-client-id',
      authority: 'https://example.test/authority',
      knownAuthorities: ['example.test'],
      redirectUri: 'https://example.test/redirect',
      postLogoutRedirectUri: 'https://example.test/logout',
    });
  });

  it('exports scopes and request objects from runtime env values', async () => {
    expect.hasAssertions();

    const { authRequest, redirectUri, scopes, tokenRequest } =
      await import('@/authentication/authConfig');

    expect(scopes).toStrictEqual(['read', 'user_impersonation']);
    expect(redirectUri).toBe('https://example.test/redirect');
    expect(authRequest).toStrictEqual({
      redirectUri: 'https://example.test/redirect',
      scopes,
    });
    expect(tokenRequest).toStrictEqual({ scopes });
  });

  it('uses MSAL v5 bridge timeouts and popup navigation', async () => {
    expect.hasAssertions();

    const { configuration } = await import('@/authentication/authConfig');

    expect(configuration.system).toMatchObject({
      popupBridgeTimeout: 60000,
      iframeBridgeTimeout: 6000,
      navigatePopups: true,
    });
    expect(Object.keys(configuration.system ?? {})).not.toEqual(
      expect.arrayContaining(['windowHashTimeout', 'iframeHashTimeout']),
    );
    expect(
      configuration.auth.onRedirectNavigate?.('https://example.test/'),
    ).toBe(true);
  });

  it('does not log PII messages', async () => {
    expect.hasAssertions();

    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const { configuration } = await import('@/authentication/authConfig');

    configuration.system?.loggerOptions?.loggerCallback?.(
      LogLevel.Error,
      'secret',
      true,
    );

    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('logs MSAL error messages', async () => {
    expect.hasAssertions();

    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const { configuration } = await import('@/authentication/authConfig');

    configuration.system?.loggerOptions?.loggerCallback?.(
      LogLevel.Error,
      'visible error',
      false,
    );

    expect(consoleError).toHaveBeenCalledWith('visible error');

    consoleError.mockRestore();
  });

  it('ignores non-error MSAL log levels by default', async () => {
    expect.hasAssertions();

    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const { configuration } = await import('@/authentication/authConfig');

    configuration.system?.loggerOptions?.loggerCallback?.(
      LogLevel.Info,
      'info message',
      false,
    );

    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('falls back to empty strings when optional runtime auth env values are missing', async () => {
    expect.hasAssertions();

    vi.resetModules();
    vi.doMock(
      import('@/env'),
      () =>
        ({
          env: {
            VITE_B2C_CLIENTID: '',
            VITE_B2C_AUTHORITY: 'https://example.test/authority',
            VITE_B2C_KNOWN_AUTHORITIES: '',
            VITE_B2C_POST_LOGOUT_REDIRECT_URL: 'https://example.test/logout',
            VITE_B2C_READ_SCOPE: '',
            VITE_B2C_USER_IMPERSONATION_SCOPE: '',
            VITE_B2C_REDIRECT_URL: '',
            VITE_EXTERNAL_REDIRECT_URL: '',
            VITE_APPINSIGHTS_INSTRUMENTATIONKEY: '',
            VITE_APPINSIGHTS_CONN_STRING: '',
            VITE_GA_TRACKINGID: '',
            VITE_ENVIRONMENT: '',
          },
        }) satisfies __ExactMockModule<__TestMockModule10>,
    );

    const { authRequest, configuration, redirectUri, scopes, tokenRequest } =
      await import('@/authentication/authConfig');

    expect({
      clientId: configuration.auth.clientId,
      knownAuthorities: configuration.auth.knownAuthorities,
      scopes,
      redirectUri,
      authRequest,
      tokenRequest,
    }).toStrictEqual({
      clientId: '',
      knownAuthorities: [''],
      scopes: ['', ''],
      redirectUri: '',
      authRequest: { redirectUri: '', scopes },
      tokenRequest: { scopes },
    });
  });
});
