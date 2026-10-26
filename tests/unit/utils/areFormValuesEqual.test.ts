import { describe, expect, it } from 'vitest';
import { areFormValuesEqual } from '@/utils/areFormValuesEqual';

describe(areFormValuesEqual, () => {
  it('compares primitive, null and undefined values', () => {
    expect.hasAssertions();

    expect([
      areFormValuesEqual('same', 'same'),
      areFormValuesEqual('same', 'different'),
      areFormValuesEqual(null, null),
      areFormValuesEqual(null, undefined),
      areFormValuesEqual(undefined, undefined),
      areFormValuesEqual(-0, 0),
      areFormValuesEqual(Number.NaN, Number.NaN),
    ]).toStrictEqual([true, false, true, false, true, true, true]);
  });

  it('compares nested plain objects without depending on key order', () => {
    expect.hasAssertions();

    expect(
      areFormValuesEqual(
        { first: 'one', nested: { second: 2, third: true } },
        { nested: { third: true, second: 2 }, first: 'one' },
      ),
    ).toBe(true);
    expect(
      areFormValuesEqual({ nested: { second: 2 } }, { nested: { second: 3 } }),
    ).toBe(false);
  });

  it('compares arrays in order', () => {
    expect.hasAssertions();

    expect(areFormValuesEqual([1, { name: 'one' }], [1, { name: 'one' }])).toBe(
      true,
    );
    expect(areFormValuesEqual([1, 2], [2, 1])).toBe(false);
  });

  it('compares Date values by their timestamp', () => {
    expect.hasAssertions();

    expect(
      areFormValuesEqual(new Date('2026-01-01'), new Date('2026-01-01')),
    ).toBe(true);
    expect(
      areFormValuesEqual(new Date('2026-01-01'), new Date('2026-01-02')),
    ).toBe(false);
    expect(areFormValuesEqual(new Date('invalid'), new Date('invalid'))).toBe(
      true,
    );
  });

  it('does not equate a Date with a non-Date value', () => {
    expect.hasAssertions();

    expect(areFormValuesEqual(new Date('2026-01-01'), '2026-01-01')).toBe(
      false,
    );
    expect(areFormValuesEqual('2026-01-01', new Date('2026-01-01'))).toBe(
      false,
    );
  });

  it('does not treat different value types as equal', () => {
    expect.hasAssertions();

    expect(areFormValuesEqual(1, '1')).toBe(false);
    expect(areFormValuesEqual([], {})).toBe(false);
  });

  it('does not treat objects with a non-plain prototype as equal', () => {
    expect.hasAssertions();

    class Point {
      constructor(public readonly x: number) {}
    }

    expect(areFormValuesEqual(new Point(1), { x: 1 })).toBe(false);
    expect(areFormValuesEqual(new Point(1), new Point(1))).toBe(false);
  });
});
