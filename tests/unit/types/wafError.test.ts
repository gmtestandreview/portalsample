import { describe, expect, it } from 'vitest';
import { AZURE_WAF_SERVER_PREFIX, isWafError } from '../../../ClientApp/src/types/wafError';

describe('isWafError', () => {
    it('returns true for Azure WAF server headers', () => {
        expect(isWafError({
            headers: { server: 'Microsoft-Azure-Application-Gateway/2.5' },
        })).toBe(true);
        expect(isWafError({
            headers: { server: AZURE_WAF_SERVER_PREFIX },
        })).toBe(true);
    });

    it.each([
        { headers: { server: 'nginx/1.21.0' } },
        { headers: { server: 12345 } },
        { headers: { server: null } },
        { headers: 'flat-string' },
        { headers: null },
        { status: 403 },
        {},
        null,
        'string error',
        42,
        undefined,
    ])('returns false for non-WAF errors %#', (error) => {
        expect(isWafError(error)).toBe(false);
    });
});
