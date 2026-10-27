import type { AccountInfo } from '@azure/msal-browser';
import { describe, expect, it, vi } from 'vitest';

vi.mock(
  import('@/env'),
  (() =>
    ({
      env: {
        VITE_B2C_READ_SCOPE: 'read',
        VITE_B2C_USER_IMPERSONATION_SCOPE: 'user_impersonation',
      },
    }) satisfies __ExactMockModule<__TestMockModule10>) as unknown as __DynamicPartialMockFactory<__TestMockModule10>,
);

const account = {
  homeAccountId: 'home-id',
  environment: 'example.test',
  tenantId: 'tenant-id',
  username: 'user@example.test',
  localAccountId: 'local-id',
} satisfies AccountInfo;

describe('silentRequestFor', () => {
  it('combines the token scopes with the signed-in account', async () => {
    expect.hasAssertions();

    const { silentRequestFor } = await import('@/authentication/silentRequest');

    expect(silentRequestFor(account)).toStrictEqual({
      scopes: ['read', 'user_impersonation'],
      account,
    });
  });

  it('omits the account key when nobody is signed in', async () => {
    expect.hasAssertions();

    const { silentRequestFor } = await import('@/authentication/silentRequest');

    const request = silentRequestFor(undefined);

    expect(request).toStrictEqual({ scopes: ['read', 'user_impersonation'] });
    expect(Object.hasOwn(request, 'account')).toBe(false);
  });
});
