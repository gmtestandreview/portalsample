// Runtime env stubs — Storybook has no server-side template to inject window.*
// config, so every var is stubbed here. Components must read config from
// ClientApp/src/env.ts, never from process.env (undefined in the browser bundle).
//
// REACT_APP_ENVIRONMENT marks this as development, which is what lets env.ts
// treat the two telemetry keys below as deliberately unset rather than missing.
// Without it every story load prints two [env] errors to the console, which is
// noise that masks real ones.
Object.assign(globalThis, {
    REACT_APP_B2C_CLIENTID: 'storybook-client-id',
    REACT_APP_B2C_AUTHORITY: 'https://login.microsoftonline.com/common',
    REACT_APP_B2C_KNOWN_AUTHORITIES: 'login.microsoftonline.com',
    REACT_APP_B2C_POST_LOGOUT_REDIRECT_URL: 'http://localhost:6006',
    REACT_APP_B2C_READ_SCOPE: 'openid',
    REACT_APP_B2C_USER_IMPERSONATION_SCOPE: 'openid',
    REACT_APP_B2C_REDIRECT_URL: 'http://localhost:6006',
    EXTERNAL_REDIRECT_URL: 'http://localhost:6006',
    REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY: '',
    // 'dummy-key' is the exact sentinel AppInsightsService checks for. A
    // realistic-looking connection string is truthy and passes that check, so
    // the real SDK booted and every story load fetched js.monitor.azure.com,
    // which answers 500 for a fake instrumentation key.
    REACT_APP_APPINSIGHTS_CONN_STRING: 'dummy-key',
    REACT_APP_GA_TRACKINGID: '',
    REACT_APP_ENVIRONMENT: 'development',
});
