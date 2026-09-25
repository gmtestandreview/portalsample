import { describe, expect, it } from 'vitest';

import { emailSchema } from '../../../ClientApp/src/validationSchemas/common';

/**
 * The domain part of the `.email()` regex in stringExtensions.ts is ambiguous:
 * a run of hyphens can be split between the quantifier and the character class
 * in exponentially many ways, so a non-matching tail forces the engine to try
 * every split.
 *
 * These schemas are shared with a Node backend, where the event loop is single
 * threaded - one request stalled here stalls every concurrent user, so this is
 * a remote denial of service, not a slow field.
 *
 * 34 characters, comfortably under the schema's own 100-character cap, so
 * `.maxLength(100)` never gets the chance to reject it first.
 */
const BACKTRACKING_BAIT = `a@a${'-'.repeat(30)}!`;

// Generous: the vulnerable regex takes ~2s on this input, a linear-time one
// takes well under a millisecond. Wide enough not to flake on a loaded CI box.
const BUDGET_MS = 250;

describe('emailSchema - ReDoS resistance', () => {
    it('rejects a backtracking-bait address without catastrophic slowdown', () => {
        const schema = emailSchema('Email address');

        const start = performance.now();
        const isValid = schema.isValidSync(BACKTRACKING_BAIT);
        const elapsed = performance.now() - start;

        expect(isValid).toBe(false);
        expect(elapsed).toBeLessThan(BUDGET_MS);
    });

    it('rejects a long unbroken domain without catastrophic slowdown', () => {
        // No hyphens at all - the old regex still backtracked here, because the
        // domain cannot fit the bounded {0,62} group and every split is tried.
        const schema = emailSchema('Email address');

        const start = performance.now();
        schema.isValidSync(`a@${'y'.repeat(70)}.com`);
        const elapsed = performance.now() - start;

        expect(elapsed).toBeLessThan(BUDGET_MS);
    });
});

describe('emailSchema - accepted addresses', () => {
    it.each([
        ['a@b.co', 'shortest valid form'],
        ['first.last@example.com', 'dotted local part'],
        ['user+tag@example.com', 'plus addressing'],
        ["o'brien@example.com", 'apostrophe in local part'],
        ['user@sub.example.gov.au', 'multi-level domain'],
        ['user@national-measurement.gov.au', 'hyphen inside a label'],
        ['user@xn--80ak6aa92e.com', 'punycode, consecutive hyphens'],
    ])('accepts %s (%s)', (address) => {
        expect(emailSchema('Email address').isValidSync(address)).toBe(true);
    });
});

describe('emailSchema - rejected addresses', () => {
    it.each([
        ['plainaddress', 'no @ at all'],
        ['@example.com', 'empty local part'],
        ['a@b', 'no dot in domain'],
        ['a@.com', 'empty label'],
        ['a@b.', 'empty TLD'],
        ['a@-lead.com', 'label starts with a hyphen'],
        ['a@example.1com', 'TLD does not start with a letter'],
        ['a@b@c.com', 'two @ characters'],
    ])('rejects %s (%s)', (address) => {
        expect(emailSchema('Email address').isValidSync(address)).toBe(false);
    });

    it('rejects a domain label that ends with a hyphen', () => {
        // Behaviour change, deliberate. The previous regex accepted this; a
        // trailing hyphen is not a legal DNS label (RFC 1035), and the old
        // pattern only allowed it because its ambiguous domain group could
        // absorb the hyphen. Nothing resolvable is lost.
        expect(emailSchema('Email address').isValidSync('a@trail-.com')).toBe(false);
    });

    it('rejects a domain label longer than the 63-character DNS limit', () => {
        const tooLong = `a@${'y'.repeat(64)}.com`;

        expect(emailSchema('Email address').isValidSync(tooLong)).toBe(false);
    });
});
