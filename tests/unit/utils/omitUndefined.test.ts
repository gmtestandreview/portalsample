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

    const result = omitUndefined(input);

    expect(result).toStrictEqual({
      empty: '',
      falseValue: false,
      nullValue: null,
      zero: 0,
    });
    expect(Object.hasOwn(result, 'missing')).toBe(false);
  });

  it('does not mutate the input and only removes top-level values', () => {
    const nested = { keep: 'value', missing: undefined };
    const input = Object.freeze({ nested, missing: undefined });
    const result = omitUndefined(input);

    expect(result).toStrictEqual({ nested });
    expect(result).not.toBe(input);
    expect(result.nested).toBe(nested);
    expect(Object.hasOwn(result, 'missing')).toBe(false);
    expect(input).toStrictEqual({ nested, missing: undefined });
    expect(Object.hasOwn(input, 'missing')).toBe(true);
    expect(nested).toStrictEqual({ keep: 'value', missing: undefined });
  });

  it('preserves defined enumerable symbols and removes undefined symbols', () => {
    const symbol = Symbol('profile');
    const missingSymbol = Symbol('missing');
    const input = { [symbol]: 'value', [missingSymbol]: undefined };
    const result = omitUndefined(input);

    expect(result).toStrictEqual({ [symbol]: 'value' });
    expect(Object.hasOwn(result, missingSymbol)).toBe(false);
    expect(Object.hasOwn(input, missingSymbol)).toBe(true);
  });

  it('excludes non-enumerable string and symbol properties without reading them', () => {
    const symbol = Symbol('hidden');
    const input = { keep: 'value' };
    Object.defineProperty(input, 'hidden', {
      enumerable: false,
      get() {
        throw new Error('Non-enumerable getters should not be read');
      },
    });
    Object.defineProperty(input, symbol, {
      value: 'hidden',
      enumerable: false,
    });

    const result = omitUndefined(input);

    expect(result).toStrictEqual({ keep: 'value' });
    expect(Object.hasOwn(result, 'hidden')).toBe(false);
    expect(Object.hasOwn(result, symbol)).toBe(false);
    expect(Object.hasOwn(input, 'hidden')).toBe(true);
    expect(Object.hasOwn(input, symbol)).toBe(true);
  });

  it('reads each enumerable getter once', () => {
    let definedReads = 0;
    let undefinedReads = 0;
    const input = {
      get keep() {
        definedReads += 1;
        return 'value';
      },
      get missing() {
        undefinedReads += 1;
        return undefined;
      },
    };

    const result = omitUndefined(input);

    expect(result).toStrictEqual({ keep: 'value' });
    expect(Object.hasOwn(result, 'missing')).toBe(false);
    expect(definedReads).toBe(1);
    expect(undefinedReads).toBe(1);
  });

  it('accepts null-prototype inputs and returns a plain object', () => {
    const input = { keep: 'value', missing: undefined };
    Object.setPrototypeOf(input, null);

    const result = omitUndefined(input);

    expect(result).toStrictEqual({ keep: 'value' });
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(Object.getPrototypeOf(input)).toBeNull();
    expect(Object.hasOwn(input, 'missing')).toBe(true);
  });

  it('copies an own __proto__ key without changing the result prototype', () => {
    const input = {
      ['__proto__']: { marker: 'value' },
      missing: undefined,
    };

    const result = omitUndefined(input);

    expect(Object.hasOwn(result, '__proto__')).toBe(true);
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(result['__proto__']).toBe(input['__proto__']);
    expect(result).toStrictEqual({ ['__proto__']: input['__proto__'] });
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
