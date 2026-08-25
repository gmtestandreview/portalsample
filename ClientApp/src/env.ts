declare global {
    // Runtime config injected into the global scope by the HTML template.
     
    var REACT_APP_B2C_CLIENTID: string | undefined;
     
    var REACT_APP_B2C_AUTHORITY: string | undefined;
     
    var REACT_APP_B2C_KNOWN_AUTHORITIES: string | undefined;
     
    var REACT_APP_B2C_POST_LOGOUT_REDIRECT_URL: string | undefined;
     
    var REACT_APP_B2C_READ_SCOPE: string | undefined;
     
    var REACT_APP_B2C_USER_IMPERSONATION_SCOPE: string | undefined;
     
    var REACT_APP_B2C_REDIRECT_URL: string | undefined;
     
    var EXTERNAL_REDIRECT_URL: string | undefined;
     
    var REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY: string | undefined;
     
    var REACT_APP_APPINSIGHTS_CONN_STRING: string | undefined;
     
    var REACT_APP_GA_TRACKINGID: string | undefined;
     
    var REACT_APP_ENVIRONMENT: string | undefined;
}

type EnvType = {
    REACT_APP_B2C_CLIENTID: string,
    REACT_APP_B2C_AUTHORITY: string,
    REACT_APP_B2C_KNOWN_AUTHORITIES: string,
    REACT_APP_B2C_POST_LOGOUT_REDIRECT_URL: string,
    REACT_APP_B2C_READ_SCOPE: string,
    REACT_APP_B2C_USER_IMPERSONATION_SCOPE: string,
    REACT_APP_B2C_REDIRECT_URL: string,
    EXTERNAL_REDIRECT_URL: string,
    REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY: string,
    REACT_APP_APPINSIGHTS_CONN_STRING: string,
    REACT_APP_GA_TRACKINGID: string,
    REACT_APP_ENVIRONMENT: string,
};

const requiredVars: (keyof EnvType)[] = [
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
];

requiredVars.forEach((key) => {
    if (!globalThis[key]) {
         
        console.error(`[env] Missing required runtime variable: ${key}`);
    }
});

const ALLOWED_REDIRECT_HOSTS = ['measurement.gov.au', 'localhost'];

const isAllowedRedirectHost = (urlStr: string): boolean => {
    try {
        const { hostname } = new URL(urlStr);
        return ALLOWED_REDIRECT_HOSTS.some(
            (h) => hostname === h || hostname.endsWith(`.${h}`),
        );
    } catch {
        return false;
    }
};

const externalRedirectUrl = globalThis.EXTERNAL_REDIRECT_URL ?? '';
if (externalRedirectUrl && !isAllowedRedirectHost(externalRedirectUrl)) {
    throw new Error(
        `[env] EXTERNAL_REDIRECT_URL "${externalRedirectUrl}" is not in the allowed domain list (measurement.gov.au or localhost).`,
    );
}

export const env: EnvType = {
    REACT_APP_B2C_CLIENTID: globalThis.REACT_APP_B2C_CLIENTID ?? '',
    REACT_APP_B2C_AUTHORITY: globalThis.REACT_APP_B2C_AUTHORITY ?? '',
    REACT_APP_B2C_KNOWN_AUTHORITIES: globalThis.REACT_APP_B2C_KNOWN_AUTHORITIES ?? '',
    REACT_APP_B2C_POST_LOGOUT_REDIRECT_URL: globalThis.REACT_APP_B2C_POST_LOGOUT_REDIRECT_URL ?? '',
    REACT_APP_B2C_READ_SCOPE: globalThis.REACT_APP_B2C_READ_SCOPE ?? '',
    REACT_APP_B2C_USER_IMPERSONATION_SCOPE: globalThis.REACT_APP_B2C_USER_IMPERSONATION_SCOPE ?? '',
    REACT_APP_B2C_REDIRECT_URL: globalThis.REACT_APP_B2C_REDIRECT_URL ?? '',
    EXTERNAL_REDIRECT_URL: globalThis.EXTERNAL_REDIRECT_URL ?? '',
    REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY: globalThis.REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY ?? '',
    REACT_APP_APPINSIGHTS_CONN_STRING: globalThis.REACT_APP_APPINSIGHTS_CONN_STRING ?? '',
    REACT_APP_GA_TRACKINGID: globalThis.REACT_APP_GA_TRACKINGID ?? '',
    REACT_APP_ENVIRONMENT: globalThis.REACT_APP_ENVIRONMENT ?? '',
};
