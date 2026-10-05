type WithoutUndefined<T extends object> = {
  [K in keyof T]?: Exclude<T[K], undefined>;
};

const isPlainObject = (value: object): boolean => {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

/**
 * Drops own enumerable properties whose value is `undefined` from a plain object.
 *
 * With `exactOptionalPropertyTypes`, an optional property means "absent", not "present and
 * undefined". View-model shapes that read from optional chains carry explicit `undefined`s, and
 * this is where they are converted to the absent-key shape the generated DTOs require.
 *
 * The operation is shallow, preserves falsy values and enumerable symbol keys, and never mutates
 * the input. Arrays and class instances are rejected because the result is a plain object rather
 * than a value with the input's prototype or array semantics.
 */
export const omitUndefined = <T extends object>(
  value: T
): WithoutUndefined<T> => {
  if (!isPlainObject(value)) {
    throw new TypeError('omitUndefined accepts plain objects only');
  }

  const definedEntries = Reflect.ownKeys(value)
    .filter((key) => Object.prototype.propertyIsEnumerable.call(value, key))
    .map((key): [PropertyKey, unknown] => [key, Reflect.get(value, key)])
    .filter(([, entry]) => entry !== undefined);

  // TypeScript cannot express enumerable own-key filtering for a generic object type.
  return Object.fromEntries(definedEntries) as WithoutUndefined<T>;
};
