import { getIn as formikGetIn, setIn as formikSetIn } from 'formik';

/** True for non-null objects, including arrays. Functions are not objects here. */
export const isObject = (value: unknown): value is object =>
  value !== null && typeof value === 'object';

/** Reads a nested value by dotted/bracketed path, returning `fallback` when absent. */
export function getIn(
  source: unknown,
  path: string | string[],
  fallback?: unknown
): any {
  return formikGetIn(source, path, fallback);
}

/**
 * Immutably sets a nested value by path, copying only the objects along it.
 * Returns the original object when the value is unchanged and removes the key
 * when `value` is undefined.
 */
export function setIn<T extends object>(
  source: T,
  path: string,
  value: unknown
): T {
  return formikSetIn(source, path, value);
}
