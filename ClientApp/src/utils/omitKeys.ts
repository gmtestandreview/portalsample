/**
 * Returns a shallow copy of `source` without the named keys.
 *
 * Use it instead of a rest-sibling destructure with an unused binding when a prop or fixture
 * field must be excluded from an object that is spread or passed on. The input is never
 * mutated, absent keys are ignored, and all other own properties (including ones whose value is
 * `undefined`) are preserved.
 */
export const omitKeys = <T extends object, K extends keyof T>(
  source: T,
  ...keys: readonly K[]
): Omit<T, K> => {
  const copy: Omit<T, K> = { ...source };
  for (const key of keys) {
    Reflect.deleteProperty(copy, key);
  }
  return copy;
};
