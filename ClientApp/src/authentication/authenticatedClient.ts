import type {
  AccountInfo,
  IPublicClientApplication,
} from '@azure/msal-browser';
import { silentRequestFor } from './silentRequest';

interface TokenAuthenticatedClient {
  setAuthToken(token: string): void;
}

/** Builds an API client and authenticates it with a silent token for the first account. */
export const createAuthenticatedClient = async <
  T extends TokenAuthenticatedClient,
>(
  ClientType: new () => T,
  accounts: AccountInfo[],
  instance: IPublicClientApplication,
): Promise<T> => {
  const client = new ClientType();
  const tokenResult = await instance.acquireTokenSilent(
    silentRequestFor(accounts[0]),
  );
  client.setAuthToken(tokenResult.accessToken);
  return client;
};
