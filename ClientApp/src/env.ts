type EnvType = {
  VITE_B2C_CLIENTID: string;
  VITE_B2C_AUTHORITY: string;
  VITE_B2C_KNOWN_AUTHORITIES: string;
  VITE_B2C_POST_LOGOUT_REDIRECT_URL: string;
  VITE_B2C_READ_SCOPE: string;
  VITE_B2C_USER_IMPERSONATION_SCOPE: string;
  VITE_B2C_REDIRECT_URL: string;
  VITE_EXTERNAL_REDIRECT_URL: string;
  VITE_APPINSIGHTS_INSTRUMENTATIONKEY: string;
  VITE_APPINSIGHTS_CONN_STRING: string;
  VITE_GA_TRACKINGID: string;
  VITE_ENVIRONMENT: string;
};

const requiredVars: readonly (keyof EnvType)[] = [
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
];

// Telemetry is reported as missing only outside development. Local dev and
// Storybook have no instrumentation backend to point these at, so the app
// degrades cleanly without them. Production builds still report missing
// telemetry configuration rather than silently accepting an incomplete setup.
const developmentOptionalVars = new Set<keyof EnvType>([
  'VITE_APPINSIGHTS_INSTRUMENTATIONKEY',
  'VITE_GA_TRACKINGID',
]);

requiredVars.forEach((key) => {
  if (
    import.meta.env.DEV === true &&
    import.meta.env.MODE !== 'production' &&
    developmentOptionalVars.has(key)
  ) {
    return;
  }

  if (!import.meta.env[key]) {
    console.error(`[env] Missing required environment variable: ${key}`);
  }
});

const ALLOWED_REDIRECT_HOSTS = ['measurement.gov.au', 'localhost'];

const isAllowedRedirectHost = (urlStr: string): boolean => {
  try {
    const { hostname } = new URL(urlStr);
    return ALLOWED_REDIRECT_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
};

const externalRedirectUrl = import.meta.env.VITE_EXTERNAL_REDIRECT_URL ?? '';
if (externalRedirectUrl && !isAllowedRedirectHost(externalRedirectUrl)) {
  throw new Error(
    `[env] VITE_EXTERNAL_REDIRECT_URL "${externalRedirectUrl}" is not in the allowed domain list (measurement.gov.au or localhost).`
  );
}

export const env: EnvType = {
  VITE_B2C_CLIENTID: import.meta.env.VITE_B2C_CLIENTID ?? '',
  VITE_B2C_AUTHORITY: import.meta.env.VITE_B2C_AUTHORITY ?? '',
  VITE_B2C_KNOWN_AUTHORITIES: import.meta.env.VITE_B2C_KNOWN_AUTHORITIES ?? '',
  VITE_B2C_POST_LOGOUT_REDIRECT_URL:
    import.meta.env.VITE_B2C_POST_LOGOUT_REDIRECT_URL ?? '',
  VITE_B2C_READ_SCOPE: import.meta.env.VITE_B2C_READ_SCOPE ?? '',
  VITE_B2C_USER_IMPERSONATION_SCOPE:
    import.meta.env.VITE_B2C_USER_IMPERSONATION_SCOPE ?? '',
  VITE_B2C_REDIRECT_URL: import.meta.env.VITE_B2C_REDIRECT_URL ?? '',
  VITE_EXTERNAL_REDIRECT_URL: externalRedirectUrl,
  VITE_APPINSIGHTS_INSTRUMENTATIONKEY:
    import.meta.env.VITE_APPINSIGHTS_INSTRUMENTATIONKEY ?? '',
  VITE_APPINSIGHTS_CONN_STRING:
    import.meta.env.VITE_APPINSIGHTS_CONN_STRING ?? '',
  VITE_GA_TRACKINGID: import.meta.env.VITE_GA_TRACKINGID ?? '',
  VITE_ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT ?? '',
};
