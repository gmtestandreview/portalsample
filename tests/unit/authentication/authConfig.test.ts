import { LogLevel } from '@azure/msal-browser';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/env', () => ({
    env: {
        REACT_APP_B2C_CLIENTID: 'test-client-id',
        REACT_APP_B2C_AUTHORITY: 'https://example.test/authority',
        REACT_APP_B2C_KNOWN_AUTHORITIES: 'example.test',
        REACT_APP_B2C_POST_LOGOUT_REDIRECT_URL: 'https://example.test/logout',
        REACT_APP_B2C_READ_SCOPE: 'read',
        REACT_APP_B2C_USER_IMPERSONATION_SCOPE: 'user_impersonation',
        REACT_APP_B2C_REDIRECT_URL: 'https://example.test/redirect',
    },
}));

describe('auth configuration', () => {
    it('builds MSAL auth config from runtime env values', async () => {
        const { configuration } = await import('@/authentication/authConfig');

        expect(configuration.auth).toMatchObject({
            clientId: 'test-client-id',
            authority: 'https://example.test/authority',
            knownAuthorities: ['example.test'],
            postLogoutRedirectUri: 'https://example.test/logout',
        });
    });

    it('exports scopes and request objects from runtime env values', async () => {
        const {
            authRequest,
            redirectUri,
            scopes,
            tokenRequest,
        } = await import('@/authentication/authConfig');

        expect(scopes).toEqual(['read', 'user_impersonation']);
        expect(redirectUri).toBe('https://example.test/redirect');
        expect(authRequest).toEqual({
            redirectUri: 'https://example.test/redirect',
            scopes,
        });
        expect(tokenRequest).toEqual({ scopes });
    });

    it('bounds MSAL silent renewal frame timeouts to 6000ms', async () => {
        const { configuration } = await import('@/authentication/authConfig');

        expect(configuration.system?.iframeHashTimeout).toBe(6000);
        expect(configuration.system?.loadFrameTimeout).toBe(6000);
    });

    it('does not log PII messages', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { configuration } = await import('@/authentication/authConfig');

        configuration.system?.loggerOptions?.loggerCallback?.(LogLevel.Error, 'secret', true);

        expect(consoleError).not.toHaveBeenCalled();
        consoleError.mockRestore();
    });

    it('logs MSAL error messages', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { configuration } = await import('@/authentication/authConfig');

        configuration.system?.loggerOptions?.loggerCallback?.(LogLevel.Error, 'visible error', false);

        expect(consoleError).toHaveBeenCalledWith('visible error');
        consoleError.mockRestore();
    });

    it('ignores non-error MSAL log levels by default', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { configuration } = await import('@/authentication/authConfig');

        configuration.system?.loggerOptions?.loggerCallback?.(LogLevel.Info, 'info message', false);

        expect(consoleError).not.toHaveBeenCalled();
        consoleError.mockRestore();
    });

    it('falls back to empty strings when optional runtime auth env values are missing', async () => {
        vi.resetModules();
        vi.doMock('@/env', () => ({
            env: {
                REACT_APP_B2C_CLIENTID: undefined,
                REACT_APP_B2C_AUTHORITY: 'https://example.test/authority',
                REACT_APP_B2C_KNOWN_AUTHORITIES: undefined,
                REACT_APP_B2C_POST_LOGOUT_REDIRECT_URL: 'https://example.test/logout',
                REACT_APP_B2C_READ_SCOPE: undefined,
                REACT_APP_B2C_USER_IMPERSONATION_SCOPE: undefined,
                REACT_APP_B2C_REDIRECT_URL: undefined,
            },
        }));

        const {
            authRequest,
            configuration,
            redirectUri,
            scopes,
            tokenRequest,
        } = await import('@/authentication/authConfig');

        expect(configuration.auth.clientId).toBe('');
        expect(configuration.auth.knownAuthorities).toEqual(['']);
        expect(scopes).toEqual(['', '']);
        expect(redirectUri).toBe('');
        expect(authRequest).toEqual({
            redirectUri: '',
            scopes,
        });
        expect(tokenRequest).toEqual({ scopes });
    });
});
