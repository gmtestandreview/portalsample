import { describe, expect, it } from 'vitest';

import { getIn, isObject, setIn } from '@/components/forms/formPath';

describe(isObject, () => {
  it('is true for plain objects and arrays', () => {
    expect.assertions(2);
    expect(isObject({})).toBe(true);
    expect(isObject([])).toBe(true);
  });
});
