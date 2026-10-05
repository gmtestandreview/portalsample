import { describe, expect, it } from 'vitest';
import { omitUndefined } from '../../../ClientApp/src/utils/omitUndefined';

describe('omitUndefined', () => {
  it('removes undefined values while preserving other values', () => {
    const input = {
      empty: '',
      falseValue: false,
      nullValue: null,
      zero: 0,
      missing: undefined,
    };

    expect(omitUndefined(input)).toEqual({
      empty: '',
      falseValue: false,
      nullValue: null,
      zero: 0,
    });
  });

  it('does not mutate the input and only removes top-level values', () => {
    const nested = { keep: 'value', missing: undefined };
    const input = { nested, missing: undefined };

    expect(omitUndefined(input)).toEqual({ nested });
    expect(input).toEqual({ nested, missing: undefined });
    expect(nested).toEqual({ keep: 'value', missing: undefined });
  });

  it('preserves enumerable symbol keys', () => {
    const symbol = Symbol('profile');
    const input = { [symbol]: 'value', missing: undefined };

    expect(omitUndefined(input)).toEqual({ [symbol]: 'value' });
  });

  it('rejects arrays instead of returning a non-array object', () => {
    expect(() => omitUndefined([1, undefined])).toThrow(TypeError);
  });

  it('rejects class instances whose prototype properties are not enumerable entries', () => {
    class Profile {
      readonly name = 'Taylor';
    }

    expect(() => omitUndefined(new Profile())).toThrow(TypeError);
  });
});
