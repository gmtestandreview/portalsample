import { describe, expect, it } from 'vitest';

import * as Yup from 'yup';

import '../../../ClientApp/src/validationSchemas/yupExtensions';

import '../../../ClientApp/src/validationSchemas/yupExtensions/index';

import { registerYupStringExtensions } from '../../../ClientApp/src/validationSchemas/yupExtensions/stringExtensions';

const valid = (schema: Yup.StringSchema, value: unknown) =>
  schema.isValidSync(value);

describe('yup string extension branch coverage', () => {
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
    expect.assertions(1);
    expect(valid(schema, value)).toBe(false);
  });
});

describe('yup string extension branch coverage', () => {
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
    [
      'noConsecutivePuncuation',
      Yup.string().nullable().noConsecutivePuncuation(),
      null,
    ],
    ['atLeastOneChar', Yup.string().nullable().atLeastOneChar(), null],
    ['noConsecutiveChars', Yup.string().nullable().noConsecutiveChars(), null],
    ['allowedFormat', Yup.string().nullable().allowedFormat(), null],
    ['nameAllowedFormat', Yup.string().nullable().nameAllowedFormat(), null],
    ['businessName', Yup.string().nullable().businessName(), null],
    ['minEntered', Yup.string().nullable().minEntered(2), null],
    [
      'numberWithinRange',
      Yup.string().nullable().numberWithinRange(1, 2),
      null,
    ],
    ['maxLength', Yup.string().nullable().maxLength(2), null],
  ])('allows null for nullable %s schemas', (_name, schema, value) => {
    expect.assertions(1);
    expect(valid(schema, value)).toBe(true);
  });
});

describe('yup string extension branch coverage', () => {
  it('uses explicit error messages before label and fallback messages', async () => {
    expect.assertions(3);
    await expect(
      Yup.string().fixedDigits(2, 'Code', 'Custom fixed').validate('1'),
    ).rejects.toThrow('Custom fixed');
    await expect(
      Yup.string().numbersOnly('Code').validate('A'),
    ).rejects.toThrow('Code must only include numbers');
    await expect(
      Yup.object({ code: Yup.string().numbersOnly() }).validate({ code: 'A' }),
    ).rejects.toThrow('code must only include numbers');
  });
});
