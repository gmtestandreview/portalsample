import { describe, expect, it } from 'vitest';
import { omitKeys } from '../../../ClientApp/src/utils/omitKeys';

// function suite titles are required by vitest/prefer-describe-function-title.
describe(omitKeys, () => {
  it('removes a single key', () => {
    expect.hasAssertions();

    const input = { a: 1, b: 'two', c: true };

    const result = omitKeys(input, 'b');

    expect(result).toStrictEqual({ a: 1, c: true });
    expect(Object.hasOwn(result, 'b')).toBe(false);
  });

  it('removes several keys', () => {
    expect.hasAssertions();

    const input = { a: 1, b: 'two', c: true };

    const result = omitKeys(input, 'a', 'c');

    expect(result).toStrictEqual({ b: 'two' });
  });

  it('is a no-op for a key that is already absent', () => {
    expect.hasAssertions();

    const input: { a: number; b?: string } = { a: 1 };

    const result = omitKeys(input, 'b');

    expect(result).toStrictEqual({ a: 1 });
  });

  it('does not mutate the source', () => {
    expect.hasAssertions();

    const input = { a: 1, b: 2 };

    const result = omitKeys(input, 'a');

    expect(input).toStrictEqual({ a: 1, b: 2 });
    expect(result).not.toBe(input);
  });

  it('preserves other keys whose value is undefined', () => {
    expect.hasAssertions();

    const input = { a: 1, keep: undefined, drop: 'x' };

    const result = omitKeys(input, 'drop');

    expect(Object.hasOwn(result, 'keep')).toBe(true);
    expect(result).toStrictEqual({ a: 1, keep: undefined });
  });
});
