// Runtime env stubs — Storybook has no server-side template to inject window.*
// config, so all 11 vars are stubbed here. Components must read config from
// ClientApp/src/env.ts, never from process.env (undefined in the browser bundle).
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
    REACT_APP_APPINSIGHTS_CONN_STRING:
        'InstrumentationKey=00000000-0000-0000-0000-000000000000;IngestionEndpoint=https://dummy.applicationinsights.azure.com/',
    REACT_APP_GA_TRACKINGID: '',
});
