// Vite leaves a VITE_* variable undefined when it is not set at build time, so
// each one is declared optional. env.ts supplies the '' fallback.
interface ImportMetaEnv {
  readonly VITE_B2C_CLIENTID?: string | undefined;
  readonly VITE_B2C_AUTHORITY?: string | undefined;
  readonly VITE_B2C_KNOWN_AUTHORITIES?: string | undefined;
  readonly VITE_B2C_POST_LOGOUT_REDIRECT_URL?: string | undefined;
  readonly VITE_B2C_READ_SCOPE?: string | undefined;
  readonly VITE_B2C_USER_IMPERSONATION_SCOPE?: string | undefined;
  readonly VITE_B2C_REDIRECT_URL?: string | undefined;
  readonly VITE_EXTERNAL_REDIRECT_URL?: string | undefined;
  readonly VITE_APPINSIGHTS_INSTRUMENTATIONKEY?: string | undefined;
  readonly VITE_APPINSIGHTS_CONN_STRING?: string | undefined;
  readonly VITE_GA_TRACKINGID?: string | undefined;
  readonly VITE_ENVIRONMENT?: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
/// <reference types="vite/client" />
/// <reference types="msw/vite/client" />
