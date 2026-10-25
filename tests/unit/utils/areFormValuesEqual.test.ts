import { describe, expect, it } from 'vitest';

import { areFormValuesEqual } from '@/utils/areFormValuesEqual';

describe(areFormValuesEqual, () => {
  it('compares primitive, null and undefined values', () => {
    expect.assertions(1);
    expect(areFormValuesEqual('same', 'same')).toBe(true);
  });
});

describe(areFormValuesEqual, () => {
  it('compares primitive, null and undefined values', () => {
    expect.assertions(1);
    expect(areFormValuesEqual('same', 'different')).toBe(false);
  });
});

describe(areFormValuesEqual, () => {
  it('compares primitive, null and undefined values', () => {
    expect.assertions(1);
    expect(areFormValuesEqual(null, null)).toBe(true);
  });
});

describe(areFormValuesEqual, () => {
  it('compares primitive, null and undefined values', () => {
    expect.assertions(1);
    expect(areFormValuesEqual(null, undefined)).toBe(false);
  });
});

describe(areFormValuesEqual, () => {
  it('compares primitive, null and undefined values', () => {
    expect.assertions(1);
    expect(areFormValuesEqual(undefined, undefined)).toBe(true);
  });
});
