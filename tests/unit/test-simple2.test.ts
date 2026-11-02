import { describe, it, expect } from 'vitest';

describe('simple test', () => {
  it('works', () => {
    expect.hasAssertions();

    expect(1 + 1).toBe(2);
  });
});
