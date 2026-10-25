export const VITE_ENV_KEYS = [
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

export type ViteEnvKey = (typeof VITE_ENV_KEYS)[number];

type ViteEnvFixture = Readonly<Record<ViteEnvKey, string>>;

const commonFixture = {
  VITE_B2C_AUTHORITY: 'https://login.microsoftonline.com/common',
  VITE_B2C_KNOWN_AUTHORITIES: 'login.microsoftonline.com',
  VITE_B2C_READ_SCOPE: 'openid',
  VITE_B2C_USER_IMPERSONATION_SCOPE: 'openid',
  VITE_ENVIRONMENT: 'development',
} as const;

export const VITE_ENV_FIXTURES = {
  viteDevelopment: {
    ...commonFixture,
    VITE_B2C_CLIENTID: 'dev-client-id',
    VITE_B2C_POST_LOGOUT_REDIRECT_URL: 'http://localhost:3000',
    VITE_B2C_REDIRECT_URL: 'http://localhost:3000/redirect.html',
    VITE_EXTERNAL_REDIRECT_URL: 'http://localhost:3000',
    VITE_APPINSIGHTS_INSTRUMENTATIONKEY: '',
    VITE_APPINSIGHTS_CONN_STRING: 'dummy-key',
    VITE_GA_TRACKINGID: '',
  },
  vitest: {
    ...commonFixture,
    VITE_B2C_CLIENTID: 'test-client-id',
    VITE_B2C_POST_LOGOUT_REDIRECT_URL: 'http://localhost:3000',
    VITE_B2C_REDIRECT_URL: 'http://localhost:3000',
    VITE_EXTERNAL_REDIRECT_URL: 'http://localhost:3000',
    VITE_APPINSIGHTS_INSTRUMENTATIONKEY: 'test-instrumentation-key',
    VITE_APPINSIGHTS_CONN_STRING: 'InstrumentationKey=test-instrumentation-key',
    VITE_GA_TRACKINGID: 'test-ga-id',
  },
  storybook: {
    ...commonFixture,
    VITE_B2C_CLIENTID: 'storybook-client-id',
    VITE_B2C_POST_LOGOUT_REDIRECT_URL: 'http://localhost:6006',
    VITE_B2C_REDIRECT_URL: 'http://localhost:6006',
    VITE_EXTERNAL_REDIRECT_URL: 'http://localhost:6006',
    VITE_APPINSIGHTS_INSTRUMENTATIONKEY: 'storybook-test-instrumentation-key',
    VITE_APPINSIGHTS_CONN_STRING: 'dummy-key',
    VITE_GA_TRACKINGID: 'storybook-test-ga-id',
  },
} as const satisfies Record<string, ViteEnvFixture>;
