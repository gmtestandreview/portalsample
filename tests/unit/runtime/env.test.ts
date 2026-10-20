import { afterEach, describe, expect, it, vi } from 'vitest';

const envKeys = [
  'VITE_B2C_CLIENTID',
  'VITE_B2C_AUTHORITY',
  'VITE_B2C_KNOWN_AUTHORITIES',
  'VITE_B2C_POST_LOGOUT_REDIRECT_URL',
  'VITE_B2C_READ_SCOPE',
  'VITE_B2C_USER_IMPERSONATION_SCOPE',
  'VITE_B2C_REDIRECT_URL',
  'VITE_EXTERNAL_REDIRECT_URL',
  'VITE_APPINSIGHTS_INSTRUMENTATIONKEY',
  'VITE_APPINSIGHTS_CONN_STRING',
  'VITE_GA_TRACKINGID',
  'VITE_ENVIRONMENT',
] as const;

type EnvKey = (typeof envKeys)[number];

const validEnv: Record<EnvKey, string> = {
  VITE_B2C_CLIENTID: 'client-id',
  VITE_B2C_AUTHORITY: 'https://login.measurement.gov.au/authority',
  VITE_B2C_KNOWN_AUTHORITIES: 'measurement.gov.au',
  VITE_B2C_POST_LOGOUT_REDIRECT_URL: 'https://portal.measurement.gov.au/logout',
  VITE_B2C_READ_SCOPE: 'read',
  VITE_B2C_USER_IMPERSONATION_SCOPE: 'user_impersonation',
  VITE_B2C_REDIRECT_URL: 'https://portal.measurement.gov.au/redirect',
  VITE_EXTERNAL_REDIRECT_URL: 'https://portal.measurement.gov.au/external',
  VITE_APPINSIGHTS_INSTRUMENTATIONKEY: 'instrumentation-key',
  VITE_APPINSIGHTS_CONN_STRING: 'connection-string',
  VITE_GA_TRACKINGID: 'ga-tracking-id',
  VITE_ENVIRONMENT: 'test',
};

async function importEnv(
  overrides: Partial<Record<EnvKey, string>> = {},
  isDevelopment = true
) {
  vi.resetModules();
  envKeys.forEach((key) => {
    vi.stubEnv(key, overrides[key] ?? validEnv[key]);
  });
  vi.stubEnv('MODE', isDevelopment ? 'development' : 'production');

  return import('../../../ClientApp/src/env');
}

describe('Vite environment contract', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('exports VITE-prefixed values and validates allowed redirect hosts', async () => {
    const module = await importEnv({
      VITE_EXTERNAL_REDIRECT_URL: 'http://localhost:5173/return',
    });

    expect(module.env).toEqual({
      ...validEnv,
      VITE_EXTERNAL_REDIRECT_URL: 'http://localhost:5173/return',
    });
  });

  it('allows measurement.gov.au and its subdomains as redirect hosts', async () => {
    const exactHost = await importEnv({
      VITE_EXTERNAL_REDIRECT_URL: 'https://measurement.gov.au/return',
    });
    expect(exactHost.env.VITE_EXTERNAL_REDIRECT_URL).toBe(
      'https://measurement.gov.au/return'
    );

    const subdomain = await importEnv({
      VITE_EXTERNAL_REDIRECT_URL: 'https://portal.measurement.gov.au/return',
    });
    expect(subdomain.env.VITE_EXTERNAL_REDIRECT_URL).toBe(
      'https://portal.measurement.gov.au/return'
    );
  });

  it('logs missing required variables and falls back to empty strings', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const missingRequired = Object.fromEntries(
      envKeys
        .filter((key) => key !== 'VITE_ENVIRONMENT')
        .map((key) => [key, ''])
    ) as Partial<Record<EnvKey, string>>;

    const module = await importEnv(missingRequired);

    envKeys
      .filter((key) => key !== 'VITE_ENVIRONMENT')
      .filter(
        (key) =>
          key !== 'VITE_APPINSIGHTS_INSTRUMENTATIONKEY' &&
          key !== 'VITE_GA_TRACKINGID'
      )
      .forEach((key) => {
        expect(consoleError).toHaveBeenCalledWith(
          `[env] Missing required environment variable: ${key}`
        );
        expect(module.env[key]).toBe('');
      });
  });

  it('keeps quiet about absent telemetry variables in development', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    await importEnv({
      VITE_APPINSIGHTS_INSTRUMENTATIONKEY: '',
      VITE_GA_TRACKINGID: '',
    });

    expect(consoleError).not.toHaveBeenCalledWith(
      '[env] Missing required environment variable: VITE_APPINSIGHTS_INSTRUMENTATIONKEY'
    );
    expect(consoleError).not.toHaveBeenCalledWith(
      '[env] Missing required environment variable: VITE_GA_TRACKINGID'
    );
  });

  it('reports absent telemetry variables outside development', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    await importEnv(
      {
        VITE_APPINSIGHTS_INSTRUMENTATIONKEY: '',
        VITE_GA_TRACKINGID: '',
      },
      false
    );

    expect(consoleError).toHaveBeenCalledWith(
      '[env] Missing required environment variable: VITE_APPINSIGHTS_INSTRUMENTATIONKEY'
    );
    expect(consoleError).toHaveBeenCalledWith(
      '[env] Missing required environment variable: VITE_GA_TRACKINGID'
    );
  });

  it('rejects malformed or disallowed external redirect hosts', async () => {
    await expect(
      importEnv({ VITE_EXTERNAL_REDIRECT_URL: 'https://evil.example/redirect' })
    ).rejects.toThrow(/not in the allowed domain list/);

    await expect(
      importEnv({ VITE_EXTERNAL_REDIRECT_URL: 'not a url' })
    ).rejects.toThrow(/not in the allowed domain list/);
  });
});
