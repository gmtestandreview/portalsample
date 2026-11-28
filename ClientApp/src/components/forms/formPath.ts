/** True for non-null objects, including arrays. Functions are not objects here. */
export const isObject = (value: unknown): value is object =>
  value !== null && typeof value === 'object';

// Path tokens, tried in this order at each position (sticky, so each one only
// matches exactly where the scan currently is).
const PLAIN_KEY = /[^.[\]]+/y;
const INDEX_KEY = /\[(-?\d+\.\d+|-?\d+)\]/y;
const QUOTED_KEY = /\[(["'])((?:(?!\1)[^\\]|\\.)*?)\1\]/y;
// An empty key sits before a `.` or `[]` that is followed by another separator
// or the end of the path (`a..b`, `a[]`).
const EMPTY_KEY = /(?=(?:\.|\[\])(?:\.|\[\]|$))/y;
const ESCAPED_CHARACTER = /\\(\\)?/g;

const matchAt = (pattern: RegExp, path: string, from: number) => {
  pattern.lastIndex = from;
  return pattern.exec(path);
};

/**
 * Splits a dotted/bracketed path into its keys: `a.b[0].c` and `a.b.0.c` both
 * give `['a', 'b', '0', 'c']`. Quoted bracket keys (`a["b.c"]`) stay whole.
 */
const toPath = (path: string | string[]): string[] => {
  if (Array.isArray(path)) {
    return path;
  }

  const keys: string[] = path.startsWith('.') ? [''] : [];
  let position = 0;

  while (position <= path.length) {
    const plain = matchAt(PLAIN_KEY, path, position);
    const index = plain ? null : matchAt(INDEX_KEY, path, position);
    const quoted =
      (plain ?? index) ? null : matchAt(QUOTED_KEY, path, position);
    const token = plain ?? index ?? quoted;

    if (token) {
      keys.push(
        quoted
          ? String(quoted[2]).replaceAll(ESCAPED_CHARACTER, '$1')
          : (token[1] ?? token[0]),
      );
      position += token[0].length;
      continue;
    }

    if (matchAt(EMPTY_KEY, path, position)) {
      keys.push('');
    }
    position += 1;
  }

  return keys;
};

type PathContainer = Record<string, unknown>;

const isArrayIndex = (key: string): boolean =>
  String(Math.floor(Number(key))) === key && Number(key) >= 0;

/**
 * Shallow copy that keeps the prototype of the container being copied. Only
 * plain objects, class instances and arrays are supported; Date and Map
 * containers are not copied faithfully.
 */
const shallowClone = (value: object): PathContainer =>
  Array.isArray(value)
    ? ([...(value as unknown[])] as unknown as PathContainer)
    : (Object.assign(
        Object.create(Object.getPrototypeOf(value) as object | null) as object,
        value,
      ) as PathContainer);

const keyAt = (keys: string[], index: number): string => String(keys.at(index));

const readKey = (container: unknown, key: string): unknown =>
  Reflect.get(Object(container) as PathContainer, key);

/** Reads a nested value by dotted/bracketed path, returning `fallback` when absent. */
export function getIn(
  source: unknown,
  path: string | string[],
  fallback?: unknown,
): any {
  const keys = toPath(path);
  let current = source;
  let position = 0;

  while (current && position < keys.length) {
    current = readKey(current, keyAt(keys, position));
    position += 1;
  }

  // The path stopped early on a falsy value: the leaf was never reached.
  if (position !== keys.length && !current) {
    return fallback;
  }

  return current === undefined ? fallback : current;
}

const childContainer = (existing: unknown, nextKey: string): PathContainer => {
  if (isObject(existing)) {
    return shallowClone(existing);
  }

  return (isArrayIndex(nextKey) ? [] : {}) as PathContainer;
};

/**
 * Immutably sets a nested value by path, copying only the objects along it.
 * Returns the original object when the value is unchanged and removes the key
 * when `value` is undefined.
 */
export function setIn<T extends object>(
  source: T,
  path: string,
  value: unknown,
): T {
  const result = shallowClone(source);
  const keys = toPath(path);
  let cursor = result;
  let position = 0;

  for (; position < keys.length - 1; position++) {
    const next = childContainer(
      getIn(source, keys.slice(0, position + 1)),
      keyAt(keys, position + 1),
    );

    Reflect.set(cursor, keyAt(keys, position), next);
    cursor = next;
  }

  const leaf = keyAt(keys, position);

  // Unchanged value: hand back the original so callers can skip a re-render.
  if (readKey(position === 0 ? source : cursor, leaf) === value) {
    return source;
  }

  if (value === undefined) {
    // A single-key path never entered the loop, so `cursor` is `result`.
    Reflect.deleteProperty(cursor, leaf);
  } else {
    Reflect.set(cursor, leaf, value);
  }

  return result as T;
}
