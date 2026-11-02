export const removeSupplementaryPlaneCharacters = (value: string): string =>
  Array.from(value)
    .filter((character) => (character.codePointAt(0) ?? 0) <= 0xffff)
    .join('');
