import { afterEach, describe, expect, it, vi } from 'vitest';

const envKeys = [
    'REACT_APP_B2C_CLIENTID',
    'REACT_APP_B2C_AUTHORITY',
    'REACT_APP_B2C_KNOWN_AUTHORITIES',
    'REACT_APP_B2C_POST_LOGOUT_REDIRECT_URL',
    'REACT_APP_B2C_READ_SCOPE',
    'REACT_APP_B2C_USER_IMPERSONATION_SCOPE',
    'REACT_APP_B2C_REDIRECT_URL',
    'EXTERNAL_REDIRECT_URL',
    'REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY',
    'REACT_APP_APPINSIGHTS_CONN_STRING',
    'REACT_APP_GA_TRACKINGID',
    'REACT_APP_ENVIRONMENT',
] as const;

type EnvKey = typeof envKeys[number];

const validEnv: Record<EnvKey, string> = {
    REACT_APP_B2C_CLIENTID: 'client-id',
    REACT_APP_B2C_AUTHORITY: 'https://login.measurement.gov.au/authority',
    REACT_APP_B2C_KNOWN_AUTHORITIES: 'measurement.gov.au',
    REACT_APP_B2C_POST_LOGOUT_REDIRECT_URL: 'https://portal.measurement.gov.au/logout',
    REACT_APP_B2C_READ_SCOPE: 'read',
    REACT_APP_B2C_USER_IMPERSONATION_SCOPE: 'user_impersonation',
    REACT_APP_B2C_REDIRECT_URL: 'https://portal.measurement.gov.au/redirect',
    EXTERNAL_REDIRECT_URL: 'https://portal.measurement.gov.au/external',
    REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY: 'instrumentation-key',
    REACT_APP_APPINSIGHTS_CONN_STRING: 'connection-string',
    REACT_APP_GA_TRACKINGID: 'ga-tracking-id',
    REACT_APP_ENVIRONMENT: 'test',
};

async function importEnv(overrides: Partial<Record<EnvKey, string | undefined>>) {
    vi.resetModules();
    envKeys.forEach((key) => {
        const value = Object.hasOwn(overrides, key) ? overrides[key] : validEnv[key];
        if (value === undefined) {
            delete globalThis[key];
        } else {
            globalThis[key] = value;
        }
    });

    return import('../../../ClientApp/src/env');
}

describe('runtime env', () => {
    afterEach(() => {
        envKeys.forEach((key) => {
            delete globalThis[key];
        });
        vi.restoreAllMocks();
    });

    it('exports runtime globals and allows measurement.gov.au and localhost redirect hosts', async () => {
        const module = await importEnv({
            EXTERNAL_REDIRECT_URL: 'http://localhost:5173/return',
        });

        expect(module.env).toEqual({
            ...validEnv,
            EXTERNAL_REDIRECT_URL: 'http://localhost:5173/return',
        });
    });

    it('allows measurement.gov.au and its subdomains as redirect hosts', async () => {
        const exactHost = await importEnv({
            EXTERNAL_REDIRECT_URL: 'https://measurement.gov.au/return',
        });
        expect(exactHost.env.EXTERNAL_REDIRECT_URL).toBe('https://measurement.gov.au/return');

        const subdomain = await importEnv({
            EXTERNAL_REDIRECT_URL: 'https://portal.measurement.gov.au/return',
        });
        expect(subdomain.env.EXTERNAL_REDIRECT_URL).toBe('https://portal.measurement.gov.au/return');
    });

    it('logs all missing required variables and falls back to empty strings', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const missingRequired = Object.fromEntries(
            envKeys
                .filter((key) => key !== 'REACT_APP_ENVIRONMENT')
                .map((key) => [key, undefined]),
        ) as Partial<Record<EnvKey, undefined>>;

        const module = await importEnv(missingRequired);

        envKeys
            .filter((key) => key !== 'REACT_APP_ENVIRONMENT')
            .forEach((key) => {
                expect(consoleError).toHaveBeenCalledWith(`[env] Missing required runtime variable: ${key}`);
                expect(module.env[key]).toBe('');
            });
    });

    it('rejects malformed or disallowed external redirect hosts', async () => {
        await expect(importEnv({
            EXTERNAL_REDIRECT_URL: 'https://evil.example/redirect',
        })).rejects.toThrow(/not in the allowed domain list/);

        await expect(importEnv({
            EXTERNAL_REDIRECT_URL: 'not a url',
        })).rejects.toThrow(/not in the allowed domain list/);
    });
});
