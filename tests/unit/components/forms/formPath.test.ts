import { describe, expect, it } from 'vitest';
import { getIn, isObject, setIn } from '@/components/forms/formPath';

describe('form path object checks', () => {
  it('is true for plain objects and arrays', () => {
    expect.hasAssertions();
    expect(isObject({})).toBe(true);
    expect(isObject([])).toBe(true);
  });

  it('is false for null, primitives and functions', () => {
    expect.hasAssertions();
    expect(isObject(null)).toBe(false);
    expect(isObject(undefined)).toBe(false);
    expect(isObject('text')).toBe(false);
    expect(isObject(1)).toBe(false);
    expect(isObject(() => undefined)).toBe(false);
  });
});

describe('form path get in', () => {
  const values = { a: { b: [{ c: 'deep' }] }, empty: null, zero: 0 };

  it('reads dotted and bracketed paths', () => {
    expect.hasAssertions();
    expect(getIn(values, 'a.b[0].c')).toBe('deep');
    expect(getIn(values, 'a.b.0.c')).toBe('deep');
    expect(getIn(values, ['a', 'b', '0', 'c'])).toBe('deep');
  });

  it('returns the default when the path is missing', () => {
    expect.hasAssertions();
    expect(getIn(values, 'a.missing.c', 'fallback')).toBe('fallback');
    expect(getIn(values, 'a.missing.c')).toBeUndefined();
    expect(getIn(undefined, 'a', 'fallback')).toBe('fallback');
  });

  it('returns falsy leaf values instead of the default', () => {
    expect.hasAssertions();
    expect(getIn(values, 'zero', 'fallback')).toBe(0);
    expect(getIn(values, 'empty', 'fallback')).toBeNull();
  });

  it('returns the default when a path runs through a falsy value', () => {
    expect.hasAssertions();
    expect(getIn(values, 'empty.x', 'fallback')).toBe('fallback');
  });
});

describe('form path set in', () => {
  it('sets a nested value without mutating the source', () => {
    expect.hasAssertions();

    const source = { a: { b: 1, keep: true } };
    const result = setIn(source, 'a.b', 2);

    expect(result).toStrictEqual({ a: { b: 2, keep: true } });
    expect(source).toStrictEqual({ a: { b: 1, keep: true } });
    expect(result.a).not.toBe(source.a);
  });

  it('creates missing objects and arrays along the path', () => {
    expect.hasAssertions();
    expect(setIn({}, 'a.b', 'x')).toStrictEqual({ a: { b: 'x' } });

    const expectedList: ({ name: string } | undefined)[] = [];
    expectedList.length = 2;
    expectedList[1] = { name: 'x' };

    expect(setIn({}, 'list[1].name', 'x')).toStrictEqual({
      list: expectedList,
    });
  });

  it('returns the original object when the value is unchanged', () => {
    expect.hasAssertions();

    const source = { a: { b: 1 } };

    expect(setIn(source, 'a.b', 1)).toBe(source);
  });

  it('deletes the key when the value is undefined', () => {
    expect.hasAssertions();
    expect(setIn({ a: { b: 1, c: 2 } }, 'a.b', undefined)).toStrictEqual({
      a: { c: 2 },
    });
    expect(setIn({ a: 1, b: 2 }, 'a', undefined)).toStrictEqual({ b: 2 });
  });
});
