import { describe, it, expect } from 'vitest';

import { isWafError, AZURE_WAF_SERVER_PREFIX } from './wafError';

describe(isWafError, () => {
  it('returns true for an error shaped like an Azure WAF response', () => {
    expect.assertions(1);

    const error = {
      headers: { server: 'Microsoft-Azure-Application-Gateway/2.5' },
    };

    expect(isWafError(error)).toBe(true);
  });
});

describe(isWafError, () => {
  it('returns true when server header is exactly the prefix (no version suffix)', () => {
    expect.assertions(1);

    const error = {
      headers: { server: AZURE_WAF_SERVER_PREFIX },
    };

    expect(isWafError(error)).toBe(true);
  });
});

describe(isWafError, () => {
  it('returns false for a normal 403 error (no WAF header)', () => {
    expect.assertions(1);

    const error = {
      headers: { server: 'nginx/1.21.0' },
    };

    expect(isWafError(error)).toBe(false);
  });
});

describe(isWafError, () => {
  it('returns false when headers is absent', () => {
    expect.assertions(1);
    expect(isWafError({ status: 403 })).toBe(false);
  });
});

describe(isWafError, () => {
  it('returns false for null', () => {
    expect.assertions(1);
    expect(isWafError(null)).toBe(false);
  });
});
