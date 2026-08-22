import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    sanitize: vi.fn((value: string) => `sanitized:${value}`),
}));

vi.mock('dompurify', () => ({
    default: {
        sanitize: mocks.sanitize,
    },
}));

describe('TrustedTypes', () => {
    afterEach(() => {
        delete (globalThis as { trustedTypes?: unknown }).trustedTypes;
        vi.restoreAllMocks();
    });

    it('creates a default trusted types policy that sanitizes HTML and script URLs', async () => {
        const createPolicy = vi.fn();
        (globalThis as { trustedTypes?: { createPolicy: typeof createPolicy } }).trustedTypes = { createPolicy };
        const { TrustedTypes } = await import('../../../ClientApp/src/trustedtypes');

        TrustedTypes.createTrustedTypePolicy();

        expect(createPolicy).toHaveBeenCalledWith('default', {
            createScriptURL: expect.any(Function),
            createHTML: expect.any(Function),
            createScript: expect.any(Function),
        });

        const [, policy] = createPolicy.mock.calls[0];
        expect(policy.createScriptURL('https://example.test/script.js')).toBe('sanitized:https://example.test/script.js');
        expect(policy.createHTML('<p>Hello</p>')).toBe('sanitized:<p>Hello</p>');
        expect(() => policy.createScript()).toThrow('Inline script creation is not allowed');
    });

    it('does nothing when trusted types are unavailable', async () => {
        const { TrustedTypes } = await import('../../../ClientApp/src/trustedtypes');

        expect(() => TrustedTypes.createTrustedTypePolicy()).not.toThrow();
    });
});
