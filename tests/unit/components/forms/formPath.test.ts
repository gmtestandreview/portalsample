import { describe, expect, it } from 'vitest';
import { getIn, isObject, setIn } from '@/components/forms/formPath';

describe('isObject', () => {
  it('is true for plain objects and arrays', () => {
    expect(isObject({})).toBe(true);
    expect(isObject([])).toBe(true);
  });

  it('is false for null, primitives and functions', () => {
    expect(isObject(null)).toBe(false);
    expect(isObject(undefined)).toBe(false);
    expect(isObject('text')).toBe(false);
    expect(isObject(1)).toBe(false);
    expect(isObject(() => undefined)).toBe(false);
  });
});

describe('getIn', () => {
  const values = { a: { b: [{ c: 'deep' }] }, empty: null, zero: 0 };

  it('reads dotted and bracketed paths', () => {
    expect(getIn(values, 'a.b[0].c')).toBe('deep');
    expect(getIn(values, 'a.b.0.c')).toBe('deep');
    expect(getIn(values, ['a', 'b', '0', 'c'])).toBe('deep');
  });

  it('returns the default when the path is missing', () => {
    expect(getIn(values, 'a.missing.c', 'fallback')).toBe('fallback');
    expect(getIn(values, 'a.missing.c')).toBeUndefined();
    expect(getIn(undefined, 'a', 'fallback')).toBe('fallback');
  });

  it('returns falsy leaf values instead of the default', () => {
    expect(getIn(values, 'zero', 'fallback')).toBe(0);
    expect(getIn(values, 'empty', 'fallback')).toBeNull();
  });

  it('returns the default when a path runs through a falsy value', () => {
    expect(getIn(values, 'empty.x', 'fallback')).toBe('fallback');
  });
});

describe('setIn', () => {
  it('sets a nested value without mutating the source', () => {
    const source = { a: { b: 1, keep: true } };
    const result = setIn(source, 'a.b', 2);

    expect(result).toEqual({ a: { b: 2, keep: true } });
    expect(source).toEqual({ a: { b: 1, keep: true } });
    expect(result.a).not.toBe(source.a);
  });

  it('creates missing objects and arrays along the path', () => {
    expect(setIn({}, 'a.b', 'x')).toEqual({ a: { b: 'x' } });
    expect(setIn({}, 'list[1].name', 'x')).toEqual({
      list: [undefined, { name: 'x' }],
    });
  });

  it('returns the original object when the value is unchanged', () => {
    const source = { a: { b: 1 } };

    expect(setIn(source, 'a.b', 1)).toBe(source);
  });

  it('deletes the key when the value is undefined', () => {
    expect(setIn({ a: { b: 1, c: 2 } }, 'a.b', undefined)).toEqual({
      a: { c: 2 },
    });
    expect(setIn({ a: 1, b: 2 }, 'a', undefined)).toEqual({ b: 2 });
  });
});
