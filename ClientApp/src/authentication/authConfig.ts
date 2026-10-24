import { BrowserUtils, LogLevel } from '@azure/msal-browser';
import type { Configuration, RedirectRequest } from '@azure/msal-browser';
import { env } from '../env';

export const redirectUri = env.VITE_B2C_REDIRECT_URL || '';

export const configuration: Configuration = {
  auth: {
    clientId: env.VITE_B2C_CLIENTID || '',
    authority: env.VITE_B2C_AUTHORITY,
    knownAuthorities: [env.VITE_B2C_KNOWN_AUTHORITIES || ''],
    redirectUri,
    postLogoutRedirectUri: env.VITE_B2C_POST_LOGOUT_REDIRECT_URL,
    onRedirectNavigate: () => !BrowserUtils.isInIframe(),
  },
  system: {
    loggerOptions: {
      loggerCallback: (
        level: LogLevel,
        message: string,
        containsPii: boolean
      ): void => {
        if (containsPii) {
          return;
        }
        if (level === LogLevel.Error) {
          console.error(message);
        }
      },
      piiLoggingEnabled: false,
    },
    popupBridgeTimeout: 60000,
    iframeBridgeTimeout: 6000,
    navigatePopups: true,
  },
};

export const scopes: string[] = [
  env.VITE_B2C_READ_SCOPE || '',
  env.VITE_B2C_USER_IMPERSONATION_SCOPE || '',
];

export const authRequest: RedirectRequest = {
  redirectUri,
  scopes,
};

export const tokenRequest = {
  scopes,
};
