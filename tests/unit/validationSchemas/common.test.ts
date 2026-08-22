import { describe, expect, it } from 'vitest';
import * as yup from 'yup';
import '../../../ClientApp/src/validationSchemas/yupExtensions';
import {
    IsEmpty,
    NotEmpty,
    emailSchema,
    isEmptyDate,
    isFutureDate,
    isValidAbn,
    nullableDate,
    nullableString,
    numberToText,
    oneOfEnum,
    requiredNullableDate,
    requiredNullableString,
    websiteUrlSchema,
} from '../../../ClientApp/src/validationSchemas/common';

describe('common validation helpers', () => {
    it.each([
        ['value', true, false],
        [' value ', true, false],
        ['', false, true],
        ['   ', false, true],
        [undefined, false, true],
        [null, false, true],
    ])('classifies %s with NotEmpty and IsEmpty', (value, notEmpty, empty) => {
        expect(NotEmpty(value)).toBe(notEmpty);
        expect(IsEmpty(value)).toBe(empty);
    });

    it.each([
        [undefined, true],
        [null, true],
        ['', true],
        ['   ', true],
        ['01/01/2026', false],
        [new Date(2026, 0, 1), false],
        [{}, false],
    ])('classifies empty date values', (value, expected) => {
        expect(isEmptyDate(value)).toBe(expected);
    });

    it('trims nullable strings and defaults non-strings to empty string', () => {
        const schema = nullableString('Name');

        expect(schema.validateSync('  NMI  ')).toBe('NMI');
        expect(schema.validateSync(undefined)).toBe('');
        expect(schema.validateSync(123)).toBe('123');
        expect(schema.validateSync({})).toBe('');
    });

    it('requires nullable strings after trimming', async () => {
        const schema = requiredNullableString('Name');

        await expect(schema.validate(' NMI ')).resolves.toBe('NMI');
        await expect(schema.validate(123)).resolves.toBe('123');
        expect(schema.cast({})).toBe('');
        await expect(schema.validate('   ')).rejects.toThrow('Name is required');
    });

    it('validates required nullable dates', async () => {
        const schema = requiredNullableDate('Preferred date');

        await expect(schema.validate('01/01/2026')).resolves.toBeDefined();
        await expect(schema.validate('')).rejects.toThrow('Preferred date is required');
        await expect(schema.validate('31/02/2026')).rejects.toThrow('DD/MM/YYYY');
        await expect(schema.validate({})).rejects.toThrow('DD/MM/YYYY');
    });

    it('allows empty optional dates and rejects invalid populated dates', async () => {
        const schema = nullableDate('Preferred date');

        await expect(schema.validate('')).resolves.toBeUndefined();
        await expect(schema.validate(null)).resolves.toBeUndefined();
        await expect(schema.validate('01/01/2026')).resolves.toBeDefined();
        await expect(schema.validate('01/01/10000')).rejects.toThrow('DD/MM/YYYY');
    });

    it('creates enum oneOf schemas', async () => {
        const schema = oneOfEnum({ Yes: 'Yes', No: 'No' });

        await expect(schema.validate('Yes')).resolves.toBe('Yes');
        await expect(schema.validate('Maybe')).rejects.toThrow();
    });

    it('checks future dates while ignoring empty and invalid values', () => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const test = isFutureDate();

        expect(test(tomorrow)).toBe(true);
        expect(test(yesterday)).toBe(false);
        expect(test('')).toBe(true);
        expect(test({})).toBe(true);
        expect(test('31/02/2026')).toBe(true);
    });

    it('validates website URLs with excludeEmpty enabled and disabled', async () => {
        const optionalWebsite = websiteUrlSchema('Invalid website');
        const nonEmptyWebsite = websiteUrlSchema('Invalid website', false);

        await expect(optionalWebsite.validate('https://measurement.gov.au')).resolves.toBe('https://measurement.gov.au');
        await expect(optionalWebsite.validate('')).resolves.toBe('');
        await expect(optionalWebsite.validate('not a website')).rejects.toThrow('Invalid website');
        await expect(nonEmptyWebsite.validate('')).rejects.toThrow('Invalid website');
    });

    it('validates required and optional email schemas', async () => {
        await expect(emailSchema('Email').validate('user@example.com')).resolves.toBe('user@example.com');
        await expect(emailSchema('Email').validate('bad')).rejects.toThrow('Email is not a valid email address');
        await expect(emailSchema('Email').validate('')).rejects.toThrow('Email is required');
        await expect(emailSchema('Email', false).validate('')).resolves.toBe('');
    });

    it.each([
        ['51824753556', true],
        ['51824753557', false],
        ['51 824 753 556', false],
        ['1234567890', false],
    ])('validates ABN %s', (value, expected) => {
        expect(isValidAbn(value)).toBe(expected);
    });

    it('converts known digits to text and falls back to the number string', () => {
        expect(numberToText(1)).toBe('one');
        expect(numberToText(10)).toBe('ten');
        expect(numberToText(11)).toBe('11');
    });

    it('exposes registered string extensions through the side-effect index', () => {
        expect(typeof yup.string().maxLength).toBe('function');
    });
});
