import { describe, expect, it, vi } from 'vitest';
import { removeSupplementaryPlaneCharacters } from '@/utils/removeSupplementaryPlaneCharacters';

// eslint-disable-next-line vitest/valid-title -- function suite titles are required by vitest/prefer-describe-function-title.
describe(removeSupplementaryPlaneCharacters, () => {
  it('preserves BMP characters and removes supplementary-plane characters', () => {
    expect.hasAssertions();

    expect(removeSupplementaryPlaneCharacters('NMI 😀 portal')).toBe(
      'NMI  portal',
    );
  });

  it('preserves a character when codePointAt unexpectedly returns undefined', () => {
    expect.hasAssertions();

    vi.spyOn(String.prototype, 'codePointAt').mockReturnValue(undefined);

    expect(removeSupplementaryPlaneCharacters('A')).toBe('A');

    vi.restoreAllMocks();
  });
});
