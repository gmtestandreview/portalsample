import { describe, it, expect } from 'vitest';
import { isWafError, AZURE_WAF_SERVER_PREFIX } from './wafError';

describe('isWafError', () => {
    it('returns true for an error shaped like an Azure WAF response', () => {
        const error = {
            headers: { server: 'Microsoft-Azure-Application-Gateway/2.5' },
        };
        expect(isWafError(error)).toBe(true);
    });

    it('returns true when server header is exactly the prefix (no version suffix)', () => {
        const error = {
            headers: { server: AZURE_WAF_SERVER_PREFIX },
        };
        expect(isWafError(error)).toBe(true);
    });

    it('returns false for a normal 403 error (no WAF header)', () => {
        const error = {
            headers: { server: 'nginx/1.21.0' },
        };
        expect(isWafError(error)).toBe(false);
    });

    it('returns false when headers is absent', () => {
        expect(isWafError({ status: 403 })).toBe(false);
    });

    it('returns false for null', () => {
        expect(isWafError(null)).toBe(false);
    });

    it('returns false for a non-object primitive', () => {
        expect(isWafError('string error')).toBe(false);
        expect(isWafError(42)).toBe(false);
        expect(isWafError(undefined)).toBe(false);
    });

    it('returns false when headers.server is not a string', () => {
        expect(isWafError({ headers: { server: 12345 } })).toBe(false);
        expect(isWafError({ headers: { server: null } })).toBe(false);
    });

    it('returns false when headers itself is not an object', () => {
        expect(isWafError({ headers: 'flat-string' })).toBe(false);
        expect(isWafError({ headers: null })).toBe(false);
    });
});
