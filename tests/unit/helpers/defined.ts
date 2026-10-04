/**
 * Narrows an indexed or destructured value that `noUncheckedIndexedAccess` types as possibly
 * undefined. Throwing here fails the test at the point the fixture was wrong, rather than later
 * inside the code under test.
 */
export const defined = <T>(value: T | undefined, what = 'value'): T => {
  if (value === undefined) {
    throw new Error(`Expected ${what} to be defined`);
  }

  return value;
};
