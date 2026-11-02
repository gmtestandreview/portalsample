interface ImportMetaEnv {
  readonly VITE_B2C_CLIENTID: string;
  readonly VITE_B2C_AUTHORITY: string;
  readonly VITE_B2C_KNOWN_AUTHORITIES: string;
  readonly VITE_B2C_POST_LOGOUT_REDIRECT_URL: string;
  readonly VITE_B2C_READ_SCOPE: string;
  readonly VITE_B2C_USER_IMPERSONATION_SCOPE: string;
  readonly VITE_B2C_REDIRECT_URL: string;
  readonly VITE_EXTERNAL_REDIRECT_URL: string;
  readonly VITE_APPINSIGHTS_INSTRUMENTATIONKEY: string;
  readonly VITE_APPINSIGHTS_CONN_STRING: string;
  readonly VITE_GA_TRACKINGID: string;
  readonly VITE_ENVIRONMENT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
/// <reference types="vite/client" />
/// <reference types="msw/vite/client" />
