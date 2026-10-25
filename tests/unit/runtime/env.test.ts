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

const valueFor = <Value>(record: Record<string, Value>, key: string) =>
  Object.entries(record)
    .find(([name]) => name === key)
    ?.at(1);

async function importEnv(
  overrides: Partial<Record<EnvKey, string>> = {},
  isDevelopment = true,
  runtimeOverrides: Record<string, string> = {},
) {
  vi.resetModules();
  envKeys.forEach((key) => {
    vi.stubEnv(key, valueFor(overrides, key) ?? valueFor(validEnv, key));
  });
  vi.stubEnv('MODE', isDevelopment ? 'development' : 'production');
  Object.assign(globalThis, runtimeOverrides);

  return import('../../../ClientApp/src/env');
}

describe('vite environment contract', () => {
  afterEach(() => {
    for (const key of envKeys) {
      Reflect.deleteProperty(globalThis, key.replace('VITE_', 'REACT_APP_'));
    }
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });
  it('exports VITE-prefixed values and validates allowed redirect hosts', async () => {
    expect.assertions(1);
    const module = await importEnv({
      VITE_EXTERNAL_REDIRECT_URL: 'http://localhost:5173/return',
    });

    expect(module.env).toEqual({
      ...validEnv,
      VITE_EXTERNAL_REDIRECT_URL: 'http://localhost:5173/return',
    });
  });
});

describe('vite environment contract', () => {
  afterEach(() => {
    for (const key of envKeys) {
      Reflect.deleteProperty(globalThis, key.replace('VITE_', 'REACT_APP_'));
    }
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });
  it('prefers the deployed runtime configuration over build-time defaults', async () => {
    expect.assertions(1);
    const module = await importEnv(
      { VITE_B2C_CLIENTID: 'build-client-id' },
      true,
      { REACT_APP_B2C_CLIENTID: 'runtime-client-id' },
    );

    expect(module.env.VITE_B2C_CLIENTID).toBe('runtime-client-id');
  });
});

describe('vite environment contract', () => {
  afterEach(() => {
    for (const key of envKeys) {
      Reflect.deleteProperty(globalThis, key.replace('VITE_', 'REACT_APP_'));
    }
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });
  it('allows measurement.gov.au and its subdomains as redirect hosts', async () => {
    expect.assertions(2);
    const exactHost = await importEnv({
      VITE_EXTERNAL_REDIRECT_URL: 'https://measurement.gov.au/return',
    });

    expect(exactHost.env.VITE_EXTERNAL_REDIRECT_URL).toBe(
      'https://measurement.gov.au/return',
    );

    const subdomain = await importEnv({
      VITE_EXTERNAL_REDIRECT_URL: 'https://portal.measurement.gov.au/return',
    });

    expect(subdomain.env.VITE_EXTERNAL_REDIRECT_URL).toBe(
      'https://portal.measurement.gov.au/return',
    );
  });
});
