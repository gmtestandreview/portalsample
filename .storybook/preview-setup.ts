// Runtime env stubs — Storybook has no deployment .env file, so every browser
// exposed Vite variable is supplied as a deterministic fixture here.
//
// The telemetry values are deterministic non-production fixtures. App Insights
// uses the explicit `dummy-key` opt-out sentinel, so Storybook never sends
// telemetry while env.ts can still validate every required runtime value.
Object.assign(import.meta.env, {
  VITE_B2C_CLIENTID: 'storybook-client-id',
  VITE_B2C_AUTHORITY: 'https://login.microsoftonline.com/common',
  VITE_B2C_KNOWN_AUTHORITIES: 'login.microsoftonline.com',
  VITE_B2C_POST_LOGOUT_REDIRECT_URL: 'http://localhost:6006',
  VITE_B2C_READ_SCOPE: 'openid',
  VITE_B2C_USER_IMPERSONATION_SCOPE: 'openid',
  VITE_B2C_REDIRECT_URL: 'http://localhost:6006',
  VITE_EXTERNAL_REDIRECT_URL: 'http://localhost:6006',
  VITE_APPINSIGHTS_INSTRUMENTATIONKEY: 'storybook-test-instrumentation-key',
  // 'dummy-key' is the exact sentinel AppInsightsService checks for. A
  // realistic-looking connection string is truthy and passes that check, so
  // the real SDK booted and every story load fetched js.monitor.azure.com,
  // which answers 500 for a fake instrumentation key.
  VITE_APPINSIGHTS_CONN_STRING: 'dummy-key',
  VITE_GA_TRACKINGID: 'storybook-test-ga-id',
  VITE_ENVIRONMENT: 'development',
});
