import { afterEach, describe, expect, it, vi } from 'vitest';
import { removeSupplementaryPlaneCharacters } from '@/utils/removeSupplementaryPlaneCharacters';

describe(removeSupplementaryPlaneCharacters, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('preserves BMP characters and removes supplementary-plane characters', () => {
    expect(removeSupplementaryPlaneCharacters('NMI 😀 portal')).toBe(
      'NMI  portal'
    );
  });

  it('preserves a character when codePointAt unexpectedly returns undefined', () => {
    vi.spyOn(String.prototype, 'codePointAt').mockReturnValue(undefined);

    expect(removeSupplementaryPlaneCharacters('A')).toBe('A');
  });
});
