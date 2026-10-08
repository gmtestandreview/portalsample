import { clone, toPath } from 'lodash';

/** True for non-null objects, including arrays. Functions are not objects here. */
export const isObject = (value: unknown): value is object =>
  value !== null && typeof value === 'object';

const isArrayIndex = (key: string): boolean =>
  String(Math.floor(Number(key))) === key && Number(key) >= 0;

/** Reads a nested value by dotted/bracketed path, returning `fallback` when absent. */
export function getIn(
  source: unknown,
  path: string | string[],
  fallback?: unknown
): any {
  const segments = toPath(path);
  let current: any = source;
  let index = 0;

  while (current && index < segments.length) {
    current = current[segments[index++] as string];
  }

  if (index !== segments.length && !current) {
    return fallback;
  }

  return current === undefined ? fallback : current;
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
  const result: any = clone(source);
  const segments = toPath(path);
  let target: any = result;
  let index = 0;

  for (; index < segments.length - 1; index++) {
    const segment = segments[index] as string;
    const existing = getIn(source, segments.slice(0, index + 1));

    if (isObject(existing)) {
      target = target[segment] = clone(existing);
    } else {
      const next = segments[index + 1] as string;
      target = target[segment] = isArrayIndex(next) ? [] : {};
    }
  }

  const leaf = segments[index] as string;

  if ((index === 0 ? source : target)[leaf as keyof typeof source] === value) {
    return source;
  }

  if (value === undefined) {
    delete target[leaf];
  } else {
    target[leaf] = value;
  }

  return result;
}
