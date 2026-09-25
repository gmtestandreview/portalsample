import { describe, it, expect } from 'vitest';
// After the fix, contactValidation re-exports emailSchema from common.
// This import verifies the re-routed version behaves identically.
import { emailSchema } from '../../../ClientApp/src/validationSchemas/contactValidation';

describe('emailSchema — post-consolidation (sourced from common.ts)', () => {
    it('accepts a valid email address', async () => {
        const schema = emailSchema('Email address');
        await expect(schema.validate('user@example.com')).resolves.toBe('user@example.com');
    });

    it('rejects an invalid email format', async () => {
        const schema = emailSchema('Email address');
        await expect(schema.validate('not-an-email')).rejects.toThrow('Email address is not a valid email address');
    });

    it('rejects an empty string when required (default)', async () => {
        const schema = emailSchema('Email address');
        await expect(schema.validate('')).rejects.toThrow('Email address is required');
    });

    it('accepts empty string when required=false', async () => {
        const schema = emailSchema('Email address', false);
        await expect(schema.validate('')).resolves.toBeDefined();
    });

    it('enforces 100-character max length', async () => {
        const schema = emailSchema('Email address');
        const longEmail = `${'a'.repeat(90)}@example.com`; // 102 chars
        await expect(schema.validate(longEmail)).rejects.toThrow('Email address cannot be greater than 100 characters');
    });
});
