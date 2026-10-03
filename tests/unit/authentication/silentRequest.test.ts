import type { AccountInfo } from '@azure/msal-browser';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/env', () => ({
  env: {
    REACT_APP_B2C_READ_SCOPE: 'read',
    REACT_APP_B2C_USER_IMPERSONATION_SCOPE: 'user_impersonation',
  },
}));

const account = {
  homeAccountId: 'home-id',
  environment: 'example.test',
  tenantId: 'tenant-id',
  username: 'user@example.test',
  localAccountId: 'local-id',
} satisfies AccountInfo;

describe('silentRequestFor', () => {
  it('combines the token scopes with the signed-in account', async () => {
    const { silentRequestFor } = await import('@/authentication/silentRequest');

    expect(silentRequestFor(account)).toEqual({
      scopes: ['read', 'user_impersonation'],
      account,
    });
  });

  it('omits the account key when nobody is signed in', async () => {
    const { silentRequestFor } = await import('@/authentication/silentRequest');

    const request = silentRequestFor(undefined);

    expect(request).toEqual({ scopes: ['read', 'user_impersonation'] });
    expect(Object.hasOwn(request, 'account')).toBe(false);
  });
});
