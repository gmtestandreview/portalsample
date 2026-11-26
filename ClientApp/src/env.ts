export interface TsEnv {
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
}
declare global {
  interface Window {
    APP_CONFIG: TsEnv;
  }
}

export const config = window.APP_CONFIG;
