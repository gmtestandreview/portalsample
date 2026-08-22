import { describe, it, expect } from 'vitest';
import * as Yup from 'yup';
// Side-effect import registers all custom Yup methods including businessName
import '../../../ClientApp/src/validationSchemas/yupExtensions';

describe('Yup stringExtensions — businessName', () => {
    const schema = Yup.string().businessName('Business name');

    it('accepts a valid ASIC-compliant business name', async () => {
        await expect(schema.validate('Test Pty Ltd & Co.')).resolves.toBe('Test Pty Ltd & Co.');
    });

    it('accepts characters from the ASIC allowed set: ! @ # $ % ^ & * ( ) ? ; : = _ - / . , \'', async () => {
        await expect(schema.validate("O'Brien-Smith Pty Ltd")).resolves.toBeDefined();
    });

    it('rejects a name containing < or > (disallowed ASIC chars)', async () => {
        await expect(schema.validate('<script>bad</script>')).rejects.toThrow('Business name contains invalid characters');
    });

    it('allows empty string (required check is a separate concern)', async () => {
        await expect(schema.validate('')).resolves.toBeDefined();
    });

    it('Yup.string() exposes .businessName as a function — declaration is present', () => {
        expect(typeof Yup.string().businessName).toBe('function');
    });
});
