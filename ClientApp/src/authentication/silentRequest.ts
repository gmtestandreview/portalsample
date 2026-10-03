import type { AccountInfo, SilentRequest } from '@azure/msal-browser';
import { tokenRequest } from './authConfig';

/**
 * Builds a silent token request for `account`. With `exactOptionalPropertyTypes`, `account` cannot
 * be passed as an explicit `undefined`, so the key is omitted when no account is signed in
 * (MSAL then reports its own no-account error, as it did for an `undefined` value).
 */
export const silentRequestFor = (
  account: AccountInfo | undefined
): SilentRequest => ({
  ...tokenRequest,
  ...(account ? { account } : {}),
});
