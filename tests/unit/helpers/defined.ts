/**
 * Narrows an indexed or destructured value that `noUncheckedIndexedAccess` types as possibly
 * undefined, or a DOM query result (`querySelector`, `closest`) typed as possibly null. Throwing
 * here fails the test at the point the fixture or markup was wrong, rather than later inside the
 * code under test.
 */
export const defined = <T>(value: T | null | undefined, what = 'value'): T => {
  if (value === undefined || value === null) {
    throw new Error(`Expected ${what} to be defined`);
  }

  return value;
};
