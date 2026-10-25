import { describe, it, expect } from 'vitest';

import * as Yup from 'yup';

// Side-effect import registers all custom Yup string methods
import '../../../ClientApp/src/validationSchemas/yupExtensions';

/** Synchronous validity helper — keeps test bodies concise */
const valid = (schema: Yup.StringSchema, value: string | null | undefined) =>
  schema.isValidSync(value);

describe('fixedDigits', () => {
  const schema = Yup.string().fixedDigits(4);
  it('accepts a string of exactly 4 digits', () => {
    expect.assertions(1);
    expect(valid(schema, '1234')).toBe(true);
  });
});

describe('fixedDigits', () => {
  const schema = Yup.string().fixedDigits(4);
  it('rejects a string of 3 digits (too short)', () => {
    expect.assertions(1);
    expect(valid(schema, '123')).toBe(false);
  });
});

describe('fixedDigits', () => {
  const schema = Yup.string().fixedDigits(4);
  it('rejects a string of 5 digits (too long)', () => {
    expect.assertions(1);
    expect(valid(schema, '12345')).toBe(false);
  });
});

describe('fixedDigits', () => {
  const schema = Yup.string().fixedDigits(4);
  it('rejects a non-digit string', () => {
    expect.assertions(1);
    expect(valid(schema, 'abcd')).toBe(false);
  });
});

describe('fixedDigits', () => {
  const schema = Yup.string().fixedDigits(4);
  it('passes on empty string (optional by default)', () => {
    expect.assertions(1);
    expect(valid(schema, '')).toBe(true);
  });
});
