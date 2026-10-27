import { describe, it, expect } from 'vitest';

import { isWafError, AZURE_WAF_SERVER_PREFIX } from './wafError';

describe('waf error with Azure header', () => {
  it('returns true for an error shaped like an Azure WAF response', () => {
    expect.assertions(1);

    const error = {
      headers: { server: 'Microsoft-Azure-Application-Gateway/2.5' },
    };

    expect(isWafError(error)).toBe(true);
  });
});

describe('waf error with exact prefix', () => {
  it('returns true when server header is exactly the prefix (no version suffix)', () => {
    expect.assertions(1);

    const error = {
      headers: { server: AZURE_WAF_SERVER_PREFIX },
    };

    expect(isWafError(error)).toBe(true);
  });
});

describe('non-WAF server header', () => {
  it('returns false for a normal 403 error (no WAF header)', () => {
    expect.assertions(1);

    const error = {
      headers: { server: 'nginx/1.21.0' },
    };

    expect(isWafError(error)).toBe(false);
  });
});

describe('waf error without headers', () => {
  it('returns false when headers is absent', () => {
    expect.assertions(1);
    expect(isWafError({ status: 403 })).toBe(false);
  });
});

describe('null waf error', () => {
  it('returns false for null', () => {
    expect.assertions(1);
    expect(isWafError(null)).toBe(false);
  });
});
