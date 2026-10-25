import { describe, it, expect } from 'vitest';

describe('simple test', () => {
  it('works', () => {
    expect.assertions(1);
    expect(1 + 1).toBe(2);
  });
});
