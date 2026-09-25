import { LogLevel } from '@azure/msal-browser';
import type { Configuration, SilentRequest } from '@azure/msal-browser';
import { env } from '../env';

export const configuration: Configuration = {
    auth: {
        clientId: env.REACT_APP_B2C_CLIENTID || '',
        authority: env.REACT_APP_B2C_AUTHORITY,
        knownAuthorities: [env.REACT_APP_B2C_KNOWN_AUTHORITIES || ''],
        postLogoutRedirectUri: env.REACT_APP_B2C_POST_LOGOUT_REDIRECT_URL,
    },
    system: {
        loggerOptions: {
            loggerCallback: (
                level: LogLevel,
                message: string,
                containsPii: boolean,
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
        windowHashTimeout: 60000,
        iframeHashTimeout: 6000,
        loadFrameTimeout: 6000,
        asyncPopups: false,
    },
};

export const scopes: string[] = [
    env.REACT_APP_B2C_READ_SCOPE || '',
    env.REACT_APP_B2C_USER_IMPERSONATION_SCOPE || '',
];

export const redirectUri = env.REACT_APP_B2C_REDIRECT_URL || '';

export const authRequest: SilentRequest = {
    redirectUri,
    scopes,
};

export const tokenRequest = {
    scopes,
};
