import braces from 'braces';
import { describe, expect, it } from 'vitest';

function nestedPattern(depth: number) {
  return `${'{'.repeat(depth)}a,b${'}'.repeat(depth)}`;
}

describe('braces depth guard', () => {
  it('accepts patterns at the supported nesting limit', () => {
    expect(() => braces(nestedPattern(100))).not.toThrow();
  });

  it('rejects patterns beyond the supported nesting limit', () => {
    expect(() => braces(nestedPattern(101))).toThrow(/exceeds max depth/);
  });
});
