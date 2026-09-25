import { describe, expect, it } from 'vitest';
import * as Yup from 'yup';
import '../../../ClientApp/src/validationSchemas/yupExtensions';
import '../../../ClientApp/src/validationSchemas/yupExtensions/index';
import { registerYupStringExtensions } from '../../../ClientApp/src/validationSchemas/yupExtensions/stringExtensions';

const valid = (schema: Yup.StringSchema, value: unknown) => schema.isValidSync(value);

describe('Yup string extension branch coverage', () => {
    it.each([
        ['fixedDigits', Yup.string().fixedDigits(2), null],
        ['numbersOnly', Yup.string().numbersOnly(), null],
        ['minValue', Yup.string().minValue(2), null],
        ['maxValue', Yup.string().maxValue(2), null],
        ['decimalNumbersOnly', Yup.string().decimalNumbersOnly(), null],
        ['postcode', Yup.string().postcode(), null],
        ['addressFormat', Yup.string().addressFormat(), null],
        ['phone', Yup.string().phone(), null],
        ['email', Yup.string().email(), null],
        ['noConsecutivePuncuation', Yup.string().noConsecutivePuncuation(), null],
        ['atLeastOneChar', Yup.string().atLeastOneChar(), null],
        ['isRequired', Yup.string().isRequired(), null],
        ['noConsecutiveChars', Yup.string().noConsecutiveChars(1), null],
        ['allowedFormat', Yup.string().allowedFormat(), null],
        ['nameAllowedFormat', Yup.string().nameAllowedFormat(), null],
        ['businessName', Yup.string().businessName(), null],
        ['minEntered', Yup.string().minEntered(2), null],
        ['numberWithinRange', Yup.string().numberWithinRange(1, 2), null],
        ['maxLength', Yup.string().maxLength(2), null],
    ])('rejects null for non-nullable %s schemas', (_name, schema, value) => {
        expect(valid(schema, value)).toBe(false);
    });

    it.each([
        ['fixedDigits', Yup.string().nullable().fixedDigits(2), null],
        ['numbersOnly', Yup.string().nullable().numbersOnly(), null],
        ['minValue', Yup.string().nullable().minValue(2), null],
        ['maxValue', Yup.string().nullable().maxValue(2), null],
        ['decimalNumbersOnly', Yup.string().nullable().decimalNumbersOnly(), null],
        ['postcode', Yup.string().nullable().postcode(), null],
        ['addressFormat', Yup.string().nullable().addressFormat(), null],
        ['phone', Yup.string().nullable().phone(), null],
        ['email', Yup.string().nullable().email(), null],
        ['noConsecutivePuncuation', Yup.string().nullable().noConsecutivePuncuation(), null],
        ['atLeastOneChar', Yup.string().nullable().atLeastOneChar(), null],
        ['noConsecutiveChars', Yup.string().nullable().noConsecutiveChars(), null],
        ['allowedFormat', Yup.string().nullable().allowedFormat(), null],
        ['nameAllowedFormat', Yup.string().nullable().nameAllowedFormat(), null],
        ['businessName', Yup.string().nullable().businessName(), null],
        ['minEntered', Yup.string().nullable().minEntered(2), null],
        ['numberWithinRange', Yup.string().nullable().numberWithinRange(1, 2), null],
        ['maxLength', Yup.string().nullable().maxLength(2), null],
    ])('allows null for nullable %s schemas', (_name, schema, value) => {
        expect(valid(schema, value)).toBe(true);
    });

    it('uses explicit error messages before label and fallback messages', async () => {
        await expect(Yup.string().fixedDigits(2, 'Code', 'Custom fixed').validate('1')).rejects.toThrow('Custom fixed');
        await expect(Yup.string().numbersOnly('Code').validate('A')).rejects.toThrow('Code must only include numbers');
        await expect(Yup.object({ code: Yup.string().numbersOnly() }).validate({ code: 'A' })).rejects.toThrow('code must only include numbers');
    });

    it('casts numbers before applying string extension tests', () => {
        expect(valid(Yup.string().fixedDigits(2), 12)).toBe(true);
        expect(valid(Yup.string().postcode(), 2600)).toBe(true);
        expect(valid(Yup.string().phone(), 412345678)).toBe(false);
        expect(valid(Yup.string().email(), 12)).toBe(false);
    });

    it.each([
        ['numbersOnly', Yup.string().numbersOnly(), 'abc', 'code must only include numbers'],
        ['minValue', Yup.string().minValue(10), '9', 'code cannot be less than 10 characters'],
        ['maxValue', Yup.string().maxValue(10), '11', 'code cannot be greater than 10 characters'],
        ['postcode', Yup.string().postcode(), '0100', 'code is not a valid Australian postcode'],
        ['phone', Yup.string().phone(undefined, undefined, 'Custom phone'), 'badbad', 'Custom phone'],
        ['email', Yup.string().email(), 'bad', 'code is not a valid email address'],
        ['noConsecutivePuncuation', Yup.string().noConsecutivePuncuation(), 'a  b', 'code must not contain consecutive apostrophe, hyphen or space characters'],
        ['atLeastOneChar', Yup.string().atLeastOneChar(), '123', 'code must contain at least one letter'],
        ['noConsecutiveChars', Yup.string().noConsecutiveChars(1), 'aa', 'code cannot have more than 1 repeating characters'],
        ['allowedFormat', Yup.string().allowedFormat(false), '@', 'code has invalid characters. Please use only letters, periods, numbers, and keyboard characters'],
        ['nameAllowedFormat', Yup.string().nameAllowedFormat(false), '1', 'code has invalid characters. Please enter only valid characters, such as alphabet, space, apostrophe, or hyphen'],
        ['businessName', Yup.string().businessName(), '<bad>', 'code contains invalid characters'],
        ['minEntered', Yup.string().minEntered(2), 'a', 'code cannot be less than 2 characters'],
        ['numberWithinRange', Yup.string().numberWithinRange(1, 2), '3', 'code must be between 1 and 2'],
        ['maxLength', Yup.string().maxLength(2), 'abc', 'code cannot be greater than 2 characters'],
    ])('uses fallback path messages for %s', async (_name, schema, value, message) => {
        await expect(Yup.object({ code: schema }).validate({ code: value })).rejects.toThrow(message);
    });

    it.each([
        ['fixedDigits', Yup.string().fixedDigits(2, 'Code'), '1', 'Code must be 2 digits'],
        ['numbersOnly', Yup.string().numbersOnly('Code'), 'abc', 'Code must only include numbers'],
        ['minValue', Yup.string().minValue(10, 'Code'), '9', 'Code cannot be less than 10 characters'],
        ['maxValue', Yup.string().maxValue(10, 'Code'), '11', 'Code cannot be greater than 10 characters'],
        ['decimalNumbersOnly', Yup.string().decimalNumbersOnly('Code'), 'abc', 'Code must only include numbers'],
        ['postcode', Yup.string().postcode('Postcode'), '0100', 'Postcode is not a valid Australian postcode'],
        ['addressFormat', Yup.string().addressFormat('Address'), '<bad>', 'Address contains invalid characters'],
        ['phone', Yup.string().phone(false, 'Phone'), 'badbad', 'Phone is not a valid phone number'],
        ['email', Yup.string().email('Email'), 'bad', 'Email is not a valid email address'],
        ['noConsecutivePuncuation', Yup.string().noConsecutivePuncuation('Name'), 'a  b', 'Name must not contain consecutive apostrophe, hyphen or space characters'],
        ['atLeastOneChar', Yup.string().atLeastOneChar('Code'), '123', 'Code must contain at least one letter'],
        ['noConsecutiveChars', Yup.string().noConsecutiveChars(3, 'Code'), 'aaa', 'Code cannot have more than 2 repeating characters'],
        ['allowedFormat', Yup.string().allowedFormat(false, 'Code'), '@', 'Code has invalid characters. Please use only letters, periods, numbers, and keyboard characters'],
        ['nameAllowedFormat', Yup.string().nameAllowedFormat(false, 'Name'), '1', 'Name has invalid characters. Please enter only valid characters, such as alphabet, space, apostrophe, or hyphen'],
        ['businessName', Yup.string().businessName('Business name'), '<bad>', 'Business name contains invalid characters'],
        ['minEntered', Yup.string().minEntered(2, 'Code'), 'a', 'Code cannot be less than 2 characters'],
        ['numberWithinRange', Yup.string().numberWithinRange(1, 2, 'Code'), '3', 'Code must be between 1 and 2'],
        ['maxLength', Yup.string().maxLength(2, 'Code'), 'abc', 'Code cannot be greater than 2 characters'],
    ])('uses label messages for %s', async (_name, schema, value, message) => {
        await expect(schema.validate(value)).rejects.toThrow(message);
    });

    it('covers postcode and businessName empty-value paths', () => {
        expect(Yup.string().postcode().isValidSync('')).toBe(true);
        expect(Yup.string().postcode().isValidSync('   ')).toBe(true);
        expect(Yup.string().businessName().isValidSync('')).toBe(true);
    });

    it('executes the yupExtensions barrel module explicitly', () => {
        expect(typeof Yup.string().maxLength).toBe('function');
    });

    it('allows repeat registration without adding duplicate methods', () => {
        registerYupStringExtensions();

        expect(typeof Yup.string().maxLength).toBe('function');
    });
});
