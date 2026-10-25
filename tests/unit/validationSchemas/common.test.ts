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
    expect.assertions(2);
    expect(NotEmpty(value)).toBe(notEmpty);
    expect(IsEmpty(value)).toBe(empty);
  });
});

describe('common validation helpers', () => {
  it.each([
    [undefined, true],
    [null, true],
    ['', true],
    ['   ', true],
    ['01/01/2026', false],
    [new Date(2026, 0, 1), false],
    [{}, false],
  ])('classifies empty date values', (value, expected) => {
    expect.assertions(1);
    expect(isEmptyDate(value)).toBe(expected);
  });
});
