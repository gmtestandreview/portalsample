import { describe, expect, it } from 'vitest';

import { omitUndefined } from '../../../ClientApp/src/utils/omitUndefined';

describe(omitUndefined, () => {
  it('removes undefined values while preserving other values', () => {
    expect.assertions(2);
    const input = {
      empty: '',
      falseValue: false,
      nullValue: null,
      zero: 0,
      missing: undefined,
    };

    const result = omitUndefined(input);

    expect(result).toStrictEqual({
      empty: '',
      falseValue: false,
      nullValue: null,
      zero: 0,
    });
    expect(Object.hasOwn(result, 'missing')).toBe(false);
  });
});

describe(omitUndefined, () => {
  it('does not mutate the input and only removes top-level values', () => {
    expect.assertions(1);
    const nested = { keep: 'value', missing: undefined };
    const input = Object.freeze({ nested, missing: undefined });
    const result = omitUndefined(input);
    expect(result).toStrictEqual({ nested });
  });
});

describe(omitUndefined, () => {
  it('does not mutate the input and only removes top-level values', () => {
    expect.assertions(1);
    const nested = { keep: 'value', missing: undefined };
    const input = Object.freeze({ nested, missing: undefined });
    const result = omitUndefined(input);
    expect(result).not.toBe(input);
  });
});

describe(omitUndefined, () => {
  it('does not mutate the input and only removes top-level values', () => {
    expect.assertions(1);
    const nested = { keep: 'value', missing: undefined };
    const input = Object.freeze({ nested, missing: undefined });
    const result = omitUndefined(input);
    expect(result.nested).toBe(nested);
  });
});
